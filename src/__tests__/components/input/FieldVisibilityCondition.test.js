import { showField } from '../../../utils/projectVisibilityUtils'
describe('VisibilityCondition tests', () => {

  test('Shows field with == rule (boolean)', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
      a: true
    }
    expect(showField(field, formValues)).toBe(true)
  })
  test('Does not show field with == rule with undefined (boolean)', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
    }
    expect(showField(field, formValues)).toBe(false)
  })
  test('Does not show field with == rule with value (boolean)', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
      a: false
    }
    expect(showField(field, formValues)).toBe(false)
  })
  test('Show field with == rule with value (boolean)', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'yleiskaava_2002_mukainen',
        operator: '!=',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
      yleiskaava_2002_mukainen: false
    }
    expect(showField(field, formValues)).toBe(true)
  })
  test('Show field with == rule with value (boolean) not found', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'yleiskaava_2002_mukainen',
        operator: '!=',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
    }
    expect(showField(field, formValues)).toBe(true)
  })

  test('Show field with == rule with wrong type (boolean) but field has value', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
      a:'kaavapino'
    }
    expect(showField(field, formValues)).toBe(true)
  })
  test('Show field with == rule with wrong type (boolean) but field has not value', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
      a: undefined
    }
    expect(showField(field, formValues)).toBe(false)
  })
  test('Show field with == rule with wrong type (boolean) but not exists', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
    }
    expect(showField(field, formValues)).toBe(false)
  })
  test('Does not show field with == rule (boolean)', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
      a: false
    }
    expect(showField(field, formValues)).toBe(false)
  })
  test('Show field with multiple == rule (boolean)', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'b',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
      a: false,
      b: true
    }
    expect(showField(field, formValues)).toBe(true)
  })
  test('Show field with multiple == rule all true (boolean)', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'b',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
      a: true,
      b: true
    }
    expect(showField(field, formValues)).toBe(true)
  })
  test('Show field with != rule', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '!=',
        comparison_value: 'True',
        comparison_value_type: 'boolean'
      }]

    const formValues = {
      a: false
    }
    expect(showField(field, formValues)).toBe(true)
  })
  test('Does not show field with != rule multiple values all true (boolean)', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '!=',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'b',
        operator: '!=',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'c',
        operator: '!=',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
      a: true,
      b: true,
      c: true
    }
    expect(showField(field, formValues)).toBe(false)
  })
  test('Shows field with != rule multiple values (boolean)', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '!=',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'b',
        operator: '!=',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'c',
        operator: '!=',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
      a: true,
      b: false,
      c: true
    }
    expect(showField(field, formValues)).toBe(true)
  })
  test('Shows field with != rule multiple values all false (boolean)', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '!=',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'b',
        operator: '!=',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'c',
        operator: '!=',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
      a: false,
      b: false,
      c: false
    }
    expect(showField(field, formValues)).toBe(true)
  })
  test('Shows field with != rule multiple values with undefined (boolean)', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '!=',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'b',
        operator: '!=',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'c',
        operator: '!=',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
    }
    expect(showField(field, formValues)).toBe(true)
  })
  test('Shows field with != rule multiple values with wrong value type (boolean)', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '!=',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
      a: 'kaavapino'
    }
    expect(showField(field, formValues)).toBe(false)
  })
  test('Shows field with != rule multiple values with wrong value type (boolean) value undefined', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '!=',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
      a: undefined
    }
    expect(showField(field, formValues)).toBe(true)
  })
  test('Shows field with != rule multiple values with wrong value type (boolean) value not found', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '!=',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
    }
    expect(showField(field, formValues)).toBe(true)
  })
  test('Shows field with == rule success (string)', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '==',
        comparison_value: 'kaavapino',
        comparison_value_type: 'string'
      }]

    const formValues = {
      a: 'kaavapino'
    }
    expect(showField(field, formValues)).toBe(true)
  })
  test('Shows field with == rule fail (string)', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '==',
        comparison_value: 'jokumuu',
        comparison_value_type: 'string'
      }]

    const formValues = {
      a: 'kaavapino'
    }
    expect(showField(field, formValues)).toBe(false)
  })
  test('Shows field with != rule success (string)', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '!=',
        comparison_value: 'jokumuu',
        comparison_value_type: 'string'
      }]

    const formValues = {
      a: 'kaavapino'
    }
    expect(showField(field, formValues)).toBe(true)
  })
  test('Shows field with != rule (string)', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '!=',
        comparison_value: 'kaavapino',
        comparison_value_type: 'string'
      }]

    const formValues = {
      a: 'kaavapino'
    }
    expect(showField(field, formValues)).toBe(false)
  })
  test('Shows field with == rule (number)', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '==',
        comparison_value: 1,
        comparison_value_type: 'number'
      }]

    const formValues = {
      a: 1
    }
    expect(showField(field, formValues)).toBe(true)
  })
  test('Shows field with == rule fails (number)', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '==',
        comparison_value: 2,
        comparison_value_type: 'number'
      }]

    const formValues = {
      a: 1
    }
    expect(showField(field, formValues)).toBe(false)
  })
  test('Shows field with != rule (number)', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '!=',
        comparison_value: 2,
        comparison_value_type: 'number'
      }]

    const formValues = {
      a: 1
    }
    expect(showField(field, formValues)).toBe(true)
  })
  test('Shows field with != rule fails (number)', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '!=',
        comparison_value: 2,
        comparison_value_type: 'number'
      }]

    const formValues = {
      a: 2
    }
    expect(showField(field, formValues)).toBe(false)
  }),
  test('Shows field with != rule succeed (number)', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: '!=',
        comparison_value: 0,
        comparison_value_type: 'number'
      }]

    const formValues = {
      a: 2
    }
    expect(showField(field, formValues)).toBe(true)
  }),
  test('Shows field with in rule (list)', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: 'in',
        comparison_value: 'test',
        comparison_value_type: 'list<string>'
      }]

    const formValues = {
      a: ['atest', 'btest', 'test', 'dtest']
    }
    expect(showField(field, formValues)).toBe(false)
  })
  test('Shows field with in rule (list) not found', () => {
    const field = {}
    field.visibility_conditions = [{
        variable: 'a',
        operator: 'in',
        comparison_value: 'teste',
        comparison_value_type: 'list<string>'
      }]

    const formValues = {
      a: ['atest', 'btest', 'test', 'dtest']
    }
    expect(showField(field, formValues)).toBe(false)
  })
  test('Shows field with == rule multiple values (boolean) hide_conditions 1', () => {
    const field = {}
    field.hide_conditions = [{
        variable: 'a',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'b',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'c',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
      a: true,
      b: true,
      c: true
    }
    expect(showField(field, formValues)).toBe(false)
  })
  test('Shows field with == rule multiple values (boolean) hide_conditions 2', () => {
    const field = {}
    field.hide_conditions = [{
        variable: 'a',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'b',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'c',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
      a: false,
      b: true,
      c: false
    }
    expect(showField(field, formValues)).toBe(false)
  })
  test('Shows field with == rule multiple values (boolean) hide_conditions 3', () => {
    const field = {}
    field.hide_conditions = [{
        variable: 'a',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'b',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'c',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
      a: false,
      b: false,
      c: false
    }
    expect(showField(field, formValues)).toBe(true)
  })
  test('Shows field with == rule multiple values (boolean) hide_conditions 4', () => {
    const field = {}
    field.hide_conditions = [{
        variable: 'yleiskaavan_2016_mukainen',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'yleiskaava_2002_mukainen',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'osayleiskaavan_mukainen',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
      yleiskaavan_2016_mukainen: false,
      yleiskaavan_2002_mukainen: false,
      osayleiskaavan_mukainen: false
    }
    expect(showField(field, formValues)).toBe(true)
  })
  test('Shows field with == rule multiple values (boolean) hide_conditions 5', () => {
    const field = {}
    field.hide_conditions = [{
        variable: 'yleiskaavan_2016_mukainen',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'yleiskaava_2002_mukainen',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'osayleiskaavan_mukainen',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
      yleiskaavan_2016_mukainen: true,
      yleiskaavan_2002_mukainen: true,
      osayleiskaavan_mukainen: true
    }
    expect(showField(field, formValues)).toBe(false)
  })
  test('Shows field with == rule multiple values (boolean) hide_conditions 6', () => {
    const field = {}
    field.hide_conditions = [{
        variable: 'yleiskaavan_2016_mukainen',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'yleiskaava_2002_mukainen',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'osayleiskaavan_mukainen',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
      yleiskaavan_2016_mukainen: false,
      yleiskaavan_2002_mukainen: false,
      osayleiskaavan_mukainen: true
    }
    expect(showField(field, formValues)).toBe(false)
  })
  test('Shows field with == rule multiple values (boolean) hide_conditions 7', () => {
    const field = {}
    field.hide_conditions = [{
        variable: 'yleiskaavan_2016_mukainen',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'yleiskaava_2002_mukainen',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'osayleiskaavan_mukainen',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
      yleiskaavan_2016_mukainen: false,
      yleiskaavan_2002_mukainen: false,
      osayleiskaavan_mukainen: undefined
    }
    expect(showField(field, formValues)).toBe(true)
  })
  test('Shows field with == rule multiple values (boolean) hide_conditions 8', () => {
    const field = {}
    field.hide_conditions = [{
        variable: 'yleiskaavan_2016_mukainen',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'yleiskaava_2002_mukainen',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'osayleiskaavan_mukainen',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {
      yleiskaavan_2016_mukainen: false,
      osayleiskaavan_mukainen: undefined
    }
    expect(showField(field, formValues)).toBe(true)
  })
  test('Shows field with == rule multiple values (boolean) hide_conditions 9', () => {
    const field = {}
    field.hide_conditions = [{
        variable: 'yleiskaavan_2016_mukainen',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'yleiskaava_2002_mukainen',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      },
      {
        variable: 'osayleiskaavan_mukainen',
        operator: '==',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

    const formValues = {

    }
    expect(showField(field, formValues)).toBe(true)
  })
})

test('Shows field with != 0', () => {
  const field = {}
  field.visibility_conditions = [{
      variable: 'muistutusten_lukumaara',
      operator: '!=',
      comparison_value: 0,
      comparison_value_type: 'number'
    }]

  const formValues = {
    muistutusten_lukumaara: 1
  }
  expect(showField(field, formValues)).toBe(true)
})
test('Shows field with != 0', () => {
  const field = {}
  field.visibility_conditions = [{
      variable: 'muistutusten_lukumaara',
      operator: '!=',
      comparison_value: 0,
      comparison_value_type: 'number'
    }]

  const formValues = {
    muistutusten_lukumaara: 0
  }
  expect(showField(field, formValues, test.test)).toBe(false)
})
test('Shows field with != 0', () => {
  const field = {}
  field.visibility_conditions = [{
      variable: 'muistutusten_lukumaara',
      operator: '!=',
      comparison_value: 0,
      comparison_value_type: 'number'
    }]

  const formValues = {
    muistutusten_lukumaara: 1
  }
  expect(showField(field, formValues, test.test)).toBe(true)
})
