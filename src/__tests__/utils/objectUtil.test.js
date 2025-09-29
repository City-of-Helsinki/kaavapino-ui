import { describe, test, expect } from 'vitest';
import objectUtil from '../../utils/objectUtil';


const test_objects = [
    {"content": "Käynnistys"},
    {"content": "Esilläolo-2"},
    {"content": "Lautakunta-1"},
    {"content": "Esilläolo-1"},
];
describe("Test ObjectUtil utility functions", () => {

    test("getHighestNumberedObject returns null on empty input", ()=> {
        expect(objectUtil.getHighestNumberedObject([])).toBeNull();
    });

    test("getHighestNumberedObject returns the correct object", () => {
        const result = objectUtil.getHighestNumberedObject(test_objects);
        expect(result).toEqual({"content": "Esilläolo-2"});
    });
});