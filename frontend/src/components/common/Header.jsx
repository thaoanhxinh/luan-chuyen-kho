import React from "react";
import { useAuth } from "../../context/AuthContext";
import { LogOut, User, Bell } from "lucide-react";

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Hệ thống Quản lý Kho hàng
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell size={20} />
            </button>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <User size={20} className="text-gray-400" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{user?.ho_ten}</p>
                  <p className="text-gray-500">
                    {user?.phong_ban?.ten_phong_ban}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Đăng xuất"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
