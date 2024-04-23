/* This file includes implementation of editing floor area, but currently only with mock data */

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Modal } from 'semantic-ui-react'
import { reduxForm, getFormSubmitErrors, getFormValues } from 'redux-form'
import { connect } from 'react-redux'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../../constants'
import './styles.scss'
import { deadlineSectionsSelector } from '../../../selectors/schemaSelector'
import { withTranslation } from 'react-i18next'
import { deadlinesSelector } from '../../../selectors/projectSelector'
import { Button } from 'hds-react'
import { isEqual } from 'lodash'
import VisTimelineGroup from '../../ProjectTimeline/VisTimelineGroup'

class EditProjectTimeTableModal extends Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: false
    }
  }

  componentDidMount() {
    const { initialize, attributeData } = this.props
    initialize(attributeData)
  }

  shouldComponentUpdate(prevProps, prevState) {
    if (isEqual(prevProps, this.props) && isEqual(prevState, this.state)) {
      return false
    }
    return true
  }

  setLoadingFalse = () => {
    if (this.state.loading) {
      this.setState({ loading: false })
    }
  }

  componentDidUpdate(prevProps) {
    const {
      saving,
      initialize,
      attributeData,
      submitFailed
    } = this.props

    if (prevProps.submitting && submitFailed) {
      this.setLoadingFalse()
    }
    if (prevProps.saving && !saving) {
      initialize(attributeData)
    }
  }

  handleSubmit = () => {
    this.setState({ loading: true })
    const errors = this.props.handleSubmit()

    if (errors) {
      this.setState({ loading: false })
    }
  }

  handleClose = () => {
    this.props.handleClose()
  }

  render() {
    const { loading } = this.state
    const { open, formValues, deadlines, deadlineSections, t, formSubmitErrors, projectPhaseIndex, currentProject, allowedToEdit, attributeData } = this.props

    if (!formValues) {
      return null
    }

    return (
      <Modal
        size="large"
        open={open}
        closeIcon={false}
        closeOnDocumentClick={false}
        closeOnDimmerClick={false}
        className='modal-center-big'
      >
        <Modal.Header>{t('deadlines.title')}</Modal.Header>
        <Modal.Content>
          <VisTimelineGroup
            attributeData={attributeData}
            deadlines={deadlines} 
            formValues={formValues} 
            deadlineSections={deadlineSections}
            formSubmitErrors={formSubmitErrors}
            projectPhaseIndex={projectPhaseIndex}
            archived={currentProject?.archived}
            allowedToEdit={allowedToEdit}
            />
        </Modal.Content>
        <Modal.Actions>
          <span className="form-buttons">
            <Button variant="secondary" disabled={loading} onClick={this.handleClose}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              disabled={loading || !this.props.allowedToEdit}
              loadingText={t('common.save')}
              isLoading={loading}
              type="submit"
              onClick={this.handleSubmit}
            >
              {t('common.save')}
            </Button>
          </span>
        </Modal.Actions>
      </Modal>
    )
  }
}

EditProjectTimeTableModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  projectPhaseIndex: PropTypes.number,
  currentProject: PropTypes.object,
  archived: PropTypes.bool,
  submitting: PropTypes.bool,
  allowedToEdit: PropTypes.bool,
  attributeData: PropTypes.object,
}

const mapStateToProps = state => ({
  formSubmitErrors: getFormSubmitErrors(EDIT_PROJECT_TIMETABLE_FORM)(state),
  deadlineSections: deadlineSectionsSelector(state),
  formValues: getFormValues(EDIT_PROJECT_TIMETABLE_FORM)(state),
  deadlines: deadlinesSelector(state)
})

const decoratedForm = reduxForm({
  form: EDIT_PROJECT_TIMETABLE_FORM
})(withTranslation()(EditProjectTimeTableModal))

export default connect(mapStateToProps)(decoratedForm)
