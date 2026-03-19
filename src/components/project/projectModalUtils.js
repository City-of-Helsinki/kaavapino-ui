const focusTrapOnTabPressed = (event, modalId) => {
    if (!(event.key === 'Tab')) return;

    const focusableElements = getFocusableElements(modalId);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
}

const getFocusableElements = (modalId) => {
    const modalElm = document.getElementById(modalId);
    if (!modalElm) return [];
    return Array.from(modalElm.querySelectorAll(
        'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])')
        ).filter(el => {
            if (el.offsetParent === null) return false;
            if (el.disabled) return false;
            if (getComputedStyle(el).visibility === 'hidden') return false;
            if (getComputedStyle(el).display === 'none') return false;
            return true;
        });
}

export { focusTrapOnTabPressed, getFocusableElements }