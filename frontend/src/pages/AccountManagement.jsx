import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/userService";
import PageHeader from "../components/common/PageHeader";
import toast from "react-hot-toast";

const AccountManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(user?.username || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangeUsername = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const resp = await userService.changeOwnUsername(username.trim());
      if (resp.success) {
        toast.success("Cập nhật tên đăng nhập thành công");
        localStorage.setItem(
          "user",
          JSON.stringify({ ...user, username: username.trim() })
        );
        setTimeout(() => navigate("/"), 300);
      } else {
        toast.error(resp.message || "Không thể cập nhật tên đăng nhập");
      }
    } catch (e) {
      toast.error("Lỗi khi cập nhật tên đăng nhập");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Vui lòng nhập đủ mật khẩu hiện tại và mật khẩu mới");
      return;
    }
    try {
      setLoading(true);
      const resp = await userService.changeOwnPassword(
        currentPassword,
        newPassword
      );
      if (resp.success) {
        toast.success("Đổi mật khẩu thành công");
        setCurrentPassword("");
        setNewPassword("");
        setTimeout(() => navigate("/"), 300);
      } else {
        toast.error(resp.message || "Không thể đổi mật khẩu");
      }
    } catch (e) {
      toast.error("Lỗi khi đổi mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý tài khoản" />

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Change Username */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Đổi tên đăng nhập
          </h3>
          <form onSubmit={handleChangeUsername} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên đăng nhập mới
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập tên đăng nhập mới"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Đổi mật khẩu
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu hiện tại
              </label>
              <input
                type="password"
                placeholder="Nhập mật khẩu hiện tại"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu mới
              </label>
              <input
                type="password"
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Đang đổi..." : "Đổi mật khẩu"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountManagement;
