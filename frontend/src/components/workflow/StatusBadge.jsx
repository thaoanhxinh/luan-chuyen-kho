import React from "react";
import {
  FileText,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  Pause,
  RotateCcw,
} from "lucide-react";

const StatusBadge = ({
  status,
  type = "yeu_cau", // "yeu_cau" | "phieu" | "general"
  size = "md", // "sm" | "md" | "lg"
  showIcon = true,
  customLabel = null,
  pulse = false,
}) => {
  // Status configurations for different types
  const statusConfigs = {
    yeu_cau: {
      draft: {
        label: "Nháp",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: FileText,
        pulseColor: "animate-pulse",
      },
      submitted: {
        label: "Đã gửi",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Clock,
        pulseColor: "animate-pulse",
      },
      under_review: {
        label: "Đang xem xét",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Eye,
        pulseColor: "animate-pulse",
      },
      approved: {
        label: "Đã duyệt",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        pulseColor: "animate-pulse",
      },
      rejected: {
        label: "Từ chối",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
        pulseColor: "animate-pulse",
      },
      cancelled: {
        label: "Hủy bỏ",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: XCircle,
        pulseColor: "animate-pulse",
      },
      completed: {
        label: "Hoàn thành",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle2,
        pulseColor: "animate-pulse",
      },
    },
    phieu: {
      draft: {
        label: "Nháp",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: FileText,
        pulseColor: "animate-pulse",
      },
      confirmed: {
        label: "Đã xác nhận",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: CheckCircle,
        pulseColor: "animate-pulse",
      },
      approved: {
        label: "Đã duyệt",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        pulseColor: "animate-pulse",
      },
      completed: {
        label: "Hoàn thành",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle2,
        pulseColor: "animate-pulse",
      },
      cancelled: {
        label: "Đã hủy",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
        pulseColor: "animate-pulse",
      },
    },
    general: {
      success: {
        label: "Thành công",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        pulseColor: "animate-pulse",
      },
      error: {
        label: "Lỗi",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
        pulseColor: "animate-pulse",
      },
      warning: {
        label: "Cảnh báo",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: AlertTriangle,
        pulseColor: "animate-pulse",
      },
      info: {
        label: "Thông tin",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Eye,
        pulseColor: "animate-pulse",
      },
      pending: {
        label: "Đang chờ",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
        pulseColor: "animate-pulse",
      },
      processing: {
        label: "Đang xử lý",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: RotateCcw,
        pulseColor: "animate-spin",
      },
      paused: {
        label: "Tạm dừng",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: Pause,
        pulseColor: "animate-pulse",
      },
    },
  };

  // Size configurations
  const sizeConfigs = {
    sm: {
      container: "px-2 py-1 text-xs",
      icon: "h-3 w-3",
      gap: "space-x-1",
    },
    md: {
      container: "px-2.5 py-0.5 text-xs",
      icon: "h-4 w-4",
      gap: "space-x-1.5",
    },
    lg: {
      container: "px-3 py-1 text-sm",
      icon: "h-4 w-4",
      gap: "space-x-2",
    },
  };

  // Get configuration
  const config = statusConfigs[type]?.[status] || statusConfigs.general.info;
  const sizeConfig = sizeConfigs[size];
  const IconComponent = config.icon;

  // Build classes
  const baseClasses =
    "inline-flex items-center font-medium rounded-full border";
  const colorClasses = config.color;
  const sizeClasses = sizeConfig.container;
  const gapClasses = sizeConfig.gap;
  const pulseClasses = pulse ? config.pulseColor : "";

  const finalClasses =
    `${baseClasses} ${colorClasses} ${sizeClasses} ${gapClasses} ${pulseClasses}`.trim();

  return (
    <span className={finalClasses}>
      {showIcon && IconComponent && (
        <IconComponent
          className={`${sizeConfig.icon} ${
            pulse && status === "processing" ? "animate-spin" : ""
          }`}
        />
      )}
      <span>{customLabel || config.label}</span>
    </span>
  );
};

// Priority Badge Component
export const PriorityBadge = ({ priority, size = "md", showIcon = true }) => {
  const priorityConfigs = {
    thap: {
      label: "Thấp",
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: null,
    },
    binh_thuong: {
      label: "Bình thường",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: null,
    },
    cao: {
      label: "Cao",
      color: "bg-orange-100 text-orange-800 border-orange-200",
      icon: AlertTriangle,
    },
    khan_cap: {
      label: "Khẩn cấp",
      color: "bg-red-100 text-red-800 border-red-200",
      icon: AlertTriangle,
    },
  };

  const sizeConfigs = {
    sm: {
      container: "px-2 py-1 text-xs",
      icon: "h-3 w-3",
      gap: "space-x-1",
    },
    md: {
      container: "px-2.5 py-0.5 text-xs",
      icon: "h-4 w-4",
      gap: "space-x-1.5",
    },
    lg: {
      container: "px-3 py-1 text-sm",
      icon: "h-4 w-4",
      gap: "space-x-2",
    },
  };

  const config = priorityConfigs[priority] || priorityConfigs.binh_thuong;
  const sizeConfig = sizeConfigs[size];
  const IconComponent = config.icon;

  const baseClasses =
    "inline-flex items-center font-medium rounded-full border";
  const colorClasses = config.color;
  const sizeClasses = sizeConfig.container;
  const gapClasses = sizeConfig.gap;

  const finalClasses =
    `${baseClasses} ${colorClasses} ${sizeClasses} ${gapClasses}`.trim();

  return (
    <span className={finalClasses}>
      {showIcon && IconComponent && (
        <IconComponent className={sizeConfig.icon} />
      )}
      <span>{config.label}</span>
    </span>
  );
};

// Quantity Badge Component
export const QuantityBadge = ({
  count,
  label = "items",
  size = "md",
  color = "blue",
}) => {
  const colorConfigs = {
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    green: "bg-green-100 text-green-800 border-green-200",
    red: "bg-red-100 text-red-800 border-red-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    gray: "bg-gray-100 text-gray-800 border-gray-200",
  };

  const sizeConfigs = {
    sm: "px-2 py-1 text-xs",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-sm",
  };

  const baseClasses =
    "inline-flex items-center font-medium rounded-full border";
  const colorClasses = colorConfigs[color] || colorConfigs.blue;
  const sizeClasses = sizeConfigs[size];

  const finalClasses = `${baseClasses} ${colorClasses} ${sizeClasses}`.trim();

  return (
    <span className={finalClasses}>
      {count} {label}
    </span>
  );
};

// Progress Badge Component
export const ProgressBadge = ({
  current,
  total,
  size = "md",
  showPercentage = true,
}) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  const getColorByPercentage = (pct) => {
    if (pct >= 100) return "bg-green-100 text-green-800 border-green-200";
    if (pct >= 75) return "bg-blue-100 text-blue-800 border-blue-200";
    if (pct >= 50) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (pct >= 25) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const sizeConfigs = {
    sm: "px-2 py-1 text-xs",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-sm",
  };

  const baseClasses =
    "inline-flex items-center font-medium rounded-full border";
  const colorClasses = getColorByPercentage(percentage);
  const sizeClasses = sizeConfigs[size];

  const finalClasses = `${baseClasses} ${colorClasses} ${sizeClasses}`.trim();

  return (
    <span className={finalClasses}>
      {current}/{total}
      {showPercentage && ` (${percentage}%)`}
    </span>
  );
};

export default StatusBadge;
