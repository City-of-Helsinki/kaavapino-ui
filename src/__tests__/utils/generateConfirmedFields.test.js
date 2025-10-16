import { describe, test, expect} from 'vitest';
import { confirmationAttributeNames } from '../../utils/constants';
import { generateConfirmedFields } from "../../utils/generateConfirmedFields";
import { test_attribute_data_XL } from './test_attribute_data';

const phaseNames = [
    'periaatteet',
    'oas',
    'luonnos',
    'ehdotus',
    'kaavaluonnos',
    'kaavaehdotus',
    'tarkistettu_ehdotus'
];

const all_deadline_attribute_keys = [
        "luonnosaineiston_maaraaika", "milloin_oas_esillaolo_alkaa", "viimeistaan_mielipiteet_oas",
        "luonnosaineiston_maaraaika_2", "luonnosaineiston_maaraaika_3", "milloin_oas_esillaolo_alkaa_2",
        "milloin_oas_esillaolo_alkaa_3","milloin_oas_esillaolo_paattyy", "viimeistaan_mielipiteet_oas_2",
        "viimeistaan_mielipiteet_oas_3", "milloin_luonnos_esillaolo_alkaa", "milloin_oas_esillaolo_paattyy_2",
        "milloin_oas_esillaolo_paattyy_3", "viimeistaan_mielipiteet_luonnos", "ehdotus_kylk_aineiston_maaraaika",
        "milloin_luonnos_esillaolo_alkaa_2", "milloin_luonnos_esillaolo_alkaa_3", "milloin_luonnos_esillaolo_paattyy",
        "milloin_periaatteet_lautakunnassa", "oas_esillaolo_aineiston_maaraaika", "viimeistaan_mielipiteet_luonnos_2",
        "viimeistaan_mielipiteet_luonnos_3", "milloin_kaavaehdotus_lautakunnassa", "milloin_kaavaluonnos_lautakunnassa",
        "tarkistettu_ehdotus_kylk_maaraaika", "viimeistaan_lausunnot_ehdotuksesta","milloin_luonnos_esillaolo_paattyy_2",
        "milloin_luonnos_esillaolo_paattyy_3", "milloin_periaatteet_esillaolo_alkaa","milloin_periaatteet_lautakunnassa_2",
        "milloin_periaatteet_lautakunnassa_3", "milloin_periaatteet_lautakunnassa_4","oas_esillaolo_aineiston_maaraaika_2",
        "oas_esillaolo_aineiston_maaraaika_3", "milloin_kaavaehdotus_lautakunnassa_2","milloin_kaavaehdotus_lautakunnassa_3",
        "milloin_kaavaehdotus_lautakunnassa_4", "milloin_kaavaluonnos_lautakunnassa_2","milloin_kaavaluonnos_lautakunnassa_3",
        "milloin_kaavaluonnos_lautakunnassa_4", "viimeistaan_lausunnot_ehdotuksesta_2","viimeistaan_lausunnot_ehdotuksesta_3",
        "viimeistaan_lausunnot_ehdotuksesta_4", "kaavaluonnos_kylk_aineiston_maaraaika","milloin_ehdotuksen_nahtavilla_paattyy",
        "milloin_periaatteet_esillaolo_alkaa_2","milloin_periaatteet_esillaolo_alkaa_3","milloin_periaatteet_esillaolo_paattyy",
        "viimeistaan_mielipiteet_periaatteista","milloin_ehdotuksen_nahtavilla_alkaa_iso","milloin_ehdotuksen_nahtavilla_paattyy_2",
        "milloin_ehdotuksen_nahtavilla_paattyy_3","milloin_ehdotuksen_nahtavilla_paattyy_4","milloin_periaatteet_esillaolo_paattyy_2",
        "milloin_periaatteet_esillaolo_paattyy_3","viimeistaan_mielipiteet_periaatteista_2","viimeistaan_mielipiteet_periaatteista_3",
        "milloin_ehdotuksen_nahtavilla_alkaa_iso_2","milloin_ehdotuksen_nahtavilla_alkaa_iso_3","milloin_ehdotuksen_nahtavilla_alkaa_iso_4",
        "milloin_tarkistettu_ehdotus_lautakunnassa","periaatteet_esillaolo_aineiston_maaraaika","periaatteet_lautakunta_aineiston_maaraaika",
        "milloin_tarkistettu_ehdotus_lautakunnassa_2","milloin_tarkistettu_ehdotus_lautakunnassa_3","milloin_tarkistettu_ehdotus_lautakunnassa_4",
        "periaatteet_esillaolo_aineiston_maaraaika_2","periaatteet_esillaolo_aineiston_maaraaika_3", "milloin_ehdotuksen_nahtavilla_alkaa_pieni",
        "milloin_ehdotuksen_nahtavilla_alkaa_pieni_2","milloin_ehdotuksen_nahtavilla_alkaa_pieni_3","milloin_ehdotuksen_nahtavilla_alkaa_pieni_4",
];

describe('generateConfirmedFields utility function', () => {
    test('at least one field is found for all known confirmation attributes', () => {
        const full_test_data = {};
        for (const attr of all_deadline_attribute_keys) {
            full_test_data[attr] = "1970-01-01";
        }
        for(const confirm_attribute of confirmationAttributeNames.filter(attr => !attr.includes('paattyy'))) {
            let test_data = {... full_test_data, [confirm_attribute]: true}
            expect(generateConfirmedFields(
                test_data, confirmationAttributeNames, phaseNames), 
                `${confirm_attribute} should have related confirm field(s)`
            ).not.empty;
        }
    });

    test("generateConfirmedFields returns all relevant attributes when all fields are confirmed", () => {
        const test_data = {...test_attribute_data_XL};
        for (const confirm_attribute of confirmationAttributeNames) {
            test_data[confirm_attribute] = true;
        }
        const result = generateConfirmedFields({...test_attribute_data_XL}, confirmationAttributeNames, phaseNames);
        for (const r of all_deadline_attribute_keys) {
            expect.soft(result, `Confirmed fields should include ${r}`).toContain(r);
        }
    });

    test("When no fields are confirmed, generateConfirmedFields returns an empty array", () => {
        const test_data = {...test_attribute_data_XL};
        for (const confirm_attribute of confirmationAttributeNames) {
            test_data[confirm_attribute] = false;
        }
        expect(generateConfirmedFields(test_data, confirmationAttributeNames, phaseNames).length).toBe(0);
    });

    test("generateConfirmedFields does not use outdated confirmation attributes", () => {
        const outdated_attributes = new Set([...confirmationAttributeNames].filter(attr => attr.includes('paattyy')));
        const test_data = {...test_attribute_data_XL};
        for (const confirm_attribute of confirmationAttributeNames) {
            test_data[confirm_attribute] = outdated_attributes.has(confirm_attribute);
        }
        expect(generateConfirmedFields(test_data, confirmationAttributeNames, phaseNames).length).toBe(0);
    });
});