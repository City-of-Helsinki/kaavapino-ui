import { describe, test, expect } from 'vitest';
import objectUtil from '../../utils/objectUtil';

const test_objects = [
    { "content": "Käynnistys", "attributegroup": "kaynnistys_1", "name": "kaynnistys_alkaa_pvm" },
    { "content": "Esilläolo-2", "attributegroup": "oas_esillaolokerta_2", "name": "milloin_oas_esillaolo_alkaa_2" },
    { "content": "Esilläolo-3", "attributegroup": "periaatteet_esillaolokerta_3", "name": "milloin_periaatteet_esillaolo_alkaa_3" },
    { "content": "Lautakunta-1", "attributegroup": "luonnos_lautakuntakerta_1", "name": "milloin_kaavaluonnos_lautakunnassa" },
    { "content": "Esilläolo-1", "attributegroup": "oas_esillaolokerta_1", "name": "milloin_oas_esillaolo_alkaa_1" },
];

describe("Test ObjectUtil utility functions", () => {

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
        expect(result_data[0]).toEqual({ key: "date_1", value: "2023-01-01" });
        expect(result_data[1]).toEqual({ key: "date_3", value: "2024-12-31" });
    });

    test("mergeAndUpdateDlArrays returns updated array", () => {
        const createSectionAttribute = (name, distanceVal = null, dateType = null) => ({
            name: name, distance_from_previous: distanceVal,
            distance_to_next: distanceVal,
            initial_distance: { distance: distanceVal },
            date_type: dateType
        });

        const test_sections = [
            {
                name: "Käynnistys", sections: [
                    {
                        "name": "1. Käynnistys", "attributes": [
                            createSectionAttribute("projektin_kaynnistys_pvm"),
                            createSectionAttribute("kaynnistys_paattyy_pvm"),
                        ]
                    },
                    {
                        name: "Periaatteet", "attributes": [
                            createSectionAttribute("periaatteetvaihe_alkaa_pvm", 5),
                            createSectionAttribute("milloin_periaatteet_lautakunnassa", 3, "työpäivät"),
                        ]
                    },
                    {
                        name: "OAS", "attributes": [
                            createSectionAttribute("oasvaihe_alkaa_pvm", 1),
                            createSectionAttribute("oasvaihe_paattyy_pvm", 7),
                        ]
                    },
                ]
            }];
        const arr1 = [
            { key: "milloin_periaatteet_lautakunnassa", value: "2023-06-01" },
            { key: "projektin_kaynnistys_pvm", value: "2023-01-01" },
        ];
        const arr2 = [
            { key: "oasvaihe_paattyy_pvm", value: "2024-06-01" }, // New date
            { key: "projektin_kaynnistys_pvm", value: "2023-01-01" }, // No change
            { key: "milloin_periaatteet_lautakunnassa", value: "2023-06-27" }, // Change
            { key: "aloituskokous_suunniteltu_pvm_readonly", value: "2023-06-27" } // Special case; exclude from result
        ];
        const result = objectUtil.mergeAndUpdateDlArrays(arr1, arr2, test_sections);

        // Result should be ordered according to sections, with distance & date_type values copied
        // the values of arr1 are updated according to values in arr2
        // order field is the original order of arr1 items
        expect(result).toHaveLength(3);
        expect(result[0]).toEqual({
            key: "projektin_kaynnistys_pvm", value: "2023-01-01", distance_from_previous: 0,
        });
        expect(result[1]).toEqual({
            key: "milloin_periaatteet_lautakunnassa", value: "2023-06-27", date_type: "työpäivät",
            distance_to_next: 3, distance_from_previous: 3, initial_distance: 3
        });
    });

    test("updateOriginalObject works correctly", () => {
        const test_object = {
            "item1": "value1",
            "item2": 123,
            "item3": null
        }
        const new_vals = [{ key: "item1", value: "new_value" },
        { key: "fake_item", value: "fake_value" }, { key: "item3", value: "new_value3" }]
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
            { sections: [{ attributes: [{ name: "deadline_1", attributegroup: "groupA" }, { name: "deadline_2", attributegroup: "groupB" }] }] },
            { sections: [{ attributes: [{ name: "deadline_3", attributegroup: "groupC" }] }] }
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
            { deadline: { attribute: "milloin_tarkistettu_ehdotus_lautakunnassa", deadlinegroup: "tarkistettu_ehdotus_lautakuntakerta_1" } }
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
            {
                sections: [
                    {
                        attributes: [
                            { name: "milloin_periaatteet_esillaolo_alkaa_1", attributegroup: "periaatteet_esillaolokerta_1" },
                            { name: "milloin_periaatteet_esillaolo_alkaa_2", attributegroup: "periaatteet_esillaolokerta_2" }
                        ]
                    }
                ]
            },
            {
                sections: [
                    {
                        attributes: [
                            { name: "milloin_kaavaluonnos_lautakunnassa", attributegroup: "luonnos_lautakuntakerta_1" }
                        ]
                    }
                ]
            }
        ];
        const result = objectUtil.filterHiddenKeysUsingSections(test_attribute_data, test_deadline_sections);
        expect(Object.keys(result).length).toBe(5); // periaatteet_esillaolo_alkaa_2 should be filtered out
        expect(Object.keys(result)).not.toContain("milloin_periaatteet_esillaolo_alkaa_2");
        expect(Object.keys(result), "milloin_periaatteet_esillaolo_alkaa_1 should be visible because it has a true visibility attribute")
            .toContain("milloin_periaatteet_esillaolo_alkaa_1");
        expect(Object.keys(result), "milloin_kaavaluonnos_lautakunnassa should be visible because it has not been explicitly hidden")
            .toContain("milloin_kaavaluonnos_lautakunnassa");

    });

    /**
     * KAAV-3492: Test that numbered deadline keys NOT in deadlineSections are still filtered
     * when their corresponding visibility bool is false.
     * 
     * This prevents stale dates from disabled groups (e.g., esillaolo_3 when only esillaolo_1 and _2 are active)
     * from affecting cascade calculations.
     */
    test("KAAV-3492: filters out numbered deadline keys not in deadlineSections when visibility bool is false", () => {
        const test_attribute_data = {
            "kaavaprosessin_kokoluokka": "XL",
            "luonnos_luotu": true,
            // Active group 1
            "jarjestetaan_luonnos_esillaolo_1": true,
            "luonnosaineiston_maaraaika": "2029-01-12",
            "milloin_luonnos_esillaolo_paattyy": "2029-02-28",
            // Active group 2 (just added)
            "jarjestetaan_luonnos_esillaolo_2": true,
            "luonnosaineiston_maaraaika_2": "2029-03-07",
            "milloin_luonnos_esillaolo_paattyy_2": "2029-04-16",
            // DISABLED group 3 - has stale dates that should be filtered out
            "jarjestetaan_luonnos_esillaolo_3": false,
            "luonnosaineiston_maaraaika_3": "2030-01-11",  // Stale date!
            "milloin_luonnos_esillaolo_paattyy_3": "2030-02-27",  // Stale date!
            // Downstream field
            "kaavaluonnos_kylk_aineiston_maaraaika": "2029-04-23",
        };
        // deadlineSections only contains _1 and _2 variants (as would be typical)
        // _3 variants are NOT in deadlineSections
        const test_deadline_sections = [
            {
                sections: [
                    {
                        attributes: [
                            { name: "luonnosaineiston_maaraaika", attributegroup: "luonnos_esillaolokerta_1" },
                            { name: "milloin_luonnos_esillaolo_paattyy", attributegroup: "luonnos_esillaolokerta_1" },
                            { name: "luonnosaineiston_maaraaika_2", attributegroup: "luonnos_esillaolokerta_2" },
                            { name: "milloin_luonnos_esillaolo_paattyy_2", attributegroup: "luonnos_esillaolokerta_2" },
                            { name: "kaavaluonnos_kylk_aineiston_maaraaika", attributegroup: "luonnos_lautakuntakerta_1" },
                        ]
                    }
                ]
            }
        ];
        const result = objectUtil.filterHiddenKeysUsingSections(test_attribute_data, test_deadline_sections);
        
        // Verify active group dates are included
        expect(Object.keys(result)).toContain("luonnosaineiston_maaraaika");
        expect(Object.keys(result)).toContain("milloin_luonnos_esillaolo_paattyy");
        expect(Object.keys(result)).toContain("luonnosaineiston_maaraaika_2");
        expect(Object.keys(result)).toContain("milloin_luonnos_esillaolo_paattyy_2");
        expect(Object.keys(result)).toContain("kaavaluonnos_kylk_aineiston_maaraaika");
        
        // CRITICAL: Verify disabled group 3 dates are EXCLUDED (even though not in deadlineSections)
        expect(Object.keys(result), "luonnosaineiston_maaraaika_3 should be filtered out because jarjestetaan_luonnos_esillaolo_3 is false")
            .not.toContain("luonnosaineiston_maaraaika_3");
        expect(Object.keys(result), "milloin_luonnos_esillaolo_paattyy_3 should be filtered out because jarjestetaan_luonnos_esillaolo_3 is false")
            .not.toContain("milloin_luonnos_esillaolo_paattyy_3");
        
        // Non-deadline keys should still be included
        expect(Object.keys(result)).toContain("kaavaprosessin_kokoluokka");
        expect(Object.keys(result)).toContain("luonnos_luotu");
    });
});
