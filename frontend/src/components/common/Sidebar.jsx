// import React, { useState, useRef, useEffect } from "react";
// import { NavLink } from "react-router-dom";
// import {
//   LayoutDashboard,
//   Package,
//   ArrowDownToLine,
//   ArrowUpFromLine,
//   ClipboardCheck,
//   BarChart3,
//   Users,
//   Building2,
//   Shield,
//   ChevronRight,
//   Menu,
//   X,
//   FileText,
//   TrendingUp,
//   Truck,
//   Factory,
// } from "lucide-react";
// import { useAuth } from "../../context/AuthContext";
// import { PERMISSIONS } from "../../utils/constants";

// const Sidebar = () => {
//   const { hasPermission, isAdmin } = useAuth();
//   const [isCollapsed, setIsCollapsed] = useState(false);
//   const [activeDropdown, setActiveDropdown] = useState(null);
//   const dropdownRef = useRef(null);
//   const sidebarRef = useRef(null);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(event.target) &&
//         sidebarRef.current &&
//         !sidebarRef.current.contains(event.target)
//       ) {
//         setActiveDropdown(null);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   const toggleSidebar = () => {
//     setIsCollapsed(!isCollapsed);
//     // Close any open dropdown when collapsing
//     if (!isCollapsed) {
//       setActiveDropdown(null);
//     }
//   };

//   const handleGroupClick = (groupKey, event) => {
//     event.preventDefault();
//     setActiveDropdown(activeDropdown === groupKey ? null : groupKey);
//   };

//   // Dashboard - standalone item
//   const dashboardItem = {
//     to: "/dashboard",
//     icon: LayoutDashboard,
//     label: "Dashboard",
//     permission: PERMISSIONS.VIEW_DASHBOARD,
//   };

//   // Grouped navigation items
//   const menuGroups = [
//     {
//       key: "inventory",
//       label: "Quản lý kho",
//       icon: Package,
//       permission: PERMISSIONS.MANAGE_INVENTORY,
//       items: [
//         {
//           to: "/nhap-kho",
//           icon: ArrowDownToLine,
//           label: "Nhập kho",
//         },
//         {
//           to: "/xuat-kho",
//           icon: ArrowUpFromLine,
//           label: "Xuất kho",
//         },
//         {
//           to: "/kiem-ke",
//           icon: ClipboardCheck,
//           label: "Kiểm kê",
//         },
//       ],
//     },
//     {
//       key: "products",
//       label: "Hàng hóa",
//       icon: Package,
//       permission: PERMISSIONS.MANAGE_INVENTORY,
//       items: [
//         {
//           to: "/hang-hoa",
//           icon: Package,
//           label: "Danh sách hàng hóa",
//         },
//         {
//           to: "/loai-hang-hoa",
//           icon: Package,
//           label: "Loại hàng hóa",
//         },
//       ],
//     },
//     {
//       key: "reports",
//       label: "Báo cáo",
//       icon: BarChart3,
//       permission: PERMISSIONS.VIEW_REPORTS,
//       items: [
//         {
//           to: "/bao-cao/luan-chuyen",
//           icon: TrendingUp,
//           label: "Báo cáo luân chuyển",
//         },
//         {
//           to: "/bao-cao/nhap",
//           icon: ArrowDownToLine,
//           label: "Báo cáo nhập",
//         },
//         {
//           to: "/bao-cao/xuat",
//           icon: ArrowUpFromLine,
//           label: "Báo cáo xuất",
//         },
//         {
//           to: "/bao-cao/don-vi-nhan",
//           icon: Building2,
//           label: "Thống kê đơn vị nhận",
//         },
//         {
//           to: "/bao-cao/nha-cung-cap",
//           icon: Factory,
//           label: "Thống kê nhà cung cấp",
//         },
//       ],
//     },
//   ];

