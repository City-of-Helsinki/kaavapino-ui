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
});

describe("sortProjects function", () => {

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
