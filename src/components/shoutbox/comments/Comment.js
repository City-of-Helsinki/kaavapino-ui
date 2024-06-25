import React, { Component } from 'react'
import { Dropdown } from 'semantic-ui-react'
import projectUtils from '../../../utils/projectUtils'
import { TextInput, Button } from 'hds-react'
import { withTranslation } from 'react-i18next';

class Comment extends Component {
  constructor(props) {
    super(props)

    this.state = {
      editing: false,
      showEdit: false,
      menuOpen: false,
      content: props.content
    }
  }

  handleMouseEnter = () => {
    const { editable, readOnly } = this.props
    if (!editable || readOnly) {
      return
    }
    this.setState({ showEdit: true })
  }

  handleMouseLeave = () => {
    const { editable } = this.props
    if (!editable) {
      return
    }
    this.setState({ showEdit: false })
  }

  handleEditCancel = evt => {
    evt.stopPropagation()
    this.setState({ editing: false, content: this.props.content })
  }

  handleEditSave = evt => {
    evt.stopPropagation()
    if (this.state.content.trim()) {
      this.props.onSave(this.state.content)
      this.setState({ editing: false })
    }
  }

  handleDelete = evt => {
    evt.stopPropagation()
    this.props.onDelete()
  }

  render() {
    const { showEdit, menuOpen, editing, content } = this.state
    const { created_at, user: userId, _metadata, generated, t } = this.props
    const user = !generated
      ? projectUtils.formatUsersName(_metadata.users.find(({ id }) => id === userId))
      :  t('shoutbox.automatic')
    const date = projectUtils.formatDate(created_at)
    const time = projectUtils.formatTime(created_at)
    const dateTime = `${date} ${time}`

    return (
      <div
        className="comment-container"
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
      >
        <div className="comment-header-container">
          <div className="comment-header-text-container">
            <span className={`comment-creator${generated ? ' generated' : ''}`}>
              {user}
            </span>
            <span className="comment-timestamp">{dateTime}</span>
          </div>
          <div className="comment-edit-container">
            {(showEdit || menuOpen) && (
              <Dropdown
                pointing="left"
                icon="setting"
                onOpen={() => this.setState({ menuOpen: true })}
                onClose={() => this.setState({ menuOpen: false })}
                direction="left"
              >
                <Dropdown.Menu>
                  <Dropdown.Item
                    icon="pencil"
                    text={t('shoutbox.modify')}
                    onClick={() => this.setState({ editing: true })}
                  />
                  <Dropdown.Item icon="trash" text={t('shoutbox.remove')} onClick={this.handleDelete} />
                </Dropdown.Menu>
              </Dropdown>
            )}
          </div>
        </div>
        <div className="comment-content">
          {!editing && content}
          {editing && (
            <TextInput
              onChange={e => this.setState({ content: e.target.value })}
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
                <Button variant="secondary" onClick={this.handleEditCancel}>
                  {t('shoutbox.cancel')}
                </Button>
                <Button variant="primary" onClick={this.handleEditSave} disabled={!content}>
                {t('shoutbox.save')}
                </Button>
              </React.Fragment>
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default withTranslation()(Comment)
