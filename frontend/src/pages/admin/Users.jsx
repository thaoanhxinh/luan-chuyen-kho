// // pages/admin/Users.jsx
// import React, { useState, useEffect } from "react";
// import {
//   Plus,
//   Search,
//   Edit,
//   Trash2,
//   Shield,
//   RefreshCw,
//   Eye,
//   EyeOff,
//   UserCheck,
//   UserX,
//   Mail,
//   Key,
// } from "lucide-react";
// import { userService } from "../../services/userService";
// import { formatDate } from "../../utils/helpers";
// import Modal from "../../components/common/Modal";
// import Pagination from "../../components/common/Pagination";
// import Loading from "../../components/common/Loading";
// import toast from "react-hot-toast";

// const Users = () => {
//   const [users, setUsers] = useState([]);
//   const [departments, setDepartments] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalItems, setTotalItems] = useState(0);
//   const [search, setSearch] = useState("");
//   const [filters, setFilters] = useState({
//     role: "",
//     phong_ban_id: "",
//     is_active: "",
//   });

//   // Modal states
//   const [showUserModal, setShowUserModal] = useState(false);
//   // const [showRoleModal, setShowRoleModal] = useState(false);
//   //const [showPasswordModal, setShowPasswordModal] = useState(false);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);

//   // Form states
//   const [userForm, setUserForm] = useState({
//     ho_ten: "",
//     email: "",
//     username: "",
//     password: "",
//     role: "user",
//     phong_ban_id: "",
//     is_active: true,
//   });

//   // Load data
//   useEffect(() => {
//     loadUsers();
//     loadDepartments();
//   }, [currentPage, search, filters]);

//   const loadUsers = async () => {
//     try {
//       setLoading(true);
//       const params = {
//         page: currentPage,
//         limit: 20,
//         search: search.trim(),
//         ...filters,
//       };

//       const response = await userService.getList(params);

//       if (response.success) {
//         setUsers(response.data.items || []);
//         setTotalPages(response.data.pagination?.pages || 1);
//         setTotalItems(response.data.pagination?.total || 0);
//       } else {
//         toast.error("Lỗi khi tải danh sách người dùng");
//       }
//     } catch (error) {
//       console.error("Load users error:", error);
//       toast.error("Lỗi khi tải danh sách người dùng");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadDepartments = async () => {
//     try {
//       const response = await userService.getDepartmentsList();
//       if (response.success) {
//         setDepartments(response.data || []);
//       }
//     } catch (error) {
//       console.error("Load departments error:", error);
//     }
//   };

//   const handleSearch = (e) => {
//     if (e.key === "Enter") {
//       setCurrentPage(1);
//       loadUsers();
//     }
//   };

//   const handleFilterChange = (key, value) => {
//     setFilters((prev) => ({
//       ...prev,
//       [key]: value,
//     }));
//     setCurrentPage(1);
//   };

//   const resetForm = () => {
//     setUserForm({
//       ho_ten: "",
//       email: "",
//       username: "",
//       password: "",
//       role: "user",
//       phong_ban_id: "",
//       is_active: true,
//     });
//     setSelectedUser(null);
//     setIsEditing(false);
//   };

//   const handleCreateUser = () => {
//     resetForm();
//     setShowUserModal(true);
//   };

//   const handleEditUser = (user) => {
//     setUserForm({
//       ho_ten: user.ho_ten,
//       email: user.email,
//       username: user.username,
//       password: "",
//       role: user.role,
//       phong_ban_id: user.phong_ban_id || "",
//       is_active: user.is_active,
//     });
//     setSelectedUser(user);
//     setIsEditing(true);
//     setShowUserModal(true);
//   };

//   const handleSubmitUser = async (e) => {
//     e.preventDefault();

//     try {
//       setLoading(true);

//       if (
//         !userForm.ho_ten.trim() ||
//         !userForm.email.trim() ||
//         !userForm.username.trim()
//       ) {
//         toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
//         return;
//       }

//       if (!isEditing && !userForm.password.trim()) {
//         toast.error("Mật khẩu là bắt buộc khi tạo người dùng mới");
//         return;
//       }

