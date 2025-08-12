// import React, { useState, useEffect } from "react";
// import {
//   FileText,
//   Download,
//   BarChart3,
//   Package,
//   TrendingUp,
//   Filter,
//   Calendar,
// } from "lucide-react";
// import { baoCaoService } from "../services/baoCaoService";
// import Loading from "../components/common/Loading";
// import Modal from "../components/common/Modal";
// import TonKhoReport from "../components/reports/TonKhoReport";
// import NhapXuatReport from "../components/reports/NhapXuatReport";
// import KiemKeReport from "../components/reports/KiemKeReport";
// import ReportFilters from "../components/reports/ReportFilters";
// import toast from "react-hot-toast";

// const BaoCao = () => {
//   const [activeTab, setActiveTab] = useState("ton-kho");
//   const [filters, setFilters] = useState({
//     tu_ngay: "",
//     den_ngay: "",
//     loai_hang_hoa: "",
//     pham_chat: "",
//     phong_ban_id: "",
//   });
//   const [reportData, setReportData] = useState({
//     tonKho: null,
//     nhapXuat: null,
//     kiemKe: null,
//   });
//   const [isLoading, setIsLoading] = useState(false);
//   const [showFilterModal, setShowFilterModal] = useState(false);

//   const tabs = [
//     {
//       id: "ton-kho",
//       label: "Báo cáo tồn kho",
//       icon: Package,
//       color: "blue",
//     },
//     {
//       id: "nhap-xuat",
//       label: "Báo cáo nhập xuất",
//       icon: TrendingUp,
//       color: "green",
//     },
//     {
//       id: "kiem-ke",
//       label: "Báo cáo kiểm kê",
//       icon: BarChart3,
//       color: "purple",
//     },
//   ];

//   useEffect(() => {
//     fetchReportData();
//   }, [activeTab, filters]);

//   const fetchReportData = async () => {
//     try {
//       setIsLoading(true);

//       const queryParams = {
//         ...filters,
//         page: 1,
//         limit: 50, // Lấy nhiều dữ liệu hơn cho báo cáo
//       };

//       let response;
//       switch (activeTab) {
//         case "ton-kho":
//           response = await baoCaoService.getTonKhoReport(queryParams);
//           setReportData((prev) => ({ ...prev, tonKho: response.data }));
//           break;
//         case "nhap-xuat":
//           response = await baoCaoService.getNhapXuatReport(queryParams);
//           setReportData((prev) => ({ ...prev, nhapXuat: response.data }));
//           break;
//         case "kiem-ke":
//           response = await baoCaoService.getKiemKeReport(queryParams);
//           setReportData((prev) => ({ ...prev, kiemKe: response.data }));
//           break;
//         default:
//           break;
//       }
//     } catch (error) {
//       console.error("Error fetching report data:", error);
//       toast.error(`Không thể tải dữ liệu báo cáo ${getTabLabel(activeTab)}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const getTabLabel = (tabId) => {
//     const tab = tabs.find((t) => t.id === tabId);
//     return tab ? tab.label.toLowerCase() : "";
//   };

//   const handleFiltersChange = (newFilters) => {
//     setFilters(newFilters);
//   };

//   const renderCurrentReport = () => {
//     if (isLoading) {
//       return (
//         <div className="flex items-center justify-center h-64">
//           <Loading size="large" />
//         </div>
//       );
//     }

//     switch (activeTab) {
//       case "ton-kho":
//         return <TonKhoReport data={reportData.tonKho} filters={filters} />;
//       case "nhap-xuat":
//         return <NhapXuatReport data={reportData.nhapXuat} filters={filters} />;
//       case "kiem-ke":
//         return <KiemKeReport data={reportData.kiemKe} filters={filters} />;
//       default:
//         return (
//           <div className="text-center py-12">
//             <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
//             <h3 className="text-lg font-medium text-gray-900 mb-2">
//               Chọn loại báo cáo
//             </h3>
//             <p className="text-gray-600">
//               Vui lòng chọn một tab báo cáo để xem dữ liệu
//             </p>
//           </div>
//         );
//     }
//   };

//   return (
//     <div className="space-y-4">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-xl font-bold text-gray-900 flex items-center">
//             <BarChart3 className="mr-3 h-5 w-5 text-blue-600" />
//             Báo cáo và thống kê
//           </h1>
//         </div>
//       </div>

