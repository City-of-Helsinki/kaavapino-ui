import { describe, test, expect } from 'vitest';
import projectUtils from '../../utils/projectUtils';

describe('test projectUtils utility functions', () => {

  test('formatDateTime returns the correct formatted date and time', () => {
    expect(projectUtils.formatDateTime(new Date('2023-03-15T12:30:00'))).toBe('15.03.2023 12:30');
    expect(projectUtils.formatDateTime(new Date('2013-06-05T09:05:00'))).toBe('05.06.2013 09:05');
  });

  test('formatUsersName returns the correct formatted name', () => {
    expect(projectUtils.formatUsersName({ last_name: 'Meikäläinen', first_name: 'Matti' })).toBe('Meikäläinen Matti');
    expect(projectUtils.formatUsersName({ last_name: 'Virtanen', first_name: 'Liisa', email: 'liisa.virtanen@example.com' }))
      .toBe('Virtanen Liisa');
    expect(projectUtils.formatUsersName({ email: 'liisa.virtanen@example.com' })).toBe('liisa.virtanen@example.com');
    expect(projectUtils.formatUsersName(null)).toBe('');
  });

  test("formatDeadlines returns the correct formatted object", () => {
    const deadlinesInput = {
      name: "Test Project",
      deadlines: [
        { phase_name: "Phase 1", start: "2023-01-01T00:00:00Z", deadline: "2023-01-31T23:59:59Z" },
        { phase_name: "Phase 2", start: "2023-02-01T00:00:00Z", deadline: "2023-02-28T23:59:59Z" }
      ],
      subtype: "subtypeA"
    };
    const phases = [
      { id: 1, project_subtype: "subtypeA", index: 2, color_code: "#ff0000" },
      { id: 2, project_subtype: "subtypeA", index: 1, color_code: "#00ff00" },
      { id: 3, project_subtype: "subtypeB", index: 0, color_code: "#0000ff" }
    ];
    const result = projectUtils.formatDeadlines(deadlinesInput, phases);
    expect(result.title).toBe("Test Project");
    expect(result.deadlines.length).toBe(2);
    expect(result.deadlines[0].title).toBe("Phase 1");
    expect(result.deadlines[0].start).toBeInstanceOf(Date);
    expect(result.deadlines[1].end).toBeInstanceOf(Date);
    expect(result.colors).toEqual(["#00ff00", "#ff0000"]);
  });

  test("isFieldMissing returns correct boolean", () => {
    expect(projectUtils.isFieldMissing('testField', true, {})).toBe(true);
    expect(projectUtils.isFieldMissing('testField', true, { testField: null })).toBe(true);
    expect(projectUtils.isFieldMissing('testField', true, { testField: undefined })).toBe(true);
    expect(projectUtils.isFieldMissing('testField', true, { testField: '' })).toBe(true);
    expect(projectUtils.isFieldMissing('testField', true, { testField: [] })).toBe(true);

    expect(projectUtils.isFieldMissing('testField', true, { testField: 'value' })).toBe(false);
    expect(projectUtils.isFieldMissing('testField_readonly', true, { testField: 123 })).toBe(false);

    expect(projectUtils.isFieldMissing('testField', false, {})).toBe(false);
  });

  test("isFieldSetRequired returns correct boolean", () => {
    const test_fieldset = [
      { name: 'field1', required: true },
      { name: 'field2', required: false },
      { name: 'field3', required: true },
    ];
    expect(projectUtils.isFieldSetRequired(test_fieldset)).toBe(true);

    const test_fieldset2 = [
      { name: 'field1', required: false },
      { name: 'field2', required: false },
    ];
    expect(projectUtils.isFieldSetRequired(test_fieldset2)).toBe(false);
  });

  test("isFieldsetMissing returns correct boolean", () => {
    const test_formValues = {
      fieldset1: [
        { field1: 'value1', field2: 'value2' },
      ],
      fieldset2: [
        { field3: 'value3' },
      ],
      other_field: 'value4',
    };
    expect(projectUtils.isFieldsetMissing('fieldset1', test_formValues, true)).toBe(false);
    expect(projectUtils.isFieldsetMissing('fieldset2', test_formValues, true)).toBe(false);

    expect(projectUtils.isFieldsetMissing('fieldset3', test_formValues, true)).toBe(true);
    expect(projectUtils.isFieldsetMissing('fieldset3', test_formValues, false)).toBe(false);

  });


  test("formatFilterProject returns correct filtered projects", () => {
    const phases = [
      { id: 1, name: "Käynnistys", index: 2, color_code: "#ff0000" },
      { id: 2, project_subtype: "Luonnos", index: 1, color_code: "#00ff00" },
      { id: 3, project_subtype: "Ehdotus", index: 0, color_code: "#0000ff" }
    ];
    const test_users = [
      { id: 1, last_name: 'Meikäläinen', first_name: 'Matti' },
      { id: 2, last_name: 'Virtanen', first_name: 'Liisa' }
    ];
    const test_project = {
      pino_number: 123,
      name: "Test Project",
      phase: 2, // corresponds to phase with id 2
      user: 1,
      modified_at: new Date("2023-01-01"),
      subtype: 21,
      attribute_data: {
        hankenumero: "HNK-456",
        other_field: "1234"
      }
    };
    const formattedProject = projectUtils.formatFilterProject(test_project, false, phases, test_users);
    expect(Object.keys(formattedProject).length).toBe(7);

    expect(formattedProject.name).toBe("Test Project");
    expect(formattedProject.hankenumero).toBe("HNK-456");
    expect(formattedProject.projectId).toBe(123);
    expect(formattedProject.phase).toBe(1); // phase index
    expect(formattedProject.user).toBe("Meikäläinen Matti");
    expect(formattedProject.modified_at).toBe("01.01.2023");
    expect(formattedProject.subtype).toBe(21);

    const formattedProject_sort_true = projectUtils.formatFilterProject(test_project, true, phases, test_users);

    expect(formattedProject_sort_true.modified_at).toBeTypeOf("number");
    const modified_at_date = new Date(formattedProject_sort_true.modified_at);
    expect(modified_at_date.getFullYear()).toBe(2023);
    expect(modified_at_date.getMonth()).toBe(0);
    expect(modified_at_date.getDate()).toBe(1);
  });

  test("FormatNextDeadline returns formatted date for deadline", () => {
    const test_deadlines = [
      { phase_id: 123, deadline: "2023-01-31" },
      { phase_id: 456, deadline: "2023-02-28" }
    ];
    const result = projectUtils.formatNextDeadline(test_deadlines, 123);
    expect(result).toBe("31.01.2023");
  });

  test("formatSubtype returns correct subtype name", () => {
    const subtypes = [
      { id: 21, name: "Luonnos" },
      { id: 22, name: "Ehdotus" }
    ];
    expect(projectUtils.formatSubtype(21, subtypes)).toBe("Luonnos");
    expect(projectUtils.formatSubtype(22, subtypes)).toBe("Ehdotus");
    expect(projectUtils.formatSubtype(23, subtypes)).toBe(undefined);
  });

  test("getFieldsetAttributes function works correctly", () => {
    const sections = [
      {
        title: "Section 1",
        fields: [{
          'name': 'some_details',
          'fieldset_attributes': [{ name: "attribute1", value: "value1" }, { name: "attribute2", value: "value2" }]
        },
        { 'name': 'other_field', 'fieldset_attributes': [] }]
      },
      {
        title: "Section 2",
        fields: [{
          'name': 'additional_info',
          'fieldset_attributes': [{ name: "attribute3", value: "value3" }, { name: "attribute4", value: "value4" }]
        }]
      }
    ];
    expect(projectUtils.getFieldsetAttributes("additional_info", sections)).toStrictEqual(["attribute3", "attribute4"]);
    expect(projectUtils.getFieldsetAttributes("other_field", sections)).toStrictEqual([]);
    expect(projectUtils.getFieldsetAttributes("non_existent", sections)).toBeUndefined();
  });

  test("getDefaultValue returns the first value from fieldsets", () => {
    const attr_data = {
      field1: "value1",
      fieldset_1: [
        { attr1: "val1", attr2: "val2" },
        { attr1: "val3", attr2: "val4" },
      ]
    };
    expect(projectUtils.getDefaultValue('fieldset_1', attr_data, "attr1")).toBe("val1");
    expect(projectUtils.getDefaultValue('field1', attr_data, "attr1")).toBeUndefined();
    expect(projectUtils.getDefaultValue('non_existent', attr_data, "attr1")).toBeUndefined();
  });

  test("generateArrayOfYears generates correct array", () => {
    const years = projectUtils.generateArrayOfYears();
    const currentYear = new Date().getFullYear();
    expect(years.length).toBe(21); // from currentYear + 2 to currentYear - 18
    for (let i = 0; i < years.length; i++) {
      const yearObj = years[i];
      const expectedYear = currentYear + 2 - i;
      expect(yearObj.key).toBe(expectedYear.toString());
      expect(yearObj.label).toBe(expectedYear.toString());
      expect(yearObj.value).toBe(expectedYear);
      expect(Object.keys(yearObj)).toContain('parameter');
      expect(yearObj.parameter).toBeUndefined();
    }
    const customParam = "testParam";
    const yearsWithParam = projectUtils.generateArrayOfYears(customParam);
    expect(yearsWithParam[0].parameter).toBe(customParam);
  });

  test("generateArrayOfYearsForChart generates correct array", () => {
    const years = projectUtils.generateArrayOfYearsForChart();
    const currentYear = new Date().getFullYear();
    expect(years.length).toBe(15); // from currentYear + 9 to currentYear - 5
    for (let i = 0; i < years.length; i++) {
      const yearObj = years[i];
      const expectedYear = currentYear - 5 + i;
      expect(yearObj.key).toBe(expectedYear.toString());
      expect(yearObj.label).toBe(expectedYear.toString());
      expect(yearObj.value).toBe(expectedYear);
    }
  });

  test("findValueFromObject finds correct value", () => {
    const testObj = {
      level1: {
        level2: {
          level3: "finalValue"
        },
        fieldsetWithDeleted: [{
          _deleted: true,
          temporaryValue: "shouldNotFind",
        },
        {
          _deleted: false,
          temporaryValue: "not_deleted_value"
        }]
      },
      topLevel: "topValue"
    };
    expect(projectUtils.findValueFromObject(testObj, 'level3')).toBe("finalValue");
    expect(projectUtils.findValueFromObject(testObj, 'temporaryValue')).toBe("not_deleted_value");
    expect(projectUtils.findValueFromObject(testObj, 'topLevel')).toBe("topValue");
    expect(projectUtils.findValueFromObject(testObj, 'non.existent.path')).toBeUndefined();
  });

  test("findValuesFromObject adds values to the provided array", () => {
    const testObj = {
      level1: {
        level2: {
          target: "level2Value",

        },
        fieldsetWithDeleted: [{
          _deleted: true,
          target: "shouldNotFind",
        },
        {
          _deleted: false,
          target: "not_deleted_value"
        }],
        something_else: 123,
      },
      target: "topValue"
    };
    const valuesArray = [];
    projectUtils.findValuesFromObject(testObj, 'target', valuesArray);
    expect(valuesArray).toContain("not_deleted_value");
    expect(valuesArray).not.toContain("shouldNotFind");

    const valuesArray2 = [];
    projectUtils.findValuesFromObject(testObj, 'target', valuesArray2);
    expect(valuesArray2).toContain("level2Value");
  });

  test("isSceduleAccepted flags unconfirmed dates", () => {
    const test_schema = {
      sections: [
        {
          name: "2. OAS",
          attributes: [
            { name: "deadline_1" },
            { name: "deadline_2" },
            { name: "vahvista_oas_esillaolo_alkaa" },
            { name: "vahvista_oas_esillaolo_alkaa_2" },
          ]
        },
      ]
    };
    const test_attribute_data = {
      kaavan_vaihe: "2. OAS",
      deadline_1: null,
      deadline_2: "2023-12-31",
      vahvista_oas_esillaolo_alkaa: false,
      vahvista_oas_esillaolo_alkaa_2: false,
    };
    const result = projectUtils.isSceduleAccepted(test_attribute_data, test_schema);
    expect(result).toContain("vahvista_oas_esillaolo_alkaa");
    test_attribute_data.vahvista_oas_esillaolo_alkaa = true;
    const result2 = projectUtils.isSceduleAccepted(test_attribute_data, test_schema);
    expect(result2).toEqual([]);
    // Unconfirmed date in another phase
    test_schema.sections[1] = {
      name: "3. Ehdotus",
      attributes: [
        { name: "deadline_3" },
        { name: "vahvista_ehdotus_esillaolo_alkaa" },
      ]
    };
    const result3 = projectUtils.isSceduleAccepted(test_attribute_data, test_schema);
    expect(result3).toEqual([]);
  });

  test("hasUnconfirmedRequiredConfirmations", () => {
    const test_schema = {
      title: "3. Periaatteet",
      sections: [
        {
          name: "3. Periaatteet",
          attributes: [
            { name: "jarjestetaan_periaatteet_esillaolo_1"},
            { name: "vahvista_periaatteet_esillaolo_alkaa" },
            { name: "periaatteet_lautakuntaan_1"},
            { name: "vahvista_periaatteet_lautakunnassa" },
          ]
        },
      ]
    };

    const test_attribute_data = {
      kaavan_vaihe: "3. Periaatteet",
      jarjestetaan_periaatteet_esillaolo_1: true,
      vahvista_periaatteet_esillaolo_alkaa: false,
      periaatteet_lautakuntaan_1: false,
      vahvista_periaatteet_lautakunnassa: false,
    };
    const result = projectUtils.hasUnconfirmedRequiredConfirmations(test_attribute_data, test_schema);
    expect(result).toBe(true);
    test_attribute_data.vahvista_periaatteet_esillaolo_alkaa = true;
    const result2 = projectUtils.hasUnconfirmedRequiredConfirmations(test_attribute_data, test_schema);
    expect(result2).toBe(false);
    test_attribute_data.periaatteet_lautakuntaan_1 = true;
    const result3 = projectUtils.hasUnconfirmedRequiredConfirmations(test_attribute_data, test_schema);
    expect(result3).toBe(true);
    test_attribute_data.vahvista_periaatteet_lautakunnassa = true;
    const result4 = projectUtils.hasUnconfirmedRequiredConfirmations(test_attribute_data, test_schema);
    expect(result4).toBe(false);
  });
  test("getField returns correct field from sections", () => {
    const sections = [
        {
          name: "Section 1",
          fields: [
            { name: "field1", value: "some value" },
            { name: "field2", value: "another value" },
            { name: "field3", value: "more value" },
            { name: "field4", value: "different value" },
          ]
        },
      ];

    const field = projectUtils.getField("field2", sections);
    expect(field).toEqual({ name: "field2", value: "another value" });
    expect(projectUtils.getField("field5", sections)).toBeNull();
  });

  test("getField returns correct field from fieldsets", () => {
    const sections = [
        {
          name: "Section 1",
          fields: [
            { name: "field1", value: "some value" },
            { name: "field2", value: "another value" },
            { name: "fieldset1", type: "fieldset", fieldset_attributes: [
              { name: "fieldset_item1", value: "fieldset value 1" },
              { name: "fieldset_item2", value: "fieldset value 2" }
            ]},
            { name: "deep_fieldset", type: "fieldset", fieldset_attributes: [
              { name: "nested_fieldset", type: "fieldset", fieldset_attributes: [
                { name: "deep_item", value: "deep value" }
              ]}
            ]}
          ]
        },
      ];
    expect(projectUtils.getField("fieldset_item2", sections)).toEqual({ name: "fieldset_item2", value: "fieldset value 2" });
    expect(projectUtils.getField("deep_item", sections)).toEqual({ name: "deep_item", value: "deep value" });
  });

  test("objectsEqual compares two shallow objects correctly", () => {
    const obj1 = { a: 1, b: 2, c: 3 };
    const obj2 = { a: 1, b: 2, c: 3 };
    const obj3 = { a: 1, b: 2, c: 4 };
    expect(projectUtils.objectsEqual(obj1, obj2)).toBe(true);
    expect(projectUtils.objectsEqual(obj1, obj3)).toBe(false);
  });

  test("diffArray finds differences between two arrays", () => {
    const arr1 = [1, 2, 3, 4];
    const arr2 = [3, 4, 5, 6];
    const diff = projectUtils.diffArray(arr1, arr2);
    expect(diff).toEqual([1, 2, 5, 6]);
  });
  
  test("getMissingGeoData returns missing or updated geoData entries", () => {

    const attData = { a: 1 };
    const geoData = { a: 1, b: 2, c: "3.5" };
    expect(projectUtils.getMissingGeoData(attData, geoData),
    "getMissingGeoData returns missing keys from geoData if not present in attData").toEqual({ b: 2, c: "3.5" });

    const attData2 = { a: 1, b: 0, c: "0.0" };
    const geoData2 = { a: 1, b: 5, c: "4.2" };
    expect(projectUtils.getMissingGeoData(attData2, geoData2),
    "getMissingGeoData returns updated values from geoData if different and truthy").toEqual({ b: 5, c: "4.2" });

    const attData3 = { a: 1 };
    const geoData3 = { a: 1, b: "0.0" };
    expect(projectUtils.getMissingGeoData(attData3, geoData3), 
    "getMissingGeodata returns 0.0 from geodata if no value is saved in attribute_data").toEqual({"b": "0.0"});

    const attData4 = { a: 1};
    const geoData4 = { a: 2.5 };
    expect(projectUtils.getMissingGeoData(attData4, geoData4),
    "getMissingGeoData overwrites existing attData values with geoData values").toEqual({ a: 2.5 });

    // Case: geoData value is falsy (should not include)
    const attData5 = { a: 1, b:2, c:3, d:4, e:5 };
    const geoData5 = { a: 1, b: 0, c: null, d: undefined, e: "" };
    expect(projectUtils.getMissingGeoData(attData5, geoData5)).toEqual({});

    // Case: attData has same value as geoData, should not include
    const attData6 = { a: 1, b: 2 };
    const geoData6 = { a: 1, b: 2 };
    expect(projectUtils.getMissingGeoData(attData6, geoData6)).toEqual({});
  });
});


