import React from "react";
import { useAuth } from "../../context/AuthContext";
import { LogOut, User } from "lucide-react";
import NotificationBell from "../notifications/NotificationBell";

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">
            Hệ thống Quản lý Kho hàng
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Sử dụng NotificationBell component thay vì Bell icon */}
          <NotificationBell compact={true} />

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-medium text-white">
                {user?.ho_ten?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900">
                  {user?.ho_ten || "User"}
                </p>
                <p className="text-gray-500 text-xs">
                  {user?.phong_ban?.ten_phong_ban ||
                    user?.phong_ban_info?.ten_phong_ban ||
                    "N/A"}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
              title="Đăng xuất"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
