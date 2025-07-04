import React, { useEffect, useState } from 'react'
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
import CommentMobile from './CommentMobile'
import { TextInput, Button } from 'hds-react'

function CommentsMobile({
  comments,
  fetchComments,
  projectId,
  userId,
  editComment,
  deleteComment,
  createComment
}) {
  const [newCommentValue, setNewCommentValue] = useState('')

  useEffect(() => {
    fetchComments(projectId)
  }, [comments])

  const begin = comments.length < 10 ? comments.length : 10

  const handleChange = e => {
    setNewCommentValue(e.target.value)
  }

  const handleSubmit = () => {
    if (newCommentValue.trim()) {
      createComment(projectId, newCommentValue)
      setNewCommentValue('')
    }
  }

  return (
      <>
    <div className="comment-list-container-mobile">
      <div className="comment-list-mobile">
        {comments.slice(comments.length - begin, comments.length).map((comment, i) => (
          <CommentMobile
            key={`${i}-${comment.id}`}
            {...comment}
            editable={userId === comment.user}
            onSave={content => editComment(projectId, comment.id, content)}
            onDelete={() => deleteComment(projectId, comment.id)}
          />
        ))}
      </div>
      </div>
      <div className="comment-submit-container-mobile">
        <TextInput
          onChange={handleChange}
          type="text"
          placeholder="Lisää kommentti"
          value={newCommentValue}
          className="comment-text-field"
        />

        <Button className="send-button" variant="primary" onClick={handleSubmit}>
          Lähetä
        </Button>
      </div>
    </>
  )
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

export default connect(mapStateToProps, mapDispatchToProps)(CommentsMobile)
