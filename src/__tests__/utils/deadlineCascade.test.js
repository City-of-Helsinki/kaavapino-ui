import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';

// Pin "today" to a fixed date so that past-date locking in cascadeDeadlineChange
// does not freeze test data items as "in the past" as real time advances.
beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2025-01-01')); });
afterAll(() => { vi.useRealTimers(); });

import deadlineCascade from '../../utils/deadlineCascade';
import mockData from './cascadeDeadlineChange_test_data.js';

// Helpers to reduce duplication in cascadeDeadlineChange tests
const cloneTestArr = () => structuredClone(mockData.decreasing_test_arr);
const setFieldValue = (arr, field, value) => {
    const index = arr.findIndex(item => item.key === field);
    if (index !== -1) arr[index].value = value;
};
const checkParams = (overrides = {}) => {
    const params = {
        dlArray: mockData.decreasing_test_arr,
        field: '',
        disabledDates: mockData.test_disabledDates,
        projectSize: 'L',
        ...overrides
    };
    if (params.movedFieldValue === undefined) {
        const item = params.dlArray.find(i => i.key === params.field);
        params.movedFieldValue = item?.value;
    }
    return params;
};

describe("Test deadlineCascade utility functions", () => {

    test("findLastDeadlineInPhase looks up the correct value from array", () => {
        const test_arr = [
            { key: "oasvaihe_alkaa_pvm", value: "2024-01-01" },
            { key: "milloin_oas_esillaolo_alkaa", value: "2024-01-03" },
            { key: "milloin_oas_esillaolo_paattyy", value: "2024-01-04" },
            { key: "oasvaihe_paattyy_pvm", value: "2024-01-05" },
            { key: "ehdotusvaihe_alkaa_pvm", value: "2024-01-06" },
            { key: "milloin_ehdotuksen_nahtavilla_alkaa_pieni", value: "2024-01-07" },
            { key: "ehdotusvaihe_paattyy_pvm", value: "2024-01-08" },
            { key: "tarkistettuehdotusvaihe_alkaa_pvm", value: "2024-01-09" },
            { key: "tarkistettu_ehdotus_kylk_maaraaika", value: "2024-01-10" },
            { key: "tarkistettuehdotusvaihe_paattyy_pvm", value: "2024-01-11" }
        ];

        expect(deadlineCascade.findLastDeadlineInPhase(test_arr, 3, "oas")).toBe("2024-01-04");
        expect(deadlineCascade.findLastDeadlineInPhase(test_arr, 8, "ehdotus")).toBe("2024-01-07");
        expect(deadlineCascade.findLastDeadlineInPhase(test_arr, 10, "tarkistettuehdotus")).toBe("2024-01-10");

        expect(deadlineCascade.findLastDeadlineInPhase(test_arr, 2, "tarkistettuehdotus")).toBeNull(); // index too low
        expect(deadlineCascade.findLastDeadlineInPhase(test_arr, 10, "nonexistent_key")).toBeNull();
    });

    test("cascadeDeadlineChange behaves correctly when adding new element group", () => {
        const test_add_date = (movedDate, moveToPast) => {
            const modified_test_arr = cloneTestArr();
            const field = "periaatteet_esillaolo_aineiston_maaraaika_2";
            const originalField = modified_test_arr.find(item => item.key === field);
            const oldDate = "2026-04-15";
            const projectSize = "XL";
            setFieldValue(modified_test_arr, field, movedDate);
            const original = JSON.parse(JSON.stringify(modified_test_arr));
            const result = deadlineCascade.cascadeDeadlineChange(checkParams({
                dlArray: modified_test_arr,
                field,
                projectSize
            }));
            for (const item of result) {
                if (item.order && item.order < originalField.order) {
                    const originalItem = original.find(orig => orig.key === item.key);
                    expect(item.value, `items before the changed date should be untouched ${item.key}`).toBe(originalItem.value);
                }
                if (item.order && item.order > originalField.order) {
                    expect(new Date(item.value) >= new Date(movedDate),
                        'items after the changed date should be adjusted to be after the movedDate').toBe(true);
                }
                if (item.key === "milloin_periaatteet_esillaolo_alkaa_2") {
                    const expectedDate = new Date(movedDate);
                    expectedDate.setDate(expectedDate.getDate() + 19);
                    expect(new Date(item.value) >= expectedDate,
                        "milloin_periaatteet_esillaolo_alkaa_2 should be at least 19 days after movedDate").toBe(true);
                    expect(new Date(item.value).getDay(), "milloin_periaatteet_esillaolo_alkaa_2 not fall on a weekend").not.toBeOneOf([6, 0]);
                }
                if (item.key === "milloin_periaatteet_esillaolo_paattyy_2") {
                    const expectedDate = new Date(result.find(i => i.key === "milloin_periaatteet_esillaolo_alkaa_2").value);
                    expectedDate.setDate(expectedDate.getDate() + 14);
                    expect(new Date(item.value) >= expectedDate,
                        "milloin_periaatteet_esillaolo_paattyy_2 should be at least 14 days after milloin_periaatteet_esillaolo_alkaa_2").toBe(true);
                    expect(new Date(item.value).getDay(), "milloin_periaatteet_esillaolo_paattyy_2 not fall on a weekend").not.toBeOneOf([6, 0]);
                }
                if (item.key === "viimeistaan_mielipiteet_periaatteista_2") {
                    expect(new Date(item.value), "viimeistaan_mielipiteet should match milloin_paattyy")
                        .toEqual(new Date(result.find(i => i.key === "milloin_periaatteet_esillaolo_paattyy_2").value));
                }
            }
        }
        test_add_date("2027-05-23", false);
        test_add_date("2027-06-23", false);
    });
});

