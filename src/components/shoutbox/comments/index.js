import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  fetchComments,
  fetchUnreadCommentsCount,
  pollComments,
  createComment,
  editComment,
  deleteComment,
  increaseAmountOfCommentsToShow,
  fetchFieldComments,
  pollFieldComments,
  clearComments
} from '../../../actions/commentActions'
import {
  commentsSelector,
  commentsLoadingSelector,
  pollingCommentsSelector,
  amountOfCommentsToShowSelector
} from '../../../selectors/commentSelector'
import { userIdSelector } from '../../../selectors/authSelector'
import Comment from './Comment'
import { TextInput, Button } from 'hds-react'
import { withTranslation } from 'react-i18next';

class Comments extends Component {
  constructor(props) {
    super(props)
    this.commentsRef = React.createRef()
    this.prevHeight = 0
    this.state = {
      value: ''
    }
  }

  componentDidMount() {
    this.props.fetchComments(this.props.project)
    this.props.fetchFieldComments(this.props.project)
    this.props.fetchUnreadCommentsCount(this.props.project)
    this.poll = setInterval(() => this.props.pollComments(this.props.project), 60000)
    this.pollFieldComments = setInterval(
      () => this.props.pollFieldComments(this.props.project),
      60000
    )
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.comments.length < this.props.comments.length &&
      !prevProps.pollingComments
    ) {
      const comments = this.commentsRef.current
      if (comments) {
        comments.scrollTop = comments.scrollHeight
      }
    } else if (prevProps.amountOfCommentsToShow !== this.props.amountOfCommentsToShow) {
      const comments = this.commentsRef.current
      if (prevProps.amountOfCommentsToShow < this.props.amountOfCommentsToShow) {
        comments.scrollTop = comments.scrollHeight - this.prevHeight
      } else {
        comments.scrollTop = comments.scrollHeight
      }
    }
  }

  componentWillUnmount() {
    clearInterval(this.poll)
    this.props.clearComments()
  }

  handleChange = e => {
    this.setState({ value: e.target.value })
  }

  handleSubmit = () => {
    if (this.state.value.trim()) {
      this.props.createComment(this.props.project, this.state.value)
      this.setState({ value: '' })
    }
  }

  handleScroll = () => {
    if (this.commentsRef.current.scrollTop < 1) {
      const { pollingComments, increaseAmountOfCommentsToShow } = this.props
      if (!pollingComments) {
        increaseAmountOfCommentsToShow()
        const comments = this.commentsRef.current
        this.prevHeight = comments.scrollHeight
      }
    }
  }

  render() {
    const {
      comments,
      commentsLoading,
      userId,
      amountOfCommentsToShow,
      pollingComments,
      t
    } = this.props
    const begin =
      comments.length < amountOfCommentsToShow ? comments.length : amountOfCommentsToShow

    return (
      <div className="comment-list-container">
        <h2 className="comment-list-header">{t('shoutbox.title')}</h2>
        <div className="comment-list" ref={this.commentsRef} onScroll={this.handleScroll}>
          {(commentsLoading || pollingComments) && (
            <p className="comments-message">{t('shoutbox.loading')}</p>
          )}
          {!commentsLoading && comments.length === 0 && (
            <p className="comments-message">{t('shoutbox.no-comments')}</p>
          )}
          {comments.slice(comments.length - begin, comments.length).map((comment, i) => (
            <Comment
              key={`${i}-${comment.id}`}
              {...comment}
              editable={userId === comment.user}
              onSave={content =>
                this.props.editComment(this.props.project, comment.id, content)
              }
              onDelete={() => this.props.deleteComment(this.props.project, comment.id)}
            />
          ))}
        </div>
        <div className="comment-submit-container">
          <TextInput
            onChange={this.handleChange}
            type="text"
            placeholder={t('shoutbox.add-comment')}
            value={this.state.value}
            className="comment-text-field"
          />

          <Button className="send-button" variant="primary" onClick={this.handleSubmit}>
            {t('shoutbox.send')}
          </Button>
        </div>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  comments: commentsSelector(state),
  commentsLoading: commentsLoadingSelector(state),
  userId: userIdSelector(state),
  pollingComments: pollingCommentsSelector(state),
  amountOfCommentsToShow: amountOfCommentsToShowSelector(state)
})

const mapDispatchToProps = {
  fetchComments,
  fetchUnreadCommentsCount,
  pollComments,
  createComment,
  editComment,
  deleteComment,
  increaseAmountOfCommentsToShow,
  fetchFieldComments,
  pollFieldComments,
  clearComments
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(Comments))
