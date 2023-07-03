import { EDIT_PROJECT_TIMETABLE_FORM } from '../../../constants'
import { getFieldAutofillValue } from '../../../utils/projectAutofillUtils'

const field = {}
const conditionObject = {}
const conditionObject1 = {}
const conditionObject2 = {}
const conditionObject3 = {}
const conditionObject4 = {}
const conditionObject5 = {}

let current = ''

let condition = { condition: {}, then_branch: '' }
let condition2 = { condition: {}, then_branch: '' }
let condition3 = { condition: {}, then_branch: '' }
let condition4 = { condition: {}, then_branch: '' }
let condition5 = { condition: {}, then_branch: '' }


describe('Autofill tests', () => {

 test('Autofill rule succeeds (string)', () => {
    conditionObject.variable = 'a'
    conditionObject.operator = '=='
    conditionObject.comparison_value = 'testitulos'
    conditionObject.comparison_value_type = 'string'

    condition = { condition: conditionObject, then_branch: 'uusitulos' }
    field.autofill_rule = [condition]

    const formValues = {
      a: 'testitulos'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe('uusitulos')
  })
  test('Autofill rule not succeeds (string)', () => {
    conditionObject.variable = 'a'
    conditionObject.operator = '=='
    conditionObject.comparison_value = 'testjotain'
    conditionObject.comparison_value_type = 'string'

    condition = { condition: conditionObject, then_branch: 'uusitulos' }
    field.autofill_rule = [condition]

    const formValues = {
      a: 'testitulos'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(undefined)
  })
  test('Autofill rule succeeds (boolean)', () => {
    conditionObject.variable = 'a'
    conditionObject.operator = '=='
    conditionObject.comparison_value = true
    conditionObject.comparison_value_type = 'boolean'

    condition = { condition: conditionObject, then_branch: 'True' }
    field.autofill_rule = [condition]

    const formValues = {
      a: true
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(true)
  })
  test('Autofill rule not succeeds (boolean)', () => {
    conditionObject.variable = 'a'
    conditionObject.operator = '=='
    conditionObject.comparison_value = true
    conditionObject.comparison_value_type = 'boolean'

    condition = { condition: conditionObject, then_branch: 'True' }
    field.autofill_rule = [condition]

    const formValues = {
      a: false
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(undefined)
  })
  test('Autofill rule succeeds (boolean)', () => {
    conditionObject.variable = 'a'
    conditionObject.operator = '!='
    conditionObject.comparison_value = true
    conditionObject.comparison_value_type = 'boolean'

    condition = { condition: conditionObject, then_branch: 'True' }
    field.autofill_rule = [condition]

    const formValues = {
      a: true
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(undefined)
  })
  test('Autofill rule not succeeds (boolean)', () => {
    conditionObject.variable = 'a'
    conditionObject.operator = '!='
    conditionObject.comparison_value = true
    conditionObject.comparison_value_type = 'boolean'

    condition = { condition: conditionObject, then_branch: 'True' }
    field.autofill_rule = [condition]

    const formValues = {
      a: false
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(true)
  })
  test('Autofill rule succeeds multiple (string)', () => {
    conditionObject1.variable = 'yksikon_johtaja'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = 'Mikko'
    conditionObject1.comparison_value_type = 'string'

    conditionObject2.variable = 'yksikon_johtaja'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = 'Jaakko'
    conditionObject2.comparison_value_type = 'string'

    conditionObject3.variable = 'yksikon_johtaja'
    conditionObject3.operator = '=='
    conditionObject3.comparison_value = 'Ville'
    conditionObject3.comparison_value_type = 'string'

    condition = { condition: conditionObject1, then_branch: 'Eteläinen' }
    condition2 = { condition: conditionObject2, then_branch: 'Pohjoinen' }
    condition3 = { condition: conditionObject3, then_branch: 'Itäinen' }

    field.autofill_rule = [condition, condition2, condition3]

    const formValues = {
      yksikon_johtaja: 'Jaakko'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe('Pohjoinen')
  })
  test('Autofill rule succeeds multiple (string)', () => {
    conditionObject1.variable = 'yksikon_johtaja'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = 'Mikko'
    conditionObject1.comparison_value_type = 'string'

    conditionObject2.variable = 'yksikon_johtaja'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = 'Jaakko'
    conditionObject2.comparison_value_type = 'string'

    conditionObject3.variable = 'yksikon_johtaja'
    conditionObject3.operator = '=='
    conditionObject3.comparison_value = 'Ville'
    conditionObject3.comparison_value_type = 'string'

    condition = { condition: conditionObject1, then_branch: 'Eteläinen' }
    condition2 = { condition: conditionObject2, then_branch: 'Pohjoinen' }
    condition3 = { condition: conditionObject3, then_branch: 'Itäinen' }

    field.autofill_rule = [condition, condition2, condition3]

    const formValues = {
      yksikon_johtaja: 'Ville'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe('Itäinen')
  })
  test('Autofill rule not succeeds multiple (string)', () => {
    conditionObject1.variable = 'yksikon_johtaja'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = 'Mikko'
    conditionObject1.comparison_value_type = 'string'

    conditionObject2.variable = 'yksikon_johtaja'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = 'Jaakko'
    conditionObject2.comparison_value_type = 'string'

    conditionObject3.variable = 'yksikon_johtaja'
    conditionObject3.operator = '=='
    conditionObject3.comparison_value = 'Ville'
    conditionObject3.comparison_value_type = 'string'

    condition = { condition: conditionObject1, then_branch: 'Eteläinen' }
    condition2 = { condition: conditionObject2, then_branch: 'Pohjoinen' }
    condition3 = { condition: conditionObject3, then_branch: 'Itäinen' }

    field.autofill_rule = [condition, condition2, condition3]

    const formValues = {
      yksikon_johtaja: 'Kalevi'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(undefined)
  })
  test('Autofill rule succeeds multiple (string)', () => {
    conditionObject1.variable = 'vastuuyksikko'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = 'Läntinen alueyksikkö'
    conditionObject1.comparison_value_type = 'string'

    conditionObject2.variable = 'vastuuyksikko'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = 'Koivusaari-Lauttasaari'
    conditionObject2.comparison_value_type = 'string'

    conditionObject3.variable = 'vastuuyksikko'
    conditionObject3.operator = '=='
    conditionObject3.comparison_value = 'Kaarela-Vihdintie'
    conditionObject3.comparison_value_type = 'string'

    conditionObject4.variable = 'vastuuyksikko'
    conditionObject4.operator = '=='
    conditionObject4.comparison_value = 'Pohjoinen alueyksikko'
    conditionObject4.comparison_value_type = 'string'

     condition = { condition: conditionObject1, then_branch: 'Tuomas Eskola' }
     condition2 = { condition: conditionObject2, then_branch: 'Mikko Reinikainen' }
     condition3 = { condition: conditionObject3, then_branch: 'Suvi Tyynilä' }
     condition4 = { condition: conditionObject4, then_branch: 'Antti Varkemaa' }

    field.autofill_rule = [condition, condition2, condition3, condition4]

    const formValues = {
      vastuuyksikko: 'Kaarela-Vihdintie'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe('Suvi Tyynilä')
  })
  test('Autofill rule succeeds multiple not found (string)', () => {

    conditionObject1.variable = 'vastuuyksikko'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = 'Läntinen alueyksikkö'
    conditionObject1.comparison_value_type = 'string'

    conditionObject2.variable = 'vastuuyksikko'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = 'Koivusaari-Lauttasaari'
    conditionObject2.comparison_value_type = 'string'

    conditionObject3.variable = 'vastuuyksikko'
    conditionObject3.operator = '=='
    conditionObject3.comparison_value = 'Kaarela-Vihdintie'
    conditionObject3.comparison_value_type = 'string'

    conditionObject4.variable = 'vastuuyksikko'
    conditionObject4.operator = '=='
    conditionObject4.comparison_value = 'Pohjoinen alueyksikko'
    conditionObject4.comparison_value_type = 'string'

     condition = { condition: conditionObject1, then_branch: 'Tuomas Eskola' }
     condition2 = { condition: conditionObject2, then_branch: 'Mikko Reinikainen' }
     condition3 = { condition: conditionObject3, then_branch: 'Suvi Tyynilä' }
     condition4 = { condition: conditionObject4, then_branch: 'Antti Varkemaa' }

    field.autofill_rule = [condition, condition2, condition3, condition4]

    const formValues = {
      vastuuyksikko: 'Eteläinen yksikkö'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(undefined)
  })
  test('Autofill rule succeeds (list)', () => {

    conditionObject1.variable = 'vastuuyksikko'
    conditionObject1.operator = 'in'
    conditionObject1.comparison_value = ['eka', 'toka', 'kolmas']
    conditionObject1.comparison_value_type = 'list<string>'

     condition = { condition: conditionObject1, then_branch: 'loytyy_listasta' }

    field.autofill_rule = [condition]

    const formValues = {
      vastuuyksikko: 'toka'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe('loytyy_listasta')
  })
  test('Autofill rule not succeeds (list)', () => {

    conditionObject1.variable = 'vastuuyksikko'
    conditionObject1.operator = 'in'
    conditionObject1.comparison_value = ['eka', 'toka', 'kolmas']
    conditionObject1.comparison_value_type = 'list<string>'

    condition = { condition: conditionObject1, then_branch: 'loytyy_listasta' }

    field.autofill_rule = [condition]

    const formValues = {
      vastuuyksikko: 'neljäs'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(undefined)
  })
 
  test('Autofill rule fails boolean if/else', () => {
    conditionObject1.variable = 'maanomistus_yksityinen'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = true
    conditionObject1.comparison_value_type = 'boolean'

    conditionObject2.variable = 'maanomistus_yksityinen'
    conditionObject2.operator = '!='
    conditionObject2.comparison_value = true
    conditionObject2.comparison_value_type = 'boolean'

     condition = { condition: conditionObject1, then_branch: 'True' }
     condition2 = { condition: conditionObject2, then_branch: 'False' }

    field.autofill_rule = [condition, condition2]

    const formValues = {
      maanomistus_yksityinen: false
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(false)
  })
  test('Autofill rule succeeds boolean if/else', () => {

    conditionObject1.variable = 'maanomistus_yksityinen'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = true
    conditionObject1.comparison_value_type = 'boolean'


    conditionObject2.variable = 'maanomistus_yksityinen'
    conditionObject2.operator = '!='
    conditionObject2.comparison_value = true
    conditionObject2.comparison_value_type = 'boolean'

     condition = { condition: conditionObject1, then_branch: 'True' }
     condition2 = { condition: conditionObject2, then_branch: 'False' }

    field.autofill_rule = [condition, condition2]

    const formValues = {
      maanomistus_yksityinen: true
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(true)
  })
  test('Autofill list', () => {

    conditionObject1.variable = 'oasvaiheen_dokumentin_nimi'
    conditionObject1.operator = 'in'
    conditionObject1.comparison_value = ['OAS', 'saatekirje']
    conditionObject1.comparison_value_type = 'list<string>'

    conditionObject2.variable = 'oasvaiheen_dokumentin_nimi'
    conditionObject2.operator = 'in'
    conditionObject2.comparison_value = [
      'osallisten_osoitelista',
      'Lehti-ilmoitus',
      'oas_jatai_luonnosvaiheessa_mielipiteen_esittaneet',
      'kirje_hakijalle_maksusta'
    ]
    conditionObject2.comparison_value_type = 'list<string>'

     condition = { condition: conditionObject1, then_branch: 'True' }
     condition2 = { condition: conditionObject2, then_branch: 'False' }
    field.autofill_rule = [condition, condition2, []]

    const formValues = {
      oasvaiheen_dokumentin_nimi: 'Lehti-ilmoitus'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(false)
  })
  test('Autofill rule list 2', () => {

    conditionObject1.variable = 'oasvaiheen_dokumentin_nimi'
    conditionObject1.operator = 'in'
    conditionObject1.comparison_value = ['OAS', 'saatekirje']
    conditionObject1.comparison_value_type = 'list<string>'

    conditionObject2.variable = 'oasvaiheen_dokumentin_nimi'
    conditionObject2.operator = 'in'
    conditionObject2.comparison_value = [
      'osallisten_osoitelista',
      'Lehti-ilmoitus',
      'oas_jatai_luonnosvaiheessa_mielipiteen_esittaneet',
      'kirje_hakijalle_maksusta'
    ]
    conditionObject2.comparison_value_type = 'list<string>'

     condition = { condition: conditionObject1, then_branch: 'True' }
     condition2 = { condition: conditionObject2, then_branch: 'False' }
    field.autofill_rule = [condition, condition2, []]

    const formValues = {
      oasvaiheen_dokumentin_nimi: 'saatekirje'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(true)
  })
  test('Autofill rule list 3', () => {

    conditionObject1.variable = 'oasvaiheen_dokumentin_nimi'
    conditionObject1.operator = 'in'
    conditionObject1.comparison_value = ['OAS', 'saatekirje']
    conditionObject1.comparison_value_type = 'list<string>'

    conditionObject2.variable = 'oasvaiheen_dokumentin_nimi'
    conditionObject2.operator = 'in'
    conditionObject2.comparison_value = [
      'osallisten_osoitelista',
      'Lehti-ilmoitus',
      'oas_jatai_luonnosvaiheessa_mielipiteen_esittaneet',
      'kirje_hakijalle_maksusta'
    ]
    conditionObject2.comparison_value_type = 'list<string>'

     condition = { condition: conditionObject1, then_branch: 'True' }
     condition2 = { condition: conditionObject2, then_branch: 'False' }
    field.autofill_rule = [condition, condition2, []]

    const formValues = {
      oasvaiheen_dokumentin_nimi: 'tadaa'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(undefined)
  })
  test('Autofill rule list 4', () => {

    conditionObject1.variable = 'oasvaiheen_dokumentin_nimi'
    conditionObject1.operator = 'in'
    conditionObject1.comparison_value = ['OAS', 'saatekirje']
    conditionObject1.comparison_value_type = 'list<string>'

    conditionObject2.variable = 'oasvaiheen_dokumentin_nimi'
    conditionObject2.operator = 'in'
    conditionObject2.comparison_value = [
      'osallisten_osoitelista',
      'Lehti-ilmoitus',
      'oas_jatai_luonnosvaiheessa_mielipiteen_esittaneet',
      'kirje_hakijalle_maksusta'
    ]
    conditionObject2.comparison_value_type = 'list<string>'

     condition = { condition: conditionObject1, then_branch: 'True' }
     condition2 = { condition: conditionObject2, then_branch: 'False' }
    field.autofill_rule = [condition, condition2, []]

    const formValues = {
      oasvaiheen_dokumentin_nimi: 'kirje_hakijalle_maksusta'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(false)
  })
  test('Autofill rule list 4', () => {

    conditionObject1.variable = 'oasvaiheen_dokumentin_nimi'
    conditionObject1.operator = 'in'
    conditionObject1.comparison_value = ['OAS', 'saatekirje']
    conditionObject1.comparison_value_type = 'list<string>'

    conditionObject2.variable = 'oasvaiheen_dokumentin_nimi'
    conditionObject2.operator = 'in'
    conditionObject2.comparison_value = [
      'osallisten_osoitelista',
      'Lehti-ilmoitus',
      'oas_jatai_luonnosvaiheessa_mielipiteen_esittaneet',
      'kirje_hakijalle_maksusta'
    ]
    conditionObject2.comparison_value_type = 'list<string>'

     condition = { condition: conditionObject1, then_branch: 'True' }
     condition2 = { condition: conditionObject2, then_branch: 'False' }
    field.autofill_rule = [condition, condition2, []]

    const formValues = {
      oasvaiheen_dokumentin_nimi: 'kirje_hakijalle_maksusta'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(false)
  })
  test('Autofill rule list 4', () => {

    conditionObject1.variable = 'oasvaiheen_dokumentin_nimi'
    conditionObject1.operator = 'in'
    conditionObject1.comparison_value = ['OAS', 'saatekirje']
    conditionObject1.comparison_value_type = 'list<string>'

    conditionObject2.variable = 'oasvaiheen_dokumentin_nimi'
    conditionObject2.operator = 'in'
    conditionObject2.comparison_value = [
      'osallisten_osoitelista',
      'Lehti-ilmoitus',
      'oas_jatai_luonnosvaiheessa_mielipiteen_esittaneet',
      'kirje_hakijalle_maksusta'
    ]
    conditionObject2.comparison_value_type = 'list<string>'

     condition = { condition: conditionObject1, then_branch: 'True' }
     condition2 = { condition: conditionObject2, then_branch: 'False' }
    field.autofill_rule = [condition, condition2, []]

    const formValues = {
      testfieldset: {
         0: { oasvaiheen_dokumentin_nimi: 'saatekirje' }
      }
    }
    current = 'testfieldset[0].test'
    expect(getFieldAutofillValue(field.autofill_rule, formValues, current)).toBe(true)
  })
  test('Autofill rule list 4 deeper', () => {

    conditionObject1.variable = 'oasvaiheen_dokumentin_nimi'
    conditionObject1.operator = 'in'
    conditionObject1.comparison_value = ['OAS', 'saatekirje']
    conditionObject1.comparison_value_type = 'list<string>'


    conditionObject2.variable = 'oasvaiheen_dokumentin_nimi'
    conditionObject2.operator = 'in'
    conditionObject2.comparison_value = [
      'osallisten_osoitelista',
      'Lehti-ilmoitus',
      'oas_jatai_luonnosvaiheessa_mielipiteen_esittaneet',
      'kirje_hakijalle_maksusta'
    ]
    conditionObject2.comparison_value_type = 'list<string>'

     condition = { condition: conditionObject1, then_branch: 'True' }
     condition2 = { condition: conditionObject2, then_branch: 'False' }
    field.autofill_rule = [condition, condition2, []]

    const formValues = {
      testfieldset: {
         0: { oasvaiheen_dokumentin_nimi: 'saatekirje' }
      }
    }
     current = 'testfieldset[0].test'
    expect(getFieldAutofillValue(field.autofill_rule, formValues, current )).toBe(true)
  })
  test('Autofill rule list 5 fails', () => {

    conditionObject1.variable = 'oasvaiheen_dokumentin_nimi'
    conditionObject1.operator = 'in'
    conditionObject1.comparison_value = ['OAS', 'saatekirje']
    conditionObject1.comparison_value_type = 'list<string>'


    conditionObject2.variable = 'oasvaiheen_dokumentin_nimi'
    conditionObject2.operator = 'in'
    conditionObject2.comparison_value = [
      'osallisten_osoitelista',
      'Lehti-ilmoitus',
      'oas_jatai_luonnosvaiheessa_mielipiteen_esittaneet',
      'kirje_hakijalle_maksusta'
    ]
    conditionObject2.comparison_value_type = 'list<string>'

     condition = { condition: conditionObject1, then_branch: 'True' }
     condition2 = { condition: conditionObject2, then_branch: 'False' }
    field.autofill_rule = [condition, condition2, []]

    const formValues = {
      testfieldset: {
         0: { oasvaiheen_dokumentin_nimi: 'saatkirje' }
      }
    }
     current = 'testfieldset[0].test'
    expect(getFieldAutofillValue(field.autofill_rule, formValues,current)).toBe(undefined)
  })
  test('Autofill rule list 6 false', () => {

    conditionObject1.variable = 'oasvaiheen_dokumentin_nimi'
    conditionObject1.operator = 'in'
    conditionObject1.comparison_value = ['OAS', 'saatekirje']
    conditionObject1.comparison_value_type = 'list<string>'

    conditionObject2.variable = 'oasvaiheen_dokumentin_nimi'
    conditionObject2.operator = 'in'
    conditionObject2.comparison_value = [
      'osallisten_osoitelista',
      'Lehti-ilmoitus',
      'oas_jatai_luonnosvaiheessa_mielipiteen_esittaneet',
      'kirje_hakijalle_maksusta'
    ]
    conditionObject2.comparison_value_type = 'list<string>'

     condition = { condition: conditionObject1, then_branch: 'True' }
     condition2 = { condition: conditionObject2, then_branch: 'False' }
    field.autofill_rule = [condition, condition2, []]

    const formValues = {
      testfieldset: {
         0: { oasvaiheen_dokumentin_nimi: 'kirje_hakijalle_maksusta' }
      }
    }
     current = 'testfieldset[0].test'
    expect(getFieldAutofillValue(field.autofill_rule, formValues, current)).toBe(false)
  })
  test('Autofill rule list 7 kaupunkiympäristölautakunta', () => {

    conditionObject1.variable = 'kaavaprosessin_kokoluokka'
    conditionObject1.operator = 'in'
    conditionObject1.comparison_value = ['S', 'XS']
    conditionObject1.comparison_value_type = 'list<string>'


    conditionObject2.variable = 'kaavaprosessin_kokoluokka'
    conditionObject2.operator = 'in'
    conditionObject2.comparison_value = ['M', 'L', 'XL']
    conditionObject2.comparison_value_type = 'list<string>'

     condition = { condition: conditionObject1, then_branch : 'kaupunkiympäristölautakunta' }
     condition2 = { condition: conditionObject2, then_branch : 'kaupunginvaltuusto' }
     field.autofill_rule =[condition, condition2, []]

    const formValues = {
      kaavaprosessin_kokoluokka: 'XS'
      }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe('kaupunkiympäristölautakunta')
  })
  test('Autofill rule list 8 kaupunginvaltuusto', () => {

    conditionObject1.variable = 'kaavaprosessin_kokoluokka'
    conditionObject1.operator = 'in'
    conditionObject1.comparison_value = ['S', 'XS']
    conditionObject1.comparison_value_type = 'list<string>'


    conditionObject2.variable = 'kaavaprosessin_kokoluokka'
    conditionObject2.operator = 'in'
    conditionObject2.comparison_value = ['M', 'L', 'XL']
    conditionObject2.comparison_value_type = 'list<string>'

     condition = { condition: conditionObject1, then_branch : 'kaupunkiympäristölautakunta' }
     condition2 = { condition: conditionObject2, then_branch : 'kaupunginvaltuusto' }
     field.autofill_rule =[condition, condition2, []]

    const formValues = {
      kaavaprosessin_kokoluokka: 'L'
      }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe('kaupunginvaltuusto')
  })
  test('Autofill rule list 7 variables', () => {

    conditionObject1.variable = 'aloituskokous_suunniteltu_pvm'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = true
    conditionObject1.comparison_value_type = 'boolean'

     condition = {
      condition: conditionObject1,
      then_branch: '',
      variables: ['aloituskokous_suunniteltu_pvm']
    }
    field.autofill_rule = [condition]

    const formValues = {
      testfieldset: {
         0: { aloituskokous_suunniteltu_pvm: '12.12.2012' }
      }
    }
     current = 'testfieldset[0].test'
    expect(getFieldAutofillValue(field.autofill_rule, formValues, current)).toBe('12.12.2012')
  })
  test('Autofill rule list 7 visibility', () => {

    conditionObject1.variable = 'luodaanko_nakyvaksi'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = true
    conditionObject1.comparison_value_type = 'boolean'

     condition = {
      condition: conditionObject1,
      then_branch: '',
      variables: ['luodaanko_nakyvaksi']
    }
    field.autofill_rule = [condition]

    const formValues = {
      luodaanko_nakyvaksi: true
    }
    
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(true)
  })
  test('Autofill rule list 8 variables', () => {

    conditionObject1.variable = 'aloituskokous_suunniteltu_pvm'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = true
    conditionObject1.comparison_value_type = 'boolean'

     condition = {
      condition: conditionObject1,
      then_branch: '',
      variables: ['aloituskokous_suunniteltu_pvm']
    }
    field.autofill_rule = [condition]

    const formValues = {
      testfieldset: {
         aloituskokous_suunniteltu_pvm: '12.12.2012'
      }
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues, undefined, EDIT_PROJECT_TIMETABLE_FORM)).toBe('12.12.2012')
  })
  test('Autofill rule number bigger than', () => {

    conditionObject1.variable = 'mielipiteiden_maara'
    conditionObject1.operator = '>'
    conditionObject1.comparison_value = 0
    conditionObject1.comparison_value_type = 'number'

     condition = { condition: conditionObject1, then_branch: 'True' }
    field.autofill_rule = [condition]

    const formValues = {
      mielipiteiden_maara: 2
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(true)
  })
  test('Autofill rule number bigger than', () => {

    conditionObject1.variable = 'mielipiteiden_maara'
    conditionObject1.operator = '>'
    conditionObject1.comparison_value = 0
    conditionObject1.comparison_value_type = 'number'

     condition = { condition: conditionObject1, then_branch: true }
    field.autofill_rule = [condition]

    const formValues = {
      mielipiteiden_maara: 0
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(false)
  })
  test('Autofill multiple rule number bigger than', () => {

    conditionObject1.variable = 'mielipiteiden_maara'
    conditionObject1.operator = '>'
    conditionObject1.comparison_value = 0
    conditionObject1.comparison_value_type = 'number'


    conditionObject2.variable = 'vaarien_mielipiteiden_maara'
    conditionObject2.operator = '>'
    conditionObject2.comparison_value = 0
    conditionObject2.comparison_value_type = 'number'

     condition = { condition: conditionObject1, then_branch: true }
     condition2 = { condition: conditionObject2, then_branch: true }

    field.autofill_rule = [condition, condition2]

    const formValues = {
      mielipiteiden_maara: null,
      vaarien_mielipiteiden_maara: 1
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(true)
  })
  test('Autofill multiple rule number bigger than', () => {

    conditionObject1.variable = 'mielipiteiden_maara'
    conditionObject1.operator = '>'
    conditionObject1.comparison_value = 0
    conditionObject1.comparison_value_type = 'number'


    conditionObject2.variable = 'vaarien_mielipiteiden_maara'
    conditionObject2.operator = '>'
    conditionObject2.comparison_value = 0
    conditionObject2.comparison_value_type = 'number'

     condition = { condition: conditionObject1, then_branch: true }
     condition2 = { condition: conditionObject2, then_branch: true }

    field.autofill_rule = [condition, condition2]

    const formValues = {
      vaarien_mielipiteiden_maara: 1
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(true)
  })
  test('Autofill multiple rule number bigger than', () => {

    conditionObject1.variable = 'mielipiteiden_maara'
    conditionObject1.operator = '>'
    conditionObject1.comparison_value = 0
    conditionObject1.comparison_value_type = 'number'


    conditionObject2.variable = 'vaarien_mielipiteiden_maara'
    conditionObject2.operator = '>'
    conditionObject2.comparison_value = 0
    conditionObject2.comparison_value_type = 'number'

     condition = { condition: conditionObject1, then_branch: true }
     condition2 = { condition: conditionObject2, then_branch: true }

    field.autofill_rule = [condition, condition2]

    const formValues = {
      mielipiteiden_maara: 0,
      vaarien_mielipiteiden_maara: 1
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(true)
  })
  test('Autofill multiple rule number bigger than', () => {

    conditionObject1.variable = 'mielipiteiden_maara'
    conditionObject1.operator = '>'
    conditionObject1.comparison_value = 0
    conditionObject1.comparison_value_type = 'number'

    conditionObject2.variable = 'vaarien_mielipiteiden_maara'
    conditionObject2.operator = '>'
    conditionObject2.comparison_value = 0
    conditionObject2.comparison_value_type = 'number'

     condition = { condition: conditionObject1, then_branch: true }
     condition2 = { condition: conditionObject2, then_branch: true }

    field.autofill_rule = [condition, condition2]

    const formValues = {}
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(false)
  })
  test('Autofill multiple rule three (1) number bigger than', () => {

    conditionObject1.variable = 'mielipiteiden_maara'
    conditionObject1.operator = '>'
    conditionObject1.comparison_value = 0
    conditionObject1.comparison_value_type = 'number'


    conditionObject2.variable = 'vaarien_mielipiteiden_maara'
    conditionObject2.operator = '>'
    conditionObject2.comparison_value = 0
    conditionObject2.comparison_value_type = 'number'

    conditionObject3.variable = 'taas_vaarien_mielipiteiden_maara'
    conditionObject3.operator = '>'
    conditionObject3.comparison_value = 0
    conditionObject3.comparison_value_type = 'number'

     condition = { condition: conditionObject1, then_branch: true }
     condition2 = { condition: conditionObject2, then_branch: true }
     condition3 = { condition: conditionObject3, then_branch: 'True' }

    field.autofill_rule = [condition, condition2, condition3]

    const formValues = {
      mielipiteiden_maara: 0,
      vaarien_mielipiteiden_maara: 1,
      taas_vaarien_mielipiteiden_maara: 0
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(true)
  })
  test('Autofill multiple rule three (2) number bigger than', () => {

    conditionObject1.variable = 'mielipiteiden_maara'
    conditionObject1.operator = '>'
    conditionObject1.comparison_value = 0
    conditionObject1.comparison_value_type = 'number'


    conditionObject2.variable = 'vaarien_mielipiteiden_maara'
    conditionObject2.operator = '>'
    conditionObject2.comparison_value = 0
    conditionObject2.comparison_value_type = 'number'


    conditionObject3.variable = 'taas_vaarien_mielipiteiden_maara'
    conditionObject3.operator = '>'
    conditionObject3.comparison_value = 0
    conditionObject3.comparison_value_type = 'number'

     condition = { condition: conditionObject1, then_branch: true }
     condition2 = { condition: conditionObject2, then_branch: true }
     condition3 = { condition: conditionObject3, then_branch: 'True' }

    field.autofill_rule = [condition, condition2, condition3]

    const formValues = {
      mielipiteiden_maara: 0,
      vaarien_mielipiteiden_maara: 0,
      taas_vaarien_mielipiteiden_maara: 1
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(true)
  })
  test('Autofill multiple rule three (3) number bigger than', () => {

    conditionObject1.variable = 'mielipiteiden_maara'
    conditionObject1.operator = '>'
    conditionObject1.comparison_value = 0
    conditionObject1.comparison_value_type = 'number'


    conditionObject2.variable = 'vaarien_mielipiteiden_maara'
    conditionObject2.operator = '>'
    conditionObject2.comparison_value = 0
    conditionObject2.comparison_value_type = 'number'


    conditionObject3.variable = 'taas_vaarien_mielipiteiden_maara'
    conditionObject3.operator = '>'
    conditionObject3.comparison_value = 0
    conditionObject3.comparison_value_type = 'number'

     condition = { condition: conditionObject1, then_branch: true }
     condition2 = { condition: conditionObject2, then_branch: true }
     condition3 = { condition: conditionObject3, then_branch: 'True' }

    field.autofill_rule = [condition, condition2, condition3]

    const formValues = {
      mielipiteiden_maara: 0,
      vaarien_mielipiteiden_maara: 0,
      taas_vaarien_mielipiteiden_maara: 0
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(false)
  })
  test('Autofill rule succeeds string with formvalue', () => {

    conditionObject1.variable = 'yksikon_johtaja'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = 'Mikko'
    conditionObject1.comparison_value_type = 'string'

     condition = { condition: conditionObject1, then_branch: 'yksikon_johtaja' }

    field.autofill_rule = [condition]

    const formValues = {
      yksikon_johtaja: 'Mikko'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe('Mikko')
  })
  test('Autofill rule fails string with formvalue', () => {

    conditionObject1.variable = 'yksikon_johtaja_1'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = 'Mikko'
    conditionObject1.comparison_value_type = 'string'

     condition = { condition: conditionObject1, then_branch: 'yksikon_johtaja' }

    field.autofill_rule = [condition]

    const formValues = {
      yksikon_johtaja_1: 'Jaska'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(undefined)
  })
  test('Autofill rule fails string with formvalue', () => {

    conditionObject1.variable = 'yksikon_johtaja'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = 'Mikko'
    conditionObject1.comparison_value_type = 'string'

     condition = { condition: conditionObject1, then_branch: 'yksikon_johtaja' }

    field.autofill_rule = [condition]

    const formValues = {
      yksikon_johtaja: 'Jaska'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(undefined)
  })
  test('New autofill radiobutton rule', () => {

    conditionObject1.variable = 'tehty_muutos_muistutusten_johdosta'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = true
    conditionObject1.comparison_value_type = 'boolean'

    conditionObject2.variable = 'tehty_muutos_lausuntojen_johdosta'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = true
    conditionObject2.comparison_value_type = 'boolean'


    conditionObject3.variable = 'ehty_muutos_muistutusten_johdosta'
    conditionObject3.operator = '!='
    conditionObject3.comparison_value = true
    conditionObject3.comparison_value_type = 'boolean'

     condition = { condition: conditionObject1, then_branch: 'True' }
     condition2 = { condition: conditionObject2, then_branch: 'True' }
     condition3 = { condition: conditionObject3, then_branch: 'True' }

    field.autofill_rule = [condition, condition2, condition3]

    const formValues = {
      tehty_muutos_muistutusten_johdosta: 'joo, muutos tehty',
      tehty_muutos_lausuntojen_johdosta: 'joo'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(true)
  })
  test('New autofill radiobutton rule 2', () => {

    conditionObject1.variable = 'tehty_muutos_muistutusten_johdosta'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = true
    conditionObject1.comparison_value_type = 'boolean'


    conditionObject2.variable = 'tehty_muutos_lausuntojen_johdosta'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = true
    conditionObject2.comparison_value_type = 'boolean'


    conditionObject3.variable = 'ehty_muutos_muistutusten_johdosta'
    conditionObject3.operator = '!='
    conditionObject3.comparison_value = true
    conditionObject3.comparison_value_type = 'boolean'

     condition = { condition: conditionObject1, then_branch: 'True' }
     condition2 = { condition: conditionObject2, then_branch: 'True' }
     condition3 = { condition: conditionObject3, then_branch: 'True' }

    field.autofill_rule = [condition, condition2, condition3]

    const formValues = {
      tehty_muutos_lausuntojen_johdosta: 'joo, muutos tehty'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(true)
  })
  test('New autofill radiobutton rule 3', () => {

    conditionObject1.variable = 'tehty_muutos_muistutusten_johdosta'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = true
    conditionObject1.comparison_value_type = 'boolean'


    conditionObject2.variable = 'tehty_muutos_lausuntojen_johdosta'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = true
    conditionObject2.comparison_value_type = 'boolean'


    conditionObject3.variable = 'tehty_muutos_muistutusten_johdosta'
    conditionObject3.operator = '!='
    conditionObject3.comparison_value = true
    conditionObject3.comparison_value_type = 'boolean'

     condition = { condition: conditionObject1, then_branch: 'True' }
     condition2 = { condition: conditionObject2, then_branch: 'True' }
     condition3 = { condition: conditionObject3, then_branch: 'False' }

    field.autofill_rule = [condition, condition2, condition3]

    const formValues = {}
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(false)
  })
  test('New autofill radiobutton rule 4', () => {

    conditionObject1.variable = 'tehty_muutos_muistutusten_johdosta'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = true
    conditionObject1.comparison_value_type = 'boolean'


    conditionObject2.variable = 'tehty_muutos_lausuntojen_johdosta'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = true
    conditionObject2.comparison_value_type = 'boolean'


    conditionObject3.variable = 'tehty_muutos_muistutusten_johdosta'
    conditionObject3.operator = '!='
    conditionObject3.comparison_value = true
    conditionObject3.comparison_value_type = 'boolean'

     condition = { condition: conditionObject1, then_branch: 'True' }
     condition2 = { condition: conditionObject2, then_branch: 'True' }
     condition3 = { condition: conditionObject3, then_branch: 'False' }

    field.autofill_rule = [condition, condition2, condition3]

    const formValues = {
      tehty_muutos_muistutusten_johdosta: '',
      tehty_muutos_lausuntojen_johdosta: 'jee'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(true)
  })
  test('New autofill radiobutton rule 5', () => {

    conditionObject1.variable = 'tehty_muutos_muistutusten_johdosta'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = true
    conditionObject1.comparison_value_type = 'boolean'


    conditionObject2.variable = 'tehty_muutos_lausuntojen_johdosta'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = true
    conditionObject2.comparison_value_type = 'boolean'


    conditionObject3.variable = 'tehty_muutos_muistutusten_johdosta'
    conditionObject3.operator = '!='
    conditionObject3.comparison_value = true
    conditionObject3.comparison_value_type = 'boolean'

     condition = { condition: conditionObject1, then_branch: 'True' }
     condition2 = { condition: conditionObject2, then_branch: 'True' }
     condition3 = { condition: conditionObject3, then_branch: 'False' }

    field.autofill_rule = [condition, condition2, condition3]

    const formValues = {
      tehty_muutos_muistutusten_johdosta: null,
      tehty_muutos_lausuntojen_johdosta: 'jee'
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(true)
  })
  test('New autofill radiobutton rule 6', () => {

    conditionObject1.variable = 'tehty_muutos_muistutusten_johdosta'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = true
    conditionObject1.comparison_value_type = 'boolean'


    conditionObject2.variable = 'tehty_muutos_lausuntojen_johdosta'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = true
    conditionObject2.comparison_value_type = 'boolean'

    conditionObject3.variable = 'tehty_muutos_muistutusten_johdosta'
    conditionObject3.operator = '!='
    conditionObject3.comparison_value = true
    conditionObject3.comparison_value_type = 'boolean'

     condition = { condition: conditionObject1, then_branch: 'True' }
     condition2 = { condition: conditionObject2, then_branch: 'True' }
     condition3 = { condition: conditionObject3, then_branch: 'False' }

    field.autofill_rule = [condition, condition2, condition3]

    const formValues = {
      tehty_muutos_muistutusten_johdosta: null,
      tehty_muutos_lausuntojen_johdosta: null
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(false)
  })
  test('New autofill radiobutton rule 7', () => {

    conditionObject1.variable = 'tehty_muutos_muistutusten_johdosta'
    conditionObject1.operator = '=='
    conditionObject1.comparison_value = true
    conditionObject1.comparison_value_type = 'boolean'


    conditionObject2.variable = 'tehty_muutos_lausuntojen_johdosta'
    conditionObject2.operator = '=='
    conditionObject2.comparison_value = true
    conditionObject2.comparison_value_type = 'boolean'


    conditionObject3.variable = 'tehty_muutos_muistutusten_johdosta'
    conditionObject3.operator = '!='
    conditionObject3.comparison_value = true
    conditionObject3.comparison_value_type = 'boolean'


    conditionObject4.variable = 'tehty_muutos_muistutusten_johdosta'
    conditionObject4.operator = '!='
    conditionObject4.comparison_value = true
    conditionObject4.comparison_value_type = 'boolean'

     condition = { condition: conditionObject1, then_branch: 'True' }
     condition2 = { condition: conditionObject2, then_branch: 'True' }
     condition3 = { condition: conditionObject3, then_branch: 'False' }
     condition4 = { condition: conditionObject4, then_branch: 'False' }

    field.autofill_rule = [condition, condition2, condition3, condition4]

    const formValues = {
      tehty_muutos_muistutusten_johdosta: undefined
    }
    expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(false)
  })
})
test('New autofill rule', () => {

  conditionObject1.variable = 'lautakunta_paatti_tarkistettu_ehdotus_4'
  conditionObject1.operator = '=='
  conditionObject1.comparison_value = 'hyvaksytty'
  conditionObject1.comparison_value_type = 'string'


  conditionObject2.variable = 'lautakunta_paatti_tarkistettu_ehdotus_3'
  conditionObject2.operator = '=='
  conditionObject2.comparison_value = 'hyvaksytty'
  conditionObject2.comparison_value_type = 'string'


  conditionObject3.variable = 'lautakunta_paatti_tarkistettu_ehdotus_2'
  conditionObject3.operator = '=='
  conditionObject3.comparison_value = 'hyvaksytty'
  conditionObject3.comparison_value_type = 'string'


  conditionObject4.variable = 'lautakunta_paatti_tarkistettu_ehdotus'
  conditionObject4.operator = '=='
  conditionObject4.comparison_value = 'hyvaksytty'
  conditionObject4.comparison_value_type = 'string'

   condition = { condition: conditionObject1, then_branch: 'milloin_tarkistettu_ehdotus_lautakunnassa_4' }
   condition2 = { condition: conditionObject2, then_branch: 'milloin_tarkistettu_ehdotus_lautakunnassa_3' }
   condition3 = { condition: conditionObject3, then_branch: 'milloin_tarkistettu_ehdotus_lautakunnassa_2' }
   condition4 = { condition: conditionObject4, then_branch: 'milloin_tarkistettu_ehdotus_lautakunnassa' }

  field.autofill_rule = [condition, condition2, condition3, condition4]

  const formValues = {
    lautakunta_paatti_tarkistettu_ehdotus_3: "hyvaksytty",
    milloin_tarkistettu_ehdotus_lautakunnassa_3: "10-12-1977"
  }
  expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe("10-12-1977")
})

test('New autofill rule', () => {


  conditionObject1.variable = 'lautakunta_paatti_tarkistettu_ehdotus_4'
  conditionObject1.operator = '=='
  conditionObject1.comparison_value = 'hyvaksytty'
  conditionObject1.comparison_value_type = 'string'

  
  conditionObject2.variable = 'lautakunta_paatti_tarkistettu_ehdotus_3'
  conditionObject2.operator = '=='
  conditionObject2.comparison_value = 'hyvaksytty'
  conditionObject2.comparison_value_type = 'string'

  
  conditionObject3.variable = 'lautakunta_paatti_tarkistettu_ehdotus_2'
  conditionObject3.operator = '=='
  conditionObject3.comparison_value = 'hyvaksytty'
  conditionObject3.comparison_value_type = 'string'

  
  conditionObject4.variable = 'lautakunta_paatti_tarkistettu_ehdotus'
  conditionObject4.operator = '=='
  conditionObject4.comparison_value = 'hyvaksytty'
  conditionObject4.comparison_value_type = 'string'

  const condition = { condition: conditionObject1, then_branch: 'milloin_tarkistettu_ehdotus_lautakunnassa_4' }
  const condition2 = { condition: conditionObject2, then_branch: 'milloin_tarkistettu_ehdotus_lautakunnassa_3' }
  const condition3 = { condition: conditionObject3, then_branch: 'milloin_tarkistettu_ehdotus_lautakunnassa_2' }
  const condition4 = { condition: conditionObject4, then_branch: 'milloin_tarkistettu_ehdotus_lautakunnassa' }

  field.autofill_rule = [condition, condition2, condition3, condition4]

  const formValues = {
    lautakunta_paatti_tarkistettu_ehdotus: "hyvaksytty",
    milloin_tarkistettu_ehdotus_lautakunnassa: "10-12-2977"
  }
  expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe("10-12-2977")
})

test('New autofill rule 2', () => {


  conditionObject1.variable = 'lautakunta_paatti_tarkistettu_ehdotus_4'
  conditionObject1.operator = '=='
  conditionObject1.comparison_value = 'hyvaksytty'
  conditionObject1.comparison_value_type = 'string'

  
  conditionObject2.variable = 'lautakunta_paatti_tarkistettu_ehdotus_3'
  conditionObject2.operator = '=='
  conditionObject2.comparison_value = 'hyvaksytty'
  conditionObject2.comparison_value_type = 'string'

  
  conditionObject3.variable = 'lautakunta_paatti_tarkistettu_ehdotus_2'
  conditionObject3.operator = '=='
  conditionObject3.comparison_value = 'hyvaksytty'
  conditionObject3.comparison_value_type = 'string'

  
  conditionObject4.variable = 'lautakunta_paatti_tarkistettu_ehdotus'
  conditionObject4.operator = '=='
  conditionObject4.comparison_value = 'hyvaksytty'
  conditionObject4.comparison_value_type = 'string'

   condition = { condition: conditionObject1, then_branch: 'milloin_tarkistettu_ehdotus_lautakunnassa_4' }
   condition2 = { condition: conditionObject2, then_branch: 'milloin_tarkistettu_ehdotus_lautakunnassa_3' }
   condition3 = { condition: conditionObject3, then_branch: 'milloin_tarkistettu_ehdotus_lautakunnassa_2' }
   condition4 = { condition: conditionObject4, then_branch: 'milloin_tarkistettu_ehdotus_lautakunnassa' }

  field.autofill_rule = [condition, condition2, condition3, condition4]

  const formValues = {
    lautakunta_paatti_tarkistettu_ehdotus_3: "jotain muuta",
    milloin_tarkistettu_ehdotus_lautakunnassa_3: "10-12-1977"
  }
  expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(undefined)
})
test('New autofill bug', () => {


  conditionObject1.variable = 'periaatteet_mielipiteet_maara'
  conditionObject1.operator = '>'
  conditionObject1.comparison_value = 0
  conditionObject1.comparison_value_type = 'number'
  conditionObject1.variables = []

  
  conditionObject2.variable = 'oas_mielipiteet_maara'
  conditionObject2.operator = '>'
  conditionObject2.comparison_value = 0
  conditionObject2.comparison_value_type = 'number'
  conditionObject2.variables = []

  
  conditionObject3.variable = 'luonnos_mielipiteet_maara'
  conditionObject3.operator = '>'
  conditionObject3.comparison_value = 0
  conditionObject3.comparison_value_type = 'number'
  conditionObject3.variables = []

  
  conditionObject4.variable = 'muistutusten_lukumaara'
  conditionObject4.operator = '>'
  conditionObject4.comparison_value = 0
  conditionObject4.comparison_value_type = 'number'
  conditionObject4.variables = []


  
  conditionObject5.variable = 'nahtavillaolo_ulkopuolella_kirjeet_maara'
  conditionObject5.operator = '>'
  conditionObject5.comparison_value = 0
  conditionObject5.comparison_value_type = 'number'
  conditionObject5.variables = []


   condition = { condition: conditionObject1, then_branch: 'True' }
   condition2 = { condition: conditionObject2, then_branch: 'True' }
   condition3 = { condition: conditionObject3, then_branch: 'True' }
   condition4 = { condition: conditionObject4, then_branch: 'True' }
   condition5 = { condition: conditionObject5, then_branch: 'True' }

  field.autofill_rule = [condition, condition2, condition3, condition4, condition5]

  const formValues = {
    nahtavillaolo_ulkopuolella_kirjeet_maara: 1 
  }
  expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(true)
})

test('New autofill bug 2', () => {


  conditionObject1.variable = 'periaatteet_mielipiteet_maara'
  conditionObject1.operator = '>'
  conditionObject1.comparison_value = 0
  conditionObject1.comparison_value_type = 'number'
  conditionObject1.variables = []

  
  conditionObject2.variable = 'oas_mielipiteet_maara'
  conditionObject2.operator = '>'
  conditionObject2.comparison_value = 0
  conditionObject2.comparison_value_type = 'number'
  conditionObject2.variables = []

  
  conditionObject3.variable = 'luonnos_mielipiteet_maara'
  conditionObject3.operator = '>'
  conditionObject3.comparison_value = 0
  conditionObject3.comparison_value_type = 'number'
  conditionObject3.variables = []

  
  conditionObject4.variable = 'muistutusten_lukumaara'
  conditionObject4.operator = '>'
  conditionObject4.comparison_value = 0
  conditionObject4.comparison_value_type = 'number'
  conditionObject4.variables = []


  
  conditionObject5.variable = 'nahtavillaolo_ulkopuolella_kirjeet_maara'
  conditionObject5.operator = '>'
  conditionObject5.comparison_value = 0
  conditionObject5.comparison_value_type = 'number'
  conditionObject5.variables = []


   condition = { condition: conditionObject1, then_branch: 'True' }
   condition2 = { condition: conditionObject2, then_branch: 'True' }
   condition3 = { condition: conditionObject3, then_branch: 'True' }
   condition4 = { condition: conditionObject4, then_branch: 'True' }
   condition5 = { condition: conditionObject5, then_branch: 'True' }

  field.autofill_rule = [condition, condition2, condition3, condition4, condition5]

  const formValues = {
    periaatteet_mielipiteet_maara: 1,
    nahtavillaolo_ulkopuolella_kirjeet_maara: 0
  }
  expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(true)
})

test('New autofill bug false', () => {

  conditionObject1.variable = 'periaatteet_mielipiteet_maara'
  conditionObject1.operator = '>'
  conditionObject1.comparison_value = 0
  conditionObject1.comparison_value_type = 'number'
  conditionObject1.variables = []

  conditionObject2.variable = 'oas_mielipiteet_maara'
  conditionObject2.operator = '>'
  conditionObject2.comparison_value = 0
  conditionObject2.comparison_value_type = 'number'
  conditionObject2.variables = []

  conditionObject3.variable = 'luonnos_mielipiteet_maara'
  conditionObject3.operator = '>'
  conditionObject3.comparison_value = 0
  conditionObject3.comparison_value_type = 'number'
  conditionObject3.variables = []


  conditionObject4.variable = 'muistutusten_lukumaara'
  conditionObject4.operator = '>'
  conditionObject4.comparison_value = 0
  conditionObject4.comparison_value_type = 'number'
  conditionObject4.variables = []


  conditionObject5.variable = 'nahtavillaolo_ulkopuolella_kirjeet_maara'
  conditionObject5.operator = '>'
  conditionObject5.comparison_value = 0
  conditionObject5.comparison_value_type = 'number'
  conditionObject5.variables = []

  condition = { condition: conditionObject1, then_branch: 'True' }
  condition2 = { condition: conditionObject2, then_branch: 'True' }
  condition3 = { condition: conditionObject3, then_branch: 'True' }
  condition4 = { condition: conditionObject4, then_branch: 'True' }
  condition5 = { condition: conditionObject5, then_branch: 'True' }

  field.autofill_rule = [condition, condition2, condition3, condition4, condition5]

  const formValues = {
    nahtavillaolo_ulkopuolella_kirjeet_maara: 0
  }
  expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(false)
})

test('New autofill bug false', () => {


  conditionObject1.variable = 'periaatteet_mielipiteet_maara'
  conditionObject1.operator = '>'
  conditionObject1.comparison_value = 0
  conditionObject1.comparison_value_type = 'number'
  conditionObject1.variables = []

  
  conditionObject2.variable = 'oas_mielipiteet_maara'
  conditionObject2.operator = '>'
  conditionObject2.comparison_value = 0
  conditionObject2.comparison_value_type = 'number'
  conditionObject2.variables = []

  
  conditionObject3.variable = 'luonnos_mielipiteet_maara'
  conditionObject3.operator = '>'
  conditionObject3.comparison_value = 0
  conditionObject3.comparison_value_type = 'number'
  conditionObject3.variables = []

  
  conditionObject4.variable = 'muistutusten_lukumaara'
  conditionObject4.operator = '>'
  conditionObject4.comparison_value = 0
  conditionObject4.comparison_value_type = 'number'
  conditionObject4.variables = []


  
  conditionObject5.variable = 'nahtavillaolo_ulkopuolella_kirjeet_maara'
  conditionObject5.operator = '>'
  conditionObject5.comparison_value = 0
  conditionObject5.comparison_value_type = 'number'
  conditionObject5.variables = []


   condition = { condition: conditionObject1, then_branch: 'True' }
   condition2 = { condition: conditionObject2, then_branch: 'True' }
   condition3 = { condition: conditionObject3, then_branch: 'True' }
   condition4 = { condition: conditionObject4, then_branch: 'True' }
   condition5 = { condition: conditionObject5, then_branch: 'True' }

  field.autofill_rule = [condition, condition2, condition3, condition4, condition5]

  const formValues = {
   
  }
  expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(false)
})

test('New autofill bug true', () => {


  conditionObject1.variable = 'periaatteet_mielipiteet_maara'
  conditionObject1.operator = '>'
  conditionObject1.comparison_value = 0
  conditionObject1.comparison_value_type = 'number'
  conditionObject1.variables = []

  
  conditionObject2.variable = 'oas_mielipiteet_maara'
  conditionObject2.operator = '>'
  conditionObject2.comparison_value = 0
  conditionObject2.comparison_value_type = 'number'
  conditionObject2.variables = []

  
  conditionObject3.variable = 'luonnos_mielipiteet_maara'
  conditionObject3.operator = '>'
  conditionObject3.comparison_value = 0
  conditionObject3.comparison_value_type = 'number'
  conditionObject3.variables = []

  
  conditionObject4.variable = 'muistutusten_lukumaara'
  conditionObject4.operator = '>'
  conditionObject4.comparison_value = 0
  conditionObject4.comparison_value_type = 'number'
  conditionObject4.variables = []


  
  conditionObject5.variable = 'nahtavillaolo_ulkopuolella_kirjeet_maara'
  conditionObject5.operator = '>'
  conditionObject5.comparison_value = 0
  conditionObject5.comparison_value_type = 'number'
  conditionObject5.variables = []


   condition = { condition: conditionObject1, then_branch: 'True' }
   condition2 = { condition: conditionObject2, then_branch: 'True' }
   condition3 = { condition: conditionObject3, then_branch: 'True' }
   condition4 = { condition: conditionObject4, then_branch: 'True' }
   condition5 = { condition: conditionObject5, then_branch: 'True' }

  field.autofill_rule = [condition, condition2, condition3, condition4, condition5]

  const formValues = {
    muistutusten_lukumaara: 2
  }
  expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(true)
})

test('New autofill first false then true', () => {


  conditionObject1.variable = 'periaatteet_mielipiteet_maara'
  conditionObject1.operator = '>'
  conditionObject1.comparison_value = 0
  conditionObject1.comparison_value_type = 'number'
  conditionObject1.variables = []

  
  conditionObject2.variable = 'oas_mielipiteet_maara'
  conditionObject2.operator = '>'
  conditionObject2.comparison_value = 0
  conditionObject2.comparison_value_type = 'number'
  conditionObject2.variables = []

  
  conditionObject3.variable = 'luonnos_mielipiteet_maara'
  conditionObject3.operator = '>'
  conditionObject3.comparison_value = 0
  conditionObject3.comparison_value_type = 'number'
  conditionObject3.variables = []

  
  conditionObject4.variable = 'muistutusten_lukumaara'
  conditionObject4.operator = '>'
  conditionObject4.comparison_value = 0
  conditionObject4.comparison_value_type = 'number'
  conditionObject4.variables = []


  
  conditionObject5.variable = 'nahtavillaolo_ulkopuolella_kirjeet_maara'
  conditionObject5.operator = '>'
  conditionObject5.comparison_value = 0
  conditionObject5.comparison_value_type = 'number'
  conditionObject5.variables = []


   condition = { condition: conditionObject1, then_branch: 'True' }
   condition2 = { condition: conditionObject2, then_branch: 'True' }
   condition3 = { condition: conditionObject3, then_branch: 'True' }
   condition4 = { condition: conditionObject4, then_branch: 'True' }
   condition5 = { condition: conditionObject5, then_branch: 'True' }

  field.autofill_rule = [condition, condition2, condition3, condition4, condition5]

  const formValues = {
    muistutusten_lukumaara: 0,
    nahtavillaolo_ulkopuolella_kirjeet_maara: 1
  }
  expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(true)
})

test('Autofill rule project visibility check', () => {


  conditionObject1.variable = 'luodaanko_nakyvaksi'
  conditionObject1.operator = '=='
  conditionObject1.comparison_value = true
  conditionObject1.comparison_value_type = 'boolean'

   condition = {
    condition: conditionObject1,
    then_branch: '',
    variables: ['luodaanko_nakyvaksi']
  }
  field.autofill_rule = [condition]

  const formValues = {
    luodaanko_nakyvaksi: true
  }
  expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(true)
})

test('Autofill rule project visibility check 2', () => {


  conditionObject1.variable = 'luodaanko_nakyvaksi'
  conditionObject1.operator = '=='
  conditionObject1.comparison_value = true
  conditionObject1.comparison_value_type = 'boolean'

   condition = {
    condition: conditionObject1,
    then_branch: '',
    variables: ['luodaanko_nakyvaksi']
  }
  field.autofill_rule = [condition]

  const formValues = {
    luodaanko_nakyvaksi: false
  }
  expect(getFieldAutofillValue(field.autofill_rule, formValues)).toBe(false)
})



