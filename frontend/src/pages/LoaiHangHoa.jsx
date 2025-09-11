import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Archive,
  Filter,
  Package,
  Tag,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { hangHoaService } from "../services/hangHoaService";
import { formatDate } from "../utils/helpers";
import Modal from "../components/common/Modal";
import Pagination from "../components/common/Pagination";
import Loading from "../components/common/Loading";
import PageHeader from "../components/common/PageHeader";
import toast from "react-hot-toast";

// Form tạo/chỉnh sửa loại hàng hóa
const LoaiHangHoaForm = ({
  mode = "create",
  data = null,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    ma_loai: "",
    ten_loai: "",
    mo_ta: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && data) {
      setFormData({
        ma_loai: data.ma_loai || "",
        ten_loai: data.ten_loai || "",
        mo_ta: data.mo_ta || "",
      });
    }
  }, [mode, data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.ten_loai.trim()) {
      toast.error("Vui lòng nhập tên loại hàng hóa");
      return;
    }

    try {
      setIsSubmitting(true);

      if (mode === "create") {
        // Cho phép để trống ma_loai để backend tự sinh
        const payload = {
          ten_loai: formData.ten_loai,
          mo_ta: formData.mo_ta,
          ...(formData.ma_loai?.trim() ? { ma_loai: formData.ma_loai } : {}),
        };
        await hangHoaService.createLoaiHangHoa(payload);
        toast.success("Tạo loại hàng hóa thành công");
      } else {
        await hangHoaService.updateLoaiHangHoa(data.id, formData);
        toast.success("Cập nhật loại hàng hóa thành công");
      }

      onSuccess();
    } catch (error) {
      console.error(`${mode} error:`, error);
      toast.error(
        error.response?.data?.message ||
          `Không thể ${mode === "create" ? "tạo" : "cập nhật"} loại hàng hóa`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mode === "edit" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mã loại
            </label>
            <input
              type="text"
              name="ma_loai"
              value={formData.ma_loai}
              onChange={handleChange}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Hệ thống tự sinh khi tạo mới"
              maxLength={20}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên loại <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="ten_loai"
            value={formData.ten_loai}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Nhập tên loại hàng hóa"
            maxLength={100}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mô tả
        </label>
        <textarea
          name="mo_ta"
          value={formData.mo_ta}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
          placeholder="Nhập mô tả cho loại hàng hóa"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          {isSubmitting && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          <span>{mode === "create" ? "Tạo mới" : "Cập nhật"}</span>
        </button>
      </div>
    </form>
  );
};

// Chi tiết loại hàng hóa
const LoaiHangHoaDetail = ({ data }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mã loại
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
            {data.ma_loai}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên loại
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
            {data.ten_loai}
          </p>
        </div>
      </div>

      {data.mo_ta && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded min-h-[80px]">
            {data.mo_ta}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày tạo
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
            {formatDate(data.created_at)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cập nhật lần cuối
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
            {formatDate(data.updated_at)}
          </p>
        </div>
      </div>
    </div>
  );
};

// Component chính
const LoaiHangHoa = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Data states
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  const loaiHangHoaList = data?.message?.data || [];
  const pagination = {
    page: currentPage,
    pages: Math.ceil((data?.message?.total || 0) / 20),
    total: data?.message?.total || 0,
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await hangHoaService.getLoaiHangHoa({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        sort_by: sortConfig.key,
        sort_direction: sortConfig.direction,
      });
      setData(response);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Không thể tải dữ liệu loại hàng hóa");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleViewDetail = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const toggleExpand = async (item) => {
    const isOpen = expanded[item.id]?.open;
    if (isOpen) {
      setExpanded((prev) => ({
        ...prev,
        [item.id]: { ...prev[item.id], open: false },
      }));
      return;
    }
    // Fetch detail to get danh_sach_hang_hoa filtered by backend permissions
    try {
      const detail = await hangHoaService.getLoaiHangHoaById(item.id);
      setExpanded((prev) => ({
        ...prev,
        [item.id]: {
          open: true,
          children: detail?.data?.danh_sach_hang_hoa || [],
        },
      }));
    } catch (e) {
      console.error("Load children error:", e);
      toast.error("Không tải được danh sách hàng hóa của loại này");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa loại hàng hóa này?")) {
      try {
        await hangHoaService.deleteLoaiHangHoa(id);
        toast.success("Xóa loại hàng hóa thành công");
        fetchData();
      } catch (error) {
        console.error("Error deleting:", error);
        toast.error("Không thể xóa loại hàng hóa");
      }
    }
  };

  const handleFormSuccess = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedItem(null);
    fetchData();
  };

  const handleFormCancel = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedItem(null);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Quản lý loại hàng hóa"
        subtitle="Quản lý các loại hàng hóa trong hệ thống"
        Icon={Archive}
      />

      {/* Search and Add button in same row */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                placeholder="Tìm theo mã loại hoặc tên loại..."
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSearchTerm("")}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-1"
            >
              <Filter size={14} />
              <span>Xóa bộ lọc</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <Plus size={16} />
              <span>Thêm loại hàng hóa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loading size="large" />
          </div>
        ) : (
          <>
            <div className="overflow-hidden">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("ma_loai")}
                    >
                      Mã loại {getSortIcon("ma_loai")}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("ten_loai")}
                    >
                      Tên loại {getSortIcon("ten_loai")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Mô tả
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("created_at")}
                    >
                      Ngày tạo {getSortIcon("created_at")}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-32">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loaiHangHoaList.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <button
                              onClick={() => toggleExpand(item)}
                              className="mr-2 p-1 hover:bg-gray-200 rounded"
                              title={
                                expanded[item.id]?.open ? "Thu gọn" : "Mở rộng"
                              }
                            >
                              {expanded[item.id]?.open ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronRight size={16} />
                              )}
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center">
                                <Tag className="h-4 w-4 text-purple-600 mr-2" />
                                <span className="text-sm font-medium text-gray-900 truncate">
                                  {item.ma_loai}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 truncate">
                            {item.ten_loai}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 truncate">
                            {item.mo_ta || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {formatDate(item.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleViewDetail(item)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all"
                              title="Xem chi tiết"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-all"
                              title="Chỉnh sửa"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all"
                              title="Xóa"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expanded[item.id]?.open && (
                        <tr className="bg-gray-50">
                          <td colSpan={5} className="px-6 py-3">
                            {(expanded[item.id]?.children || []).length ===
                            0 ? (
                              <div className="text-sm text-gray-500">
                                Không có hàng hóa thuộc loại này trong đơn vị
                                của bạn
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {(expanded[item.id].children || []).map(
                                  (hh) => (
                                    <div
                                      key={hh.id}
                                      className="flex items-center justify-between p-2 bg-white border rounded"
                                    >
                                      <div className="text-sm text-gray-800">
                                        <span className="font-medium mr-2">
                                          {hh.ma_hang_hoa}
                                        </span>
                                        {hh.ten_hang_hoa}
                                        <span className="text-gray-500 ml-2">
                                          ({hh.don_vi_tinh})
                                        </span>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {loaiHangHoaList.length === 0 && (
              <div className="text-center py-8">
                <Archive className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  Không có dữ liệu
                </h3>
                <p className="text-xs text-gray-500">
                  Chưa có loại hàng hóa nào được tạo.
                </p>
              </div>
            )}

            {pagination.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200">
                <Pagination
                  currentPage={pagination.page || 1}
                  totalPages={pagination.pages || 1}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleFormCancel}
        title="Thêm loại hàng hóa mới"
        size="large"
      >
        <LoaiHangHoaForm
          mode="create"
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={handleFormCancel}
        title="Chỉnh sửa loại hàng hóa"
        size="large"
      >
        <LoaiHangHoaForm
          mode="edit"
          data={selectedItem}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Chi tiết loại hàng hóa: ${selectedItem?.ten_loai || ""}`}
        size="large"
      >
        {selectedItem && <LoaiHangHoaDetail data={selectedItem} />}
      </Modal>
    </div>
  );
};

export default LoaiHangHoa;
