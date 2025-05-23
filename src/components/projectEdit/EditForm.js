import React, { Component } from 'react'
import { Form } from 'semantic-ui-react'
import { reduxForm } from 'redux-form'
import FormSection from './FormSection'
import { EDIT_PROJECT_FORM } from '../../constants'
import { Button, IconArrowUp } from 'hds-react'
import { withTranslation } from 'react-i18next'
import { isEqual } from 'lodash'
import PropTypes from 'prop-types'
import projectUtils from '../../utils/projectUtils'
import { connect } from 'react-redux'
import { fetchFieldComments, pollFieldComments } from '../../actions/commentActions'


class EditForm extends Component {

  componentDidMount() {
    this.props.fetchFieldComments(this.props.projectId)
    this.pollFieldComments = setInterval(
      () => this.props.pollFieldComments(this.props.projectId),
      60000
    )
  }

  componentWillUnmount() {
    clearInterval(this.poll)
    clearInterval(this.pollFieldComments)
    clearTimeout(this.timeout)
    clearInterval(this.autoSave)
  }

  shouldComponentUpdate(prevProps, prevState) {
    if (isEqual(prevProps, this.props) && isEqual(prevState, this.state)) {
      return false
    }
    return true
  }

  componentDidUpdate(prevProps) {
    const {
      saving,
      initialize,
      attributeData,
      geoServerData,
      submitErrors,
      initialized,
      selectedPhase
    } = this.props

    if (prevProps.selectedPhase !== selectedPhase) {
      const newInitialize = Object.assign(attributeData,
        projectUtils.getMissingGeoData(attributeData,geoServerData))

      initialize(newInitialize)
    }
    if (
      prevProps.saving &&
      !saving &&
      !submitErrors &&
      Object.keys(submitErrors).length > 0
    ) {
      const newInitialize = Object.assign(attributeData,
        projectUtils.getMissingGeoData(attributeData,geoServerData))

      initialize(newInitialize)
    }
    if (initialized !== prevProps.initialized) {
      this.props.setFormInitialized(true)
    }

    if (!isEqual(prevProps.attributeData, this.props.attributeData)) {
      const newInitialize = Object.assign(attributeData,
        projectUtils.getMissingGeoData(attributeData,geoServerData))

      initialize(newInitialize, true)
    }
  }

  render() {
    const {
      disabled,
      sections,
      attributeData,
      syncronousErrors,
      submitErrors,
      t,
      sectionIndex,
      filterFieldsArray,
      highlightedTag,
      fieldCount,
      showSection,
      deadlines,
      isCurrentPhase,
      selectedPhase,
      phaseIsClosed
    } = this.props
    return (
      <>
        {showSection ?
        <Form className="form-container" autoComplete="off" aria-live="polite" aria-atomic="true" id="accordion-title" tabIndex="0">
          <div className="edit-form-buttons" aria-hidden="true">
            {/*<Shoutbox project={projectId} />*/}
          </div>
            <FormSection
              syncronousErrors={syncronousErrors}
              submitErrors={submitErrors}
              formName={EDIT_PROJECT_FORM}
              key={sections + sectionIndex}
              handleSave={this.props.handleSave}
              handleLockField={this.props.handleLockField}
              handleUnlockField={this.props.handleUnlockField}
              section={sections[sectionIndex]}
              disabled={disabled}
              attributeData={attributeData}
              setRef={this.props.setRef}
              unlockAllFields={this.props.unlockAllFields}
              filterFieldsArray={filterFieldsArray}
              highlightedTag={highlightedTag}
              fieldCount={fieldCount}
              deadlines={deadlines}
              isCurrentPhase={isCurrentPhase}
              selectedPhase={selectedPhase}
              phaseIsClosed={phaseIsClosed}
            />
          <Button
            variant="supplementary"
            iconRight={<IconArrowUp />}
            className="scroll-to-top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div>{t('footer.to-start')}</div>
          </Button>
        </Form>
        :
        <>
        </>
        }
      </>
    )
  }
}

EditForm.propTypes = {
  deadlines:PropTypes.array,
  isCurrentPhase:PropTypes.bool,
  selectedPhase: PropTypes.number,
  phaseIsClosed: PropTypes.bool,
  fetchFieldComments: PropTypes.func,
  pollFieldComments: PropTypes.func
}

const mapDispatchToProps = {
  fetchFieldComments,
  pollFieldComments,
}

const decoratedForm = reduxForm({
  form: EDIT_PROJECT_FORM,
  enableReinitialize: true,
  keepDirtyOnReinitialize: false
})(EditForm)

export default connect(null,mapDispatchToProps)(withTranslation()(decoratedForm))
