// services/searchService.js - Phiên bản debug chi tiết
import api from "./api";

export const searchService = {
  // Tìm kiếm hàng hóa
  searchHangHoa: async (query) => {
    try {
      console.log("🔍 Searching hang hoa with query:", query);

      // ✅ FIX 1: Kiểm tra minimum length
      if (!query || query.length < 2) {
        console.log("❌ Query too short, returning empty array");
        return [];
      }

      // ✅ FIX 2: Truyền query trực tiếp thay vì object
      const response = await api.get(
        `/hang-hoa/search/suggestions?q=${encodeURIComponent(query)}`
      );

      console.log("✅ Hang hoa search response:", response.data);

      // ✅ FIX 3: EXTRACT DATA CORRECTLY
      let results = response.data?.data || response.data || [];

      // Đảm bảo results là array
      if (!Array.isArray(results)) {
        console.log("⚠️ Results is not array, converting:", results);
        results = [];
      }

      // ✅ FIX 4: ADD CREATE NEW OPTION if no exact match
      if (query && query.trim().length >= 2 && results.length === 0) {
        const newOption = {
          id: `new_${Date.now()}`,
          ten_hang_hoa: query.trim(),
          ma_hang_hoa: `NEW_${Date.now()}`,
          don_vi_tinh: "Cái",
          co_so_seri: false,
          gia_nhap_gan_nhat: 0,
          isNewItem: true,
        };

        results.push(newOption);
        console.log("➕ Added create new option:", newOption);
      }

      // ✅ FIX 5: ADD CREATE NEW OPTION if no exact name match
      if (query && query.trim().length >= 2 && results.length > 0) {
        const queryLower = query.trim().toLowerCase();
        const hasExactMatch = results.some(
          (item) => item.ten_hang_hoa?.toLowerCase() === queryLower
        );

        if (!hasExactMatch) {
          const newOption = {
            id: `new_${Date.now()}`,
            ten_hang_hoa: query.trim(),
            ma_hang_hoa: `NEW_${Date.now()}`,
            don_vi_tinh: "Cái",
            co_so_seri: false,
            gia_nhap_gan_nhat: 0,
            isNewItem: true,
          };

          results.push(newOption);
          console.log(
            "➕ Added create new option for partial match:",
            newOption
          );
        }
      }

      console.log("🎯 Final results:", results);
      return results;
    } catch (error) {
      console.error("❌ Error searching hang hoa:", error);
      return [];
    }
  },

  // async searchHangHoaForXuatKho(query, phongBanId) {
  //   try {
  //     console.log(
  //       "🔍 Searching hang hoa for xuat kho:",
  //       query,
  //       "phong_ban:",
  //       phongBanId
  //     );

  //     if (!phongBanId) {
  //       console.warn("⚠️ Missing phong_ban_id for xuat kho search");
  //       return [];
  //     }

  //     const response = await api.get(
  //       `/hang-hoa/search/xuat-kho?q=${encodeURIComponent(
  //         query
  //       )}&phong_ban_id=${phongBanId}`
  //     );

  //     console.log("✅ Search hang hoa for xuat kho response:", response.data);
  //     return response.success ? response.data : [];
  //   } catch (error) {
  //     console.error("❌ Search hang hoa for xuat kho error:", error);
  //     return [];
  //   }
  // },

  // ✅ TẠO HÀNG HÓA TỰ ĐỘNG - ENHANCED

  async searchHangHoaForXuatKho(query, phongBanId) {
    try {
      console.log(
        "🔍 Searching hang hoa for xuat kho:",
        query,
        "phong_ban:",
        phongBanId
      );

      if (!phongBanId) {
        console.warn("⚠️ Missing phong_ban_id for xuat kho search");
        return [];
      }

      const response = await api.get(
        `/hang-hoa/search/xuat-kho?q=${encodeURIComponent(
          query
        )}&phong_ban_id=${phongBanId}`
      );

      console.log("✅ Search hang hoa for xuat kho response:", response.data);

      // ✅ FIX: Sửa logic parse response
      if (response.data?.success) {
        return response.data.data || [];
      }

      // ✅ FIX: Fallback nếu không có success field
      if (Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error("❌ Search hang hoa for xuat kho error:", error);
      return [];
    }
  },

  async createHangHoaAuto(data) {
    try {
      console.log("🔨 Creating hang hoa auto:", data);

      const response = await api.post("/hang-hoa/auto-create", data);

      console.log("✅ Created hang hoa:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error creating hang hoa:", error);
      throw error;
    }
  },

  // ✅ FIX: Tìm kiếm nhà cung cấp thông thường
  searchNhaCungCap: async (params) => {
    try {
      console.log("🔍 Searching nha cung cap with params:", params);
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(
        `/nha-cung-cap/search/suggestions?${queryString}`
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

  // ✅ NEW: Tìm kiếm nhà cung cấp theo loại phiếu
  async searchNhaCungCapByType(query, loaiPhieu = "tu_mua") {
    try {
      console.log("🔍 SearchService - NCC search:", { query, loaiPhieu });

      const response = await api.get(
        "/nha-cung-cap/search/searchNhaCungCapByType",
        {
          params: { search: query, loai_phieu: loaiPhieu },
        }
      );

      console.log("🔍 SearchService - NCC results:", response.data);

      let results = response.data?.data || [];

      // ✅ FIX: Add option to create new supplier if query is long enough
      if (
        query &&
        query.trim().length >= 3 &&
        (loaiPhieu === "tu_mua" || loaiPhieu === "tren_cap")
      ) {
        const existingNames = results.map((item) =>
          item.ten_ncc?.toLowerCase()
        );
        const queryLower = query.trim().toLowerCase();

        if (!existingNames.includes(queryLower)) {
          results.unshift({
            id: `new_${Date.now()}`,
            ten_ncc: query.trim(),
            dia_chi: "",
            phone: "",
            email: "",
            isNewItem: true,
          });
        }
      }

      return results;
    } catch (error) {
      console.error("❌ SearchService - NCC search error:", error);
      return [];
    }
  },

  // Tạo nhà cung cấp tự động - THÊM DEBUG CHI TIẾT
  async createNhaCungCapAuto(data) {
    try {
      console.log("🔍 Creating NCC auto:", data);

      const response = await api.post("/nha-cung-cap/auto-create", data);

      console.log("✅ Created NCC:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error creating NCC:", error);
      throw error;
    }
  },

  // ✅ Tìm kiếm phòng ban cung cấp (cho loại phiếu từ cấp trên/điều chuyển)
  searchPhongBanCungCap: async (keyword, loaiPhieu, phongBanNhanId) => {
    try {
      console.log("🔍 Searching phong ban cung cap:", {
        keyword,
        loaiPhieu,
        phongBanNhanId,
      });

      const params = new URLSearchParams({
        q: keyword,
        loai_phieu: loaiPhieu,
        phong_ban_nhan_id: phongBanNhanId,
      });

      const response = await api.get(
        `/phong-ban/search/cung-cap?${params.toString()}`
      );

      console.log("✅ Phong ban cung cap search response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error searching phong ban cung cap:", error);
      throw error;
    }
  },

  // ✅ Lấy danh sách nhà cung cấp theo loại phiếu (cho AutoComplete)
  getNhaCungCapByLoaiPhieu: async (loaiPhieu, phongBanId) => {
    try {
      console.log("📋 Getting NCC by loai phieu:", { loaiPhieu, phongBanId });

      const params = new URLSearchParams({
        loai_phieu: loaiPhieu,
        ...(phongBanId && { phong_ban_id: phongBanId }),
      });

      const response = await api.get(
        `/nha-cung-cap/by-type?${params.toString()}`
      );

      console.log("✅ NCC by loai phieu response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error getting NCC by loai phieu:", error);
      throw error;
    }
  },

  // ✅ Helper function để xác định loại search dựa trên loại phiếu
  getSearchFunction: (loaiPhieu) => {
    switch (loaiPhieu) {
      case "tu_mua":
        return (keyword) =>
          searchService.searchNhaCungCapByType(keyword, "tu_mua");
      case "tren_cap":
        return (keyword) =>
          searchService.searchNhaCungCapByType(keyword, "tren_cap");
      case "dieu_chuyen":
        return (keyword) =>
          searchService.searchNhaCungCapByType(keyword, "dieu_chuyen");
      default:
        return searchService.searchNhaCungCap;
    }
  },

  // ✅ Validate data trước khi tạo
  validateCreateData: {
    nhaCungCap: (data) => {
      const errors = [];

      if (!data.ten_ncc || data.ten_ncc.trim().length < 3) {
        errors.push("Tên nhà cung cấp phải có ít nhất 3 ký tự");
      }

      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push("Email không hợp lệ");
      }

      if (data.phone && !/^[0-9+\-\s()]{8,15}$/.test(data.phone)) {
        errors.push("Số điện thoại không hợp lệ");
      }

      return errors;
    },

    hangHoa: (data) => {
      const errors = [];

      if (!data.ten_hang_hoa || data.ten_hang_hoa.trim().length < 2) {
        errors.push("Tên hàng hóa phải có ít nhất 2 ký tự");
      }

      if (!data.don_vi_tinh || data.don_vi_tinh.trim().length === 0) {
        errors.push("Đơn vị tính không được để trống");
      }

      return errors;
    },
  },
};

// Export default
export default searchService;
