import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import timeUtil, { findFirstAllowedDate } from '../../utils/timeUtil.js';
import data from './cascadeDeadlineChange_test_data.js';
import {test_attribute_data_XL as test_attribute_data} from './test_attribute_data.js';


// Helper functions to reduce code duplication
const assertDatesAreWorkdays = (dates) => {
	for (let date of dates) {
		let newDate = new Date(date);
		expect(newDate.getDay() !== 0 && newDate.getDay() !== 6).toBe(true);
	}
};

const assertDatesAfterReference = (dates, referenceDate) => {
	const reference = new Date(referenceDate);
	for (let date of dates) {
		let newDate = new Date(date);
		expect(newDate > reference).toBe(true);
	}
};

const assertDatesBeforeReference = (dates, referenceDate) => {
	const reference = new Date(referenceDate);
	for (let date of dates) {
		let newDate = new Date(date);
		expect(newDate < reference).toBe(true);
	}
};

const assertDatesAreSpecificWeekday = (dates, referenceDate, weekday) => {
	const reference = new Date(referenceDate);
	for (let date of dates) {
		let newDate = new Date(date);
		expect(newDate > reference).toBe(true);
		expect(newDate.getDay()).toBe(weekday);
	}
};

// Mock system time for all date-dependent tests to ensure timezone-independent behavior
beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
});