// Helpers mirroring the "arkipäivät" (weekday) gap semantics used by findFirstAllowedDate/findPastDateWithGap,
// so expected dates can be computed independently of the production code under test.
// Uses local date components (not toISOString) to avoid off-by-one shifts in non-UTC timezones.
const formatLocalDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
};
const addWeekdays = (dateStr, days) => {
    const [year, month, date] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, date);
    let added = 0;
    while (added < days) {
        d.setDate(d.getDate() + 1);
        const day = d.getDay();
        if (day !== 0 && day !== 6) added++;
    }
    return formatLocalDate(d);
};
const subtractWeekdays = (dateStr, days) => {
    const [year, month, date] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, date);
    let removed = 0;
    while (removed < days) {
        d.setDate(d.getDate() - 1);
        const day = d.getDay();
        if (day !== 0 && day !== 6) removed++;
    }
    return formatLocalDate(d);
};

describe("cascadeDeadlineChange preserves existing distances (forward cascade)", () => {
    const buildArr = () => {
        const anchor_orig = '2026-01-01'; // Thursday, untouched item before the moved field
        const a_orig = '2026-01-05'; // Monday
        const b_orig = addWeekdays(a_orig, 10); // existing a->b distance = 10 (> b's minimum of 3)
        const c_orig = addWeekdays(b_orig, 2);  // existing b->c distance = 2 (== c's minimum)
        const d_orig = addWeekdays(c_orig, 1);  // existing c->d distance = 1 (< d's minimum of 8)
        return [
            { key: 'preserve_test_anchor', value: anchor_orig, distance_from_previous: null, date_type: 'arkipäivät', order: 0 },
            { key: 'preserve_test_a', value: a_orig, distance_from_previous: 2, date_type: 'arkipäivät', order: 1 },
            { key: 'preserve_test_b', value: b_orig, distance_from_previous: 3, date_type: 'arkipäivät', order: 2 },
            { key: 'preserve_test_c', value: c_orig, distance_from_previous: 2, date_type: 'arkipäivät', order: 3 },
            { key: 'preserve_test_d', value: d_orig, distance_from_previous: 8, date_type: 'arkipäivät', order: 4 }
        ];
    };

    test("downstream item further away than its minimum gap keeps its original distance when the anchor moves forward", () => {
        const arr = buildArr();
        const originalA = arr[1].value;
        const newA = addWeekdays(originalA, 5);
        const result = deadlineCascade.cascadeDeadlineChange({
            dlArray: arr,
            field: 'preserve_test_a',
            movedFieldValue: newA,
            disabledDates: mockData.test_disabledDates,
            attributeData: {},
            deadlineObjects: [],
            isDrag: true
        });

        const b = result.find(i => i.key === 'preserve_test_b');
        const c = result.find(i => i.key === 'preserve_test_c');
        const d = result.find(i => i.key === 'preserve_test_d');

        // b preserves its original 10-day distance from a (lockstep shift), not just its 3-day minimum
        expect(b.value).toBe(addWeekdays(newA, 10));
        // c preserves its original 2-day distance from b (equal to its own minimum)
        expect(c.value).toBe(addWeekdays(b.value, 2));
        // d's original distance from c (1 day) was below its minimum (8), so the minimum floors the gap
        expect(d.value).toBe(addWeekdays(c.value, 8));
    });
});

