const ExcelJS = require("exceljs");
const pool = require("../config/database");
const { sendResponse } = require("../utils/response");
const path = require("path");
const fs = require("fs");

const generatePhieuNhapExcel = async (req, res, params, body, user) => {
  try {
    const { id } = params;
    const {
      tieu_doi_truong_kho = "",
      nguoi_giao = "",
      nguoi_nhan = "",
      nguoi_viet_lenh = "",
      pho_tu_lenh = "",
    } = body;

    // Lấy chi tiết phiếu nhập
    const detailQuery = `
      SELECT 
        pn.*, 
        ncc.id as ncc_id, ncc.ma_ncc, ncc.ten_ncc, ncc.dia_chi as ncc_dia_chi,
        u1.id as nguoi_tao_id, u1.ho_ten as nguoi_tao_ten,
        u2.id as nguoi_duyet_cap1_id, u2.ho_ten as nguoi_duyet_cap1_ten,
        pb.ten_phong_ban
      FROM phieu_nhap pn
      LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
      LEFT JOIN users u1 ON pn.nguoi_tao = u1.id
      LEFT JOIN users u2 ON pn.nguoi_duyet_cap1 = u2.id
      LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
      WHERE pn.id = $1
    `;

    const chiTietQuery = `
      SELECT 
        ctn.*, 
        h.id as hang_hoa_id_ref, h.ma_hang_hoa, h.ten_hang_hoa, h.don_vi_tinh, h.co_so_seri
      FROM chi_tiet_nhap ctn
      JOIN hang_hoa h ON ctn.hang_hoa_id = h.id
      WHERE ctn.phieu_nhap_id = $1
      ORDER BY ctn.id
    `;

    const [phieuResult, chiTietResult] = await Promise.all([
      pool.query(detailQuery, [id]),
      pool.query(chiTietQuery, [id]),
    ]);

    if (phieuResult.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
    }

    const phieuData = phieuResult.rows[0];
    const chiTietData = chiTietResult.rows;

    // Tạo workbook Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Phiếu nhập kho");

    // Thiết lập độ rộng cột theo mẫu
    worksheet.columns = [
      { width: 20 }, // A - STT và "Tiểu đội trưởng kho"
      { width: 15 }, // B - Danh điểm và "Người giao"
      { width: 35 }, // C - Tên hàng hóa (giữ nguyên)
      { width: 15 }, // D - ĐVT và "Người nhận"
      { width: 12 }, // E - Số lượng kế hoạch và "Người viết lệnh"
      { width: 12 }, // F - Số lượng thực hiện (giữ nguyên)
      { width: 15 }, // G - Đơn giá (giữ nguyên)
      { width: 18 }, // H - Thành tiền và "Phó Tư lệnh"
    ];

    // Header - Tiêu đề tổ chức
    worksheet.mergeCells("A1:G1");
    const headerCell = worksheet.getCell("A1");
    headerCell.value = "CẢNH SÁT BIỂN VIỆT NAM";
    headerCell.font = { name: "Times New Roman", size: 14, bold: true };
    headerCell.alignment = { horizontal: "center", vertical: "middle" };

    worksheet.mergeCells("A2:G2");
    const subHeaderCell = worksheet.getCell("A2");
    subHeaderCell.value = `BỘ TƯ LỆNH VÙNG CẢNH SÁT BIỂN ${
      phieuData.phong_ban_id || "1"
    }`;
    subHeaderCell.font = { name: "Times New Roman", size: 12, bold: true };
    subHeaderCell.alignment = { horizontal: "center", vertical: "middle" };

    // Số phiếu và ngày (sử dụng so_quyet_dinh thay vì so_hoa_don)
    worksheet.mergeCells("F3:H3");
    const soPhieuCell = worksheet.getCell("F3");
    soPhieuCell.value = `Số: ${phieuData.so_quyet_dinh || "01/......"}`;
    soPhieuCell.font = { name: "Times New Roman", size: 11 };
    soPhieuCell.alignment = { horizontal: "center" };

    worksheet.mergeCells("F4:H4");
    const ngayCell = worksheet.getCell("F4");
    const ngayNhap = new Date(phieuData.ngay_nhap);
    const ngayGiaTriDen = new Date(ngayNhap);
    ngayGiaTriDen.setMonth(ngayGiaTriDen.getMonth() + 1); // Cộng thêm 1 tháng
    ngayCell.value = `Giá trị hết ngày: ${String(
      ngayGiaTriDen.getDate()
    ).padStart(2, "0")}/${String(ngayGiaTriDen.getMonth() + 1).padStart(
      2,
      "0"
    )}/${ngayGiaTriDen.getFullYear()}`;
    ngayCell.font = { name: "Times New Roman", size: 11, italic: true };
    ngayCell.alignment = { horizontal: "center" };

    // Tiêu đề chính
    worksheet.mergeCells("A6:H6");
    const titleCell = worksheet.getCell("A6");
    titleCell.value = "LỆNH NHẬP KHO";
    titleCell.font = { name: "Times New Roman", size: 16, bold: true };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    // Thông tin người nhập, địa chỉ
    let currentRow = 8;

    const nguoiNhapCell = worksheet.getCell(`A${currentRow}`);
    nguoiNhapCell.value = `Người nhập hàng: ${
      phieuData.nguoi_nhap_hang || "..........................."
    }`;
    nguoiNhapCell.font = { name: "Times New Roman", size: 11 };

    currentRow++;
    const diaChiCell = worksheet.getCell(`A${currentRow}`);
    diaChiCell.value = `Địa chỉ: ${
      phieuData.dia_chi_nhap || "..........................."
    }`;
    diaChiCell.font = { name: "Times New Roman", size: 11 };

    currentRow++;
    const lyDoCell = worksheet.getCell(`A${currentRow}`);
    lyDoCell.value = `Lý do nhập kho: ${
      phieuData.ly_do_nhap || "..........................."
    }`;
    lyDoCell.font = { name: "Times New Roman", size: 11 };

    currentRow++;
    const xuatTaiCell = worksheet.getCell(`A${currentRow}`);
    xuatTaiCell.value = `Xuất tại kho: ${
      phieuData.nha_cung_cap?.ten_ncc || "..........................."
    }`;
    xuatTaiCell.font = { name: "Times New Roman", size: 11 };

    const hangDoCell = worksheet.getCell(`D${currentRow}`);
    hangDoCell.value = `Hàng do: ${
      phieuData.phuong_thuc_van_chuyen || "Đơn vị tự vận chuyển"
    }`;
    hangDoCell.font = { name: "Times New Roman", size: 11 };

    // Bảng chi tiết hàng hóa
    // Bảng chi tiết hàng hóa
    currentRow += 2;
    const tableStartRow = currentRow;

    // DÒNG 1: Header chính
    const headers = [
      "TT",
      "Danh điểm",
      "Tên, nhãn hiệu, quy cách, phẩm chất vật tư, hàng hóa, dụng cụ",
      "ĐVT",
      "Số lượng",
      "", // Sẽ được merge với cột E
      "Đơn giá\n(đồng)",
      "Thành tiền\n(đồng)",
    ];

    headers.forEach((header, index) => {
      if (index === 5) return; // Skip cột F vì sẽ merge với E
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = header;
      cell.font = { name: "Times New Roman", size: 10, bold: true };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6E6E6" },
      };
    });

    // Merge "Số lượng" (E:F)
    worksheet.mergeCells(`E${currentRow}:F${currentRow}`);

    // DÒNG 2: Sub-header cho "Số lượng"
    currentRow++;
    const subHeaderRow = currentRow;

    // Chỉ tạo sub-header cho cột "Số lượng"
    const keHoachCell = worksheet.getCell(`E${currentRow}`);
    keHoachCell.value = "Kế hoạch";
    keHoachCell.font = { name: "Times New Roman", size: 10, bold: true };
    keHoachCell.alignment = { horizontal: "center", vertical: "middle" };
    keHoachCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    keHoachCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE6E6E6" },
    };

    const thucHienCell = worksheet.getCell(`F${currentRow}`);
    thucHienCell.value = "Thực hiện";
    thucHienCell.font = { name: "Times New Roman", size: 10, bold: true };
    thucHienCell.alignment = { horizontal: "center", vertical: "middle" };
    thucHienCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    thucHienCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE6E6E6" },
    };

    // DÒNG 3: A, B, C, D, 1, 2, 3, 4
    currentRow++;
    const thirdHeaders = ["A", "B", "C", "D", "1", "2", "3", "4"];

    thirdHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = header;
      cell.font = { name: "Times New Roman", size: 10, bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6E6E6" },
      };
    });

    // Merge các cột từ dòng 1 xuống dòng 2 ONLY (không merge xuống dòng 3)
    worksheet.mergeCells(`A${tableStartRow}:A${subHeaderRow}`); // TT (dòng 1-2)
    worksheet.mergeCells(`B${tableStartRow}:B${subHeaderRow}`); // Danh điểm (dòng 1-2)
    worksheet.mergeCells(`C${tableStartRow}:C${subHeaderRow}`); // Tên hàng hóa (dòng 1-2)
    worksheet.mergeCells(`D${tableStartRow}:D${subHeaderRow}`); // ĐVT (dòng 1-2)
    worksheet.mergeCells(`G${tableStartRow}:G${subHeaderRow}`); // Đơn giá (dòng 1-2)
    worksheet.mergeCells(`H${tableStartRow}:H${subHeaderRow}`); // Thành tiền (dòng 1-2)

    currentRow++; // Chuyển sang dòng dữ liệu

    // Dữ liệu hàng hóa
    let tongTien = 0;
    chiTietData.forEach((item, index) => {
      // STT
      const sttCell = worksheet.getCell(`A${currentRow}`);
      sttCell.value = index + 1;
      sttCell.alignment = { horizontal: "center" };

      // Danh điểm (số seri)
      const danhDiemCell = worksheet.getCell(`B${currentRow}`);
      let danhDiemValue = "";
      if (item.so_seri_list && item.so_seri_list.length > 0) {
        // Nếu có nhiều số seri, hiển thị cách nhau bởi dấu phẩy
        danhDiemValue = Array.isArray(item.so_seri_list)
          ? item.so_seri_list.join(", ")
          : item.so_seri_list;
      }
      danhDiemCell.value = danhDiemValue;
      danhDiemCell.alignment = { horizontal: "center", wrapText: true };

      // Tên hàng hóa
      const tenHangCell = worksheet.getCell(`C${currentRow}`);
      tenHangCell.value = item.ten_hang_hoa;
      tenHangCell.alignment = { wrapText: true };

      // ĐVT
      const dvtCell = worksheet.getCell(`D${currentRow}`);
      dvtCell.value = item.don_vi_tinh;
      dvtCell.alignment = { horizontal: "center" };

      // Số lượng kế hoạch
      const soLuongKHCell = worksheet.getCell(`E${currentRow}`);
      soLuongKHCell.value = item.so_luong; // hoặc item.so_luong_yeu_cau
      soLuongKHCell.numFmt = "#,##0";
      soLuongKHCell.alignment = { horizontal: "center" };

      // Số lượng thực hiện (để trống)
      const soLuongTHCell = worksheet.getCell(`F${currentRow}`);
      soLuongTHCell.value = "";
      soLuongTHCell.alignment = { horizontal: "center" };

      // Đơn giá
      const donGiaCell = worksheet.getCell(`G${currentRow}`);
      donGiaCell.value = item.don_gia;
      donGiaCell.numFmt = "#,##0";
      donGiaCell.alignment = { horizontal: "right" };

      // Thành tiền
      const thanhTienCell = worksheet.getCell(`H${currentRow}`);
      thanhTienCell.value = item.thanh_tien;
      thanhTienCell.numFmt = "#,##0";
      thanhTienCell.alignment = { horizontal: "right" };

      // Border cho các ô
      ["A", "B", "C", "D", "E", "F", "G", "H"].forEach((col) => {
        const cell = worksheet.getCell(`${col}${currentRow}`);
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.font = { name: "Times New Roman", size: 10 };
      });

      tongTien += parseFloat(item.thanh_tien);
      currentRow++;
    });

    // Tổng cộng
    const tongCongCell = worksheet.getCell(`A${currentRow}`);
    tongCongCell.value = "Cộng";
    tongCongCell.font = { name: "Times New Roman", size: 11, bold: true };
    tongCongCell.alignment = { horizontal: "center" };

    const tongTienCell = worksheet.getCell(`H${currentRow}`);
    tongTienCell.value = tongTien; // Sửa lại để hiển thị tổng tiền thực tế
    tongTienCell.font = { name: "Times New Roman", size: 11, bold: true };
    tongTienCell.numFmt = "#,##0";
    tongTienCell.alignment = { horizontal: "right" };

    // Border cho dòng tổng
    ["A", "B", "C", "D", "E", "F", "G", "H"].forEach((col) => {
      const cell = worksheet.getCell(`${col}${currentRow}`);
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    currentRow += 2;

    // Total info and weight
    const tongCongInfoCell = worksheet.getCell(`A${currentRow}`);
    tongCongInfoCell.value = `Tổng cộng: ${chiTietData.length} khoản.`;
    tongCongInfoCell.font = { name: "Times New Roman", size: 11 };

    const khoiLuongCell = worksheet.getCell(`F${currentRow}`);
    khoiLuongCell.value = "Khối lượng: ...... kg";
    khoiLuongCell.font = { name: "Times New Roman", size: 11 };

    currentRow++;

    // Tổng số tiền bằng chữ
    const tongSoTienCell = worksheet.getCell(`A${currentRow}`);
    const soTienBangChu = convertNumberToText(tongTien);
    tongSoTienCell.value = `Tổng số tiền (Viết bằng chữ): ${tongTien.toLocaleString(
      "vi-VN"
    )} đồng (${soTienBangChu} đồng)`;
    tongSoTienCell.font = {
      name: "Times New Roman",
      size: 11,
      bold: true,
      italic: true,
    };

    currentRow += 2;

    // Ghi chú, ngày tháng
    const ghiChuCell = worksheet.getCell(`A${currentRow}`);
    ghiChuCell.value = `Giao nhận, ngày ...... tháng ...... năm 2025`;
    ghiChuCell.font = { name: "Times New Roman", size: 11, italic: true };

    const raTinhCell = worksheet.getCell(`E${currentRow}`);
    raTinhCell.value = `Ra lệnh, ngày ${ngayNhap.getDate()} tháng ${
      ngayNhap.getMonth() + 1
    } năm ${ngayNhap.getFullYear()}`;
    raTinhCell.font = { name: "Times New Roman", size: 11, italic: true };

    currentRow += 2;

    // Chữ ký
    const signatures = [
      [
        "Tiểu đội trưởng kho",
        "Người giao",
        "Người nhận",
        "Người viết lệnh",
        "Phó Tư lệnh",
      ],
      [
        tieu_doi_truong_kho,
        nguoi_giao,
        nguoi_nhan,
        nguoi_viet_lenh,
        pho_tu_lenh,
      ],
    ];

    signatures[0].forEach((title, index) => {
      const colIndex = index === 4 ? 7 : index + 1; // Phó Tư lệnh ở cột H

      const titleCell = worksheet.getCell(currentRow, colIndex);
      titleCell.value = title;
      titleCell.font = { name: "Times New Roman", size: 11, bold: true };
      titleCell.alignment = { horizontal: "center" };

      const nameCell = worksheet.getCell(currentRow + 4, colIndex);
      nameCell.value = signatures[1][index] || "";
      nameCell.font = { name: "Times New Roman", size: 11 };
      nameCell.alignment = { horizontal: "center" };
    });

    // Lưu file tạm thời
    const tempDir = path.join(__dirname, "..", "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const fileName = `phieu_nhap_${id}_${Date.now()}.xlsx`;
    const filePath = path.join(tempDir, fileName);

    await workbook.xlsx.writeFile(filePath);

    // Trả về thông tin file
    sendResponse(res, 200, true, "Tạo file Excel thành công", {
      fileName: fileName,
      filePath: `/temp/${fileName}`,
      downloadUrl: `/api/download-temp/${fileName}`,
    });
  } catch (error) {
    console.error("Generate Excel error:", error);
    sendResponse(res, 500, false, "Lỗi tạo file Excel");
  }
};

const generatePhieuXuatExcel = async (req, res, params, body, user) => {
  try {
    const { id } = params;
    const {
      tieu_doi_truong_kho = "",
      nguoi_giao = "",
      nguoi_nhan = "",
      nguoi_viet_lenh = "",
      pho_tu_lenh = "",
    } = body;

    // Lấy chi tiết phiếu xuất
    const detailQuery = `
      SELECT 
        px.*, 
        dvn.id as dvn_id, dvn.ten_don_vi, dvn.dia_chi as dvn_dia_chi, dvn.loai_don_vi,
        u1.id as nguoi_tao_id, u1.ho_ten as nguoi_tao_ten,
        u2.id as nguoi_duyet_cap1_id, u2.ho_ten as nguoi_duyet_cap1_ten,
        pb.ten_phong_ban
      FROM phieu_xuat px
      LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id
      LEFT JOIN users u1 ON px.nguoi_tao = u1.id
      LEFT JOIN users u2 ON px.nguoi_duyet_cap1 = u2.id
      LEFT JOIN phong_ban pb ON px.phong_ban_id = pb.id
      WHERE px.id = $1
    `;

    const chiTietQuery = `
      SELECT 
        ctx.*, 
        h.id as hang_hoa_id_ref, h.ma_hang_hoa, h.ten_hang_hoa, h.don_vi_tinh, h.co_so_seri
      FROM chi_tiet_xuat ctx
      JOIN hang_hoa h ON ctx.hang_hoa_id = h.id
      WHERE ctx.phieu_xuat_id = $1
      ORDER BY ctx.id
    `;

    const [phieuResult, chiTietResult] = await Promise.all([
      pool.query(detailQuery, [id]),
      pool.query(chiTietQuery, [id]),
    ]);

    if (phieuResult.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
    }

    const phieuData = phieuResult.rows[0];
    const chiTietData = chiTietResult.rows;

    // Tạo workbook Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Phiếu xuất kho");

    // Thiết lập độ rộng cột giống phiếu nhập
    worksheet.columns = [
      { width: 20 }, // A - STT và "Tiểu đội trưởng kho"
      { width: 15 }, // B - Danh điểm và "Người giao"
      { width: 35 }, // C - Tên hàng hóa
      { width: 15 }, // D - ĐVT và "Người nhận"
      { width: 12 }, // E - Số lượng kế hoạch và "Người viết lệnh"
      { width: 12 }, // F - Số lượng thực hiện
      { width: 15 }, // G - Đơn giá
      { width: 18 }, // H - Thành tiền và "Phó Tư lệnh"
    ];

    // Header - Tiêu đề tổ chức (giống phiếu nhập)
    worksheet.mergeCells("A1:G1");
    const headerCell = worksheet.getCell("A1");
    headerCell.value = "CẢNH SÁT BIỂN VIỆT NAM";
    headerCell.font = { name: "Times New Roman", size: 14, bold: true };
    headerCell.alignment = { horizontal: "center", vertical: "middle" };

    worksheet.mergeCells("A2:G2");
    const subHeaderCell = worksheet.getCell("A2");
    subHeaderCell.value = `BỘ TƯ LỆNH VÙNG CẢNH SÁT BIỂN ${
      phieuData.phong_ban_id || "1"
    }`;
    subHeaderCell.font = { name: "Times New Roman", size: 12, bold: true };
    subHeaderCell.alignment = { horizontal: "center", vertical: "middle" };

    // Số phiếu và ngày (thêm phần này - đã thiếu)
    worksheet.mergeCells("F3:H3");
    const soPhieuCell = worksheet.getCell("F3");
    soPhieuCell.value = `Số: ${phieuData.so_quyet_dinh || "PX......"}`;
    soPhieuCell.font = { name: "Times New Roman", size: 11 };
    soPhieuCell.alignment = { horizontal: "center" };

    worksheet.mergeCells("F4:H4");
    const ngayCell = worksheet.getCell("F4");
    const ngayXuat = new Date(phieuData.ngay_xuat);
    const ngayGiaTriDen = new Date(ngayXuat);
    ngayGiaTriDen.setMonth(ngayGiaTriDen.getMonth() + 1);
    ngayCell.value = `Giá trị hết ngày: ${String(
      ngayGiaTriDen.getDate()
    ).padStart(2, "0")}/${String(ngayGiaTriDen.getMonth() + 1).padStart(
      2,
      "0"
    )}/${ngayGiaTriDen.getFullYear()}`;
    ngayCell.font = { name: "Times New Roman", size: 11, italic: true };
    ngayCell.alignment = { horizontal: "center" };

    // Tiêu đề chính
    worksheet.mergeCells("A6:H6");
    const titleCell = worksheet.getCell("A6");
    titleCell.value = "LỆNH XUẤT KHO";
    titleCell.font = { name: "Times New Roman", size: 16, bold: true };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    // Thông tin người nhận, địa chỉ (cập nhật để đầy đủ như phiếu nhập)
    let currentRow = 8;

    const nguoiNhanCell = worksheet.getCell(`A${currentRow}`);
    nguoiNhanCell.value = `Người nhận hàng: ${
      phieuData.nguoi_nhan || "..........................."
    }`;
    nguoiNhanCell.font = { name: "Times New Roman", size: 11 };

    currentRow++;
    const diaChiCell = worksheet.getCell(`A${currentRow}`);
    diaChiCell.value = `Địa chỉ: ${
      phieuData.dvn_dia_chi || "..........................."
    }`;
    diaChiCell.font = { name: "Times New Roman", size: 11 };

    currentRow++;
    const lyDoCell = worksheet.getCell(`A${currentRow}`);
    lyDoCell.value = `Lý do xuất kho: ${
      phieuData.ly_do_xuat || "..........................."
    }`;
    lyDoCell.font = { name: "Times New Roman", size: 11 };

    currentRow++;
    const xuatTaiCell = worksheet.getCell(`A${currentRow}`);
    xuatTaiCell.value = `Xuất tại kho: ${
      phieuData.ten_don_vi || "..........................."
    }`;
    xuatTaiCell.font = { name: "Times New Roman", size: 11 };

    const hangDoCell = worksheet.getCell(`D${currentRow}`);
    hangDoCell.value = `Hàng do: Đơn vị tự vận chuyển`;
    hangDoCell.font = { name: "Times New Roman", size: 11 };

    // Bảng chi tiết hàng hóa (giống format phiếu nhập)
    // Bảng chi tiết hàng hóa
    currentRow += 2;
    const tableStartRow = currentRow;

    // DÒNG 1: Header chính
    const headers = [
      "TT",
      "Danh điểm",
      "Tên, nhãn hiệu, quy cách, phẩm chất vật tư, hàng hóa, dụng cụ",
      "ĐVT",
      "Số lượng",
      "", // Sẽ được merge với cột E
      "Đơn giá\n(đồng)",
      "Thành tiền\n(đồng)",
    ];

    headers.forEach((header, index) => {
      if (index === 5) return; // Skip cột F vì sẽ merge với E
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = header;
      cell.font = { name: "Times New Roman", size: 10, bold: true };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6E6E6" },
      };
    });

    // Merge "Số lượng" (E:F)
    worksheet.mergeCells(`E${currentRow}:F${currentRow}`);

    // DÒNG 2: Sub-header cho "Số lượng"
    currentRow++;
    const subHeaderRow = currentRow;

    // Chỉ tạo sub-header cho cột "Số lượng"
    const keHoachCell = worksheet.getCell(`E${currentRow}`);
    keHoachCell.value = "Kế hoạch";
    keHoachCell.font = { name: "Times New Roman", size: 10, bold: true };
    keHoachCell.alignment = { horizontal: "center", vertical: "middle" };
    keHoachCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    keHoachCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE6E6E6" },
    };

    const thucHienCell = worksheet.getCell(`F${currentRow}`);
    thucHienCell.value = "Thực hiện";
    thucHienCell.font = { name: "Times New Roman", size: 10, bold: true };
    thucHienCell.alignment = { horizontal: "center", vertical: "middle" };
    thucHienCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    thucHienCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE6E6E6" },
    };

    // DÒNG 3: A, B, C, D, 1, 2, 3, 4
    currentRow++;
    const thirdHeaders = ["A", "B", "C", "D", "1", "2", "3", "4"];

    thirdHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = header;
      cell.font = { name: "Times New Roman", size: 10, bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6E6E6" },
      };
    });

    // Merge các cột từ dòng 1 xuống dòng 2 ONLY (không merge xuống dòng 3)
    worksheet.mergeCells(`A${tableStartRow}:A${subHeaderRow}`); // TT (dòng 1-2)
    worksheet.mergeCells(`B${tableStartRow}:B${subHeaderRow}`); // Danh điểm (dòng 1-2)
    worksheet.mergeCells(`C${tableStartRow}:C${subHeaderRow}`); // Tên hàng hóa (dòng 1-2)
    worksheet.mergeCells(`D${tableStartRow}:D${subHeaderRow}`); // ĐVT (dòng 1-2)
    worksheet.mergeCells(`G${tableStartRow}:G${subHeaderRow}`); // Đơn giá (dòng 1-2)
    worksheet.mergeCells(`H${tableStartRow}:H${subHeaderRow}`); // Thành tiền (dòng 1-2)

    currentRow++; // Chuyển sang dòng dữ liệu

    // Dữ liệu hàng hóa - SỬA LOGIC TÍNH TOÁN
    let tongTien = 0;
    chiTietData.forEach((item, index) => {
      // STT
      const sttCell = worksheet.getCell(`A${currentRow}`);
      sttCell.value = index + 1;
      sttCell.alignment = { horizontal: "center" };

      // Danh điểm (số seri xuất)
      const danhDiemCell = worksheet.getCell(`B${currentRow}`);
      let danhDiemValue = "";
      if (item.so_seri_xuat && item.so_seri_xuat.length > 0) {
        danhDiemValue = Array.isArray(item.so_seri_xuat)
          ? item.so_seri_xuat.join(", ")
          : item.so_seri_xuat;
      }
      danhDiemCell.value = danhDiemValue;
      danhDiemCell.alignment = { horizontal: "center", wrapText: true };

      // Tên hàng hóa
      const tenHangCell = worksheet.getCell(`C${currentRow}`);
      tenHangCell.value = item.ten_hang_hoa;
      tenHangCell.alignment = { wrapText: true };

      // ĐVT
      const dvtCell = worksheet.getCell(`D${currentRow}`);
      dvtCell.value = item.don_vi_tinh;
      dvtCell.alignment = { horizontal: "center" };

      // Số lượng kế hoạch
      const soLuongKHCell = worksheet.getCell(`E${currentRow}`);
      soLuongKHCell.value = item.so_luong; // hoặc item.so_luong_yeu_cau
      soLuongKHCell.numFmt = "#,##0";
      soLuongKHCell.alignment = { horizontal: "center" };

      // Số lượng thực hiện - hiển thị nếu có, để trống nếu null
      const soLuongTHCell = worksheet.getCell(`F${currentRow}`);
      soLuongTHCell.value = "";
      soLuongTHCell.alignment = { horizontal: "center" };

      // Đơn giá
      const donGiaCell = worksheet.getCell(`G${currentRow}`);
      donGiaCell.value = item.don_gia;
      donGiaCell.numFmt = "#,##0";
      donGiaCell.alignment = { horizontal: "right" };

      // Thành tiền - SỬA: sử dụng số lượng yêu cầu thay vì thực xuất khi thực xuất null
      const soLuongTinhTien = item.so_luong_thuc_xuat || item.so_luong_yeu_cau;
      const thanhTienValue = soLuongTinhTien * item.don_gia;

      const thanhTienCell = worksheet.getCell(`H${currentRow}`);
      thanhTienCell.value = thanhTienValue;
      thanhTienCell.numFmt = "#,##0";
      thanhTienCell.alignment = { horizontal: "right" };

      // Border cho các ô
      ["A", "B", "C", "D", "E", "F", "G", "H"].forEach((col) => {
        const cell = worksheet.getCell(`${col}${currentRow}`);
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.font = { name: "Times New Roman", size: 10 };
      });

      tongTien += thanhTienValue;
      currentRow++;
    });

    // Tổng cộng
    const tongCongCell = worksheet.getCell(`A${currentRow}`);
    tongCongCell.value = "Cộng";
    tongCongCell.font = { name: "Times New Roman", size: 11, bold: true };
    tongCongCell.alignment = { horizontal: "center" };

    const tongTienCell = worksheet.getCell(`H${currentRow}`);
    tongTienCell.value = tongTien;
    tongTienCell.font = { name: "Times New Roman", size: 11, bold: true };
    tongTienCell.numFmt = "#,##0";
    tongTienCell.alignment = { horizontal: "right" };

    // Border cho dòng tổng
    ["A", "B", "C", "D", "E", "F", "G", "H"].forEach((col) => {
      const cell = worksheet.getCell(`${col}${currentRow}`);
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    currentRow += 2;

    const tongCongInfoCell = worksheet.getCell(`A${currentRow}`);
    tongCongInfoCell.value = `Tổng cộng: ${chiTietData.length} khoản.`;
    tongCongInfoCell.font = { name: "Times New Roman", size: 11 };

    const khoiLuongCell = worksheet.getCell(`F${currentRow}`);
    khoiLuongCell.value = "Khối lượng: ...... kg";
    khoiLuongCell.font = { name: "Times New Roman", size: 11 };

    currentRow++;

    // Tổng số tiền bằng chữ
    const tongSoTienCell = worksheet.getCell(`A${currentRow}`);
    const soTienBangChu = convertNumberToText(tongTien);
    tongSoTienCell.value = `Tổng số tiền (Viết bằng chữ): ${tongTien.toLocaleString(
      "vi-VN"
    )} đồng (${soTienBangChu} đồng)`;
    tongSoTienCell.font = {
      name: "Times New Roman",
      size: 11,
      bold: true,
      italic: true,
    };

    currentRow += 2;

    // Ghi chú, ngày tháng (giống phiếu nhập)
    const ghiChuCell = worksheet.getCell(`A${currentRow}`);
    ghiChuCell.value = `Giao nhận, ngày ...... tháng ...... năm 2025`;
    ghiChuCell.font = { name: "Times New Roman", size: 11, italic: true };

    const raLenhCell = worksheet.getCell(`E${currentRow}`);
    raLenhCell.value = `Ra lệnh, ngày ${ngayXuat.getDate()} tháng ${
      ngayXuat.getMonth() + 1
    } năm ${ngayXuat.getFullYear()}`;
    raLenhCell.font = { name: "Times New Roman", size: 11, italic: true };

    currentRow += 2;

    // Chữ ký (giống layout phiếu nhập)
    const signatures = [
      [
        "Tiểu đội trưởng kho",
        "Người giao",
        "Người nhận",
        "Người viết lệnh",
        "Phó Tư lệnh",
      ],
      [
        tieu_doi_truong_kho,
        nguoi_giao,
        nguoi_nhan,
        nguoi_viet_lenh,
        pho_tu_lenh,
      ],
    ];

    signatures[0].forEach((title, index) => {
      const colIndex = index === 4 ? 7 : index + 1; // Phó Tư lệnh ở cột H

      const titleCell = worksheet.getCell(currentRow, colIndex);
      titleCell.value = title;
      titleCell.font = { name: "Times New Roman", size: 11, bold: true };
      titleCell.alignment = { horizontal: "center" };

      const nameCell = worksheet.getCell(currentRow + 4, colIndex);
      nameCell.value = signatures[1][index] || "";
      nameCell.font = { name: "Times New Roman", size: 11 };
      nameCell.alignment = { horizontal: "center" };
    });

    // Lưu file tạm thời
    const tempDir = path.join(__dirname, "..", "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const fileName = `phieu_xuat_${id}_${Date.now()}.xlsx`;
    const filePath = path.join(tempDir, fileName);

    await workbook.xlsx.writeFile(filePath);

    // Trả về thông tin file
    sendResponse(res, 200, true, "Tạo file Excel thành công", {
      fileName: fileName,
      filePath: `/temp/${fileName}`,
      downloadUrl: `/api/download-temp/${fileName}`,
    });
  } catch (error) {
    console.error("Generate Excel error:", error);
    sendResponse(res, 500, false, "Lỗi tạo file Excel");
  }
};

// Hàm chuyển số thành chữ (cải thiện)
function convertNumberToText(number) {
  if (number === 0) return "không";

  const ones = [
    "",
    "một",
    "hai",
    "ba",
    "bốn",
    "năm",
    "sáu",
    "bảy",
    "tám",
    "chín",
  ];
  const tens = [
    "",
    "",
    "hai mươi",
    "ba mươi",
    "bốn mươi",
    "năm mươi",
    "sáu mươi",
    "bảy mươi",
    "tám mươi",
    "chín mươi",
  ];

  function convertHundreds(n) {
    let result = "";

    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const one = n % 10;

    if (hundred > 0) {
      result += ones[hundred] + " trăm";
      if (ten > 0 || one > 0) result += " ";
    }

    if (ten > 1) {
      result += tens[ten];
      if (one > 0) {
        if (one === 1) result += " mốt";
        else if (one === 5 && ten > 0) result += " lăm";
        else result += " " + ones[one];
      }
    } else if (ten === 1) {
      result += "mười";
      if (one > 0) {
        if (one === 5) result += " lăm";
        else result += " " + ones[one];
      }
    } else if (one > 0) {
      if (hundred > 0) result += "lẻ ";
      result += ones[one];
    }

    return result.trim();
  }

  if (number < 1000) {
    return convertHundreds(number);
  } else if (number < 1000000) {
    const thousands = Math.floor(number / 1000);
    const remainder = number % 1000;

    let result = convertHundreds(thousands) + " nghìn";
    if (remainder > 0) {
      if (remainder < 100) result += " lẻ ";
      else result += " ";
      result += convertHundreds(remainder);
    }
    return result;
  } else if (number < 1000000000) {
    const millions = Math.floor(number / 1000000);
    const thousands = Math.floor((number % 1000000) / 1000);
    const remainder = number % 1000;

    let result = convertHundreds(millions) + " triệu";

    if (thousands > 0) {
      if (thousands < 100) result += " lẻ ";
      else result += " ";
      result += convertHundreds(thousands) + " nghìn";
    }

    if (remainder > 0) {
      if (remainder < 100) result += " lẻ ";
      else result += " ";
      result += convertHundreds(remainder);
    }

    return result;
  } else {
    const billions = Math.floor(number / 1000000000);
    const millions = Math.floor((number % 1000000000) / 1000000);
    const thousands = Math.floor((number % 1000000) / 1000);
    const remainder = number % 1000;

    let result = convertHundreds(billions) + " tỷ";

    if (millions > 0) {
      if (millions < 100) result += " lẻ ";
      else result += " ";
      result += convertHundreds(millions) + " triệu";
    }

    if (thousands > 0) {
      if (thousands < 100) result += " lẻ ";
      else result += " ";
      result += convertHundreds(thousands) + " nghìn";
    }

    if (remainder > 0) {
      if (remainder < 100) result += " lẻ ";
      else result += " ";
      result += convertHundreds(remainder);
    }

    return result;
  }
}

const generatePhieuKiemKeExcel = async (req, res, params, body, user) => {
  try {
    const { id } = params;
    const {
      // Chỉ lấy thông tin người ký từ form in
      nguoi_lap = "",
      tieu_doi_truong_kho = "",
      ban_tai_chinh = "",
      chu_nhiem_hckt = "",
    } = body;

    // Lấy chi tiết phiếu kiểm kê
    const detailQuery = `
      SELECT 
        pkk.*,
        pb.ten_phong_ban,
        u1.ho_ten as nguoi_tao_ten,
        u2.ho_ten as nguoi_duyet_ten
      FROM phieu_kiem_ke pkk
      LEFT JOIN phong_ban pb ON pkk.phong_ban_id = pb.id
      LEFT JOIN users u1 ON pkk.nguoi_tao = u1.id
      LEFT JOIN users u2 ON pkk.nguoi_duyet = u2.id
      WHERE pkk.id = $1
    `;

    const chiTietQuery = `
      SELECT 
        ctkk.*,
        h.ma_hang_hoa, h.ten_hang_hoa, h.don_vi_tinh,
        -- Tính toán các giá trị
        (ctkk.sl_tot + ctkk.sl_kem_pham_chat + ctkk.sl_mat_pham_chat + ctkk.sl_hong + ctkk.sl_can_thanh_ly) as ton_thuc,
        ((ctkk.sl_tot + ctkk.sl_kem_pham_chat + ctkk.sl_mat_pham_chat + ctkk.sl_hong + ctkk.sl_can_thanh_ly) - ctkk.so_luong_so_sach) as chenh_lech_so_luong,
        (ctkk.so_luong_so_sach * ctkk.don_gia) as thanh_tien_so_sach,
        ((ctkk.sl_tot + ctkk.sl_kem_pham_chat + ctkk.sl_mat_pham_chat + ctkk.sl_hong + ctkk.sl_can_thanh_ly) * ctkk.don_gia) as thanh_tien_kiem_ke
      FROM chi_tiet_kiem_ke ctkk
      JOIN hang_hoa h ON ctkk.hang_hoa_id = h.id
      WHERE ctkk.phieu_kiem_ke_id = $1
      ORDER BY ctkk.id
    `;

    const [phieuResult, chiTietResult] = await Promise.all([
      pool.query(detailQuery, [id]),
      pool.query(chiTietQuery, [id]),
    ]);

    if (phieuResult.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy phiếu kiểm kê");
    }

    const phieuData = phieuResult.rows[0];
    const chiTietData = chiTietResult.rows;

    // Tạo workbook Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Biên bản kiểm kê");

    // Thiết lập độ rộng cột theo mẫu (16 cột)
    worksheet.columns = [
      { width: 5 }, // A - STT
      { width: 35 }, // B - Tên, quy cách...
      { width: 15 }, // C - Mã số
      { width: 8 }, // D - ĐVT
      { width: 12 }, // 1 - Đơn giá (Excel Col E)
      { width: 10 }, // 2 - SL sổ (F)
      { width: 12 }, // 3 - TT sổ (G)
      { width: 10 }, // 4 - SL kê (H)
      { width: 12 }, // 5 - TT kê (I)
      { width: 8 }, // 6 - Thừa SL (J)
      { width: 10 }, // 7 - Thừa tiền (K)
      { width: 8 }, // 8 - Thiếu SL (L)
      { width: 10 }, // 9 - Thiếu tiền (M)
      { width: 8 }, // E - Tốt 100% (N)
      { width: 8 }, // F - Kém phẩm chất (O)
      { width: 8 }, // G - Mất phẩm chất (P)
    ];

    let currentRow = 1;

    // HEADER - Dòng 1: Tiêu đề chính
    worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
    const headerMainCell = worksheet.getCell(`A${currentRow}`);
    headerMainCell.value = "BỘ TƯ LỆNH CẢNH SÁT BIỂN";
    headerMainCell.font = { name: "Times New Roman", size: 14, bold: true };
    headerMainCell.alignment = { horizontal: "center", vertical: "middle" };

    worksheet.mergeCells(`K${currentRow}:P${currentRow}`);
    const mauSoCell = worksheet.getCell(`K${currentRow}`);
    mauSoCell.value = "Mẫu số C33-HD";
    mauSoCell.font = { name: "Times New Roman", size: 11 };
    mauSoCell.alignment = { horizontal: "center", vertical: "middle" };

    currentRow++;

    // Dòng 2: Đơn vị và số
    worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
    const donViCell = worksheet.getCell(`A${currentRow}`);
    donViCell.value = `BỘ TƯ LỆNH VÙNG CẢNH SÁT BIỂN ${
      phieuData.phong_ban_id || "1"
    }`;
    donViCell.font = { name: "Times New Roman", size: 12, bold: true };
    donViCell.alignment = { horizontal: "center", vertical: "middle" };

    worksheet.mergeCells(`K${currentRow}:P${currentRow}`);
    const soPhieuCell = worksheet.getCell(`K${currentRow}`);
    soPhieuCell.value = `Số: ${phieuData.so_quyet_dinh}`;
    soPhieuCell.font = { name: "Times New Roman", size: 11 };
    soPhieuCell.alignment = { horizontal: "center", vertical: "middle" };

    currentRow += 2;

    // Dòng 4: Tiêu đề biên bản
    worksheet.mergeCells(`A${currentRow}:P${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = "BIÊN BẢN KIỂM KÊ VẬT TƯ, DỤNG CỤ, SẢN PHẨM, HÀNG HÓA";
    titleCell.font = { name: "Times New Roman", size: 16, bold: true };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    currentRow++;

    // Dòng 5: Đơn vị thực hiện
    worksheet.mergeCells(`A${currentRow}:P${currentRow}`);
    const donViThucHienCell = worksheet.getCell(`A${currentRow}`);
    donViThucHienCell.value = `Đơn vị: ${phieuData.don_vi_kiem_ke}`;
    donViThucHienCell.font = { name: "Times New Roman", size: 12 };
    donViThucHienCell.alignment = { horizontal: "center", vertical: "middle" };

    currentRow++;

    // Dòng 6: Thời gian
    const ngayKiemKe = new Date(phieuData.ngay_kiem_ke);
    const quy = Math.ceil((ngayKiemKe.getMonth() + 1) / 3);
    const nam = ngayKiemKe.getFullYear();

    worksheet.mergeCells(`A${currentRow}:P${currentRow}`);
    const thoiGianCell = worksheet.getCell(`A${currentRow}`);
    thoiGianCell.value = `Quý ${quy} năm ${nam}`;
    thoiGianCell.font = { name: "Times New Roman", size: 12, bold: true };
    thoiGianCell.alignment = { horizontal: "center", vertical: "middle" };

    currentRow += 2;

    // Dòng 8: Thời gian kiểm kê chi tiết
    worksheet.mergeCells(`A${currentRow}:P${currentRow}`);
    const thoiGianChiTietCell = worksheet.getCell(`A${currentRow}`);
    thoiGianChiTietCell.value = `Thời gian kiểm kê: ${
      phieuData.gio_kiem_ke
    } ngày ${ngayKiemKe.getDate()} tháng ${
      ngayKiemKe.getMonth() + 1
    } năm ${ngayKiemKe.getFullYear()}`;
    thoiGianChiTietCell.font = { name: "Times New Roman", size: 11 };

    currentRow++;

    // Dòng 9: Tổ kiểm kê
    worksheet.mergeCells(`A${currentRow}:P${currentRow}`);
    const toKiemKeCell = worksheet.getCell(`A${currentRow}`);
    toKiemKeCell.value = "Tổ kiểm kê gồm:";
    toKiemKeCell.font = { name: "Times New Roman", size: 11, bold: true };

    currentRow++;

    // Danh sách tổ kiểm kê - LẤY TỪ DATABASE
    const toKiemKeData = phieuData.to_kiem_ke || {};
    const toKiemKe = [
      { ten: toKiemKeData.to_truong, chuc_vu: "Tổ trưởng" },
      { ten: toKiemKeData.uy_vien_1, chuc_vu: "Ủy viên" },
      { ten: toKiemKeData.uy_vien_2, chuc_vu: "Ủy viên" },
      { ten: toKiemKeData.uy_vien_3, chuc_vu: "Ủy viên" },
      { ten: toKiemKeData.uy_vien_4, chuc_vu: "Ủy viên" },
      { ten: toKiemKeData.thu_kho, chuc_vu: "Thủ kho" },
    ];

    toKiemKe.forEach((member) => {
      if (member.ten) {
        worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
        const memberCell = worksheet.getCell(`A${currentRow}`);
        memberCell.value = `Đồng chí ${member.ten}`;
        memberCell.font = { name: "Times New Roman", size: 11 };

        worksheet.mergeCells(`F${currentRow}:H${currentRow}`);
        const chucVuCell = worksheet.getCell(`F${currentRow}`);
        chucVuCell.value = member.chuc_vu;
        chucVuCell.font = { name: "Times New Roman", size: 11 };

        currentRow++;
      }
    });

    currentRow += 2;

    // BẢNG CHI TIẾT - Header
    const tableStartRow = currentRow;

    // Dòng 1: Header chính
    const mainHeaders = [
      "TT",
      "Tên, quy cách, vật tư, dụng cụ, sản phẩm, hàng hóa",
      "Mã số",
      "ĐVT",
      "Đơn giá",
      "Theo sổ kế toán",
      "",
      "Theo kiểm kê",
      "",
      "Chênh lệch",
      "",
      "",
      "",
      "Phân loại phẩm chất",
    ];

    mainHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      if (header) {
        cell.value = header;
        cell.font = { name: "Times New Roman", size: 10, bold: true };
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE6E6E6" },
        };
      }
    });

    // Merge cells cho header chính
    worksheet.mergeCells(`F${currentRow}:G${currentRow}`); // Theo sổ kế toán
    worksheet.mergeCells(`H${currentRow}:I${currentRow}`); // Theo kiểm kê
    worksheet.mergeCells(`J${currentRow}:M${currentRow}`); // Chênh lệch
    worksheet.mergeCells(`N${currentRow}:P${currentRow}`); // Phân loại phẩm chất

    currentRow++;

    // Dòng 2: Sub-header 1
    const subHeaders1 = [
      "",
      "",
      "",
      "",
      "",
      "Số lượng",
      "Thành tiền",
      "Số lượng",
      "Thành tiền",
      "Thừa",
      "",
      "Thiếu",
      "",
      "Còn tốt 100%",
      "Kém phẩm chất",
      "Mất phẩm chất",
    ];

    subHeaders1.forEach((header, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      if (header) {
        cell.value = header;
        cell.font = { name: "Times New Roman", size: 10, bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE6E6E6" },
        };
      }
    });

    // Merge cells cho sub-header 1
    worksheet.mergeCells(`J${currentRow}:K${currentRow}`); // Thừa
    worksheet.mergeCells(`L${currentRow}:M${currentRow}`); // Thiếu

    currentRow++;

    // Dòng 3: Sub-header 2
    const subHeaders2 = [
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "Số lượng",
      "Thành tiền",
      "Số lượng",
      "Thành tiền",
    ];

    subHeaders2.forEach((header, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      if (header) {
        cell.value = header;
        cell.font = { name: "Times New Roman", size: 10, bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE6E6E6" },
        };
      }
    });

    currentRow++;

    // Dòng 4: Header codes
    const headerCodes = [
      "A",
      "B",
      "C",
      "D",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "E",
      "F",
      "G",
    ];

    headerCodes.forEach((code, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = code;
      cell.font = { name: "Times New Roman", size: 10, bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6E6E6" },
      };
    });

    // Merge các cột dọc
    worksheet.mergeCells(`A${tableStartRow}:A${currentRow - 1}`); // TT
    worksheet.mergeCells(`B${tableStartRow}:B${currentRow - 1}`); // Tên hàng hóa
    worksheet.mergeCells(`C${tableStartRow}:C${currentRow - 1}`); // Mã số
    worksheet.mergeCells(`D${tableStartRow}:D${currentRow - 1}`); // ĐVT
    worksheet.mergeCells(`E${tableStartRow}:E${currentRow - 1}`); // Đơn giá

    // Gộp các ô "Số lượng", "Thành tiền"
    worksheet.mergeCells(`F${tableStartRow + 1}:F${tableStartRow + 2}`); // SL Sổ sách
    worksheet.mergeCells(`G${tableStartRow + 1}:G${tableStartRow + 2}`); // TT Sổ sách
    worksheet.mergeCells(`H${tableStartRow + 1}:H${tableStartRow + 2}`); // SL Kiểm kê
    worksheet.mergeCells(`I${tableStartRow + 1}:I${tableStartRow + 2}`); // TT Kiểm kê

    worksheet.mergeCells(`N${tableStartRow + 1}:N${currentRow - 1}`); // Còn tốt 100%
    worksheet.mergeCells(`O${tableStartRow + 1}:O${currentRow - 1}`); // Kém phẩm chất
    worksheet.mergeCells(`P${tableStartRow + 1}:P${currentRow - 1}`); // Mất phẩm chất

    currentRow++;

    // Hàm định dạng số không có .00
    const formatNumber = (value) => {
      if (!value || value === 0) return "";
      // Loại bỏ .00 và định dạng số với dấu phẩy
      return Math.round(value).toLocaleString("vi-VN");
    };

    // DỮ LIỆU CHI TIẾT
    chiTietData.forEach((item, index) => {
      const chenhLechSoLuong = item.chenh_lech_so_luong;
      const chenhLechThanhTien =
        item.thanh_tien_kiem_ke - item.thanh_tien_so_sach;
      const thuaSoLuong = chenhLechSoLuong > 0 ? chenhLechSoLuong : 0;
      const thuaThanhTien = chenhLechThanhTien > 0 ? chenhLechThanhTien : 0;
      const thieuSoLuong =
        chenhLechSoLuong < 0 ? Math.abs(chenhLechSoLuong) : 0;
      const thieuThanhTien =
        chenhLechThanhTien < 0 ? Math.abs(chenhLechThanhTien) : 0;

      const rowData = [
        index + 1,
        item.ten_hang_hoa,
        item.ma_hang_hoa || "",
        item.don_vi_tinh,
        formatNumber(item.don_gia),
        formatNumber(item.so_luong_so_sach),
        formatNumber(item.thanh_tien_so_sach),
        formatNumber(item.ton_thuc),
        formatNumber(item.thanh_tien_kiem_ke),
        formatNumber(thuaSoLuong),
        formatNumber(thuaThanhTien),
        formatNumber(thieuSoLuong),
        formatNumber(thieuThanhTien),
        formatNumber(item.sl_tot || 0),
        formatNumber(item.sl_kem_pham_chat || 0),
        formatNumber(item.sl_mat_pham_chat || 0),
      ];

      rowData.forEach((value, colIndex) => {
        const cell = worksheet.getCell(currentRow, colIndex + 1);
        cell.value = value;

        cell.font = { name: "Times New Roman", size: 10 };
        cell.alignment = {
          horizontal: colIndex === 1 ? "left" : "center",
          vertical: "middle",
          wrapText: colIndex === 1,
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      currentRow++;
    });

    // TỔNG KẾT - SỬA: Dòng "Tổng cộng" ở cột B (tên hàng hóa), không phải cột A (STT)
    const tongSoLuongKiemKe = chiTietData.reduce(
      (sum, item) => sum + item.ton_thuc,
      0
    );
    const tongThanhTienKiemKe = chiTietData.reduce(
      (sum, item) => sum + item.thanh_tien_kiem_ke,
      0
    );

    // Dòng "Tổng cộng"
    const sttTongCell = worksheet.getCell(`A${currentRow}`);
    sttTongCell.value = ""; // Để trống cột STT
    sttTongCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    const tongCongCell = worksheet.getCell(`B${currentRow}`); // Đặt "Tổng cộng" ở cột B
    tongCongCell.value = "Tổng cộng";
    tongCongCell.alignment = { horizontal: "left", vertical: "middle" };
    tongCongCell.font = { name: "Times New Roman", size: 11, bold: true };
    tongCongCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    // Các cột khác trong dòng tổng
    const tongCongData = [
      "", // C - Mã số
      "", // D - ĐVT
      "", // E - Đơn giá
      "", // F - SL sổ (trống)
      "", // G - TT sổ (trống)
      formatNumber(tongSoLuongKiemKe), // H - SL kiểm kê
      formatNumber(tongThanhTienKiemKe), // I - TT kiểm kê
      "", // J - Thừa SL
      "", // K - Thừa tiền
      "", // L - Thiếu SL
      "", // M - Thiếu tiền
      "", // N - Tốt 100%
      "", // O - Kém phẩm chất
      "", // P - Mất phẩm chất
    ];

    tongCongData.forEach((value, index) => {
      const colIndex = index + 3; // Bắt đầu từ cột C (index 3)
      const cell = worksheet.getCell(currentRow, colIndex);
      cell.value = value;

      cell.alignment = {
        horizontal: colIndex === 8 || colIndex === 9 ? "right" : "center",
        vertical: "middle",
      };
      cell.font = { name: "Times New Roman", size: 11, bold: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    currentRow += 3;

    // KẾT LUẬN
    worksheet.mergeCells(`A${currentRow}:P${currentRow}`);
    const ketLuanCell = worksheet.getCell(`A${currentRow}`);
    ketLuanCell.value = `Tổng số loại vật tư, dụng cụ, sản phẩm, hàng hóa đã kiểm kê: ${chiTietData.length} loại`;
    ketLuanCell.font = { name: "Times New Roman", size: 11, bold: true };

    currentRow += 2;

    // CHỮ KÝ - SỬA: Sử dụng thông tin từ form in
    const ngayLap = new Date();
    worksheet.mergeCells(`A${currentRow}:P${currentRow}`);
    const ngayLapCell = worksheet.getCell(`A${currentRow}`);
    ngayLapCell.value = `Lập tại: ......., ngày ${ngayLap.getDate()} tháng ${
      ngayLap.getMonth() + 1
    } năm ${ngayLap.getFullYear()}`;
    ngayLapCell.font = { name: "Times New Roman", size: 11, italic: true };
    ngayLapCell.alignment = { horizontal: "right" };

    currentRow += 2;

    // SỬA: Sử dụng thông tin từ form in cho phần chữ ký, thêm thủ kho từ database
    const positions = [
      "NGƯỜI LẬP",
      "TIỂU ĐỘI TRƯỞNG KHO",
      "THỦ KHO",
      "BAN TÀI CHÍNH",
      "CHỦ NHIỆM HC-KT",
    ];
    const names = [
      nguoi_lap,
      tieu_doi_truong_kho,
      toKiemKeData.thu_kho || "",
      ban_tai_chinh,
      chu_nhiem_hckt,
    ];

    // Bố cục chữ ký mới: 5 vị trí trên 16 cột (3 cột/vị trí, 1 cột trống ở cuối)
    positions.forEach((position, index) => {
      const startCol = index * 3 + 1; // 1, 4, 7, 10, 13
      const endCol = startCol + 2; // 3, 6, 9, 12, 15

      if (endCol <= 16) {
        worksheet.mergeCells(
          `${String.fromCharCode(
            64 + startCol
          )}${currentRow}:${String.fromCharCode(64 + endCol)}${currentRow}`
        );
        const positionCell = worksheet.getCell(currentRow, startCol);
        positionCell.value = position;
        positionCell.font = { name: "Times New Roman", size: 11, bold: true };
        positionCell.alignment = { horizontal: "center" };

        if (names[index]) {
          worksheet.mergeCells(
            `${String.fromCharCode(64 + startCol)}${
              currentRow + 5
            }:${String.fromCharCode(64 + endCol)}${currentRow + 5}`
          );
          const nameCell = worksheet.getCell(currentRow + 5, startCol);
          nameCell.value = names[index];
          nameCell.font = { name: "Times New Roman", size: 11, bold: true };
          nameCell.alignment = { horizontal: "center" };
        }
      }
    });

    // Lưu file tạm thời
    const tempDir = path.join(__dirname, "..", "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const fileName = `bien_ban_kiem_ke_${id}_${Date.now()}.xlsx`;
    const filePath = path.join(tempDir, fileName);

    await workbook.xlsx.writeFile(filePath);

    // Trả về thông tin file
    sendResponse(res, 200, true, "Tạo biên bản kiểm kê Excel thành công", {
      fileName: fileName,
      filePath: `/temp/${fileName}`,
      downloadUrl: `/api/download-temp/${fileName}`,
    });
  } catch (error) {
    console.error("Generate Kiem Ke Excel error:", error);
    sendResponse(res, 500, false, "Lỗi tạo file Excel");
  }
};

// Hàm tạo báo cáo luân chuyển kho theo quý

// const generateLuanChuyenKhoReport = async (req, res, query, user) => {
//   try {
//     const { tu_ngay, den_ngay, phong_ban_id } = query;

//     if (!tu_ngay || !den_ngay) {
//       return sendResponse(res, 400, false, "Vui lòng chọn khoảng thời gian");
//     }

//     console.log(`📊 Generating report from ${tu_ngay} to ${den_ngay}`);

//     // Xác định phòng ban dựa trên role
//     let phongBanFilter = "";
//     let queryParams = [];
//     let paramIndex = 1;

//     if (user.role === "user") {
//       // Cấp 3: Chỉ xem được phòng ban của mình
//       phongBanFilter = `AND pb.id = $${paramIndex}`;
//       queryParams.push(user.phong_ban_id);
//       paramIndex++;
//     } else if (user.role === "manager") {
//       // Cấp 2: Xem được phòng ban của mình và các phòng ban cấp 3 dưới quyền
//       if (phong_ban_id && phong_ban_id !== "all") {
//         phongBanFilter = `AND pb.id = $${paramIndex}`;
//         queryParams.push(phong_ban_id);
//         paramIndex++;
//       } else {
//         // Nếu chọn "all", chỉ xem được phòng ban của mình và các phòng ban cấp 3 dưới quyền
//         phongBanFilter = `AND (pb.id = $${paramIndex} OR pb.id IN (
//           SELECT id FROM phong_ban WHERE phong_ban_cha_id = $${paramIndex} AND cap_bac = 3
//         ))`;
//         queryParams.push(user.phong_ban_id);
//         paramIndex++;
//       }
//     } else if (user.role === "admin") {
//       // Cấp 1: Xem được tất cả
//       if (phong_ban_id && phong_ban_id !== "all") {
//         phongBanFilter = `AND pb.id = $${paramIndex}`;
//         queryParams.push(phong_ban_id);
//         paramIndex++;
//       }
//     }

//     queryParams.push(tu_ngay, den_ngay);

//     // Query chính lấy dữ liệu luân chuyển
//     const mainQuery = `
//       WITH phong_ban_list AS (
//         SELECT DISTINCT id AS phong_ban_id
//         FROM phong_ban pb
//         WHERE 1=1 ${phongBanFilter}
//       ),
//       phieu_nhap_completed AS (
//         SELECT
//           pn.phong_ban_id,
//           pn.ngay_nhap,
//           pn.tong_tien,
//           pn.loai_phieu
//         FROM phieu_nhap pn
//         JOIN phong_ban pb ON pn.phong_ban_id = pb.id
//         WHERE pn.trang_thai = 'completed'
//         ${phongBanFilter}
//       ),
//       phieu_xuat_completed AS (
//         SELECT
//           px.phong_ban_id,
//           px.ngay_xuat,
//           px.id AS phieu_xuat_id,
//           px.ly_do_xuat,
//           px.loai_xuat
//         FROM phieu_xuat px
//         JOIN phong_ban pb ON px.phong_ban_id = pb.id
//         WHERE px.trang_thai = 'completed'
//         ${phongBanFilter}
//       ),
//       ton_dau_ky AS (
//         SELECT
//           pbl.phong_ban_id,
//           (COALESCE((
//             SELECT SUM(pn.tong_tien)
//             FROM phieu_nhap_completed pn
//             WHERE pn.phong_ban_id = pbl.phong_ban_id
//               AND pn.ngay_nhap < $${paramIndex}
//           ), 0) -
//           COALESCE((
//             SELECT SUM(ctx.so_luong_thuc_xuat * ctx.don_gia)
//             FROM chi_tiet_xuat ctx
//             JOIN phieu_xuat_completed px ON ctx.phieu_xuat_id = px.phieu_xuat_id
//             WHERE px.phong_ban_id = pbl.phong_ban_id
//               AND px.ngay_xuat < $${paramIndex}
//           ), 0)) AS ton_dau
//         FROM phong_ban_list pbl
//       ),
//       nhap_trong_ky AS (
//         SELECT
//           phong_ban_id,
//           SUM(CASE WHEN loai_phieu = 'tren_cap' THEN tong_tien ELSE 0 END) AS nhap_chuyen_cap,
//           SUM(CASE WHEN loai_phieu = 'tu_mua' THEN tong_tien ELSE 0 END) AS nhap_mua_sam,
//           SUM(CASE WHEN loai_phieu NOT IN ('tren_cap', 'tu_mua') THEN tong_tien ELSE 0 END) AS nhap_khac
//         FROM phieu_nhap_completed
//         WHERE ngay_nhap BETWEEN $${paramIndex} AND $${paramIndex + 1}
//         GROUP BY phong_ban_id
//       ),
//       xuat_trong_ky AS (
//         SELECT
//           px.phong_ban_id,
//           SUM(CASE WHEN ctx.loai_phieu_nhap = 'tren_cap' THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) AS xuat_tren_cap,
//           SUM(CASE WHEN ctx.loai_phieu_nhap = 'tu_mua' THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) AS xuat_tu_mua,
//           SUM(CASE WHEN ctx.loai_phieu_nhap NOT IN ('tren_cap', 'tu_mua') OR ctx.loai_phieu_nhap IS NULL
//                THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) AS xuat_khac,
//           SUM(CASE WHEN px.loai_xuat = 'don_vi_su_dung' AND ctx.loai_phieu_nhap = 'tren_cap' THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) AS xuat_su_dung_tren_cap,
//           SUM(CASE WHEN px.loai_xuat = 'don_vi_nhan' AND ctx.loai_phieu_nhap = 'tren_cap' THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) AS xuat_cap_cho_tren_cap,
//           SUM(CASE WHEN px.ly_do_xuat LIKE '%thanh lý%' AND ctx.loai_phieu_nhap = 'tren_cap' THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) AS xuat_thanh_ly_tren_cap,
//           SUM(CASE WHEN px.loai_xuat = 'don_vi_su_dung' AND ctx.loai_phieu_nhap = 'tu_mua' THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) AS xuat_su_dung_tu_mua,
//           SUM(CASE WHEN px.loai_xuat = 'don_vi_nhan' AND ctx.loai_phieu_nhap = 'tu_mua' THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) AS xuat_cap_cho_tu_mua,
//           SUM(CASE WHEN px.ly_do_xuat LIKE '%thanh lý%' AND ctx.loai_phieu_nhap = 'tu_mua' THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) AS xuat_thanh_ly_tu_mua,
//           SUM(CASE WHEN px.loai_xuat = 'don_vi_su_dung' AND (ctx.loai_phieu_nhap NOT IN ('tren_cap', 'tu_mua') OR ctx.loai_phieu_nhap IS NULL)
//                THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) AS xuat_su_dung_khac,
//           SUM(CASE WHEN px.loai_xuat = 'don_vi_nhan' AND (ctx.loai_phieu_nhap NOT IN ('tren_cap', 'tu_mua') OR ctx.loai_phieu_nhap IS NULL)
//                THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) AS xuat_cap_cho_khac,
//           SUM(CASE WHEN px.ly_do_xuat LIKE '%thanh lý%' AND (ctx.loai_phieu_nhap NOT IN ('tren_cap', 'tu_mua') OR ctx.loai_phieu_nhap IS NULL)
//                THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) AS xuat_thanh_ly_khac,
//           SUM(ctx.so_luong_thuc_xuat * ctx.don_gia) AS tong_xuat
//         FROM phieu_xuat_completed px
//         JOIN chi_tiet_xuat ctx ON px.phieu_xuat_id = ctx.phieu_xuat_id
//         WHERE px.ngay_xuat BETWEEN $${paramIndex} AND $${paramIndex + 1}
//         GROUP BY px.phong_ban_id
//       )
//       SELECT
//         pb.id,
//         pb.ten_phong_ban,
//         pb.ma_phong_ban,
//         COALESCE(tdq.ton_dau, 0) AS ton_dau_quy,
//         COALESCE(ntq.nhap_chuyen_cap, 0) AS nhap_chuyen_cap,
//         COALESCE(ntq.nhap_mua_sam, 0) AS nhap_mua_sam,
//         COALESCE(ntq.nhap_khac, 0) AS nhap_khac,
//         (COALESCE(ntq.nhap_chuyen_cap, 0) + COALESCE(ntq.nhap_mua_sam, 0) + COALESCE(ntq.nhap_khac, 0)) AS cong_nhap,
//         COALESCE(xtq.xuat_su_dung_tren_cap, 0) AS xuat_su_dung_tren_cap,
//         COALESCE(xtq.xuat_cap_cho_tren_cap, 0) AS xuat_cap_cho_tren_cap,
//         COALESCE(xtq.xuat_thanh_ly_tren_cap, 0) AS xuat_thanh_ly_tren_cap,
//         COALESCE(xtq.xuat_tren_cap, 0) AS xuat_tren_cap,
//         COALESCE(xtq.xuat_su_dung_tu_mua, 0) AS xuat_su_dung_tu_mua,
//         COALESCE(xtq.xuat_cap_cho_tu_mua, 0) AS xuat_cap_cho_tu_mua,
//         COALESCE(xtq.xuat_thanh_ly_tu_mua, 0) AS xuat_thanh_ly_tu_mua,
//         COALESCE(xtq.xuat_tu_mua, 0) AS xuat_tu_mua,
//         COALESCE(xtq.xuat_su_dung_khac, 0) AS xuat_su_dung_khac,
//         COALESCE(xtq.xuat_cap_cho_khac, 0) AS xuat_cap_cho_khac,
//         COALESCE(xtq.xuat_thanh_ly_khac, 0) AS xuat_thanh_ly_khac,
//         COALESCE(xtq.xuat_khac, 0) AS xuat_khac,
//         COALESCE(xtq.tong_xuat, 0) AS cong_xuat,
//         (COALESCE(tdq.ton_dau, 0) +
//          COALESCE(ntq.nhap_chuyen_cap, 0) + COALESCE(ntq.nhap_mua_sam, 0) + COALESCE(ntq.nhap_khac, 0) -
//          COALESCE(xtq.tong_xuat, 0)) AS ton_cuoi_quy
//       FROM phong_ban pb
//       LEFT JOIN ton_dau_ky tdq ON pb.id = tdq.phong_ban_id
//       LEFT JOIN nhap_trong_ky ntq ON pb.id = ntq.phong_ban_id
//       LEFT JOIN xuat_trong_ky xtq ON pb.id = xtq.phong_ban_id
//       WHERE 1=1 ${phongBanFilter}
//       ORDER BY pb.ma_phong_ban
//     `;

//     console.log("🔍 Executing query with params:", queryParams);
//     const result = await pool.query(mainQuery, queryParams);
//     const data = result.rows || [];

//     console.log(`📊 Found ${data.length} records`);

//     // Đảm bảo có dữ liệu mặc định nếu không có kết quả
//     if (data.length === 0) {
//       console.log("⚠️ No data found, creating default entry");
//       data.push({
//         id: 1,
//         ten_phong_ban: "Không có dữ liệu",
//         ma_phong_ban: "000",
//         ton_dau_quy: 0,
//         nhap_chuyen_cap: 0,
//         nhap_mua_sam: 0,
//         nhap_khac: 0,
//         cong_nhap: 0,
//         xuat_su_dung_tren_cap: 0,
//         xuat_cap_cho_tren_cap: 0,
//         xuat_thanh_ly_tren_cap: 0,
//         xuat_tren_cap: 0,
//         xuat_su_dung_tu_mua: 0,
//         xuat_cap_cho_tu_mua: 0,
//         xuat_thanh_ly_tu_mua: 0,
//         xuat_tu_mua: 0,
//         xuat_su_dung_khac: 0,
//         xuat_cap_cho_khac: 0,
//         xuat_thanh_ly_khac: 0,
//         xuat_khac: 0,
//         cong_xuat: 0,
//         ton_cuoi_quy: 0,
//       });
//     }

//     // Tạo workbook Excel
//     const workbook = new ExcelJS.Workbook();

//     // Tạo sheet chính
//     const mainSheet = workbook.addWorksheet("Tổng hợp luân chuyển kho");
//     await createMainSheet(mainSheet, data, tu_ngay, den_ngay);

//     // Tạo 3 sheet phụ
//     await createSubSheet(
//       workbook,
//       "Trên cấp",
//       data,
//       tu_ngay,
//       den_ngay,
//       "nhap_chuyen_cap",
//       "xuat_tren_cap"
//     );
//     await createSubSheet(
//       workbook,
//       "Tự mua sắm",
//       data,
//       tu_ngay,
//       den_ngay,
//       "nhap_mua_sam",
//       "xuat_tu_mua"
//     );
//     await createSubSheet(
//       workbook,
//       "Khác",
//       data,
//       tu_ngay,
//       den_ngay,
//       "nhap_khac",
//       "xuat_khac"
//     );

//     console.log("📝 Workbook created successfully");

//     // Tạo buffer từ workbook
//     const buffer = await workbook.xlsx.writeBuffer();

//     console.log(`✅ Excel buffer created, size: ${buffer.length} bytes`);

//     // Đảm bảo buffer không rỗng
//     if (buffer.length === 0) {
//       throw new Error("Generated Excel buffer is empty");
//     }

//     // SỬA: Tên file đúng format
//     const fileName = `bao-cao-luan-chuyen-kho-${tu_ngay}-${den_ngay}.xlsx`;

//     // Thiết lập header và gửi file
//     res.writeHead(200, {
//       "Content-Type":
//         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//       "Content-Disposition": `attachment; filename="${fileName}"`,
//       "Content-Length": buffer.length,
//       "Cache-Control": "no-cache, no-store, must-revalidate",
//       Pragma: "no-cache",
//       Expires: "0",
//     });

//     res.end(buffer);

//     console.log("✅ File sent successfully");
//   } catch (error) {
//     console.error("❌ Generate Excel error:", error);
//     console.error("❌ Error stack:", error.stack);

//     if (!res.headersSent) {
//       return sendResponse(res, 500, false, "Lỗi tạo báo cáo Excel", {
//         error: error.message,
//       });
//     }
//   }
// };

const generateLuanChuyenKhoReport = async (req, res, query, user) => {
  try {
    const { tu_ngay, den_ngay, phong_ban_id, signatures = {} } = query;

    if (!tu_ngay || !den_ngay) {
      return sendResponse(res, 400, false, "Vui lòng chọn khoảng thời gian");
    }

    console.log(`📊 Generating enhanced report from ${tu_ngay} to ${den_ngay}`);

    // Xác định phòng ban dựa trên role
    let phongBanFilter = "";
    let queryParams = [];
    let paramIndex = 1;

    if (user.role === "user") {
      // Cấp 3: Chỉ xem được phòng ban của mình
      phongBanFilter = `AND pb.id = $${paramIndex}`;
      queryParams.push(user.phong_ban_id);
      paramIndex++;
    } else if (user.role === "manager") {
      // Cấp 2: Xem được phòng ban của mình và các phòng ban cấp 3 dưới quyền
      if (phong_ban_id && phong_ban_id !== "all") {
        phongBanFilter = `AND pb.id = $${paramIndex}`;
        queryParams.push(phong_ban_id);
        paramIndex++;
      } else {
        phongBanFilter = `AND (pb.id = $${paramIndex} OR pb.id IN (
          SELECT id FROM phong_ban WHERE phong_ban_cha_id = $${paramIndex} AND cap_bac = 3
        ))`;
        queryParams.push(user.phong_ban_id);
        paramIndex++;
      }
    } else if (user.role === "admin") {
      // Cấp 1: Xem được tất cả
      if (phong_ban_id && phong_ban_id !== "all") {
        phongBanFilter = `AND pb.id = $${paramIndex}`;
        queryParams.push(phong_ban_id);
        paramIndex++;
      }
    }

    queryParams.push(tu_ngay, den_ngay);

    // Query lấy thông tin phòng ban để hiển thị trong báo cáo
    let phongBanInfo = null;
    if (phong_ban_id && phong_ban_id !== "all") {
      const pbQuery = await pool.query(
        "SELECT id, ten_phong_ban, ma_phong_ban, cap_bac FROM phong_ban WHERE id = $1",
        [phong_ban_id]
      );
      phongBanInfo = pbQuery.rows[0];
    } else {
      phongBanInfo = {
        ten_phong_ban: "Tất cả đơn vị",
        ma_phong_ban: "ALL",
        cap_bac: 0,
      };
    }

    // Query chính lấy dữ liệu luân chuyển (cải tiến để lấy đủ thông tin)
    const mainQuery = `
      WITH phong_ban_list AS (
        SELECT DISTINCT id AS phong_ban_id
        FROM phong_ban pb
        WHERE 1=1 ${phongBanFilter}
      ),
      phieu_nhap_completed AS (
        SELECT 
          pn.phong_ban_id,
          pn.ngay_nhap,
          pn.tong_tien,
          pn.loai_phieu
        FROM phieu_nhap pn
        JOIN phong_ban pb ON pn.phong_ban_id = pb.id
        WHERE pn.trang_thai = 'completed'
        ${phongBanFilter}
      ),
      phieu_xuat_completed AS (
        SELECT 
          px.phong_ban_id,
          px.ngay_xuat,
          px.id AS phieu_xuat_id,
          px.ly_do_xuat, 
          px.loai_xuat
        FROM phieu_xuat px
        JOIN phong_ban pb ON px.phong_ban_id = pb.id
        WHERE px.trang_thai = 'completed'
        ${phongBanFilter}
      ),
      ton_dau_ky AS (
        SELECT 
          pbl.phong_ban_id,
          (COALESCE((
            SELECT SUM(pn.tong_tien)
            FROM phieu_nhap_completed pn
            WHERE pn.phong_ban_id = pbl.phong_ban_id
              AND pn.ngay_nhap < $${paramIndex}
          ), 0) - 
          COALESCE((
            SELECT SUM(ctx.so_luong_thuc_xuat * ctx.don_gia)
            FROM chi_tiet_xuat ctx
            JOIN phieu_xuat_completed px ON ctx.phieu_xuat_id = px.phieu_xuat_id
            WHERE px.phong_ban_id = pbl.phong_ban_id
              AND px.ngay_xuat < $${paramIndex}
          ), 0)) AS ton_dau
        FROM phong_ban_list pbl
      ),
      nhap_trong_ky AS (
        SELECT 
          phong_ban_id,
          SUM(CASE WHEN loai_phieu = 'tren_cap' THEN tong_tien ELSE 0 END) AS nhap_chuyen_cap,
          SUM(CASE WHEN loai_phieu = 'tu_mua' THEN tong_tien ELSE 0 END) AS nhap_mua_sam,
          SUM(CASE WHEN loai_phieu NOT IN ('tren_cap', 'tu_mua') THEN tong_tien ELSE 0 END) AS nhap_khac
        FROM phieu_nhap_completed
        WHERE ngay_nhap BETWEEN $${paramIndex} AND $${paramIndex + 1}
        GROUP BY phong_ban_id
      ),
      xuat_trong_ky AS (
        SELECT 
          px.phong_ban_id,
          -- Xuất chi tiết theo loại và nguồn
          SUM(CASE WHEN px.loai_xuat = 'don_vi_su_dung' AND ctx.loai_phieu_nhap = 'tren_cap' THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) AS xuat_su_dung_tren_cap,
          SUM(CASE WHEN px.loai_xuat = 'don_vi_nhan' AND ctx.loai_phieu_nhap = 'tren_cap' THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) AS xuat_cap_cho_tren_cap,
          SUM(CASE WHEN px.ly_do_xuat LIKE '%thanh lý%' AND ctx.loai_phieu_nhap = 'tren_cap' THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) AS xuat_thanh_ly_tren_cap,
          SUM(CASE WHEN px.loai_xuat = 'don_vi_su_dung' AND ctx.loai_phieu_nhap = 'tu_mua' THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) AS xuat_su_dung_tu_mua,
          SUM(CASE WHEN px.loai_xuat = 'don_vi_nhan' AND ctx.loai_phieu_nhap = 'tu_mua' THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) AS xuat_cap_cho_tu_mua,
          SUM(CASE WHEN px.ly_do_xuat LIKE '%thanh lý%' AND ctx.loai_phieu_nhap = 'tu_mua' THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) AS xuat_thanh_ly_tu_mua,
          SUM(CASE WHEN px.loai_xuat = 'don_vi_su_dung' AND (ctx.loai_phieu_nhap NOT IN ('tren_cap', 'tu_mua') OR ctx.loai_phieu_nhap IS NULL) 
               THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) AS xuat_su_dung_khac,
          SUM(CASE WHEN px.loai_xuat = 'don_vi_nhan' AND (ctx.loai_phieu_nhap NOT IN ('tren_cap', 'tu_mua') OR ctx.loai_phieu_nhap IS NULL) 
               THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) AS xuat_cap_cho_khac,
          SUM(CASE WHEN px.ly_do_xuat LIKE '%thanh lý%' AND (ctx.loai_phieu_nhap NOT IN ('tren_cap', 'tu_mua') OR ctx.loai_phieu_nhap IS NULL) 
               THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) AS xuat_thanh_ly_khac,
          SUM(ctx.so_luong_thuc_xuat * ctx.don_gia) AS tong_xuat
        FROM phieu_xuat_completed px
        JOIN chi_tiet_xuat ctx ON px.phieu_xuat_id = ctx.phieu_xuat_id
        WHERE px.ngay_xuat BETWEEN ${paramIndex} AND ${paramIndex + 1}
        GROUP BY px.phong_ban_id
      )
      SELECT 
        pb.id,
        pb.ten_phong_ban,
        pb.ma_phong_ban,
        pb.cap_bac,
        pb.phong_ban_cha_id,
        COALESCE(tdq.ton_dau, 0) AS ton_dau_quy,
        COALESCE(ntq.nhap_chuyen_cap, 0) AS nhap_chuyen_cap,
        COALESCE(ntq.nhap_mua_sam, 0) AS nhap_mua_sam,
        COALESCE(ntq.nhap_khac, 0) AS nhap_khac,
        (COALESCE(ntq.nhap_chuyen_cap, 0) + COALESCE(ntq.nhap_mua_sam, 0) + COALESCE(ntq.nhap_khac, 0)) AS cong_nhap,
        -- Xuất sử dụng tổng hợp
        (COALESCE(xtq.xuat_su_dung_tren_cap, 0) + COALESCE(xtq.xuat_su_dung_tu_mua, 0) + COALESCE(xtq.xuat_su_dung_khac, 0)) AS xuat_su_dung,
        -- Cấp cho đơn vị tổng hợp
        (COALESCE(xtq.xuat_cap_cho_tren_cap, 0) + COALESCE(xtq.xuat_cap_cho_tu_mua, 0) + COALESCE(xtq.xuat_cap_cho_khac, 0)) AS xuat_cap_cho,
        -- Thanh lý tổng hợp
        (COALESCE(xtq.xuat_thanh_ly_tren_cap, 0) + COALESCE(xtq.xuat_thanh_ly_tu_mua, 0) + COALESCE(xtq.xuat_thanh_ly_khac, 0)) AS xuat_thanh_ly,
        -- Xuất khác = 0 cho báo cáo tổng hợp (vì đã phân loại rõ)
        0 AS xuat_khac,
        COALESCE(xtq.tong_xuat, 0) AS cong_xuat,
        -- Chi tiết theo từng loại cho các sheet con
        COALESCE(xtq.xuat_su_dung_tren_cap, 0) AS xuat_su_dung_tren_cap,
        COALESCE(xtq.xuat_cap_cho_tren_cap, 0) AS xuat_cap_cho_tren_cap,
        COALESCE(xtq.xuat_thanh_ly_tren_cap, 0) AS xuat_thanh_ly_tren_cap,
        COALESCE(xtq.xuat_su_dung_tu_mua, 0) AS xuat_su_dung_tu_mua,
        COALESCE(xtq.xuat_cap_cho_tu_mua, 0) AS xuat_cap_cho_tu_mua,
        COALESCE(xtq.xuat_thanh_ly_tu_mua, 0) AS xuat_thanh_ly_tu_mua,
        COALESCE(xtq.xuat_su_dung_khac, 0) AS xuat_su_dung_khac,
        COALESCE(xtq.xuat_cap_cho_khac, 0) AS xuat_cap_cho_khac,
        COALESCE(xtq.xuat_thanh_ly_khac, 0) AS xuat_thanh_ly_khac,
        (COALESCE(tdq.ton_dau, 0) + 
         COALESCE(ntq.nhap_chuyen_cap, 0) + COALESCE(ntq.nhap_mua_sam, 0) + COALESCE(ntq.nhap_khac, 0) - 
         COALESCE(xtq.tong_xuat, 0)) AS ton_cuoi_quy
      FROM phong_ban pb
      LEFT JOIN ton_dau_ky tdq ON pb.id = tdq.phong_ban_id
      LEFT JOIN nhap_trong_ky ntq ON pb.id = ntq.phong_ban_id
      LEFT JOIN xuat_trong_ky xtq ON pb.id = xtq.phong_ban_id
      WHERE 1=1 ${phongBanFilter}
      ORDER BY pb.cap_bac, pb.ma_phong_ban
    `;

    console.log("🔍 Executing enhanced query with params:", queryParams);
    const result = await pool.query(mainQuery, queryParams);
    const data = result.rows || [];

    console.log(`📊 Found ${data.length} records for enhanced report`);

    // Đảm bảo có dữ liệu mặc định nếu không có kết quả
    if (data.length === 0) {
      console.log("⚠️ No data found, creating default entry");
      data.push({
        id: phongBanInfo?.id || 1,
        ten_phong_ban: phongBanInfo?.ten_phong_ban || "Không có dữ liệu",
        ma_phong_ban: phongBanInfo?.ma_phong_ban || "000",
        cap_bac: phongBanInfo?.cap_bac || 3,
        phong_ban_cha_id: null,
        ton_dau_quy: 0,
        nhap_chuyen_cap: 0,
        nhap_mua_sam: 0,
        nhap_khac: 0,
        cong_nhap: 0,
        xuat_su_dung: 0,
        xuat_cap_cho: 0,
        xuat_thanh_ly: 0,
        xuat_khac: 0,
        cong_xuat: 0,
        ton_cuoi_quy: 0,
        // Chi tiết cho sheet con
        xuat_su_dung_tren_cap: 0,
        xuat_cap_cho_tren_cap: 0,
        xuat_thanh_ly_tren_cap: 0,
        xuat_su_dung_tu_mua: 0,
        xuat_cap_cho_tu_mua: 0,
        xuat_thanh_ly_tu_mua: 0,
        xuat_su_dung_khac: 0,
        xuat_cap_cho_khac: 0,
        xuat_thanh_ly_khac: 0,
      });
    }

    // Tạo workbook Excel với format nâng cao
    const workbook = new ExcelJS.Workbook();

    // Metadata cho workbook
    workbook.creator = signatures.nguoi_lap || "System";
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastModifiedBy = signatures.nguoi_lap || "System";

    // Tạo sheet chính với format nâng cao
    const mainSheet = workbook.addWorksheet("Tổng hợp luân chuyển kho");
    await createMainSheetEnhanced(
      mainSheet,
      data,
      tu_ngay,
      den_ngay,
      phongBanInfo,
      signatures
    );

    // Tạo 3 sheet phụ với format nâng cao
    await createSubSheetEnhanced(
      workbook,
      "Trên cấp",
      data,
      tu_ngay,
      den_ngay,
      "nhap_chuyen_cap",
      [
        "xuat_su_dung_tren_cap",
        "xuat_cap_cho_tren_cap",
        "xuat_thanh_ly_tren_cap",
      ],
      phongBanInfo,
      signatures
    );

    await createSubSheetEnhanced(
      workbook,
      "Tự mua sắm",
      data,
      tu_ngay,
      den_ngay,
      "nhap_mua_sam",
      ["xuat_su_dung_tu_mua", "xuat_cap_cho_tu_mua", "xuat_thanh_ly_tu_mua"],
      phongBanInfo,
      signatures
    );

    await createSubSheetEnhanced(
      workbook,
      "Khác",
      data,
      tu_ngay,
      den_ngay,
      "nhap_khac",
      ["xuat_su_dung_khac", "xuat_cap_cho_khac", "xuat_thanh_ly_khac"],
      phongBanInfo,
      signatures
    );

    console.log("📝 Enhanced workbook created successfully");

    // Tạo buffer từ workbook
    const buffer = await workbook.xlsx.writeBuffer();

    console.log(
      `✅ Enhanced Excel buffer created, size: ${buffer.length} bytes`
    );

    // Đảm bảo buffer không rỗng
    if (buffer.length === 0) {
      throw new Error("Generated Excel buffer is empty");
    }

    // Tạo tên file với thông tin phòng ban
    const phongBanCode = phongBanInfo?.ma_phong_ban || "ALL";
    const fileName = `bao-cao-luan-chuyen-kho-${phongBanCode}-${tu_ngay}-${den_ngay}.xlsx`;

    // Thiết lập header và gửi file
    res.writeHead(200, {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": buffer.length,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    res.end(buffer);

    console.log("✅ Enhanced file sent successfully");
  } catch (error) {
    console.error("❌ Generate Enhanced Excel error:", error);
    console.error("❌ Error stack:", error.stack);

    if (!res.headersSent) {
      return sendResponse(res, 500, false, "Lỗi tạo báo cáo Excel nâng cao", {
        error: error.message,
      });
    }
  }
};

// Hàm tạo sheet chính với format nâng cao
const createMainSheetEnhanced = async (
  sheet,
  data,
  tu_ngay,
  den_ngay,
  phongBanInfo,
  signatures
) => {
  // Thiết lập độ rộng cột
  sheet.columns = [
    { width: 35 }, // Nội dung
    { width: 15 }, // Tồn kho đầu quý
    { width: 15 }, // Nhập kho trong quý
    { width: 15 }, // Xuất sử dụng
    { width: 15 }, // Cấp cho đơn vị
    { width: 15 }, // Thanh lý, nhượng bán
    { width: 15 }, // Khác
    { width: 15 }, // Cộng xuất
    { width: 15 }, // Tồn cuối quý
  ];

  // Format ngày tháng cho tiêu đề
  const startDate = new Date(tu_ngay);
  const endDate = new Date(den_ngay);
  const startQuarter = Math.ceil((startDate.getMonth() + 1) / 3);
  const startYear = startDate.getFullYear();

  // Header chính của báo cáo
  const headerRows = [
    // Row 1: CẢNH SÁT BIỂN VIỆT NAM - TỔNG HỢP GIÁ TRỊ VẬT TƯ HÀNG HÓA - Phụ biểu số
    {
      values: [
        "CẢNH SÁT BIỂN VIỆT NAM",
        "",
        "",
        `TỔNG HỢP GIÁ TRỊ VẬT TƯ HÀNG HÓA TRÊN CẤP LUÂN CHUYỂN QUA KHO QUÝ ${startQuarter}/${startYear}`,
        "",
        "",
        "",
        "Phụ biểu số: 07.1/BCQT",
      ],
      merges: [
        { range: "A1:C1", value: "CẢNH SÁT BIỂN VIỆT NAM" },
        {
          range: "D1:G1",
          value: `TỔNG HỢP GIÁ TRỊ VẬT TƯ HÀNG HÓA TRÊN CẤP LUÂN CHUYỂN QUA KHO QUÝ ${startQuarter}/${startYear}`,
        },
      ],
    },
    // Row 2: BỘ TƯ LỆNH - Đơn vị - Đơn vị tính
    {
      values: [
        "BỘ TƯ LỆNH",
        "",
        "",
        `Đơn vị: ${phongBanInfo?.ten_phong_ban || "Phòng Hậu cần - Kỹ thuật"}`,
        "",
        "",
        "",
        "Đơn vị tính: Đồng",
      ],
      merges: [
        { range: "A2:C2", value: "BỘ TƯ LỆNH" },
        {
          range: "D2:G2",
          value: `Đơn vị: ${
            phongBanInfo?.ten_phong_ban || "Phòng Hậu cần - Kỹ thuật"
          }`,
        },
      ],
    },
    // Row 3: VÙNG CẢNH SÁT BIỂN 1
    {
      values: ["VÙNG CẢNH SÁT BIỂN 1", "", "", "", "", "", "", ""],
      merges: [{ range: "A3:I3", value: "VÙNG CẢNH SÁT BIỂN 1" }],
    },
    // Row 4: Khoảng trống
    {
      values: ["", "", "", "", "", "", "", "", ""],
    },
  ];

  // Thêm các header rows
  headerRows.forEach((row, index) => {
    const excelRow = sheet.addRow(row.values);

    // Apply merges
    if (row.merges) {
      row.merges.forEach((merge) => {
        sheet.mergeCells(merge.range);
        if (merge.value) {
          sheet.getCell(merge.range.split(":")[0]).value = merge.value;
        }
      });
    }

    // Apply styles cho header
    excelRow.eachCell((cell) => {
      cell.font = { bold: true, size: 11 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
  });

  // Header bảng dữ liệu chính
  const tableHeader1 = sheet.addRow([
    "Nội dung",
    "Tồn kho đầu quý",
    "Nhập kho trong quý",
    "",
    "",
    "",
    "",
    "Xuất kho trong quý",
    "Tồn cuối quý",
  ]);

  const tableHeader2 = sheet.addRow([
    "",
    "",
    "",
    "Xuất sử dụng",
    "Cấp cho đơn vị",
    "Thanh lý, nhượng bán",
    "Khác",
    "Cộng xuất",
    "",
  ]);

  // Style cho header bảng
  [tableHeader1, tableHeader2].forEach((row) => {
    row.eachCell((cell) => {
      cell.font = { bold: true, size: 10 };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6E6FA" },
      };
    });
  });

  // Merge cells cho header bảng
  sheet.mergeCells(`A${tableHeader1.number}:A${tableHeader2.number}`); // Nội dung
  sheet.mergeCells(`B${tableHeader1.number}:B${tableHeader2.number}`); // Tồn đầu
  sheet.mergeCells(`C${tableHeader1.number}:G${tableHeader1.number}`); // Nhập trong quý
  sheet.mergeCells(`H${tableHeader1.number}:H${tableHeader2.number}`); // Xuất kho (title)
  sheet.mergeCells(`I${tableHeader1.number}:I${tableHeader2.number}`); // Tồn cuối

  // Render dữ liệu với phân cấp
  await renderDataWithHierarchy(sheet, data, tableHeader2.number + 1);

  // Footer với thông tin ngày tháng và chữ ký
  await addFooterWithSignatures(sheet, signatures);
};

// Hàm render dữ liệu với phân cấp
const renderDataWithHierarchy = async (sheet, data, startRow) => {
  let currentRow = startRow;

  // Nhóm dữ liệu theo cấp
  const cap1Items = data.filter((item) => item.cap_bac === 1) || [];
  const cap2Items = data.filter((item) => item.cap_bac === 2) || [];
  const cap3Items = data.filter((item) => item.cap_bac === 3) || [];

  // Render cấp 1
  cap1Items.forEach((item) => {
    const row = sheet.addRow([
      item.ten_phong_ban,
      parseFloat(item.ton_dau_quy || 0),
      parseFloat(item.cong_nhap || 0),
      parseFloat(item.xuat_su_dung || 0),
      parseFloat(item.xuat_cap_cho || 0),
      parseFloat(item.xuat_thanh_ly || 0),
      parseFloat(item.xuat_khac || 0),
      parseFloat(item.cong_xuat || 0),
      parseFloat(item.ton_cuoi_quy || 0),
    ]);

    // Style cho cấp 1 (màu xanh đậm)
    applyCap1Style(row);
  });

  // Render cấp 2 và cấp 3 con
  cap2Items.forEach((cap2Item) => {
    // Thêm dòng cấp 2
    const cap2Row = sheet.addRow([
      `  ${cap2Item.ten_phong_ban}`,
      parseFloat(cap2Item.ton_dau_quy || 0),
      parseFloat(cap2Item.cong_nhap || 0),
      parseFloat(cap2Item.xuat_su_dung || 0),
      parseFloat(cap2Item.xuat_cap_cho || 0),
      parseFloat(cap2Item.xuat_thanh_ly || 0),
      parseFloat(cap2Item.xuat_khac || 0),
      parseFloat(cap2Item.cong_xuat || 0),
      parseFloat(cap2Item.ton_cuoi_quy || 0),
    ]);

    // Style cho cấp 2
    applyCap2Style(cap2Row);

    // Thêm các cấp 3 thuộc cấp 2 này
    const cap3ForThisCap2 = cap3Items.filter(
      (cap3) => cap3.phong_ban_cha_id === cap2Item.id
    );
    cap3ForThisCap2.forEach((cap3Item) => {
      const cap3Row = sheet.addRow([
        `    - ${cap3Item.ten_phong_ban}`,
        parseFloat(cap3Item.ton_dau_quy || 0),
        parseFloat(cap3Item.cong_nhap || 0),
        parseFloat(cap3Item.xuat_su_dung || 0),
        parseFloat(cap3Item.xuat_cap_cho || 0),
        parseFloat(cap3Item.xuat_thanh_ly || 0),
        parseFloat(cap3Item.xuat_khac || 0),
        parseFloat(cap3Item.cong_xuat || 0),
        parseFloat(cap3Item.ton_cuoi_quy || 0),
      ]);

      // Style cho cấp 3
      applyCap3Style(cap3Row);
    });
  });

  // Orphan cấp 3 (cho user cấp 3)
  const orphanCap3 = cap3Items.filter(
    (cap3) => !cap2Items.find((cap2) => cap2.id === cap3.phong_ban_cha_id)
  );

  orphanCap3.forEach((cap3Item) => {
    const row = sheet.addRow([
      cap3Item.ten_phong_ban,
      parseFloat(cap3Item.ton_dau_quy || 0),
      parseFloat(cap3Item.cong_nhap || 0),
      parseFloat(cap3Item.xuat_su_dung || 0),
      parseFloat(cap3Item.xuat_cap_cho || 0),
      parseFloat(cap3Item.xuat_thanh_ly || 0),
      parseFloat(cap3Item.xuat_khac || 0),
      parseFloat(cap3Item.cong_xuat || 0),
      parseFloat(cap3Item.ton_cuoi_quy || 0),
    ]);

    // Style đặc biệt cho orphan cap3
    applyOrphanCap3Style(row);
  });

  // Thêm dòng tổng cộng
  const totalRow = sheet.addRow([
    "Tổng cộng",
    data.reduce((sum, item) => sum + (parseFloat(item.ton_dau_quy) || 0), 0),
    data.reduce((sum, item) => sum + (parseFloat(item.cong_nhap) || 0), 0),
    data.reduce((sum, item) => sum + (parseFloat(item.xuat_su_dung) || 0), 0),
    data.reduce((sum, item) => sum + (parseFloat(item.xuat_cap_cho) || 0), 0),
    data.reduce((sum, item) => sum + (parseFloat(item.xuat_thanh_ly) || 0), 0),
    data.reduce((sum, item) => sum + (parseFloat(item.xuat_khac) || 0), 0),
    data.reduce((sum, item) => sum + (parseFloat(item.cong_xuat) || 0), 0),
    data.reduce((sum, item) => sum + (parseFloat(item.ton_cuoi_quy) || 0), 0),
  ]);

  // Style cho dòng tổng cộng
  applyTotalRowStyle(totalRow);
};

// Hàm style cho các cấp
const applyCap1Style = (row) => {
  row.eachCell((cell, colNumber) => {
    cell.border = getBorder();
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFB0E0E6" },
    };
    cell.font = { bold: true, size: 10 };
    cell.alignment =
      colNumber === 1
        ? { horizontal: "left", vertical: "middle" }
        : { horizontal: "right", vertical: "middle" };
    if (colNumber > 1) cell.numFmt = "#,##0";
  });
};

const applyCap2Style = (row) => {
  row.eachCell((cell, colNumber) => {
    cell.border = getBorder();
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFF99" },
    };
    cell.font = { bold: true, size: 9, italic: true };
    cell.alignment =
      colNumber === 1
        ? { horizontal: "left", vertical: "middle" }
        : { horizontal: "right", vertical: "middle" };
    if (colNumber > 1) cell.numFmt = "#,##0";
  });
};

const applyCap3Style = (row) => {
  row.eachCell((cell, colNumber) => {
    cell.border = getBorder();
    cell.font = { size: 9 };
    cell.alignment =
      colNumber === 1
        ? { horizontal: "left", vertical: "middle" }
        : { horizontal: "right", vertical: "middle" };
    if (colNumber > 1) cell.numFmt = "#,##0";
  });
};

const applyOrphanCap3Style = (row) => {
  row.eachCell((cell, colNumber) => {
    cell.border = getBorder();
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0F6FF" },
    };
    cell.font = { bold: true, size: 10 };
    cell.alignment =
      colNumber === 1
        ? { horizontal: "left", vertical: "middle" }
        : { horizontal: "right", vertical: "middle" };
    if (colNumber > 1) cell.numFmt = "#,##0";
  });
};

const applyTotalRowStyle = (row) => {
  row.eachCell((cell, colNumber) => {
    cell.font = { bold: true, size: 10 };
    cell.border = {
      top: { style: "thick" },
      left: { style: "thin" },
      bottom: { style: "thick" },
      right: { style: "thin" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };
    cell.alignment =
      colNumber === 1
        ? { horizontal: "center", vertical: "middle" }
        : { horizontal: "right", vertical: "middle" };
    if (colNumber > 1) cell.numFmt = "#,##0";
  });
};

const getBorder = () => ({
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
});

// Hàm thêm footer với chữ ký
const addFooterWithSignatures = async (sheet, signatures) => {
  const currentDate = new Date();
  const dateStr = `Ngày ${currentDate
    .getDate()
    .toString()
    .padStart(2, "0")} tháng ${(currentDate.getMonth() + 1)
    .toString()
    .padStart(2, "0")} năm ${currentDate.getFullYear()}`;

  // Thêm khoảng trống
  sheet.addRow([""]);
  sheet.addRow([""]);

  // Thêm ngày tháng
  const dateRow = sheet.addRow(["", "", "", "", "", "", "", dateStr]);
  dateRow.getCell(8).alignment = { horizontal: "center", vertical: "middle" };
  dateRow.getCell(8).font = { italic: true, size: 10 };

  // Thêm khoảng trống cho chữ ký
  sheet.addRow([""]);

  // Thêm header chữ ký
  const signatureHeaderRow = sheet.addRow([
    "NGƯỜI LẬP BIỂU",
    "",
    "TRƯỞNG BAN VẬT TƯ",
    "",
    "",
    "TL. TƯ LỆNH",
    "",
    "CHỦ NHIỆM HẬU CẦN - KỸ THUẬT",
  ]);

  signatureHeaderRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  // Merge cells cho chữ ký
  sheet.mergeCells(
    `A${signatureHeaderRow.number}:B${signatureHeaderRow.number}`
  );
  sheet.mergeCells(
    `C${signatureHeaderRow.number}:D${signatureHeaderRow.number}`
  );
  sheet.mergeCells(
    `F${signatureHeaderRow.number}:G${signatureHeaderRow.number}`
  );

  // Thêm khoảng trống cho chữ ký
  for (let i = 0; i < 3; i++) {
    sheet.addRow([""]);
  }

  // Thêm tên người ký
  const nameRow = sheet.addRow([
    signatures.nguoi_lap || "",
    "",
    signatures.truong_ban || "",
    "",
    "",
    "",
    "",
    signatures.chu_nhiem || "",
  ]);

  nameRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  // Merge cells cho tên
  sheet.mergeCells(`A${nameRow.number}:B${nameRow.number}`);
  sheet.mergeCells(`C${nameRow.number}:D${nameRow.number}`);
};

// Hàm tạo sheet phụ với format nâng cao
const createSubSheetEnhanced = async (
  workbook,
  sheetName,
  data,
  tu_ngay,
  den_ngay,
  nhapField,
  xuatFields,
  phongBanInfo,
  signatures
) => {
  const sheet = workbook.addWorksheet(sheetName);

  // Set column widths
  sheet.columns = [
    { width: 35 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
  ];

  // Tạo data cho sheet con dựa trên field tương ứng
  const filteredData = data
    .map((item) => {
      const nhapValue = parseFloat(item[nhapField]) || 0;
      const xuatSuDung = parseFloat(item[xuatFields[0]]) || 0;
      const xuatCapCho = parseFloat(item[xuatFields[1]]) || 0;
      const xuatThanhLy = parseFloat(item[xuatFields[2]]) || 0;
      const tongXuat = xuatSuDung + xuatCapCho + xuatThanhLy;

      return {
        ...item,
        cong_nhap: nhapValue,
        xuat_su_dung: xuatSuDung,
        xuat_cap_cho: xuatCapCho,
        xuat_thanh_ly: xuatThanhLy,
        xuat_khac: 0,
        cong_xuat: tongXuat,
        ton_cuoi_quy:
          (parseFloat(item.ton_dau_quy) || 0) + nhapValue - tongXuat,
      };
    })
    .filter(
      (item) => item.cong_nhap > 0 || item.cong_xuat > 0 || item.ton_dau_quy > 0
    );

  // Thiết lập độ rộng cột giống main sheet
  sheet.columns = [
    { width: 35 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
  ];

  // Format ngày tháng cho tiêu đề
  const startDate = new Date(tu_ngay);
  const startQuarter = Math.ceil((startDate.getMonth() + 1) / 3);
  const startYear = startDate.getFullYear();

  // Tiêu đề tương ứng với từng sheet
  const titleMap = {
    "Trên cấp": "TỔNG HỢP GIÁ TRỊ VẬT TƯ HÀNG HÓA TRÊN CẤP LUÂN CHUYỂN QUA KHO",
    "Tự mua sắm":
      "TỔNG HỢP GIÁ TRỊ VẬT TƯ HÀNG HÓA TỰ MUA SẮM LUÂN CHUYỂN QUA KHO",
    Khác: "TỔNG HỢP GIÁ TRỊ VẬT TƯ HÀNG HÓA KHÁC LUÂN CHUYỂN QUA KHO",
  };

  const phieuBieuMap = {
    "Trên cấp": "07.1/BCQT",
    "Tự mua sắm": "07.2/BCQT",
    Khác: "07.3/BCQT",
  };

  // Header chính của báo cáo
  const headerRows = [
    // Row 1
    {
      values: [
        "CẢNH SÁT BIỂN VIỆT NAM",
        "",
        "",
        `${titleMap[sheetName]} QUÝ ${startQuarter}/${startYear}`,
        "",
        "",
        "",
        `Phụ biểu số: ${phieuBieuMap[sheetName]}`,
      ],
    },
    // Row 2
    {
      values: [
        "BỘ TƯ LỆNH",
        "",
        "",
        `Đơn vị: ${phongBanInfo?.ten_phong_ban || "Phòng Hậu cần - Kỹ thuật"}`,
        "",
        "",
        "",
        "Đơn vị tính: Đồng",
      ],
    },
    // Row 3
    {
      values: ["VÙNG CẢNH SÁT BIỂN 1", "", "", "", "", "", "", ""],
    },
    // Row 4: Khoảng trống
    {
      values: ["", "", "", "", "", "", "", "", ""],
    },
  ];

  // Thêm các header rows
  headerRows.forEach((row, index) => {
    const excelRow = sheet.addRow(row.values);

    // Apply merges
    if (index === 0) {
      sheet.mergeCells(`A${excelRow.number}:C${excelRow.number}`);
      sheet.mergeCells(`D${excelRow.number}:G${excelRow.number}`);
      sheet.getCell(`A${excelRow.number}`).value = "CẢNH SÁT BIỂN VIỆT NAM";
      sheet.getCell(
        `D${excelRow.number}`
      ).value = `${titleMap[sheetName]} QUÝ ${startQuarter}/${startYear}`;
    } else if (index === 1) {
      sheet.mergeCells(`A${excelRow.number}:C${excelRow.number}`);
      sheet.mergeCells(`D${excelRow.number}:G${excelRow.number}`);
      sheet.getCell(`A${excelRow.number}`).value = "BỘ TƯ LỆNH";
      sheet.getCell(`D${excelRow.number}`).value = `Đơn vị: ${
        phongBanInfo?.ten_phong_ban || "Phòng Hậu cần - Kỹ thuật"
      }`;
    } else if (index === 2) {
      sheet.mergeCells(`A${excelRow.number}:I${excelRow.number}`);
      sheet.getCell(`A${excelRow.number}`).value = "VÙNG CẢNH SÁT BIỂN 1";
    }

    // Apply styles cho header
    excelRow.eachCell((cell) => {
      cell.font = { bold: true, size: 11 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
  });

  // Header bảng dữ liệu chính
  const tableHeader1 = sheet.addRow([
    "Nội dung",
    "Tồn kho đầu quý",
    "Nhập kho trong quý",
    "",
    "",
    "",
    "",
    "Xuất kho trong quý",
    "Tồn cuối quý",
  ]);

  const tableHeader2 = sheet.addRow([
    "",
    "",
    "",
    "Xuất sử dụng",
    "Cấp cho đơn vị",
    "Thanh lý, nhượng bán",
    "Khác",
    "Cộng xuất",
    "",
  ]);

  // Style cho header bảng
  [tableHeader1, tableHeader2].forEach((row) => {
    row.eachCell((cell) => {
      cell.font = { bold: true, size: 10 };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = getBorder();
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6E6FA" },
      };
    });
  });

  // Merge cells cho header bảng
  sheet.mergeCells(`A${tableHeader1.number}:A${tableHeader2.number}`);
  sheet.mergeCells(`B${tableHeader1.number}:B${tableHeader2.number}`);
  sheet.mergeCells(`C${tableHeader1.number}:G${tableHeader1.number}`);
  sheet.mergeCells(`H${tableHeader1.number}:H${tableHeader2.number}`);
  sheet.mergeCells(`I${tableHeader1.number}:I${tableHeader2.number}`);

  // Render dữ liệu với phân cấp
  await renderDataWithHierarchy(sheet, filteredData, tableHeader2.number + 1);

  // Footer với thông tin ngày tháng và chữ ký
  await addFooterWithSignatures(sheet, signatures);
};

// const createMainSheet = async (worksheet, data, tu_ngay, den_ngay) => {
//   // Hàm helper để format ngày
//   const formatDate = (dateStr) => {
//     const date = new Date(dateStr);
//     return `${String(date.getDate()).padStart(2, "0")}/${String(
//       date.getMonth() + 1
//     ).padStart(2, "0")}/${date.getFullYear()}`;
//   };

//   // Đảm bảo data không undefined và là array
//   if (!data || !Array.isArray(data)) {
//     console.log("⚠️ Invalid data provided to createMainSheet:", data);
//     data = []; // Tạo mảng rỗng nếu không có dữ liệu
//   }

//   console.log("📊 Data for main sheet:", data.length, "records");

//   // Thiết lập độ rộng cột
//   worksheet.columns = [
//     { width: 20 }, // A - Nội dung
//     { width: 15 }, // B - Tồn kho đầu kỳ
//     { width: 15 }, // C - Trên cấp
//     { width: 15 }, // D - Tự mua sắm
//     { width: 15 }, // E - Khác
//     { width: 15 }, // F - Cộng nhập
//     { width: 15 }, // G - Xuất sử dụng
//     { width: 15 }, // H - Cấp cho đơn vị
//     { width: 15 }, // I - Thanh lý, nhượng bán
//     { width: 15 }, // J - Khác
//     { width: 15 }, // K - Cộng xuất
//     { width: 15 }, // L - Tồn kho cuối kỳ
//   ];

//   let currentRow = 1;

//   // Header - Dòng 1
//   worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
//   const headerLeft = worksheet.getCell(`A${currentRow}`);
//   headerLeft.value = "CẢNH SÁT BIỂN VIỆT NAM\nBỘ TƯ LỆNH\nVÙNG CẢNH SÁT BIỂN 1";
//   headerLeft.font = {
//     name: "Times New Roman",
//     size: 12,
//     bold: true,
//     color: { argb: "0000FF" },
//   };
//   headerLeft.alignment = {
//     horizontal: "center",
//     vertical: "middle",
//     wrapText: true,
//   };

//   worksheet.mergeCells(`G${currentRow}:L${currentRow}`);
//   const headerRight = worksheet.getCell(`G${currentRow}`);
//   headerRight.value = `Mẫu biểu số: 07/BCQT`;
//   headerRight.font = { name: "Times New Roman", size: 11 };
//   headerRight.alignment = { horizontal: "right", vertical: "middle" };

//   currentRow += 3;

//   // Tiêu đề chính hiển thị khoảng thời gian thực tế
//   worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
//   const title = worksheet.getCell(`A${currentRow}`);
//   title.value = `TỔNG HỢP GIÁ TRỊ VẬT TƯ HÀNG HÓA LUÂN CHUYỂN QUA KHO`;
//   title.font = { name: "Times New Roman", size: 16, bold: true };
//   title.alignment = { horizontal: "center", vertical: "middle" };

//   currentRow++;

//   // Thêm dòng hiển thị khoảng thời gian
//   worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
//   const timeRange = worksheet.getCell(`A${currentRow}`);
//   timeRange.value = `Từ ngày ${formatDate(tu_ngay)} đến ngày ${formatDate(
//     den_ngay
//   )}`;
//   timeRange.font = {
//     name: "Times New Roman",
//     size: 14,
//     bold: true,
//     color: { argb: "FF0000" },
//   };
//   timeRange.alignment = { horizontal: "center", vertical: "middle" };

//   currentRow++;

//   // Đơn vị
//   worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
//   const donVi = worksheet.getCell(`A${currentRow}`);
//   donVi.value = "Đơn vị: Phòng Hậu cần - Kỹ thuật";
//   donVi.font = {
//     name: "Times New Roman",
//     size: 12,
//     bold: true,
//     color: { argb: "FF0000" },
//   };
//   donVi.alignment = { horizontal: "center", vertical: "middle" };

//   currentRow++;

//   // Đơn vị tính
//   worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
//   const donViTinh = worksheet.getCell(`A${currentRow}`);
//   donViTinh.value = "Đơn vị tính: Đồng";
//   donViTinh.font = { name: "Times New Roman", size: 11, italic: true };
//   donViTinh.alignment = { horizontal: "right", vertical: "middle" };

//   currentRow += 2;

//   // Tạo header table
//   const headers = [
//     "Nội dung",
//     "Tồn kho\nđầu kỳ",
//     "Nhập kho trong kỳ\nTrên cấp",
//     "Tự mua sắm",
//     "Khác",
//     "Cộng nhập\n5=2+3+4",
//     "Xuất kho trong kỳ\nXuất sử dụng",
//     "Cấp cho\nđơn vị",
//     "Thanh lý,\nnhượng bán",
//     "Khác",
//     "Cộng xuất\n10=6+7+8+9",
//     "Tồn kho\ncuối kỳ\n11=1+5-10",
//   ];

//   const headerCodes = [
//     "A",
//     "1",
//     "2",
//     "3",
//     "4",
//     "5=2+3+4",
//     "6",
//     "7",
//     "8",
//     "9",
//     "10=6+7+8+9",
//     "11=1+5-10",
//   ];

//   // Dòng header chính
//   headers.forEach((header, index) => {
//     const cell = worksheet.getCell(currentRow, index + 1);
//     cell.value = header;
//     cell.font = { name: "Times New Roman", size: 10, bold: true };
//     cell.alignment = {
//       horizontal: "center",
//       vertical: "middle",
//       wrapText: true,
//     };
//     cell.border = {
//       top: { style: "thin" },
//       left: { style: "thin" },
//       bottom: { style: "thin" },
//       right: { style: "thin" },
//     };
//     cell.fill = {
//       type: "pattern",
//       pattern: "solid",
//       fgColor: { argb: "FFB0E0E6" },
//     };
//   });

//   currentRow++;

//   // Dòng mã số
//   headerCodes.forEach((code, index) => {
//     const cell = worksheet.getCell(currentRow, index + 1);
//     cell.value = code;
//     cell.font = { name: "Times New Roman", size: 10, bold: true };
//     cell.alignment = {
//       horizontal: "center",
//       vertical: "middle",
//     };
//     cell.border = {
//       top: { style: "thin" },
//       left: { style: "thin" },
//       bottom: { style: "thin" },
//       right: { style: "thin" },
//     };
//     cell.fill = {
//       type: "pattern",
//       pattern: "solid",
//       fgColor: { argb: "FFB0E0E6" },
//     };
//   });

//   currentRow++;

//   // ======= PHẦN NÀY QUAN TRỌNG: THÊM DỮ LIỆU VÀO BẢNG =======
//   console.log("📝 Adding data rows to main sheet...");

//   if (data && data.length > 0) {
//     let tongTonDauKy = 0;
//     let tongNhapTrenCap = 0;
//     let tongNhapTuMua = 0;
//     let tongNhapKhac = 0;
//     let tongCongNhap = 0;
//     let tongXuatSuDung = 0;
//     let tongXuatCapCho = 0;
//     let tongXuatThanhLy = 0;
//     let tongXuatKhac = 0;
//     let tongCongXuat = 0;
//     let tongTonCuoiKy = 0;

//     data.forEach((row, index) => {
//       console.log(
//         `Adding row ${index + 1}:`,
//         row.ten_phong_ban || row.ma_phong_ban
//       );

//       const rowData = [
//         row.ten_phong_ban || row.ma_phong_ban || `Phòng ban ${index + 1}`,
//         parseFloat(row.ton_dau_quy) || 0,
//         parseFloat(row.nhap_chuyen_cap) || 0,
//         parseFloat(row.nhap_mua_sam) || 0,
//         parseFloat(row.nhap_khac) || 0,
//         parseFloat(row.cong_nhap) || 0,
//         parseFloat(
//           row.xuat_su_dung_tren_cap +
//             row.xuat_su_dung_tu_mua +
//             row.xuat_su_dung_khac
//         ) || 0,
//         parseFloat(
//           row.xuat_cap_cho_tren_cap +
//             row.xuat_cap_cho_tu_mua +
//             row.xuat_cap_cho_khac
//         ) || 0,
//         parseFloat(
//           row.xuat_thanh_ly_tren_cap +
//             row.xuat_thanh_ly_tu_mua +
//             row.xuat_thanh_ly_khac
//         ) || 0,
//         parseFloat(row.xuat_khac) || 0,
//         parseFloat(row.cong_xuat) || 0,
//         parseFloat(row.ton_cuoi_quy) || 0,
//       ];

//       // Cộng vào tổng
//       tongTonDauKy += rowData[1];
//       tongNhapTrenCap += rowData[2];
//       tongNhapTuMua += rowData[3];
//       tongNhapKhac += rowData[4];
//       tongCongNhap += rowData[5];
//       tongXuatSuDung += rowData[6];
//       tongXuatCapCho += rowData[7];
//       tongXuatThanhLy += rowData[8];
//       tongXuatKhac += rowData[9];
//       tongCongXuat += rowData[10];
//       tongTonCuoiKy += rowData[11];

//       rowData.forEach((value, colIndex) => {
//         const cell = worksheet.getCell(currentRow, colIndex + 1);
//         cell.value = value;

//         if (colIndex === 0) {
//           // Cột tên phòng ban
//           cell.alignment = { horizontal: "left", vertical: "middle" };
//         } else {
//           // Các cột số
//           cell.numFmt = "#,##0";
//           cell.alignment = { horizontal: "right", vertical: "middle" };
//         }

//         cell.font = { name: "Times New Roman", size: 10 };
//         cell.border = {
//           top: { style: "thin" },
//           left: { style: "thin" },
//           bottom: { style: "thin" },
//           right: { style: "thin" },
//         };
//       });

//       currentRow++;
//     });

//     // Dòng tổng cộng
//     const tongCongData = [
//       "TỔNG CỘNG",
//       tongTonDauKy,
//       tongNhapTrenCap,
//       tongNhapTuMua,
//       tongNhapKhac,
//       tongCongNhap,
//       tongXuatSuDung,
//       tongXuatCapCho,
//       tongXuatThanhLy,
//       tongXuatKhac,
//       tongCongXuat,
//       tongTonCuoiKy,
//     ];

//     tongCongData.forEach((value, colIndex) => {
//       const cell = worksheet.getCell(currentRow, colIndex + 1);
//       cell.value = value;

//       if (colIndex === 0) {
//         cell.alignment = { horizontal: "center", vertical: "middle" };
//       } else {
//         cell.numFmt = "#,##0";
//         cell.alignment = { horizontal: "right", vertical: "middle" };
//       }

//       cell.font = { name: "Times New Roman", size: 11, bold: true };
//       cell.border = {
//         top: { style: "thick" },
//         left: { style: "thin" },
//         bottom: { style: "thick" },
//         right: { style: "thin" },
//       };
//       cell.fill = {
//         type: "pattern",
//         pattern: "solid",
//         fgColor: { argb: "FFFFCC" },
//       };
//     });

//     currentRow += 2;

//     console.log(`✅ Added ${data.length} data rows to main sheet`);
//   } else {
//     // Nếu không có dữ liệu, thêm dòng thông báo
//     worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
//     const noDataCell = worksheet.getCell(`A${currentRow}`);
//     noDataCell.value = "Không có dữ liệu trong khoảng thời gian này";
//     noDataCell.font = { name: "Times New Roman", size: 12, italic: true };
//     noDataCell.alignment = { horizontal: "center", vertical: "middle" };
//     currentRow += 2;

//     console.log("⚠️ No data available for main sheet");
//   }

//   // Chữ ký
//   const ngayHienTai = new Date();
//   worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
//   const ngayKy = worksheet.getCell(`A${currentRow}`);
//   ngayKy.value = `Ngày ${String(ngayHienTai.getDate()).padStart(
//     2,
//     "0"
//   )} tháng ${String(ngayHienTai.getMonth() + 1).padStart(
//     2,
//     "0"
//   )} năm ${ngayHienTai.getFullYear()}`;
//   ngayKy.font = { name: "Times New Roman", size: 11, italic: true };
//   ngayKy.alignment = { horizontal: "right", vertical: "middle" };

//   currentRow += 2;

//   // Vị trí chữ ký
//   const positions = [
//     "NGƯỜI LẬP BIỂU",
//     "TRƯỞNG BAN VẬT TƯ",
//     "CHỦ NHIỆM HẬU CẦN - KỸ THUẬT",
//   ];
//   const cols = ["A", "E", "I"];

//   positions.forEach((position, index) => {
//     worksheet.mergeCells(
//       `${cols[index]}${currentRow}:${String.fromCharCode(
//         cols[index].charCodeAt(0) + 2
//       )}${currentRow}`
//     );
//     const positionCell = worksheet.getCell(`${cols[index]}${currentRow}`);
//     positionCell.value = position;
//     positionCell.font = { name: "Times New Roman", size: 11, bold: true };
//     positionCell.alignment = { horizontal: "center", vertical: "middle" };
//   });

//   // Đặt chiều cao cho các dòng header
//   const headerRowStart = currentRow - data.length - 10; // Tính ngược lại
//   if (headerRowStart > 0) {
//     worksheet.getRow(headerRowStart).height = 40;
//     worksheet.getRow(headerRowStart + 1).height = 25;
//   }

//   console.log("✅ Main sheet created successfully");
// };

// Hàm tạo sheet phụ

// Cải tiến các hàm tạo Excel cho báo cáo luân chuyển kho

const createMainSheet = async (
  sheet,
  data,
  tu_ngay,
  den_ngay,
  phongBanInfo = null,
  signatures = {}
) => {
  // Thiết lập độ rộng cột
  sheet.columns = [
    { width: 35 }, // Nội dung
    { width: 15 }, // Tồn kho đầu quý
    { width: 15 }, // Nhập kho trong quý
    { width: 15 }, // Xuất sử dụng
    { width: 15 }, // Cấp cho đơn vị
    { width: 15 }, // Thanh lý, nhượng bán
    { width: 15 }, // Khác
    { width: 15 }, // Cộng xuất
    { width: 15 }, // Tồn cuối quý
  ];

  // Header chính của báo cáo
  const headerRows = [
    // Row 1: CẢNH SÁT BIỂN VIỆT NAM - TỔNG HỢP GIÁ TRỊ VẬT TƯ HÀNG HÓA - Phụ biểu số
    {
      values: [
        "CẢNH SÁT BIỂN VIỆT NAM",
        "",
        "",
        "TỔNG HỢP GIÁ TRỊ VẬT TƯ HÀNG HÓA TRÊN CẤP LUÂN CHUYỂN QUA KHO QUÝ I/2025",
        "",
        "",
        "",
        "Phụ biểu số: 07.1/BCQT",
      ],
      styles: {
        font: { bold: true, size: 11 },
        alignment: { horizontal: "center", vertical: "middle" },
      },
    },
    // Row 2: BỘ TƯ LỆNH - Đơn vị - Đơn vị tính
    {
      values: [
        "BỘ TƯ LỆNH",
        "",
        "",
        `Đơn vị: ${phongBanInfo?.ten_phong_ban || "Phòng Hậu cần - Kỹ thuật"}`,
        "",
        "",
        "",
        "Đơn vị tính: Đồng",
      ],
      styles: {
        font: { bold: true, size: 11 },
        alignment: { horizontal: "center", vertical: "middle" },
      },
    },
    // Row 3: VÙNG CẢNH SÁT BIỂN 1 - (trống)
    {
      values: ["VÙNG CẢNH SÁT BIỂN 1", "", "", "", "", "", "", ""],
      styles: {
        font: { bold: true, size: 11 },
        alignment: { horizontal: "center", vertical: "middle" },
      },
    },
    // Row 4: Khoảng trống
    { values: ["", "", "", "", "", "", "", ""] },
  ];

  // Thêm các header rows
  headerRows.forEach((row, index) => {
    const excelRow = sheet.addRow(row.values);

    // Merge cells cho header chính
    if (index === 0) {
      sheet.mergeCells(`A${excelRow.number}:C${excelRow.number}`); // CẢNH SÁT BIỂN VIỆT NAM
      sheet.mergeCells(`D${excelRow.number}:G${excelRow.number}`); // TỔNG HỢP...
    } else if (index === 1) {
      sheet.mergeCells(`A${excelRow.number}:C${excelRow.number}`); // BỘ TƯ LỆNH
      sheet.mergeCells(`D${excelRow.number}:G${excelRow.number}`); // Đơn vị
    } else if (index === 2) {
      sheet.mergeCells(`A${excelRow.number}:H${excelRow.number}`); // VÙNG CẢNH SÁT BIỂN 1
    }

    // Apply styles
    excelRow.eachCell((cell) => {
      if (row.styles) {
        Object.assign(cell, row.styles);
      }
    });
  });

  // Header bảng dữ liệu chính
  const tableHeader1 = sheet.addRow([
    "Nội dung",
    "Tồn kho đầu quý",
    "Nhập kho trong quý",
    "",
    "",
    "",
    "",
    "Xuất kho trong quý",
    "Tồn cuối quý",
  ]);

  const tableHeader2 = sheet.addRow([
    "",
    "",
    "",
    "Xuất sử dụng",
    "Cấp cho đơn vị",
    "Thanh lý, nhượng bán",
    "Khác",
    "Cộng xuất",
    "",
  ]);

  // Style cho header bảng
  [tableHeader1, tableHeader2].forEach((row) => {
    row.eachCell((cell) => {
      cell.font = { bold: true, size: 10 };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6E6FA" },
      };
    });
  });

  // Merge cells cho header
  sheet.mergeCells(`A${tableHeader1.number}:A${tableHeader2.number}`); // Nội dung
  sheet.mergeCells(`B${tableHeader1.number}:B${tableHeader2.number}`); // Tồn đầu
  sheet.mergeCells(`C${tableHeader1.number}:G${tableHeader1.number}`); // Nhập trong quý
  sheet.mergeCells(`H${tableHeader1.number}:H${tableHeader2.number}`); // Xuất kho
  sheet.mergeCells(`I${tableHeader1.number}:I${tableHeader2.number}`); // Tồn cuối

  // Thêm dữ liệu
  let currentRow = tableHeader2.number + 1;

  // Nhóm dữ liệu theo cấp
  const cap1Items = data.filter((item) => item.cap_bac === 1) || [];
  const cap2Items = data.filter((item) => item.cap_bac === 2) || [];
  const cap3Items = data.filter((item) => item.cap_bac === 3) || [];

  // Render cấp 1
  cap1Items.forEach((item) => {
    const row = sheet.addRow([
      item.ten_phong_ban || item.noi_dung,
      parseFloat(item.ton_dau_quy || 0),
      parseFloat(item.nhap_chuyen_cap || item.nhap_tren_cap || 0),
      parseFloat(item.xuat_su_dung || 0),
      parseFloat(item.xuat_cap_cho || 0),
      parseFloat(item.xuat_thanh_ly || 0),
      parseFloat(item.xuat_khac || 0),
      parseFloat(item.cong_xuat || 0),
      parseFloat(item.ton_cuoi_quy || 0),
    ]);

    // Style cho cấp 1 (màu xanh đậm)
    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      if (colNumber === 1) {
        cell.font = { bold: true, size: 10 };
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else {
        cell.font = { bold: true, size: 10 };
        cell.alignment = { horizontal: "right", vertical: "middle" };
        cell.numFmt = "#,##0";
      }

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFB0E0E6" },
      };
    });
  });

  // Render cấp 2 và cấp 3
  cap2Items.forEach((cap2Item) => {
    // Thêm dòng cấp 2
    const cap2Row = sheet.addRow([
      `  ${cap2Item.ten_phong_ban || cap2Item.noi_dung}`,
      parseFloat(cap2Item.ton_dau_quy || 0),
      parseFloat(cap2Item.nhap_chuyen_cap || cap2Item.nhap_tren_cap || 0),
      parseFloat(cap2Item.xuat_su_dung || 0),
      parseFloat(cap2Item.xuat_cap_cho || 0),
      parseFloat(cap2Item.xuat_thanh_ly || 0),
      parseFloat(cap2Item.xuat_khac || 0),
      parseFloat(cap2Item.cong_xuat || 0),
      parseFloat(cap2Item.ton_cuoi_quy || 0),
    ]);

    // Style cho cấp 2 (màu vàng nhạt)
    cap2Row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      if (colNumber === 1) {
        cell.font = { bold: true, size: 9, italic: true };
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else {
        cell.font = { bold: true, size: 9 };
        cell.alignment = { horizontal: "right", vertical: "middle" };
        cell.numFmt = "#,##0";
      }

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF99" },
      };
    });

    // Thêm các cấp 3 thuộc cấp 2 này
    const cap3ForThisCap2 = cap3Items.filter(
      (cap3) => cap3.phong_ban_cha_id === cap2Item.id
    );
    cap3ForThisCap2.forEach((cap3Item) => {
      const cap3Row = sheet.addRow([
        `    - ${cap3Item.ten_phong_ban || cap3Item.noi_dung}`,
        parseFloat(cap3Item.ton_dau_quy || 0),
        parseFloat(cap3Item.nhap_chuyen_cap || cap3Item.nhap_tren_cap || 0),
        parseFloat(cap3Item.xuat_su_dung || 0),
        parseFloat(cap3Item.xuat_cap_cho || 0),
        parseFloat(cap3Item.xuat_thanh_ly || 0),
        parseFloat(cap3Item.xuat_khac || 0),
        parseFloat(cap3Item.cong_xuat || 0),
        parseFloat(cap3Item.ton_cuoi_quy || 0),
      ]);

      // Style cho cấp 3 (trắng)
      cap3Row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        if (colNumber === 1) {
          cell.font = { size: 9 };
          cell.alignment = { horizontal: "left", vertical: "middle" };
        } else {
          cell.font = { size: 9 };
          cell.alignment = { horizontal: "right", vertical: "middle" };
          cell.numFmt = "#,##0";
        }
      });
    });
  });

  // Orphan cấp 3 (cho user cấp 3)
  const orphanCap3 = cap3Items.filter(
    (cap3) => !cap2Items.find((cap2) => cap2.id === cap3.phong_ban_cha_id)
  );

  orphanCap3.forEach((cap3Item) => {
    const row = sheet.addRow([
      cap3Item.ten_phong_ban || cap3Item.noi_dung,
      parseFloat(cap3Item.ton_dau_quy || 0),
      parseFloat(cap3Item.nhap_chuyen_cap || cap3Item.nhap_tren_cap || 0),
      parseFloat(cap3Item.xuat_su_dung || 0),
      parseFloat(cap3Item.xuat_cap_cho || 0),
      parseFloat(cap3Item.xuat_thanh_ly || 0),
      parseFloat(cap3Item.xuat_khac || 0),
      parseFloat(cap3Item.cong_xuat || 0),
      parseFloat(cap3Item.ton_cuoi_quy || 0),
    ]);

    // Style đặc biệt cho orphan cap3 (xanh nhạt)
    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      if (colNumber === 1) {
        cell.font = { bold: true, size: 10 };
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else {
        cell.font = { bold: true, size: 10 };
        cell.alignment = { horizontal: "right", vertical: "middle" };
        cell.numFmt = "#,##0";
      }

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0F6FF" },
      };
    });
  });

  // Thêm dòng tổng cộng
  const totalRow = sheet.addRow([
    "Tổng cộng",
    data.reduce((sum, item) => sum + (parseFloat(item.ton_dau_quy) || 0), 0),
    data.reduce(
      (sum, item) =>
        sum + (parseFloat(item.nhap_chuyen_cap || item.nhap_tren_cap) || 0),
      0
    ),
    data.reduce((sum, item) => sum + (parseFloat(item.xuat_su_dung) || 0), 0),
    data.reduce((sum, item) => sum + (parseFloat(item.xuat_cap_cho) || 0), 0),
    data.reduce((sum, item) => sum + (parseFloat(item.xuat_thanh_ly) || 0), 0),
    data.reduce((sum, item) => sum + (parseFloat(item.xuat_khac) || 0), 0),
    data.reduce((sum, item) => sum + (parseFloat(item.cong_xuat) || 0), 0),
    data.reduce((sum, item) => sum + (parseFloat(item.ton_cuoi_quy) || 0), 0),
  ]);

  // Style cho dòng tổng cộng
  totalRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, size: 10 };
    cell.border = {
      top: { style: "thick" },
      left: { style: "thin" },
      bottom: { style: "thick" },
      right: { style: "thin" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };

    if (colNumber === 1) {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    } else {
      cell.alignment = { horizontal: "right", vertical: "middle" };
      cell.numFmt = "#,##0";
    }
  });

  // Footer với thông tin ngày tháng và chữ ký
  const currentDate = new Date();
  const dateStr = `Ngày ${currentDate
    .getDate()
    .toString()
    .padStart(2, "0")} tháng ${(currentDate.getMonth() + 1)
    .toString()
    .padStart(2, "0")} năm ${currentDate.getFullYear()}`;

  // Thêm khoảng trống
  sheet.addRow([""]);
  sheet.addRow([""]);

  // Thêm ngày tháng
  const dateRow = sheet.addRow(["", "", "", "", "", "", "", dateStr]);
  dateRow.getCell(8).alignment = { horizontal: "center", vertical: "middle" };
  dateRow.getCell(8).font = { italic: true, size: 10 };

  // Thêm khoảng trống cho chữ ký
  sheet.addRow([""]);

  // Thêm header chữ ký
  const signatureHeaderRow = sheet.addRow([
    "NGƯỜI LẬP BIỂU",
    "",
    "TRƯỞNG BAN VẬT TƯ",
    "",
    "",
    "TL. TƯ LỆNH",
    "",
    "CHỦ NHIỆM HẬU CẦN - KỸ THUẬT",
  ]);

  signatureHeaderRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  // Merge cells cho chữ ký
  sheet.mergeCells(
    `A${signatureHeaderRow.number}:B${signatureHeaderRow.number}`
  );
  sheet.mergeCells(
    `C${signatureHeaderRow.number}:D${signatureHeaderRow.number}`
  );
  sheet.mergeCells(
    `F${signatureHeaderRow.number}:G${signatureHeaderRow.number}`
  );

  // Thêm khoảng trống cho chữ ký
  for (let i = 0; i < 3; i++) {
    sheet.addRow([""]);
  }

  // Thêm tên người ký
  const nameRow = sheet.addRow([
    signatures.nguoi_lap || "",
    "",
    signatures.truong_ban || "",
    "",
    "",
    "",
    "",
    signatures.chu_nhiem || "",
  ]);

  nameRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  // Merge cells cho tên
  sheet.mergeCells(`A${nameRow.number}:B${nameRow.number}`);
  sheet.mergeCells(`C${nameRow.number}:D${nameRow.number}`);
  sheet.mergeCells(`H${nameRow.number}:H${nameRow.number}`);
};

// Tương tự cho createSubSheet với format giống như createMainSheet
const createSubSheet = async (
  workbook,
  sheetName,
  data,
  tu_ngay,
  den_ngay,
  nhapField,
  xuatField,
  phongBanInfo = null,
  signatures = {}
) => {
  const sheet = workbook.addWorksheet(sheetName);

  // Set column widths
  sheet.columns = [
    { width: 35 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
  ];

  // Tạo data cho sheet con dựa trên field tương ứng
  const filteredData = data
    .map((item) => ({
      ...item,
      nhap_tren_cap: parseFloat(item[nhapField]) || 0,
      cong_nhap: parseFloat(item[nhapField]) || 0,
      xuat_su_dung: 0, // Sẽ tính theo loại xuất
      xuat_cap_cho: 0,
      xuat_thanh_ly: 0,
      xuat_khac: 0,
      cong_xuat: parseFloat(item[xuatField]) || 0,
      ton_cuoi_quy:
        (parseFloat(item.ton_dau_quy) || 0) +
        (parseFloat(item[nhapField]) || 0) -
        (parseFloat(item[xuatField]) || 0),
    }))
    .filter(
      (item) => item.cong_nhap > 0 || item.cong_xuat > 0 || item.ton_dau_quy > 0
    );

  // Sử dụng createMainSheet với data đã filter
  await createMainSheet(
    sheet,
    filteredData,
    tu_ngay,
    den_ngay,
    phongBanInfo,
    signatures
  );

  // Cập nhật tiêu đề cho sheet con
  const titleMap = {
    "Trên cấp": "TỔNG HỢP GIÁ TRỊ VẬT TƯ HÀNG HÓA TRÊN CẤP LUÂN CHUYỂN QUA KHO",
    "Tự mua sắm":
      "TỔNG HỢP GIÁ TRỊ VẬT TƯ HÀNG HÓA TỰ MUA SẮM LUÂN CHUYỂN QUA KHO",
    Khác: "TỔNG HỢP GIÁ TRỊ VẬT TƯ HÀNG HÓA KHÁC LUÂN CHUYỂN QUA KHO",
  };

  if (titleMap[sheetName]) {
    sheet.getCell("D1").value = `${titleMap[sheetName]} QUÝ I/2025`;
  }
};

// const createSubSheet = async (
//   workbook,
//   sheetName,
//   data,
//   tu_ngay, // SỬA: thay đổi từ quy
//   den_ngay, // SỬA: thay đổi từ nam
//   nhapField,
//   xuatField
// ) => {
//   const formatDate = (dateStr) => {
//     const date = new Date(dateStr);
//     return `${String(date.getDate()).padStart(2, "0")}/${String(
//       date.getMonth() + 1
//     ).padStart(2, "0")}/${date.getFullYear()}`;
//   };

//   const worksheet = workbook.addWorksheet(sheetName);

//   // Setup tương tự như main sheet nhưng focus vào loại cụ thể
//   worksheet.columns = [
//     { width: 25 }, // A - Nội dung
//     { width: 15 }, // B - Tồn kho đầu quý
//     { width: 15 }, // C - Nhập kho trong quý
//     { width: 20 }, // D - Xuất kho trong quý (chi tiết)
//     { width: 15 }, // E - Tồn cuối quý
//   ];

//   let currentRow = 1;

//   // SỬA: Header với khoảng thời gian thay vì quý/năm
//   worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
//   const header = worksheet.getCell(`A${currentRow}`);
//   header.value = `TỔNG HỢP GIÁ TRỊ VẬT TƯ HÀNG HÓA ${sheetName.toUpperCase()} LUÂN CHUYỂN QUA KHO`;
//   header.font = { name: "Times New Roman", size: 14, bold: true };
//   header.alignment = {
//     horizontal: "center",
//     vertical: "middle",
//     wrapText: true,
//   };

//   currentRow++;

//   // SỬA: Thêm dòng hiển thị khoảng thời gian
//   worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
//   const timeRange = worksheet.getCell(`A${currentRow}`);
//   timeRange.value = `Từ ngày ${formatDate(tu_ngay)} đến ngày ${formatDate(
//     den_ngay
//   )}`;
//   timeRange.font = {
//     name: "Times New Roman",
//     size: 12,
//     bold: true,
//     color: { argb: "FF0000" },
//   };
//   timeRange.alignment = { horizontal: "center", vertical: "middle" };

//   currentRow++;

//   // Đơn vị
//   worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
//   const donVi = worksheet.getCell(`A${currentRow}`);
//   donVi.value = "Đơn vị: Phòng Hậu cần - Kỹ thuật";
//   donVi.font = {
//     name: "Times New Roman",
//     size: 12,
//     bold: true,
//     color: { argb: "FF0000" },
//   };
//   donVi.alignment = { horizontal: "center", vertical: "middle" };

//   currentRow += 2;

//   // Table headers cho sheet phụ
//   const subHeaders = [
//     "Nội dung",
//     "Tồn kho\nđầu kỳ", // SỬA: đổi từ "đầu quý" thành "đầu kỳ"
//     "Nhập kho\ntrong kỳ", // SỬA: đổi từ "trong quý" thành "trong kỳ"
//     "Xuất kho trong kỳ", // SỬA: đổi từ "trong quý" thành "trong kỳ"
//     "Tồn cuối kỳ", // SỬA: đổi từ "cuối quý" thành "cuối kỳ"
//   ];

//   subHeaders.forEach((header, index) => {
//     const cell = worksheet.getCell(currentRow, index + 1);
//     cell.value = header;
//     cell.font = { name: "Times New Roman", size: 11, bold: true };
//     cell.alignment = {
//       horizontal: "center",
//       vertical: "middle",
//       wrapText: true,
//     };
//     cell.border = {
//       top: { style: "thin" },
//       left: { style: "thin" },
//       bottom: { style: "thin" },
//       right: { style: "thin" },
//     };
//     cell.fill = {
//       type: "pattern",
//       pattern: "solid",
//       fgColor: { argb: "FFE6E6E6" },
//     };
//   });

//   currentRow++;

//   // Data cho sheet phụ
//   data.forEach((row) => {
//     const rowData = [
//       row.ten_phong_ban,
//       row.ton_dau_quy,
//       row[nhapField],
//       row[xuatField],
//       row.ton_dau_quy + row[nhapField] - row[xuatField], // Tính tồn cuối kỳ
//     ];

//     rowData.forEach((value, index) => {
//       const cell = worksheet.getCell(currentRow, index + 1);
//       if (index === 0) {
//         cell.value = value;
//         cell.alignment = { horizontal: "left", vertical: "middle" };
//       } else {
//         cell.value = parseFloat(value) || 0;
//         if (isNaN(cell.value)) cell.value = 0;
//         cell.numFmt = "#,##0";
//         cell.alignment = { horizontal: "right", vertical: "middle" };
//       }
//       cell.font = { name: "Times New Roman", size: 10 };
//       cell.border = {
//         top: { style: "thin" },
//         left: { style: "thin" },
//         bottom: { style: "thin" },
//         right: { style: "thin" },
//       };
//     });

//     currentRow++;
//   });
// };

// Thêm vào printController.js

const generateBaoCaoNhapExcel = async (req, res, query, user) => {
  try {
    const { tu_ngay, den_ngay, timeFrame, phong_ban_id } = query;

    if (!tu_ngay || !den_ngay) {
      return sendResponse(res, 400, false, "Vui lòng chọn khoảng thời gian");
    }

    console.log(`📊 Generating Nhap report from ${tu_ngay} to ${den_ngay}`);

    // Xác định phòng ban dựa trên role
    let phongBanFilter = "";
    let queryParams = [tu_ngay, den_ngay];
    let paramIndex = 3;

    if (user.role === "user") {
      // Cấp 3: Chỉ xem được phòng ban của mình
      phongBanFilter = `AND pn.phong_ban_id = $${paramIndex}`;
      queryParams.push(user.phong_ban_id);
      paramIndex++;
    } else if (user.role === "manager") {
      // Cấp 2: Xem được phòng ban của mình và các phòng ban cấp 3 dưới quyền
      if (phong_ban_id && phong_ban_id !== "all") {
        phongBanFilter = `AND pn.phong_ban_id = $${paramIndex}`;
        queryParams.push(phong_ban_id);
        paramIndex++;
      } else {
        // Nếu chọn "all", chỉ xem được phòng ban của mình và các phòng ban cấp 3 dưới quyền
        phongBanFilter = `AND (pn.phong_ban_id = $${paramIndex} OR pn.phong_ban_id IN (
          SELECT id FROM phong_ban WHERE phong_ban_cha_id = $${paramIndex} AND cap_bac = 3
        ))`;
        queryParams.push(user.phong_ban_id);
        paramIndex++;
      }
    } else if (user.role === "admin") {
      // Cấp 1: Xem được tất cả
      if (phong_ban_id && phong_ban_id !== "all") {
        phongBanFilter = `AND pn.phong_ban_id = $${paramIndex}`;
        queryParams.push(phong_ban_id);
        paramIndex++;
      }
    }

    // Query lấy dữ liệu phiếu nhập
    const nhapQuery = `
      SELECT 
        pn.id,
        pn.so_phieu,
        pn.ngay_nhap,
        pn.tong_tien,
        pn.ly_do_nhap,
        pn.trang_thai,
        pn.loai_phieu,
        pb.ten_phong_ban,
        ncc.ten_ncc as nha_cung_cap,
        u.ho_ten as nguoi_tao_ten,
        -- Đếm số mặt hàng trong từng phiếu
        COUNT(ctn.id) as so_mat_hang
      FROM phieu_nhap pn
      LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
      LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
      LEFT JOIN users u ON pn.nguoi_tao = u.id
      LEFT JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
      WHERE pn.ngay_nhap BETWEEN $1 AND $2 
        AND pn.trang_thai = 'completed'
        ${phongBanFilter}
      GROUP BY pn.id, pn.so_phieu, pn.ngay_nhap, pn.tong_tien, pn.ly_do_nhap, 
               pn.trang_thai, pn.loai_phieu, pb.ten_phong_ban, ncc.ten_ncc, u.ho_ten
      ORDER BY pn.ngay_nhap DESC, pn.id DESC
    `;

    console.log("🔍 Executing query with params:", queryParams);
    const result = await pool.query(nhapQuery, queryParams);
    const data = result.rows || [];

    console.log(`📊 Found ${data.length} records`);

    // Tạo workbook Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Báo cáo nhập kho");

    // Thiết lập độ rộng cột
    worksheet.columns = [
      { width: 5 }, // STT
      { width: 15 }, // Số phiếu
      { width: 12 }, // Ngày nhập
      { width: 25 }, // Nội dung
      { width: 20 }, // Số tiền
      { width: 8 }, // Số MH
      { width: 15 }, // Loại phiếu
      { width: 20 }, // Nhà cung cấp
      { width: 15 }, // Phòng ban
      { width: 15 }, // Người tạo
    ];

    let currentRow = 1;

    // Header - Thông tin tổ chức
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    const headerLeft = worksheet.getCell(`A${currentRow}`);
    headerLeft.value = "BỘ TƯ LỆNH VÙNG CẢNH SÁT BIỂN 1";
    headerLeft.font = { name: "Times New Roman", size: 12, bold: true };
    headerLeft.alignment = { horizontal: "center", vertical: "middle" };

    worksheet.mergeCells(`F${currentRow}:J${currentRow}`);
    const headerRight = worksheet.getCell(`F${currentRow}`);
    const now = new Date();
    headerRight.value = `Ngày in: ${formatDate(now.toISOString())}`;
    headerRight.font = { name: "Times New Roman", size: 10 };
    headerRight.alignment = { horizontal: "right", vertical: "middle" };

    currentRow += 2;

    // Tiêu đề chính
    worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
    const title = worksheet.getCell(`A${currentRow}`);
    const timeFrameText =
      timeFrame === "month" ? "THÁNG" : timeFrame === "quarter" ? "QUÝ" : "NĂM";
    title.value = `BẢNG KÊ PHIẾU NHẬP KHO THEO ${timeFrameText}`;
    title.font = { name: "Times New Roman", size: 14, bold: true };
    title.alignment = { horizontal: "center", vertical: "middle" };

    currentRow++;

    // Thời gian báo cáo
    worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
    const timeRange = worksheet.getCell(`A${currentRow}`);
    timeRange.value = `Từ ngày ${formatDate(tu_ngay)} đến ngày ${formatDate(
      den_ngay
    )}`;
    timeRange.font = { name: "Times New Roman", size: 11, italic: true };
    timeRange.alignment = { horizontal: "center", vertical: "middle" };

    currentRow += 2;

    // Headers bảng
    const headers = [
      "STT",
      "Số phiếu",
      "Ngày, tháng",
      "Nội dung",
      "Số tiền",
      "Số MH",
      "Loại phiếu",
      "Nhà cung cấp",
      "Phòng ban",
      "Người tạo",
    ];

    headers.forEach((header, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = header;
      cell.font = { name: "Times New Roman", size: 10, bold: true };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6E6E6" },
      };
    });

    currentRow++;

    // Dữ liệu
    let tongTien = 0;
    let tongSoMatHang = 0;

    data.forEach((item, index) => {
      const rowData = [
        index + 1,
        item.so_phieu,
        formatDate(item.ngay_nhap),
        item.ly_do_nhap || "Nhập kho",
        parseFloat(item.tong_tien) || 0,
        parseInt(item.so_mat_hang) || 0,
        item.loai_phieu === "tren_cap"
          ? "Trên cấp"
          : item.loai_phieu === "tu_mua"
          ? "Tự mua"
          : "Khác",
        item.nha_cung_cap || "",
        item.ten_phong_ban || "",
        item.nguoi_tao_ten || "",
      ];

      rowData.forEach((value, colIndex) => {
        const cell = worksheet.getCell(currentRow, colIndex + 1);
        cell.value = value;

        if (colIndex === 4) {
          // Cột số tiền
          cell.numFmt = "#,##0";
          cell.alignment = { horizontal: "right", vertical: "middle" };
        } else if (colIndex === 0 || colIndex === 5) {
          // STT và Số MH
          cell.alignment = { horizontal: "center", vertical: "middle" };
        } else {
          cell.alignment = {
            horizontal: "left",
            vertical: "middle",
            wrapText: true,
          };
        }

        cell.font = { name: "Times New Roman", size: 9 };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      tongTien += parseFloat(item.tong_tien) || 0;
      tongSoMatHang += parseInt(item.so_mat_hang) || 0;
      currentRow++;
    });

    // Dòng tổng cộng
    const tongData = [
      "Cộng",
      "",
      "",
      `Tổng cộng: ${data.length} phiếu nhập`,
      tongTien,
      tongSoMatHang,
      "",
      "",
      "",
      "",
    ];

    tongData.forEach((value, colIndex) => {
      const cell = worksheet.getCell(currentRow, colIndex + 1);
      cell.value = value;

      if (colIndex === 4) {
        // Tổng tiền
        cell.numFmt = "#,##0";
        cell.alignment = { horizontal: "right", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }

      cell.font = { name: "Times New Roman", size: 10, bold: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFB0E0E6" },
      };
    });

    currentRow += 2;

    // Chữ ký
    const positions = ["NGƯỜI LẬP", "THỦ KHO", "CHỦ NHIỆM HC-KT"];
    const startCols = [1, 4, 7]; // Cột A, D, G

    positions.forEach((position, index) => {
      const startCol = startCols[index];
      worksheet.mergeCells(
        `${String.fromCharCode(
          64 + startCol
        )}${currentRow}:${String.fromCharCode(64 + startCol + 2)}${currentRow}`
      );
      const positionCell = worksheet.getCell(currentRow, startCol);
      positionCell.value = position;
      positionCell.font = { name: "Times New Roman", size: 11, bold: true };
      positionCell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // Tạo buffer và trả về
    const buffer = await workbook.xlsx.writeBuffer();

    if (buffer.length === 0) {
      throw new Error("Generated Excel buffer is empty");
    }

    res.writeHead(200, {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bao-cao-nhap-${timeFrame}-${Date.now()}.xlsx"`,
      "Content-Length": buffer.length,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    res.end(buffer);
    console.log("✅ Nhập report file sent successfully");
  } catch (error) {
    console.error("❌ Generate Nhập Excel error:", error);
    if (!res.headersSent) {
      return sendResponse(res, 500, false, "Lỗi tạo báo cáo Excel", {
        error: error.message,
      });
    }
  }
};

const generateBaoCaoXuatExcel = async (req, res, query, user) => {
  try {
    const { tu_ngay, den_ngay, timeFrame, phong_ban_id } = query;

    if (!tu_ngay || !den_ngay) {
      return sendResponse(res, 400, false, "Vui lòng chọn khoảng thời gian");
    }

    console.log(`📊 Generating Xuat report from ${tu_ngay} to ${den_ngay}`);

    // Xác định phòng ban dựa trên role
    let phongBanFilter = "";
    let queryParams = [tu_ngay, den_ngay];
    let paramIndex = 3;

    if (user.role === "user") {
      // Cấp 3: Chỉ xem được phòng ban của mình
      phongBanFilter = `AND px.phong_ban_id = $${paramIndex}`;
      queryParams.push(user.phong_ban_id);
      paramIndex++;
    } else if (user.role === "manager") {
      // Cấp 2: Xem được phòng ban của mình và các phòng ban cấp 3 dưới quyền
      if (phong_ban_id && phong_ban_id !== "all") {
        phongBanFilter = `AND px.phong_ban_id = $${paramIndex}`;
        queryParams.push(phong_ban_id);
        paramIndex++;
      } else {
        // Nếu chọn "all", chỉ xem được phòng ban của mình và các phòng ban cấp 3 dưới quyền
        phongBanFilter = `AND (px.phong_ban_id = $${paramIndex} OR px.phong_ban_id IN (
          SELECT id FROM phong_ban WHERE phong_ban_cha_id = $${paramIndex} AND cap_bac = 3
        ))`;
        queryParams.push(user.phong_ban_id);
        paramIndex++;
      }
    } else if (user.role === "admin") {
      // Cấp 1: Xem được tất cả
      if (phong_ban_id && phong_ban_id !== "all") {
        phongBanFilter = `AND px.phong_ban_id = $${paramIndex}`;
        queryParams.push(phong_ban_id);
        paramIndex++;
      }
    }

    // Query lấy dữ liệu phiếu xuất
    const xuatQuery = `
      SELECT 
        px.id,
        px.so_phieu,
        px.ngay_xuat,
        px.tong_tien,
        px.ly_do_xuat,
        px.trang_thai,
        pb.ten_phong_ban,
        dvn.ten_don_vi as don_vi_nhan,
        u.ho_ten as nguoi_tao_ten,
        -- Đếm số mặt hàng trong từng phiếu
        COUNT(ctx.id) as so_mat_hang
      FROM phieu_xuat px
      LEFT JOIN phong_ban pb ON px.phong_ban_id = pb.id
      LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id
      LEFT JOIN users u ON px.nguoi_tao = u.id
      LEFT JOIN chi_tiet_xuat ctx ON px.id = ctx.phieu_xuat_id
      WHERE px.ngay_xuat BETWEEN $1 AND $2 
        AND px.trang_thai = 'completed'
        ${phongBanFilter}
      GROUP BY px.id, px.so_phieu, px.ngay_xuat, px.tong_tien, px.ly_do_xuat, 
               px.trang_thai, pb.ten_phong_ban, dvn.ten_don_vi, u.ho_ten
      ORDER BY px.ngay_xuat DESC, px.id DESC
    `;

    console.log("🔍 Executing query with params:", queryParams);
    const result = await pool.query(xuatQuery, queryParams);
    const data = result.rows || [];

    console.log(`📊 Found ${data.length} records`);

    // Tạo workbook Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Báo cáo xuất kho");

    // Thiết lập độ rộng cột
    worksheet.columns = [
      { width: 5 }, // STT
      { width: 15 }, // Số phiếu
      { width: 12 }, // Ngày xuất
      { width: 25 }, // Nội dung
      { width: 20 }, // Số tiền
      { width: 8 }, // Số MH
      { width: 20 }, // Đơn vị nhận
      { width: 15 }, // Phòng ban
      { width: 15 }, // Người tạo
    ];

    let currentRow = 1;

    // Header - Thông tin tổ chức
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    const headerLeft = worksheet.getCell(`A${currentRow}`);
    headerLeft.value = "BỘ TƯ LỆNH VÙNG CẢNH SÁT BIỂN 1";
    headerLeft.font = { name: "Times New Roman", size: 12, bold: true };
    headerLeft.alignment = { horizontal: "center", vertical: "middle" };

    worksheet.mergeCells(`F${currentRow}:I${currentRow}`);
    const headerRight = worksheet.getCell(`F${currentRow}`);
    const now = new Date();
    headerRight.value = `Ngày in: ${formatDate(now.toISOString())}`;
    headerRight.font = { name: "Times New Roman", size: 10 };
    headerRight.alignment = { horizontal: "right", vertical: "middle" };

    currentRow += 2;

    // Tiêu đề chính
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
    const title = worksheet.getCell(`A${currentRow}`);
    const timeFrameText =
      timeFrame === "month" ? "THÁNG" : timeFrame === "quarter" ? "QUÝ" : "NĂM";
    title.value = `BẢNG KÊ PHIẾU XUẤT KHO THEO ${timeFrameText}`;
    title.font = { name: "Times New Roman", size: 14, bold: true };
    title.alignment = { horizontal: "center", vertical: "middle" };

    currentRow++;

    // Thời gian báo cáo
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
    const timeRange = worksheet.getCell(`A${currentRow}`);
    timeRange.value = `Từ ngày ${formatDate(tu_ngay)} đến ngày ${formatDate(
      den_ngay
    )}`;
    timeRange.font = { name: "Times New Roman", size: 11, italic: true };
    timeRange.alignment = { horizontal: "center", vertical: "middle" };

    currentRow += 2;

    // Headers bảng
    const headers = [
      "STT",
      "Số phiếu",
      "Ngày, tháng",
      "Nội dung",
      "Số tiền",
      "Số MH",
      "Đơn vị nhận",
      "Phòng ban",
      "Người tạo",
    ];

    headers.forEach((header, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = header;
      cell.font = { name: "Times New Roman", size: 10, bold: true };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6E6E6" },
      };
    });

    currentRow++;

    // Dữ liệu
    let tongTien = 0;
    let tongSoMatHang = 0;

    data.forEach((item, index) => {
      const rowData = [
        index + 1,
        item.so_phieu,
        formatDate(item.ngay_xuat),
        item.ly_do_xuat || "Xuất kho",
        parseFloat(item.tong_tien) || 0,
        parseInt(item.so_mat_hang) || 0,
        item.don_vi_nhan || "",
        item.ten_phong_ban || "",
        item.nguoi_tao_ten || "",
      ];

      rowData.forEach((value, colIndex) => {
        const cell = worksheet.getCell(currentRow, colIndex + 1);
        cell.value = value;

        if (colIndex === 4) {
          // Cột số tiền
          cell.numFmt = "#,##0";
          cell.alignment = { horizontal: "right", vertical: "middle" };
        } else if (colIndex === 0 || colIndex === 5) {
          // STT và Số MH
          cell.alignment = { horizontal: "center", vertical: "middle" };
        } else {
          cell.alignment = {
            horizontal: "left",
            vertical: "middle",
            wrapText: true,
          };
        }

        cell.font = { name: "Times New Roman", size: 9 };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      tongTien += parseFloat(item.tong_tien) || 0;
      tongSoMatHang += parseInt(item.so_mat_hang) || 0;
      currentRow++;
    });

    // Dòng tổng cộng
    const tongData = [
      "Cộng",
      "",
      "",
      `Tổng cộng: ${data.length} phiếu xuất`,
      tongTien,
      tongSoMatHang,
      "",
      "",
      "",
    ];

    tongData.forEach((value, colIndex) => {
      const cell = worksheet.getCell(currentRow, colIndex + 1);
      cell.value = value;

      if (colIndex === 4) {
        // Tổng tiền
        cell.numFmt = "#,##0";
        cell.alignment = { horizontal: "right", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }

      cell.font = { name: "Times New Roman", size: 10, bold: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFB0E0E6" },
      };
    });

    currentRow += 2;

    // Chữ ký - SỬA ĐỂ TRÁNH TRÙNG LẶP MERGE CELLS
    const positions = ["NGƯỜI LẬP", "THỦ KHO", "CHỦ NHIỆM HC-KT"];
    const startCols = [1, 4, 7]; // Cột A, D, G - tăng khoảng cách

    positions.forEach((position, index) => {
      const startCol = startCols[index];
      const endCol = startCol + 1; // Merge 2 cột thay vì 3

      // Đảm bảo không vượt quá 9 cột
      if (endCol <= 9) {
        worksheet.mergeCells(
          `${String.fromCharCode(
            64 + startCol
          )}${currentRow}:${String.fromCharCode(64 + endCol)}${currentRow}`
        );

        const positionCell = worksheet.getCell(currentRow, startCol);
        positionCell.value = position;
        positionCell.font = { name: "Times New Roman", size: 11, bold: true };
        positionCell.alignment = { horizontal: "center", vertical: "middle" };
      }
    });

    // Tạo buffer và trả về
    const buffer = await workbook.xlsx.writeBuffer();

    if (buffer.length === 0) {
      throw new Error("Generated Excel buffer is empty");
    }

    res.writeHead(200, {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bao-cao-xuat-${timeFrame}-${Date.now()}.xlsx"`,
      "Content-Length": buffer.length,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    res.end(buffer);
    console.log("✅ Xuat report file sent successfully");
  } catch (error) {
    console.error("❌ Generate Xuat Excel error:", error);
    if (!res.headersSent) {
      return sendResponse(res, 500, false, "Lỗi tạo báo cáo Excel", {
        error: error.message,
      });
    }
  }
};

// Helper function để format ngày
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
};

//============================== báo cáo nhập mới=============================//

const generateNhapReportWithTabs = async (req, res, query, user) => {
  try {
    const { tu_ngay, den_ngay, timeFrame, phong_ban_id } = query;
    const { nguoi_lap = "", truong_ban_tmkh = "", chu_nhiem_hckt = "" } = query;

    if (!tu_ngay || !den_ngay) {
      return sendResponse(res, 400, false, "Vui lòng chọn khoảng thời gian");
    }

    console.log(
      `📊 Generating Nhap report with tabs from ${tu_ngay} to ${den_ngay}`
    );

    // Xác định phòng ban dựa trên role
    let phongBanFilter = "";
    let queryParams = [tu_ngay, den_ngay];
    let paramIndex = 3;

    if (user.role === "user") {
      // Cấp 3: Chỉ xem được phòng ban của mình
      phongBanFilter = `AND pn.phong_ban_id = $${paramIndex}`;
      queryParams.push(user.phong_ban_id);
      paramIndex++;
    } else if (user.role === "manager") {
      // Cấp 2: Xem được phòng ban của mình và các phòng ban cấp 3 dưới quyền
      if (phong_ban_id && phong_ban_id !== "all") {
        phongBanFilter = `AND pn.phong_ban_id = $${paramIndex}`;
        queryParams.push(phong_ban_id);
        paramIndex++;
      } else {
        // Nếu chọn "all", chỉ xem được phòng ban của mình và các phòng ban cấp 3 dưới quyền
        phongBanFilter = `AND (pn.phong_ban_id = $${paramIndex} OR pn.phong_ban_id IN (
          SELECT id FROM phong_ban WHERE phong_ban_cha_id = $${paramIndex} AND cap_bac = 3
        ))`;
        queryParams.push(user.phong_ban_id);
        paramIndex++;
      }
    } else if (user.role === "admin") {
      // Cấp 1: Xem được tất cả
      if (phong_ban_id && phong_ban_id !== "all") {
        phongBanFilter = `AND pn.phong_ban_id = $${paramIndex}`;
        queryParams.push(phong_ban_id);
        paramIndex++;
      }
    }

    // Query lấy dữ liệu cho cả 3 loại
    const [tuMuaData, trenCapData, luanChuyenData] = await Promise.all([
      getNhapDataByTypeForExport("tu_mua", queryParams, phongBanFilter),
      getNhapDataByTypeForExport("tren_cap", queryParams, phongBanFilter),
      getNhapDataByTypeForExport("luan_chuyen", queryParams, phongBanFilter),
    ]);

    // Tạo dữ liệu tổng hợp (tất cả phiếu)
    const tongHopData = [...tuMuaData, ...trenCapData, ...luanChuyenData];

    console.log(
      `📊 Found ${tuMuaData.length} tu_mua, ${trenCapData.length} tren_cap, ${luanChuyenData.length} luan_chuyen records`
    );

    // Tạo workbook Excel
    const workbook = new ExcelJS.Workbook();

    // Lấy thông tin phòng ban được chọn
    let selectedPhongBan = user.phong_ban;
    if (phong_ban_id && phong_ban_id !== "all") {
      const phongBanQuery = `SELECT id, ten_phong_ban, ma_phong_ban FROM phong_ban WHERE id = $1`;
      const phongBanResult = await pool.query(phongBanQuery, [phong_ban_id]);
      if (phongBanResult.rows.length > 0) {
        selectedPhongBan = phongBanResult.rows[0];
      }
    }

    // Tạo sheet tổng hợp (Tab 1)
    await createNhapSheet(
      workbook,
      "Tổng hợp",
      tongHopData,
      tu_ngay,
      den_ngay,
      timeFrame,
      {
        nguoi_lap,
        truong_ban_tmkh,
        chu_nhiem_hckt,
      },
      user,
      selectedPhongBan
    );

    // Tạo sheet cho tự mua sắm (Tab 2)
    await createNhapSheet(
      workbook,
      "Tự mua sắm",
      tuMuaData,
      tu_ngay,
      den_ngay,
      timeFrame,
      {
        nguoi_lap,
        truong_ban_tmkh,
        chu_nhiem_hckt,
      },
      user,
      selectedPhongBan
    );

    // Tạo sheet cho trên cấp (Tab 3)
    await createNhapSheet(
      workbook,
      "Trên cấp",
      trenCapData,
      tu_ngay,
      den_ngay,
      timeFrame,
      {
        nguoi_lap,
        truong_ban_tmkh,
        chu_nhiem_hckt,
      },
      user,
      selectedPhongBan
    );

    // Tạo sheet cho luân chuyển (Tab 4)
    await createNhapSheet(
      workbook,
      "Luân chuyển",
      luanChuyenData,
      tu_ngay,
      den_ngay,
      timeFrame,
      {
        nguoi_lap,
        truong_ban_tmkh,
        chu_nhiem_hckt,
      },
      user,
      selectedPhongBan
    );

    console.log("📝 Workbook created successfully with 4 tabs");

    // Tạo buffer và trả về
    const buffer = await workbook.xlsx.writeBuffer();

    if (buffer.length === 0) {
      throw new Error("Generated Excel buffer is empty");
    }

    res.writeHead(200, {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bao-cao-nhap-${timeFrame}-${Date.now()}.xlsx"`,
      "Content-Length": buffer.length,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    res.end(buffer);
    console.log("✅ Nhập report with tabs sent successfully");
  } catch (error) {
    console.error("❌ Generate Nhập Excel with tabs error:", error);
    if (!res.headersSent) {
      return sendResponse(res, 500, false, "Lỗi tạo báo cáo Excel", {
        error: error.message,
      });
    }
  }
};

// Helper function để lấy dữ liệu theo loại cho export
const getNhapDataByTypeForExport = async (
  loaiPhieu,
  baseParams,
  phongBanFilter
) => {
  // Tạo parameter array mới bao gồm loaiPhieu
  const queryParams = [...baseParams, loaiPhieu];

  // Tạo placeholder cho loaiPhieu
  const loaiPhieuParamIndex = baseParams.length + 1;

  const query = `
    SELECT 
      pn.id,
      pn.so_phieu,
      pn.so_quyet_dinh,
      pn.ngay_nhap,
      pn.tong_tien,
      pn.ly_do_nhap,
      pn.loai_phieu,
      pb.ten_phong_ban,
      ncc.ten_ncc as nha_cung_cap,
      u.ho_ten as nguoi_tao_ten,
      COUNT(ctn.id) as so_mat_hang
    FROM phieu_nhap pn
    LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
    LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
    LEFT JOIN users u ON pn.nguoi_tao = u.id
    LEFT JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
    WHERE pn.ngay_nhap BETWEEN $1::date AND $2::date 
      AND pn.trang_thai = 'completed'
      AND pn.loai_phieu = $${loaiPhieuParamIndex}
      ${phongBanFilter}
    GROUP BY pn.id, pn.so_phieu, pn.so_quyet_dinh, pn.ngay_nhap, pn.tong_tien, 
             pn.ly_do_nhap, pn.loai_phieu, pb.ten_phong_ban, ncc.ten_ncc, u.ho_ten
    ORDER BY pn.ngay_nhap DESC, pn.id DESC
  `;

  const result = await pool.query(query, queryParams);
  return result.rows || [];
};

// Function tạo từng sheet
const createNhapSheet = async (
  workbook,
  sheetName,
  data,
  tu_ngay,
  den_ngay,
  timeFrame,
  signatures,
  user,
  selectedPhongBan
) => {
  const worksheet = workbook.addWorksheet(sheetName);

  // Thiết lập độ rộng cột giống như trong ảnh
  worksheet.columns = [
    { width: 5 }, // STT
    { width: 15 }, // Số quyết định
    { width: 12 }, // Ngày, tháng
    { width: 35 }, // Nội dung
    { width: 20 }, // Số tiền
  ];

  let currentRow = 1;

  // Header - Thông tin tổ chức
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  const headerCell = worksheet.getCell(`A${currentRow}`);
  const unitName =
    selectedPhongBan?.ten_phong_ban ||
    user?.phong_ban?.ten_phong_ban ||
    "BỘ TƯ LỆNH CẢNH SÁT BIỂN";
  headerCell.value = unitName;
  headerCell.font = { name: "Times New Roman", size: 12, bold: true };
  headerCell.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };

  currentRow += 3;

  // Tiêu đề chính
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  const title = worksheet.getCell(`A${currentRow}`);
  title.value = `BẢNG KÊ PHIẾU NHẬP KHO - ${sheetName.toUpperCase()}`;
  title.font = { name: "Times New Roman", size: 14, bold: true };
  title.alignment = { horizontal: "center", vertical: "middle" };

  currentRow++;

  // Thời gian và đơn vị
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  const timeUnit = worksheet.getCell(`A${currentRow}`);
  const timeFrameText =
    timeFrame === "month" ? "Tháng" : timeFrame === "quarter" ? "Quý" : "Năm";
  const date = new Date(tu_ngay);
  const period =
    timeFrame === "month"
      ? `${date.getMonth() + 1}`
      : timeFrame === "quarter"
      ? `${Math.ceil((date.getMonth() + 1) / 3)}`
      : `${date.getFullYear()}`;
  timeUnit.value = `${timeFrameText} ${period} năm ${date.getFullYear()}`;
  timeUnit.font = { name: "Times New Roman", size: 12, bold: true };
  timeUnit.alignment = { horizontal: "center", vertical: "middle" };

  currentRow++;

  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  const donVi = worksheet.getCell(`A${currentRow}`);
  donVi.value = `Đơn vị: ${
    selectedPhongBan?.ten_phong_ban ||
    user?.phong_ban?.ten_phong_ban ||
    "Ban Quân khí - Phòng Hậu cần, Kỹ thuật"
  }`;
  donVi.font = { name: "Times New Roman", size: 11, bold: true };
  donVi.alignment = { horizontal: "center", vertical: "middle" };

  currentRow += 2;

  // Đơn vị tính (góc phải)
  worksheet.mergeCells(`D${currentRow}:E${currentRow}`);
  const donViTinh = worksheet.getCell(`D${currentRow}`);
  donViTinh.value = "Đơn vị tính: đồng";
  donViTinh.font = { name: "Times New Roman", size: 10, italic: true };
  donViTinh.alignment = { horizontal: "right", vertical: "middle" };

  currentRow++;

  // Headers bảng
  const headers = [
    "STT",
    "Số quyết định",
    "Ngày, tháng",
    "Nội dung",
    "Số tiền",
  ];

  headers.forEach((header, index) => {
    const cell = worksheet.getCell(currentRow, index + 1);
    cell.value = header;
    cell.font = { name: "Times New Roman", size: 10, bold: true };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE6E6E6" },
    };
  });

  currentRow++;

  // Dữ liệu
  let tongTien = 0;

  data.forEach((item, index) => {
    const rowData = [
      index + 1,
      item.so_quyet_dinh || item.so_phieu,
      formatDate(item.ngay_nhap),
      item.ly_do_nhap || "Nhập kho",
      parseFloat(item.tong_tien) || 0,
    ];

    rowData.forEach((value, colIndex) => {
      const cell = worksheet.getCell(currentRow, colIndex + 1);
      cell.value = value;

      if (colIndex === 4) {
        // Cột số tiền - format số và alignment phải
        cell.numFmt = "#,##0";
        cell.alignment = { horizontal: "right", vertical: "middle" };
      } else if (colIndex === 0) {
        // STT - center
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else {
        // Các cột khác - left align
        cell.alignment = {
          horizontal: "left",
          vertical: "middle",
          wrapText: true,
        };
      }

      cell.font = { name: "Times New Roman", size: 10 };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    tongTien += parseFloat(item.tong_tien) || 0;
    currentRow++;
  });

  // Dòng tổng cộng
  const tongData = ["", "", "", "Cộng", tongTien];

  tongData.forEach((value, colIndex) => {
    const cell = worksheet.getCell(currentRow, colIndex + 1);
    cell.value = value;

    if (colIndex === 4) {
      cell.numFmt = "#,##0";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else if (colIndex === 3) {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    }

    cell.font = { name: "Times New Roman", size: 11, bold: true };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFB0E0E6" },
    };
  });

  currentRow += 2;

  // Tổng số tiền bằng chữ
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  const tongSoTien = worksheet.getCell(`A${currentRow}`);
  const soTienBangChu = convertNumberToText(tongTien);
  tongSoTien.value = `Tổng số tiền trong bảng kê này (viết bằng chữ): ${soTienBangChu} đồng./.`;
  tongSoTien.font = {
    name: "Times New Roman",
    size: 11,
    bold: true,
    italic: true,
  };
  tongSoTien.alignment = {
    horizontal: "left",
    vertical: "middle",
    wrapText: true,
  };

  currentRow += 2;

  // Ngày tháng
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  const ngayThang = worksheet.getCell(`A${currentRow}`);
  const now = new Date();
  ngayThang.value = `Ngày ${now.getDate()} tháng ${
    now.getMonth() + 1
  } năm ${now.getFullYear()}`;
  ngayThang.font = { name: "Times New Roman", size: 11, italic: true };
  ngayThang.alignment = { horizontal: "right", vertical: "middle" };

  currentRow++;

  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  const tlTuLenh = worksheet.getCell(`A${currentRow}`);
  tlTuLenh.value = "TL. TƯ LỆNH";
  tlTuLenh.font = { name: "Times New Roman", size: 11, bold: true };
  tlTuLenh.alignment = { horizontal: "right", vertical: "middle" };

  currentRow += 2;

  // Chữ ký - 3 cột như trong ảnh
  const positions = ["NGƯỜI LẬP", "TRƯỞNG BAN TMKH", "CHỦ NHIỆM HC-KT"];
  const names = [
    signatures.nguoi_lap,
    signatures.truong_ban_tmkh,
    signatures.chu_nhiem_hckt,
  ];
  const startCols = [1, 2, 4]; // Cột A, B, D

  positions.forEach((position, index) => {
    const startCol = startCols[index];

    const positionCell = worksheet.getCell(currentRow, startCol);
    positionCell.value = position;
    positionCell.font = { name: "Times New Roman", size: 11, bold: true };
    positionCell.alignment = { horizontal: "center", vertical: "middle" };

    if (names[index]) {
      const nameCell = worksheet.getCell(currentRow + 5, startCol);
      nameCell.value = names[index];
      nameCell.font = { name: "Times New Roman", size: 11, bold: true };
      nameCell.alignment = { horizontal: "center", vertical: "middle" };
    }
  });
};

// Helper function chuyển số thành chữ (đã có trong printController.js)
function convertNumberToText(number) {
  if (number === 0) return "không";

  const ones = [
    "",
    "một",
    "hai",
    "ba",
    "bốn",
    "năm",
    "sáu",
    "bảy",
    "tám",
    "chín",
  ];
  const tens = [
    "",
    "",
    "hai mười",
    "ba mười",
    "bốn mười",
    "năm mười",
    "sáu mười",
    "bảy mười",
    "tám mười",
    "chín mười",
  ];

  function convertHundreds(n) {
    let result = "";
    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const one = n % 10;

    if (hundred > 0) {
      result += ones[hundred] + " trăm";
      if (ten > 0 || one > 0) result += " ";
    }

    if (ten > 1) {
      result += tens[ten];
      if (one > 0) {
        if (one === 1) result += " mốt";
        else if (one === 5 && ten > 0) result += " lăm";
        else result += " " + ones[one];
      }
    } else if (ten === 1) {
      result += "mười";
      if (one > 0) {
        if (one === 5) result += " lăm";
        else result += " " + ones[one];
      }
    } else if (one > 0) {
      if (hundred > 0) result += "lẻ ";
      result += ones[one];
    }

    return result.trim();
  }

  if (number < 1000) {
    return convertHundreds(number);
  } else if (number < 1000000) {
    const thousands = Math.floor(number / 1000);
    const remainder = number % 1000;

    let result = convertHundreds(thousands) + " nghìn";
    if (remainder > 0) {
      if (remainder < 100) result += " lẻ ";
      else result += " ";
      result += convertHundreds(remainder);
    }
    return result;
  } else if (number < 1000000000) {
    const millions = Math.floor(number / 1000000);
    const thousands = Math.floor((number % 1000000) / 1000);
    const remainder = number % 1000;

    let result = convertHundreds(millions) + " triệu";

    if (thousands > 0) {
      if (thousands < 100) result += " lẻ ";
      else result += " ";
      result += convertHundreds(thousands) + " nghìn";
    }

    if (remainder > 0) {
      if (remainder < 100) result += " lẻ ";
      else result += " ";
      result += convertHundreds(remainder);
    }

    return result;
  } else {
    const billions = Math.floor(number / 1000000000);
    const millions = Math.floor((number % 1000000000) / 1000000);
    const thousands = Math.floor((number % 1000000) / 1000);
    const remainder = number % 1000;

    let result = convertHundreds(billions) + " tỷ";

    if (millions > 0) {
      if (millions < 100) result += " lẻ ";
      else result += " ";
      result += convertHundreds(millions) + " triệu";
    }

    if (thousands > 0) {
      if (thousands < 100) result += " lẻ ";
      else result += " ";
      result += convertHundreds(thousands) + " nghìn";
    }

    if (remainder > 0) {
      if (remainder < 100) result += " lẻ ";
      else result += " ";
      result += convertHundreds(remainder);
    }

    return result;
  }
}

//============================== báo cáo xuất mới=============================//

const generateXuatReportWithTabs = async (req, res, query, user) => {
  try {
    const { tu_ngay, den_ngay, timeFrame, phong_ban_id } = query;
    const { nguoi_lap = "", truong_ban_tmkh = "", chu_nhiem_hckt = "" } = query;

    if (!tu_ngay || !den_ngay) {
      return sendResponse(res, 400, false, "Vui lòng chọn khoảng thời gian");
    }

    console.log(
      `📊 Generating Xuat report with tabs from ${tu_ngay} to ${den_ngay}`
    );

    // Xác định phòng ban dựa trên role
    let phongBanFilter = "";
    let queryParams = [tu_ngay, den_ngay];
    let paramIndex = 3;

    if (user.role === "user") {
      // Cấp 3: Chỉ xem được phòng ban của mình
      phongBanFilter = `AND px.phong_ban_id = $${paramIndex}`;
      queryParams.push(user.phong_ban_id);
      paramIndex++;
    } else if (user.role === "manager") {
      // Cấp 2: Xem được phòng ban của mình và các phòng ban cấp 3 dưới quyền
      if (phong_ban_id && phong_ban_id !== "all") {
        phongBanFilter = `AND px.phong_ban_id = $${paramIndex}`;
        queryParams.push(phong_ban_id);
        paramIndex++;
      } else {
        // Nếu chọn "all", chỉ xem được phòng ban của mình và các phòng ban cấp 3 dưới quyền
        phongBanFilter = `AND (px.phong_ban_id = $${paramIndex} OR px.phong_ban_id IN (
          SELECT id FROM phong_ban WHERE phong_ban_cha_id = $${paramIndex} AND cap_bac = 3
        ))`;
        queryParams.push(user.phong_ban_id);
        paramIndex++;
      }
    } else if (user.role === "admin") {
      // Cấp 1: Xem được tất cả
      if (phong_ban_id && phong_ban_id !== "all") {
        phongBanFilter = `AND px.phong_ban_id = $${paramIndex}`;
        queryParams.push(phong_ban_id);
        paramIndex++;
      }
    }

    // Query lấy dữ liệu cho cả 2 loại
    const [donViSuDungData, donViNhanData] = await Promise.all([
      getXuatDataByTypeForExport("don_vi_su_dung", queryParams, phongBanFilter),
      getXuatDataByTypeForExport("don_vi_nhan", queryParams, phongBanFilter),
    ]);

    // Tạo dữ liệu tổng hợp (tất cả phiếu)
    const tongHopData = [...donViSuDungData, ...donViNhanData];

    console.log(
      `📊 Found ${donViSuDungData.length} don_vi_su_dung and ${donViNhanData.length} don_vi_nhan records`
    );

    // Tạo workbook Excel
    const workbook = new ExcelJS.Workbook();

    // Lấy thông tin phòng ban được chọn
    let selectedPhongBan = user.phong_ban;
    if (phong_ban_id && phong_ban_id !== "all") {
      const phongBanQuery = `SELECT id, ten_phong_ban, ma_phong_ban FROM phong_ban WHERE id = $1`;
      const phongBanResult = await pool.query(phongBanQuery, [phong_ban_id]);
      if (phongBanResult.rows.length > 0) {
        selectedPhongBan = phongBanResult.rows[0];
      }
    }

    // Tạo sheet tổng hợp (Tab 1)
    await createXuatSheet(
      workbook,
      "Tổng hợp",
      tongHopData,
      tu_ngay,
      den_ngay,
      timeFrame,
      {
        nguoi_lap,
        truong_ban_tmkh,
        chu_nhiem_hckt,
      },
      user,
      selectedPhongBan
    );

    // Tạo sheet cho đơn vị sử dụng (Tab 2)
    await createXuatSheet(
      workbook,
      "Đơn vị sử dụng",
      donViSuDungData,
      tu_ngay,
      den_ngay,
      timeFrame,
      {
        nguoi_lap,
        truong_ban_tmkh,
        chu_nhiem_hckt,
      },
      user,
      selectedPhongBan
    );

    // Tạo sheet cho đơn vị nhận (Tab 3)
    await createXuatSheet(
      workbook,
      "Đơn vị nhận",
      donViNhanData,
      tu_ngay,
      den_ngay,
      timeFrame,
      {
        nguoi_lap,
        truong_ban_tmkh,
        chu_nhiem_hckt,
      },
      user,
      selectedPhongBan
    );

    console.log("📝 Workbook created successfully with 3 tabs");

    // Tạo buffer và trả về
    const buffer = await workbook.xlsx.writeBuffer();

    if (buffer.length === 0) {
      throw new Error("Generated Excel buffer is empty");
    }

    res.writeHead(200, {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bao-cao-xuat-${timeFrame}-${Date.now()}.xlsx"`,
      "Content-Length": buffer.length,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    res.end(buffer);
    console.log("✅ Xuất report with tabs sent successfully");
  } catch (error) {
    console.error("❌ Generate Xuất Excel with tabs error:", error);
    if (!res.headersSent) {
      return sendResponse(res, 500, false, "Lỗi tạo báo cáo Excel", {
        error: error.message,
      });
    }
  }
};

// Helper function để lấy dữ liệu xuất theo loại cho export
const getXuatDataByTypeForExport = async (
  loaiPhieu,
  baseParams,
  phongBanFilter
) => {
  // Tạo parameter array mới bao gồm loaiPhieu
  const queryParams = [...baseParams, loaiPhieu];

  // Tạo placeholder cho loaiPhieu
  const loaiPhieuParamIndex = baseParams.length + 1;

  const query = `
    SELECT 
      px.id,
      px.so_phieu,
      px.ngay_xuat,
      px.tong_tien,
      px.ly_do_xuat,
      px.loai_xuat,
      pb.ten_phong_ban,
      dvn.ten_don_vi as don_vi_nhan,
      u.ho_ten as nguoi_tao_ten,
      COUNT(ctx.id) as so_mat_hang
    FROM phieu_xuat px
    LEFT JOIN phong_ban pb ON px.phong_ban_id = pb.id
    LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id
    LEFT JOIN users u ON px.nguoi_tao = u.id
    LEFT JOIN chi_tiet_xuat ctx ON px.id = ctx.phieu_xuat_id
    WHERE px.ngay_xuat BETWEEN $1::date AND $2::date 
      AND px.trang_thai = 'completed'
      AND px.loai_xuat = $${loaiPhieuParamIndex}
      ${phongBanFilter}
    GROUP BY px.id, px.so_phieu, px.ngay_xuat, px.tong_tien, 
             px.ly_do_xuat, px.loai_xuat, pb.ten_phong_ban, dvn.ten_don_vi, u.ho_ten
    ORDER BY px.ngay_xuat DESC, px.id DESC
  `;

  const result = await pool.query(query, queryParams);
  return result.rows || [];
};

// Function tạo từng sheet xuất
const createXuatSheet = async (
  workbook,
  sheetName,
  data,
  tu_ngay,
  den_ngay,
  timeFrame,
  signatures,
  user,
  selectedPhongBan
) => {
  const worksheet = workbook.addWorksheet(sheetName);

  // Hàm helper để format ngày
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;
  };

  // Thiết lập độ rộng cột
  worksheet.columns = [
    { width: 5 }, // STT
    { width: 15 }, // Số phiếu
    { width: 12 }, // Ngày, tháng
    { width: 35 }, // Nội dung
    { width: 20 }, // Số tiền
  ];

  let currentRow = 1;

  // Header - Thông tin tổ chức
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  const headerCell = worksheet.getCell(`A${currentRow}`);
  const unitName =
    selectedPhongBan?.ten_phong_ban ||
    user?.phong_ban?.ten_phong_ban ||
    "BỘ TƯ LỆNH CẢNH SÁT BIỂN";
  headerCell.value = unitName;
  headerCell.font = { name: "Times New Roman", size: 12, bold: true };
  headerCell.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };

  currentRow += 3;

  // Tiêu đề chính
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  const title = worksheet.getCell(`A${currentRow}`);
  title.value = `BẢNG KÊ PHIẾU XUẤT KHO - ${sheetName.toUpperCase()}`;
  title.font = { name: "Times New Roman", size: 14, bold: true };
  title.alignment = { horizontal: "center", vertical: "middle" };

  currentRow++;

  // Thời gian và đơn vị
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  const timeUnit = worksheet.getCell(`A${currentRow}`);
  const timeFrameText =
    timeFrame === "month" ? "Tháng" : timeFrame === "quarter" ? "Quý" : "Năm";
  const date = new Date(tu_ngay);
  const period =
    timeFrame === "month"
      ? `${date.getMonth() + 1}`
      : timeFrame === "quarter"
      ? `${Math.ceil((date.getMonth() + 1) / 3)}`
      : `${date.getFullYear()}`;
  timeUnit.value = `${timeFrameText} ${period} năm ${date.getFullYear()}`;
  timeUnit.font = { name: "Times New Roman", size: 12, bold: true };
  timeUnit.alignment = { horizontal: "center", vertical: "middle" };

  currentRow++;

  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  const donVi = worksheet.getCell(`A${currentRow}`);
  donVi.value = `Đơn vị: ${
    selectedPhongBan?.ten_phong_ban ||
    user?.phong_ban?.ten_phong_ban ||
    "Ban Quân khí - Phòng Hậu cần, Kỹ thuật"
  }`;
  donVi.font = { name: "Times New Roman", size: 11, bold: true };
  donVi.alignment = { horizontal: "center", vertical: "middle" };

  currentRow += 2;

  // Đơn vị tính (góc phải)
  worksheet.mergeCells(`D${currentRow}:E${currentRow}`);
  const donViTinh = worksheet.getCell(`D${currentRow}`);
  donViTinh.value = "Đơn vị tính: đồng";
  donViTinh.font = { name: "Times New Roman", size: 10, italic: true };
  donViTinh.alignment = { horizontal: "right", vertical: "middle" };

  currentRow++;

  // Headers bảng
  const headers = ["STT", "Số phiếu", "Ngày, tháng", "Nội dung", "Số tiền"];

  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { name: "Times New Roman", size: 10, bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFB0E0E6" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  currentRow++;

  // Dữ liệu
  let tongTien = 0;

  data.forEach((item, index) => {
    const rowData = [
      index + 1,
      item.so_phieu,
      formatDate(item.ngay_xuat),
      item.ly_do_xuat || "Xuất kho",
      parseFloat(item.tong_tien) || 0,
    ];

    rowData.forEach((value, colIndex) => {
      const cell = worksheet.getCell(currentRow, colIndex + 1);
      cell.value = value;

      if (colIndex === 4) {
        // Cột số tiền - format số và alignment phải
        cell.numFmt = "#,##0";
        cell.alignment = { horizontal: "right", vertical: "middle" };
      } else if (colIndex === 0) {
        // STT - center
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else {
        // Các cột khác - left align
        cell.alignment = {
          horizontal: "left",
          vertical: "middle",
          wrapText: true,
        };
      }

      cell.font = { name: "Times New Roman", size: 10 };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    tongTien += parseFloat(item.tong_tien) || 0;
    currentRow++;
  });

  // Dòng tổng cộng
  const tongData = ["", "", "", "Cộng", tongTien];

  tongData.forEach((value, colIndex) => {
    const cell = worksheet.getCell(currentRow, colIndex + 1);
    cell.value = value;

    if (colIndex === 4) {
      // Cột số tiền - format số và alignment phải
      cell.numFmt = "#,##0";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else if (colIndex === 3) {
      // Cột "Cộng" - center
      cell.alignment = { horizontal: "center", vertical: "middle" };
    } else {
      // Các cột khác - left align
      cell.alignment = {
        horizontal: "left",
        vertical: "middle",
      };
    }

    cell.font = { name: "Times New Roman", size: 10, bold: true };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  currentRow++;

  // Chữ ký
  if (
    signatures.nguoi_lap ||
    signatures.truong_ban_tmkh ||
    signatures.chu_nhiem_hckt
  ) {
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    const signatureTitle = worksheet.getCell(`A${currentRow}`);
    signatureTitle.value = "CHỮ KÝ";
    signatureTitle.font = { name: "Times New Roman", size: 12, bold: true };
    signatureTitle.alignment = { horizontal: "center", vertical: "middle" };

    currentRow++;

    // Người lập
    if (signatures.nguoi_lap) {
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      const nguoiLap = worksheet.getCell(`A${currentRow}`);
      nguoiLap.value = "Người lập";
      nguoiLap.font = { name: "Times New Roman", size: 10, bold: true };
      nguoiLap.alignment = { horizontal: "center", vertical: "middle" };

      worksheet.mergeCells(`C${currentRow}:E${currentRow}`);
      const nguoiLapName = worksheet.getCell(`C${currentRow}`);
      nguoiLapName.value = signatures.nguoi_lap;
      nguoiLapName.font = { name: "Times New Roman", size: 10 };
      nguoiLapName.alignment = { horizontal: "center", vertical: "middle" };
      currentRow++;
    }

    // Trưởng ban TMKH
    if (signatures.truong_ban_tmkh) {
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      const truongBan = worksheet.getCell(`A${currentRow}`);
      truongBan.value = "Trưởng ban TMKH";
      truongBan.font = { name: "Times New Roman", size: 10, bold: true };
      truongBan.alignment = { horizontal: "center", vertical: "middle" };

      worksheet.mergeCells(`C${currentRow}:E${currentRow}`);
      const truongBanName = worksheet.getCell(`C${currentRow}`);
      truongBanName.value = signatures.truong_ban_tmkh;
      truongBanName.font = { name: "Times New Roman", size: 10 };
      truongBanName.alignment = { horizontal: "center", vertical: "middle" };
      currentRow++;
    }

    // Chủ nhiệm HC-KT
    if (signatures.chu_nhiem_hckt) {
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      const chuNhiem = worksheet.getCell(`A${currentRow}`);
      chuNhiem.value = "Chủ nhiệm HC-KT";
      chuNhiem.font = { name: "Times New Roman", size: 10, bold: true };
      chuNhiem.alignment = { horizontal: "center", vertical: "middle" };

      worksheet.mergeCells(`C${currentRow}:E${currentRow}`);
      const chuNhiemName = worksheet.getCell(`C${currentRow}`);
      chuNhiemName.value = signatures.chu_nhiem_hckt;
      chuNhiemName.font = { name: "Times New Roman", size: 10 };
      chuNhiemName.alignment = { horizontal: "center", vertical: "middle" };
    }
  }
};

module.exports = {
  generatePhieuNhapExcel,
  generatePhieuXuatExcel,
  generatePhieuKiemKeExcel,
  generateLuanChuyenKhoReport,
  generateBaoCaoNhapExcel,
  generateBaoCaoXuatExcel,
  generateNhapReportWithTabs,
  generateXuatReportWithTabs,
  getNhapDataByTypeForExport,
  getXuatDataByTypeForExport,
  createNhapSheet,
  createXuatSheet,
  createMainSheetEnhanced,
  createSubSheetEnhanced,
};
