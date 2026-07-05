/**
 * Formats a UTC ISO string to the user's local date and time: DD-MM-YYYY hh:mm AM/PM
 */
export function formatUTCToLocal(utcString?: string | null): string {
  if (!utcString) return '';
  const date = new Date(utcString);
  if (isNaN(date.getTime())) return utcString;

  const pad = (num: number) => String(num).padStart(2, '0');

  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  
  let hours = date.getHours();
  const minutes = pad(date.getMinutes());
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const hh = pad(hours);

  return `${dd}-${mm}-${yyyy} ${hh}:${minutes} ${ampm}`;
}

/**
 * Converts a user's local 12-hour date-time input (DD-MM-YYYY hh:mm AM/PM) back to UTC ISO string
 */
export function convertLocalToUTC(localString?: string | null): string {
  if (!localString) return '';
  const trimmed = localString.trim();
  if (!trimmed) return '';

  let parsedDate: Date;

  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    const dateParts = parts[0].split('-');
    const timeParts = parts[1].split(':');

    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const year = parseInt(dateParts[2], 10);
    
    let hours = parseInt(timeParts[0], 10) || 0;
    const minutes = parseInt(timeParts[1], 10) || 0;

    if (parts.length === 3) {
      const ampm = parts[2].toUpperCase();
      if (ampm === 'PM' && hours < 12) {
        hours += 12;
      } else if (ampm === 'AM' && hours === 12) {
        hours = 0;
      }
    }

    parsedDate = new Date(year, month, day, hours, minutes, 0);
  } else {
    const dateParts = trimmed.split('-');
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const year = parseInt(dateParts[2], 10);

    parsedDate = new Date(year, month, day, 0, 0, 0);
  }

  if (isNaN(parsedDate.getTime())) return trimmed;
  return parsedDate.toISOString();
}
