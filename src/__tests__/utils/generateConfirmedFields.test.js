import { describe, test, expect} from 'vitest';
import { confirmationAttributeNames } from '../../utils/constants';
import { generateConfirmedFields } from "../../utils/generateConfirmedFields";
import { test_attribute_data_XL } from './test_attribute_data';

const phaseNames = [
    'periaatteet',
    'oas',
    'luonnos',
    'ehdotus',
    'tarkistettu_ehdotus'
];

describe.skip('generateConfirmedFields utility function', () => {
    test('a field is found for all known confirmation attributes', () => {
        for(const confirm_attribute of confirmationAttributeNames ) {
            if (confirm_attribute === 'vahvista_ehdotus_esillaolo_alkaa_pieni') {
                // Not present in XL test data
                continue;
            }
            expect(generateConfirmedFields(
                {...test_attribute_data_XL, [confirm_attribute]: true}, confirmationAttributeNames, phaseNames), 
                `${confirm_attribute} should have related confirm field(s)`
            ).not.empty;
        }
    });
});