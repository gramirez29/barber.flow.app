// Date formatters
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' });
};

/**
 * "HH:mm" (o "HH:mm:ss", formato 24 h con el que se guarda y viaja la hora) -> "3:30 PM".
 * Solo es de presentación: la hora que se envía al backend sigue siendo "HH:mm".
 * Si el texto no es una hora válida se devuelve tal cual.
 */
export const formatTime = (time: string): string => {
  const match = /^(\d{1,2}):(\d{2})/.exec(time?.trim() ?? '');
  if (!match) return time;
  const hours = Number(match[1]) % 24;
  const suffix = hours < 12 ? 'AM' : 'PM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${match[2]} ${suffix}`;
};

export const formatDateTime = (date: string, time: string): string => {
  return `${formatDate(date)} a las ${formatTime(time)}`;
};

// Currency formatter
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
  }).format(amount);
};

// Phone formatter
export const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 8) {
    return `${digits.substring(0, 4)}-${digits.substring(4)}`;
  }
  return phone;
};

// Full name formatter
export const getFullName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};
