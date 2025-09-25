import React, {useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { change } from 'redux-form'
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
import Moment from 'moment'
import 'moment/locale/fi';
import {extendMoment} from 'moment-range'
import { LoadingSpinner } from 'hds-react'
import * as vis from 'vis-timeline'
import 'vis-timeline/dist/vis-timeline-graph2d.min.css'
import TimelineModal from './TimelineModal'
import VisTimelineMenu from './VisTimelineMenu'
import AddGroupModal from './AddGroupModal';
import ConfirmModal from '../common/ConfirmModal'
import PropTypes from 'prop-types';
import { getVisibilityBoolName, getVisBoolsByPhaseName, isDeadlineConfirmed } from '../../utils/projectVisibilityUtils';
import './VisTimeline.scss'
Moment().locale('fi');
import { updateDateTimeline } from '../../actions/projectActions';

const VisTimelineGroup = forwardRef(({ groups, items, deadlines, visValues, deadlineSections, formSubmitErrors, projectPhaseIndex, archived, allowedToEdit, isAdmin, disabledDates, lomapaivat, dateTypes, trackExpandedGroups, sectionAttributes, showTimetableForm, itemsPhaseDatesOnly}, ref) => {
    const dispatch = useDispatch();
    const moment = extendMoment(Moment);

    const { t } = useTranslation()
    const timelineRef = useRef(null);
    const observerRef = useRef(null); // Store the MutationObserver
    const timelineInstanceRef = useRef(null);
    const visValuesRef = useRef(visValues);
    const itemsPhaseDatesOnlyRef = useRef(itemsPhaseDatesOnly);

    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const selectedGroupIdRef = useRef(selectedGroupId);
    const dragHandleRef = useRef("");

    const [toggleTimelineModal, setToggleTimelineModal] = useState({open: false, highlight: false, deadlinegroup: false});
    const [timelineData, setTimelineData] = useState({group: false, content: false});
    const [timeline, setTimeline] = useState(false);
    const [addDialogStyle, setAddDialogStyle] = useState({ left: 0, top: 0 });
    const [addDialogData, setAddDialogData] = useState({group:false,deadlineSections:false,showPresence:false,showBoard:false,nextEsillaolo:false,nextLautakunta:false,esillaoloReason:"",lautakuntaReason:"",hidePresence:false,hideBoard:false});
    const [toggleOpenAddDialog, setToggleOpenAddDialog] = useState(false)
    const [currentFormat, setCurrentFormat] = useState("showYears");
    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [dataToRemove, setDataToRemove] = useState({});
    const [timelineAddButton, setTimelineAddButton] = useState();
    //const [lock, setLock] = useState({group:false,id:false,locked:false,abbreviation:false});

    useImperativeHandle(ref, () => ({
      getTimelineInstance: () => timelineInstanceRef.current,
    }));

    // Keep latest itemsPhaseDatesOnly available inside event handlers
    useEffect(() => {
      itemsPhaseDatesOnlyRef.current = itemsPhaseDatesOnly;
    }, [itemsPhaseDatesOnly]);


    const preventDefaultAndStopPropagation = (event) => {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const updateGroupShowNested = (groups, groupId, showNested) => {
      if (groupId) {
        let group = groups.get(groupId);
        if (group) {
          group.showNested = showNested;
          groups.update(group);
        }
      }
    }
    
    const timelineGroupClick = (properties, groups) => {
      if (properties.group) {
        let clickedElement = properties.event.target;
    
        preventDefaultAndStopPropagation(properties.event);
    
        if(clickedElement.classList.contains('timeline-add-button')){
          updateGroupShowNested(groups, properties.group, true);
        } else {
          let groupId = properties.group;
          if (groupId) {
            let group = groups.get(groupId);
            if (group) {
              updateGroupShowNested(groups, properties.group, !group.showNested);
            }
          }
        }
      }
    }

    const trackExpanded = (event) => {
      trackExpandedGroups(event)
    }

    const getLargestIndex = (keys, visValRef) => {
      let largestIndex = 1;
      keys.forEach(key => {
        const match = /_(\d+)$/.exec(key);
        if (match) {
          const number = parseInt(match[1], 10);
          if (number > largestIndex && visValRef[key]) {
            largestIndex = number;
          } else if (number === 1 && visValRef[key] === false) {
            // If first element group explicitly set to false, it has been deleted
            // By default it may just be undefined (even if present)
            largestIndex = 0;
          }
        }
      });
      return largestIndex;
    }

    const getNextGroupString = (confirmed, count, maxCount, keys) => {
      if (confirmed) {
        const canAdd = count <= maxCount;
        return canAdd ? keys[count - 1] : false;
      }
      return false;
    }

    function getGroupStatus({
      confirmed,
      phase,
      largestIndex,
      count,
      deadlineCount,
      attributeKeys,
      canAdd,
      specialPhases,
      specialKeyFn,
      reasonLabel
    }) {
      let reason = !confirmed ? "noconfirmation" : "";
      let nextStr = getNextGroupString(confirmed, count, deadlineCount, attributeKeys);

      if (count - 1 === deadlineCount) {
        reason = "max";
      }

      if (!confirmed && specialPhases.includes(phase) && largestIndex === 0) {
        canAdd = true;
        nextStr = specialKeyFn ? specialKeyFn(phase, attributeKeys) : (attributeKeys[0] || false);
        reason = "";
      } else {
        canAdd = confirmed ? count <= deadlineCount : canAdd;
      }

      return [canAdd, nextStr, reason];
    }

    const checkConfirmedGroups = (
      esillaoloConfirmed,
      lautakuntaConfirmed,
      visValRef,
      phase,
      canAddEsillaolo,
      canAddLautakunta,
      data
    ) => {
      // Esilläolo
      const deadlineEsillaolokertaKeys = data.maxEsillaolo;
      const attributeEsillaoloKeys = getVisBoolsByPhaseName(phase).filter(
        (bool_name) => bool_name.includes('esillaolo') || bool_name.includes('nahtaville')
      );
      const largestIndex = getLargestIndex(attributeEsillaoloKeys, visValRef);
      const esillaoloCount = largestIndex + 1;

      const [canAddEsillaoloRes, nextEsillaoloStr, esillaoloReason] = getGroupStatus({
        confirmed: esillaoloConfirmed,
        phase,
        largestIndex,
        count: esillaoloCount,
        deadlineCount: deadlineEsillaolokertaKeys,
        attributeKeys: attributeEsillaoloKeys,
        canAdd: canAddEsillaolo,
        specialPhases: ["luonnos", "periaatteet"],
        specialKeyFn: null,
        reasonLabel: "esillaolo"
      });

      // Lautakunta
      const deadlineLautakuntakertaKeys = data.maxLautakunta;
      const attributeLautakuntaanKeys = getVisBoolsByPhaseName(phase).filter((bool_name) =>
        bool_name.includes("lautakunta")
      );
      const largestIndexLautakunta = getLargestIndex(attributeLautakuntaanKeys, visValRef);
      const lautakuntaCount = largestIndexLautakunta + 1;

      const [canAddLautakuntaRes, nextLautakuntaStr, lautakuntaReason] = getGroupStatus({
        confirmed: lautakuntaConfirmed,
        phase,
        largestIndex: largestIndexLautakunta,
        count: lautakuntaCount,
        deadlineCount: deadlineLautakuntakertaKeys,
        attributeKeys: attributeLautakuntaanKeys,
        canAdd: canAddLautakunta,
        specialPhases: ["luonnos", "periaatteet", "ehdotus"],
        specialKeyFn: (phase, attributeKeys) =>
          phase === "luonnos" || phase === "ehdotus"
            ? `kaava${phase}_lautakuntaan_1`
            : `${phase}_lautakuntaan_1`,
        reasonLabel: "lautakunta"
      });

      return [
        canAddEsillaoloRes,
        nextEsillaoloStr,
        canAddLautakuntaRes,
        nextLautakuntaStr,
        esillaoloReason,
        lautakuntaReason,
      ];
    };

    const hideSelection = (phase,data) => {
      //hide add options for certain phases
      if(phase === "Tarkistettu ehdotus"){
        return [true,false]
      }
      else if(phase === "Ehdotus" && (data?.kaavaprosessin_kokoluokka === "XS" || data?.kaavaprosessin_kokoluokka === "S" || data?.kaavaprosessin_kokoluokka === "M")){
        return [false,true]
      }
      else if(phase === "OAS"){
        return [false,true]
      }

      return [false,false]
    }

    const canGroupBeAdded = (visValRef, data) => {
      // Find out how many groups in the clicked phase have been added to the timeline
      const matchingGroups = groups.get().filter(group => data.nestedGroups.includes(group.id));
      const esillaoloCount = matchingGroups.filter(group => group.content.includes('Esilläolo') || group.content.includes('Nahtavillaolo')).length > 1 ? '_' + matchingGroups.filter(group => group.content.includes('Esilläolo') || group.content.includes('Nahtavillaolo')).length : '';
      const lautakuntaCount = matchingGroups.filter(group => group.content.includes('Lautakunta')).length > 1 ? '_' + matchingGroups.filter(group => group.content.includes('Lautakunta')).length : '';
      const phase = data.content.toLowerCase().replace(/\s+/g, '_');
      // Check if existing groups have been confirmed
      let esillaoloConfirmed = Object.hasOwn(visValRef, `vahvista_${phase}_esillaolo_alkaa${esillaoloCount}`) && visValRef[`vahvista_${phase}_esillaolo_alkaa${esillaoloCount}`] === true
      || Object.hasOwn(visValRef, `vahvista_${phase}_esillaolo${esillaoloCount}`) && visValRef[`vahvista_${phase}_esillaolo${esillaoloCount}`] === true;
      let lautakuntaConfirmed = Object.hasOwn(visValRef, `vahvista_${phase}_lautakunnassa${lautakuntaCount}`) && visValRef[`vahvista_${phase}_lautakunnassa${lautakuntaCount}`] === true;
      //this could be needed when confirmation is no longer needed
      if(phase === "luonnos"){
        lautakuntaConfirmed = Object.hasOwn(visValRef, `vahvista_kaavaluonnos_lautakunnassa${lautakuntaCount}`) && visValRef[`vahvista_kaavaluonnos_lautakunnassa${lautakuntaCount}`] === true;
      }
/*       if(phase === "periaatteet" && !(phase + "_lautakuntaan_1" in visValRef) || phase === "periaatteet" && visValRef["periaatteet_lautakuntaan_1"]  || phase === "luonnos" && !(phase + "_lautakuntaan_1") || phase === "luonnos" && visValRef["kaavaluonnos_lautakuntaan_1"] === false){
        lautakuntaConfirmed = true
      } */
      if(phase === "luonnos" && !("jarjestetaan_" + phase + "_esillaolo_1" in visValRef) || phase === "periaatteet" && !("jarjestetaan_"+phase+"_esillaolo_1" in visValRef)){
        esillaoloConfirmed = true
      }
      if(phase === "ehdotus" && "vahvista_kaavaehdotus_lautakunnassa" in visValRef){
        lautakuntaConfirmed = true
      }

      // Initialize returned values
      let canAddEsillaolo = false;
      let nextEsillaoloClean = false;
      let canAddLautakunta = false;
      let nextLautakuntaClean = false;
      let esillaoloReason = "";
      let lautakuntaReason = "";
    
      const results = checkConfirmedGroups(esillaoloConfirmed, lautakuntaConfirmed, visValRef, phase, canAddEsillaolo, canAddLautakunta, data);
      [canAddEsillaolo, nextEsillaoloClean, canAddLautakunta, nextLautakuntaClean, esillaoloReason, lautakuntaReason] = results;
      let phaseWithoutSpace = phase.toLowerCase().replace(/\s+/g, '-');

      if(typeof visValRef["lautakunta_paatti_"+phaseWithoutSpace] === "undefined" || visValRef["lautakunta_paatti_"+phaseWithoutSpace] === "hyvaksytty" || visValRef["lautakunta_paatti_"+phaseWithoutSpace] === "palautettu_uudelleen_valmisteltavaksi"){
        if( (phase === "luonnos" && visValRef[`kaava${phase}_lautakuntaan_1`] === false) ||
            (phase === "periaatteet" && visValRef[`${phase}_lautakuntaan_1`] === false) ||
            (phase === "ehdotus" && visValRef["kaavaehdotus_lautakuntaan_1"] === false) ) {
          canAddLautakunta = true
        }
        else{
          canAddLautakunta = false
        }
      }
      /* TODO if(visValRef["kaavaluonnos_lautakuntaan_1"] === false){
        //adds second one althou when false needs to just show first one if deleted once
        canAddLautakunta = true
      } */
      
      return [canAddEsillaolo, nextEsillaoloClean, canAddLautakunta, nextLautakuntaClean, esillaoloReason, lautakuntaReason];
    };

    const openAddDialog = (visValRef,data,event) => {
      const [addEsillaolo,nextEsillaolo,addLautakunta,nextLautakunta,esillaoloReason,lautakuntaReason] = canGroupBeAdded(visValRef,data)
      const rect = event.target.getBoundingClientRect();

      if (event.target.classList.contains('timeline-add-button')) {
        setTimelineAddButton(event.target);
      }
      
      setAddDialogStyle({
        left: `${rect.left - 23}px`,
        top: `${rect.bottom - 4}px`
      })

      const [hidePresence,hideBoard] = hideSelection(data.content,visValRef)
      setAddDialogData({group:data,deadlineSections:deadlineSections,showPresence:addEsillaolo,showBoard:addLautakunta,
        nextEsillaolo:nextEsillaolo,nextLautakunta:nextLautakunta,esillaoloReason:esillaoloReason,lautakuntaReason:lautakuntaReason,
        hidePresence:hidePresence,hideBoard:hideBoard})
      setToggleOpenAddDialog(prevState => !prevState)
    }

    const openRemoveDialog = (data) => {
      setOpenConfirmModal(!openConfirmModal)
      setDataToRemove(data)
    }

    const handleCancelRemove = () => {
      setOpenConfirmModal(!openConfirmModal)
    }

    const handleRemoveGroup = () => {
      const visiblityBool = getVisibilityBoolName(dataToRemove.deadlinegroup)
      if (visiblityBool) {
        dispatch(change(EDIT_PROJECT_TIMETABLE_FORM, visiblityBool, false));
        const confirmationObject = isDeadlineConfirmed(visValuesRef.current, dataToRemove.deadlinegroup, true);
        if(confirmationObject?.key && confirmationObject?.value){
          dispatch(change(EDIT_PROJECT_TIMETABLE_FORM, confirmationObject.key, false));
        }
      }
      setOpenConfirmModal(!openConfirmModal)
    }

    const closeAddDialog = () => {
      setToggleOpenAddDialog(prevState => !prevState)
    };
  
  
    const lockLine = (data) => {
      console.log(data)
      //setLock({group:data.nestedInGroup,id:data.id,abbreviation:data.abbreviation,locked:!data.locked})
    }

    const openDialog = (data, container) => {
      const groupId = data.id;
      const timelineElement = timelineRef?.current;

      setToggleTimelineModal(prev => {
        if (selectedGroupIdRef.current === groupId && prev.open) {
          setSelectedGroupId(null);
          setTimelineData({group: null, content: null});
          // Remove highlights when closing via same group click
          if (timelineElement) {
            removeHighlights(timelineElement);
          }
          return {open: false, highlight: null, deadlinegroup: null};
        }

        setSelectedGroupId(groupId);

        if (timelineElement) {
          removeHighlights(timelineElement);
          addHighlights(timelineElement, data, container);
        }

        setTimelineData({group: data.nestedInGroup, content: data.content});
        return {
          open: true,
          highlight: container,
          deadlinegroup: data?.deadlinegroup?.includes(';') ? data.deadlinegroup.split(';')[0] : data.deadlinegroup
        };
      });
    };

    const removeHighlights = (timelineElement) => {
      timelineElement.querySelectorAll(".vis-group.foreground-highlight").forEach(el => {
        el.classList.remove("foreground-highlight");
      });
      timelineElement.querySelectorAll('.highlight-selected').forEach(el => {
        el.classList.remove('highlight-selected');
        if (el.parentElement.parentElement) {
          el.parentElement.parentElement.classList.remove('highlight-selected');
        }
      });
    };

    const addHighlights = (timelineElement, data, container) => {
      // Remove previous highlights
      timelineElement
        .querySelectorAll(".vis-group.foreground-highlight")
        .forEach(el => el.classList.remove("foreground-highlight"));

      // setTimeout(..., 0) ensures DOM elements are rendered before highlighting;
      // without it, elements may not exist yet, causing highlight logic to fail.
      setTimeout(() => {
        if (timelineElement && data?.deadlinegroup) {
          const groupEls = timelineElement.querySelectorAll(`.vis-group.${data.deadlinegroup}`);
          const groupEl = Array.from(groupEls).find(
            el => el.parentElement?.classList?.contains('vis-foreground')
          );
          groupEl?.classList?.add("foreground-highlight");
          if (groupEl) {
            localStorage.setItem('timelineHighlightedElement', data.deadlinegroup);
          }
        }

        container?.classList?.add("highlight-selected");
        container?.parentElement?.parentElement?.classList?.add("highlight-selected");
        localStorage.setItem('menuHighlight', data.className ? data.className : false);

        const groupContainer = timelineElement.querySelector(`#timeline-group-${data.id}`);
        groupContainer?.classList?.add("highlight-selected");
        groupContainer?.parentElement?.parentElement?.classList?.add("highlight-selected");
      }, 0);
    };

    const handleClosePanel = () => {
      setToggleTimelineModal({open: false, highlight: null, deadlinegroup: null});
      setSelectedGroupId(null);
      setTimelineData({group: null, content: null});

      // Remove group highlights when panel closes
      const timelineElement = timelineRef?.current;
      if (timelineElement) {
        removeHighlights(timelineElement);
      }
    };

    const changeItemRange = (subtract, item, i) => {
      const timeline = timelineRef?.current?.getTimelineInstance();
      if(timeline){
        let timeData = i
        if(!subtract){
          let originalDiff = moment.duration(moment(timeData.end).diff(moment(timeData.start)))
          let originalTimeFrame = originalDiff.asDays()
          timeData.start = item.end
          timeData.end = moment(timeData.start).add(originalTimeFrame, 'days').toDate()
        }
        else{
          timeData.end = item.start
        }
        timeline.itemSet.items[i.id].setData(timeData)
        timeline.itemSet.items[i.id].repositionX()
      }
    }
    //For vis timeline dragging 1.2v
  /*const onRangeChanged = ({ start, end }) => {
      console.log(start, end)
      const Min = 1000 * 60 * 60 * 24; // one day in milliseconds
      const Max = 31556952000; // 1000 * 60 * 60 * 24 * 365.25 one year in milliseconds
      let a0 = 10;
      let a100 = moment.duration(moment(Max).diff(moment(Min))).asMilliseconds();
      let  distance = (a100 - a0)/ 100;
      let startTime = moment(start);
      let endTime = moment(end);
      const duration = moment.duration(endTime.diff(startTime));
      const mins = duration.asMilliseconds();
        // Arithmatic progression variables
      if (mins !== 0) {
        const x = (mins - a0) / distance; // Arithmatic progression formula
        console.log(x)
        if(x > 50){
          console.log("smaller then 50")
          document.querySelectorAll('.inner, .inner-end').forEach(el => el.classList.add('hiddenTimes'));
        }
        else if(x < 50 && document.querySelectorAll('.hiddenTimes')){
          console.log("bigger then 50")
          document.querySelectorAll('.inner, .inner-end').forEach(el => el.classList.remove('hiddenTimes'));
        }
      } else {
        if(!document.querySelectorAll('.hiddenTimes')){
          console.log("100")
          document.querySelectorAll('.inner, .inner-end').forEach(el => el.classList.add('hiddenTimes'));
        }
      }
      
    } */

    /**
   * Move the timeline a given percentage to left or right
   * @param {Number} percentage   For example 0.1 (left) or -0.1 (right)
   */
    const move = (percentage) => {
      let range = timeline.getWindow();
      let interval = range.end - range.start;

      timeline.setWindow({
        start: range.start.valueOf() - interval * percentage,
        end: range.end.valueOf() - interval * percentage,
      });
    }

    const showMonths = () => {
      const range = timeline.getWindow();
      const center = new Date((range.start.getTime() + range.end.getTime()) / 2);
      const rangeDuration = 1000 * 60 * 60 * 24 * 30; // about 1 month

      timelineRef.current.classList.remove("years")
      timelineRef.current.classList.add("months")
      timeline.setOptions({timeAxis: {scale: 'weekday'}});
      //Keep view centered on where user is
      const newStart = new Date(center.getTime() - rangeDuration / 2);
      const newEnd = new Date(center.getTime() + rangeDuration / 2);
      timeline.setWindow(newStart, newEnd);
      setCurrentFormat("showMonths");
      highlightJanuaryFirst()
    }

    const showYears = () => {
      const range = timeline.getWindow();
      const center = new Date((range.start.getTime() + range.end.getTime()) / 2);
      const rangeDuration = 1000 * 60 * 60 * 24 * 365; // about 1 year

      timelineRef.current.classList.remove("months")
      timelineRef.current.classList.add("years")
      timeline.setOptions({timeAxis: {scale: 'month'}});
      //Keep view centered on where user is
      const newStart = new Date(center.getTime() - rangeDuration / 2);
      const newEnd = new Date(center.getTime() + rangeDuration / 2);
      timeline.setWindow(newStart, newEnd);
      setCurrentFormat("showYears");
      highlightJanuaryFirst()
    }

    const show2Yers = () => {
      let now = new Date();
      let currentYear = now.getFullYear();
      let startOf2Years = new Date(currentYear, now.getMonth(), 1);
      let endOf2Years = new Date(currentYear + 2, now.getMonth(), 0);
      timeline.setOptions({timeAxis: {scale: 'month'}});
      timeline.setWindow(startOf2Years, endOf2Years);
    }

    const show5Yers = () => {
      let now = new Date();
      let currentYear = now.getFullYear();
      let startOf5Years = new Date(currentYear, now.getMonth(), 1);
      let endOf5Years = new Date(currentYear + 5, now.getMonth(), 0);
      timeline.setOptions({timeAxis: {scale: 'month'}});
      timeline.setWindow(startOf5Years, endOf5Years);
    }

    const show3Months = () => {
      let now = new Date();
      let currentYear = now.getFullYear();
      let startOf3Months = new Date(currentYear, now.getMonth(), 1);
      let endOf3Months = new Date(currentYear, now.getMonth() + 3, 0);
      timeline.setOptions({timeAxis: {scale: 'weekday'}});
      timeline.setWindow(startOf3Months, endOf3Months);
    }

    const show6Months = () => {
      let now = new Date();
      let currentYear = now.getFullYear();
      let startOf6Months = new Date(currentYear, now.getMonth(), 1);
      let endOf6Months = new Date(currentYear, now.getMonth() + 6, 0);
      timeline.setOptions({timeAxis: {scale: 'weekday'}});
      timeline.setWindow(startOf6Months, endOf6Months);
    }

    const showWeeks = () => {
      let now = new Date();
      let currentYear = now.getFullYear();
      let startOfWeek = new Date(currentYear, now.getMonth(), now.getDate() - now.getDay());
      let endOfWeek = new Date(currentYear, now.getMonth(), now.getDate() - now.getDay() + 6);
      timeline.setWindow(startOfWeek, endOfWeek);
    }

    const showDays = () => {
      let ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;
      let now = new Date();
      let nowInMs = now.getTime();
      let oneDayFromNow = nowInMs + ONE_DAY_IN_MS;
      timeline.setWindow(nowInMs, oneDayFromNow);
    }
    // attach events to the navigation buttons
    const zoomIn = () => {
      timeline.zoomIn(1);
    }

    const zoomOut = () =>  {
      timeline.zoomOut(1);
    }

    const moveLeft = () =>  {
      move(0.25);
    }

    const moveRight = () =>  {
      move(-0.25);
    }

    const goToToday = () => {
      const currentDate = new Date();
      timeline.moveTo(currentDate, {animation: true});
    }

    const toggleRollingMode = () =>  {
      timeline.toggleRollingMode();
    }

    const adjustWeekend = (date) => {
      if (date.getDay() === 0) {
        date.setTime(date.getTime() + 86400000); // Move from Sunday to Monday
      } else if (date.getDay() === 6) {
        date.setTime(date.getTime() - 86400000); // Move from Saturday to Friday
      }
    }

    const highlightJanuaryFirst = () => {
      if (!timelineInstanceRef.current) return;
    
      requestAnimationFrame(() => {
        document.querySelectorAll(".vis-text.vis-minor").forEach((label) => {
          const text = label.textContent.trim().toLowerCase();
    
          // Extract the first number before a possible <br> tag
          const firstLineMatch = text.match(/^\d+/); 
          const firstLine = firstLineMatch ? firstLineMatch[0] : "";

          // Month View: Must be "1" AND contain "tammikuu"
          const isMonthView = firstLine === "1";
    
          // Year View: If the text is "tammi" (January in Finnish)
          const isYearView = text === "tammi";
          if (isYearView || isMonthView) {
            label.classList.add("january-first");
          }
        });
      });
    };

    // MutationObserver to track new elements being added dynamically
    const observeTimelineChanges = () => {
      observerRef.current = new MutationObserver(() => {
        highlightJanuaryFirst(); // Apply styles when new elements are added
      });
  
      const targetNode = document.querySelector(".vis-panel.vis-center");
      if (targetNode) {
        observerRef.current.observe(targetNode, { childList: true, subtree: true });
      }
    };

    const getTopmostTimelineItem = (mouseX, mouseY, timelineInstanceRef) => {
      if (!timelineInstanceRef.current?.itemSet) {
        return null;
      }
      const items = Object.values(timelineInstanceRef.current.itemSet.items);
      let highestZIndex = -1;
      let topmostItem = null;
      let topmostItemDom = null;

      items.forEach((item) => {
        const itemDom = item?.dom?.box ?? item?.dom?.point ?? item?.dom?.dot;
        if (itemDom?.classList?.contains('vis-editable')) {
          const itemBounds = itemDom.getBoundingClientRect();
          if (
            mouseX >= itemBounds.left &&
            mouseX <= itemBounds.right &&
            mouseY >= itemBounds.top &&
            mouseY <= itemBounds.bottom
          ) {
            const zIndex = parseInt(window.getComputedStyle(itemDom).zIndex, 10);
            if (zIndex > highestZIndex) {
              highestZIndex = zIndex;
              topmostItem = item;
              topmostItemDom = itemDom;
            }
          }
        }
      });

      return topmostItem ? { item: topmostItem, dom: topmostItemDom } : null;
    };

    useEffect(() => {

      const options = {
        locales: {
          fi: {
            current: "Nykyinen",
            time: "Aika",
          }
        },
        locale: 'fi',
        stack: false,
        selectable: false,
        multiselect: false,
        sequentialSelection:  false,
        moveable:true, // Dragging is disabled from VisTimeline.scss allow in v1.2
        zoomable:false,
        horizontalScroll:true,
        groupHeightMode:"fixed",
        start: new Date(),
        end: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 365.25),
        zoomMin: 1000 * 60 * 60 * 24, // one day in milliseconds
        zoomMax: 157784760000, // 1000 * 60 * 60 * 24 * 5 * 365.25 5 year in milliseconds
        margin: {
          item: 20
        },
        align: 'center',
        editable: {
          add: false,         // add new items by double tapping
          updateTime: true,  // drag items horizontally
          updateGroup: false, // drag items from one group to another
          remove: false,       // delete an item by tapping the delete button top right
          overrideItems: false  // allow these options to override item.editable
        },
        itemsAlwaysDraggable: { // Dragging is disabled, allow in v1.2
            item:true, // change to true to allow dragging of items
            range:true // change to true to allow dragging of ranges
        },
        orientation:{
          axis: "top",
        },
        format: {
          minorLabels: {
              millisecond:'SSS',
              second:     's',
              minute:     'HH:mm',
              hour:       'HH:mm',
              weekday:    'D<br>ddd',
              day:        'D',
              week:       'w',
              month:      'MMM',
              year:       'YYYY'
          },
          majorLabels: {
              millisecond:'HH:mm:ss',
              second:     'D MMMM HH:mm',
              minute:     'ddd D MMMM',
              hour:       'ddd D MMMM',
              weekday:    'MMMM YYYY',
              day:        'MMMM YYYY',
              week:       'MMMM YYYY',
              month:      'YYYY',
              year:       ''
          }   
        },
        // always snap to full hours, independent of the scale
        snap: function (date) {
          let hour = 60 * 60 * 1000;
          return Math.round(date / hour) * hour;
        },
        onMoving: function (item, callback) {
          // Create or update tooltip for moving item
          let tooltipEl = document.getElementById('moving-item-tooltip');
          if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'moving-item-tooltip';
            tooltipEl.className = 'vis-moving-tooltip';
            document.body.appendChild(tooltipEl);
          }
          
          // Format dates for display
          const startDate = item.start ? new Date(item.start).toLocaleDateString('fi-FI') : '';
          const endDate = item.end ? new Date(item.end).toLocaleDateString('fi-FI') : '';
          const dragElement = dragHandleRef.current;
          // Position tooltip near mouse cursor
          const event = window.event;
          // Simple zero / negative duration guard (range items)
          if (dragElement && allowedToEdit) {
            // Range: block zero / negative duration
            if (item.start && item.end && item.end <= item.start) {
              callback(null);
              return;
            }
            else if(item.start && !item.end || dragElement === "left"){
              const visibleItems = itemsPhaseDatesOnlyRef.current;
              const indexOfMovingItem = visibleItems?.findIndex(i => String(i.id) === String(item.id));
              const prevItem = indexOfMovingItem > 0 ? visibleItems[indexOfMovingItem - 1] : null;
              const prevItemDate = prevItem?.end ? prevItem?.end : prevItem?.start
              if(prevItemDate && item.start <= prevItemDate){
                callback(null);
                return;
              }
            }
          }

          if (event) {
            tooltipEl.style.display = 'block';
            tooltipEl.style.position = 'absolute';
            tooltipEl.style.left = `${event.pageX - 20}px`;
            tooltipEl.style.top = `${event.pageY - 60}px`;
            
            // Set tooltip content based on which part is being dragged
            if (dragElement === "left") {
              tooltipEl.innerHTML = startDate;
            } else if (dragElement === "right" && endDate) {
              tooltipEl.innerHTML = endDate;
            } else if(dragElement){
              tooltipEl.innerHTML = startDate;
            }
          }
          // Call the original callback
          if(dragElement && allowedToEdit){
            callback(item);
          }
          else{
            tooltipEl.style.display = 'none';
            tooltipEl.innerHTML = '';
            callback(null);
          }

        },
        onMove(item, callback) {
          // Remove the moving tooltip
          const moveTooltip = document.getElementById('moving-item-tooltip');
          if (moveTooltip) {
            moveTooltip.style.display = 'none';
          }
          let preventMove = false;
          // Determine which part of the item is being dragged
          const dragElement = dragHandleRef.current;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          // Check if the item is confirmed or moving items to past dates and prevent moving
          const isConfirmed = dragElement?.includes("confirmed");
          const isMovingToPast = (item.start && item.start < today) || (item.end && item.end < today);
          //Prevent move
          if (
          !allowedToEdit ||
          !dragElement || isConfirmed || isMovingToPast || 
          item?.phaseName === "Hyväksyminen" || item?.phaseName === "Voimaantulo"
          ) {
            callback(null);
            return;
          }
          // Check if trying to move an item from a phase that has already passed
          if (item.phaseName && visValuesRef.current.kaavan_vaihe) {
            // Define the phase order
            const phaseOrder = [
              "Käynnistys", 
              "Periaatteet", 
              "OAS", 
              "Luonnos", 
              "Ehdotus", 
              "Tarkistettu ehdotus", 
              "Hyväksyminen", 
              "Voimaantulo"
            ];
            
            // Extract the phase name without numbering from kaavan_vaihe
            const currentPhaseFullName = visValuesRef.current.kaavan_vaihe;
            const currentPhaseName = currentPhaseFullName.replace(/^\d+\.\s+/, '');
              // Get the index of current phase and item's phase
            const currentPhaseIndex = phaseOrder.indexOf(currentPhaseName);
            const itemPhaseIndex = phaseOrder.indexOf(item.phaseName);
            
            // If item's phase is before the current project phase, prevent the move
            if (itemPhaseIndex < currentPhaseIndex) {
              preventMove = true;
              callback(null);
              return;
            }
          }

          const adjustIfWeekend = (date) => {
            if (!date) return false; // Add check if date is undefined or null
            if (!(date.getDay() % 6)) {
              adjustWeekend(date);
              return true;
            }
            return false;
          }

          if (!adjustIfWeekend(item.start) && !adjustIfWeekend(item.end)) {
            const movingTimetableItem = moment.range(item.start, item.end);
            if (item.phase) {
              items.forEach(i => {
                if (i.phase && i.id !== item.id) {
                  const statickTimetables = moment.range(i.start, i.end);
                  if (movingTimetableItem.overlaps(statickTimetables)) {
                    preventMove = false;
                    changeItemRange(item.start > i.start, item, i);
                  }
                }
              });
            } else {
              items.forEach(i => {
                if (i.id !== item.id) {
                  if (item.phaseID === i.phaseID && !preventMove && !i.locked) {
                    preventMove = false;
                  } /* else {
                    const statickTimetables = moment.range(i.start, i.end);
                    if (movingTimetableItem.overlaps(statickTimetables)) {
                      preventMove = true;
                    }
                  } */
                }
              });
            }
          }
        
          if (item?.content != null && !preventMove) {
            // Call the callback to update the item position in the timeline
            callback(item);
            
            // After successfully moving the item, update the data in the store
            if (item?.title) {
              // Initialize variables for date and title
              let attributeDate;
              let attributeToUpdate;
              const hasTitleSeparator = item.title.includes("-");
              // Determine which part was dragged and set appropriate values
              if(dragElement === "elements"){
                // If dragging the start handle of a confirmed item
                attributeDate = item.start;
                attributeToUpdate = hasTitleSeparator ? item.title.split("-")[0].trim() : item.title;
              }
              else if (dragElement === "left") {
                // If dragging the start handle
                attributeDate = item.start;
                attributeToUpdate = hasTitleSeparator ? item.title.split("-")[0].trim() : item.title;
              } 
              else if (dragElement === "right") {
                // If dragging the end handle
                attributeDate = item.end;
                attributeToUpdate = hasTitleSeparator ? item.title.split("-")[1].trim() : item.title;
              } 
              else {
                // If dragging element with single handle
                attributeDate = item.end ? item.end : item.start;
                attributeToUpdate = hasTitleSeparator ? item.title.split("-")[0].trim() : item.title;
              }
              
              // Only dispatch if we have valid data
              if (attributeToUpdate && attributeDate) {
                const formattedDate = moment(attributeDate).format('YYYY-MM-DD');
                dispatch(updateDateTimeline(
                  attributeToUpdate,
                  formattedDate, 
                  visValuesRef.current,
                  false,
                  deadlineSections
                ));
              }
            }
          } else {
            // Cancel the update if content is null or move is prevented
            callback(null);
          }
        },
        groupTemplate: function (group) {
          if (group === null) {
            return;
          }

          let container = document.createElement("div");
          container.classList.add("timeline-buttons-container");
          container.setAttribute("tabindex", "0");
          container.id = `timeline-group-${group.id}`;

          let words = group.deadlinegroup?.split("_") || [];
          let words2 = group.content?.split("-") || [];
          let normalizedString = words2[0]
          .replace(/[äå]/gi, 'a') // Replace ä and å with a
          .replace(/ö/gi, 'o')  // Replace ö with o
          .toLowerCase(); // Convert to lowercase

          let wordsToCheck = ["vahvista_",words[0], normalizedString, words[2] === "1" ? "" : words[2]];
          const keys = Object.entries(visValuesRef?.current);

          const deletableGroup = keys.some(([key, value]) =>{
            const allWordsInKey = wordsToCheck.every(word => key.includes(word))
            return allWordsInKey && value;
          });

          //Don't show buttons in these groups
          const stringsToCheck = ["Käynnistys", "Hyväksyminen", "Voimaantulo", "Vaiheen kesto"];
          const contentIncludesString = stringsToCheck.some(str => group?.content.includes(str));

            // Hover effect
          container.addEventListener("mouseenter", function() {
            // Action to perform on hover enter, e.g., change background color
            container.classList.add("show-buttons");
          });
          container.addEventListener("mouseleave", function() {
            // Action to perform on hover leave
            container.classList.remove("show-buttons");
          });

          if(group?.nestedGroups!== undefined && allowedToEdit && !contentIncludesString){
            let label = document.createElement("span");
            label.innerHTML = group.content + " ";
            container.insertAdjacentElement("afterBegin", label);
            let add = document.createElement("button");
            add.classList.add("timeline-add-button");
            add.style.fontSize = "small";

            add.addEventListener("click", function (event) {
              openAddDialog(visValuesRef.current,group,event);
            });
            container.insertAdjacentElement("beforeEnd", add);

            return container;
          }
          else if(group?.nestedInGroup){
            // Get, format and add labels
            let label = document.createElement("span");
            let content = group.content;
            label.classList.add("timeline-button-label");

            const formattedContent = formatContent(content, false);
            label.innerHTML = formattedContent + " ";

            container.insertAdjacentElement("afterBegin", label);

            let edit = document.createElement("button");
            edit.classList.add("timeline-edit-button");
            edit.style.fontSize = "small";

            edit.addEventListener("click", function () {
              openDialog(group,container);
            });
            container.insertAdjacentElement("beforeEnd", edit);

            if(allowedToEdit && !contentIncludesString){
              let labelRemove = document.createElement("span");
              container.insertAdjacentElement("afterBegin", labelRemove);
              let remove = document.createElement("button");
              remove.classList.add("timeline-remove-button");

              // Tooltip for disabled remove button
              let removeTextDiv = "";
              if (label.innerHTML.includes("Esilläolo")) {
                removeTextDiv = `<div class='timeline-remove-text'>${t('deadlines.delete-first-esillaolo')}</div>`;
              } else if (label.innerHTML.includes("Lautakunta")) {
                removeTextDiv = `<div class='timeline-remove-text'>${t('deadlines.delete-first-lautakunta')}</div>`;
              } else if (label.innerHTML.includes("Nähtävilläolo")) {
                removeTextDiv = `<div class='timeline-remove-text'>${t('deadlines.delete-first-nahtavillaolo')}</div>`;
              }

              //only not confirmed groups can be deleted
              if(deletableGroup || group.undeletable || visValuesRef?.current[`vahvista_${words[0]}_${normalizedString}_alkaa_${words[2]}`]){
                // add button-disabled class to the remove button if the group is not deletable
                remove.classList.add("button-disabled")
              }
              remove.style.fontSize = "small";

              remove.addEventListener("click", function () {
                // disabled button can't be clicked
                if (!remove.classList.contains("button-disabled")) {
                  openRemoveDialog(group);
                }
              });

              // Hover effect
              container.addEventListener("mouseenter", function() {
                // Action to perform on hover enter, e.g., change background color
                //only not confirmed groups can be deleted
                if(!group.undeletable && visValuesRef?.current[`vahvista_${words[0]}_${normalizedString}_alkaa_${words[2]}`]){
                  // add button-disabled class to the remove button if the group is not deletable
                  remove.classList.add("button-disabled")
                }
                // Action to perform on hover leave
                else if(!group.undeletable && !visValuesRef?.current[`vahvista_${words[0]}_${normalizedString}_alkaa_${words[2]}`]){
                  // add button-disabled class to the remove button if the group is not deletable
                  remove.classList.remove("button-disabled")
                }

              });

              container.insertAdjacentElement("beforeEnd", remove);

              // Add tooltip for disabled remove buttons
              if (deletableGroup || group.undeletable) {
                container.insertAdjacentHTML("beforeEnd", removeTextDiv);
              }

              let lock = document.createElement("button");
              lock.classList.add("timeline-lock-button");
              lock.style.fontSize = "small";
              lock.addEventListener("click", function () {
                lock.classList.toggle("lock");
                /*const locked = lock.classList.contains("lock") ? "inner locked" : "inner";
                let visibleItems = timelineInstanceRef?.current?.getVisibleItems()
                 if(visibleItems){
                  for (const visibleItem of visibleItems) {
                    const item = items.get(visibleItem);
                    if (!item.phase && item.id >= group.id) {
                      items.update({ id: item.id, className: locked, locked: !item.locked });
                    }
                  }
                } */
                lockLine(group);
              });
              container.insertAdjacentElement("beforeEnd", lock);
            }
            return container;
          }
          else{
            let label = document.createElement("span");
            label.classList.add("timeline-phase-label");
            label.innerHTML = group?.content + " ";
            container.insertAdjacentElement("afterBegin", label);
            return container;
          }
        },
      }

      // Create the tooltip element
      const tooltipDiv = document.createElement('div');
      tooltipDiv.className = 'vis-tooltip';
      tooltipDiv.style.display = 'none';
      document.body.appendChild(tooltipDiv);

      // Tooltip show and hide functions
      const showTooltip = (event, item) => {
        const offsetX = 150;
        tooltipDiv.style.display = 'block';
        tooltipDiv.style.left = `${event.pageX - offsetX}px`;
        tooltipDiv.style.top = `${event.pageY + 20}px`;
        tooltipDiv.innerHTML = `
          Vaihe: ${item?.phaseName} <br>
          ${item?.groupInfo ? "Nimi: " + item?.groupInfo + " <br>" : ""}
          ${item?.start ? "Päivämäärä: " + new Date(item?.start).toLocaleDateString() : ""}
          ${item?.start && item?.end && !item?.className.includes('board') ? " - " + new Date(item?.end).toLocaleDateString() : ""}
        `;
      };

      const hideTooltip = () => {
        tooltipDiv.style.display = 'none';
      };

      const handleMouseMove = (event) => {
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        // Check if mouseX is less than 310 to avoid showing tooltip over the vis-left
        if (mouseX < 310 || mouseY < 250) {
          hideTooltip();
          return;
        }

        const result = getTopmostTimelineItem(mouseX, mouseY, timelineInstanceRef);

        if (result) {
          showTooltip(event, result.item.data);
        } else {
          hideTooltip();
        }
      };    

      // Attach the mousemove event to the container, not the items themselves
      timelineRef.current.addEventListener('mousemove', handleMouseMove);

      if(items && options && groups){
        const timeline = timelineRef.current &&
        new vis.Timeline(timelineRef.current, items, options, groups);
        timelineInstanceRef.current = timeline
        setTimeline(timeline)
        // Track currently styled dragged group so we can remove styling on mouseUp
        const draggingGroupRef = { current: null };
        timeline.on('mouseDown', (props) => {
          //props.item can be number or a string, only perform .includes on strings
          const blockedByLabel = typeof props?.item === 'string' && (
            props.item.includes('Hyväksyminen') || props.item.includes('Voimaantulo')
          );
          // Prevent cursor-moving styling for Hyväksyminen or Voimaantulo items
          if (allowedToEdit && props?.item && !blockedByLabel) {
            // Add global cursor when a draggable interaction begins (only if an item is targeted and editing allowed)
            document.body.classList.add('cursor-moving');
            // Also add cursor-moving-target to the parent .vis-group for scoped shadow styling
            const targetEl = props?.event?.target;
            const groupEl = targetEl && targetEl.closest && targetEl.closest('.vis-group');
            if(groupEl && groupEl !== draggingGroupRef.current){
              if(draggingGroupRef.current){
                draggingGroupRef.current.classList.remove('cursor-moving-target');
              }
              groupEl.classList.add('cursor-moving-target');
              draggingGroupRef.current = groupEl;
            }
          }

          if (props.item) {
            const element = props.event.target;
            const parent = props.event.target.parentElement
            // Check if parent element has 'confirmed' class
            const isConfirmed = props?.event?.target?.parentElement?.classList?.contains('confirmed') || element?.classList?.contains('confirmed') ? " confirmed" : "";
            // Determine if this click is on a right-side board item (target or its parent)
            const isBoardRight = element.classList.contains('board-right') || parent?.classList?.contains('board-right');
            // Ensure any 'board-right' never routes to the left handle branch
          if (element.classList.contains('vis-item-overflow') && parent?.classList?.contains('inner-end')) {
            dragHandleRef.current = "elements" + isConfirmed;
          }
          else if (!isBoardRight && (element.classList.contains('vis-drag-left') || element.classList.contains('vis-point') || parent.classList.contains('board'))) {
              dragHandleRef.current = "left" + isConfirmed;
            }else if(isBoardRight){
              dragHandleRef.current = "board-right" + isConfirmed;
            } else if (element.classList.contains('vis-drag-right')) {
              dragHandleRef.current = "right" + isConfirmed;
            } else {
              dragHandleRef.current = "" + isConfirmed;
            }
          } else {
            const isConfirmed = props?.event?.target?.parentElement?.classList?.contains('confirmed') ? " confirmed" : "";
            dragHandleRef.current = "" + isConfirmed;
          }
        });

        timeline.on('mouseUp', () => {
          if(document.body.classList.contains('cursor-moving')){
            document.body.classList.remove('cursor-moving');
          }
          if(draggingGroupRef.current){
            draggingGroupRef.current.classList.remove('cursor-moving-target');
            draggingGroupRef.current = null;
          }
        });

        // Add click event listener to timeline container so clicking on the timeline items works
        timelineRef.current.addEventListener('click', function(event) {
          const mouseX = event.clientX;
          const mouseY = event.clientY;

          // Skip clicks in the vis-left and header areas
          if (mouseX < 310 || mouseY < 250) {
            return;
          }

          const result = getTopmostTimelineItem(mouseX, mouseY, timelineInstanceRef);

          if (result) {
            if (result.item.data.phase === true) {
              return;
            }
            let groupObj = groups.get(result.item.data.group) || result.item.data;
            openDialog(groupObj, result.dom);
          }
        });

        if (timeline?.itemSet) {
          // remove the default internal hammer tap event listener
          timeline.itemSet.groupHammer.off('tap');
          // use my own fake internal hammer tap event listener
          timeline.itemSet.groupHammer.on('tap', function (event) {
            let target = event.target;
            if (target.classList.contains('timeline-add-button')) {
                //Custom function to add new item
                timelineGroupClick(timeline.itemSet.options,groups)
            } 
            else {
              trackExpanded(event)
              // if not add button, forward the event to the vis event handler
              timeline.itemSet._onGroupClick(event);
            }
          });
          
        }
        timeline.focus(0);
        if(timeline){
          setTimeout(() => {
            highlightJanuaryFirst();
            observeTimelineChanges();
          }, 100); // Ensures elements are rendered before applying styles
        }
        //timeline.on('rangechanged', onRangeChanged);
        return () => {
          // Check if tooltipDiv exists before trying to remove it
          if (tooltipDiv) {
            tooltipDiv.remove(); // Remove from DOM
          }

          if (timelineInstanceRef.current) {
            timelineInstanceRef.current.destroy();
            timelineInstanceRef.current.off('itemover', showTooltip);
            timelineInstanceRef.current.off('itemout', hideTooltip);
            document.body.removeEventListener('mousemove', handleMouseMove);
          }
          timeline.off('mouseDown');
          observerRef?.current?.disconnect();
          //timeline.off('rangechanged', onRangeChanged);
        }
      }
    }, [])

    // Helper: Highlight timeline item if needed
    function highlightTimelineItem(timelineElement, savedHighlightId) {
      if (!timelineElement || !savedHighlightId) return;
      const alreadyHighlightedElements = timelineElement.querySelectorAll(".vis-group.foreground-highlight");
      if (alreadyHighlightedElements.length > 0) return;

      const matchedItem = timelineElement.querySelector(`.vis-item[class*="${savedHighlightId}"]`);
      if (!matchedItem) return;

      const groupEl = matchedItem.closest(".vis-group");
      if (groupEl) {
        groupEl.classList.add("foreground-highlight");
      }
    }

    // Helper: Highlight menu item if needed
    function highlightMenuItem(menuHighlightClass, timelineRef) {
      if (
        !menuHighlightClass ||
        typeof menuHighlightClass !== "string" ||
        menuHighlightClass.startsWith("[object ") ||
        !timelineRef?.current
      ) {
        return;
      }
      const selector = `.vis-label.vis-nested-group.${CSS.escape(menuHighlightClass)}`;
      const alreadyHighlightedMenuElements = document.querySelectorAll(".highlight-selected");
      if (alreadyHighlightedMenuElements.length > 0) return;

      const menuElementToHighlight = document.querySelector(selector);
      if (menuElementToHighlight) {
        menuElementToHighlight.classList.add("highlight-selected");
      }
    }

    useEffect(() => {
      visValuesRef.current = visValues;
      setToggleOpenAddDialog(false);

      if (timelineRef.current && timelineInstanceRef.current) {
        // Update timeline when values change from side modal
        timelineInstanceRef.current.setItems(items);
        timelineInstanceRef.current.setGroups(groups);
        timelineInstanceRef.current.redraw();
      }

      // Restore highlight from localStorage
      const savedHighlightId = localStorage.getItem("timelineHighlightedElement");
      const menuHighlightClass = localStorage.getItem("menuHighlight");

      if (timelineRef.current) {
        highlightTimelineItem(timelineRef.current, savedHighlightId);
      }
      highlightMenuItem(menuHighlightClass, timelineRef);

    }, [visValues]);

    function getHighlightedElement(offset) {
      const container = document.querySelector('.vis-labelset');
      const all = Array.from(container.querySelectorAll('.vis-nested-group'));
      return all[offset] || null;
    }

    // Function to highlight elements based on phase name and suffix when redirected from the form to the timeline
    const highlightTimelineElements = (deadlineGroup) => {
      if (!deadlineGroup || !timelineRef.current) return;
      // Extract the phase name and suffix from the deadlinegroup
      const parts = deadlineGroup.split('_');
      let suffix = "1"; // Default to 1 if no suffix
      
      // Get the numeric suffix (like "_1", "_2") if it exists
      if (parts.length > 2) {
        const lastPart = parts[parts.length - 1];
        if (/^\d+$/.test(lastPart)) {
          suffix = lastPart;
        }
      }
      const highlightedElement = getHighlightedElement(suffix)
      if(highlightedElement){
        highlightedElement.classList.add('highlight-selected');
      }
    };

    useEffect(() => {
      selectedGroupIdRef.current = selectedGroupId;
    }, [selectedGroupId]);

    useEffect(() => {
      if (showTimetableForm.selectedPhase !== null) {
        setToggleTimelineModal({open:!toggleTimelineModal.open, highlight:true, deadlinegroup:showTimetableForm?.matchedDeadline?.deadlinegroup})
        setTimelineData({group:showTimetableForm.selectedPhase, content:formatDeadlineGroupTitle(showTimetableForm)})
        // Call the highlighting function
        highlightTimelineElements(showTimetableForm?.matchedDeadline?.deadlinegroup);
      }
    }, [showTimetableForm.selectedPhase])

    const generateTitle = (deadlinegroup) => {
      if (!deadlinegroup) return '';
      const parts = deadlinegroup.split('_');
      if (parts.length < 3) return deadlinegroup;
      const formattedString = `${parts[1].replace('kerta', '')}-${parts[2]}`;
      return formattedString.charAt(0).toUpperCase() + formattedString.slice(1);
    };

    const formatDeadlineGroupTitle = (data) => {
      if(data.selectedPhase === "Voimaantulo" || data.selectedPhase === "Hyväksyminen"){
        return "Vaiheen lisätiedot";
      }
      else{
        const newTitle = generateTitle(data?.matchedDeadline?.deadlinegroup);
        return formatContent(newTitle,true);
      }
    }

    const formatContent = (content, keepNumberOne = false) => {
      if (content) {
        if (content.includes("-1") && !keepNumberOne) {
          content = content.replace("-1", "");
        } else if (content.includes("-")) {
          content = content.replace("-", " - ");
        } else if (content.includes("Vaiheen kesto")) {
          content = "Vaiheen lisätiedot";
        }

        if (content.includes("Nahtavillaolo")) {
          content = content.replace("Nahtavillaolo", "Nähtävilläolo");
        }

        return content;
      }
    };

    return (
      !deadlines ? <LoadingSpinner />
      :
      <>
        <div className='vis years' ref={timelineRef}>
          <VisTimelineMenu
            goToToday={goToToday}
            zoomIn={zoomIn}
            zoomOut={zoomOut}
            moveLeft={moveLeft}
            moveRight={moveRight}
            toggleRollingMode={toggleRollingMode}
            showYears={showYears}
            showMonths={showMonths}
            showWeeks={showWeeks}
            showDays={showDays}
            show6Months={show6Months}
            show2Yers={show2Yers}
            show5Yers={show5Yers}
            show3Months={show3Months}
          />
        </div>
        <TimelineModal 
          open={toggleTimelineModal.open}
          group={timelineData.group}
          content={formatContent(timelineData.content, true)}
          deadlinegroup={toggleTimelineModal.deadlinegroup}
          deadlines={deadlines}
          onClose={handleClosePanel}
          visValues={visValues}
          deadlineSections={deadlineSections}
          formSubmitErrors={formSubmitErrors}
          projectPhaseIndex={projectPhaseIndex}
          archived={archived}
          allowedToEdit={allowedToEdit}
          disabledDates={disabledDates}
          lomapaivat={lomapaivat}
          dateTypes={dateTypes}
          groups={groups?.get()}
          items={items?.get()}
          sectionAttributes={sectionAttributes}
          isAdmin={isAdmin}
          initialTab={showTimetableForm?.selectedPhase === "Voimaantulo" && showTimetableForm?.name === "voimaantulo_pvm" ? 1 : 0 }
        />
        <AddGroupModal
          toggleOpenAddDialog={toggleOpenAddDialog}
          addDialogStyle={addDialogStyle}
          addDialogData={addDialogData}
          closeAddDialog={closeAddDialog}
          allowedToEdit={allowedToEdit}
          timelineAddButton={timelineAddButton}
        />
        <ConfirmModal
          openConfirmModal={openConfirmModal}
          headerText={"Haluatko poistaa rivin?"} 
          contentText={"Jos poistat tämän rivin, et voi palauttaa sitä myöhemmin."} 
          button1Text={"Peruuta"} 
          button2Text={"Poista rivi"}
          onButtonPress1={handleCancelRemove} 
          onButtonPress2={handleRemoveGroup}
          style={"timetable-danger-modal"}
          buttonStyle1={"secondary"}
          buttonStyle2={"danger"}
        />
      </>
    )
});
VisTimelineGroup.displayName = 'VisTimelineGroup';
VisTimelineGroup.propTypes = {
  groups: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool
  ]),
  items: PropTypes.object,
  deadlines: PropTypes.array,
  visValues: PropTypes.object,
  deadlineSections: PropTypes.array,
  formSubmitErrors: PropTypes.object,
  projectPhaseIndex: PropTypes.number,
  archived: PropTypes.bool,
  allowedToEdit: PropTypes.bool,
  isAdmin: PropTypes.bool,
  disabledDates: PropTypes.array,
  lomapaivat: PropTypes.array,
  dateTypes: PropTypes.object,
  trackExpandedGroups: PropTypes.func,
  sectionAttributes: PropTypes.array
};
export default VisTimelineGroup