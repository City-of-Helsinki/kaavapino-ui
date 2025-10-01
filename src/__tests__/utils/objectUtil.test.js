import { describe, test, expect } from 'vitest';
import objectUtil from '../../utils/objectUtil';


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

});
