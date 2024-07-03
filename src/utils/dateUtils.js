import { useDispatch } from 'react-redux';
import { validateDateAction } from '../actions/projectActions';

export const useValidateDate = () => {
  const dispatch = useDispatch();
  //Util to call validateDateAction and return suggested date from backend if validation fails.
  const validateDate = (field, projectName, formattedDate, setWarning) => {
    console.log("validateDate")
    return new Promise((resolve, reject) => {
      console.log(field, projectName, formattedDate)
      dispatch(validateDateAction(field, projectName, formattedDate, (response) => {
        console.log(response)
        if (response) {
          console.log(response.error_reason)
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
            console.log("if repsone",response.date)
            // Return suggested date
            resolve(response.suggested_date);
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
            console.log("else repsone",response.date)
            // Return valid date
            resolve(response.date);
          }
        } else {
          console.log("error")
          reject(new Error('validateDateAction call error'));
        }
      }));
    });
  };

  return validateDate;
};
