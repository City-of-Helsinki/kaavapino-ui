import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import FieldsetRow from '../../../components/input/FieldSet/FieldsetRow.jsx'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: key => key }) }))
vi.mock('../../../components/input/FieldSet/FieldsetField.jsx', () => ({ default: () => null }))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const renderRow = (overrides = {}) => {
  const reorder = {
    enabled: true, position: 1, total: 4,
    onMove: vi.fn(), onDragStart: vi.fn(), onDragEnd: vi.fn(), ...overrides,
  }
  const props = {
    set: 'rows[1]', i: 1, sets: [{}, {}, {}, {}], name: 'rows', fields: [],
    formName: 'project', formValues: { rows: [{}, {}, {}, {}] }, formErrors: [],
    attributeData: {}, expanded: [], disabled: true, reorder,
    handleSave: vi.fn(), handleLockField: vi.fn(), handleUnlockField: vi.fn(),
    onRadioChange: vi.fn(), onChildBlurSave: vi.fn(), onCheckLocked: vi.fn(), onHide: vi.fn(),
  }
  const view = render(<FieldsetRow {...props} />)
  const handle = screen.getByRole('button', { name: 'project.fieldset-reorder-handle' })
  return { ...view, reorder, handle, props }
}

const dragStart = (handle) => {
  const dataTransfer = { setData: vi.fn(), setDragImage: vi.fn() }
  fireEvent.dragStart(handle, { dataTransfer })
  return dataTransfer
}

describe('fieldset reorder menu', () => {
  test.each([[1, 'needs-rows'], [4, 'unavailable']])('explains why the handle is disabled with %s rows', (total, message) => {
    const { handle } = renderRow({ enabled: false, total })
    expect(screen.queryByRole('tooltip')).toBeNull()
    fireEvent.mouseEnter(handle.closest('.fieldset-reorder-control'))
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip.textContent).toBe(`project.fieldset-reorder-${message}`)
    expect(handle.getAttribute('aria-describedby')).toBe(tooltip.id)
    fireEvent.mouseLeave(handle.closest('.fieldset-reorder-control'))
    expect(screen.queryByRole('tooltip')).toBeNull()
    fireEvent.focus(handle)
    expect(screen.getByRole('tooltip')).toBeTruthy()
    fireEvent.keyDown(handle, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  test('does not show a disabled tooltip on an enabled handle', () => {
    const { handle } = renderRow()
    fireEvent.mouseEnter(handle.closest('.fieldset-reorder-control'))
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  test.each([false, true])('drag image is the header without its chevron for one frame when expanded is %s', (expanded) => {
    const frame = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1)
    const { handle, reorder, props, rerender } = renderRow()
    rerender(<FieldsetRow {...props} expanded={expanded ? [1] : []} />)
    const header = handle.closest('.fieldset-row-header').querySelector(':scope > button')
    const chevron = header.querySelector(':scope > svg')
    const dataTransfer = dragStart(handle)
    expect(dataTransfer.setDragImage).toHaveBeenCalledWith(header, 0, 0)
    expect(header.querySelector('.fieldset-reorder-control')).toBeNull()
    expect(chevron.style.visibility).toBe('hidden')
    frame.mock.calls[0][0]()
    expect(chevron.style.visibility).toBe('')
    expect(reorder.onDragStart).toHaveBeenCalledOnce()
  })

  test('arrow keys on the handle move the row by one', () => {
    const { handle, reorder } = renderRow()
    fireEvent.keyDown(handle, { key: 'ArrowUp' })
    fireEvent.keyDown(handle, { key: 'ArrowDown' })
    expect(reorder.onMove.mock.calls).toEqual([[0], [2]])
  })

  test.each([['top', 0], ['up', 1], ['down', 3], ['bottom', 4]])('moves %s through the shared callback', (action, position) => {
    const { handle, reorder } = renderRow({ position: 2, total: 5 })
    fireEvent.click(handle)
    fireEvent.click(screen.getByRole('menuitem', { name: `project.fieldset-reorder-${action}` }))
    expect(reorder.onMove).toHaveBeenCalledWith(position)
    expect(screen.queryByRole('menu')).toBeNull()
    expect(document.activeElement).toBe(handle)
  })

  test.each([[0, ['top', 'up']], [3, ['down', 'bottom']]])('disables unavailable actions at position %s', (position, actions) => {
    const { handle } = renderRow({ position })
    fireEvent.click(handle)
    actions.forEach(action => {
      expect(screen.getByRole('menuitem', { name: `project.fieldset-reorder-${action}` }).disabled).toBe(true)
    })
    expect(document.activeElement.disabled).toBe(false)
  })

  test('does not open after dragging, but opens on the next fresh click', () => {
    const { handle, reorder } = renderRow()
    fireEvent.mouseDown(handle)
    dragStart(handle)
    fireEvent.dragEnd(handle)
    fireEvent.click(handle)
    expect(reorder.onDragStart).toHaveBeenCalledOnce()
    expect(reorder.onDragEnd).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).toBeNull()
    fireEvent.mouseDown(handle)
    fireEvent.click(handle)
    expect(screen.getByRole('menu')).toBeTruthy()
    dragStart(handle)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  test('supports keyboard navigation, Escape, toggling, and outside dismissal', () => {
    const { handle } = renderRow({ position: 0 })
    fireEvent.click(handle)
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'project.fieldset-reorder-down' }))
    fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'project.fieldset-reorder-bottom' }))
    fireEvent.keyDown(document.activeElement, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
    expect(document.activeElement).toBe(handle)
    fireEvent.click(handle)
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('menu')).toBeNull()
    fireEvent.click(handle)
    fireEvent.click(handle)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  test('cannot open when reordering is disabled and closes if it becomes disabled', () => {
    const { handle, props, rerender } = renderRow({ enabled: false })
    fireEvent.click(handle)
    expect(screen.queryByRole('menu')).toBeNull()
    rerender(<FieldsetRow {...props} reorder={{ ...props.reorder, enabled: true }} />)
    fireEvent.click(handle)
    expect(screen.getByRole('menu')).toBeTruthy()
    rerender(<FieldsetRow {...props} />)
    expect(screen.queryByRole('menu')).toBeNull()
  })
})