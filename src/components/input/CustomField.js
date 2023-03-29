import React, { Component } from 'react'
import CustomInput from './CustomInput'
import DeadLineInput from './DeadlineInput'
import SelectInput from './SelectInput'
import RadioBooleanButton from './RadioBooleanButton'
import CustomTextArea from './CustomTextArea'
import File from './File'
import FieldSet from './FieldSet'
import Geometry from './Geometry'
import Link from './Link'
import DateTime from './DateTime'
import { Field, FieldArray } from 'redux-form'
import CustomRadioButton from './CustomRadioButton'
import ToggleButton from './ToggleButton'
import RichTextEditor from '../RichTextEditor'
import OnHoldCheckbox from './OnholdCheckbox'
import CustomCheckbox from './CustomCheckbox'

import AutofillInputCalculations from './AutofillInputCalculation/AutofillInputCalculations'

import { isEqual } from 'lodash'
import projectUtils from '../../utils/projectUtils'
import AutofillInput from './AutofillInput/AutofillInput'
import DeadlineInfoText from './DeadlineInfoText'
import { get } from 'lodash'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
import CustomADUserCombobox from './CustomADUserCombobox'
import CustomSearchCombobox from './CustomSearchCombobox';
class CustomField extends Component {
  yearOptions = []
  shouldComponentUpdate(prevProps) {
    if (!isEqual(this.props, prevProps)) {
      return true
    }
    return false
  }

  handleChange = (value) => {
    if(this.props.isLockedOwner){
      return value
    }
    return false
  }

  validateFieldSize = value => {
    const field = this.props.field
    if (value && field && field.character_limit && field.character_limit > 0) {
      if (value.length > field.character_limit) {
        return 'Kentässä liikaa merkkejä'
      }
    }
  }

  formatOptions = options => {
    return options.map(option => {
      return {
        key: option.value,
        value: option.value,
        label: option.label
      }
    })
  }

  renderNumber = props => {
    const { handleBlurSave, handleLockField, handleUnlockField, isLockedOwner } = this.props
    return <CustomInput min={0} isLockedOwner={isLockedOwner} onBlur={handleBlurSave} onChange={this.handleChange} onFocus={handleLockField} handleUnlockField={handleUnlockField} {...props} type="number" />
  }

  renderYearSelect = props => {
    const { multiple_choice, placeholder_text } = this.props.field
    const { handleBlurSave, handleLockField, handleUnlockField, formName } = this.props

    if (this.yearOptions.length === 0) {
      this.yearOptions = projectUtils.generateArrayOfYears()
    }
    return (
      <SelectInput
        multiple={multiple_choice}
        options={this.yearOptions}
        onBlur={handleBlurSave}
        onFocus={handleLockField}
        handleUnlockField={handleUnlockField}
        formName={formName}
        placeholder={placeholder_text}
        onChange={props.change}
        {...props}
      />
    )
  }

  renderString = props => {
    const { handleBlurSave, handleLockField, handleUnlockField, isLockedOwner } = this.props
    return <CustomInput isLockedOwner={isLockedOwner} onBlur={handleBlurSave} onChange={this.handleChange} onFocus={handleLockField} handleUnlockField={handleUnlockField}  {...props} type="text" />
  }

  renderTextArea = props => {
    const { handleBlurSave, handleLockField, handleUnlockField, isLockedOwner } = this.props
    return <CustomTextArea isLockedOwner={isLockedOwner} onBlur={handleBlurSave} onChange={props.change} onFocus={handleLockField} handleUnlockField={handleUnlockField} {...props} />
  }

  renderRichText = props => {
    const { handleBlurSave, handleLockField, handleUnlockField, meta, formName, isLockedOwner } = this.props
    return (
      <RichTextEditor
        isLockedOwner={isLockedOwner}
        onBlur={handleBlurSave}
        onChange={this.handleChange}
        onFocus={handleLockField}
        handleUnlockField={handleUnlockField}
        meta={meta}
        {...props}
        formName={formName}
        largeField
      />
    )
  }

  renderRichTextShort = props => {
    const { handleBlurSave, handleLockField, handleUnlockField, meta, setRef, isLockedOwner } = this.props
    return <RichTextEditor isLockedOwner={isLockedOwner} setRef={setRef} onBlur={handleBlurSave} onChange={this.handleChange} onFocus={handleLockField} handleUnlockField={handleUnlockField} meta={meta} {...props} />
  }

  renderDate = props => {
    const { handleBlurSave, handleLockField, handleUnlockField, deadlines, field, isLockedOwner } = this.props

    let current
    if (deadlines && deadlines.length > 0) {
      current = deadlines.find(
        deadline => deadline.deadline.attribute === props.input.name
      )
    }

    if (deadlines && deadlines.length > 0) {
      return (
        <DeadLineInput
          type="date"
          editable={field.editable}
          currentDeadline={current}
          autofillRule={field.autofill_rule}
          {...props}
        />
      )
    }
    return <CustomInput isLockedOwner={isLockedOwner} onBlur={handleBlurSave} onChange={this.handleChange} onFocus={handleLockField} handleUnlockField={handleUnlockField} type="date" {...props} />
  }

