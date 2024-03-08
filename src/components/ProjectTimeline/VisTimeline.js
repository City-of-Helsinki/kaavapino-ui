import React, {useRef, useEffect, ReactDOM} from 'react';
import * as vis from 'vis-timeline'
import * as visdata from 'vis-data'
import 'vis-timeline/dist/vis-timeline-graph2d.min.css'
import './VisTimeline.css'


function VisTimeline() {
/*     const onSelect = (properties) => {
      alert('selected items: ' + properties.items);
    } */

    const groupDragged = (id) => {
      console.log('onChange:', id)
    }
  

    const container = useRef(null);
    const items = new visdata.DataSet([
        {id: 1, content: 'item 1', start: new Date('2024-01-20'), end: new Date('2024-02-14'),className: "green",},
        {id: 2, content: 'item 2', start: new Date('2024-02-14'), end: new Date('2024-03-18'),className: "yellow"},
        {id: 3, content: 'item 3', start: new Date('2024-03-18'), end: new Date('2024-04-16'),className: "orange"},
        {id: 4, content: 'item 4', start: new Date('2024-04-16'), end: new Date('2024-04-25'),className: "blue"},
        {id: 5, content: 'item 5', start: new Date('2024-04-25'), end: new Date('2024-05-27'),className: "copper"},
        {id: 6, content: 'item 6', start: new Date('2024-05-27'), end: new Date('2024-08-27')}
    ])
    const options = {
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
        onMoving: function (item, callback) {
          //console.log('onMoving:', item.start,item.end,callback)
          //console.log('items',items._data)
          //item.content = prompt('onMoving:', item.content);
          if (item.content != null) {
            callback(item); // send back adjusted item
          }
          else {
            callback(null); // cancel updating the item
          }
        },
        visibleFrameTemplate: function (item, element) {
            if (!item || !element) {
              return;
            }
            if (element.className.indexOf("timeline-item-visible-frame") === -1) {
              return;
            }
            return ReactDOM.createPortal(
              ReactDOM.render(<div>
                <button
                  onClick={() => {
                    return console.log("test button clicked!");
                  }}
                >
                  Test
                </button>
              </div>, element),
              element
            );
        },
      };

    useEffect(() => {
        const timeline = container.current &&
        new vis.Timeline(container.current, items, options);
        // add event listener
        //timeline.on('select', onSelect);
        timeline.on('groupDragged', groupDragged)
/*         return () => {
          timeline.off('dragover', onDragOver)
        } */
    }, [])

    return (
        <div className='vis' ref={container}>VisTimeline</div>
    )
}

export default VisTimeline