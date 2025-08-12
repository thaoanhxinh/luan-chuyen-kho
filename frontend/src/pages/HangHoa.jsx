// import React, { useState, useEffect } from "react";
// import {
//   Package,
//   Search,
//   Plus,
//   Edit,
//   Trash2,
//   Eye,
//   TrendingUp,
//   BarChart3,
//   DollarSign,
//   AlertTriangle,
// } from "lucide-react";
// import { hangHoaService } from "../services/hangHoaService";
// import { formatCurrency } from "../utils/helpers";
// import Pagination from "../components/common/Pagination";
// import Loading from "../components/common/Loading";
// import HangHoaDetailModal from "../components/HangHoaDetailModal";
// import toast from "react-hot-toast";

// const HangHoa = () => {
//   const [currentPage, setCurrentPage] = useState(1);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [data, setData] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [showDetailModal, setShowDetailModal] = useState(false);
//   const [selectedHangHoaId, setSelectedHangHoaId] = useState(null);

//   const hangHoaList = data?.data?.items || [];
//   const pagination = data?.data?.pagination || {};

//   const fetchData = async () => {
//     try {
//       setIsLoading(true);
//       const response = await hangHoaService.getList({
//         page: currentPage,
//         limit: 20,
//         search: searchTerm,
//       });
//       setData(response);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       toast.error("Không thể tải dữ liệu hàng hóa");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, [currentPage, searchTerm]);

//   const handleViewDetail = (hangHoaId) => {
//     setSelectedHangHoaId(hangHoaId);
//     setShowDetailModal(true);
//   };

//   const handleCloseDetail = () => {
//     setShowDetailModal(false);
//     setSelectedHangHoaId(null);
//   };

//   const getInventoryStatusColor = (soLuongTon) => {
//     if (!soLuongTon || soLuongTon === 0) return "text-red-600";
//     if (soLuongTon < 10) return "text-yellow-600";
//     return "text-green-600";
//   };

//   const getInventoryStatusBadge = (soLuongTon) => {
//     if (!soLuongTon || soLuongTon === 0) return "bg-red-100 text-red-800";
//     if (soLuongTon < 10) return "bg-yellow-100 text-yellow-800";
//     return "bg-green-100 text-green-800";
//   };

//   const getInventoryStatusText = (soLuongTon) => {
//     if (!soLuongTon || soLuongTon === 0) return "Hết hàng";
//     if (soLuongTon < 10) return "Sắp hết";
//     return "Còn hàng";
//   };

//   const formatInteger = (value) => {
//     if (!value) return "0";
//     return Math.floor(value).toLocaleString();
//   };

//   const calculateStats = () => {
//     const total = hangHoaList.length;
//     const inStock = hangHoaList.filter((h) => h.so_luong_ton > 0).length;
//     const lowStock = hangHoaList.filter(
//       (h) => h.so_luong_ton > 0 && h.so_luong_ton < 10
//     ).length;
//     const outOfStock = hangHoaList.filter(
//       (h) => !h.so_luong_ton || h.so_luong_ton === 0
//     ).length;
//     const totalValue = hangHoaList.reduce((sum, h) => {
//       const giaTriTon = parseFloat(h.gia_tri_ton) || 0;
//       return sum + giaTriTon;
//     }, 0);

//     return { total, inStock, lowStock, outOfStock, totalValue };
//   };

//   const stats = calculateStats();

//   return (
//     <div className="space-y-4">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-xl font-bold text-gray-900 flex items-center">
//             <Package className="mr-2 h-5 w-5 text-blue-600" />
//             Quản lý hàng hóa
//           </h1>
//           <p className="mt-1 text-sm text-gray-600">
//             Quản lý thông tin hàng hóa, tồn kho và lịch sử giá
//           </p>
//         </div>
//         <button
//           onClick={() => {
//             /* Handle create */
//           }}
//           className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors text-sm"
//         >
//           <Plus size={16} />
//           <span>Thêm hàng hóa</span>
//         </button>
//       </div>

