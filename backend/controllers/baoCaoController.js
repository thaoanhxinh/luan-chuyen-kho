const pool = require("../config/database");
const { sendResponse } = require("../utils/response");
const ExcelJS = require("exceljs");
const path = require("path");

const getDashboardStats = async (req, res, query, user) => {
  try {
    console.log(
      "Getting dashboard stats for user:",
      user.role,
      user.phong_ban_id
    );

    // Xây dựng WHERE clause dựa trên role
    let whereClause = "";
    let queryParams = [];

    // User thường chỉ thấy data của phòng ban mình, admin thấy tất cả
    if (user.role !== "admin") {
      whereClause = "WHERE pn.phong_ban_id = $1";
      queryParams.push(user.phong_ban_id);
    }

    // 1. Thống kê tổng quan
    const tongHangHoaQuery = `
      SELECT COUNT(*) as total 
      FROM hang_hoa hh 
      ${user.role !== "admin" ? "WHERE hh.phong_ban_id = $1" : ""}
    `;

    const phieuNhapThangQuery = `
      SELECT COUNT(*) as total 
      FROM phieu_nhap pn 
      WHERE EXTRACT(MONTH FROM pn.ngay_nhap) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM pn.ngay_nhap) = EXTRACT(YEAR FROM CURRENT_DATE)
      ${user.role !== "admin" ? "AND pn.phong_ban_id = $1" : ""}
    `;

    const phieuXuatThangQuery = `
      SELECT COUNT(*) as total 
      FROM phieu_xuat px 
      WHERE EXTRACT(MONTH FROM px.ngay_xuat) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM px.ngay_xuat) = EXTRACT(YEAR FROM CURRENT_DATE)
      ${user.role !== "admin" ? "AND px.phong_ban_id = $1" : ""}
    `;

    const hangSapHetQuery = `
      SELECT COUNT(*) as total 
      FROM ton_kho tk 
      JOIN hang_hoa hh ON tk.hang_hoa_id = hh.id
      WHERE tk.so_luong_ton <= 5 AND tk.so_luong_ton > 0
      ${user.role !== "admin" ? "AND tk.phong_ban_id = $1" : ""}
    `;

    // 2. Phiếu nhập gần đây (5 phiếu)
    const phieuNhapGanDayQuery = `
      SELECT 
        pn.so_phieu,
        pn.ngay_nhap,
        pn.tong_tien,
        ncc.ten_ncc as nha_cung_cap,
        pn.trang_thai
      FROM phieu_nhap pn
      LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
      ${whereClause}
      ORDER BY pn.created_at DESC
      LIMIT 5
    `;

    // 3. Phiếu xuất gần đây (5 phiếu)
    const phieuXuatGanDayQuery = `
      SELECT 
        px.so_phieu,
        px.ngay_xuat,
        px.tong_tien,
        dvn.ten_don_vi as don_vi_nhan,
        px.trang_thai
      FROM phieu_xuat px
      LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id
      ${whereClause.replace("pn.", "px.")}
      ORDER BY px.created_at DESC
      LIMIT 5
    `;

    // 4. Top hàng hóa có giá trị tồn cao (10 items)
    const topHangHoaQuery = `
      SELECT 
        hh.ma_hang_hoa,
        hh.ten_hang_hoa,
        hh.don_vi_tinh,
        tk.so_luong_ton,
        tk.gia_tri_ton
      FROM ton_kho tk
      JOIN hang_hoa hh ON tk.hang_hoa_id = hh.id
      WHERE tk.so_luong_ton > 0
      ${user.role !== "admin" ? "AND tk.phong_ban_id = $1" : ""}
      ORDER BY tk.gia_tri_ton DESC
      LIMIT 10
    `;

    // Thực hiện các query
    const statsParams = user.role !== "admin" ? [user.phong_ban_id] : [];

    const [
      tongHangHoaResult,
      phieuNhapThangResult,
      phieuXuatThangResult,
      hangSapHetResult,
      phieuNhapGanDayResult,
      phieuXuatGanDayResult,
      topHangHoaResult,
    ] = await Promise.all([
      pool.query(tongHangHoaQuery, statsParams),
      pool.query(phieuNhapThangQuery, statsParams),
      pool.query(phieuXuatThangQuery, statsParams),
      pool.query(hangSapHetQuery, statsParams),
      pool.query(phieuNhapGanDayQuery, queryParams),
      pool.query(phieuXuatGanDayQuery, queryParams),
      pool.query(topHangHoaQuery, statsParams),
    ]);

    // Tổng hợp kết quả
    const dashboardData = {
      tong_hang_hoa: parseInt(tongHangHoaResult.rows[0].total),
      phieu_nhap_thang: parseInt(phieuNhapThangResult.rows[0].total),
      phieu_xuat_thang: parseInt(phieuXuatThangResult.rows[0].total),
      hang_sap_het: parseInt(hangSapHetResult.rows[0].total),
      phieu_nhap_gan_day: phieuNhapGanDayResult.rows.map((row) => ({
        so_phieu: row.so_phieu,
        ngay_nhap: row.ngay_nhap,
        tong_tien: parseFloat(row.tong_tien),
        nha_cung_cap: row.nha_cung_cap,
        trang_thai: row.trang_thai,
      })),
      phieu_xuat_gan_day: phieuXuatGanDayResult.rows.map((row) => ({
        so_phieu: row.so_phieu,
        ngay_xuat: row.ngay_xuat,
        tong_tien: parseFloat(row.tong_tien),
        don_vi_nhan: row.don_vi_nhan,
        trang_thai: row.trang_thai,
      })),
      top_hang_hoa_gia_tri: topHangHoaResult.rows.map((row) => ({
        ma_hang_hoa: row.ma_hang_hoa,
        ten_hang_hoa: row.ten_hang_hoa,
        don_vi_tinh: row.don_vi_tinh,
        so_luong_ton: parseFloat(row.so_luong_ton),
        gia_tri_ton: parseFloat(row.gia_tri_ton),
      })),
    };

    console.log("Dashboard data:", dashboardData);

    sendResponse(
      res,
      200,
      true,
      "Lấy thống kê dashboard thành công",
      dashboardData
    );
  } catch (error) {
    console.error("Dashboard stats error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

const getTonKhoReport = async (req, res, query, user) => {
  try {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = query.search || "";

    let whereClause = "WHERE tk.so_luong_ton >= 0";
    let queryParams = [];
    let paramIndex = 1;

    // User thường chỉ thấy tồn kho của phòng ban mình
    if (user.role !== "admin") {
      whereClause += ` AND tk.phong_ban_id = $${paramIndex}`;
      queryParams.push(user.phong_ban_id);
      paramIndex++;
    }

    // Bộ lọc phòng ban cho admin
    if (query.phong_ban_id && user.role === "admin") {
      whereClause += ` AND tk.phong_ban_id = $${paramIndex}`;
      queryParams.push(query.phong_ban_id);
      paramIndex++;
    }

    // Bộ lọc tìm kiếm
    if (search) {
      whereClause += ` AND (hh.ten_hang_hoa ILIKE $${paramIndex} OR hh.ma_hang_hoa ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Bộ lọc loại hàng hóa
    if (query.loai_hang_hoa) {
      whereClause += ` AND hh.loai_hang_hoa_id = $${paramIndex}`;
      queryParams.push(query.loai_hang_hoa);
      paramIndex++;
    }

    // Bộ lọc phẩm chất
    if (query.pham_chat) {
      switch (query.pham_chat) {
        case "tot":
          whereClause += ` AND tk.sl_tot > 0`;
          break;
        case "kem_pham_chat":
          whereClause += ` AND tk.sl_kem_pham_chat > 0`;
          break;
        case "mat_pham_chat":
          whereClause += ` AND tk.sl_mat_pham_chat > 0`;
          break;
        case "hong":
          whereClause += ` AND tk.sl_hong > 0`;
          break;
        case "can_thanh_ly":
          whereClause += ` AND tk.sl_can_thanh_ly > 0`;
          break;
      }
    }

    // SỬA LỖI: Sử dụng paramIndex đúng cách
    const tonKhoQuery = `
      SELECT 
        hh.ma_hang_hoa,
        hh.ten_hang_hoa,
        hh.don_vi_tinh,
        pb.ten_phong_ban,
        lhh.ten_loai,
        tk.sl_tot,
        tk.sl_kem_pham_chat,
        tk.sl_mat_pham_chat,
        tk.sl_hong,
        tk.sl_can_thanh_ly,
        tk.so_luong_ton,
        tk.gia_tri_ton,
        tk.don_gia_binh_quan,
        tk.ngay_cap_nhat
      FROM ton_kho tk
      JOIN hang_hoa hh ON tk.hang_hoa_id = hh.id
      JOIN phong_ban pb ON tk.phong_ban_id = pb.id
      LEFT JOIN loai_hang_hoa lhh ON hh.loai_hang_hoa_id = lhh.id
      ${whereClause}
      ORDER BY tk.gia_tri_ton DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // Thêm limit và offset vào params
    queryParams.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM ton_kho tk
      JOIN hang_hoa hh ON tk.hang_hoa_id = hh.id
      LEFT JOIN loai_hang_hoa lhh ON hh.loai_hang_hoa_id = lhh.id
      ${whereClause}
    `;

    const [tonKhoResult, countResult] = await Promise.all([
      pool.query(tonKhoQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)), // Bỏ limit và offset cho count query
    ]);

    const total = parseInt(countResult.rows[0].total);

    sendResponse(res, 200, true, "Lấy báo cáo tồn kho thành công", {
      items: tonKhoResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Ton kho report error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

const getNhapXuatReport = async (req, res, query, user) => {
  try {
    const { tu_ngay, den_ngay, trang_thai } = query;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    let queryParams = [];
    let paramIndex = 1;

    // User thường chỉ thấy phiếu của phòng ban mình
    if (user.role !== "admin") {
      whereClause += ` AND phong_ban_id = $${paramIndex}`;
      queryParams.push(user.phong_ban_id);
      paramIndex++;
    }

    // Bộ lọc phòng ban cho admin
    if (query.phong_ban_id && user.role === "admin") {
      whereClause += ` AND phong_ban_id = $${paramIndex}`;
      queryParams.push(query.phong_ban_id);
      paramIndex++;
    }

    if (tu_ngay) {
      whereClause += ` AND ngay >= $${paramIndex}`;
      queryParams.push(tu_ngay);
      paramIndex++;
    }

    if (den_ngay) {
      whereClause += ` AND ngay <= $${paramIndex}`;
      queryParams.push(den_ngay);
      paramIndex++;
    }

    if (trang_thai && trang_thai !== "all") {
      whereClause += ` AND trang_thai = $${paramIndex}`;
      queryParams.push(trang_thai);
      paramIndex++;
    }

    // Bộ lọc nhà cung cấp
    if (query.nha_cung_cap_id) {
      whereClause += ` AND nha_cung_cap_id = $${paramIndex}`;
      queryParams.push(query.nha_cung_cap_id);
      paramIndex++;
    }

    // Bộ lọc đơn vị nhận
    if (query.don_vi_nhan_id) {
      whereClause += ` AND don_vi_nhan_id = $${paramIndex}`;
      queryParams.push(query.don_vi_nhan_id);
      paramIndex++;
    }

    // SỬA QUERY NÀY - THÊM JOIN ĐE LẤY TÊN
    const nhapXuatQuery = `
      SELECT * FROM (
        SELECT 
          pn.so_phieu,
          pn.ngay_nhap as ngay,
          'Nhập' as loai,
          pn.ly_do_nhap as ly_do,
          pn.tong_tien,
          pn.trang_thai::text,
          pn.phong_ban_id,
          pn.nha_cung_cap_id,
          NULL as don_vi_nhan_id,
          ncc.ten_ncc as nha_cung_cap_ten,
          NULL as don_vi_nhan_ten,
          pn.created_at
        FROM phieu_nhap pn
        LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
        WHERE pn.trang_thai = 'completed'
        
        UNION ALL
        
        SELECT 
          px.so_phieu,
          px.ngay_xuat as ngay,
          'Xuất' as loai,
          px.ly_do_xuat as ly_do,
          px.tong_tien,
          px.trang_thai::text,
          px.phong_ban_id,
          NULL as nha_cung_cap_id,
          px.don_vi_nhan_id,
          NULL as nha_cung_cap_ten,
          dvn.ten_don_vi as don_vi_nhan_ten,
          px.created_at
        FROM phieu_xuat px
        LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id
        WHERE px.trang_thai = 'completed'
      ) combined
      ${whereClause}
      ORDER BY ngay DESC, created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // Thêm limit và offset vào params
    queryParams.push(limit, offset);

    // Count query tương tự
    const countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT pn.phong_ban_id, pn.ngay_nhap as ngay, pn.trang_thai, pn.nha_cung_cap_id, NULL as don_vi_nhan_id FROM phieu_nhap pn WHERE pn.trang_thai = 'completed'
        UNION ALL
        SELECT px.phong_ban_id, px.ngay_xuat as ngay, px.trang_thai, NULL as nha_cung_cap_id, px.don_vi_nhan_id FROM phieu_xuat px WHERE px.trang_thai = 'completed'
      ) combined
      ${whereClause}
    `;

    const [result, countResult] = await Promise.all([
      pool.query(nhapXuatQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)), // Bỏ limit và offset cho count query
    ]);

    const total = parseInt(countResult.rows[0].total);

    sendResponse(res, 200, true, "Lấy báo cáo nhập xuất thành công", {
      items: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Nhap xuat report error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

const getKiemKeReport = async (req, res, query, user) => {
  try {
    const { tu_ngay, den_ngay, loai_hang_hoa, trang_thai, loai_kiem_ke } =
      query;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    console.log("Getting kiem ke report with params:", {
      tu_ngay,
      den_ngay,
      loai_hang_hoa,
      trang_thai,
      loai_kiem_ke,
    });

    let whereClause = "WHERE 1=1";
    let queryParams = [];
    let paramIndex = 1;

    // User thường chỉ thấy kiểm kê của phòng ban mình
    if (user.role !== "admin") {
      whereClause += ` AND pk.phong_ban_id = $${paramIndex}`;
      queryParams.push(user.phong_ban_id);
      paramIndex++;
    }

    // Bộ lọc phòng ban cho admin
    if (query.phong_ban_id && user.role === "admin") {
      whereClause += ` AND pk.phong_ban_id = $${paramIndex}`;
      queryParams.push(query.phong_ban_id);
      paramIndex++;
    }

    // Filter theo ngày kiểm kê
    if (tu_ngay) {
      whereClause += ` AND pk.ngay_kiem_ke >= $${paramIndex}`;
      queryParams.push(tu_ngay);
      paramIndex++;
    }

    if (den_ngay) {
      whereClause += ` AND pk.ngay_kiem_ke <= $${paramIndex}`;
      queryParams.push(den_ngay);
      paramIndex++;
    }

    // Filter theo trạng thái
    if (trang_thai) {
      whereClause += ` AND pk.trang_thai = $${paramIndex}`;
      queryParams.push(trang_thai);
      paramIndex++;
    }

    // Filter theo loại kiểm kê
    if (loai_kiem_ke) {
      whereClause += ` AND pk.loai_kiem_ke = $${paramIndex}`;
      queryParams.push(loai_kiem_ke);
      paramIndex++;
    }

    // Filter theo loại hàng hóa
    if (loai_hang_hoa && loai_hang_hoa !== "") {
      whereClause += ` AND hh.loai_hang_hoa_id = $${paramIndex}`;
      queryParams.push(parseInt(loai_hang_hoa));
      paramIndex++;
    }

    // SỬA LỖI: Tạo một bản copy của queryParams trước khi thêm LIMIT và OFFSET
    const baseParams = [...queryParams];

    // Thêm LIMIT và OFFSET vào cuối
    const limitParam = paramIndex;
    const offsetParam = paramIndex + 1;
    queryParams.push(limit, offset);

    // Query chính để lấy dữ liệu kiểm kê
    const kiemKeQuery = `
      SELECT 
        pk.so_phieu,
        pk.ngay_kiem_ke,
        pk.gio_kiem_ke,
        pk.don_vi_kiem_ke,
        COALESCE(pk.to_kiem_ke->>'to_truong', '') as nguoi_thuc_hien,
        pk.ly_do_kiem_ke,
        pk.loai_kiem_ke,
        pk.trang_thai::text,
        pb.ten_phong_ban,
        COUNT(ck.id) as so_mat_hang,
        COALESCE(SUM(
          (ck.sl_tot + ck.sl_kem_pham_chat + ck.sl_mat_pham_chat + ck.sl_hong + ck.sl_can_thanh_ly) - ck.so_luong_so_sach
        ), 0) as so_luong_chenh_lech,
        COALESCE(SUM(
          ((ck.sl_tot + ck.sl_kem_pham_chat + ck.sl_mat_pham_chat + ck.sl_hong + ck.sl_can_thanh_ly) - ck.so_luong_so_sach) * ck.don_gia
        ), 0) as gia_tri_chenh_lech,
        COUNT(CASE WHEN ((ck.sl_tot + ck.sl_kem_pham_chat + ck.sl_mat_pham_chat + ck.sl_hong + ck.sl_can_thanh_ly) - ck.so_luong_so_sach) < 0 THEN 1 END) as so_hang_hoa_thieu,
        COUNT(CASE WHEN ((ck.sl_tot + ck.sl_kem_pham_chat + ck.sl_mat_pham_chat + ck.sl_hong + ck.sl_can_thanh_ly) - ck.so_luong_so_sach) > 0 THEN 1 END) as so_hang_hoa_thua,
        pk.created_at
      FROM phieu_kiem_ke pk
      LEFT JOIN chi_tiet_kiem_ke ck ON pk.id = ck.phieu_kiem_ke_id
      LEFT JOIN hang_hoa hh ON ck.hang_hoa_id = hh.id
      JOIN phong_ban pb ON pk.phong_ban_id = pb.id
      LEFT JOIN loai_hang_hoa lhh ON hh.loai_hang_hoa_id = lhh.id
      ${whereClause}
      GROUP BY pk.id, pb.ten_phong_ban, pk.to_kiem_ke
      ORDER BY pk.ngay_kiem_ke DESC, pk.created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    // Query đếm tổng số - sử dụng baseParams (không có limit, offset)
    const countQuery = `
      SELECT COUNT(DISTINCT pk.id) as total
      FROM phieu_kiem_ke pk
      LEFT JOIN chi_tiet_kiem_ke ck ON pk.id = ck.phieu_kiem_ke_id
      LEFT JOIN hang_hoa hh ON ck.hang_hoa_id = hh.id
      JOIN phong_ban pb ON pk.phong_ban_id = pb.id
      LEFT JOIN loai_hang_hoa lhh ON hh.loai_hang_hoa_id = lhh.id
      ${whereClause}
    `;

    // Query thống kê tổng quan - sử dụng baseParams
    const thongKeQuery = `
      SELECT 
        COUNT(DISTINCT pk.id) as tong_phieu_kiem_ke,
        COUNT(ck.id) as tong_hang_hoa_kiem_ke,
        COUNT(CASE WHEN ((ck.sl_tot + ck.sl_kem_pham_chat + ck.sl_mat_pham_chat + ck.sl_hong + ck.sl_can_thanh_ly) - ck.so_luong_so_sach) != 0 THEN 1 END) as so_hang_hoa_chenh_lech,
        COUNT(CASE WHEN ((ck.sl_tot + ck.sl_kem_pham_chat + ck.sl_mat_pham_chat + ck.sl_hong + ck.sl_can_thanh_ly) - ck.so_luong_so_sach) > 0 THEN 1 END) as so_hang_hoa_thieu,
        COUNT(CASE WHEN ((ck.sl_tot + ck.sl_kem_pham_chat + ck.sl_mat_pham_chat + ck.sl_hong + ck.sl_can_thanh_ly) - ck.so_luong_so_sach) < 0 THEN 1 END) as so_hang_hoa_thua,
        COALESCE(SUM(ABS(((ck.sl_tot + ck.sl_kem_pham_chat + ck.sl_mat_pham_chat + ck.sl_hong + ck.sl_can_thanh_ly) - ck.so_luong_so_sach) * ck.don_gia)), 0) as tong_gia_tri_chenh_lech,
        COALESCE(SUM(CASE WHEN ((ck.sl_tot + ck.sl_kem_pham_chat + ck.sl_mat_pham_chat + ck.sl_hong + ck.sl_can_thanh_ly) - ck.so_luong_so_sach) > 0 THEN ((ck.sl_tot + ck.sl_kem_pham_chat + ck.sl_mat_pham_chat + ck.sl_hong + ck.sl_can_thanh_ly) - ck.so_luong_so_sach) * ck.don_gia ELSE 0 END), 0) as gia_tri_thieu,
        COALESCE(SUM(CASE WHEN ((ck.sl_tot + ck.sl_kem_pham_chat + ck.sl_mat_pham_chat + ck.sl_hong + ck.sl_can_thanh_ly) - ck.so_luong_so_sach) < 0 THEN ABS(((ck.sl_tot + ck.sl_kem_pham_chat + ck.sl_mat_pham_chat + ck.sl_hong + ck.sl_can_thanh_ly) - ck.so_luong_so_sach) * ck.don_gia) ELSE 0 END), 0) as gia_tri_thua
      FROM phieu_kiem_ke pk
      LEFT JOIN chi_tiet_kiem_ke ck ON pk.id = ck.phieu_kiem_ke_id
      LEFT JOIN hang_hoa hh ON ck.hang_hoa_id = hh.id
      JOIN phong_ban pb ON pk.phong_ban_id = pb.id
      LEFT JOIN loai_hang_hoa lhh ON hh.loai_hang_hoa_id = lhh.id
      ${whereClause}
    `;

    // Thực hiện các queries
    const [kiemKeResult, countResult, thongKeResult] = await Promise.all([
      pool.query(kiemKeQuery, queryParams), // Có limit và offset
      pool.query(countQuery, baseParams), // Không có limit và offset
      pool.query(thongKeQuery, baseParams), // Không có limit và offset
    ]);

    const total = parseInt(countResult.rows[0].total);
    const thongKe = thongKeResult.rows[0];

    // Format dữ liệu response
    const items = kiemKeResult.rows.map((row) => ({
      so_phieu: row.so_phieu,
      ngay_kiem_ke: row.ngay_kiem_ke,
      gio_kiem_ke: row.gio_kiem_ke,
      don_vi_kiem_ke: row.don_vi_kiem_ke,
      nguoi_thuc_hien: row.nguoi_thuc_hien,
      ly_do_kiem_ke: row.ly_do_kiem_ke,
      loai_kiem_ke: row.loai_kiem_ke,
      trang_thai: row.trang_thai,
      ten_phong_ban: row.ten_phong_ban,
      so_mat_hang: parseInt(row.so_mat_hang),
      so_luong_chenh_lech: parseFloat(row.so_luong_chenh_lech),
      gia_tri_chenh_lech: parseFloat(row.gia_tri_chenh_lech),
      so_hang_hoa_thieu: parseInt(row.so_hang_hoa_thieu),
      so_hang_hoa_thua: parseInt(row.so_hang_hoa_thua),
      created_at: row.created_at,
    }));

    // Format thống kê
    const thongKeFormatted = {
      tong_phieu_kiem_ke: parseInt(thongKe.tong_phieu_kiem_ke || 0),
      tong_hang_hoa_kiem_ke: parseInt(thongKe.tong_hang_hoa_kiem_ke || 0),
      so_hang_hoa_chenh_lech: parseInt(thongKe.so_hang_hoa_chenh_lech || 0),
      so_hang_hoa_thieu: parseInt(thongKe.so_hang_hoa_thieu || 0),
      so_hang_hoa_thua: parseInt(thongKe.so_hang_hoa_thua || 0),
      tong_gia_tri_chenh_lech: parseFloat(thongKe.tong_gia_tri_chenh_lech) || 0,
      gia_tri_thieu: parseFloat(thongKe.gia_tri_thieu) || 0,
      gia_tri_thua: parseFloat(thongKe.gia_tri_thua) || 0,
    };

    console.log("Kiem ke report result:", {
      total,
      itemsCount: items.length,
      thongKe: thongKeFormatted,
    });

    sendResponse(res, 200, true, "Lấy báo cáo kiểm kê thành công", {
      items,
      thong_ke: thongKeFormatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Kiem ke report error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

// Export Excel function
const exportExcel = async (req, res, params, user) => {
  try {
    const { reportType } = params; // 'ton-kho', 'nhap-xuat', 'kiem-ke'
    const query = req.query;

    let data;
    let filename;
    let worksheetName;

    // Lấy dữ liệu dựa trên loại báo cáo
    switch (reportType) {
      case "ton-kho":
        // Lấy tất cả dữ liệu (không phân trang)
        const tonKhoQuery = { ...query, limit: 10000, page: 1 };
        const mockReq = { query: tonKhoQuery };
        const mockRes = {
          status: () => mockRes,
          json: (result) => {
            data = result.data;
          },
        };
        await getTonKhoReport(mockReq, mockRes, tonKhoQuery, user);
        filename = `bao-cao-ton-kho-${
          new Date().toISOString().split("T")[0]
        }.xlsx`;
        worksheetName = "Báo cáo tồn kho";
        break;

      case "nhap-xuat":
        const nhapXuatQuery = { ...query, limit: 10000, page: 1 };
        const mockReq2 = { query: nhapXuatQuery };
        const mockRes2 = {
          status: () => mockRes2,
          json: (result) => {
            data = result.data;
          },
        };
        await getNhapXuatReport(mockReq2, mockRes2, nhapXuatQuery, user);
        filename = `bao-cao-nhap-xuat-${
          new Date().toISOString().split("T")[0]
        }.xlsx`;
        worksheetName = "Báo cáo nhập xuất";
        break;

      case "kiem-ke":
        const kiemKeQuery = { ...query, limit: 10000, page: 1 };
        const mockReq3 = { query: kiemKeQuery };
        const mockRes3 = {
          status: () => mockRes3,
          json: (result) => {
            data = result.data;
          },
        };
        await getKiemKeReport(mockReq3, mockRes3, kiemKeQuery, user);
        filename = `bao-cao-kiem-ke-${
          new Date().toISOString().split("T")[0]
        }.xlsx`;
        worksheetName = "Báo cáo kiểm kê";
        break;

      default:
        return sendResponse(res, 400, false, "Loại báo cáo không hợp lệ");
    }

    // Tạo workbook Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(worksheetName);

    // Style cho header
    const headerStyle = {
      font: { bold: true, color: { argb: "FFFFFF" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "366092" } },
      alignment: { horizontal: "center", vertical: "middle" },
      border: {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      },
    };

    // Tạo Excel dựa trên loại báo cáo
    if (reportType === "ton-kho") {
      // Headers cho báo cáo tồn kho
      const headers = [
        "Mã hàng hóa",
        "Tên hàng hóa",
        "Đơn vị tính",
        "Phòng ban",
        "Loại hàng hóa",
        "SL Tốt",
        "SL Kém PC",
        "SL Mất PC",
        "SL Hỏng",
        "SL Thanh lý",
        "Tổng tồn",
        "Giá trị tồn",
        "Đơn giá BQ",
      ];

      worksheet.addRow(headers);
      worksheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      // Thêm data
      data.items.forEach((item) => {
        worksheet.addRow([
          item.ma_hang_hoa,
          item.ten_hang_hoa,
          item.don_vi_tinh,
          item.ten_phong_ban,
          item.ten_loai || "",
          item.sl_tot || 0,
          item.sl_kem_pham_chat || 0,
          item.sl_mat_pham_chat || 0,
          item.sl_hong || 0,
          item.sl_can_thanh_ly || 0,
          item.so_luong_ton || 0,
          item.gia_tri_ton || 0,
          item.don_gia_binh_quan || 0,
        ]);
      });
    } else if (reportType === "nhap-xuat") {
      // Headers cho báo cáo nhập xuất
      const headers = [
        "Số phiếu",
        "Ngày",
        "Loại",
        "Lý do",
        "Số tiền",
        "Trạng thái",
      ];

      worksheet.addRow(headers);
      worksheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      // Thêm data
      data.items.forEach((item) => {
        worksheet.addRow([
          item.so_phieu,
          new Date(item.ngay).toLocaleDateString("vi-VN"),
          item.loai,
          item.ly_do,
          item.tong_tien || 0,
          item.trang_thai,
        ]);
      });
    } else if (reportType === "kiem-ke") {
      // Headers cho báo cáo kiểm kê
      const headers = [
        "Số phiếu",
        "Ngày KK",
        "Loại KK",
        "Đơn vị KK",
        "Người thực hiện",
        "Số mặt hàng",
        "CL số lượng",
        "CL giá trị",
        "Trạng thái",
      ];

      worksheet.addRow(headers);
      worksheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      // Thêm data
      data.items.forEach((item) => {
        worksheet.addRow([
          item.so_phieu,
          new Date(item.ngay_kiem_ke).toLocaleDateString("vi-VN"),
          item.loai_kiem_ke,
          item.don_vi_kiem_ke,
          item.nguoi_thuc_hien,
          item.so_mat_hang || 0,
          item.so_luong_chenh_lech || 0,
          item.gia_tri_chenh_lech || 0,
          item.trang_thai,
        ]);
      });
    }

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export Excel error:", error);
    sendResponse(res, 500, false, "Lỗi xuất Excel", { error: error.message });
  }
};

const getNhapDataByType = async (req, res, query, user) => {
  try {
    const { tu_ngay, den_ngay, loai_phieu, phong_ban_id } = query;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE pn.trang_thai = 'completed'";
    let queryParams = [];
    let paramIndex = 1;

    // Filter theo thời gian - ÉP KIỂU RÕ RÀNG
    if (tu_ngay) {
      whereClause += ` AND pn.ngay_nhap >= $${paramIndex}::date`;
      queryParams.push(tu_ngay);
      paramIndex++;
    }

    if (den_ngay) {
      whereClause += ` AND pn.ngay_nhap <= $${paramIndex}::date`;
      queryParams.push(den_ngay);
      paramIndex++;
    }

    // Filter theo loại phiếu
    if (loai_phieu) {
      whereClause += ` AND pn.loai_phieu = $${paramIndex}`;
      queryParams.push(loai_phieu);
      paramIndex++;
    }

    // Phân quyền theo cấp
    if (user.role === "user") {
      // Cấp 3: Chỉ xem được phòng ban của mình
      whereClause += ` AND pn.phong_ban_id = $${paramIndex}`;
      queryParams.push(user.phong_ban_id);
      paramIndex++;
    } else if (user.role === "manager") {
      // Cấp 2: Xem được phòng ban của mình và các phòng ban cấp 3 dưới quyền
      if (phong_ban_id && phong_ban_id !== "all") {
        whereClause += ` AND pn.phong_ban_id = $${paramIndex}`;
        queryParams.push(phong_ban_id);
        paramIndex++;
      } else {
        // Nếu chọn "all", chỉ xem được phòng ban của mình và các phòng ban cấp 3 dưới quyền
        whereClause += ` AND (pn.phong_ban_id = $${paramIndex} OR pn.phong_ban_id IN (
          SELECT id FROM phong_ban WHERE phong_ban_cha_id = $${paramIndex} AND cap_bac = 3
        ))`;
        queryParams.push(user.phong_ban_id);
        paramIndex++;
      }
    } else if (user.role === "admin") {
      // Cấp 1: Xem được tất cả
      if (phong_ban_id && phong_ban_id !== "all") {
        whereClause += ` AND pn.phong_ban_id = $${paramIndex}`;
        queryParams.push(phong_ban_id);
        paramIndex++;
      }
    }

    const nhapQuery = `
      SELECT 
        pn.id,
        pn.so_phieu,
        pn.so_quyet_dinh,
        pn.ngay_nhap,
        pn.tong_tien,
        pn.ly_do_nhap,
        pn.trang_thai,
        pn.loai_phieu,
        pb.ten_phong_ban,
        ncc.ten_ncc as nha_cung_cap,
        u.ho_ten as nguoi_tao_ten
      FROM phieu_nhap pn
      LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
      LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
      LEFT JOIN users u ON pn.nguoi_tao = u.id
      ${whereClause}
      ORDER BY pn.ngay_nhap DESC, pn.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM phieu_nhap pn
      LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
      ${whereClause}
    `;

    const [nhapResult, countResult] = await Promise.all([
      pool.query(nhapQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)),
    ]);

    const total = parseInt(countResult.rows[0].total);

    sendResponse(res, 200, true, "Lấy dữ liệu nhập theo loại thành công", {
      items: nhapResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get nhap data by type error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

const exportLuanChuyenExcel = async (req, res, query, user) => {
  try {
    // Lấy dữ liệu luân chuyển kho trước
    let reportData = null;

    const mockRes = {
      status: () => mockRes,
      json: (result) => {
        if (result.success) {
          reportData = result.data;
        }
      },
    };

    await getLuanChuyenKhoData(req, mockRes, query, user);

    if (!reportData) {
      return sendResponse(res, 400, false, "Không thể lấy dữ liệu báo cáo");
    }

    const filename = `bao-cao-luan-chuyen-kho-${query.tu_ngay}-${query.den_ngay}.xlsx`;

    // Tạo workbook Excel
    const workbook = new ExcelJS.Workbook();

    // Style definitions
    const headerStyle = {
      font: { bold: true, color: { argb: "FFFFFF" }, size: 11 },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "366092" } },
      alignment: { horizontal: "center", vertical: "middle" },
      border: {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      },
    };

    const managerStyle = {
      font: { bold: true, color: { argb: "1F2937" }, size: 10 },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "DBEAFE" } },
      alignment: { horizontal: "left", vertical: "middle" },
      border: {
        top: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thick", color: { argb: "3B82F6" } },
      },
    };

    const warehouseStyle = {
      font: { bold: false, color: { argb: "374151" }, size: 9 },
      alignment: { horizontal: "left", vertical: "middle" },
      border: {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      },
    };

    const numberStyle = {
      font: { size: 9 },
      alignment: { horizontal: "right", vertical: "middle" },
      border: {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      },
      numFmt: "#,##0",
    };

    const emptyStyle = {
      font: { color: { argb: "9CA3AF" }, size: 8 },
      alignment: { horizontal: "center", vertical: "middle" },
      border: {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      },
    };

    // 1. Sheet Tổng hợp
    const mainWorksheet = workbook.addWorksheet("Tổng hợp luân chuyển kho");

    const mainHeaders = [
      "Nội dung",
      "Tồn đầu kỳ",
      "Trên cấp",
      "Tự mua",
      "Khác",
      "Cộng nhập",
      "Xuất sử dụng",
      "Cấp cho ĐV",
      "Thanh lý",
      "Xuất khác",
      "Cộng xuất",
      "Tồn cuối kỳ",
    ];

    // Title
    mainWorksheet.mergeCells("A1:L1");
    const titleCell = mainWorksheet.getCell("A1");
    titleCell.value = `BÁO CÁO LUÂN CHUYỂN KHO (${query.tu_ngay} - ${query.den_ngay})`;
    titleCell.style = {
      font: { bold: true, size: 14, color: { argb: "1F2937" } },
      alignment: { horizontal: "center", vertical: "middle" },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "F3F4F6" } },
    };

    mainWorksheet.addRow(mainHeaders);
    mainWorksheet.getRow(2).eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Add data with hierarchy
    reportData.tongHop.forEach((item) => {
      const row = mainWorksheet.addRow([
        item.is_warehouse ? `  └─ ${item.noi_dung}` : item.noi_dung,
        item.is_warehouse ? item.ton_dau_ky || 0 : "",
        item.is_warehouse ? item.nhap_tren_cap || 0 : "",
        item.is_warehouse ? item.nhap_tu_mua || 0 : "",
        item.is_warehouse ? item.nhap_khac || 0 : "",
        item.is_warehouse ? item.cong_nhap || 0 : "",
        item.is_warehouse ? item.xuat_su_dung || 0 : "",
        item.is_warehouse ? item.xuat_cap_cho || 0 : "",
        item.is_warehouse ? item.xuat_thanh_ly || 0 : "",
        item.is_warehouse ? item.xuat_khac || 0 : "",
        item.is_warehouse ? item.cong_xuat || 0 : "",
        item.is_warehouse ? item.ton_cuoi_ky || 0 : "",
      ]);

      if (item.is_manager) {
        row.eachCell((cell, colNumber) => {
          if (colNumber === 1) {
            cell.style = managerStyle;
          } else {
            cell.style = emptyStyle;
            cell.value = "—";
          }
        });
      } else if (item.is_warehouse) {
        row.eachCell((cell, colNumber) => {
          if (colNumber === 1) {
            cell.style = warehouseStyle;
          } else {
            cell.style = numberStyle;
          }
        });
      }
    });

    // Auto-fit columns
    mainWorksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 12 ? 12 : Math.min(maxLength + 2, 50);
    });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export Luan Chuyen Excel error:", error);
    sendResponse(res, 500, false, "Lỗi xuất Excel", { error: error.message });
  }
};

const getLuanChuyenKhoData = async (req, res, query, user) => {
  try {
    const { tu_ngay, den_ngay, phong_ban_id, view_type = "own" } = query;

    if (!tu_ngay || !den_ngay) {
      return sendResponse(res, 400, false, "Vui lòng chọn khoảng thời gian");
    }

    console.log(`📊 Getting Luan Chuyen data from ${tu_ngay} to ${den_ngay}`, {
      user_role: user.role,
      user_phong_ban_id: user.phong_ban_id,
      view_type,
    });

    // Lấy thông tin cấp bậc của user (chỉ cần thiết cho non-admin)
    let userCapBac = null;
    if (user.role !== "admin") {
      const userCapBacQuery = `
        SELECT pb.cap_bac, pb.ten_phong_ban, pb.ma_phong_ban
        FROM phong_ban pb WHERE pb.id = $1
      `;
      const userCapBacResult = await pool.query(userCapBacQuery, [
        user.phong_ban_id,
      ]);
      userCapBac = userCapBacResult.rows[0]?.cap_bac;

      console.log("👤 User info:", {
        role: user.role,
        phong_ban_id: user.phong_ban_id,
        cap_bac: userCapBac,
      });
    } else {
      console.log("👑 Admin user - skip cap_bac check");
    }

    // Xác định phòng ban cần hiển thị dựa trên role và cấp bậc
    let whereClause = "";
    let queryParams = [tu_ngay, den_ngay];
    let paramIndex = 3;

    if (user.role === "admin") {
      // Admin có thể xem tất cả
      if (phong_ban_id && phong_ban_id !== "all") {
        whereClause = `AND pb.id = $${paramIndex}`;
        queryParams.push(phong_ban_id);
        paramIndex++;
      }
    } else {
      // Phân quyền theo cấp bậc
      if (userCapBac === 1) {
        // Cấp 1: Có thể chọn xem của mình hoặc của cấp dưới
        if (view_type === "own") {
          whereClause = `AND pb.id = $${paramIndex}`;
          queryParams.push(user.phong_ban_id);
          paramIndex++;
        } else if (view_type === "subordinates") {
          // Xem cấp 2 và cấp 3 (chỉ cấp 3 có kho)
          whereClause = `AND (pb.phong_ban_cha_id = $${paramIndex} OR pb.id IN (
            SELECT pb2.id FROM phong_ban pb2 
            WHERE pb2.phong_ban_cha_id IN (
              SELECT pb3.id FROM phong_ban pb3 WHERE pb3.phong_ban_cha_id = $${paramIndex}
            )
          )) AND pb.cap_bac = 3`;
          queryParams.push(user.phong_ban_id);
          paramIndex++;
        }
      } else if (userCapBac === 2) {
        // Cấp 2: Chỉ xem các cấp 3 dưới quyền
        whereClause = `AND pb.phong_ban_cha_id = $${paramIndex} AND pb.cap_bac = 3`;
        queryParams.push(user.phong_ban_id);
        paramIndex++;
      } else if (userCapBac === 3) {
        // Cấp 3: Chỉ xem của mình
        whereClause = `AND pb.id = $${paramIndex}`;
        queryParams.push(user.phong_ban_id);
        paramIndex++;
      }
    }

    // Query chính với hierarchy display
    const tongHopQuery = `
      WITH phieu_nhap_completed AS (
        SELECT 
          pn.phong_ban_id,
          pn.ngay_nhap,
          pn.tong_tien,
          pn.loai_phieu,
          CASE 
            WHEN pn.ngay_nhap < $1 THEN 'truoc_ky'
            WHEN pn.ngay_nhap BETWEEN $1 AND $2 THEN 'trong_ky'
            ELSE 'sau_ky'
          END as thoi_gian
        FROM phieu_nhap pn
        JOIN phong_ban pb ON pn.phong_ban_id = pb.id
        WHERE pn.trang_thai = 'completed'
        ${whereClause}
      ),
      phieu_xuat_theo_nguon_goc AS (
        SELECT 
          px.phong_ban_id,
          px.ngay_xuat,
          px.ly_do_xuat,
          px.loai_xuat,
          SUM(CASE WHEN ctx.loai_phieu_nhap = 'tren_cap' 
               THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) as gia_tri_xuat_tren_cap,
          SUM(CASE WHEN ctx.loai_phieu_nhap = 'tu_mua' 
               THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) as gia_tri_xuat_tu_mua,
          SUM(CASE WHEN ctx.loai_phieu_nhap NOT IN ('tren_cap', 'tu_mua') OR ctx.loai_phieu_nhap IS NULL
               THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) as gia_tri_xuat_khac,
          px.tong_tien as tong_gia_tri_xuat,
          CASE 
            WHEN px.ngay_xuat < $1 THEN 'truoc_ky'
            WHEN px.ngay_xuat BETWEEN $1 AND $2 THEN 'trong_ky'
            ELSE 'sau_ky'
          END as thoi_gian
        FROM phieu_xuat px
        JOIN chi_tiet_xuat ctx ON px.id = ctx.phieu_xuat_id
        JOIN phong_ban pb ON px.phong_ban_id = pb.id
        WHERE px.trang_thai = 'completed'
        ${whereClause}
        GROUP BY px.id, px.phong_ban_id, px.ngay_xuat, px.ly_do_xuat, px.loai_xuat, px.tong_tien
      ),
      ton_dau_ky AS (
        SELECT 
          COALESCE(pn.phong_ban_id, px.phong_ban_id) as phong_ban_id,
          (COALESCE(SUM(CASE WHEN pn.thoi_gian = 'truoc_ky' THEN pn.tong_tien ELSE 0 END), 0) - 
           COALESCE(SUM(CASE WHEN px.thoi_gian = 'truoc_ky' THEN px.tong_gia_tri_xuat ELSE 0 END), 0)) as ton_dau
        FROM phieu_nhap_completed pn
        FULL OUTER JOIN phieu_xuat_theo_nguon_goc px ON pn.phong_ban_id = px.phong_ban_id
        GROUP BY COALESCE(pn.phong_ban_id, px.phong_ban_id)
      ),
      nhap_trong_ky AS (
        SELECT 
          phong_ban_id,
          SUM(CASE WHEN loai_phieu = 'tren_cap' THEN tong_tien ELSE 0 END) as nhap_tren_cap,
          SUM(CASE WHEN loai_phieu = 'tu_mua' THEN tong_tien ELSE 0 END) as nhap_tu_mua,
          SUM(CASE WHEN loai_phieu NOT IN ('tren_cap', 'tu_mua') THEN tong_tien ELSE 0 END) as nhap_khac,
          SUM(tong_tien) as tong_nhap
        FROM phieu_nhap_completed
        WHERE thoi_gian = 'trong_ky'
        GROUP BY phong_ban_id
      ),
      xuat_trong_ky AS (
        SELECT 
          phong_ban_id,
          SUM(CASE WHEN loai_xuat = 'don_vi_su_dung' THEN gia_tri_xuat_tren_cap ELSE 0 END) as xuat_su_dung_tren_cap,
          SUM(CASE WHEN loai_xuat = 'don_vi_nhan' THEN gia_tri_xuat_tren_cap ELSE 0 END) as xuat_cap_cho_tren_cap,
          SUM(CASE WHEN ly_do_xuat LIKE '%thanh lý%' THEN gia_tri_xuat_tren_cap ELSE 0 END) as xuat_thanh_ly_tren_cap,
          SUM(gia_tri_xuat_tren_cap) as tong_xuat_tren_cap,
          
          SUM(CASE WHEN loai_xuat = 'don_vi_su_dung' THEN gia_tri_xuat_tu_mua ELSE 0 END) as xuat_su_dung_tu_mua,
          SUM(CASE WHEN loai_xuat = 'don_vi_nhan' THEN gia_tri_xuat_tu_mua ELSE 0 END) as xuat_cap_cho_tu_mua,
          SUM(CASE WHEN ly_do_xuat LIKE '%thanh lý%' THEN gia_tri_xuat_tu_mua ELSE 0 END) as xuat_thanh_ly_tu_mua,
          SUM(gia_tri_xuat_tu_mua) as tong_xuat_tu_mua,
          
          SUM(CASE WHEN loai_xuat = 'don_vi_su_dung' THEN gia_tri_xuat_khac ELSE 0 END) as xuat_su_dung_khac,
          SUM(CASE WHEN loai_xuat = 'don_vi_nhan' THEN gia_tri_xuat_khac ELSE 0 END) as xuat_cap_cho_khac,
          SUM(CASE WHEN ly_do_xuat LIKE '%thanh lý%' THEN gia_tri_xuat_khac ELSE 0 END) as xuat_thanh_ly_khac,
          SUM(gia_tri_xuat_khac) as tong_xuat_khac,
          
          SUM(tong_gia_tri_xuat) as tong_xuat_kiem_tra
        FROM phieu_xuat_theo_nguon_goc
        WHERE thoi_gian = 'trong_ky'
        GROUP BY phong_ban_id
      )
      SELECT 
        pb.id,
        pb.ten_phong_ban as noi_dung,
        pb.ma_phong_ban,
        pb.cap_bac,
        pb.phong_ban_cha_id,
        pb_cha.ten_phong_ban as ten_phong_ban_cha,
        pb_cha.cap_bac as cap_bac_cha,
        COALESCE(tdq.ton_dau, 0) as ton_dau_ky,
        
        -- NHẬP TRONG KỲ
        COALESCE(ntq.nhap_tren_cap, 0) as nhap_tren_cap,
        COALESCE(ntq.nhap_tu_mua, 0) as nhap_tu_mua,
        COALESCE(ntq.nhap_khac, 0) as nhap_khac,
        COALESCE(ntq.tong_nhap, 0) as cong_nhap,
        
        -- XUẤT TRONG KỲ (TỔNG HỢP)
        COALESCE(xtq.xuat_su_dung_tren_cap + xtq.xuat_su_dung_tu_mua + xtq.xuat_su_dung_khac, 0) as xuat_su_dung,
        COALESCE(xtq.xuat_cap_cho_tren_cap + xtq.xuat_cap_cho_tu_mua + xtq.xuat_cap_cho_khac, 0) as xuat_cap_cho,
        COALESCE(xtq.xuat_thanh_ly_tren_cap + xtq.xuat_thanh_ly_tu_mua + xtq.xuat_thanh_ly_khac, 0) as xuat_thanh_ly,
        0 as xuat_khac,
        COALESCE(xtq.tong_xuat_kiem_tra, 0) as cong_xuat,
        
        -- TỒN CUỐI KỲ
        (COALESCE(tdq.ton_dau, 0) + COALESCE(ntq.tong_nhap, 0) - COALESCE(xtq.tong_xuat_kiem_tra, 0)) as ton_cuoi_ky,
        
        -- CHI TIẾT THEO TỪNG LOẠI
        COALESCE(xtq.tong_xuat_tren_cap, 0) as xuat_tren_cap_chi_tiet,
        COALESCE(xtq.tong_xuat_tu_mua, 0) as xuat_tu_mua_chi_tiet,
        COALESCE(xtq.tong_xuat_khac, 0) as xuat_khac_chi_tiet
        
      FROM phong_ban pb
      LEFT JOIN phong_ban pb_cha ON pb.phong_ban_cha_id = pb_cha.id
      LEFT JOIN ton_dau_ky tdq ON pb.id = tdq.phong_ban_id
      LEFT JOIN nhap_trong_ky ntq ON pb.id = ntq.phong_ban_id
      LEFT JOIN xuat_trong_ky xtq ON pb.id = xtq.phong_ban_id
      WHERE pb.is_active = TRUE ${whereClause.replace("AND pb.", "AND pb.")}
      ORDER BY 
        pb.cap_bac,
        CASE WHEN pb.cap_bac = 2 THEN pb.thu_tu_hien_thi END,
        CASE WHEN pb.cap_bac = 3 THEN pb_cha.thu_tu_hien_thi END,
        pb.thu_tu_hien_thi
    `;

    console.log("📝 Generated Query WHERE clause:", whereClause);
    console.log("📝 Query params:", queryParams);

    // Query chi tiết theo loại - cũng áp dụng phân quyền tương tự
    const chiTietTheoLoaiQuery = `
      WITH phong_ban_data AS (
        SELECT id, ten_phong_ban, ma_phong_ban, cap_bac, phong_ban_cha_id
        FROM phong_ban pb
        WHERE 1=1 ${whereClause}
      ),
      ton_dau_ky AS (
        SELECT 
          pb.id as phong_ban_id,
          pb.ten_phong_ban,
          pb.cap_bac,
          COALESCE(
            (SELECT SUM(pn.tong_tien) FROM phieu_nhap pn 
             WHERE pn.phong_ban_id = pb.id AND pn.ngay_nhap < $1 AND pn.trang_thai = 'completed'), 0
          ) - 
          COALESCE(
            (SELECT SUM(px.tong_tien) FROM phieu_xuat px 
             WHERE px.phong_ban_id = pb.id AND px.ngay_xuat < $1 AND px.trang_thai = 'completed'), 0
          ) as ton_dau
        FROM phong_ban_data pb
      ),
      xuat_trong_ky AS (
        SELECT 
          px.phong_ban_id,
          SUM(CASE WHEN ctx.loai_phieu_nhap = 'tren_cap' THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) as xuat_tren_cap,
          SUM(CASE WHEN ctx.loai_phieu_nhap = 'tu_mua' THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) as xuat_tu_mua,
          SUM(CASE WHEN ctx.loai_phieu_nhap NOT IN ('tren_cap', 'tu_mua') OR ctx.loai_phieu_nhap IS NULL 
               THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) as xuat_khac
        FROM phieu_xuat px
        JOIN chi_tiet_xuat ctx ON px.id = ctx.phieu_xuat_id
        JOIN phong_ban_data pb ON px.phong_ban_id = pb.id
        WHERE px.trang_thai = 'completed' 
          AND px.ngay_xuat BETWEEN $1 AND $2
        GROUP BY px.phong_ban_id
      ),
      tren_cap_data AS (
        SELECT 
          pb.ten_phong_ban as noi_dung,
          pb.cap_bac,
          'tren_cap' as loai,
          COALESCE(tdq.ton_dau, 0) as ton_dau_ky,
          COALESCE(SUM(pn.tong_tien), 0) as gia_tri_nhap,
          COALESCE(xtk.xuat_tren_cap, 0) as xuat_trong_ky,
          (COALESCE(tdq.ton_dau, 0) + COALESCE(SUM(pn.tong_tien), 0) - COALESCE(xtk.xuat_tren_cap, 0)) as ton_cuoi_ky
        FROM phong_ban_data pb
        LEFT JOIN ton_dau_ky tdq ON pb.id = tdq.phong_ban_id
        LEFT JOIN xuat_trong_ky xtk ON pb.id = xtk.phong_ban_id
        LEFT JOIN phieu_nhap pn ON pb.id = pn.phong_ban_id 
          AND pn.trang_thai = 'completed'
          AND pn.ngay_nhap BETWEEN $1 AND $2
          AND pn.loai_phieu = 'tren_cap'
        GROUP BY pb.ten_phong_ban, pb.cap_bac, tdq.ton_dau, xtk.xuat_tren_cap
      ),
      tu_mua_data AS (
        SELECT 
          pb.ten_phong_ban as noi_dung,
          pb.cap_bac,
          'tu_mua' as loai,
          COALESCE(tdq.ton_dau, 0) as ton_dau_ky,
          COALESCE(SUM(pn.tong_tien), 0) as gia_tri_nhap,
          COALESCE(xtk.xuat_tu_mua, 0) as xuat_trong_ky,
          (COALESCE(tdq.ton_dau, 0) + COALESCE(SUM(pn.tong_tien), 0) - COALESCE(xtk.xuat_tu_mua, 0)) as ton_cuoi_ky
        FROM phong_ban_data pb
        LEFT JOIN ton_dau_ky tdq ON pb.id = tdq.phong_ban_id
        LEFT JOIN xuat_trong_ky xtk ON pb.id = xtk.phong_ban_id
        LEFT JOIN phieu_nhap pn ON pb.id = pn.phong_ban_id 
          AND pn.trang_thai = 'completed'
          AND pn.ngay_nhap BETWEEN $1 AND $2
          AND pn.loai_phieu = 'tu_mua'
        GROUP BY pb.ten_phong_ban, pb.cap_bac, tdq.ton_dau, xtk.xuat_tu_mua
      ),
      khac_data AS (
        SELECT 
          pb.ten_phong_ban as noi_dung,
          pb.cap_bac,
          'khac' as loai,
          COALESCE(tdq.ton_dau, 0) as ton_dau_ky,
          COALESCE(SUM(pn.tong_tien), 0) as gia_tri_nhap,
          COALESCE(xtk.xuat_khac, 0) as xuat_trong_ky,
          (COALESCE(tdq.ton_dau, 0) + COALESCE(SUM(pn.tong_tien), 0) - COALESCE(xtk.xuat_khac, 0)) as ton_cuoi_ky
        FROM phong_ban_data pb
        LEFT JOIN ton_dau_ky tdq ON pb.id = tdq.phong_ban_id
        LEFT JOIN xuat_trong_ky xtk ON pb.id = xtk.phong_ban_id
        LEFT JOIN phieu_nhap pn ON pb.id = pn.phong_ban_id 
          AND pn.trang_thai = 'completed'
          AND pn.ngay_nhap BETWEEN $1 AND $2
          AND pn.loai_phieu NOT IN ('tren_cap', 'tu_mua')
        GROUP BY pb.ten_phong_ban, pb.cap_bac, tdq.ton_dau, xtk.xuat_khac
      )
      SELECT * FROM tren_cap_data
      UNION ALL
      SELECT * FROM tu_mua_data
      UNION ALL
      SELECT * FROM khac_data
      ORDER BY cap_bac, loai, noi_dung
    `;

    // Thực hiện các queries
    console.log("🔍 Executing queries with params:", {
      queryParams,
      whereClause,
      user: { role: user.role, phong_ban_id: user.phong_ban_id },
      userCapBac,
      view_type,
      phong_ban_id,
    });

    const [tongHopResult, chiTietResult] = await Promise.all([
      pool.query(tongHopQuery, queryParams),
      pool.query(chiTietTheoLoaiQuery, queryParams),
    ]);

    const tongHopData = tongHopResult.rows || [];
    const chiTietData = chiTietResult.rows || [];

    // Xử lý hierarchy cho display
    const processedTongHop = tongHopData.map((row) => ({
      ...row,
      noi_dung: row.noi_dung,
      is_manager: row.cap_bac === 2,
      is_warehouse: row.cap_bac === 3 || row.cap_bac === 1, // SỬA: Cấp 1 và 3 đều có thể có kho
      parent_name: row.ten_phong_ban_cha,
      indent_level: row.cap_bac === 3 ? 1 : 0,
      ton_dau_ky: parseFloat(row.ton_dau_ky) || 0,
      nhap_tren_cap: parseFloat(row.nhap_tren_cap) || 0,
      nhap_tu_mua: parseFloat(row.nhap_tu_mua) || 0,
      nhap_khac: parseFloat(row.nhap_khac) || 0,
      cong_nhap: parseFloat(row.cong_nhap) || 0,
      xuat_su_dung: parseFloat(row.xuat_su_dung) || 0,
      xuat_cap_cho: parseFloat(row.xuat_cap_cho) || 0,
      xuat_thanh_ly: parseFloat(row.xuat_thanh_ly) || 0,
      xuat_khac: parseFloat(row.xuat_khac) || 0,
      cong_xuat: parseFloat(row.cong_xuat) || 0,
      ton_cuoi_ky: parseFloat(row.ton_cuoi_ky) || 0,
    }));

    console.log(
      "🔍 Processed TongHop sample:",
      processedTongHop.slice(0, 3).map((item) => ({
        noi_dung: item.noi_dung,
        cap_bac: item.cap_bac,
        is_warehouse: item.is_warehouse,
        cong_nhap: item.cong_nhap,
        cong_xuat: item.cong_xuat,
      }))
    );

    // Xử lý chi tiết theo loại với hierarchy
    const trenCapData = chiTietData
      .filter((item) => item.loai === "tren_cap")
      .map((item) => ({
        noi_dung: item.noi_dung,
        cap_bac: item.cap_bac,
        is_manager: item.cap_bac === 2,
        is_warehouse: item.cap_bac === 3 || item.cap_bac === 1, // SỬA: Cấp 1 và 3 có thể có kho
        ton_dau_ky: parseFloat(item.ton_dau_ky) || 0,
        nhap_tren_cap: parseFloat(item.gia_tri_nhap) || 0,
        xuat_trong_ky: parseFloat(item.xuat_trong_ky) || 0,
        ton_cuoi_ky: parseFloat(item.ton_cuoi_ky) || 0,
      }));

    const tuMuaData = chiTietData
      .filter((item) => item.loai === "tu_mua")
      .map((item) => ({
        noi_dung: item.noi_dung,
        cap_bac: item.cap_bac,
        is_manager: item.cap_bac === 2,
        is_warehouse: item.cap_bac === 3 || item.cap_bac === 1, // SỬA: Cấp 1 và 3 có thể có kho
        ton_dau_ky: parseFloat(item.ton_dau_ky) || 0,
        nhap_tu_mua: parseFloat(item.gia_tri_nhap) || 0,
        xuat_trong_ky: parseFloat(item.xuat_trong_ky) || 0,
        ton_cuoi_ky: parseFloat(item.ton_cuoi_ky) || 0,
      }));

    const khacData = chiTietData
      .filter((item) => item.loai === "khac")
      .map((item) => ({
        noi_dung: item.noi_dung,
        cap_bac: item.cap_bac,
        is_manager: item.cap_bac === 2,
        is_warehouse: item.cap_bac === 3 || item.cap_bac === 1, // SỬA: Cấp 1 và 3 có thể có kho
        ton_dau_ky: parseFloat(item.ton_dau_ky) || 0,
        nhap_khac: parseFloat(item.gia_tri_nhap) || 0,
        xuat_trong_ky: parseFloat(item.xuat_trong_ky) || 0,
        ton_cuoi_ky: parseFloat(item.ton_cuoi_ky) || 0,
      }));

    // Format response data với đầy đủ thông tin hierarchy
    const responseData = {
      tongHop: processedTongHop,
      trenCap: trenCapData,
      tuMua: tuMuaData,
      khac: khacData,
      hierarchy_info: {
        user_cap_bac: userCapBac,
        view_type,
        can_switch_view: userCapBac === 1 && user.role !== "admin",
      },
      summary: {
        tu_ngay,
        den_ngay,
        tong_phong_ban: processedTongHop.length,
        tong_gia_tri_nhap: processedTongHop.reduce(
          (sum, item) => sum + (parseFloat(item.cong_nhap) || 0),
          0
        ),
        tong_gia_tri_xuat: processedTongHop.reduce(
          (sum, item) => sum + (parseFloat(item.cong_xuat) || 0),
          0
        ),
        tong_gia_tri_ton: processedTongHop.reduce(
          (sum, item) => sum + (parseFloat(item.ton_cuoi_ky) || 0),
          0
        ),
      },
    };

    console.log(`📊 Luan Chuyen report result:`, {
      tongHop: responseData.tongHop.length,
      trenCap: responseData.trenCap.length,
      tuMua: responseData.tuMua.length,
      khac: responseData.khac.length,
      hierarchy: responseData.hierarchy_info,
      userInfo: {
        user_id: user.id,
        phong_ban_id: user.phong_ban_id,
        role: user.role,
      },
    });

    sendResponse(
      res,
      200,
      true,
      "Lấy báo cáo luân chuyển kho thành công",
      responseData
    );
  } catch (error) {
    console.error("❌ Luan Chuyen report error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

// const getLuanChuyenReport = async (req, res, query, user) => {
//   try {
//     console.log("🔍 LuÃ¢n chuyá»ƒn report request:", {
//       query,
//       user: {
//         id: user.id,
//         role: user.role,
//         phong_ban_id: user.phong_ban_id,
//         cap_bac: user.phong_ban?.cap_bac,
//       },
//     });

//     const { tu_ngay, den_ngay, phong_ban_id } = query;

//     if (!tu_ngay || !den_ngay) {
//       return sendResponse(res, 400, false, "Thiáº¿u thÃ´ng tin ngÃ y thÃ¡ng");
//     }

//     // ✅ XÃ¢y dá»±ng Ä'iá»u kiá»‡n WHERE theo quyá»n vÃ  selection
//     let phongBanCondition = "";
//     let phongBanParams = [tu_ngay, den_ngay];
//     let paramIndex = 3;

//     // Xác định điều kiện lọc dựa trên role và selection
//     if (user.role === "user" && user.phong_ban?.cap_bac === 3) {
//       phongBanCondition = "AND pb.id = $" + paramIndex++;
//       phongBanParams.push(user.phong_ban_id);

//       // Log để debug
//       console.log("🏢 Cấp 3 user filter:", {
//         user_id: user.id,
//         phong_ban_id: user.phong_ban_id,
//         ten_phong_ban: user.phong_ban?.ten_phong_ban,
//       });
//     } else if (user.role === "manager" && user.phong_ban?.cap_bac === 2) {
//       if (phong_ban_id && phong_ban_id !== "all") {
//         // Manager chọn phòng ban cụ thể
//         phongBanCondition = "AND pb.id = $" + paramIndex++;
//         phongBanParams.push(parseInt(phong_ban_id));
//       } else {
//         // Manager xem tất cả thuộc quyền
//         phongBanCondition =
//           "AND (pb.id = $" +
//           paramIndex +
//           " OR pb.phong_ban_cha_id = $" +
//           paramIndex +
//           ")";
//         paramIndex++;
//         phongBanParams.push(user.phong_ban_id);
//       }
//     } else if (user.role === "admin") {
//       if (phong_ban_id && phong_ban_id !== "all") {
//         // ✅ SỬA: Admin chọn filter cụ thể
//         const selectedId = parseInt(phong_ban_id);

//         // Kiểm tra cấp bậc của ID được chọn
//         const capBacCheck = await pool.query(
//           "SELECT cap_bac FROM phong_ban WHERE id = $1",
//           [selectedId]
//         );

//         if (capBacCheck.rows.length > 0) {
//           if (capBacCheck.rows[0].cap_bac === 2) {
//             // Chọn cấp 2 - hiện cấp 2 đó + các cấp 3 con
//             phongBanCondition =
//               "AND (pb.id = $" +
//               paramIndex +
//               " OR pb.phong_ban_cha_id = $" +
//               paramIndex +
//               ")";
//           } else if (capBacCheck.rows[0].cap_bac === 3) {
//             // Chọn cấp 3 - chỉ hiện cấp 3 đó + cấp 2 cha
//             phongBanCondition =
//               "AND (pb.id = $" +
//               paramIndex +
//               " OR pb.id IN (SELECT phong_ban_cha_id FROM phong_ban WHERE id = $" +
//               paramIndex +
//               "))";
//           }
//           paramIndex++;
//           phongBanParams.push(selectedId);
//         }
//       }
//       // Admin không chọn gì thì thấy tất cả
//     }

//     // ✅ Query chính với logic hierarchy và tính tổng đúng
//     const mainQuery = `
//       WITH phong_ban_data AS (
//         -- Lấy tất cả phòng ban theo điều kiện
//         SELECT DISTINCT
//           pb.id,
//           pb.ten_phong_ban,
//           pb.cap_bac,
//           pb.phong_ban_cha_id,
//           pb.thu_tu_hien_thi
//         FROM phong_ban pb
//         WHERE pb.is_active = TRUE
//           AND pb.cap_bac IN (1, 2, 3)
//           ${phongBanCondition}
//       ),
//       raw_data AS (
//         -- Lấy dữ liệu thô cho TẤT CẢ cấp 3 (chỉ cấp 3 mới có kho thực tế)
//         SELECT
//           pb.id as phong_ban_id,
//           pb.ten_phong_ban,
//           pb.cap_bac,
//           pb.phong_ban_cha_id,
//           -- Tồn đầu kỳ
//           COALESCE(
//             (SELECT SUM(pn.tong_tien) FROM phieu_nhap pn
//              WHERE pn.phong_ban_id = pb.id AND pn.ngay_nhap < $1 AND pn.trang_thai = 'completed'), 0
//           ) -
//           COALESCE(
//             (SELECT SUM(px.tong_tien) FROM phieu_xuat px
//              WHERE px.phong_ban_id = pb.id AND px.ngay_xuat < $1 AND px.trang_thai = 'completed'), 0
//           ) as ton_dau_ky,
//           -- Nhập trong kỳ
//           COALESCE((SELECT SUM(pn.tong_tien) FROM phieu_nhap pn
//                    WHERE pn.phong_ban_id = pb.id AND pn.ngay_nhap BETWEEN $1 AND $2
//                    AND pn.trang_thai = 'completed' AND pn.loai_phieu = 'tren_cap'), 0) as nhap_tren_cap,
//           COALESCE((SELECT SUM(pn.tong_tien) FROM phieu_nhap pn
//                    WHERE pn.phong_ban_id = pb.id AND pn.ngay_nhap BETWEEN $1 AND $2
//                    AND pn.trang_thai = 'completed' AND pn.loai_phieu = 'tu_mua'), 0) as nhap_tu_mua,
//           COALESCE((SELECT SUM(pn.tong_tien) FROM phieu_nhap pn
//                    WHERE pn.phong_ban_id = pb.id AND pn.ngay_nhap BETWEEN $1 AND $2
//                    AND pn.trang_thai = 'completed' AND pn.loai_phieu = 'dieu_chuyen'), 0) as nhap_khac,
//           -- Xuất trong kỳ
//           COALESCE((SELECT SUM(px.tong_tien) FROM phieu_xuat px
//                    WHERE px.phong_ban_id = pb.id AND px.ngay_xuat BETWEEN $1 AND $2
//                    AND px.trang_thai = 'completed' AND px.loai_xuat = 'don_vi_su_dung'), 0) as xuat_su_dung,
//           COALESCE((SELECT SUM(px.tong_tien) FROM phieu_xuat px
//                    WHERE px.phong_ban_id = pb.id AND px.ngay_xuat BETWEEN $1 AND $2
//                    AND px.trang_thai = 'completed' AND px.loai_xuat = 'don_vi_nhan'), 0) as xuat_cap_cho,
//           0 as xuat_thanh_ly,
//           0 as xuat_khac
//         FROM phong_ban pb
//         WHERE pb.is_active = TRUE AND pb.cap_bac = 3 -- CHỈ lấy dữ liệu thô từ cấp 3
//       ),
//       cap3_data AS (
//         -- Dữ liệu cấp 3 với tính toán hoàn chỉnh
//         SELECT
//           *,
//           (nhap_tren_cap + nhap_tu_mua + nhap_khac) as cong_nhap,
//           (xuat_su_dung + xuat_cap_cho + xuat_thanh_ly + xuat_khac) as cong_xuat,
//           (ton_dau_ky + nhap_tren_cap + nhap_tu_mua + nhap_khac - xuat_su_dung - xuat_cap_cho - xuat_thanh_ly - xuat_khac) as ton_cuoi_ky
//         FROM raw_data
//       ),
//       cap2_data AS (
//         -- Tính tổng cho cấp 2 từ các cấp 3 con
//         SELECT
//           pb2.id as phong_ban_id,
//           pb2.ten_phong_ban,
//           2 as cap_bac,
//           pb2.phong_ban_cha_id,
//         COALESCE(SUM(c3.ton_dau_ky), 0) as ton_dau_ky,
//     COALESCE(SUM(c3.nhap_tren_cap), 0) as nhap_tren_cap,
//     COALESCE(SUM(c3.nhap_tu_mua), 0) as nhap_tu_mua,
//     COALESCE(SUM(c3.nhap_khac), 0) as nhap_khac,
//     COALESCE(SUM(c3.cong_nhap), 0) as cong_nhap,
//     COALESCE(SUM(c3.xuat_su_dung), 0) as xuat_su_dung,
//     COALESCE(SUM(c3.xuat_cap_cho), 0) as xuat_cap_cho,
//     COALESCE(SUM(c3.xuat_thanh_ly), 0) as xuat_thanh_ly,
//     COALESCE(SUM(c3.xuat_khac), 0) as xuat_khac,
//     COALESCE(SUM(c3.cong_xuat), 0) as cong_xuat,
//     COALESCE(SUM(c3.ton_cuoi_ky), 0) as ton_cuoi_ky
//         FROM phong_ban pb2
//         LEFT JOIN cap3_data c3 ON c3.phong_ban_cha_id = pb2.id
//         WHERE pb2.cap_bac = 2 AND pb2.is_active = TRUE
//         GROUP BY pb2.id, pb2.ten_phong_ban, pb2.phong_ban_cha_id
//       ),
//       cap1_data AS (
//         -- Tính tổng cho cấp 1 từ các cấp 2 con
//         SELECT
//           pb1.id as phong_ban_id,
//           pb1.ten_phong_ban,
//           1 as cap_bac,
//           CAST(NULL AS INTEGER) as phong_ban_cha_id,
//           COALESCE(SUM(c2.ton_dau_ky), 0) as ton_dau_ky,
//     COALESCE(SUM(c2.nhap_tren_cap), 0) as nhap_tren_cap,
//     COALESCE(SUM(c2.nhap_tu_mua), 0) as nhap_tu_mua,
//     COALESCE(SUM(c2.nhap_khac), 0) as nhap_khac,
//     COALESCE(SUM(c2.cong_nhap), 0) as cong_nhap,
//     COALESCE(SUM(c2.xuat_su_dung), 0) as xuat_su_dung,
//     COALESCE(SUM(c2.xuat_cap_cho), 0) as xuat_cap_cho,
//     COALESCE(SUM(c2.xuat_thanh_ly), 0) as xuat_thanh_ly,
//     COALESCE(SUM(c2.xuat_khac), 0) as xuat_khac,
//     COALESCE(SUM(c2.cong_xuat), 0) as cong_xuat,
//     COALESCE(SUM(c2.ton_cuoi_ky), 0) as ton_cuoi_ky
//         FROM phong_ban pb1
//         LEFT JOIN cap2_data c2 ON c2.phong_ban_cha_id = pb1.id
//         WHERE pb1.cap_bac = 1 AND pb1.is_active = TRUE
//         GROUP BY pb1.id, pb1.ten_phong_ban
//       )
//       -- Kết hợp tất cả dữ liệu và lọc theo phong_ban_data
//       SELECT
//         fd.phong_ban_id as id,
//         fd.ten_phong_ban as noi_dung,
//         fd.cap_bac,
//         fd.phong_ban_cha_id,
//         CASE WHEN fd.cap_bac = 2 THEN TRUE ELSE FALSE END as is_manager,
//         CASE WHEN fd.cap_bac IN (1, 3) THEN TRUE ELSE FALSE END as is_warehouse,
//         COALESCE(fd.ton_dau_ky, 0) as ton_dau_ky,
//         COALESCE(fd.nhap_tren_cap, 0) as nhap_tren_cap,
//         COALESCE(fd.nhap_tu_mua, 0) as nhap_tu_mua,
//         COALESCE(fd.nhap_khac, 0) as nhap_khac,
//         COALESCE(fd.cong_nhap, 0) as cong_nhap,
//         COALESCE(fd.xuat_su_dung, 0) as xuat_su_dung,
//         COALESCE(fd.xuat_cap_cho, 0) as xuat_cap_cho,
//         COALESCE(fd.xuat_thanh_ly, 0) as xuat_thanh_ly,
//         COALESCE(fd.xuat_khac, 0) as xuat_khac,
//         COALESCE(fd.cong_xuat, 0) as cong_xuat,
//         COALESCE(fd.ton_cuoi_ky, 0) as ton_cuoi_ky
//       FROM (
//         -- Union tất cả dữ liệu từ 3 cấp
//         SELECT * FROM cap1_data
//         UNION ALL
//         SELECT * FROM cap2_data
//         UNION ALL
//         SELECT
//           phong_ban_id, ten_phong_ban, cap_bac, phong_ban_cha_id,
//           ton_dau_ky, nhap_tren_cap, nhap_tu_mua, nhap_khac, cong_nhap,
//           xuat_su_dung, xuat_cap_cho, xuat_thanh_ly, xuat_khac, cong_xuat, ton_cuoi_ky
//         FROM cap3_data
//       ) fd
//       -- Chỉ hiển thị các phòng ban trong phong_ban_data (theo điều kiện lọc)
//       WHERE EXISTS (SELECT 1 FROM phong_ban_data pbd WHERE pbd.id = fd.phong_ban_id)
//       ORDER BY fd.cap_bac, fd.ten_phong_ban
//     `;

//     console.log("🔍 Executing query with params:", phongBanParams);
//     const result = await pool.query(mainQuery, phongBanParams);

//     console.log("📊 Query result count:", result.rows.length);
//     console.log("📊 Sample results:", result.rows.slice(0, 3));

//     // ✅ Xử lý dữ liệu với hierarchy
//     const processedData = result.rows.map((row) => ({
//       id: row.id,
//       noi_dung: row.noi_dung,
//       cap_bac: parseInt(row.cap_bac),
//       phong_ban_cha_id: row.phong_ban_cha_id,
//       is_manager: row.cap_bac === 2,
//       is_warehouse: row.cap_bac === 1 || row.cap_bac === 3, // Cấp 1 và 3 có dữ liệu kho
//       ton_dau_ky: parseFloat(row.ton_dau_ky) || 0,
//       nhap_tren_cap: parseFloat(row.nhap_tren_cap) || 0,
//       nhap_tu_mua: parseFloat(row.nhap_tu_mua) || 0,
//       nhap_khac: parseFloat(row.nhap_khac) || 0,
//       cong_nhap: parseFloat(row.cong_nhap) || 0,
//       xuat_su_dung: parseFloat(row.xuat_su_dung) || 0,
//       xuat_cap_cho: parseFloat(row.xuat_cap_cho) || 0,
//       xuat_thanh_ly: parseFloat(row.xuat_thanh_ly) || 0,
//       xuat_khac: parseFloat(row.xuat_khac) || 0,
//       cong_xuat: parseFloat(row.cong_xuat) || 0,
//       ton_cuoi_ky: parseFloat(row.ton_cuoi_ky) || 0,
//     }));

//     // Tạo báo cáo chi tiết theo từng tab (lọc theo từng loại nhập)
//     const reportData = {
//       luanChuyen: {
//         tongHop: processedData, // Tất cả dữ liệu

//         // Tab "Trên cấp" - chỉ hiển thị nhập/xuất từ trên cấp
//         trenCap: processedData
//           .map((item) => ({
//             ...item,
//             // Chỉ hiển thị nhập từ trên cấp
//             nhap_tu_mua: 0,
//             nhap_khac: 0,
//             cong_nhap: item.nhap_tren_cap,

//             // Chỉ hiển thị xuất từ nguồn trên cấp
//             xuat_su_dung: item.xuat_tren_cap_su_dung || 0,
//             xuat_cap_cho: item.xuat_tren_cap_cap_cho || 0,
//             xuat_thanh_ly: item.xuat_tren_cap_thanh_ly || 0,
//             xuat_khac: 0,
//             cong_xuat:
//               (item.xuat_tren_cap_su_dung || 0) +
//               (item.xuat_tren_cap_cap_cho || 0) +
//               (item.xuat_tren_cap_thanh_ly || 0),
//           }))
//           .filter((item) => item.nhap_tren_cap > 0 || item.cap_bac <= 2),

//         // Tab "Tự mua sắm" - chỉ hiển thị nhập/xuất tự mua
//         tuMua: processedData
//           .map((item) => ({
//             ...item,
//             nhap_tren_cap: 0,
//             nhap_khac: 0,
//             cong_nhap: item.nhap_tu_mua,

//             xuat_su_dung: item.xuat_tu_mua_su_dung || 0,
//             xuat_cap_cho: item.xuat_tu_mua_cap_cho || 0,
//             xuat_thanh_ly: item.xuat_tu_mua_thanh_ly || 0,
//             xuat_khac: 0,
//             cong_xuat:
//               (item.xuat_tu_mua_su_dung || 0) +
//               (item.xuat_tu_mua_cap_cho || 0) +
//               (item.xuat_tu_mua_thanh_ly || 0),
//           }))
//           .filter((item) => item.nhap_tu_mua > 0 || item.cap_bac <= 2),

//         // Tab "Luân chuyển" - chỉ hiển thị nhập/xuất khác
//         khac: processedData
//           .map((item) => ({
//             ...item,
//             nhap_tren_cap: 0,
//             nhap_tu_mua: 0,
//             cong_nhap: item.nhap_khac,

//             xuat_su_dung: item.xuat_khac_su_dung || 0,
//             xuat_cap_cho: item.xuat_khac_cap_cho || 0,
//             xuat_thanh_ly: item.xuat_khac_thanh_ly || 0,
//             xuat_khac: 0,
//             cong_xuat:
//               (item.xuat_khac_su_dung || 0) +
//               (item.xuat_khac_cap_cho || 0) +
//               (item.xuat_khac_thanh_ly || 0),
//           }))
//           .filter((item) => item.nhap_khac > 0 || item.cap_bac <= 2),
//       },
//     };

//     console.log("📈 Final report data structure:", {
//       tongHop: reportData.luanChuyen.tongHop.length,
//       trenCap: reportData.luanChuyen.trenCap.length,
//       tuMua: reportData.luanChuyen.tuMua.length,
//       khac: reportData.luanChuyen.khac.length,
//     });

//     return sendResponse(
//       res,
//       200,
//       true,
//       "Lấy báo cáo luân chuyển thành công",
//       reportData
//     );
//   } catch (error) {
//     console.error("⌨ Lỗi khi lấy báo cáo luân chuyển:", error);
//     return sendResponse(res, 500, false, "Lỗi server", {
//       error: error.message,
//     });
//   }
// };

const getLuanChuyenReport = async (req, res, query, user) => {
  try {
    console.log("🏢 Cấp 3 user filter:", {
      user_id: user.id,
      phong_ban_id: user.phong_ban_id,
      ten_phong_ban: user.phong_ban?.ten_phong_ban,
      role: user.role,
      cap_bac: user.phong_ban?.cap_bac,
      full_user_object: user,
    });

    const { tu_ngay, den_ngay, phong_ban_id } = query;

    if (!tu_ngay || !den_ngay) {
      return sendResponse(res, 400, false, "Thiếu thông tin ngày tháng");
    }

    // ✅ ĐÚNG: Xây dựng điều kiện WHERE theo quyền và selection
    let phongBanCondition = "";
    let phongBanParams = [tu_ngay, den_ngay];
    let paramIndex = 3;

    if (user.role === "user" && user.phong_ban?.cap_bac === 3) {
      // ✅ FIX: User cấp 3 PHẢI có điều kiện filter
      phongBanCondition = "AND pb.id = $" + paramIndex++;
      phongBanParams.push(user.phong_ban_id);

      console.log("🔍 Cấp 3 filter applied:", {
        condition: phongBanCondition,
        params: phongBanParams,
        user_phong_ban_id: user.phong_ban_id,
      });
    } else if (user.role === "manager" && user.phong_ban?.cap_bac === 2) {
      if (phong_ban_id && phong_ban_id !== "all") {
        phongBanCondition = "AND pb.id = $" + paramIndex++;
        phongBanParams.push(parseInt(phong_ban_id));
      } else {
        phongBanCondition =
          "AND (pb.id = $" +
          paramIndex +
          " OR pb.phong_ban_cha_id = $" +
          paramIndex +
          ")";
        paramIndex++;
        phongBanParams.push(user.phong_ban_id);
      }
    } else if (user.role === "admin") {
      if (phong_ban_id && phong_ban_id !== "all") {
        const selectedId = parseInt(phong_ban_id);
        const capBacCheck = await pool.query(
          "SELECT cap_bac FROM phong_ban WHERE id = $1",
          [selectedId]
        );

        if (capBacCheck.rows.length > 0) {
          if (capBacCheck.rows[0].cap_bac === 2) {
            phongBanCondition =
              "AND (pb.id = $" +
              paramIndex +
              " OR pb.phong_ban_cha_id = $" +
              paramIndex +
              ")";
          } else if (capBacCheck.rows[0].cap_bac === 3) {
            phongBanCondition =
              "AND (pb.id = $" +
              paramIndex +
              " OR pb.id IN (SELECT phong_ban_cha_id FROM phong_ban WHERE id = $" +
              paramIndex +
              "))";
          }
          paramIndex++;
          phongBanParams.push(selectedId);
        }
      }
    }

    // ✅ ĐÚNG: Query với tracking xuất theo nguồn gốc
    const mainQuery = `
      WITH phong_ban_data AS (
        SELECT DISTINCT pb.id, pb.ten_phong_ban, pb.cap_bac, pb.phong_ban_cha_id
        FROM phong_ban pb
        WHERE pb.is_active = TRUE ${phongBanCondition}
      ),
      -- Tính tồn đầu kỳ TỔNG
      ton_dau_ky_tong AS (
        SELECT 
          pb.id as phong_ban_id,
          COALESCE(
            (SELECT SUM(pn.tong_tien) FROM phieu_nhap pn 
             WHERE pn.phong_ban_id = pb.id AND pn.ngay_nhap < $1 AND pn.trang_thai = 'completed'), 0
          ) - 
          COALESCE(
            (SELECT SUM(px.tong_tien) FROM phieu_xuat px 
             WHERE px.phong_ban_id = pb.id AND px.ngay_xuat < $1 AND px.trang_thai = 'completed'), 0
          ) as ton_dau_tong
        FROM phong_ban_data pb
      ),
      -- ✅ ĐÚNG: Tính tồn đầu kỳ THEO NGUỒN GỐC
      ton_dau_ky_theo_nguon AS (
        SELECT 
          pb.id as phong_ban_id,
          -- Tồn đầu kỳ từ trên cấp
          COALESCE(
            (SELECT SUM(pn.tong_tien) FROM phieu_nhap pn 
             WHERE pn.phong_ban_id = pb.id AND pn.ngay_nhap < $1 
             AND pn.trang_thai = 'completed' AND pn.loai_phieu = 'tren_cap'), 0
          ) - 
          COALESCE(
            (SELECT SUM(ctx.so_luong_thuc_xuat * ctx.don_gia) 
             FROM chi_tiet_xuat ctx 
             JOIN phieu_xuat px ON ctx.phieu_xuat_id = px.id
             WHERE px.phong_ban_id = pb.id AND px.ngay_xuat < $1 
             AND px.trang_thai = 'completed' AND ctx.loai_phieu_nhap = 'tren_cap'), 0
          ) as ton_dau_tren_cap,
          
          -- Tồn đầu kỳ từ tự mua
          COALESCE(
            (SELECT SUM(pn.tong_tien) FROM phieu_nhap pn 
             WHERE pn.phong_ban_id = pb.id AND pn.ngay_nhap < $1 
             AND pn.trang_thai = 'completed' AND pn.loai_phieu = 'tu_mua'), 0
          ) - 
          COALESCE(
            (SELECT SUM(ctx.so_luong_thuc_xuat * ctx.don_gia) 
             FROM chi_tiet_xuat ctx 
             JOIN phieu_xuat px ON ctx.phieu_xuat_id = px.id
             WHERE px.phong_ban_id = pb.id AND px.ngay_xuat < $1 
             AND px.trang_thai = 'completed' AND ctx.loai_phieu_nhap = 'tu_mua'), 0
          ) as ton_dau_tu_mua,
          
          -- Tồn đầu kỳ từ luân chuyển  
          COALESCE(
            (SELECT SUM(pn.tong_tien) FROM phieu_nhap pn 
             WHERE pn.phong_ban_id = pb.id AND pn.ngay_nhap < $1 
             AND pn.trang_thai = 'completed' AND pn.loai_phieu = 'dieu_chuyen'), 0
          ) - 
          COALESCE(
            (SELECT SUM(ctx.so_luong_thuc_xuat * ctx.don_gia) 
             FROM chi_tiet_xuat ctx 
             JOIN phieu_xuat px ON ctx.phieu_xuat_id = px.id
             WHERE px.phong_ban_id = pb.id AND px.ngay_xuat < $1 
             AND px.trang_thai = 'completed' 
             AND (ctx.loai_phieu_nhap = 'dieu_chuyen' OR ctx.loai_phieu_nhap IS NULL)), 0
          ) as ton_dau_khac
        FROM phong_ban_data pb
      ),
      -- Nhập trong kỳ theo loại
      nhap_trong_ky AS (
        SELECT 
          phong_ban_id,
          SUM(CASE WHEN loai_phieu = 'tren_cap' THEN tong_tien ELSE 0 END) as nhap_tren_cap,
          SUM(CASE WHEN loai_phieu = 'tu_mua' THEN tong_tien ELSE 0 END) as nhap_tu_mua,
          SUM(CASE WHEN loai_phieu = 'dieu_chuyen' THEN tong_tien ELSE 0 END) as nhap_khac,
          SUM(tong_tien) as tong_nhap
        FROM phieu_nhap pn
        JOIN phong_ban_data pb ON pn.phong_ban_id = pb.id
        WHERE pn.trang_thai = 'completed'
        AND pn.ngay_nhap BETWEEN $1 AND $2
        GROUP BY phong_ban_id
      ),
      -- ✅ ĐÚNG: Xuất trong kỳ THEO NGUỒN GỐC
      xuat_trong_ky AS (
        SELECT 
          px.phong_ban_id,
          -- Xuất từ nguồn trên cấp
          SUM(CASE WHEN ctx.loai_phieu_nhap = 'tren_cap' AND px.loai_xuat = 'don_vi_su_dung' 
               THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) as xuat_su_dung_tren_cap,
          SUM(CASE WHEN ctx.loai_phieu_nhap = 'tren_cap' AND px.loai_xuat = 'don_vi_nhan' 
               THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) as xuat_cap_cho_tren_cap,
          SUM(CASE WHEN ctx.loai_phieu_nhap = 'tren_cap' 
               THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) as tong_xuat_tren_cap,
          
          -- Xuất từ nguồn tự mua
          SUM(CASE WHEN ctx.loai_phieu_nhap = 'tu_mua' AND px.loai_xuat = 'don_vi_su_dung' 
               THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) as xuat_su_dung_tu_mua,
          SUM(CASE WHEN ctx.loai_phieu_nhap = 'tu_mua' AND px.loai_xuat = 'don_vi_nhan' 
               THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) as xuat_cap_cho_tu_mua,
          SUM(CASE WHEN ctx.loai_phieu_nhap = 'tu_mua' 
               THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) as tong_xuat_tu_mua,
          
          -- Xuất từ nguồn luân chuyển/khác
          SUM(CASE WHEN (ctx.loai_phieu_nhap = 'dieu_chuyen' OR ctx.loai_phieu_nhap IS NULL) AND px.loai_xuat = 'don_vi_su_dung' 
               THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) as xuat_su_dung_khac,
          SUM(CASE WHEN (ctx.loai_phieu_nhap = 'dieu_chuyen' OR ctx.loai_phieu_nhap IS NULL) AND px.loai_xuat = 'don_vi_nhan' 
               THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) as xuat_cap_cho_khac,
          SUM(CASE WHEN (ctx.loai_phieu_nhap = 'dieu_chuyen' OR ctx.loai_phieu_nhap IS NULL)
               THEN ctx.so_luong_thuc_xuat * ctx.don_gia ELSE 0 END) as tong_xuat_khac,
          
          -- Tổng xuất (để cross-check)
          SUM(ctx.so_luong_thuc_xuat * ctx.don_gia) as tong_xuat_kiem_tra
        FROM phieu_xuat px
        JOIN chi_tiet_xuat ctx ON px.id = ctx.phieu_xuat_id
        JOIN phong_ban_data pb ON px.phong_ban_id = pb.id
        WHERE px.trang_thai = 'completed'
        AND px.ngay_xuat BETWEEN $1 AND $2
        GROUP BY px.phong_ban_id
      ),
      -- Raw data với tính toán đúng
      raw_data AS (
        SELECT 
          pb.id as phong_ban_id,
          pb.ten_phong_ban as noi_dung,
          pb.cap_bac,
          pb.phong_ban_cha_id,
          
          -- Tồn đầu kỳ tổng
          COALESCE(tdt.ton_dau_tong, 0) as ton_dau_ky,
          
          -- Nhập trong kỳ
          COALESCE(ntk.nhap_tren_cap, 0) as nhap_tren_cap,
          COALESCE(ntk.nhap_tu_mua, 0) as nhap_tu_mua, 
          COALESCE(ntk.nhap_khac, 0) as nhap_khac,
          COALESCE(ntk.tong_nhap, 0) as cong_nhap,
          
          -- Xuất trong kỳ TỔNG (cho tab tổng hợp)
          COALESCE(xtk.xuat_su_dung_tren_cap + xtk.xuat_su_dung_tu_mua + xtk.xuat_su_dung_khac, 0) as xuat_su_dung,
          COALESCE(xtk.xuat_cap_cho_tren_cap + xtk.xuat_cap_cho_tu_mua + xtk.xuat_cap_cho_khac, 0) as xuat_cap_cho,
          0 as xuat_thanh_ly,
          0 as xuat_khac,
          COALESCE(xtk.tong_xuat_kiem_tra, 0) as cong_xuat,
          
          -- ✅ ĐÚNG: Xuất theo từng nguồn gốc (cho các tab riêng)
          COALESCE(xtk.xuat_su_dung_tren_cap, 0) as xuat_su_dung_tren_cap,
          COALESCE(xtk.xuat_cap_cho_tren_cap, 0) as xuat_cap_cho_tren_cap,
          COALESCE(xtk.tong_xuat_tren_cap, 0) as cong_xuat_tren_cap,
          
          COALESCE(xtk.xuat_su_dung_tu_mua, 0) as xuat_su_dung_tu_mua,
          COALESCE(xtk.xuat_cap_cho_tu_mua, 0) as xuat_cap_cho_tu_mua,
          COALESCE(xtk.tong_xuat_tu_mua, 0) as cong_xuat_tu_mua,
          
          COALESCE(xtk.xuat_su_dung_khac, 0) as xuat_su_dung_khac,
          COALESCE(xtk.xuat_cap_cho_khac, 0) as xuat_cap_cho_khac,
          COALESCE(xtk.tong_xuat_khac, 0) as cong_xuat_khac,
          
          -- ✅ ĐÚNG: Tồn cuối kỳ theo từng nguồn
          COALESCE(tdtn.ton_dau_tren_cap, 0) as ton_dau_tren_cap,
          COALESCE(tdtn.ton_dau_tu_mua, 0) as ton_dau_tu_mua,
          COALESCE(tdtn.ton_dau_khac, 0) as ton_dau_khac
          
        FROM phong_ban_data pb
        LEFT JOIN ton_dau_ky_tong tdt ON pb.id = tdt.phong_ban_id
        LEFT JOIN ton_dau_ky_theo_nguon tdtn ON pb.id = tdtn.phong_ban_id
        LEFT JOIN nhap_trong_ky ntk ON pb.id = ntk.phong_ban_id
        LEFT JOIN xuat_trong_ky xtk ON pb.id = xtk.phong_ban_id
      ),
      -- ✅ ĐÚNG: Tính tồn cuối kỳ THEO NGUỒN GỐC
      final_data AS (
        SELECT 
          *,
          -- Tồn cuối kỳ tổng (cho tab tổng hợp)
          (ton_dau_ky + cong_nhap - cong_xuat) as ton_cuoi_ky,
          
          -- ✅ ĐÚNG: Tồn cuối kỳ theo từng nguồn gốc
          (ton_dau_tren_cap + nhap_tren_cap - cong_xuat_tren_cap) as ton_cuoi_ky_tren_cap,
          (ton_dau_tu_mua + nhap_tu_mua - cong_xuat_tu_mua) as ton_cuoi_ky_tu_mua,
          (ton_dau_khac + nhap_khac - cong_xuat_khac) as ton_cuoi_ky_khac
          
        FROM raw_data
      )
      SELECT * FROM final_data
      ORDER BY cap_bac, noi_dung
    `;

    console.log("🔍 Executing query with params:", phongBanParams);
    const result = await pool.query(mainQuery, phongBanParams);

    console.log("📊 Query result count:", result.rows.length);
    console.log("📊 Sample results:", result.rows.slice(0, 2));
    
    // ✅ DEBUG: Kiểm tra chi tiết kết quả cho cấp 3
    if (user.role === "user" && user.phong_ban?.cap_bac === 3) {
      console.log("🔍 CẤP 3 USER - Chi tiết kết quả query:");
      console.log("  - Tổng số records:", result.rows.length);
      console.log("  - Danh sách phòng ban:", result.rows.map(row => ({
        id: row.phong_ban_id,
        noi_dung: row.noi_dung,
        cap_bac: row.cap_bac,
        phong_ban_cha_id: row.phong_ban_cha_id
      })));
      
      // Kiểm tra xem có phòng ban nào không thuộc về user không
      const userPhongBanId = user.phong_ban_id;
      const unauthorizedRows = result.rows.filter(row => 
        row.phong_ban_id !== userPhongBanId && 
        row.phong_ban_cha_id !== userPhongBanId
      );
      
      if (unauthorizedRows.length > 0) {
        console.error("❌ BACKEND PHÂN QUYỀN BỊ VI PHẠM! Query trả về dữ liệu không thuộc quyền:");
        console.error("  - Dữ liệu không được phép:", unauthorizedRows);
      } else {
        console.log("✅ Backend phân quyền OK - Query chỉ trả về dữ liệu thuộc quyền");
      }
    }

    // ✅ ĐÚNG: Process data cho từng tab
    const processedData = result.rows.map((row) => ({
      id: row.phong_ban_id,
      noi_dung: row.noi_dung,
      cap_bac: parseInt(row.cap_bac),
      phong_ban_cha_id: row.phong_ban_cha_id,
      is_manager: row.cap_bac === 2,
      is_warehouse: row.cap_bac === 1 || row.cap_bac === 3,

      // Dữ liệu cho tab tổng hợp
      ton_dau_ky: parseFloat(row.ton_dau_ky) || 0,
      nhap_tren_cap: parseFloat(row.nhap_tren_cap) || 0,
      nhap_tu_mua: parseFloat(row.nhap_tu_mua) || 0,
      nhap_khac: parseFloat(row.nhap_khac) || 0,
      cong_nhap: parseFloat(row.cong_nhap) || 0,
      xuat_su_dung: parseFloat(row.xuat_su_dung) || 0,
      xuat_cap_cho: parseFloat(row.xuat_cap_cho) || 0,
      xuat_thanh_ly: parseFloat(row.xuat_thanh_ly) || 0,
      xuat_khac: parseFloat(row.xuat_khac) || 0,
      cong_xuat: parseFloat(row.cong_xuat) || 0,
      ton_cuoi_ky: parseFloat(row.ton_cuoi_ky) || 0,

      // ✅ ĐÚNG: Dữ liệu riêng cho từng tab
      ton_cuoi_ky_tren_cap: parseFloat(row.ton_cuoi_ky_tren_cap) || 0,
      ton_cuoi_ky_tu_mua: parseFloat(row.ton_cuoi_ky_tu_mua) || 0,
      ton_cuoi_ky_khac: parseFloat(row.ton_cuoi_ky_khac) || 0,

      cong_xuat_tren_cap: parseFloat(row.cong_xuat_tren_cap) || 0,
      cong_xuat_tu_mua: parseFloat(row.cong_xuat_tu_mua) || 0,
      cong_xuat_khac: parseFloat(row.cong_xuat_khac) || 0,
    }));

    const filterDataForTab = (data, tabType) => {
      const isUserCap3 = user.role === "user" && user.phong_ban?.cap_bac === 3;

      if (isUserCap3) {
        console.log(
          `🏢 User cấp 3 - KHÔNG filter ${tabType}, hiển thị tất cả data`
        );
        // ✅ User cấp 3: LUÔN hiển thị tất cả data, không filter theo số liệu
        return data;
      }

      // ✅ Admin/Manager: Filter theo số liệu như trước
      console.log(`👤 Admin/Manager - Filter ${tabType} theo số liệu`);

      switch (tabType) {
        case "trenCap":
          return data.filter(
            (item) => item.nhap_tren_cap > 0 || item.cap_bac <= 2
          );
        case "tuMua":
          return data.filter(
            (item) => item.nhap_tu_mua > 0 || item.cap_bac <= 2
          );
        case "khac":
          return data.filter((item) => item.nhap_khac > 0 || item.cap_bac <= 2);
        default:
          return data;
      }
    };

    // ✅ ĐÚNG: Tạo báo cáo chi tiết theo từng tab với logic ĐÚNG
    const reportData = {
      luanChuyen: {
        // Tab tổng hợp: Hiển thị tất cả (không đổi)
        tongHop: processedData,

        // ✅ ĐÚNG: Tab trên cấp - Sử dụng filter function
        trenCap: filterDataForTab(
          processedData.map((item) => ({
            ...item,
            // Chỉ hiển thị nhập từ trên cấp, các loại khác = 0
            nhap_tu_mua: 0,
            nhap_khac: 0,
            cong_nhap: item.nhap_tren_cap,

            // Chỉ hiển thị xuất từ nguồn trên cấp
            xuat_su_dung: item.xuat_su_dung_tren_cap || 0,
            xuat_cap_cho: item.xuat_cap_cho_tren_cap || 0,
            cong_xuat: item.cong_xuat_tren_cap,

            // Tồn cuối kỳ CHỈ từ nguồn trên cấp
            ton_cuoi_ky: item.ton_cuoi_ky_tren_cap,
          })),
          "trenCap"
        ),

        // ✅ ĐÚNG: Tab tự mua - Sử dụng filter function
        tuMua: filterDataForTab(
          processedData.map((item) => ({
            ...item,
            // Chỉ hiển thị nhập tự mua, các loại khác = 0
            nhap_tren_cap: 0,
            nhap_khac: 0,
            cong_nhap: item.nhap_tu_mua,

            // Chỉ hiển thị xuất từ nguồn tự mua
            xuat_su_dung: item.xuat_su_dung_tu_mua || 0,
            xuat_cap_cho: item.xuat_cap_cho_tu_mua || 0,
            cong_xuat: item.cong_xuat_tu_mua,

            // Tồn cuối kỳ CHỈ từ nguồn tự mua
            ton_cuoi_ky: item.ton_cuoi_ky_tu_mua,
          })),
          "tuMua"
        ),

        // ✅ ĐÚNG: Tab luân chuyển - Sử dụng filter function
        khac: filterDataForTab(
          processedData.map((item) => ({
            ...item,
            // Chỉ hiển thị nhập luân chuyển, các loại khác = 0
            nhap_tren_cap: 0,
            nhap_tu_mua: 0,
            cong_nhap: item.nhap_khac,

            // Chỉ hiển thị xuất từ nguồn luân chuyển
            xuat_su_dung: item.xuat_su_dung_khac || 0,
            xuat_cap_cho: item.xuat_cap_cho_khac || 0,
            cong_xuat: item.cong_xuat_khac,

            // Tồn cuối kỳ CHỈ từ nguồn luân chuyển
            ton_cuoi_ky: item.ton_cuoi_ky_khac,
          })),
          "khac"
        ),
      },

      // Debug info
      debug_info: {
        user_id: user.id,
        user_role: user.role,
        phong_ban_id: user.phong_ban_id,
        cap_bac: user.phong_ban?.cap_bac,
        is_user_cap3: user.role === "user" && user.phong_ban?.cap_bac === 3,
        total_records: processedData.length,
        raw_data_sample: processedData[0],
        filter_logic:
          user.role === "user" && user.phong_ban?.cap_bac === 3
            ? "No filter - show all data for user cấp 3"
            : "Filter by số liệu for admin/manager",
      },
    };

    console.log("📈 Final report data structure:", {
      tongHop: reportData.luanChuyen.tongHop.length,
      trenCap: reportData.luanChuyen.trenCap.length,
      tuMua: reportData.luanChuyen.tuMua.length,
      khac: reportData.luanChuyen.khac.length,
      debug: reportData.debug_info,
    });

    // ✅ VALIDATION: Kiểm tra logic cộng
    const validation = {
      tongHop_cong_nhap: reportData.luanChuyen.tongHop.reduce(
        (sum, item) => sum + item.cong_nhap,
        0
      ),
      sum_tabs_cong_nhap:
        reportData.luanChuyen.trenCap.reduce(
          (sum, item) => sum + item.cong_nhap,
          0
        ) +
        reportData.luanChuyen.tuMua.reduce(
          (sum, item) => sum + item.cong_nhap,
          0
        ) +
        reportData.luanChuyen.khac.reduce(
          (sum, item) => sum + item.cong_nhap,
          0
        ),
      tongHop_ton_cuoi: reportData.luanChuyen.tongHop.reduce(
        (sum, item) => sum + item.ton_cuoi_ky,
        0
      ),
      sum_tabs_ton_cuoi:
        reportData.luanChuyen.trenCap.reduce(
          (sum, item) => sum + item.ton_cuoi_ky,
          0
        ) +
        reportData.luanChuyen.tuMua.reduce(
          (sum, item) => sum + item.ton_cuoi_ky,
          0
        ) +
        reportData.luanChuyen.khac.reduce(
          (sum, item) => sum + item.ton_cuoi_ky,
          0
        ),
    };

    console.log("🧮 VALIDATION:", validation);

    return sendResponse(
      res,
      200,
      true,
      "Lấy báo cáo luân chuyển thành công",
      reportData
    );
  } catch (error) {
    console.error("❌ Lỗi khi lấy báo cáo luân chuyển:", error);
    return sendResponse(res, 500, false, "Lỗi server", {
      error: error.message,
    });
  }
};

const getPhongBanForReport = async (req, res, query, user) => {
  try {
    let whereCondition = "";
    let params = [];
    let paramIndex = 1;

    if (user.role === "user" && user.phong_ban?.cap_bac === 3) {
      // ✅ ĐÚNG: Cấp 3 vẫn cần trả về thông tin phòng ban cho frontend
      console.log("🏢 User cấp 3 - returning phong ban info");
      return sendResponse(
        res,
        200,
        true,
        "Lấy danh sách phòng ban thành công",
        {
          cap2: [],
          cap3: [
            {
              id: user.phong_ban_id,
              ten_phong_ban: user.phong_ban.ten_phong_ban,
              cap_bac: 3,
              phong_ban_cha_id: user.phong_ban.phong_ban_cha_id,
              is_current_user: true,
            },
          ],
          hierarchy: {},
          user_context: {
            phong_ban_id: user.phong_ban_id,
            ten_phong_ban: user.phong_ban.ten_phong_ban,
            role: "user",
            cap_bac: 3,
            note: "User cấp 3 - luôn hiển thị phòng ban của mình",
          },
        }
      );
    } else if (user.role === "manager" && user.phong_ban?.cap_bac === 2) {
      // Manager cấp 2: thấy tất cả cấp 2 khác + các cấp 3 thuộc quyền
      whereCondition =
        "WHERE (pb.cap_bac = 2 OR (pb.cap_bac = 3 AND pb.phong_ban_cha_id = $1)) AND pb.is_active = TRUE";
      params.push(user.phong_ban_id);
      paramIndex++;
    } else if (user.role === "admin") {
      // Admin thấy tất cả cấp 2 và cấp 3
      whereCondition = "WHERE pb.cap_bac IN (2, 3) AND pb.is_active = TRUE";
    }

    const query_sql = `
      SELECT 
        pb.id,
        pb.ten_phong_ban,
        pb.cap_bac,
        pb.phong_ban_cha_id,
        pb_cha.ten_phong_ban as ten_phong_ban_cha
      FROM phong_ban pb
      LEFT JOIN phong_ban pb_cha ON pb.phong_ban_cha_id = pb_cha.id
      ${whereCondition}
      ORDER BY pb.cap_bac, pb.ten_phong_ban
    `;

    const result = await pool.query(query_sql, params);

    // Tổ chức dữ liệu theo cấp bậc
    const organizedData = {
      cap2: [], // Managers
      cap3: [], // Warehouses
      hierarchy: {}, // Manager -> Warehouses mapping
    };

    result.rows.forEach((row) => {
      if (row.cap_bac === 2) {
        organizedData.cap2.push({
          id: row.id,
          ten_phong_ban: row.ten_phong_ban,
          cap_bac: row.cap_bac,
        });
        organizedData.hierarchy[row.id] = [];
      } else if (row.cap_bac === 3) {
        organizedData.cap3.push({
          id: row.id,
          ten_phong_ban: row.ten_phong_ban,
          cap_bac: row.cap_bac,
          phong_ban_cha_id: row.phong_ban_cha_id,
          ten_phong_ban_cha: row.ten_phong_ban_cha,
        });

        // Thêm vào hierarchy
        if (
          row.phong_ban_cha_id &&
          organizedData.hierarchy[row.phong_ban_cha_id]
        ) {
          organizedData.hierarchy[row.phong_ban_cha_id].push({
            id: row.id,
            ten_phong_ban: row.ten_phong_ban,
          });
        }
      }
    });

    return sendResponse(
      res,
      200,
      true,
      "Lấy danh sách phòng ban thành công",
      organizedData
    );
  } catch (error) {
    console.error("⌨ Lỗi khi lấy danh sách phòng ban:", error);
    return sendResponse(res, 500, false, "Lỗi server");
  }
};

const getXuatDataByType = async (req, res, query, user) => {
  try {
    const { tu_ngay, den_ngay, loai_phieu, phong_ban_id } = query;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE px.trang_thai = 'completed'";
    let queryParams = [];
    let paramIndex = 1;

    // Filter theo thời gian
    if (tu_ngay) {
      whereClause += ` AND px.ngay_xuat >= $${paramIndex}::date`;
      queryParams.push(tu_ngay);
      paramIndex++;
    }

    if (den_ngay) {
      whereClause += ` AND px.ngay_xuat <= $${paramIndex}::date`;
      queryParams.push(den_ngay);
      paramIndex++;
    }

    // Filter theo loại phiếu
    if (loai_phieu) {
      whereClause += ` AND px.loai_xuat = $${paramIndex}`;
      queryParams.push(loai_phieu);
      paramIndex++;
    }

    // Phân quyền theo cấp
    if (user.role === "user") {
      // Cấp 3: Chỉ xem được phòng ban của mình
      whereClause += ` AND px.phong_ban_id = $${paramIndex}`;
      queryParams.push(user.phong_ban_id);
      paramIndex++;
    } else if (user.role === "manager") {
      // Cấp 2: Xem được phòng ban của mình và các phòng ban cấp 3 dưới quyền
      if (phong_ban_id && phong_ban_id !== "all") {
        whereClause += ` AND px.phong_ban_id = $${paramIndex}`;
        queryParams.push(phong_ban_id);
        paramIndex++;
      } else {
        // Nếu chọn "all", chỉ xem được phòng ban của mình và các phòng ban cấp 3 dưới quyền
        whereClause += ` AND (px.phong_ban_id = $${paramIndex} OR px.phong_ban_id IN (
          SELECT id FROM phong_ban WHERE phong_ban_cha_id = $${paramIndex} AND cap_bac = 3
        ))`;
        queryParams.push(user.phong_ban_id);
        paramIndex++;
      }
    } else if (user.role === "admin") {
      // Cấp 1: Xem được tất cả
      if (phong_ban_id && phong_ban_id !== "all") {
        whereClause += ` AND px.phong_ban_id = $${paramIndex}`;
        queryParams.push(phong_ban_id);
        paramIndex++;
      }
    }

    const xuatQuery = `
      SELECT 
        px.id,
        px.so_phieu,
        px.ngay_xuat,
        px.tong_tien,
        px.ly_do_xuat,
        px.trang_thai,
        px.loai_xuat,
        pb.ten_phong_ban,
        dvn.ten_don_vi as don_vi_nhan,
        u.ho_ten as nguoi_tao_ten
      FROM phieu_xuat px
      LEFT JOIN phong_ban pb ON px.phong_ban_id = pb.id
      LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id
      LEFT JOIN users u ON px.nguoi_tao = u.id
      ${whereClause}
      ORDER BY px.ngay_xuat DESC, px.id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const result = await pool.query(xuatQuery, queryParams);

    // Đếm tổng số records
    const countQuery = `
      SELECT COUNT(*) as total
      FROM phieu_xuat px
      LEFT JOIN phong_ban pb ON px.phong_ban_id = pb.id
      LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id
      LEFT JOIN users u ON px.nguoi_tao = u.id
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    return sendResponse(res, 200, true, "Lấy dữ liệu xuất kho thành công", {
      items: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy dữ liệu xuất kho:", error);
    return sendResponse(res, 500, false, "Lỗi server");
  }
};

module.exports = {
  getDashboardStats,
  getTonKhoReport,
  getNhapXuatReport,
  getKiemKeReport,
  exportExcel,
  getLuanChuyenKhoData,
  getNhapDataByType,
  getXuatDataByType,
  exportLuanChuyenExcel,
  getLuanChuyenReport,
  getPhongBanForReport,
};
