import React, {useRef, useEffect, useState} from 'react';
import Moment from 'moment'
import {extendMoment} from 'moment-range'
//import { createRoot } from 'react-dom/client'
//import ItemRange from './ItemRange'
import TimelineModal from './TimelineModal'
import VisTimelineMenu from './VisTimelineMenu'
import * as vis from 'vis-timeline'
import * as visdata from 'vis-data'
import 'vis-timeline/dist/vis-timeline-graph2d.min.css'
import './VisTimeline.css'

/* const createRootForTimelineItem = (
  item,
  element,
  data
) => {
  if (!element.hasAttribute('data-is-rendered')) {
    element.setAttribute('data-is-rendered', 'true');
    const root = createRoot(element);
    root.render(React.createElement(<ItemRange/>, { item, data }));
    element.timelineItemRoot = root;
  } else {
    element.timelineItemRoot.render(React.createElement(<ItemRange/>, { item, data }));
  }
  return '';
};  */


function VisTimeline({deadlines}) {
    const moment = extendMoment(Moment);
    const container = useRef(null);
    const [timeline, setTimeline] = useState(false);
    const [lock, setLock] = useState({group:false,id:false,locked:false,abbreviation:false});
    const [toggleTimelineModal, setToggleTimelineModal] = useState({open: false, group: false, content: false, id:false, abbreviation:false, locked:false});
  /*     const onSelect = (properties) => {
        alert('selected items: ' + properties.items);
      } */

    const groupDragged = (id) => {
      console.log('onChange:', id)
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

    const showYers = () => {
      var now = new Date();
      var currentYear = now.getFullYear();
      var startOfYear = new Date(currentYear, 0, 1);
      var endOfYear = new Date(currentYear, 11, 31);
      timeline.setWindow(startOfYear, endOfYear);
    }

    const showMonths = () => {
      var now = new Date();
      var currentYear = now.getFullYear();
      var startOfMonth = new Date(currentYear, now.getMonth(), 1);
      var endOfMonth = new Date(currentYear, now.getMonth() + 1, 0);
      timeline.setWindow(startOfMonth, endOfMonth);
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
      move(0.2);
    }

    const moveRight = () =>  {
      move(-0.2);
    }

    const toggleRollingMode = () =>  {
      timeline.toggleRollingMode();
    }

    const changeItemRange = (subtract, item, i, timeline) => {
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

    const openDialog = (data) => {
      console.log('open dialog:', data)
      setToggleTimelineModal({open:!toggleTimelineModal.open,content:data.content,group:data.nestedInGroup,id:data.id,abbreviation:data.abbreviation,locked:data.locked})
    }

    const lockLine = (data) => {
      console.log('lock line:',data.locked)
      setLock({group:data.nestedInGroup,id:data.id,abbreviation:data.abbreviation,locked:!data.locked})
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
        stack: false,
        multiselect: true,
        sequentialSelection:  false,
        groupHeightMode:"auto",
        width: '100%',
        zoomMin: 1000 * 60 * 60 * 24, // one day in milliseconds
        zoomMax: 31556952000, // 1000 * 60 * 60 * 24 * 365.25 one year in milliseconds
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
          console.log(item)
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
                      changeItemRange(item.start > i.start, item, i, timeline)
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
              console.log(item.start,item.end)
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
          console.log(group,groups)
          if(group.nestedInGroup){
            let container = document.createElement("div");
            let label = document.createElement("span");
            label.innerHTML = group.content + " ";
            container.insertAdjacentElement("afterBegin", label);
            let edit = document.createElement("button");
            edit.classList.add("timeline-edit-button");
            let lock = document.createElement("button");
            lock.classList.add("timeline-lock-button");
            //edit.innerHTML = "Muokkaa";
            edit.style.fontSize = "small";
            edit.addEventListener("click", function () {
              openDialog(group);
            });
            container.insertAdjacentElement("beforeEnd", edit);

            lock.style.fontSize = "small";
            lock.addEventListener("click", function () {
              lock.classList.toggle("lock");
              const locked = lock.classList.contains("lock") ? "inner locked" : "inner";
              console.log(locked)
              console.log(items)
              let visibleItems = timeline.getVisibleItems()
              console.log(visibleItems)
              for (let i = 0; i < visibleItems.length; i++) {
                console.log(visibleItems[i])
                const item = items.get(visibleItems[i])
                console.log(item)
                if(!item.phase && item.id >= group.id){
                  items.update({ id: item.id, className: locked, locked: !item.locked });
                }
              }
              //groups.update({ id: group.id, locked: !group.locked });
              lockLine(group);
            });
            container.insertAdjacentElement("beforeEnd", lock);
            return container;
          }
        },
/*         template: (item, element, data) => {
          if (!item?.id || !data?.id) return null;

          if (!createRootForTimelineItem[item?.id]) {
            // If not, create a new root and store it
            createRootForTimelineItem[item?.id] = createRoot(element);
          }
          // eslint-disable-next-line react/jsx-props-no-spreading
          createRootForTimelineItem[item?.id].render(
            <ItemRange/>
          );

          return '';
        }, */
      };

      let items = new visdata.DataSet()
      let groups = new visdata.DataSet();
      let deadLineGroups = []
      let nestedDeadlines = []

      const phaseData = []
      let startDate = false
      let endDate = false
      let dashStart = false
      let dashEnd = false
      let innerStart = false
      let innerEnd = false
      let numberOfPhases = 1
      let style = ""
      let dashedStyle = ""
      let innerStyle = ""

      for (let i = 0; i < deadlines.length; i++) {
        if (!deadLineGroups.some(item => item.id === deadlines[i].deadline.phase_name)) {
          deadLineGroups.push({
            id: deadlines[i].deadline.phase_name,
            content: deadlines[i].deadline.phase_name,
            showNested: true,
            nestedGroups: []
          });
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
        else if(deadlines[i].deadline.deadline_types.includes('dashed_end') || deadlines[i].deadline.deadline_types.includes('inner_start')){
          dashEnd = deadlines[i].date
          innerStart = deadlines[i].date
        }
        else if(deadlines[i].deadline.deadline_types.includes('inner_end')){
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
        else if(dashStart && dashEnd){
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
            content: "Määräaika",
            abbreviation:deadlines[i].abbreviation,
            locked:false
          });
          numberOfPhases++
        }
        else if(innerStart && innerEnd){
          phaseData.push({
            id: numberOfPhases,
            content: "",
            start:innerStart,
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
            content: "Esilläolo",
            abbreviation:deadlines[i].abbreviation,
            locked:false
          });
          numberOfPhases++
        }
      }

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
      const timeline = container.current &&
      new vis.Timeline(container.current, items, options, groups);
      // add event listener
      //timeline.on('select', onSelect);
      setTimeline(timeline)
      timeline.on('groupDragged', groupDragged)
      //timeline.on('rangechanged', onRangeChanged);
      return () => {
        timeline.off('groupDragged', groupDragged)
        //timeline.off('rangechanged', onRangeChanged);
      } 
    }, [])
    console.log('lock:',lock)
    return (
      <>
        <div className='vis' ref={container}>
          <VisTimelineMenu
            zoomIn={zoomIn}
            zoomOut={zoomOut}
            moveLeft={moveLeft}
            moveRight={moveRight}
            toggleRollingMode={toggleRollingMode}
            showYers={showYers}
            showMonths={showMonths}
            showWeeks={showWeeks}
            showDays={showDays}
          />
        </div>
        <TimelineModal 
          open={toggleTimelineModal.open}
          id={toggleTimelineModal.id}
          group={toggleTimelineModal.group}
          content={toggleTimelineModal.content}
          abbreviation={toggleTimelineModal.abbreviation}
          locked={toggleTimelineModal.locked}
          deadlines={deadlines}
          openDialog={openDialog}
        />
      </>
    )
}

export default VisTimeline