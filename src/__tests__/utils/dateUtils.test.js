import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useValidateDate } from '../../utils/dateUtils';
import * as projectActions from '../../actions/projectActions';

vi.mock('../../actions/projectActions');

const createMockStore = () => ({
    getState: vi.fn(() => ({})),
    dispatch: vi.fn(),
    subscribe: vi.fn(),
});

describe('useValidateDate', () => {
    let mockStore;
    let mockSetWarning;

    beforeEach(() => {
        mockStore = createMockStore();
        mockSetWarning = vi.fn();
        vi.clearAllMocks();
    });

    const wrapper = ({ children }) => (
        <Provider store={mockStore}>{children}</Provider>
    );

    it('should return a validateDate function', () => {
        const { result } = renderHook(() => useValidateDate(), { wrapper });
        expect(typeof result.current).toBe('function');
    });

    it('should resolve with suggested date when validation fails', async () => {
        const mockResponse = {
            error_reason: 'Date conflicts with another deadline',
            suggested_date: '2024-02-01',
            conflicting_deadline: 'test_deadline',
        };

        vi.mocked(projectActions.validateDateAction).mockImplementation((field, projectName, date, callback) => {
            callback(mockResponse);
            return { type: 'VALIDATE_DATE' };
        });

        const { result } = renderHook(() => useValidateDate(), { wrapper });
        const validateDate = result.current;

        const returnedDate = await validateDate('test_deadline', 'Project A', '2024-01-20', mockSetWarning);

        expect(returnedDate).toBe('2024-02-01');
        expect(mockSetWarning).toHaveBeenCalledWith({
            warning: true,
            response: {
                reason: 'Date conflicts with another deadline',
                suggested_date: '2024-02-01',
                conflicting_deadline: 'test_deadline',
            },
        });
    });

    it('should resolve with original date when validation succeeds', async () => {
        const mockResponse = {
            error_reason: null,
            date: '2024-01-20',
        };

        vi.mocked(projectActions.validateDateAction).mockImplementation((field, projectName, date, callback) => {
            callback(mockResponse);
            return { type: 'VALIDATE_DATE' };
        });

        const { result } = renderHook(() => useValidateDate(), { wrapper });
        const validateDate = result.current;

        const returnedDate = await validateDate('field1', 'Project A', '2024-01-20', mockSetWarning);

        expect(returnedDate).toBe('2024-01-20');
        expect(mockSetWarning).toHaveBeenCalledWith({
            warning: false,
            response: {
                reason: '',
                suggested_date: '',
                conflicting_deadline: '',
            },
        });
    });

    it('should reject when validateDateAction returns no response', async () => {
        vi.mocked(projectActions.validateDateAction).mockImplementation((field, projectName, date, callback) => {
            callback(null);
            return { type: 'VALIDATE_DATE' };
        });

        const { result } = renderHook(() => useValidateDate(), { wrapper });
        const validateDate = result.current;

        await expect(validateDate('field1', 'Project A', '2024-01-20', mockSetWarning)).rejects.toThrow('validateDateAction call error');
    });

    it('should work without setWarning callback', async () => {
        const mockResponse = {
            error_reason: 'Some error',
            suggested_date: '2024-02-01',
            conflicting_deadline: 'test_deadline',
        };

        vi.mocked(projectActions.validateDateAction).mockImplementation((field, projectName, date, callback) => {
            callback(mockResponse);
            return { type: 'VALIDATE_DATE' };
        });

        const { result } = renderHook(() => useValidateDate(), { wrapper });
        const validateDate = result.current;

        const returnedDate = await validateDate('field1', 'Project A', '2024-01-20');

        expect(returnedDate).toBe('2024-02-01');
    });

    it('should dispatch validateDateAction with correct parameters', async () => {
        const mockResponse = {
            error_reason: null,
            date: '2024-01-20',
        };

        vi.mocked(projectActions.validateDateAction).mockImplementation((field, projectName, date, callback) => {
            callback(mockResponse);
            return { type: 'VALIDATE_DATE' };
        });

        const { result } = renderHook(() => useValidateDate(), { wrapper });
        const validateDate = result.current;

        await validateDate('deadline_field', 'My Project', '2024-01-20', mockSetWarning);

        expect(projectActions.validateDateAction).toHaveBeenCalledWith(
            'deadline_field',
            'My Project',
            '2024-01-20',
            expect.any(Function)
        );
    });
});