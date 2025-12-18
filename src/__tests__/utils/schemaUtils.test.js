import { describe, test, expect } from 'vitest';
import schemaUtils from '../../utils/schemaUtils';

describe('schemaUtils', () => {

    describe('getAllFields', () => {
        test('should return all fields from schemaPhases', () => {
            const schemaPhases = [
                {
                    sections: [
                        {
                            name: "Section 1",
                            fields: [
                                { name: 'field1', label: 'Field 1', extra: 'extra' },
                                { name: 'field2', label: 'Field 2', other: 'other' }
                            ]
                        },
                        {
                            name: "Section 2",
                            fields: [
                                { name: 'field3', label: 'Field 3', info: 'info'}
                            ]
                        }
                    ]
                }
            ];
            const result = schemaUtils.getAllFields(schemaPhases, [], [], false);
            expect(result).toStrictEqual([
                { name: 'field1', label: 'Field 1', extra: 'extra' },
                { name: 'field2', label: 'Field 2', other: 'other' },
                { name: 'field3', label: 'Field 3', info: 'info' }
            ]);
        });

        test('should return only name and label when includeNameAndLabelOnly is true', () => {
            const schemaPhases = [
                {
                    sections: [
                        {
                            fields: [
                                { name: 'field1', label: 'Field 1', extraProp: 'extra' }
                            ]
                        }
                    ]
                }
            ];
            const result = schemaUtils.getAllFields(schemaPhases, [], [], true);
            expect(result).toEqual([{ name: 'field1', label: 'Field 1' }]);
            expect(result[0].extraProp).toBeUndefined();
        });

        test('should include nested fieldset_attributes', () => {
            const schemaPhases = [
                {
                    sections: [
                        {
                            fields: [
                                {
                                    name: 'fieldset_parent',
                                    label: 'Parent',
                                    fieldset_attributes: [
                                        { name: 'child', label: 'Child' }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ];
            const result = schemaUtils.getAllFields(schemaPhases, [], [], false);
            expect(result).toStrictEqual([
                {
                    fieldset_attributes: [ { name: 'child', label: 'Child' } ],
                    name: 'fieldset_parent', label: 'Parent'
                },
                { name: 'child', label: 'Child' }
            ]);
        });

        test('should include deadline section attributes', () => {
            const deadlineSections = [
                {
                    sections: [
                        {
                            attributes: [
                                { name: 'deadline1', label: 'Deadline 1' }
                            ]
                        },
                        {
                            attributes: [
                                { name: 'deadline2', label: 'Deadline 2' }
                            ]
                        }
                    ]
                }
            ];
            const result = schemaUtils.getAllFields([], deadlineSections, [], false);
            expect(result).toEqual([
                { name: 'deadline1', label: 'Deadline 1' },
                { name: 'deadline2', label: 'Deadline 2' }
            ]);
        });

        test('should include floor area section matrix fields', () => {
            const floorAreaSections = [
                {
                    fields: [
                        {
                            matrix: {
                                fields: [
                                    { name: 'matrix1', label: 'Matrix 1' }
                                ]
                            }
                        }
                    ]
                }
            ];
            const result = schemaUtils.getAllFields([], [], floorAreaSections, false);
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('matrix1');
        });
    });

    describe('getSelectedPhase', () => {
        test('should return selectedPhase when no phase param in location', () => {
            const result = schemaUtils.getSelectedPhase('', 5);
            expect(result).toBe(5);
        });

        test('should return phase from URL params when present', () => {
            const result = schemaUtils.getSelectedPhase('?phase=3', 5);
            expect(result).toBe(3);
        });

        test('should parse phase param as number', () => {
            const result = schemaUtils.getSelectedPhase('?phase=10', 1);
            expect(result).toBe(10);
        });
    });

    describe('getDocumentUrlField', () => {
        test('should return empty string when no attribute param', () => {
            const result = schemaUtils.getDocumentUrlField('');
            expect(result).toBe('');
        });

        test('should return attribute from URL params', () => {
            const result = schemaUtils.getDocumentUrlField('?attribute=testField');
            expect(result).toBe('testField');
        });
    });

    describe('getDocumentUrlSection', () => {
        test('should return empty string when no section param', () => {
            const result = schemaUtils.getDocumentUrlSection('');
            expect(result).toBe('');
        });

        test('should return section from URL params', () => {
            const result = schemaUtils.getDocumentUrlSection('?section=testSection');
            expect(result).toBe('testSection');
        });
    });
});