const generateMockArkipäivät = () => {
    const dates = [];
    let currentDate = new Date("2025-01-01");
    const endDate = new Date("2029-12-31");

    while (currentDate <= endDate) {
        const day = currentDate.getDay();
        if (day !== 0 && day !== 6) { // Exclude Sundays (0) and Saturdays (6)
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const date = String(currentDate.getDate()).padStart(2, '0');
            dates.push(`${year}-${month}-${date}`);
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}

const generateMockTyöpäivät = () => {
    const dates = [];
    let currentDate = new Date("2025-01-01");
    const endDate = new Date("2029-12-31");

    // Exclude weekends, all july dates, and dates from 24.12 to 6.1
    while (currentDate <= endDate) {
        const day = currentDate.getDay();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const date = String(currentDate.getDate()).padStart(2, '0');
        if (day !== 0 && day !== 6 && month !== '07' &&
            !(month === '12' && date >= '24') && !(month === '01' && date <= '06')) {
            const year = currentDate.getFullYear();
            dates.push(`${year}-${month}-${date}`);
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}

const generateMockLautakuntapäivät = () => {
    const dates = [];
    let currentDate = new Date("2025-09-24");
    const endDate = new Date("2029-12-30");

    while (currentDate <= endDate) {
        const day = currentDate.getDay();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        if (day === 2 && month !== '07') { // Tuesdays (2) excluding July
            const year = currentDate.getFullYear();
            const date = String(currentDate.getDate()).padStart(2, '0');
            dates.push(`${year}-${month}-${date}`);
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}

const decreasing_test_arr = [
    {
        "key": "projektin_kaynnistys_pvm",
        "value": "2025-09-24",
        "distance_from_previous": null,
        "distance_to_next": null,
        "initial_distance": null,
        "date_type": "arkipäivät",
        "order": 0
    },
    {
        "key": "kaynnistys_paattyy_pvm",
        "value": "2025-12-10",
        "distance_from_previous": 5,
        "distance_to_next": null,
        "initial_distance": 55,
        "date_type": "arkipäivät",
        "order": 1
    },
    {
        "key": "periaatteet_esillaolo_aineiston_maaraaika",
        "value": "2026-02-25",
        "distance_from_previous": 5,
        "distance_to_next": null,
        "initial_distance": 45,
        "date_type": "arkipäivät",
        "order": 3
    },
    {
        "key": "milloin_periaatteet_esillaolo_alkaa",
        "value": "2026-03-17",
        "distance_from_previous": 19,
        "distance_to_next": 14,
        "initial_distance": 14,
        "date_type": "arkipäivät",
        "order": 4
    },
    {
        "key": "milloin_periaatteet_esillaolo_paattyy",
        "value": "2026-04-08",
        "distance_from_previous": 14,
        "distance_to_next": 5,
        "initial_distance": 14,
        "date_type": "arkipäivät",
        "order": 5
    },
    {
        "key": "viimeistaan_mielipiteet_periaatteista",
        "value": "2026-04-08",
        "distance_from_previous": null,
        "distance_to_next": 5,
        "initial_distance": null,
        "date_type": "arkipäivät",
        "order": 6
    },
    {
        "key": "periaatteet_esillaolo_aineiston_maaraaika_2",
        "value": "2026-04-15",
        "distance_from_previous": 5,
        "distance_to_next": null,
        "initial_distance": 5,
        "date_type": "arkipäivät",
        "order": 7
    },
    {
        "key": "milloin_periaatteet_esillaolo_alkaa_2",
        "value": "2026-05-06",
        "distance_from_previous": 19,
        "distance_to_next": 14,
        "initial_distance": 14,
        "date_type": "arkipäivät",
        "order": 8
    },
    {
        "key": "milloin_periaatteet_esillaolo_paattyy_2",
        "value": "2026-05-27",
        "distance_from_previous": 14,
        "distance_to_next": 5,
        "initial_distance": 14,
        "date_type": "arkipäivät",
        "order": 9
    },
    {
        "key": "viimeistaan_mielipiteet_periaatteista_2",
        "value": "2026-05-27",
        "distance_from_previous": null,
        "distance_to_next": 27,
        "initial_distance": null,
        "date_type": "arkipäivät",
        "order": 10
    },
    {
        "key": "periaatteet_lautakunta_aineiston_maaraaika",
        "value": "2026-08-03",
        "distance_from_previous": 5,
        "distance_to_next": null,
        "initial_distance": 30,
        "date_type": "arkipäivät",
        "order": 11
    },
    {
        "key": "milloin_periaatteet_lautakunnassa",
        "value": "2026-09-01",
        "distance_from_previous": 27,
        "distance_to_next": 1,
        "initial_distance": 21,
        "date_type": "lautakunnan_kokouspäivät",
        "order": 14
    },
    {
        "key": "oas_esillaolo_aineiston_maaraaika",
        "value": "2026-10-29",
        "distance_from_previous": 5,
        "distance_to_next": null,
        "initial_distance": 35,
        "date_type": "arkipäivät",
        "order": 15
    },
    {
        "key": "milloin_oas_esillaolo_alkaa",
        "value": "2026-11-18",
        "distance_from_previous": 19,
        "distance_to_next": 14,
        "initial_distance": 14,
        "date_type": "arkipäivät",
        "order": 16
    },
    {
        "key": "milloin_oas_esillaolo_paattyy",
        "value": "2026-12-08",
        "distance_from_previous": 14,
        "distance_to_next": 5,
        "initial_distance": 14,
        "date_type": "arkipäivät",
        "order": 20
    },
    {
        "key": "viimeistaan_mielipiteet_oas",
        "value": "2026-12-08",
        "distance_from_previous": null,
        "distance_to_next": null,
        "initial_distance": null,
        "date_type": "arkipäivät",
        "order": 19
    },
    {
        "key": "luonnosaineiston_maaraaika",
        "value": "2027-02-10",
        "distance_from_previous": 5,
        "distance_to_next": null,
        "initial_distance": 45,
        "date_type": "arkipäivät",
        "order": 21
    },
    {
        "key": "milloin_luonnos_esillaolo_alkaa",
        "value": "2027-03-03",
        "distance_from_previous": 19,
        "distance_to_next": 14,
        "initial_distance": 14,
        "date_type": "arkipäivät",
        "order": 22
    },
    {
        "key": "milloin_luonnos_esillaolo_paattyy",
        "value": "2027-03-24",
        "distance_from_previous": 14,
        "distance_to_next": 5,
        "initial_distance": 14,
        "date_type": "arkipäivät",
        "order": 24
    },
    {
        "key": "viimeistaan_mielipiteet_luonnos",
        "value": "2027-03-24",
        "distance_from_previous": null,
        "distance_to_next": 5,
        "initial_distance": null,
        "date_type": "arkipäivät",
        "order": 23
    },
    {
        "key": "kaavaluonnos_kylk_aineiston_maaraaika",
        "value": "2027-05-10",
        "distance_from_previous": 5,
        "distance_to_next": null,
        "initial_distance": 30,
        "date_type": "arkipäivät",
        "order": 25
    },
    {
        "key": "milloin_kaavaluonnos_lautakunnassa",
        "value": "2027-06-08",
        "distance_from_previous": 27,
        "distance_to_next": 1,
        "initial_distance": 21,
        "date_type": "lautakunnan_kokouspäivät",
        "order": 28
    },
    {
        "key": "ehdotus_kylk_aineiston_maaraaika",
        "value": "2027-11-12",
        "distance_from_previous": 6,
        "distance_to_next": null,
        "initial_distance": 100,
        "date_type": "arkipäivät",
        "order": 29
    },
    {
        "key": "milloin_kaavaehdotus_lautakunnassa",
        "value": "2027-12-14",
        "distance_from_previous": 27,
        "distance_to_next": 1,
        "initial_distance": 21,
        "date_type": "lautakunnan_kokouspäivät",
        "order": 30
    },
    {
        "key": "milloin_ehdotuksen_nahtavilla_alkaa_iso",
        "value": "2027-12-28",
        "distance_from_previous": 1,
        "distance_to_next": 21,
        "initial_distance": 9,
        "date_type": "arkipäivät",
        "order": 31
    },
    {
        "key": "milloin_ehdotuksen_nahtavilla_paattyy",
        "value": "2028-01-28",
        "distance_from_previous": 21,
        "distance_to_next": null,
        "initial_distance": 21,
        "date_type": "arkipäivät",
        "order": 35
    },
    {
        "key": "tarkistettu_ehdotus_kylk_maaraaika",
        "value": "2028-04-06",
        "distance_from_previous": 6,
        "distance_to_next": null,
        "initial_distance": 50,
        "date_type": "arkipäivät",
        "order": 36
    },
    {
        "key": "milloin_tarkistettu_ehdotus_lautakunnassa",
        "value": "2028-05-16",
        "distance_from_previous": 27,
        "distance_to_next": 1,
        "initial_distance": 21,
        "date_type": "lautakunnan_kokouspäivät",
        "order": 39
    },
    {
        "key": "periaatteetvaihe_alkaa_pvm",
        "value": "2025-12-10"
    },
    {
        "key": "periaatteetvaihe_paattyy_pvm",
        "value": "2026-09-01"
    },
    {
        "key": "oasvaihe_alkaa_pvm",
        "value": "2026-09-01"
    },
    {
        "key": "oasvaihe_paattyy_pvm",
        "value": "2026-12-08"
    },
    {
        "key": "luonnosvaihe_alkaa_pvm",
        "value": "2026-12-08"
    },
    {
        "key": "luonnosvaihe_paattyy_pvm",
        "value": "2027-06-08"
    },
    {
        "key": "ehdotusvaihe_alkaa_pvm",
        "value": "2027-06-08"
    },
    {
        "key": "ehdotusvaihe_paattyy_pvm",
        "value": "2028-01-28"
    },
    {
        "key": "tarkistettuehdotusvaihe_alkaa_pvm",
        "value": "2028-01-28"
    },
    {
        "key": "tarkistettuehdotusvaihe_paattyy_pvm",
        "value": "2028-05-16"
    },
    {
        "key": "hyvaksyminenvaihe_alkaa_pvm",
        "value": "2028-05-16"
    },
    {
        "key": "hyvaksyminenvaihe_paattyy_pvm",
        "value": "2028-09-11"
    },
    {
        "key": "voimaantulovaihe_alkaa_pvm",
        "value": "2028-09-11"
    },
    {
        "key": "voimaantulovaihe_paattyy_pvm",
        "value": "2028-11-06"
    }
];

const test_disabledDates = {
    date_types: {
        "arkipäivät": {
            name: "Arkipäivät",
            identifier: "arkipäivät",
            dates: generateMockArkipäivät()
        },
        "työpäivät": {
            name: "Työpäivät",
            identifier: "työpäivät",
            dates: generateMockTyöpäivät()
        },
        "lautakunnan_kokouspäivät": {
            name: "Lautakunnan kokouspäivät",
            identifier: "lautakunnan_kokouspäivät",
            dates: generateMockLautakuntapäivät()
        },
        "disabled_dates": {
            name: "Poissuljetut päivät",
            identifier: "disabled_dates",
            dates: []
        }
    }
};

export default {
    decreasing_test_arr,
    test_disabledDates
};