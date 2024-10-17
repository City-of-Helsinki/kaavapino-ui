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
import { deadlinesSelector,validatedSelector,dateValidationResultSelector } from '../../../selectors/projectSelector'
import { Button,IconInfoCircle } from 'hds-react'
import { isEqual } from 'lodash'
import VisTimelineGroup from '../../ProjectTimeline/VisTimelineGroup'
import * as visdata from 'vis-data'
import ConfirmModal from '../../common/ConfirmModal';
import withValidateDate from '../../../hocs/withValidateDate';
import objectUtil from '../../../utils/objectUtil'
import textUtil from '../../../utils/textUtil'
import { updateDateTimeline } from '../../../actions/projectActions';

class EditProjectTimeTableModal extends Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: false,
      visValues:false,
      item: null,
      items: false,
      groups: false,
      showModal: false,
      collapseData: {},
      sectionAttributes: []
    }
    this.timelineRef = createRef();
  }

  componentDidMount() {
    const { initialize, attributeData, deadlines, deadlineSections, disabledDates,lomapaivat } = this.props
    initialize(attributeData)
   // Check if the key exists and its value is true
    if(attributeData && deadlines && deadlineSections && disabledDates && lomapaivat){
      let items = new visdata.DataSet()
      let groups = new visdata.DataSet();
      let ongoingPhase = this.trimPhase(attributeData?.kaavan_vaihe)
      let [deadLineGroups,nestedDeadlines,phaseData] = this.getTimelineData(deadlineSections,attributeData,deadlines,ongoingPhase)

      groups.add(deadLineGroups);
      groups.add(nestedDeadlines);
      items.add(phaseData)
      items = this.findConsecutivePeriods(disabledDates,items,false);
      items = this.findConsecutivePeriods(lomapaivat,items,true)
      this.setState({items,groups,visValues:attributeData})
      let sectionAttributes = []
      for (let index = 0; index < deadlineSections.length; index++) {
        const phaseSection = deadlineSections[index].sections
        for (let x = 0; x < phaseSection.length; x++) {
          const attributes = phaseSection[x].attributes
          for (let y = 0; y < attributes.length; y++) {
            if(attributes[y].type === "date" && attributes[y].display !== "readonly" && attributes[y].label !== "Lausunnot viimeistään" && attributeData[attributes[y].name]){
              //Create section attributes which are always in correct order to check dates in timeline
              sectionAttributes.push(attributes[y])
            }
          }
    
        }
      }
      this.setState({sectionAttributes})
      
      const unfilteredSectionAttributes = []
      for (let index = 0; index < deadlineSections.length; index++) {
        const phaseSection = deadlineSections[index].sections
        for (let x = 0; x < phaseSection.length; x++) {
          const attributes = phaseSection[x].attributes
          for (let y = 0; y < attributes.length; y++) {
            if(attributes[y].type === "date" && attributes[y].display !== "readonly"){
              //Create section attributes which are always in correct order to check dates in timeline
              unfilteredSectionAttributes.push(attributes[y])
            }
          }
    
        }
      }
      this.setState({unfilteredSectionAttributes})
    }
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

    if (prevProps.attributeData && prevProps.attributeData !== attributeData) {
      let sectionAttributes = []
      for (let index = 0; index < deadlineSections.length; index++) {
        const phaseSection = deadlineSections[index].sections
        for (let x = 0; x < phaseSection.length; x++) {
          const attributes = phaseSection[x].attributes
          for (let y = 0; y < attributes.length; y++) {
            if(attributes[y].type === "date" && attributes[y].display !== "readonly" && attributes[y].label !== "Lausunnot viimeistään" && attributeData[attributes[y].name]){
              //Create section attributes which are always in correct order to check dates in timeline
              sectionAttributes.push(attributes[y])
            }
          }
    
        }
      }
      this.setState({sectionAttributes})
      //when UPDATE_DATE_TIMELINE updates attribute values
      Object.keys(attributeData).forEach(fieldName => 
        this.props.dispatch(change(EDIT_PROJECT_TIMETABLE_FORM, fieldName, attributeData[fieldName])));
    }

    if(prevProps.formValues && prevProps.formValues !== formValues){
      if(deadlineSections && deadlines && formValues){
        // Check if changedValues contains 'jarjestetaan' or 'lautakuntaan' and the value is a boolean
        const [isGroupAddRemove,changedValues] = this.getChangedValues(prevProps.formValues, formValues);

        if (isGroupAddRemove) {
          this.addGroup(changedValues)
          this.setState({visValues:formValues})
        }
        else{
          if(!this.props.validated){
            let ongoingPhase = this.trimPhase(attributeData?.kaavan_vaihe)
            //Form items and groups
            let [deadLineGroups,nestedDeadlines,phaseData] = this.getTimelineData(deadlineSections,formValues,deadlines,ongoingPhase)
            // Update the existing data
            // Get the existing groups from the state
            let existingGroups = this.state.groups.get() || deadLineGroups;
            // Merge nestedDeadlines into deadLineGroups based on deadlineGroup key
            nestedDeadlines.forEach(nestedDeadline => {
              let matchingGroup = existingGroups.find(group => group.content.trim().toLowerCase() === nestedDeadline.content.trim().toLowerCase() && group.deadlinegroup.trim().toLowerCase() === nestedDeadline.deadlinegroup.trim().toLowerCase());
              if (matchingGroup !== -1) {
                //replace the existing group with the new matching group
                existingGroups[matchingGroup] = { ...existingGroups[matchingGroup], ...nestedDeadline };
              } else {
                existingGroups.push(nestedDeadline);
              }
            });
            this.state.groups.update(existingGroups);
            this.state.items.update(phaseData)
            const newObjectArray = objectUtil.findDifferencesInObjects(prevProps.formValues,formValues)

            //No dispatch when confirmed is added to formValues as new data
            if(newObjectArray.length === 0 || (typeof newObjectArray[0]?.obj1 === "undefined"  && typeof newObjectArray[0]?.obj2 === "undefined") || newObjectArray[0]?.key.includes("vahvista")){
              console.log("no disptach")
            }
            else if(typeof newObjectArray[0]?.obj1 === "undefined" && typeof newObjectArray[0]?.obj2 === "string" || newObjectArray[1] && typeof newObjectArray[1]?.obj1 === "undefined" && typeof newObjectArray[1]?.obj2 === "string"){
              //Get added groups last date field and update all timelines ahead
              let field
              let formattedDate
              for (let i = 0; i < newObjectArray.length; i++) {
                if(newObjectArray[i]?.key.includes("paattyy") && typeof newObjectArray[i]?.obj2 === "string"){
                  field = newObjectArray[i]?.key
                  formattedDate = newObjectArray[i]?.obj2
                  break;
                }
                else if(newObjectArray[i]?.key.includes("lautakunnassa") && typeof newObjectArray[i]?.obj2 === "string"){
                  field = newObjectArray[i]?.key
                  formattedDate = newObjectArray[i]?.obj2
                  break;
                }
              }
              //Dispatch added values to move other values in projectReducer if miniums are reached
              if(field && formattedDate){
                this.props.dispatch(updateDateTimeline(field,formattedDate,false,formValues,true,deadlineSections));
              }
            }
            this.setState({visValues:formValues})
          }
        }
      }
    }

    if (prevProps.submitting && submitFailed) {
      this.setLoadingFalse()
    }
    if (prevProps.saving && !saving) {
      initialize(attributeData)
    }
  }

  shouldComponentUpdate(prevProps, prevState) {
    if (isEqual(prevProps, this.props) && isEqual(prevState, this.state)) {
      return false
    }
    return true
  }

  trimPhase = (phase) => {
    let phaseOnly = phase.split('.', 2); // Split the string at the first dot
    if (!isNaN(phaseOnly[0])) {  // Check if the part before the dot is a number
      phaseOnly = phaseOnly[1].trim();  // The part after the dot, with leading/trailing spaces removed
    }
    return phaseOnly
  } 

  addOneDay = (dateString) => {
    // Parse the input string into a Date object
    const date = new Date(dateString);
    
    // Add one day (24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
    date.setTime(date.getTime() + (24 * 60 * 60 * 1000));
    
    // Format the new date back into "YYYY-MM-DD" format
    const year = date.getFullYear();
    // getMonth() returns 0-11; adding 1 to get 1-12 for months
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  findConsecutivePeriods = (dates, items, holidays) => {
    if (!Array.isArray(dates) || dates.length === 0) {
      return [];
    }
  
    let start = new Date(dates[0]);
    start.setHours(0, 0, 0, 0);
    let end = new Date(dates[0]);
    end.setHours(23, 59, 59, 999);

    const isWeekend = (date) => {
      const day = date.getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    };
  
    for (let i = 1; i < dates.length; i++) {
      const currentDate = new Date(dates[i]);
      const previousDate = new Date(dates[i - 1]);
      currentDate.setHours(0, 0, 0, 0);
      previousDate.setHours(0, 0, 0, 0);
      const differenceInTime = currentDate - previousDate;
      const differenceInDays = differenceInTime / (1000 * 3600 * 24);

      if (holidays) {
        if (differenceInDays === 1) {
          end = new Date(dates[i]);
          end.setHours(23, 59, 59, 999);
        } else {
          end = this.addOneDay(end);
          items.add([{
            id: `holiday_${i}`,
            start: start,
            end: end,
            type: "background",
            className: "holiday",
          }]);
          start = new Date(dates[i]);
          start.setHours(0, 0, 0, 0);
          end = new Date(dates[i]);
          end.setHours(23, 59, 59, 999);
        }
      } else {
        if (differenceInDays === 1) {
          end = new Date(dates[i]);
          end.setHours(23, 59, 59, 999);
        } else {
          items.add([{
            id: `disabled_date_${i}`,
            start: start,
            end: end,
            type: "background",
            className: isWeekend(start) && isWeekend(end) ? "negative normal-weekend" : "negative",
          }]);
          start = new Date(dates[i]);
          start.setHours(0, 0, 0, 0);
          end = new Date(dates[i]);
          end.setHours(23, 59, 59, 999);
        }
      }
    }

    // Ensure the last period is added
    if (holidays) {
      items.add([{
        id: `holiday_${dates.length}`,
        start: start,
        end: end,
        type: "background",
        className: "holiday",
      }]);
    } else {
      items.add([{
        id: `disabled_date_${dates.length}`,
        start: start,
        end: end,
        type: "background",
        className: isWeekend(start) && isWeekend(end) ? "negative normal-weekend" : "negative",
      }]);
    }
  
    return items;
  }

  addDeadLineGroups = (deadlineSections,deadLineGroups,ongoingPhase) => {
    for (let i = 0; i < deadlineSections.length; i++) {
      for (let x = 0; x < deadlineSections[i].grouped_sections.length; x++) {
        if (!deadLineGroups.some(item => item.content === deadlineSections[i].title)) {
          let esillaolokerta = 0
          let lautakuntakerta = 0
          Object.keys(deadlineSections[i].grouped_sections[x].attributes).forEach(key => {
            // add max count for esilläolo and lautakunta groups
            if (key.includes('esillaolokerta') || key.includes('nahtavillaolokerta')) {
              esillaolokerta++
            }
            if(key.includes('lautakuntakerta')){
              lautakuntakerta++
            }
          });

          let expanded
          if(this.state.collapseData[deadlineSections[i].title]){
            expanded = this.state.collapseData[deadlineSections[i].title]
          }
          else{
            expanded = deadlineSections[i].title === ongoingPhase ? true : false
          }

          deadLineGroups.push({
            id: deadlineSections[i].title,
            content: deadlineSections[i].title,
            showNested: expanded,
            nestedGroups: [],
            maxEsillaolo: esillaolokerta,
            maxLautakunta: lautakuntakerta
          })
        }
      }
    }
    return deadLineGroups
  }

  getValueOrDefault = (deadline, formValues) => {
    return formValues && formValues[deadline.attribute] ? formValues[deadline.attribute] : deadline.date;
  }

  addMainGroup = (deadlines, i, numberOfPhases, startDate, endDate, style, phaseData, deadLineGroups, nestedDeadlines) => {
    const currentDateString = new Date().toJSON().slice(0, 10);
    const currentDate = new Date(currentDateString);
    phaseData.push({
      id: numberOfPhases,
      content: '',
      start: startDate,
      end: endDate,
      className: style,
      phaseID: deadlines[i].deadline.phase_id,
      phase: true,
      group: deadlines[i].deadline.phase_name,
    });
  
    if (deadlines[i].deadline.phase_name === "Käynnistys" || deadlines[i].deadline.phase_name === "Hyväksyminen" || deadlines[i].deadline.phase_name === "Voimaantulo") {
      phaseData.push({
        id: numberOfPhases + deadlines[i].deadline.phase_name,
        content: "",
        start: startDate,
        end: endDate,
        className: currentDate > endDate ? "phase-length past" : "phase-length",
        title: deadlines[i].deadline.attribute,
        phaseID: deadlines[i].deadline.phase_id,
        phase: false,
        group: numberOfPhases,
        locked: false
      });
      
      let dlIndex = deadLineGroups.findIndex(group => group.content === deadlines[i].deadline.phase_name);
      deadLineGroups?.at(dlIndex)?.nestedGroups?.push(numberOfPhases);
  
      nestedDeadlines.push({
        id: numberOfPhases,
        content: "Vaiheen kesto",
        abbreviation: deadlines[i].abbreviation,
        deadlinegroup: deadlines[i].deadline.deadlinegroup,
        deadlinesubgroup: deadlines[i].deadline.deadlinesubgroup,
        locked: false,
        undeletable: true
      });
    }
  
    return [phaseData, deadLineGroups, nestedDeadlines];
  }

  shouldAddSubgroup = (deadline, formValues) => {
    if (!deadline.deadlinegroup){
      console.warn("Deadline group missing for deadline " + deadline.attribute);
      return false;
    }
    // Assumes group name = phase_type_iteration
    const splitGroup = deadline.deadlinegroup.split('_');
    const iteration = splitGroup.pop();
    const subGroupType = ['esillaolokerta', 'nahtavillaolokerta'].includes(splitGroup.pop())? 'esillaolo' : 'lautakuntaan';
    const phaseName = splitGroup.join('_');

    if (subGroupType == 'esillaolo') {
      if (["periaatteet", "oas", "luonnos"].includes(phaseName)){
        if (iteration === '1' && phaseName == 'oas'){
          return true;
        }
        const bool_attribute_name = ['jarjestetaan', phaseName, subGroupType, iteration].join('_');
        const bool_attribute = formValues[bool_attribute_name];
        return bool_attribute;
      } else if (phaseName === "ehdotus"){
        if (iteration === '1') {
          return formValues['kaavaehdotus_nahtaville_1'];
        }
        return formValues['kaavaehdotus_uudelleen_nahtaville_' + iteration];
      }
    } else if (iteration == '1'){ // Bool don't exist for iterations after 1. Nice! Handled in generateVisValues
      if (phaseName === 'tarkistettu_ehdotus'){
        return true // Bool missing from data. Despite being in excel. No problem!
      }
      const attributePhaseName = ['ehdotus', 'luonnos'].includes(phaseName)? 'kaava' + phaseName : phaseName;
      const bool_attribute = formValues[`${attributePhaseName}_lautakuntaan_1`];
      return bool_attribute;
    }
    console.warn(deadline.attribute + " not implemented in shouldAddSubgroup");
    return false;
  }

  addSubgroup = (deadlines, i, numberOfPhases, dashStart, dashEnd, dashedStyle, phaseData, deadLineGroups, nestedDeadlines, milestone) => {
    if(dashStart === null && milestone === null && dashEnd){
      phaseData.push({
        start: dashEnd,
        id: numberOfPhases,
        content: "",
        className: "board-only",
        title: deadlines[i].deadline.attribute,
        phaseID: deadlines[i].deadline.phase_id,
        phase: false,
        group: numberOfPhases,
        locked: false,
        type: 'point',
      });
    }
    else if(dashEnd === null){
      phaseData.push({
        start: dashStart,
        id: numberOfPhases,
        content: "",
        className: dashedStyle,
        title: deadlines[i].deadline.attribute,
        phaseID: deadlines[i].deadline.phase_id,
        phase: false,
        group: numberOfPhases,
        locked: false,
        type: 'point'
      });
    }
    else if(dashStart && dashEnd && milestone){
      phaseData.push({
        start: milestone,
        id: numberOfPhases + " maaraaika",
        content: "",
        className: dashedStyle,
        title: deadlines[i].deadline.attribute,
        phaseID: deadlines[i].deadline.phase_id,
        phase: false,
        group: numberOfPhases,
        locked: false,
        type: 'point'
      });
      phaseData.push({
        start: milestone,
        end: dashStart,
        id: numberOfPhases + " divider",
        content: "",
        className: "divider",
        title: "divider",
        phaseID: deadlines[i].deadline.phase_id,
        phase: false,
        group: numberOfPhases,
        locked: false,
      });
      phaseData.push({
        start: dashStart,
        end: dashEnd,
        id: numberOfPhases,
        content: "",
        className: dashedStyle,
        title: deadlines[i].deadline.attribute,
        phaseID: deadlines[i].deadline.phase_id,
        phase: false,
        group: numberOfPhases,
        locked: false
      });
    }
    else{
      phaseData.push({
        start: dashStart,
        end: dashEnd,
        id: numberOfPhases,
        content: "",
        className: dashedStyle,
        title: deadlines[i].deadline.attribute,
        phaseID: deadlines[i].deadline.phase_id,
        phase: false,
        group: numberOfPhases,
        locked: false
      });
    }

    let dlIndex = deadLineGroups.findIndex(group => group.content.toLowerCase() === deadlines[i].deadline.phase_name.toLowerCase());
    deadLineGroups?.at(dlIndex)?.nestedGroups.push(numberOfPhases);
    const lastChar = deadlines[i]?.deadline?.deadlinegroup?.charAt(deadlines[i].deadline.deadlinegroup.length - 1); // Get the last character of the string
    const isLastCharNumber = !isNaN(lastChar) && lastChar !== ""; // Check if the last character is a number
    let indexString = "";
    if(isLastCharNumber){
      indexString = "-" + lastChar;
    }

    let undeletable = false;
    if(indexString === "-1" && (deadlines[i].deadline.phase_name === "Ehdotus" || deadlines[i].deadline.phase_name === "OAS" || deadlines[i].deadline.phase_name === "Tarkistettu ehdotus")){
      undeletable = true
    }
    nestedDeadlines.push({
      id: numberOfPhases,
      content: deadlines[i].deadline.deadlinegroup?.includes("lautakunta") ? "Lautakunta" +indexString : (deadlines[i].deadline.deadlinegroup?.includes("nahtavillaolo") ? "Nahtavillaolo" +indexString : "Esilläolo" +indexString),
      abbreviation: deadlines[i].abbreviation,
      deadlinegroup: deadlines[i].deadline.deadlinegroup,
      deadlinesubgroup: deadlines[i].deadline.deadlinesubgroup,
      locked: false,
      generated:deadlines[i].generated,
      undeletable:undeletable
    });

    return [phaseData, deadLineGroups, nestedDeadlines];
  }

  generateVisItems = (deadlines,formValues,deadLineGroups,nestedDeadlines,phaseData) => {
    console.log(deadlines,formValues,deadLineGroups,nestedDeadlines,phaseData)
    let numberOfPhases
    let deadlineGroup

    let startDate = false
    let endDate = false
    let style = ""

    let dashedStyle = "inner"

    let innerStart = false
    let innerEnd = false
    let innerStyle = "inner-end"

    let milestone = false

    const currentDateString = new Date().toJSON().slice(0, 10);
    const currentDate = new Date(currentDateString);

    for (let i = 0; i < deadlines.length; i++) {
      numberOfPhases = deadlines[i].deadline.index
      deadlineGroup = deadlines[i].deadline.deadlinegroup;

      if(deadlines[i].deadline.deadline_types.includes('phase_start')){
        //Special case for project start date
        if(deadlines[i].deadline.attribute === null && deadlines[i].abbreviation === "K1"){
          startDate = formValues && formValues["projektin_kaynnistys_pvm"]
            ? new Date(formValues["projektin_kaynnistys_pvm"])
            : new Date(deadlines[i].date);
          startDate.setHours(0, 0, 0, 0);
        }
        else{
          //If formValues has deadlines[i].deadline.attribute use that values, it if not then use deadline[i].date in startDate.
          startDate = formValues && formValues[deadlines[i].deadline.attribute]
            ? new Date(formValues[deadlines[i].deadline.attribute])
            : new Date(deadlines[i].date);
          startDate.setHours(0, 0, 0, 0);
        }

        style = deadlines[i].deadline.phase_color
      }
      else if(deadlines[i]?.deadline?.attribute?.includes("esillaolo") || deadlines[i]?.deadline?.attribute?.includes("luonnosaineiston_maaraaika")){
        if(deadlines[i].deadline.deadline_types.includes('milestone') && deadlines[i].deadline.deadline_types.includes('dashed_start')){
          milestone = formValues && formValues[deadlines[i].deadline.attribute]
            ? new Date(formValues[deadlines[i].deadline.attribute])
            : deadlines[i].date;

            if (milestone instanceof Date && !isNaN(milestone.getTime())) {
              milestone.setHours(12, 0, 0, 0);
            }
        }
        else if (deadlines[i].deadline.deadline_types.includes('inner_start')) {
          innerStart = formValues && formValues[deadlines[i].deadline.attribute]
            ? new Date(formValues[deadlines[i].deadline.attribute])
            : deadlines[i].date;

          if (innerStart instanceof Date && !isNaN(innerStart.getTime())) {
            innerStart.setHours(12, 0, 0, 0);
          }
        }
        else if(deadlines[i].deadline.deadline_types.includes('inner_end')){
          innerEnd = formValues && formValues[deadlines[i].deadline.attribute]
            ? new Date(formValues[deadlines[i].deadline.attribute])
            : deadlines[i].date;

          if (innerEnd instanceof Date && !isNaN(innerEnd.getTime())) {
            innerEnd.setHours(12, 0, 0, 0);
          }

          innerStyle = "inner-end"
          if (innerEnd < currentDate) {
            innerStyle += " past";
          }
          if (this.isDeadlineConfirmed(formValues, deadlineGroup)) {
            innerStyle += " confirmed";
          }
        }
      }
      else if(deadlines[i]?.deadline?.attribute?.includes("nahtavilla") || deadlines[i]?.deadline?.deadlinegroup?.includes("nahtavillaolokerta") || deadlines[i]?.deadline?.attribute?.includes("ehdotus_nahtaville_aineiston_maaraaika")){
        
        if(deadlines[i].deadline.deadline_types.includes('milestone') && deadlines[i].deadline.deadline_types.includes('dashed_start')){
          milestone = formValues && formValues[deadlines[i].deadline.attribute]
            ? new Date(formValues[deadlines[i].deadline.attribute])
            : deadlines[i].date;

          if (milestone instanceof Date && !isNaN(milestone.getTime())) {
            milestone.setHours(12, 0, 0, 0);
          }
        }
        else if(deadlines[i].deadline.deadline_types.includes('inner_start')){
          if(formValues.kaavaprosessin_kokoluokka === "XL" && deadlines[i].deadline.attribute.includes("iso") || formValues.kaavaprosessin_kokoluokka === "L" && deadlines[i].deadline.attribute.includes("iso")){
            innerStart = formValues && formValues[deadlines[i].deadline.attribute]
              ? new Date(formValues[deadlines[i].deadline.attribute])
              : deadlines[i].date;

            if (innerStart instanceof Date && !isNaN(innerStart.getTime())) {
              innerStart.setHours(12, 0, 0, 0);
            }
          }
          if(formValues.kaavaprosessin_kokoluokka === "XS" && deadlines[i].deadline.attribute.includes("pieni") || formValues.kaavaprosessin_kokoluokka === "S" && deadlines[i].deadline.attribute.includes("pieni") || formValues.kaavaprosessin_kokoluokka === "M" && deadlines[i].deadline.attribute.includes("pieni")){
            innerStart = formValues && formValues[deadlines[i].deadline.attribute]
              ? new Date(formValues[deadlines[i].deadline.attribute])
              : deadlines[i].date;

            if (innerStart instanceof Date && !isNaN(innerStart.getTime())) {
              innerStart.setHours(12, 0, 0, 0);
            }
          }
        }
        else if(deadlines[i].deadline.deadline_types.includes('inner_end')){
          innerEnd = formValues && formValues[deadlines[i].deadline.attribute]
            ? new Date(formValues[deadlines[i].deadline.attribute])
            : deadlines[i].date;

          if (innerEnd instanceof Date && !isNaN(innerEnd.getTime())) {
            innerEnd.setHours(12, 0, 0, 0);
          }

          innerStyle = "inner-end"
          if (innerEnd < currentDate) {
            innerStyle += " past";
          }

          if (this.isDeadlineConfirmed(formValues, deadlineGroup)) {
            innerStyle += " confirmed";
          }
        }
      }
      else if(deadlines[i]?.deadline?.attribute?.includes("lautakunta") || deadlines[i]?.deadline?.attribute?.includes("lautakunnassa") || 
      deadlines[i]?.deadline?.attribute?.includes("tarkistettu_ehdotus_kylk_maaraaika") || 
      deadlines[i]?.deadline?.attribute?.includes("ehdotus_kylk_aineiston_maaraaika") ||
      deadlines[i]?.deadline?.attribute?.includes("kaavaluonnos_kylk_aineiston_maaraaika")){
        if(deadlines[i].deadline.deadline_types.includes('milestone') && deadlines[i].deadline.deadline_types.includes('dashed_start')){
          innerStart = formValues && formValues[deadlines[i].deadline.attribute]
            ? new Date(formValues[deadlines[i].deadline.attribute])
            : deadlines[i].date;

          if (innerStart instanceof Date && !isNaN(innerStart.getTime())) {
            innerStart.setHours(12, 0, 0, 0);
          }
        }
        else if(deadlines[i].deadline.deadline_types.includes('milestone') && deadlines[i].deadline.deadline_types.includes('dashed_end')){
          innerEnd = formValues && formValues[deadlines[i].deadline.attribute]
            ? new Date(formValues[deadlines[i].deadline.attribute])
            : deadlines[i].date;

          if (innerEnd instanceof Date && !isNaN(innerEnd.getTime())) {
            innerEnd.setHours(12, 0, 0, 0);
          }

          innerStyle = "board"
          if (innerEnd < currentDate) {
            innerStyle += " past";
          }

          if (this.isDeadlineConfirmed(formValues, deadlineGroup)) {
            innerStyle += " confirmed";
          }
        }
        else if(deadlines[i].deadline.deadline_types.includes('inner_start')){
          innerStart = formValues && formValues[deadlines[i].deadline.attribute]
            ? new Date(formValues[deadlines[i].deadline.attribute])
            : deadlines[i].date;

          if (innerStart instanceof Date && !isNaN(innerStart.getTime())) {
            innerStart.setHours(12, 0, 0, 0);
          }
        }
        else if(deadlines[i].deadline.deadline_types.includes('inner_end')){
          innerEnd = formValues && formValues[deadlines[i].deadline.attribute]
            ? new Date(formValues[deadlines[i].deadline.attribute])
            : deadlines[i].date;

          if (innerEnd instanceof Date && !isNaN(innerEnd.getTime())) {
            innerEnd.setHours(12, 0, 0, 0);
          }
        }
      }
      else if(deadlines[i].deadline.deadline_types.includes('phase_end') && deadlines[i].deadline.date_type !== "Arkipäivät"){
        if(deadlines[i].deadline.attribute === "voimaantulovaihe_paattyy_pvm"){
          endDate = formValues && formValues["voimaantulovaihe_paattyy_pvm"] 
          ? new Date(formValues["voimaantulovaihe_paattyy_pvm"]) 
          : deadlines[i].date;
        }
        else{
          endDate = formValues && formValues[deadlines[i].deadline.attribute]
          ? new Date(formValues[deadlines[i].deadline.attribute])
          : deadlines[i].date;
        }


        if (endDate instanceof Date && !isNaN(endDate.getTime())) {
          endDate.setHours(12, 0, 0, 0);
        }
      }

      if(startDate && endDate){
        //Main group items not movable(Käynnistys, Periaatteet, OAS etc)
        let mainGroup = this.addMainGroup(deadlines, i, numberOfPhases, startDate, endDate, style, phaseData, deadLineGroups, nestedDeadlines);
        [phaseData, deadLineGroups, nestedDeadlines] = mainGroup;
        startDate = false
        endDate = false
 
      }
      else if(milestone && deadlines[i].deadline.phase_name === "Ehdotus" && deadlines[i].deadline.deadlinegroup !== "ehdotus_lautakuntakerta_1" && formValues.kaavaprosessin_kokoluokka === "XL" 
        || milestone && deadlines[i].deadline.phase_name === "Ehdotus" && deadlines[i].deadline.deadlinegroup !== "ehdotus_lautakuntakerta_1" && formValues.kaavaprosessin_kokoluokka === "L"){
        if(formValues[deadlines[i].deadline.attribute]){
          let subgroup = this.addSubgroup(deadlines, i, numberOfPhases, innerStart, null, dashedStyle, phaseData, deadLineGroups, nestedDeadlines, milestone);
          [phaseData, deadLineGroups, nestedDeadlines] = subgroup;
        }
        milestone = false
      }
      else if(innerEnd && deadlines[i].deadline.phase_name === "Periaatteet" && (deadlines[i].deadline.deadlinegroup === "periaatteet_lautakuntakerta_2" || deadlines[i].deadline.deadlinegroup === "periaatteet_lautakuntakerta_3" || deadlines[i].deadline.deadlinegroup === "periaatteet_lautakuntakerta_4")
        || innerEnd && deadlines[i].deadline.phase_name === "Luonnos" && (deadlines[i].deadline.deadlinegroup === "luonnos_lautakuntakerta_2" || deadlines[i].deadline.deadlinegroup === "luonnos_lautakuntakerta_3" || deadlines[i].deadline.deadlinegroup === "luonnos_lautakuntakerta_4")
        || innerEnd && deadlines[i].deadline.phase_name === "Ehdotus" && (deadlines[i].deadline.deadlinegroup === "ehdotus_lautakuntakerta_2" || deadlines[i].deadline.deadlinegroup === "ehdotus_lautakuntakerta_3" || deadlines[i].deadline.deadlinegroup === "ehdotus_lautakuntakerta_4")
        || innerEnd && deadlines[i].deadline.phase_name === "Tarkistettu ehdotus" && (deadlines[i].deadline.deadlinegroup === "tarkistettu_ehdotus_lautakuntakerta_2" || deadlines[i].deadline.deadlinegroup === "tarkistettu_ehdotus_lautakuntakerta_3" || deadlines[i].deadline.deadlinegroup === "tarkistettu_ehdotus_lautakuntakerta_4") 
      ){
        if(formValues[deadlines[i].deadline.attribute]){
          let subgroup = this.addSubgroup(deadlines, i, numberOfPhases, null, innerEnd, dashedStyle, phaseData, deadLineGroups, nestedDeadlines, null);
          [phaseData, deadLineGroups, nestedDeadlines] = subgroup;
        }
        innerEnd = false
      } 
      else if(innerStart && innerEnd){
        if(formValues[deadlines[i].deadline.attribute] && this.shouldAddSubgroup(deadlines[i].deadline, formValues)){
          let subgroup2 = this.addSubgroup(deadlines, i, numberOfPhases, innerStart, innerEnd, innerStyle, phaseData, deadLineGroups, nestedDeadlines, milestone?milestone:null);
          [phaseData, deadLineGroups, nestedDeadlines] = subgroup2;
        }
        innerStart = false;
        innerEnd = false;
        milestone = false;
      }
    }

    return [deadLineGroups,nestedDeadlines,phaseData]
  }

  // Helper function to check if dates are confirmed
  isDeadlineConfirmed = (formValues, deadlineGroup) => {
    // Extract the number from deadlineGroup if it exists
    const extractDigitsFromEnd = (str) => {
      if (!str) return null;
      const digits = str.split('').reverse().filter(char => !isNaN(char) && char !== ' ').reverse().join('');
      return digits || null;
    };

    const matchNumber = extractDigitsFromEnd(deadlineGroup);
    let confirmationKey;

    const baseKeys = {
      "tarkistettu_ehdotus": "vahvista_tarkistettu_ehdotus_lautakunnassa",
      "ehdotus_pieni": "vahvista_ehdotus_esillaolo_pieni",
      "ehdotus_nahtavillaolokerta": "vahvista_ehdotus_esillaolo",
      "ehdotus_esillaolo": "vahvista_ehdotus_esillaolo",
      "ehdotus_lautakunta": "vahvista_kaavaehdotus_lautakunnassa",
      "oas": "vahvista_oas_esillaolo_alkaa",
      "periaatteet_esillaolokerta": "vahvista_periaatteet_esillaolo_alkaa",
      "periaatteet_lautakuntakerta": "vahvista_periaatteet_lautakunnassa",
      "luonnos_esillaolokerta": "vahvista_luonnos_esillaolo_alkaa",
      "luonnos_lautakuntakerta": "vahvista_kaavaluonnos_lautakunnassa"
    };

    for (const key in baseKeys) {
      if (deadlineGroup.includes(key)) {
        if (matchNumber && matchNumber === "1") {
          // If number is 1, use the base key
          confirmationKey = baseKeys[key];
        } else if (matchNumber) {
          // If number is bigger, construct the confirmationKey using the number
          confirmationKey = `${baseKeys[key]}_${matchNumber}`;
        } else {
          // If no number, use the base key
          confirmationKey = baseKeys[key];
        }
        break;
      }
    }

    return formValues[confirmationKey] === true;
  };

  getTimelineData = (deadlineSections,formValues,deadlines,ongoingPhase) => {
      let phaseData = []
      let deadLineGroups = []
      let nestedDeadlines = []

      deadLineGroups = this.addDeadLineGroups(deadlineSections,deadLineGroups,ongoingPhase)
      const results = this.generateVisItems(deadlines,formValues,deadLineGroups,nestedDeadlines,phaseData);
      [deadLineGroups, nestedDeadlines, phaseData] = results;

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

  setLoadingFalse = () => {
    if (this.state.loading) {
      this.setState({ loading: false })
    }
  }

  getNewValidDates = async (field,projectName,formattedDate) => {
    try {
      const { validateDate } = this.props;
      const date = await validateDate(field, projectName, formattedDate, this.setWarning);
      return date;

    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  getNextAvailableDate(dateString, availableDates) {
    // Convert the input date string to a Date object
    let inputDate = new Date(dateString);

    // Sort the available dates array
    availableDates.sort();

    // Loop through the available dates
    for (let i = 0; i < availableDates.length; i++) {
        // Convert the current available date to a Date object
        let availableDate = new Date(availableDates[i]);

        // Check if the available date is the same or after the input date
        if (availableDate >= inputDate) {
            return availableDates[i]; // Return the next available date
        }
    }

    // If no available dates are after the input date, return null or a message
    return null;
}

  splitKey = (key, exceptionKey) => {
    const regex = new RegExp(`(${exceptionKey})|_`, 'g');
    const parts = key.split(regex).filter(Boolean);
    let result = [];
    for (let i = 0; i < parts.length; i++) {
        if (parts[i] === exceptionKey) {
            result.push(parts[i]);
        } else {
            result = result.concat(parts[i].split('_'));
        }
    }
    return result.filter(Boolean);
  };
  //Get next values and increment index and calculate new values
  processValuesSequentially = (matchingValues,index,phase) => { 
    let validValues = [];
    const sortOrder = ['maaraaika', 'alkaa', 'paattyy', 'lautakunta', "viimeistaan_lausunnot", 'mielipiteet'];
    const isLargeProject = this.props.formValues.kaavaprosessin_kokoluokka === "XL" || this.props.formValues.kaavaprosessin_kokoluokka === "L" 
    //Sort to to order where viimeistaan and mielipiteet are last
    matchingValues = matchingValues.sort((a, b) => {
      const aIndex = sortOrder.findIndex(order => a.key.includes(order));
      const bIndex = sortOrder.findIndex(order => b.key.includes(order));
    
      // If key not found, assign a high index to push it to the end
      const aOrder = aIndex === -1 ? sortOrder.length : aIndex;
      const bOrder = bIndex === -1 ? sortOrder.length : bIndex;
    
      return aOrder - bOrder;
    });
    // Replace all underscores with spaces
    let phaseNormalized = phase.replace(/_/g, ' ');
    // Trim leading and trailing spaces just in case
    phaseNormalized = phaseNormalized.trim();
    // Capitalize the first character and concatenate with the rest of the string
    phaseNormalized = phaseNormalized.charAt(0).toUpperCase() + phaseNormalized.slice(1);
    //Add distance values,matching name and from what data was value calculated from to check later from deadlinesection data
    let distanceArray = []
    for (let i = 0; i < this.props.deadlineSections.length; i++) {
      if(this.props.deadlineSections[i].title.toLowerCase() === phaseNormalized.toLowerCase()){
        const sections = this.props.deadlineSections[i].sections[0].attributes
        for (let x = 0; x < sections.length; x++) {
          //Remove unwanted sections, ehdotus phase määräaika is not currently used in the timeline, possibly in the future, otherwise messes the allocation of keys and values
          if(
            sections[x].type === "date" && 
            sections[x].display !== "readonly" && 
            sections[x].label !== "Mielipiteet viimeistään" &&
            (isLargeProject 
              ? sections[x].name !== "ehdotus_nahtaville_aineiston_maaraaika_2" && 
                sections[x].name !== "ehdotus_nahtaville_aineiston_maaraaika_3" && 
                sections[x].name !== "ehdotus_nahtaville_aineiston_maaraaika_4"
              : true) &&
            (sections[x].attributesubgroup === "Nähtäville" || 
              sections[x].attributesubgroup === "Esille" || 
              sections[x].attributesubgroup === "Esityslistalle")
            ){
            distanceArray.push({"name":sections[x].name,"distance":sections[x].distance_from_previous,"linkedData":sections[x].previous_deadline})
          }
        }
      }  
    }
    let newItem

    for (const { key } of matchingValues) {
      console.log(key)
        let valueToCheck
        let daysToAdd

        let foundItem = matchingValues.find(item => item?.key?.includes("_paattyy") || item?.key?.includes("_lautakunnassa")) || matchingValues[0]?.value;
        let newDate = new Date(foundItem.value ? foundItem.value : foundItem);
        //let matchingSection = distanceArray.find(section => section.name === nextKey)
        let matchingSection
        if(!newItem){
          matchingSection = objectUtil.findItem(distanceArray,foundItem.key,"name",1)
          if(matchingSection?.name.includes("viimeistaan_lausunnot")){
            matchingSection = objectUtil.findItem(distanceArray,matchingSection.name,"name",1)
          }
          if(!matchingSection?.name.includes("_lautakunnassa")){
            newItem = matchingSection?.name
          }
        }
        else{
          if(newItem){
            const newVal = validValues.find(item => item.key === newItem)
            newDate = new Date(newVal.value)
            matchingSection = objectUtil.findItem(distanceArray,newItem,"name",1)
          }
          else{
            matchingSection = objectUtil.findItem(distanceArray,foundItem.key,"name",1)
          }
        }
        const matchingItem = objectUtil.findMatchingName(this.state.unfilteredSectionAttributes, matchingSection.name, "name");
        //const previousItem = objectUtil.findItem(this.state.unfilteredSectionAttributes, nextKey, "name", -1);
        //const nextItem = objectUtil.findItem(this.state.unfilteredSectionAttributes, nextKey, "name", 1);
        let dateFilter

        if(matchingItem.attributesubgroup === "Esille" && (this.props.attributeData?.kaavaprosessin_kokoluokka === "XL" || this.props.attributeData?.kaavaprosessin_kokoluokka === "L")){
          dateFilter = matchingSection.name.includes("_maaraaika") ? this.props.dateTypes?.työpäivät?.dates : this.props.dateTypes?.esilläolopäivät?.dates  //määräaika or alkaa/paattyy
        }
        else if(matchingItem.attributesubgroup === "Esille" && (this.props.attributeData?.kaavaprosessin_kokoluokka === "XS" || this.props.attributeData?.kaavaprosessin_kokoluokka === "S" || this.props.attributeData?.kaavaprosessin_kokoluokka === "M")){
          dateFilter = matchingSection.name.includes("_maaraaika") ? this.props.dateTypes?.työpäivät?.dates : this.props.dateTypes?.arkipäivät?.dates //määräaika or alkaa paattyy
        }
        else if(matchingItem.attributesubgroup === "Nähtäville" && (this.props.attributeData?.kaavaprosessin_kokoluokka === "XL" || this.props.attributeData?.kaavaprosessin_kokoluokka === "L")){
          dateFilter = matchingSection.name.includes("_maaraaika") ? this.props.dateTypes?.työpäivät?.dates : this.props.dateTypes?.arkipäivät?.dates //määräaika or alkaa paattyy
        }
        else if(matchingItem.attributesubgroup === "Nähtäville" && (this.props.attributeData?.kaavaprosessin_kokoluokka === "XS" || this.props.attributeData?.kaavaprosessin_kokoluokka === "S" || this.props.attributeData?.kaavaprosessin_kokoluokka === "M")){
          dateFilter = matchingSection.name.includes("_maaraaika") ? this.props.dateTypes?.työpäivät?.dates :  this.props.dateTypes?.arkipäivät?.dates//määräaika or alkaa paattyy
        }
        else{
          dateFilter = matchingSection.name.includes("_maaraaika") ? this.props.dateTypes?.työpäivät?.dates :  this.props.dateTypes?.lautakunnan_kokouspäivät?.dates//määräaika or lautakuntapäivä
        }

        if(matchingSection.name.includes("_alkaa")){
          daysToAdd = matchingSection.distance
        }
        else if(matchingSection.name.includes("_paattyy")){
          daysToAdd = matchingSection.distance
        }
        else if(matchingSection.name.includes("viimeistaan_lausunnot")){
          //Should always be last item in the list so paattyy is already there
          const endingObjectValue = validValues.find(item => item?.key?.includes('_paattyy'))?.value;
          valueToCheck = endingObjectValue
        }
        else{
          //5 if for some reason there is no distance value set in backend/Excel
          daysToAdd = matchingSection.distance ? matchingSection.distance : 5
        }


        if(!matchingSection.name.includes("viimeistaan_lausunnot")){
          while (daysToAdd > 0) {
            newDate.setDate(newDate.getDate() + 1);
            const dateStr = newDate.toISOString().split('T')[0];
            //Skip dates that are not compatible
            if (dateFilter?.includes(dateStr) && !this.props.lomapaivat?.includes(dateStr)) {
                daysToAdd--;
            }
          }
        }

        valueToCheck = newDate.toISOString().split('T')[0];
        validValues.push({ key: matchingSection.name, value: valueToCheck });

        if(!validValues.find(item => item?.key?.includes('_lautakunnassa'))){
          newItem = matchingSection.name
        }

        validValues = validValues.filter(item => item?.value !== null)
    }
    //new values that are added to vis timeline when add is clicked
    return validValues;
  }

  addGroup = (changedValues) => {
    // Get the keys from changedValues
    const keys = Object.keys(changedValues);
    let phase = '';
    let content = '';
    let index = textUtil.getNumberAfterSuffix(Object.keys(changedValues)[0]); //get index from added value, null if not found aka first
    let idt = "";
    let deadlinegroup = "";
    let groupID = null;
    const groups = this.state.groups.get();
    let className = "";
    let matchingValues = Object.entries(this.props.formValues);

    // Iterate over the keys
    for (let key of keys) {
      const exceptionKey = "tarkistettu_ehdotus";
      const parts = this.splitKey(key, exceptionKey);
      if (parts.length > 3 && key.includes("esillaolo") || parts.length > 2 && key.includes("lautakuntaan")) {
        phase = parts[key.includes("lautakuntaan") ? 0 : 1];
        content = parts[key.includes("lautakuntaan") ? 1 : 2];
        index = index !== null ? index : parts[key.includes("lautakuntaan") ? 2 : 3]; //get index if null
  
        if (phase === "tarkistettu_ehdotus") {
          phase = phase.charAt(0).toUpperCase() + phase.slice(1);
          phase = phase.replace(/_/g, ' ');
        }

        const group = groups.find(group => phase.toLowerCase() === group.content.toLowerCase());
        groupID = group ? group.id : null;
        
        //Find correct group by phase and content of vis items
        let filteredGroups = groups.filter(group => {
          if (phase === "Tarkistettu ehdotus" && content === "lautakuntaan" && phase === group?.content) {
            content = "lautakunta";
          } else if (phase === group?.content.toLowerCase() && content === "lautakuntaan") {
            content = "lautakunta";
          } else if (phase === "ehdotus" && content === "esillaolo") {
            content = "nahtavillaolo";
          }
  
          return typeof group?.deadlinegroup === 'string' && group?.deadlinegroup.includes(phase === "Tarkistettu ehdotus" ? phase.toLowerCase().replace(/\s+/g, '_') : phase.toLowerCase()) && group?.deadlinegroup.includes(content);
        });
        //idt for new group
        if (filteredGroups.length > 0) {
          deadlinegroup = filteredGroups[0].deadlinegroup;
          // Step 2: Extract group IDs and ensure they are numbers
          const groupIds = groups.map(group => parseInt(group.id)).filter(id => !isNaN(id));

          // Step 3: Find the largest ID, handle case where there are no groups
          const largestId = groupIds.length > 0 ? Math.max(...groupIds) : 0;

          // Step 4: Get the next available ID
          const nextGroupId = largestId + 1;
          idt = nextGroupId
  
          deadlinegroup = deadlinegroup.replace(/_(\d+)/, (match, number) => {
            return '_' + (parseInt(number, 10) + 1);
          });
          //Add idt to nestgroups so it will be created to vis timeline as new group
          const updatedGroups = groups.map(group => {
            let content = group?.content;
            if (content === "lautakuntaan") {
              content = "lautakunta";
            } else if (phase === "ehdotus" && content === "esillaolo") {
              content = "nahtavillaolo";
            }
            if (String(content).toLowerCase() === phase.toLowerCase()) {
              group.nestedGroups.push(idt);
            }
            return group;
          });
  
          if (updatedGroups.length > 0) {
            // this.state.groups.add(updatedGroups);
          }
        }
      }
    }
  
    if (content === "esillaolo" || content === "nahtavillaolo" || content === "lautakuntaan" || content === "lautakunta") {
      let filterContent;
      if (content === "nahtavillaolo") {
        filterContent = "nahtavilla";
      }
      className = "inner-end";
      let indexKey = '';
      if (index > 2) {
        indexKey = "_" + Number(index - 1);
      }    

      phase = phase.toLowerCase().replace(/\s+/g, '_');
      let syntaxToCheck = "";
      let syntaxToCheck2 = "";
      if (phase === "ehdotus") {
        //Special check for ehdotus phase
        syntaxToCheck = "ehdotuksen";
        syntaxToCheck2 = "ehdotuksesta";
      }
      //Get existing keys and values
      if (content === "lautakuntaan" || content === "lautakunta") {
        matchingValues = Object.entries(this.props.formValues)
          .filter(([key]) =>
            key === phase + '_kylk_aineiston_maaraaika' + indexKey ||
            key === phase + '_kylk_maaraaika' + indexKey ||
            key === 'milloin_' + phase + '_lautakunnassa' + indexKey || 
            key === 'milloin_kaava' + phase + '_lautakunnassa' + indexKey || 
            key === 'kaava' + phase + '_kylk_aineiston_maaraaika' + indexKey || 
            key === phase + '_lautakunta_aineiston_maaraaika' + indexKey
          )
          .map(([key, value]) => ({ key, value }));
      } else {
        matchingValues = Object.entries(this.props.formValues)
          .filter(([key]) =>
            key === 'milloin_' + phase + '_' + content + '_alkaa' + indexKey ||
            key === 'milloin_' + syntaxToCheck + '_' + filterContent + '_alkaa_iso' + indexKey ||
            key === 'milloin_' + syntaxToCheck + '_' + filterContent + '_alkaa_pieni' + indexKey ||
            key === 'milloin_' + phase + '_' + content + '_paattyy' + indexKey ||
            key === 'milloin_' + syntaxToCheck + '_' + filterContent + '_paattyy' + indexKey ||
            key === phase + '_nahtaville_aineiston_maaraaika' + indexKey ||
            key === phase + '_esillaolo_aineiston_maaraaika' + indexKey ||
            key === phase + 'aineiston_maaraaika' + indexKey ||
            key === 'viimeistaan_lausunnot_' + syntaxToCheck2 + indexKey
            //key === 'viimeistaan_mielipiteet_' + phase + indexKey
          )
          .map(([key, value]) => ({ key, value }));
      }
    }

    //Get next values and increment index and calculate new values
    const validValues = this.processValuesSequentially(matchingValues, index, phase);

    if (validValues.length >= 2 || validValues.length === 1 && validValues[0].key.includes("_lautakunnassa")) {
      let newIndex;
      let indexString;
       if (index > 2) {
        newIndex = index;
        indexString = "_" + index;
      } else {
        newIndex = "2";
        indexString = "_2";
      } 
  
      let start = null;
      let end = null;
      let deadline = null;
      let atBoard = null;
      let nahtavillaolo = false;
  
      for (let i = 0; i < validValues.length; i++) {
        if (validValues[i].key.includes("alkaa") || validValues[i].key.includes("alkaa_iso") || validValues[i].key.includes("alkaa_pieni")) {
          start = new Date(validValues[i].value);
          start.setHours(12, 0, 0, 0);
          if (validValues[i].key.includes("nahtavilla")) {
            nahtavillaolo = true;
          }
        } else if (validValues[i].key.includes("paattyy")) {
          end = new Date(validValues[i].value);
          end.setHours(12, 0, 0, 0);
        } else if (validValues[i].key.includes("maaraaika")) {
          if (validValues[i].key.includes("ehdotus") && (matchingValues.kaavaprosessin_kokoluokka === "XL" || matchingValues.kaavaprosessin_kokoluokka === "L")) {
            deadline = null;
          } else {
            deadline = new Date(validValues[i].value);
            deadline.setHours(12, 0, 0, 0);
          }
        } else if (validValues[i].key.includes("lautakunnassa")) {
          atBoard = new Date(validValues[i].value);
          atBoard.setHours(12, 0, 0, 0);
        }
        if (start && end && deadline && atBoard) break;
      }
  
      if (validValues.length > 2 && deadline) {
        const deadlineItem = {
          className: "board",
          content: "",
          group: idt,
          id: this.state.items.length + 1,
          locked: false,
          phase: false,
          phaseID: groupID,
          start: deadline,
          type: 'point',
          title: "maaraaika"
        };
        this.state.items.add(deadlineItem);
  
        const dividerItem = {
          className: "divider",
          content: "",
          group: idt,
          id: this.state.items.length + 1,
          locked: false,
          phase: false,
          phaseID: groupID,
          start: deadline,
          end: start,
          title: "divider"
        };
        this.state.items.add(dividerItem);
      }
  
      if (start && end) {
        const newItems = {
          className: className,
          content: "",
          group: idt,
          id: this.state.items.length + 1,
          locked: false,
          phase: false,
          phaseID: groupID,
          start: start,
          end: end,
          title: content === "esillaolo" || content === "nahtavillaolo" 
            ? nahtavillaolo === true 
              ? "milloin_" + phase + "_nahtavillaolo_paattyy" + indexString 
              : "milloin_" + phase + "_esillaolo_paattyy" + indexString 
            : phase + "_lautakunta_aineiston_maaraaika" + indexString,
        };
        this.state.items.add(newItems);
      }
  
      if (deadline && atBoard && index < 2) {
        const newItems = {
          className: "board",
          content: "",
          group: idt,
          id: this.state.items.length + 1,
          locked: false,
          phase: false,
          phaseID: groupID,
          start: deadline,
          end: atBoard,
          title: phase + "_lautakunta_aineiston_maaraaika" + indexString,
        };
        this.state.items.add(newItems);
      }
  
      if (atBoard && index > 1) {
        const boardItem = {
          className: "board-only",
          content: "",
          group: idt,
          id: this.state.items.length + 1,
          locked: false,
          phase: false,
          phaseID: groupID,
          start: atBoard,
          type: 'point',
          title: "Lautakunta",
        };
        this.state.items.add(boardItem);
      }
  
      const newSubGroup = {
        id: idt,
        content: content === "esillaolo" || content === "nahtavillaolo" 
          ? nahtavillaolo === true 
            ? "Nahtavillaolo-" + newIndex 
            : "Esilläolo-" + newIndex 
          : "Lautakunta-" + newIndex,
        abbreviation: "",
        deadlinegroup: content === "esillaolo" || content === "nahtavillaolo" 
          ? nahtavillaolo === true 
            ? phase + "_nahtavillaolokerta" + indexString 
            : phase + "_esillaolokerta" + indexString 
          : phase + "_lautakuntakerta" + indexString,
        deadlinesubgroup: "",
        locked: false
      };
      this.state.groups.add(newSubGroup);
  
      let phaseCapitalized = phase.charAt(0).toUpperCase() + phase.slice(1);
      if (phaseCapitalized === "Tarkistettu_ehdotus") {
        phaseCapitalized = phaseCapitalized.replace(/_/g, ' ');
      }
      const updateGroups = this.state.groups.get();
      let phaseGroup = updateGroups.find(group => group.content.toLowerCase() === phaseCapitalized.toLowerCase());
  
      if (phaseGroup?.nestedGroups) {
        const nestedGroupIds = phaseGroup.nestedGroups;
        const nestedGroups = updateGroups.filter(group => nestedGroupIds.includes(group.id));
        nestedGroups.sort((a, b) => a.content.localeCompare(b.content));
  
        const groupsWithNestedInGroup = updateGroups.filter(group => group.nestedInGroup);
        const groupsWithoutNestedInGroup = updateGroups.filter(group => !group.nestedInGroup);
  
        groupsWithNestedInGroup.sort((a, b) => a.content.localeCompare(b.content));
        const sortedGroups = groupsWithoutNestedInGroup.concat(groupsWithNestedInGroup);
  
        this.state.groups.clear();
        this.state.groups.add(sortedGroups);
      }
  
      validValues.forEach(({ key, value }) => {
        let modifiedKey;
        const numericRegex = /_\d+$/; // Matches keys that end with an underscore followed by one or more digits
        if (numericRegex.test(key)) {
          modifiedKey = key.replace(numericRegex, indexString);
        } else {
          modifiedKey = key + indexString;
        }
        this.props.dispatch(change(EDIT_PROJECT_TIMETABLE_FORM, modifiedKey, value));
      });
    } else {
      console.error("Not enough matching values to create new items.");
    }
  };  

  getChangedValues = (prevValues, currentValues) => {
    const changedValues = {};

    Object.keys(currentValues).forEach((key) => {
      if (prevValues[key] !== currentValues[key]) {
        changedValues[key] = currentValues[key];
      }
    });
    
    const isAddRemove = Object.entries(changedValues).some(([key, value]) => 
      (key.includes('jarjestetaan') || key.includes('lautakuntaan')) && 
      typeof value === 'boolean' && value === true
    );
    //If isAddRemove is false then it is a delete and add is true
    return [isAddRemove,changedValues];
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

  trackExpandedGroups = (e) => {
    const { collapseData } = this.state;
    const key = e.target.innerText;
    const value = e.target.classList.value.includes("expanded") ? false : true;
    const updatedCollapseData = { ...collapseData, [key]: value };
    this.setState({ collapseData: updatedCollapseData });
  }

  render() {
    const { loading } = this.state
    const { 
      open, 
      formValues, 
      deadlines, 
      deadlineSections, 
      t, 
      formSubmitErrors, 
      projectPhaseIndex, 
      currentProject, 
      allowedToEdit, 
      isAdmin, 
      disabledDates, 
      lomapaivat,
      dateTypes } = this.props

    if (!formValues || !this.state.groups) {
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
        <Modal.Header><IconInfoCircle size="m" aria-hidden="true"/><span className='header-title'>{t('deadlines.modify-timeline')}</span></Modal.Header>
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
              disabledDates={disabledDates}
              lomapaivat={lomapaivat}
              dateTypes={dateTypes}
              trackExpandedGroups={this.trackExpandedGroups}
              sectionAttributes={this.state.sectionAttributes}
            /> 
            <ConfirmModal 
              openConfirmModal={this.state.showModal}
              headerText={"Haluatko hylätä muutokset?"} 
              contentText={"Olet muuttanut aikataulun tietoja. Jos hylkäät muutokset, et voi palauttaa niitä myöhemmin."} 
              button1Text={"Peruuta"} 
              button2Text={"Hylkää muutokset"} 
              onButtonPress1={this.handleCancelCancel} 
              onButtonPress2={this.handleContinueCancel}
              style={"timetable-danger-modal"}
              buttonStyle1={"secondary"}
              buttonStyle2={"danger"}
            />
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
  formSubmitErrors: PropTypes.object,
  deadlineSections: PropTypes.array,
  disabledDates: PropTypes.array,
  lomapaivat: PropTypes.array,
  formValues: PropTypes.object,
  deadlines: PropTypes.array,
  initialize: PropTypes.func.isRequired,
  submitFailed: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  validated: PropTypes.bool.isRequired,
}

const mapStateToProps = state => ({
  formSubmitErrors: getFormSubmitErrors(EDIT_PROJECT_TIMETABLE_FORM)(state),
  deadlineSections: deadlineSectionsSelector(state),
  formValues: getFormValues(EDIT_PROJECT_TIMETABLE_FORM)(state),
  deadlines: deadlinesSelector(state),
  validated: validatedSelector(state),
  dateValidationResult : dateValidationResultSelector(state)
})

const decoratedForm = reduxForm({
  form: EDIT_PROJECT_TIMETABLE_FORM
})(withTranslation()(withValidateDate(EditProjectTimeTableModal)));

export default connect(mapStateToProps)(decoratedForm)
