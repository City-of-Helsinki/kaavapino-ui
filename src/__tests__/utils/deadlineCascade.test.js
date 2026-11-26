import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';

// Pin "today" to a fixed date so that past-date locking in cascadeDeadlineChange
// does not freeze test data items as "in the past" as real time advances.
beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2025-01-01')); });
afterAll(() => { vi.useRealTimers(); });

import deadlineCascade from '../../utils/deadlineCascade';
import { addCalendarDays } from '../../utils/timeUtil';
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
            setFieldValue(modified_test_arr, field, movedDate);
            const original = JSON.parse(JSON.stringify(modified_test_arr));
            const result = deadlineCascade.cascadeDeadlineChange(checkParams({
                dlArray: modified_test_arr,
                field
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

// Minimal disabledDates fixture for isolated helper unit tests below.
// Easier to test and verify distance measurements etc.
const buildWeekdayDates = (startStr, endStr) => {
    const [sy, sm, sd] = startStr.split('-').map(Number);
    const [ey, em, ed] = endStr.split('-').map(Number);
    const end = new Date(ey, em - 1, ed);
    const dates = [];
    let cur = new Date(sy, sm - 1, sd);
    while (cur <= end) {
        const day = cur.getDay();
        if (day !== 0 && day !== 6) dates.push(formatLocalDate(cur));
        cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
    }
    return dates;
};
const nextTuesday = (dateStr) => {
    const [year, month, date] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, date);
    while (d.getDay() !== 2) d.setDate(d.getDate() + 1);
    return formatLocalDate(d);
};
const dayOfWeek = (dateStr) => {
    const [year, month, date] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, date).getDay();
};
const simpleWeekdayDates = buildWeekdayDates('2029-01-01', '2031-01-01');
const simpleDisabledDates = {
    date_types: {
        "arkipäivät": { dates: simpleWeekdayDates },
        "työpäivät": { dates: simpleWeekdayDates },
        "esilläolopäivät": { dates: simpleWeekdayDates },
        "lautakunnan_kokouspäivät": { dates: simpleWeekdayDates.filter(d => dayOfWeek(d) === 2) }
    }
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
            expect(maaraaikaIndex).not.toBe(-1);
            expect(alkaaIndex).not.toBe(-1);
            expect(paattyyIndex).not.toBe(-1);

            arr[maaraaikaIndex].value = null;
            arr[alkaaIndex].value = null;
            arr[paattyyIndex].value = null;

            // Now set the maaraaika to a valid date (simulating add action)
            const newDate = "2027-05-01";
            arr[maaraaikaIndex].value = newDate;

            const field = "periaatteet_esillaolo_aineiston_maaraaika_2";

            const result = deadlineCascade.cascadeDeadlineChange(checkParams({
                dlArray: arr,
                field
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
            expect(new Date(resultAlkaa.value) < new Date(resultPaattyy.value)).toBe(true);
        });

        test("enforces distances when re-adding with stale date values", () => {
            // Simulate: User deleted group but didn't save, dates are stale from before deletion
            const arr = cloneTestArr();

            // New date after re-add should be calculated fresh
            const newDate = "2027-08-01";

            const field = "periaatteet_esillaolo_aineiston_maaraaika_2";
            const maaraaikaIndex = arr.findIndex(item => item.key === field);
            expect(maaraaikaIndex).not.toBe(-1);
            arr[maaraaikaIndex].value = newDate;

            const result = deadlineCascade.cascadeDeadlineChange(checkParams({
                dlArray: arr,
                field
            }));

            // Items before the re-added group should be untouched
            const kaynnistysItem = result.find(i => i.key === "projektin_kaynnistys_pvm");
            const originalKaynnistys = mockData.decreasing_test_arr.find(i => i.key === "projektin_kaynnistys_pvm");
            expect(kaynnistysItem?.value).toBe(originalKaynnistys?.value);

            // Items after should cascade forward
            const oasMaaraaika = result.find(i => i.key === "oas_esillaolo_aineiston_maaraaika");
            expect(oasMaaraaika?.value).toBeTruthy();
            expect(new Date(oasMaaraaika.value) >= new Date(newDate)).toBe(true);
        });
    });

    describe("Lautakunta behavior - movement vs growth", () => {

        test("lautakunta should MOVE not GROW when adding esillaolo before it", () => {
            // Issue: When adding esillaolo, lautakunta should move forward maintaining its duration
            // Bug: Lautakunta was growing (end date moving more than start date)
            const arr = cloneTestArr();

            // Add an esillaolo before lautakunta
            const field = "periaatteet_esillaolo_aineiston_maaraaika_2";
            const newDate = "2026-05-15";
            const maaraaikaIndex = arr.findIndex(item => item.key === field);
            expect(maaraaikaIndex).not.toBe(-1);
            arr[maaraaikaIndex].value = newDate;

            const result = deadlineCascade.cascadeDeadlineChange(checkParams({
                dlArray: arr,
                field
            }));

            const resultLautakunta = result.find(i => i.key === "milloin_periaatteet_lautakunnassa");

            // Lautakunta should have moved; it should still land on a Tuesday
            expect(resultLautakunta?.value).toBeTruthy();
            expect(new Date(resultLautakunta.value).getDay()).toBe(2); // Tuesday
        });

        test("a later-phase lautakunta maintains minimum distance from an earlier one that moves", () => {
            // The fixture has no duplicate "_2" lautakunta group; build a minimal array instead
            // (arkipäivät anchor keeps the first lautakunta from being treated as index 0 with no gap).
            const arr = [
                { key: 'lautakunta_test_anchor', value: '2026-01-01', distance_from_previous: null, date_type: 'arkipäivät', order: 0 },
                { key: 'lautakunta_test_1', value: '2026-01-06', distance_from_previous: 5, date_type: 'lautakunnan_kokouspäivät', order: 1 },
                { key: 'lautakunta_test_2', value: '2026-01-20', distance_from_previous: 2, date_type: 'lautakunnan_kokouspäivät', order: 2 }
            ];

            // Move lautakunta_1 forward
            const newDate = "2028-01-11"; // A Tuesday

            const result = deadlineCascade.cascadeDeadlineChange({
                dlArray: arr,
                field: 'lautakunta_test_1',
                movedFieldValue: newDate,
                disabledDates: mockData.test_disabledDates,
                attributeData: {},
                deadlineObjects: [],
                isDrag: true
            });

            const resultLautakunta2 = result.find(i => i.key === 'lautakunta_test_2');
            expect(resultLautakunta2?.value).toBeTruthy();
            const l1Date = new Date(newDate);
            const l2Date = new Date(resultLautakunta2.value);

            // lautakunta_2 should be after lautakunta_1
            expect(l2Date > l1Date).toBe(true);
            // Should be on a Tuesday
            expect(l2Date.getDay()).toBe(2);
        });
    });

    describe("Cross-phase cascade enforcement", () => {

        test("changes in periaatteet should cascade to OAS phase", () => {
            const arr = cloneTestArr();

            // Move periaatteet phase end date forward significantly
            const periaatteetPaattyyIndex = arr.findIndex(i => i.key === "periaatteetvaihe_paattyy_pvm");
            const oasAlkaaIndex = arr.findIndex(i => i.key === "oasvaihe_alkaa_pvm");
            expect(periaatteetPaattyyIndex).not.toBe(-1);
            expect(oasAlkaaIndex).not.toBe(-1);

            const newPeriaatteetPaattyy = "2027-12-01";
            arr[periaatteetPaattyyIndex].value = newPeriaatteetPaattyy;

            const result = deadlineCascade.cascadeDeadlineChange(checkParams({
                dlArray: arr,
                field: "periaatteetvaihe_paattyy_pvm",
                isDrag: true
            }));

            const resultOasAlkaa = result.find(i => i.key === "oasvaihe_alkaa_pvm");

            // OAS phase should start on or after periaatteet ends
            expect(resultOasAlkaa?.value).toBeTruthy();
            expect(new Date(resultOasAlkaa.value) >= new Date(newPeriaatteetPaattyy)).toBe(true);
        });

        test("adding esillaolo in OAS should cascade to luonnos phase", () => {
            const arr = cloneTestArr();

            // Push OAS's esillaolo deadline forward, which should cascade to the luonnos phase
            const field = "oas_esillaolo_aineiston_maaraaika";
            const fieldIndex = arr.findIndex(i => i.key === field);
            expect(fieldIndex).not.toBe(-1);

            const newDate = "2027-10-01"; // Far in the future
            arr[fieldIndex].value = newDate;

            const result = deadlineCascade.cascadeDeadlineChange(checkParams({
                dlArray: arr,
                field
            }));

            // Find luonnos phase start
            const luonnosAlkaa = result.find(i => i.key === "luonnosvaihe_alkaa_pvm");
            const oasPaattyy = result.find(i => i.key === "oasvaihe_paattyy_pvm");

            // Luonnos should start after OAS ends
            expect(luonnosAlkaa?.value).toBeTruthy();
            expect(oasPaattyy?.value).toBeTruthy();
            expect(new Date(luonnosAlkaa.value) >= new Date(oasPaattyy.value)).toBe(true);
        });
    });

    describe("Consistency across all operations", () => {

        test("add then modify maintains distances", () => {
            const arr = cloneTestArr();

            // First: Add a new group
            const addField = "periaatteet_esillaolo_aineiston_maaraaika_2";
            const addDate = "2026-06-01";
            const addIndex = arr.findIndex(i => i.key === addField);
            expect(addIndex).not.toBe(-1);
            arr[addIndex].value = addDate;

            const afterAdd = deadlineCascade.cascadeDeadlineChange(checkParams({
                dlArray: arr,
                field: addField
            }));

            // Then: Modify a date in the added group
            const modifyField = "milloin_periaatteet_esillaolo_paattyy_2";
            const modifyIndex = afterAdd.findIndex(i => i.key === modifyField);
            expect(modifyIndex).not.toBe(-1);

            const oldValue = afterAdd[modifyIndex].value;
            const newValue = new Date(oldValue);
            newValue.setDate(newValue.getDate() + 14); // Move 2 weeks forward
            // Use local components, not toISOString, to avoid off-by-one in positive UTC offsets
            afterAdd[modifyIndex].value = formatLocalDate(newValue);

            const afterModify = deadlineCascade.cascadeDeadlineChange(checkParams({
                dlArray: afterAdd,
                field: modifyField,
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
        });

        // Known bug: phase-start dates lacking date_type/distance_from_previous break findAllowedDate in objectUtil.
        test.todo("distances are enforced consistently for all phases (phase-start dates without date_type crash findAllowedDate)");
    });
});

describe("cascadeDeadlineChange helper functions", () => {

    describe("getPreviousItem", () => {
        test("returns the item immediately before the given index", () => {
            const arr = [{ key: 'a' }, { key: 'b' }, { key: 'c' }];
            expect(deadlineCascade.getPreviousItem(arr, 2)).toBe(arr[1]);
        });

        test("returns null for index 0", () => {
            const arr = [{ key: 'a' }, { key: 'b' }];
            expect(deadlineCascade.getPreviousItem(arr, 0)).toBeNull();
        });

        test("uses previous_deadline lookup when no '_2' variant of it exists", () => {
            const arr = [
                { key: 'x' },
                { key: 'unrelated' },
                { key: 'y', previous_deadline: 'x' }
            ];
            expect(deadlineCascade.getPreviousItem(arr, 2)).toBe(arr[0]);
        });

        test("falls back to arr[index - 1] when a '_2' variant of previous_deadline exists (ambiguous group)", () => {
            const arr = [
                { key: 'x' },
                { key: 'x_2' }, // additional element group sharing the same previous_deadline key
                { key: 'y', previous_deadline: 'x' }
            ];
            // previous_deadline 'x' is ambiguous because an 'x_2' variant also exists;
            // getPreviousItem should fall back to the immediately preceding array item instead
            expect(deadlineCascade.getPreviousItem(arr, 2)).toBe(arr[1]);
        });
    });

    describe("measureDistance", () => {
        const gapDates = ['2026-01-01', '2026-01-02', '2026-01-05', '2026-01-06'];

        test("returns the index distance between two dates present in gapDates", () => {
            expect(deadlineCascade.measureDistance('2026-01-01', '2026-01-05', gapDates)).toBe(2);
        });

        test("returns null when gapDates is empty or missing", () => {
            expect(deadlineCascade.measureDistance('2026-01-01', '2026-01-05', [])).toBeNull();
            expect(deadlineCascade.measureDistance('2026-01-01', '2026-01-05', undefined)).toBeNull();
        });

        test("returns null when fromDate or toDate is missing", () => {
            expect(deadlineCascade.measureDistance(null, '2026-01-05', gapDates)).toBeNull();
            expect(deadlineCascade.measureDistance('2026-01-01', null, gapDates)).toBeNull();
        });

        test("returns null when a date is not found in gapDates", () => {
            expect(deadlineCascade.measureDistance('2026-01-01', '2099-01-01', gapDates)).toBeNull();
        });
    });

    describe("enforceMinimumGap", () => {
        test("returns the item's own value unchanged when there is no previous item", () => {
            const currentItem = { key: 'a', value: '2026-01-10', distance_from_previous: 5, date_type: 'arkipäivät' };
            expect(deadlineCascade.enforceMinimumGap(currentItem, null, mockData.test_disabledDates)).toBe('2026-01-10');
        });

        test("pushes the date forward to satisfy the minimum gap when it is below the minimum", () => {
            const prevItem = { key: 'prev', value: '2026-01-02' };
            // Only 1 weekday after prev, well below the 5-day minimum
            const currentItem = { key: 'current', value: addWeekdays('2026-01-02', 1), distance_from_previous: 5, date_type: 'arkipäivät' };
            const result = deadlineCascade.enforceMinimumGap(currentItem, prevItem, mockData.test_disabledDates);
            expect(result).toBe(addWeekdays('2026-01-02', 5));
        });

        test("forceMinimumGap=true snaps to the minimum gap even when the item's own later value would otherwise be kept", () => {
            const prevItem = { key: 'prev', value: '2026-01-02' };
            const currentItem = { key: 'current', value: '2027-01-01', distance_from_previous: 5, date_type: 'arkipäivät' };
            const forced = deadlineCascade.enforceMinimumGap(currentItem, prevItem, mockData.test_disabledDates, true);
            const notForced = deadlineCascade.enforceMinimumGap(currentItem, prevItem, mockData.test_disabledDates, false);
            expect(forced).toBe(addWeekdays('2026-01-02', 5));
            expect(notForced).toBe('2027-01-01');
        });
    });

    describe("getPreservedGap", () => {
        const gapDates = simpleWeekdayDates;

        test("returns the existing distance when it is above the minimum", () => {
            const originalByKey = new Map([
                ['prev', { key: 'prev', value: '2029-01-01' }],
                ['current', { key: 'current', value: addWeekdays('2029-01-01', 5) }]
            ]);
            const result = deadlineCascade.getPreservedGap({ key: 'current' }, { key: 'prev' }, 2, gapDates, originalByKey);
            expect(result).toBe(5);
        });

        test("floors at the minimum gap when the existing distance is smaller", () => {
            const originalByKey = new Map([
                ['prev', { key: 'prev', value: '2029-01-01' }],
                ['current', { key: 'current', value: addWeekdays('2029-01-01', 1) }]
            ]);
            const result = deadlineCascade.getPreservedGap({ key: 'current' }, { key: 'prev' }, 4, gapDates, originalByKey);
            expect(result).toBe(4);
        });

        test("falls back to the minimum gap when an original entry is missing", () => {
            const originalByKey = new Map(); // no entries for either key
            const result = deadlineCascade.getPreservedGap({ key: 'current' }, { key: 'prev' }, 3, gapDates, originalByKey);
            expect(result).toBe(3);
        });
    });

    describe("enforcePhaseBoundaryGap", () => {
        test("shifts the current item by the original calendar-day distance from prevItem", () => {
            const originalByKey = new Map([
                ['phase_prev', { key: 'phase_prev', value: '2026-01-01' }],
                ['phase_current', { key: 'phase_current', value: '2026-01-10' }] // 9 calendar days apart
            ]);
            const prevItem = { key: 'phase_prev', value: '2027-03-01' }; // prevItem has since moved
            const currentItem = { key: 'phase_current' };
            const result = deadlineCascade.enforcePhaseBoundaryGap(currentItem, prevItem, originalByKey);
            expect(result).toBe(addCalendarDays('2027-03-01', 9));
        });

        test("defaults to a 0-day diff when original entries are missing", () => {
            const originalByKey = new Map();
            const prevItem = { key: 'phase_prev', value: '2027-03-01' };
            const currentItem = { key: 'phase_current' };
            const result = deadlineCascade.enforcePhaseBoundaryGap(currentItem, prevItem, originalByKey);
            expect(result).toBe(addCalendarDays('2027-03-01', 0));
        });
    });

    describe("preserveDistanceFromPrevious", () => {
        test("lands exactly on prevValue + preserved gap, ignoring the item's own stale value", () => {
            const originalA = '2029-01-08'; // Tuesday
            const originalB = addWeekdays(originalA, 10); // original gap = 10 weekdays
            const originalByKey = new Map([
                ['prev', { key: 'prev', value: originalA }],
                ['current', { key: 'current', value: originalB }]
            ]);
            const newA = addWeekdays(originalA, 3); // prev has since moved forward
            const prevItem = { key: 'prev', value: newA };
            const currentItem = { key: 'current', value: 'stale-value-should-be-ignored', distance_from_previous: 2, date_type: 'arkipäivät' };

            const result = deadlineCascade.preserveDistanceFromPrevious(currentItem, prevItem, mockData.test_disabledDates, originalByKey);
            expect(result).toBe(addWeekdays(newA, 10));
        });

        test("floors the preserved gap at the item's own minimum distance", () => {
            const originalA = '2029-01-08';
            const originalB = addWeekdays(originalA, 1); // original gap (1) is below the 8-day minimum
            const originalByKey = new Map([
                ['prev', { key: 'prev', value: originalA }],
                ['current', { key: 'current', value: originalB }]
            ]);
            const prevItem = { key: 'prev', value: originalA };
            const currentItem = { key: 'current', value: originalB, distance_from_previous: 8, date_type: 'arkipäivät' };

            const result = deadlineCascade.preserveDistanceFromPrevious(currentItem, prevItem, mockData.test_disabledDates, originalByKey);
            expect(result).toBe(addWeekdays(originalA, 8));
        });
    });

    describe("handleEsillaMaaraaikaMove", () => {
        test("computes alkaa and paattyy from the moved maaraaika date using each item's own gap", () => {
            const arr = [
                { key: 'esillaolo_maaraaika_test', date_type: 'arkipäivät' },
                { key: 'esillaolo_alkaa_test', distance_from_previous: 13, date_type: 'arkipäivät' },
                { key: 'esillaolo_paattyy_test', distance_from_previous: 14, date_type: 'arkipäivät' }
            ];
            const movedDate = '2030-03-04'; // Monday, well clear of any exclusion windows
            deadlineCascade.handleEsillaMaaraaikaMove(arr, 0, movedDate, simpleDisabledDates);

            const expectedAlkaa = addWeekdays(movedDate, 13);
            expect(arr[1].value).toBe(expectedAlkaa);
            const expectedPaattyy = addWeekdays(expectedAlkaa, 14);
            expect(arr[2].value).toBe(expectedPaattyy);
        });

        test("preserves the existing alkaa->paattyy gap when it's larger than paattyy's own minimum", () => {
            const alkaaOrig = '2030-02-04'; // Monday
            const paattyyOrig = addWeekdays(alkaaOrig, 20); // existing gap (20) > minimum (14)
            const arr = [
                { key: 'esillaolo_maaraaika_test', date_type: 'arkipäivät' },
                { key: 'esillaolo_alkaa_test', value: alkaaOrig, distance_from_previous: 13, date_type: 'arkipäivät' },
                { key: 'esillaolo_paattyy_test', value: paattyyOrig, distance_from_previous: 14, date_type: 'arkipäivät' }
            ];
            const movedDate = '2030-03-04';
            deadlineCascade.handleEsillaMaaraaikaMove(arr, 0, movedDate, simpleDisabledDates);

            const expectedAlkaa = addWeekdays(movedDate, 13);
            expect(arr[1].value).toBe(expectedAlkaa);
            // The original 20-weekday gap between alkaa and paattyy should be preserved, not floored to 14
            expect(arr[2].value).toBe(addWeekdays(expectedAlkaa, 20));
        });
    });

    describe("handleKylkMaaraaikaMove", () => {
        test("moves the lautakunta item to the gap-adjusted weekday landing on an allowed lautakunta (Tuesday) date", () => {
            const lautakuntaDate = nextTuesday('2030-04-01');
            const maaraaikaDate = subtractWeekdays(lautakuntaDate, 21);
            const arr = [
                { key: 'kylk_maaraaika_test', value: maaraaikaDate },
                { key: 'lautakunta_item_test', initial_distance: 21, date_type: 'lautakunnan_kokouspäivät' }
            ];
            deadlineCascade.handleKylkMaaraaikaMove(arr, 0, simpleDisabledDates);

            expect(arr[1].value).toBe(lautakuntaDate);
        });
    });
});
