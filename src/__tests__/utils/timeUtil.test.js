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
});

describe ("addDays and subtractDays with disabled dates", () => {
    test("addDays correctly adds days taking weekends into account", () => {
        const type = "arkipäivät"
        const date = "2025-10-10"
        const days = 10
        const disabledDates = structuredClone(data.test_disabledDates.date_types.arkipäivät.dates);
        const excludeWeekends = true
        const result = timeUtil.addDays(type, date, days, disabledDates, excludeWeekends);
        expect(result).toBe("2025-10-24");
    });
    test("addDays correctly adds board meeting days and lands on a valid date", () => {
        const type = "lautakunta"
        const date = "2025-10-10"
        const days = 10
        const allowedDates = structuredClone(data.test_disabledDates.date_types.lautakunnan_kokouspäivät.dates);
        const excludeWeekends = true
        const result = timeUtil.addDays(type, date, days, allowedDates, excludeWeekends);
        expect(result).toBe("2025-10-28");
        const resultDate = new Date(result);
        expect(resultDate.getDay()).toBe(2); // Ensure it's a Tuesday
    });
    /* TODO: Add all params to above test */
});