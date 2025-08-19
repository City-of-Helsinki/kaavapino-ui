import React, { Component } from 'react'
import { reduxForm } from 'redux-form'
import { DOWNLOAD_PROJECT_DATA_FORM } from '../../../constants'
import FormField from '../../input/FormField.jsx'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { phasesSelector } from '../../../selectors/phaseSelector'
import { Modal, Form } from 'semantic-ui-react'
import { getProjectSnapshot, resetProjectSnapshot } from '../../../actions/projectActions'
import { getFormValues } from 'redux-form'
import { currentProjectSelector } from '../../../selectors/projectSelector'
import { CSVLink } from 'react-csv'
import { withTranslation } from 'react-i18next'
import { isObject } from 'lodash'
import toPlaintext from 'quill-delta-to-plaintext'
import { Button } from 'hds-react'
import dayjs from 'dayjs'

import './styles.scss'

class DownloadProjectDataModal extends Component {
  getFormField = fieldProps => {
    return (
      <FormField
        className="download-project-data-field"
        {...fieldProps}
        onChange={this.onChange}
      />
    )
  }

  onChange = () => {
    const { resetProjectSnapshot } = this.props
    resetProjectSnapshot()
  }

  handleClose = () => {
    const { reset, handleClose, resetProjectSnapshot } = this.props
    reset()
    resetProjectSnapshot()
    handleClose()
  }
  getPhases = () => {
    const currentProject = this.props.currentProject
    const phases = this.props.phases

    const phaseList = []

    phases.forEach(phase => {
      if (phase.project_subtype === currentProject.subtype) {
        phaseList.push({
          label: phase.name,
          value: phase.id,
          text: phase.name
        })
      }
    })
    return phaseList
  }
  loadClicked = async () => {
    const { currentProject, getProjectSnapshot, formValues } = this.props

    const phase = formValues['phase']
    const date = formValues['date']

    await getProjectSnapshot(currentProject.id, dayjs(date).format(), phase)
  }
  getPhaseFileName = phaseId => {
    const { phases } = this.props
    let phaseFileName
    phases.forEach(phase => {
      if (phase.id === phaseId) {
        phaseFileName = phase.name
      }
    })
    return phaseFileName
  }
  getModifiedData = originalData => {
    const modifiedData = {}
    const entries = Object.entries(originalData)

    for (const [key, value] of entries) {
      let currentValue = value
      if (value && isObject(value)) {
        if (value.ops) {
          currentValue = toPlaintext(value.ops)
          currentValue = currentValue.trim()
        }
        if (value.link) {
          currentValue = `${value.description} ${value.link}`
        }
        if (value.coordinates) {
          currentValue = value.coordinates
        }
      }
      modifiedData[key] = currentValue
    }
    return modifiedData
  }

  render() {
    const { currentProject, formValues, t } = this.props
    const phaseId = formValues && formValues['phase']
    const date = formValues && formValues['date']

    const modifiedData = this.getModifiedData(
      currentProject.projectSnapshot ? currentProject.projectSnapshot.attribute_data : []
    )
    const phaseFileName = this.getPhaseFileName(phaseId)

    const fileName = phaseFileName
      ? `${currentProject.name}_${phaseFileName}.csv`
      : date
      ? `${currentProject.name}_${dayjs(date).format('YYYYMMDD_HHmmSS')}.csv`
      : null

    return (
      <Modal
        className="form-modal download-project"
        size={'tiny'}
        onClose={this.handleClose}
        open={this.props.open}
        closeIcon
      >
        <Modal.Header>{t('print-project-data.title')}</Modal.Header>
        <Modal.Content>
          {t('print-project-data.info')}
          <Form>
            <Form.Group widths="equal">
              {this.getFormField({
                field: {
                  name: 'phase',
                  label: t('print-project-data.phase-label'),
                  type: 'select',
                  choices: this.getPhases(),
                  editable: true
                }
              })}
              {this.getFormField({
                className: 'ui fluid input',
                field: {
                  name: 'date',
                  label: t('print-project-data.date-label'),
                  type: 'datetime',
                  placeHolder: t('print-project-data.date-label'),
                  editable: true
                }
              })}
            </Form.Group>
          </Form>
          <Button variant="secondary" onClick={this.loadClicked}>
            {t('print-project-data.load-project-data')}
          </Button>
          <div className="download-csv">
            {currentProject.projectSnapshot && fileName && (
              <div>
                {t('print-project-data.project-data-loaded')}
                <div>
                  <CSVLink data={[modifiedData]} separator=";" filename={fileName}>
                    {t('print-project-data.load-csv')} ({fileName})
                  </CSVLink>
                </div>
              </div>
            )}
          </div>
        </Modal.Content>
        <Modal.Actions>
          <Button variant="secondary" onClick={this.handleClose}>
            {t('print-project-data.button-close')}
          </Button>
        </Modal.Actions>
      </Modal>
    )
  }
}

DownloadProjectDataModal.propTypes = {
  open: PropTypes.bool.isRequired
}

const mapStateToProps = state => {
  return {
    phases: phasesSelector(state),
    currentProject: currentProjectSelector(state),
    formValues: getFormValues(DOWNLOAD_PROJECT_DATA_FORM)(state)
  }
}
const mapDispatchToProps = {
  getProjectSnapshot,
  resetProjectSnapshot
}

const decoratedForm = reduxForm({
  form: DOWNLOAD_PROJECT_DATA_FORM,
  initialValues: {}
})(withTranslation()(DownloadProjectDataModal))

export default connect(mapStateToProps, mapDispatchToProps)(decoratedForm)
