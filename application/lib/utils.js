/**
 * Formats a date string or object into dd/mm/yyyy
 * @param {string|Date} date 
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Formats a date string or object into dd/mm/yyyy hh:mm AM/PM (Local Time)
 * @param {string|Date} date 
 */
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strTime = String(hours).padStart(2, '0') + ':' + minutes + ' ' + ampm;
  
  return `${day}/${month}/${year} ${strTime}`;
};

/**
 * Converts any date input to a UTC ISO string for backend storage
 * @param {Date|string} date 
 */
export const toUTC = (date) => {
  if (!date) return new Date().toISOString();
  return new Date(date).toISOString();
};

/**
 * Ensures a date is treated as a local Date object
 * @param {string} utcString 
 */
export const fromUTC = (utcString) => {
  if (!utcString) return new Date();
  return new Date(utcString);
};

/**
 * Formats currency values
 * @param {number} amount 
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};
