import React, { useRef, useState, useEffect, useCallback } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { change } from 'redux-form'
import { EDIT_PROJECT_FORM } from '../../constants'
import { useDispatch, useSelector } from 'react-redux'
import './styles.scss'
import { fieldCommentsSelector } from '../../selectors/commentSelector'
import Comment from '../shoutbox/comments/Comment.jsx'
import { userIdSelector } from '../../selectors/authSelector'
import {
  editFieldComment,
  deleteFieldComment,
  createFieldComment
} from '../../actions/commentActions'
import {
  formErrorList
} from '../../actions/projectActions'
import { currentProjectIdSelector,savingSelector,lockedSelector, lastModifiedSelector, pollSelector,lastSavedSelector, projectNetworkSelector, formErrorListSelector, connectionErrorFieldsSelector, fieldsWithAnyErrorSelector, testingConnectionSelector } from '../../selectors/projectSelector'
import CommentIcon from '@/assets/icons/comment-icon.svg?react'
import { useTranslation } from 'react-i18next'
import RollingInfo from '../input/RollingInfo.jsx'
import NetworkErrorState from '../input/NetworkErrorState.jsx'
import { useIsMount } from '../../hooks/IsMounted'
import { useFieldPassivation } from '../../hooks/useFieldPassivation'
import { isEqual } from 'lodash'
import { getFocusableElements } from '../project/projectModalUtils.js';


/* This component defines a react-quill rich text editor field to be used in redux form.
 * We are saving these rich text inputs as quill deltas - a form of JSON that
 * defines each part of the text, e.g.
 * ops: Array(3)
 * 0: {insert: "User-written text"}
 * 1: { attributes: {color: "#e60000"}, insert: " that now became red"}
 * 2: { attributes: {color: "#b26b00", underline: true}, insert: ", then became brown and underlined"}
 *
 * Quill rich text editor can't be a fully controlled component, as from the docs:
 * https://github.com/zenoamaro/react-quill
 *
 * "Because Quill handles its own changes, and does not allow preventing edits, ReactQuill has to settle for
 * a hybrid between controlled and uncontrolled mode. It can't prevent the change, but will still override
 * the content whenever value differs from current state."
 *
 * Thus this component uses the value from backend as initial value, then updates redux form whenever
 * quill's own input value changes - but no longer updates from redux form changes.
 * Do not set the value to input.value - it will make the component lose focus after every letter
 * */

const formats = [
  'bold',
  'italic',
  'underline',
  'strike',
  'color',
  'background',
  'list', 
  'ordered',
  'bullet',
  'script',
  'sub',
  'super'
]

