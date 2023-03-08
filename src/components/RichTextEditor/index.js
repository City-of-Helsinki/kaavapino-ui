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
import { currentProjectIdSelector } from '../../selectors/projectSelector'
import { ReactComponent as CommentIcon } from '../../assets/icons/comment-icon.svg'
import { useTranslation } from 'react-i18next'

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
    className,
    updated,
    formName,
    setRef
  } = props
  const dispatch = useDispatch()
  const fieldComments = useSelector(fieldCommentsSelector)
  const userId = useSelector(userIdSelector)
  const projectId = useSelector(currentProjectIdSelector)
  const [showComments, setShowComments] = useState(false)

  const [toolbarVisible, setToolbarVisible] = useState(false)
  const editorRef = useRef(null)
  const counter = useRef(props.currentSize)
  const showCounter = useRef(false)
  const [currentTimeout, setCurrentTimeout] = useState(0)
  const inputValue = useRef('')
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
    oldValueRef.current = inputProps.value;
    inputValue.current = inputProps.value;

    if (setRef) {
      setRef({ name: inputProps.name, ref: editorRef })
    }
  }, [])

  const handleChange = useCallback((_val, _delta, source) => {
    if (currentTimeout) {
      clearTimeout(currentTimeout)
      setCurrentTimeout(0)

    }
    if (source === 'user') {
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
          500
        ))

      counter.current = actualDeltaValue.length() - 1;
      showCounter.current = true;
    }
    inputProps.onChange(_val, inputProps.name);
    inputValue.current = _val;

  }, [inputProps.name, inputProps.value])

  const handleBlur = () => {
    if (inputValue.current !== oldValueRef.current) {
      onBlur();
      oldValueRef.current = inputValue.current;
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

  return (
    <div
      role="textbox"
      className={`rich-text-editor-wrapper ${disabled ? 'rich-text-disabled' : ''}`}
      aria-label="tooltip"
    >
      <div
        className={`rich-text-editor ${toolbarVisible || showComments ? 'toolbar-visible' : ''
          } ${largeField ? 'large' : ''}`}
        onFocus={() => setToolbarVisible(true)}
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
          ref={editorRef}
          modules={modules}
          theme="snow"
          formats={formats}
          {...newInputProps}
          // default value initialized, after that quill handles internal state
          // Do not explicitly set value. see comments at top of this file.
          onChange={handleChange}
          onBlur={(_range, _source, quill) => {
            setTimeout(() => {
              // Hack. Prevent blurring when copy-paste data
              let fixRange = quill.getSelection()
              if (!fixRange) {
                setToolbarVisible(false)
                showCounter.current = false;
                if (onBlur) {
                  handleBlur()
                }
              }
            }, 50) // random time
          }}
          meta={meta}
          placeholder={placeholder}
          className={className}
          onClick={() => setToolbarVisible(true)}
          updated={updated}
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
  )
}

export default RichTextEditor
