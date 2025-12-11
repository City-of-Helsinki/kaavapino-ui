import {describe, test, expect } from 'vitest';
import infoFieldUtil from '../../utils/infoFieldUtil';

const test_dls = [
    {deadline: { attribute: "milloin_periaatteet_esillaolo_alkaa", deadlinegroup: "periaatteet_esillaolokerta_1" }},
    {deadline: { attribute: "milloin_periaatteet_esillaolo_paattyy", deadlinegroup: "periaatteet_esillaolokerta_1" }},
    {deadline: { attribute: "milloin_periaatteet_esillaolo_alkaa_2", deadlinegroup: "periaatteet_esillaolokerta_2" }},
    {deadline: { attribute: "milloin_periaatteet_esillaolo_paattyy_2", deadlinegroup: "periaatteet_esillaolokerta_2" }},
    {deadline: { attribute: "milloin_periaatteet_esillaolo_alkaa_3", deadlinegroup: "periaatteet_esillaolokerta_3" }},
    {deadline: { attribute: "milloin_periaatteet_esillaolo_paattyy_3", deadlinegroup: "periaatteet_esillaolokerta_3" }},
    {deadline: { attribute: "milloin_periaatteet_lautakunnassa", deadlinegroup: "periaatteet_lautakuntakerta_1" }},
    {deadline: { attribute: "milloin_periaatteet_lautakunnassa_2", deadlinegroup: "periaatteet_lautakuntakerta_2" }},
    {deadline: { attribute: "milloin_periaatteet_lautakunnassa_3", deadlinegroup: "periaatteet_lautakuntakerta_3" }, edited: true },
    {deadline: { attribute: "oas_esillaolo_aineiston_maaraaika", deadlinegroup: "oas_esillaolokerta_1" }},  
    {deadline: { attribute: "milloin_oas_esillaolo_alkaa", deadlinegroup: "oas_esillaolokerta_1" }},
    {deadline: { attribute: "milloin_oas_esillaolo_paattyy", deadlinegroup: "oas_esillaolokerta_1"}},
    {deadline: { attribute: "milloin_oas_esillaolo_alkaa_2", deadlinegroup: "oas_esillaolokerta_2"}},
    {deadline: { attribute: "milloin_oas_esillaolo_paattyy_2", deadlinegroup: "oas_esillaolokerta_2"}},
    {deadline: { attribute: "milloin_oas_esillaolo_alkaa_3", deadlinegroup: "oas_esillaolokerta_3"}, edited: true},
    {deadline: { attribute: "milloin_oas_esillaolo_paattyy_3", deadlinegroup: "oas_esillaolokerta_3" }},
    {deadline: { attribute: "milloin_luonnos_esillaolo_alkaa", deadlinegroup: "luonnos_esillaolokerta_1"}},
    {deadline: { attribute: "milloin_luonnos_esillaolo_paattyy", deadlinegroup: "luonnos_esillaolokerta_1"}},
    {deadline: { attribute: "milloin_luonnos_esillaolo_alkaa_2", deadlinegroup: "luonnos_esillaolokerta_2"}},
    {deadline: { attribute: "milloin_luonnos_esillaolo_paattyy_2", deadlinegroup: "luonnos_esillaolokerta_2"}, edited: true},
    {deadline: { attribute: "milloin_luonnos_esillaolo_alkaa_3", deadlinegroup: "luonnos_esillaolokerta_3"}},
    {deadline: { attribute: "milloin_luonnos_esillaolo_paattyy_3", deadlinegroup: "luonnos_esillaolokerta_3"}},
    {deadline: { attribute: "milloin_kaavaluonnos_lautakunnassa", deadlinegroup: "luonnos_lautakuntakerta_1"}},
    {deadline: { attribute: "milloin_kaavaluonnos_lautakunnassa_3", deadlinegroup: "luonnos_lautakuntakerta_3"}},
    {deadline: { attribute: "milloin_kaavaluonnos_lautakunnassa_2", deadlinegroup: "luonnos_lautakuntakerta_2"}},
    {deadline: { attribute: "milloin_kaavaehdotus_lautakunnassa", deadlinegroup: "ehdotus_lautakuntakerta_1"}},
    {deadline: { attribute: "milloin_kaavaehdotus_lautakunnassa_2", deadlinegroup: "ehdotus_lautakuntakerta_2"}},
    {deadline: { attribute: "milloin_kaavaehdotus_lautakunnassa_3", deadlinegroup: "ehdotus_lautakuntakerta_3"}},
    {deadline: { attribute: "milloin_ehdotuksen_nahtavilla_alkaa_iso", deadlinegroup: "ehdotus_nahtavillaolokerta_1"}},
    {deadline: { attribute: "milloin_ehdotuksen_nahtavilla_paattyy", deadlinegroup: "ehdotus_nahtavillaolokerta_1"}},
    {deadline: { attribute: "milloin_ehdotuksen_nahtavilla_alkaa_iso_2", deadlinegroup: "ehdotus_nahtavillaolokerta_2"}},
    {deadline: { attribute: "milloin_ehdotuksen_nahtavilla_paattyy_2", deadlinegroup: "ehdotus_nahtavillaolokerta_2"}},
    {deadline: { attribute: "milloin_ehdotuksen_nahtavilla_alkaa_iso_3", deadlinegroup: "ehdotus_nahtavillaolokerta_3"}},
    {deadline: { attribute: "milloin_ehdotuksen_nahtavilla_paattyy_3", deadlinegroup: "ehdotus_nahtavillaolokerta_3"}},
    {deadline: { attribute: "tarkistettu_ehdotus_kylk_maaraaika", deadlinegroup: "tarkistettu_ehdotus_lautakuntakerta_1" }},
    {deadline: { attribute: "milloin_tarkistettu_ehdotus_lautakunnassa", deadlinegroup: "tarkistettu_ehdotus_lautakuntakerta_1" }},
    {deadline: { attribute: "milloin_tarkistettu_ehdotus_lautakunnassa_2", deadlinegroup: "tarkistettu_ehdotus_lautakuntakerta_2" }},
    {deadline: { attribute: "milloin_tarkistettu_ehdotus_lautakunnassa_3", deadlinegroup: "tarkistettu_ehdotus_lautakuntakerta_3" }},
    {deadline: { attribute: "milloin_tarkistettu_ehdotus_lautakunnassa_4", deadlinegroup: "tarkistettu_ehdotus_lautakuntakerta_4" }, edited: true },
];