function RichTextEditor(props) {
  const {
    input: { value, ...inputProps },
    fieldData: { required, name },
    largeField,
    disabled,
    meta,
    placeholder,
    onBlur,
    onFocus,
    checkLocked,
    className,
    updated,
    formName,
    setRef,
    lockField,
    fieldSetDisabled,
    insideFieldset,
    nonEditable, 
    rollingInfo, 
    modifyText, 
    rollingInfoText,
    isFloorAreaForm,
    floorValue,
    attributeData,
    phaseIsClosed,
    fieldDisabled,
    checking
  } = props

  const dispatch = useDispatch()

  const isMount = useIsMount();

  const saving =  useSelector(state => savingSelector(state))
  const lastModified = useSelector(state => lastModifiedSelector(state))
  const lockedStatus = useSelector(state => lockedSelector(state))
  const fieldComments = useSelector(fieldCommentsSelector)
  const userId = useSelector(userIdSelector)
  const projectId = useSelector(currentProjectIdSelector)
  const connection = useSelector(state => pollSelector(state))
  const lastSaved = useSelector(state => lastSavedSelector(state))
  const network = useSelector(projectNetworkSelector)
  const formErrors = useSelector(formErrorListSelector) || []
  const connectionErrorFields = useSelector(connectionErrorFieldsSelector) || []
  const fieldsWithAnyError = useSelector(fieldsWithAnyErrorSelector) || []
  const testingConnection = useSelector(testingConnectionSelector)

  const [showComments, setShowComments] = useState(false)
  const [toolbarVisible, setToolbarVisible] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [currentTimeout, setCurrentTimeout] = useState(0)
  const [readonly, setReadonly] = useState(false)
  const [valueIsSet, setValueIsSet] = useState(false)
  const [valueIsEmpty,setValueIsEmpty] = useState(false)
  const [charLimitOver,setCharLimitOver] = useState(false)
  const [maxSizeOver, setMaxSizeOver] = useState(false)
  const [editField,setEditField] = useState(false)
  const [hadFocusBeforeTabOut, setHadFocusBeforeTabOut] = useState(false)
  const [errorJustCleared, setErrorJustCleared] = useState(false)

  const editorRef = useRef("")
  const wrapperRef = useRef(null)
  const skipRedirectRef = useRef(false)
  const tabbedRecentlyRef = useRef(false)
  const counter = useRef(props.currentSize)
  const showCounter = useRef(false)
  const wasInErrorList = useRef(false)
  const wasInAnyErrorList = useRef(false)
  const prevNetworkStatus = useRef(network?.status || 'ok')
  const prevLastSavedStatus = useRef(lastSaved?.status || '')
  
  // Check if other fields have validation errors OR connection errors (UX60.2.5 - passivate fields when error exists)
  const shouldDisableForErrors = useFieldPassivation(inputProps.name, { formName: meta.form })
  
  // Check if THIS field is the one that failed to save due to network error
  const isThisFieldNetworkError = lastSaved?.status === 'error' && lastSaved?.fields?.includes(inputProps.name)

  //Stringify the object for useEffect update check so it can be compared correctly
  //Normal object always different
  const lockedStatusJsonString = JSON.stringify(lockedStatus);

  const inputValue = useRef('')
  const fieldFormName = formName || EDIT_PROJECT_FORM

  const getFieldComments = () => {
    const fieldName = inputProps.name
    const lastIndex = fieldName?.lastIndexOf('.')

    if (lastIndex === -1) {
      return fieldComments[fieldName]
    } else {
      const currentFieldName = fieldName.substring(lastIndex + 1, fieldName.length)
      return fieldComments[currentFieldName]
    }
  }

  const comments = getFieldComments()

  const { t } = useTranslation()

  const oldValueRef = useRef('');


  // Track tab presses to differenciate between kb navigation and clicks
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Tab') {
        tabbedRecentlyRef.current = true;
        setTimeout(() => { tabbedRecentlyRef.current = false; }, 0);
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, []);

  useEffect(() => {
    if(isFloorAreaForm){
      //Set value for floor area richtext
      setValue(floorValue[inputProps.name])
    }
    else{
      oldValueRef.current = value;
      inputValue.current = value;
    }
    if (setRef) {
      setRef({ name: inputProps.name, ref: editorRef })
    }
    localStorage.setItem("previousElement", false);
    localStorage.setItem("previousElementId", "");
    document.addEventListener("click", checkClickedElement);
    return () => {
      document.removeEventListener("click", checkClickedElement);
      localStorage.removeItem("previousElement");
      localStorage.removeItem("previousElementId");
    };
  }, [])

  useEffect(() => {
    if(isFloorAreaForm && floorValue && floorValue[inputProps.name] !== oldValueRef.current){
      //Update value for floor area richtext on reopen modal
      setValue(floorValue[inputProps.name])
      oldValueRef.current = floorValue[inputProps.name];
      inputValue.current = floorValue[inputProps.name];
    }
  }, [JSON.stringify(floorValue)])

  useEffect(() => {
    if(lastSaved?.status === "error" && editorRef.current){
      //Unable to lock fields and connection backend not working so prevent editing
      editorRef.current.editor.blur()
    }
  }, [lastSaved?.status === "error"])

  useEffect(() => {
    if (readonly && !saving) {
      setShowComments(false)
    }
  }, [readonly])

  useEffect(() => {
    //Remove tab press inside editor so navigating with tab stays normal.
    const removeTabBinding = () => {
      if (editorRef.current === "") {
        return;
      }
      const keyboard = editorRef?.current?.getEditor()?.getModule('keyboard');
      // In Quill 2.x, bindings use named keys like 'tab' instead of keyCode numbers
      if (keyboard?.bindings?.['tab']) {
        delete keyboard.bindings['tab'];
      }
      // Also try legacy keyCode 9 for older Quill versions
      if (keyboard?.bindings?.[9]) {
        delete keyboard.bindings[9];
      }
    };

    removeTabBinding();
  }, [editorRef, editField])
  
  useEffect(() => {
    if(!isMount){
      //!ismount skips initial render
      // Sync charLimitOver with maxSizeOver when field is NOT focused
      // This prevents showing error notification while user is still typing/pasting

      if (!isFocused){
        setCharLimitOver(maxSizeOver);
      }
      
      // Update error list immediately when character limit exceeded or recovered (for field passivation)
      // This passivates other fields while keeping this field editable so user can fix the error
      dispatch(formErrorList(maxSizeOver, inputProps.name));
    }
    
    // NOTE: No cleanup function to remove from error list on unmount
    // Character limit errors must persist across page navigation within same phase
  }, [charLimitOver, valueIsEmpty, isFocused, maxSizeOver])

  // Handle error list for rolling info fields (when field is closed but has errors)
  useEffect(() => {
    if (!isMount && rollingInfo && !editField) {
      // When rolling info field is closed and has errors (maxSizeOver or network error)
      const hasError = maxSizeOver || hasActiveNetworkError();
      dispatch(formErrorList(hasError, inputProps.name));
    }
  }, [rollingInfo, editField, maxSizeOver, isMount]);

  // Reset charLimitOver when user fixes the character count issue
  useEffect(() => {
    const maxSize = props.maxSize || 20000;
    if (charLimitOver && counter.current <= maxSize) {
      setCharLimitOver(false);
    }
  }, [charLimitOver, counter.current, props.maxSize]);

  // Track network status changes for recovery logic
  useEffect(() => {
    prevNetworkStatus.current = network?.status || 'ok';
    prevLastSavedStatus.current = lastSaved?.status || '';
  }, [network?.status, lastSaved?.status, maxSizeOver, inputProps.name]);

  const hasActiveNetworkError = () => {
    const networkError = network?.status === 'error';
    const saveError = lastSaved?.status === 'error' || lastSaved?.status === 'field_error';
    return networkError || saveError;
  };

  const isJustRecoveredFromError = (prevStatus, currentStatus) => {
    return (prevStatus === 'error' || prevStatus === 'connection_restored') && 
           (currentStatus === 'success' || 
            currentStatus === 'connection_restored' || 
            currentStatus === '' || 
            !currentStatus);
  };

  const updateEditorContent = (editor, newValue) => {
    editor.setContents(newValue);
    counter.current = editor.getLength() - 1;
    
    const maxSize = props.maxSize || 20000;
    setCharLimitOver(counter.current > maxSize);
  };

  const shouldUpdateEditorContent = (editor, value, errorWasJustCleared) => {
    const currentContents = editor.getContents();
    const currentLength = editor.getLength() - 1;
    
    const contentChanged = !isEqual(currentContents, value);
    const lengthMismatch = Math.abs(currentLength - counter.current) > 5;
    
    return (contentChanged && lengthMismatch) || errorWasJustCleared;
  };

  const handleErrorRecovery = (editor, value) => {
    const currentEditorContent = editor.getText();
    const reduxValue = value?.ops?.[0]?.insert || '';
    const editorEmpty = !currentEditorContent || currentEditorContent.trim().length <= 1;
    const reduxEmpty = !reduxValue || reduxValue.trim().length === 0;

    // Only update editor if it's empty but Redux has content (edge case: editor cleared during error)
    // Do NOT overwrite editor with Redux value — editor already has the correct saved content
    if (editorEmpty && !reduxEmpty) {
      updateEditorContent(editor, value);
    }
    prevLastSavedStatus.current = lastSaved?.status || '';
    counter.current = editor.getLength() - 1;
  };

  // Force Quill to update when Redux Form value changes externally
  // This handles cases like user closing error notification which reverts the field
  useEffect(() => {
    prevNetworkStatus.current = network?.status || 'ok';
    wasInAnyErrorList.current = fieldsWithAnyError.includes(inputProps.name);

    if (lastModified === inputProps.name && saving) {
      return;
    }

    const wasJustCleared = wasInErrorList.current && !formErrors.includes(inputProps.name);
    if (wasJustCleared) {
      setErrorJustCleared(true);
    }
    wasInErrorList.current = formErrors.includes(inputProps.name);

    if (maxSizeOver || !editorRef.current || !value || isFocused) {
      return;
    }

    const editor = editorRef.current.getEditor();
    if (!editor) {
      return;
    }

    if (hasActiveNetworkError()) {
      counter.current = editor.getLength() - 1;
      return;
    }

    if (isJustRecoveredFromError(prevLastSavedStatus.current, lastSaved?.status)) {
      handleErrorRecovery(editor, value);
      return;
    }

    if (shouldUpdateEditorContent(editor, value, errorJustCleared)) {
      updateEditorContent(editor, value);
      if (errorJustCleared) {
        setErrorJustCleared(false);
      }
    }

    prevLastSavedStatus.current = lastSaved?.status || '';
  }, [value, isFocused, formErrors, errorJustCleared, network?.status, connectionErrorFields, lastSaved?.status, maxSizeOver, saving, lastModified]);

  useEffect(() => {
    // Checks on page load and on value change if the input value character count exceeds maxSize
    const maxSize = props.maxSize || 20000;
    if (value?.ops) {
      let valueCount = 0;
      // In some occasions value.ops returns array that has multiple objects
      if (value.ops.length > 1) {
        // in that case we need loop trought them and check length of each objects insert and add them up
        for (let arr of value.ops) {
          valueCount += arr.insert.length
        }
        valueCount = valueCount - 1
      } else {
        // otherwise we can just check the length of the value objects insert
        valueCount = value.ops[0].insert.length - 1
      }
      // maxSizeOver true shows the max-chars-error
      const wasOver = maxSizeOver;
      const nowOver = valueCount > maxSize;
      
      // CRITICAL: Don't reset maxSizeOver to false from backend value
      // If maxSizeOver is true (user has error), keep it true until user fixes it in handleChange
      // This prevents error state from being cleared when navigating between phases
      if (nowOver && !wasOver) {
        setMaxSizeOver(true);
      } else if (wasOver && !nowOver) {
        // Don't call setMaxSizeOver(false) here - let handleChange do it when user actually fixes the content
      }
    }
  }, [value])

  useEffect(() => {
    if (props.isTabActive){
      if (!saving && hadFocusBeforeTabOut) {
        if (rollingInfo){
          editRollingField();
        } else {
          editorRef?.current?.editor.focus();
        }
        setHadFocusBeforeTabOut(false);
      }
    }
    else if (toolbarVisible){
      setHadFocusBeforeTabOut(true);
      editorRef?.current?.editor.blur();
    }
  }, [props.isTabActive, saving])

  useEffect(() => {
    
    const getIdentifier =() => {
      // Fieldset fields have different type of identifier
      return lockedStatus.lockData.attribute_lock.fieldset_attribute_identifier
      ? lockedStatus.lockData.attribute_lock.field_identifier
      : lockedStatus.lockData.attribute_lock.attribute_identifier;
    }

    const updateFieldAccess = (isLocked, identifier) => {
      const isOwner = lockedStatus?.lockData.attribute_lock.owner
      const isSaving = lockedStatus?.saving
      const fieldData = lockedStatus?.lockData.attribute_lock.field_data

      const shouldBeReadOnly = !isLocked || !isOwner || (lastModified === inputProps.name && isSaving)
      setReadonly(shouldBeReadOnly)

      if (!shouldBeReadOnly) {
        // if the field is not locked, set the value from the lock data
        // BUT skip if we just saved successfully or connection was restored - editor already has the correct content
        // and fieldData is the old pre-edit value from when the lock was acquired
        const skipSetValue = lastSaved?.status === 'success' || lastSaved?.status === 'connection_restored';
        if (!skipSetValue) {
          setValue(fieldData)
        }
      }

      if (!shouldBeReadOnly || isLocked && !isOwner) {
        // Enhance user experience by auto-focusing
        const fieldToFocus = document.getElementById(`${toolbarName}input`)?.querySelector("p");
        fieldToFocus?.focus();
        setTimeout(() => fieldToFocus?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
      }

      // Apply custom lock field styling if applicable
      if (typeof lockField === 'function') {
        lockField(lockedStatus, isOwner, identifier);
      }
    }

    const updateFieldsetFieldAccess = (isLocked, identifier) => {
      const lockData = lockedStatus.lockData.attribute_lock;
      const isOwner = lockData.owner;
      if (isLocked) {
        const field = inputProps.name.split('.')[1]
        const fieldData = field ? lockData?.field_data?.[field] : undefined;
        setValue(fieldData)
      }
      lockField(lockedStatus, isOwner, identifier);
      setReadonly(false);
    }

    // Check if the field is locked and if the lock data is available
    if (lockedStatus && Object.keys(lockedStatus).length > 0) {
      if (lockedStatus.lock === false) {
        if (insideFieldset) {
          let identifier = getIdentifier()
          let name = inputProps.name?.split('.')[0];
          const isLocked = name === identifier
          updateFieldsetFieldAccess(isLocked, identifier);
        } else {
          let identifier = getIdentifier()
          const isLocked = inputProps.name === identifier
          updateFieldAccess(isLocked, identifier);
        }
      }
    }

  }, [lockedStatusJsonString, connection.connection, inputProps.name])



  const checkClickedElement = (e) => {
    let previousElement = localStorage.getItem("previousElement")
    let previousElementId = localStorage.getItem("previousElementId")
    let target = e.target.classList.length > 0 ? e.target.classList : e.target.parentNode.classList
    const form = e.target.form
    //Prevent usage outside of main project form
    if(target?.length > 0 && form?.id === "accordion-title"){
      //Lose focus and unclock if select button is clicked
      if(target.length > 0 && target.value.includes("Select-module") && previousElementId === editorRef?.current?.props?.id){
        localStorage.setItem("previousElement","Select-module");
        handleBlur(readonly)
        setToolbarVisible(false)
        showCounter.current = false;
      }
      else if(target.length > 0 && target.value.includes("ql-editor") && previousElement && previousElementId && previousElementId === editorRef?.current?.props?.id){
        oldValueRef.current = value;
        inputValue.current = value;
        let container = e.target.closest(".input-container").querySelector(".input-header .input-title")
        //Focus outside to header of the richtext editor first to confirm that editing will initiate correctly, 
        //richtext editor bugs if focusing staingth from select.
        container.focus()
        //Set editor focusable and editable.
        e.target.firstChild.tabIndex = 0
        editorRef.current.editor.enable(true)
        //Focus cursor, show toolbar and call focus event.
        editorRef.current.editor.focus()
        setToolbarVisible(true)
        handleFocus("api",true)

      }
    }
  } 

  const handleChange = useCallback((_val, _delta, source,readonly) => {
    if(!readonly){
      if (currentTimeout) {
        clearTimeout(currentTimeout)
        setCurrentTimeout(0)

      }
      if (source === 'user') {
        //set to false when user edited so save can happen
        setValueIsSet(false)

        /* Get the value from the editor - the delta provided to handlechange does not have complete state */
        const actualDeltaValue = editorRef.current.editor.getContents()

        // Hack to remove /n  values
        const actualDeltaText = editorRef.current.editor.getText().replaceAll('\n', '')

        setCurrentTimeout(() =>
          setTimeout(
            () =>
              dispatch(
                change(
                  fieldFormName,
                  inputProps.name,
                  actualDeltaText ? actualDeltaValue : ""
                )
              ),
            1
          ))

        counter.current = actualDeltaValue.length() - 1;
        showCounter.current = true;
        const editorEmpty = actualDeltaText.trim().length === 0
        setValueIsEmpty(editorEmpty)
        //maxsize from backend or default
        const maxSize = props.maxSize || 20000
        // Only update maxSizeOver to track if user has typed too much
        // But don't set charLimitOver here - let it be set on blur
        if(counter?.current <= maxSize){
          setMaxSizeOver(false)
        } else {
          setMaxSizeOver(true)
        }
      }
      else if(source === 'api'){
        //Value is updated with lock call so do not save it again
        setValueIsSet(true)
        showCounter.current = true;
      }
      inputValue.current = _val;
    }
  }, [inputProps.name, value, props.maxSize])

  const handleFocus = (event,source) => {
    // DO NOT sync editor content here - it causes user data loss when charLimitOver is true
    // The editor already contains the user's typed content, don't overwrite it with Redux Form value
    
    setIsFocused(true);
    if(source && event && source !== "silent"){
      if (typeof onFocus === 'function') {
        //Sent a call to lock field to backend
        if(!insideFieldset){
          onFocus(inputProps.name);
        }
        localStorage.setItem("previousElementId",editorRef.current.props.id);
      }
      if(network?.status === "error"){
        //Prevent focus and editing to field if not locked
        editorRef?.current?.editor.blur()
      }
      else{
        setToolbarVisible(true)
      }
    }
    
    const length = editorRef?.current?.getEditor().getLength();
    counter.current = length -1;
    showCounter.current = true;
  }

  const getOriginalData = (name,originalData) => {
    //Get fieldset name, index and field of fieldset
    const fieldsetName = name.split('[')[0];
    const fieldName = name.split('.')[1];
    const index = name.split('[').pop().split(']')[0];
    let data = originalData;
    if(attributeData[fieldsetName]?.[index]?.[fieldName]?.ops){
      data = attributeData[fieldsetName][index][fieldName]?.ops
    }
    return data
  }

  const handleBlur = (readonly) => {
    if (readonly) {
      return;
    }
    // Remove focus state and hide toolbar
    setIsFocused(false);
    setToolbarVisible(false);
    showCounter.current = false;
    
    let identifier;
    if(lockedStatus && Object.keys(lockedStatus).length > 0){
      if(lockedStatus.lockData.attribute_lock.fieldset_attribute_identifier){
        identifier = lockedStatus.lockData.attribute_lock.field_identifier;
      }
      else{
        identifier = lockedStatus.lockData.attribute_lock.attribute_identifier;
      }
    }
    //Check lockfield if component is used somewhere where locking is not used.
    if (typeof lockField === 'function' && !insideFieldset) {
      //Send identifier data to change styles from FormField.js
      lockField(false,false,identifier)
    }
    //Sent a call to unlock field to backend
    if (typeof props.handleUnlockField === 'function' && 
      lockedStatus?.lockData?.attribute_lock?.owner) {
      props.handleUnlockField(inputProps.name)
    }
    //User is clicking inside editor and we don't want data to be refeched from db each time but we want to save latest edited data when blurred
    let editor
    let editorEmpty
    if(editorRef.current && editorRef?.current !== ""){
      editor = editorRef?.current?.getEditor().getContents()
      editorEmpty = editorRef?.current?.getEditor().getText().trim().length === 0
    }

    let name = inputProps.name;
    let originalData = attributeData[name]?.ops
    if(insideFieldset && !nonEditable || !rollingInfo){
      originalData = getOriginalData(name,originalData)
    }

    // Check if current content is just placeholder text
    const placeholderOps = placeholder ? { ops: [{ insert: placeholder + '\n' }] } : null;
    const isOnlyPlaceholder = placeholderOps && isEqual(placeholderOps?.ops, editor?.ops);

    const dataChanged = !isEqual(originalData, editor?.ops);
    const hadPreviousError = lastSaved?.status === 'field_error';

    //Prevent saving if data has not changed or is empty and field is required
    // Exception: If previous save failed (field_error), retry even if data looks unchanged
    // This clears the error notification when user fixes validation issues
    // CRITICAL: Prevent saving if character limit exceeded - data must stay in field until fixed
    if ((dataChanged || hadPreviousError) && (!editorEmpty || !required) && !isOnlyPlaceholder && !maxSizeOver) {
      //Sent call to save changes if it is modified by user and not updated by lock call
      if(!valueIsSet){
          if (typeof onBlur === 'function') {
            localStorage.setItem("changedValues", inputProps.name);
            if (editorEmpty) {
              editor = null;
            }
            onBlur();
            oldValueRef.current = editor?.ops;
          }
        } else if (placeholder) {
          //If not modified in anyway and has the example text
          const placeholderOps = { ops: [{ insert: placeholder + '\n' }] }; // Proper Quill Delta format
          if(isEqual(placeholderOps?.ops, editor?.ops)){
            //Empty placeholder text if it was not edited
            editorRef.current.getEditor().deleteText(0, editorRef.current.getEditor().getLength());
            showCounter.current = false;
          }
        }
    } else if (editorEmpty && !isOnlyPlaceholder) {
      localStorage.setItem("changedValues", inputProps.name);
      editorRef.current.getEditor().deleteText(0, editorRef.current.getEditor().getLength());
      showCounter.current = false;
      setValueIsEmpty(false);
      onBlur();
    } else if (isOnlyPlaceholder) {
      // Clear placeholder text if user didn't edit
      editorRef.current.getEditor().deleteText(0, editorRef.current.getEditor().getLength());
      showCounter.current = false;
    } else {
      // Data not changed, skip save
    }
    if(rollingInfo && !maxSizeOver){
      setEditField(false)
    }
  }

  const addComment = () => {
    const prompt = window.prompt(t('shoutbox.add-field-comment'), '')
    if (prompt) {
      dispatch(createFieldComment(projectId, inputProps.name, prompt))
      setShowComments(true)
    }
  }

  const newInputProps = {
    ...inputProps,
    defaultValue: value
  }
  let reducedName = inputProps.name

  const lastIndex = inputProps.name.lastIndexOf('.')

  let number = 0

  if (lastIndex !== -1) {
    reducedName = inputProps.name.substring(lastIndex + 1, inputProps.name.length)
    const match = inputProps.name.match(/\[(\d+)\]/);
    number = match ? parseInt(match[1], 10) : 0;
  }
  const toolbarName = `toolbar-${reducedName || ''}-${number}`
  const modules = {
    toolbar: `#${toolbarName}`
  }

  const onKeyDown = (e) => {
    if(readonly){
      //prevent typing text if locked
      editorRef.current.editor.enable(false)
      editorRef.current.editor.blur()
    }
  }

  const handleWrapperKeyDown = (e) => {
    if (e.key === 'Escape' && rollingInfo && editField) {
      editorRef.current?.getEditor()?.blur();
      handleBlur(readonly);
      setEditField(false);
      requestAnimationFrame(() => {
        const editButton = document.getElementById('edit-' + inputProps.name + '-button');
        console.log(editButton)
        editButton?.focus();
      });
      return;
    }
    if (e.key !== 'Tab') return;
    const target = e.target;
    const isEditor = target.classList?.contains('ql-editor');
    const buttons = getFocusableElements(toolbarName);
    const isFirstBtn = buttons.length > 0 && target === buttons[0];
    const isLastBtn = buttons.length > 0 && target === buttons.at(-1);

    if (!e.shiftKey && isLastBtn) {
      e.preventDefault();
      const editor = editorRef.current?.getEditor();
      if (editor) {
        editor.focus();
        editor.setSelection(editor.getLength(), 0);
      }
      return;
    }

    if (e.shiftKey && isEditor && buttons.length > 0) {
      e.preventDefault();
      buttons.at(-1).focus();
      return;
    }

    const exitForward = !e.shiftKey && isEditor;
    const exitBackward = e.shiftKey && isFirstBtn;
    if (exitForward || exitBackward) {
      // Mark that any imminent .ql-editor focus event is internal cleanup,
      // not a real entry, so the focus handler won't redirect back to the toolbar.
      skipRedirectRef.current = true;
      handleBlur(readonly);
      // Reset the flag on the next tick once focus has settled.
      setTimeout(() => { skipRedirectRef.current = false; }, 0);
    }
  };

  const handleWrapperFocus = (e) => {
    if (typeof checkLocked === 'function') checkLocked(e);
    if (!e.target.classList?.contains('ql-editor')) return;
    if (skipRedirectRef.current) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    // Hijack focus when tabbing (not clicking) into the editor
    const fromInside = e.relatedTarget && wrapper.contains(e.relatedTarget);
    if (fromInside) return;
    if (!tabbedRecentlyRef.current) return;
    setIsFocused(true);
    setToolbarVisible(true);
    if (typeof onFocus === 'function' && !insideFieldset) {
      onFocus(inputProps.name);
    }

    // If shift-tabbing backwards to the editor, focus the editor instead of manually focusing toolbar
    const fromAfter = e.relatedTarget && (wrapper.compareDocumentPosition(e.relatedTarget) & Node.DOCUMENT_POSITION_FOLLOWING);
    if (fromAfter) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const buttons = getFocusableElements(toolbarName);
        if (buttons.length === 0) return;
        buttons[0].focus();
      });
    });
  };

  const shouldBlockEditorUpdate = () => {
    if (hasActiveNetworkError()) {
      return true; // Don't touch editor when network error warning is visible
    }
    // Don't overwrite editor if user is currently editing with char limit error
    // User needs to see their typed content to be able to fix it
    if (isFocused && (charLimitOver || maxSizeOver)) {
      return true;
    }
    return false;
  }

  const updateEditorContents = (dbValue) => {
    const cursorPosition = editorRef.current.getEditor().getSelection();
    editorRef.current.getEditor().setContents(dbValue);
    editorRef.current.getEditor().setSelection(cursorPosition?.index);
    counter.current = editorRef.current.getEditor().getLength() -1;
    setValueIsEmpty(false);
  }

  const syncFieldsetValue = (dbValue) => {
    const shouldSync = insideFieldset && (!nonEditable || !rollingInfo);
    const contentsMatch = isEqual(editorRef?.current?.getEditor()?.getContents()?.ops, dbValue?.ops);
    
    if (shouldSync && !contentsMatch) {
      //Set onchange to redux form so values don't get offsync on fieldsets
      setCurrentTimeout(setTimeout(() => {
        dispatch(change(fieldFormName, inputProps.name, dbValue))
      }, 1))
    }
  }

  const setPlaceholderIfEmpty = () => {
    if (!placeholder || value) {
      return;
    }
    const placeholderOps = { ops: [{ insert: placeholder + '\n' }] };
    editorRef.current.getEditor().setContents(placeholderOps);
  }

  const setValue = (dbValue) => {
    if (!editorRef?.current || shouldBlockEditorUpdate()) {
      return;
    }

    const name = inputProps.name;
    let originalData = attributeData[name]?.ops
    if(insideFieldset && !nonEditable || !rollingInfo){
      originalData = getOriginalData(name,originalData)
    }
    
    //set editor value from db value updated with focus and lock call if data has changed on db
    const shouldUpdate = dbValue?.ops && !isEqual(originalData, dbValue?.ops);
    
    if (shouldUpdate) {
      // Preserve unsaved content when over character limit during network error
      // If editor has more content than dbValue, don't overwrite with db value
      const currentEditorLength = editorRef.current.editor.getLength() - 1;
      const dbValueLength = dbValue?.ops ? dbValue.ops.map(op => op.insert).join('').length : 0;
      const hasUnsavedExcessData = maxSizeOver && currentEditorLength > dbValueLength;
      
      if (hasUnsavedExcessData) {
        return;
      }
      
      updateEditorContents(dbValue);
      syncFieldsetValue(dbValue);
    } else if (!dbValue) {
      setPlaceholderIfEmpty();
    }
  }

  const editRollingField = () => {
    // Don't open field if other fields have errors (passivation active)
    if (shouldDisableForErrors) {
      return;
    }
    setEditField(true)
    setTimeout(function(){
      editorRef?.current?.editor.focus()
    }, 200);
  }

  const normalOrRollingElement = () => {
    
    let filteredComments = []
    
    if (comments && comments.length > 0) {
      filteredComments = comments.filter((comment) => {
        if (comment.project === projectId) {
          if (comment.fieldset_path.length > 0) {
            if (name.includes(comment.fieldset_path[0].parent && comment.fieldset_path[0].index)) {
              return comment
            }
          } else {
            return comment
          }
        }
      })
    }

    //Default maxsize 20000
    const maxSize = props.maxSize ? props.maxSize : 20000;
    let RichTextClassName = "rich-text-editor"

    if (maxSizeOver) {
      RichTextClassName += toolbarVisible ? ' toolbar-visible-error' : ' has-error'
    } else {
      RichTextClassName += toolbarVisible ? ' toolbar-visible' : ''
    }
    RichTextClassName += largeField ? ' large' : ''

    const isRichTextDisabled = fieldSetDisabled || disabled || fieldDisabled || lastModified === inputProps.name && saving || shouldDisableForErrors || isThisFieldNetworkError;
    const isBlurred = (lastModified === inputProps.name && saving) || (testingConnection?.isActive && testingConnection?.fieldName === inputProps.name);
    //Render rolling info field or normal edit field
    //If clicking rolling field button makes positive lock check then show normal editable field
    //Rolling field can be nonEditable
    const elements = nonEditable || rollingInfo && !editField && !showComments ?
    <RollingInfo 
      name={inputProps.name} 
      value={value || ""}
      nonEditable={nonEditable}
      modifyText={modifyText}
      rollingInfoText={rollingInfoText}
      editRollingField={editRollingField}
      type="richtext"
      phaseIsClosed={phaseIsClosed}
      maxSizeOver={maxSizeOver}
      attributeData={attributeData}
      shouldDisableForErrors={shouldDisableForErrors}
    />
    :
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
    onContextMenu={(e)=> {if(readonly){e.preventDefault()}}}
    className='richtext-container'
    >
    {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
    <div
      ref={wrapperRef}
      className={`rich-text-editor-wrapper ${isRichTextDisabled ? 'rich-text-disabled' : ''} ${isThisFieldNetworkError ? 'has-network-error' : ''} ${isBlurred ? 'blurred' : ''} ${maxSizeOver ? 'has-error' : ''}`}
      onFocus={handleWrapperFocus}
      onKeyDown={handleWrapperKeyDown}
      id={"rte-wrapper-" + inputProps.name}
    >
      <div className={RichTextClassName}>
        <div
          role="toolbar"
          id={toolbarName}
          onMouseDown={e => e.preventDefault()}
          className="ql-toolbar"
        >
          <span className={readonly ? "ql-formats rich-text-disabled" : "ql-formats"}>
            <button aria-label="bold" className="ql-bold" />
            <button aria-label="italic" className="ql-italic" />
            <button aria-label="underline" className="ql-underline" />
            <button aria-label="strike" className="ql-strike" />
          </span>
          <span className={readonly ? "ql-formats rich-text-disabled" : "ql-formats"}>
            <select aria-label="color" className="ql-color" />
            <select aria-label="background" className="ql-background" />
          </span>
          <span className={readonly ? "ql-formats rich-text-disabled" : "ql-formats"}>
            <button aria-label="list" className="ql-list" value="ordered" />
            <button aria-label="bullet" className="ql-list" value="bullet" />
          </span>
          <span className={readonly ? "ql-formats rich-text-disabled" : "ql-formats"}>
            <button aria-label="script" className="ql-script" value="super" />
            <button aria-label="sub" className="ql-script" value="sub" />
          </span>
          <span className="ql-formats">
            <button
              aria-label="Lisää kommentti"
              className="quill-toolbar-comment-button"
              onClick={addComment}
            >
              <CommentIcon className="comment-icon" aria-hidden="true" focusable="false" />
            </button>
            <button
              className="show-comments-button"
              aria-label="Näytä kommentit"
              onClick={() => setShowComments(!showComments)}
              disabled={!filteredComments?.length}
            >
              {showComments ? 'Piilota' : 'Näytä'} kommentit (
              {filteredComments ? filteredComments.length : 0})
            </button>
          </span>
        </div>
        <ReactQuill
          tabIndex="0"
          id={toolbarName + "input"}
          ref={editorRef}
          modules={modules}
          theme="snow"
          formats={formats}
          {...newInputProps}
          // default value initialized, after that quill handles internal state
          // Do not explicitly set value. see comments at top of this file.
          onChange={(_val, _delta, source) =>{handleChange(_val, _delta, source, readonly)}}
          onFocus={(event, source) => {handleFocus(event,source)}}
          onKeyDown={onKeyDown}
          onBlur={(_range, _source, quill) => {
            // Calculate character count directly from editor to ensure accuracy
            // Don't rely on counter.current which might be stale
            const editorLength = quill.getLength() - 1; // -1 because Quill counts the trailing newline
            const isOverLimit = editorLength > maxSize;
            
            if (isOverLimit) {
              setIsFocused(false);
              setToolbarVisible(false);
              showCounter.current = false;
              setCharLimitOver(true);
              // formErrorList is handled by useEffect when charLimitOver changes
              
              // Trigger save immediately
              setTimeout(() => {
                if (onBlur) {
                  handleBlur(readonly);
                }
              }, 0);
            } else {
              // Normal blur - use the existing copy-paste protection logic
              setTimeout(() => {
                // Hack. Prevent blurring when copy-paste data
                let fixRange = quill.getSelection()
                
                const focusStillInWrapper = wrapperRef.current?.contains(document.activeElement);

                if (!fixRange || !focusStillInWrapper) {
                  setIsFocused(false);
                  setToolbarVisible(false)
                  showCounter.current = false;
                  
                  // No error, save immediately
                  if (onBlur) {
                    handleBlur(readonly)
                  }
                }
              }, 50) // random time
            }
          }}
          meta={meta}
          placeholder={placeholder}
          className={className}
          updated={updated}
          readOnly={readonly || lastSaved?.status === "error"}
        />
      </div>
      {showComments && filteredComments && filteredComments.length > 0 && (
        <div className="comment-list">
          {filteredComments.map((comment, i) => (
            <Comment 
            key={`${i}-${comment.id}`}
            {...comment}
            editable={userId === comment.user}
            readOnly={readonly}
            onSave={content =>
              dispatch(editFieldComment(projectId, comment.id, content, reducedName))
            }
            onDelete={() =>
              dispatch(deleteFieldComment(projectId, comment.id, reducedName))
            }
            />
          ))}
        </div>
      )}
      {showCounter.current && counter.current !== undefined && maxSize ? (
        <p
          className={
            counter.current > maxSize ? 'quill-counter quill-warning' : 'quill-counter'
          }
        >
          {counter.current + '/' + maxSize}
        </p>
      ) : null}
    </div>
    </div>
    
    return (
      <>
        {elements}
        {/* Hide character limit error when network error is active - network error takes priority */}
        {maxSizeOver && !hasActiveNetworkError() ? <div className='max-chars-error'>{t('project.charsover')}</div> : ""}
        {checking && required && valueIsEmpty ? <div className='max-chars-error'>{t('project.required-field')}</div> : ""}
        <NetworkErrorState fieldName={inputProps.name} maxSizeOver={maxSizeOver} readonly={readonly} />
      </>
    )
  }

  return (
    normalOrRollingElement()
  )
}

export default RichTextEditor
