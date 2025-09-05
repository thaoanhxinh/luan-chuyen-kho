// import React, { useState, useEffect, useRef } from "react";
// import { NavLink, useLocation } from "react-router-dom";
// import {
//   Home,
//   FileText,
//   ArrowDownToLine,
//   ArrowUpFromLine,
//   ClipboardCheck,
//   BarChart3,
//   Settings,
//   Users,
//   Clock,
//   AlertTriangle,
//   Building2,
//   Package,
//   Truck,
//   UserCheck,
//   FileSearch,
//   TrendingUp,
//   Archive,
//   Menu,
//   X,
//   CheckCircle,
// } from "lucide-react";
// import { useAuth } from "../../context/AuthContext";
// import NotificationBell from "../notifications/NotificationBell";

// const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
//   const { user } = useAuth();
//   const location = useLocation();
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

//   const handleMenuClick = (menuKey, event) => {
//     event.preventDefault();
//     setActiveDropdown(activeDropdown === menuKey ? null : menuKey);
//   };

//   // Helper function to check manager/admin roles
//   function isManagerOrAdmin(user) {
//     return (
//       user?.role === "admin" ||
//       ["HCK", "TMKH", "BTL"].includes(user?.phong_ban_info?.ma_phong_ban)
//     );
//   }

//   // Create manager/admin conditional items
//   const managerAdminItems = isManagerOrAdmin(user)
//     ? [
//         {
//           key: "workflow-history",
//           title: "Lịch sử phê duyệt",
//           path: "/workflow",
//           icon: CheckCircle,
//         },
//       ]
//     : [];

//   // Create admin conditional items
//   const adminMenuItems =
//     user?.role === "admin"
//       ? [
//           {
//             key: "admin",
//             title: "Quản trị",
//             icon: Settings,
//             type: "group",
//             items: [
//               {
//                 key: "admin-users",
//                 title: "Quản lý nhân viên",
//                 path: "/admin/nhan-vien",
//                 icon: Users,
//               },
//               {
//                 key: "admin-departments",
//                 title: "Quản lý phòng ban",
//                 path: "/admin/phong-ban",
//                 icon: Building2,
//               },
//               {
//                 key: "admin-settings",
//                 title: "Cài đặt hệ thống",
//                 path: "/settings",
//                 icon: Settings,
//               },
//             ],
//           },
//         ]
//       : [];

//   // Menu structure theo workflow nghiệp vụ
//   const menuItems = [
//     {
//       key: "dashboard",
//       title: "Dashboard",
//       icon: Home,
//       path: "/",
//       type: "single",
//     },
//     {
//       key: "requests",
//       title: "Yêu cầu",
//       icon: FileText,
//       type: "group",
//       items: [
//         {
//           key: "request-import",
//           title: "Tạo YC nhập kho",
//           path: "/yeu-cau-nhap",
//           icon: ArrowDownToLine,
//           action: "create",
//         },
//         {
//           key: "request-export",
//           title: "Tạo YC xuất kho",
//           path: "/yeu-cau-xuat",
//           icon: ArrowUpFromLine,
//           action: "create",
//         },
//         ...managerAdminItems,
//       ],
//     },
//     {
//       key: "warehouse",
//       title: "Quản lý kho",
//       icon: Package,
//       type: "group",
//       items: [
//         {
//           key: "warehouse-import",
//           title: "Nhập kho",
//           path: "/nhap-kho",
//           icon: ArrowDownToLine,
//         },
//         {
//           key: "warehouse-export",
//           title: "Xuất kho",
//           path: "/xuat-kho",
//           icon: ArrowUpFromLine,
//         },
//         {
//           key: "warehouse-inventory",
//           title: "Kiểm kê",
//           path: "/kiem-ke",
//           icon: ClipboardCheck,
//         },
//         {
//           key: "warehouse-stock",
//           title: "Tồn kho",
//           path: "/ton-kho",
//           icon: Archive,
//         },
//       ],
//     },
//     {
//       key: "catalog",
//       title: "Hàng hóa",
//       icon: Archive,
//       type: "group",
//       items: [
//         {
//           key: "catalog-products",
//           title: "Danh sách hàng hóa",
//           path: "/hang-hoa",
//           icon: Package,
//         },
//         {
//           key: "catalog-categories",
//           title: "Loại hàng hóa",
//           path: "/loai-hang-hoa",
//           icon: Archive,
//         },
//         {
//           key: "catalog-suppliers",
//           title: "Nhà cung cấp",
//           path: "/nha-cung-cap",
//           icon: Truck,
//         },
//         {
//           key: "catalog-receivers",
//           title: "Đơn vị nhận",
//           path: "/don-vi-nhan",
//           icon: Building2,
//         },
//       ],
//     },
//     {
//       key: "reports",
//       title: "Báo cáo",
//       icon: BarChart3,
//       type: "group",
//       items: [
//         {
//           key: "report-circulation",
//           title: "BC Luân chuyển",
//           path: "/bao-cao/luan-chuyen",
//           icon: TrendingUp,
//         },
//         {
//           key: "report-import",
//           title: "BC Nhập kho",
//           path: "/bao-cao/nhap",
//           icon: ArrowDownToLine,
//         },
//         {
//           key: "report-export",
//           title: "BC Xuất kho",
//           path: "/bao-cao/xuat",
//           icon: ArrowUpFromLine,
//         },
//         {
//           key: "report-receivers",
//           title: "TK Đơn vị nhận",
//           path: "/bao-cao/don-vi-nhan",
//           icon: Building2,
//         },
//         {
//           key: "report-suppliers",
//           title: "TK Nhà cung cấp",
//           path: "/bao-cao/nha-cung-cap",
//           icon: Truck,
//         },
//         {
//           key: "report-inventory",
//           title: "BC Kiểm kê",
//           path: "/bao-cao/kiem-ke",
//           icon: ClipboardCheck,
//         },
//       ],
//     },
//     ...adminMenuItems,
//   ];

