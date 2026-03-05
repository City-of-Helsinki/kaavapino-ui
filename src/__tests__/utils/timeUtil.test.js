import { describe, test, expect, beforeEach } from 'vitest';
import timeUtil from '../../utils/timeUtil.js';
import data from './checkForDecreasingValues_test_data.js';
import {test_attribute_data_XL as test_attribute_data} from './test_attribute_data.js';

/**
 * Tests for dateDifference function - core distance enforcement logic
 * 
 * This function is critical for enforcing minimum gaps between dates.
 * It handles:
 * - addingNew=true: Uses full distance from Excel data
 * - addingNew=false: Uses reduced gap (5 days) for certain fields
 * - Lautakunta dates must land on Tuesdays
 * - Respects allowedDays and disabledDays
 */
describe("dateDifference function - distance enforcement", () => {
    const arkipäivät = data.test_disabledDates.date_types.arkipäivät.dates;
    const työpäivät = data.test_disabledDates.date_types.työpäivät.dates;
    const lautakuntapäivät = data.test_disabledDates.date_types.lautakunnan_kokouspäivät.dates;
    const disabledDates = data.test_disabledDates.date_types.disabled_dates?.dates || [];

    // Helper to run dateDifference and calculate days difference
    const runAndGetDaysDiff = ({ cur, previousValue, currentValue, minimumGap, projectSize = "XL", addingNew = true, allowedDays = arkipäivät }) => {
        const result = timeUtil.dateDifference(cur, previousValue, currentValue, allowedDays, disabledDates, minimumGap, projectSize, addingNew);
        const daysDiff = Math.ceil((new Date(result) - new Date(previousValue)) / (1000 * 60 * 60 * 24));
        return { result, daysDiff };
    };

    describe("addingNew=true behavior (new additions)", () => {
        test.each([
            { cur: "milloin_oas_esillaolo_alkaa", minimumGap: 14, desc: "uses full minimumGap" },
            { cur: "oas_esillaolo_aineiston_maaraaika", minimumGap: 10, desc: "does not reduce gap for maaraaika" },
        ])("$desc when addingNew=true (cur=$cur, gap=$minimumGap)", ({ cur, minimumGap }) => {
            const { daysDiff } = runAndGetDaysDiff({ cur, previousValue: "2027-03-01", currentValue: "2027-03-05", minimumGap, addingNew: true });
            expect(daysDiff).toBeGreaterThanOrEqual(minimumGap);
        });

        test("respects database-provided gap for M/S ehdotus nahtavillaolo", () => {
            const { daysDiff } = runAndGetDaysDiff({
                cur: "milloin_ehdotuksen_nahtavilla_paattyy", previousValue: "2027-03-01", currentValue: "2027-03-10",
                minimumGap: 14, projectSize: "M", addingNew: true
            });
            expect(daysDiff).toBeGreaterThanOrEqual(14);
        });
    });

    describe("addingNew=false behavior (modifications)", () => {
        test.each([
            { cur: "oas_esillaolo_aineiston_maaraaika", minimumGap: 10, desc: "respects DB gap for maaraaika" },
            { cur: "ehdotus_lautakunta_aineiston_maaraaika", minimumGap: 14, desc: "full gap for lautakunta_aineiston_maaraaika" },
            { cur: "ehdotus_kylk_aineiston_maaraaika", minimumGap: 14, desc: "full gap for kylk_aineiston_maaraaika" },
            { cur: "milloin_oas_esillaolo_alkaa", minimumGap: 31, desc: "respects DB gap even when >= 31" },
        ])("$desc when addingNew=false", ({ cur, minimumGap }) => {
            const { daysDiff } = runAndGetDaysDiff({ cur, previousValue: "2027-03-01", currentValue: "2027-03-05", minimumGap, addingNew: false });
            expect(daysDiff).toBeGreaterThanOrEqual(minimumGap);
        });
    });

    describe("lautakunta Tuesday snapping", () => {
        test("snaps lautakunnassa dates to next Tuesday", () => {
            const { result } = runAndGetDaysDiff({
                cur: "milloin_kaavaehdotus_lautakunnassa", previousValue: "2027-03-01", currentValue: "2027-03-03",
                minimumGap: 5, allowedDays: lautakuntapäivät
            });
            expect(new Date(result).getDay()).toBe(2); // Tuesday
        });

        test("respects minimum gap before snapping to Tuesday", () => {
            const { result, daysDiff } = runAndGetDaysDiff({
                cur: "milloin_periaatteet_lautakunnassa", previousValue: "2027-03-01", currentValue: "2027-03-02",
                minimumGap: 27, allowedDays: lautakuntapäivät
            });
            expect(new Date(result).getDay()).toBe(2); // Tuesday
            expect(daysDiff).toBeGreaterThanOrEqual(27);
        });
    });

    describe("edge cases", () => {
        test.each([
            { desc: "currentValue before previousValue", previousValue: "2027-03-15", currentValue: "2027-03-01" },
            { desc: "same previousValue and currentValue", previousValue: "2027-03-15", currentValue: "2027-03-15" },
        ])("handles $desc", ({ previousValue, currentValue }) => {
            const { result } = runAndGetDaysDiff({ cur: "milloin_oas_esillaolo_alkaa", previousValue, currentValue, minimumGap: 5 });
            expect(new Date(result) > new Date(previousValue)).toBe(true);
        });

        test("skips to next allowed date when landing on disabled date (July)", () => {
            const { result } = runAndGetDaysDiff({
                cur: "milloin_oas_esillaolo_alkaa", previousValue: "2027-07-01", currentValue: "2027-07-05",
                minimumGap: 5, allowedDays: työpäivät
            });
            expect(new Date(result).getMonth()).toBeGreaterThanOrEqual(7); // August or later
        });
    });
});

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
    test("formatRelativeDate formats relative dates correctly", () => {
        const now = new Date();
        const today = now.toISOString();
        expect(timeUtil.formatRelativeDate(today)).toBe('Today');

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        expect(timeUtil.formatRelativeDate(yesterday.toISOString())).toBe('Yesterday');

        const fiveDaysAgo = new Date(now);
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        expect(timeUtil.formatRelativeDate(fiveDaysAgo.toISOString())).toBe('5 days ago');
        
        const twoMonthsAgo = new Date(now);
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        expect(timeUtil.formatRelativeDate(twoMonthsAgo.toISOString())).toBe('2 months ago');
        
        const twoYearsAgo = new Date(now);
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        expect(timeUtil.formatRelativeDate(twoYearsAgo.toISOString())).toBe('2 years ago');
        
        expect(timeUtil.formatRelativeDate(null)).toBe('');
        expect(timeUtil.formatRelativeDate('')).toBe('');
        
        // Test with translation function
        const mockTFn = (key, opts) => `translated_${key}_${opts?.count || ''}`;
        const threeDaysAgo = new Date(now);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        expect(timeUtil.formatRelativeDate(threeDaysAgo.toISOString(), mockTFn)).toBe('translated_relativeDates.days-ago_3');
    });
    test("formatRelativeDate formats relative dates correctly", () => {});
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