//   // Admin items
//   const adminItems = [
//     {
//       to: "/admin/nhan-vien",
//       icon: Users,
//       label: "Quản lý nhân viên",
//       adminOnly: true,
//     },
//     {
//       to: "/admin/phong-ban",
//       icon: Building2,
//       label: "Quản lý phòng ban",
//       adminOnly: true,
//     },
//   ];

//   const renderGroupHeader = (group) => {
//     const Icon = group.icon;
//     const isActive = activeDropdown === group.key;

//     return (
//       <button
//         onClick={(e) => handleGroupClick(group.key, e)}
//         className={`w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors group relative ${
//           isActive ? "bg-gray-100" : ""
//         }`}
//         id={`group-${group.key}`}
//       >
//         <div className="flex items-center space-x-3">
//           <Icon size={20} />
//           {!isCollapsed && <span className="font-medium">{group.label}</span>}
//         </div>
//         {!isCollapsed && (
//           <ChevronRight
//             size={16}
//             className={`transition-transform ${isActive ? "rotate-90" : ""}`}
//           />
//         )}
//       </button>
//     );
//   };

//   const renderHorizontalDropdown = (group) => {
//     if (activeDropdown !== group.key) return null;

//     const buttonElement = document.getElementById(`group-${group.key}`);
//     if (!buttonElement) return null;

//     const buttonRect = buttonElement.getBoundingClientRect();
//     const sidebarWidth = isCollapsed ? 64 : 256; // 16 = w-16, 64 = w-64 in pixels

//     return (
//       <div
//         ref={dropdownRef}
//         className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-30"
//         style={{
//           left: sidebarWidth + 8, // 8px gap from sidebar
//           top: buttonRect.top,
//           minWidth: "200px",
//           maxHeight: "300px",
//           overflowY: "auto",
//         }}
//       >
//         {group.items.map((item) => {
//           const Icon = item.icon;
//           return (
//             <NavLink
//               key={item.to}
//               to={item.to}
//               onClick={() => setActiveDropdown(null)}
//               className={({ isActive }) =>
//                 `flex items-center space-x-3 px-4 py-2 text-sm transition-colors ${
//                   isActive
//                     ? "bg-primary-100 text-primary-700 font-medium"
//                     : "text-gray-700 hover:bg-gray-100"
//                 }`
//               }
//             >
//               <Icon size={16} />
//               <span>{item.label}</span>
//             </NavLink>
//           );
//         })}
//       </div>
//     );
//   };

//   const renderNavItem = (item, isSubItem = false) => {
//     if (item.permission && !hasPermission(item.permission)) {
//       return null;
//     }

//     if (item.adminOnly && !isAdmin()) {
//       return null;
//     }

//     const Icon = item.icon;
//     const paddingClass = isSubItem ? "pl-12 pr-4 py-2" : "px-4 py-3";

//     return (
//       <li key={item.to}>
//         <NavLink
//           to={item.to}
//           className={({ isActive }) =>
//             `flex items-center space-x-3 ${paddingClass} rounded-lg transition-colors ${
//               isActive
//                 ? "bg-primary-100 text-primary-700 font-medium"
//                 : "text-gray-700 hover:bg-gray-100"
//             }`
//           }
//         >
//           <Icon size={isSubItem ? 16 : 20} />
//           {!isCollapsed && (
//             <>
//               <span className={isSubItem ? "text-sm" : ""}>{item.label}</span>
//               {item.adminOnly && (
//                 <Shield size={14} className="ml-auto text-red-500" />
//               )}
//             </>
//           )}
//         </NavLink>
//       </li>
//     );
//   };

//   return (
//     <>
//       <aside
//         ref={sidebarRef}
//         className={`fixed left-0 top-0 h-full ${
//           isCollapsed ? "w-16" : "w-64"
//         } bg-white border-r border-gray-200 transition-all duration-300 z-20 flex flex-col`}
//       >
//         {/* Toggle Button */}
//         <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 flex-shrink-0">
//           {!isCollapsed && (
//             <h2 className="font-semibold text-gray-900 text-sm">Menu</h2>
//           )}
//           <button
//             onClick={toggleSidebar}
//             className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
//             title={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
//           >
//             {isCollapsed ? <Menu size={20} /> : <X size={20} />}
//           </button>
//         </div>

