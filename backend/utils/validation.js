const validateRequired = (fields, data) => {
  const missing = [];
  for (const field of fields) {
    if (
      !data[field] ||
      (typeof data[field] === "string" && data[field].trim() === "")
    ) {
      missing.push(field);
    }
  }
  return missing.length > 0
    ? `Thiếu thông tin bắt buộc: ${missing.join(", ")}`
    : null;
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(phone);
};

const validateDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

const validateNumber = (value, min = null, max = null) => {
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  if (min !== null && num < min) return false;
  if (max !== null && num > max) return false;
  return true;
};

module.exports = {
  validateRequired,
  validateEmail,
  validatePhone,
  validateDate,
  validateNumber,
};
