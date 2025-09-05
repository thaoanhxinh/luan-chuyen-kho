import { format, parseISO, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import * as searchService from "../services/searchService";

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

export const createNhaCungCapIfNeeded = async (nhaCungCapData) => {
  if (!nhaCungCapData.isNewItem) {
    return nhaCungCapData;
  }

  try {
    console.log("🔨 Creating new nha cung cap:", nhaCungCapData);

    // ✅ FIXED: Thêm loai_nha_cung_cap vào request
    const requestData = {
      ten_ncc: nhaCungCapData.ten_ncc,
      dia_chi: nhaCungCapData.dia_chi || "",
      phone: nhaCungCapData.phone || "",
      email: nhaCungCapData.email || "",
      loai_nha_cung_cap: "tu_mua", // Default cho tu_mua, có thể customize later
    };

    console.log("📤 Request data for createNhaCungCapAuto:", requestData);

    const response = await searchService.createNhaCungCapAuto(requestData);

    if (response.success) {
      console.log("✅ Created nha cung cap:", response.data);

      // ✅ FIXED: Return đúng format với id
      return {
        id: response.data.id,
        ma_ncc: response.data.ma_ncc,
        ten_ncc: response.data.ten_ncc,
        dia_chi: response.data.dia_chi,
        phone: response.data.phone,
        email: response.data.email,
        is_noi_bo: response.data.is_noi_bo,
        loai_nha_cung_cap: response.data.loai_nha_cung_cap,
      };
    } else {
      throw new Error(response.message || "Không thể tạo nhà cung cấp");
    }
  } catch (error) {
    console.error("❌ Error creating nha cung cap:", error);
    throw error;
  }
};
