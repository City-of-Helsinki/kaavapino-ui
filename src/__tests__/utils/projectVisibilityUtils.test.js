import { describe, test, expect } from 'vitest';
import { isDeadlineConfirmed, isCurrentPhaseConfirmed } from '../../utils/projectVisibilityUtils.js';

describe('projectVisibilityUtils utility functions', () => {
    test('isDeadlineConfirmed correctly identifies confirmed deadlines', () => {
        // formValues: basically attribute data for the deadline form
        // deadlineGroup: string
        // returnField bool, returns the key along with value
        // breakAtFirst bool, returns after first (_1) match
        const formValues = {
            'milloin_oas_esillaolo_alkaa': '2024-12-31',
            'vahvista_oas_esillaolo_alkaa': true,
            'tarkistettu_ehdotus_lautakuntaan_2': '2025-06-30',
            'vahvista_tarkistettu_ehdotus_lautakunnassa_2': false,
        };

        expect(isDeadlineConfirmed(formValues, '"oas_esillaolokerta_1"', false, false)).toEqual(true);
        expect(isDeadlineConfirmed(formValues, '"tarkistettu_ehdotus_lautakuntakerta_2', false, false)).toEqual(false);
        expect(isDeadlineConfirmed(formValues, '"oas_esillaolokerta_1"', false, true)).toEqual(true);
        expect(isDeadlineConfirmed(formValues, '"tarkistettu_ehdotus_lautakuntakerta_2', true, false)).toEqual({
            key: 'vahvista_tarkistettu_ehdotus_lautakunnassa_2',
            value: false,
        });
    });

    test("isCurrentPhaseConfirmed always returns true for phases with no confirmable deadlines", () => {
        expect(isCurrentPhaseConfirmed({
            kaavan_vaihe: "1. Käynnistys",
            vahvista_kaynnistys_esillaolo_alkaa: false,
        })).toBe(true);
        expect(isCurrentPhaseConfirmed({
            kaavan_vaihe: "5. Hyväksyminen",
            vahvista_hyvaksyminen_esillaolo_alkaa: false,
        })).toBe(true);
        expect(isCurrentPhaseConfirmed({
            kaavan_vaihe: "6. Voimaantulo",
            vahvista_voimaantulo_esillaolo_alkaa: false,
        })).toBe(true);
    });

    test("isCurrentPhaseConfirmed returns true when at least one phase's date is confirmed", () => {
        const attribute_data = {
            kaavan_vaihe: "3. Ehdotus",
            kaavaprosessin_kokoluokka: "XL",
            vahvista_ehdotus_esillaolo: false,
            vahvista_ehdotus_esillaolo_2: false,
            vahvista_ehdotus_esillaolo_3: false,
            vahvista_tarkistettu_ehdotus_lautakunnassa: false,
            tarkistettu_ehdotus_lautakuntaan_1: true,
            milloin_ehdotuksen_nahtavilla_alkaa_pieni: "2024-11-30",

        };
        expect(isCurrentPhaseConfirmed(attribute_data)).toBe(false);
        attribute_data.vahvista_tarkistettu_ehdotus_lautakunnassa = true;
        expect(isCurrentPhaseConfirmed(attribute_data)).toBe(false); // Wrong phase
        attribute_data.vahvista_ehdotus_esillaolo = true;
        expect(isCurrentPhaseConfirmed(attribute_data)).toBe(true);
    });
});