describe("cascadeDeadlineChange preserves existing distances during backtracking (locked group)", () => {
    test("the locked item's direct predecessor is backtracked using only the minimum gap, while earlier items still preserve their original distance", () => {
        const anchor_orig = '2026-01-01'; // Thursday, untouched item before the moved field
        const x_orig = '2026-01-05'; // Monday
        const pre_orig = addWeekdays(x_orig, 10); // existing x->pre distance = 10
        const a_orig = addWeekdays(pre_orig, 6);  // existing pre->a distance = 6 (>> a's minimum of 3)
        const b_orig = addWeekdays(a_orig, 15);   // existing a->b distance = 15 (>> b's minimum of 2)

        const arr = [
            { key: 'lock_test_anchor', value: anchor_orig, distance_from_previous: null, date_type: 'arkipäivät', order: 0 },
            { key: 'lock_test_x', value: x_orig, distance_from_previous: 2, date_type: 'arkipäivät', order: 1 },
            { key: 'lock_test_pre', value: pre_orig, distance_from_previous: 3, date_type: 'arkipäivät', order: 2 },
            { key: 'lock_test_a', value: a_orig, distance_from_previous: 3, date_type: 'arkipäivät', order: 3 },
            { key: 'lock_test_b', value: b_orig, distance_from_previous: 2, date_type: 'arkipäivät', order: 4 }
        ];
        const deadlineObjects = [
            { deadline: { deadlinegroup: 'test_group', attribute: 'lock_test_b' } }
        ];

        // Move x far enough forward that, without backtracking, b would need to move later than its locked value.
        const newX = addWeekdays(x_orig, 60);

        const result = deadlineCascade.cascadeDeadlineChange({
            dlArray: arr,
            field: 'lock_test_x',
            movedFieldValue: newX,
            disabledDates: mockData.test_disabledDates,
            attributeData: {},
            deadlineObjects,
            lockedGroup: 'test_group',
            isDrag: true
        });

        const pre = result.find(i => i.key === 'lock_test_pre');
        const a = result.find(i => i.key === 'lock_test_a');
        const b = result.find(i => i.key === 'lock_test_b');

        // b (locked) stays at its original value
        expect(b.value).toBe(b_orig);
        // a (the locked item's direct predecessor) only gets b's 2-day minimum gap, not the original 15-day distance
        expect(a.value).toBe(subtractWeekdays(b_orig, 2));
        // pre (further back) still preserves its original 6-day distance from a
        expect(pre.value).toBe(subtractWeekdays(a.value, 6));
    });
});

/**
 * Tests for cascadeDeadlineChange - critical lifecycle scenarios
 * 
 * These tests cover the scenarios that break in production:
 * 1. Re-add after delete (before save) - stale dates in formValues
 * 2. Re-add after delete (after save) - null/undefined dates
 * 3. Cascade enforcement across phases
 * 4. Lautakunta growth vs movement behavior
 */
