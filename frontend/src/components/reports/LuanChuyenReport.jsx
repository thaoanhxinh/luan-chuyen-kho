import React, { useState, useEffect } from "react";
import {
  Calendar,
  Download,
  BarChart3,
  Building2,
  Warehouse,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Filter,
  Building,
} from "lucide-react";
import { baoCaoService } from "../../services/baoCaoService";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

const LuanChuyenReport = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [phongBanOptions, setPhongBanOptions] = useState({
    cap2: [],
    cap3: [],
    hierarchy: {},
  });

  // ✅ SIMPLIFIED FILTERS
  const [filters, setFilters] = useState({
    tu_ngay: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    den_ngay: new Date().toISOString().split("T")[0],
    phong_ban_cap2_id: "all",
    phong_ban_cap3_id: "all",
  });

  const handleExportExcel = async () => {
    try {
      setLoading(true);

      // Logic chon filter cuoi cung de gui API
      let selectedFilter = "all";
      if (filters.phong_ban_cap3_id !== "all") {
        selectedFilter = filters.phong_ban_cap3_id;
      } else if (filters.phong_ban_cap2_id !== "all") {
        selectedFilter = filters.phong_ban_cap2_id;
      }

      const apiFilters = {
        ...filters,
        phong_ban_id: selectedFilter,
      };

      console.log("Exporting Excel with filters:", apiFilters);

      // Hiện form nhập thông tin chữ ký
      const signatures = await showSignatureForm();

      // Goi dung method name trong service với thông tin chữ ký
      const blob = await baoCaoService.exportLuanChuyenKho(
        apiFilters,
        signatures
      );

      // Tao download link cho file Excel
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Tao ten file voi timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      link.download = `bao-cao-luan-chuyen-kho-${timestamp}.xlsx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Xuat Excel thanh cong!");
    } catch (error) {
      console.error("Export Excel error:", error);
      toast.error("Loi khi xuat Excel");
    } finally {
      setLoading(false);
    }
  };

  // Hàm hiện form nhập thông tin chữ ký
  const showSignatureForm = () => {
    return new Promise((resolve, reject) => {
      const modal = document.createElement("div");
      modal.className =
        "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";

      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
          <h3 class="text-lg font-semibold mb-4">Thông tin xuất Excel</h3>
          <form id="signatureForm">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Số biểu số</label>
              <input type="text" id="bieuSo" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="VD: 07.1/BCQT" value="07.1/BCQT" required>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Người lập biểu</label>
              <input type="text" id="nguoiLap" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nhập tên người lập" required>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Trưởng ban Vật tư</label>
              <input type="text" id="truongBan" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nhập tên trưởng ban" required>
            </div>
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-1">TL. TƯ LỆNH CHỦ NHIỆM HẬU CẦN - KỸ THUẬT</label>
              <input type="text" id="chuNhiem" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nhập tên chủ nhiệm" required>
            </div>
            <div class="flex justify-end space-x-3">
              <button type="button" id="cancelBtn" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">Hủy</button>
              <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Xuất Excel</button>
            </div>
          </form>
        </div>
      `;

      document.body.appendChild(modal);

      const form = modal.querySelector("#signatureForm");
      const cancelBtn = modal.querySelector("#cancelBtn");

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const signatures = {
          bieu_so: document.getElementById("bieuSo").value,
          nguoi_lap: document.getElementById("nguoiLap").value,
          truong_ban: document.getElementById("truongBan").value,
          chu_nhiem: document.getElementById("chuNhiem").value,
        };
        document.body.removeChild(modal);
        resolve(signatures);
      });

      cancelBtn.addEventListener("click", () => {
        document.body.removeChild(modal);
        reject(new Error("User cancelled"));
      });
    });
  };

  const [activeTab, setActiveTab] = useState("tong-hop");
  //const [expandedManagers, setExpandedManagers] = useState(new Set());

  // ✅ LOAD OPTIONS & DATA
  useEffect(() => {
    loadPhongBanOptions();
  }, []);

  useEffect(() => {
    loadReportData();
  }, [filters]);

  // ✅ LOAD PHONG BAN OPTIONS
  const loadPhongBanOptions = async () => {
    try {
      const response = await baoCaoService.getPhongBanForReport();
      console.log("🏢 PhongBan options response:", response);

      if (response.success) {
        setPhongBanOptions(response.data);
      }
    } catch (error) {
      console.error("❌ Error loading phòng ban options:", error);
    }
  };

  // ✅ HANDLE FILTER CHANGES
  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      // Reset cấp 3 khi chọn cấp 2 mới
      if (key === "phong_ban_cap2_id") {
        newFilters.phong_ban_cap3_id = "all";
      }
      return newFilters;
    });
  };

  // ✅ MAIN LOAD DATA FUNCTION
  const loadReportData = async () => {
    setLoading(true);
    try {
      // Logic chọn filter cuối cùng để gửi API
      let selectedFilter = "all";

      if (filters.phong_ban_cap3_id !== "all") {
        selectedFilter = filters.phong_ban_cap3_id;
      } else if (filters.phong_ban_cap2_id !== "all") {
        selectedFilter = filters.phong_ban_cap2_id;
      }

      const apiFilters = {
        ...filters,
        phong_ban_id: selectedFilter,
      };

      console.log("🚀 API Request:", apiFilters);
      console.log("👤 User info:", {
        role: user?.role,
        cap_bac: user?.phong_ban?.cap_bac,
        phong_ban_id: user?.phong_ban_id,
        ten_phong_ban: user?.phong_ban?.ten_phong_ban,
      });

      // ✅ DEBUG: Kiểm tra phân quyền
      if (user?.role === "user" && user?.phong_ban?.cap_bac === 3) {
        console.log("🔍 CẤP 3 USER - Kiểm tra phân quyền:");
        console.log("  - User phong_ban_id:", user.phong_ban_id);
        console.log("  - Selected filter:", selectedFilter);
        console.log("  - Should only see own department data");
      }

      const response = await baoCaoService.getLuanChuyenReport(apiFilters);

      console.log("📊 API Response Full:", response);
      console.log("📊 Response Success:", response.success);
      console.log("📊 Response Data:", response.data);

      if (response.success && response.data) {
        console.log("✅ Setting report data...");
        setReportData(response.data);

        // ✅ DEBUG: Kiểm tra data đã set
        console.log("🔍 Data after set:", {
          hasLuanChuyen: !!response.data.luanChuyen,
          tongHopLength: response.data.luanChuyen?.tongHop?.length,
          tuMuaLength: response.data.luanChuyen?.tuMua?.length,
          trenCapLength: response.data.luanChuyen?.trenCap?.length,
          khacLength: response.data.luanChuyen?.khac?.length,
        });

        // ✅ DEBUG: Kiểm tra chi tiết dữ liệu cho cấp 3
        if (user?.role === "user" && user?.phong_ban?.cap_bac === 3) {
          console.log("🔍 CẤP 3 USER - Chi tiết dữ liệu nhận được:");
          const tongHopData = response.data.luanChuyen?.tongHop || [];
          console.log(
            "  - Tổng số phòng ban trong dữ liệu:",
            tongHopData.length
          );
          console.log(
            "  - Danh sách phòng ban:",
            tongHopData.map((item) => ({
              id: item.id,
              noi_dung: item.noi_dung,
              cap_bac: item.cap_bac,
              phong_ban_cha_id: item.phong_ban_cha_id,
            }))
          );

          // Kiểm tra xem có phòng ban nào không thuộc về user không
          const userPhongBanId = user.phong_ban_id;
          const unauthorizedData = tongHopData.filter(
            (item) =>
              item.id !== userPhongBanId &&
              item.phong_ban_cha_id !== userPhongBanId
          );

          if (unauthorizedData.length > 0) {
            console.error(
              "❌ PHÂN QUYỀN BỊ VI PHẠM! User cấp 3 thấy dữ liệu không thuộc quyền:"
            );
            console.error("  - Dữ liệu không được phép:", unauthorizedData);
          } else {
            console.log("✅ Phân quyền OK - Chỉ thấy dữ liệu thuộc quyền");
          }
        }
      } else {
        console.error("❌ API Response failed:", response);
        toast.error(
          "Không thể tải báo cáo: " + (response.message || "Lỗi không xác định")
        );
      }
    } catch (error) {
      console.error("❌ Load báo cáo error:", error);
      toast.error("Lỗi khi tải báo cáo");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FORMAT HELPERS
  const formatCurrency = (value) => {
    if (!value || value === 0) return "-";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  // ✅ RENDER PHONG BAN FILTER
  const renderPhongBanFilter = () => {
    if (user?.role === "user" && user?.phong_ban?.cap_bac === 3) {
      // ✅ Cấp 3: Hiển thị thông tin phòng ban hiện tại
      return (
        <div className="flex items-center space-x-2">
          <Building className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Phòng ban:</span>
          <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
            🏢 {user.phong_ban?.ten_phong_ban}
          </span>
        </div>
      );
    }

    // Manager/Admin: gộp dropdown gọn để tránh tràn
    const cap2Options = phongBanOptions.cap2 || [];
    const cap3All = phongBanOptions.cap3 || [];
    const selectedCap2 = filters.phong_ban_cap2_id;
    const cap3Options =
      selectedCap2 !== "all"
        ? cap3All.filter((c) => c.phong_ban_cha_id === parseInt(selectedCap2))
        : cap3All;

    return (
      <div className="flex items-center space-x-2">
        <Building2 className="h-4 w-4 text-gray-500" />
        <label className="text-sm font-medium text-gray-700">Đơn vị:</label>
        <select
          value={filters.phong_ban_cap2_id}
          onChange={(e) =>
            handleFilterChange("phong_ban_cap2_id", e.target.value)
          }
          className="border border-gray-300 rounded px-2 py-1.5 text-sm"
        >
          <option value="all">Cấp 2: Tất cả</option>
          {cap2Options.map((cap2) => (
            <option key={cap2.id} value={cap2.id}>
              {cap2.ten_phong_ban}
            </option>
          ))}
        </select>
        <select
          value={filters.phong_ban_cap3_id}
          onChange={(e) =>
            handleFilterChange("phong_ban_cap3_id", e.target.value)
          }
          className="border border-gray-300 rounded px-2 py-1.5 text-sm"
        >
          <option value="all">Cấp 3: Tất cả</option>
          {cap3Options.map((cap3) => (
            <option key={cap3.id} value={cap3.id}>
              {cap3.ten_phong_ban}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // ✅ MAIN TABLE COMPONENT - SIMPLIFIED & ROBUST
  const TongHopTable = ({ data, tabType = "tongHop" }) => {
    console.log(`🔍 TongHopTable (${tabType}) received:`, {
      data: data,
      dataLength: data ? data.length : "no data",
      dataType: typeof data,
      isArray: Array.isArray(data),
      firstItem:
        data && data[0]
          ? {
              id: data[0].id,
              noi_dung: data[0].noi_dung,
              cap_bac: data[0].cap_bac,
              cong_nhap: data[0].cong_nhap,
              ton_cuoi_ky: data[0].ton_cuoi_ky,
            }
          : "no first item",
    });

    // ✅ VALIDATION: Kiểm tra data
    if (!data || !Array.isArray(data)) {
      console.log(`⚠️ ${tabType}: Invalid data type`);
      return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-8 text-center text-gray-500">
            <p>Dữ liệu không hợp lệ</p>
            <p className="text-xs mt-2">Type: {typeof data}</p>
          </div>
        </div>
      );
    }

    if (data.length === 0) {
      console.log(`⚠️ ${tabType}: Empty data array`);
      return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-8 text-center text-gray-500">
            <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Không có dữ liệu trong khoảng thời gian được chọn</p>
            <p className="text-xs mt-2">Tab: {tabType}</p>
          </div>
        </div>
      );
    }

    // ✅ ORGANIZE DATA
    const cap1Items = data.filter((item) => item.cap_bac === 1) || [];
    const cap2Items = data.filter((item) => item.cap_bac === 2) || [];
    const cap3Items = data.filter((item) => item.cap_bac === 3) || [];

    console.log(`🏢 ${tabType} organized:`, {
      cap1: cap1Items.length,
      cap2: cap2Items.length,
      cap3: cap3Items.length,
      cap3Items: cap3Items.map((i) => ({
        id: i.id,
        name: i.noi_dung,
        cong_nhap: i.cong_nhap,
      })),
    });

    // ✅ MAPPING cấp 2 -> cấp 3
    const cap2ToCap3Map = {};
    cap2Items.forEach((cap2) => {
      cap2ToCap3Map[cap2.id] = cap3Items.filter(
        (cap3) => cap3.phong_ban_cha_id === cap2.id
      );
    });

    // ✅ ORPHAN cấp 3 (không có cấp 2 cha trong data)
    const orphanCap3 = cap3Items.filter(
      (cap3) => !cap2Items.find((cap2) => cap2.id === cap3.phong_ban_cha_id)
    );

    console.log(
      `👥 ${tabType} orphan cap3:`,
      orphanCap3.map((i) => i.noi_dung)
    );

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Nội dung
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Tồn đầu kỳ
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider bg-blue-50">
                  Trên cấp
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider bg-blue-50">
                  Tự mua
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider bg-blue-50">
                  Luân chuyển
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider bg-green-50">
                  Cộng nhập
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider bg-red-50">
                  Xuất SD
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider bg-red-50">
                  Cấp cho ĐV
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider bg-red-50">
                  Cộng xuất
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider bg-blue-50">
                  Tồn cuối kỳ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* ✅ RENDER CẤP 1 */}
              {cap1Items.map((item) => (
                <tr
                  key={`cap1-${item.id}`}
                  className="bg-blue-50 font-semibold"
                >
                  <td className="px-4 py-3 text-sm font-bold text-blue-900">
                    <div className="truncate max-w-[280px]">
                      🏛️ {item.noi_dung}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-bold text-blue-900">
                    {formatCurrency(item.ton_dau_ky)}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-bold text-blue-900">
                    {formatCurrency(item.nhap_tren_cap)}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-bold text-blue-900">
                    {formatCurrency(item.nhap_tu_mua)}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-bold text-blue-900">
                    {formatCurrency(item.nhap_khac)}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-bold text-blue-900 bg-green-100">
                    {formatCurrency(item.cong_nhap)}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-bold text-blue-900">
                    {formatCurrency(item.xuat_su_dung)}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-bold text-blue-900">
                    {formatCurrency(item.xuat_cap_cho)}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-bold text-blue-900 bg-red-100">
                    {formatCurrency(item.cong_xuat)}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-bold text-blue-900 bg-blue-100">
                    {formatCurrency(item.ton_cuoi_ky)}
                  </td>
                </tr>
              ))}

              {/* ✅ RENDER CẤP 2 VÀ CẤP 3 CON */}
              {cap2Items.map((cap2Item) => (
                <React.Fragment key={`cap2-${cap2Item.id}`}>
                  {/* Dòng cấp 2 */}
                  <tr className="bg-yellow-50 font-medium">
                    <td className="px-4 py-3 text-sm font-semibold text-yellow-800">
                      <div className="truncate max-w-[260px]">
                        &nbsp;&nbsp;🏢 {cap2Item.noi_dung}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-yellow-800">
                      {formatCurrency(cap2Item.ton_dau_ky)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-yellow-800">
                      {formatCurrency(cap2Item.nhap_tren_cap)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-yellow-800">
                      {formatCurrency(cap2Item.nhap_tu_mua)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-yellow-800">
                      {formatCurrency(cap2Item.nhap_khac)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-yellow-800 bg-green-50">
                      {formatCurrency(cap2Item.cong_nhap)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-yellow-800">
                      {formatCurrency(cap2Item.xuat_su_dung)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-yellow-800">
                      {formatCurrency(cap2Item.xuat_cap_cho)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-yellow-800 bg-red-50">
                      {formatCurrency(cap2Item.cong_xuat)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-yellow-800 bg-blue-50">
                      {formatCurrency(cap2Item.ton_cuoi_ky)}
                    </td>
                  </tr>

                  {/* Các cấp 3 thuộc cấp 2 này */}
                  {(cap2ToCap3Map[cap2Item.id] || []).map((cap3Item) => (
                    <tr
                      key={`cap3-under-cap2-${cap3Item.id}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        &nbsp;&nbsp;&nbsp;&nbsp;📦 {cap3Item.noi_dung}
                      </td>
                      <td className="px-3 py-3 text-right text-sm text-gray-700">
                        {formatCurrency(cap3Item.ton_dau_ky)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-sm font-medium text-blue-600">
                          {formatCurrency(cap3Item.nhap_tren_cap)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-sm font-medium text-blue-600">
                          {formatCurrency(cap3Item.nhap_tu_mua)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-sm font-medium text-blue-600">
                          {formatCurrency(cap3Item.nhap_khac)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right bg-green-50">
                        <span className="text-sm font-bold text-green-700">
                          {formatCurrency(cap3Item.cong_nhap)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-sm font-medium text-red-600">
                          {formatCurrency(cap3Item.xuat_su_dung)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-sm font-medium text-red-600">
                          {formatCurrency(cap3Item.xuat_cap_cho)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right bg-red-50">
                        <span className="text-sm font-bold text-red-700">
                          {formatCurrency(cap3Item.cong_xuat)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right bg-blue-50">
                        <span className="text-sm font-bold text-blue-700">
                          {formatCurrency(cap3Item.ton_cuoi_ky)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}

              {/* ✅ QUAN TRỌNG: RENDER CẤP 3 ORPHAN (cho user cấp 3) */}
              {orphanCap3.map((cap3Item) => (
                <tr
                  key={`cap3-orphan-${cap3Item.id}`}
                  className="bg-blue-50 border-l-4 border-blue-600"
                >
                  <td className="px-4 py-3 text-sm font-bold text-blue-900">
                    📦 {cap3Item.noi_dung}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-bold text-blue-900">
                    {formatCurrency(cap3Item.ton_dau_ky)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-sm font-bold text-blue-700">
                      {formatCurrency(cap3Item.nhap_tren_cap)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-sm font-bold text-blue-700">
                      {formatCurrency(cap3Item.nhap_tu_mua)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-sm font-bold text-blue-700">
                      {formatCurrency(cap3Item.nhap_khac)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right bg-green-100">
                    <span className="text-sm font-bold text-green-800">
                      {formatCurrency(cap3Item.cong_nhap)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-sm font-bold text-red-700">
                      {formatCurrency(cap3Item.xuat_su_dung)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-sm font-bold text-red-700">
                      {formatCurrency(cap3Item.xuat_cap_cho)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right bg-red-100">
                    <span className="text-sm font-bold text-red-800">
                      {formatCurrency(cap3Item.cong_xuat)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right bg-blue-100">
                    <span className="text-sm font-bold text-blue-800">
                      {formatCurrency(cap3Item.ton_cuoi_ky)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ✅ FOOTER với thống kê */}
        <div className="bg-gray-50 px-4 py-3 border-t">
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              Tổng: {data.length} đơn vị (Cấp 1: {cap1Items.length}, Cấp 2:{" "}
              {cap2Items.length}, Cấp 3: {cap3Items.length})
            </span>
            <span>
              Tổng giá trị nhập:{" "}
              {formatCurrency(
                data.reduce(
                  (sum, item) => sum + (parseFloat(item.cong_nhap) || 0),
                  0
                )
              )}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ✅ MAIN RENDER
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Báo cáo luân chuyển kho
            </h2>
            <button
              onClick={loadReportData}
              disabled={loading}
              className="flex items-center space-x-2 text-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              <span>Cập nhật</span>
            </button>
            <button
              onClick={handleExportExcel}
              disabled={loading}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Download
                className={`h-4 w-4 ${loading ? "animate-bounce" : ""}`}
              />
              <span>Xuáº¥t Excel</span>
            </button>
          </div>
        </div>

        {/* Filters - compact, single row */}
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-4 flex-nowrap overflow-x-auto">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">
                Từ ngày:
              </label>
              <input
                type="date"
                value={filters.tu_ngay}
                onChange={(e) => handleFilterChange("tu_ngay", e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">
                Đến ngày:
              </label>
              <input
                type="date"
                value={filters.den_ngay}
                onChange={(e) => handleFilterChange("den_ngay", e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filter phòng ban */}
            <div className="whitespace-nowrap">{renderPhongBanFilter()}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 px-4">
            {[
              {
                key: "tong-hop",
                label: "Tổng hợp luân chuyển kho",
                icon: BarChart3,
                color: "blue",
              },
              {
                key: "tren-cap",
                label: "Trên cấp",
                icon: Building2,
                color: "green",
              },
              {
                key: "tu-mua-sam",
                label: "Tự mua sắm",
                icon: Warehouse,
                color: "purple",
              },
              {
                key: "khac",
                label: "Luân chuyển",
                icon: RefreshCw,
                color: "orange",
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex items-center space-x-2 py-4 px-3 border-b-2 font-medium text-sm transition-all
                    ${
                      isActive
                        ? `border-${tab.color}-500 text-${tab.color}-600 bg-${tab.color}-50`
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>

                  {/* Badge hiển thị số lượng records */}
                  {reportData?.luanChuyen && (
                    <span
                      className={`
                      ml-2 px-2 py-1 text-xs rounded-full
                      ${
                        isActive
                          ? `bg-${tab.color}-100 text-${tab.color}-700`
                          : "bg-gray-100 text-gray-600"
                      }
                    `}
                    >
                      {tab.key === "tong-hop"
                        ? reportData.luanChuyen.tongHop?.length || 0
                        : tab.key === "tren-cap"
                        ? reportData.luanChuyen.trenCap?.length || 0
                        : tab.key === "tu-mua-sam"
                        ? reportData.luanChuyen.tuMua?.length || 0
                        : tab.key === "khac"
                        ? reportData.luanChuyen.khac?.length || 0
                        : 0}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ✅ CONTENT - SIMPLIFIED LOGIC */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Đang tải báo cáo...</p>
            </div>
          ) : (
            <>
              {/* ✅ DEBUG INFO cho user cấp 3 */}
              {user?.role === "user" && user?.phong_ban?.cap_bac === 3 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>🏢 Phòng ban:</strong>{" "}
                    {user.phong_ban?.ten_phong_ban} (Cấp{" "}
                    {user.phong_ban?.cap_bac})
                  </p>
                  {reportData?.debug_info && (
                    <p className="text-xs text-blue-600 mt-1">
                      Dữ liệu: {reportData.debug_info.total_records} records
                    </p>
                  )}
                </div>
              )}

              {/* TAB TỔNG HỢP */}
              {activeTab === "tong-hop" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        📊 Tổng hợp giá trị vật tư hàng hóa luân chuyển qua kho
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Từ {formatDate(filters.tu_ngay)} đến{" "}
                        {formatDate(filters.den_ngay)}
                      </p>
                    </div>
                  </div>

                  <TongHopTable
                    data={reportData?.luanChuyen?.tongHop}
                    tabType="tongHop"
                  />
                </div>
              )}

              {/* TAB TRÊN CẤP */}
              {activeTab === "tren-cap" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        🏢 Báo cáo nhập từ trên cấp
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Từ {formatDate(filters.tu_ngay)} đến{" "}
                        {formatDate(filters.den_ngay)}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        ℹ️ Chỉ hiển thị nhập/xuất/tồn từ nguồn TRÊN CẤP
                      </p>
                    </div>
                  </div>

                  <TongHopTable
                    data={reportData?.luanChuyen?.trenCap}
                    tabType="trenCap"
                  />
                </div>
              )}

              {/* TAB TỰ MUA SẮM */}
              {activeTab === "tu-mua-sam" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        🛒 Báo cáo tự mua sắm
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Từ {formatDate(filters.tu_ngay)} đến{" "}
                        {formatDate(filters.den_ngay)}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        ℹ️ Chỉ hiển thị nhập/xuất/tồn từ nguồn TỰ MUA SẮM
                      </p>
                    </div>
                  </div>

                  <TongHopTable
                    data={reportData?.luanChuyen?.tuMua}
                    tabType="tuMua"
                  />
                </div>
              )}

              {/* TAB LUÂN CHUYỂN */}
              {activeTab === "khac" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        🔄 Báo cáo luân chuyển
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Từ {formatDate(filters.tu_ngay)} đến{" "}
                        {formatDate(filters.den_ngay)}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        ℹ️ Chỉ hiển thị nhập/xuất/tồn từ nguồn LUÂN CHUYỂN
                      </p>
                    </div>
                  </div>

                  <TongHopTable
                    data={reportData?.luanChuyen?.khac}
                    tabType="khac"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LuanChuyenReport;
