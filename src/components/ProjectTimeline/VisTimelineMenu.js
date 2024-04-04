import React from 'react'
import {Button,IconArrowLeft,IconArrowRight,IconZoomIn,IconZoomOut} from 'hds-react'

function VisTimelineMenu({zoomIn, zoomOut, moveLeft, moveRight,showYers,showMonths,showWeeks,showDays}) {
  return (
    <div>
        <div className="timeline-menu">
          <div className='time-menu'>
            <Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {showYers()}}>Years</Button>
            <Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {showMonths()}}>Months</Button>
            <Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {showWeeks()}}>Weeks</Button>
            <Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {showDays()}}>Days</Button>
          </div>
          <div className='move-menu'>
            <Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {zoomIn()}}>Zoom in</Button>
            <Button size="small" variant="supplementary" iconLeft={<IconZoomOut />} onClick={() => {zoomOut()}}>Zoom out</Button>
            <Button size="small" variant="supplementary" iconLeft={<IconArrowLeft />} onClick={() => {moveLeft()}}>Move left</Button>
            <Button size="small" variant="supplementary" iconLeft={<IconArrowRight />} onClick={() => {moveRight()}}>Move right</Button>
            {/* <Button size="small" variant="supplementary" iconLeft={<IconDrag />} id="toggleRollingMode" value="toggleRollingMode" onClick={() => {toggleRollingMode()}}>toggleRollingMode</Button> */}
          </div>
        </div>
    </div>
  )
}

export default VisTimelineMenu