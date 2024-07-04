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
import ConfirmModal from '../../common/ConfirmModal';
import withValidateDate from '../../../hocs/withValidateDate';

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

  componentDidMount() {
    const { initialize, attributeData, deadlines, deadlineSections, disabledDates } = this.props
    initialize(attributeData)
   // Check if the key exists and its value is true
    if(attributeData && deadlines && deadlineSections){
      let items = new visdata.DataSet()
      let groups = new visdata.DataSet();

      let [deadLineGroups,nestedDeadlines,phaseData] = this.getTimelineData(deadlineSections,attributeData,deadlines)

      groups.add(deadLineGroups);
      groups.add(nestedDeadlines);
      items.add(phaseData)
      items = this.findConsecutivePeriods(disabledDates,items);

      this.setState({items,groups,visValues:attributeData})
    }
  }

  findConsecutivePeriods = (dates,items) => {
    if (!Array.isArray(dates) || dates.length === 0) {
      return [];
    }
  
    let start = dates[0];
    let end = dates[0];
  
    for (let i = 1; i < dates.length; i++) {
      const currentDate = new Date(dates[i]);
      const previousDate = new Date(dates[i - 1]);
      const differenceInTime = currentDate - previousDate;
      const differenceInDays = differenceInTime / (1000 * 3600 * 24);

      if (differenceInDays === 1) {
        end = dates[i];
      } else {
        items.add([{
          id: `disabled_date_${i}`,
          start: start,
          end: end,
          type: "background",
          className: new Date(start).getDate() - new Date(end).getDate() === 0 || new Date(start).getDate() - new Date(end).getDate() === -1 ? "negative normal-weekend" : "negative",
        }]);
        start = dates[i];
        end = dates[i];
      }
    }
  
    // Push the last period
    items.add([{
      id: `disabled_date_${dates.length}`,
      start: start,
      end: end,
      type: "background",
      className: "negative",
    }]);
  
    return items;
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
          let [deadLineGroups,nestedDeadlines,phaseData] = this.getTimelineData(deadlineSections,formValues,deadlines)
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

  shouldComponentUpdate(prevProps, prevState) {
    if (isEqual(prevProps, this.props) && isEqual(prevState, this.state)) {
      return false
    }
    return true
  }

  addDeadLineGroups = (deadlineSections,deadLineGroups) => {
    for (let i = 0; i < deadlineSections.length; i++) {
      for (let x = 0; x < deadlineSections[i].sections.length; x++) {
        if (!deadLineGroups.some(item => item.content === deadlineSections[i].title)) {
          let esillaolokerta = 0
          let lautakuntakerta = 0
          Object.keys(deadlineSections[i].sections[x].attributes).forEach(key => {
            // add max count for esilläolo and lautakunta groups
            if (key.includes('esillaolokerta') || key.includes('nahtavillaolokerta')) {
              esillaolokerta++
            }
            if(key.includes('lautakuntakerta')){
              lautakuntakerta++
            }
          });
          deadLineGroups.push({
            id: deadlineSections[i].title,
            content: deadlineSections[i].title,
            showNested: true,
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
        className: "phase-length",
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

  addSubgroup = (deadlines, i, numberOfPhases, dashStart, dashEnd, dashedStyle, phaseData, deadLineGroups, nestedDeadlines, milestone) => {
    if(dashEnd === null){
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
  
    let dlIndex = deadLineGroups.findIndex(group => group.content === deadlines[i].deadline.phase_name);
    deadLineGroups?.at(dlIndex)?.nestedGroups.push(numberOfPhases);
    const lastChar = deadlines[i].deadline.deadlinegroup.charAt(deadlines[i].deadline.deadlinegroup.length - 1); // Get the last character of the string
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

    let numberOfPhases = 1

    let startDate = false
    let endDate = false
    let style = ""

    let dashedStyle = "inner"

    let innerStart = false
    let innerEnd = false
    let innerStyle = "inner-end"

    let milestone = false

    for (let i = 0; i < deadlines.length; i++) {
      if(deadlines[i].deadline.deadline_types.includes('phase_start')){
        //If formValues has deadlines[i].deadline.attribute use that values, it if not then use deadline[i].date in startDate.
        startDate = formValues && formValues[deadlines[i].deadline.attribute] ? formValues[deadlines[i].deadline.attribute] : deadlines[i].date;
        style = deadlines[i].deadline.phase_color
        //.setHours(23,59,59,0)
      }
      else if(deadlines[i]?.deadline?.attribute?.includes("esillaolo") || deadlines[i]?.deadline?.attribute?.includes("luonnosaineiston_maaraaika")){
        if(deadlines[i].deadline.deadline_types.includes('milestone') && deadlines[i].deadline.deadline_types.includes('dashed_start')){
          milestone = formValues && formValues[deadlines[i].deadline.attribute] ? formValues[deadlines[i].deadline.attribute] : deadlines[i].date;
        }
        else if(deadlines[i].deadline.deadline_types.includes('inner_start')){
          innerStart = formValues && formValues[deadlines[i].deadline.attribute] ? formValues[deadlines[i].deadline.attribute] : deadlines[i].date;
        }
        else if(deadlines[i].deadline.deadline_types.includes('inner_end')){
          innerEnd = formValues && formValues[deadlines[i].deadline.attribute] ? formValues[deadlines[i].deadline.attribute] : deadlines[i].date;
          innerStyle = "inner-end"
        }
      }
      else if(deadlines[i]?.deadline?.attribute?.includes("nahtavilla") || deadlines[i]?.deadline?.deadlinegroup?.includes("nahtavillaolokerta") || deadlines[i]?.deadline?.attribute?.includes("ehdotus_nahtaville_aineiston_maaraaika")){
        if(deadlines[i].deadline.deadline_types.includes('milestone') && deadlines[i].deadline.deadline_types.includes('dashed_start')){
          milestone = formValues && formValues[deadlines[i].deadline.attribute] ? formValues[deadlines[i].deadline.attribute] : deadlines[i].date;
        }
        else if(deadlines[i].deadline.deadline_types.includes('inner_start')){
          innerStart = formValues && formValues[deadlines[i].deadline.attribute] ? formValues[deadlines[i].deadline.attribute] : deadlines[i].date;
        }
        else if(deadlines[i].deadline.deadline_types.includes('inner_end')){
          innerEnd = formValues && formValues[deadlines[i].deadline.attribute] ? formValues[deadlines[i].deadline.attribute] : deadlines[i].date;
          innerStyle = "inner-end"
        }
      }
      else if(deadlines[i]?.deadline?.attribute?.includes("lautakunta") || deadlines[i]?.deadline?.attribute?.includes("lautakunnassa") || 
      deadlines[i]?.deadline?.attribute?.includes("tarkistettu_ehdotus_kylk_maaraaika") || 
      deadlines[i]?.deadline?.attribute?.includes("ehdotus_kylk_aineiston_maaraaika") ||
      deadlines[i]?.deadline?.attribute?.includes("kaavaluonnos_kylk_aineiston_maaraaika")){
        if(deadlines[i].deadline.deadline_types.includes('milestone') && deadlines[i].deadline.deadline_types.includes('dashed_start')){
          innerStart = formValues && formValues[deadlines[i].deadline.attribute] ? formValues[deadlines[i].deadline.attribute] : deadlines[i].date;
        }
        else if(deadlines[i].deadline.deadline_types.includes('milestone') && deadlines[i].deadline.deadline_types.includes('dashed_end')){
          innerEnd = formValues && formValues[deadlines[i].deadline.attribute] ? formValues[deadlines[i].deadline.attribute] : deadlines[i].date;
          innerStyle = "board"
        }
        else if(deadlines[i].deadline.deadline_types.includes('inner_start')){
          innerStart = formValues && formValues[deadlines[i].deadline.attribute] ? formValues[deadlines[i].deadline.attribute] : deadlines[i].date;
        }
        else if(deadlines[i].deadline.deadline_types.includes('inner_end')){
          innerEnd = formValues && formValues[deadlines[i].deadline.attribute] ? formValues[deadlines[i].deadline.attribute] : deadlines[i].date;
        }
      }
      else if(deadlines[i].deadline.deadline_types.includes('phase_end') && deadlines[i].deadline.date_type !== "Arkipäivät"){
        endDate = formValues && formValues[deadlines[i].deadline.attribute] ? formValues[deadlines[i].deadline.attribute] : deadlines[i].date;
        //new Date .setHours(0,0,0,0)
      }

      if(startDate && endDate){
        //Main group items not movable(Käynnistys, Periaatteet, OAS etc)
        let mainGroup = this.addMainGroup(deadlines, i, numberOfPhases, startDate, endDate, style, phaseData, deadLineGroups, nestedDeadlines);
        [phaseData, deadLineGroups, nestedDeadlines] = mainGroup;
        startDate = false
        endDate = false
        numberOfPhases++
      }
      else if(milestone && deadlines[i].deadline.phase_name === "Ehdotus" && deadlines[i].deadline.deadlinegroup !== "ehdotus_lautakuntakerta_1" && formValues.kaavaprosessin_kokoluokka === "XL" || deadlines[i].deadline.phase_name === "Ehdotus" && deadlines[i].deadline.deadlinegroup !== "ehdotus_lautakuntakerta_1" && formValues.kaavaprosessin_kokoluokka === "L"){
        let subgroup = this.addSubgroup(deadlines, i, numberOfPhases, milestone, null, dashedStyle, phaseData, deadLineGroups, nestedDeadlines, milestone);
        [phaseData, deadLineGroups, nestedDeadlines] = subgroup;
        milestone = false
        numberOfPhases++
      }
      else if(milestone && innerStart && innerEnd || innerStart && innerEnd){
        let subgroup2 = this.addSubgroup(deadlines, i, numberOfPhases, innerStart, innerEnd, innerStyle, phaseData, deadLineGroups, nestedDeadlines, milestone);
        [phaseData, deadLineGroups, nestedDeadlines] = subgroup2;
        innerStart = false
        innerEnd = false
        milestone = false
        numberOfPhases++
      }
    }

    return [deadLineGroups,nestedDeadlines,phaseData]
  }

  getTimelineData = (deadlineSections,formValues,deadlines) => {
      let phaseData = []
      let deadLineGroups = []
      let nestedDeadlines = []

      deadLineGroups = this.addDeadLineGroups(deadlineSections,deadLineGroups)
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
  
   processValuesSequentially = async (matchingValues) => { 
    
    const validValues = [];
    let foundItem = matchingValues.find(item => item.key.includes("_paattyy")) || matchingValues[0].value;

    for (const { key } of matchingValues) {
      try {          
        let valueToCheck
          //Add required range between dates
        let newDate = new Date(foundItem.value ? foundItem.value : foundItem);
        let daysToAdd = key.includes("_maaraaika") ? 15 : 30; //Replace with excel info later
        daysToAdd = key.includes("_paattyy") ? daysToAdd + 30 : daysToAdd;
        while (daysToAdd > 0) {
            newDate.setDate(newDate.getDate() + 1);
            const dateStr = newDate.toISOString().split('T')[0];
            //Skip weekends and holidays
            if (newDate.getDay() != 0 && newDate.getDay() != 6 && !this.props.disabledDates.includes(dateStr)) { // Skip Sundays (0) and Saturdays (6)
                daysToAdd--;
            }
        }
        valueToCheck = newDate.toISOString().split('T')[0];
        //Is check needed when logic is in frontend?
        //const date = await this.getNewValidDates(key, this.props.formValues['projektin_nimi'], valueToCheck);
        validValues.push({ key: key, value: valueToCheck });
      } catch (error) {
        validValues.push({ key: key, value: null });
      }
    }

    return validValues;
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

  addGroup = async (changedValues) => {
    try{
      // Get the keys from changedValues
      const keys = Object.keys(changedValues);
      let phase = '';
      let content = '';
      let index = null;
      let idt = "";
      let deadlinegroup = "";
      let groupID = null;
      const groups = this.state.groups.get();
      let className = "";
      let matchingValues = Object.entries(this.props.formValues);
    
      // Iterate over the keys
      for (let key of keys) {
        // Split the key into an array of substrings
        const exceptionKey = "tarkistettu_ehdotus";
        const parts = this.splitKey(key, exceptionKey);

        // Check if there are at least two underscores in the key
        if (parts.length > 3 && key.includes("esillaolo") || parts.length > 2 && key.includes("lautakuntaan")) {
          // Get the string between the first and second underscore
          phase = parts[key.includes("lautakuntaan") ? 0 : 1];
          content = parts[key.includes("lautakuntaan") ? 1 : 2];
          index = parts[key.includes("lautakuntaan") ? 2 : 3];
          // Find the group where phase equals content (converted to lowercase)
          const group = groups.find(group => phase === "tarkistettu_ehdotus" ? phase.replace(/_/g, ' ') : phase === group.content.toLowerCase());
          // Get the id of the group
          groupID = group ? group.id : null;
          // Filter the groups
          let filteredGroups = groups.filter(group => {
            if(content === "lautakuntaan"){
              content = "lautakunta"
            }
            // Check if the group contains stringBetweenUnderscores and content in deadlineGroups
            return typeof group?.deadlinegroup === 'string' && group?.deadlinegroup.includes(phase === "tarkistettu ehdotus" ? phase.replace(/\s+/g, '_') : phase) && group?.deadlinegroup.includes(content);
          });
          if (filteredGroups.length > 0) {
            // Get the deadlinegroup
            deadlinegroup = filteredGroups[0].deadlinegroup;
            // Get the length of groups
            const length = groups.length;
    
            // Update the id
            idt = length + 1;
            // Use the replace method with a regex to find the number after the underscore
            deadlinegroup = deadlinegroup.replace(/_(\d+)/, (match, number) => {
              // Parse the number, increase it by one, and return it with the underscore
              return '_' + (parseInt(number, 10) + 1);
            });
    
            // Create a new array with the updated groups
            const updatedGroups = groups.map(group => {
              let content = group?.content;
              if(content === "lautakuntaan"){
                content = "lautakunta"
              }
              // Check if the id of the group (in lowercase) is equal to phase
              if (String(content).toLowerCase() === String(phase === "tarkistettu_ehdotus" ? phase.replace(/_/g, ' ') : phase).toLowerCase()) {
                // Push the id to nestedGroups
                group.nestedGroups.push(idt);
              }
              // Return the group
              return group;
            });
            console.log(updatedGroups);
            // Update the groups
            if (updatedGroups.length > 0) {
              // this.state.groups.add(updatedGroups);
            }
          }
        }
      }

      if (content === "esillaolo" || content === "nahtavillaolo" || content === "lautakuntaan" || content === "lautakunta") {
        className = "inner-end";
        let indexKey = '';
        if (index > 2) {
          indexKey = "_" + (index - 1);
        }
        phase = phase.toLowerCase().replace(/\s+/g, '_');
        matchingValues = Object.entries(this.props.formValues)
          .filter(([key]) =>
            key === 'milloin_' + phase + '_' + content + '_alkaa' + indexKey ||
            key === 'milloin_' + phase + '_' + content + '_paattyy' + indexKey ||
            key === phase + "_kylk_aineiston_maaraaika" + indexKey ||
            key === phase + "_esillaolo_aineiston_maaraaika" + indexKey ||
            key === phase + "_kylk_maaraaika" + indexKey ||
            key === 'milloin_' + phase + '_lautakunnassa' + indexKey
          )
          .map(([key, value]) => ({ key, value }))
      }
      // Process the values sequentially and return new validated values from backend
      // waits for all values to be ready so vis does not give error if missing start or end date
      this.processValuesSequentially(matchingValues, index).then(validValues => {
          if (validValues.length >= 2) {
            let newIndex
            let indexString
            // Check if index is greater than 1
            if (index > 1) {
              newIndex = index; // Increment index by 1 and convert to string
              indexString = "_" + newIndex; // Prefix the incremented index with "_"
            }
            else {
              newIndex = "2";
              indexString = "_2"; // Directly set to "_2" as this block only executes when index <= 1
            }

            if(validValues.length > 2 && validValues[2].key.includes("maaraaika")){
              const deadlineItem = {
                className: "board",
                content: "",
                group: idt,
                id: this.state.items.length + 1,
                locked: false,
                phase: false,
                phaseID: groupID,
                start: validValues[2].value,
                type: 'point',
                title: "maaraaika"
              };
              this.state.items.add(deadlineItem);

              const diveverItem = {
                className: "divider",
                content: "",
                group: idt,
                id: this.state.items.length + 1,
                locked: false,
                phase: false,
                phaseID: groupID,
                start: validValues[2].value,
                end: validValues[0].value,
                title: "divider"
              }
              this.state.items.add(diveverItem);
            }

            if(validValues[0].key.includes("alkaa") && validValues[1].key.includes("paattyy")){
              const newItems = {
                className: className,
                content: "",
                group: idt,
                id: this.state.items.length + 1,
                locked: false,
                phase: false,
                phaseID: groupID,
                start: validValues[0].value,
                end: validValues[1].value,
                title: content === "esillaolo" ? "milloin_" + phase + "_esillaolo_paattyy" + indexString : +phase + "_lautakunta_aineiston_maaraaika" + indexString,
              };
              this.state.items.add(newItems);
            }

            if(validValues[0].key.includes("maaraaika") && validValues[1].key.includes("lautakunnassa")){
              const newItems = {
                className: "board",
                content: "",
                group: idt,
                id: this.state.items.length + 1,
                locked: false,
                phase: false,
                phaseID: groupID,
                start: validValues[0].value,
                end: validValues[1].value,
                title: phase + "_lautakunta_aineiston_maaraaika" + indexString,
              };
              this.state.items.add(newItems);
            }
          
            const newSubGroup = {
              id: idt,
              content: content === "esillaolo" ? "Esilläolo-" + newIndex : "Lautakunta-" + newIndex,
              abbreviation: "",
              deadlinegroup: content === "esillaolo" ? phase + "_esillaolokerta" + indexString : phase + "_lautakuntakerta" + indexString,
              deadlinesubgroup: "",
              locked: false,
            };
            this.state.groups.add(newSubGroup);
          
            let phaseCapitalized = phase.charAt(0).toUpperCase() + phase.slice(1);
            if(phaseCapitalized === "Tarkistettu_ehdotus"){
              phaseCapitalized = phaseCapitalized.replace(/_/g, ' ');
            }
            const updateGroups = this.state.groups.get();
            const phaseGroup = updateGroups.find(group => group.content === phaseCapitalized);

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
              let modifiedKey
              const numericRegex = /_\d+$/; // Matches keys that end with an underscore followed by one or more digits
              if(numericRegex.test(key)){
                modifiedKey = key.replace(numericRegex, indexString);
              }
              else{
                modifiedKey = key + indexString
              }

              this.props.dispatch(change(EDIT_PROJECT_TIMETABLE_FORM, modifiedKey, value));
            });
          }
          else{
            console.error("Not enough matching values to create new items.");
          }
      });
    }
    catch (error) {
      console.error("Error in addGroup:", error);
    }
  };

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
      esillaolopaivat } = this.props

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
              disabledDates={disabledDates}
              esillaolopaivat={esillaolopaivat}
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
  formValues: PropTypes.object,
  deadlines: PropTypes.array,
  initialize: PropTypes.func.isRequired,
  submitFailed: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  formSubmitErrors: getFormSubmitErrors(EDIT_PROJECT_TIMETABLE_FORM)(state),
  deadlineSections: deadlineSectionsSelector(state),
  formValues: getFormValues(EDIT_PROJECT_TIMETABLE_FORM)(state),
  deadlines: deadlinesSelector(state)
})

const decoratedForm = reduxForm({
  form: EDIT_PROJECT_TIMETABLE_FORM
})(withTranslation()(withValidateDate(EditProjectTimeTableModal)));

export default connect(mapStateToProps)(decoratedForm)
