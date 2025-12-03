import { showField } from '../../../utils/projectVisibilityUtils'
import { describe, test, expect } from 'vitest'

const field = {}
const field2 = {}
const field3 = {}
const field4 = {}
const field5 = {}
const field6 = {}
const field7 = {}
const field8 = {}
const field9 = {}

  field.visibility_conditions = [{
      variable: 'a',
      operator: '==',
      comparison_value: true,
      comparison_value_type: 'boolean'
    }]

    field2.visibility_conditions = [{
        variable: 'yleiskaava_2002_mukainen',
        operator: '!=',
        comparison_value: true,
        comparison_value_type: 'boolean'
    }]

    field3.visibility_conditions = [{
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

    field4.visibility_conditions = [{
        variable: 'a',
        operator: '!=',
        comparison_value: 'True',
        comparison_value_type: 'boolean'
    }]

    field5.visibility_conditions = [{
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

      field6.hide_conditions = [{
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

      field7.hide_conditions = [{
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

      field8.visibility_conditions = [{
          variable: 'muistutusten_lukumaara',
          operator: '!=',
          comparison_value: 0,
          comparison_value_type: 'number'
      }]

      field9.visibility_conditions = [{
        variable: 'a',
        operator: '!=',
        comparison_value: true,
        comparison_value_type: 'boolean'
      }]

describe('VisibilityCondition tests', () => {

  test('Shows field with == rule (boolean)', () => {
    const formValues = {
      a: true
    }
    expect(showField(field, formValues)).toBe(true)
  })
  test('Does not show field with == rule with undefined (boolean)', () => {
    const formValues = {
    }
    expect(showField(field, formValues)).toBe(false)
  })
  test('Does not show field with == rule with value (boolean)', () => {
    const formValues = {
      a: false
    }
    expect(showField(field, formValues)).toBe(false)
  })
  test('Show field with == rule with value (boolean)', () => {
    const formValues = {
      yleiskaava_2002_mukainen: false
    }
    expect(showField(field2, formValues)).toBe(true)
  })
  test('Show field with == rule with value (boolean) not found', () => {
    const formValues = {
    }
    expect(showField(field2, formValues)).toBe(true)
  })

  test('Show field with == rule with wrong type (boolean) but field has value', () => {
    const formValues = {
      a:'kaavapino'
    }
    expect(showField(field, formValues)).toBe(true)
  })
  test('Show field with == rule with wrong type (boolean) but field has not value', () => {
    const formValues = {
      a: undefined
    }
    expect(showField(field, formValues)).toBe(false)
  })
  test('Show field with == rule with wrong type (boolean) but not exists', () => {

    const formValues = {
    }
    expect(showField(field, formValues)).toBe(false)
  })
  test('Does not show field with == rule (boolean)', () => {

    const formValues = {
      a: false
    }
    expect(showField(field, formValues)).toBe(false)
  })
  test('Show field with multiple == rule (boolean)', () => {

    const formValues = {
      a: false,
      b: true
    }
    expect(showField(field3, formValues)).toBe(true)
  })
  test('Show field with multiple == rule all true (boolean)', () => {

    const formValues = {
      a: true,
      b: true
    }
    expect(showField(field3, formValues)).toBe(true)
  })
  test('Show field with != rule', () => {
    const formValues = {
      a: false
    }
    expect(showField(field4, formValues)).toBe(true)
  })
  test('Does not show field with != rule multiple values all true (boolean)', () => {
    const formValues = {
      a: true,
      b: true,
      c: true
    }
    expect(showField(field5, formValues)).toBe(false)
  })
  test('Shows field with != rule multiple values (boolean)', () => {
    const formValues = {
      a: true,
      b: false,
      c: true
    }
    expect(showField(field5, formValues)).toBe(true)
  })
  test('Shows field with != rule multiple values all false (boolean)', () => {
    const formValues = {
      a: false,
      b: false,
      c: false
    }
    expect(showField(field5, formValues)).toBe(true)
  })
  test('Shows field with != rule multiple values with undefined (boolean)', () => {

    const formValues = {
    }
    expect(showField(field5, formValues)).toBe(true)
  })
  test('Shows field with != rule multiple values with wrong value type (boolean)', () => {

    const formValues = {
      a: 'kaavapino'
    }
    expect(showField(field9, formValues)).toBe(false)
  })
  test('Shows field with != rule multiple values with wrong value type (boolean) value undefined', () => {

    const formValues = {
      a: undefined
    }
    expect(showField(field9, formValues)).toBe(true)
  })
  test('Shows field with != rule multiple values with wrong value type (boolean) value not found', () => {
    const formValues = {
    }
    expect(showField(field9, formValues)).toBe(true)
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
  })
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
  })
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

    const formValues = {
      a: true,
      b: true,
      c: true
    }
    expect(showField(field6, formValues)).toBe(false)
  })
  test('Shows field with == rule multiple values (boolean) hide_conditions 2', () => {


    const formValues = {
      a: false,
      b: true,
      c: false
    }
    expect(showField(field6, formValues)).toBe(false)
  })
  test('Shows field with == rule multiple values (boolean) hide_conditions 3', () => {

    const formValues = {
      a: false,
      b: false,
      c: false
    }
    expect(showField(field6, formValues)).toBe(true)
  })
  test('Shows field with == rule multiple values (boolean) hide_conditions 4', () => {

    const formValues = {
      yleiskaavan_2016_mukainen: false,
      yleiskaavan_2002_mukainen: false,
      osayleiskaavan_mukainen: false
    }
    expect(showField(field7, formValues)).toBe(true)
  })
  test('Shows field with == rule multiple values (boolean) hide_conditions 5', () => {

    const formValues = {
      yleiskaavan_2016_mukainen: true,
      yleiskaavan_2002_mukainen: true,
      osayleiskaavan_mukainen: true
    }
    expect(showField(field7, formValues)).toBe(false)
  })
  test('Shows field with == rule multiple values (boolean) hide_conditions 6', () => {

    const formValues = {
      yleiskaavan_2016_mukainen: false,
      yleiskaavan_2002_mukainen: false,
      osayleiskaavan_mukainen: true
    }
    expect(showField(field7, formValues)).toBe(false)
  })
  test('Shows field with == rule multiple values (boolean) hide_conditions 7', () => {

    const formValues = {
      yleiskaavan_2016_mukainen: false,
      yleiskaavan_2002_mukainen: false,
      osayleiskaavan_mukainen: undefined
    }
    expect(showField(field7, formValues)).toBe(true)
  })
  test('Shows field with == rule multiple values (boolean) hide_conditions 8', () => {

    const formValues = {
      yleiskaavan_2016_mukainen: false,
      osayleiskaavan_mukainen: undefined
    }
    expect(showField(field7, formValues)).toBe(true)
  })
  test('Shows field with == rule multiple values (boolean) hide_conditions 9', () => {

    const formValues = {

    }
    expect(showField(field7, formValues)).toBe(true)
  })
})

test('Shows field with != 0', () => {

  const formValues = {
    muistutusten_lukumaara: 1
  }
  expect(showField(field8, formValues)).toBe(true)
})
test('Shows field with != 0', () => {

  const formValues = {
    muistutusten_lukumaara: 0
  }
  expect(showField(field8, formValues, test.test)).toBe(false)
})
test('Shows field with != 0', () => {

  const formValues = {
    muistutusten_lukumaara: 1
  }
  expect(showField(field8, formValues, test.test)).toBe(true)
})
