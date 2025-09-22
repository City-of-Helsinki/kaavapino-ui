import React, { useState, useRef } from 'react'
import {Button,IconAngleLeft,IconAngleRight,IconQuestionCircle} from 'hds-react'
import PropTypes from 'prop-types';
import TimelineMenuTooltip from './TimelineMenuTooltip';

function VisTimelineMenu({goToToday, moveLeft, moveRight,showYears,showMonths}) {
  const [selectedButton, setSelectedButton] = useState('showYears');
  const [showElementTooltip, setShowElementTooltip] = useState(false);

  const elementButtonRef = useRef(null);

  const handleClick = (buttonName) => {
    setSelectedButton(buttonName);
  }
  return (
    <div className="timeline-menu-container">
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
          <div className="element-menu" style={{ position: 'relative' }}>
            <Button
              ref={elementButtonRef}
              size="small"
              variant="supplementary"
              className={showElementTooltip ? 'element-tooltip-open' : ''}
              onClick={() => {
                setShowElementTooltip(v => {
                  if (v && elementButtonRef.current) {
                    setTimeout(() => elementButtonRef.current.blur(), 0);
                  }
                  return !v;
                });
              }}
            >
              <IconQuestionCircle />
            </Button>
            {showElementTooltip && (
              <TimelineMenuTooltip />
            )}
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