//       {/* Quick Stats */}
//       <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
//         <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
//           <div className="flex items-center">
//             <Package className="h-5 w-5 text-blue-600 mr-2" />
//             <div>
//               <div className="text-xs text-gray-500">Tổng HH</div>
//               <div className="text-lg font-bold text-gray-900">
//                 {stats.total}
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
//           <div className="flex items-center">
//             <BarChart3 className="h-5 w-5 text-green-600 mr-2" />
//             <div>
//               <div className="text-xs text-gray-500">Còn hàng</div>
//               <div className="text-lg font-bold text-green-600">
//                 {stats.inStock}
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
//           <div className="flex items-center">
//             <TrendingUp className="h-5 w-5 text-yellow-600 mr-2" />
//             <div>
//               <div className="text-xs text-gray-500">Sắp hết</div>
//               <div className="text-lg font-bold text-yellow-600">
//                 {stats.lowStock}
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
//           <div className="flex items-center">
//             <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
//             <div>
//               <div className="text-xs text-gray-500">Hết hàng</div>
//               <div className="text-lg font-bold text-red-600">
//                 {stats.outOfStock}
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
//           <div className="flex items-center">
//             <DollarSign className="h-5 w-5 text-purple-600 mr-2" />
//             <div>
//               <div className="text-xs text-gray-500">Giá trị tồn</div>
//               <div className="text-sm font-bold text-purple-600">
//                 {formatCurrency(stats.totalValue)}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Search */}
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
//         <div className="relative">
//           <Search
//             className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
//             size={16}
//           />
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
//             placeholder="Tìm kiếm theo tên hoặc mã hàng hóa..."
//           />
//         </div>
//       </div>

//       {/* Table */}
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
//         {isLoading ? (
//           <div className="flex items-center justify-center py-12">
//             <Loading size="large" />
//           </div>
//         ) : (
//           <>
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-gray-50 border-b border-gray-200">
//                   <tr>
//                     <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
//                       Hàng hóa
//                     </th>
//                     <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
//                       Loại / ĐVT
//                     </th>
//                     <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
//                       Giá gần nhất
//                     </th>
//                     <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
//                       Tồn kho
//                     </th>
//                     <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
//                       Giá trị tồn
//                     </th>
//                     <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
//                       Trạng thái
//                     </th>
//                     <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
//                       Thao tác
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200">
//                   {hangHoaList.map((hangHoa) => (
//                     <tr
//                       key={hangHoa.id}
//                       className="hover:bg-gray-50 transition-colors"
//                     >
//                       <td className="px-3 py-2">
//                         <div className="text-sm text-gray-900 font-medium">
//                           {hangHoa.ten_hang_hoa}
//                         </div>
//                         <div className="text-xs text-gray-500 mt-1">
//                           Mã: {hangHoa.ma_hang_hoa}
//                         </div>
//                         <div className="text-xs text-gray-500">
//                           {hangHoa.ten_phong_ban}
//                         </div>
//                       </td>
//                       <td className="px-3 py-2 whitespace-nowrap">
//                         <div className="text-xs text-gray-900">
//                           {hangHoa.ten_loai || "Chưa phân loại"}
//                         </div>
//                         <div className="text-xs text-gray-500 mt-1">
//                           {hangHoa.don_vi_tinh}
//                         </div>
//                       </td>
//                       <td className="px-3 py-2 whitespace-nowrap text-right">
//                         <div className="text-sm font-medium text-green-600">
//                           {hangHoa.gia_nhap_gan_nhat > 0
//                             ? formatCurrency(hangHoa.gia_nhap_gan_nhat)
//                             : "Chưa có"}
//                         </div>
//                         {hangHoa.don_gia_binh_quan > 0 &&
//                           hangHoa.don_gia_binh_quan !==
//                             hangHoa.gia_nhap_gan_nhat && (
//                             <div className="text-xs text-blue-600 mt-1">
//                               BQ: {formatCurrency(hangHoa.don_gia_binh_quan)}
//                             </div>
//                           )}
//                       </td>
//                       <td className="px-3 py-2 whitespace-nowrap text-right">
//                         <div
//                           className={`text-sm font-medium ${getInventoryStatusColor(
//                             hangHoa.so_luong_ton
//                           )}`}
//                         >
//                           {formatInteger(hangHoa.so_luong_ton)}
//                         </div>
//                         {hangHoa.so_lan_nhap > 0 && (
//                           <div className="text-xs text-gray-500 mt-1">
//                             {hangHoa.so_lan_nhap} lần nhập
//                           </div>
//                         )}
//                       </td>
//                       <td className="px-3 py-2 whitespace-nowrap text-right">
//                         <div className="text-sm font-medium text-gray-900">
//                           {hangHoa.gia_tri_ton && hangHoa.gia_tri_ton > 0
//                             ? formatCurrency(hangHoa.gia_tri_ton)
//                             : "0 ₫"}
//                         </div>
//                       </td>
//                       <td className="px-3 py-2 whitespace-nowrap text-center">
//                         <span
//                           className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getInventoryStatusBadge(
//                             hangHoa.so_luong_ton
//                           )}`}
//                         >
//                           {getInventoryStatusText(hangHoa.so_luong_ton)}
//                         </span>
//                         {hangHoa.co_so_seri && (
//                           <div className="text-xs text-blue-600 mt-1">
//                             Có số seri
//                           </div>
//                         )}
//                       </td>
//                       <td className="px-3 py-2 whitespace-nowrap text-center">
//                         <div className="flex items-center justify-center space-x-1">
//                           <button
//                             onClick={() => handleViewDetail(hangHoa.id)}
//                             className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all"
//                             title="Xem chi tiết"
//                           >
//                             <Eye size={14} />
//                           </button>

