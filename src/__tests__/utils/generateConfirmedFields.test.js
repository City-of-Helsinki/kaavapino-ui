import { describe, test, expect} from 'vitest';
import { confirmationAttributeNames } from '../../utils/constants';
import { generateConfirmedFields } from "../../utils/generateConfirmedFields";
import { test_attribute_data_XL } from './test_attribute_data';

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
                test_data, confirmationAttributeNames), 
                `${confirm_attribute} should have related confirm field(s)`
            ).not.empty;
        }
    });

    test("generateConfirmedFields returns all relevant attributes when all fields are confirmed", () => {
        const test_data = {...test_attribute_data_XL};
        for (const confirm_attribute of confirmationAttributeNames) {
            test_data[confirm_attribute] = true;
        }
        const result = generateConfirmedFields(test_data, confirmationAttributeNames);
        for (const r of all_deadline_attribute_keys) {
            expect.soft(result, `Confirmed fields should include ${r}`).toContain(r);
        }
    });

    test("When no fields are confirmed, generateConfirmedFields returns an empty array", () => {
        const test_data = {...test_attribute_data_XL};
        for (const confirm_attribute of confirmationAttributeNames) {
            test_data[confirm_attribute] = false;
        }
        expect(generateConfirmedFields(test_data, confirmationAttributeNames).length).toBe(0);
    });

    test("generateConfirmedFields does not use outdated confirmation attributes", () => {
        const outdated_attributes = new Set([...confirmationAttributeNames].filter(attr => attr.includes('paattyy')));
        const test_data = {...test_attribute_data_XL};
        for (const confirm_attribute of confirmationAttributeNames) {
            test_data[confirm_attribute] = outdated_attributes.has(confirm_attribute);
        }
        expect(generateConfirmedFields(test_data, confirmationAttributeNames).length).toBe(0);
    });

    test("Ehdotus esillaolo confirmation works with vahvista_ehdotus_esillaolo (no _iso/_pieni)", () => {
        // Test ehdotus confirmation - should work for all project sizes with same key
        const test_data = {
            kaavaprosessin_kokoluokka: "XL",
            milloin_ehdotuksen_nahtavilla_alkaa_iso: "2024-01-01",
            milloin_ehdotuksen_nahtavilla_alkaa_iso_2: "2024-02-01",
            milloin_ehdotuksen_nahtavilla_paattyy: "2024-01-15",
            milloin_ehdotuksen_nahtavilla_paattyy_2: "2024-02-15",
            vahvista_ehdotus_esillaolo: true,
            vahvista_ehdotus_esillaolo_2: true
        };
        const result = generateConfirmedFields(test_data, confirmationAttributeNames);
        expect(result).toContain('milloin_ehdotuksen_nahtavilla_alkaa_iso');
        expect(result).toContain('milloin_ehdotuksen_nahtavilla_alkaa_iso_2');
        expect(result).toContain('milloin_ehdotuksen_nahtavilla_paattyy');
        expect(result).toContain('milloin_ehdotuksen_nahtavilla_paattyy_2');
    });

    test("Only confirmed index is returned for esillaolo (not all _2, _3, _4)", () => {
        const test_data = {
            milloin_luonnos_esillaolo_alkaa: "2024-01-01",
            milloin_luonnos_esillaolo_alkaa_2: "2024-02-01",
            milloin_luonnos_esillaolo_alkaa_3: "2024-03-01",
            milloin_luonnos_esillaolo_paattyy: "2024-01-15",
            milloin_luonnos_esillaolo_paattyy_2: "2024-02-15",
            vahvista_luonnos_esillaolo_alkaa: true,  // Only first confirmed
            vahvista_luonnos_esillaolo_alkaa_2: false,
            vahvista_luonnos_esillaolo_alkaa_3: false
        };
        const result = generateConfirmedFields(test_data, confirmationAttributeNames);
        
        // Should include only first occurrence
        expect(result).toContain('milloin_luonnos_esillaolo_alkaa');
        expect(result).toContain('milloin_luonnos_esillaolo_paattyy');
        
        // Should NOT include _2 and _3 (not confirmed)
        expect(result).not.toContain('milloin_luonnos_esillaolo_alkaa_2');
        expect(result).not.toContain('milloin_luonnos_esillaolo_alkaa_3');
        expect(result).not.toContain('milloin_luonnos_esillaolo_paattyy_2');
    });

    test("Each lautakunta index must be confirmed separately", () => {
        const test_data = {
            milloin_kaavaluonnos_lautakunnassa: "2024-01-01",
            milloin_kaavaluonnos_lautakunnassa_2: "2024-02-01",
            milloin_kaavaluonnos_lautakunnassa_3: "2024-03-01",
            milloin_kaavaluonnos_lautakunnassa_4: "2024-04-01",
            vahvista_kaavaluonnos_lautakunnassa: true,  // Only first confirmed
            vahvista_kaavaluonnos_lautakunnassa_3: true  // And third confirmed
        };
        const result = generateConfirmedFields(test_data, confirmationAttributeNames);
        
        // Should include only confirmed indices (_1 and _3)
        expect(result).toContain('milloin_kaavaluonnos_lautakunnassa');
        expect(result).toContain('milloin_kaavaluonnos_lautakunnassa_3');
        
        // Should NOT include unconfirmed indices (_2 and _4)
        expect(result).not.toContain('milloin_kaavaluonnos_lautakunnassa_2');
        expect(result).not.toContain('milloin_kaavaluonnos_lautakunnassa_4');
    });

    test("Phase dates and visibility booleans are filtered out", () => {
        const test_data = {
            luonnosvaihe_alkaa_pvm: "2024-01-01",
            luonnosvaihe_paattyy_pvm: "2024-12-31",
            jarjestetaan_luonnos_esillaolo_1: true,
            kaavaluonnos_lautakuntaan_1: true,
            luonnos_luotu: true,
            lautakunta_paatti_luonnos: "hyvaksytty",
            onko_luonnos_a_asiana: true,
            milloin_luonnos_esillaolo_alkaa: "2024-01-01",
            vahvista_luonnos_esillaolo_alkaa: true
        };
        const result = generateConfirmedFields(test_data, confirmationAttributeNames);
        
        // Should include actual deadline
        expect(result).toContain('milloin_luonnos_esillaolo_alkaa');
        
        // Should NOT include phase dates, visibility booleans, or metadata
        expect(result).not.toContain('luonnosvaihe_alkaa_pvm');
        expect(result).not.toContain('luonnosvaihe_paattyy_pvm');
        expect(result).not.toContain('jarjestetaan_luonnos_esillaolo_1');
        expect(result).not.toContain('kaavaluonnos_lautakuntaan_1');
        expect(result).not.toContain('luonnos_luotu');
        expect(result).not.toContain('lautakunta_paatti_luonnos');
        expect(result).not.toContain('onko_luonnos_a_asiana');
    });

    test("Special cases for ehdotus and periaatteet are handled correctly", () => {
        const test_data = {
            viimeistaan_lausunnot_ehdotuksesta: "2024-01-01",
            viimeistaan_lausunnot_ehdotuksesta_2: "2024-02-01",
            milloin_ehdotuksen_nahtavilla_alkaa_iso: "2024-01-01",
            viimeistaan_mielipiteet_periaatteista: "2024-03-01",
            milloin_periaatteet_esillaolo_alkaa: "2024-03-01",
            vahvista_ehdotus_esillaolo: true,
            vahvista_periaatteet_esillaolo_alkaa: true
        };
        const result = generateConfirmedFields(test_data, confirmationAttributeNames);
        
        // Ehdotus special cases
        expect(result).toContain('viimeistaan_lausunnot_ehdotuksesta');
        expect(result).toContain('milloin_ehdotuksen_nahtavilla_alkaa_iso');
        
        // Periaatteet special cases
        expect(result).toContain('viimeistaan_mielipiteet_periaatteista');
        expect(result).toContain('milloin_periaatteet_esillaolo_alkaa');
        
        // Should NOT include _2 (different index)
        expect(result).not.toContain('viimeistaan_lausunnot_ehdotuksesta_2');
    });
});