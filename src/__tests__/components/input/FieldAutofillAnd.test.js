import { getFieldAutofillValue } from '../../../utils/projectAutofillUtils'
import { describe, test, expect } from 'vitest'

describe('Autofill tests', () => {
  test('Autofill rule succeeds combine rule (boolean) both true', () => {
    const field = {}
    const conditionObject1 = {}
    conditionObject1.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = true
    conditionObject1.comparison_value_type = 'boolean'

    const conditionObject2 = {}
    conditionObject2.variable = 'sisaltyyko_kaavoitettua'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = true
    conditionObject2.comparison_value_type = 'boolean'

    const condition = {
      conditions: [conditionObject1, conditionObject2],
      then_branch: ', asemakaava ja asemakaavan muutos'
    }

    field.autofill_rule = [condition]

    const formValues = {
      sisaltyyko_kaavoittamatonta: true,
      sisaltyyko_kaavoitettua: true
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(
      ', asemakaava ja asemakaavan muutos'
    )
  })
  test('Autofill rule succeeds combine rule (boolean) project name missing', () => {
    const field = {}
    const conditionObject1 = {}
    conditionObject1.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = true
    conditionObject1.comparison_value_type = 'boolean'

    const conditionObject2 = {}
    conditionObject2.variable = 'sisaltyyko_kaavoitettua'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = true
    conditionObject2.comparison_value_type = 'boolean'

    const condition = {
      conditions: [conditionObject1, conditionObject2],
      then_branch: ', asemakaava ja asemakaavan muutos',
    }

    const conditionObject3 = {}
    conditionObject3.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject3.operator = '!='
    conditionObject3.comparison_value = true
    conditionObject3.comparison_value_type = 'boolean'

    const conditionObject4 = {}
    conditionObject4.variable = 'sisaltyyko_kaavoitettua'
    conditionObject4.operator = '=='
    conditionObject4.comparison_value = true
    conditionObject4.comparison_value_type = 'boolean'

    const condition2 = {
      conditions: [conditionObject3, conditionObject4],
      then_branch: ', asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject5 = {}
    conditionObject5.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject5.operator = '=='
    conditionObject5.comparison_value = true
    conditionObject5.comparison_value_type = 'boolean'

    const conditionObject6 = {}
    conditionObject6.variable = 'sisaltyyko_kaavoitettua'
    conditionObject6.operator = '!='
    conditionObject6.comparison_value = true
    conditionObject6.comparison_value_type = 'boolean'

    const condition3 = {
      conditions: [conditionObject5, conditionObject6],
      then_branch: ', asemakaava',
      variables: ['projektin_nimi']
    }

    field.autofill_rule = [condition, condition2, condition3]

    const formValues = {
      sisaltyyko_kaavoittamatonta: true,
      sisaltyyko_kaavoitettua: true,
      projektin_nimi: 'Testiprojekti'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(
      ', asemakaava ja asemakaavan muutos'
    )
  })

  test('Autofill rule succeeds combine rule (boolean) false/true', () => {
    const field = {}
    const conditionObject1 = {}
    conditionObject1.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = true
    conditionObject1.comparison_value_type = 'boolean'

    const conditionObject2 = {}
    conditionObject2.variable = 'sisaltyyko_kaavoitettua'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = true
    conditionObject2.comparison_value_type = 'boolean'

    const condition = {
      conditions: [conditionObject1, conditionObject2],
      then_branch: ', asemakaava ja asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject3 = {}
    conditionObject3.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject3.operator = '!='
    conditionObject3.comparison_value = true
    conditionObject3.comparison_value_type = 'boolean'

    const conditionObject4 = {}
    conditionObject4.variable = 'sisaltyyko_kaavoitettua'
    conditionObject4.operator = '=='
    conditionObject4.comparison_value = true
    conditionObject4.comparison_value_type = 'boolean'

    const condition2 = {
      conditions: [conditionObject3, conditionObject4],
      then_branch: ', asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject5 = {}
    conditionObject5.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject5.operator = '=='
    conditionObject5.comparison_value = true
    conditionObject5.comparison_value_type = 'boolean'

    const conditionObject6 = {}
    conditionObject6.variable = 'sisaltyyko_kaavoitettua'
    conditionObject6.operator = '!='
    conditionObject6.comparison_value = true
    conditionObject6.comparison_value_type = 'boolean'

    const condition3 = {
      conditions: [conditionObject5, conditionObject6],
      then_branch: ', asemakaava',
      variables: ['projektin_nimi']
    }

    field.autofill_rule = [condition, condition2, condition3]

    const formValues = {
      sisaltyyko_kaavoittamatonta: false,
      sisaltyyko_kaavoitettua: true,
      projektin_nimi: 'Testiprojekti'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(
      'Testiprojekti, asemakaavan muutos'
    )
  })

  test('Autofill rule succeeds combine rule (boolean) true/false', () => {
    const field = {}
    const conditionObject1 = {}
    conditionObject1.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = true
    conditionObject1.comparison_value_type = 'boolean'

    const conditionObject2 = {}
    conditionObject2.variable = 'sisaltyyko_kaavoitettua'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = true
    conditionObject2.comparison_value_type = 'boolean'

    const condition = {
      conditions: [conditionObject1, conditionObject2],
      then_branch: ', asemakaava ja asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject3 = {}
    conditionObject3.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject3.operator = '!='
    conditionObject3.comparison_value = true
    conditionObject3.comparison_value_type = 'boolean'

    const conditionObject4 = {}
    conditionObject4.variable = 'sisaltyyko_kaavoitettua'
    conditionObject4.operator = '=='
    conditionObject4.comparison_value = true
    conditionObject4.comparison_value_type = 'boolean'

    const condition2 = {
      conditions: [conditionObject3, conditionObject4],
      then_branch: ', asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject5 = {}
    conditionObject5.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject5.operator = '=='
    conditionObject5.comparison_value = true
    conditionObject5.comparison_value_type = 'boolean'

    const conditionObject6 = {}
    conditionObject6.variable = 'sisaltyyko_kaavoitettua'
    conditionObject6.operator = '!='
    conditionObject6.comparison_value = true
    conditionObject6.comparison_value_type = 'boolean'

    const condition3 = {
      conditions: [conditionObject5, conditionObject6],
      then_branch: ', asemakaava',
      variables: ['projektin_nimi']
    }

    field.autofill_rule = [condition, condition2, condition3]

    const formValues = {
      sisaltyyko_kaavoittamatonta: true,
      sisaltyyko_kaavoitettua: false,
      projektin_nimi: 'Testiprojekti'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(
      'Testiprojekti, asemakaava'
    )
  })
  test('Autofill rule succeeds combine rule (boolean) false/false', () => {
    const field = {}
    const conditionObject1 = {}
    conditionObject1.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = true
    conditionObject1.comparison_value_type = 'boolean'

    const conditionObject2 = {}
    conditionObject2.variable = 'sisaltyyko_kaavoitettua'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = true
    conditionObject2.comparison_value_type = 'boolean'

    const condition = {
      conditions: [conditionObject1, conditionObject2],
      then_branch: ', asemakaava ja asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject3 = {}
    conditionObject3.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject3.operator = '!='
    conditionObject3.comparison_value = true
    conditionObject3.comparison_value_type = 'boolean'

    const conditionObject4 = {}
    conditionObject4.variable = 'sisaltyyko_kaavoitettua'
    conditionObject4.operator = '=='
    conditionObject4.comparison_value = true
    conditionObject4.comparison_value_type = 'boolean'

    const condition2 = {
      conditions: [conditionObject3, conditionObject4],
      then_branch: ', asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject5 = {}
    conditionObject5.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject5.operator = '=='
    conditionObject5.comparison_value = true
    conditionObject5.comparison_value_type = 'boolean'

    const conditionObject6 = {}
    conditionObject6.variable = 'sisaltyyko_kaavoitettua'
    conditionObject6.operator = '!='
    conditionObject6.comparison_value = true
    conditionObject6.comparison_value_type = 'boolean'

    const condition3 = {
      conditions: [conditionObject5, conditionObject6],
      then_branch: ', asemakaava',
      variables: ['projektin_nimi']
    }

    const conditionObject7 = {}
    conditionObject7.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject7.operator = '"!='
    conditionObject7.comparison_value = true
    conditionObject7.comparison_value_type = 'boolean'

    const conditionObject8 = {}
    conditionObject8.variable = 'sisaltyyko_kaavoitettua'
    conditionObject8.operator = '!='
    conditionObject8.comparison_value = true
    conditionObject8.comparison_value_type = 'boolean'

    const condition4 = {
      conditions: [conditionObject7, conditionObject8],
      then_branch: '',
      variables: ['projektin_nimi']
    }

    field.autofill_rule = [condition, condition2, condition3, condition4]

    const formValues = {
      sisaltyyko_kaavoittamatonta: false,
      sisaltyyko_kaavoitettua: false,
      projektin_nimi: 'Testiprojekti'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(
      'Testiprojekti'
    )
  })
  test('Autofill rule succeeds combine rule (boolean) true / missing', () => {
    const field = {}
    const conditionObject1 = {}
    conditionObject1.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = true
    conditionObject1.comparison_value_type = 'boolean'

    const conditionObject2 = {}
    conditionObject2.variable = 'sisaltyyko_kaavoitettua'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = true
    conditionObject2.comparison_value_type = 'boolean'

    const condition = {
      conditions: [conditionObject1, conditionObject2],
      then_branch: ', asemakaava ja asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject3 = {}
    conditionObject3.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject3.operator = '!='
    conditionObject3.comparison_value = true
    conditionObject3.comparison_value_type = 'boolean'

    const conditionObject4 = {}
    conditionObject4.variable = 'sisaltyyko_kaavoitettua'
    conditionObject4.operator = '=='
    conditionObject4.comparison_value = true
    conditionObject4.comparison_value_type = 'boolean'

    const condition2 = {
      conditions: [conditionObject3, conditionObject4],
      then_branch: ', asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject5 = {}
    conditionObject5.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject5.operator = '=='
    conditionObject5.comparison_value = true
    conditionObject5.comparison_value_type = 'boolean'

    const conditionObject6 = {}
    conditionObject6.variable = 'sisaltyyko_kaavoitettua'
    conditionObject6.operator = '!='
    conditionObject6.comparison_value = true
    conditionObject6.comparison_value_type = 'boolean'

    const condition3 = {
      conditions: [conditionObject5, conditionObject6],
      then_branch: ', asemakaava',
      variables: ['projektin_nimi']
    }

    field.autofill_rule = [condition, condition2, condition3]

    const formValues = {
      sisaltyyko_kaavoittamatonta: true,
      projektin_nimi: 'Testiprojekti'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(
      'Testiprojekti, asemakaava'
    )
  })
  test('Autofill rule succeeds combine rule (boolean) missing/true', () => {
    const field = {}
    const conditionObject1 = {}
    conditionObject1.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = true
    conditionObject1.comparison_value_type = 'boolean'

    const conditionObject2 = {}
    conditionObject2.variable = 'sisaltyyko_kaavoitettua'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = true
    conditionObject2.comparison_value_type = 'boolean'

    const condition = {
      conditions: [conditionObject1, conditionObject2],
      then_branch: ', asemakaava ja asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject3 = {}
    conditionObject3.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject3.operator = '!='
    conditionObject3.comparison_value = true
    conditionObject3.comparison_value_type = 'boolean'

    const conditionObject4 = {}
    conditionObject4.variable = 'sisaltyyko_kaavoitettua'
    conditionObject4.operator = '=='
    conditionObject4.comparison_value = true
    conditionObject4.comparison_value_type = 'boolean'

    const condition2 = {
      conditions: [conditionObject3, conditionObject4],
      then_branch: ', asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject5 = {}
    conditionObject5.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject5.operator = '=='
    conditionObject5.comparison_value = true
    conditionObject5.comparison_value_type = 'boolean'

    const conditionObject6 = {}
    conditionObject6.variable = 'sisaltyyko_kaavoitettua'
    conditionObject6.operator = '!='
    conditionObject6.comparison_value = true
    conditionObject6.comparison_value_type = 'boolean'

    const condition3 = {
      conditions: [conditionObject5, conditionObject6],
      then_branch: ', asemakaava',
      variables: ['projektin_nimi']
    }

    field.autofill_rule = [condition, condition2, condition3]

    const formValues = {
      sisaltyyko_kaavoitettua: true,
      projektin_nimi: 'Testiprojekti'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(
      'Testiprojekti, asemakaavan muutos'
    )
  })
  test('Autofill rule succeeds combine rule (boolean) missing/missing', () => {
    const field = {}
    const conditionObject1 = {}
    conditionObject1.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = true
    conditionObject1.comparison_value_type = 'boolean'

    const conditionObject2 = {}
    conditionObject2.variable = 'sisaltyyko_kaavoitettua'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = true
    conditionObject2.comparison_value_type = 'boolean'

    const condition = {
      conditions: [conditionObject1, conditionObject2],
      then_branch: ', asemakaava ja asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject3 = {}
    conditionObject3.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject3.operator = '!='
    conditionObject3.comparison_value = true
    conditionObject3.comparison_value_type = 'boolean'

    const conditionObject4 = {}
    conditionObject4.variable = 'sisaltyyko_kaavoitettua'
    conditionObject4.operator = '=='
    conditionObject4.comparison_value = true
    conditionObject4.comparison_value_type = 'boolean'

    const condition2 = {
      conditions: [conditionObject3, conditionObject4],
      then_branch: ', asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject5 = {}
    conditionObject5.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject5.operator = '=='
    conditionObject5.comparison_value = true
    conditionObject5.comparison_value_type = 'boolean'

    const conditionObject6 = {}
    conditionObject6.variable = 'sisaltyyko_kaavoitettua'
    conditionObject6.operator = '!='
    conditionObject6.comparison_value = true
    conditionObject6.comparison_value_type = 'boolean'

    const condition3 = {
      conditions: [conditionObject5, conditionObject6],
      then_branch: ', asemakaava',
      variables: ['projektin_nimi']
    }

    field.autofill_rule = [condition, condition2, condition3]

    const formValues = {
      projektin_nimi: 'Testiprojekti'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(
      'Testiprojekti'
    )
  })
  test('Autofill rule succeeds combine rule (boolean) string comparison one true', () => {
    const field = {}
    const conditionObject1 = {}
    conditionObject1.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = "joo"
    conditionObject1.comparison_value_type = 'string'

    const conditionObject2 = {}
    conditionObject2.variable = 'sisaltyyko_kaavoitettua'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = "ei"
    conditionObject2.comparison_value_type = 'string'

    const condition = {
      conditions: [conditionObject1, conditionObject2],
      then_branch: ', asemakaava ja asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject3 = {}
    conditionObject3.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject3.operator = '!='
    conditionObject3.comparison_value = 'joo'
    conditionObject3.comparison_value_type = 'string'

    const conditionObject4 = {}
    conditionObject4.variable = 'sisaltyyko_kaavoitettua'
    conditionObject4.operator = '=='
    conditionObject4.comparison_value = "jee"
    conditionObject4.comparison_value_type = 'string'

    const condition2 = {
      conditions: [conditionObject3, conditionObject4],
      then_branch: ', asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject5 = {}
    conditionObject5.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject5.operator = '=='
    conditionObject5.comparison_value = 'joo'
    conditionObject5.comparison_value_type = 'string'

    const conditionObject6 = {}
    conditionObject6.variable = 'sisaltyyko_kaavoitettua'
    conditionObject6.operator = '!='
    conditionObject6.comparison_value = 'jee'
    conditionObject6.comparison_value_type = 'string'

    const condition3 = {
      conditions: [conditionObject5, conditionObject6],
      then_branch: ', asemakaava',
      variables: ['projektin_nimi']
    }

    field.autofill_rule = [condition, condition2, condition3]

    const formValues = {
      projektin_nimi: 'Testiprojekti',
      sisaltyyko_kaavoittamatonta: 'joo'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(
      'Testiprojekti, asemakaava'
    )
  })
  test('Autofill rule succeeds combine rule (boolean) string comparison all true', () => {
    const field = {}
    const conditionObject1 = {}
    conditionObject1.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = "joo"
    conditionObject1.comparison_value_type = 'string'

    const conditionObject2 = {}
    conditionObject2.variable = 'sisaltyyko_kaavoitettua'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = "jee"
    conditionObject2.comparison_value_type = 'string'

    const condition = {
      conditions: [conditionObject1, conditionObject2],
      then_branch: ', asemakaava ja asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject3 = {}
    conditionObject3.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject3.operator = '!='
    conditionObject3.comparison_value = 'joo'
    conditionObject3.comparison_value_type = 'string'

    const conditionObject4 = {}
    conditionObject4.variable = 'sisaltyyko_kaavoitettua'
    conditionObject4.operator = '=='
    conditionObject4.comparison_value = "jee"
    conditionObject4.comparison_value_type = 'string'

    const condition2 = {
      conditions: [conditionObject3, conditionObject4],
      then_branch: ', asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject5 = {}
    conditionObject5.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject5.operator = '=='
    conditionObject5.comparison_value = 'joo'
    conditionObject5.comparison_value_type = 'string'

    const conditionObject6 = {}
    conditionObject6.variable = 'sisaltyyko_kaavoitettua'
    conditionObject6.operator = '!='
    conditionObject6.comparison_value = 'jee'
    conditionObject6.comparison_value_type = 'string'

    const condition3 = {
      conditions: [conditionObject5, conditionObject6],
      then_branch: ', asemakaava',
      variables: ['projektin_nimi']
    }

    field.autofill_rule = [condition, condition2, condition3]

    const formValues = {
      projektin_nimi: 'Testiprojekti',
      sisaltyyko_kaavoittamatonta: 'joo',
      sisaltyyko_kaavoitettua: 'jee'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(
      'Testiprojekti, asemakaava ja asemakaavan muutos'
    )
  })
  test('Autofill rule succeeds combine rule (boolean) string comparison no values', () => {
    const field = {}
    const conditionObject1 = {}
    conditionObject1.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = "joo"
    conditionObject1.comparison_value_type = 'string'

    const conditionObject2 = {}
    conditionObject2.variable = 'sisaltyyko_kaavoitettua'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = "jee"
    conditionObject2.comparison_value_type = 'string'

    const condition = {
      conditions: [conditionObject1, conditionObject2],
      then_branch: ', asemakaava ja asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject3 = {}
    conditionObject3.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject3.operator = '!='
    conditionObject3.comparison_value = 'joo'
    conditionObject3.comparison_value_type = 'string'

    const conditionObject4 = {}
    conditionObject4.variable = 'sisaltyyko_kaavoitettua'
    conditionObject4.operator = '=='
    conditionObject4.comparison_value = "jee"
    conditionObject4.comparison_value_type = 'string'

    const condition2 = {
      conditions: [conditionObject3, conditionObject4],
      then_branch: ', asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject5 = {}
    conditionObject5.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject5.operator = '=='
    conditionObject5.comparison_value = 'joo'
    conditionObject5.comparison_value_type = 'string'

    const conditionObject6 = {}
    conditionObject6.variable = 'sisaltyyko_kaavoitettua'
    conditionObject6.operator = '!='
    conditionObject6.comparison_value = 'jee'
    conditionObject6.comparison_value_type = 'string'

    const condition3 = {
      conditions: [conditionObject5, conditionObject6],
      then_branch: ', asemakaava',
      variables: ['projektin_nimi']
    }

    field.autofill_rule = [condition, condition2, condition3]

    const formValues = {
      projektin_nimi: 'Testiprojekti'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(
      'Testiprojekti'
    )
  })
  test('Autofill rule succeeds combine rule (boolean) string comparison no values', () => {
    const field = {}
    const conditionObject1 = {}
    conditionObject1.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = "joo"
    conditionObject1.comparison_value_type = 'string'

    const conditionObject2 = {}
    conditionObject2.variable = 'sisaltyyko_kaavoitettua'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = "jee"
    conditionObject2.comparison_value_type = 'string'

    const condition = {
      conditions: [conditionObject1, conditionObject2],
      then_branch: ', asemakaava ja asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject3 = {}
    conditionObject3.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject3.operator = '!='
    conditionObject3.comparison_value = 'joo'
    conditionObject3.comparison_value_type = 'string'

    const conditionObject4 = {}
    conditionObject4.variable = 'sisaltyyko_kaavoitettua'
    conditionObject4.operator = '=='
    conditionObject4.comparison_value = "jee"
    conditionObject4.comparison_value_type = 'string'

    const condition2 = {
      conditions: [conditionObject3, conditionObject4],
      then_branch: ', asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject5 = {}
    conditionObject5.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject5.operator = '=='
    conditionObject5.comparison_value = 'joo'
    conditionObject5.comparison_value_type = 'string'

    const conditionObject6 = {}
    conditionObject6.variable = 'sisaltyyko_kaavoitettua'
    conditionObject6.operator = '!='
    conditionObject6.comparison_value = 'jee'
    conditionObject6.comparison_value_type = 'string'

    const condition3 = {
      conditions: [conditionObject5, conditionObject6],
      then_branch: ', asemakaava',
      variables: ['projektin_nimi']
    }

    field.autofill_rule = [condition, condition2, condition3]

    const formValues = {
      projektin_nimi: 'Testiprojekti',
      sisaltyyko_kaavoitettua: 'ehka',
      sisaltyyko_kaavoittamatonta: 'joo'

    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(
      'Testiprojekti, asemakaava'
    )
  })
  test('Autofill rule succeeds combine rule (boolean) string comparison both false', () => {
    const field = {}
    const conditionObject1 = {}
    conditionObject1.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = "joo"
    conditionObject1.comparison_value_type = 'string'

    const conditionObject2 = {}
    conditionObject2.variable = 'sisaltyyko_kaavoitettua'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = "jee"
    conditionObject2.comparison_value_type = 'string'

    const condition = {
      conditions: [conditionObject1, conditionObject2],
      then_branch: ', asemakaava ja asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject3 = {}
    conditionObject3.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject3.operator = '!='
    conditionObject3.comparison_value = 'joo'
    conditionObject3.comparison_value_type = 'string'

    const conditionObject4 = {}
    conditionObject4.variable = 'sisaltyyko_kaavoitettua'
    conditionObject4.operator = '=='
    conditionObject4.comparison_value = "jee"
    conditionObject4.comparison_value_type = 'string'

    const condition2 = {
      conditions: [conditionObject3, conditionObject4],
      then_branch: ', asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject5 = {}
    conditionObject5.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject5.operator = '=='
    conditionObject5.comparison_value = 'joo'
    conditionObject5.comparison_value_type = 'string'

    const conditionObject6 = {}
    conditionObject6.variable = 'sisaltyyko_kaavoitettua'
    conditionObject6.operator = '!='
    conditionObject6.comparison_value = 'jee'
    conditionObject6.comparison_value_type = 'string'

    const condition3 = {
      conditions: [conditionObject5, conditionObject6],
      then_branch: ', asemakaava',
      variables: ['projektin_nimi']
    }

    const conditionObject7 = {}
    conditionObject7.variable = 'jii'
    conditionObject7.operator = '"!='
    conditionObject7.comparison_value = true
    conditionObject7.comparison_value_type = 'string'

    const conditionObject8 = {}
    conditionObject8.variable = 'jee'
    conditionObject8.operator = '!='
    conditionObject8.comparison_value = true
    conditionObject8.comparison_value_type = 'string'

    const condition4 = {
      conditions: [conditionObject7, conditionObject8],
      then_branch: '',
      variables: ['projektin_nimi']
    }

    field.autofill_rule = [condition, condition2, condition3, condition4]

    const formValues = {
      projektin_nimi: 'Testiprojekti',
      sisaltyyko_kaavoitettua: 'ehka',
      sisaltyyko_kaavoittamatonta: 'ehka'

    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(
      'Testiprojekti'
    )
  })
  test('Autofill rule succeeds combine rule (boolean) string comparison both false', () => {
    const field = {}
    const conditionObject1 = {}
    conditionObject1.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = true
    conditionObject1.comparison_value_type = 'boolean'

    const conditionObject2 = {}
    conditionObject2.variable = 'sisaltyyko_kaavoitettua'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = true
    conditionObject2.comparison_value_type = 'boolean'

    const condition = {
      conditions: [conditionObject1, conditionObject2],
      then_branch: ', asemakaava ja asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject3 = {}
    conditionObject3.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject3.operator = '!='
    conditionObject3.comparison_value = true
    conditionObject3.comparison_value_type = 'boolean'

    const conditionObject4 = {}
    conditionObject4.variable = 'sisaltyyko_kaavoitettua'
    conditionObject4.operator = '=='
    conditionObject4.comparison_value = true
    conditionObject4.comparison_value_type = 'boolean'

    const condition2 = {
      conditions: [conditionObject3, conditionObject4],
      then_branch: ', asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject5 = {}
    conditionObject5.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject5.operator = '=='
    conditionObject5.comparison_value = true
    conditionObject5.comparison_value_type = 'boolean'

    const conditionObject6 = {}
    conditionObject6.variable = 'sisaltyyko_kaavoitettua'
    conditionObject6.operator = '!='
    conditionObject6.comparison_value = true
    conditionObject6.comparison_value_type = 'boolean'

    const condition3 = {
      conditions: [conditionObject5, conditionObject6],
      then_branch: ', asemakaava',
      variables: ['projektin_nimi']
    }

    const conditionObject7 = {}
    conditionObject7.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject7.operator = '"!='
    conditionObject7.comparison_value = true
    conditionObject7.comparison_value_type = 'boolean'

    const conditionObject8 = {}
    conditionObject8.variable = 'sisaltyyko_kaavoitettua'
    conditionObject8.operator = '!='
    conditionObject8.comparison_value = true
    conditionObject8.comparison_value_type = 'boolean'

    const condition4 = {
      conditions: [conditionObject7, conditionObject8],
      then_branch: '',
      variables: ['projektin_nimi']
    }

    field.autofill_rule = [condition, condition2, condition3, condition4]

    const formValues = {
      projektin_nimi: 'Testiprojekti',
      sisaltyyko_kaavoitettua: false,
      sisaltyyko_kaavoittamatonta: false

    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(
      'Testiprojekti'
    )
  })
  test('Autofill rule succeeds combine rule (boolean) string comparison both false', () => {
    const field = {}
    const conditionObject1 = {}
    conditionObject1.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = true
    conditionObject1.comparison_value_type = 'boolean'

    const conditionObject2 = {}
    conditionObject2.variable = 'sisaltyyko_kaavoitettua'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = true
    conditionObject2.comparison_value_type = 'boolean'

    const condition = {
      conditions: [conditionObject1, conditionObject2],
      then_branch: ', asemakaava ja asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject3 = {}
    conditionObject3.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject3.operator = '!='
    conditionObject3.comparison_value = true
    conditionObject3.comparison_value_type = 'boolean'

    const conditionObject4 = {}
    conditionObject4.variable = 'sisaltyyko_kaavoitettua'
    conditionObject4.operator = '=='
    conditionObject4.comparison_value = true
    conditionObject4.comparison_value_type = 'boolean'

    const condition2 = {
      conditions: [conditionObject3, conditionObject4],
      then_branch: ', asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject5 = {}
    conditionObject5.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject5.operator = '=='
    conditionObject5.comparison_value = true
    conditionObject5.comparison_value_type = 'boolean'

    const conditionObject6 = {}
    conditionObject6.variable = 'sisaltyyko_kaavoitettua'
    conditionObject6.operator = '!='
    conditionObject6.comparison_value = true
    conditionObject6.comparison_value_type = 'boolean'

    const condition3 = {
      conditions: [conditionObject5, conditionObject6],
      then_branch: ', asemakaava',
      variables: ['projektin_nimi']
    }

    const conditionObject7 = {}
    conditionObject7.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject7.operator = '"!='
    conditionObject7.comparison_value = true
    conditionObject7.comparison_value_type = 'boolean'

    const conditionObject8 = {}
    conditionObject8.variable = 'sisaltyyko_kaavoitettua'
    conditionObject8.operator = '!='
    conditionObject8.comparison_value = true
    conditionObject8.comparison_value_type = 'boolean'

    const condition4 = {
      conditions: [conditionObject7, conditionObject8],
      then_branch: '',
      variables: ['projektin_nimi']
    }

    field.autofill_rule = [condition, condition2, condition3, condition4]

    const formValues = {
      projektin_nimi: 'Testiprojekti',
      sisaltyyko_kaavoittamatonta: false

    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(
      'Testiprojekti'
    )
  })
  test('Autofill rule succeeds combine rule (boolean) string comparison both false', () => {
    const field = {}
    const conditionObject1 = {}
    conditionObject1.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = true
    conditionObject1.comparison_value_type = 'boolean'

    const conditionObject2 = {}
    conditionObject2.variable = 'sisaltyyko_kaavoitettua'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = true
    conditionObject2.comparison_value_type = 'boolean'

    const condition = {
      conditions: [conditionObject1, conditionObject2],
      then_branch: ', asemakaava ja asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject3 = {}
    conditionObject3.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject3.operator = '!='
    conditionObject3.comparison_value = true
    conditionObject3.comparison_value_type = 'boolean'

    const conditionObject4 = {}
    conditionObject4.variable = 'sisaltyyko_kaavoitettua'
    conditionObject4.operator = '=='
    conditionObject4.comparison_value = true
    conditionObject4.comparison_value_type = 'boolean'

    const condition2 = {
      conditions: [conditionObject3, conditionObject4],
      then_branch: ', asemakaavan muutos',
      variables: ['projektin_nimi']
    }

    const conditionObject5 = {}
    conditionObject5.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject5.operator = '=='
    conditionObject5.comparison_value = true
    conditionObject5.comparison_value_type = 'boolean'

    const conditionObject6 = {}
    conditionObject6.variable = 'sisaltyyko_kaavoitettua'
    conditionObject6.operator = '!='
    conditionObject6.comparison_value = true
    conditionObject6.comparison_value_type = 'boolean'

    const condition3 = {
      conditions: [conditionObject5, conditionObject6],
      then_branch: ', asemakaava',
      variables: ['projektin_nimi']
    }

    const conditionObject7 = {}
    conditionObject7.variable = 'sisaltyyko_kaavoittamatonta'
    conditionObject7.operator = '"!='
    conditionObject7.comparison_value = true
    conditionObject7.comparison_value_type = 'boolean'

    const conditionObject8 = {}
    conditionObject8.variable = 'sisaltyyko_kaavoitettua'
    conditionObject8.operator = '!='
    conditionObject8.comparison_value = true
    conditionObject8.comparison_value_type = 'boolean'

    const condition4 = {
      conditions: [conditionObject7, conditionObject8],
      then_branch: '',
      variables: ['projektin_nimi']
    }

    field.autofill_rule = [condition, condition2, condition3, condition4]

    const formValues = {
      projektin_nimi: 'Testiprojekti'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(
      'Testiprojekti'
    )
  })
})