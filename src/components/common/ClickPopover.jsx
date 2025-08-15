import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

const ClickPopover = ({ trigger, content, offsetY = 0, offsetX = 0 }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  //Position popover when opened
  useEffect(() => {
    if (!open || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
        top: rect.top + window.scrollY - offsetY,
        left: rect.left + window.scrollX + rect.width / 2 + offsetX,
    });
  }, [open, offsetX, offsetY]);

  //Close on click-outside or Esc
  useEffect(() => {
    if (!open) return;

    const close = (e) => {
      if (
        e.key === 'Escape' ||
        (e.type === 'mousedown' &&
          !triggerRef.current?.contains(e.target) &&
          !document.getElementById('__popover__')?.contains(e.target))
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <>
      <g
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        style={{ cursor: 'pointer' }}
      >
        {trigger}
      </g>

      {open &&
        ReactDOM.createPortal(
          <div
            id="__popover__"
            className="popover-container"
            style={{
              position: 'absolute',
              top: coords.top,
              left: coords.left,
              transform: 'translateX(-50%)',
              zIndex: 10000,
            }}
          >
            <div className="popover-content">{content}</div>
            <div className="popover-arrow" />
          </div>,
          document.body
        )}
    </>
  );
};

export default ClickPopover;