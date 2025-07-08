import React, { useState, useRef } from 'react'
import { Button } from 'semantic-ui-react'
import './shoutbox.scss'
import Comments from './comments'
import { useOutsideClick } from '../../hooks/useOutsideClick'
import { connect } from 'react-redux'
import { unreadCommentsCountSelector } from '../../selectors/commentSelector'
import { markCommentsAsRead } from '../../actions/commentActions'
import { IconCross } from 'hds-react'
import { useTranslation } from 'react-i18next'

const ShoutBoxButton = ({ unreadCommentsCount, ...rest }) => {
  const { t } = useTranslation()

  return (
    <Button className="shoutbox-button" {...rest}>
      <div>{t('shoutbox.title')}</div>
      <div className="comment-icon-container">
        <div className="comment-icon" />
        {!!unreadCommentsCount && (
          <div className="unread-comments-count">{unreadCommentsCount}</div>
        )}
      </div>
    </Button>
  )
}

const Shoutbox = props => {
  const { markCommentsAsRead, project, unreadCommentsCount } = props

  const [open, setOpen] = useState(false)
  const shoutboxRef = useRef(null)
  const toggleOpen = () => {
    markCommentsAsRead(project)
    setOpen(!open)
  }
  const handleOutsideClick = () => {
    if (open) {
      toggleOpen()
    }
  }

  useOutsideClick(shoutboxRef, handleOutsideClick)

  const countToShow = unreadCommentsCount > 9 ? '!' : unreadCommentsCount

  return (
    <>
      <div className={`shoutbox ${open ? 'open' : ''}`} ref={shoutboxRef}>
        <ShoutBoxButton onClick={toggleOpen} unreadCommentsCount={countToShow} />
        <div className="comment-list-wrapper">
          <button onClick={toggleOpen} className="shoutbox-close-icon">
            <IconCross />
          </button>
          <Comments project={project} />
        </div>
      </div>
    </>
  )
}
const mapStateToProps = state => ({
  unreadCommentsCount: unreadCommentsCountSelector(state)
})

const mapDispatchToProps = {
  markCommentsAsRead
}

export default connect(mapStateToProps, mapDispatchToProps)(Shoutbox)