//   // Render horizontal dropdown
//   const renderHorizontalDropdown = (menuKey, items) => {
//     if (activeDropdown !== menuKey) return null;

//     const buttonElement = document.getElementById(`menu-${menuKey}`);
//     if (!buttonElement) return null;

//     const buttonRect = buttonElement.getBoundingClientRect();
//     const sidebarWidth = isCollapsed ? 48 : 224;

//     return (
//       <div
//         ref={dropdownRef}
//         className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 max-h-96 overflow-y-auto"
//         style={{
//           left: sidebarWidth + 8,
//           top: buttonRect.top,
//           minWidth: "240px",
//         }}
//       >
//         {items.map((item) => {
//           const Icon = item.icon;
//           const isActive = location.pathname === item.path;

//           return (
//             <NavLink
//               key={item.key || item.path}
//               to={item.path}
//               onClick={() => {
//                 setActiveDropdown(null);
//                 // Handle create actions by opening modal instead of navigation
//                 if (item.action === "create") {
//                   // This will be handled by the page component to open create modal
//                 }
//               }}
//               className={`flex items-center space-x-3 px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${
//                 isActive
//                   ? "bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-600"
//                   : "text-gray-700"
//               }`}
//             >
//               <Icon size={16} />
//               <span>{item.title}</span>
//               {item.action === "create" && (
//                 <span className="ml-auto text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">
//                   Tạo
//                 </span>
//               )}
//             </NavLink>
//           );
//         })}
//       </div>
//     );
//   };

//   return (
//     <>
//       {/* FIXED SIDEBAR */}
//       <div
//         ref={sidebarRef}
//         className={`fixed top-0 left-0 h-screen bg-gray-800 text-white flex flex-col transition-all duration-300 z-40 ${
//           isCollapsed ? "w-12" : "w-56"
//         }`}
//       >
//         {/* Header */}
//         <div
//           className={`flex items-center justify-between px-3 py-3 border-b border-gray-700 h-16 flex-shrink-0 ${
//             isCollapsed ? "justify-center px-1" : ""
//           }`}
//         >
//           {!isCollapsed && (
//             <div className="flex items-center">
//               <Package size={20} className="text-blue-400" />
//               <h1 className="ml-2 text-sm font-semibold">Kho BTL Vùng</h1>
//             </div>
//           )}

//           <button
//             onClick={() => setIsCollapsed(!isCollapsed)}
//             className="p-1 rounded hover:bg-gray-700 transition-colors"
//             title={isCollapsed ? "Mở rộng" : "Thu gọn"}
//           >
//             {isCollapsed ? <Menu size={16} /> : <X size={16} />}
//           </button>
//         </div>

