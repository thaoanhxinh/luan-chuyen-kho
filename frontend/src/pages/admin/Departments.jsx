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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [departmentMembers, setDepartmentMembers] = useState([]);
  const [parentDepartments, setParentDepartments] = useState([]);
  const [expandedDeptIds, setExpandedDeptIds] = useState([]);
  const [childrenByParent, setChildrenByParent] = useState({});

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

  // no assign form; we show detail members instead

  // Load data
  useEffect(() => {
    loadDepartments();
    loadUsers();
    loadParentDepartments();
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
        const all = response.data.items || [];
        // Only show cấp 2 at the top-level list
        const items = all.filter((d) => d.cap_bac === 2);
        setDepartments(items);
        // Index cấp 3 by parent id
        const children = all.filter((d) => d.cap_bac === 3);
        const map = {};
        children.forEach((c) => {
          if (!map[c.phong_ban_cha_id]) map[c.phong_ban_cha_id] = [];
          map[c.phong_ban_cha_id].push(c);
        });
        setChildrenByParent(map);
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

  const toggleExpand = (deptId) => {
    setExpandedDeptIds((prev) =>
      prev.includes(deptId)
        ? prev.filter((id) => id !== deptId)
        : [...prev, deptId]
    );
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

  const loadParentDepartments = async () => {
    try {
      const res = await departmentService.getList({ page: 1, limit: 1000 });
      if (res.success) {
        setParentDepartments(
          (res.data.items || []).filter((d) => d.cap_bac === 2)
        );
      }
    } catch (e) {
      console.error("Load parent departments error:", e);
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
      cap_bac: 2,
      phong_ban_cha_id: "",
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
      cap_bac: department.cap_bac || 2,
      phong_ban_cha_id: department.phong_ban_cha_id || "",
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

  const handleViewDetail = async (department) => {
    try {
      setSelectedDepartment(department);
      setShowDetailModal(true);
      // Fetch members of this department and its children (handled by backend filter)
      const res = await userService.getList({
        phong_ban_id: department.id,
        limit: 1000,
      });
      if (res.success) {
        setDepartmentMembers(res.data.items || []);
      } else {
        setDepartmentMembers([]);
      }
    } catch (e) {
      console.error("Load department members error:", e);
      setDepartmentMembers([]);
    }
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
    <div className="space-y-6">
      <PageHeader title="Quản lý phòng ban" />

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc mã phòng ban..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={loadDepartments}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Tổng cộng: {totalItems} phòng ban
        </div>
        <button
          onClick={handleCreateDepartment}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Tạo phòng ban
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <Loading />
        ) : (
          <>
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full table-fixed divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-auto">
                      Phòng ban
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Số nhân sự
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {departments.map((department) => (
                    <React.Fragment key={department.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-start">
                            <button
                              onClick={() => toggleExpand(department.id)}
                              className="mr-2 text-gray-500 hover:text-gray-700"
                              title={
                                expandedDeptIds.includes(department.id)
                                  ? "Thu gọn"
                                  : "Mở rộng"
                              }
                            >
                              {expandedDeptIds.includes(department.id)
                                ? "▾"
                                : "▸"}
                            </button>
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
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap w-32">
                          <div className="flex items-center text-sm text-gray-900">
                            <Users className="w-4 h-4 mr-1" />
                            {department.so_nhan_vien || 0} người
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap w-32">
                          {getStatusBadge(department.is_active)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-36">
                          {formatDate(department.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-40">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleViewDetail(department)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Xem chi tiết nhân sự"
                            >
                              <Users className="w-4 h-4" />
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
                      {expandedDeptIds.includes(department.id) &&
                        (childrenByParent[department.id] || []).map((child) => (
                          <tr key={`child-${child.id}`} className="bg-gray-50">
                            <td className="px-12 py-3 whitespace-nowrap align-top">
                              <div className="text-sm text-gray-700">
                                {child.ten_phong_ban}
                              </div>
                              <div className="text-xs text-gray-400">
                                {child.ma_phong_ban}
                              </div>
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap w-32">
                              <div className="flex items-center text-sm text-gray-700">
                                <Users className="w-4 h-4 mr-1" />
                                {child.so_nhan_vien || 0} người
                              </div>
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap w-32">
                              {getStatusBadge(child.is_active)}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 w-36">
                              {formatDate(child.created_at)}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium w-40">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => handleViewDetail(child)}
                                  className="text-purple-600 hover:text-purple-900"
                                  title="Xem chi tiết nhân sự"
                                >
                                  <Users className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
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
              Cấp bậc <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="cap_bac"
                  value={2}
                  checked={Number(departmentForm.cap_bac) === 2}
                  onChange={() =>
                    setDepartmentForm((prev) => ({
                      ...prev,
                      cap_bac: 2,
                      phong_ban_cha_id: "",
                    }))
                  }
                />
                <span>Cấp 2</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="cap_bac"
                  value={3}
                  checked={Number(departmentForm.cap_bac) === 3}
                  onChange={() =>
                    setDepartmentForm((prev) => ({ ...prev, cap_bac: 3 }))
                  }
                />
                <span>Cấp 3</span>
              </label>
            </div>
          </div>

          {Number(departmentForm.cap_bac) === 3 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thuộc phòng ban cấp 2 <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={departmentForm.phong_ban_cha_id}
                onChange={(e) =>
                  setDepartmentForm((prev) => ({
                    ...prev,
                    phong_ban_cha_id: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Chọn phòng ban cấp 2</option>
                {parentDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.ten_phong_ban} ({d.ma_phong_ban})
                  </option>
                ))}
              </select>
            </div>
          )}

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

          {/* Bỏ chọn quản lý; backend không dùng trường này */}

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

      {/* Detail Members Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Nhân sự - ${selectedDepartment?.ten_phong_ban || ""}`}
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {departmentMembers.length === 0 ? (
            <div className="text-sm text-gray-500">Không có tài khoản</div>
          ) : (
            departmentMembers.map((user) => (
              <div key={user.id} className="p-2 border rounded">
                <div className="text-sm font-medium text-gray-900">
                  {user.ho_ten}
                </div>
                <div className="text-xs text-gray-500">
                  {user.email} • {user.role}
                </div>
                {user.phong_ban?.ten_phong_ban && (
                  <div className="text-xs text-gray-400">
                    {user.phong_ban.ten_phong_ban}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Departments;
