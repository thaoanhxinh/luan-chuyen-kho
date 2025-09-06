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
  TrendingUp,
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";

// Tab Components
import LuanChuyenReport from "../components/reports/LuanChuyenReport";
import BaoCaoNhapReport from "../components/reports/BaoCaoNhapReport";
import BaoCaoXuatReport from "../components/reports/BaoCaoXuatReport";
import ThongKeDonViNhanReport from "../components/reports/ThongKeDonViNhanReport";
import ThongKeNhaCungCapReport from "../components/reports/ThongKeNhaCungCapReport";

const ReportManagement = ({ user }) => {
  const [activeTab, setActiveTab] = useState("luanchuyen");

  const tabs = [
    {
      id: "luanchuyen",
      name: "Luân chuyển hàng hóa",
      icon: ArrowLeftRight,
      description: "Báo cáo luân chuyển kho theo quý/năm",
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
      description: "Thống kê hoạt động của các đơn vị nhận",
      component: ThongKeDonViNhanReport,
    },
    {
      id: "thongkenhacungcap",
      name: "Thống kê nhà cung cấp",
      icon: Truck,
      description: "Thống kê hoạt động của các nhà cung cấp",
      component: ThongKeNhaCungCapReport,
    },
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Hệ thống báo cáo"
        subtitle="Quản lý và xuất báo cáo toàn diện"
        Icon={BarChart3}
      />

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center space-x-2 rounded-t-lg transition-all duration-200`}
                >
                  <Icon size={18} />
                  <div className="text-left">
                    <div>{tab.name}</div>
                    <div className="text-xs opacity-75">{tab.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {ActiveComponent && <ActiveComponent user={user} />}
      </div>
    </div>
  );
};

export default ReportManagement;