//       {/* Tabs Navigation */}
//       <div className="border-b border-gray-200 bg-white rounded-lg shadow-sm">
//         <nav className="flex space-x-8 px-6">
//           {tabs.map((tab) => {
//             const Icon = tab.icon;
//             const isActive = activeTab === tab.id;
//             return (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
//                   isActive
//                     ? `border-${tab.color}-500 text-${tab.color}-600`
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 }`}
//               >
//                 <Icon size={18} />
//                 <span>{tab.label}</span>
//               </button>
//             );
//           })}
//         </nav>
//       </div>

//       {/* Report Content */}
//       <div className="min-h-[400px]">{renderCurrentReport()}</div>

//       {/* Filter Modal */}
//       <Modal
//         isOpen={showFilterModal}
//         onClose={() => setShowFilterModal(false)}
//         title="Bộ lọc báo cáo"
//         size="lg"
//       >
//         <ReportFilters
//           filters={filters}
//           onChange={handleFiltersChange}
//           onClose={() => setShowFilterModal(false)}
//           reportType={activeTab}
//         />
//       </Modal>
//     </div>
//   );
// };

// export default BaoCao;

import React, { useState } from "react";
import {
  FileText,
  ArrowLeftRight,
  ArrowDown,
  ArrowUp,
  Building2,
  Truck,
  Calendar,
  Download,
  BarChart3,
  RefreshCw,
} from "lucide-react";

// Import các component con cho từng tab
import LuanChuyenReport from "../components/reports/LuanChuyenReport";
import BaoCaoNhapReport from "../components/reports/BaoCaoNhapReport";
import BaoCaoXuatReport from "../components/reports/BaoCaoXuatReport";
import ThongKeDonViNhanReport from "../components/reports/ThongKeDonViNhanReport";
import ThongKeNhaCungCapReport from "../components/reports/ThongKeNhaCungCapReport";

const BaoCao = ({ user }) => {
  const [activeTab, setActiveTab] = useState("luanchuyen");

  const tabs = [
    {
      id: "luanchuyen",
      name: "Luân chuyển kho",
      icon: ArrowLeftRight,
      description: "Báo cáo luân chuyển theo quý/năm",
      component: LuanChuyenReport,
    },
    {
      id: "baocaonhap",
      name: "Báo cáo nhập",
      icon: ArrowDown,
      description: "Danh sách phiếu nhập theo thời gian",
      component: BaoCaoNhapReport,
    },
    {
      id: "baocaoxuat",
      name: "Báo cáo xuất",
      icon: ArrowUp,
      description: "Danh sách phiếu xuất theo thời gian",
      component: BaoCaoXuatReport,
    },
    {
      id: "thongkedonvinhan",
      name: "Thống kê đơn vị nhận",
      icon: Building2,
      description: "Thống kê hoạt động đơn vị nhận",
      component: ThongKeDonViNhanReport,
    },
    {
      id: "thongkenhacungcap",
      name: "Thống kê nhà cung cấp",
      icon: Truck,
      description: "Thống kê hoạt động nhà cung cấp",
      component: ThongKeNhaCungCapReport,
    },
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="mr-3 h-5 w-5 text-blue-600" />
            Hệ thống báo cáo
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Quản lý và xuất báo cáo toàn diện
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600">
            <Calendar className="h-4 w-4 inline mr-1" />
            {new Date().toLocaleDateString("vi-VN")}
          </div>
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {user?.role === "admin" ? "Quản trị viên" : "Người dùng"}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <nav className="flex space-x-2 p-2" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? "bg-blue-100 text-blue-700 border-blue-200"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-transparent"
                } px-3 py-2 rounded-md text-sm font-medium border transition-all duration-200 flex items-center space-x-2 min-w-0 flex-1`}
              >
                <Icon size={16} className="flex-shrink-0" />
                <div className="text-left min-w-0 flex-1">
                  <div className="truncate">{tab.name}</div>
                  <div className="text-xs opacity-75 truncate">
                    {tab.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {ActiveComponent && <ActiveComponent user={user} />}
      </div>
    </div>
  );
};

export default BaoCao;
