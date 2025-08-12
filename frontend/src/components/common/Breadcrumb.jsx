import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const Breadcrumb = ({ customItems = null }) => {
  const location = useLocation();

  // Define breadcrumb mappings for different routes
  const routeMappings = {
    // Dashboard
    "/": { label: "Dashboard", icon: Home },

    // Workflow Routes
    "/yeu-cau-nhap": { label: "Yêu cầu nhập kho", parent: "/" },
    "/yeu-cau-nhap/create": { label: "Tạo yêu cầu", parent: "/yeu-cau-nhap" },
    "/yeu-cau-xuat": { label: "Yêu cầu xuất kho", parent: "/" },
    "/yeu-cau-xuat/create": { label: "Tạo yêu cầu", parent: "/yeu-cau-xuat" },

    "/workflow/pending-approvals": { label: "Chờ phê duyệt", parent: "/" },
    "/workflow/approval-history": { label: "Lịch sử phê duyệt", parent: "/" },
    "/workflow/statistics": { label: "Thống kê workflow", parent: "/" },

    // Operations Routes
    "/nhap-kho": { label: "Quản lý nhập kho", parent: "/" },
    "/nhap-kho/create": { label: "Tạo phiếu nhập", parent: "/nhap-kho" },
    "/xuat-kho": { label: "Quản lý xuất kho", parent: "/" },
    "/xuat-kho/create": { label: "Tạo phiếu xuất", parent: "/xuat-kho" },
    "/kiem-ke": { label: "Kiểm kê", parent: "/" },
    "/kiem-ke/create": { label: "Tạo phiếu kiểm kê", parent: "/kiem-ke" },

    // Master Data Routes
    "/hang-hoa": { label: "Hàng hóa", parent: "/" },
    "/hang-hoa/create": { label: "Thêm hàng hóa", parent: "/hang-hoa" },
    "/loai-hang-hoa": { label: "Loại hàng hóa", parent: "/" },
    "/loai-hang-hoa/create": {
      label: "Thêm loại hàng hóa",
      parent: "/loai-hang-hoa",
    },
    "/nha-cung-cap": { label: "Nhà cung cấp", parent: "/" },
    "/nha-cung-cap/create": {
      label: "Thêm nhà cung cấp",
      parent: "/nha-cung-cap",
    },
    "/don-vi-nhan": { label: "Đơn vị nhận", parent: "/" },
    "/don-vi-nhan/create": {
      label: "Thêm đơn vị nhận",
      parent: "/don-vi-nhan",
    },

    // Reports Routes
    "/bao-cao/dashboard": { label: "Dashboard báo cáo", parent: "/" },
    "/bao-cao/ton-kho": { label: "Báo cáo tồn kho", parent: "/" },
    "/bao-cao/nhap-xuat": { label: "Báo cáo nhập xuất", parent: "/" },
    "/bao-cao/kiem-ke": { label: "Báo cáo kiểm kê", parent: "/" },

    // Admin Routes
    "/users": { label: "Quản lý người dùng", parent: "/" },
    "/users/create": { label: "Thêm người dùng", parent: "/users" },
    "/departments": { label: "Quản lý phòng ban", parent: "/" },
    "/departments/create": { label: "Thêm phòng ban", parent: "/departments" },
    "/settings": { label: "Cài đặt hệ thống", parent: "/" },

    // Notifications
    "/notifications": { label: "Thông báo", parent: "/" },
  };

  const generateBreadcrumbItems = () => {
    if (customItems) {
      return customItems;
    }

    const currentPath = location.pathname;

    // Handle dynamic routes with IDs
    let matchedPath = currentPath;
    let dynamicParams = {};

    // Check for dynamic routes (containing numbers that could be IDs)
    const pathParts = currentPath.split("/");

    // Common patterns for dynamic routes
    const dynamicPatterns = [
      // /yeu-cau-nhap/123 -> /yeu-cau-nhap/:id
      /^\/yeu-cau-(nhap|xuat)\/\d+$/,
      // /nhap-kho/123 -> /nhap-kho/:id
      /^\/(nhap-kho|xuat-kho|kiem-ke)\/\d+$/,
      // /hang-hoa/123 -> /hang-hoa/:id
      /^\/(hang-hoa|loai-hang-hoa|nha-cung-cap|don-vi-nhan)\/\d+$/,
      // /users/123 -> /users/:id
      /^\/(users|departments)\/\d+$/,
    ];

    // Try to match dynamic patterns
    for (const pattern of dynamicPatterns) {
      if (pattern.test(currentPath)) {
        const basePath = pathParts.slice(0, -1).join("/");
        const id = pathParts[pathParts.length - 1];

        if (routeMappings[basePath]) {
          dynamicParams.id = id;
          matchedPath = basePath;
          break;
        }
      }
    }

    // Build breadcrumb chain
    const buildChain = (path) => {
      const mapping = routeMappings[path];
      if (!mapping) return [];

      const chain = [];
      if (mapping.parent) {
        chain.push(...buildChain(mapping.parent));
      }

      chain.push({
        label: mapping.label,
        path: path,
        icon: mapping.icon,
        current: path === matchedPath,
      });

      return chain;
    };

    const chain = buildChain(matchedPath);

    // Add dynamic item if we have an ID
    if (dynamicParams.id && chain.length > 0) {
      const lastItem = chain[chain.length - 1];
      lastItem.current = false; // Parent is no longer current

      // Determine action based on URL patterns
      let actionLabel = "Chi tiết";
      if (currentPath.includes("/edit")) {
        actionLabel = "Chỉnh sửa";
      } else if (currentPath.includes("/create")) {
        actionLabel = "Tạo mới";
      } else if (currentPath.includes("/view")) {
        actionLabel = "Xem chi tiết";
      }

      chain.push({
        label: `${actionLabel} #${dynamicParams.id}`,
        path: currentPath,
        current: true,
      });
    }

    return chain;
  };

  const breadcrumbItems = generateBreadcrumbItems();

  if (breadcrumbItems.length <= 1) {
    return null; // Don't show breadcrumb for single-level or unknown routes
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-600 mb-6">
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;

        return (
          <React.Fragment key={item.path || index}>
            {index > 0 && (
              <ChevronRight size={16} className="text-gray-400 mx-1" />
            )}

            {isLast ? (
              <span className="flex items-center text-gray-900 font-medium">
                {item.icon && <item.icon size={16} className="mr-1" />}
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="flex items-center hover:text-blue-600 transition-colors"
              >
                {item.icon && <item.icon size={16} className="mr-1" />}
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

// Helper component for custom breadcrumb items
export const BreadcrumbItem = ({
  label,
  path,
  icon: Icon,
  current = false,
}) => {
  return { label, path, icon: Icon, current };
};

export default Breadcrumb;