//         {/* Navigation */}
//         <nav className="p-4 flex-1 overflow-y-auto">
//           <ul className="space-y-2">
//             {/* Dashboard Item */}
//             {hasPermission(dashboardItem.permission) &&
//               renderNavItem(dashboardItem)}

//             {/* Grouped Items */}
//             {menuGroups.map((group, index) => {
//               if (group.permission && !hasPermission(group.permission)) {
//                 return null;
//               }

//               return (
//                 <li key={group.key} className="space-y-1">
//                   {renderGroupHeader(group, index)}
//                   {renderHorizontalDropdown(group)}
//                 </li>
//               );
//             })}

//             {/* Admin Items */}
//             {isAdmin() && (
//               <>
//                 <li className="pt-4">
//                   <div className="border-t border-gray-200 pt-4">
//                     {!isCollapsed && (
//                       <p className="px-4 text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
//                         Quản trị
//                       </p>
//                     )}
//                   </div>
//                 </li>
//                 {adminItems.map((item) => renderNavItem(item))}
//               </>
//             )}
//           </ul>
//         </nav>

//         {/* User Info */}
//       </aside>

//       {/* Horizontal Dropdown Overlays */}
//       {menuGroups.map((group) => {
//         if (group.permission && !hasPermission(group.permission)) {
//           return null;
//         }
//         return renderHorizontalDropdown(group);
//       })}
//     </>
//   );
// };

// export default Sidebar;

