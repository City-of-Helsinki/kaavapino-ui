import React, {useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import Moment from 'moment'
import 'moment/locale/fi';
import {extendMoment} from 'moment-range'
import { LoadingSpinner } from 'hds-react'
//import { createRoot } from 'react-dom/client'
//import ItemRange from './ItemRange'
import * as vis from 'vis-timeline'
import 'vis-timeline/dist/vis-timeline-graph2d.min.css'
import TimelineModal from './TimelineModal'
import VisTimelineMenu from './VisTimelineMenu'
import AddGroupModal from './AddGroupModal';
import './VisTimeline.css'
Moment().locale('fi');

const VisTimelineGroup = forwardRef(({ groups, items, deadlines, visValues, deadlineSections, formSubmitErrors, projectPhaseIndex, archived, allowedToEdit, isAdmin}, ref) => {
    const moment = extendMoment(Moment);

    const timelineRef = useRef(null);
    const timelineInstanceRef = useRef(null);
    const visValuesRef = useRef(visValues);

    const [toggleTimelineModal, setToggleTimelineModal] = useState({open: false, highlight: false, deadlinegroup: false});
    const [timelineData, setTimelineData] = useState({group: false, content: false});
    const [timeline, setTimeline] = useState(false);
    const [addDialogStyle, setAddDialogStyle] = useState({ left: 0, top: 0 });
    const [addDialogData, setAddDialogData] = useState({group:false,deadlineSections:false,showPresence:false,showBoard:false,nextEsillaolo:false,nextLautakunta:false});
    const [toggleOpenAddDialog, setToggleOpenAddDialog] = useState(false)
    const [currentFormat, setCurrentFormat] = useState("showMonths");
    //const [lock, setLock] = useState({group:false,id:false,locked:false,abbreviation:false});

    useImperativeHandle(ref, () => ({
      getTimelineInstance: () => timelineInstanceRef.current,
    }));


    const groupDragged = (id) => {
      console.log('onChange:', id)
    }

    const timelineGroupClick = (properties,groups) => {
      if (properties.group) {
        // Access the actual DOM event to inspect the clicked element
        let clickedElement = properties.event.target;

        if(clickedElement.classList.contains('timeline-add-button')){
          properties.event.preventDefault();
          properties.event.stopPropagation();
          // Ensure the group remains expanded if add button is clicked
          // add button has own listener that triggers openAddDialog
          let groupId = properties.group;
          if (groupId) {
            let group = groups.get(groupId);
            if (group) {
              group.showNested = true;
              groups.update(group);
            }
          }
          return;
        }
        else{
          properties.event.preventDefault();
          properties.event.stopPropagation();

          let groupId = properties.group;
          if (groupId) {
            let group = groups.get(groupId);
            if (group) {
              group.showNested = !group.showNested;
              groups.update(group);
            }
          }
          return;
        }
      }
    }

    const canGroupBeAdded = (visValRef,data,deadlineSections) => {
      //Find out how many groups in clicked phase has been added to timeline
      const matchingGroups = groups.get().filter(group => data.nestedGroups.includes(group.id));
      const esillaoloCount = matchingGroups.filter(group => group.content === 'Esilläolo').length > 1 ? '_'+matchingGroups.filter(group => group.content === 'Esilläolo').length : '';
      const lautakuntaCount = matchingGroups.filter(group => group.content === 'Lautakunta').length > 1 ? '_'+matchingGroups.filter(group => group.content === 'Lautakunta').length : '';
      const phase = data.content.toLowerCase();
      let esillaoloConfirmed = false
      let lautakuntaConfirmed = false
      //Returned values
      let canAddEsillaolo = false
      let canAddLautakunta = false
      let nextEsillaoloClean = false
      let nextLautakuntaClean = false
      //Check if existing groups have been confirmed
      //Only when existing esilläolo or lautakunta is confirmed, new group of that type can be added 

      //vahvista_periaatteet_esillaolo_alkaa
      if (Object.prototype.hasOwnProperty.call(visValRef, 'vahvista_'+phase+'_esillaolo_alkaa'+esillaoloCount) && visValRef['vahvista_'+phase+'_esillaolo_alkaa'+esillaoloCount] === true) {
        //can add
        esillaoloConfirmed = true
      } else {
        //cannot add
        esillaoloConfirmed = false
      }
      
      if (Object.prototype.hasOwnProperty.call(visValRef, 'vahvista_'+phase+'_lautakunnassa'+lautakuntaCount) && visValRef['vahvista_'+phase+'_lautakunnassa'+lautakuntaCount] === true) {
        lautakuntaConfirmed = true
      } else {
        lautakuntaConfirmed = false
      }

      //Get keys for comparising from attribute_data and deadlineSections and check if more groups can be added to timeline
      const matchingKeys = Object.keys(deadlineSections).filter(key => data.content === deadlineSections[key].title);

      let attributeKeys = [];
      if (matchingKeys.length > 0 && deadlineSections[matchingKeys[0]].sections[0].attributes) {
        attributeKeys = Object.keys(deadlineSections[matchingKeys[0]].sections[0].attributes);
      }
      
      if(esillaoloConfirmed){
        const deadlineEsillaolokertaKeys = attributeKeys.filter(key => key.includes('_esillaolokerta_'));
        const esillaoloRegex = new RegExp(`${phase}_esillaolo_\\d+$`);
        const attributeEsillaoloKeys = Object.keys(visValRef).filter(key => esillaoloRegex.test(key));
        canAddEsillaolo = attributeEsillaoloKeys.length < deadlineEsillaolokertaKeys.length;
        const nextEsillaoloStr = canAddEsillaolo ? `jarjestetaan_${phase}_esillaolo_${attributeEsillaoloKeys.length + 1}$` : false;
        nextEsillaoloClean = nextEsillaoloStr ? nextEsillaoloStr.replace(/[/$]/g, '') : nextEsillaoloStr;
      }

      if(lautakuntaConfirmed){
        const deadlineLautakuntakertaKeys = attributeKeys.filter(key => key.includes('_lautakuntakerta_'));
        const lautakuntaanRegex = new RegExp(`${phase}_lautakuntaan_\\d+$`);
        const attributeLautakuntaanKeys = Object.keys(visValRef).filter(key => lautakuntaanRegex.test(key));
        canAddLautakunta = attributeLautakuntaanKeys.length < deadlineLautakuntakertaKeys.length;
        const nextLautakuntaStr = canAddLautakunta ? `${phase}_lautakuntaan_${attributeLautakuntaanKeys.length + 1}$` : false;
        nextLautakuntaClean = nextLautakuntaStr ? nextLautakuntaStr.replace(/[/$]/g, '') : nextLautakuntaStr;
      }

      return [canAddEsillaolo,nextEsillaoloClean,canAddLautakunta,nextLautakuntaClean]
    }


    const openAddDialog = (visValRef,data,event) => {
      const [addEsillaolo,nextEsillaolo,addLautakunta,nextLautakunta] = canGroupBeAdded(visValRef,data,deadlineSections)
      const rect = event.target.getBoundingClientRect();
      
      setAddDialogStyle({
        left: `${rect.left - 12}px`,
        top: `${rect.bottom - 10}px`
      })
      setAddDialogData({group:data,deadlineSections:deadlineSections,showPresence:addEsillaolo,showBoard:addLautakunta,nextEsillaolo:nextEsillaolo,nextLautakunta:nextLautakunta})
      setToggleOpenAddDialog(prevState => !prevState)
    }

    const openRemoveDialog = (visValRef,data,event) => {
      console.log(visValRef,data,event)
/*       const [addEsillaolo,nextEsillaolo,addLautakunta,nextLautakunta] = canGroupBeAdded(visValRef,data,deadlineSections)
      const rect = event.target.getBoundingClientRect();
      
      setAddDialogStyle({
        left: `${rect.left - 12}px`,
        top: `${rect.bottom - 10}px`
      })
      setAddDialogData({group:data,deadlineSections:deadlineSections,showPresence:addEsillaolo,showBoard:addLautakunta,nextEsillaolo:nextEsillaolo,nextLautakunta:nextLautakunta})
      setToggleOpenAddDialog(prevState => !prevState) */
    }


    const closeAddDialog = () => {
      setToggleOpenAddDialog(prevState => !prevState)
    };
  
  
    const lockLine = (data) => {
      console.log(data)
      //setLock({group:data.nestedInGroup,id:data.id,abbreviation:data.abbreviation,locked:!data.locked})
    }
  
  
    const openDialog = (data,container) => {
      container ? container.classList.toggle("highlight-selected") : toggleTimelineModal.highlight.classList.toggle("highlight-selected");
      const modifiedDeadlineGroup = data?.deadlinegroup?.includes(';') ? data.deadlinegroup.split(';')[0] : data.deadlinegroup;
      setToggleTimelineModal({open:!toggleTimelineModal.open, highlight:container, deadlinegroup:modifiedDeadlineGroup})
     // if(toggleTimelineModal.open){
        //Set data from items
      setTimelineData({group:data.nestedInGroup, content:data.content})
     // }
     // else{
        //Close side modal and update vistimeline visually
       // changeItemRange(item.start > i.start, item, i)
     // }
    }

    const changeItemRange = (subtract, item, i) => {
      const timeline = this.timelineRef?.current?.getTimelineInstance();
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

    /**
   * Move the timeline a given percentage to left or right
   * @param {Number} percentage   For example 0.1 (left) or -0.1 (right)
   */
    const move = (percentage) => {
      var range = timeline.getWindow();
      var interval = range.end - range.start;

      timeline.setWindow({
        start: range.start.valueOf() - interval * percentage,
        end: range.end.valueOf() - interval * percentage,
      });
    }

    const showMonths = () => {
      var now = new Date();
      var currentYear = now.getFullYear();
      var startOfMonth = new Date(currentYear, now.getMonth(), 1);
      var endOfMonth = new Date(currentYear, now.getMonth() + 1, 0);
      timeline.setOptions({timeAxis: {scale: 'weekday'}});
      timeline.setWindow(startOfMonth, endOfMonth);
      setCurrentFormat("showMonths");
    }

    const showYers = () => {
      var now = new Date();
      var currentYear = now.getFullYear();
      var startOfYear = new Date(currentYear, 0, 1);
      var endOfYear = new Date(currentYear, 11, 31);
      timeline.setOptions({timeAxis: {scale: 'month'}});
      timeline.setWindow(startOfYear, endOfYear);
      setCurrentFormat("showYers");
    }

    const show2Yers = () => {
      var now = new Date();
      var currentYear = now.getFullYear();
      var startOf2Years = new Date(currentYear, now.getMonth(), 1);
      var endOf2Years = new Date(currentYear + 2, now.getMonth(), 0);
      timeline.setOptions({timeAxis: {scale: 'month'}});
      timeline.setWindow(startOf2Years, endOf2Years);
    }

    const show5Yers = () => {
      var now = new Date();
      var currentYear = now.getFullYear();
      var startOf5Years = new Date(currentYear, now.getMonth(), 1);
      var endOf5Years = new Date(currentYear + 5, now.getMonth(), 0);
      timeline.setOptions({timeAxis: {scale: 'month'}});
      timeline.setWindow(startOf5Years, endOf5Years);
    }

    const show3Months = () => {
      var now = new Date();
      var currentYear = now.getFullYear();
      var startOf3Months = new Date(currentYear, now.getMonth(), 1);
      var endOf3Months = new Date(currentYear, now.getMonth() + 3, 0);
      timeline.setOptions({timeAxis: {scale: 'weekday'}});
      timeline.setWindow(startOf3Months, endOf3Months);
    }

    const show6Months = () => {
      var now = new Date();
      var currentYear = now.getFullYear();
      var startOf6Months = new Date(currentYear, now.getMonth(), 1);
      var endOf6Months = new Date(currentYear, now.getMonth() + 6, 0);
      timeline.setOptions({timeAxis: {scale: 'weekday'}});
      timeline.setWindow(startOf6Months, endOf6Months);
    }

    const showWeeks = () => {
      var now = new Date();
      var currentYear = now.getFullYear();
      var startOfWeek = new Date(currentYear, now.getMonth(), now.getDate() - now.getDay());
      var endOfWeek = new Date(currentYear, now.getMonth(), now.getDate() - now.getDay() + 6);
      timeline.setWindow(startOfWeek, endOfWeek);
    }

    const showDays = () => {
      var ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;
      var now = new Date();
      var nowInMs = now.getTime();
      var oneDayFromNow = nowInMs + ONE_DAY_IN_MS;
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
        showYers();
      }
    }

    const toggleRollingMode = () =>  {
      timeline.toggleRollingMode();
    }

/*     const onRangeChanged = ({ start, end }) => {
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
        moveable:true,
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
        itemsAlwaysDraggable: {
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
          var hour = 60 * 60 * 1000;
          return Math.round(date / hour) * hour;
        },
        onMove(item, callback) {
          let preventMove = false
          if(item.phase){
            if(!(item.start.getDay() % 6)){
              if(item.start.getDay() === 0){
                item.start.setTime(item.start.getTime() + 86400000);
              }
              else if(item.start.getDay() === 6){
                item.start.setTime(item.start.getTime() - 86400000);
              }
            }
            else if(!(item.end.getDay() % 6)){
              if(item.end.getDay() === 0){
                item.end.setTime(item.end.getTime() + 86400000);
              }
              else if(item.end.getDay() === 6){
                item.end.setTime(item.end.getTime() - 86400000);
              }
            }
            else{
              const movingTimetableItem = moment.range(item.start, item.end);
              items.forEach(i => {
                if(i.phase){
                  if (i.id !== item.id) {
                    const statickTimetables = moment.range(i.start, i.end);
                    if (movingTimetableItem.overlaps(statickTimetables)) {
                      preventMove = false
                      changeItemRange(item.start > i.start, item, i)
                    }
                  }
                }
              })
            }
          }
          else{
            if(!(item.start.getDay() % 6)){
              if(item.start.getDay() === 0){
                item.start.setTime(item.start.getTime() + 86400000);
              }
              else if(item.start.getDay() === 6){
                item.start.setTime(item.start.getTime() - 86400000);
              }
            }
            else if(!(item.end.getDay() % 6)){
              if(item.end.getDay() === 0){
                item.end.setTime(item.end.getTime() + 86400000);
              }
              else if(item.end.getDay() === 6){
                item.end.setTime(item.end.getTime() - 86400000);
              }
            }
            else{
              const movingTimetableItem = moment.range(item.start, item.end);
              items.forEach(i => {
                if (i.id !== item.id) {
                  if(item.phaseID === i.phaseID && !preventMove && !i.locked){
                    preventMove = false
                  }
                  else{
                    const statickTimetables = moment.range(i.start, i.end);
                    if (movingTimetableItem.overlaps(statickTimetables)) {
                      preventMove = true
                    }
                  }
                }
              })
            }
          }
          if (item.content != null && !preventMove) {
            callback(item); // send back adjusted item
          }
          else {
            callback(null); // cancel updating the item
          }
        },
        groupTemplate: function (group) {
          if (group === null) {
            return;
          }
          let container = document.createElement("div");
          container.classList.add("timeline-buttons-container");
          //Don't show buttons in these groups
          const stringsToCheck = ["Käynnistys", "Hyväksyminen", "Voimaantulo", "Vaiheen kesto"];
          const contentIncludesString = stringsToCheck.some(str => group?.content.includes(str));

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
              remove.style.fontSize = "small";

              remove.addEventListener("click", function (event) {
                openRemoveDialog(visValuesRef.current,group,event);
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
                //groups.update({ id: group.id, locked: !group.locked });
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
        <div className='vis' ref={timelineRef}>
          <VisTimelineMenu
            goToToday={goToToday}
            zoomIn={zoomIn}
            zoomOut={zoomOut}
            moveLeft={moveLeft}
            moveRight={moveRight}
            toggleRollingMode={toggleRollingMode}
            showYers={showYers}
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
        />
        <AddGroupModal
          toggleOpenAddDialog={toggleOpenAddDialog}
          addDialogStyle={addDialogStyle}
          addDialogData={addDialogData}
          closeAddDialog={closeAddDialog}
          isAdmin={isAdmin}
          allowedToEdit={allowedToEdit}
        />
      </>
    )
});
VisTimelineGroup.displayName = 'VisTimelineGroup';
export default VisTimelineGroup