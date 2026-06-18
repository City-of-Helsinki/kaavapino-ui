import React from 'react';
import { IconLock } from 'hds-react';
import PropTypes from 'prop-types';

const InputLockedMessage = ({ t, lockStatus }) => {
  const { userName, userEmail } = lockStatus?.lockStyle?.lockData?.attribute_lock || {};
  return (<span className="input-locked"> {t('project.field-locked-by-user', { userName, userEmail })} <IconLock /></span>);
};

InputLockedMessage.propTypes = {
  t: PropTypes.func.isRequired,
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