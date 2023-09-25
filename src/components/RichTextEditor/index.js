import React, { useRef, useState, useEffect, useCallback } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { change } from 'redux-form'
import { EDIT_PROJECT_FORM } from '../../constants'
import { useDispatch, useSelector } from 'react-redux'
import './styles.scss'
import { fieldCommentsSelector } from '../../selectors/commentSelector'
import Comment from '../shoutbox/comments/Comment'
import { userIdSelector } from '../../selectors/authSelector'
import {
  editFieldComment,
  deleteFieldComment,
  createFieldComment
} from '../../actions/commentActions'
import { currentProjectIdSelector,savingSelector,lockedSelector, lastModifiedSelector } from '../../selectors/projectSelector'
import { ReactComponent as CommentIcon } from '../../assets/icons/comment-icon.svg'
import { useTranslation } from 'react-i18next'
import projectUtils from '../../utils/projectUtils'
import {IconAlertCircleFill} from 'hds-react'

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
    largeField,
    disabled,
    meta,
    placeholder,
    onBlur,
    onFocus,
    className,
    updated,
    formName,
    setRef,
    lockField,
    fieldSetDisabled
  } = props

  const dispatch = useDispatch()

  const saving =  useSelector(state => savingSelector(state))
  const lastModified = useSelector(state => lastModifiedSelector(state))
  const lockedStatus = useSelector(state => lockedSelector(state))
  const fieldComments = useSelector(fieldCommentsSelector)
  const userId = useSelector(userIdSelector)
  const projectId = useSelector(currentProjectIdSelector)

  const [showComments, setShowComments] = useState(false)
  const [toolbarVisible, setToolbarVisible] = useState(false)
  const [currentTimeout, setCurrentTimeout] = useState(0)
  const [readonly, setReadOnly] = useState(false)
  const [valueIsSet, setValueIsSet] = useState(false)

  const editorRef = useRef(null)
  const counter = useRef(props.currentSize)
  const showCounter = useRef(false)

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

  document.onvisibilitychange = () => {
    //If navigated to different tab/window/screen blur and unclock
    if(document.hidden){
      if (typeof handleBlur === 'function') {
        handleBlur(readonly)
        myRefname.current?.focus();
      }
    }
    if(!document.hidden){
      myRefname.current?.focus();
    }
  }

  useEffect(() => {
    oldValueRef.current = inputProps.value;
    inputValue.current = inputProps.value;
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
    //Remove tab press inside editor so navigating with tab stays normal.
    const removeTabBinding = () => {
      if (editorRef.current === null) {
        return;
      }
      const keyboard = editorRef.current.getEditor().getModule('keyboard');
      // 'hotkeys' have been renamed to 'bindings'
      delete keyboard.bindings[9];
    };

    removeTabBinding();
  }, [editorRef])

  useEffect(() => {
    //Chekcs that locked status has more data then inital empty object
    if(lockedStatus && Object.keys(lockedStatus).length > 0){
      if(lockedStatus.lock === false){
        let identifier;
        //Field is fieldset field and has different type of identifier
        //else is normal field
        if(lockedStatus.lockData.attribute_lock.fieldset_attribute_identifier){
          identifier = lockedStatus.lockData.attribute_lock.field_identifier;
        }
        else{
          identifier = lockedStatus.lockData.attribute_lock.attribute_identifier;
        }
        const lock = inputProps.name === identifier
        //Check if locked field name matches with instance and that owner is true to allow edit
        //else someone else is editing and prevent editing
        if(lock && lockedStatus.lockData.attribute_lock.owner){
          if(lastModified === inputProps.name && lockedStatus?.saving){
            setReadOnly(true)
          }
          else{
            setReadOnly(false)
            //Add changed value from db if there has been changes
            setValue(lockedStatus.lockData.attribute_lock.field_data)
            if (typeof lockField === 'function') {
              //Change styles from FormField
              lockField(lockedStatus,lockedStatus.lockData.attribute_lock.owner,identifier)
            }
            //Focus to editor input so user does not need to click twice
            const fieldToFocus = document.getElementById(toolbarName + "input").querySelector("p");
            fieldToFocus.focus()
          }
        }
        else{
          setReadOnly(true)
          if (typeof lockField === 'function') {
            //Change styles from FormField
            lockField(lockedStatus,lockedStatus.lockData.attribute_lock.owner,identifier)
          }
        }
      }
    }
  }, [lockedStatusJsonString]);

  const checkClickedElement = (e) => {
    let previousElement = localStorage.getItem("previousElement")
    let previousElementId = localStorage.getItem("previousElementId")
    let target = e.target.classList.length > 0 ? e.target.classList : e.target.parentNode.classList

    if(target?.length > 0){
      //Lose focus and unclock if select button is clicked
      if(target.length > 0 && target.value.includes("Select-module") || target.value.includes("Button")){
        localStorage.setItem("previousElement","Select-module");
        handleBlur(readonly)
        setToolbarVisible(false)
        showCounter.current = false;
      }
      else if(target.length > 0 && target.value.includes("ql-editor") && previousElement && previousElementId === editorRef.current.props.id){
        oldValueRef.current = inputProps.value;
        inputValue.current = inputProps.value;
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
    else{
      localStorage.setItem("previousElement",false);
      localStorage.setItem("previousElementId","");
    }
  };

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
                  actualDeltaText ? actualDeltaValue : null
                )
              ),
            1
          ))

        counter.current = actualDeltaValue.length() - 1;
        showCounter.current = true;
      }
      else if(source === 'api'){
        //Value is updated with lock call so do not save it again
        setValueIsSet(true)
        showCounter.current = true;
      }
      inputValue.current = _val;
    }
  }, [inputProps.name, inputProps.value])

  const handleFocus = (event,source) => {
    if(source && event && source !== "silent"){
      if (typeof onFocus === 'function') {
        //Sent a call to lock field to backend
        onFocus(inputProps.name);
        localStorage.setItem("previousElementId",editorRef.current.props.id);
      }
      setToolbarVisible(true)
    }
  }

  const handleBlur = (readonly) => {
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
    if (typeof lockField === 'function') {
      //Send identifier data to change styles from FormField.js
      lockField(false,false,identifier)
    }
    //Sent a call to unlock field to backend
    if (typeof props.handleUnlockField === 'function') {
      props.handleUnlockField(inputProps.name)
    }
    if (inputValue.current !== oldValueRef.current) {
      //prevent saving if locked
      if (!readonly) {
        //Sent call to save changes if it is modified by user and not updated by lock call
        if(!valueIsSet){
          if (typeof onBlur === 'function') {
            localStorage.setItem("changedValues", inputProps.name);
            onBlur();
            oldValueRef.current = inputValue.current;
            setReadOnly(true)
          }
        }
      }
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
    number = inputProps.name[lastIndex - 2]
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
      else if(e.target.className === "ql-editor"){
        //tab focus out from editor and check if save is needed because value change
        handleBlur(readonly)
      }
    }
  }



  const setValue = (dbValue) => {
    const editor = editorRef.current.getEditor().getContents()
    
    /*TODO possible bug on adding some styles from editor to text. 
    The text could come as empty string and only show up on page refresh. Example add text and add color styles to it, 
    save and check from other browser tab that does it update the difference
    console.log(editor?.ops[0], dbValue?.ops[0])
    console.log(projectUtils.objectsEqual(editor?.ops[0], dbValue?.ops[0])) */
    if(!projectUtils.objectsEqual(editor?.ops[0], dbValue?.ops[0])){
      //set editor value from db value updated with lock call
      const cursorPosition = editorRef.current.getEditor().getSelection()
      editorRef.current.getEditor().setContents(dbValue);
      editorRef.current.getEditor().setSelection(cursorPosition.index);
    }
  }

  return (
    <div 
    tabIndex="0"
    onKeyDown={onKeyDown}
    className='richtext-container'
    >
    <input className='visually-hidden' ref={myRefname}/>
    <div
      role="textbox"
      className={`rich-text-editor-wrapper ${fieldSetDisabled || disabled || lastModified === inputProps.name && saving ? 'rich-text-disabled' : ''}`}
      aria-label="tooltip"
    >
      <div
        className={counter.current > props.maxSize ? 
        `rich-text-editor ${toolbarVisible || showComments ? 'toolbar-visible-error' : ''
        } ${largeField ? 'large' : ''}`
        : `rich-text-editor ${toolbarVisible || showComments ? 'toolbar-visible' : ''
      } ${largeField ? 'large' : ''}`}
      >
        <div
          role="toolbar"
          id={toolbarName}
          onMouseDown={e => e.preventDefault()}
          className="ql-toolbar"
        >
          <span className="ql-formats">
            <button aria-label="bold" className="ql-bold" />
            <button aria-label="italic" className="ql-italic" />
            <button aria-label="underline" className="ql-underline" />
            <button aria-label="strike" className="ql-strike" />
          </span>
          <span className="ql-formats">
            <select aria-label="color" className="ql-color" />
            <select aria-label="background" className="ql-background" />
          </span>
          <span className="ql-formats">
            <button aria-label="list" className="ql-list" value="ordered" />
            <button aria-label="bullet" className="ql-list" value="bullet" />
          </span>
          <span className="ql-formats">
            <button aria-label="script" className="ql-script" value="super" />
            <button aria-label="sub" className="ql-script" value="sub" />
          </span>
          <span className="ql-formats">
            <button
              aria-label="Lisää kommentti"
              className="quill-toolbar-comment-button"
              onClick={addComment}
            >
              <CommentIcon className="comment-icon" />
            </button>
            <button
              className="show-comments-button"
              aria-label="Näytä kommentit"
              onClick={() => setShowComments(!showComments)}
              disabled={!comments || !comments.length}
            >
              {showComments ? 'Piilota' : 'Näytä'} kommentit (
              {comments ? comments.length : 0})
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
          onFocus={(event, source) =>{handleFocus(event,source)}}
          onBlur={(_range, _source, quill) => {
            setTimeout(() => {
              // Hack. Prevent blurring when copy-paste data
              let fixRange = quill.getSelection()
              if (!fixRange) {
                setToolbarVisible(false)
                showCounter.current = false;
                if (onBlur) {
                  handleBlur(readonly)
                }
              }
            }, 50) // random time
          }}
          meta={meta}
          placeholder={placeholder}
          className={className}
          updated={updated}
          readOnly={readonly}
        />
      </div>
      {showComments && comments && comments.length > 0 && (
        <div className="comment-list">
          {comments.map((comment, i) => (
            <Comment
              key={`${i}-${comment.id}`}
              {...comment}
              editable={userId === comment.user}
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
      {showCounter.current && props.maxSize ? (
        <p
          className={
            counter.current > props.maxSize ? 'quill-counter quill-warning' : 'quill-counter'
          }
        >
          {counter.current + '/' + props.maxSize}
        </p>
      ) : null}
    </div>
      {counter.current > props.maxSize && toolbarVisible || showComments ? <div className='max-chars-error'><IconAlertCircleFill color="#B01038" aria-hidden="true"/> Merkkimäärä on ylittynyt</div> : ""}
      <div className='max-chars'>
        Max 1000 merkkiä
      </div>
    </div>
  )
}

export default RichTextEditor
