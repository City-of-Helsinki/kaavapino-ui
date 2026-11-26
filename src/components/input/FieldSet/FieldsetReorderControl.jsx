import React, { useEffect, useId, useRef, useState } from 'react'
import { IconDrag, IconPlus } from 'hds-react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

// Creates a "ghost" for fieldset row being dragged
const setHeaderDragImage = (handle, dataTransfer) => {
  const header = handle.closest('.fieldset-row-header').querySelector(':scope > button')
  header.classList.add('fieldset-drag-image')
  dataTransfer.setDragImage(header, 0, 0)
  requestAnimationFrame(() => header.classList.remove('fieldset-drag-image'))
}

const FieldsetReorderControl = ({ enabled, position, total, onMove, onDragStart, onDragEnd, rowTitle }) => {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const controlRef = useRef(null)
  const handleRef = useRef(null)
  // Set on dragstart so the click that may follow a drag doesn't open the menu
  const dragged = useRef(false)
  const menuId = useId()
  const tooltipId = `${menuId}-tooltip`
  const showMenu = menuOpen && enabled
  const showTooltip = tooltipVisible && !enabled
  const atTop = position === 0
  const atBottom = position === total - 1

  const closeMenu = (restoreFocus = false) => {
    setMenuOpen(false)
    if (restoreFocus) handleRef.current?.focus()
  }

  useEffect(() => {
    if (!enabled) setMenuOpen(false)
  }, [enabled])

  useEffect(() => {
    if (!showMenu) return
    controlRef.current.querySelector('[role="menuitem"]:not(:disabled)')?.focus()
    const handleOutside = (event) => {
      if (!controlRef.current?.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  }, [showMenu])

  const handleDragStart = (event) => {
    dragged.current = true
    closeMenu()
    setTooltipVisible(false)
    event.dataTransfer.effectAllowed = 'move'
    // Custom type so that the drag payload is never inserted into text inputs
    event.dataTransfer.setData('application/x-kaavapino-fieldset-row', String(position))
    setHeaderDragImage(event.currentTarget, event.dataTransfer)
    onDragStart()
  }

  const handleKeyDown = (event) => {
    const delta = { ArrowUp: -1, ArrowDown: 1 }[event.key]
    if (delta) {
      event.preventDefault()
      onMove(position + delta)
    } else if (event.key === 'Escape') {
      setTooltipVisible(false)
    } else if (event.key === 'Enter' || event.key === ' ') {
      dragged.current = false
    }
  }

  const handleMenuKeyDown = (event) => {
    const items = [...controlRef.current.querySelectorAll('[role="menuitem"]:not(:disabled)')]
    const current = items.indexOf(document.activeElement)
    const next = { ArrowDown: current + 1, ArrowUp: current - 1, Home: 0, End: items.length - 1 }[event.key]
    if (next !== undefined) {
      event.preventDefault()
      items[(next + items.length) % items.length].focus()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      closeMenu(true)
    } else if (event.key === 'Tab') {
      closeMenu(true)
    }
  }

  const actions = [
    ['top', 0, atTop],
    ['up', position - 1, atTop],
    ['down', position + 1, atBottom],
    ['bottom', total - 1, atBottom],
  ]

  return (
    <div className='fieldset-reorder-control' ref={controlRef}
      onMouseEnter={() => setTooltipVisible(true)} onMouseLeave={() => setTooltipVisible(false)}>
      <button
        ref={handleRef}
        type="button"
        className='fieldset-drag-handle'
        draggable={enabled}
        aria-disabled={!enabled}
        tabIndex={enabled ? 0 : -1}
        aria-haspopup="menu"
        aria-expanded={showMenu}
        aria-controls={showMenu ? menuId : undefined}
        aria-describedby={showTooltip ? tooltipId : undefined}
        aria-label={t('project.fieldset-reorder-handle', { title: rowTitle })}
        title={enabled ? t('project.fieldset-reorder-handle-title') : undefined}
        onFocus={() => setTooltipVisible(true)}
        onBlur={() => setTooltipVisible(false)}
        onMouseDown={() => { dragged.current = false }}
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onClick={() => { if (enabled && !dragged.current) setMenuOpen(open => !open) }}
        onKeyDown={handleKeyDown}
      >
        <IconDrag size='s' aria-hidden="true" />
      </button>
      {showTooltip && total < 2 &&(
        <div className='fieldset-reorder-tooltip' id={tooltipId} role="tooltip">
          {t('project.fieldset-reorder-needs-rows')}
        </div>
      )}
      {showMenu && (
        <div className='fieldset-reorder-menu' id={menuId} role="menu" tabIndex={-1}
          aria-label={t('project.fieldset-reorder-handle-title')} onKeyDown={handleMenuKeyDown}>
          {actions.map(([action, toPosition, unavailable]) => (
            <button key={action} type="button" role="menuitem" tabIndex={-1} disabled={unavailable}
              onClick={() => { closeMenu(true); onMove(toPosition) }}>
              <IconPlus size='s' aria-hidden="true" />
              {t(`project.fieldset-reorder-${action}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

FieldsetReorderControl.propTypes = {
  enabled: PropTypes.bool.isRequired,
  position: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onMove: PropTypes.func.isRequired,
  onDragStart: PropTypes.func.isRequired,
  onDragEnd: PropTypes.func.isRequired,
}

export default FieldsetReorderControl
