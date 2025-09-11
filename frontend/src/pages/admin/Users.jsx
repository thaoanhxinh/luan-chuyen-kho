import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  UserCheck,
  MoreVertical,
} from "lucide-react";
import { userService } from "../../services/userService";
import { departmentService } from "../../services/departmentService";
import { formatDate } from "../../utils/helpers";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import Loading from "../../components/common/Loading";
import PageHeader from "../../components/common/PageHeader";
import toast from "react-hot-toast";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]); // Ensure it's always an array
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    role: "",
    phong_ban_id: "",
    is_active: "",
  });

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Form states
  const [userForm, setUserForm] = useState({
    ho_ten: "",
    email: "",
    username: "",
    password: "",
    role: "user",
    phong_ban_id: "",
    is_active: true,
  });

  // Department hierarchy selection for role-based assignment
  const [selectedCap2Id, setSelectedCap2Id] = useState("");

  // Load data
  useEffect(() => {
    loadUsers();
    loadDepartments();
  }, [currentPage, search, filters]);

  // Sync cap2 selection when editing or role changes
  useEffect(() => {
    if (!Array.isArray(departments) || departments.length === 0) return;

    if (userForm.role === "manager") {
      // manager must pick a cấp 2 department
      const current = departments.find(
        (d) => d.id === Number(userForm.phong_ban_id)
      );
      if (!current || current.cap_bac !== 2) {
        setSelectedCap2Id("");
      } else {
        setSelectedCap2Id(String(current.id));
      }
    } else if (userForm.role === "user") {
      // user must pick cap2 then cap3
      const current = departments.find(
        (d) => d.id === Number(userForm.phong_ban_id)
      );
      if (current && current.cap_bac === 3) {
        setSelectedCap2Id(String(current.phong_ban_cha_id || ""));
      } else {
        // reset when role changes
        setSelectedCap2Id("");
      }
    } else {
      setSelectedCap2Id("");
    }
  }, [userForm.role, userForm.phong_ban_id, departments]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
        search: search.trim(),
        ...filters,
      };

      const response = await userService.getList(params);

      if (response.success) {
        setUsers(response.data.items || []);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalItems(response.data.pagination?.total || 0);
      } else {
        toast.error("Lỗi khi tải danh sách người dùng");
      }
    } catch (error) {
      console.error("Load users error:", error);
      toast.error("Lỗi khi tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      // Ưu tiên gọi API theo quyền để tránh 403 cho cấp 2
      const resp = await departmentService.getAccessibleList();
      if (resp?.success) {
        setDepartments(resp.data || []);
        return;
      }
    } catch (e) {
      // Fallback: nếu API mới không tồn tại trên server cũ, thử endpoint cũ (admin-only)
      console.warn(
        "Accessible departments API failed, fallback to /departments",
        e
      );
      try {
        const response = await departmentService.getList({
          page: 1,
          limit: 999,
        });
        if (response.success) {
          setDepartments(response.data.items || []);
          return;
        }
      } catch (err) {
        console.error("Load departments error (fallback):", err);
      }
    }
    setDepartments([]);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const resetForm = () => {
    setUserForm({
      ho_ten: "",
      email: "",
      username: "",
      password: "",
      role: "user",
      phong_ban_id: "",
      is_active: true,
    });
    setSelectedUser(null);
    setIsEditing(false);
  };

  const handleCreateUser = () => {
    resetForm();
    setIsEditing(false);
    setShowEditModal(true);
  };

  const handleEditUser = (user) => {
    setUserForm({
      ho_ten: user.ho_ten,
      email: user.email,
      username: user.username,
      password: "",
      role: user.role,
      phong_ban_id: user.phong_ban_id || "",
      is_active: user.is_active,
    });
    setSelectedUser(user);
    setIsEditing(true);
    setShowEditModal(true);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (
        !userForm.ho_ten.trim() ||
        !userForm.email.trim() ||
        !userForm.username.trim()
      ) {
        toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
        return;
      }

      if (!isEditing && !userForm.password.trim()) {
        toast.error("Mật khẩu là bắt buộc khi tạo người dùng mới");
        return;
      }

      let response;
      if (isEditing) {
        const updateData = { ...userForm };
        if (!updateData.password.trim()) {
          delete updateData.password;
        }
        response = await userService.update(selectedUser.id, updateData);
      } else {
        response = await userService.create(userForm);
      }

      if (response.success) {
        toast.success(
          isEditing
            ? "Cập nhật người dùng thành công"
            : "Tạo người dùng thành công"
        );
        setShowEditModal(false);
        resetForm();
        loadUsers();
      } else {
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Submit user error:", error);
      toast.error("Có lỗi xảy ra khi lưu thông tin");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (
      !window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${user.ho_ten}"?`)
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await userService.delete(user.id);

      if (response.success) {
        toast.success("Xóa người dùng thành công");
        loadUsers();
      } else {
        toast.error(response.message || "Có lỗi xảy ra khi xóa");
      }
    } catch (error) {
      console.error("Delete user error:", error);
      toast.error("Có lỗi xảy ra khi xóa người dùng");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (u) => {
    try {
      setLoading(true);
      const resp = await userService.updateStatus(u.id, !u.is_active);
      if (resp.success) {
        toast.success("Cập nhật trạng thái thành công");
        await loadUsers();
      } else {
        toast.error(resp.message || "Không thể cập nhật trạng thái");
      }
    } catch (e) {
      console.error("Update status error:", e);
      toast.error("Lỗi khi cập nhật trạng thái");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (u) => {
    try {
      const resp = await userService.getDetail(u.id);
      if (resp.success) {
        setSelectedUser(resp.data);
        setShowDetailModal(true);
      } else {
        toast.error(resp.message || "Không thể lấy chi tiết tài khoản");
      }
    } catch (e) {
      console.error("Get detail error:", e);
      toast.error("Lỗi khi lấy chi tiết tài khoản");
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { label: "Admin", color: "bg-red-100 text-red-800" },
      manager: { label: "Quản lý", color: "bg-blue-100 text-blue-800" },
      supervisor: { label: "Giám sát", color: "bg-purple-100 text-purple-800" },
      user: { label: "Người dùng", color: "bg-gray-100 text-gray-800" },
    };

    const config = roleConfig[role] || roleConfig.user;
    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}
      >
        {config.label}
      </span>
    );
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

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý người dùng" />

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vai trò
            </label>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange("role", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Tất cả vai trò</option>
              <option value="admin">Admin</option>
              <option value="manager">Quản lý</option>
              {/* Only 3 roles as required */}
              <option value="user">Người dùng</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phòng ban
            </label>
            <select
              value={filters.phong_ban_id}
              onChange={(e) =>
                handleFilterChange("phong_ban_id", e.target.value)
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Tất cả phòng ban</option>
              {/* Ensure departments is always an array before mapping */}
              {Array.isArray(departments) &&
                departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.ten_phong_ban}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={filters.is_active}
              onChange={(e) => handleFilterChange("is_active", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Hoạt động</option>
              <option value="false">Vô hiệu hóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Tổng cộng: {totalItems} người dùng
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
          <button
            onClick={handleCreateUser}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tạo người dùng
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <Loading />
        ) : (
          <>
            <div className="overflow-hidden">
              <table className="w-full table-fixed divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người dùng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vai trò
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phòng ban
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
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.ho_ten}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                          <div className="text-xs text-gray-400">
                            @{user.username}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.ten_phong_ban || "Chưa phân công"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.is_active)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                        <button
                          onClick={() =>
                            setOpenActionMenuId(
                              openActionMenuId === user.id ? null : user.id
                            )
                          }
                          className="p-1 rounded hover:bg-gray-100 inline-flex"
                          title="Thao tác"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {openActionMenuId === user.id && (
                          <div className="absolute right-4 mt-2 w-44 bg-white border border-gray-200 rounded shadow-lg z-10">
                            <button
                              onClick={async () => {
                                await handleViewDetail(user);
                                setOpenActionMenuId(null);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                            >
                              Chi tiết
                            </button>
                            <button
                              onClick={async () => {
                                await handleToggleActive(user);
                                setOpenActionMenuId(null);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                            >
                              {user.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
                            </button>
                            <button
                              onClick={() => {
                                handleEditUser(user);
                                setOpenActionMenuId(null);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Chỉnh sửa</span>
                            </button>
                            {/* Delete removed per requirement: only allow disable/enable */}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && !loading && (
              <div className="text-center py-12">
                <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Không có người dùng
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Không tìm thấy người dùng nào với điều kiện đã chọn.
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

      {/* Detail Modal */}
      {showDetailModal && selectedUser && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="Chi tiết tài khoản"
        >
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Họ tên:</span> {selectedUser.ho_ten}
            </div>
            <div>
              <span className="font-medium">Username:</span>{" "}
              {selectedUser.username}
            </div>
            <div>
              <span className="font-medium">Email:</span>{" "}
              {selectedUser.email || "-"}
            </div>
            <div>
              <span className="font-medium">SĐT:</span>{" "}
              {selectedUser.phone || "-"}
            </div>
            <div>
              <span className="font-medium">Vai trò:</span> {selectedUser.role}
            </div>
            <div>
              <span className="font-medium">Phòng ban:</span>{" "}
              {selectedUser?.ten_phong_ban || "-"}
            </div>
            <div>
              <span className="font-medium">Trạng thái:</span>{" "}
              {selectedUser.trang_thai}
            </div>
            <div>
              <span className="font-medium">Tạo lúc:</span>{" "}
              {formatDate(selectedUser.created_at)}
            </div>
          </div>
        </Modal>
      )}

      {/* Edit/Create Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title={isEditing ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
      >
        <form onSubmit={handleSubmitUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={userForm.ho_ten}
              onChange={(e) =>
                setUserForm((prev) => ({ ...prev, ho_ten: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={userForm.email}
              onChange={(e) =>
                setUserForm((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={userForm.username}
              onChange={(e) =>
                setUserForm((prev) => ({ ...prev, username: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu {!isEditing && <span className="text-red-500">*</span>}
              {isEditing && (
                <span className="text-gray-500">(để trống nếu không đổi)</span>
              )}
            </label>
            <input
              type="password"
              value={userForm.password}
              onChange={(e) =>
                setUserForm((prev) => ({ ...prev, password: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vai trò
            </label>
            <select
              value={userForm.role}
              onChange={(e) =>
                setUserForm((prev) => ({ ...prev, role: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="user">Người dùng</option>
              <option value="manager">Quản lý</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phòng ban
            </label>
            {userForm.role === "admin" && (
              <div className="text-sm text-gray-600">
                Admin không cần gán phòng ban
              </div>
            )}
            {userForm.role === "manager" && (
              <select
                value={userForm.phong_ban_id}
                onChange={(e) =>
                  setUserForm((prev) => ({
                    ...prev,
                    phong_ban_id: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Chọn phòng ban cấp 2</option>
                {Array.isArray(departments) &&
                  departments
                    .filter((d) => d.cap_bac === 2)
                    .map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.ten_phong_ban}
                      </option>
                    ))}
              </select>
            )}
            {userForm.role === "user" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={selectedCap2Id}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedCap2Id(val);
                    // clear cap3 selection if parent changes
                    setUserForm((prev) => ({ ...prev, phong_ban_id: "" }));
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Chọn phòng ban cấp 2</option>
                  {Array.isArray(departments) &&
                    departments
                      .filter((d) => d.cap_bac === 2)
                      .map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.ten_phong_ban}
                        </option>
                      ))}
                </select>
                <select
                  value={userForm.phong_ban_id}
                  onChange={(e) =>
                    setUserForm((prev) => ({
                      ...prev,
                      phong_ban_id: e.target.value,
                    }))
                  }
                  disabled={!selectedCap2Id}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Chọn phòng ban cấp 3</option>
                  {Array.isArray(departments) &&
                    departments
                      .filter(
                        (d) =>
                          d.cap_bac === 3 &&
                          String(d.phong_ban_cha_id) === String(selectedCap2Id)
                      )
                      .map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.ten_phong_ban}
                        </option>
                      ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={userForm.is_active}
                onChange={(e) =>
                  setUserForm((prev) => ({
                    ...prev,
                    is_active: e.target.checked,
                  }))
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Tài khoản hoạt động
              </span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
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
    </div>
  );
};

export default Users;
