// Date formatters
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const formatTime = (time: string): string => {
  return time.substring(0, 5);
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