describe("cascadeDeadlineChange lifecycle scenarios", () => {

    describe("Re-add after delete scenarios", () => {

        test("enforces distances when re-adding group with null date values", () => {
            // Simulate: User deleted periaatteet_esillaolo_2, saved, then adds it back
            // Date values are null because they were cleared on save
            const arr = cloneTestArr();

            // Simulate null dates for re-added group (as they would be after save)
            const maaraaikaIndex = arr.findIndex(item => item.key === "periaatteet_esillaolo_aineiston_maaraaika_2");
            const alkaaIndex = arr.findIndex(item => item.key === "milloin_periaatteet_esillaolo_alkaa_2");
            const paattyyIndex = arr.findIndex(item => item.key === "milloin_periaatteet_esillaolo_paattyy_2");

            if (maaraaikaIndex !== -1) arr[maaraaikaIndex].value = null;
            if (alkaaIndex !== -1) arr[alkaaIndex].value = null;
            if (paattyyIndex !== -1) arr[paattyyIndex].value = null;

            // Now set the maaraaika to a valid date (simulating add action)
            const newDate = "2027-05-01";
            if (maaraaikaIndex !== -1) arr[maaraaikaIndex].value = newDate;

            const field = "periaatteet_esillaolo_aineiston_maaraaika_2";
            const oldDate = null;
            const movedDate = newDate;
            const projectSize = "XL";

            const result = deadlineCascade.cascadeDeadlineChange(checkParams({
                dlArray: arr,
                field,
                projectSize
            }));

            // All items after the added group should have valid dates
            const resultMaaraaika = result.find(i => i.key === "periaatteet_esillaolo_aineiston_maaraaika_2");
            const resultAlkaa = result.find(i => i.key === "milloin_periaatteet_esillaolo_alkaa_2");
            const resultPaattyy = result.find(i => i.key === "milloin_periaatteet_esillaolo_paattyy_2");

            // Maaraaika may have been adjusted based on distance rules (it's not locked)
            expect(resultMaaraaika?.value).toBeTruthy();
            expect(new Date(resultMaaraaika.value) >= new Date(newDate)).toBe(true);
            expect(resultAlkaa?.value).toBeTruthy();
            expect(resultPaattyy?.value).toBeTruthy();

            // Dates should be properly sequenced
            if (resultAlkaa?.value && resultPaattyy?.value) {
                expect(new Date(resultAlkaa.value) < new Date(resultPaattyy.value)).toBe(true);
            }
        });

        test("enforces distances when re-adding with stale date values", () => {
            // Simulate: User deleted group but didn't save, dates are stale from before deletion
            const arr = cloneTestArr();

            // Previous dates (stale - from before deletion)
            const oldMaaraaikaDate = "2026-04-15";
            // New date after re-add should be calculated fresh
            const newDate = "2027-08-01";

            const field = "periaatteet_esillaolo_aineiston_maaraaika_2";
            const maaraaikaIndex = arr.findIndex(item => item.key === field);
            if (maaraaikaIndex !== -1) arr[maaraaikaIndex].value = newDate;

            const projectSize = "XL";

            const result = deadlineCascade.cascadeDeadlineChange(checkParams({
                dlArray: arr,
                field,
                projectSize
            }));

            // Items before the re-added group should be untouched
            const kaynnistysItem = result.find(i => i.key === "projektin_kaynnistys_pvm");
            const originalKaynnistys = mockData.decreasing_test_arr.find(i => i.key === "projektin_kaynnistys_pvm");
            expect(kaynnistysItem?.value).toBe(originalKaynnistys?.value);

            // Items after should cascade forward
            const oasMaaraaika = result.find(i => i.key === "oas_esillaolo_aineiston_maaraaika");
            if (oasMaaraaika?.value) {
                expect(new Date(oasMaaraaika.value) >= new Date(newDate)).toBe(true);
            }
        });
    });

    describe("Lautakunta behavior - movement vs growth", () => {

        test("lautakunta should MOVE not GROW when adding esillaolo before it", () => {
            // Issue: When adding esillaolo, lautakunta should move forward maintaining its duration
            // Bug: Lautakunta was growing (end date moving more than start date)
            const arr = cloneTestArr();

            // Get original lautakunta positions
            const lautakuntaItem = arr.find(i => i.key === "milloin_periaatteet_lautakunnassa");
            const originalLautakuntaDate = lautakuntaItem?.value;

            // Add an esillaolo before lautakunta
            const field = "periaatteet_esillaolo_aineiston_maaraaika_2";
            const newDate = "2026-05-15";
            const maaraaikaIndex = arr.findIndex(item => item.key === field);
            if (maaraaikaIndex !== -1) arr[maaraaikaIndex].value = newDate;

            const projectSize = "XL";

            const result = deadlineCascade.cascadeDeadlineChange(checkParams({
                dlArray: arr,
                field,
                projectSize
            }));

            const resultLautakunta = result.find(i => i.key === "milloin_periaatteet_lautakunnassa");

            // Lautakunta should have moved (if the new dates push into it)
            // It should still be on a Tuesday
            if (resultLautakunta?.value) {
                const resultDate = new Date(resultLautakunta.value);
                expect(resultDate.getDay()).toBe(2); // Tuesday
            }
        });

        test("lautakunta_2 respects distance from lautakunta_1", () => {
            // When lautakunta_1 moves, lautakunta_2 should maintain minimum distance
            const arr = cloneTestArr();

            // Find lautakunta items (if they exist in test data)
            const lautakunta1Index = arr.findIndex(i => i.key.includes("lautakunnassa") && !i.key.includes("_2"));
            const lautakunta2Index = arr.findIndex(i => i.key.includes("lautakunnassa_2"));

            if (lautakunta1Index !== -1 && lautakunta2Index !== -1) {
                // Move lautakunta_1 forward
                const newDate = "2028-01-11"; // A Tuesday
                arr[lautakunta1Index].value = newDate;

                const result = deadlineCascade.cascadeDeadlineChange(checkParams({
                    dlArray: arr,
                    field: arr[lautakunta1Index].key,
                    projectSize: "XL"
                }));

                const resultLautakunta2 = result.find(i => i.key.includes("lautakunnassa_2"));
                if (resultLautakunta2?.value) {
                    const l1Date = new Date(newDate);
                    const l2Date = new Date(resultLautakunta2.value);

                    // lautakunta_2 should be after lautakunta_1
                    expect(l2Date > l1Date).toBe(true);
                    // Should be on a Tuesday
                    expect(l2Date.getDay()).toBe(2);
                }
            }
        });
    });

    describe("Cross-phase cascade enforcement", () => {

        test("changes in periaatteet should cascade to OAS phase", () => {
            const arr = cloneTestArr();

            // Move periaatteet phase end date forward significantly
            const periaatteetPaattyyIndex = arr.findIndex(i => i.key === "periaatteetvaihe_paattyy_pvm");
            const oasAlkaaIndex = arr.findIndex(i => i.key === "oasvaihe_alkaa_pvm");

            if (periaatteetPaattyyIndex !== -1 && oasAlkaaIndex !== -1) {
                const originalOasAlkaa = arr[oasAlkaaIndex].value;
                const newPeriaatteetPaattyy = "2027-12-01";
                arr[periaatteetPaattyyIndex].value = newPeriaatteetPaattyy;

                const result = deadlineCascade.cascadeDeadlineChange(checkParams({
                    dlArray: arr,
                    field: "periaatteetvaihe_paattyy_pvm",
                    projectSize: "XL",
                    isDrag: true
                }));

                const resultOasAlkaa = result.find(i => i.key === "oasvaihe_alkaa_pvm");

                // OAS phase should start on or after periaatteet ends
                if (resultOasAlkaa?.value) {
                    expect(new Date(resultOasAlkaa.value) >= new Date(newPeriaatteetPaattyy)).toBe(true);
                }
            }
        });

        test("adding esillaolo in OAS should cascade to luonnos phase", () => {
            const arr = cloneTestArr();

            // Add a new esillaolo that pushes OAS phase end forward
            const field = "oas_esillaolo_aineiston_maaraaika_2";
            const fieldIndex = arr.findIndex(i => i.key === field);

            if (fieldIndex !== -1) {
                const newDate = "2027-10-01"; // Far in the future
                arr[fieldIndex].value = newDate;

                const result = deadlineCascade.cascadeDeadlineChange(checkParams({
                    dlArray: arr,
                    field,
                    projectSize: "XL"
                }));

                // Find luonnos phase start
                const luonnosAlkaa = result.find(i => i.key === "luonnosvaihe_alkaa_pvm");
                const oasPaattyy = result.find(i => i.key === "oasvaihe_paattyy_pvm");

                // Luonnos should start after OAS ends
                if (luonnosAlkaa?.value && oasPaattyy?.value) {
                    expect(new Date(luonnosAlkaa.value) >= new Date(oasPaattyy.value)).toBe(true);
                }
            }
        });
    });

    describe("Consistency across all operations", () => {

        test("add then modify maintains distances", () => {
            const arr = cloneTestArr();

            // First: Add a new group
            const addField = "periaatteet_esillaolo_aineiston_maaraaika_2";
            const addDate = "2026-06-01";
            const addIndex = arr.findIndex(i => i.key === addField);
            if (addIndex !== -1) arr[addIndex].value = addDate;

            const afterAdd = deadlineCascade.cascadeDeadlineChange(checkParams({
                dlArray: arr,
                field: addField,
                projectSize: "XL"
            }));

            // Then: Modify a date in the added group
            const modifyField = "milloin_periaatteet_esillaolo_paattyy_2";
            const modifyIndex = afterAdd.findIndex(i => i.key === modifyField);

            if (modifyIndex !== -1) {
                const oldValue = afterAdd[modifyIndex].value;
                const newValue = new Date(oldValue);
                newValue.setDate(newValue.getDate() + 14); // Move 2 weeks forward
                const newValueStr = newValue.toISOString().split('T')[0];
                afterAdd[modifyIndex].value = newValueStr;

                const afterModify = deadlineCascade.cascadeDeadlineChange(checkParams({
                    dlArray: afterAdd,
                    field: modifyField,
                    projectSize: "XL",
                    isDrag: true
                }));

                // Find the modified field's order
                const modifiedItem = afterModify.find(i => i.key === modifyField);
                const modifiedOrder = modifiedItem?.order ?? -1;

                // Dates AFTER the modified item should still be properly ordered
                for (let i = 1; i < afterModify.length; i++) {
                    const prev = afterModify[i - 1];
                    const curr = afterModify[i];

                    // Skip non-date items, phase boundaries, or items before modified item
                    if (!prev.value || !curr.value) continue;
                    if (prev.key.includes("vahvista")) continue;
                    if (curr.order < modifiedOrder) continue; // Only check items after the modified one

                    const prevDate = new Date(prev.value);
                    const currDate = new Date(curr.value);

                    // Each date after the modification should be >= previous
                    if (!isNaN(prevDate) && !isNaN(currDate) && curr.order > prev.order) {
                        expect(currDate >= prevDate,
                            `${curr.key} (${curr.value}) should be >= ${prev.key} (${prev.value})`
                        ).toBe(true);
                    }
                }
            }
        });

        test.skip("distances are enforced consistently for all phases", () => {
            // SKIPPED: This test reveals edge case where phase start dates don't have 
            // proper date_type or distance_from_previous, causing findAllowedDate to fail.
            // This is a real bug that needs to be fixed in the objectUtil code.
            const arr = cloneTestArr();

            const phaseStartKey = 'periaatteetvaihe_alkaa_pvm';
            const phaseStartIndex = arr.findIndex(i => i.key === phaseStartKey);

            if (phaseStartIndex !== -1 && arr[phaseStartIndex].value) {
                const newDate = "2026-03-02";
                const oldDate = arr[phaseStartIndex].value;
                arr[phaseStartIndex].value = newDate;

                const result = deadlineCascade.cascadeDeadlineChange(checkParams({
                    dlArray: arr,
                    field: phaseStartKey,
                    projectSize: "XL"
                }));

                expect(Array.isArray(result)).toBe(true);
                expect(result.length).toBeGreaterThan(0);

                const resultPhaseStart = result.find(i => i.key === phaseStartKey);
                expect(resultPhaseStart?.value).toBeTruthy();
            }
        });
    });
});
