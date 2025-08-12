// services/searchService.js - Phiên bản debug chi tiết
import api from "./api";

export const searchService = {
  // Tìm kiếm hàng hóa
  searchHangHoa: async (keyword) => {
    try {
      console.log("🔍 Searching hang hoa with keyword:", keyword);
      const response = await api.get(
        `/hang-hoa/search/suggestions?q=${encodeURIComponent(keyword)}`
      );
      console.log("✅ Hang hoa search response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error searching hang hoa:", error);
      throw error;
    }
  },

  // Tạo hàng hóa tự động
  createHangHoaAuto: async (data) => {
    try {
      console.log("🆕 Creating hang hoa auto with data:", data);
      const response = await api.post("/hang-hoa/auto-create", data);
      console.log("✅ Create hang hoa auto response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error creating hang hoa auto:", error);
      // Log chi tiết response error
      if (error.response) {
        console.error("❌ Response status:", error.response.status);
        console.error("❌ Response data:", error.response.data);
        console.error("❌ Response headers:", error.response.headers);
      }
      throw error;
    }
  },

  // Tìm kiếm nhà cung cấp
  searchNhaCungCap: async (keyword) => {
    try {
      console.log("🔍 Searching nha cung cap with keyword:", keyword);
      const response = await api.get(
        `/nha-cung-cap/search/suggestions?q=${encodeURIComponent(keyword)}`
      );
      console.log("✅ NCC search response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error searching nha cung cap:", error);
      if (error.response) {
        console.error("❌ Response status:", error.response.status);
        console.error("❌ Response data:", error.response.data);
      }
      throw error;
    }
  },

  // Tạo nhà cung cấp tự động - THÊM DEBUG CHI TIẾT
  createNhaCungCapAuto: async (data) => {
    try {
      console.log("🆕 === CREATE NCC AUTO START ===");
      console.log("📦 Request data:", JSON.stringify(data, null, 2));
      console.log("🔗 Request URL: POST /nha-cung-cap/auto-create");
      console.log("⏰ Timestamp:", new Date().toISOString());

      // Validate data trước khi gửi
      if (!data || typeof data !== "object") {
        throw new Error("Invalid data: must be an object");
      }

      if (
        !data.ten_ncc ||
        typeof data.ten_ncc !== "string" ||
        data.ten_ncc.trim() === ""
      ) {
        throw new Error(
          "Invalid data: ten_ncc is required and must be a non-empty string"
        );
      }

      console.log("✅ Data validation passed");

      const response = await api.post("/nha-cung-cap/auto-create", data);

      console.log("✅ Create NCC auto response received");
      console.log("📊 Response status:", response.status);
      console.log("📦 Response data:", response.data);
      console.log("🆕 === CREATE NCC AUTO END ===");

      return response.data;
    } catch (error) {
      console.error("❌ === CREATE NCC AUTO ERROR ===");
      console.error("⏰ Error timestamp:", new Date().toISOString());
      console.error("📦 Original request data:", JSON.stringify(data, null, 2));
      console.error("❌ Error type:", error.constructor.name);
      console.error("❌ Error message:", error.message);

      if (error.response) {
        console.error("❌ Response status:", error.response.status);
        console.error("❌ Response statusText:", error.response.statusText);
        console.error("❌ Response headers:", error.response.headers);
        console.error("❌ Response data:", error.response.data);

        // Log specific error details from backend
        if (error.response.data) {
          console.error("🔍 Backend error details:");
          console.error("   - Success:", error.response.data.success);
          console.error("   - Message:", error.response.data.message);
          console.error("   - Data:", error.response.data.data);
          console.error("   - Error:", error.response.data.error);
        }
      } else if (error.request) {
        console.error("❌ No response received");
        console.error("❌ Request details:", error.request);
      } else {
        console.error("❌ Request setup error:", error.message);
      }

      console.error("❌ === CREATE NCC AUTO ERROR END ===");
      throw error;
    }
  },

  // Tìm kiếm đơn vị nhận
  searchDonViNhan: async (keyword) => {
    try {
      console.log("🔍 Searching don vi nhan with keyword:", keyword);
      const response = await api.get(
        `/don-vi-nhan/search/suggestions?q=${encodeURIComponent(keyword)}`
      );
      console.log("✅ Don vi nhan search response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error searching don vi nhan:", error);
      throw error;
    }
  },

  // Tạo đơn vị nhận tự động
  createDonViNhanAuto: async (data) => {
    try {
      console.log("🆕 Creating don vi nhan auto with data:", data);
      const response = await api.post("/don-vi-nhan/auto-create", data);
      console.log("✅ Create don vi nhan auto response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error creating don vi nhan auto:", error);
      throw error;
    }
  },
};
