import React from 'react';
import { IconLock } from 'hds-react';
import PropTypes from 'prop-types';

const InputLockedMessage = ({ t, lockStatus, isFieldsetRow=false }) => {
  const { user_name, user_email } = lockStatus?.lockStyle?.lockData?.attribute_lock || {};
  if (isFieldsetRow) {
    return (
      <span className="input-locked-fieldset">
        <IconLock />
        {t('project.field-locked-by-user', { userName: user_name, userEmail: user_email })}
      </span>
    )
  }
  return (
    <span className="input-locked">
      {t('project.field-locked-by-user', { userName: user_name, userEmail: user_email })}
      <IconLock />
    </span>
  );
};

InputLockedMessage.propTypes = {
  t: PropTypes.func.isRequired,
  isFieldsetRow: PropTypes.bool,
  lockStatus: PropTypes.shape({
    lockStyle: PropTypes.shape({
      lockData: PropTypes.shape({
        attribute_lock: PropTypes.shape({
          user_name: PropTypes.string,
          user_email: PropTypes.string,
        }),
      }),
    }),
  }).isRequired,
};

export default InputLockedMessage;