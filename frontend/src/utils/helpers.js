import { format, parseISO, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export const formatNumber = (number) => {
  return new Intl.NumberFormat("vi-VN").format(number);
};

export const formatDate = (date, formatStr = "dd/MM/yyyy") => {
  if (!date) return "";

  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: vi });
};

export const formatDateTime = (date) => {
  return formatDate(date, "dd/MM/yyyy HH:mm");
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const formatRelativeTime = (date) => {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, {
      addSuffix: true,
      locale: vi,
    });
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return "Vừa xong";
  }
};
