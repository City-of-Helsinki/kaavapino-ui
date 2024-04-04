import React, {useRef, useEffect, useState} from 'react';
import { createRoot } from 'react-dom/client'
import Moment from 'moment'
import {extendMoment} from 'moment-range'
import VisTimelineMenu from './VisTimelineMenu'
import * as vis from 'vis-timeline'
import * as visdata from 'vis-data'
import 'vis-timeline/dist/vis-timeline-graph2d.min.css'
import './VisTimeline.css'

 const createRootForTimelineItem = (
  item,
  element,
  data
) => {
  if (!element.hasAttribute('data-is-rendered')) {
    element.setAttribute('data-is-rendered', 'true');
    const root = createRoot(element);
    root.render(React.createElement(<button>test</button>, { item, data }));
    element.timelineItemRoot = root;
  } else {
    element.timelineItemRoot.render(React.createElement(<button>test</button>, { item, data }));
  }
  return '';
};

function VisTimeline({deadlines}) {
    const moment = extendMoment(Moment);
    const container = useRef(null);
    const [timeline, setTimeline] = useState(false);
    //const [items, setItems] = useState([]);
    //console.log(deadlines)
    /*const [options, setOptions] = useState({}); */

/*     const onSelect = (properties) => {
      alert('selected items: ' + properties.items);
    }  */

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
      console.log("changeItemRange")
      let timeData = i
      if(!subtract){
        let originalDiff = moment.duration(moment(timeData.end).diff(moment(timeData.start)))
        let originalTimeFrame = originalDiff.asDays()
        //console.log(originalTimeFrame)
        timeData.start = item.end
        timeData.end = moment(timeData.start).add(originalTimeFrame, 'days').toDate()
      }
      else{
        timeData.end = item.start
      }
    //  console.log(timeData)
    //  console.log(timeline)
      //timeline.itemsData.update(timeData);
      timeline.itemSet.items[i.id].setData(timeData)
      timeline.itemSet.items[i.id].repositionX()
    }

    useEffect(() => {
      console.log(deadlines)
      const phaseData = []
      let startDate = false
      let endDate = false
      let numberOfPhases = 1
      let name = ''
      let color = ""
      
      for (let i = 0; i < deadlines.length; i++) {
        if(deadlines[i].deadline.deadline_types[0] === 'phase_start'){
          startDate = deadlines[i].date
          name = deadlines[i].deadline.phase_name
          color = deadlines[i].deadline.phase_color
          //.setHours(23,59,59,0)
        }
        else if(deadlines[i].deadline.deadline_types[0] === 'phase_end' && deadlines[i].deadline.date_type !== "Arkipäivät"){
          console.log(deadlines[i].deadline)
          endDate = deadlines[i].date
          //new Date .setHours(0,0,0,0)
        }

        if(startDate && endDate){
          console.log(startDate,endDate)
          phaseData.push({
            id: numberOfPhases,
            content: name,
            start:startDate,
            end:endDate,
            className:color
          })
          startDate = false
          endDate = false
          numberOfPhases++
        }
      }
      console.log(phaseData)
      const items = new visdata.DataSet(phaseData)
   
      const options = {
          selectable: false,
          stack: false,
          multiselect: true,
          width: '100%',
          height: '250px',
          margin: {
            item: 20
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
          moveable:true,
          zoomable:true,
          zoomMin: 1000 * 60 * 60 * 24, // one day in milliseconds
          zoomMax: 31556952000, // 1000 * 60 * 60 * 24 * 365.25 one year in milliseconds
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
          // always snap to full hours, independent of the scale
          snap: function (date) {
            var hour = 60 * 60 * 1000;
            return Math.round(date / hour) * hour;
          },
          onMove(item, callback) {
            const movingTimetableItem = moment.range(item.start, item.end);
            items.forEach(i => {
              if (i.id !== item.id) {
                const statickTimetables = moment.range(i.start, i.end);
                if (movingTimetableItem.overlaps(statickTimetables)) {
                 // console.log('overlaps',i.id)
                 // console.log(timeline)
                  changeItemRange(item.start > i.start, item, i, timeline)
                }
              }
            })
            if (item.content != null) {
              callback(item); // send back adjusted item
            }
            else {
              callback(null); // cancel updating the item
            }
          },
          template: (item, element, data) => {
            if (!item?.id || !data?.id) return null;
 
            if (!createRootForTimelineItem[item?.id]) {
              // If not, create a new root and store it
              createRootForTimelineItem[item?.id] = createRoot(element);
            }
 
            // eslint-disable-next-line react/jsx-props-no-spreading
            createRootForTimelineItem[item?.id].render(
                <button 
                  onClick={() => {
                    return console.log("aaaaaa");
                  }}
                >
                  Test
                </button>
            );
 
            return '';
          },
      };
      let timeline = container.current &&
      new vis.Timeline(container.current, items, options)
      setTimeline(timeline)
      // add event listener
      //timeline.on('select', onSelect);
      return () => {
        //timeline.off('select', onSelect);
      }
    }, [])

/*     useEffect(() => {
      if (deadlines) {
        setItems(items);
      }
    }, [deadlines]) */
    //console.log(timeline)
    return (
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
    )
}

export default VisTimeline