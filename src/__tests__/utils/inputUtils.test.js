import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import inputUtils from '../../utils/inputUtils'
import projectUtils from '../../utils/projectUtils'
import timeUtil from '../../utils/timeUtil'

vi.mock('../../utils/projectUtils', () => ({
    default: {
        formatDate: vi.fn((timestamp) => '2023-01-15'),
        formatTime: vi.fn((timestamp) => '14:30')
    }
}))

vi.mock('../../utils/timeUtil', () => ({
    default: {
        formatRelativeDate: vi.fn((timestamp, t) => '2 days ago')
    }
}))

describe('inputUtils', () => {
    describe('hasError', () => {
        it('should return false when error is null', () => {
            expect(inputUtils.hasError(null)).toBe(false)
        })

        it('should return false when error is empty array', () => {
            expect(inputUtils.hasError([])).toBe(false)
        })

        it('should return true when error has items', () => {
            expect(inputUtils.hasError(['error message'])).toBe(true)
        })

        it('should return true when error has multiple items', () => {
            expect(inputUtils.hasError(['error1', 'error2'])).toBe(true)
        })
    })

    describe('renderUpdatedFieldInfo', () => {

        it('should render loading spinner for exact field match', () => {
            const { container } = render(
                inputUtils.renderUpdatedFieldInfo({
                    savingField: 'fieldName',
                    fieldName: 'fieldName',
                    updated: null,
                })
            )
            expect(container.querySelector('.loading-spinner')).toBeTruthy()
        })

        it('should render tooltip with updated info when not saving', () => {
            const updated = {
                timestamp: '2023-01-15T14:30:00Z',
                user_name: 'John Doe'
            }
            const { container } = render(
                inputUtils.renderUpdatedFieldInfo({
                    savingField: null,
                    fieldName: 'fieldName',
                    updated,
                })
            )
            expect(container.querySelector('.loading-spinner')).toBeFalsy()
            expect(container.querySelector('.input-history-tooltip')).toBeFalsy()

            // Click tooltip to reveal content
            const tooltipButton = container.querySelector('button')
            expect(tooltipButton).toBeTruthy()
            fireEvent.click(tooltipButton)
            
            expect(document.querySelector('.input-history-tooltip')).toBeTruthy()
            expect(document.querySelector('.input-history-title')).toBeTruthy()
            expect(document.querySelector('.input-history-details')).toBeTruthy()
            expect(projectUtils.formatDate).toHaveBeenCalledWith('2023-01-15T14:30:00Z')
            expect(projectUtils.formatTime).toHaveBeenCalledWith('2023-01-15T14:30:00Z')
        })

        it('should render spinner for fieldset when savingField matches fieldset field', () => {
            const { container } = render(
                inputUtils.renderUpdatedFieldInfo({
                    savingField: 'field1',
                    fieldName: 'myFieldset',
                    updated: null,
                    t: undefined,
                    isFieldset: true,
                    fieldsetFields: [{ name: 'field1' }, { name: 'field2' }]
                })
            )
            expect(container.querySelector('.loading-spinner')).toBeTruthy()
        })

        it('should not render spinner for fieldset when savingField does not match', () => {
            const { container } = render(
                inputUtils.renderUpdatedFieldInfo({
                    savingField: 'field3',
                    fieldName: 'myFieldset',
                    updated: { timestamp: '2023-01-15T14:30:00Z', user_name: 'John' },
                    t: undefined,
                    isFieldset: true,
                    fieldsetFields: [{ name: 'field1' }, { name: 'field2' }]
                })
            )
            expect(container.querySelector('.loading-spinner')).toBeFalsy()
        })

        it('should render spinner for fieldset container when savingField includes prefix', () => {
            const { container } = render(
                inputUtils.renderUpdatedFieldInfo({
                    savingField: 'myPrefix_field1',
                    fieldName: 'myPrefix_fieldset',
                    updated: null,
                    t: undefined
                })
            )
            expect(container.querySelector('.loading-spinner')).toBeTruthy()
        })
    })

    describe('renderTimeContainer', () => {
        const mockT = vi.fn((key) => key)

        it('should render time container with formatted time', () => {
            const updated = {
                timestamp: '2023-01-15T14:30:00Z'
            }
            const { container } = render(
                inputUtils.renderTimeContainer({ updated, t: mockT })
            )
            expect(container.querySelector('.time-container')).toBeTruthy()
            expect(timeUtil.formatRelativeDate).toHaveBeenCalledWith('2023-01-15T14:30:00Z', mockT)
            expect(projectUtils.formatTime).toHaveBeenCalledWith('2023-01-15T14:30:00Z')
        })

        it('should return null when updated is null', () => {
            const result = inputUtils.renderTimeContainer({ updated: null, t: mockT })
            expect(result).toBeNull()
        })

        it('should return null when timestamp is missing', () => {
            const result = inputUtils.renderTimeContainer({ updated: {}, t: mockT })
            expect(result).toBeNull()
        })
    })
})