afterEach(() => {
	vi.useRealTimers();
});
describe("timeUtils general utility function tests", () => {
    test("getHighestVoimaantuloDate returns the latest date from an array of date strings", () => {
        const dates = {
            "tullut_osittain_voimaan": "2023-05-01",
            "voimaantulo_pvm": "2024-01-15",
            "kumottu_pvm": "2022-12-31",
            "rauennut": "2023-11-20",
            "voimaantulovaihe_paattyy_pvm": "2025-03-10" // Ignored date key
        };
        const result = timeUtil.getHighestVoimaantuloDate(dates);
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
    describe("findFirstAllowedDate", () => {
        // Weekdays used as "gap" dates (counted toward minimum gap)
        const gapDates = [
            "2025-01-06", "2025-01-07", "2025-01-08", "2025-01-09", "2025-01-10",
            "2025-01-13", "2025-01-14", "2025-01-15", "2025-01-16", "2025-01-17"
        ];
        // Sparser array used as "allowed" dates for the final result
        const allowedDates = ["2025-01-08", "2025-01-15", "2025-01-22"];

        test("returns null when prevDate is missing", () => {
            expect(findFirstAllowedDate(null, 2, gapDates, allowedDates)).toBeNull();
        });

        test("counts minimum gap in gapDates and returns first matching allowedDate", () => {
            // 3 steps from 2025-01-06 in gapDates -> 2025-01-09; first allowedDate >= that is 2025-01-15
            expect(findFirstAllowedDate("2025-01-06", 3, gapDates, allowedDates)).toBe("2025-01-15");
        });

        test("returns preferredDate when it satisfies the minimum gap", () => {
            // Earliest = 2025-01-09; preferred 2025-01-22 is >= earliest -> returned as-is
            expect(findFirstAllowedDate("2025-01-06", 3, gapDates, allowedDates, "2025-01-22")).toBe("2025-01-22");
        });

        test("ignores preferredDate that violates the minimum gap", () => {
            // Earliest = 2025-01-09; preferred 2025-01-07 < earliest -> fall back to first allowed >= earliest
            expect(findFirstAllowedDate("2025-01-06", 3, gapDates, allowedDates, "2025-01-07")).toBe("2025-01-15");
        });

        test("returns null when minimum gap exceeds gapDates length", () => {
            expect(findFirstAllowedDate("2025-01-06", 999, gapDates, allowedDates)).toBeNull();
        });

        test("returns null when no allowed date satisfies the minimum gap", () => {
            expect(findFirstAllowedDate("2025-01-06", 3, gapDates, ["2025-01-01"])).toBeNull();
        });

        test("works when gapDates and allowedDates are the same array", () => {
            // Backward-compatible use: 3 steps from 2025-01-06 -> 2025-01-09
            expect(findFirstAllowedDate("2025-01-06", 3, gapDates, gapDates)).toBe("2025-01-09");
        });
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
});

describe("allowed deadline dates", () => {
    test("getAllowedDatesForProjectStart returns valid *allowed* dates", () => {
        const name = "projektin_kaynnistys_pvm";
        const formValues = {
            "projektin_kaynnistys_pvm": "2025-04-01",
            "kaynnistys_paattyy_pvm": "2025-06-01"
        };
        const startDate = {
            name: "projektin_kaynnistys_pvm"
        };
        const endDate = {
            name: "kaynnistys_paattyy_pvm",
            distance_from_previous: 10
        };
        const dateTypes = data.test_disabledDates.date_types;

        const result = timeUtil.getAllowedDatesForProjectStart(name, formValues, startDate, endDate, dateTypes);
        expect(result[result.length-1]).toBe("2025-05-19"); //maintain 10 working days distance
        assertDatesBeforeReference(result, formValues["kaynnistys_paattyy_pvm"]);
        assertDatesAreWorkdays(result);
    });

    test("getAllowedDatesForDeadline returns valid allowed dates for tarkistettu ehdotus", () => {
        const formValues = {
            "tarkistettu_ehdotusvaihe_alkaa_pvm": "2025-08-01",
            "tarkistettuehdotusvaihe_alkaa_pvm": "2025-08-01",
            "tarkistettu_ehdotus_kylk_maaraaika": "2025-09-01",
            "milloin_tarkistettu_ehdotus_lautakunnassa": "2025-09-01",
            "tarkistettu_ehdotusvaihe_paattyy_pvm": "2025-09-01",
        };
        const vaiheAlkaaItem = {
            name: "tarkistettu_ehdotusvaihe_alkaa_pvm",
            attribute: "tarkistettu_ehdotusvaihe_alkaa_pvm",
        }
        const lautakuntaItem = {
            name: "milloin_tarkistettu_ehdotus_lautakunnassa",
            previous_deadline: "tarkistettu_ehdotus_kylk_maaraaika",
            distance_from_previous: 27,
            date_type: "lautakunnan_kokouspäivät",
        };
        const kylkItem = {
            name: "tarkistettu_ehdotus_kylk_maaraaika",
            attribute: "tarkistettu_ehdotus_kylk_maaraaika",
            distance_from_previous: 6,
            previous_deadline: "tarkistettu_ehdotusvaihe_alkaa_pvm",
            date_type: "työpäivät",
        };
        const dateTypes = data.test_disabledDates.date_types;
        const deadlines = [{
            deadline: {
                attribute: "tarkistettu_ehdotusvaihe_alkaa_pvm",
                deadlinegroup: "tarkistettu_ehdotusvaihe"
            }
        }, {
            deadline: {
                attribute: kylkItem.name,
                deadlinegroup: "tarkistettu_ehdotus_lautakuntakerta_1"
            }
        }, {
            deadline: {
                attribute: lautakuntaItem.name,
                deadlinegroup: "tarkistettu_ehdotus_lautakuntakerta_1"
            }
        }];
        const result_maaraika = timeUtil.getAllowedDatesForDeadline("tarkistettu_ehdotus_kylk_maaraaika", formValues, kylkItem, vaiheAlkaaItem, dateTypes, []);
        expect(result_maaraika[0]).toBe("2025-08-11");
        assertDatesAfterReference(result_maaraika, formValues["tarkistettu_ehdotusvaihe_alkaa_pvm"]);
        assertDatesAreWorkdays(result_maaraika);
        const result_lautakunta = timeUtil.getAllowedDatesForDeadline("milloin_tarkistettu_ehdotus_lautakunnassa", formValues, lautakuntaItem, kylkItem, dateTypes, deadlines);
        // The lautakunta gap starts from the first allowed määräaika date, not its selected value.
        expect(result_lautakunta[0]).toBe("2025-09-23");
        assertDatesAreSpecificWeekday(result_lautakunta, formValues["tarkistettu_ehdotus_kylk_maaraaika"], 2); // Only tuesdays
    });
    test.each([
        ["milloin_oas_esillaolo_alkaa", ["2025-01-23", "2025-01-24"]],
        ["milloin_oas_esillaolo_paattyy", ["2025-01-23", "2025-01-24", "2025-01-27"]],
        ["oas_toisen_aineiston_maaraaika", ["2025-01-23", "2025-01-24", "2025-01-27"]]
    ])("calculateAllowedDates uses the earliest preceding maaraaika for %s", (name, expected) => {
        const sectionAttributes = [
            { name: "oasvaihe_alkaa_pvm" },
            {
                name: "oas_esillaolo_aineiston_maaraaika",
                previous_deadline: "oasvaihe_alkaa_pvm",
                distance_from_previous: 2,
                date_type: "työpäivät"
            },
            {
                name,
                previous_deadline: "oas_esillaolo_aineiston_maaraaika",
                distance_from_previous: 1,
                next_deadline: "milloin_oas_esillaolo_paattyy",
                distance_to_next: 1,
                date_type: "esilläolopäivät"
            }
        ];
        const dates = ["2025-01-20", "2025-01-21", "2025-01-22", "2025-01-23", "2025-01-24", "2025-01-27"];
        const dateTypes = {
            työpäivät: { dates },
            esilläolopäivät: { dates },
            arkipäivät: { dates }
        };
        const formValues = {
            oasvaihe_alkaa_pvm: dates[0],
            oas_esillaolo_aineiston_maaraaika: dates[4],
            milloin_oas_esillaolo_paattyy: dates[5]
        };
        const deadlines = sectionAttributes.map(item => ({
            deadline: { attribute: item.name, deadlinegroup: "oas_esillaolokerta_1" }
        }));
        const result = timeUtil.calculateAllowedDates(dateTypes, formValues, sectionAttributes, deadlines[2], deadlines);
        expect(result).toEqual(expected);
        expect(formValues.oas_esillaolo_aineiston_maaraaika).toBe(dates[4]);
    });
    test.each([
        ["oas_aineiston_maaraaika", "oas_esillaolokerta_1", "OAS"],
        ["milloin_kaavaehdotus_lautakunnassa", "ehdotus_lautakuntakerta_1", "Ehdotus"],
        ["viimeistaan_lausunnot_ehdotuksesta", "ehdotus_nahtavillaolokerta_1", "Ehdotus"]
    ])("calculateAllowedDates retains visible boundary predecessors without section metadata for %s", (name, deadlinegroup, phaseName) => {
        const dates = ["2025-01-20", "2025-01-21", "2025-01-22", "2025-01-23", "2025-01-24"];
        const hiddenName = "oas_esillaolo_aineiston_maaraaika";
        const boundaryName = "ehdotusvaihe_alkaa_pvm";
        const sectionAttributes = [
            { name: hiddenName, previous_deadline: "oasvaihe_alkaa_pvm", distance_from_previous: 3 },
            { name, previous_deadline: hiddenName, distance_from_previous: 1, date_type: "lautakunnan_kokouspäivät" }
        ];
        const deadlines = [
            { deadline: { attribute: hiddenName, deadlinegroup: "oas_esillaolokerta_2" } },
            { deadline: { attribute: boundaryName, deadlinegroup: "ehdotusvaihe" } },
            { deadline: { attribute: name, deadlinegroup, phase_name: phaseName } },
            { deadline: { attribute: "future_phase_alkaa_pvm", deadlinegroup: "hyvaksyminen_1" } }
        ];
        const dateTypes = Object.fromEntries(["työpäivät", "esilläolopäivät", "arkipäivät", "lautakunnan_kokouspäivät"].map(type => [type, { dates }]));
        const formValues = {
            jarjestetaan_oas_esillaolo_2: false,
            [hiddenName]: dates[3],
            [boundaryName]: dates[0],
            future_phase_alkaa_pvm: dates[4]
        };
        expect(timeUtil.calculateAllowedDates(dateTypes, formValues, sectionAttributes, deadlines[2], deadlines)).toEqual(dates.slice(1));
    });
    test("calculateAllowedDates resolves a maaraaika's hidden predecessor through ordered deadlines", () => {
        const dates = ["2025-01-20", "2025-01-21", "2025-01-22", "2025-01-23", "2025-01-24"];
        const sectionAttributes = [
            { name: "oas_aineiston_maaraaika", previous_deadline: "hidden_paattyy", distance_from_previous: 1 },
            { name: "oas_toisen_aineiston_maaraaika", previous_deadline: "oas_aineiston_maaraaika", distance_from_previous: 1 }
        ];
        const deadlines = [
            { deadline: { attribute: "hidden_paattyy", deadlinegroup: "oas_esillaolokerta_2" } },
            { deadline: { attribute: "oasvaihe_alkaa_pvm", deadlinegroup: "oasvaihe" } },
            { deadline: { attribute: sectionAttributes[0].name, deadlinegroup: "oas_esillaolokerta_1" } },
            { deadline: { attribute: sectionAttributes[1].name, deadlinegroup: "oas_esillaolokerta_1" } }
        ];
        const formValues = {
            jarjestetaan_oas_esillaolo_2: false,
            hidden_paattyy: dates[3],
            oasvaihe_alkaa_pvm: dates[0],
            oas_aineiston_maaraaika: dates[4]
        };
        expect(timeUtil.calculateAllowedDates({ arkipäivät: { dates } }, formValues, sectionAttributes, deadlines[3], deadlines)).toEqual(dates.slice(2));
    });
    test("calculateAllowedDates uses a maaraaika's selected date when its distance metadata is unavailable", () => {
        const dates = ["2025-01-20", "2025-01-21", "2025-01-22", "2025-01-23", "2025-01-24"];
        const sectionAttributes = [
            { name: "oas_toisen_aineiston_maaraaika", previous_deadline: "oas_aineiston_maaraaika", distance_from_previous: 1 }
        ];
        const deadlines = [
            { deadline: { attribute: "oasvaihe_alkaa_pvm", deadlinegroup: "oasvaihe" } },
            { deadline: { attribute: "oas_aineiston_maaraaika", deadlinegroup: "oas_esillaolokerta_1" } },
            { deadline: { attribute: sectionAttributes[0].name, deadlinegroup: "oas_esillaolokerta_1" } }
        ];
        const formValues = { oasvaihe_alkaa_pvm: dates[0], oas_aineiston_maaraaika: dates[2] };
        expect(timeUtil.calculateAllowedDates({ arkipäivät: { dates } }, formValues, sectionAttributes, deadlines[2], deadlines)).toEqual(dates.slice(3));
    });
    test("calculateAllowedDates stops the ordered predecessor scan at a current date absent from sections", () => {
        const dates = ["2025-01-20", "2025-01-21", "2025-01-22", "2025-01-23", "2025-01-24"];
        const deadlines = [
            { deadline: { attribute: "oasvaihe_alkaa_pvm", deadlinegroup: "oasvaihe" } },
            { deadline: { attribute: "oas_aineiston_maaraaika", deadlinegroup: "oas_esillaolokerta_1" } },
            { deadline: { attribute: "future_phase_alkaa_pvm", deadlinegroup: "ehdotusvaihe" } }
        ];
        const formValues = { oasvaihe_alkaa_pvm: dates[0], future_phase_alkaa_pvm: dates[4] };
        expect(timeUtil.calculateAllowedDates({ arkipäivät: { dates } }, formValues, [], deadlines[1], deadlines)).toEqual(dates);
    });
    test.each([0, 1, undefined])("getAllowedDatesForDeadline counts working-day gaps separately from meeting dates (%s)", (gap) => {
        const dates = ["2025-01-20", "2025-01-21", "2025-01-22", "2025-01-23", "2025-01-24", "2025-01-27", "2025-01-28"];
        const meetingDates = [dates[0], dates[2], dates[6]];
        const name = "milloin_kaavaluonnos_lautakunnassa";
        const matchingItem = {
            previous_deadline: "previous",
            distance_from_previous: gap,
            date_type: "lautakunnan_kokouspäivät"
        };
        const dateTypes = {
            työpäivät: { dates },
            lautakunnan_kokouspäivät: { dates: meetingDates }
        };
        const result = timeUtil.getAllowedDatesForDeadline(name, { previous: dates[0] }, matchingItem, null, dateTypes, []);
        expect(result).toEqual(gap === 1 ? meetingDates.slice(1) : meetingDates);
    });
    test("getAllowedDatesForDeadline defaults to arkipäivät and zero gap without metadata", () => {
        const dates = ["2025-01-20", "2025-01-21", "2025-01-22"];
        const dateTypes = {
            arkipäivät: { dates },
            työpäivät: { dates: [dates[2]] },
            esilläolopäivät: { dates: [dates[1]] }
        };
        const matchingItem = { previous_deadline: "previous" };
        expect(timeUtil.getAllowedDatesForDeadline("aineiston_maaraaika", { previous: dates[0] }, matchingItem, null, dateTypes, [])).toEqual(dates);
    });
    test.each([
        ["2025-01-27", ["2025-01-23", "2025-01-24", "2025-01-27"]],
        ["2025-01-21", ["2025-01-23", "2025-01-24", "2025-01-27"]],
        ["2025-01-23", ["2025-01-23"]]
    ])("getAllowedDatesForDeadline applies inclusive upper bounds or ignores impossible ranges (%s)", (endDate, expected) => {
        const dates = ["2025-01-20", "2025-01-21", "2025-01-23", "2025-01-24", "2025-01-27"];
        const name = "milloin_ehdotus_nahtavilla_alkaa";
        const matchingItem = { name, previous_deadline: "previous", distance_from_previous: 1, next_deadline: "end", distance_to_next: 0 };
        const dateTypes = { arkipäivät: { dates }, esilläolopäivät: { dates: ["2025-01-22"] } };
        expect(timeUtil.getAllowedDatesForDeadline(name, { previous: dates[1], end: endDate }, matchingItem, null, dateTypes, [])).toEqual(expected);
    });
    test("getAllowedDatesForDeadline handles nahtavillaolo with ordered visible predecessors", () => {
        const formValues = {
            kaavaprosessin_kokoluokka: "XL",
            "ehdotusvaihe_alkaa_pvm": "2025-03-03",
            "milloin_kaavaehdotus_lautakunnassa": "2025-03-10",
            "ehdotus_nahtaville_aineiston_maaraaika": "2025-03-20",
            "milloin_ehdotus_nahtavilla_alkaa": "2025-03-25",
            "milloin_ehdotus_nahtavilla_paattyy": "2025-05-09",
            "kaavaehdotus_lautakuntaan_1": true
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
        const maaraAikaResult = timeUtil.getAllowedDatesForDeadline(maaraAikaItem.name, formValues, maaraAikaItem, null, dateTypes, []);
        expect(maaraAikaResult[0]).toBe("2025-03-17"); // 10 working days from previous
        const deadlines = [
            { deadline: { attribute: "ehdotusvaihe_alkaa_pvm", deadlinegroup: "ehdotusvaihe" } },
            { deadline: { attribute: "milloin_kaavaehdotus_lautakunnassa", deadlinegroup: "ehdotus_lautakuntakerta_1" } },
            { deadline: { attribute: maaraAikaItem.name, deadlinegroup: "ehdotus_nahtavillaolokerta_1" } },
            { deadline: { attribute: alkaaItem.name, deadlinegroup: "ehdotus_nahtavillaolokerta_1", phase_name: "Ehdotus" } }
        ];
        const alkaaResult = timeUtil.calculateAllowedDates(dateTypes, formValues, [maaraAikaItem, alkaaItem, paattyyItem], deadlines[3], deadlines);
        expect(alkaaResult[0]).toBe("2025-03-17");
        expect(alkaaResult[alkaaResult.length-1]).toBe("2025-04-18");
        const paattyyResult = timeUtil.getAllowedDatesForDeadline(paattyyItem.name, formValues, paattyyItem, null, dateTypes, []);
        expect(paattyyResult[0]).toBe("2025-04-15");
    });
    test.each([
        [null, ["2025-01-15", "2025-01-16", "2025-01-17"]],
        ["2025-01-17", ["2025-01-15", "2025-01-16"]]
    ])("calculateAllowedDates excludes past dates and the locked date (%s)", (lockedDate, expected) => {
        const dates = ["2025-01-14", "2025-01-15", "2025-01-16", "2025-01-17"];
        const name = "aineiston_maaraaika";
        const sectionAttributes = [{ name, previous_deadline: "previous" }];
        const currentDeadline = { deadline: { attribute: name } };
        expect(timeUtil.calculateAllowedDates({ arkipäivät: { dates } }, { previous: dates[0] }, sectionAttributes, currentDeadline, [], lockedDate)).toEqual(expected);
    });
    test("calculateAllowedDates retains past approval dates and counts the working-day gap", () => {
        const dates = ["2025-01-13", "2025-01-14", "2025-01-15", "2025-01-16"];
        const dateTypes = { työpäivät: { dates }, arkipäivät: { dates } };
        const name = "hyvaksymispaatos_pvm";
        const formValues = { hyvaksyminenvaihe_alkaa_pvm: dates[0] };
        const sectionAttributes = [{ name, distance_from_previous: 1 }];
        const currentDeadline = { deadline: { attribute: name } };
        const result = timeUtil.calculateAllowedDates(dateTypes, formValues, sectionAttributes, currentDeadline, []);
        expect(result).toEqual(dates.slice(1));
    });
    test.each(["hyvaksymispaatos_valitusaika_paattyy", "valitusaika_paattyy_hallinto_oikeus"])("calculateAllowedDates offers future arkipäivät for appeal deadline %s without a predecessor", (name) => {
        const dates = ["2025-01-14", "2025-01-15", "2025-01-16"];
        const currentDeadline = { deadline: { attribute: name } };
        expect(timeUtil.calculateAllowedDates({ arkipäivät: { dates } }, {}, [], currentDeadline, [])).toEqual(dates.slice(1));
    });
});

describe("syncPhaseEndDates function", () => {
    let test_data = null;

    beforeEach(() => {
        test_data = structuredClone(test_attribute_data)
    });

    // === LAUSUNNOT VIIMEISTÄÄN RULES ===
    // Helper: set paattyy and lausunnot for a given suffix
    const setLausuntoPair = (data, paattyy, lausunnot, suffix = "") => {
        data[`milloin_ehdotuksen_nahtavilla_paattyy${suffix}`] = paattyy;
        data[`viimeistaan_lausunnot_ehdotuksesta${suffix}`] = lausunnot;
    };
    const makeSnapshot = (values) => ({
        milloin_ehdotuksen_nahtavilla_paattyy: values[0] ?? null,
        milloin_ehdotuksen_nahtavilla_paattyy_2: values[1] ?? null,
        milloin_ehdotuksen_nahtavilla_paattyy_3: values[2] ?? null,
        milloin_ehdotuksen_nahtavilla_paattyy_4: values[3] ?? null,
    });

    // RULE 1: paattyy changed (any direction) → lausunnot MUST equal new paattyy
    test.each([
        { oldP: "2025-01-10", newP: "2025-01-15", oldL: "2025-01-10", desc: "forward, lausunnot was same as old paattyy" },
        { oldP: "2025-06-15", newP: "2025-06-10", oldL: "2025-06-15", desc: "backward, lausunnot was same as old paattyy" },
        { oldP: "2025-03-01", newP: "2025-04-01", oldL: "2025-05-01", desc: "forward, lausunnot was much later" },
        { oldP: "2025-08-20", newP: "2025-07-01", oldL: "2025-12-31", desc: "backward, lausunnot was much later" },
        { oldP: "2025-12-31", newP: "2026-01-02", oldL: "2025-12-31", desc: "across year boundary" },
        { oldP: "2025-02-28", newP: "2025-03-01", oldL: "2025-02-28", desc: "across month boundary" },
        { oldP: "2025-05-10", newP: "2025-05-09", oldL: "2025-05-10", desc: "one day backward" },
        { oldP: "2025-05-10", newP: "2025-05-11", oldL: "2025-05-10", desc: "one day forward" },
    ])("RULE: paattyy changed → lausunnot = new paattyy ($desc)", ({ oldP, newP, oldL }) => {
        setLausuntoPair(test_data, newP, oldL);
        timeUtil.syncPhaseEndDates(test_data, makeSnapshot([oldP]));
        expect(test_data["viimeistaan_lausunnot_ehdotuksesta"]).toBe(newP);
    });

    // RULE 2: paattyy unchanged → lausunnot >= paattyy must be preserved
    test.each([
        { paattyy: "2025-03-15", lausunnot: "2025-03-15", desc: "equal to paattyy" },
        { paattyy: "2025-03-15", lausunnot: "2025-03-16", desc: "one day later" },
        { paattyy: "2025-03-15", lausunnot: "2025-06-01", desc: "months later" },
        { paattyy: "2025-01-01", lausunnot: "2025-12-31", desc: "almost a year later" },
    ])("RULE: paattyy unchanged → preserve lausunnot >= paattyy ($desc)", ({ paattyy, lausunnot }) => {
        setLausuntoPair(test_data, paattyy, lausunnot);
        timeUtil.syncPhaseEndDates(test_data, makeSnapshot([paattyy]));
        expect(test_data["viimeistaan_lausunnot_ehdotuksesta"]).toBe(lausunnot);
    });

    // RULE 3: paattyy unchanged, lausunnot invalid/before paattyy → floor to paattyy
    test.each([
        { paattyy: "2025-06-15", lausunnot: "2025-06-14", desc: "one day before" },
        { paattyy: "2025-06-15", lausunnot: "2025-01-01", desc: "months before" },
        { paattyy: "2025-06-15", lausunnot: "", desc: "empty string" },
        { paattyy: "2025-06-15", lausunnot: null, desc: "null" },
    ])("RULE: paattyy unchanged, invalid lausunnot → floor to paattyy ($desc)", ({ paattyy, lausunnot }) => {
        setLausuntoPair(test_data, paattyy, lausunnot);
        timeUtil.syncPhaseEndDates(test_data, makeSnapshot([paattyy]));
        expect(test_data["viimeistaan_lausunnot_ehdotuksesta"]).toBe(paattyy);
    });

    // RULE 4: no snapshot (EditProjectTimetableModal path) → only floor constraint
    test.each([
        { paattyy: "2025-04-01", lausunnot: "2025-09-01", expected: "2025-09-01", desc: "later → preserved" },
        { paattyy: "2025-04-01", lausunnot: "2025-04-01", expected: "2025-04-01", desc: "equal → preserved" },
        { paattyy: "2025-04-01", lausunnot: "2025-03-01", expected: "2025-04-01", desc: "before → floored" },
        { paattyy: "2025-04-01", lausunnot: null, expected: "2025-04-01", desc: "null → floored" },
        { paattyy: "2025-04-01", lausunnot: "", expected: "2025-04-01", desc: "empty → floored" },
    ])("RULE: no snapshot → floor only ($desc)", ({ paattyy, lausunnot, expected }) => {
        setLausuntoPair(test_data, paattyy, lausunnot);
        timeUtil.syncPhaseEndDates(test_data);
        expect(test_data["viimeistaan_lausunnot_ehdotuksesta"]).toBe(expected);
    });

    // RULE 5: indexed fields are evaluated independently
    test("RULE: each suffix syncs/preserves independently based on its own paattyy change", () => {
        // _1: paattyy changed → sync
        setLausuntoPair(test_data, "2025-05-20", "2025-08-01", "");
        // _2: paattyy NOT changed → preserve
        setLausuntoPair(test_data, "2025-07-15", "2025-09-01", "_2");
        // _3: paattyy changed → sync
        setLausuntoPair(test_data, "2025-12-01", "2025-11-15", "_3");
        const snapshot = makeSnapshot(["2025-05-10", "2025-07-15", "2025-11-01"]);
        timeUtil.syncPhaseEndDates(test_data, snapshot);
        expect(test_data["viimeistaan_lausunnot_ehdotuksesta"]).toBe("2025-05-20");     // synced
        expect(test_data["viimeistaan_lausunnot_ehdotuksesta_2"]).toBe("2025-09-01");   // preserved
        expect(test_data["viimeistaan_lausunnot_ehdotuksesta_3"]).toBe("2025-12-01");   // synced
    });
    test("syncPhaseEndDates phase end dates correctly", () => {
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
        timeUtil.syncPhaseEndDates(test_data);
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

        timeUtil.syncPhaseEndDates(test_data);
        expect(test_data["oasvaihe_paattyy_pvm"]).toBe(test_data["milloin_oas_esillaolo_paattyy_2"]);
        expect(test_data["luonnosvaihe_paattyy_pvm"]).toBe(test_data["milloin_kaavaluonnos_lautakunnassa_2"]);
        expect(test_data["ehdotusvaihe_paattyy_pvm"]).toBe(test_data["viimeistaan_lausunnot_ehdotuksesta_2"]);
        expect(test_data["tarkistettuehdotusvaihe_paattyy_pvm"]).toBe(test_data["milloin_tarkistettu_ehdotus_lautakunnassa_2"]);
    });
    // Consolidated test for P8/L8 phase end rules (per database_deadline_rules.md)
    // Tests: esillaolo_1 only, esillaolo_2 active, esillaolo_3 active, lautakunta priority
    const phaseEndTestCases = [
        // esillaolo_1 only, no lautakunta → viimeistaan_mielipiteet (P5/L5)
        { phase: "periaatteet", scenario: "esillaolo_1 only", endKey: "periaatteetvaihe_paattyy_pvm", lautakuntaPrefix: "periaatteet_lautakuntaan", esillaoloPrefix: "jarjestetaan_periaatteet_esillaolo", correctSrc: "viimeistaan_mielipiteet_periaatteista", wrongSrc: "milloin_periaatteet_esillaolo_paattyy", esillaolo: [true, false, false], lautakunta: false, expectedDate: "2099-12-15" },
        { phase: "luonnos", scenario: "esillaolo_1 only", endKey: "luonnosvaihe_paattyy_pvm", lautakuntaPrefix: "kaavaluonnos_lautakuntaan", esillaoloPrefix: "jarjestetaan_luonnos_esillaolo", correctSrc: "viimeistaan_mielipiteet_luonnos", wrongSrc: "milloin_luonnos_esillaolo_paattyy", esillaolo: [true, false, false], lautakunta: false, expectedDate: "2099-12-15" },
        // esillaolo_2 active, no lautakunta → viimeistaan_mielipiteet_2 (P5.2/L5.2)
        { phase: "periaatteet", scenario: "esillaolo_2 active", endKey: "periaatteetvaihe_paattyy_pvm", lautakuntaPrefix: "periaatteet_lautakuntaan", esillaoloPrefix: "jarjestetaan_periaatteet_esillaolo", correctSrc: "viimeistaan_mielipiteet_periaatteista_2", esillaolo: [true, true, false], lautakunta: false, expectedDate: "2099-10-25" },
        { phase: "luonnos", scenario: "esillaolo_2 active", endKey: "luonnosvaihe_paattyy_pvm", lautakuntaPrefix: "kaavaluonnos_lautakuntaan", esillaoloPrefix: "jarjestetaan_luonnos_esillaolo", correctSrc: "viimeistaan_mielipiteet_luonnos_2", esillaolo: [true, true, false], lautakunta: false, expectedDate: "2099-10-25" },
        // esillaolo_3 active, no lautakunta → viimeistaan_mielipiteet_3 (P5.3/L5.3)
        { phase: "periaatteet", scenario: "esillaolo_3 active", endKey: "periaatteetvaihe_paattyy_pvm", lautakuntaPrefix: "periaatteet_lautakuntaan", esillaoloPrefix: "jarjestetaan_periaatteet_esillaolo", correctSrc: "viimeistaan_mielipiteet_periaatteista_3", esillaolo: [true, true, true], lautakunta: false, expectedDate: "2099-11-30" },
        { phase: "luonnos", scenario: "esillaolo_3 active", endKey: "luonnosvaihe_paattyy_pvm", lautakuntaPrefix: "kaavaluonnos_lautakuntaan", esillaoloPrefix: "jarjestetaan_luonnos_esillaolo", correctSrc: "viimeistaan_mielipiteet_luonnos_3", esillaolo: [true, true, true], lautakunta: false, expectedDate: "2099-11-30" },
        // lautakunta active → lautakunta wins over esillaolo
        { phase: "periaatteet", scenario: "lautakunta wins", endKey: "periaatteetvaihe_paattyy_pvm", lautakuntaPrefix: "periaatteet_lautakuntaan", esillaoloPrefix: "jarjestetaan_periaatteet_esillaolo", correctSrc: "milloin_periaatteet_lautakunnassa", wrongSrc: "viimeistaan_mielipiteet_periaatteista", esillaolo: [true, false, false], lautakunta: true, expectedDate: "2099-09-15" },
        { phase: "luonnos", scenario: "lautakunta wins", endKey: "luonnosvaihe_paattyy_pvm", lautakuntaPrefix: "kaavaluonnos_lautakuntaan", esillaoloPrefix: "jarjestetaan_luonnos_esillaolo", correctSrc: "milloin_kaavaluonnos_lautakunnassa", wrongSrc: "viimeistaan_mielipiteet_luonnos", esillaolo: [true, false, false], lautakunta: true, expectedDate: "2099-09-15" },
    ];

    test.each(phaseEndTestCases)(
        "syncPhaseEndDates: $phase $scenario",
        ({ endKey, lautakuntaPrefix, esillaoloPrefix, correctSrc, wrongSrc, esillaolo, lautakunta, expectedDate }) => {
            // Set distinct values to prove correct field selection
            test_data[correctSrc] = expectedDate;
            if (wrongSrc) test_data[wrongSrc] = "2099-01-01";  // Wrong value to detect incorrect selection
            test_data[endKey] = undefined;
            // Set lautakunta flags
            for (let i = 1; i <= 4; i++) test_data[`${lautakuntaPrefix}_${i}`] = (i === 1 && lautakunta);
            // Set esillaolo flags
            test_data[`${esillaoloPrefix}_1`] = esillaolo[0];
            test_data[`${esillaoloPrefix}_2`] = esillaolo[1];
            test_data[`${esillaoloPrefix}_3`] = esillaolo[2];
            
            timeUtil.syncPhaseEndDates(test_data);
            expect(test_data[endKey]).toBe(expectedDate);
        }
    );

    test("syncPhaseEndDates end dates, ehdotus in XS size", () => {
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
        timeUtil.syncPhaseEndDates(test_data);
        // Must use viimeistaan_lausunnot_ehdotuksesta (2099-11-20), NOT milloin_ehdotuksen_nahtavilla_paattyy
        expect(test_data["ehdotusvaihe_paattyy_pvm"]).toBe("2099-11-20");
    });
    test("syncPhaseEndDates moves backwards start dates to match previous end dates", () => {
        test_data["periaatteetvaihe_alkaa_pvm"] = "2025-05-01";
        test_data["kaynnistys_paattyy_pvm"] = "2025-06-01";
        timeUtil.syncPhaseEndDates(test_data);
        expect(test_data["periaatteetvaihe_alkaa_pvm"]).toBe("2025-06-01");
    });

    test("syncPhaseEndDates backward cascade: removing lautakunta moves next phase back", () => {
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
        
        timeUtil.syncPhaseEndDates(test_data);
        
        // tarkistettuehdotusvaihe_paattyy should now be 2028-03-01 (only _1 active)
        expect(test_data["tarkistettuehdotusvaihe_paattyy_pvm"]).toBe("2028-03-01");
        // hyväksymisvaihe_alkaa should move BACK to match phase end
        expect(test_data["hyvaksyminenvaihe_alkaa_pvm"]).toBe("2028-03-01");
    });

    test("syncPhaseEndDates mielipiteet gap fix: manual edit updates phase end and next phase", () => {
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
        
        timeUtil.syncPhaseEndDates(test_data);
        
        // Phase end should match the new viimeistaan date
        expect(test_data["periaatteetvaihe_paattyy_pvm"]).toBe("2026-09-15");
        // Next phase start should move forward to match (no gap)
        expect(test_data["oasvaihe_alkaa_pvm"]).toBe("2026-09-15");
    });

});