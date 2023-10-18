import React, { Component } from 'react'
import { Form } from 'semantic-ui-react'
import { reduxForm } from 'redux-form'
import FormSection from './FormSection'
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
      projectId,
      attributeData,
      syncronousErrors,
      submitErrors,
      t,
      sectionIndex,
      filterFieldsArray,
      highlightedTag,
      fieldCount,
      showSection,
      deadlines
    } = this.props
    return (
      <>
      {showSection ?
      <Form className="form-container" autoComplete="off" aria-live="polite" aria-atomic="true" id="accordion-title" tabIndex="0">
        <div className="edit-form-buttons">
          <Shoutbox project={projectId} />
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

const decoratedForm = reduxForm({
  form: EDIT_PROJECT_FORM,
  enableReinitialize: true,
  keepDirtyOnReinitialize: true
})(EditForm)

export default withTranslation()(decoratedForm)
