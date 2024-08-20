import React, {useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { change } from 'redux-form'
import { useDispatch } from 'react-redux';
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
import { removeDeadlines } from '../../actions/projectActions';
import './VisTimeline.css'
Moment().locale('fi');

const VisTimelineGroup = forwardRef(({ groups, items, deadlines, visValues, deadlineSections, formSubmitErrors, projectPhaseIndex, archived, allowedToEdit, isAdmin, disabledDates, lomapaivat, dateTypes, trackExpandedGroups}, ref) => {
    const dispatch = useDispatch();
    const moment = extendMoment(Moment);

    const timelineRef = useRef(null);
    const timelineInstanceRef = useRef(null);
    const visValuesRef = useRef(visValues);

    const [toggleTimelineModal, setToggleTimelineModal] = useState({open: false, highlight: false, deadlinegroup: false});
    const [timelineData, setTimelineData] = useState({group: false, content: false});
    const [timeline, setTimeline] = useState(false);
    const [addDialogStyle, setAddDialogStyle] = useState({ left: 0, top: 0 });
    const [addDialogData, setAddDialogData] = useState({group:false,deadlineSections:false,showPresence:false,showBoard:false,nextEsillaolo:false,nextLautakunta:false,esillaoloReason:"",lautakuntaReason:"",hidePresence:false,hideBoard:false});
    const [toggleOpenAddDialog, setToggleOpenAddDialog] = useState(false)
    const [currentFormat, setCurrentFormat] = useState("showMonths");
    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [dataToRemove, setDataToRemove] = useState({});
    //const [lock, setLock] = useState({group:false,id:false,locked:false,abbreviation:false});

    useImperativeHandle(ref, () => ({
      getTimelineInstance: () => timelineInstanceRef.current,
    }));


    const groupDragged = (id) => {
      console.log('onChange:', id)
    }

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

    const checkConfirmedGroups = (esillaoloConfirmed, lautakuntaConfirmed, attributeKeys, visValRef, phase, canAddEsillaolo, nextEsillaoloClean, canAddLautakunta, nextLautakuntaClean, data) => {
      // Check if more Esillaolo groups can be added
      let esillaoloReason = !esillaoloConfirmed ? "noconfirmation" : "";
      let lautakuntaReason = !lautakuntaConfirmed ? "noconfirmation" : "";
      if (esillaoloConfirmed) {
        const deadlineEsillaolokertaKeys = data.maxEsillaolo
        const esillaoloRegex = new RegExp(`${phase}_esillaolo_\\d+$`);
        const attributeEsillaoloKeys = Object.keys(visValRef).filter(key => esillaoloRegex.test(key));
        let esillaoloCount = attributeEsillaoloKeys.length
        if(attributeEsillaoloKeys.length === 0 || data.content === "OAS" || data.content === "Ehdotus"){
          esillaoloCount += 1
        }
        esillaoloCount = esillaoloCount + 1;
        canAddEsillaolo = esillaoloCount <= deadlineEsillaolokertaKeys;
        const nextEsillaoloStr = canAddEsillaolo ? `jarjestetaan_${phase}_esillaolo_${esillaoloCount}$` : false;
        nextEsillaoloClean = nextEsillaoloStr ? nextEsillaoloStr.replace(/[/$]/g, '') : nextEsillaoloStr;

        if(esillaoloCount - 1 === deadlineEsillaolokertaKeys){
          esillaoloReason = "max"
        }
      }
      // Check if more Lautakunta groups can be added
      if (lautakuntaConfirmed) {
        const deadlineLautakuntakertaKeys = data.maxLautakunta
        const lautakuntaanRegex = new RegExp(`${phase}_lautakuntaan_\\d+$`);
        const attributeLautakuntaanKeys = Object.keys(visValRef).filter(key => lautakuntaanRegex.test(key));
        let lautakuntaCount = attributeLautakuntaanKeys.length
        if(attributeLautakuntaanKeys.length === 0 || phase === "tarkistettu_ehdotus"){
          lautakuntaCount += 1
        } 
        lautakuntaCount = lautakuntaCount + 1;
        canAddLautakunta = lautakuntaCount <= deadlineLautakuntakertaKeys;
        const nextLautakuntaStr = canAddLautakunta ? `${phase}_lautakuntaan_${lautakuntaCount}$` : false;
        nextLautakuntaClean = nextLautakuntaStr ? nextLautakuntaStr.replace(/[/$]/g, '') : nextLautakuntaStr;
        if(lautakuntaCount - 1 === deadlineLautakuntakertaKeys){
          lautakuntaReason = "max"
        }
      }

      return [canAddEsillaolo, nextEsillaoloClean, canAddLautakunta, nextLautakuntaClean, esillaoloReason, lautakuntaReason];
    }

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

    const canGroupBeAdded = (visValRef, data, deadlineSections) => {
      // Find out how many groups in the clicked phase have been added to the timeline
      const matchingGroups = groups.get().filter(group => data.nestedGroups.includes(group.id));
      const esillaoloCount = matchingGroups.filter(group => group.content.includes('Esilläolo') || group.content.includes('Nahtavillaolo')).length > 1 ? '_' + matchingGroups.filter(group => group.content.includes('Esilläolo') || group.content.includes('Nahtavillaolo')).length : '';
      const lautakuntaCount = matchingGroups.filter(group => group.content.includes('Lautakunta')).length > 1 ? '_' + matchingGroups.filter(group => group.content.includes('Lautakunta')).length : '';
      const phase = data.content.toLowerCase().replace(/\s+/g, '_');
      // Check if existing groups have been confirmed
      let esillaoloConfirmed = Object.prototype.hasOwnProperty.call(visValRef, `vahvista_${phase}_esillaolo_alkaa${esillaoloCount}`) && visValRef[`vahvista_${phase}_esillaolo_alkaa${esillaoloCount}`] === true
      || Object.prototype.hasOwnProperty.call(visValRef, `vahvista_${phase}_esillaolo${esillaoloCount}`) && visValRef[`vahvista_${phase}_esillaolo${esillaoloCount}`] === true;
      let lautakuntaConfirmed = Object.prototype.hasOwnProperty.call(visValRef, `vahvista_${phase}_lautakunnassa${lautakuntaCount}`) && visValRef[`vahvista_${phase}_lautakunnassa${lautakuntaCount}`] === true;
      
      if(phase === "luonnos"){
        lautakuntaConfirmed = Object.prototype.hasOwnProperty.call(visValRef, `vahvista_kaavaluonnos_lautakunnassa${lautakuntaCount}`) && visValRef[`vahvista_kaavaluonnos_lautakunnassa${lautakuntaCount}`] === true;
      }
      if(phase === "periaatteet" && !(phase + "_lautakuntaan_1" in visValRef)|| phase === "luonnos" && !(phase + "_lautakuntaan_1")){
        lautakuntaConfirmed = true
      }
      if(phase === "luonnos" && !("jarjestetaan_" + phase + "_esillaolo_1" in visValRef) || phase === "periaatteet" && !("jarjestetaan_"+phase+"_esillaolo_1" in visValRef)){
        esillaoloConfirmed = true
      }

      // Initialize returned values
      let canAddEsillaolo = false;
      let nextEsillaoloClean = false;
      let canAddLautakunta = false;
      let nextLautakuntaClean = false;
      let esillaoloReason = "";
      let lautakuntaReason = "";
    
      // Get attribute keys for comparison from deadlineSections
      const matchingKeys = Object.keys(deadlineSections).filter(key => data.content === deadlineSections[key].title);
      let attributeKeys = [];
      if (matchingKeys.length > 0 && deadlineSections[matchingKeys[0]].sections[0].attributes) {
        attributeKeys = Object.keys(deadlineSections[matchingKeys[0]].sections[0].attributes);
      }
      
      const results = checkConfirmedGroups(esillaoloConfirmed, lautakuntaConfirmed, attributeKeys, visValRef, phase, canAddEsillaolo, nextEsillaoloClean, canAddLautakunta, nextLautakuntaClean,data);
      [canAddEsillaolo, nextEsillaoloClean, canAddLautakunta, nextLautakuntaClean, esillaoloReason, lautakuntaReason] = results;
      let phaseWithoutSpace = phase.toLowerCase().replace(/\s+/g, '-');

      if(visValRef["lautakunta_paatti_"+phaseWithoutSpace] === "hyvaksytty" || visValRef["lautakunta_paatti_"+phaseWithoutSpace] === "palautettu_uudelleen_valmisteltavaksi"){
        canAddLautakunta = false
      }

      return [canAddEsillaolo, nextEsillaoloClean, canAddLautakunta, nextLautakuntaClean, esillaoloReason, lautakuntaReason];
    };

    const openAddDialog = (visValRef,data,event) => {
      const [addEsillaolo,nextEsillaolo,addLautakunta,nextLautakunta,esillaoloReason,lautakuntaReason] = canGroupBeAdded(visValRef,data,deadlineSections)
      const rect = event.target.getBoundingClientRect();
      
      setAddDialogStyle({
        left: `${rect.left - 12}px`,
        top: `${rect.bottom - 10}px`
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
      //TODO review logic and split this to smaller functions
      let removeFromTimeline = dataToRemove?.deadlinegroup
      let phase = dataToRemove?.nestedInGroup.toLowerCase()
      let esillaolo = dataToRemove?.content?.includes("Esilläolo") ? true : false

      let toRemoveFromCalendar = dataToRemove?.nestedInGroup?.toLowerCase() + "_" + dataToRemove?.content?.toLowerCase().replace(/[äöå]/g, match => {
        switch (match) {
          case 'ä': return 'a';
          case 'ö': return 'o';
          case 'å': return 'a';
          default: return match;
        }
      }).replace(/-/g, "_").replace(/_\d+/g, "");

      let index = "_" + dataToRemove.deadlinegroup.split('_').pop()
      let keysToRemove = []

      //remove from attribute data/calendar
      for (const key in visValues) {
        if (Object.prototype.hasOwnProperty.call(visValues, key)) {
          if (key.includes(toRemoveFromCalendar) && key.includes(index) || esillaolo && key.includes("mielipiteet_"+phase+index)) {
            keysToRemove.push(key)
           // Filter out the matching deadline from deadlines
            dispatch(change(EDIT_PROJECT_TIMETABLE_FORM, key, null));
          }
        }
      }
      //Remove from vis groups
      let updatedGroups = groups.get({
        filter: function(group) {
          return !(group.deadlinegroup && group.deadlinegroup === removeFromTimeline);
        }
      });
      //Remove from vis sub groups
      updatedGroups.forEach(group => {
        if (group.nestedGroups) {
          group.nestedGroups = group.nestedGroups.filter(subgroup => subgroup !== dataToRemove.id);
        }
      });
      // Remove from local deadlines data, backend removes the actual data on save
      dispatch(removeDeadlines(keysToRemove));
      //Remove from vis items
      const updatedItems = items.get().filter(item => item.group !== dataToRemove.id);
      //Update timeline visually
      groups.clear();
      items.clear();
      groups.add(updatedGroups);
      items.add(updatedItems)
      setOpenConfirmModal(!openConfirmModal)
    }

    const closeAddDialog = () => {
      setToggleOpenAddDialog(prevState => !prevState)
    };
  
  
    const lockLine = (data) => {
      console.log(data)
      //setLock({group:data.nestedInGroup,id:data.id,abbreviation:data.abbreviation,locked:!data.locked})
    }
  
  
    const openDialog = (data,container) => {
      //remove already highlighted 
      timelineRef?.current?.querySelectorAll('.highlight-selected').forEach(el => {
        el.classList.remove('highlight-selected');
      });
      //highlight the latest group
      if (container) {
        container.classList.toggle("highlight-selected");
      }
      const modifiedDeadlineGroup = data?.deadlinegroup?.includes(';') ? data.deadlinegroup.split(';')[0] : data.deadlinegroup;
      setToggleTimelineModal({open:!toggleTimelineModal.open, highlight:container, deadlinegroup:modifiedDeadlineGroup})
        //Set data from items
      setTimelineData({group:data.nestedInGroup, content:data.content})
    }

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
      let now = new Date();
      let currentYear = now.getFullYear();
      let startOfMonth = new Date(currentYear, now.getMonth(), 1);
      let endOfMonth = new Date(currentYear, now.getMonth() + 1, 0);
      timelineRef.current.classList.remove("years")
      timeline.setOptions({timeAxis: {scale: 'weekday'}});
      timeline.setWindow(startOfMonth, endOfMonth);
      setCurrentFormat("showMonths");
    }

    const showYears = () => {
      let now = new Date();
      let currentYear = now.getFullYear();
      let startOfYear = new Date(currentYear, 0, 1);
      let endOfYear = new Date(currentYear, 11, 31);
      timelineRef.current.classList.add("years")
      timeline.setOptions({timeAxis: {scale: 'month'}});
      timeline.setWindow(startOfYear, endOfYear);
      setCurrentFormat("showYears");
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
      if(currentFormat === "showMonths"){
        showMonths();
      }
      else{
        showYears();
      }
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
        itemsAlwaysDraggable: { // Dragging is disabled from VisTimeline.scss allow in v1.2
            item:true,
            range:true
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
              weekday:    'ddd D',
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
        onMove(item, callback) {
          let preventMove = false;
        
          if (item.phase) {
            if (!(item.start.getDay() % 6)) {
              adjustWeekend(item.start);
            } else if (!(item.end.getDay() % 6)) {
              adjustWeekend(item.end);
            } else {
              const movingTimetableItem = moment.range(item.start, item.end);
              items.forEach(i => {
                if (i.phase) {
                  if (i.id !== item.id) {
                    const statickTimetables = moment.range(i.start, i.end);
                    if (movingTimetableItem.overlaps(statickTimetables)) {
                      preventMove = false;
                      changeItemRange(item.start > i.start, item, i);
                    }
                  }
                }
              });
            }
          } else {
            if (!(item.start.getDay() % 6)) {
              adjustWeekend(item.start);
            } else if (!(item.end.getDay() % 6)) {
              adjustWeekend(item.end);
            } else {
              const movingTimetableItem = moment.range(item.start, item.end);
              items.forEach(i => {
                if (i.id !== item.id) {
                  if (item.phaseID === i.phaseID && !preventMove && !i.locked) {
                    preventMove = false;
                  } else {
                    const statickTimetables = moment.range(i.start, i.end);
                    if (movingTimetableItem.overlaps(statickTimetables)) {
                      preventMove = true;
                    }
                  }
                }
              });
            }
          }
        
          if (item.content != null && !preventMove) {
            callback(item); // send back adjusted item
          } else {
            callback(null); // cancel updating the item
          }
        },
        groupTemplate: function (group) {
          if (group === null) {
            return;
          }
          let container = document.createElement("div");
          container.classList.add("timeline-buttons-container");
          container.setAttribute("tabindex", "0");
          let words = group.deadlinegroup?.split("_") || [];
          let words2 = group.content?.split("-") || [];
          let normalizedString = words2[0]
          .replace(/[äå]/gi, 'a') // Replace ä and å with a
          .replace(/[ö]/gi, 'o')  // Replace ö with o
          .toLowerCase(); // Convert to lowercase

          //Don't show buttons in these groups
          const stringsToCheck = ["Käynnistys", "Hyväksyminen", "Voimaantulo", "Vaiheen kesto"];
          const contentIncludesString = stringsToCheck.some(str => group?.content.includes(str));
            // Hover effect
          container.addEventListener("mouseenter", function() {
            let words = group.deadlinegroup?.split("_") || [];
            let words2 = group.content?.split("-") || [];
            let normalizedString = words2[0]
            .replace(/[äå]/gi, 'a') // Replace ä and å with a
            .replace(/[ö]/gi, 'o')  // Replace ö with o
            .toLowerCase(); // Convert to lowercase
            let wordsToCheck = ["vahvista_",words[0], normalizedString, words[2] === "1" ? "" : words[2]];
            // Action to perform on hover enter, e.g., change background color
            container.classList.add("show-buttons");
            const keys = Object.entries(visValuesRef?.current);
            const deletableGroup = keys.some(([key, value]) =>{
              const allWordsInKey = wordsToCheck.every(word => key.includes(word))
              if(allWordsInKey){
                if(value){
                  return true
                }
                else{
                  return false; // stop iterating and return false
                }
              }
            });
            //only not confirmed groups can be deleted
            if(!deletableGroup && !group.undeletable){
               // Select the button within the container
              const button = container.querySelector('.timeline-buttons-container .timeline-remove-button');
              if(button){
                // Remove the "button-disabled" class
                if(button?.classList.contains('button-disabled')){
                  button?.classList.remove('button-disabled');
                }
              }
            }
            else{
              const button = container.querySelector('.timeline-buttons-container .timeline-remove-button');
              if(!button?.classList.contains('button-disabled')){
                button?.classList.add('button-disabled');
              }
            }
          });
          container.addEventListener("mouseleave", function() {
            // Action to perform on hover leave
            container.classList.remove("show-buttons");
          });

          if(group?.nestedGroups?.length > 0 && allowedToEdit && !contentIncludesString){
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
            let label = document.createElement("span");
            label.innerHTML = group.content + " ";
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
              label.innerHTML = group.content + " ";
              container.insertAdjacentElement("afterBegin", labelRemove);
              let remove = document.createElement("button");
              remove.classList.add("timeline-remove-button");

              if(visValuesRef?.current[`vahvista_${words[0]}_${normalizedString}_alkaa_${words[2]}`]){
                remove.classList.add("button-disabled")
              }
              remove.style.fontSize = "small";

              remove.addEventListener("click", function () {
                  openRemoveDialog(group);
              });
              container.insertAdjacentElement("beforeEnd", remove);

              let lock = document.createElement("button");
              lock.classList.add("timeline-lock-button");
              lock.style.fontSize = "small";
              lock.addEventListener("click", function () {
                lock.classList.toggle("lock");
                const locked = lock.classList.contains("lock") ? "inner locked" : "inner";
                let visibleItems = timeline.getVisibleItems()
                for (let i = 0; i < visibleItems.length; i++) {
                  const item = items.get(visibleItems[i])
                  if(!item.phase && item.id >= group.id){
                    items.update({ id: item.id, className: locked, locked: !item.locked });
                  }
                }
                lockLine(group);
              });
              container.insertAdjacentElement("beforeEnd", lock);
            }
            return container;
          }
          else{
            let label = document.createElement("span");
            label.innerHTML = group?.content + " ";
            container.insertAdjacentElement("afterBegin", label);
            return container;
          }
        },
      }

      if(items && options && groups){
        const timeline = timelineRef.current &&
        new vis.Timeline(timelineRef.current, items, options, groups);
        timelineInstanceRef.current = timeline
        setTimeline(timeline)
        // add event listener
        timeline.on('groupDragged', groupDragged)

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
        //timeline.on('rangechanged', onRangeChanged);
        return () => {
          if (timelineInstanceRef.current) {
            timelineInstanceRef.current.destroy();
          }
          timeline.off('groupDragged', groupDragged)
          //timeline.off('rangechanged', onRangeChanged);
        }
      }
    }, [])

     useEffect(() => {
      visValuesRef.current = visValues;
      if (timelineRef.current) {
        if (timelineInstanceRef.current) {
          //Update timeline when values change from side modal
          timelineInstanceRef.current.setItems(items);
          timelineInstanceRef.current.redraw();
        }
      }
    }, [visValues]);

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
          content={timelineData.content}
          deadlinegroup={toggleTimelineModal.deadlinegroup}
          deadlines={deadlines}
          openDialog={openDialog}
          visValues={visValues}
          deadlineSections={deadlineSections}
          formSubmitErrors={formSubmitErrors}
          projectPhaseIndex={projectPhaseIndex}
          archived={archived}
          allowedToEdit={allowedToEdit}
          disabledDates={disabledDates}
          lomapaivat={lomapaivat}
          dateTypes={dateTypes}
        />
        <AddGroupModal
          toggleOpenAddDialog={toggleOpenAddDialog}
          addDialogStyle={addDialogStyle}
          addDialogData={addDialogData}
          closeAddDialog={closeAddDialog}
          isAdmin={isAdmin}
          allowedToEdit={allowedToEdit}
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
  groups: PropTypes.array,
  items: PropTypes.array,
  deadlines: PropTypes.array,
  visValues: PropTypes.object,
  deadlineSections: PropTypes.array,
  formSubmitErrors: PropTypes.object,
  projectPhaseIndex: PropTypes.number,
  archived: PropTypes.bool,
  allowedToEdit: PropTypes.bool,
  isAdmin: PropTypes.bool
};
export default VisTimelineGroup