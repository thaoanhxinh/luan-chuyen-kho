import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Truck,
  Filter,
  Phone,
  Mail,
  MapPin,
  Building,
} from "lucide-react";
import { nhaCungCapService } from "../services/nhaCungCapService";
import { formatDate } from "../utils/helpers";
import Modal from "../components/common/Modal";
import Pagination from "../components/common/Pagination";
import Loading from "../components/common/Loading";
import toast from "react-hot-toast";

// Form tạo/chỉnh sửa nhà cung cấp
const NhaCungCapForm = ({
  mode = "create",
  data = null,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    ma_ncc: "",
    ten_ncc: "",
    dia_chi: "",
    dien_thoai: "",
    email: "",
    nguoi_lien_he: "",
    ghi_chu: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && data) {
      setFormData({
        ma_ncc: data.ma_ncc || "",
        ten_ncc: data.ten_ncc || "",
        dia_chi: data.dia_chi || "",
        dien_thoai: data.dien_thoai || "",
        email: data.email || "",
        nguoi_lien_he: data.nguoi_lien_he || "",
        ghi_chu: data.ghi_chu || "",
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

    if (!formData.ma_ncc.trim() || !formData.ten_ncc.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    try {
      setIsSubmitting(true);

      if (mode === "create") {
        await nhaCungCapService.create(formData);
        toast.success("Tạo nhà cung cấp thành công");
      } else {
        await nhaCungCapService.update(data.id, formData);
        toast.success("Cập nhật nhà cung cấp thành công");
      }

      onSuccess();
    } catch (error) {
      console.error(`${mode} error:`, error);
      toast.error(
        error.response?.data?.message ||
          `Không thể ${mode === "create" ? "tạo" : "cập nhật"} nhà cung cấp`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mã nhà cung cấp <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="ma_ncc"
            value={formData.ma_ncc}
            onChange={handleChange}
            disabled={mode === "edit"}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Nhập mã nhà cung cấp"
            maxLength={20}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên nhà cung cấp <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="ten_ncc"
            value={formData.ten_ncc}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Nhập tên nhà cung cấp"
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Điện thoại
          </label>
          <input
            type="tel"
            name="dien_thoai"
            value={formData.dien_thoai}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Nhập số điện thoại"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Nhập email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Người liên hệ
          </label>
          <input
            type="text"
            name="nguoi_lien_he"
            value={formData.nguoi_lien_he}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Nhập tên người liên hệ"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Địa chỉ
        </label>
        <textarea
          name="dia_chi"
          value={formData.dia_chi}
          onChange={handleChange}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
          placeholder="Nhập địa chỉ nhà cung cấp"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ghi chú
        </label>
        <textarea
          name="ghi_chu"
          value={formData.ghi_chu}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
          placeholder="Nhập ghi chú"
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

// Chi tiết nhà cung cấp
const NhaCungCapDetail = ({ data }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mã nhà cung cấp
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
            {data.ma_ncc}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên nhà cung cấp
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
            {data.ten_ncc}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Điện thoại
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
            {data.dien_thoai || "-"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
            {data.email || "-"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Người liên hệ
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
            {data.nguoi_lien_he || "-"}
          </p>
        </div>
      </div>

      {data.dia_chi && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Địa chỉ
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded min-h-[60px]">
            {data.dia_chi}
          </p>
        </div>
      )}

      {data.ghi_chu && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ghi chú
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded min-h-[80px]">
            {data.ghi_chu}
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
const NhaCungCap = () => {
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

  const nhaCungCapList = data?.data?.items || [];
  const pagination = data?.data?.pagination || {};

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await nhaCungCapService.getList({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        sort_by: sortConfig.key,
        sort_direction: sortConfig.direction,
      });
      setData(response);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Không thể tải dữ liệu nhà cung cấp");
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

  const handleViewDetail = async (item) => {
    try {
      const response = await nhaCungCapService.getDetail(item.id);
      setSelectedItem(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error fetching detail:", error);
      toast.error("Không thể tải chi tiết nhà cung cấp");
    }
  };

  const handleEdit = async (item) => {
    try {
      const response = await nhaCungCapService.getDetail(item.id);
      setSelectedItem(response.data);
      setShowEditModal(true);
    } catch (error) {
      console.error("Error fetching detail for edit:", error);
      toast.error("Không thể tải thông tin để chỉnh sửa");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa nhà cung cấp này?")) {
      try {
        await nhaCungCapService.delete(id);
        toast.success("Xóa nhà cung cấp thành công");
        fetchData();
      } catch (error) {
        console.error("Error deleting:", error);
        toast.error("Không thể xóa nhà cung cấp");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <Truck className="mr-2 h-5 w-5 text-blue-600" />
            Quản lý nhà cung cấp
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Quản lý thông tin các nhà cung cấp hàng hóa
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus size={16} />
          <span>Thêm nhà cung cấp</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
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
                placeholder="Tìm theo mã NCC, tên hoặc số điện thoại..."
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setSearchTerm("")}
              className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-1"
            >
              <Filter size={14} />
              <span>Xóa bộ lọc</span>
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("ma_ncc")}
                    >
                      Mã NCC {getSortIcon("ma_ncc")}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("ten_ncc")}
                    >
                      Tên nhà cung cấp {getSortIcon("ten_ncc")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Liên hệ
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Địa chỉ
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
                  {nhaCungCapList.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 text-blue-600 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {item.ma_ncc}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 font-medium">
                          {item.ten_ncc}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {item.dien_thoai && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-3 w-3 mr-1" />
                              {item.dien_thoai}
                            </div>
                          )}
                          {item.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-3 w-3 mr-1" />
                              {item.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {item.dia_chi && (
                            <div className="flex items-start">
                              <MapPin className="h-3 w-3 mr-1 mt-1 flex-shrink-0" />
                              <span>{item.dia_chi}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(item.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
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
                  ))}
                </tbody>
              </table>
            </div>

            {nhaCungCapList.length === 0 && (
              <div className="text-center py-8">
                <Truck className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  Không có dữ liệu
                </h3>
                <p className="text-xs text-gray-500">
                  Chưa có nhà cung cấp nào được tạo.
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
        title="Thêm nhà cung cấp mới"
        size="large"
      >
        <NhaCungCapForm
          mode="create"
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={handleFormCancel}
        title="Chỉnh sửa nhà cung cấp"
        size="large"
      >
        <NhaCungCapForm
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
        title={`Chi tiết nhà cung cấp: ${selectedItem?.ten_ncc || ""}`}
        size="large"
      >
        {selectedItem && <NhaCungCapDetail data={selectedItem} />}
      </Modal>
    </div>
  );
};

export default NhaCungCap;
