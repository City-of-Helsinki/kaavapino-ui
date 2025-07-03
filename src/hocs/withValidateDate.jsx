import React from 'react';
import { useValidateDate } from '../utils/dateUtils';

const withValidateDate = (WrappedComponent) => {
  //Hook util alternative for Class components
    const WithValidateDate = (props) => {
      const validateDate = useValidateDate();
      return <WrappedComponent {...props} validateDate={validateDate} />;
    };
  
    WithValidateDate.displayName = `WithValidateDate(${getDisplayName(WrappedComponent)})`;
  
    return WithValidateDate;
  };
  
  function getDisplayName(WrappedComponent) {
    return WrappedComponent.displayName || WrappedComponent.name || 'Component';
  }
  
  export default withValidateDate;