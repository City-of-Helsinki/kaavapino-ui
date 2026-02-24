import { describe, it, expect } from 'vitest';
import errorUtil from '../../utils/errorUtil';

describe('errorUtil', () => {
    describe('getErrorMessage', () => {
        it('should return empty string for empty object', () => {
            const result = errorUtil.getErrorMessage({});
            expect(result).toBe('');
        });

        it('should format simple string values', () => {
            const data = { field1: 'Error message' };
            const result = errorUtil.getErrorMessage(data);
            expect(result).toBe('field1: Error message\n');
        });

        it('should format array values with default format', () => {
            const data = { field1: ['Error 1', 'Error 2'] };
            const result = errorUtil.getErrorMessage(data);
            expect(result).toBe('field1: Error 1 Error 2\n');
        });

        it('should extract date from array with date format', () => {
            const data = { field1: ['Ensimmäinen mahdollinen päivä on 2024-01-15'] };
            const result = errorUtil.getErrorMessage(data, 'date');
            expect(result).toBe('field1: 2024-01-15\n');
        });

        it('should handle multiple fields', () => {
            const data = {
                field1: 'Error 1',
                field2: ['Error 2', 'Error 3']
            };
            const result = errorUtil.getErrorMessage(data);
            expect(result).toBe('field1: Error 1\nfield2: Error 2 Error 3\n');
        });

        it('should replace field names with readable names', () => {
            const data = { ehdotusvaihe_alkaa_pvm: 'Error message' };
            const result = errorUtil.getErrorMessage(data);
            expect(result).toBe('Ehdotusvaihe alkaa: Error message\n');
        });

        it('should handle date format without matching message', () => {
            const data = { field1: ['Some other error'] };
            const result = errorUtil.getErrorMessage(data, 'date');
            expect(result).toBe('');
        });

        it('should handle empty array', () => {
            const data = { field1: [] };
            const result = errorUtil.getErrorMessage(data);
            expect(result).toBe('field1: \n');
        });

        it('should preserve field names not in replacement map', () => {
            const data = { custom_field: 'Error message' };
            const result = errorUtil.getErrorMessage(data);
            expect(result).toBe('custom_field: Error message\n');
        });
    });
});