import { useDispatch } from 'react-redux';
import { validateDateAction } from '../actions/projectActions';

export const useValidateDate = () => {
  const dispatch = useDispatch();
  //Util to call validateDateAction and return suggested date from backend if validation fails.
  const validateDate = (field, projectName, formattedDate, setWarning) => {
    return new Promise((resolve, reject) => {
      dispatch(validateDateAction(field, projectName, formattedDate, (response) => {
        if (response) {
          let returnDate
          if (response.error_reason !== null) {
            // Show warning notification with suggested date and reasons
            if (typeof setWarning === 'function') {
                setWarning({
                warning: true,
                response: {
                    reason: response.error_reason,
                    suggested_date: response.suggested_date,
                    conflicting_deadline: response.conflicting_deadline
                }
                });
            }
            // Return suggested date
            returnDate = response.suggested_date;
          } else {
            if (typeof setWarning === 'function') {
                // Reset warning
                setWarning({
                warning: false,
                response: {
                    reason: "",
                    suggested_date: "",
                    conflicting_deadline: ""
                }
                });
            }
            // Return valid date
            returnDate = response.date
          }
          resolve(returnDate);
        } else {
          reject(new Error('validateDateAction call error'));
        }
      }));
    });
  };

  return validateDate;
};
