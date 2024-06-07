/* This file includes implementation of editing floor area, but currently only with mock data */

import React, { Component, createRef } from 'react'
import PropTypes from 'prop-types'
import { Modal } from 'semantic-ui-react'
import { reduxForm, getFormSubmitErrors, getFormValues, change } from 'redux-form'
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
import ConfirmCancelModal from '../../common/ConfirmModal';

class EditProjectTimeTableModal extends Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: false,
      visValues:false,
      item: null,
      items: false,
      groups: false,
      showModal: false
    }
    this.timelineRef = createRef();
  }

  getTimelineData = (deadlineSections,deadlines) => {
      const phaseData = []
      let deadLineGroups = []
      let dlIndex = 0
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
      console.log(deadlineSections,deadlines)
      for (let i = 0; i < deadlineSections.length; i++) {
          for (let x = 0; x < deadlineSections[i].sections.length; x++) {
            if (!deadLineGroups.some(item => item.content === deadlineSections[i].title)) {
              deadLineGroups.push({
                id: deadlineSections[i].id,
                content: deadlineSections[i].title,
                showNested: true,
                nestedGroups: []
              })
            }
          }
      }

      for (let i = 0; i < deadlines.length; i++) {

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
            group:deadlines[i].deadline.phase_id,
          })
          startDate = false
          endDate = false

          if(deadlines[i].deadline.phase_name === "Käynnistys" || deadlines[i].deadline.phase_name === "Hyväksyminen" || deadlines[i].deadline.phase_name === "Voimaantulo"){
            dlIndex = deadLineGroups.findIndex(group => group.content === deadlines[i].deadline.phase_name);
            deadLineGroups.at(dlIndex).nestedGroups.push(numberOfPhases)
            nestedDeadlines.push({
              id: numberOfPhases,
              content: "Vaiheen kesto",
              abbreviation:deadlines[i].abbreviation,
              deadlinegroup: deadlines[i].deadline.deadlinegroup,
              deadlinesubgroup: deadlines[i].deadline.deadlinesubgroup,
              locked:false
            });
          }
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
          dlIndex = deadLineGroups.findIndex(group => group.content === deadlines[i].deadline.phase_name);
          deadLineGroups.at(dlIndex).nestedGroups.push(numberOfPhases)

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
          dlIndex = deadLineGroups.findIndex(group => group.content === deadlines[i].deadline.phase_name);
          deadLineGroups.at(dlIndex).nestedGroups.push(numberOfPhases)

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
    this.state.items.map(item => console.log(item));
    if (changedItem) {
      this.setState(prevState => ({
        items: changedItem ? prevState.items.map(item => item.id === changedItem.id ? changedItem : item) : prevState.items,
      }))
    } */
  };

  componentDidMount() {
    const { initialize, attributeData, deadlines, deadlineSections } = this.props
    initialize(attributeData)

    if(attributeData && deadlines && deadlineSections){
      let items = new visdata.DataSet()
      let groups = new visdata.DataSet();

      let [deadLineGroups,nestedDeadlines,phaseData] = this.getTimelineData(deadlineSections,deadlines)

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

  addGroup = (changedValues) => {
    // Get the keys from changedValues
    const keys = Object.keys(changedValues);
    let phase = '';
    let content = '';
    let index = null;
    let idt = ""
    let deadlinegroup = ""
    let groupID = null
    const groups = this.state.groups.get();
    let className = ""
    let matchingValues = Object.entries(this.props.formValues)
    // Iterate over the keys
    for (let key of keys) {
      // Split the key into an array of substrings
      const parts = key.split('_');
      // Check if there are at least two underscores in the key
      if (parts.length > 3) {
        // Get the string between the first and second underscore
        phase = parts[1];
        content = parts[2];
        index = parts[3];

        // Find the group where phase equals content (converted to lowercase)
        const group = groups.find(group => phase === group.content.toLowerCase());
        // Get the id of the group
        groupID = group ? group.id : null;
        // Filter the groups
        let filteredGroups = groups.filter(group => {
          // Check if the group contains stringBetweenUnderscores and content in deadlineGroups
          return typeof group?.deadlinegroup === 'string' && group?.deadlinegroup.includes(phase) && group?.deadlinegroup.includes(content);
        });

        if (filteredGroups.length > 0) {
          // Get the deadlinegroup
          deadlinegroup = filteredGroups[0].deadlinegroup;
            // Get the length of groups
          const length = groups.length;

          // Update the id
          idt = length + 1;
        
          // Use the replace method with a regex to find the number after the underscore
          deadlinegroup = deadlinegroup.replace(/_(\d+)/, (match,number) => {
            // Parse the number, increase it by one, and return it with the underscore
            return '_' + (parseInt(number, 10) + 1);
          });
          //const id = filteredGroups[0].id;
          // Create a new array with the updated groups
          const updatedGroups = groups.map(group => {
            // Check if the id of the group (in lowercase) is equal to phase
            if (String(group.content).toLowerCase() === String(phase).toLowerCase()) {
              // Push the id to nestedGroups
              group.nestedGroups.push(idt);
                  // Update the parent group
              //this.state.groups.update(group);
            }

            // Return the group
            return group;
          });
          console.log(updatedGroups)
            // Update the groups
            if(updatedGroups.length > 0){
              //this.state.groups.add(updatedGroups);
            }
        }
      }
    }

    if(content === "esillaolo"){
      className = "inner-end"
      let indexKey = ''
      if(index > 2){
        indexKey = "_"+index - 1
      }
      matchingValues = Object.entries(this.props.formValues)
      .filter(([key]) =>  
        key === 'milloin_'+phase+'_'+content+'_alkaa'+indexKey ||
        key === 'milloin_'+phase+'_'+content+'_paattyy'+indexKey
      )
      .map(([key,value]) => ({key,value}));

      matchingValues = matchingValues.map(({key, value}) => {
        let date = new Date(value);
        if(key.includes('_paattyy')) {
          date.setDate(date.getDate() + 20);
        }
        else{
          const endVal = matchingValues.find(({key}) => key.includes('_paattyy')).value;
          date.setDate(new Date(endVal).getDate() + 40);
        }
        // Check if the date falls on a weekend
        while (date.getDay() === 0 || date.getDay() === 6) {
          // If it does, add days to the date to get to next Monday
          date.setDate(date.getDate() + (date.getDay() === 0 ? 1 : 2));
        }
        /**
          @todo: messes calendar commented for now date.setHours(12, 0, 0, 0); // Set the time to midday
        **/
        return { key:key +"_"+index , value: date.toISOString().slice(0, 10) };
      });
    
      //Määräaika
      let deadlineDate = new Date(matchingValues[0].value);
      let day = deadlineDate.getDay();
      let difference = (day >= 2 ? 2 : -5) - day;
      deadlineDate.setDate(deadlineDate.getDate() - 7 + difference);
      let deadlineDateOnly = deadlineDate.toISOString().slice(0, 10);

      let deadlineValue = { key: "periaatteet_esillaolo_aineiston_maaraaika_" +index, value: deadlineDateOnly };
      matchingValues.push(deadlineValue);
    } //if esillaolo
    
    //Add new item to vis for group
    const newItems = {
      className: className,
      content: "",
      group: idt,
      id: this.state.items.length + 1,
      locked: false,
      phase: false,
      phaseID: groupID,
      start: matchingValues[0].value,
      end: matchingValues[1].value,
      title: content === "esillaolo" ? "milloin_"+phase+"_esillaolo_paattyy_"+index : +phase+"_lautakunta_aineiston_maaraaika_"+index,
    }
    //Add new vis subgroup
    const newSubGroup = {
      id: idt,
      content: content === "esillaolo" ? "Esilläolo-" + index : "Lautakunta-" + index,
      abbreviation:"",
      deadlinegroup: content === "esillaolo" ? phase+"_esillaolokerta_"+index : phase+"_lautakuntakerta_"+index,
      deadlinesubgroup: "",
      locked:false,
    }

    // Update the main group in the DataSet
    this.state.items.add(newItems);
    // Add the new subgroup to the DataSet
    this.state.groups.add(newSubGroup);
    // Find the group where group.content equals phase
    const phaseCapitalized = phase.charAt(0).toUpperCase() + phase.slice(1);
    const updateGroups = this.state.groups.get();
    const phaseGroup = updateGroups.find(group => group.content === phaseCapitalized);

    if (phaseGroup && phaseGroup.nestedGroups) {
      // Get the nestedGroups array from that group
      const nestedGroupIds = phaseGroup.nestedGroups;

      // Compare the numbers in nestedGroups to the id of each group in groups
      // Put the matching groups into a new array
      const nestedGroups = updateGroups.filter(group => nestedGroupIds.includes(group.id));

      // Sort the new array by content
      nestedGroups.sort((a, b) => a.content.localeCompare(b.content));

      // Separate groups into those that have nestedInGroup info and those that don't
      const groupsWithNestedInGroup = updateGroups.filter(group => group.nestedInGroup);
      const groupsWithoutNestedInGroup = updateGroups.filter(group => !group.nestedInGroup);

      // Sort only the groups that have nestedInGroup info
      groupsWithNestedInGroup.sort((a, b) => a.content.localeCompare(b.content));

      // Concatenate the sorted groups with the rest of the groups
      const sortedGroups = groupsWithoutNestedInGroup.concat(groupsWithNestedInGroup);

      // Remove all groups from the DataSet
      this.state.groups.clear();

      // Add the groups back to the DataSet in the sorted order
      this.state.groups.add(sortedGroups);
    }

    //Dispatch values to formValues so they are visible at calendar component
    matchingValues.forEach(({key, value}) => {
      this.props.dispatch(change(EDIT_PROJECT_TIMETABLE_FORM, key, value));
    });

  }

  getChangedValues = (prevValues, currentValues) => {
    const changedValues = {};
  
    Object.keys(currentValues).forEach((key) => {
      if (prevValues[key] !== currentValues[key]) {
        changedValues[key] = currentValues[key];
      }
    });
    
    const isAddRemove = Object.keys(changedValues).some(key => 
      (key.includes('jarjestetaan') || key.includes('lautakuntaan')) && 
      typeof changedValues[key] === 'boolean'
    );

    return [isAddRemove,changedValues];
  }

  componentDidUpdate(prevProps) {
    const {
      saving,
      initialize,
      attributeData,
      submitFailed,
      formValues,
      deadlines,
      deadlineSections
    } = this.props

    if(prevProps.formValues && prevProps.formValues !== formValues){
      if(deadlineSections && deadlines && formValues){
        // Check if changedValues contains 'jarjestetaan' or 'lautakuntaan' and the value is a boolean
        const [isGroupAddRemove,changedValues] = this.getChangedValues(prevProps.formValues, formValues);

        if (isGroupAddRemove) {
          this.addGroup(changedValues)
        }
        else{
          //Form items and groups
          let [deadLineGroups,nestedDeadlines,phaseData] = this.getTimelineData(deadlineSections,deadlines)

          // Update the existing data
          this.state.groups.update(deadLineGroups);
          this.state.groups.update(nestedDeadlines);
          this.state.items.update(phaseData)
        }
        this.setState({visValues:formValues})
      }
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

  openConfirmCancel = () => {
    this.setState({ showModal: true });
  }

  handleContinueCancel = () => {
    this.setState({ showModal: false });
    this.handleClose()
  }

  handleCancelCancel = () => {
    this.setState({ showModal: false });
  }

  handleClose = () => {
    this.props.handleClose()
  }

  render() {
    const { loading } = this.state
    const { open, formValues, deadlines, deadlineSections, t, formSubmitErrors, projectPhaseIndex, currentProject, allowedToEdit, isAdmin } = this.props

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
              isAdmin={isAdmin}
              toggleTimelineModal={this.state.toggleTimelineModal}
            />
            {this.state.showModal && 
            <ConfirmCancelModal 
              headerText={"Haluatko peruuttaa tekemäsi muutokset?"} 
              contentText={"Olet muuttanut aikataulun tietoja. Mikäli jatkat, tekemäsi muutokset peruutetaan. Haluatko jatkaa?"} 
              button1Text={"Jatka"} 
              button2Text={"Peruuta"} 
              onContinue={this.handleContinueCancel} 
              onCancel={this.handleCancelCancel}
            />
            }
        </Modal.Content>
        <Modal.Actions>
        {this.props.allowedToEdit ? (
          <span className="form-buttons">
            <Button
              variant="primary"
              disabled={loading || !this.props.allowedToEdit}
              loadingText={t('common.save-timeline')}
              isLoading={loading}
              type="submit"
              onClick={this.handleSubmit}
            >
              {t('common.save-timeline')}
            </Button>
            <Button variant="secondary" disabled={loading} onClick={this.openConfirmCancel}>
              {t('common.cancel')}
            </Button>
          </span>
        ) : (
          <span className="form-buttons">
            <Button variant="secondary" disabled={loading} onClick={this.handleClose}>
            {t('common.close')}
            </Button>
          </span>
        )}
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
  isAdmin: PropTypes.bool,
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
