import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Search,
  MoreVertical,
  Mail,
  Phone,
} from "lucide-react";
import { userService } from "../../services/userService";
import { departmentService } from "../../services/departmentService";
import { USER_ROLES } from "../../utils/constants";
import toast from "react-hot-toast";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadUsers();
    loadDepartments();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await userService.getUsers();
      setUsers(response.data?.items || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await departmentService.getDepartments();
      setDepartments(response.data?.items || []);
    } catch (error) {
      console.error("Error loading departments:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
      try {
        await userService.deleteUser(userId);
        toast.success("Xóa nhân viên thành công");
        loadUsers();
      } catch (error) {
        toast.error("Có lỗi xảy ra khi xóa nhân viên");
      }
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await userService.updateUserRole(userId, newRole);
      toast.success("Cập nhật quyền thành công");
      loadUsers();
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật quyền");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.ten_nhan_vien?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleLabel = (role) => {
    const labels = {
      [USER_ROLES.ADMIN]: "Quản trị viên",
      [USER_ROLES.MANAGER]: "Quản lý",
      [USER_ROLES.EMPLOYEE]: "Nhân viên",
    };
    return labels[role] || "Không xác định";
  };

  const getRoleColor = (role) => {
    const colors = {
      [USER_ROLES.ADMIN]: "bg-red-100 text-red-800",
      [USER_ROLES.MANAGER]: "bg-blue-100 text-blue-800",
      [USER_ROLES.EMPLOYEE]: "bg-green-100 text-green-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý nhân viên
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý thông tin và phân quyền nhân viên
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus size={16} />
          <span>Thêm nhân viên</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm
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
                placeholder="Tìm theo tên hoặc email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lọc theo quyền
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="all">Tất cả quyền</option>
              <option value={USER_ROLES.ADMIN}>Quản trị viên</option>
              <option value={USER_ROLES.MANAGER}>Quản lý</option>
              <option value={USER_ROLES.EMPLOYEE}>Nhân viên</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Tìm thấy {filteredUsers.length} nhân viên
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhân viên
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thông tin liên hệ
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phòng ban
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quyền hạn
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {user.ten_nhan_vien?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">
                          {user.ten_nhan_vien}
                        </p>
                        <p className="text-sm text-gray-500">
                          ID: {user.ma_nhan_vien}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail size={14} className="mr-2" />
                        {user.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone size={14} className="mr-2" />
                        {user.so_dien_thoai || "Chưa cập nhật"}
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    <span className="text-sm text-gray-900">
                      {user.phong_ban?.ten_phong_ban || "Chưa phân công"}
                    </span>
                  </td>

                  <td className="py-4 px-6">
                    <select
                      value={user.role || USER_ROLES.EMPLOYEE}
                      onChange={(e) =>
                        handleUpdateRole(user.id, e.target.value)
                      }
                      className={`text-xs px-2 py-1 rounded-full font-medium border-0 ${getRoleColor(
                        user.role
                      )}`}
                    >
                      <option value={USER_ROLES.ADMIN}>Quản trị viên</option>
                      <option value={USER_ROLES.MANAGER}>Quản lý</option>
                      <option value={USER_ROLES.EMPLOYEE}>Nhân viên</option>
                    </select>
                  </td>

                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        user.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.is_active ? "Hoạt động" : "Tạm khóa"}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          /* Handle edit */
                        }}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-300" />
              <p className="text-gray-500 mt-2">Không tìm thấy nhân viên nào</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