import React, { useState, useEffect, useContext } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  FileText,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardCheck,
  BarChart3,
  Settings,
  Users,
  Bell,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  Building2,
  Package,
  Truck,
  UserCheck,
  FileSearch,
  TrendingUp,
  Archive,
  Menu,
  X,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import NotificationBell from "../notifications/NotificationBell";

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    workflow: true,
    operations: false,
    reports: false,
    admin: false,
  });
  const [isMobile, setIsMobile] = useState(false);

  // Responsive handling
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [setIsCollapsed]);

  // Auto-expand section based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/yeu-cau-") || path.includes("/workflow")) {
      setExpandedSections((prev) => ({ ...prev, workflow: true }));
    } else if (
      path.includes("/nhap-kho") ||
      path.includes("/xuat-kho") ||
      path.includes("/kiem-ke")
    ) {
      setExpandedSections((prev) => ({ ...prev, operations: true }));
    } else if (path.includes("/bao-cao")) {
      setExpandedSections((prev) => ({ ...prev, reports: true }));
    } else if (path.includes("/users") || path.includes("/departments")) {
      setExpandedSections((prev) => ({ ...prev, admin: true }));
    }
  }, [location.pathname]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Workflow menu items based on user role
  const getWorkflowMenuItems = () => {
    const baseItems = [
      {
        title: "Tạo yêu cầu",
        icon: FileText,
        subItems: [
          {
            title: "Yêu cầu nhập kho",
            path: "/yeu-cau-nhap/create",
            icon: ArrowDownToLine,
          },
          {
            title: "Yêu cầu xuất kho",
            path: "/yeu-cau-xuat/create",
            icon: ArrowUpFromLine,
          },
        ],
      },
      {
        title: "Yêu cầu của tôi",
        icon: Clock,
        subItems: [
          {
            title: "Yêu cầu nhập",
            path: "/yeu-cau-nhap",
            icon: ArrowDownToLine,
            badge: "my",
          },
          {
            title: "Yêu cầu xuất",
            path: "/yeu-cau-xuat",
            icon: ArrowUpFromLine,
            badge: "my",
          },
        ],
      },
    ];

    // Add approval items for managers
    if (
      user?.role === "admin" ||
      ["HCK", "TMKH"].includes(user?.phong_ban_info?.ma_phong_ban)
    ) {
      baseItems.push({
        title: "Phê duyệt",
        icon: UserCheck,
        subItems: [
          {
            title: "Chờ phê duyệt",
            path: "/workflow/pending-approvals",
            icon: AlertTriangle,
            badge: "pending",
          },
          {
            title: "Lịch sử phê duyệt",
            path: "/workflow/approval-history",
            icon: FileSearch,
          },
          {
            title: "Thống kê workflow",
            path: "/workflow/statistics",
            icon: TrendingUp,
          },
        ],
      });
    }

    return baseItems;
  };

  // Operations menu items
  const getOperationsMenuItems = () => {
    return [
      {
        title: "Quản lý nhập kho",
        icon: ArrowDownToLine,
        subItems: [
          { title: "Danh sách phiếu nhập", path: "/nhap-kho", icon: FileText },
          { title: "Tạo phiếu nhập", path: "/nhap-kho/create", icon: FileText },
        ],
      },
      {
        title: "Quản lý xuất kho",
        icon: ArrowUpFromLine,
        subItems: [
          { title: "Danh sách phiếu xuất", path: "/xuat-kho", icon: FileText },
          { title: "Tạo phiếu xuất", path: "/xuat-kho/create", icon: FileText },
        ],
      },
      {
        title: "Kiểm kê",
        icon: ClipboardCheck,
        subItems: [
          {
            title: "Danh sách kiểm kê",
            path: "/kiem-ke",
            icon: ClipboardCheck,
          },
          {
            title: "Tạo phiếu kiểm kê",
            path: "/kiem-ke/create",
            icon: ClipboardCheck,
          },
        ],
      },
      {
        title: "Danh mục",
        icon: Package,
        subItems: [
          { title: "Hàng hóa", path: "/hang-hoa", icon: Package },
          { title: "Loại hàng hóa", path: "/loai-hang-hoa", icon: Archive },
          { title: "Nhà cung cấp", path: "/nha-cung-cap", icon: Truck },
          { title: "Đơn vị nhận", path: "/don-vi-nhan", icon: Building2 },
        ],
      },
    ];
  };

  // Reports menu items
  const getReportsMenuItems = () => {
    return [
      {
        title: "Báo cáo tổng hợp",
        icon: BarChart3,
        subItems: [
          { title: "Dashboard", path: "/bao-cao/dashboard", icon: Home },
          { title: "Tồn kho", path: "/bao-cao/ton-kho", icon: Package },
          { title: "Nhập xuất", path: "/bao-cao/nhap-xuat", icon: TrendingUp },
          { title: "Kiểm kê", path: "/bao-cao/kiem-ke", icon: ClipboardCheck },
        ],
      },
    ];
  };

  // Admin menu items
  const getAdminMenuItems = () => {
    if (user?.role !== "admin") return [];

    return [
      {
        title: "Quản trị hệ thống",
        icon: Settings,
        subItems: [
          { title: "Người dùng", path: "/users", icon: Users },
          { title: "Phòng ban", path: "/departments", icon: Building2 },
          { title: "Cài đặt hệ thống", path: "/settings", icon: Settings },
        ],
      },
    ];
  };

  const NavSection = ({
    title,
    icon: items,
    isExpanded,
    onToggle,
    sectionKey,
  }) => {
    return (
      <div className="mb-2">
        <button
          onClick={() => onToggle(sectionKey)}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <div className="flex items-center">
            <Icon size={18} className="flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="ml-3">{title}</span>
              </>
            )}
          </div>
          {!isCollapsed && (
            <ChevronDown
              size={16}
              className={`transform transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          )}
        </button>

        {!isCollapsed && isExpanded && (
          <div className="mt-1 space-y-1">
            {items.map((item, index) => (
              <NavItemGroup key={index} item={item} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const NavItemGroup = ({ item }) => {
    const [isSubExpanded, setIsSubExpanded] = useState(false);
    const hasSubItems = item.subItems && item.subItems.length > 0;

    if (hasSubItems) {
      return (
        <div>
          <button
            onClick={() => setIsSubExpanded(!isSubExpanded)}
            className="w-full flex items-center justify-between px-6 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <div className="flex items-center">
              <item.icon size={16} className="flex-shrink-0" />
              <span className="ml-2">{item.title}</span>
            </div>
            <ChevronRight
              size={14}
              className={`transform transition-transform ${
                isSubExpanded ? "rotate-90" : ""
              }`}
            />
          </button>

          {isSubExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.subItems.map((subItem, index) => (
                <NavItem key={index} item={subItem} isSubItem={true} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return <NavItem item={item} />;
  };

  const NavItem = ({ item, isSubItem = false }) => {
    const isActive =
      location.pathname === item.path ||
      (item.path !== "/" && location.pathname.startsWith(item.path));

    return (
      <NavLink
        to={item.path}
        className={({ isActive: linkActive }) => {
          const active = linkActive || isActive;
          return `flex items-center justify-between px-${
            isSubItem ? "8" : "6"
          } py-2 text-sm rounded-lg transition-colors ${
            active
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-700"
          }`;
        }}
      >
        <div className="flex items-center">
          <item.icon size={isSubItem ? 14 : 16} className="flex-shrink-0" />
          <span className="ml-2">{item.title}</span>
        </div>

        {item.badge && (
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              item.badge === "pending"
                ? "bg-red-500 text-white"
                : item.badge === "my"
                ? "bg-blue-500 text-white"
                : "bg-gray-500 text-white"
            }`}
          >
            {item.badge === "pending"
              ? "!"
              : item.badge === "my"
              ? "My"
              : item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  const workflowItems = getWorkflowMenuItems();
  const operationsItems = getOperationsMenuItems();
  const reportsItems = getReportsMenuItems();
  const adminItems = getAdminMenuItems();

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`bg-gray-800 text-white flex flex-col transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        } ${isMobile ? "fixed inset-y-0 left-0 z-50" : "relative"}`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 py-4 border-b border-gray-700 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          {!isCollapsed && (
            <div className="flex items-center">
              <Package size={24} className="text-blue-400" />
              <h1 className="ml-2 text-lg font-semibold">Quản lý kho</h1>
            </div>
          )}

          {/* Toggle button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        {/* User info & notifications */}
        {!isCollapsed && (
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-medium">
                  {user?.ho_ten?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="ml-2">
                  <p className="text-sm font-medium">
                    {user?.ho_ten || "User"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {user?.phong_ban_info?.ten_phong_ban || "N/A"}
                  </p>
                </div>
              </div>
              <NotificationBell />
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="px-2 py-3 border-b border-gray-700 flex justify-center">
            <NotificationBell compact />
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
          {/* Dashboard */}
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              } ${isCollapsed ? "justify-center" : ""}`
            }
          >
            <Home size={18} className="flex-shrink-0" />
            {!isCollapsed && <span className="ml-3">Dashboard</span>}
          </NavLink>

          {/* Workflow Section */}
          <NavSection
            title="Quy trình yêu cầu"
            icon={FileText}
            items={workflowItems}
            isExpanded={expandedSections.workflow}
            onToggle={toggleSection}
            sectionKey="workflow"
          />

          {/* Operations Section */}
          <NavSection
            title="Quản lý kho"
            icon={Package}
            items={operationsItems}
            isExpanded={expandedSections.operations}
            onToggle={toggleSection}
            sectionKey="operations"
          />

          {/* Reports Section */}
          <NavSection
            title="Báo cáo"
            icon={BarChart3}
            items={reportsItems}
            isExpanded={expandedSections.reports}
            onToggle={toggleSection}
            sectionKey="reports"
          />

          {/* Admin Section */}
          {adminItems.length > 0 && (
            <NavSection
              title="Quản trị"
              icon={Settings}
              items={adminItems}
              isExpanded={expandedSections.admin}
              onToggle={toggleSection}
              sectionKey="admin"
            />
          )}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="px-4 py-3 border-t border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>v2.0.0</span>
              <span>Workflow System</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
