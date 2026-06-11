import { useEffect } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  '[tabindex]:not([tabindex="-1"])'
].join(', ')

const isTabbable = el =>
  !el.hasAttribute('disabled') &&
  el.tabIndex !== -1 &&
  el.offsetParent !== null

const getTabbables = (root = document) =>
  Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter(isTabbable)

/* Custom hook for managing keyboard navigation in and out of toasts */
const useToastKeyboardNav = (triggerId, closeButtonId) => {
  useEffect(() => {
    if (!triggerId || !closeButtonId) {
      return undefined
    }

    const handleKeyDown = event => {
      if (event.key !== 'Tab') {
        return
      }

      const trigger = document.getElementById(triggerId)
      const closeBtn = document.getElementById(closeButtonId)
      if (!trigger || !closeBtn) {
        return
      }

      const toastRoot = closeBtn.closest('.Toastify__toast') || closeBtn.parentElement
      if (!toastRoot) {
        return
      }

      const active = document.activeElement
      const focusInToast = toastRoot.contains(active)

      const redirect = target => {
        if (!target) {
          return
        }
        event.preventDefault()
        event.stopPropagation()
        target.focus()
      }

      if (event.shiftKey) {
        if (focusInToast) {
          redirect(trigger)
          return
        }
        const tabbables = getTabbables()
        const triggerIdx = tabbables.indexOf(trigger)
        if (triggerIdx === -1) {
          return
        }
        const nextAfterTrigger = tabbables.find(
          (el, i) => i > triggerIdx && !toastRoot.contains(el)
        )
        if (active === nextAfterTrigger) {
          redirect(closeBtn)
        }
        return
      }

      if (active === trigger) {
        redirect(closeBtn)
        return
      }

      if (focusInToast) {
        const tabbables = getTabbables()
        const triggerIdx = tabbables.indexOf(trigger)
        if (triggerIdx === -1) {
          return
        }
        const nextAfterTrigger = tabbables.find(
          (el, i) => i > triggerIdx && !toastRoot.contains(el)
        )
        redirect(nextAfterTrigger)
      }
    }

    globalThis.addEventListener('keydown', handleKeyDown)
    return () => globalThis.removeEventListener('keydown', handleKeyDown)
  }, [triggerId, closeButtonId])
}

export default useToastKeyboardNav