//                           <button
//                             onClick={() => {
//                               /* Handle edit */
//                             }}
//                             className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded transition-all"
//                             title="Chỉnh sửa"
//                           >
//                             <Edit size={14} />
//                           </button>

//                           <button
//                             onClick={() => {
//                               /* Handle delete */
//                             }}
//                             className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all"
//                             title="Xóa"
//                           >
//                             <Trash2 size={14} />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {hangHoaList.length === 0 && (
//               <div className="text-center py-8">
//                 <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
//                 <h3 className="text-sm font-medium text-gray-900 mb-1">
//                   Không có dữ liệu
//                 </h3>
//                 <p className="text-xs text-gray-500">
//                   Chưa có hàng hóa nào được tạo.
//                 </p>
//               </div>
//             )}

//             {pagination.pages > 1 && (
//               <div className="px-4 py-3 border-t border-gray-200">
//                 <Pagination
//                   currentPage={pagination.page || 1}
//                   totalPages={pagination.pages || 1}
//                   onPageChange={setCurrentPage}
//                 />
//               </div>
//             )}
//           </>
//         )}
//       </div>

//       {/* Detail Modal */}
//       <HangHoaDetailModal
//         hangHoaId={selectedHangHoaId}
//         isOpen={showDetailModal}
//         onClose={handleCloseDetail}
//       />
//     </div>
//   );
// };

// export default HangHoa;

import React, { useState, useEffect } from "react";
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  BarChart3,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { hangHoaService } from "../services/hangHoaService";
import { formatCurrency } from "../utils/helpers";
import Pagination from "../components/common/Pagination";
import Loading from "../components/common/Loading";
import HangHoaDetailModal from "../components/details/HangHoaDetailModal";
import EditHangHoaModal from "../components/forms/EditHangHoaModal";
import toast from "react-hot-toast";