describe("getDisabledDates for various phases", () => {
    /** Assert every date in the array falls on a weekday (Mon-Fri) */
    const expectAllWeekdays = (dates) => {
        for (const date of dates) {
            const day = new Date(date).getDay();
            expect([0, 6].includes(day), `${date} is a weekend`).toBe(false);
        }
    };

    test("getDisabledDatesForProjectStart returns valid *allowed* dates", () => {
        const name = "projektin_kaynnistys_pvm";
        const formValues = {
            "projektin_kaynnistys_pvm": "2025-04-01",
            "kaynnistys_paattyy_pvm": "2025-06-01"
        };
        const previousItem = null; // No previous item for project start
        const nextItem = {
            name: "kaynnistys_paattyy_pvm",
            distance_from_previous: 10
        };
        const dateTypes = data.test_disabledDates.date_types;

        const result = timeUtil.getDisabledDatesForProjectStart(name, formValues, previousItem, nextItem, dateTypes);
        expect(result[result.length-1]).toBe("2025-05-19"); //maintain 10 working days distance
        const nextDate = new Date(formValues["kaynnistys_paattyy_pvm"]);
        for (let date of result) {
            expect(new Date(date) < nextDate).toBe(true);
        }
        expectAllWeekdays(result);
    });
    test("getDisabledDatesForApproval returns valid *allowed* dates", () => {
        const name = "hyvaksymispaatos_pvm";
        const formValues = {
            "hyvaksyminenvaihe_alkaa_pvm": "2025-05-01",
            "hyvaksymispaatos_pvm": "2025-08-01",
        };
        const matchingItem = {
            name: "hyvaksyminenvaihe_alkaa_pvm",
            distance_from_previous: 15
        };
        const dateTypes = data.test_disabledDates.date_types;
        const result = timeUtil.getDisabledDatesForApproval(name, formValues, matchingItem, dateTypes, "M");
        expect(result[0]).toBe("2025-05-23"); // maintain 15 working days distance
        const previousDate = new Date(formValues["hyvaksyminenvaihe_alkaa_pvm"]);
        for (let date of result) {
            expect(new Date(date) > previousDate).toBe(true);
        }
        expectAllWeekdays(result);
        const resultXS = timeUtil.getDisabledDatesForApproval(name, formValues, matchingItem, dateTypes, "XS");
        expect(resultXS[0]).toBe("2025-05-22"); // 1 extra day for XS/S
    });

    test("getDisabledDatesForLautakunta returns valid allowed dates for tarkistettu ehdotus", () => {
        const formValues = {
            "tarkistettu_ehdotusvaihe_alkaa_pvm": "2025-08-01",
            "tarkistettu_ehdotus_kylk_maaraaika": "2025-08-15",
            "milloin_tarkistettu_ehdotus_lautakunnassa": "2025-09-01",
            "tarkistettu_ehdotusvaihe_paattyy_pvm": "2025-09-01",
        };
        const vaiheAlkaaItem = {
            name: "tarkistettu_ehdotusvaihe_alkaa_pvm",
            distance_from_previous: 0,
            previous_deadline: "tarkistettu_ehdotusvaihe_alkaa_pvm",
        }
        const lautakuntaItem = {
            name: "milloin_tarkistettu_ehdotus_lautakunnassa",
            distance_from_previous: 27,
            previous_deadline: "tarkistettu_ehdotus_kylk_maaraaika",
            initial_distance: {
                distance: 21,
                base_deadline: "tarkistettu_ehdotus_kylk_maaraaika"
            }
        };
        const kylkItem = {
            name: "tarkistettu_ehdotus_kylk_maaraaika",
            distance_from_previous: 6,
            initial_distance: {
                distance: 10,
                base_deadline: "tarkistettuehdotusvaihe_alkaa_pvm"
            }
        };
        const dateTypes = data.test_disabledDates.date_types;
        const result_maaraika = timeUtil.getDisabledDatesForLautakunta("tarkistettu_ehdotus_kylk_maaraaika", formValues, "tarkistettu_ehdotus", kylkItem, vaiheAlkaaItem, dateTypes);
        expect(result_maaraika[0]).toBe("2025-08-11");
        const previousDate_maaraika = new Date(formValues["tarkistettu_ehdotusvaihe_alkaa_pvm"]);
        for (let date of result_maaraika) {
            expect(new Date(date) > previousDate_maaraika).toBe(true);
        }
        expectAllWeekdays(result_maaraika);
        const result_lautakunta = timeUtil.getDisabledDatesForLautakunta("milloin_tarkistettu_ehdotus_lautakunnassa", formValues, "tarkistettu_ehdotus", lautakuntaItem, kylkItem, dateTypes);
        const previousDate = new Date(formValues["tarkistettu_ehdotus_kylk_maaraaika"]);
        // 27 work days distance from maaraika (23rd), then next possible tuesday (30th)
        expect(result_lautakunta[0]).toBe("2025-09-30");
        for (let date of result_lautakunta) {
            let newDate = new Date(date);
            expect(newDate > previousDate).toBe(true);
            expect(newDate.getDay()).toBe(2); // Only tuesdays
        }
    });
    test("getDisableDatesForLautakunta handles Luonnos-phase correctly", () => {
        const formValues = {
            "kaavaluonnos_lautakuntaan_1": true,
            "jarjestetaan_luonnos_esillaolo_1": true,
            "jarjestetaan_luonnos_esillaolo_2": true,
            "luonnosvaihe_alkaa_pvm": "2025-08-01",
            "milloin_luonnos_esillaolo_paattyy_2": "2025-08-31",
            "luonnosaineiston_maaraaika": "2025-09-15",
            "milloin_kaavaluonnos_lautakunnassa": "2025-10-01",
            "luonnosvaihe_paattyy_pvm": "2025-10-01",
        };
        const lautakuntaItem = {
            name: "milloin_kaavaluonnos_lautakunnassa",
            distance_from_previous: 20,
            previous_deadline: "luonnosaineiston_maaraaika",
            initial_distance: {
                distance: 15,
                base_deadline: "luonnosaineiston_maaraaika"
            }
        };
        const kylkItem = {
            name: "luonnosaineiston_maaraaika",
            distance_from_previous: 5,
        };
        const dateTypes = data.test_disabledDates.date_types;
        // Should use latest esillaolo
        const result_lk = timeUtil.getDisabledDatesForLautakunta("milloin_kaavaluonnos_lautakunnassa", formValues, "luonnos", lautakuntaItem, kylkItem, dateTypes);
        expect(result_lk[0]).toBe("2025-09-30");
    });
    test("getDisabledDatesForSizeXSXL gets the right dates", () => {
        // Use dynamic year (current + 2) to ensure test remains stable regardless of when it runs
        const futureYear = new Date().getFullYear() + 2;
        const name = "oas_esillaolo_aineiston_maaraaika";
        const formValues = {
            "oasvaihe_alkaa_pvm": `${futureYear}-02-01`,
            "oas_esillaolo_aineiston_maaraaika": `${futureYear}-02-18`,
            "milloin_oas_esillaolo_alkaa": `${futureYear}-02-25`,
            "milloin_oas_esillaolo_paattyy": `${futureYear}-04-12`,
        }
        const maaraAikaItem = {
            name: "oas_esillaolo_aineiston_maaraaika",
            distance_from_previous: 10,
            previous_deadline: "oasvaihe_alkaa_pvm"
        }
        const alkaaItem = {
            name: "milloin_oas_esillaolo_alkaa",
            distance_from_previous: 5,
            previous_deadline: "oas_esillaolo_aineiston_maaraaika",
            distance_to_next: 15,
            next_deadline: "milloin_oas_esillaolo_paattyy"
        };
        const paattyyItem = {
            name: "milloin_oas_esillaolo_paattyy",
            distance_from_previous: 15,
            previous_deadline: "milloin_oas_esillaolo_alkaa",
        };
        const dateTypes = data.test_disabledDates.date_types;
        
        // Test maaraAika - should return disabled dates (working days only)
        const maaraAikaResult = timeUtil.getDisabledDatesForSizeXSXL(name, formValues, maaraAikaItem, dateTypes);
        expect(maaraAikaResult.length).toBeGreaterThan(0);
        expectAllWeekdays(maaraAikaResult);
        
        // Test alkaa - should return disabled dates after prerequisite
        const alkaaResult = timeUtil.getDisabledDatesForSizeXSXL("milloin_oas_esillaolo_alkaa", formValues, alkaaItem, dateTypes);
        expect(alkaaResult.length).toBeGreaterThan(0);
        expectAllWeekdays(alkaaResult);
        
        // Test paattyy - should return disabled dates (working days only)
        const paattyyResult = timeUtil.getDisabledDatesForSizeXSXL("milloin_oas_esillaolo_paattyy", formValues, paattyyItem, dateTypes);
        expect(paattyyResult.length).toBeGreaterThan(0);
        expectAllWeekdays(paattyyResult);
    });
    test("getHighestLautakuntaDate returns correct date", () => {
        const formValues = {
            "milloin_kaavaehdotus_lautakunnassa_1": "2025-05-01",
            "milloin_kaavaehdotus_lautakunnassa_2": "2025-06-01",
            "milloin_kaavaehdotus_lautakunnassa_3":"2025-08-01",
            "milloin_kaavaehdotus_lautakunnassa_4": "2025-09-01"
        };
        const result = timeUtil.getHighestLautakuntaDate(formValues, "ehdotus");
        expect(result).toBe("2025-09-01");
        const formValues2 = {
            "milloin_kaavaehdotus_lautakunnassa": "2025-05-01",
            "milloin_kaavaluonnos_lautakunnassa": "2026-01-01"
        }
        expect(timeUtil.getHighestLautakuntaDate(formValues2, "ehdotus")).toBe("2025-05-01");
    });
    test("getDisabledDatesForNahtavillaolo", () => {
        const formValues = {
            "ehdotusvaihe_alkaa_pvm": "2025-03-03",
            "milloin_kaavaehdotus_lautakunnassa": "2025-03-10",
            "ehdotus_nahtaville_aineiston_maaraaika": "2025-03-20",
            "milloin_ehdotus_nahtavilla_alkaa": "2025-03-25",
            "milloin_ehdotus_nahtavilla_paattyy": "2025-05-09",
        }
        const maaraAikaItem = {
            name: "ehdotus_nahtaville_aineiston_maaraaika",
            distance_from_previous: 10,
            previous_deadline: "ehdotusvaihe_alkaa_pvm"
        }
        const alkaaItem = {
            name: "milloin_ehdotus_nahtavilla_alkaa",
            distance_from_previous: 5,
            previous_deadline: "ehdotus_nahtaville_aineiston_maaraaika",
            distance_to_next: 15,
            next_deadline: "milloin_ehdotus_nahtavilla_paattyy"
        }
        const paattyyItem = {
            name: "milloin_ehdotus_nahtavilla_paattyy",
            distance_from_previous: 15,
            previous_deadline: "milloin_ehdotus_nahtavilla_alkaa",
        };
        const dateTypes = data.test_disabledDates.date_types;
        const maaraAikaResult = timeUtil.getDisabledDatesForNahtavillaolo("ehdotus_nahtaville_aineiston_maaraaika", formValues, "Ehdotus", maaraAikaItem, dateTypes, "XL");
        expect(maaraAikaResult[0]).toBe("2025-03-17"); // 10 working days from previous
        const alkaaResult = timeUtil.getDisabledDatesForNahtavillaolo("milloin_ehdotus_nahtavilla_alkaa", formValues, "Ehdotus", alkaaItem, dateTypes, "XL");
        // Date is relative to lautakunta because XL does not have maaraaika
        expect(alkaaResult[0]).toBe("2025-03-17");
        // easter holidays not included in test data
        expect(alkaaResult[alkaaResult.length-1]).toBe("2025-04-18");
        const paattyyResult = timeUtil.getDisabledDatesForNahtavillaolo("milloin_ehdotus_nahtavilla_paattyy", formValues, "Ehdotus", paattyyItem, dateTypes, "XL");
        expect(paattyyResult[0]).toBe("2025-04-15");
    });
    test("calculateDisabledDates takes past dates into account", () => {
        // Due to the complexity of calculateDisabledDates, here we just test that it calls the correct sub-functions   
        const dateTypes = data.test_disabledDates.date_types;
        const name = "projektin_kaynnistys_pvm";
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 30);
        const formValues = {
            "projektin_kaynnistys_pvm": new Date().toISOString().split('T')[0],
            "kaynnistys_paattyy_pvm": nextDate.toISOString().split('T')[0]
        };
        const sectionAttributes = [
            { name: "projektin_kaynnistys_pvm" },
            { name: "kaynnistys_paattyy_pvm", distance_from_previous: 10 },
            { name: "periaatteetvaihe_alkaa_pvm", previous_deadline: "kaynnistys_paattyy_pvm", distance_from_previous: 0 }
        ];
        const currentDeadline = sectionAttributes[1];

        const result = timeUtil.calculateDisabledDates(false, "M", dateTypes, name, formValues, sectionAttributes, currentDeadline);
        for (let date of result) {
            let newDate = new Date(date);
            const today = new Date();
            today.setHours(0,0,0,0);
            expect(newDate >= today).toBe(true); // No past dates
        }
        // End date in past
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 10);
        formValues["kaynnistys_paattyy_pvm"] = pastDate.toISOString().split('T')[0];
        const result2 = timeUtil.calculateDisabledDates(false, "M", dateTypes, name, formValues, sectionAttributes, currentDeadline);
        expect(result2.length).toBe(0); // No allowed dates
    });
    test("calculateDisabledDates ignores past date filtering for approval dates", () => {
        const dateTypes = data.test_disabledDates.date_types;
        const name = "hyvaksymispaatos_pvm";
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 30);
        const formValues = {
            "hyvaksyminenvaihe_alkaa_pvm": pastDate.toISOString().split('T')[0],
            "hyvaksymispaatos_pvm": pastDate.toISOString().split('T')[0],
        };
        const sectionAttributes = [
            { name: "hyvaksyminenvaihe_alkaa_pvm" },
            { name: "hyvaksymispaatos_pvm", distance_from_previous: 15 }
        ];
        const currentDeadline = sectionAttributes[1];

        const result = timeUtil.calculateDisabledDates(false, "M", dateTypes, name, formValues, sectionAttributes, currentDeadline);
        expect(result.length).toBeGreaterThan(0); // Should have allowed dates even if in past
    });
    test("ensure calculateDisabledDates handles all cases without crashing", () => {
        // Functionality covered in previous tests. Just ensuring no crashes here for coverage.
        const dateTypes = data.test_disabledDates.date_types;
        const sectionAttributes = [
            { name: "hyvaksymispaatos_valitusaika_paattyy"},
            { name: "milloin_tarkistettu_ehdotus_lautakunnassa",
                previous_deadline: "tarkistettu_ehdotus_kylk_maaraaika",
                initial_distance: {
                    distance: 10,
                    base_deadline: "tarkistettuehdotusvaihe_alkaa_pvm"
                },
                deadline: { deadlinegroup: "tarkistettu_ehdotus_lautakuntakerta_1" }
            },
            {
                name: "oas_esillaolo_aineiston_maaraaika",
                distance_from_previous: 10,
                previous_deadline: "oasvaihe_alkaa_pvm"
            },
            { 
                name: "milloin_oas_esillaolo_alkaa", 
                distance_from_previous: 5, 
                previous_deadline: "oas_esillaolo_aineiston_maaraaika", 
                distance_to_next: 15, next_deadline: "milloin_oas_esillaolo_paattyy" 
            }
        ];
        const currentDeadline1 = sectionAttributes[0];
        const currentDeadline2 = sectionAttributes[1];
        const currentDeadline3 = sectionAttributes[2];
        const currentDeadline4 = sectionAttributes[3];
        const formValues = {
            "oasvaihe_alkaa_pvm": "2028-01-01",
            "oas_esillaolo_aineiston_maaraaika": "2028-02-01",
            "milloin_oas_esillaolo_alkaa": "2028-02-15",
            "milloin_oas_esillaolo_paattyy": "2028-04-01",
            "hyvaksymispaatos_valitusaika_paattyy": "2028-04-01",
            "tarkistettu_ehdotus_kylk_maaraaika": "2028-03-01",
            "milloin_tarkistettu_ehdotus_lautakunnassa": "2028-05-01",
        };
        timeUtil.calculateDisabledDates(false, "M", dateTypes, "hyvaksymispaatos_valitusaika_paattyy", formValues, sectionAttributes, currentDeadline1);
        timeUtil.calculateDisabledDates(false, "M", dateTypes, "milloin_tarkistettu_ehdotus_lautakunnassa", formValues, sectionAttributes, currentDeadline2);
        timeUtil.calculateDisabledDates(true, "M", dateTypes, "oas_esillaolo_aineiston_maaraaika", formValues, sectionAttributes, currentDeadline3);
        timeUtil.calculateDisabledDates(false, "M", dateTypes, "milloin_oas_esillaolo_alkaa", formValues, sectionAttributes, currentDeadline4);
    });
});

