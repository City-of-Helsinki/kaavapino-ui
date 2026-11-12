import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import FieldsetRow from '../../../components/input/FieldSet/FieldsetRow.jsx'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: key => key }) }))
vi.mock('../../../components/input/FieldSet/FieldsetField.jsx', () => ({ default: () => null }))

afterEach(cleanup)

const renderRow = (overrides = {}) => {
  const reorder = {
    enabled: true, position: 1, total: 4,
    handleProps: { draggable: true, onDragStart: vi.fn(), onDragEnd: vi.fn() },
    onMove: vi.fn(), ...overrides,
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

describe('fieldset reorder menu', () => {
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
    fireEvent.dragStart(handle)
    fireEvent.dragEnd(handle)
    fireEvent.click(handle)
    expect(reorder.handleProps.onDragStart).toHaveBeenCalledOnce()
    expect(reorder.handleProps.onDragEnd).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).toBeNull()
    fireEvent.mouseDown(handle)
    fireEvent.click(handle)
    expect(screen.getByRole('menu')).toBeTruthy()
    fireEvent.dragStart(handle)
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
    fireEvent.mouseDown(document.body)
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