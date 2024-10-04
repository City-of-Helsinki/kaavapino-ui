// Function to handle dynamic error messages
const getErrorMessage = (data) => {
    let message = '';
  
    Object.keys(data).forEach(key => {
      const value = data[key];
  
      // Check if the value is an array
      if (Array.isArray(value)) {
        // Convert array to a string (you can use different join separators like newline '\n')
        message += `${key}: ${value.join(' ')}\n`;
      } else {
        // If not an array, just append the string or other type of value
        message += `${key}: ${value}\n`;
      }
    });
  
    return message;
  };

  export default {
    getErrorMessage
}