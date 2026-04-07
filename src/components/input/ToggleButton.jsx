import React, { useState } from 'react'
import { Radio } from 'semantic-ui-react'
import { useFieldPassivation } from '../../hooks/useFieldPassivation';
import PropTypes from 'prop-types';

const ToggleButton = ({
  input: { value, name, ...rest },
  meta: { error, form },
  ...custom
}) => {
  const shouldDisableForErrors = useFieldPassivation(name, { formName: form });
  const [checked, setChecked ] = useState(value ? true : false)

  const onChange = () => {
    setChecked( !checked )
    rest.onChange( !checked )
  }
  return (
    <div className={'radio-input-container'}>
      <Radio
        toggle
        label={custom.label}
        placeholder={custom.placeholder}
        onBlur={custom.onBlur}
        error={error}
        name={name}
        onChange={onChange}
        checked={checked}
        disabled={shouldDisableForErrors || custom.disabled}
      />
    </div>
  )
}

ToggleButton.propTypes = {
  input: PropTypes.shape({
    value: PropTypes.any,
    name: PropTypes.string
  }),
  meta: PropTypes.shape({
    error: PropTypes.string,
    form: PropTypes.string
  })
}

export default ToggleButton
