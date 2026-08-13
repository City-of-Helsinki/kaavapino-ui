import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { ToggleButton } from 'hds-react'
import { useFieldPassivation } from '../../hooks/useFieldPassivation'

const HDSToggleButton = ({
  input: { value, name, ...rest },
  meta: { error, form },
  ...custom
}) => {
  const shouldPassivate = useFieldPassivation(name, { formName: form })
  const [checked, setChecked ] = useState(!!value)

  const onChange = () => {
    setChecked( !checked )
    rest.onChange( !checked )
  }
  return (
    <span className={'hds-toggle-input-container'}>
      <ToggleButton
        hideLabel={true}
        onBlur={custom.onBlur}
        error={error}
        name={name}
        onChange={onChange}
        checked={checked}
        id={custom.fieldData.name}
        disabled={shouldPassivate}
        tabIndex={shouldPassivate ? -1 : undefined}
      />
      <label htmlFor={custom.fieldData.name}>{custom.fieldData.label}</label>
    </span>
  )
}

export default HDSToggleButton

HDSToggleButton.propTypes = {
  input: PropTypes.shape({
    value: PropTypes.any,
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
  }).isRequired,
  meta: PropTypes.shape({
    error: PropTypes.string,
    form: PropTypes.string.isRequired,
  }).isRequired,
  fieldData: PropTypes.shape({
    name: PropTypes.string.isRequired,
    label: PropTypes.string,
  }),
  onBlur: PropTypes.func,
}
