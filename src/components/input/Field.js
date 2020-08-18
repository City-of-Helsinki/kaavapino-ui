import React, { Component } from 'react'
import Input from './Input'
import SelectInput from './SelectInput'
import BooleanRadio from './RadioBooleanButton'
import File from './File'
import FieldSet from './FieldSet'
import Geometry from './Geometry'
import Link from './Link'
import DateTime from './DateTime'
import { Field, FieldArray } from 'redux-form'
import RadioButton from './RadioButton'
import ToggleButton from './ToggleButton'
import RichTextEditor from '../RichTextEditor'

class CustomField extends Component {
  shouldComponentUpdate(p) {
    if (!this.props.attributeData || !p.attributeData) {
      return true
    }
    if (this.props.field.disabled !== p.field.disabled) {
      return true
    }
    if (this.props.field.generated !== p.field.generated) {
      return true
    }
    if (
      this.props.attributeData[this.props.field.name] !== p.attributeData[p.field.name]
    ) {
      return true
    }
    return false
  }

  formatOptions = options => {
    return options.map(option => {
      return {
        key: option.value,
        value: option.value,
        text: option.label
      }
    })
  }

  renderNumber = props => <Input type="number" {...props} />

  renderString = props => <Input type="text" {...props} />

  renderRichText = props => <RichTextEditor {...props} />

  renderDate = props => <Input type="date" {...props} />

  renderGeometry = props => <Geometry {...props} />

  renderSelect = props => {
    const { choices, multiple_choice } = this.props.field
    return (
      <SelectInput
        multiple={multiple_choice}
        options={this.formatOptions(choices)}
        {...props}
      />
    )
  }

  renderRadio = props => {
    const { options } = this.props.field
    return <RadioButton options={options} {...props} />
  }

  renderBooleanRadio = props => <BooleanRadio {...props} />

  renderToggle = props => <ToggleButton {...props} />

  renderLink = props => <Link {...props} />

  renderDateTime = props => <DateTime {...props} />

  renderFieldset = ({ fields: sets }) => (
    <FieldSet
      sets={sets}
      fields={this.props.field.fieldset_attributes}
      disabled={this.props.field.disabled}
      attributeData={this.props.attributeData}
      name={this.props.field.name}
    />
  )

  renderDecimal = props => <Input type="number" step="0.01" {...props} />

  getInput = field => {
    if (field.choices) {
      /* Should perhaps check (field.type === 'select' && field.choices), but there were tests against it.
      Will get back to this. */
      return this.renderSelect
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
      case 'uuid':
      case 'text':
        return this.renderString
      case 'short_string':
      case 'long_string':
        return this.renderRichText
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
      default:
        return this.renderNumber
    }
  }

  render() {
    const { field, attributeData, fieldset, ...custom } = this.props
    const type = field.type

    if (type === 'file' || type === 'image') {
      const file = attributeData[field.name]
      const src = file ? file.link : null
      const description = file ? file.description : null
      return (
        <File
          image={type === 'image'}
          field={field}
          src={src}
          description={description}
        />
      )
    }

    const fieldProps = {
      name: field.name,
      placeholder: field.placeholder || field.label,
      component: this.getInput(field),
      ...custom,
      ...(field.multiple_choice ? { type: 'select-multiple' } : {}),
      disabled: field.generated || field.disabled ? true : false
    }

    if (type === 'toggle') {
      return <Field {...fieldProps} label={field.label} />
    }

    if (type === 'long_string' || type === 'short_string') {
      return (
        <Field
          {...fieldProps}
          defaultValue={attributeData ? attributeData[field.name] : null}
          largeField={type === 'long_string'}
        />
      )
    }

    if (fieldset) {
      return <FieldArray {...fieldProps} />
    }

    return <Field {...fieldProps} />
  }
}

export default CustomField
