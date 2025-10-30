import { describe, test, expect } from 'vitest';
import objectUtil from '../../utils/objectUtil';
import mockData from './checkForDecreasingValues_test_data.js';

const test_objects = [
    {"content": "Käynnistys", "attributegroup": "kaynnistys_1", "name": "kaynnistys_alkaa_pvm"},
    {"content": "Esilläolo-2", "attributegroup": "oas_esillaolokerta_2", "name": "milloin_oas_esillaolo_alkaa_2"},
    {"content": "Esilläolo-3", "attributegroup": "periaatteet_esillaolokerta_3", "name": "milloin_periaatteet_esillaolo_alkaa_3"},
    {"content": "Lautakunta-1", "attributegroup": "luonnos_lautakuntakerta_1", "name": "milloin_kaavaluonnos_lautakunnassa"},
    {"content": "Esilläolo-1", "attributegroup": "oas_esillaolokerta_1", "name": "milloin_oas_esillaolo_alkaa_1"},
];

describe("Test ObjectUtil utility functions", () => {

    test("getHighestNumberedObject returns null on empty input", ()=> {
        expect(objectUtil.getHighestNumberedObject([])).toBeNull();
    });

    test("getHighestNumberedObject returns the correct object", () => {
        const result = objectUtil.getHighestNumberedObject(test_objects);
        expect(result?.content).toEqual("Esilläolo-3");
    });

    test("getMinObject returns null or undefined for invalid objects", ()=> {
        expect(objectUtil.getMinObject({})).toBeNull();
        expect(objectUtil.getMinObject({"test": []})).toBeNull();
        expect(objectUtil.getMinObject({"test": [{}]})).toBeUndefined();
    });
    
    test("getMinObject correct string from valid object", ()=> {
        const test_object = {
            "section": [
                { "name": "testname", "label" : "testLabel"},{ "name": "testname2", "label" : "testLabel2"}
            ],
            "otherdata": "data"
        };
        expect(objectUtil.getMinObject(test_object)).toBe("testname");
    });

    test("getNumberFromString returns null for an empty object", ()=> {
        expect(objectUtil.getNumberFromString([])).toBeNull();
    });

    test("getNumberFromString returns the highest number from valid object", ()=> {
        expect(objectUtil.getNumberFromString(test_objects).attributegroup)
            .toBe("periaatteet_esillaolokerta_3");
    });

    test("findValuesWithStrings return the correct object", () => {
        const result = objectUtil.findValuesWithStrings(test_objects, "milloin", "oas", "esillaolo", "alkaa");
        expect(result?.name).toEqual("milloin_oas_esillaolo_alkaa_2");
    });

    test("generateDateStringArray returns empty array for invalid input", () => {
        expect(objectUtil.generateDateStringArray({})).toEqual([]);
    });

    test("generateDateStringArray returns correct array for valid input", () => {
        const test_data = {
            "date_1": "2023-01-01",
            "date_2": "not-a-date",
            "date_3": "2024-12-31",
        };
        const result_data = objectUtil.generateDateStringArray(test_data);
        expect(result_data?.length).toBe(2);
        expect(result_data[0]).toEqual({key: "date_1", value: "2023-01-01"});
        expect(result_data[1]).toEqual({key: "date_3", value: "2024-12-31"});
    });

    test("increasePhaseValues handles empty and single-item arrays", () => {
        expect(objectUtil.increasePhaseValues([])).toEqual([]);
        const single_item = [{ key: "some_date", value: "2024-01-01"}];
        expect(objectUtil.increasePhaseValues(single_item)).toEqual(single_item);
    });

    test("increasePhaseValues updates phase start dates if they are before the previous phase end date", () => {
        const test_data = [
            { key: "projektin_kaynnistys_pvm", value: "2024-01-01"},
            { key: "kaynnistys_paattyy_pvm", value: "2023-12-01"},
            { key: "periaatteetvaihe_alkaa_pvm", value: "2022-06-01"},
            { key: "milloin_periaatteet_lautakunnassa", value: "2024-06-23"},
            { key: "periaatteetvaihe_paattyy_pvm", value: "2024-05-01"},
            { key: "oasvaihe_alkaa_pvm", value: "2024-05-01"},
            { key: "oasvaihe_paattyy_pvm", value: "2025-02-01"},
            { key: "luonnosvaihe_alkaa_pvm", value: "2025-03-03"},
        ];
        const result = objectUtil.increasePhaseValues(test_data);
        expect(result.length).toBe(test_data.length);
        expect(result[0].value).toBe("2024-01-01"); // Unchanged
        expect(result[1].value).toBe("2023-12-01"); // Unchanged despite being before start date
        expect(result[2].value).toBe("2023-12-01"); // Changed to match previous phase end date
        expect(result[3].value).toBe("2024-06-23"); // Unchanged (ignored)
        expect(result[4].value).toBe("2024-05-01"); // Unchanged (is end date)
        expect(result[5].value).toBe("2024-05-01"); // Unchanged (equals previous end date)
        expect(result[6].value).toBe("2025-02-01"); // Unchanged
        expect(result[7].value).toBe("2025-03-03"); // Unchanged (already after previous end date)
    });

    test("sortPhaseData sorts the array based on predefined order", () => {
        const test_data = [
            { key: "oasvaihe_paattyy_pvm", value: "2025-02-01"},
            { key: "projektin_kaynnistys_pvm", value: "2024-01-01"},
            { key: "periaatteetvaihe_alkaa_pvm", value: "2022-06-01"},
            { key: "kaynnistys_paattyy_pvm", value: "2023-12-01"},
            { key: "luonnosvaihe_alkaa_pvm", value: "2025-03-03"},
            { key: "periaatteetvaihe_paattyy_pvm", value: "2024-05-01"},
            { key: "oasvaihe_alkaa_pvm", value: "2024-05-01"},
        ];
        const result = objectUtil.sortPhaseData(test_data, objectUtil.expectedOrder);
        expect(result.length).toBe(test_data.length);
        for (let i = 0; i < test_data.length; i++) {
            expect(result[i].key).toBe(objectUtil.expectedOrder[i]);
        }
    });

    test("sortPhaseData handles items with 'order' property correctly", () => {
        const test_data = [
            { key: "oasvaihe_paattyy_pvm", value: "2025-02-01"},
            { key: "custom_item_1", value: "Custom 1", order: true},
            { key: "projektin_kaynnistys_pvm", value: "2024-01-01"},
            { key: "custom_item_2", value: "Custom 2", order: true},
            { key: "periaatteetvaihe_alkaa_pvm", value: "2022-06-01"},
            { key: "kaynnistys_paattyy_pvm", value: "2023-12-01"},
            { key: "luonnosvaihe_alkaa_pvm", value: "2025-03-03"},
            { key: "custom_item_3", value: "Custom 3", order: true},
            { key: "periaatteetvaihe_paattyy_pvm", value: "2024-05-01"},
            { key: "oasvaihe_alkaa_pvm", value: "2024-05-01"},
        ];
        const result = objectUtil.sortPhaseData(test_data, objectUtil.expectedOrder);
        expect(result.length).toBe(test_data.length);
        expect(result[0].key).toBe("custom_item_1");
        expect(result[1].key).toBe("custom_item_2");
        expect(result[2].key).toBe("custom_item_3");

        let result_index = 0;
        for (let i = 0; i < result.length; i++) {
            if (!result[i].key.startsWith("custom_item_")) {
                expect(result[i].key).toBe(objectUtil.expectedOrder[result_index]);
                result_index++;
            }
        }
    });

    test("compareAndUpdateArrays returns updated array", () => {
        const createSectionAttribute =(name, distanceVal=null, dateType=null) => ({
            name: name, distance_from_previous: distanceVal,
            distance_to_next: distanceVal,
            initial_distance: {distance: distanceVal},
            date_type: dateType
        });

        const test_sections = [
            {name: "Käynnistys", sections: [
                {"name": "1. Käynnistys", "attributes": [
                    createSectionAttribute("projektin_kaynnistys_pvm"),
                    createSectionAttribute("kaynnistys_paattyy_pvm"),
            ]},
            {name: "Periaatteet", "attributes": [
                createSectionAttribute("periaatteetvaihe_alkaa_pvm", 5),
                createSectionAttribute("milloin_periaatteet_lautakunnassa", 3, "työpäivät"),
            ]},
            {name: "OAS", "attributes": [
                createSectionAttribute("oasvaihe_alkaa_pvm", 1),
                createSectionAttribute("oasvaihe_paattyy_pvm", 7),
            ]},
        ]}];
        const arr1 = [
            { key: "milloin_periaatteet_lautakunnassa", value: "2023-06-01"},
            { key: "projektin_kaynnistys_pvm", value: "2023-01-01"},
        ];
        const arr2 = [
            { key: "oasvaihe_paattyy_pvm", value: "2024-06-01"}, // New date
            { key: "projektin_kaynnistys_pvm", value: "2023-01-01"}, // No change
            { key: "milloin_periaatteet_lautakunnassa", value: "2023-06-27"}, // Change
            { key: "aloituskokous_suunniteltu_pvm_readonly", value: "2023-06-27"} // Special case; exclude from result
        ];
        const result = objectUtil.compareAndUpdateArrays(arr1, arr2, test_sections);

        // Result should be ordered according to sections, with distance & date_type values copied
        // the values of arr1 are updated according to values in arr2
        // order field is the original order of arr1 items
        expect(result.length).toBe(3);
        expect(result[0]).toEqual({ 
            key: "projektin_kaynnistys_pvm", value: "2023-01-01", date_type: "arkipäivät",
            distance_to_next: null, distance_from_previous: null, initial_distance: null, order: 1});
        expect(result[1]).toEqual({ 
            key: "milloin_periaatteet_lautakunnassa", value: "2023-06-27", date_type: "työpäivät",
            distance_to_next: 3, distance_from_previous: 3, initial_distance: 3, order: 0});
        expect(result[2]).toEqual({ 
            key: "oasvaihe_paattyy_pvm", value: "2024-06-01", date_type: "arkipäivät",
            distance_to_next: 7, distance_from_previous: 7, initial_distance: 7, order: 2});
    });

    test("reverseIterateArray looks up the correct value from array", () => {
        const test_arr = [
            { key: "oasvaihe_alkaa_pvm", value: "2024-01-01"},
            { key: "milloin_oas_esillaolo_alkaa", value: "2024-01-03"},
            { key: "milloin_oas_esillaolo_paattyy", value: "2024-01-04"},
            { key: "oasvaihe_paattyy_pvm", value: "2024-01-05"},
            { key: "ehdotusvaihe_alkaa_pvm", value: "2024-01-06"},
            { key: "milloin_ehdotuksen_nahtavilla_alkaa_pieni", value: "2024-01-07"},
            { key: "ehdotusvaihe_paattyy_pvm", value: "2024-01-08"},
            { key: "tarkistettuehdotusvaihe_alkaa_pvm", value: "2024-01-09"},
            { key: "tarkistettu_ehdotus_kylk_maaraaika", value: "2024-01-10"},
            { key: "tarkistettuehdotusvaihe_paattyy_pvm", value: "2024-01-11" }
        ];

        expect(objectUtil.reverseIterateArray(test_arr, 3, "oas")).toBe("2024-01-04");
        expect(objectUtil.reverseIterateArray(test_arr, 8, "ehdotus")).toBe("2024-01-07");
        expect(objectUtil.reverseIterateArray(test_arr, 10, "tarkistettuehdotus")).toBe("2024-01-10");

        expect(objectUtil.reverseIterateArray(test_arr, 2, "tarkistettuehdotus")).toBeNull(); // index too low
        expect(objectUtil.reverseIterateArray(test_arr, 10,"nonexistent_key")).toBeNull();
    });

    test("checkForDecreasingValues adjusts future values when moving a esillaolo_maaraaika", () => {
        const test_esillaolo_date_adjustment = (movedDate, moveToPast) => {
            const modified_test_arr = JSON.parse(JSON.stringify(mockData.decreasing_test_arr));
            const isAdd = false;
            const field = "oas_esillaolo_aineiston_maaraaika";
            const originalField = modified_test_arr.find(item => item.key === field);
            const oldDate = "2026-10-29";
            const projectSize = "XL";
            modified_test_arr[modified_test_arr.findIndex(item => item.key === field)].value = movedDate;
            // milloin_oas_esillaolo_paattyy is moved to 2027-02-05 (future)
            const original = JSON.parse(JSON.stringify(modified_test_arr));
            const result = objectUtil.checkForDecreasingValues(
                modified_test_arr,isAdd,field,mockData.test_disabledDates,oldDate,movedDate,moveToPast,projectSize
            );
            expect(result.length).toEqual(mockData.decreasing_test_arr.length);
            
            for (const item of result) {
                if (item.order && item.order <  originalField.order) {
                    const originalItem = original.find(orig => orig.key === item.key);
                    expect(item.value, 'items before the changed date should be untouched').toBe(originalItem.value);
                }
                if (item.order && item.order > originalField.order) {
                    expect(new Date(item.value) >= new Date(movedDate),
                        'items after the changed date should be adjusted to be after the moved date').toBe(true);
                }
                if (item.key === "milloin_oas_esillaolo_alkaa") {
                    const expectedDate = new Date(movedDate);
                    expectedDate.setDate(expectedDate.getDate() + 14);
                    expect(new Date(item.value) >= expectedDate,
                        "oas esillaolo dates should be at least 14 days after the previous one").toBe(true);
                    expect(new Date(item.value).getDay(), "oas esillaolo should fall on a weekend").not.toBeOneOf([6,0]);
                }
                if (item.key === "milloin_oas_esillaolo_paattyy") {
                    const expectedDate = new Date(result.find(i => i.key === "milloin_oas_esillaolo_alkaa").value);
                    expectedDate.setDate(expectedDate.getDate() + 14);
                    expect(new Date(item.value) >= expectedDate,
                        "oas esillaolo dates should be at least 14 days after the previous one").toBe(true);
                }
            }
        };
        test_esillaolo_date_adjustment("2027-02-05", false);
        test_esillaolo_date_adjustment("2027-06-20", false);
        test_esillaolo_date_adjustment("2026-09-15", true);
        test_esillaolo_date_adjustment("2026-05-30", true);
    });

    test("checkForDecreasingValues behaves correctly when adjusting kylk date", () => {
        const test_kylk_date = (movedDate, moveToPast) => {
            const modified_test_arr = JSON.parse(JSON.stringify(mockData.decreasing_test_arr));
            const isAdd = false;
            const field = "kaavaluonnos_kylk_aineiston_maaraaika";
            const originalField = modified_test_arr.find(item => item.key === field);
            const oldDate = "2027-05-10";
            const projectSize = "XL";
            modified_test_arr[modified_test_arr.findIndex(item => item.key === field)].value = movedDate;
            const original = JSON.parse(JSON.stringify(modified_test_arr));
            const result = objectUtil.checkForDecreasingValues(
                modified_test_arr,isAdd,field,mockData.test_disabledDates,oldDate,movedDate,moveToPast,projectSize
            );
            expect(result.length).toEqual(mockData.decreasing_test_arr.length);
            for (const item of result) {
                if (item.order && item.order <  originalField.order) {
                    const originalItem = original.find(orig => orig.key === item.key);
                    expect(item.value, 'items before the changed date should be untouched').toBe(originalItem.value);
                }
                if (item.order && item.order > originalField.order) {
                    expect(new Date(item.value) >= new Date(movedDate),
                        'items after the changed date should be adjusted to be after the movedDate').toBe(true);
                }
                if (item.key === "milloin_kaavaluonnos_lautakunnassa") {
                    const expectedDate = new Date(movedDate);
                    expectedDate.setDate(expectedDate.getDate() + 27);
                    expect(new Date(item.value) >= expectedDate, 
                        "milloin_kaavaluonnos_lautakunnassa should be at least 27 days after kaavaluonnos_kylk_aineiston_maaraaika").toBe(true);
                    expect(new Date(item.value).getDay(), "milloin_kaavaluonnos_lautakunnassa should fall on a tuesday").toBe(2);
                }
            }
        }
        test_kylk_date("2027-06-05", false);
        test_kylk_date("2028-04-21", false);
        test_kylk_date("2027-03-15", true);
        test_kylk_date("2026-11-30", true);
    });

        test("checkForDecreasingValues behaves correctly when adjusting milloin_lautakunnassa date", () => {
        const test_lautakunta_date = (movedDate, moveToPast) => {
            const modified_test_arr = JSON.parse(JSON.stringify(mockData.decreasing_test_arr));
            const isAdd = false;
            const field = "milloin_kaavaehdotus_lautakunnassa";
            const originalField = modified_test_arr.find(item => item.key === field);
            const oldDate = "2028-05-16";
            const projectSize = "XL";
            modified_test_arr[modified_test_arr.findIndex(item => item.key === field)].value = movedDate;
            const original = JSON.parse(JSON.stringify(modified_test_arr));
            const result = objectUtil.checkForDecreasingValues(
                modified_test_arr,isAdd,field,mockData.test_disabledDates,oldDate,movedDate,moveToPast,projectSize
            );
            for (const item of result) {
                if (item.order && item.order < originalField.order && item.key !== "ehdotus_kylk_aineiston_maaraaika") {
                    const originalItem = original.find(orig => orig.key === item.key);
                    expect(item.value, `items before the changed date should be untouched ${item.key}`).toBe(originalItem.value);
                }
                if (item.key === "ehdotus_kylk_aineiston_maaraaika") {
                    const expectedDate = new Date(movedDate);
                    expectedDate.setDate(expectedDate.getDate() - 14);
                    expect(new Date(item.value) <= expectedDate,
                        "ehdotus_kylk_aineiston_maaraaika should be at least 14 days before movedDate").toBe(true);
                    expect(new Date(item.value).getDay(), "ehdotus_kylk_aineiston_maaraaika not fall on a weekend").not.toBeOneOf([6,0]);
                }
                if (item.order && item.order > originalField.order) {
                    expect(new Date(item.value) >= new Date(movedDate),
                        'items after the changed date should be adjusted to be after the movedDate').toBe(true);
                }
                if (item.key === "milloin_ehdotuksen_nahtavilla_alkaa_iso") {
                    const expectedDate = new Date(movedDate);
                    expectedDate.setDate(expectedDate.getDate() + 1);
                    expect(new Date(item.value) >= expectedDate,
                        "milloin_ehdotuksen_nahtavilla_alkaa_iso should be at least 1 day after movedDate").toBe(true);
                    expect(new Date(item.value).getDay(), "milloin_ehdotuksen_nahtavilla_alkaa_iso not fall on a weekend").not.toBeOneOf([6,0]);
                }
            }
        }
        test_lautakunta_date("2028-05-23", false);
        test_lautakunta_date("2028-12-19", false);
        test_lautakunta_date("2027-09-15", true);
        test_lautakunta_date("2026-12-30", true);
    });

    test("checkForDecreasingValues behaves correctly when adding new element group", () => {
        const test_add_date = (movedDate, moveToPast) => {
            const modified_test_arr = JSON.parse(JSON.stringify(mockData.decreasing_test_arr));
            const isAdd = true;
            const field = "periaatteet_esillaolo_aineiston_maaraaika_2";
            const originalField = modified_test_arr.find(item => item.key === field);
            const oldDate = "2026-04-15";
            const projectSize = "XL";
            modified_test_arr[modified_test_arr.findIndex(item => item.key === field)].value = movedDate;
            const original = JSON.parse(JSON.stringify(modified_test_arr));
            const result = objectUtil.checkForDecreasingValues(
                modified_test_arr,isAdd,field,mockData.test_disabledDates,oldDate,movedDate,moveToPast,projectSize
            );
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
                    expect(new Date(item.value).getDay(), "milloin_periaatteet_esillaolo_alkaa_2 not fall on a weekend").not.toBeOneOf([6,0]);
                }
                if (item.key === "milloin_periaatteet_esillaolo_paattyy_2") {
                    const expectedDate = new Date(result.find(i => i.key === "milloin_periaatteet_esillaolo_alkaa_2").value);
                    expectedDate.setDate(expectedDate.getDate() + 14);
                    expect(new Date(item.value) >= expectedDate,
                        "milloin_periaatteet_esillaolo_paattyy_2 should be at least 14 days after milloin_periaatteet_esillaolo_alkaa_2").toBe(true);
                    expect(new Date(item.value).getDay(), "milloin_periaatteet_esillaolo_paattyy_2 not fall on a weekend").not.toBeOneOf([6,0]);
                }
                if( item.key === "viimeistaan_mielipiteet_periaatteista_2") {
                    expect(new Date(item.value), "viimeistaan_mielipiteet should match milloin_paattyy")
                    .toEqual(new Date(result.find(i => i.key === "milloin_periaatteet_esillaolo_paattyy_2").value));
                }
            }
        }
        test_add_date("2027-05-23", false);
        test_add_date("2027-06-23", false);
    });

    test("updateOriginalObject works correctly", () => {
        const test_object = {
            "item1": "value1",
            "item2": 123,
            "item3": null
        }
        const new_vals = [{key: "item1", value: "new_value"}, 
            {key: "fake_item", value: "fake_value"}, {key: "item3", value: "new_value3"}]
        const result = objectUtil.updateOriginalObject(test_object, new_vals)
        expect(test_object).toBe(result);
        expect(result).toEqual({
            "item1": "new_value",
            "item2": 123,
            "item3": "new_value3"
        });
    });

    test("findDifferencesInObjects works correctly", () => {
        const obj1 = { "a": 1, "b": 2, "c": 3, "nested": { "x": 10 } };
        const obj2 = { "a": 1, "b": 20, "d": 4, "nested": { "x": 10, "y": 20 } };
        const result1 = objectUtil.findDifferencesInObjects(obj1, obj2);
        expect(result1.length).toBe(4);
        expect(result1).toContainEqual({ key: "b", obj1: 2, obj2: 20 });
        expect(result1).toContainEqual({ key: "c", obj1: 3, obj2: undefined });
        expect(result1).toContainEqual({ key: "d", obj1: undefined, obj2: 4 });
        expect(result1).toContainEqual({ key: "nested.y", obj1: undefined, obj2: 20 });

        const result2 = objectUtil.findDifferencesInObjects(obj2, obj1);
        expect(result2.length).toBe(4);
        expect(result2).toContainEqual({ key: "b", obj1: 20, obj2: 2 });
        expect(result2).toContainEqual({ key: "d", obj1: 4, obj2: undefined });
        expect(result2).toContainEqual({ key: "c", obj1: undefined, obj2: 3 });
        expect(result2).toContainEqual({ key: "nested.y", obj1: 20, obj2: undefined });

        const result3 = objectUtil.findDifferencesInObjects({}, { "a": 1 });
        expect(result3).toContainEqual({ key: "a", obj1: undefined, obj2: 1 });

        const result4 = objectUtil.findDifferencesInObjects({ "a": 1 }, {});
        expect(result4).toContainEqual({ key: "a", obj1: 1, obj2: undefined });

        const result5 = objectUtil.findDifferencesInObjects(obj1, obj1);
        expect(result5.length).toBe(0);
    });
    test("findMatchingName returns correct item", () => {
        const test_array = [
            { name: "item_one", value: 1 },
            { name: "item_two", value: 2 },
            { name: "item_three", value: 3 },
        ];
        const result = objectUtil.findMatchingName(test_array, "item_two", "name");
        expect(result).toEqual({ name: "item_two", value: 2 });
    });
    test("findItem returns next item when direction is 1", () => {
        const test_array = [
            { name: "item_one", value: 1 },
            { name: "item_two", value: 2 },
            { name: "item_three", value: 3 },
        ];
        const result = objectUtil.findItem(test_array, "item_one", "name", 1);
        expect(result).toEqual({ name: "item_two", value: 2 });
    });

    test("findItem returns previous item when direction is -1", () => {
        const test_array = [
            { name: "item_one", value: 1 },
            { name: "item_two", value: 2 },
            { name: "item_three", value: 3 },
        ];
        const result = objectUtil.findItem(test_array, "item_three", "name", -1);
        expect(result).toEqual({ name: "item_two", value: 2 });
    });

    test("findItem returns null if inputName not found", () => {
        const test_array = [
            { name: "item_one", value: 1 },
            { name: "item_two", value: 2 },
        ];
        const result = objectUtil.findItem(test_array, "item_three", "name", 1);
        expect(result).toBeNull();
    });

    test("findItem returns null if next/previous index is out of bounds", () => {
        const test_array = [
            { name: "item_one", value: 1 },
            { name: "item_two", value: 2 },
        ];
        // Next after last
        expect(objectUtil.findItem(test_array, "item_two", "name", 1)).toBeNull();
        // Previous before first
        expect(objectUtil.findItem(test_array, "item_one", "name", -1)).toBeNull();
    });
    test("findDeadlineInDeadlines returns correct deadline object", () => {
        const deadlines = [
            { deadline: { attribute: "deadline_1", deadlinegroup: "groupA" } },
            { deadline: { attribute: "deadline_2", deadlinegroup: "groupB" } },
            { deadline: { attribute: "deadline_3", deadlinegroup: "groupC" } }
        ];
        expect(objectUtil.findDeadlineInDeadlines("deadline_2", deadlines)).toEqual(deadlines[1]);
        expect(objectUtil.findDeadlineInDeadlines("deadline_1", deadlines)).toEqual(deadlines[0]);
        expect(objectUtil.findDeadlineInDeadlines("nonexistent", deadlines)).toBeUndefined();
    });

    test("findDeadlineInDeadlines returns undefined for empty or malformed input", () => {
        expect(objectUtil.findDeadlineInDeadlines("deadline_1", [])).toBeUndefined();
        expect(objectUtil.findDeadlineInDeadlines("", [])).toBeUndefined();
        expect(objectUtil.findDeadlineInDeadlines(null, [])).toBeUndefined();
        expect(objectUtil.findDeadlineInDeadlines("deadline_1", [{ notDeadline: {} }])).toBeUndefined();
    });

    test("findDeadlineInDeadlineSections returns correct attribute object", () => {
        const deadlineSections = [
            {sections: [{attributes: [{ name: "deadline_1", attributegroup: "groupA" },{ name: "deadline_2", attributegroup: "groupB" }]}]},
            {sections: [{attributes: [{ name: "deadline_3", attributegroup: "groupC" }]}]}
        ];
        expect(objectUtil.findDeadlineInDeadlineSections("deadline_2", deadlineSections))
            .toEqual({ name: "deadline_2", attributegroup: "groupB" });
        expect(objectUtil.findDeadlineInDeadlineSections("deadline_3", deadlineSections))
            .toEqual({ name: "deadline_3", attributegroup: "groupC" });
        expect(objectUtil.findDeadlineInDeadlineSections("nonexistent", deadlineSections)).toBeUndefined();
    });

    test("findDeadlineInDeadlineSections returns undefined for empty or malformed input", () => {
        expect(objectUtil.findDeadlineInDeadlineSections("deadline_1", [])).toBeUndefined();
        expect(objectUtil.findDeadlineInDeadlineSections("deadline_1", [{ sections: [{}] }])).toBeUndefined();
        expect(objectUtil.findDeadlineInDeadlineSections("deadline_1", [{ sections: [{ attributes: [] }] }])).toBeUndefined();
        expect(objectUtil.findDeadlineInDeadlineSections("deadline_1", [{ sections: [{ attributes: [{ name: "other" }] }] }])).toBeUndefined();
    });

    test("filterHiddenKeys filters out deadline keys that are hidden", () => {
        const test_attribute_data = {
            "kaavaprosessin_kokoluokka": "S",
            "milloin_oas_esillaolo_alkaa": "2024-01-15",
            "milloin_oas_esillaolo_alkaa_2": "2024-02-01",
            "milloin_tarkistettu_ehdotus_lautakunnassa": "2024-03-01",
            "jarjestetaan_oas_esillaolo_1": true,
            "jarjestetaan_oas_esillaolo_2": false,
        };
        const test_deadlines = [
            { deadline: { attribute: "milloin_oas_esillaolo_alkaa", deadlinegroup: "oas_esillaolokerta_1" } },
            { deadline: { attribute: "milloin_oas_esillaolo_alkaa_2", deadlinegroup: "oas_esillaolokerta_2" } },
            { deadline: { attribute: "milloin_tarkistettu_ehdotus_lautakunnassa", deadlinegroup: "tarkistettu_ehdotus_lautakuntakerta_1" }}
        ];
        const result = objectUtil.filterHiddenKeys(test_attribute_data, test_deadlines);
        expect(Object.keys(result).length).toBe(5); // oas_esillaolo_alkaa_2 should be filtered out
        expect(Object.keys(result)).not.toContain("milloin_oas_esillaolo_alkaa_2");
        expect(Object.keys(result), "milloin_oas_esillaolo_alkaa should be visible because it has a true visibility attribute")
            .toContain("milloin_oas_esillaolo_alkaa");
        expect(Object.keys(result), "milloin_tarkistettu_ehdotus_lautakunnassa should be visible because it has not been explicitly hidden")
            .toContain("milloin_tarkistettu_ehdotus_lautakunnassa");
    });

    test("filterHiddenKeysUsingSections filters out deadline keys that are hidden", () => {
        const test_attribute_data = {
            "kaavaprosessin_kokoluokka": "XL",
            "milloin_periaatteet_esillaolo_alkaa_1": "2024-01-15",
            "milloin_periaatteet_esillaolo_alkaa_2": "2024-02-01",
            "milloin_kaavaluonnos_lautakunnassa": "2024-03-01",
            "jarjestetaan_periaatteet_esillaolo_1": true,
            "jarjestetaan_periaatteet_esillaolo_2": false,
        };
        const test_deadline_sections = [
            { sections: [
                { attributes: [
                    { name: "milloin_periaatteet_esillaolo_alkaa_1", attributegroup: "periaatteet_esillaolokerta_1" },
                    { name: "milloin_periaatteet_esillaolo_alkaa_2", attributegroup: "periaatteet_esillaolokerta_2" }
                ] }
            ] },
            { sections: [
                { attributes: [
                    { name: "milloin_kaavaluonnos_lautakunnassa", attributegroup: "luonnos_lautakuntakerta_1" }
                ] }
            ] }
        ];
        const result = objectUtil.filterHiddenKeysUsingSections(test_attribute_data, test_deadline_sections);
        expect(Object.keys(result).length).toBe(5); // periaatteet_esillaolo_alkaa_2 should be filtered out
        expect(Object.keys(result)).not.toContain("milloin_periaatteet_esillaolo_alkaa_2");
        expect(Object.keys(result), "milloin_periaatteet_esillaolo_alkaa_1 should be visible because it has a true visibility attribute")
            .toContain("milloin_periaatteet_esillaolo_alkaa_1");
        expect(Object.keys(result), "milloin_kaavaluonnos_lautakunnassa should be visible because it has not been explicitly hidden")
            .toContain("milloin_kaavaluonnos_lautakunnassa");
        
    });
});