const HangHoa = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHangHoaId, setSelectedHangHoaId] = useState(null);

  const hangHoaList = data?.data?.items || [];
  const pagination = data?.data?.pagination || {};

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await hangHoaService.getList({
        page: currentPage,
        limit: 20,
        search: searchTerm,
      });
      setData(response);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Không thể tải dữ liệu hàng hóa");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm]);

  const handleViewDetail = (hangHoaId) => {
    setSelectedHangHoaId(hangHoaId);
    setShowDetailModal(true);
  };

  const handleEditHangHoa = (hangHoaId) => {
    setSelectedHangHoaId(hangHoaId);
    setShowEditModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedHangHoaId(null);
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setSelectedHangHoaId(null);
  };

  const handleEditSuccess = () => {
    fetchData();
  };

  const handleDeleteHangHoa = async (hangHoaId, tenHangHoa) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa hàng hóa "${tenHangHoa}"?\n\nLưu ý: Chỉ có thể xóa hàng hóa chưa có giao dịch và không còn tồn kho.`
      )
    ) {
      return;
    }

    try {
      const loadingToast = toast.loading("Đang xóa hàng hóa...");

      await hangHoaService.delete(hangHoaId);

      toast.dismiss(loadingToast);
      toast.success("Xóa hàng hóa thành công!");
      fetchData();
    } catch (error) {
      console.error("Error deleting hang hoa:", error);
      const errorMessage =
        error.response?.data?.message || "Không thể xóa hàng hóa";
      toast.error(errorMessage);
    }
  };

  const getInventoryStatusColor = (soLuongTon) => {
    if (!soLuongTon || soLuongTon === 0) return "text-red-600";
    if (soLuongTon < 10) return "text-yellow-600";
    return "text-green-600";
  };

  const getInventoryStatusBadge = (soLuongTon) => {
    if (!soLuongTon || soLuongTon === 0) return "bg-red-100 text-red-800";
    if (soLuongTon < 10) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getInventoryStatusText = (soLuongTon) => {
    if (!soLuongTon || soLuongTon === 0) return "Hết hàng";
    if (soLuongTon < 10) return "Sắp hết";
    return "Còn hàng";
  };

  const formatInteger = (value) => {
    if (!value) return "0";
    return Math.floor(value).toLocaleString();
  };

  const calculateStats = () => {
    const total = hangHoaList.length;
    const inStock = hangHoaList.filter((h) => h.so_luong_ton > 0).length;
    const lowStock = hangHoaList.filter(
      (h) => h.so_luong_ton > 0 && h.so_luong_ton < 10
    ).length;
    const outOfStock = hangHoaList.filter(
      (h) => !h.so_luong_ton || h.so_luong_ton === 0
    ).length;
    const totalValue = hangHoaList.reduce((sum, h) => {
      const giaTriTon = parseFloat(h.gia_tri_ton) || 0;
      return sum + giaTriTon;
    }, 0);

    return { total, inStock, lowStock, outOfStock, totalValue };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <Package className="mr-2 h-5 w-5 text-blue-600" />
            Quản lý hàng hóa
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Quản lý thông tin hàng hóa, tồn kho và lịch sử giá
          </p>
        </div>
        <button
          onClick={() => {
            toast.info("Tính năng thêm mới hàng hóa đang được phát triển");
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors text-sm"
        >
          <Plus size={16} />
          <span>Thêm hàng hóa</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Package className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <div className="text-xs text-gray-500">Tổng HH</div>
              <div className="text-lg font-bold text-gray-900">
                {stats.total}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <BarChart3 className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <div className="text-xs text-gray-500">Còn hàng</div>
              <div className="text-lg font-bold text-green-600">
                {stats.inStock}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <div className="text-xs text-gray-500">Sắp hết</div>
              <div className="text-lg font-bold text-yellow-600">
                {stats.lowStock}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <div className="text-xs text-gray-500">Hết hàng</div>
              <div className="text-lg font-bold text-red-600">
                {stats.outOfStock}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-purple-600 mr-2" />
            <div>
              <div className="text-xs text-gray-500">Giá trị tồn</div>
              <div className="text-sm font-bold text-purple-600">
                {formatCurrency(stats.totalValue)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            placeholder="Tìm kiếm theo tên hoặc mã hàng hóa..."
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loading size="large" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Hàng hóa
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Loại / ĐVT
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Giá gần nhất
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Tồn kho
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Giá trị tồn
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {hangHoaList.map((hangHoa) => (
                    <tr
                      key={hangHoa.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 py-2">
                        <div className="text-sm text-gray-900 font-medium">
                          {hangHoa.ten_hang_hoa}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Mã: {hangHoa.ma_hang_hoa}
                        </div>
                        <div className="text-xs text-gray-500">
                          {hangHoa.ten_phong_ban}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {hangHoa.ten_loai || "Chưa phân loại"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {hangHoa.don_vi_tinh}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-green-600">
                          {hangHoa.gia_nhap_gan_nhat > 0
                            ? formatCurrency(hangHoa.gia_nhap_gan_nhat)
                            : "Chưa có"}
                        </div>
                        {hangHoa.don_gia_binh_quan > 0 &&
                          hangHoa.don_gia_binh_quan !==
                            hangHoa.gia_nhap_gan_nhat && (
                            <div className="text-xs text-blue-600 mt-1">
                              BQ: {formatCurrency(hangHoa.don_gia_binh_quan)}
                            </div>
                          )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <div
                          className={`text-sm font-medium ${getInventoryStatusColor(
                            hangHoa.so_luong_ton
                          )}`}
                        >
                          {formatInteger(hangHoa.so_luong_ton)}
                        </div>
                        {hangHoa.so_lan_nhap > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {hangHoa.so_lan_nhap} lần nhập
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {hangHoa.gia_tri_ton && hangHoa.gia_tri_ton > 0
                            ? formatCurrency(hangHoa.gia_tri_ton)
                            : "0 ₫"}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getInventoryStatusBadge(
                            hangHoa.so_luong_ton
                          )}`}
                        >
                          {getInventoryStatusText(hangHoa.so_luong_ton)}
                        </span>
                        {hangHoa.co_so_seri && (
                          <div className="text-xs text-blue-600 mt-1">
                            Có số seri
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleViewDetail(hangHoa.id)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all"
                            title="Xem chi tiết"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            onClick={() => handleEditHangHoa(hangHoa.id)}
                            className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded transition-all"
                            title="Chỉnh sửa"
                          >
                            <Edit size={14} />
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteHangHoa(
                                hangHoa.id,
                                hangHoa.ten_hang_hoa
                              )
                            }
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all"
                            title="Xóa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hangHoaList.length === 0 && (
              <div className="text-center py-8">
                <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  Không có dữ liệu
                </h3>
                <p className="text-xs text-gray-500">
                  Chưa có hàng hóa nào được tạo hoặc không tìm thấy kết quả phù
                  hợp.
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

      <HangHoaDetailModal
        hangHoaId={selectedHangHoaId}
        isOpen={showDetailModal}
        onClose={handleCloseDetail}
      />

      <EditHangHoaModal
        hangHoaId={selectedHangHoaId}
        isOpen={showEditModal}
        onClose={handleCloseEdit}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default HangHoa;
