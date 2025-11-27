import { describe, test, expect } from 'vitest';
import timeUtil from '../../utils/timeUtil.js';
import data from './checkForDecreasingValues_test_data.js';

describe("timeUtils general utility function tests", () => {
    test("getHighestDate returns the latest date from an array of date strings", () => {
        const dates = {
            "tullut_osittain_voimaan": "2023-05-01",
            "voimaantulo_pvm": "2024-01-15",
            "kumottu_pvm": "2022-12-31",
            "rauennut": "2023-11-20",
            "voimaantulovaihe_paattyy_pvm": "2025-03-10" // Ignored date key
        };
        const result = timeUtil.getHighestDate(dates);
        expect(result).toBe("2024-01-15");
    });
    test("formatDate formats date object correctly", () => {
        const date = new Date("2024-07-04T12:00:00Z");
        const formattedDate = timeUtil.formatDate(date);
        expect(formattedDate).toBe("2024-07-04");
    });
    test("formatDate adds days and formats correctly", () => {
        const date = new Date("2024-07-04T12:00:00Z");
        const formattedDate = timeUtil.formatDate(date, true, 5);
        expect(formattedDate).toBe("2024-07-09");
    });
    test("isHoliday identifies holidays correctly", () => {
        const holidays = [
            "2024-01-01", // New Year's Day
            "2024-12-25", // Christmas
            "2024-12-26", // Boxing Day
        ];
        const holidayDate = new Date("2024-12-25T00:00:00Z"); // Christmas
        const nonHolidayDate = new Date("2024-07-04T00:00:00Z"); // Regular day
        expect(timeUtil.isHoliday(holidayDate, true, holidays)).toBe(true);
        expect(timeUtil.isHoliday(nonHolidayDate, true, holidays)).toBe(false);
        expect(timeUtil.isHoliday(holidayDate, false, holidays)).toBe(false);
        expect(timeUtil.isHoliday(nonHolidayDate, false, holidays)).toBe(true);
    });
    test("getPastDate subtracts working days correctly", () => {
        const date = new Date("2024-07-10T12:00:00Z");
        const pastDate = timeUtil.getPastDate(date, 10, true, []);
        expect(timeUtil.formatDate(pastDate)).toBe("2024-06-26");
    });
    test("getPastDate accounts for holidays when subtracting working days", () => {
        const holidays = [
            "2024-12-25",
        ];
        const date = new Date("2024-12-27T12:00:00Z");
        const pastDate = timeUtil.getPastDate(date, 10, true, holidays);
        expect(timeUtil.formatDate(pastDate)).toBe("2024-12-12");
    });
    test("sortObjectByDate sorts object keys by their date values", () => {
        const dates = {
            "event1": "2024-05-01",
            "event2": "2023-12-15",
            "event3": "2024-01-20"
        };
        const sorted = timeUtil.sortObjectByDate(dates);
        const sortedKeys = sorted.map((date) => date["key"]);
        expect(sortedKeys).toEqual(["event2", "event3", "event1"]);
    });
    test("findNextPossibleValue handles special/invalid cases", () => {
        expect(() => timeUtil.findNextPossibleValue(null, "2024-01-01")).toThrow();
        expect(() => timeUtil.findNextPossibleValue(["2024-01-01"], null)).toThrow();
        const dateArray = [
            "2024-01-01",
            "2024-02-01",
            "2024-03-01"
        ];
        expect(timeUtil.findNextPossibleValue([], "2024-01-01")).toBeNull();
        expect(timeUtil.findNextPossibleValue(dateArray, "2024-02-25", 99)).toBeNull();
        expect(timeUtil.findNextPossibleValue(dateArray, "2024-01-01", -99)).toBe("2024-01-01");
    });
    test("findNextPossibleValue Finds next possible date from from array if the value does not exist in it", () => {
        const dateArray = [
            "2024-01-01",
            "2024-02-01",
            "2024-03-01",
            "2024-04-01",
        ];
        const value1 = "2024-02-15";
        const value2 = "2024-03-01";
        const result1 = timeUtil.findNextPossibleValue(dateArray, value1);
        const result2 = timeUtil.findNextPossibleValue(dateArray, value2);
        expect(result1).toBe("2024-03-01");
        expect(result2).toBe("2024-03-01");
    });
    test("findNextPossibleValue works correctly with addedDays", () => {
        const dateArray = [
            "2024-01-01",
            "2024-02-01",
            "2024-03-01",
            "2024-04-01",
            "2024-05-01",
            "2024-06-01",
            "2024-07-01",
        ];
        const value = "2024-02-15";
        const addedDays = 3;
        const result = timeUtil.findNextPossibleValue(dateArray, value, addedDays);
        expect(result).toBe("2024-06-01");
    });
    test("findNextPossibleBoardDate returns next possible board date correctly", () => {
        const boardDates = [
            "2024-01-01",
            "2024-02-01",
            "2024-03-01",
            "2024-04-01",
            "2024-05-01"
        ];
        // Value exactly matches a date
        expect(timeUtil.findNextPossibleBoardDate(boardDates, "2024-03-01")).toBe("2024-04-01");
        // Value between two dates
        expect(timeUtil.findNextPossibleBoardDate(boardDates, "2024-03-15")).toBe("2024-04-01");
        // Value after last date
        expect(timeUtil.findNextPossibleBoardDate(boardDates, "2024-06-01")).toBe("2024-05-01");
        // Value equal to last date
        expect(timeUtil.findNextPossibleBoardDate(boardDates, "2024-05-01")).toBe("2024-05-01");
        // Empty array returns null
        expect(timeUtil.findNextPossibleBoardDate([], "2024-01-01")).toBeNull();
    });
    test("findNextPossibleBoardDate works correctly when addedDays goes out of bounds", () => {
    });
});

describe ("addDays and subtractDays with disabled dates", () => {
    test("addDays correctly adds days taking weekends into account", () => {
        const type = "työpäivät"
        const date = "2025-10-10"
        const days = 10
        const disabledDates = structuredClone(data.test_disabledDates.date_types.työpäivät.dates);
        const excludeWeekends = true
        const result = timeUtil.addDays(type, date, days, disabledDates, excludeWeekends);
        expect(result).toBe("2025-10-24");
    });
    test("addDays correctly adds days without taking weekends into account", () => {
        const type = "työpäivät"
        const date = "2025-10-10"
        const days = 10
        const disabledDates = structuredClone(data.test_disabledDates.date_types.työpäivät.dates);
        const excludeWeekends = false
        const result = timeUtil.addDays(type, date, days, disabledDates, excludeWeekends);
        expect(result).toBe("2025-10-20");
    });

    test("subtractDays correctly subtracts days taking weekends into account", () => {
        const type = "työpäivät"
        const date = "2025-10-24"
        const days = 10
        const disabledDates = structuredClone(data.test_disabledDates.date_types.työpäivät.dates);
        const excludeWeekends = true
        const result = timeUtil.subtractDays(type, date, days, disabledDates, excludeWeekends);
        expect(result).toBe("2025-10-10");
    });
    test("subtractDays correctly subtracts days without taking weekends into account", () => {
        const type = "työpäivät"
        const date = "2025-10-24"
        const days = 10
        const disabledDates = structuredClone(data.test_disabledDates.date_types.työpäivät.dates);
        const excludeWeekends = false
        const result = timeUtil.subtractDays(type, date, days, disabledDates, excludeWeekends);
        expect(result).toBe("2025-10-14");
    });
});