describe("projectUtils.sortProjects sorts projects correctly", () => {

  const SORT_TEST_PHASES = [
    { id: 1, name: "Käynnistys", index: 2, color_code: "#ff0000" },
    { id: 2, project_subtype: "Luonnos", index: 1, color_code: "#00ff00" },
    { id: 3, project_subtype: "Ehdotus", index: 0, color_code: "#0000ff" }
  ];
  const SORT_TEST_USERS = [
    { id: 1, last_name: 'Meikäläinen', first_name: 'Matti' },
    { id: 2, last_name: 'Virtanen', first_name: 'Liisa' }
  ];
  const SORT_TEST_PROJECTS = [
    {
      pino_number: 123,
      name: "Alpha",
      phase: 2,
      user: 1,
      modified_at: new Date("2023-01-01"),
      subtype: 21,
      attribute_data: { hankenumero: "HNK-456" }
    },
    {
      pino_number: 456,
      name: "Beta",
      phase: 1,
      user: 2,
      modified_at: new Date("2022-12-01"),
      subtype: 22,
      attribute_data: { hankenumero: "HNK-789" }
    },
    {
      pino_number: 789,
      name: "Gamma",
      phase: 3,
      user: 1,
      modified_at: new Date("2023-02-01"),
      subtype: 23,
      attribute_data: { hankenumero: "HNK-000" }
    }
  ];
  test("sortProjects sorts by name ascending", () => {
    const options = {
      sort: 2, // 'name'
      dir: 0, // ascending
      phases: SORT_TEST_PHASES,
      amountOfProjectsToShow: 3,
      users: SORT_TEST_USERS
    };
    const sorted = projectUtils.sortProjects(SORT_TEST_PROJECTS, options);
    expect(sorted[0].name).toBe("Alpha");
    expect(sorted[1].name).toBe("Beta");
    expect(sorted[2].name).toBe("Gamma");
  });

  test("sortProjects sorts by name descending", () => {
    const options = {
      sort: 2, // 'name'
      dir: 1, // descending
      phases: SORT_TEST_PHASES,
      amountOfProjectsToShow: 3,
      users: SORT_TEST_USERS
    };
    const sorted = projectUtils.sortProjects(SORT_TEST_PROJECTS, options);
    expect(sorted[0].name).toBe("Gamma");
    expect(sorted[1].name).toBe("Beta");
    expect(sorted[2].name).toBe("Alpha");
  });

  test("sortProjects returns unsorted if sort < 0", () => {
    const options = {
      sort: -1,
      dir: 0,
      phases: SORT_TEST_PHASES,
      amountOfProjectsToShow: 3,
      users: SORT_TEST_USERS
    };
    const sorted = projectUtils.sortProjects(SORT_TEST_PROJECTS, options);
    expect(sorted).toEqual(SORT_TEST_PROJECTS);
  });

  test("sortProjects respects amountOfProjectsToShow", () => {
    const options = {
      sort: 2,
      dir: 0,
      phases: SORT_TEST_PHASES,
      amountOfProjectsToShow: 2,
      users: SORT_TEST_USERS
    };
    const sorted = projectUtils.sortProjects(SORT_TEST_PROJECTS, options);
    expect(sorted.length).toBe(3);
    expect(sorted[0].name).toBe("Alpha");
    expect(sorted[1].name).toBe("Beta");
    expect(sorted[2].name).toBe("Gamma");
  });
});

