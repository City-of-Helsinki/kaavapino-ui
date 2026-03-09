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
import { currentProjectIdSelector,savingSelector,lockedSelector, lastModifiedSelector, pollSelector,lastSavedSelector, projectNetworkSelector, formErrorListSelector, connectionErrorFieldsSelector, fieldsWithAnyErrorSelector } from '../../selectors/projectSelector'
import commentIcon from '@/assets/icons/comment-icon.svg';
import { useTranslation } from 'react-i18next'
import RollingInfo from '../input/RollingInfo.jsx'
import NetworkErrorState from '../input/NetworkErrorState.jsx'
import { useIsMount } from '../../hooks/IsMounted'
import { useFieldPassivation } from '../../hooks/useFieldPassivation'
import { isEqual } from 'lodash'

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
  // KAPI-98: Temporarily disabled lists in rte
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

  const [showComments, setShowComments] = useState(false)
  const [toolbarVisible, setToolbarVisible] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [currentTimeout, setCurrentTimeout] = useState(0)
  const [readonly, setReadOnly] = useState(false)
  const [valueIsSet, setValueIsSet] = useState(false)
  const [valueIsEmpty,setValueIsEmpty] = useState(false)
  const [charLimitOver,setCharLimitOver] = useState(false)
  const [maxSizeOver, setMaxSizeOver] = useState(false)
  const [editField,setEditField] = useState(false)
  const [hadFocusBeforeTabOut, setHadFocusBeforeTabOut] = useState(false)
  const [errorJustCleared, setErrorJustCleared] = useState(false)

  const editorRef = useRef("")
  const counter = useRef(props.currentSize)
  const showCounter = useRef(false)
  const wasInErrorList = useRef(false)
  const wasInAnyErrorList = useRef(false)
  const prevNetworkStatus = useRef(network?.status || 'ok')
  const prevLastSavedStatus = useRef(lastSaved?.status || '')
  
  // Check if other fields have validation errors OR connection errors (UX60.2.5 - passivate fields when error exists)
  const shouldDisableForErrors = useFieldPassivation(inputProps.name)

  //Stringify the object for useEffect update check so it can be compared correctly
  //Normal object always different
  const lockedStatusJsonString = JSON.stringify(lockedStatus);

  const inputValue = useRef('')
  const myRefname= useRef(null);
  const fieldFormName = formName ? formName : EDIT_PROJECT_FORM

  const getFieldComments = () => {
    const fieldName = inputProps.name
    const lastIndex = fieldName && fieldName.lastIndexOf('.')

    if (lastIndex !== -1) {
      // TODO: Temporary fix to avoid crashing
      const currentFieldName = fieldName.substring(lastIndex + 1, fieldName.length)
      return fieldComments[currentFieldName]
    } else {
      return fieldComments[fieldName]
    }
  }

  const comments = getFieldComments()

  const { t } = useTranslation()

  const oldValueRef = useRef('');

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

  // REMOVED: This useEffect was causing user data to be overwritten with old saved data
  // when connection recovered. The editor already has the user's current data, so we
  // don't need to sync it. The skipUpdateAfterRecovery logic in the main value useEffect
  // handles preventing flickering without losing user data.
  
  // NOTE: prevLastSavedStatus ref is now updated at the END of the main value useEffect
  // to ensure we detect the status transition BEFORE updating the ref.

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
  }, [editorRef])

  useEffect(() => {
    if(!isMount){
      //!ismount skips initial render
      // Sync charLimitOver with maxSizeOver when field is NOT focused
      // This prevents showing error notification while user is still typing/pasting
      if(!isFocused && maxSizeOver){
        setCharLimitOver(true);
      } else if (!maxSizeOver) {
        setCharLimitOver(false);
      }
      
      // Add to error list immediately when character limit exceeded (for field passivation)
      // This passivates other fields while keeping this field editable so user can fix the error
      if(maxSizeOver){
        //Adds field to error list - triggers passivation of other fields
        dispatch(formErrorList(true,inputProps.name))
      }
      else{
        //removes field from error list
        dispatch(formErrorList(false,inputProps.name))
      }
    }
    
    // NOTE: No cleanup function to remove from error list on unmount
    // Character limit errors must persist across page navigation within same phase
    // If user navigates to different page in same phase, other fields must remain passivated
    // Error is only cleared when user fixes the character limit (maxSizeOver becomes false)
    // or when phase changes (which resets all form data including error list)
  }, [charLimitOver, valueIsEmpty, isFocused, maxSizeOver])

  // Handle error list for rolling info fields (when field is closed but has errors)
  useEffect(() => {
    if (!isMount && rollingInfo && !editField) {
      // When rolling info field is closed and has errors (maxSizeOver or network error)
      const hasError = maxSizeOver || hasActiveNetworkError(inputProps.name);
      
      if (hasError) {
        dispatch(formErrorList(true, inputProps.name));
      } else {
        dispatch(formErrorList(false, inputProps.name));
      }
    }
  }, [rollingInfo, editField, maxSizeOver, isMount]);

  // NOTE: Removed automatic charLimitOver reset when field removed from error list
  // The charLimitOver state should only be controlled by:
  // 1. handleChange when user types and counter.current changes
  // 2. value useEffect when editor content is updated from Redux Form
  // This ensures charLimitOver accurately reflects the actual character count

  // Reset charLimitOver when user fixes the character count issue
  useEffect(() => {
    const maxSize = props.maxSize || 20000;
    if (charLimitOver && counter.current <= maxSize) {
      setCharLimitOver(false);
    }
  }, [charLimitOver, counter.current, props.maxSize]);

  /**
   * Check if this field has an active network error stored in localStorage
   */
  const hasActiveNetworkError = (fieldName) => {
    const wasNetworkErrorKey = `wasNetworkError_${fieldName}`;
    try {
      return localStorage.getItem(wasNetworkErrorKey) === 'true';
    } catch (e) {
      // localStorage not available (e.g., private browsing, cookies disabled)
      // Assume no error to allow editing - better UX than blocking unnecessarily
      return false;
    }
  };

  /**
   * Check if we just recovered from a network error
   */
  const isJustRecoveredFromError = (prevStatus, currentStatus) => {
    return (prevStatus === 'error' || prevStatus === 'connection_restored') && 
           (currentStatus === 'success' || 
            currentStatus === 'connection_restored' || 
            currentStatus === '' || 
            !currentStatus);
  };

  /**
   * Update editor content and related states
   */
  const updateEditorContent = (editor, newValue) => {
    editor.setContents(newValue);
    counter.current = editor.getLength() - 1;
    
    const maxSize = props.maxSize || 20000;
    if (counter.current > maxSize) {
      setCharLimitOver(true);
    } else {
      setCharLimitOver(false);
    }
  };

  /**
   * Determine if editor content should be updated
   */
  const shouldUpdateEditorContent = (editor, value, errorWasJustCleared) => {
    const currentContents = editor.getContents();
    const currentLength = editor.getLength() - 1;
    
    const contentChanged = !isEqual(currentContents, value);
    const lengthMismatch = Math.abs(currentLength - counter.current) > 5;
    
    return (contentChanged && lengthMismatch) || errorWasJustCleared;
  };

  // Force Quill to update when Redux Form value changes externally
  // This handles cases like user closing error notification which reverts the field
  useEffect(() => {
    // Track network status transitions
    const connectionJustRecovered = prevNetworkStatus.current === 'error' && network?.status === 'success';
    prevNetworkStatus.current = network?.status || 'ok';
    
    // Track error list membership
    wasInAnyErrorList.current = fieldsWithAnyError.includes(inputProps.name);
    
    // Skip update if connection just recovered and user is still editing
    if (connectionJustRecovered && isFocused) {
      return;
    }
    
    // Track if field was just removed from error list
    const wasJustCleared = wasInErrorList.current && !formErrors.includes(inputProps.name);
    if (wasJustCleared) {
      setErrorJustCleared(true);
    }
    wasInErrorList.current = formErrors.includes(inputProps.name);
    
    // CRITICAL: Preserve user data when character limit exceeded
    // Don't overwrite editor content with backend value when user has unsaved changes due to error
    if (maxSizeOver) {
      return;
    }
    
    // Only update editor when field is not focused
    if (!editorRef.current || !value || isFocused) {
      return;
    }

    const editor = editorRef.current.getEditor();
    if (!editor) {
      return;
    }

    // Preserve user data if there's an active network error
    if (hasActiveNetworkError(inputProps.name)) {
      counter.current = editor.getLength() - 1;
      return;
    }

    // Preserve user data if we just recovered from error
    if (isJustRecoveredFromError(prevLastSavedStatus.current, lastSaved?.status)) {
      counter.current = editor.getLength() - 1;
      return;
    }

    // Update editor content if needed
    if (shouldUpdateEditorContent(editor, value, errorJustCleared)) {
      updateEditorContent(editor, value);
      
      if (errorJustCleared) {
        setErrorJustCleared(false);
      }
    }

    // Update status tracking
    prevLastSavedStatus.current = lastSaved?.status || '';
  }, [value, isFocused, formErrors, errorJustCleared, network?.status, connectionErrorFields, lastSaved?.status, maxSizeOver]);

  useEffect(() => {
    // Checks on page load and on value change if the input value character count exceeds maxSize
    const maxSize = props.maxSize || 20000
   //Get the maxSize from backend or use default
    if (value && value.ops) {
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

  // Listen for force refresh event from NetworkErrorState when user closes notification
  useEffect(() => {
    const handleForceRefresh = (event) => {
      if (event.detail.fieldName === inputProps.name && editorRef.current) {
        const savedValue = attributeData?.[inputProps.name];
        
        if (savedValue && editorRef.current) {
          // Restore saved value
          const editor = editorRef.current.getEditor();
          editor.setContents(savedValue);
          counter.current = editor.getLength() - 1;
        } else {
          // Field is being restored to empty - reset ALL validation states
          
          // Clear the editor content visually
          if (editorRef.current) {
            const editor = editorRef.current.getEditor();
            editor.setText('');  // Clear editor content immediately
          }
          
          setCharLimitOver(false);
          setValueIsEmpty(true);
          setMaxSizeOver(false);  // CRITICAL: Also reset maxSizeOver
          counter.current = 0;
        }
      }
    };
    
    globalThis.addEventListener('forceEditorRefresh', handleForceRefresh);
    return () => globalThis.removeEventListener('forceEditorRefresh', handleForceRefresh);
  }, [inputProps.name, value, attributeData, charLimitOver, maxSizeOver]);

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
      editorRef.current.editor.blur();
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

      // determine readOnly status
      const shouldBeReadOnly = !isLocked || !isOwner || (lastModified === inputProps.name && isSaving)
      setReadOnly(shouldBeReadOnly)

      if (!shouldBeReadOnly) {
        // if the field is not locked, set the value from the lock data
        setValue(fieldData)
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
      setReadOnly(false);
    }

    // Check if the field is locked and if the lock data is available
    if (lockedStatus && Object.keys(lockedStatus).length > 0) {
      if (lockedStatus.lock === false) {
        if (!insideFieldset) {
          let identifier = getIdentifier()
          const isLocked = inputProps.name === identifier
          updateFieldAccess(isLocked, identifier);
        } else {
          let identifier = getIdentifier()
          let name = inputProps.name?.split('.')[0];
          const isLocked = name === identifier
          updateFieldsetFieldAccess(isLocked, identifier);
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
        const actualDeltaText = editorRef.current.editor.getText().replace(/\n/g, '')

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
        const editorEmpty = actualDeltaText.trim().length === 0 ? true : false
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
  }, [inputProps.name, value, dispatch, props.maxSize])

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
      if(lastSaved?.status === "error"){
        //Prevent focus and editing to field if not locked
        editorRef.current.editor.blur()
      }
      else{
        setToolbarVisible(true)
      }
    }
    
    let length = editorRef.current.getEditor().getLength();
    counter.current = length -1;
    showCounter.current = true;
  }

  const getOriginalData = (name,originalData) => {
    let fieldsetName
    let fieldName
    let index
    let data = originalData
    //Get fieldset name, index and field of fieldset
    fieldsetName = name.split('[')[0]
    index = name.split('[').pop().split(']')[0];
    fieldName = name.split('.')[1]
    if(attributeData[fieldsetName] && attributeData[fieldsetName][index] && attributeData[fieldsetName][index][fieldName]?.ops){
      data = attributeData[fieldsetName][index][fieldName]?.ops
    }
    return data
  }

  const handleBlur = (readonly) => {
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
      editorEmpty = editorRef?.current?.getEditor().getText().trim().length === 0 ? true : false
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
      if (readonly) {
        // Skip saving if field is readonly
        return;
      }
      //Sent call to save changes if it is modified by user and not updated by lock call
      if(!valueIsSet){
          if (typeof onBlur === 'function') {
            localStorage.setItem("changedValues", inputProps.name);
            if (editorEmpty) {
              editor = null
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
      } else {
        // Field is readonly, skip save
      }
    }
    else if(editorEmpty && !isOnlyPlaceholder){
      localStorage.setItem("changedValues", inputProps.name);
      editorRef.current.getEditor().deleteText(0, editorRef.current.getEditor().getLength());
      showCounter.current = false;
      setValueIsEmpty(false)
      onBlur();
    }
    else if (isOnlyPlaceholder) {
      // Clear placeholder text if user didn't edit
      editorRef.current.getEditor().deleteText(0, editorRef.current.getEditor().getLength());
      showCounter.current = false;
    }
    else {
      // Data not changed, skip save
    }
    if(rollingInfo){
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

    if (e.key === "Tab") {
      //Set focus to editor when tab press detected at container
     if(e.target.className === "richtext-container"){
        handleFocus("api",true)
      }
    }
  }

  // Helper: Check if editor value update should be blocked
  const shouldBlockEditorUpdate = () => {
    // CRITICAL: Don't overwrite editor if field has active network error
    if (hasActiveNetworkError(inputProps.name)) {
      return true; // Don't touch editor when network error warning is visible
    }
    
    // CRITICAL: Don't overwrite editor if user is currently editing with char limit error
    // User needs to see their typed content to be able to fix it
    if (isFocused && (charLimitOver || maxSizeOver)) {
      return true;
    }
    
    return false;
  }

  // Helper: Update editor contents and sync cursor position
  const updateEditorContents = (dbValue) => {
    const cursorPosition = editorRef.current.getEditor().getSelection()
    editorRef.current.getEditor().setContents(dbValue);
    editorRef.current.getEditor().setSelection(cursorPosition?.index);
    counter.current = editorRef.current.getEditor().getLength() -1
    setValueIsEmpty(false)
  }

  // Helper: Sync fieldset value to Redux Form
  const syncFieldsetValue = (dbValue) => {
    const shouldSync = insideFieldset && (!nonEditable || !rollingInfo);
    const contentsMatch = isEqual(editorRef?.current?.getEditor()?.getContents()?.ops, dbValue?.ops);
    
    if (shouldSync && !contentsMatch) {
      //Set onchange to redux form so values don't get offsync on fieldsets
      setCurrentTimeout(() =>
        setTimeout(
          () =>
            dispatch(
              change(
                fieldFormName,
                inputProps.name,
                dbValue
              )
            ),
          1
        ))
    }
  }

  // Helper: Set placeholder when field is empty
  const setPlaceholderIfEmpty = () => {
    if (!placeholder || value) {
      return;
    }
    
    // Only set placeholder if field is truly empty (no Redux Form value)
    // Don't overwrite existing content or content during error states
    const placeholderOps = { ops: [{ insert: placeholder + '\n' }] }; // Proper Quill Delta format
    editorRef.current.getEditor().setContents(placeholderOps);
  }

  const setValue = (dbValue) => {
    if (!editorRef?.current) {
      return;
    }

    if (shouldBlockEditorUpdate()) {
      return;
    }
    
    let name = inputProps.name;
    let originalData = attributeData[name]?.ops
    if(insideFieldset && !nonEditable || !rollingInfo){
      originalData = getOriginalData(name,originalData)
    }
    
    //set editor value from db value updated with focus and lock call if data has changed on db
    // or set it when recovering from no connection to backend
    const shouldUpdate = (dbValue?.ops && !isEqual(originalData, dbValue?.ops)) || connection.connection;
    
    if (shouldUpdate) {
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
    const val = Array.isArray(value?.ops)
      ? value.ops.map(op => op.insert).join('')
      : (value?.ops || "")
    
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
    
    // Add error class if character limit exceeded (regardless of focus)
    // Use maxSizeOver state which properly tracks character count changes
    if (maxSizeOver) {
      RichTextClassName += toolbarVisible ? ' toolbar-visible-error' : ' has-error'
    } else {
      RichTextClassName += toolbarVisible ? ' toolbar-visible' : ''
    }
    RichTextClassName += largeField ? ' large' : ''

    //Render rolling info field or normal edit field
    //If clicking rolling field button makes positive lock check then show normal editable field
    //Rolling field can be nonEditable
    const elements = nonEditable || rollingInfo && !editField && !showComments ?
    <RollingInfo 
      name={inputProps.name} 
      value={val || ""}
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
    <div
    onContextMenu={(e)=> {if(readonly){e.preventDefault()}}}
    tabIndex="0"
    onKeyDown={onKeyDown}
    className='richtext-container'
    >
    <input className='visually-hidden' ref={myRefname}/>
    <div
      role="textbox"
      className={`rich-text-editor-wrapper ${fieldSetDisabled || disabled || fieldDisabled || lastModified === inputProps.name && saving || shouldDisableForErrors ? 'rich-text-disabled' : ''}`}
      aria-label="tooltip"
      onFocus={checkLocked}
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
              <img src={commentIcon} alt="comment icon" className="comment-icon" />
            </button>
            <button
              className="show-comments-button"
              aria-label="Näytä kommentit"
              onClick={() => setShowComments(!showComments)}
              disabled={!filteredComments || !filteredComments.length}
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
          onKeyDown={(e) => {
            if (e.key === 'Tab' && !e.shiftKey && e.target.className === 'ql-editor') {
              handleBlur(readonly);
            }
          }}
          onBlur={(_range, _source, quill) => {
            // Calculate character count directly from editor to ensure accuracy
            // Don't rely on counter.current which might be stale
            const editorLength = quill.getLength() - 1; // -1 because Quill counts the trailing newline
            const isOverLimit = editorLength > maxSize;
            
            if (isOverLimit) {
              // Character limit exceeded - handle immediately without delay
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
                
                // Check if focus has actually left the editor
                // If activeElement is not inside the Quill editor, we should save
                const quillEditor = editorRef.current?.editor?.root;
                const focusStillInEditor = quillEditor?.contains(document.activeElement);
                
                if (!fixRange || !focusStillInEditor) {
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
      {showCounter.current && typeof counter.current !== "undefined" && maxSize ? (
        <p
          className={
            counter.current > maxSize ? 'quill-counter quill-warning' : 'quill-counter'
          }
        >
          {counter.current + '/' + maxSize}
        </p>
      ) : null}
    </div>
      {maxSizeOver ? <div className='max-chars-error'>{t('project.charsover')}</div> : ""}
      {checking && required && valueIsEmpty ? <div className='max-chars-error'>{t('project.required-field')}</div> : ""}
      <NetworkErrorState fieldName={inputProps.name} />
    </div>
    
    return elements
  }

  return (
    normalOrRollingElement()
  )
}

export default RichTextEditor
