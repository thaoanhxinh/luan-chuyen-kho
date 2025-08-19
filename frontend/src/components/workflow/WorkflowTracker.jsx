import React from "react";
import {
  FileText,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Calendar,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { formatDateTime } from "../../utils/helpers";

const WorkflowTracker = ({ yeuCau, type = "nhap", showDetails = true }) => {
  if (!yeuCau) {
    return <div>Không có dữ liệu workflow</div>;
  }

  // Define workflow stages based on request type
  const workflowStages = [
    {
      key: "draft",
      label: "Tạo nháp",
      description: "Yêu cầu được tạo và chỉnh sửa",
      icon: FileText,
      color: "gray",
    },
    {
      key: "confirmed",
      label: "Đã gửi",
      description: "Yêu cầu đã được gửi để xem xét",
      icon: Clock,
      color: "blue",
    },
    {
      key: "under_review",
      label: "Đang xem xét",
      description: "Đang trong quá trình xem xét và đánh giá",
      icon: Eye,
      color: "yellow",
    },
    {
      key: "approved",
      label: "Đã phê duyệt",
      description: "Yêu cầu đã được phê duyệt",
      icon: CheckCircle,
      color: "green",
    },
    {
      key: "completed",
      label: "Hoàn thành",
      description: `Đã tạo phiếu ${type === "nhap" ? "nhập" : "xuất"} kho`,
      icon: CheckCircle2,
      color: "green",
    },
  ];

  // Get current stage index
  const getCurrentStageIndex = () => {
    const currentStatus = yeuCau.trang_thai;

    if (currentStatus === "rejected" || currentStatus === "cancelled") {
      // Find the last successful stage before rejection/cancellation
      const stages = ["draft", "confirmed", "under_review"];
      for (let i = stages.length - 1; i >= 0; i--) {
        if (
          yeuCau.workflow_history?.some((h) => h.trang_thai === stages[i]) ||
          (stages[i] === "draft" && yeuCau.created_at)
        ) {
          return i;
        }
      }
      return 0;
    }

    return workflowStages.findIndex((stage) => stage.key === currentStatus);
  };

  const currentStageIndex = getCurrentStageIndex();
  const isRejected = yeuCau.trang_thai === "rejected";
  const isCancelled = yeuCau.trang_thai === "cancelled";
  const isTerminated = isRejected || isCancelled;

  // Get stage status
  const getStageStatus = (index) => {
    if (isTerminated && index > currentStageIndex) {
      return "disabled";
    }

    if (index < currentStageIndex) {
      return "completed";
    } else if (index === currentStageIndex) {
      return isTerminated ? "failed" : "current";
    } else {
      return "upcoming";
    }
  };

  // Get stage colors
  const getStageColors = (status, stageColor) => {
    switch (status) {
      case "completed":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          border: "border-green-200",
          icon: "text-green-600",
        };
      case "current":
        return {
          bg: `bg-${stageColor}-100`,
          text: `text-${stageColor}-800`,
          border: `border-${stageColor}-300`,
          icon: `text-${stageColor}-600`,
        };
      case "failed":
        return {
          bg: "bg-red-100",
          text: "text-red-800",
          border: "border-red-200",
          icon: "text-red-600",
        };
      case "disabled":
        return {
          bg: "bg-gray-50",
          text: "text-gray-400",
          border: "border-gray-200",
          icon: "text-gray-400",
        };
      default: // upcoming
        return {
          bg: "bg-gray-50",
          text: "text-gray-600",
          border: "border-gray-200",
          icon: "text-gray-400",
        };
    }
  };

  // Get timeline events
  const getTimelineEvents = () => {
    const events = [];

    // Add creation event
    events.push({
      id: "created",
      title: "Yêu cầu được tạo",
      description: `Bởi ${yeuCau.ten_nguoi_yeu_cau || "N/A"}`,
      timestamp: yeuCau.created_at,
      icon: FileText,
      type: "info",
    });

    // Add workflow history events
    if (yeuCau.workflow_history) {
      yeuCau.workflow_history.forEach((event, index) => {
        let eventType = "info";
        let title = "Xem xét yêu cầu";

        switch (event.trang_thai) {
          case "confirmed":
            title = "Yêu cầu được gửi";
            eventType = "info";
            break;
          case "under_review":
            title = "Bắt đầu xem xét";
            eventType = "warning";
            break;
          case "approved":
            title = "Phê duyệt yêu cầu";
            eventType = "success";
            break;
          case "rejected":
            title = "Từ chối yêu cầu";
            eventType = "error";
            break;
        }

        events.push({
          id: `workflow_${index}`,
          title,
          description: `Bởi ${event.ten_nguoi_duyet || "N/A"} - ${
            event.ten_phong_ban_duyet || "N/A"
          }`,
          timestamp: event.ngay_xu_ly || event.created_at,
          icon:
            event.trang_thai === "approved"
              ? CheckCircle
              : event.trang_thai === "rejected"
              ? XCircle
              : Eye,
          type: eventType,
          details: event.ly_do_quyet_dinh || event.ghi_chu,
        });
      });
    }

    // Add completion event if applicable
    if (yeuCau.trang_thai === "completed" && yeuCau.ngay_hoan_thanh) {
      events.push({
        id: "completed",
        title: `Đã tạo phiếu ${type === "nhap" ? "nhập" : "xuất"} kho`,
        description:
          yeuCau.so_phieu_nhap || yeuCau.so_phieu_xuat || "Phiếu đã được tạo",
        timestamp: yeuCau.ngay_hoan_thanh,
        icon: CheckCircle2,
        type: "success",
      });
    }

    // Sort by timestamp
    return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };

  const timelineEvents = getTimelineEvents();

  return (
    <div className="space-y-6">
      {/* Progress Tracker */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Tiến trình xử lý
        </h3>

        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-8 left-8 right-8 h-0.5 bg-gray-200" />
          <div
            className={`absolute top-8 left-8 h-0.5 transition-all duration-500 ${
              isTerminated ? "bg-red-400" : "bg-green-400"
            }`}
            style={{
              width: `${Math.max(
                0,
                (currentStageIndex / (workflowStages.length - 1)) * 100
              )}%`,
            }}
          />

          {/* Stage Cards */}
          <div className="relative flex justify-between">
            {workflowStages.map((stage, index) => {
              const status = getStageStatus(index);
              const colors = getStageColors(status, stage.color);
              const StageIcon = stage.icon;

              return (
                <div
                  key={stage.key}
                  className="flex flex-col items-center max-w-xs"
                >
                  {/* Stage Circle */}
                  <div
                    className={`
                    relative z-10 w-16 h-16 rounded-full border-2 flex items-center justify-center
                    ${colors.bg} ${colors.border} transition-all duration-300
                  `}
                  >
                    <StageIcon className={`h-6 w-6 ${colors.icon}`} />

                    {status === "completed" && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                    )}

                    {status === "failed" && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <XCircle className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Stage Info */}
                  <div className="mt-3 text-center">
                    <h4 className={`text-sm font-medium ${colors.text}`}>
                      {stage.label}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-24">
                      {stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Status */}
        <div className="mt-6 text-center">
          <div
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              isRejected
                ? "bg-red-100 text-red-800"
                : isCancelled
                ? "bg-gray-100 text-gray-800"
                : yeuCau.trang_thai === "completed"
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {isRejected && <XCircle className="mr-2 h-4 w-4" />}
            {isCancelled && <XCircle className="mr-2 h-4 w-4" />}
            {yeuCau.trang_thai === "completed" && (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            {!isTerminated && yeuCau.trang_thai !== "completed" && (
              <Clock className="mr-2 h-4 w-4" />
            )}
            Trạng thái:{" "}
            {isRejected
              ? "Đã từ chối"
              : isCancelled
              ? "Đã hủy"
              : yeuCau.trang_thai === "completed"
              ? "Hoàn thành"
              : yeuCau.trang_thai === "approved"
              ? "Đã phê duyệt"
              : yeuCau.trang_thai === "under_review"
              ? "Đang xem xét"
              : yeuCau.trang_thai === "confirmed"
              ? "Đã gửi"
              : "Nháp"}
          </div>
        </div>

        {/* Termination Reason */}
        {isTerminated && (yeuCau.ly_do_tu_choi || yeuCau.ghi_chu_duyet) && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h5 className="text-sm font-medium text-red-900 mb-2">
              {isRejected ? "Lý do từ chối:" : "Lý do hủy:"}
            </h5>
            <p className="text-sm text-red-700">
              {yeuCau.ly_do_tu_choi || yeuCau.ghi_chu_duyet}
            </p>
          </div>
        )}
      </div>

      {/* Timeline Details */}
      {showDetails && timelineEvents.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Lịch sử chi tiết
          </h3>

          <div className="flow-root">
            <ul className="-mb-8">
              {timelineEvents.map((event, index) => (
                <li key={event.id}>
                  <div className="relative pb-8">
                    {index !== timelineEvents.length - 1 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                    )}

                    <div className="relative flex space-x-3">
                      <div>
                        <span
                          className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                            event.type === "success"
                              ? "bg-green-500"
                              : event.type === "error"
                              ? "bg-red-500"
                              : event.type === "warning"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                          }`}
                        >
                          <event.icon className="h-5 w-5 text-white" />
                        </span>
                      </div>

                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {event.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {event.description}
                          </p>
                          {event.details && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                              {event.details}
                            </div>
                          )}
                        </div>

                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime={event.timestamp}>
                            {formatDateTime(event.timestamp)}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Next Steps */}
      {!isTerminated && yeuCau.trang_thai !== "completed" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">Bước tiếp theo:</p>
              <p className="text-blue-800">
                {yeuCau.trang_thai === "draft" &&
                  "Hoàn thiện thông tin và gửi yêu cầu để xem xét"}
                {yeuCau.trang_thai === "confirmed" &&
                  "Chờ phòng quản lý kho xem xét và phê duyệt"}
                {yeuCau.trang_thai === "under_review" &&
                  "Đang được xem xét bởi phòng quản lý kho"}
                {yeuCau.trang_thai === "approved" &&
                  `Chờ tạo phiếu ${
                    type === "nhap" ? "nhập" : "xuất"
                  } kho chính thức`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowTracker;