describe("projectUtils.hasMissingFields checks for missing fields correctly", () => {
  const TEST_PROJECT = {
    phase: 123
  };
  const SCHEMA_TEMPLATE = {
    phases: [
      {
        id: 123,
        sections: [
          {
            title: "Section 1", fields: [
              // Fill in in tests
            ]
          },
        ],
      },
      { id: 456, sections: [] }
    ],
    deadline_sections: [{id: 123}]
  };

  test(`checkDeadlineSchemaErrors detects confirmation fields
      that are set to false or missing when in document download context`, () => {
    const errorFields = [];
    const deadlineSchema = {
      id: 123,
      sections: [
        { title: "Deadline Section", attributes: [
          { required: true, name: "vahvista_luonnos_esillaolo_alkaa" },
          { required: true, name: "vahvista_luonnos_esillaolo_alkaa_2" },
          { required: true, name: "vahvista_kaavaluonnos_lautakunnassa" },
          { required: false, name: "vahvista_optional_field" }
        ] }
      ],
    };
    const attribute_data = {
      "vahvista_luonnos_esillaolo_alkaa": false,
      "vahvista_luonnos_esillaolo_alkaa_2": null,
      "vahvista_optional_field": false
    };
    const isEndPhaseCheck = false;
    const result = projectUtils.checkDeadlineSchemaErrors(errorFields, deadlineSchema, attribute_data, isEndPhaseCheck);
    expect(result.length).toBe(3);
    const attrs = result.map(err => err.attr?.name);
    expect(attrs).toContain("vahvista_luonnos_esillaolo_alkaa");
    expect(attrs).toContain("vahvista_luonnos_esillaolo_alkaa_2");
    expect(attrs).toContain("vahvista_kaavaluonnos_lautakunnassa");
    expect(attrs).not.toContain("vahvista_optional_field");
    attribute_data["vahvista_luonnos_esillaolo_alkaa"] = true;
    const result2 = projectUtils.checkDeadlineSchemaErrors([], deadlineSchema, attribute_data, isEndPhaseCheck);
    expect(result2.length).toBe(2);
    attribute_data["vahvista_luonnos_esillaolo_alkaa_2"] = true;
    const result3 = projectUtils.checkDeadlineSchemaErrors([], deadlineSchema, attribute_data, isEndPhaseCheck);
    expect(result3.length).toBe(1);
    attribute_data["vahvista_kaavaluonnos_lautakunnassa"] = true;
    const result4 = projectUtils.checkDeadlineSchemaErrors([], deadlineSchema, attribute_data, isEndPhaseCheck);
    expect(result4.length).toBe(0);
  });

  test(`checkDeadlineSchemaErrors detects confirmation fields
      that are set to false or missing when in phase ending context`, () => {
    const deadlineSchema = {
      id: 123,
      sections: [
        { title: "Deadline Section", attributes: [
          { required: true, name: "vahvista_luonnos_esillaolo_alkaa" },
          { required: true, name: "vahvista_luonnos_esillaolo_alkaa_2" },
          { required: true, name: "vahvista_kaavaluonnos_lautakunnassa" },
          { required: true, name: "vahvista_ungrouped_field" },
          { required: false, name: "vahvista_optional_field" }
        ] }
      ],
    };
    const attribute_data = {
      "jarjestetaan_luonnos_esillaolo_1": true,
      "vahvista_luonnos_esillaolo_alkaa": false, // Should be flagged
      "vahvista_luonnos_esillaolo_alkaa_2": null, // Not flagged because visibility condition not met
      "kaavaluonnos_lautakuntaan_1": true, // causes vahvista_kaavaluonnos_lautakunnassa to be required
      "vahvista_optional_field": false,
      "ungrouped_required_field": false // Should be flagged
    };
    const isEndPhaseCheck = true;
    const result = projectUtils.checkDeadlineSchemaErrors([], deadlineSchema, attribute_data, isEndPhaseCheck);
    expect(result.length).toBe(3);
    const attrs = result.map(err => err.attr?.name);
    expect(attrs).toContain("vahvista_luonnos_esillaolo_alkaa");
    expect(attrs).toContain("vahvista_kaavaluonnos_lautakunnassa");
    expect(attrs).toContain("vahvista_ungrouped_field");
    expect(attrs).not.toContain("vahvista_optional_field");
  });

  test("checkDeadlineSchemaErrors validates Voimaantulo case correctly", () => {
    const deadlineSchema = {
      id: 123,
      title: "Voimaantulo",
      sections: [
        { title: "Voimaantulo", attributes: [] }
      ],
    };
    const attribute_data = {
        'unrelated_field': 'some_value',
    };
    const result = projectUtils.checkDeadlineSchemaErrors([], deadlineSchema, attribute_data, false);
    expect(result.length).toBe(1);
    attribute_data['voimaantulo_pvm'] = null;
    const result2 = projectUtils.checkDeadlineSchemaErrors([], deadlineSchema, attribute_data, false);
    expect(result2.length).toBe(1);
    attribute_data['voimaantulo_pvm'] = '2023-12-31';
    const result3 = projectUtils.checkDeadlineSchemaErrors([], deadlineSchema, attribute_data, false);
    expect(result3.length).toBe(0);
  });

  
  test("hasMissingFields detects missing simple fields", () => {
    const test_attribute_data = {
      mandatory_field1: null,
      optional_field: null,
    };
    const test_schema = structuredClone(SCHEMA_TEMPLATE);
    test_schema.phases[0].sections[0].fields = [
      { name: "mandatory_field1", required: true },
      { name: "optional_field", required: false },
    ];
    const result = projectUtils.hasMissingFields(test_attribute_data, TEST_PROJECT, test_schema);
    expect(result).toBe(true);
    test_attribute_data.mandatory_field1 = "now_filled";
    const result2 = projectUtils.hasMissingFields(test_attribute_data, TEST_PROJECT, test_schema);
    expect(result2).toBe(false);
  });

  test("hasMissingFields detects missing matrix field", () => {
    const test_attribute_data = {
      matrix_field: [
        { matrix_mandatory_1: null, matrix_optional_1: null },
      ]
    };
    const test_schema = structuredClone(SCHEMA_TEMPLATE);
    test_schema.phases[0].sections[0].fields = [
      {
        name: "matrix_field", type: "matrix", matrix: {
          fields: [
            { name: "matrix_mandatory_1", required: true },
            { name: "matrix_optional_1", required: false }
          ]
        }
      }
    ];
    const result = projectUtils.hasMissingFields(test_attribute_data, TEST_PROJECT, test_schema);
    expect(result).toBe(true);
    test_attribute_data.matrix_field[0].matrix_mandatory_1 = "now_filled";
    const result2 = projectUtils.hasMissingFields(test_attribute_data, TEST_PROJECT, test_schema);
    expect(result2).toBe(false);
  });

  test("hasMissingFields does not flag autofill field", () => {
    const test_attribute_data = {
      autofill_field: [
        { autofill_mandatory_1: null, autofill_optional_1: null },
      ]
    };
    const test_schema = structuredClone(SCHEMA_TEMPLATE);
    test_schema.phases[0].sections[0].fields = [
      {
        name: "autofill_field", type: "autofill", autofill: {
          fields: [
            { name: "autofill_mandatory_1", required: true, autofill_readonly: true },
            { name: "autofill_optional_1", required: false, autofill_readonly: true }
          ]
        }
      }
    ];
    const result = projectUtils.hasMissingFields(test_attribute_data, TEST_PROJECT, test_schema);
    expect(result).toBe(false);
  });

  test("hasMissingFields checks fieldsets correctly", () => {
    const test_attribute_data = {
      fieldset_field: [
        { "fieldset_mandatory": null, _deleted: true },
        { "fieldset_optional": null, _deleted: true }
      ]
    };
    const test_schema = structuredClone(SCHEMA_TEMPLATE);
    test_schema.phases[0].sections[0].fields = [
      {
        name: "fieldset_field", type: "fieldset", fieldset_attributes: [
          { name: "fieldset_mandatory", required: true, },
          { name: "fieldset_optional_1", required: false }
        ]
      }
    ];
    const result = projectUtils.hasMissingFields(test_attribute_data, TEST_PROJECT, test_schema);
    expect(result).toBe(true);
    test_attribute_data.fieldset_field[0].fieldset_mandatory = "now_filled";
    test_attribute_data.fieldset_field[0]._deleted = false;
    const result2 = projectUtils.hasMissingFields(test_attribute_data, TEST_PROJECT, test_schema);
    expect(result2).toBe(false);
  });
});

