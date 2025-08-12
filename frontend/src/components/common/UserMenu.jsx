import React, { useState, useEffect, useRef, useContext } from "react";
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
  Bell,
  HelpCircle,
  Moon,
  Sun,
  Globe,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { notificationService } from "../../services/notificationService";

const UserMenu = () => {
  const { user, logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (user && isOpen) {
      loadNotificationPreferences();
    }
  }, [user, isOpen]);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const loadNotificationPreferences = async () => {
    try {
      const response = await notificationService.getNotificationPreferences();
      if (response.success) {
        setNotificationPrefs(response.data);
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode.toString());

    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const getRoleText = (role) => {
    const roleMap = {
      admin: "Quản trị viên",
      user: "Người dùng",
      manager: "Quản lý",
    };
    return roleMap[role] || role;
  };

  const getRoleColor = (role) => {
    const colorMap = {
      admin: "text-red-600 bg-red-100",
      user: "text-blue-600 bg-blue-100",
      manager: "text-green-600 bg-green-100",
    };
    return colorMap[role] || "text-gray-600 bg-gray-100";
  };

  const menuItems = [
    {
      icon: User,
      label: "Thông tin cá nhân",
      action: () => (window.location.href = "/profile"),
      description: "Xem và cập nhật thông tin cá nhân",
    },
    {
      icon: Bell,
      label: "Cài đặt thông báo",
      action: () => (window.location.href = "/notifications/preferences"),
      description: "Quản lý tùy chọn thông báo",
    },
    {
      icon: Settings,
      label: "Cài đặt",
      action: () => (window.location.href = "/settings"),
      description: "Cài đặt ứng dụng và tùy chọn",
    },
    {
      icon: HelpCircle,
      label: "Trợ giúp",
      action: () => (window.location.href = "/help"),
      description: "Hướng dẫn sử dụng và FAQ",
    },
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {user.ho_ten?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {user.ho_ten || "User"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {user.phong_ban_info?.ten_phong_ban || "N/A"}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {/* User Info Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-lg font-medium">
                {user.ho_ten?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {user.ho_ten || "User"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user.email || "No email"}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                      user.role
                    )}`}
                  >
                    <Shield size={12} className="mr-1" />
                    {getRoleText(user.role)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ID: {user.id}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Department Info */}
          {user.phong_ban_info && (
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.phong_ban_info.ten_phong_ban}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Mã: {user.phong_ban_info.ma_phong_ban}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Phòng ban
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.action();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
              >
                <item.icon
                  size={18}
                  className="text-gray-500 dark:text-gray-400"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Quick Settings */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Cài đặt nhanh
            </p>
            <div className="space-y-2">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {darkMode ? (
                    <Moon
                      size={16}
                      className="text-gray-500 dark:text-gray-400"
                    />
                  ) : (
                    <Sun
                      size={16}
                      className="text-gray-500 dark:text-gray-400"
                    />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Chế độ tối
                  </span>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    darkMode ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                      darkMode ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Notification Status */}
              {notificationPrefs && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell
                      size={16}
                      className="text-gray-500 dark:text-gray-400"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Thông báo
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      notificationPrefs.in_app_enabled
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {notificationPrefs.in_app_enabled ? "Bật" : "Tắt"}
                  </span>
                </div>
              )}

              {/* Language Setting */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe
                    size={16}
                    className="text-gray-500 dark:text-gray-400"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Ngôn ngữ
                  </span>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  Tiếng Việt
                </span>
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="p-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-3 text-red-600 dark:text-red-400 rounded-lg"
            >
              <LogOut size={18} />
              <div className="flex-1">
                <p className="text-sm font-medium">Đăng xuất</p>
                <p className="text-xs text-red-500 dark:text-red-400">
                  Kết thúc phiên làm việc
                </p>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Phiên bản 2.0.0</span>
              <span>Workflow System</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
