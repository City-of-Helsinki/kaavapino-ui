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

    test ("findValuesWithStrings return the correct object", () => {
        const result = objectUtil.findValuesWithStrings(test_objects, "milloin", "oas", "esillaolo", "alkaa");
        expect(result?.name).toEqual("milloin_oas_esillaolo_alkaa_2");
    });
    
});