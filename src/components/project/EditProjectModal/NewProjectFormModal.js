import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Modal, Form } from 'semantic-ui-react'
import { reduxForm, getFormSubmitErrors, getFormValues } from 'redux-form'
import projectUtils from '../../../utils/projectUtils'
import './NewProjectFormModal.scss'
import { connect } from 'react-redux'
import { NEW_PROJECT_FORM } from '../../../constants'
import { newProjectSubtypeSelector } from '../../../selectors/formSelector'
import FormField from '../../input/FormField'
import { Button } from 'hds-react'
import { withTranslation } from 'react-i18next'

const PROJECT_NAME = 'name'
const USER = 'user'
const TYPE = 'projektityyppi'
const PUBLIC = 'public'
const SUB_TYPE = 'subtype'
const CREATE_PRINCIPLES = 'create_principles'
const CREATE_DRAFT = 'create_draft'

// TODO: Change when attbitute_data returns correct project type
const PROJECT_TYPE_DEFAULT = 'asemakaava'

class NewProjectFormModal extends Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: false
    }
  }
  componentDidMount() {
    const { initialize, currentProject } = this.props

    if (!currentProject) {
      initialize({
        projektityyppi: PROJECT_TYPE_DEFAULT
      })
      return
    }
    initialize({
      onhold: currentProject.onhold,
      public: currentProject.public,
      projektityyppi: PROJECT_TYPE_DEFAULT,
      user: currentProject.user,
      subtype: currentProject.subtype,
      create_draft: currentProject.create_draft,
      create_principles: currentProject.create_principles,
      name: currentProject.name
    })
  }

  componentDidUpdate(prevProps) {
    if (prevProps.submitting && this.props.submitSucceeded) {
      this.handleClose()
    } else if (
      prevProps.submitting &&
      this.props.submitFailed &&
      !this.props.submitSucceeded &&
      this.state.loading
    ) {
      this.setState({ loading: false })
    }
  }

  formatUsers = () => {
    return this.props.users.map(user => {
      return {
        value: user.id,
        label: projectUtils.formatUsersName(user)
      }
    })
  }

  handleSubmit = () => {
    this.setState({ loading: true })
    this.props.handleSubmit()
  }

  handleClose = () => {
    this.props.reset()
    this.props.handleClose()
    this.setState({ loading: false })
  }
  getError = (error, fieldName) => {
    // In case that there are field related errors, show errors.
    // Required field error is handled differently
    if (error) {
      if (fieldName === USER) {
        return error.user
      }
    }
    return error
  }

  getFormField = fieldProps => {
    const { formSubmitErrors, formValues } = this.props

    return (
      <FormField
        {...fieldProps}
        submitErrors={formSubmitErrors}
        formValues={formValues}
        insideFieldset={true}
      />
    )
  }

  render() {
    const { loading } = this.state
    const { currentProject, selectedSubType, initialValues, formValues, t, isEditable } = this.props
    const showXLProjectOptions = selectedSubType === 5
    const isEdit = !!currentProject

    const isValidXLProject =
      formValues && (formValues.create_principles || formValues.create_draft)

    const hideSaveButton = () => {
      if (!formValues) {
        return true
      }
      if (formValues.name && formValues.user && formValues.subtype) {
        if (selectedSubType === 5) {
          return !isValidXLProject
        }
        return false
      }
      return true
    }

    const hideSave = hideSaveButton()

    return (
      <Modal
        className="form-modal project-edit"
        size={'small'}
        onClose={this.props.handleClose}
        open={this.props.modalOpen}
        closeIcon
      >
        <Modal.Header>
          {isEdit ? t('project-base.modify') : t('project-base.add')}
        </Modal.Header>
        <Modal.Content>
          <Form>
            <Form.Group widths="equal">
              {this.getFormField({
                className: 'ui fluid input',

                field: {
                  name: TYPE,
                  label: t('project-base.labels.project-type'),
                  disabled: false,
                  type: 'set',
                  // Add only option.
                  choices: [
                    {
                      label: t('project-base.project-type-default'),
                      value: PROJECT_TYPE_DEFAULT
                    }
                  ],
                  editable: false,
                  multiple: false
                }
              })}
            </Form.Group>
            <Form.Group widths="equal">
              {this.getFormField({
                field: {
                  name: PROJECT_NAME,
                  label: t('project-base.labels.name'),
                  type: 'text',
                  editable: isEditable
                }
              })}
              {this.getFormField({
                className: 'ui fluid input user-selection',
                field: {
                  name: USER,
                  label: t('project-base.labels.responsible'),
                  type: 'search-select',
                  choices: this.formatUsers(),
                  editable: isEditable
                }
              })}
            </Form.Group>
            {this.getFormField({
              field: {
                name: PUBLIC,
                label: t('project-base.labels.is-visible'),
                type: 'boolean',
                editable: isEditable
              },
              double: true
            })}
            {formValues && formValues.public && !initialValues.public && (
              <div className="warning-box">
                {t('project-base.warning-visibility-change')}
              </div>
            )}
            <div className="subtype-input-container">
              {this.getFormField({
                field: {
                  name: SUB_TYPE,
                  label: t('project-base.labels.process-size'),
                  type: 'radio',
                  editable: isEditable,
                  options: [
                    { value: 1, label: 'XS' },
                    { value: 2, label: 'S' },
                    { value: 3, label: 'M' },
                    { value: 4, label: 'L' },
                    { value: 5, label: 'XL' }
                  ]
                }
              })}
            </div>
            {formValues &&
              initialValues.subtype &&
              formValues.subtype !== initialValues.subtype && (
                <div className="warning-box">
                  {t('project-base.warning-process-change')}
                </div>
              )}
            {showXLProjectOptions && (
              <>
                <h4>{t('project-base.choose-title')}</h4>
                {this.getFormField({
                  field: {
                    name: CREATE_PRINCIPLES,
                    label: t('project-base.labels.principles'),
                    type: 'toggle'
                  }
                })}
                {this.getFormField({
                  field: {
                    name: CREATE_DRAFT,
                    label: t('project-base.labels.draft'),
                    type: 'toggle'
                  }
                })}
              </>
            )}
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <div className="form-buttons">
            <Button variant="secondary" disabled={loading} onClick={this.handleClose}>
              {t('project.cancel')}
            </Button>
            <Button
              variant="primary"
              disabled={loading || hideSave || !isEditable}
              loadingText={isEdit ? t('project.save') : t('project.create-project')}
              isLoading={loading}
              type="submit"
              onClick={this.handleSubmit}
            >
              {isEdit ? t('project.save') : t('project.create-project')}
            </Button>
          </div>
        </Modal.Actions>
      </Modal>
    )
  }
}

NewProjectFormModal.propTypes = {
  modalOpen: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  selectedSubType: newProjectSubtypeSelector(state),
  formSubmitErrors: getFormSubmitErrors(NEW_PROJECT_FORM)(state),
  formValues: getFormValues(NEW_PROJECT_FORM)(state)
})

const decoratedForm = reduxForm({
  form: NEW_PROJECT_FORM,
  initialValues: { public: true }
})(NewProjectFormModal)

export default connect(mapStateToProps, null)(withTranslation()(decoratedForm))
