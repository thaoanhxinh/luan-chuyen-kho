import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Users,
  Search,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { departmentService } from "../../services/departmentService";
import { userService } from "../../services/userService";
import toast from "react-hot-toast";

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);

  useEffect(() => {
    loadDepartments();
    loadUsers();
  }, []);

  const loadDepartments = async () => {
    try {
      const response = await departmentService.getDepartments();
      setDepartments(response.data?.items || []);
    } catch (error) {
      console.error("Error loading departments:", error);
      toast.error("Không thể tải danh sách phòng ban");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userService.getUsers();
      setUsers(response.data?.items || []);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const handleDeleteDepartment = async (departmentId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phòng ban này?")) {
      try {
        await departmentService.deleteDepartment(departmentId);
        toast.success("Xóa phòng ban thành công");
        loadDepartments();
      } catch (error) {
        toast.error("Có lỗi xảy ra khi xóa phòng ban");
      }
    }
  };

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.ten_phong_ban?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.ma_phong_ban?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUsersInDepartment = (departmentId) => {
    return users.filter((user) => user.phong_ban_id === departmentId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý phòng ban
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý thông tin phòng ban và phân công nhân viên
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus size={16} />
          <span>Thêm phòng ban</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm phòng ban
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên hoặc mã phòng ban..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Tìm thấy {filteredDepartments.length} phòng ban
            </div>
          </div>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((department) => {
          const departmentUsers = getUsersInDepartment(department.id);
          const manager = departmentUsers.find(
            (user) => user.role === "manager"
          );

          return (
            <div
              key={department.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Department Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 size={24} className="text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">
                      {department.ten_phong_ban}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Mã: {department.ma_phong_ban}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingDepartment(department)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteDepartment(department.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Department Info */}
              <div className="space-y-3 mb-4">
                {department.dia_chi && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin size={14} className="mr-2 flex-shrink-0" />
                    <span className="truncate">{department.dia_chi}</span>
                  </div>
                )}

                {department.so_dien_thoai && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone size={14} className="mr-2 flex-shrink-0" />
                    <span>{department.so_dien_thoai}</span>
                  </div>
                )}

                {department.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail size={14} className="mr-2 flex-shrink-0" />
                    <span className="truncate">{department.email}</span>
                  </div>
                )}
              </div>

              {/* Manager */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Trưởng phòng
                </div>
                {manager ? (
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-medium text-xs">
                        {manager.ten_nhan_vien?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-2">
                      <p className="text-sm font-medium text-gray-900">
                        {manager.ten_nhan_vien}
                      </p>
                      <p className="text-xs text-gray-500">{manager.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Chưa có trưởng phòng
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users size={14} className="mr-1" />
                    <span>{departmentUsers.length} nhân viên</span>
                  </div>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      department.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {department.is_active ? "Hoạt động" : "Tạm ngưng"}
                  </span>
                </div>
              </div>

              {/* Department Description */}
              {department.mo_ta && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {department.mo_ta}
                  </p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      /* Handle assign users */
                    }}
                    className="flex-1 text-center py-2 px-3 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    Phân công NV
                  </button>
                  <button
                    onClick={() => {
                      /* Handle view details */
                    }}
                    className="flex-1 text-center py-2 px-3 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredDepartments.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-300" />
          <p className="text-gray-500 mt-2">
            {searchTerm
              ? "Không tìm thấy phòng ban nào"
              : "Chưa có phòng ban nào"}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Tạo phòng ban đầu tiên
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingDepartment) && (
        <DepartmentModal
          department={editingDepartment}
          onClose={() => {
            setShowCreateModal(false);
            setEditingDepartment(null);
          }}
          onSuccess={() => {
            loadDepartments();
            setShowCreateModal(false);
            setEditingDepartment(null);
          }}
          users={users}
        />
      )}
    </div>
  );
};

// Department Modal Component
const DepartmentModal = ({ department, onClose, onSuccess, users }) => {
  const [formData, setFormData] = useState({
    ten_phong_ban: "",
    ma_phong_ban: "",
    mo_ta: "",
    dia_chi: "",
    so_dien_thoai: "",
    email: "",
    truong_phong_id: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (department) {
      setFormData(department);
    }
  }, [department]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (department) {
        await departmentService.updateDepartment(department.id, formData);
        toast.success("Cập nhật phòng ban thành công");
      } else {
        await departmentService.createDepartment(formData);
        toast.success("Tạo phòng ban thành công");
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {department ? "Chỉnh sửa phòng ban" : "Tạo phòng ban mới"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên phòng ban <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="ten_phong_ban"
                  value={formData.ten_phong_ban}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Nhập tên phòng ban"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã phòng ban <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="ma_phong_ban"
                  value={formData.ma_phong_ban}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Nhập mã phòng ban"
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
                placeholder="Nhập mô tả về phòng ban"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ
              </label>
              <input
                type="text"
                name="dia_chi"
                value={formData.dia_chi}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Nhập địa chỉ phòng ban"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  name="so_dien_thoai"
                  value={formData.so_dien_thoai}
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
                  placeholder="Nhập email phòng ban"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trưởng phòng
              </label>
              <select
                name="truong_phong_id"
                value={formData.truong_phong_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Chọn trưởng phòng</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.ten_nhan_vien} - {user.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Phòng ban đang hoạt động
              </label>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={loading}
              >
                {loading
                  ? "Đang xử lý..."
                  : department
                  ? "Cập nhật"
                  : "Tạo phòng ban"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DepartmentManagement;
