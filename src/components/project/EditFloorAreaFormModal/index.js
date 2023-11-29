/* This file includes inmplementation of editing floor area, but currently only with mock data */

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Modal, Form } from 'semantic-ui-react'
import { reduxForm, getFormSubmitErrors, getFormValues } from 'redux-form'
import { connect } from 'react-redux'
import { EDIT_FLOOR_AREA_FORM } from '../../../constants'
import FormField from '../../input/FormField'
import Collapse from '../../common/collapse'
import './styles.scss'
import { floorAreaSectionsSelector } from '../../../selectors/schemaSelector'
import { withTranslation } from 'react-i18next'
import { Button } from 'hds-react'


const FloorAreaTotals = ({ formValues, floorAreaSections, attributeData }) => {
  let values
  if(!formValues){
    values = attributeData
  }
  else{
    values = formValues
  }
  // Would love a more rubust check than string includes if one becomes available
  const totalSection = floorAreaSections.find(section =>
    section.title.includes('yhteensä')
  )

  return (
    <div className="floor-area-totals">
      <div className="floor-area-totals-header">Kerrosalan lisäys yhteensä</div>
      <div className="totals">
        {totalSection.fields.map((totalMatrix, i) => (
          <FormField
            field={totalMatrix}
            attributeData={attributeData}
            key={i}
            formValues={values}
            formName={EDIT_FLOOR_AREA_FORM}
            isFloorCalculation={true}
          />
        ))}
      </div>
    </div>
  )
}

class EditFloorAreaFormModal extends Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: false
    }
  }
  componentDidMount () {
    const { initialize, attributeData } = this.props
    initialize(attributeData)
  }

  componentWillUnmount() {
    clearTimeout(this.timeout)
    clearInterval(this.autoSave)
  }

  componentDidUpdate(prevProps) {
    const { saving, initialize, formValues } = this.props
    /* handle submit success / failure */

    if (
      prevProps.submitting &&
      this.props.submitFailed &&
      !this.props.submitSucceeded &&
      this.state.loading
    ) {
      this.setState({ loading: false })
    }
    if (prevProps.saving && !saving) {
      initialize(formValues)
    }
  }

  handleSubmit = () => {
    this.setState({ loading: true })
    if(typeof this.props.saveProjectFloorArea === "function"){
      this.props.saveProjectFloorArea()
    }
  }

  handleClose = () => {
    this.props.handleClose()
    this.setState({ loading: false })
  }

  getFloorAreaTotalsComponent = () => {
    const { floorAreaSections, formValues, attributeData } = this.props
    return <FloorAreaTotals formValues={formValues} attributeData={attributeData} floorAreaSections={floorAreaSections} />
  }

  getFormField = (fieldProps, key) => {
    const { formSubmitErrors, formValues, attributeData } = this.props
    const error =
      formSubmitErrors && fieldProps.field && formSubmitErrors[fieldProps.field.name]
    return (
      <div key={key}>
        <FormField
          {...fieldProps}
          formName={EDIT_FLOOR_AREA_FORM}
          attributeData={attributeData}
          error={error}
          formValues={formValues}
          isFloorCalculation={true}
          className="modal-field"
        />
      </div>
    )
  }

  renderSection = (section, sectionIndex) => {
    // "Yhteesä" section is handled separately
    if (section.title.includes('yhteensä')) {
      return null
    }
    return (
      <Collapse title={section.title} key={sectionIndex}>
        {section.fields.map((field, fieldIndex) =>
          this.getFormField({ field }, `${sectionIndex} - ${fieldIndex}`)
        )}
      </Collapse>
    )
  }

  render() {
    const { loading } = this.state
    const { floorAreaSections, t } = this.props

    return (
      <Modal
        className="form-modal edit-floor-area-form-modal"
        size={'small'}
        onClose={this.handleClose}
        open={this.props.open}
        closeIcon
      >
        <Modal.Header>{t('floor-areas.title')}</Modal.Header>
        <Modal.Content>
          {this.getFloorAreaTotalsComponent()}
          <Form>
            {floorAreaSections &&
              floorAreaSections.map((section, sectionIndex) =>
                this.renderSection(section, sectionIndex)
              )}
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <span className="form-buttons">
            <Button  variant="secondary" disabled={loading} onClick={this.handleClose}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              disabled={loading}
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

EditFloorAreaFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  formSubmitErrors: getFormSubmitErrors(EDIT_FLOOR_AREA_FORM)(state),
  floorAreaSections: floorAreaSectionsSelector(state),
  formValues: getFormValues(EDIT_FLOOR_AREA_FORM)(state)
})

const floorAreaForm = reduxForm({
  form: EDIT_FLOOR_AREA_FORM,
  enableReinitialize: true
})(EditFloorAreaFormModal)

export default connect(mapStateToProps, () => ({}))(withTranslation()(floorAreaForm))