describe("projectUtils.checkErrors checks for erroneous fields correctly", () => {
  const SCHEMA_TEMPLATE = {
    phases: [
      {
        id: 123,
        sections: [
          {
            title: "Section 1", fields: [
              // Fill in in tests
            ]
          },
        ]
      },
      { id: 456, sections: [] }
    ]
  };

  test("checkErrors detects missing simple fields", () => {
    const test_attribute_data = {
      mandatory_field1: null,
      mandatory_field2: "filled",
      mandatory_field3: "",
      optional_field: null,
    };
    const test_schema = structuredClone(SCHEMA_TEMPLATE.phases[0]);
    test_schema.sections[0].fields = [
      { name: "mandatory_field1", required: true, label: "Mandatory Field 1" },
      { name: "mandatory_field2", required: true, label: "Mandatory Field 2" },
      { name: "mandatory_field3", required: true, label: "Mandatory Field 3" },
      { name: "optional_field", required: false, label: "Optional Field" },
    ];
    const result = projectUtils.checkErrors([], test_schema, test_attribute_data);
    expect(result.length).toBe(2);
    expect(result[0]).toMatchObject({ errorField: "Mandatory Field 1", errorSection: "Section 1", "fieldAnchorKey": "mandatory_field1" });
    expect(result[1]).toMatchObject({ errorField: "Mandatory Field 3", errorSection: "Section 1", "fieldAnchorKey": "mandatory_field3" });
    test_attribute_data.mandatory_field1 = "now_filled";
    const result2 = projectUtils.checkErrors([], test_schema, test_attribute_data);
    expect(result2[0]).toMatchObject({ errorField: "Mandatory Field 3", errorSection: "Section 1", "fieldAnchorKey": "mandatory_field3" });
  });
  test("checkErrors detects missing matrix field", () => {
    const test_attribute_data = {
      matrix_field: [
        { matrix_mandatory_1: null, matrix_optional_1: null },
      ]
    };
    const test_schema = structuredClone(SCHEMA_TEMPLATE.phases[0]);
    test_schema.sections[0].fields = [
      {
        name: "matrix_field", type: "matrix", label: "Matrix Field", matrix: {
          fields: [
            { name: "matrix_mandatory_1", required: true, label: "Matrix Mandatory 1" },
            { name: "matrix_optional_1", required: false, label: "Matrix Optional 1" }
          ]
        }
      }
    ];
    const result = projectUtils.checkErrors([], test_schema, test_attribute_data);
    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject({ errorField: "Matrix Mandatory 1", errorSection: "Section 1", fieldAnchorKey: "matrix_mandatory_1" });
    test_attribute_data.matrix_field[0].matrix_mandatory_1 = "now_filled";
    const result2 = projectUtils.checkErrors([], test_schema, test_attribute_data);
    expect(result2).toEqual([]);
  });
  test("checkErrors checks fieldsets correctly", () => {
    const test_attribute_data = {
      fieldset_field: [
        { "fieldset_mandatory": null, _deleted: true },
        { "fieldset_optional": null, _deleted: true }
      ]
    };
    const test_schema = structuredClone(SCHEMA_TEMPLATE.phases[0]);
    test_schema.sections[0].fields = [
      {
        name: "fieldset_field", type: "fieldset", label: "Fieldset Field", fieldset_attributes: [
          { name: "fieldset_mandatory", required: true, label: "Fieldset Mandatory" },
          { name: "fieldset_optional_1", required: false, label: "Fieldset Optional 1" }
        ]
      }
    ];
    const result = projectUtils.checkErrors([], test_schema, test_attribute_data);
    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject({ errorField: "Fieldset Field", errorSection: "Section 1", fieldAnchorKey: "fieldset_field" });
    test_attribute_data.fieldset_field[0].fieldset_mandatory = "now_filled";
    test_attribute_data.fieldset_field[0]._deleted = false;
    const result2 = projectUtils.checkErrors([], test_schema, test_attribute_data);
    expect(result2).toEqual([]);
  });
});