  renderGeometry = props => {
    const { handleBlurSave, handleLockField, handleUnlockField } = this.props
    return <Geometry onBlur={handleBlurSave} onFocus={handleLockField} handleUnlockField={handleUnlockField} {...props} />
  }

  renderSelect = props => {
    const { choices, multiple_choice, placeholder_text, formName } = this.props.field
    const { handleBlurSave, handleLockField, handleUnlockField } = this.props

    return (
      <SelectInput
        {...props}
        multiple={multiple_choice}
        options={this.formatOptions(choices)}
        onBlur={handleBlurSave}
        placeholder={placeholder_text}
        formName={formName}
        onFocus={handleLockField}
        handleUnlockField={handleUnlockField}
        onChange={props.change}
      />
    )
  }
  renderSearchSelect = props => {
    const { choices, placeholder_text, formName } = this.props.field
    const { handleBlurSave, handleLockField, handleUnlockField } = this.props

    return (
      <CustomSearchCombobox
        {...props}
        options={choices}
        onBlur={handleBlurSave}
        placeholder={placeholder_text}
        formName={formName}
        onFocus={handleLockField}
        handleUnlockField={handleUnlockField}
      />
    )
  }
  renderRadio = props => {
    const { field, handleBlurSave } = this.props
    return (
      <CustomRadioButton
        options={this.formatOptions(field.options)}
        onBlur={handleBlurSave}
        {...props}
      />
    )
  }

  renderBooleanRadio = props => {
    const { input, onRadioChange, defaultValue } = this.props

    return (
      <RadioBooleanButton
        onBlur={props.handleBlurSave}
        input={input}
        onRadioChange={onRadioChange}
        defaultValue={defaultValue}
        autofillReadonly={this.props.field.autofill_readonly}
        {...props}
      />
    )
  }

  renderToggle = props => {
    const { handleBlurSave } = this.props
    return <ToggleButton onBlur={handleBlurSave} {...props} />
  }

  renderLink = props => {
    const { handleBlurSave } = this.props
    const { placeholder_text } = this.props.field

    return <Link onBlur={handleBlurSave} onChange={props.changed} placeholder={placeholder_text} {...props} />
  }

  renderDateTime = props => {
    const { handleBlurSave, handleSave, handleLockField, handleUnlockField } = this.props
    return <DateTime onBlur={handleBlurSave} handleSave={handleSave} onFocus={handleLockField} handleUnlockField={handleUnlockField} {...props} />
  }

  renderFieldset = ({ fields: sets }) => {
    const {
      field: {
        fieldset_attributes,
        name,
        label,
        generated,
        disabled,
        autofill_readonly,
        editable,
        automatically_added
      },
      field,
      attributeData,
      formValues,
      syncronousErrors,
      handleSave,
      handleBlurSave,
      handleLockField,
      handleUnlockField,
      onRadioChange,
      placeholder,
      formName,
      updated,
      locked,
      isLocked,
      isLockedOwner
    } = this.props

    return (
      <FieldSet
        sets={sets}
        fields={fieldset_attributes}
        attributeData={attributeData}
        name={name}
        placeholder={placeholder || label}
        disabled={generated || disabled || autofill_readonly || !editable || automatically_added}
        formValues={formValues}
        validate={[this.validateFieldSize]}
        syncronousErrors={syncronousErrors}
        handleSave={handleSave}
        onRadioChange={onRadioChange}
        field={field}
        formName={formName}
        updated={updated}
        onBlur={handleBlurSave}
        handleLockField={handleLockField}
        handleUnlockField={handleUnlockField}
        locked={locked}
        isLocked={isLocked}
        isLockedOwner={isLockedOwner}
      />
    )
  }

  renderDecimal = props => {
    const { handleBlurSave, handleLockField, handleUnlockField, isLockedOwner } = this.props
    return <CustomInput type="number" step="0.01" isLockedOwner={isLockedOwner} onChange={this.handleChange} onBlur={handleBlurSave} onFocus={handleLockField} handleUnlockField={handleUnlockField} {...props} />
  }

  renderCustomCheckbox = props => {
    const { field, formName } = this.props

    return (
      <CustomCheckbox
        {...props}
        label={field.label}
        autofillRule={field.autofill_rule}
        formName={formName}
        display={field.display}
      />
    )
  }

  renderOnholdCheckbox = props => {
    const { onhold, saveProjectBase, disabled, label } = this.props

    return (
      <OnHoldCheckbox
        {...props}
        projectOnhold={onhold}
        saveProjectBase={saveProjectBase}
        disabled={disabled}
        label={label}
      />
    )
  }
  renderDeadlineInfo = props => {
    const { field } = this.props

    return (
      <DeadlineInfoText
        label={field.label}
        autofillRule={field.autofill_rule}
        {...props}
      />
    )
  }
  renderADUserSelection = props => {
    const { field, handleBlurSave, handleLockField, handleUnlockField } = this.props

    return (
      <CustomADUserCombobox
        label={field.label}
        multiselect={false}
        onBlur={handleBlurSave}
        onFocus={handleLockField}
        handleUnlockField={handleUnlockField}
        {...props}
      />
    )
  }

