import React, { useState } from 'react'
import {Button,IconAngleLeft,IconAngleRight} from 'hds-react'
import PropTypes from 'prop-types';

function VisTimelineMenu({goToToday, moveLeft, moveRight,showYears,showMonths}) {
  const [selectedButton, setSelectedButton] = useState(null);

  const handleClick = (buttonName) => {
    setSelectedButton(buttonName);
  }
  return (
    <div>
        <div className="timeline-menu">
          <div className='time-menu'>
            <Button size="small" variant="secondary" onClick={() => {moveLeft()}}><IconAngleLeft /></Button>
            <Button size="small" variant="secondary" onClick={() => {moveRight()}}><IconAngleRight /></Button>
            {/*<Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {showWeeks()}}>Weeks</Button>
             <Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {showDays()}}>Days</Button> 
             <Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {zoomIn()}}>Zoom in</Button>
             <Button size="small" variant="supplementary" iconLeft={<IconZoomOut />} onClick={() => {zoomOut()}}>Zoom out</Button> 
             <Button size="small" variant="supplementary" iconLeft={<IconDrag />} id="toggleRollingMode" value="toggleRollingMode" onClick={() => {toggleRollingMode()}}>toggleRollingMode</Button>
             */}
          </div>
          <div className='today-menu'>
            <Button size="small" variant="secondary" onClick={() => {goToToday()}}>Tänään</Button>
          </div>
          <div className='zoom-menu'>
            <Button size="small" variant="secondary" className={selectedButton === 'showMonths' ? 'selected' : ''}  onClick={() => {showMonths(); handleClick('showMonths');}}>1 kuukausi</Button>
            <Button size="small" variant="secondary" className={selectedButton === 'showYears' ? 'selected' : ''}  onClick={() => {showYears(); handleClick('showYears');}}>1 vuosi</Button>
             {/*<Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {show5Yers()}}>5 Vuotta</Button>
            <Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {show2Yers()}}>2 Vuotta</Button>
            <Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {show6Months()}}>6 kuukautta</Button>
            <Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {show3Months()}}>3 kuukautta</Button>
            <Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {showWeeks()}}>Weeks</Button>
            <Button size="small" variant="supplementary" iconLeft={<IconZoomIn />} onClick={() => {showDays()}}>Days</Button> */}
          </div>
        </div>
    </div>
  )
}

VisTimelineMenu.propTypes = {
  goToToday: PropTypes.func,
  moveLeft: PropTypes.func,
  moveRight: PropTypes.func,
  showYears: PropTypes.func,
  showMonths: PropTypes.func
};

export default VisTimelineMenu