describe("projectUtils.getErrorFields returns correct error fields", () => {
  const SCHEMA_TEMPLATE = {
    id: 123,
    title: "Käynnistys",
    sections: [
      {
        title: "Section 1", fields: [
          // Fill in in tests
        ]
      },
    ]
  };
  const TEST_PROJECT = {
    phase: 123
  };

  test("getErrorFields returns missing fields as errors", () => {
    const test_attribute_data = {
      mandatory_field1: null,
      kaavan_vaihe: "1. Käynnistys",
    };
    const test_schema = structuredClone(SCHEMA_TEMPLATE);
    test_schema.sections[0].fields = [
      { name: "mandatory_field1", required: true, label: "Mandatory Field 1" },
    ];
    const result = projectUtils.getErrorFields(true, test_attribute_data, test_schema, TEST_PROJECT.phase);
    expect(result.length).toBe(1);
    expect(result[0]).toEqual({ errorField: "Mandatory Field 1", errorSection: "Section 1", fieldAnchorKey: "mandatory_field1", title: "Tämä näkymä" });
    // Checkdocuments can be false if schema.sections is provided
    const result2 = projectUtils.getErrorFields(false, test_attribute_data, test_schema, TEST_PROJECT.phase);
    expect(result2.length).toBe(1);
    expect(result2[0]).toEqual({ errorField: "Mandatory Field 1", errorSection: "Section 1", fieldAnchorKey: "mandatory_field1", title: "Tämä näkymä" });
  });
});