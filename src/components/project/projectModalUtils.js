const focusTrapOnTabPressed = (event, modalId) => {
    if (!(event.key === 'Tab')) return;
    const modalElm = document.getElementById(modalId);
    if (!modalElm) return;
    const focusableElements = modalElm.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
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

export { focusTrapOnTabPressed }