  getInput = field => {
    if (field.type === 'set' || field.type === 'multiple') {
      return this.renderSelect
    }

    // Since there might be rules which has boolean type and choices, avoid selecting select and select
    // boolean radiobutton intead
    if (field.choices && field.type !== 'boolean' && field.type !== 'search-select') {

      return this.renderSelect
    }
    if (field.display === 'dropdown' || field.display === 'simple_integer') {
      return this.renderYearSelect
    }
    if (
      field.display === 'readonly_checkbox' &&
      this.props.formName === EDIT_PROJECT_TIMETABLE_FORM
    ) {
      return this.renderCustomCheckbox
    }

    if (field.type === 'radio' && field.options) {
      return this.renderRadio
    }
    switch (field.type) {
      case 'boolean':
        return this.renderBooleanRadio
      case 'toggle':
        return this.renderToggle
      case 'string':
      case 'text':
      case 'uuid':
      case 'short_string':
        return this.renderString
      case 'long_string':
        return this.renderTextArea
      case 'rich_text':
        return this.renderRichText
      case 'rich_text_short':
        return this.renderRichTextShort
      case 'datetime':
        return this.renderDateTime
      case 'date':
        return this.renderDate
      case 'fieldset':
        return this.renderFieldset
      case 'geometry':
        return this.renderGeometry
      case 'link':
        return this.renderLink
      case 'decimal':
        return this.renderDecimal
      case 'checkbox-onhold':
        return this.renderOnholdCheckbox
      case 'checkbox':
        return this.renderCustomCheckbox
      case 'readonly':
        return this.renderDeadlineInfo
      case 'personnel':
        return this.renderADUserSelection

      case 'search-select':
        return this.renderSearchSelect
      default:
        return this.renderNumber
    }
  }

  render() {
    const {
      field,
      attributeData,
      fieldset,
      formName,
      formValues,
      error,
      updated,
      defaultValue,
      className,
      handleSave,
      handleBlurSave
    } = this.props
    const type = field.type
    if (type === 'file' || type === 'image') {
      let file = get(attributeData, field.name)
      const src = file ? file.link : null
      const description = file ? file.description : null

      return (
        <File
          image={type === 'image'}
          field={field}
          src={src}
          description={description}
          formValues={formValues}
          attributeData={attributeData}
          handleSave={handleSave}
          onBlur={handleBlurSave}
        />
      )
    }

    const showFieldClass = field.display === 'hidden' ? 'hidden' : className

    const getClass = () => {
      let currentClassName = ''
      if (className) {
        currentClassName = className
      }
      if (showFieldClass) {
        currentClassName = currentClassName + ' ' + showFieldClass
      }
      return currentClassName
    }

    const placeHolderText = field.placeholder_text
      ? field.placeholder_text.trim()
      : field.label

    let fieldProps = {
      name: field.name,
      placeholder: placeHolderText,
      disabled:
        field.generated || field.disabled || field.autofill_readonly || !field.editable || field.automatically_added,
      component: this.getInput(field),
      ...(field.multiple_choice ? { type: 'select-multiple' } : {}),
      updated: { updated },
      className: getClass()
    }

    // Some fields are autofilled to a value as per (autofill_rules)
    //Some fields have their value calculated based on other fields (calculations)
    //Some autofill fields are readonly, some are not (autofill_readonly) 
    if (this.props.isFloorCalculation) {
      fieldProps = {
        ...fieldProps,
        parse:
          field.type === 'integer'
            ? val => (val || val === 0 ? Number(val) : null)
            : null,
        disabled: field.generated || !field.editable
      }
      return (
        <AutofillInputCalculations
          field={field}
          fieldProps={fieldProps}
          formName={formName}
        />
      )
    }

    if (field.autofill_rule && formName !== EDIT_PROJECT_TIMETABLE_FORM) {
      return <AutofillInput field={field} fieldProps={fieldProps} formName={formName} />
    }

    if (type === 'toggle') {
      return (
        <Field
          {...fieldProps}
          label={field.label}
          attributeData={this.props.attributeData}
        />
      )
    }

    if (type === 'rich_text' || type === 'rich_text_short') {
      // Fieldsets have calculated defaultValues
      let currentDefaultValue = defaultValue

      // Non-fieldset fields get defaultValue from attributeData
      if (!defaultValue)
        currentDefaultValue = attributeData ? attributeData[field.name] : null
      return (
        <Field
          {...fieldProps}
          defaultValue={currentDefaultValue}
          formName={formName}
          className={`${this.props.className} ${error ? error : ''}`}
          maxSize={field.character_limit}
        />
      )
    }

    if (fieldset) {
      const newProps = {
        ...fieldProps,
        type: 'fieldset'
      }
      return <FieldArray component={this.renderFieldset} {...newProps} />
    }
    return (
      <Field
        {...fieldProps}
        validate={[this.validateFieldSize]}
        className={`${this.props.className} ${error ? error : ''}`}
      />
    )
  }
}

export default CustomField