describe("infoFieldUtil functions", () => {
    test("getEsillaoloDates returns correct data", () => {
        const data = {
            milloin_oas_esillaolo_alkaa: "2025-11-01",
            milloin_oas_esillaolo_paattyy: "2025-11-30",
            vahvista_oas_esillaolo_alkaa: false
        };
        const result = infoFieldUtil.getEsillaoloDates("oas_esillaolokerta_1", data, test_dls);
        expect(result).toStrictEqual({
            startDate: "2025-11-01",
            endDate: "2025-11-30",
            confirmed: false,
            startModified: false,
            endModified: false
        });
        data.vahvista_oas_esillaolo_alkaa = true;
        const result2 = infoFieldUtil.getEsillaoloDates("oas_esillaolokerta_1", data, test_dls);
        expect(result2.confirmed).toBe(true);
    });
    test("getLautakuntaDates returns correct data", () => {
        const data = {
            tarkistettu_ehdotus_kylk_maaraaika: "2025-12-01",
            milloin_tarkistettu_ehdotus_lautakunnassa: "2025-12-15",
            vahvista_tarkistettu_ehdotus_lautakunnassa: false
        };
        const result = infoFieldUtil.getLautakuntaDates("tarkistettu_ehdotus_lautakuntakerta_1", data, test_dls);
        expect(result).toStrictEqual({
            boardDate: "2025-12-15",
            boardConfirmed: false,
            boardModified: false
        });
        data.vahvista_tarkistettu_ehdotus_lautakunnassa = true;
        const result2 = infoFieldUtil.getLautakuntaDates("tarkistettu_ehdotus_lautakuntakerta_1", data, test_dls);
        expect(result2.boardConfirmed).toBe(true);
    });
    test("getPrincipleDates returns correct data", () => {
        const data = {
            jarjestetaan_periaatteet_esillaolo_3: false,
            jarjestetaan_periaatteet_esillaolo_2: true,
            jarjestetaan_periaatteet_esillaolo_1: true,
            periaatteet_lautakuntaan_3: true,
            periaatteet_lautakuntaan_2: true,
            periaatteet_lautakuntaan_1: true,
            milloin_periaatteet_esillaolo_alkaa_2: "2025-10-01",
            milloin_periaatteet_esillaolo_paattyy_2: "2025-10-31",
            vahvista_periaatteet_esillaolo_alkaa_2: true,
            milloin_periaatteet_esillaolo_alkaa: "2025-09-01",
            milloin_periaatteet_esillaolo_paattyy: "2025-09-30",
            vahvista_periaatteet_esillaolo_alkaa: true,
            milloin_periaatteet_lautakunnassa: "2025-11-15",
            milloin_periaatteet_lautakunnassa_2: "2025-12-15",
            milloin_periaatteet_lautakunnassa_3: "2026-01-15",
            vahvista_periaatteet_lautakunnassa: true,
            vahvista_periaatteet_lautakunnassa_2: true,
            vahvista_periaatteet_lautakunnassa_3: false
        };
        const result = infoFieldUtil.getPrincipleDates(data, test_dls);
        // Should pick esillaolo 2 and lautakunta 3
        expect(result).toStrictEqual({
            startDate: "2025-10-01",
            endDate: "2025-10-31",
            confirmed: true,
            startModified: false,
            endModified: false,
            boardDate: "2026-01-15",
            boardConfirmed: false,
            boardModified: true,
            boardText: "custom-card.principles-board-text"
        });
    });
    test("getOASDates returns correct data", () => {
        const data = {
            jarjestetaan_oas_esillaolo_3: true,
            jarjestetaan_oas_esillaolo_2: true,
            jarjestetaan_oas_esillaolo_1: true,
            milloin_oas_esillaolo_alkaa_3: "2025-08-01",
            milloin_oas_esillaolo_paattyy_3: "2025-08-31",
            milloin_oas_esillaolo_alkaa_2: "2025-07-01",
            milloin_oas_esillaolo_paattyy_2: "2025-07-31",
            milloin_oas_esillaolo_alkaa: "2025-06-01",
            milloin_oas_esillaolo_paattyy: "2025-06-30",
            vahvista_oas_esillaolo_alkaa_3: false,
            vahvista_oas_esillaolo_alkaa_2: false,
            vahvista_oas_esillaolo_alkaa: false,
        };
        const result = infoFieldUtil.getOASDates(data, test_dls);
        // Should pick esillaolo 3
        expect(result).toStrictEqual({
            startDate: "2025-08-01",
            endDate: "2025-08-31",
            confirmBoard: false,
            confirmed: false,
            startModified: true,
            endModified: false,
        });
        data.jarjestetaan_oas_esillaolo_3 = false;
        expect(infoFieldUtil.getOASDates(data, test_dls).startDate).toBe("2025-07-01");
        data.jarjestetaan_oas_esillaolo_2 = false;
        expect(infoFieldUtil.getOASDates(data, test_dls).startDate).toBe("2025-06-01");
    });
    test("getDraftDates returns correct data", () => {
        const data = {
            jarjestetaan_luonnos_esillaolo_3: false,
            jarjestetaan_luonnos_esillaolo_2: true,
            jarjestetaan_luonnos_esillaolo_1: true,
            kaavaluonnos_lautakuntaan_3: false,
            kaavaluonnos_lautakuntaan_2: false,
            kaavaluonnos_lautakuntaan_1: true,
            milloin_luonnos_esillaolo_alkaa_2: "2025-05-01",
            milloin_luonnos_esillaolo_paattyy_2: "2025-05-31",
            vahvista_luonnos_esillaolo_alkaa_2: true,
            milloin_luonnos_esillaolo_alkaa: "2025-04-01",
            milloin_luonnos_esillaolo_paattyy: "2025-04-30",
            vahvista_luonnos_esillaolo_alkaa: true,
            milloin_kaavaluonnos_lautakunnassa: "2025-06-15",
            milloin_kaavaluonnos_lautakunnassa_2: "2025-07-15",
            milloin_kaavaluonnos_lautakunnassa_3: "2025-08-15",
            vahvista_kaavaluonnos_lautakunnassa: true,
            vahvista_kaavaluonnos_lautakunnassa_2: false,
            vahvista_kaavaluonnos_lautakunnassa_3: false
        };
        const result = infoFieldUtil.getDraftDates(data, test_dls);
        // Should pick esillaolo 2 and lautakunta 1
        expect(result).toStrictEqual({
            startDate: "2025-05-01",
            endDate: "2025-05-31",
            confirmed: true,
            startModified: false,
            endModified: true,
            boardDate: "2025-06-15",
            boardConfirmed: true,
            boardModified: false,
            boardText: "custom-card.principles-board-text"
        });

    });
    test("getDraftDates returns correct data when no dates are present", () => {
        const data = {
            jarjestetaan_luonnos_esillaolo: false,
            kaavaluonnos_lautakuntaan: false,
            milloin_kaavaluonnos_lautakunnassa: "2025-06-15",
            vahvista_kaavaluonnos_lautakunnassa: true,
            milloin_luonnos_esillaolo_alkaa: "2025-04-01",
            milloin_luonnos_esillaolo_paattyy: "2025-04-30",
            vahvista_luonnos_esillaolo_alkaa: true,
        };
        const result = infoFieldUtil.getDraftDates(data, test_dls);
        expect(result).toStrictEqual({
            boardText: "custom-card.principles-board-text"
        });
    });
    test("getSuggestion returns correct data", () => {
        const data = {
            kaavaehdotus_nahtaville: true,
            kaavaehdotus_uudelleen_nahtaville_2: true,
            kaavaehdotus_uudelleen_nahtaville_3: false,
            milloin_ehdotuksen_nahtavilla_alkaa_iso_2: "2025-03-01",
            milloin_ehdotuksen_nahtavilla_paattyy_2: "2025-03-31",
            vahvista_ehdotus_esillaolo_2: true,
            milloin_ehdotuksen_nahtavilla_alkaa_iso: "2025-02-01",
            milloin_ehdotuksen_nahtavilla_paattyy: "2025-02-28",
            vahvista_ehdotus_esillaolo: true,
            kaavaehdotus_lautakuntaan: true,
            kaavaehdotus_lautakuntaan_2: true,
            kaavaehdotus_lautakuntaan_3: true,
            kaavaehdotus_lautakuntaan_4: false,
            milloin_kaavaehdotus_lautakunnassa: "2025-04-15",
            milloin_kaavaehdotus_lautakunnassa_2: "2025-05-15",
            milloin_kaavaehdotus_lautakunnassa_3: "2025-06-15",
            vahvista_kaavaehdotus_lautakunnassa: true,
            vahvista_kaavaehdotus_lautakunnassa_2: true,
            vahvista_kaavaehdotus_lautakunnassa_3: false
        }
        const result = infoFieldUtil.getSuggestion(data, test_dls);
        // Should pick ehdotus nahtavilla 2 and lautakunta 3
        expect(result).toStrictEqual({
            startDate: "2025-03-01",
            endDate: "2025-03-31",
            confirmed: true,
            startModified: false,
            endModified: false,
            boardDate: "2025-06-15",
            boardConfirmed: false,
            boardModified: false,
            boardText: "custom-card.suggestion-board-text",
            endText: "custom-card.suggestion-end-text",
            startText: "custom-card.suggestion-start-text"
        });
        data.kaavaehdotus_uudelleen_nahtaville_2 = false;
        expect(infoFieldUtil.getSuggestion(data, test_dls).startDate).toBe("2025-02-01");
    });
    test("getReviewSuggestion returns correct data", () => {
        const data = {
            tarkistettu_ehdotus_lautakuntaan_1: true,
            tarkistettu_ehdotus_lautakuntaan_2: true,
            tarkistettu_ehdotus_lautakuntaan_3: true,
            tarkistettu_ehdotus_lautakuntaan_4: true,
            milloin_tarkistettu_ehdotus_lautakunnassa: "2025-01-15",
            milloin_tarkistettu_ehdotus_lautakunnassa_2: "2025-02-15",
            milloin_tarkistettu_ehdotus_lautakunnassa_3: "2025-03-15",
            milloin_tarkistettu_ehdotus_lautakunnassa_4: "2025-04-15",
            vahvista_tarkistettu_ehdotus_lautakunnassa: true,
            vahvista_tarkistettu_ehdotus_lautakunnassa_2: true,
            vahvista_tarkistettu_ehdotus_lautakunnassa_3: true,
            vahvista_tarkistettu_ehdotus_lautakunnassa_4: true,
        }
        const result = infoFieldUtil.getReviewSuggestion(data, test_dls);
        // Should pick ehdotus nahtavilla 1 and lautakunta 1
        expect(result).toStrictEqual({
            boardDate: "2025-04-15",
            boardConfirmed: true,
            boardModified: true,
            boardText: "custom-card.review-suggestion-board-text"
        }); 
    });
    test("GetAcceptanceDate returns correct data", () => {
        const data = {
            hyvaksymispaatos_pvm: "2025-05-20",
            hyvaksymispaatos_valitusaika_paattyy: "2025-06-20",
            voimaantulo_pvm: "2025-07-20",
        };
        const result = infoFieldUtil.getAcceptanceDate(data, "Merkitse hyväksymispäivä");
        const result2 = infoFieldUtil.getAcceptanceDate(data, "Merkitse muutoksenhakua koskevat päivämäärät");
        const result3 = infoFieldUtil.getAcceptanceDate(data, "Merkitse voimaantuloa koskevat päivämäärät");
        const result4 = infoFieldUtil.getAcceptanceDate(data, "");
        expect(result).toStrictEqual({
            boardDate: "2025-05-20",
            boardText: "custom-card.acceptance-date-text"
        });
        expect(result2.boardDate).toBe("2025-06-20");
        expect(result3.boardDate).toBe("2025-07-20");
        expect(result4.boardDate).toBe("Tieto puuttuu");
    });
    test("getInfoFieldData calls each branch without crashing", () => {
        // just verifying that no errors are thrown
        // use test-coverage to verify all subfunctions are called
        infoFieldUtil.getInfoFieldData("Tarkasta esilläolopäivät", "tarkasta_esillaolo_periaatteet_fieldset", {}, test_dls, 39);
        infoFieldUtil.getInfoFieldData("Tarkasta esilläolopäivät", "tarkasta_esillaolo_oas_fieldset", {oas_luotu: true}, test_dls, 35);
        infoFieldUtil.getInfoFieldData("Tarkasta esilläolopäivät", "tarkasta_esillaolo_luonnos_fieldset", {luonnos_luotu: true}, test_dls, 29);
        infoFieldUtil.getInfoFieldData("Tarkasta kerrosalatiedot", "tarkasta_kerrosala_fieldset", {ehdotus_luotu: true}, test_dls, 29);
        infoFieldUtil.getInfoFieldData("Tarkasta kerrosalatiedot", "tarkasta_kerrosala_fieldset", {tarkistettu_ehdotus_luotu: true}, test_dls, 30);
        infoFieldUtil.getInfoFieldData("Merkitse hyväksymispäivä", "hyvaksymispaatos_pvm_fieldset", {}, test_dls, 5);
    });
});