//         {/* User info */}
//         <div
//           className={`px-3 py-3 border-b border-gray-700 flex-shrink-0 ${
//             isCollapsed ? "px-1" : ""
//           }`}
//         >
//           {!isCollapsed ? (
//             <div className="flex items-center">
//               <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-xs font-medium">
//                 {user?.ho_ten?.charAt(0)?.toUpperCase() || "U"}
//               </div>
//               <div className="ml-2 min-w-0">
//                 <p className="text-xs font-medium truncate">
//                   {user?.ho_ten || "User"}
//                 </p>
//                 <p className="text-xs text-gray-400 truncate">
//                   {user?.phong_ban_info?.ten_phong_ban ||
//                     user?.phong_ban?.ten_phong_ban ||
//                     "N/A"}
//                 </p>
//               </div>
//               {/* Sử dụng NotificationBell component thay vì Bell icon */}
//               <div className="ml-auto">
//                 <NotificationBell compact={true} />
//               </div>
//             </div>
//           ) : (
//             <div className="flex flex-col items-center space-y-2">
//               <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-xs font-medium">
//                 {user?.ho_ten?.charAt(0)?.toUpperCase() || "U"}
//               </div>
//               {/* Sử dụng NotificationBell component cho sidebar collapsed */}
//               <NotificationBell compact={true} />
//             </div>
//           )}
//         </div>

//         {/* Navigation */}
//         <nav className="flex-1 px-2 py-3 overflow-hidden">
//           <div className="space-y-1">
//             {menuItems.map((menu) => {
//               const Icon = menu.icon;

//               if (menu.type === "single") {
//                 const isActive = location.pathname === menu.path;
//                 return (
//                   <NavLink
//                     key={menu.key}
//                     to={menu.path}
//                     className={`flex items-center px-2 py-2 text-sm font-medium rounded transition-colors ${
//                       isActive
//                         ? "bg-blue-600 text-white"
//                         : "text-gray-300 hover:text-white hover:bg-gray-700"
//                     } ${isCollapsed ? "justify-center px-1" : ""}`}
//                     title={isCollapsed ? menu.title : ""}
//                   >
//                     <Icon size={16} className="flex-shrink-0" />
//                     {!isCollapsed && <span className="ml-2">{menu.title}</span>}
//                   </NavLink>
//                 );
//               }

//               // Group menu
//               const hasActiveChild = menu.items.some(
//                 (item) =>
//                   location.pathname === item.path ||
//                   (item.path !== "/" && location.pathname.startsWith(item.path))
//               );

//               return (
//                 <button
//                   key={menu.key}
//                   id={`menu-${menu.key}`}
//                   onClick={(e) => handleMenuClick(menu.key, e)}
//                   className={`w-full flex items-center px-2 py-2 text-sm font-medium rounded transition-colors ${
//                     isCollapsed ? "justify-center px-1" : ""
//                   } ${
//                     activeDropdown === menu.key || hasActiveChild
//                       ? "bg-gray-700 text-white"
//                       : "text-gray-300 hover:text-white hover:bg-gray-700"
//                   }`}
//                   title={isCollapsed ? menu.title : ""}
//                 >
//                   <Icon size={16} className="flex-shrink-0" />
//                   {!isCollapsed && (
//                     <>
//                       <span className="ml-2">{menu.title}</span>
//                       {hasActiveChild && (
//                         <div className="w-2 h-2 bg-blue-400 rounded-full ml-auto"></div>
//                       )}
//                     </>
//                   )}
//                 </button>
//               );
//             })}
//           </div>
//         </nav>

//         {/* Footer */}
//         {!isCollapsed && (
//           <div className="px-3 py-2 border-t border-gray-700 flex-shrink-0">
//             <div className="text-xs text-gray-400">
//               <div className="flex items-center justify-between">
//                 <span>v2.0 Workflow</span>
//                 <span className="text-green-400">●</span>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* HORIZONTAL DROPDOWNS */}
//       {menuItems.map(
//         (menu) =>
//           menu.type === "group" &&
//           renderHorizontalDropdown(menu.key, menu.items)
//       )}
//     </>
//   );
// };

// export default Sidebar;

