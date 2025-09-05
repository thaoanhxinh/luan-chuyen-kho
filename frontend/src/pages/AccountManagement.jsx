import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/userService";
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý tài khoản</h1>
        <p className="text-gray-600">Đổi tên đăng nhập và mật khẩu của bạn</p>
      </div>

      <form
        onSubmit={handleChangeUsername}
        className="bg-white p-4 rounded shadow space-y-3"
      >
        <div className="font-semibold">Đổi tên đăng nhập</div>
        <input
          className="border rounded px-3 py-2 w-full"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <div className="text-right">
          <button
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Lưu
          </button>
        </div>
      </form>

      <form
        onSubmit={handleChangePassword}
        className="bg-white p-4 rounded shadow space-y-3"
      >
        <div className="font-semibold">Đổi mật khẩu</div>
        <input
          type="password"
          placeholder="Mật khẩu hiện tại"
          className="border rounded px-3 py-2 w-full"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Mật khẩu mới"
          className="border rounded px-3 py-2 w-full"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <div className="text-right">
          <button
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Đổi mật khẩu
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccountManagement;
