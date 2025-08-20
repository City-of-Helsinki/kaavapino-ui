import React, { useState } from 'react'
import { Dropdown } from 'semantic-ui-react'
import projectUtils from '../../../utils/projectUtils'
import { TextInput, Button } from 'hds-react'

function CommentMobile(props) {
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(props.content)

  const handleEditCancel = evt => {
    evt.stopPropagation()
    setEditing(false)
    setContent(props.content)
  }

  const handleEditSave = evt => {
    evt.stopPropagation()
    if (content.trim()) {
      props.onSave(content)
      setEditing(false)
    }
  }

  const handleDelete = evt => {
    evt.stopPropagation()
    props.onDelete()
  }

  const { created_at, user: userId, _metadata, generated } = props
  const user = !generated
    ? projectUtils.formatUsersName(_metadata.users.find(({ id }) => id === userId))
    : 'Automaattinen'
  const date = projectUtils.formatDate(created_at)
  const time = projectUtils.formatTime(created_at)
  const dateTime = `${date} ${time}`

  return (
    <div className="comment-container-mobile">
      <div className="comment-header-container">
        <div className="comment-header-text-container">
          <span className={`comment-creator${generated ? ' generated' : ''}`}>
            {user}
          </span>
          <span className="comment-timestamp">{dateTime}</span>
        </div>
        <div className="comment-edit-container">
          {props.editable && (
            <Dropdown pointing="left" icon="setting" direction="left">
              <Dropdown.Menu>
                <Dropdown.Item
                  icon="pencil"
                  text="Muokkaa"
                  onClick={() => setEditing(true)}
                />
                <Dropdown.Item icon="trash" text="Poista" onClick={handleDelete} />
              </Dropdown.Menu>
            </Dropdown>
          )}
        </div>
      </div>
      <div className="comment-content">
        {!editing && content}
        {editing && (
          <TextInput
            onChange={e => setContent(e.target.value)}
            focus
            type="text"
            fluid
            value={content}
          />
        )}
      </div>
      <div className="comment-footer">
        <div className="comment-footer-actions">
          {editing && (
            <React.Fragment>
              <Button variant="secondary" onClick={handleEditCancel}>
                Peruuta
              </Button>
              <Button variant="primary" onClick={handleEditSave} disabled={!content}>
                Tallenna
              </Button>
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  )
}

export default CommentMobile
