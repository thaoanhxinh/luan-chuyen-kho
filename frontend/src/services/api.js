// services/api.js - Cấu hình API với debug chi tiết
import axios from "axios";
import toast from "react-hot-toast";

// Tạo axios instance với cấu hình chi tiết
const api = axios.create({
  baseURL: "http://localhost:5000/api", // Đảm bảo đúng port backend (5000)
  timeout: 30000, // 30 giây timeout
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor để log và thêm auth token
api.interceptors.request.use(
  (config) => {
    console.log("🚀 === API REQUEST START ===");
    console.log("🔗 Method:", config.method?.toUpperCase());
    console.log("🔗 URL:", config.baseURL + config.url);
    console.log("🔗 Full URL:", config.baseURL + config.url);
    console.log("📦 Data:", config.data);
    console.log("🏷️ Headers:", config.headers);

    // Thêm authorization token từ localStorage
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔐 Token added to request");
    } else {
      console.log("⚠️ No token found in localStorage");
    }

    console.log("🚀 === API REQUEST END ===");
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor để log response và handle errors
api.interceptors.response.use(
  (response) => {
    console.log("✅ === API RESPONSE SUCCESS START ===");
    console.log("📊 Status:", response.status);
    console.log("📊 StatusText:", response.statusText);
    console.log("📦 Data:", response.data);
    console.log("🏷️ Headers:", response.headers);
    console.log("✅ === API RESPONSE SUCCESS END ===");
    return response;
  },
  (error) => {
    console.error("❌ === API RESPONSE ERROR START ===");
    console.error("⏰ Timestamp:", new Date().toISOString());

    if (error.response) {
      // Server responded with error status
      console.error("📊 Status:", error.response.status);
      console.error("📊 StatusText:", error.response.statusText);
      console.error("🔗 URL:", error.config?.url);
      console.error("🔗 Method:", error.config?.method?.toUpperCase());
      console.error("📦 Response Data:", error.response.data);
      console.error("🏷️ Response Headers:", error.response.headers);

      // Log cụ thể cho lỗi 400
      if (error.response.status === 400) {
        console.error("🔍 BAD REQUEST DETAILS:");
        console.error(
          "   - Request URL:",
          error.config?.baseURL + error.config?.url
        );
        console.error("   - Request Data:", error.config?.data);
        console.error("   - Request Headers:", error.config?.headers);
      }

      // Log cụ thể cho lỗi 401
      if (error.response.status === 401) {
        console.error("🔐 UNAUTHORIZED - Token may be invalid or expired");
        // Clear token và redirect to login nếu cần
        localStorage.removeItem("token");
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error("📡 No response received");
      console.error("🔗 Request URL:", error.config?.url);
      console.error("📡 Request details:", error.request);
    } else {
      // Something else happened
      console.error("⚙️ Request setup error:", error.message);
    }

    console.error("❌ === API RESPONSE ERROR END ===");
    return Promise.reject(error);
  }
);

export default api;

// Upload file với progress tracking
export const uploadWithProgress = (url, formData, onProgress) => {
  return api.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      if (onProgress) {
        onProgress(percentCompleted);
      }
    },
  });
};

// Download file function
export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, {
      responseType: "blob",
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename || "download";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("Download error:", error);
    throw error;
  }
};

// Health check function
export const checkApiHealth = async () => {
  try {
    const response = await api.get("/health", { timeout: 5000 });
    return response.data;
  } catch (error) {
    console.error("API health check failed:", error);
    throw error;
  }
};
