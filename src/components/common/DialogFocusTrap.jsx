import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

function getFocusableElements(container) {
    if (!container) return [];
    return Array.from(
        container.querySelectorAll(
            'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]'
        )
    ).filter(el => el.offsetParent !== null);
}


// This component may be replaced by HDS Dialog when updated to a newer version.
const DialogFocusTrap = ({ children, returnFocusRef }) => {
    const trapRef = useRef(null);
    const previouslyFocusedElement = useRef(null);

    useEffect(() => {
        previouslyFocusedElement.current = document.activeElement;

        const focusableEls = getFocusableElements(trapRef.current);
        if (focusableEls.length > 0) {
            focusableEls[0].focus();
        }

        function handleKeyDown(e) {
            if (e.key !== 'Tab') return;
            const focusableEls = getFocusableElements(trapRef.current);
            if (focusableEls.length === 0) return;

            const firstEl = focusableEls[0];
            const lastEl = focusableEls.at(-1);

            if (!e.shiftKey && document.activeElement === lastEl) {
                e.preventDefault();
                firstEl.focus();
            } else if (e.shiftKey && document.activeElement === firstEl) {
                e.preventDefault();
                lastEl.focus();
            }
        }

        const node = trapRef.current;
        node?.addEventListener('keydown', handleKeyDown);

        return () => {
            node?.removeEventListener('keydown', handleKeyDown);
            if (returnFocusRef?.current) {
                returnFocusRef.current.focus();
            } else if (previouslyFocusedElement.current) {
                previouslyFocusedElement.current.focus();
            }
        };
    }, []);

    return (
        <div ref={trapRef} tabIndex={-1}>
            {children}
        </div>
    );
};

DialogFocusTrap.propTypes = {
    children: PropTypes.node,
    returnFocusRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
};

export default DialogFocusTrap;