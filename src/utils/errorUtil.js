// Function to handle dynamic error messages
const getErrorMessage = (data, format = 'default') => {
  let message = '';

  Object.keys(data).forEach(key => {
    const value = data[key];

    // Check if the value is an array
    if (Array.isArray(value)) {
      // Convert array to a string based on the format
      if (format === 'date') {
        const dateMessage = value.find(msg => msg.includes("Ensimmäinen mahdollinen päivä on"));
        if (dateMessage) {
          // Extract the date
          const date = dateMessage.split(' ').slice(-1)[0];
          message += `${key}: ${date}\n`;
        }
      } else {
        message += `${key}: ${value.join(' ')}\n`;
      }
    } else {
      // If not an array, just append the string or other type of value
      message += `${key}: ${value}\n`;
    }
  });

  return message;
};

export default {
  getErrorMessage
};