//       let response;
//       if (isEditing) {
//         const updateData = { ...userForm };
//         if (!updateData.password.trim()) {
//           delete updateData.password;
//         }
//         response = await userService.update(selectedUser.id, updateData);
//       } else {
//         response = await userService.create(userForm);
//       }

//       if (response.success) {
//         toast.success(
//           isEditing
//             ? "Cập nhật người dùng thành công"
//             : "Tạo người dùng thành công"
//         );
//         setShowUserModal(false);
//         resetForm();
//         loadUsers();
//       } else {
//         toast.error(response.message || "Có lỗi xảy ra");
//       }
//     } catch (error) {
//       console.error("Submit user error:", error);
//       toast.error("Có lỗi xảy ra khi lưu thông tin");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDeleteUser = async (user) => {
//     if (
//       !window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${user.ho_ten}"?`)
//     ) {
//       return;
//     }

//     try {
//       setLoading(true);
//       const response = await userService.delete(user.id);

//       if (response.success) {
//         toast.success("Xóa người dùng thành công");
//         loadUsers();
//       } else {
//         toast.error(response.message || "Có lỗi xảy ra khi xóa");
//       }
//     } catch (error) {
//       console.error("Delete user error:", error);
//       toast.error("Có lỗi xảy ra khi xóa người dùng");
//     } finally {
//       setLoading(false);
//     }
//   };

//   //   const handleChangeRole = async (user, newRole) => {
//   //     try {
//   //       setLoading(true);
//   //       const response = await userService.updateRole(user.id, newRole);

//   //       if (response.success) {
//   //         toast.success("Cập nhật vai trò thành công");
//   //         loadUsers();
//   //       } else {
//   //         toast.error(response.message || "Có lỗi xảy ra khi cập nhật vai trò");
//   //       }
//   //     } catch (error) {
//   //       console.error("Change role error:", error);
//   //       toast.error("Có lỗi xảy ra khi cập nhật vai trò");
//   //     } finally {
//   //       setLoading(false);
//   //     }
//   //   };

//   const handleResetPassword = async (user) => {
//     if (
//       !window.confirm(
//         `Bạn có chắc chắn muốn reset mật khẩu cho "${user.ho_ten}"?`
//       )
//     ) {
//       return;
//     }

//     try {
//       setLoading(true);
//       const response = await userService.resetPassword(user.id);

//       if (response.success) {
//         toast.success("Reset mật khẩu thành công");
//       } else {
//         toast.error(response.message || "Có lỗi xảy ra khi reset mật khẩu");
//       }
//     } catch (error) {
//       console.error("Reset password error:", error);
//       toast.error("Có lỗi xảy ra khi reset mật khẩu");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getRoleBadge = (role) => {
//     const roleConfig = {
//       admin: { label: "Admin", color: "bg-red-100 text-red-800" },
//       manager: { label: "Quản lý", color: "bg-blue-100 text-blue-800" },
//       supervisor: { label: "Giám sát", color: "bg-purple-100 text-purple-800" },
//       user: { label: "Người dùng", color: "bg-gray-100 text-gray-800" },
//     };

//     const config = roleConfig[role] || roleConfig.user;
//     return (
//       <span
//         className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}
//       >
//         {config.label}
//       </span>
//     );
//   };

//   const getStatusBadge = (isActive) => {
//     return isActive ? (
//       <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
//         Hoạt động
//       </span>
//     ) : (
//       <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
//         Vô hiệu hóa
//       </span>
//     );
//   };

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">
//             Quản lý người dùng
//           </h1>
//           <p className="text-gray-600 mt-1">
//             Quản lý tài khoản và phân quyền người dùng
//           </p>
//         </div>
//         <div className="flex space-x-3">
//           <button
//             onClick={loadUsers}
//             disabled={loading}
//             className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center space-x-2"
//           >
//             <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
//             <span>Làm mới</span>
//           </button>
//           <button
//             onClick={handleCreateUser}
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
//           >
//             <Plus className="w-4 h-4" />
//             <span>Thêm người dùng</span>
//           </button>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="bg-white p-4 rounded-lg shadow mb-6">
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Vai trò
//             </label>
//             <select
//               value={filters.role}
//               onChange={(e) => handleFilterChange("role", e.target.value)}
//               className="w-full border border-gray-300 rounded-md px-3 py-2"
//             >
//               <option value="">Tất cả vai trò</option>
//               <option value="admin">Admin</option>
//               <option value="manager">Quản lý</option>
//               <option value="supervisor">Giám sát</option>
//               <option value="user">Người dùng</option>
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Phòng ban
//             </label>
//             <select
//               value={filters.phong_ban_id}
//               onChange={(e) =>
//                 handleFilterChange("phong_ban_id", e.target.value)
//               }
//               className="w-full border border-gray-300 rounded-md px-3 py-2"
//             >
//               <option value="">Tất cả phòng ban</option>
//               {departments.map((dept) => (
//                 <option key={dept.id} value={dept.id}>
//                   {dept.ten_phong_ban}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Trạng thái
//             </label>
//             <select
//               value={filters.is_active}
//               onChange={(e) => handleFilterChange("is_active", e.target.value)}
//               className="w-full border border-gray-300 rounded-md px-3 py-2"
//             >
//               <option value="">Tất cả trạng thái</option>
//               <option value="true">Hoạt động</option>
//               <option value="false">Vô hiệu hóa</option>
//             </select>
//           </div>
//         </div>