describe("compareAndUpdateDates function", () => {
    let test_data = null;

    beforeEach(() => {
        test_data = structuredClone(test_attribute_data)
    });

    test("compareAndUpdateDates viimeistaan_ dates correctly", () => {
        const viimeistaan_items = {
            "viimeistaan_lausunnot_ehdotuksesta": "milloin_ehdotuksen_nahtavilla_paattyy",
            "viimeistaan_lausunnot_ehdotuksesta_2": "milloin_ehdotuksen_nahtavilla_paattyy_2",
            "viimeistaan_lausunnot_ehdotuksesta_3": "milloin_ehdotuksen_nahtavilla_paattyy_3",
            "viimeistaan_lausunnot_ehdotuksesta_4": "milloin_ehdotuksen_nahtavilla_paattyy_4"
        }
        for (let key in viimeistaan_items) {
            test_data[key] = null;
        }
        timeUtil.compareAndUpdateDates(test_data);
        for (let key in viimeistaan_items) {
            expect(test_data[key], `Key ${key} was not updated`).toBe(test_data[viimeistaan_items[key]]);
        }
    });
    test("compareAndUpdateDates phase end dates correctly", () => {
        const end_keys = [
            "periaatteetvaihe_paattyy_pvm",
            "oasvaihe_paattyy_pvm",
            "luonnosvaihe_paattyy_pvm",
            "ehdotusvaihe_paattyy_pvm",
            "tarkistettuehdotusvaihe_paattyy_pvm"
        ];
        for (let key of end_keys) {
            test_data[key] = undefined;
        }
        timeUtil.compareAndUpdateDates(test_data);
        for (let key of end_keys) {
            expect(test_data[key], `Key ${key} was not updated`).toBeDefined();
        }
        test_data["periaatteet_lautakuntaan_1"] = true;
        test_data["periaatteet_lautakuntaan_2"] = true;
        test_data["periaatteet_lautakuntaan_3"] = false;
        test_data["periaatteet_lautakuntaan_4"] = false;
        test_data["jarjestetaan_oas_esillaolo_1"] = true;
        test_data["jarjestetaan_oas_esillaolo_2"] = true;
        test_data["jarjestetaan_oas_esillaolo_3"] = false;
        test_data["jarjestetaan_luonnos_esillaolo_1"] = true;
        test_data["kaavaluonnos_lautakuntaan_1"] = true;
        test_data["kaavaluonnos_lautakuntaan_2"] = true;
        test_data["kaavaluonnos_lautakuntaan_3"] = false;
        test_data["kaavaehdotus_nahtaville_1"] = true;
        test_data["kaavaehdotus_uudelleen_nahtaville_2"] = true;
        test_data["kaavaehdotus_uudelleen_nahtaville_3"] = false;
        test_data["tarkistettu_ehdotus_lautakuntaan_1"] = true;
        test_data["tarkistettu_ehdotus_lautakuntaan_2"] = true;
        test_data["tarkistettu_ehdotus_lautakuntaan_3"] = false;
        test_data["tarkistettu_ehdotus_lautakuntaan_4"] = false;

        timeUtil.compareAndUpdateDates(test_data);
        expect(test_data["oasvaihe_paattyy_pvm"]).toBe(test_data["milloin_oas_esillaolo_paattyy_2"]);
        expect(test_data["luonnosvaihe_paattyy_pvm"]).toBe(test_data["milloin_kaavaluonnos_lautakunnassa_2"]);
        expect(test_data["ehdotusvaihe_paattyy_pvm"]).toBe(test_data["viimeistaan_lausunnot_ehdotuksesta_2"]);
        expect(test_data["tarkistettuehdotusvaihe_paattyy_pvm"]).toBe(test_data["milloin_tarkistettu_ehdotus_lautakunnassa_2"]);
    });
    test.each([
        {
            phase: "periaatteet",
            endKey: "periaatteetvaihe_paattyy_pvm",
            lautakuntaPrefix: "periaatteet_lautakuntaan",
            esillaoloPrefix: "jarjestetaan_periaatteet_esillaolo",
            correctSrc: "viimeistaan_mielipiteet_periaatteista",
            wrongSrc: "milloin_periaatteet_esillaolo_paattyy",
        },
        {
            phase: "luonnos",
            endKey: "luonnosvaihe_paattyy_pvm",
            lautakuntaPrefix: "kaavaluonnos_lautakuntaan",
            esillaoloPrefix: "jarjestetaan_luonnos_esillaolo",
            correctSrc: "viimeistaan_mielipiteet_luonnos",
            wrongSrc: "milloin_luonnos_esillaolo_paattyy",
        },
    ])("compareAndUpdateDates end dates, $phase with no lautakunta",
        ({ endKey, lautakuntaPrefix, esillaoloPrefix, correctSrc, wrongSrc }) => {
            // Set DISTINCT values to prove correct field is used (not coincidental match)
            test_data[correctSrc] = "2099-12-15";  // Correct: viimeistaan_mielipiteet
            test_data[wrongSrc] = "2099-06-01";    // Wrong: milloin_esillaolo_paattyy
            test_data[endKey] = undefined;
            for (let i = 1; i <= 4; i++) test_data[`${lautakuntaPrefix}_${i}`] = false;
            test_data[`${esillaoloPrefix}_1`] = true;
            test_data[`${esillaoloPrefix}_2`] = false;
            test_data[`${esillaoloPrefix}_3`] = false;
            timeUtil.compareAndUpdateDates(test_data);
            // Must use viimeistaan_mielipiteet (2099-12-15), NOT milloin_esillaolo_paattyy (2099-06-01)
            expect(test_data[endKey]).toBe("2099-12-15");
        }
    );

    // Per docs P8/L8: esillaolo_2 active (and !_3, !lautakunta) → P5.2/L5.2 (viimeistaan_mielipiteet_*_2)
    test.each([
        {
            phase: "periaatteet",
            endKey: "periaatteetvaihe_paattyy_pvm",
            lautakuntaPrefix: "periaatteet_lautakuntaan",
            esillaoloPrefix: "jarjestetaan_periaatteet_esillaolo",
            correctSrc: "viimeistaan_mielipiteet_periaatteista_2",
        },
        {
            phase: "luonnos",
            endKey: "luonnosvaihe_paattyy_pvm",
            lautakuntaPrefix: "kaavaluonnos_lautakuntaan",
            esillaoloPrefix: "jarjestetaan_luonnos_esillaolo",
            correctSrc: "viimeistaan_mielipiteet_luonnos_2",
        },
    ])("compareAndUpdateDates end dates, $phase with esillaolo_2 active, no lautakunta",
        ({ endKey, lautakuntaPrefix, esillaoloPrefix, correctSrc }) => {
            test_data[correctSrc] = "2099-10-25";  // Latest esillaolo_2 mielipiteet
            test_data[endKey] = undefined;
            for (let i = 1; i <= 4; i++) test_data[`${lautakuntaPrefix}_${i}`] = false;
            test_data[`${esillaoloPrefix}_1`] = true;
            test_data[`${esillaoloPrefix}_2`] = true;  // esillaolo_2 active
            test_data[`${esillaoloPrefix}_3`] = false;
            timeUtil.compareAndUpdateDates(test_data);
            expect(test_data[endKey]).toBe("2099-10-25");
        }
    );

    // Per docs P8/L8: esillaolo_3 active (and !lautakunta) → P5.3/L5.3 (viimeistaan_mielipiteet_*_3)
    test.each([
        {
            phase: "periaatteet",
            endKey: "periaatteetvaihe_paattyy_pvm",
            lautakuntaPrefix: "periaatteet_lautakuntaan",
            esillaoloPrefix: "jarjestetaan_periaatteet_esillaolo",
            correctSrc: "viimeistaan_mielipiteet_periaatteista_3",
        },
        {
            phase: "luonnos",
            endKey: "luonnosvaihe_paattyy_pvm",
            lautakuntaPrefix: "kaavaluonnos_lautakuntaan",
            esillaoloPrefix: "jarjestetaan_luonnos_esillaolo",
            correctSrc: "viimeistaan_mielipiteet_luonnos_3",
        },
    ])("compareAndUpdateDates end dates, $phase with esillaolo_3 active, no lautakunta",
        ({ endKey, lautakuntaPrefix, esillaoloPrefix, correctSrc }) => {
            test_data[correctSrc] = "2099-11-30";  // Latest esillaolo_3 mielipiteet
            test_data[endKey] = undefined;
            for (let i = 1; i <= 4; i++) test_data[`${lautakuntaPrefix}_${i}`] = false;
            test_data[`${esillaoloPrefix}_1`] = true;
            test_data[`${esillaoloPrefix}_2`] = true;
            test_data[`${esillaoloPrefix}_3`] = true;  // esillaolo_3 active
            timeUtil.compareAndUpdateDates(test_data);
            expect(test_data[endKey]).toBe("2099-11-30");
        }
    );

    // Per docs P8/L8: lautakunta takes priority over esillaolo
    test.each([
        {
            phase: "periaatteet",
            endKey: "periaatteetvaihe_paattyy_pvm",
            lautakuntaPrefix: "periaatteet_lautakuntaan",
            esillaoloPrefix: "jarjestetaan_periaatteet_esillaolo",
            lautakuntaSrc: "milloin_periaatteet_lautakunnassa",
            mielipiteetSrc: "viimeistaan_mielipiteet_periaatteista",
        },
        {
            phase: "luonnos",
            endKey: "luonnosvaihe_paattyy_pvm",
            lautakuntaPrefix: "kaavaluonnos_lautakuntaan",
            esillaoloPrefix: "jarjestetaan_luonnos_esillaolo",
            lautakuntaSrc: "milloin_kaavaluonnos_lautakunnassa",
            mielipiteetSrc: "viimeistaan_mielipiteet_luonnos",
        },
    ])("compareAndUpdateDates end dates, $phase lautakunta wins over esillaolo",
        ({ endKey, lautakuntaPrefix, esillaoloPrefix, lautakuntaSrc, mielipiteetSrc }) => {
            // Set DISTINCT values - lautakunta should win
            test_data[lautakuntaSrc] = "2099-09-15";   // Lautakunta date (should be used)
            test_data[mielipiteetSrc] = "2099-06-01"; // Mielipiteet date (should NOT be used)
            test_data[endKey] = undefined;
            // Both lautakunta AND esillaolo active - lautakunta takes priority
            test_data[`${lautakuntaPrefix}_1`] = true;
            test_data[`${lautakuntaPrefix}_2`] = false;
            test_data[`${lautakuntaPrefix}_3`] = false;
            test_data[`${lautakuntaPrefix}_4`] = false;
            test_data[`${esillaoloPrefix}_1`] = true;
            test_data[`${esillaoloPrefix}_2`] = false;
            test_data[`${esillaoloPrefix}_3`] = false;
            timeUtil.compareAndUpdateDates(test_data);
            // Must use lautakunta (2099-09-15), NOT mielipiteet (2099-06-01)
            expect(test_data[endKey]).toBe("2099-09-15");
        }
    );

    test("compareAndUpdateDates end dates, ehdotus in XS size", () => {
        // Set DISTINCT values to prove correct field is used
        test_data["viimeistaan_lausunnot_ehdotuksesta"] = "2099-11-20";  // Correct per docs
        test_data["milloin_ehdotuksen_nahtavilla_paattyy"] = "2099-05-10";  // Wrong (old code used this)
        test_data["ehdotusvaihe_paattyy_pvm"] = undefined;
        test_data["kaavaprosessin_kokoluokka"] = "XS";
        test_data["kaavaehdotus_lautakuntaan_1"] = false;
        test_data["kaavaehdotus_lautakuntaan_2"] = false;
        test_data["kaavaehdotus_lautakuntaan_3"] = false;
        test_data["kaavaehdotus_lautakuntaan_4"] = false;
        test_data["kaavaehdotus_nahtaville_1"] = true;
        test_data["kaavaehdotus_uudelleen_nahtaville_2"] = false;
        test_data["kaavaehdotus_uudelleen_nahtaville_3"] = false;
        timeUtil.compareAndUpdateDates(test_data);
        // Must use viimeistaan_lausunnot_ehdotuksesta (2099-11-20), NOT milloin_ehdotuksen_nahtavilla_paattyy
        expect(test_data["ehdotusvaihe_paattyy_pvm"]).toBe("2099-11-20");
    });
    test("compareAndUpdateDates moves backwards start dates to match previous end dates", () => {
        test_data["periaatteetvaihe_alkaa_pvm"] = "2025-05-01";
        test_data["kaynnistys_paattyy_pvm"] = "2025-06-01";
        timeUtil.compareAndUpdateDates(test_data);
        expect(test_data["periaatteetvaihe_alkaa_pvm"]).toBe("2025-06-01");
    });

    test("compareAndUpdateDates backward cascade: removing lautakunta moves next phase back", () => {
        // Simulate: Tarkistettu Ehdotus has lautakunta_1 only (not _2/_3/_4)
        // hyväksymisvaihe_alkaa should move back to match new tarkistettuehdotusvaihe_paattyy
        test_data["tarkistettu_ehdotus_lautakuntaan_1"] = true;
        test_data["tarkistettu_ehdotus_lautakuntaan_2"] = false;
        test_data["tarkistettu_ehdotus_lautakuntaan_3"] = false;
        test_data["tarkistettu_ehdotus_lautakuntaan_4"] = false;
        test_data["milloin_tarkistettu_ehdotus_lautakunnassa"] = "2028-03-01";
        test_data["milloin_tarkistettu_ehdotus_lautakunnassa_2"] = "2028-05-23";
        // Set hyväksymisvaihe_alkaa to a LATER date (simulating it was set when _2 was active)
        test_data["hyvaksyminenvaihe_alkaa_pvm"] = "2028-06-01";
        
        timeUtil.compareAndUpdateDates(test_data);
        
        // tarkistettuehdotusvaihe_paattyy should now be 2028-03-01 (only _1 active)
        expect(test_data["tarkistettuehdotusvaihe_paattyy_pvm"]).toBe("2028-03-01");
        // hyväksymisvaihe_alkaa should move BACK to match phase end
        expect(test_data["hyvaksyminenvaihe_alkaa_pvm"]).toBe("2028-03-01");
    });

    test("compareAndUpdateDates mielipiteet gap fix: manual edit updates phase end and next phase", () => {
        // Simulate: user manually sets viimeistaan_mielipiteet to a later date
        // Phase end should update, and next phase start should follow
        test_data["periaatteet_lautakuntaan_1"] = false;
        test_data["periaatteet_lautakuntaan_2"] = false;
        test_data["periaatteet_lautakuntaan_3"] = false;
        test_data["periaatteet_lautakuntaan_4"] = false;
        test_data["jarjestetaan_periaatteet_esillaolo_1"] = true;
        test_data["jarjestetaan_periaatteet_esillaolo_2"] = false;
        test_data["jarjestetaan_periaatteet_esillaolo_3"] = false;
        // User manually sets mielipiteet date later
        test_data["viimeistaan_mielipiteet_periaatteista"] = "2026-09-15";
        // OAS phase start is currently earlier
        test_data["oasvaihe_alkaa_pvm"] = "2026-08-01";
        
        timeUtil.compareAndUpdateDates(test_data);
        
        // Phase end should match the new viimeistaan date
        expect(test_data["periaatteetvaihe_paattyy_pvm"]).toBe("2026-09-15");
        // Next phase start should move forward to match (no gap)
        expect(test_data["oasvaihe_alkaa_pvm"]).toBe("2026-09-15");
    });

});