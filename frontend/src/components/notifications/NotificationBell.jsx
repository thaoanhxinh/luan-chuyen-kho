import React, { useState, useEffect, useRef, useContext } from "react";
import { Bell, X, Check, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { notificationService } from "../../services/notificationService";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const NotificationBell = ({ compact = false }) => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [user]);

  // Real-time updates (in practice would use WebSocket)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadUnreadCount();
      // Only refresh if dropdown is closed to avoid disrupting user interaction
      if (!isOpen) {
        loadNotifications(1, true); // Silent refresh
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user, isOpen]);

  const loadNotifications = async (pageNum = 1, silent = false) => {
    if (!user || loading) return;

    try {
      if (!silent) setLoading(true);

      const response = await notificationService.getList({
        page: pageNum,
        limit: 20,
      });

      if (response.success) {
        const newNotifications = response.data.items || [];

        if (pageNum === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications((prev) => [...prev, ...newNotifications]);
        }

        setHasMore(
          response.data.pagination.page < response.data.pagination.pages
        );
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!user) return;

    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.unread_count || 0);
      }
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId
              ? { ...notif, trang_thai: "read" }
              : notif
          )
        );

        // Update unread count
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, trang_thai: "read" }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      loadNotifications(page + 1);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "yeu_cau_moi":
        return <Info className="text-blue-500" size={16} />;
      case "phe_duyet":
        return <CheckCircle className="text-green-500" size={16} />;
      case "tu_choi":
        return <X className="text-red-500" size={16} />;
      case "hoan_thanh":
        return <Check className="text-green-600" size={16} />;
      case "system":
        return <AlertTriangle className="text-yellow-500" size={16} />;
      default:
        return <Bell className="text-gray-500" size={16} />;
    }
  };

  const getNotificationTypeText = (type) => {
    const typeMap = {
      yeu_cau_moi: "Yêu cầu mới",
      phe_duyet: "Đã phê duyệt",
      tu_choi: "Bị từ chối",
      hoan_thanh: "Hoàn thành",
      system: "Hệ thống",
    };
    return typeMap[type] || type;
  };

  const formatTime = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: vi,
      });
    } catch {
      return "Vừa xong";
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (notification.trang_thai === "unread") {
      markAsRead(notification.id);
    }

    // Navigate to related page if URL is provided
    if (notification.url_redirect) {
      window.location.href = notification.url_redirect;
    }

    setIsOpen(false);
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-400 hover:text-white transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Thông báo
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Đánh dấu tất cả đã đọc
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">Đang tải...</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Không có thông báo
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        notification.trang_thai === "unread" ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.loai_thong_bao)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.tieu_de}
                            </p>
                            {notification.trang_thai === "unread" && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.noi_dung}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {formatTime(notification.created_at)}
                            </span>
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                              {getNotificationTypeText(
                                notification.loai_thong_bao
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {hasMore && (
                    <div className="p-4">
                      <button
                        onClick={loadMore}
                        disabled={loading}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                      >
                        {loading ? "Đang tải..." : "Xem thêm"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Đánh dấu tất cả đã đọc
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2">Đang tải thông báo...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                <p>Không có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      notification.trang_thai === "unread"
                        ? "bg-blue-50 border-l-4 border-blue-400"
                        : ""
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.loai_thong_bao)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p
                            className={`text-sm font-medium truncate ${
                              notification.trang_thai === "unread"
                                ? "text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {notification.tieu_de}
                          </p>
                          {notification.trang_thai === "unread" && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.noi_dung}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {formatTime(notification.created_at)}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              notification.loai_thong_bao === "yeu_cau_moi"
                                ? "bg-blue-100 text-blue-700"
                                : notification.loai_thong_bao === "phe_duyet"
                                ? "bg-green-100 text-green-700"
                                : notification.loai_thong_bao === "tu_choi"
                                ? "bg-red-100 text-red-700"
                                : notification.loai_thong_bao === "hoan_thanh"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {getNotificationTypeText(
                              notification.loai_thong_bao
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <div className="p-4">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 py-2"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                          Đang tải...
                        </div>
                      ) : (
                        "Xem thêm thông báo"
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                setIsOpen(false);
                window.location.href = "/notifications";
              }}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-800 py-1"
            >
              Xem tất cả thông báo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
