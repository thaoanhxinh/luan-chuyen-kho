// pages/admin/Departments.jsx
import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  RefreshCw,
  Building2,
  UserPlus,
} from "lucide-react";
import { departmentService } from "../../services/departmentService";
import { userService } from "../../services/userService";
import { formatDate } from "../../utils/helpers";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import Loading from "../../components/common/Loading";
import PageHeader from "../../components/common/PageHeader";
import toast from "react-hot-toast";

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");

  // Modal states
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showAssignUsersModal, setShowAssignUsersModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [departmentForm, setDepartmentForm] = useState({
    ten_phong_ban: "",
    ma_phong_ban: "",
    mo_ta: "",
    quan_ly_id: "",
    cap_bac: 3,
    phong_ban_cha_id: "",
    is_active: true,
  });

  const [assignForm, setAssignForm] = useState({
    user_ids: [],
  });

  // Load data
  useEffect(() => {
    loadDepartments();
    loadUsers();
  }, [currentPage, search]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
        search: search.trim(),
      };

      const response = await departmentService.getList(params);

      if (response.success) {
        setDepartments(response.data.items || []);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalItems(response.data.pagination?.total || 0);
      } else {
        toast.error("Lỗi khi tải danh sách phòng ban");
      }
    } catch (error) {
      console.error("Load departments error:", error);
      toast.error("Lỗi khi tải danh sách phòng ban");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userService.getList({ limit: 1000 });
      if (response.success) {
        setUsers(response.data.items || []);
      }
    } catch (error) {
      console.error("Load users error:", error);
    }
  };

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      setCurrentPage(1);
      loadDepartments();
    }
  };

  const resetForm = () => {
    setDepartmentForm({
      ten_phong_ban: "",
      ma_phong_ban: "",
      mo_ta: "",
      quan_ly_id: "",
      is_active: true,
    });
    setSelectedDepartment(null);
    setIsEditing(false);
  };

  const handleCreateDepartment = () => {
    resetForm();
    setShowDepartmentModal(true);
  };

  const handleEditDepartment = (department) => {
    setDepartmentForm({
      ten_phong_ban: department.ten_phong_ban,
      ma_phong_ban: department.ma_phong_ban,
      mo_ta: department.mo_ta || "",
      quan_ly_id: department.quan_ly_id || "",
      is_active: department.is_active,
    });
    setSelectedDepartment(department);
    setIsEditing(true);
    setShowDepartmentModal(true);
  };

  const handleSubmitDepartment = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (
        !departmentForm.ten_phong_ban.trim() ||
        !departmentForm.ma_phong_ban.trim()
      ) {
        toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
        return;
      }

      let response;
      if (isEditing) {
        response = await departmentService.update(
          selectedDepartment.id,
          departmentForm
        );
      } else {
        response = await departmentService.create(departmentForm);
      }

      if (response.success) {
        toast.success(
          isEditing
            ? "Cập nhật phòng ban thành công"
            : "Tạo phòng ban thành công"
        );
        setShowDepartmentModal(false);
        resetForm();
        loadDepartments();
      } else {
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Submit department error:", error);
      toast.error("Có lỗi xảy ra khi lưu thông tin");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (department) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa phòng ban "${department.ten_phong_ban}"?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await departmentService.delete(department.id);

      if (response.success) {
        toast.success("Xóa phòng ban thành công");
        loadDepartments();
      } else {
        toast.error(response.message || "Có lỗi xảy ra khi xóa");
      }
    } catch (error) {
      console.error("Delete department error:", error);
      toast.error("Có lỗi xảy ra khi xóa phòng ban");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUsers = (department) => {
    setSelectedDepartment(department);
    setAssignForm({
      user_ids: department.users?.map((u) => u.id) || [],
    });
    setShowAssignUsersModal(true);
  };

  const handleSubmitAssignUsers = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await departmentService.assignUsers(
        selectedDepartment.id,
        assignForm.user_ids
      );

      if (response.success) {
        toast.success("Phân công người dùng thành công");
        setShowAssignUsersModal(false);
        loadDepartments();
      } else {
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Assign users error:", error);
      toast.error("Có lỗi xảy ra khi phân công người dùng");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        Hoạt động
      </span>
    ) : (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
        Vô hiệu hóa
      </span>
    );
  };

  const getManagerName = (department) => {
    if (!department.quan_ly_id) return "Chưa có";
    const manager = users.find((u) => u.id === department.quan_ly_id);
    return manager ? manager.ho_ten : "Không tìm thấy";
  };

  return (
    <div className="p-6">
      {/* Header */}
      <PageHeader
        title="Quản lý phòng ban"
        subtitle="Quản lý cơ cấu tổ chức và phân công nhân sự"
        Icon={Building2}
      />

      <div className="flex justify-end space-x-3">
        <button
          onClick={loadDepartments}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Làm mới</span>
        </button>
        <button
          onClick={handleCreateDepartment}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm phòng ban</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã phòng ban..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={handleSearch}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Departments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <Loading />
        ) : (
          <>
            <div className="overflow-hidden">
              <table className="w-full table-fixed divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phòng ban
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quản lý
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số nhân sự
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {departments.map((department) => (
                    <tr key={department.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {department.ten_phong_ban}
                          </div>
                          <div className="text-sm text-gray-500">
                            {department.ma_phong_ban}
                          </div>
                          {department.mo_ta && (
                            <div className="text-xs text-gray-400 mt-1">
                              {department.mo_ta}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getManagerName(department)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Users className="w-4 h-4 mr-1" />
                          {department.user_count || 0} người
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(department.is_active)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(department.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleAssignUsers(department)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Phân công nhân sự"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditDepartment(department)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDepartment(department)}
                            className="text-red-600 hover:text-red-900"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {departments.length === 0 && !loading && (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Không có phòng ban
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Không tìm thấy phòng ban nào với điều kiện đã chọn.
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={totalItems}
                  itemsPerPage={20}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Department Modal */}
      <Modal
        isOpen={showDepartmentModal}
        onClose={() => {
          setShowDepartmentModal(false);
          resetForm();
        }}
        title={isEditing ? "Chỉnh sửa phòng ban" : "Thêm phòng ban mới"}
      >
        <form onSubmit={handleSubmitDepartment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên phòng ban <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={departmentForm.ten_phong_ban}
              onChange={(e) =>
                setDepartmentForm((prev) => ({
                  ...prev,
                  ten_phong_ban: e.target.value,
                }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mã phòng ban <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={departmentForm.ma_phong_ban}
              onChange={(e) =>
                setDepartmentForm((prev) => ({
                  ...prev,
                  ma_phong_ban: e.target.value,
                }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              value={departmentForm.mo_ta}
              onChange={(e) =>
                setDepartmentForm((prev) => ({
                  ...prev,
                  mo_ta: e.target.value,
                }))
              }
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quản lý phòng ban
            </label>
            <select
              value={departmentForm.quan_ly_id}
              onChange={(e) =>
                setDepartmentForm((prev) => ({
                  ...prev,
                  quan_ly_id: e.target.value,
                }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Chọn quản lý</option>
              {users
                .filter((u) => u.role === "manager" || u.role === "admin")
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.ho_ten} ({user.email})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={departmentForm.is_active}
                onChange={(e) =>
                  setDepartmentForm((prev) => ({
                    ...prev,
                    is_active: e.target.checked,
                  }))
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Phòng ban hoạt động
              </span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowDepartmentModal(false);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo mới"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Users Modal */}
      <Modal
        isOpen={showAssignUsersModal}
        onClose={() => setShowAssignUsersModal(false)}
        title={`Phân công nhân sự - ${selectedDepartment?.ten_phong_ban}`}
      >
        <form onSubmit={handleSubmitAssignUsers} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn nhân viên cho phòng ban
            </label>
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2">
              {users.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center p-2 hover:bg-gray-50 rounded"
                >
                  <input
                    type="checkbox"
                    checked={assignForm.user_ids.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAssignForm((prev) => ({
                          ...prev,
                          user_ids: [...prev.user_ids, user.id],
                        }));
                      } else {
                        setAssignForm((prev) => ({
                          ...prev,
                          user_ids: prev.user_ids.filter(
                            (id) => id !== user.id
                          ),
                        }));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {user.ho_ten}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.email} - {user.role}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAssignUsersModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : "Phân công"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Departments;
