import {describe, test, expect} from 'vitest';
import infoFieldUtil from '../../utils/infoFieldUtil';

const test_dls = [
    {
    "date": "2025-12-23",
    "abbreviation": "O2",
    "deadline": { "attribute": "oas_esillaolo_aineiston_maaraaika", "phase_name": "OAS" },
    "edited": true
    },
    {
    "date": "2026-05-15",
    "abbreviation": "E5",
    "deadline": { "attribute": "milloin_ehdotuksen_nahtavilla_paattyy", "phase_name": "Ehdotus" },
    "edited": false
    },
    {
        "date": "2026-11-17",
        "abbreviation": "E6.4",
        "deadline": { "abbreviation": "E6.4", "attribute": "viimeistaan_lausunnot_ehdotuksesta_4", "phase_name": "Ehdotus"},
        "edited": null,
    }
];

describe("infoFieldUtil functions work", () => {
    test("userHasModified checks edited field correctly", () => {
        const retval = infoFieldUtil.userHasModified("oas_esillaolo_aineiston_maaraaika", test_dls, "OAS");
        expect(retval).true;
    });
    test("userHasModified checks untouched fields correctly", () => {
        expect(infoFieldUtil.userHasModified("milloin_ehdotuksen_nahtavilla_paattyy", test_dls, "Ehdotus")).false;
        expect(infoFieldUtil.userHasModified("viimeistaan_lausunnot_ehdotuksesta_4", test_dls, "Ehdotus")).false;
    });
    test("userHasModified returns false if deadline or phase is incorrect", () => {
        expect(infoFieldUtil.userHasModified("kaynnistys_vaihe_alkaa", test_dls, "Käynnistys")).false;
        expect(infoFieldUtil.userHasModified("oas_esillaolo_aineiston_maaraaika", test_dls, "Ehdotus")).false;
    });
});
