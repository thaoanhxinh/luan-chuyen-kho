import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Send,
  ArrowRight,
  Users,
  FileText,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Filter,
  Search,
  Download,
  BarChart3,
} from "lucide-react";
import { workflowService } from "../services/workflowService";

import { formatCurrency, formatDate, formatNumber } from "../utils/helpers";
import Modal from "../components/common/Modal";
import Pagination from "../components/common/Pagination";
import Loading from "../components/common/Loading";
import WorkflowTracker from "../components/workflow/WorkflowTracker";
import ApprovalInterface from "../components/workflow/ApprovalInterface";
import toast from "react-hot-toast";

const WorkflowManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    tu_ngay: "",
    den_ngay: "",
    loai_yeu_cau: "",
    don_vi_yeu_cau: "",
    trang_thai: "",
  });
  const [selectedTab, setSelectedTab] = useState("pending");
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [trackerRequestId, setTrackerRequestId] = useState(null);
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const pendingRequests = data?.data?.items || [];
  const pagination = data?.data?.pagination || {};

  // Tabs configuration
  const tabs = [
    {
      key: "pending",
      label: "Chờ phê duyệt",
      icon: Clock,
      count: stats?.data?.pending_count || 0,
      color: "text-yellow-600",
    },
    {
      key: "approved",
      label: "Đã duyệt",
      icon: CheckCircle,
      count: stats?.data?.approved_today || 0,
      color: "text-green-600",
    },
    {
      key: "rejected",
      label: "Từ chối",
      icon: XCircle,
      count: stats?.data?.rejected_today || 0,
      color: "text-red-600",
    },
    {
      key: "statistics",
      label: "Thống kê",
      icon: BarChart3,
      count: null,
      color: "text-blue-600",
    },
  ];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [pendingResponse, statsResponse] = await Promise.all([
        workflowService.getPendingRequests({
          page: currentPage,
          limit: 20,
          search: searchTerm,
          trang_thai:
            selectedTab === "pending" ? "confirmed,under_review" : selectedTab,
          ...filters,
        }),
        workflowService.getStatistics(filters),
      ]);
      setData(pendingResponse);
      setStats(statsResponse);
    } catch (error) {
      console.error("Error fetching workflow data:", error);
      toast.error("Không thể tải dữ liệu workflow");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, filters, selectedTab]);

  const handleApprove = async (request) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
  };

  const handleReject = async (request) => {
    const lyDo = prompt("Nhập lý do từ chối:");
    if (lyDo) {
      try {
        if (request.loai_yeu_cau === "nhap_kho") {
          await workflowService.rejectYeuCauNhap(request.id, {
            ly_do_tu_choi: lyDo,
          });
        } else {
          await workflowService.rejectYeuCauXuat(request.id, {
            ly_do_tu_choi: lyDo,
          });
        }
        toast.success("Từ chối yêu cầu thành công");
        fetchData();
      } catch (error) {
        console.error("Error rejecting request:", error);
        toast.error("Không thể từ chối yêu cầu");
      }
    }
  };

  const handleConvertToPhieu = async (request) => {
    if (
      window.confirm("Bạn có chắc muốn chuyển đổi yêu cầu này thành phiếu?")
    ) {
      try {
        if (request.loai_yeu_cau === "nhap_kho") {
          await workflowService.convertToPhieuNhap(request.id, {
            ngay_nhap: new Date().toISOString().split("T")[0],
          });
        } else {
          await workflowService.convertToPhieuXuat(request.id, {
            ngay_xuat: new Date().toISOString().split("T")[0],
          });
        }
        toast.success("Chuyển đổi thành công");
        fetchData();
      } catch (error) {
        console.error("Error converting request:", error);
        toast.error("Không thể chuyển đổi yêu cầu");
      }
    }
  };

  const handleViewTracker = (requestId, loaiYeuCau) => {
    setTrackerRequestId({ id: requestId, type: loaiYeuCau });
    setShowTrackerModal(true);
  };

  const getRequestTypeInfo = (loaiYeuCau) => {
    const typeMap = {
      nhap_kho: {
        label: "Nhập kho",
        color: "bg-blue-100 text-blue-800",
        icon: ArrowRight,
      },
      xuat_kho: {
        label: "Xuất kho",
        color: "bg-red-100 text-red-800",
        icon: ArrowRight,
      },
    };
    return typeMap[loaiYeuCau] || typeMap.nhap_kho;
  };

  const getTrangThaiInfo = (trangThai) => {
    const statusMap = {
      confirmed: {
        label: "Đã gửi",
        color: "bg-blue-100 text-blue-800",
        icon: Send,
      },
      under_review: {
        label: "Đang xem xét",
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
      approved: {
        label: "Đã duyệt",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      rejected: {
        label: "Từ chối",
        color: "bg-red-100 text-red-800",
        icon: XCircle,
      },
    };
    return statusMap[trangThai] || statusMap.confirmed;
  };

  const getMucDoUuTienInfo = (mucDo) => {
    const priorityMap = {
      thap: { label: "Thấp", color: "bg-gray-100 text-gray-800" },
      binh_thuong: { label: "Bình thường", color: "bg-blue-100 text-blue-800" },
      cao: { label: "Cao", color: "bg-orange-100 text-orange-800" },
      khan_cap: { label: "Khẩn cấp", color: "bg-red-100 text-red-800" },
    };
    return priorityMap[mucDo] || priorityMap.binh_thuong;
  };

  const getActionButtons = (request) => {
    const buttons = [];

    // Xem workflow tracker
    buttons.push(
      <button
        key="tracker"
        onClick={() => handleViewTracker(request.id, request.loai_yeu_cau)}
        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all"
        title="Xem tiến trình"
      >
        <BarChart3 size={14} />
      </button>
    );

    if (["confirmed", "under_review"].includes(request.trang_thai)) {
      // Phê duyệt
      buttons.push(
        <button
          key="approve"
          onClick={() => handleApprove(request)}
          className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-all"
          title="Phê duyệt"
        >
          <CheckCircle size={14} />
        </button>
      );

      // Từ chối
      buttons.push(
        <button
          key="reject"
          onClick={() => handleReject(request)}
          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all"
          title="Từ chối"
        >
          <XCircle size={14} />
        </button>
      );
    }

    if (request.trang_thai === "approved") {
      // Chuyển thành phiếu
      buttons.push(
        <button
          key="convert"
          onClick={() => handleConvertToPhieu(request)}
          className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-all"
          title="Chuyển thành phiếu"
        >
          <FileText size={14} />
        </button>
      );
    }

    return buttons;
  };

  const renderStatisticsTab = () => (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Chờ phê duyệt
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats?.data?.pending_count || 0)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Đã duyệt hôm nay
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats?.data?.approved_today || 0)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Thời gian xử lý TB
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {Math.round(stats?.data?.avg_processing_hours || 0)}h
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Quá hạn xử lý
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats?.data?.overdue_count || 0)}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and detailed statistics would go here */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Thống kê theo loại yêu cầu
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Yêu cầu nhập kho</span>
              <span className="text-sm font-medium text-blue-600">
                {formatNumber(stats?.data?.nhap_kho?.total || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Yêu cầu xuất kho</span>
              <span className="text-sm font-medium text-red-600">
                {formatNumber(stats?.data?.xuat_kho?.total || 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Hiệu suất xử lý
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tỷ lệ duyệt</span>
              <span className="text-sm font-medium text-green-600">
                {Math.round(stats?.data?.approval_rate || 0)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tỷ lệ từ chối</span>
              <span className="text-sm font-medium text-red-600">
                {Math.round(stats?.data?.rejection_rate || 0)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <Users className="mr-2 h-5 w-5 text-purple-600" />
            Quản lý workflow
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Phê duyệt và theo dõi các yêu cầu nhập xuất kho
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              /* Export function */
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <Download size={16} />
            <span>Xuất báo cáo</span>
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
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={16} className={tab.color} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      selectedTab === tab.key
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedTab === "statistics" ? (
        renderStatisticsTab()
      ) : (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
                    placeholder="Tìm theo số yêu cầu hoặc lý do..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại yêu cầu
                </label>
                <select
                  value={filters.loai_yeu_cau}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      loai_yeu_cau: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
                >
                  <option value="">Tất cả</option>
                  <option value="nhap_kho">Nhập kho</option>
                  <option value="xuat_kho">Xuất kho</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={filters.tu_ngay}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, tu_ngay: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={filters.den_ngay}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      den_ngay: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilters({
                      tu_ngay: "",
                      den_ngay: "",
                      loai_yeu_cau: "",
                      don_vi_yeu_cau: "",
                      trang_thai: "",
                    });
                    setSearchTerm("");
                  }}
                  className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-1"
                >
                  <Filter size={14} />
                  <span>Xóa bộ lọc</span>
                </button>
              </div>
            </div>
          </div>

          {/* Request List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loading size="large" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Số yêu cầu
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Loại
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Ngày yêu cầu
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Đơn vị yêu cầu
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Lý do
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Ưu tiên
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Giá trị
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-24">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {pendingRequests.map((request) => {
                        const statusInfo = getTrangThaiInfo(request.trang_thai);
                        const typeInfo = getRequestTypeInfo(
                          request.loai_yeu_cau
                        );
                        const priorityInfo = getMucDoUuTienInfo(
                          request.muc_do_uu_tien
                        );

                        return (
                          <tr
                            key={`${request.loai_yeu_cau}-${request.id}`}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {request.so_yeu_cau}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}
                              >
                                {typeInfo.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(request.ngay_yeu_cau)}
                              </div>
                              {request.ngay_can_hang && (
                                <div className="text-xs text-gray-500 flex items-center mt-1">
                                  <Calendar size={12} className="mr-1" />
                                  Cần: {formatDate(request.ngay_can_hang)}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-900">
                                {request.ten_don_vi_yeu_cau}
                              </div>
                              <div className="text-xs text-gray-500">
                                {request.ten_nguoi_yeu_cau}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-900 max-w-xs truncate">
                                {request.ly_do_yeu_cau}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {request.so_mat_hang} mặt hàng
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityInfo.color}`}
                              >
                                {priorityInfo.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <div className="text-sm font-medium text-purple-600">
                                {formatCurrency(request.tong_gia_tri_uoc_tinh)}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                              >
                                <statusInfo.icon size={12} className="mr-1" />
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center space-x-1">
                                {getActionButtons(request)}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {pendingRequests.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      Không có yêu cầu nào
                    </h3>
                    <p className="text-xs text-gray-500">
                      {selectedTab === "pending"
                        ? "Không có yêu cầu nào cần phê duyệt."
                        : `Không có yêu cầu nào ở trạng thái "${
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
        </>
      )}

      {/* Approval Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title={`Phê duyệt yêu cầu: ${selectedRequest?.so_yeu_cau || ""}`}
        size="lg"
      >
        {selectedRequest && (
          <ApprovalInterface
            request={selectedRequest}
            onSuccess={() => {
              setShowApprovalModal(false);
              fetchData();
            }}
            onCancel={() => setShowApprovalModal(false)}
          />
        )}
      </Modal>

      {/* Workflow Tracker Modal */}
      <Modal
        isOpen={showTrackerModal}
        onClose={() => setShowTrackerModal(false)}
        title="Tiến trình workflow"
        size="lg"
      >
        {trackerRequestId && (
          <WorkflowTracker
            requestId={trackerRequestId.id}
            requestType={trackerRequestId.type}
            onClose={() => setShowTrackerModal(false)}
          />
        )}
      </Modal>
    </div>
  );
};
export default WorkflowManagement;
