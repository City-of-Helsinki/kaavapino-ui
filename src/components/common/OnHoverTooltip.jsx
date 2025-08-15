import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { IconClock } from 'hds-react';

const OnHoverTooltip = ({ tooltipContent }) => {
  const [visible, setVisible] = useState(false);
  const iconRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (visible && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY - 40,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    }
  }, [visible]);

  return (
    <>
      <span
        ref={iconRef}
        className="tooltip-clock-wrapper"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        <IconClock aria-hidden="true" />
      </span>

      {visible &&
        ReactDOM.createPortal(
          <div
            className="tooltip-content"
            style={{
              position: 'absolute',
              top: coords.top,
              left: coords.left,
              transform: 'translateX(-50%)',
            }}
          >
            {tooltipContent}
            <div className="tooltip-arrow" />
          </div>,
          document.body
        )}
    </>
  );
};

export default OnHoverTooltip;
