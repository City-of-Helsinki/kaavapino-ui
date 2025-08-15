import React, { Component } from 'react'
import projectUtils from '../../../utils/projectUtils'
import { TextInput, Button, IconCogwheel, IconPen, IconTrash } from 'hds-react'
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

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
              <div
                className="sb-menu"
                onKeyDown={(e) => e.key === 'Escape' && this.setState({ menuOpen: false })}
              >
                <button
                  type="button"
                  className="sb-menu__trigger"
                  aria-haspopup="menu"
                  aria-expanded={this.state.menuOpen}
                  onClick={() => this.setState((s) => ({ menuOpen: !s.menuOpen }))}
                  onBlur={(e) => {
                    // close when focus leaves the whole component
                    const root = e.currentTarget.closest('.sb-menu');
                    if (!root?.contains(e.relatedTarget)) this.setState({ menuOpen: false });
                  }}
                  title={t('common.settings')}
                >
                  <IconCogwheel aria-hidden="true" />
                </button>

                {this.state.menuOpen && (
                  <ul className="sb-menu__card" role="menu" tabIndex={-1}>
                    <li role="none">
                      <button
                        type="button"
                        role="menuitem"
                        className="sb-menu__item"
                        onClick={() => this.setState({ editing: true, menuOpen: false })}
                      >
                        <IconPen aria-hidden="true" />
                        <span>{t('shoutbox.modify')}</span>
                      </button>
                    </li>
                    <li role="none">
                      <button
                        type="button"
                        role="menuitem"
                        className="sb-menu__item sb-menu__item--danger"
                        onClick={() => {
                          this.setState({ menuOpen: false });
                          this.handleDelete();
                        }}
                      >
                        <IconTrash aria-hidden="true" />
                        <span>{t('shoutbox.remove')}</span>
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

Comment.propTypes = {
  editable: PropTypes.bool,
  readOnly: PropTypes.bool,
  content: PropTypes.string,
  created_at: PropTypes.string.isRequired,
  user: PropTypes.string.isRequired,
  _metadata: PropTypes.shape({
    users: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
    })).isRequired,
  }).isRequired,
  generated: PropTypes.bool,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default withTranslation()(Comment)
