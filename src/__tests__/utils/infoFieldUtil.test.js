import {describe, test, expect} from 'vitest';
import infoFieldUtil from '../../utils/infoFieldUtil';

const test_dls = [
    {
        deadline: { attribute: "oas_esillaolo_aineiston_maaraaika", deadlinegroup: "oas_esillaolokerta_1" },
        edited: true
    },
    {
        deadline: { attribute: "milloin_oas_esillaolo_alkaa", deadlinegroup: "oas_esillaolokerta_1" },
        edited: true
    },
    {
        deadline: { attribute: "milloin_oas_esillaolo_paattyy", deadlinegroup: "oas_esillaolokerta_1" },
        edited: false
    },
    {
        deadline: { attribute: "tarkistettu_ehdotus_kylk_maaraaika", deadlinegroup: "tarkistettu_ehdotus_lautakuntakerta_1" },
        edited: false
    },
    {
        deadline: { attribute: "tarkistettu_ehdotus_lautakunnassa", deadlinegroup: "tarkistettu_ehdotus_lautakuntakerta_1" },
        edited: true
    }
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
            startModified: true,
            endModified: false
        });
        data.vahvista_oas_esillaolo_alkaa = true;
        const result2 = infoFieldUtil.getEsillaoloDates("oas_esillaolokerta_1", data, test_dls);
        expect(result2.confirmed).toBe(true);
    });
    test("getLautakuntaDates returns correct data", () => {
        const data = {
            tarkistettu_ehdotus_kylk_maaraaika: "2025-12-01",
            tarkistettu_ehdotus_lautakunnassa: "2025-12-15",
            vahvista_tarkistettu_ehdotus_lautakunnassa: false
        };
        const result = infoFieldUtil.getLautakuntaDates("tarkistettu_ehdotus_lautakuntakerta_1", data, test_dls);
        expect(result).toStrictEqual({
            boardDate: "2025-12-15",
            boardConfirmed: false,
            boardModified: true
        });
        data.vahvista_tarkistettu_ehdotus_lautakunnassa = true;
        const result2 = infoFieldUtil.getLautakuntaDates("tarkistettu_ehdotus_lautakuntakerta_1", data, test_dls);
        expect(result2.boardConfirmed).toBe(true);
    });
});
