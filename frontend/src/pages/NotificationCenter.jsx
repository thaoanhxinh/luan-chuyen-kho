import React, { useState, useEffect } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  Settings,
  Mail,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Eye,
  MoreVertical,
} from "lucide-react";
import { notificationService } from "../services/notificationService";
import { formatRelativeTime } from "../utils/helpers";
import Modal from "../components/common/Modal";
import Pagination from "../components/common/Pagination";
import Loading from "../components/common/Loading";
import toast from "react-hot-toast";

const NotificationCenter = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    trang_thai: "",
    loai_thong_bao: "",
    unread_only: false,
  });
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const notifications = data?.data?.items || [];
  const pagination = data?.data?.pagination || {};

  // Tabs configuration
  const tabs = [
    {
      key: "all",
      label: "Tất cả",
      icon: Bell,
      count: stats?.data?.total || 0,
      color: "text-gray-600",
    },
    {
      key: "unread",
      label: "Chưa đọc",
      icon: Mail,
      count: stats?.data?.unread || 0,
      color: "text-blue-600",
    },
    {
      key: "yeu_cau_moi",
      label: "Yêu cầu mới",
      icon: Info,
      count: stats?.data?.new_requests || 0,
      color: "text-blue-600",
    },
    {
      key: "phe_duyet",
      label: "Phê duyệt",
      icon: CheckCircle,
      count: stats?.data?.approvals || 0,
      color: "text-green-600",
    },
    {
      key: "tu_choi",
      label: "Từ chối",
      icon: XCircle,
      count: stats?.data?.rejections || 0,
      color: "text-red-600",
    },
    {
      key: "hoan_thanh",
      label: "Hoàn thành",
      icon: CheckCircle,
      count: stats?.data?.completions || 0,
      color: "text-emerald-600",
    },
  ];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [notificationsResponse, statsResponse] = await Promise.all([
        notificationService.getList({
          page: currentPage,
          limit: 20,
          search: searchTerm,
          loai_thong_bao: selectedTab === "all" ? "" : selectedTab,
          trang_thai: selectedTab === "unread" ? "unread" : filters.trang_thai,
          unread_only: selectedTab === "unread" || filters.unread_only,
        }),
        notificationService.getStatistics(),
      ]);
      setData(notificationsResponse);
      setStats(statsResponse);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Không thể tải dữ liệu thông báo");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await notificationService.getPreferences();
      setPreferences(response.data);
    } catch (error) {
      console.error("Error fetching preferences:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, filters, selectedTab]);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const handleMarkAsRead = async (notificationIds) => {
    try {
      if (Array.isArray(notificationIds)) {
        await notificationService.bulkMarkAsRead(notificationIds);
      } else {
        await notificationService.markAsRead(notificationIds);
      }
      toast.success("Đánh dấu đã đọc thành công");
      fetchData();
      setSelectedNotifications([]);
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error("Không thể đánh dấu đã đọc");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (
      window.confirm("Bạn có chắc muốn đánh dấu tất cả thông báo là đã đọc?")
    ) {
      try {
        await notificationService.markAllAsRead();
        toast.success("Đã đánh dấu tất cả thông báo là đã đọc");
        fetchData();
      } catch (error) {
        console.error("Error marking all as read:", error);
        toast.error("Không thể đánh dấu tất cả đã đọc");
      }
    }
  };

  const handleArchive = async (notificationId) => {
    try {
      await notificationService.archive(notificationId);
      toast.success("Lưu trữ thông báo thành công");
      fetchData();
    } catch (error) {
      console.error("Error archiving notification:", error);
      toast.error("Không thể lưu trữ thông báo");
    }
  };

  const handleBulkArchive = async () => {
    if (selectedNotifications.length === 0) {
      toast.error("Vui lòng chọn thông báo để lưu trữ");
      return;
    }

    if (
      window.confirm(
        `Bạn có chắc muốn lưu trữ ${selectedNotifications.length} thông báo?`
      )
    ) {
      try {
        await Promise.all(
          selectedNotifications.map((id) => notificationService.archive(id))
        );
        toast.success(`Đã lưu trữ ${selectedNotifications.length} thông báo`);
        fetchData();
        setSelectedNotifications([]);
      } catch (error) {
        console.error("Error bulk archiving:", error);
        toast.error("Không thể lưu trữ thông báo");
      }
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (notification.trang_thai === "unread") {
      await handleMarkAsRead(notification.id);
    }

    // Navigate to related page if URL provided
    if (notification.url_redirect) {
      window.location.href = notification.url_redirect;
    }
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications((prev) => {
      if (prev.includes(notificationId)) {
        return prev.filter((id) => id !== notificationId);
      } else {
        return [...prev, notificationId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map((n) => n.id));
    }
  };

  const getNotificationIcon = (loaiThongBao) => {
    const iconMap = {
      yeu_cau_moi: { icon: Info, color: "text-blue-500" },
      phe_duyet: { icon: CheckCircle, color: "text-green-500" },
      tu_choi: { icon: XCircle, color: "text-red-500" },
      hoan_thanh: { icon: CheckCircle, color: "text-emerald-500" },
      system: { icon: Settings, color: "text-purple-500" },
    };
    return iconMap[loaiThongBao] || iconMap.system;
  };

  const handleUpdatePreferences = async (newPreferences) => {
    try {
      await notificationService.updatePreferences(newPreferences);
      setPreferences(newPreferences);
      setShowPreferencesModal(false);
      toast.success("Cập nhật cài đặt thành công");
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error("Không thể cập nhật cài đặt");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <Bell className="mr-2 h-5 w-5 text-blue-600" />
            Trung tâm thông báo
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Quản lý và theo dõi các thông báo hệ thống
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowPreferencesModal(true)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <Settings size={16} />
            <span>Cài đặt</span>
          </button>
          <button
            onClick={handleMarkAllAsRead}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <CheckCheck size={16} />
            <span>Đánh dấu tất cả</span>
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`flex-shrink-0 flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={16} className={tab.color} />
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    selectedTab === tab.key
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters and Bulk Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                placeholder="Tìm kiếm thông báo..."
              />
            </div>

            <select
              value={filters.loai_thong_bao}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  loai_thong_bao: e.target.value,
                }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            >
              <option value="">Tất cả loại</option>
              <option value="yeu_cau_moi">Yêu cầu mới</option>
              <option value="phe_duyet">Phê duyệt</option>
              <option value="tu_choi">Từ chối</option>
              <option value="hoan_thanh">Hoàn thành</option>
              <option value="system">Hệ thống</option>
            </select>

            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={filters.unread_only}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    unread_only: e.target.checked,
                  }))
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Chỉ chưa đọc</span>
            </label>
          </div>

          {selectedNotifications.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Đã chọn {selectedNotifications.length} thông báo
              </span>
              <button
                onClick={() => handleMarkAsRead(selectedNotifications)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Đánh dấu đã đọc
              </button>
              <button
                onClick={handleBulkArchive}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Lưu trữ
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loading size="large" />
          </div>
        ) : (
          <>
            {/* Select All Header */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={
                      selectedNotifications.length === notifications.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    Chọn tất cả ({notifications.length} thông báo)
                  </span>
                </label>
              </div>
            )}

            {/* Notifications */}
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => {
                const iconInfo = getNotificationIcon(
                  notification.loai_thong_bao
                );
                const Icon = iconInfo.icon;
                const isUnread = notification.trang_thai === "unread";
                const isSelected = selectedNotifications.includes(
                  notification.id
                );

                return (
                  <div
                    key={notification.id}
                    className={`px-4 py-4 hover:bg-gray-50 transition-colors ${
                      isUnread ? "bg-blue-50" : ""
                    } ${isSelected ? "bg-blue-100" : ""}`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          handleSelectNotification(notification.id)
                        }
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />

                      {/* Icon */}
                      <div className={`flex-shrink-0 mt-1 ${iconInfo.color}`}>
                        <Icon size={20} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                          >
                            <h3
                              className={`text-sm font-medium ${
                                isUnread ? "text-gray-900" : "text-gray-700"
                              }`}
                            >
                              {notification.tieu_de}
                              {isUnread && (
                                <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.noi_dung}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Calendar size={12} className="mr-1" />
                                {formatRelativeTime(notification.ngay_gui)}
                              </span>
                              {notification.yeu_cau_id && (
                                <span className="flex items-center">
                                  <User size={12} className="mr-1" />
                                  Yêu cầu #{notification.yeu_cau_id}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-1 ml-4">
                            {isUnread && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-all"
                                title="Đánh dấu đã đọc"
                              >
                                <Check size={14} />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchive(notification.id);
                              }}
                              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-all"
                              title="Lưu trữ"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {notifications.length === 0 && (
              <div className="text-center py-8">
                <Bell className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  Không có thông báo
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedTab === "all"
                    ? "Chưa có thông báo nào."
                    : `Không có thông báo nào ở danh mục "${
                        tabs.find((t) => t.key === selectedTab)?.label
                      }".`}
                </p>
              </div>
            )}

            {pagination.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200">
                <Pagination
                  currentPage={pagination.page || 1}
                  totalPages={pagination.pages || 1}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Preferences Modal */}
      <Modal
        isOpen={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        title="Cài đặt thông báo"
        size="md"
      >
        {preferences && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Phương thức nhận thông báo
              </h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={preferences.in_app_enabled}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        in_app_enabled: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Thông báo trong ứng dụng
                  </span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={preferences.email_enabled}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        email_enabled: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Thông báo qua email
                  </span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Loại thông báo
              </h3>
              <div className="space-y-3">
                {Object.entries(preferences.notification_types || {}).map(
                  ([type, enabled]) => (
                    <label key={type} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) =>
                          setPreferences((prev) => ({
                            ...prev,
                            notification_types: {
                              ...prev.notification_types,
                              [type]: e.target.checked,
                            },
                          }))
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {type === "yeu_cau_moi" && "Yêu cầu mới"}
                        {type === "phe_duyet" && "Phê duyệt"}
                        {type === "tu_choi" && "Từ chối"}
                        {type === "hoan_thanh" && "Hoàn thành"}
                        {type === "system" && "Hệ thống"}
                      </span>
                    </label>
                  )
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Tần suất gửi email
              </h3>
              <select
                value={preferences.digest_frequency}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    digest_frequency: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="immediate">Ngay lập tức</option>
                <option value="daily">Hàng ngày</option>
                <option value="weekly">Hàng tuần</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-4 border-t">
              <button
                onClick={() => setShowPreferencesModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => handleUpdatePreferences(preferences)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Lưu cài đặt
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NotificationCenter;
