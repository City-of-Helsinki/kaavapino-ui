import React from 'react'
import {Button,IconArrowLeft,IconArrowRight,IconZoomIn} from 'hds-react'

function VisTimelineMenu({moveLeft, moveRight,showYers,showMonths,show6Months,show2Yers,show5Yers,show3Months}) {
  return (
    <div>
        <div className="timeline-menu">
          <div className='time-menu'>
            <Button size="small" variant="supplementary" iconLeft={<IconArrowLeft />} onClick={() => {moveLeft()}}>Vasemmalle</Button>
            {/*<Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {showWeeks()}}>Weeks</Button>
             <Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {showDays()}}>Days</Button> */}
          </div>
          <div className='zoom-menu'>
          <Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {show5Yers()}}>5 Vuotta</Button>
            <Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {show2Yers()}}>2 Vuotta</Button>
            <Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {showYers()}}>1 Vuosi</Button>
            <Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {show6Months()}}>6 kuukautta</Button>
            <Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {show3Months()}}>3 kuukautta</Button>
            <Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {showMonths()}}>Kuukausi</Button>
            {/*<Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {showWeeks()}}>Weeks</Button>
             <Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {showDays()}}>Days</Button> */}
          </div>
          <div className='move-menu'>
           {/*  <Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {zoomIn()}}>Zoom in</Button>
            <Button size="small" variant="supplementary" iconLeft={<IconZoomOut />} onClick={() => {zoomOut()}}>Zoom out</Button> */}
            <Button size="small" variant="supplementary" iconRight={<IconArrowRight />} onClick={() => {moveRight()}}>Oikealle</Button>
            {/* <Button size="small" variant="supplementary" iconLeft={<IconDrag />} id="toggleRollingMode" value="toggleRollingMode" onClick={() => {toggleRollingMode()}}>toggleRollingMode</Button> */}
          </div>
        </div>
    </div>
  )
}

export default VisTimelineMenu