//         <div className="relative">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//           <input
//             type="text"
//             placeholder="Tìm kiếm theo tên, email hoặc username..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             onKeyPress={handleSearch}
//             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           />
//         </div>
//       </div>

//       {/* Users Table */}
//       <div className="bg-white rounded-lg shadow overflow-hidden">
//         {loading ? (
//           <Loading />
//         ) : (
//           <>
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Người dùng
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Vai trò
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Phòng ban
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Trạng thái
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Ngày tạo
//                     </th>
//                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Thao tác
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {users.map((user) => (
//                     <tr key={user.id} className="hover:bg-gray-50">
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div>
//                           <div className="text-sm font-medium text-gray-900">
//                             {user.ho_ten}
//                           </div>
//                           <div className="text-sm text-gray-500">
//                             {user.email}
//                           </div>
//                           <div className="text-xs text-gray-400">
//                             @{user.username}
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         {getRoleBadge(user.role)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         {user.ten_phong_ban || "Chưa phân công"}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         {getStatusBadge(user.is_active)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {formatDate(user.created_at)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
//                         <div className="flex justify-end space-x-2">
//                           <button
//                             onClick={() => handleEditUser(user)}
//                             className="text-blue-600 hover:text-blue-900"
//                             title="Chỉnh sửa"
//                           >
//                             <Edit className="w-4 h-4" />
//                           </button>
//                           <button
//                             onClick={() => handleResetPassword(user)}
//                             className="text-yellow-600 hover:text-yellow-900"
//                             title="Reset mật khẩu"
//                           >
//                             <Key className="w-4 h-4" />
//                           </button>
//                           <button
//                             onClick={() => handleDeleteUser(user)}
//                             className="text-red-600 hover:text-red-900"
//                             title="Xóa"
//                           >
//                             <Trash2 className="w-4 h-4" />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {users.length === 0 && !loading && (
//               <div className="text-center py-12">
//                 <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
//                 <h3 className="mt-2 text-sm font-medium text-gray-900">
//                   Không có người dùng
//                 </h3>
//                 <p className="mt-1 text-sm text-gray-500">
//                   Không tìm thấy người dùng nào với điều kiện đã chọn.
//                 </p>
//               </div>
//             )}

//             {/* Pagination */}
//             {totalPages > 1 && (
//               <div className="px-6 py-4 border-t">
//                 <Pagination
//                   currentPage={currentPage}
//                   totalPages={totalPages}
//                   onPageChange={setCurrentPage}
//                   totalItems={totalItems}
//                   itemsPerPage={20}
//                 />
//               </div>
//             )}
//           </>
//         )}
//       </div>

//       {/* User Modal */}
//       <Modal
//         isOpen={showUserModal}
//         onClose={() => {
//           setShowUserModal(false);
//           resetForm();
//         }}
//         title={isEditing ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
//       >
//         <form onSubmit={handleSubmitUser} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Họ tên <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               required
//               value={userForm.ho_ten}
//               onChange={(e) =>
//                 setUserForm((prev) => ({ ...prev, ho_ten: e.target.value }))
//               }
//               className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Email <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="email"
//               required
//               value={userForm.email}
//               onChange={(e) =>
//                 setUserForm((prev) => ({ ...prev, email: e.target.value }))
//               }
//               className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Username <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               required
//               value={userForm.username}
//               onChange={(e) =>
//                 setUserForm((prev) => ({ ...prev, username: e.target.value }))
//               }
//               className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Mật khẩu {!isEditing && <span className="text-red-500">*</span>}
//               {isEditing && (
//                 <span className="text-gray-500">(để trống nếu không đổi)</span>
//               )}
//             </label>
//             <input
//               type="password"
//               value={userForm.password}
//               onChange={(e) =>
//                 setUserForm((prev) => ({ ...prev, password: e.target.value }))
//               }
//               className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Vai trò
//             </label>
//             <select
//               value={userForm.role}
//               onChange={(e) =>
//                 setUserForm((prev) => ({ ...prev, role: e.target.value }))
//               }
//               className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             >
//               <option value="user">Người dùng</option>
//               <option value="supervisor">Giám sát</option>
//               <option value="manager">Quản lý</option>
//               <option value="admin">Admin</option>
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Phòng ban
//             </label>
//             <select
//               value={userForm.phong_ban_id}
//               onChange={(e) =>
//                 setUserForm((prev) => ({
//                   ...prev,
//                   phong_ban_id: e.target.value,
//                 }))
//               }
//               className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             >
//               <option value="">Chọn phòng ban</option>
//               {departments.map((dept) => (
//                 <option key={dept.id} value={dept.id}>
//                   {dept.ten_phong_ban}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="flex items-center">
//               <input
//                 type="checkbox"
//                 checked={userForm.is_active}
//                 onChange={(e) =>
//                   setUserForm((prev) => ({
//                     ...prev,
//                     is_active: e.target.checked,
//                   }))
//                 }
//                 className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//               />
//               <span className="ml-2 text-sm text-gray-700">
//                 Tài khoản hoạt động
//               </span>
//             </label>
//           </div>

//           <div className="flex justify-end space-x-3 pt-4">
//             <button
//               type="button"
//               onClick={() => {
//                 setShowUserModal(false);
//                 resetForm();
//               }}
//               className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
//             >
//               Hủy
//             </button>
//             <button
//               type="submit"
//               disabled={loading}
//               className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
//             >
//               {loading ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo mới"}
//             </button>
//           </div>
//         </form>
//       </Modal>
//     </div>
//   );
// };

// export default Users;

// pages/admin/Users.jsx
import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Mail,
  Key,
} from "lucide-react";
import { userService } from "../../services/userService";
import { formatDate } from "../../utils/helpers";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import Loading from "../../components/common/Loading";
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
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

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

  // Load data
  useEffect(() => {
    loadUsers();
    loadDepartments();
  }, [currentPage, search, filters]);

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
      const response = await userService.getDepartmentsList();
      if (response.success) {
        // Ensure departments is always an array
        setDepartments(Array.isArray(response.data) ? response.data : []);
      } else {
        // Set empty array on failure
        setDepartments([]);
      }
    } catch (error) {
      console.error("Load departments error:", error);
      // Set empty array on error
      setDepartments([]);
    }
  };

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      setCurrentPage(1);
      loadUsers();
    }
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
    setShowUserModal(true);
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
    setShowUserModal(true);
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
        setShowUserModal(false);
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

  const handleResetPassword = async (user) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn reset mật khẩu cho "${user.ho_ten}"?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await userService.resetPassword(user.id);

      if (response.success) {
        toast.success("Reset mật khẩu thành công");
      } else {
        toast.error(response.message || "Có lỗi xảy ra khi reset mật khẩu");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Có lỗi xảy ra khi reset mật khẩu");
    } finally {
      setLoading(false);
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
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý người dùng
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý tài khoản và phân quyền người dùng
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
          <button
            onClick={handleCreateUser}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm người dùng</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
              <option value="supervisor">Giám sát</option>
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email hoặc username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={handleSearch}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <Loading />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(user)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Reset mật khẩu"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
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

      {/* User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
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
              <option value="supervisor">Giám sát</option>
              <option value="manager">Quản lý</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phòng ban
            </label>
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
              <option value="">Chọn phòng ban</option>
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
                setShowUserModal(false);
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
