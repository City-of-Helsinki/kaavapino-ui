import React, { useState } from 'react'
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
            <div className="sb-menu">
              <button
                type="button"
                className="sb-menu__trigger"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
                onBlur={(e) => {
                  const root = e.currentTarget.closest('.sb-menu');
                  if (!root?.contains(e.relatedTarget)) setMenuOpen(false);
                }}
                title="Asetukset"
              >
                <IconCog aria-hidden="true" />
              </button>

              {menuOpen && (
                <ul className="sb-menu__card" role="menu" tabIndex={-1}>
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="sb-menu__item"
                      onClick={() => {
                        setEditing(true);
                        setMenuOpen(false);
                      }}
                    >
                      <IconPen aria-hidden="true" />
                      <span>Muokkaa</span>
                    </button>
                  </li>
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="sb-menu__item sb-menu__item--danger"
                      onClick={() => {
                        handleDelete();
                        setMenuOpen(false);
                      }}
                    >
                      <IconTrash aria-hidden="true" />
                      <span>Poista</span>
                    </button>
                  </li>
                </ul>
              )}
            </div>
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
