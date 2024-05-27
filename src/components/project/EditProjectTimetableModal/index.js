/* This file includes implementation of editing floor area, but currently only with mock data */

import React, { Component, createRef } from 'react'
import PropTypes from 'prop-types'
import { Modal } from 'semantic-ui-react'
import { reduxForm, getFormSubmitErrors, getFormValues } from 'redux-form'
import { connect } from 'react-redux'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../../constants'
import './styles.scss'
import { deadlineSectionsSelector } from '../../../selectors/schemaSelector'
import { withTranslation } from 'react-i18next'
import { deadlinesSelector } from '../../../selectors/projectSelector'
import { Button,IconInfoCircle } from 'hds-react'
import { isEqual } from 'lodash'
import VisTimelineGroup from '../../ProjectTimeline/VisTimelineGroup'
import * as visdata from 'vis-data'

class EditProjectTimeTableModal extends Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: false,
      visValues:false,
      item: null,
      items: false,
      groups: false
    }
    this.timelineRef = createRef();
  }

  getTimelineData = (deadlines,formValues) => {
      const phaseData = []
      let deadLineGroups = []
      let nestedDeadlines = []
      let numberOfPhases = 1
      let type = ""

      let startDate = false
      let endDate = false
      let style = ""

      let dashStart = false
      let dashEnd = false
      let dashedStyle = ""

      let innerStart = false
      let innerEnd = false
      let innerStyle = "" 
      
      for (let i = 0; i < deadlines.length; i++) {
        if (!deadLineGroups.some(item => item.id === deadlines[i].deadline.phase_name)) {
          deadLineGroups.push({
            id: deadlines[i].deadline.phase_name,
            content: deadlines[i].deadline.phase_name,
            showNested: true,
            nestedGroups: deadlines[i].deadline.phase_name === "Käynnistys" || deadlines[i].deadline.phase_name === "Hyväksyminen" || deadlines[i].deadline.phase_name === "Voimaantulo" ? false : []
          });
        }

        if(formValues[deadlines[i].deadline.attribute]){
          if(formValues[deadlines[i].deadline.attribute] !== deadlines[i].date){
            deadlines[i].date = formValues[deadlines[i].deadline.attribute]
            //UPDATE ITEM SOMEHOW with formvalues info
          }
        }

        if(deadlines[i].deadline.deadline_types.includes('phase_start')){
          startDate = deadlines[i].date
          style = deadlines[i].deadline.phase_color
          //.setHours(23,59,59,0)
        }
        else if(deadlines[i].deadline.deadline_types.includes('dashed_start')){
          dashStart = deadlines[i].date
          dashedStyle = "inner"
        }
        else if(deadlines[i].deadline.deadline_types.includes('dashed_end') && deadlines[i].deadline.deadline_types.includes('inner_start')){
          //Esilläolo
          type="esillaolo"
          dashEnd = deadlines[i].date
          innerStart = deadlines[i].date
        }
        else if(deadlines[i].deadline.deadline_types.includes('dashed_end') && deadlines[i].deadline.deadline_types.includes('milestone')){
          //Lautakunta
          type="lautakunta"
          dashEnd = deadlines[i].date
        }
        else if(deadlines[i].deadline.deadline_types.includes('inner_end') && deadlines[i].deadline.date_type !== "Arkipäivät"){
          innerEnd = deadlines[i].date
          innerStyle = "inner-end"
        }
        else if(deadlines[i].deadline.deadline_types.includes('phase_end') && deadlines[i].deadline.date_type !== "Arkipäivät"){
          endDate = deadlines[i].date
          //new Date .setHours(0,0,0,0)
        }

        if(startDate && endDate){
          phaseData.push({
            id: numberOfPhases,
            content: '',
            start:startDate,
            end:endDate,
            className:style,
            phaseID:deadlines[i].deadline.phase_id,
            phase:true,
            group:deadlines[i].deadline.phase_name,
          })
          startDate = false
          endDate = false
          numberOfPhases++
        }
        else if(dashStart && dashEnd && type === "lautakunta"){
          phaseData.push({
            id: numberOfPhases,
            content: "",
            start:dashStart,
            end:dashEnd,
            className:dashedStyle,
            title: deadlines[i].deadline.attribute,
            phaseID:deadlines[i].deadline.phase_id,
            phase:false,
            group:numberOfPhases,
            locked:false
          })
          dashEnd = false
          deadLineGroups.at(-1).nestedGroups.push(numberOfPhases)
          nestedDeadlines.push({
            id: numberOfPhases,
            content: deadlines[i].deadline.deadlinegroup?.includes("lautakunta") ? "Lautakunta" : "Esilläolo",
            abbreviation:deadlines[i].abbreviation,
            deadlinegroup: deadlines[i].deadline.deadlinegroup,
            deadlinesubgroup: deadlines[i].deadline.deadlinesubgroup,
            locked:false
          });
          numberOfPhases++
        }
        else if(innerStart && innerEnd && type === "esillaolo"){
          phaseData.push({
            id: numberOfPhases,
            content: "",
            start:dashStart,
            end:innerEnd,
            className:innerStyle,
            title: deadlines[i].deadline.attribute,
            phaseID:deadlines[i].deadline.phase_id,
            phase:false,
            group:numberOfPhases,
            locked:false
          })
          innerEnd = false
          deadLineGroups.at(-1).nestedGroups.push(numberOfPhases)
          nestedDeadlines.push({
            id: numberOfPhases,
            content: deadlines[i].deadline.deadlinegroup?.includes("lautakunta") ? "Lautakunta" : "Esilläolo",
            abbreviation:deadlines[i].abbreviation,
            deadlinegroup: deadlines[i].deadline.deadlinegroup,
            deadlinesubgroup: deadlines[i].deadline.deadlinesubgroup,
            locked:false
          });
          numberOfPhases++
        }
      }

      return [deadLineGroups,nestedDeadlines,phaseData]
  }

  getChangedItem(oldFormValues, newFormValues) {
    if (typeof oldFormValues !== 'object' || oldFormValues === null || typeof newFormValues !== 'object' || newFormValues === null) {
      return false;
    }
  
    for (let key in newFormValues) {
      if (Object.prototype.hasOwnProperty.call(oldFormValues, key) && oldFormValues[key] !== newFormValues[key]) {
        return { [key]: newFormValues[key] };
      }
    }
    return false;
  }

  updateItem = (prevValues, values) => {
    //Update one item
    console.log(prevValues,values)
    //const changedItem = this.getChangedItem(prevValues, values);

  };

  updateTimeline = (prevValues, values) => {
    //Updates all items
    console.log(prevValues,values)
/*     const changedItem = this.getChangedItem(prevValues, values);
    console.log(changedItem)
    this.state.items.map(item => console.log(item));
    if (changedItem) {
      this.setState(prevState => ({
        items: changedItem ? prevState.items.map(item => item.id === changedItem.id ? changedItem : item) : prevState.items,
      }))
    } */
  };

  componentDidMount() {
    const { initialize, attributeData, deadlines } = this.props
    initialize(attributeData)

    if(deadlines && attributeData){

      let items = new visdata.DataSet()
      let groups = new visdata.DataSet();

      let [deadLineGroups,nestedDeadlines,phaseData] = this.getTimelineData(deadlines,attributeData)

      groups.add(deadLineGroups);
      groups.add(nestedDeadlines);
      items.add(phaseData)
      items.add([{
        id: "holiday_summer",
        start: "2024-07-01",
        end: "2024-07-31",
        type: "background",
        className: "negative",
      },
      {
        id: "holiday_winter",
        start: "2024-12-27",
        end: "2024-12-31",
        type: "background",
        className: "negative",
      },]
      )
      console.log("changevisvalues")
      this.setState({items,groups,visValues:attributeData})
    }
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
      submitFailed,
      formValues,
      deadlines
    } = this.props

    if(prevProps.formValues && prevProps.formValues !== formValues){
      console.log(prevProps.formValues,formValues,"Change visvalues")
      if(deadlines && formValues){
  
        let [deadLineGroups,nestedDeadlines,phaseData] = this.getTimelineData(deadlines,formValues)
        
        // Update the existing data
        this.state.groups.update(deadLineGroups);
        this.state.groups.update(nestedDeadlines);
        this.state.items.update(phaseData)

        console.log("changevisvalues")
        this.setState({visValues:formValues})
      }
      //this.handleSubmit()
      //For visupdate planning below
      //this.updateTimeline(prevProps.formValues,formValues)
    }

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
    const { open, formValues, deadlines, deadlineSections, t, formSubmitErrors, projectPhaseIndex, currentProject, allowedToEdit } = this.props

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
        <Modal.Header><IconInfoCircle size="m" aria-hidden="true"/>{t('deadlines.modify-timeline')}</Modal.Header>
        <Modal.Content>
            <VisTimelineGroup
              timelineRef={this.timelineRef}
              options={this.state.options}
              groups={this.state.groups}
              changedItem={this.state.item}
              items={this.state.items}
              deadlines={deadlines} 
              visValues={this.state.visValues} 
              deadlineSections={deadlineSections}
              formSubmitErrors={formSubmitErrors}
              projectPhaseIndex={projectPhaseIndex}
              archived={currentProject?.archived}
              allowedToEdit={allowedToEdit}
              toggleTimelineModal={this.state.toggleTimelineModal}
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