// Sidebar.jsx - Fixed: Removed NotificationBell & Fixed unique keys
import React, { useState, useEffect, useRef } from "react";
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
  Building2,
  Package,
  Truck,
  TrendingUp,
  Archive,
  Menu,
  X,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const sidebarRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMenuClick = (menuKey, event) => {
    event.preventDefault();
    setActiveDropdown(activeDropdown === menuKey ? null : menuKey);
  };

  // Helper function to check manager/admin roles
  function isManagerOrAdmin(user) {
    return (
      user?.role === "admin" ||
      ["HCK", "TMKH", "BTL"].includes(user?.phong_ban_info?.ma_phong_ban)
    );
  }

  // Create manager/admin conditional items
  const managerAdminItems = isManagerOrAdmin(user)
    ? [
        {
          key: "workflow-history",
          title: "Lịch sử phê duyệt",
          path: "/workflow",
          icon: CheckCircle,
        },
      ]
    : [];

  // Build Admin group items per role
  const accountItem = {
    key: "admin-account",
    title: "Quản lý tài khoản",
    path: "/quan-ly-tai-khoan",
    icon: Settings,
  };

  let adminGroupItems = [accountItem];
  if (user?.role === "admin" || user?.role === "manager") {
    adminGroupItems = [
      {
        key: "admin-users",
        title: "Quản lý nhân viên",
        path: "/admin/nhan-vien",
        icon: Users,
      },
      {
        key: "admin-departments",
        title: "Quản lý phòng ban",
        path: "/admin/phong-ban",
        icon: Building2,
      },
      accountItem,
    ];
  }

  const adminMenuItems = [
    {
      key: "admin",
      title: "Quản trị",
      icon: Settings,
      type: "group",
      items: adminGroupItems,
    },
  ];

  // Menu structure theo workflow nghiệp vụ
  const menuItems = [
    {
      key: "dashboard",
      title: "Dashboard",
      icon: Home,
      path: "/",
      type: "single",
    },
    // Removed group "Yêu cầu" per new requirement
    {
      key: "warehouse",
      title: "Quản lý kho",
      icon: Package,
      type: "group",
      items: [
        {
          key: "warehouse-import",
          title: "Nhập kho",
          path: "/nhap-kho",
          icon: ArrowDownToLine,
        },
        {
          key: "warehouse-export",
          title: "Xuất kho",
          path: "/xuat-kho",
          icon: ArrowUpFromLine,
        },
        {
          key: "warehouse-inventory",
          title: "Kiểm kê",
          path: "/kiem-ke",
          icon: ClipboardCheck,
        },
        {
          key: "warehouse-stock",
          title: "Tồn kho",
          path: "/ton-kho",
          icon: Archive,
        },
      ],
    },
    {
      key: "catalog",
      title: "Hàng hóa",
      icon: Archive,
      type: "group",
      items: [
        {
          key: "catalog-products",
          title: "Danh sách hàng hóa",
          path: "/hang-hoa",
          icon: Package,
        },
        {
          key: "catalog-categories",
          title: "Loại hàng hóa",
          path: "/loai-hang-hoa",
          icon: Archive,
        },
        {
          key: "catalog-suppliers",
          title: "Nhà cung cấp",
          path: "/nha-cung-cap",
          icon: Truck,
        },
        {
          key: "catalog-receivers",
          title: "Đơn vị nhận",
          path: "/don-vi-nhan",
          icon: Building2,
        },
      ],
    },
    {
      key: "reports",
      title: "Báo cáo",
      icon: BarChart3,
      type: "group",
      items: [
        {
          key: "report-circulation",
          title: "BC Luân chuyển",
          path: "/bao-cao/luan-chuyen",
          icon: TrendingUp,
        },
        {
          key: "report-import",
          title: "BC Nhập kho",
          path: "/bao-cao/nhap",
          icon: ArrowDownToLine,
        },
        {
          key: "report-export",
          title: "BC Xuất kho",
          path: "/bao-cao/xuat",
          icon: ArrowUpFromLine,
        },
        {
          key: "report-receivers",
          title: "TK Đơn vị nhận",
          path: "/bao-cao/don-vi-nhan",
          icon: Building2,
        },
        {
          key: "report-suppliers",
          title: "TK Nhà cung cấp",
          path: "/bao-cao/nha-cung-cap",
          icon: Truck,
        },
        {
          key: "report-inventory",
          title: "BC Kiểm kê",
          path: "/bao-cao/kiem-ke",
          icon: ClipboardCheck,
        },
      ],
    },
    ...adminMenuItems,
  ];

  // Render horizontal dropdown
  const renderHorizontalDropdown = (menuKey, items) => {
    if (activeDropdown !== menuKey) return null;

    const buttonElement = document.getElementById(`menu-${menuKey}`);
    if (!buttonElement) return null;

    const buttonRect = buttonElement.getBoundingClientRect();
    const sidebarWidth = isCollapsed ? 48 : 224;

    return (
      <div
        key={`dropdown-${menuKey}`}
        ref={dropdownRef}
        className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 max-h-96 overflow-y-auto"
        style={{
          left: sidebarWidth + 8,
          top: buttonRect.top,
          minWidth: "240px",
        }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={`dropdown-item-${item.key}`}
              to={item.path}
              onClick={() => {
                setActiveDropdown(null);
                // Handle create actions by opening modal instead of navigation
                if (item.action === "create") {
                  // This will be handled by the page component to open create modal
                }
              }}
              className={`flex items-center space-x-3 px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-600"
                  : "text-gray-700"
              }`}
            >
              <Icon size={16} />
              <span>{item.title}</span>
              {item.action === "create" && (
                <span className="ml-auto text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">
                  Tạo
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* FIXED SIDEBAR */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-screen bg-gray-800 text-white flex flex-col transition-all duration-300 z-40 ${
          isCollapsed ? "w-12" : "w-56"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-3 py-3 border-b border-gray-700 h-16 flex-shrink-0 ${
            isCollapsed ? "justify-center px-1" : ""
          }`}
        >
          {!isCollapsed && (
            <div className="flex items-center">
              <Package size={20} className="text-blue-400" />
              <h1 className="ml-2 text-sm font-semibold">Kho BTL Vùng</h1>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-gray-700 transition-colors"
            title={isCollapsed ? "Mở rộng" : "Thu gọn"}
          >
            {isCollapsed ? <Menu size={16} /> : <X size={16} />}
          </button>
        </div>

        {/* User info - Removed NotificationBell */}
        <div
          className={`px-3 py-3 border-b border-gray-700 flex-shrink-0 ${
            isCollapsed ? "px-1" : ""
          }`}
        >
          {!isCollapsed ? (
            <div className="flex items-center">
              <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-xs font-medium">
                {user?.ho_ten?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="ml-2 min-w-0 flex-1">
                <p className="text-xs font-medium truncate">
                  {user?.ho_ten || "User"}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.phong_ban_info?.ten_phong_ban ||
                    user?.phong_ban?.ten_phong_ban ||
                    "N/A"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-xs font-medium">
                {user?.ho_ten?.charAt(0)?.toUpperCase() || "U"}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 overflow-hidden">
          <div className="space-y-1">
            {menuItems.map((menu) => {
              const Icon = menu.icon;

              if (menu.type === "single") {
                const isActive = location.pathname === menu.path;
                return (
                  <NavLink
                    key={menu.key}
                    to={menu.path}
                    className={`flex items-center px-2 py-2 text-sm font-medium rounded transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:text-white hover:bg-gray-700"
                    } ${isCollapsed ? "justify-center px-1" : ""}`}
                    title={isCollapsed ? menu.title : ""}
                  >
                    <Icon size={16} className="flex-shrink-0" />
                    {!isCollapsed && <span className="ml-2">{menu.title}</span>}
                  </NavLink>
                );
              }

              // Group menu
              const hasActiveChild = menu.items.some(
                (item) =>
                  location.pathname === item.path ||
                  (item.path !== "/" && location.pathname.startsWith(item.path))
              );

              return (
                <button
                  key={menu.key}
                  id={`menu-${menu.key}`}
                  onClick={(e) => handleMenuClick(menu.key, e)}
                  className={`w-full flex items-center px-2 py-2 text-sm font-medium rounded transition-colors ${
                    isCollapsed ? "justify-center px-1" : ""
                  } ${
                    activeDropdown === menu.key || hasActiveChild
                      ? "bg-gray-700 text-white"
                      : "text-gray-300 hover:text-white hover:bg-gray-700"
                  }`}
                  title={isCollapsed ? menu.title : ""}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="ml-2">{menu.title}</span>
                      {hasActiveChild && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full ml-auto"></div>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="px-3 py-2 border-t border-gray-700 flex-shrink-0">
            <div className="text-xs text-gray-400">
              <div className="flex items-center justify-between">
                <span>v2.0 Workflow</span>
                <span className="text-green-400">●</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* HORIZONTAL DROPDOWNS */}
      {menuItems.map(
        (menu) =>
          menu.type === "group" &&
          renderHorizontalDropdown(menu.key, menu.items)
      )}
    </>
  );
};

export default Sidebar;
