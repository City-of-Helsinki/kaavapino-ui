import React, { Component, createRef } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import { Modal } from 'semantic-ui-react'
import { reduxForm, getFormSubmitErrors, getFormValues, change } from 'redux-form'
import { connect } from 'react-redux'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../../constants'
import './styles.scss'
import { deadlineSectionsSelector } from '../../../selectors/schemaSelector'
import { withTranslation } from 'react-i18next'
import { deadlinesSelector,validatedSelector,dateValidationResultSelector,cancelTimetableSaveSelector, validatingTimetableSelector, timelineLockedGroupSelector } from '../../../selectors/projectSelector'
import { Button,IconInfoCircle, LoadingSpinner } from 'hds-react'
import { isEqual } from 'lodash'
import VisTimelineGroup from '../../ProjectTimeline/VisTimelineGroup.jsx'
import * as visdata from 'vis-data'
import ConfirmModal from '../../common/ConfirmModal.jsx';
import withValidateDate from '../../../hocs/withValidateDate.jsx';
import objectUtil from '../../../utils/objectUtil'
import { updateDateTimeline,validateProjectTimetable,setValidatingTimetable,setTimelineLockedGroup } from '../../../actions/projectActions';
import { getVisibilityBoolName, vis_bool_group_map, isDeadlineConfirmed } from '../../../utils/projectVisibilityUtils';
import timeUtil from '../../../utils/timeUtil'
import { shouldDispatchTimelineUpdate } from '../../../utils/timelineDispatchLogic'
import { focusTrapOnTabPressed, getFocusableElements } from '../projectModalUtils';
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
      sectionAttributes: [],
      unfilteredSectionAttributes: []
    }
    this.timelineRef = createRef();
  }

  handleKeyDown = (event) => {
    if (document.getElementById("timeline-edit-side-panel")) {
      focusTrapOnTabPressed(event, "timeline-edit-side-panel")
    } else {
      focusTrapOnTabPressed(event, 'edit-project-timetable-modal')
    }
  }

  componentDidMount() {
    const { initialize, attributeData } = this.props;

    document.addEventListener('keydown', this.handleKeyDown);

    if (this.props.open) {
      this.setBackgroundInert(true);
    }

    initialize(attributeData)
    this.initializeTimelineState(this.props)
    this.props.dispatch(setTimelineLockedGroup(null));
  }

  // Returns true if all props required to build the timeline data are available.
  hasTimelineData = (props) => {
    const { attributeData, deadlines, deadlineSections, disabledDates, lomapaivat, dateTypes } = props;
    return !!(attributeData && deadlines && deadlineSections && disabledDates && lomapaivat && dateTypes);
  }

  initializeTimelineState = (props) => {
    const { attributeData, deadlines, deadlineSections, disabledDates, lomapaivat } = props;
    if (!this.hasTimelineData(props)) return;

    let items = new visdata.DataSet()
    let groups = new visdata.DataSet();
    let ongoingPhase = this.trimPhase(attributeData?.kaavan_vaihe)
    let [deadLineGroups,nestedDeadlines,phaseData] = this.getTimelineData(deadlineSections,attributeData,deadlines,ongoingPhase,true)

    groups.add(deadLineGroups);
    groups.add(nestedDeadlines);
    items.add(phaseData)

    items = this.findConsecutivePeriods(disabledDates,items,false);
    items = this.findConsecutivePeriods(lomapaivat,items,true)
    this.setState({items,groups,visValues:attributeData})

    let sectionAttributes = []
    this.extractAttributes(deadlineSections, attributeData, sectionAttributes, (attribute, attributeData) => {
      return (attribute.label !== "Lausunnot viimeistään" && attributeData[attribute.name]) ||
      ["hyvaksymispaatos_pvm", "tullut_osittain_voimaan_pvm", "voimaantulo_pvm", "kumottu_pvm", "rauennut"].includes(attribute.name);
    });
    this.setState({sectionAttributes})

    const unfilteredSectionAttributes = []
    this.extractAttributes(deadlineSections, attributeData, unfilteredSectionAttributes);
    this.setState({unfilteredSectionAttributes})
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.setBackgroundInert(false);
    this.props.dispatch(setTimelineLockedGroup(null));
  }

  setBackgroundInert = (isInert) => {
    const appRoot = document.getElementById('root');
    if (!appRoot) return;
    appRoot.inert = !!isInert;
  };

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
    if (prevProps.open !== this.props.open) {
      this.setBackgroundInert(this.props.open);
    }
    if (!this.state.groups && this.hasTimelineData(this.props)) {
      this.initializeTimelineState(this.props)
    }
    if (this.props.timelineLockedGroup != prevProps.timelineLockedGroup) {
      if (this.props.timelineLockedGroup) {
        const lockedAttrKey = objectUtil.extractFromDeadlineSections(deadlineSections, (attr) => {
          return attr?.attributegroup === this.props.timelineLockedGroup && attr?.type ==='date';
        })?.[0]?.name;
        this.updateBackgroundOnLock(this.state.items, formValues?.[lockedAttrKey]);
      } else {
        this.resetBackgroundOnUnlock(this.state.items);
      }
    }
    if (prevProps.attributeData && !isEqual(prevProps.attributeData, attributeData)) {
      let sectionAttributes = [];
      this.extractAttributes(deadlineSections, attributeData, sectionAttributes, (attribute, attributeData) =>
        attributeData[attribute.name]
      );
      this.setState({sectionAttributes})
      //when UPDATE_DATE_TIMELINE updates attribute values
      Object.keys(attributeData).forEach(fieldName => 
        this.props.dispatch(change(EDIT_PROJECT_TIMETABLE_FORM, fieldName, attributeData[fieldName])));
      
      // Trigger validation after cascade is complete
      if (!this.props.validatingTimetable?.started) {
        this.props.dispatch(validateProjectTimetable(attributeData));
      }
    }
    if(prevProps.formValues && !isEqual(prevProps.formValues, formValues)){
      //Updates viimeistaan lausunnot values to paattyy if paattyy date is greater
      timeUtil.syncPhaseEndDates(formValues) // TODO: delete (should be done in deadline cascade)

      if(deadlineSections && deadlines && formValues && this.state.groups && this.state.items){
        const isGroupRemove = this.wasGroupRemoved(prevProps.formValues, formValues);

        // trigger validation when removing a group to recalculate phase boundaries
        if (isGroupRemove) {
          this.setState({visValues:formValues})
          setTimeout(() => {
            if (!this.props.validatingTimetable?.started) {
              this.props.dispatch(validateProjectTimetable(this.props.formValues));
            }
          }, 0);
        }
        if(!this.props.validated){
          let ongoingPhase = this.trimPhase(attributeData?.kaavan_vaihe)
          //Form items and groups
          let [deadLineGroups,nestedDeadlines,phaseData] = this.getTimelineData(deadlineSections,formValues,deadlines,ongoingPhase,false)
          // Update the existing data
          const combinedGroups = nestedDeadlines? deadLineGroups.concat(nestedDeadlines) : deadLineGroups
          this.state.groups.clear();
          this.state.groups.add(combinedGroups)
          // phaseData is an array, not a DataSet; update directly
          this.state.items.update(phaseData)
          const newObjectArray = objectUtil.findDifferencesInObjects(prevProps.formValues,formValues)

          // Check if timeline update should be dispatched (handles group add/remove scenarios)
          const dispatchDecision = shouldDispatchTimelineUpdate(
            newObjectArray, 
            this.props.validatingTimetable?.started,
          );
          
          if (dispatchDecision.shouldDispatch) {
            //Get added groups last date field and update all timelines ahead
            const { field, formattedDate } = this.getLastDateField(newObjectArray);
            //Dispatch added values to move other values in projectReducer if miniums are reached
            if(field && formattedDate){
              this.props.dispatch(updateDateTimeline(field, formattedDate, formValues, dispatchDecision.addingNew, deadlineSections));
            }
          }
          this.setState({visValues:formValues})
        }
        let sectionAttributes = [];
        this.extractAttributes(deadlineSections, formValues, sectionAttributes, (attribute, formValues) =>
          attribute.label !== "Lausunnot viimeistään" && formValues[attribute.name]
        );
        this.setState({sectionAttributes})
      }
    }
    if (this.props.validatingTimetable?.started && this.props.validatingTimetable?.ended) {
      // Validation has been started and completed, and the result handled above. Reset state.
      this.props.dispatch(setValidatingTimetable(false,false));
    }
    if(prevProps.cancelTimetableSave === false && this.props.cancelTimetableSave === true){
      this.setLoadingFalse();
    }
    if (prevProps.submitting && submitFailed) {
      this.setLoadingFalse()
    }
    if (prevProps.saving && !saving) {
      initialize(attributeData)
    }
  }

  shouldComponentUpdate(prevProps, prevState) {
    return !(isEqual(prevProps, this.props) && isEqual(prevState, this.state));
  }

  extractAttributes(deadlineSections, attributeData, targetArray, additionalConditions = () => true) {
    for (const phase of deadlineSections) {
      for (const section of phase.sections) {
        for (const attribute of section.attributes) {
          if (attribute.type === "date" && attribute.display !== "readonly" && additionalConditions(attribute, attributeData)) {
            // Create section attributes which are always in correct order to check dates in timeline
            targetArray.push(attribute);
          }
        }
      }
    }
  }

  getLastDateField(newObjectArray) {
    let field;
    let formattedDate;

    for (const element of newObjectArray) {
      if (this.isMatchingKey(element, "paattyy") || this.isMatchingKey(element, "lautakunnassa")) {
        field = element?.key;
        formattedDate = element?.obj2;
        break;
      }
    }

    return { field, formattedDate };
  }

  isMatchingKey(obj, substr) {
    return obj?.key.includes(substr) && typeof obj?.obj2 === "string";
  }

  trimPhase = (phase) => {
    if(!phase || typeof phase !== 'string') return '';
    const parts = phase.split('.', 2);
    if(parts.length === 1) return phase.trim();
    const prefix = parts[0].trim();
    const rest = parts[1].trim();
    // Drop numeric index (e.g. "2. Phase") OR size code (XL, L, M, S, XS, etc) OR short roman numeral
    if(/^(\d+|XS|S|M|L|XL|XXL|[IVX]{1,4})$/i.test(prefix)) {
      return rest; 
    }
    // Otherwise if previously logic would have returned an array, still just return trimmed original phase
    return phase.trim();
  } 

  isPhaseInPast = (phaseName, formValues) => {
    const phaseOrder = ["Käynnistys","Periaatteet","OAS","Luonnos","Ehdotus","Tarkistettu ehdotus","Hyväksyminen","Voimaantulo"];
    const currentPhase = this.trimPhase(formValues?.kaavan_vaihe || '');
    const currentIdx = phaseOrder.indexOf(currentPhase);
    const itemIdx = phaseOrder.indexOf(phaseName);
    return currentIdx !== -1 && itemIdx !== -1 && itemIdx < currentIdx;
  }

  buildInnerStyle = (baseStyle, date, currentDate, formValues, deadlineGroup, phaseName, isLocked = false) => {
    let style = baseStyle;
    if (date < currentDate) {
      style += " past";
    }
    if (isDeadlineConfirmed(formValues, deadlineGroup, false, false)) {
      style += " confirmed";
    }
    if (this.isPhaseInPast(phaseName, formValues) || isLocked) {
      style += " no-drag";
    }
    return style;
  }

  // Locked deadline group locks all deadlines whose date is at or after the locked date.
  isDeadlineLocked = (attribute, formValues, lockedDate) => {
    if (!lockedDate || !attribute) return false;
    const value = formValues?.[attribute];
    return !!value && value >= lockedDate;
  }

  updateBackgroundOnLock = (items, firstLockedDate) => {
    if (!items || !firstLockedDate) return items;

    this.resetBackgroundOnUnlock(items); // Remove any existing locked background before adding a new one

    const lockedStart = new Date(firstLockedDate);
    if (Number.isNaN(lockedStart.getTime())) return items;
    lockedStart.setHours(0, 0, 0, 0);

    const lockedEnd = new Date(lockedStart);
    lockedEnd.setFullYear(lockedEnd.getFullYear() + 10);

    items.add({
      id: `locked_background_${lockedStart.toISOString().slice(0, 10)}`,
      start: lockedStart,
      end: lockedEnd,
      type: 'background',
      className: 'locked-background'
    });
  }

  resetBackgroundOnUnlock = (items) => {
    if (!items || typeof items.get !== 'function') return;
    const lockedBackground = items.get().find(item => item.id?.toString().startsWith('locked_background_'));
    if (lockedBackground) items.remove(lockedBackground.id);
  }

  findConsecutivePeriods = (dates, items, holidays) => {
    if (!Array.isArray(dates) || dates.length === 0) {
      return [];
    }
  
    const isWeekend = (date) => {
      const day = date.getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    };

    const consecutiveGroups = [];
    // Group consecutive dates together
    let currentGroup = [dates[0]];

    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        // consecutive day → same group
        currentGroup.push(dates[i]);
      } else {
        // gap → new group
        consecutiveGroups.push(currentGroup);
        currentGroup = [dates[i]];
      }
    }
    consecutiveGroups.push(currentGroup);
    for (let group of consecutiveGroups) {
      for (let i = 0; i < group.length; i++) {
        const currentDate = new Date(group[i]);
        currentDate.setHours(0, 0, 0, 0);

        const endOfDay = new Date(group[i]);
        endOfDay.setHours(23, 59, 59, 998);

        // mark last item in this group
        const isLast = i === group.length - 1;
        const extraClass = (isLast && group.length > 1) ? "last" : "";
        const isSunday = currentDate.getDay() === 0;
        if (holidays) {
          items.add([
            {
              id: `holiday_${group[i]}`,
              start: currentDate,
              end: endOfDay,
              type: "background",
              className: `holiday ${extraClass}`,
            },
          ]);
        } else {
          items.add([
            {
              id: `disabled_date_${group[i]}`,
              start: currentDate,
              end: endOfDay,
              type: "background",
              className: isWeekend(currentDate)
                ? `negative normal-weekend ${isSunday ? 'sunday ' : ''}${extraClass}`
                : `negative ${extraClass}`,
            },
          ]);
        }
      }
    }

    return items;
  }

  // Helper to count esillaolokerta and lautakuntakerta
  countGroupAttributes = (attributes) => {
    let esillaolokerta = 0;
    let lautakuntakerta = 0;
    Object.keys(attributes).forEach(key => {
      if (key.includes('esillaolokerta') || key.includes('nahtavillaolokerta')) {
        esillaolokerta++;
      }
      if (key.includes('lautakuntakerta')) {
        lautakuntakerta++;
      }
    });
    return { esillaolokerta, lautakuntakerta };
  }

  // Helper to determine expanded state
  getExpandedState = (title, ongoingPhase, isMounting, collapseData, showTimetableForm) => {
    const normaliseText = v => (v || '').toString().trim().toLowerCase();
    return (
      collapseData[title] ||
      ((normaliseText(title) === normaliseText(ongoingPhase) && isMounting) || normaliseText(title) === normaliseText(showTimetableForm?.selectedPhase)) || false
    );
  }

  addDeadLineGroups = (deadlineSections, deadLineGroups, ongoingPhase, isMounting) => {
    // Collect collapseData updates to avoid calling setState in a loop
    let collapseDataUpdates = {};
    const normaliseText = v => (v || '').toString().trim().toLowerCase();

    deadlineSections.forEach(section => {
      section.grouped_sections.forEach(groupedSection => {
        if (!deadLineGroups.some(item => item.content === section.title)) {
          const { esillaolokerta, lautakuntakerta } = this.countGroupAttributes(groupedSection.attributes);

          const expanded = this.getExpandedState(
            section.title,
            ongoingPhase,
            isMounting,
            this.state.collapseData,
            this.props.showTimetableForm
          );

          // Collect collapseData updates if expanded is true and not already set
          if (
            expanded &&
            !this.state.collapseData[section.title] &&
            (normaliseText(section.title) === normaliseText(ongoingPhase) || normaliseText(section.title) === normaliseText(this.props.showTimetableForm?.selectedPhase))
          ) {
            collapseDataUpdates[section.title] = true;
          }

          deadLineGroups.push({
            id: section.title,
            content: section.title,
            showNested: expanded,
            nestedGroups: [],
            maxEsillaolo: esillaolokerta,
            maxLautakunta: lautakuntakerta,
            className: `${section.id}`
          });
        }
      });
    });

    // Only call setState once if there are updates
    if (Object.keys(collapseDataUpdates).length > 0) {
      this.setState(prevState => ({
        collapseData: {
          ...prevState.collapseData,
          ...collapseDataUpdates
        }
      }));
    }

    return deadLineGroups;
  }

  addMainGroup = (deadlines, i, numberOfPhases, startDate, endDate, style, options) => {
    const { phaseData, deadLineGroups, nestedDeadlines, disabled, formValues } = options;
    const currentDateString = new Date().toJSON().slice(0, 10);
    const currentDate = new Date(currentDateString);
    phaseData.push({
      id: numberOfPhases,
      content: '',
      start: startDate,
      end: endDate,
      className: style + " phase-holder",
      phaseID: deadlines[i].deadline.phase_id,
      phase: true,
      group: deadlines[i].deadline.phase_name,
      phaseName: deadlines[i].deadline.phase_name
    });
  
    if (deadlines[i].deadline.phase_name === "Käynnistys" || deadlines[i].deadline.phase_name === "Hyväksyminen" || deadlines[i].deadline.phase_name === "Voimaantulo") {
      const highlightID = `${deadlines[i].deadline.phase_id}_${numberOfPhases}`;
      //Add both titles of the element start date and end date to item title so when dragging we can extract the correct date to update
      const dlTitle = deadlines[i].deadline.phase_name === "Käynnistys" ? "projektin_kaynnistys_pvm" +"-"+ deadlines[i].deadline.attribute  : deadlines[i - 1].deadline.attribute +"-"+ deadlines[i].deadline.attribute
      const allowEditStyle = this.props?.allowedToEdit ? "" : " disable-edit"
      phaseData.push({
        id: numberOfPhases + deadlines[i].deadline.phase_name,
        content: "",
        start: startDate,
        end: endDate,
        className: disabled || (currentDate > endDate) ? "phase-length past" : "phase-length" + " " +highlightID + allowEditStyle,
        title: dlTitle,
        phaseID: deadlines[i].deadline.phase_id,
        phase: false,
        group: numberOfPhases,
        locked: false,
        phaseName: deadlines[i].deadline.phase_name
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
        undeletable: true,
        phaseID: deadlines[i].deadline.phase_id,
        className: `${deadlines[i].deadline.deadlinegroup}${this.isPhaseInPast(deadlines[i].deadline.phase_name, formValues) ? ' no-drag' : ''}`
      });
    }
  
    return [phaseData, deadLineGroups, nestedDeadlines];
  }

  shouldAddSubgroup = (deadline, formValues) => {
    if (!deadline.deadlinegroup){
      console.warn("Deadline group missing for deadline " + deadline.attribute);
      return false;
    }
    // Special cases where bool is missing
    if (['oas_esillaolokerta_1','ehdotus_nahtavillaolokerta_1','tarkistettu_ehdotus_lautakuntakerta_1'].includes(deadline.deadlinegroup)){
        return true;
    }
    const visibilityBool = getVisibilityBoolName(deadline.deadlinegroup);
    if (visibilityBool){
      return formValues[visibilityBool];
    }
    return false;
  }

  addSubgroup = (deadlines, i, numberOfPhases, dashStart, dashEnd, dashedStyle, phaseData, deadLineGroups, nestedDeadlines, milestone, formValues, lockedDate) => {
    const highlightID = `${deadlines[i].deadline.phase_id}_${numberOfPhases}`;
    const allowEditStyle = this.props?.allowedToEdit ? "" : " disable-edit";
    const currentDeadline = deadlines[i].deadline;
    const currentPhase = currentDeadline.phase_name;
    const lockedClass = this.isDeadlineLocked(currentDeadline.attribute, formValues, lockedDate) ? " no-drag" : "";
    const subGroupDefaults = {
      content: "",
      phase: false,
      phaseID: currentDeadline.phase_id,
      phaseName: currentPhase,
      locked: false,
      group: numberOfPhases,
      title: currentDeadline.attribute,
    }
    if(dashStart === null && milestone === null && dashEnd){
      phaseData.push({
        ...subGroupDefaults,
        start: dashEnd,
        id: numberOfPhases,
        className: "board-only " + dashedStyle + " " + highlightID + allowEditStyle + lockedClass,
        type: 'point',
        groupInfo: "Lautakunta"
      });
    }
    else if(dashEnd === null){
      phaseData.push({
        ...subGroupDefaults,
        start: dashStart,
        id: numberOfPhases,
        className: dashedStyle + " " + highlightID + allowEditStyle + lockedClass,
        type: 'point',
        groupInfo: "Lautakunta"
      });
    }
    else if(dashStart && dashEnd && milestone) {
      const maaraAika = {
        ...subGroupDefaults,
        start: milestone,
        id: numberOfPhases + " maaraaika",
        className: dashedStyle + " " + highlightID + allowEditStyle + lockedClass,
        title: deadlines[i - 2].deadline.attribute,
        type: 'point',
        groupInfo: "Määräaika"
      }
      const divider = {
        ...subGroupDefaults,
        start: milestone,
        end: dashStart,
        id: numberOfPhases + " divider",
        className: "divider" + " " + highlightID + allowEditStyle,
        title: "divider",
        groupInfo: "Kaavoitussihteerin työaika"
      }
      const esillaOlo = {
        ...subGroupDefaults,
        start: dashStart,
        end: dashEnd,
        id: numberOfPhases,
        className: dashedStyle + " " + highlightID + allowEditStyle + lockedClass,
        title: deadlines[i - 1].deadline.attribute + "-" +  currentDeadline.attribute,
        groupInfo: "Esilläolo"
      }
      phaseData.push(maaraAika, divider, esillaOlo);
    }
    else if (dashedStyle.includes("board") && dashStart && dashEnd) {
      const lkMaaraAika = {
        ...subGroupDefaults,
        start: dashStart,
        id: numberOfPhases + " maaraaika",
        className: dashedStyle + " deadline" + " " + highlightID + allowEditStyle + lockedClass,
        title: deadlines[i - 1].deadline.attribute,
        type: 'point',
        groupInfo: "Määräaika"
      };

      const lkDivider = {
        ...subGroupDefaults,
        start: dashStart,
        end: dashEnd,
        id: numberOfPhases + " divider",
        className: "divider" + " " + highlightID + allowEditStyle,
        title: "divider",
        groupInfo: "Kaavoitussihteerin työaika"
      };

      const lautakunta = {
        ...subGroupDefaults,
        start: dashEnd,
        id: numberOfPhases + " lautakunta",
        className: dashedStyle + " board-date" + (currentPhase === "Tarkistettu ehdotus" ? " board-right" : "") + " " + highlightID + allowEditStyle + lockedClass,
        type: 'point',
        groupInfo: "Lautakunta"
      };
      phaseData.push(lkMaaraAika, lkDivider, lautakunta);
    } 
    else {
      phaseData.push({
        ...subGroupDefaults,
        start: dashStart,
        end: dashEnd,
        id: numberOfPhases,
        className: dashedStyle + " " + highlightID + allowEditStyle + " only-inner-end" + lockedClass,
        title: deadlines[i - 1].deadline.attribute +"-"+ currentDeadline.attribute,
        groupInfo: "Nähtävilläolo"
      });
    }

    const dlIndex = deadLineGroups.findIndex(group => group.content.toLowerCase() === currentPhase.toLowerCase());
    deadLineGroups?.at(dlIndex)?.nestedGroups.push(numberOfPhases);
    const lastChar = deadlines[i]?.deadline?.deadlinegroup?.charAt(currentDeadline.deadlinegroup.length - 1); // Get the last character of the string
    const isLastCharNumber = !Number.isNaN(lastChar) && lastChar !== ""; // Check if the last character is a number
    let indexString = "";
    if(isLastCharNumber){
      indexString = "-" + lastChar;
    }

    let undeletable = false;
    if(indexString === "-1" && 
      (currentPhase === "OAS" || currentPhase === "Tarkistettu ehdotus" || 
      (currentPhase === "Ehdotus" && !(formValues?.kaavaprosessin_kokoluokka === "XL" && currentDeadline.deadlinegroup?.includes("lautakunta")))
      )
    ){
      undeletable = true
    }
    const nahtEsillaString = currentDeadline.deadlinegroup?.includes("nahtavillaolo") ? "Nahtavillaolo" + indexString : "Esilläolo" + indexString
    nestedDeadlines.push({
      id: numberOfPhases,
      content: currentDeadline.deadlinegroup?.includes("lautakunta") ? "Lautakunta" + indexString : nahtEsillaString,
      abbreviation: deadlines[i].abbreviation,
      deadlinegroup: currentDeadline.deadlinegroup,
      deadlinesubgroup: currentDeadline.deadlinesubgroup,
      locked: false,
      generated:deadlines[i].generated,
      undeletable:undeletable,
      phaseID: currentDeadline.phase_id,
      className: `${currentDeadline.deadlinegroup}`
    });

    return [phaseData, deadLineGroups, nestedDeadlines];
  }

  generateVisItems = (deadlines,formValues,deadLineGroups,nestedDeadlines,phaseData) => {
    let phaseStartDate = false
    let phaseEndDate = false
    let style = ""

    const dashedStyle = "inner"

    let innerStart = false
    let innerEnd = false
    let innerStyle = "inner-end"

    let milestone = false

    let disabled = false

    const currentDateString = new Date().toJSON().slice(0, 10);
    const currentDate = new Date(currentDateString);

    const lockedDate = timeUtil.getFirstLockedDate(this.props.timelineLockedGroup, deadlines, formValues);

    const lautakuntaAttributes = [
      "lautakunta", "lautakunnassa", "tarkistettu_ehdotus_kylk_maaraaika",
      "ehdotus_kylk_aineiston_maaraaika", "kaavaluonnos_kylk_aineiston_maaraaika"
    ];

    const nahtavillaAttributes = [
      "nahtavilla", "nahtavillaolokerta", "ehdotus_nahtaville_aineiston_maaraaika",
    ];

    const extraLautakuntaMap = {
      "Periaatteet": ["periaatteet_lautakuntakerta_2", "periaatteet_lautakuntakerta_3", "periaatteet_lautakuntakerta_4"],
      "Luonnos": ["luonnos_lautakuntakerta", "luonnos_lautakuntakerta_2", "luonnos_lautakuntakerta_3", "luonnos_lautakuntakerta_4"],
      "Ehdotus": ["ehdotus_lautakuntakerta", "ehdotus_lautakuntakerta_2", "ehdotus_lautakuntakerta_3", "ehdotus_lautakuntakerta_4"],
      "Tarkistettu ehdotus": ["tarkistettu_ehdotus_lautakuntakerta", "tarkistettu_ehdotus_lautakuntakerta_2", "tarkistettu_ehdotus_lautakuntakerta_3", "tarkistettu_ehdotus_lautakuntakerta_4"]
    };

    const resolveDate = (formValues, attr, fallback) => {
      const d = formValues?.[attr] ? new Date(formValues[attr]) : new Date(fallback);
      if (d instanceof Date && !Number.isNaN(d.getTime())) d.setHours(12, 0, 0, 0);
      return d;
    };

    for (let i = 0; i < deadlines.length; i++) {
      const deadline = deadlines[i].deadline
      const numberOfPhases = deadline.index
      const deadlineGroup = deadline.deadlinegroup;

      if(deadline.deadline_types.includes('phase_start')){
        //Special case for project start date
        if(deadline.attribute === null && deadlines[i].abbreviation === "K1"){
          phaseStartDate = resolveDate(formValues, "projektin_kaynnistys_pvm", deadlines[i].date);
          disabled = !formValues?.kaavan_vaihe.includes("Käynnistys");
        }
        else if(deadline.attribute === "voimaantulovaihe_alkaa_pvm"){
          const phaseStart = resolveDate(formValues, "voimaantulovaihe_alkaa_pvm", deadlines[i].date);
          phaseStartDate = resolveDate(formValues, "hyvaksymispaatos_pvm", phaseStart);

        }
        else{
          phaseStartDate = resolveDate(formValues, deadline.attribute, deadlines[i].date);
        }

        style = deadline.phase_color
      }
      else if(deadline?.attribute?.includes("esillaolo") || deadline?.attribute?.includes("luonnosaineiston_maaraaika")){
        if(deadline.deadline_types.includes('milestone') && deadline.deadline_types.includes('dashed_start')){
          milestone = resolveDate(formValues, deadline.attribute, deadlines[i].date);
        }
        else if (deadline.deadline_types.includes('inner_start')) {
          innerStart = resolveDate(formValues, deadline.attribute, deadlines[i].date);
        }
        else if(deadline.deadline_types.includes('inner_end')){
          innerEnd = resolveDate(formValues, deadline.attribute, deadlines[i].date);
          innerStyle = this.buildInnerStyle("inner-end", innerEnd, currentDate, formValues, deadlineGroup, deadline.phase_name, this.isDeadlineLocked(deadline.attribute, formValues, lockedDate))
        }
      }
      else if(nahtavillaAttributes.some(attr => deadline?.attribute?.includes(attr))) {
        
        if(deadline.deadline_types.includes('milestone') && deadline.deadline_types.includes('dashed_start')){
          milestone = resolveDate(formValues, deadline.attribute, deadlines[i].date);
        }
        else if(deadline.deadline_types.includes('inner_start')){
          if(formValues.kaavaprosessin_kokoluokka === "XL" && deadline.attribute.includes("iso") || formValues.kaavaprosessin_kokoluokka === "L" && deadline.attribute.includes("iso")){
            innerEnd = false
            innerStart = resolveDate(formValues, deadline.attribute, deadlines[i].date);
          }
          if(formValues.kaavaprosessin_kokoluokka === "XS" && deadline.attribute.includes("pieni") || formValues.kaavaprosessin_kokoluokka === "S" && deadline.attribute.includes("pieni") || formValues.kaavaprosessin_kokoluokka === "M" && deadline.attribute.includes("pieni")){
            innerEnd = false
            innerStart = resolveDate(formValues, deadline.attribute, deadlines[i].date);
          }
        }
        else if(deadline.deadline_types.includes('inner_end')){
          innerEnd = resolveDate(formValues, deadline.attribute, deadlines[i].date);
          innerStyle = this.buildInnerStyle("inner-end", innerEnd, currentDate, formValues, deadlineGroup, deadline.phase_name, this.isDeadlineLocked(deadline.attribute, formValues, lockedDate))
        }
      }
      else if(lautakuntaAttributes.some(attr => deadline?.attribute?.includes(attr))) {
        // Clear any leftover milestone from deleted esillaolo to prevent lautakunta using wrong item type
        milestone = false;
        if(deadline.deadline_types.includes('milestone') && deadline.deadline_types.includes('dashed_start')){
          innerEnd = false
          innerStart = resolveDate(formValues, deadline.attribute, deadlines[i].date);
        }
        else if(deadline.deadline_types.includes('milestone') && deadline.deadline_types.includes('dashed_end')){
          innerEnd = resolveDate(formValues, deadline.attribute, deadlines[i].date);
          innerStyle = this.buildInnerStyle("board", innerEnd, currentDate, formValues, deadlineGroup, deadline.phase_name, this.isDeadlineLocked(deadline.attribute, formValues, lockedDate))
        }
        else if(deadline.deadline_types.includes('inner_start')){
          innerStart = resolveDate(formValues, deadline.attribute, deadlines[i].date);
        }
        else if(deadline.deadline_types.includes('inner_end')){
          innerEnd = resolveDate(formValues, deadline.attribute, deadlines[i].date);
        }
      }
      else if(deadline.deadline_types.includes('phase_end') && deadline.date_type !== "Arkipäivät"){
        if(deadline.attribute === "voimaantulovaihe_paattyy_pvm"){
          phaseEndDate = resolveDate(formValues, "voimaantulovaihe_paattyy_pvm", deadlines[i].date);
        }
        else if(deadline.attribute === "hyvaksyminenvaihe_paattyy_pvm"){
          const phaseEnd = formValues?.["hyvaksyminenvaihe_paattyy_pvm"] ? new Date(formValues["hyvaksyminenvaihe_paattyy_pvm"]) : deadlines[i].date;
          phaseEndDate = resolveDate(formValues, "hyvaksymispaatos_pvm", phaseEnd);
        }
        else{
          if(deadline.attribute === "kaynnistys_paattyy_pvm"){
            disabled = !formValues?.kaavan_vaihe.includes("Käynnistys");
          }
          phaseEndDate = resolveDate(formValues, deadline.attribute, deadlines[i].date)
        }
      }

      if(phaseStartDate && phaseEndDate){
        //Main group items not movable(Käynnistys, Periaatteet, OAS etc)
        let mainGroup = this.addMainGroup(deadlines, i, numberOfPhases, phaseStartDate, phaseEndDate, style, { phaseData, deadLineGroups, nestedDeadlines, disabled, formValues });
        [phaseData, deadLineGroups, nestedDeadlines] = mainGroup;
        phaseStartDate = false
        phaseEndDate = false
        disabled = false
 
      }
      else if(milestone && deadline.phase_name === "Ehdotus" && deadline.deadlinegroup !== "ehdotus_lautakuntakerta_1"
        && ["XL","L"].includes(formValues.kaavaprosessin_kokoluokka)) {
          if(formValues[deadline.attribute] && this.shouldAddSubgroup(deadline,formValues) && innerStart){
          let subgroup = this.addSubgroup(deadlines, i, numberOfPhases, innerStart, null, dashedStyle, phaseData, deadLineGroups, nestedDeadlines, milestone, formValues, lockedDate);
          [phaseData, deadLineGroups, nestedDeadlines] = subgroup;
        }
        milestone = false
      }
      else if(innerEnd && extraLautakuntaMap[deadline.phase_name]?.includes(deadline.deadlinegroup)){
        if(formValues[deadline.attribute] && this.shouldAddSubgroup(deadline,formValues)){
          let subgroup = this.addSubgroup(deadlines, i, numberOfPhases, null, innerEnd, innerStyle, phaseData, deadLineGroups, nestedDeadlines, null, formValues, lockedDate);
          [phaseData, deadLineGroups, nestedDeadlines] = subgroup;
        }
        innerEnd = false
      } 
      else if(innerStart && innerEnd){
        if(formValues[deadline.attribute] && this.shouldAddSubgroup(deadline, formValues)){
          let subgroup2 = this.addSubgroup(deadlines, i, numberOfPhases, innerStart, innerEnd, innerStyle, phaseData, deadLineGroups, nestedDeadlines, milestone || null, formValues, lockedDate);
          [phaseData, deadLineGroups, nestedDeadlines] = subgroup2;
        }
        innerStart = false;
        innerEnd = false;
        milestone = false;
      }
    }

    return [deadLineGroups,nestedDeadlines,phaseData]
  }

  getTimelineData = (deadlineSections,formValues,deadlines,ongoingPhase,isMounting) => {
      let phaseData = []
      let deadLineGroups = []
      let nestedDeadlines = []

      deadLineGroups = this.addDeadLineGroups(deadlineSections,deadLineGroups,ongoingPhase,isMounting)
      const results = this.generateVisItems(deadlines,formValues,deadLineGroups,nestedDeadlines,phaseData);
      [deadLineGroups, nestedDeadlines, phaseData] = results;

      return [deadLineGroups,nestedDeadlines,phaseData]
  }

  setLoadingFalse = () => {
    if (this.state.loading) {
      this.setState({ loading: false })
    }
  }

  wasGroupRemoved = (prevValues, currentValues) => {
    const changedValues = {};

    Object.keys(currentValues).forEach((key) => {
      if (prevValues[key] !== currentValues[key]) {
        changedValues[key] = currentValues[key];
      }
    });
    
    const isRemove = Object.entries(changedValues).some(([key, value]) => 
      Object.values(vis_bool_group_map).includes(key) && typeof value === 'boolean' && value === false
    );
    return isRemove;
  }

  handleSubmit = () => {
    this.setState({ loading: true })
    localStorage.removeItem('timelineHighlightedElement');
    localStorage.removeItem('menuHighlight');
    const errors = this.props.handleSubmit()
    if (errors) {
      this.setState({ loading: false })
    }
  }

  openConfirmCancel = () => {
    // Only show confirmation dialog if changes have been made
    if (!isEqual(this.props.attributeData, this.props.formValues)) {
      this.setState({ showModal: true });
    } else {
      // No changes, so we can just close without confirmation
      this.handleClose();
    }
  }

  handleContinueCancel = () => {
    this.setState({ showModal: false });
    this.handleClose()
  }

  handleCancelCancel = () => {
    this.setState({ showModal: false });
  }

  handleClose = () => {
    localStorage.removeItem('timelineHighlightedElement');
    localStorage.removeItem('menuHighlight');
    this.props.handleClose()
  }

  trackExpandedGroups = (e) => {
    const { collapseData } = this.state;
    const key = e.target.innerText;
    // Get current state directly from DOM or use state if available
    let isCurrentlyExpanded;
    if (key in collapseData) {
      // If we have a stored value, use it
      isCurrentlyExpanded = collapseData[key];
    } else {
      // If not in state yet, check if the element has an "expanded" class or attribute
      // This could be determined by checking e.target's classes or another attribute
      // that indicates expansion status
      isCurrentlyExpanded = e.target.classList.contains("expanded") || 
                           e.target.getAttribute("aria-expanded") === "true" ||
                           false; // Default to false if we can't determine
    }

    const updatedCollapseData = { ...collapseData, [key]: !isCurrentlyExpanded };
    this.setState({ collapseData: updatedCollapseData });
  }

  getPhaseList = (kokoluokka, periaatteet_luotu, luonnos_luotu) => {
    const PHASES_XL = [
      "Käynnistys",
      "OAS",
      "Ehdotus",
      "Tarkistettu ehdotus",
      "Hyväksyminen",
      "Voimaantulo"
    ];

    const PHASES_OTHER = [
      "Käynnistys",
      "OAS",
      "Ehdotus",
      "Tarkistettu ehdotus",
      "Hyväksyminen",
      "Voimaantulo"
    ];

    if (kokoluokka === "XL") {
      // Insert "Periaatteet" after "Käynnistys" if created
      if (periaatteet_luotu) {
        PHASES_XL.splice(1, 0, "Periaatteet");
      }
      // Insert "Luonnos" after "OAS" if created
      if (luonnos_luotu) {
        const oasIndex = PHASES_XL.indexOf("OAS");
        PHASES_XL.splice(oasIndex + 1, 0, "Luonnos");
      }
      return PHASES_XL;
    }

    return PHASES_OTHER;
  };

  render() {
    const { loading } = this.state
    const { 
      attributeData,
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
      // Placeholder modal while deps loading
      return (
        <>
          {open && ReactDOM.createPortal(
            <div className="edit-project-timetable-backdrop" aria-hidden="true" />,
            document.body
          )}
          <Modal
            size="large"
            open={open}
            closeIcon={false}
            closeOnDocumentClick={false}
            closeOnDimmerClick={false}
            className='modal-center-big'
            id="edit-project-timetable-modal"
          >
            <Modal.Header>
              <IconInfoCircle size="m" aria-hidden="true"/>
              <h2 className='header-title'>{t('deadlines.modify-timeline')}</h2>
            </Modal.Header>
            <Modal.Content>
              <div className="timeline-loading-container">
                <LoadingSpinner theme={{ '--spinner-color': '#0000BF' }}>
                  {t('loading')}
                </LoadingSpinner>
              </div>
            </Modal.Content>
            <Modal.Actions>
              <span className="form-buttons">
                <Button variant="secondary" onClick={this.handleClose}>
                  {t('common.close')}
                </Button>
              </span>
            </Modal.Actions>
          </Modal>
        </>
      )
    }

    // Calculate ongoingPhase, phaseList, and currentPhaseIndex here:
    const ongoingPhase = this.trimPhase(attributeData?.kaavan_vaihe);
    const phaseList = this.getPhaseList(attributeData?.kaavaprosessin_kokoluokka,attributeData?.periaatteet_luotu,attributeData?.luonnos_luotu);
    const currentPhaseIndex = phaseList.indexOf(ongoingPhase);
    
    return (
      <>
      {open && ReactDOM.createPortal(
        <div className="edit-project-timetable-backdrop" aria-hidden="true" />,
        document.body
      )}
      <Modal
        size="large"
        open={open}
        closeIcon={false}
        closeOnDocumentClick={false}
        closeOnDimmerClick={false}
        className='modal-center-big'
        id="edit-project-timetable-modal"
        onMount={() => {
          getFocusableElements("edit-project-timetable-modal")[0]?.focus();
        }}
      >
        <Modal.Header>
          <IconInfoCircle size="m" aria-hidden="true"/>
          <h2 className='header-title'>{t('deadlines.modify-timeline')}</h2>
        </Modal.Header>
        <Modal.Content>
            <div className='timeline-group-header'>
              <h3 className='timeline-group-title'>{t('deadlines.timeline-group-header')}</h3>
            </div>
            <VisTimelineGroup
              timelineRef={this.timelineRef}
              phaseList={phaseList}
              currentPhaseIndex={currentPhaseIndex}
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
              showTimetableForm={this.props.showTimetableForm}
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
        {allowedToEdit ? (
          <span className="form-buttons">
            <Button
              variant="primary"
              disabled={this.props.validatingTimetable?.started || loading || !allowedToEdit}
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
      </>
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
  showTimetableForm: PropTypes.shape({
    open: PropTypes.string,
    selectedPhase: PropTypes.string,
  }),
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
  validatingTimetable: PropTypes.shape({
    started: PropTypes.bool,
    ended: PropTypes.bool
  }),
  timelineLockedGroup: PropTypes.string
}

const mapStateToProps = state => ({
  formSubmitErrors: getFormSubmitErrors(EDIT_PROJECT_TIMETABLE_FORM)(state),
  deadlineSections: deadlineSectionsSelector(state),
  formValues: getFormValues(EDIT_PROJECT_TIMETABLE_FORM)(state),
  deadlines: deadlinesSelector(state),
  validated: validatedSelector(state),
  dateValidationResult : dateValidationResultSelector(state),
  cancelTimetableSave: cancelTimetableSaveSelector(state),
  validatingTimetable: validatingTimetableSelector(state),
  timelineLockedGroup: timelineLockedGroupSelector(state),
})

const decoratedForm = reduxForm({
  form: EDIT_PROJECT_TIMETABLE_FORM
})(withTranslation()(withValidateDate(EditProjectTimeTableModal)));

export default connect(mapStateToProps)(decoratedForm)
