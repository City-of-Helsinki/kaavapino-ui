import React, { Component } from 'react'
import { Form } from 'semantic-ui-react'
import { reduxForm } from 'redux-form'
import FormSection from './FormSection'
import FormButton from '../common/FormButton'
import { EDIT_PROJECT_FORM } from '../../constants'
import Shoutbox from '../shoutbox'
import { Button, IconArrowUp } from 'hds-react'
import { withTranslation } from 'react-i18next'
import { isEqual } from 'lodash'

class EditForm extends Component {
  componentWillUnmount() {
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
      const newInitialize = Object.assign(attributeData, geoServerData)

      initialize(newInitialize)
    }
    if (
      prevProps.saving &&
      !saving &&
      !submitErrors &&
      Object.keys(submitErrors).length > 0
    ) {
      const newInitialize = Object.assign(attributeData, geoServerData)

      initialize(newInitialize)
    }
    if (initialized !== prevProps.initialized) {
      this.props.setFormInitialized(true)
    }

    if (!isEqual(prevProps.attributeData, this.props.attributeData)) {
      const newInitialize = Object.assign(attributeData, geoServerData)

      initialize(newInitialize, true)
    }
  }

  render() {
    const {
      disabled,
      sections,
      title,
      projectId,
      showEditFloorAreaForm,
      showEditProjectTimetableForm,
      attributeData,
      syncronousErrors,
      submitErrors,
      isExpert,
      t
    } = this.props

    return (
      <Form className="form-container" autoComplete="off">
        <h2 id="accordion-title">{title}</h2>
        <div className="edit-form-buttons">
          {isExpert && (
            <FormButton
              value={t('deadlines.button-title')}
              variant="secondary"
              onClick={showEditProjectTimetableForm}
            />
          )}
          {isExpert && (
            <FormButton
              value={t('floor-areas.button-title')}
              variant="secondary"
              onClick={showEditFloorAreaForm}
            />
          )}
          <Shoutbox project={projectId} />
        </div>
        {sections.map((section, i) => (
          <FormSection
            syncronousErrors={syncronousErrors}
            submitErrors={submitErrors}
            formName={EDIT_PROJECT_FORM}
            key={i}
            handleSave={this.props.handleSave}
            handleLockField={this.props.handleLockField}
            handleUnlockField={this.props.handleUnlockField}
            section={section}
            disabled={disabled}
            attributeData={attributeData}
            setRef={this.props.setRef}
          />
        ))}
        <Button
          variant="supplementary"
          iconRight={<IconArrowUp />}
          className="scroll-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div>{t('footer.to-start')}</div>
        </Button>
      </Form>
    )
  }
}

const decoratedForm = reduxForm({
  form: EDIT_PROJECT_FORM,
  enableReinitialize: true,
  keepDirtyOnReinitialize: true
})(EditForm)

export default withTranslation()(decoratedForm)
