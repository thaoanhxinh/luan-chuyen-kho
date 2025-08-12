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

// const getLuanChuyenKhoData = async (req, res, query, user) => {
//   try {
//     const { tu_ngay, den_ngay, phong_ban_id } = query;

//     if (!tu_ngay || !den_ngay) {
//       return sendResponse(res, 400, false, "Vui lòng chọn khoảng thời gian");
//     }

//     console.log(`📊 Getting Luan Chuyen data from ${tu_ngay} to ${den_ngay}`);

//     // Xác định phòng ban dựa trên role
//     let phongBanFilter = "";
//     let queryParams = [tu_ngay, den_ngay];
//     let paramIndex = 3;

//     if (user.role !== "admin") {
//       phongBanFilter = `AND pb.id = $${paramIndex}`;
//       queryParams.push(user.phong_ban_id);
//       paramIndex++;
//     } else if (phong_ban_id && phong_ban_id !== "all") {
//       phongBanFilter = `AND pb.id = $${paramIndex}`;
//       queryParams.push(phong_ban_id);
//       paramIndex++;
//     }

//     // Query tổng hợp luân chuyển kho
//     const tongHopQuery = `
//       WITH phieu_nhap_completed AS (
//         SELECT
//           pn.phong_ban_id,
//           pn.ngay_nhap,
//           pn.tong_tien,
//           pn.loai_phieu,
//           CASE
//             WHEN pn.ngay_nhap < $1 THEN 'truoc_ky'
//             WHEN pn.ngay_nhap BETWEEN $1 AND $2 THEN 'trong_ky'
//             ELSE 'sau_ky'
//           END as thoi_gian
//         FROM phieu_nhap pn
//         JOIN phong_ban pb ON pn.phong_ban_id = pb.id
//         WHERE pn.trang_thai = 'completed'
//         ${phongBanFilter}
//       ),
//       phieu_xuat_completed AS (
//         SELECT
//           px.phong_ban_id,
//           px.ngay_xuat,
//           px.tong_tien,
//           px.ly_do_xuat,
//           px.loai_xuat,
//           CASE
//             WHEN px.ngay_xuat < $1 THEN 'truoc_ky'
//             WHEN px.ngay_xuat BETWEEN $1 AND $2 THEN 'trong_ky'
//             ELSE 'sau_ky'
//           END as thoi_gian
//         FROM phieu_xuat px
//         JOIN phong_ban pb ON px.phong_ban_id = pb.id
//         WHERE px.trang_thai = 'completed'
//         ${phongBanFilter}
//       ),
//       ton_dau_ky AS (
//         SELECT
//           COALESCE(pn.phong_ban_id, px.phong_ban_id) as phong_ban_id,
//           (COALESCE(SUM(CASE WHEN pn.thoi_gian = 'truoc_ky' THEN pn.tong_tien ELSE 0 END), 0) -
//            COALESCE(SUM(CASE WHEN px.thoi_gian = 'truoc_ky' THEN px.tong_tien ELSE 0 END), 0)) as ton_dau
//         FROM phieu_nhap_completed pn
//         FULL OUTER JOIN phieu_xuat_completed px ON pn.phong_ban_id = px.phong_ban_id
//         GROUP BY COALESCE(pn.phong_ban_id, px.phong_ban_id)
//       ),
//       nhap_trong_ky AS (
//         SELECT
//           phong_ban_id,
//           SUM(CASE WHEN loai_phieu = 'tren_cap' THEN tong_tien ELSE 0 END) as nhap_tren_cap,
//           SUM(CASE WHEN loai_phieu = 'tu_mua' THEN tong_tien ELSE 0 END) as nhap_tu_mua,
//           SUM(CASE WHEN loai_phieu NOT IN ('tren_cap', 'tu_mua') THEN tong_tien ELSE 0 END) as nhap_khac,
//           SUM(tong_tien) as tong_nhap
//         FROM phieu_nhap_completed
//         WHERE thoi_gian = 'trong_ky'
//         GROUP BY phong_ban_id
//       ),
//       xuat_trong_ky AS (
//         SELECT
//           phong_ban_id,
//           SUM(CASE WHEN loai_xuat = 'don_vi_su_dung' THEN tong_tien ELSE 0 END) as xuat_su_dung,
//           SUM(CASE WHEN loai_xuat = 'don_vi_nhan' THEN tong_tien ELSE 0 END) as xuat_cap_cho,
//           SUM(CASE WHEN ly_do_xuat LIKE '%thanh lý%' OR ly_do_xuat LIKE '%nhượng bán%' THEN tong_tien ELSE 0 END) as xuat_thanh_ly,
//           SUM(CASE WHEN loai_xuat NOT IN ('don_vi_su_dung', 'don_vi_nhan')
//                    AND (ly_do_xuat NOT LIKE '%thanh lý%' AND ly_do_xuat NOT LIKE '%nhượng bán%')
//                    THEN tong_tien ELSE 0 END) as xuat_khac,
//           SUM(tong_tien) as tong_xuat
//         FROM phieu_xuat_completed
//         WHERE thoi_gian = 'trong_ky'
//         GROUP BY phong_ban_id
//       )
//       SELECT
//         pb.id,
//         pb.ten_phong_ban as noi_dung,
//         pb.ma_phong_ban,
//         COALESCE(tdq.ton_dau, 0) as ton_dau_ky,
//         COALESCE(ntq.nhap_tren_cap, 0) as nhap_tren_cap,
//         COALESCE(ntq.nhap_tu_mua, 0) as nhap_tu_mua,
//         COALESCE(ntq.nhap_khac, 0) as nhap_khac,
//         COALESCE(ntq.tong_nhap, 0) as cong_nhap,
//         COALESCE(xtq.xuat_su_dung, 0) as xuat_su_dung,
//         COALESCE(xtq.xuat_cap_cho, 0) as xuat_cap_cho,
//         COALESCE(xtq.xuat_thanh_ly, 0) as xuat_thanh_ly,
//         COALESCE(xtq.xuat_khac, 0) as xuat_khac,
//         COALESCE(xtq.tong_xuat, 0) as cong_xuat,
//         -- Tồn cuối kỳ = Tồn đầu + Tổng nhập - Tổng xuất
//         (COALESCE(tdq.ton_dau, 0) + COALESCE(ntq.tong_nhap, 0) - COALESCE(xtq.tong_xuat, 0)) as ton_cuoi_ky
//       FROM phong_ban pb
//       LEFT JOIN ton_dau_ky tdq ON pb.id = tdq.phong_ban_id
//       LEFT JOIN nhap_trong_ky ntq ON pb.id = ntq.phong_ban_id
//       LEFT JOIN xuat_trong_ky xtq ON pb.id = xtq.phong_ban_id
//       WHERE 1=1 ${phongBanFilter}
//       ORDER BY pb.ma_phong_ban
//     `;

//     // Query chi tiết nhập theo loại
//     const nhapChiTietQuery = `
//       SELECT
//         'tren_cap' as loai,
//         pb.ten_phong_ban as noi_dung,
//         SUM(pn.tong_tien) as gia_tri
//       FROM phieu_nhap pn
//       JOIN phong_ban pb ON pn.phong_ban_id = pb.id
//       WHERE pn.trang_thai = 'completed'
//         AND pn.ngay_nhap BETWEEN $1 AND $2
//         AND pn.loai_phieu = 'tren_cap'
//         ${phongBanFilter}
//       GROUP BY pb.ten_phong_ban

//       UNION ALL

//       SELECT
//         'tu_mua' as loai,
//         pb.ten_phong_ban as noi_dung,
//         SUM(pn.tong_tien) as gia_tri
//       FROM phieu_nhap pn
//       JOIN phong_ban pb ON pn.phong_ban_id = pb.id
//       WHERE pn.trang_thai = 'completed'
//         AND pn.ngay_nhap BETWEEN $1 AND $2
//         AND pn.loai_phieu = 'tu_mua'
//         ${phongBanFilter}
//       GROUP BY pb.ten_phong_ban

//       UNION ALL

//       SELECT
//         'khac' as loai,
//         pb.ten_phong_ban as noi_dung,
//         SUM(pn.tong_tien) as gia_tri
//       FROM phieu_nhap pn
//       JOIN phong_ban pb ON pn.phong_ban_id = pb.id
//       WHERE pn.trang_thai = 'completed'
//         AND pn.ngay_nhap BETWEEN $1 AND $2
//         AND pn.loai_phieu NOT IN ('tren_cap', 'tu_mua')
//         ${phongBanFilter}
//       GROUP BY pb.ten_phong_ban

//       ORDER BY loai, noi_dung
//     `;

//     // Thực hiện các queries
//     console.log("🔍 Executing queries with params:", queryParams);

//     const [tongHopResult, nhapChiTietResult] = await Promise.all([
//       pool.query(tongHopQuery, queryParams),
//       pool.query(nhapChiTietQuery, queryParams),
//     ]);

//     const tongHopData = tongHopResult.rows || [];
//     const nhapChiTietData = nhapChiTietResult.rows || [];

//     // Xử lý dữ liệu chi tiết nhập theo loại
//     const trenCapData = nhapChiTietData
//       .filter((item) => item.loai === "tren_cap")
//       .map((item) => ({
//         noi_dung: item.noi_dung,
//         nhap_tren_cap: parseFloat(item.gia_tri) || 0,
//       }));

//     const tuMuaData = nhapChiTietData
//       .filter((item) => item.loai === "tu_mua")
//       .map((item) => ({
//         noi_dung: item.noi_dung,
//         nhap_tu_mua: parseFloat(item.gia_tri) || 0,
//       }));

//     const khacData = nhapChiTietData
//       .filter((item) => item.loai === "khac")
//       .map((item) => ({
//         noi_dung: item.noi_dung,
//         nhap_khac: parseFloat(item.gia_tri) || 0,
//       }));

//     // Format dữ liệu response
//     const responseData = {
//       tongHop: tongHopData.map((row) => ({
//         noi_dung: row.noi_dung,
//         ton_dau_ky: parseFloat(row.ton_dau_ky) || 0,
//         nhap_tren_cap: parseFloat(row.nhap_tren_cap) || 0,
//         nhap_tu_mua: parseFloat(row.nhap_tu_mua) || 0,
//         nhap_khac: parseFloat(row.nhap_khac) || 0,
//         cong_nhap: parseFloat(row.cong_nhap) || 0,
//         xuat_su_dung: parseFloat(row.xuat_su_dung) || 0,
//         xuat_cap_cho: parseFloat(row.xuat_cap_cho) || 0,
//         xuat_thanh_ly: parseFloat(row.xuat_thanh_ly) || 0,
//         xuat_khac: parseFloat(row.xuat_khac) || 0,
//         cong_xuat: parseFloat(row.cong_xuat) || 0,
//         ton_cuoi_ky: parseFloat(row.ton_cuoi_ky) || 0,
//       })),
//       trenCap: trenCapData,
//       tuMua: tuMuaData,
//       khac: khacData,
//       summary: {
//         tu_ngay,
//         den_ngay,
//         tong_phong_ban: tongHopData.length,
//         tong_gia_tri_nhap: tongHopData.reduce(
//           (sum, item) => sum + (parseFloat(item.cong_nhap) || 0),
//           0
//         ),
//         tong_gia_tri_xuat: tongHopData.reduce(
//           (sum, item) => sum + (parseFloat(item.cong_xuat) || 0),
//           0
//         ),
//         tong_gia_tri_ton: tongHopData.reduce(
//           (sum, item) => sum + (parseFloat(item.ton_cuoi_ky) || 0),
//           0
//         ),
//       },
//     };

//     console.log(`📊 Luan Chuyen report result:`, {
//       tongHop: responseData.tongHop.length,
//       trenCap: responseData.trenCap.length,
//       tuMua: responseData.tuMua.length,
//       khac: responseData.khac.length,
//     });

//     sendResponse(
//       res,
//       200,
//       true,
//       "Lấy báo cáo luân chuyển kho thành công",
//       responseData
//     );
//   } catch (error) {
//     console.error("❌ Luan Chuyen report error:", error);
//     sendResponse(res, 500, false, "Lỗi server", { error: error.message });
//   }
// };
const getLuanChuyenKhoData = async (req, res, query, user) => {
  try {
    const { tu_ngay, den_ngay, phong_ban_id } = query;

    if (!tu_ngay || !den_ngay) {
      return sendResponse(res, 400, false, "Vui lòng chọn khoảng thời gian");
    }

    console.log(`📊 Getting Luan Chuyen data from ${tu_ngay} to ${den_ngay}`);

    // Xác định phòng ban dựa trên role
    let phongBanFilter = "";
    let queryParams = [tu_ngay, den_ngay];
    let paramIndex = 3;

    if (user.role !== "admin") {
      phongBanFilter = `AND pb.id = ${paramIndex}`;
      queryParams.push(user.phong_ban_id);
      paramIndex++;
    } else if (phong_ban_id && phong_ban_id !== "all") {
      phongBanFilter = `AND pb.id = ${paramIndex}`;
      queryParams.push(phong_ban_id);
      paramIndex++;
    }

    // Query tổng hợp luân chuyển kho - SỬA LẠI LOGIC TÍNH TOÁN
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
    ${phongBanFilter}
),
      phieu_xuat_theo_nguon_goc AS (
    SELECT 
        px.phong_ban_id,
        px.ngay_xuat,
        px.ly_do_xuat,
        px.loai_xuat,
        -- Tính giá trị xuất theo từng loại phiếu nhập
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
    ${phongBanFilter}
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

-- XUẤT TRONG KỲ THEO ĐÚNG NGUỒN GỐC
xuat_trong_ky AS (
    SELECT 
        phong_ban_id,
        -- Xuất từ hàng TRÊN CẤP
        SUM(CASE WHEN loai_xuat = 'don_vi_su_dung' THEN gia_tri_xuat_tren_cap ELSE 0 END) as xuat_su_dung_tren_cap,
        SUM(CASE WHEN loai_xuat = 'don_vi_nhan' THEN gia_tri_xuat_tren_cap ELSE 0 END) as xuat_cap_cho_tren_cap,
        SUM(CASE WHEN ly_do_xuat LIKE '%thanh lý%' THEN gia_tri_xuat_tren_cap ELSE 0 END) as xuat_thanh_ly_tren_cap,
        SUM(gia_tri_xuat_tren_cap) as tong_xuat_tren_cap,
        
        -- Xuất từ hàng TỰ MUA
        SUM(CASE WHEN loai_xuat = 'don_vi_su_dung' THEN gia_tri_xuat_tu_mua ELSE 0 END) as xuat_su_dung_tu_mua,
        SUM(CASE WHEN loai_xuat = 'don_vi_nhan' THEN gia_tri_xuat_tu_mua ELSE 0 END) as xuat_cap_cho_tu_mua,
        SUM(CASE WHEN ly_do_xuat LIKE '%thanh lý%' THEN gia_tri_xuat_tu_mua ELSE 0 END) as xuat_thanh_ly_tu_mua,
        SUM(gia_tri_xuat_tu_mua) as tong_xuat_tu_mua,
        
        -- Xuất từ hàng KHÁC
        SUM(CASE WHEN loai_xuat = 'don_vi_su_dung' THEN gia_tri_xuat_khac ELSE 0 END) as xuat_su_dung_khac,
        SUM(CASE WHEN loai_xuat = 'don_vi_nhan' THEN gia_tri_xuat_khac ELSE 0 END) as xuat_cap_cho_khac,
        SUM(CASE WHEN ly_do_xuat LIKE '%thanh lý%' THEN gia_tri_xuat_khac ELSE 0 END) as xuat_thanh_ly_khac,
        SUM(gia_tri_xuat_khac) as tong_xuat_khac,
        
        -- Tổng xuất (kiểm tra)
        SUM(tong_gia_tri_xuat) as tong_xuat_kiem_tra
    FROM phieu_xuat_theo_nguon_goc
    WHERE thoi_gian = 'trong_ky'
    GROUP BY phong_ban_id
)

-- KẾT QUẢ CUỐI CÙNG
SELECT 
    pb.id,
    pb.ten_phong_ban as noi_dung,
    pb.ma_phong_ban,
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
    0 as xuat_khac, -- Có thể tính từ logic khác
    COALESCE(xtq.tong_xuat_kiem_tra, 0) as cong_xuat,
    
    -- TỒN CUỐI KỲ
    (COALESCE(tdq.ton_dau, 0) + COALESCE(ntq.tong_nhap, 0) - COALESCE(xtq.tong_xuat_kiem_tra, 0)) as ton_cuoi_ky,
    
    -- CHI TIẾT THEO TỪNG LOẠI (CHO CÁC SHEET PHỤ)
    COALESCE(xtq.tong_xuat_tren_cap, 0) as xuat_tren_cap_chi_tiet,
    COALESCE(xtq.tong_xuat_tu_mua, 0) as xuat_tu_mua_chi_tiet,
    COALESCE(xtq.tong_xuat_khac, 0) as xuat_khac_chi_tiet
    
FROM phong_ban pb
LEFT JOIN ton_dau_ky tdq ON pb.id = tdq.phong_ban_id
LEFT JOIN nhap_trong_ky ntq ON pb.id = ntq.phong_ban_id
LEFT JOIN xuat_trong_ky xtq ON pb.id = xtq.phong_ban_id
WHERE 1=1 ${phongBanFilter}
ORDER BY pb.ma_phong_ban
    `;

    // SỬA: Query chi tiết theo loại - bao gồm cả xuất kho tương ứng
    const chiTietTheoLoaiQuery = `
      WITH phong_ban_data AS (
  SELECT id, ten_phong_ban, ma_phong_ban 
  FROM phong_ban pb
  WHERE 1=1 ${phongBanFilter}
),
ton_dau_ky AS (
  SELECT 
    pb.id as phong_ban_id,
    pb.ten_phong_ban,
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
  GROUP BY pb.ten_phong_ban, tdq.ton_dau, xtk.xuat_tren_cap
),
tu_mua_data AS (
  SELECT 
    pb.ten_phong_ban as noi_dung,
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
  GROUP BY pb.ten_phong_ban, tdq.ton_dau, xtk.xuat_tu_mua
),
khac_data AS (
  SELECT 
    pb.ten_phong_ban as noi_dung,
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
  GROUP BY pb.ten_phong_ban, tdq.ton_dau, xtk.xuat_khac
)
SELECT * FROM tren_cap_data
UNION ALL
SELECT * FROM tu_mua_data
UNION ALL
SELECT * FROM khac_data
ORDER BY loai, noi_dung
    `;

    // Thực hiện các queries
    console.log("🔍 Executing queries with params:", queryParams);

    const [tongHopResult, chiTietResult] = await Promise.all([
      pool.query(tongHopQuery, queryParams),
      pool.query(chiTietTheoLoaiQuery, queryParams),
    ]);

    const tongHopData = tongHopResult.rows || [];
    const chiTietData = chiTietResult.rows || [];

    // Xử lý dữ liệu chi tiết theo loại
    const trenCapData = chiTietData
      .filter((item) => item.loai === "tren_cap")
      .map((item) => ({
        noi_dung: item.noi_dung,
        ton_dau_ky: parseFloat(item.ton_dau_ky) || 0,
        nhap_tren_cap: parseFloat(item.gia_tri_nhap) || 0,
        xuat_trong_ky: parseFloat(item.xuat_trong_ky) || 0,
        ton_cuoi_ky: parseFloat(item.ton_cuoi_ky) || 0,
      }));

    const tuMuaData = chiTietData
      .filter((item) => item.loai === "tu_mua")
      .map((item) => ({
        noi_dung: item.noi_dung,
        ton_dau_ky: parseFloat(item.ton_dau_ky) || 0,
        nhap_tu_mua: parseFloat(item.gia_tri_nhap) || 0,
        xuat_trong_ky: parseFloat(item.xuat_trong_ky) || 0,
        ton_cuoi_ky: parseFloat(item.ton_cuoi_ky) || 0,
      }));

    const khacData = chiTietData
      .filter((item) => item.loai === "khac")
      .map((item) => ({
        noi_dung: item.noi_dung,
        ton_dau_ky: parseFloat(item.ton_dau_ky) || 0,
        nhap_khac: parseFloat(item.gia_tri_nhap) || 0,
        xuat_trong_ky: parseFloat(item.xuat_trong_ky) || 0,
        ton_cuoi_ky: parseFloat(item.ton_cuoi_ky) || 0,
      }));

    // Format dữ liệu response
    const responseData = {
      tongHop: tongHopData.map((row) => ({
        noi_dung: row.noi_dung,
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
      })),
      trenCap: trenCapData,
      tuMua: tuMuaData,
      khac: khacData,
      summary: {
        tu_ngay,
        den_ngay,
        tong_phong_ban: tongHopData.length,
        tong_gia_tri_nhap: tongHopData.reduce(
          (sum, item) => sum + (parseFloat(item.cong_nhap) || 0),
          0
        ),
        tong_gia_tri_xuat: tongHopData.reduce(
          (sum, item) => sum + (parseFloat(item.cong_xuat) || 0),
          0
        ),
        tong_gia_tri_ton: tongHopData.reduce(
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
}; // Thêm vào baoCaoController.js

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

    // User thường chỉ thấy phiếu của phòng ban mình
    if (user.role !== "admin") {
      whereClause += ` AND pn.phong_ban_id = $${paramIndex}`;
      queryParams.push(user.phong_ban_id);
      paramIndex++;
    } else if (phong_ban_id && phong_ban_id !== "all") {
      whereClause += ` AND pn.phong_ban_id = $${paramIndex}`;
      queryParams.push(phong_ban_id);
      paramIndex++;
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

module.exports = {
  getDashboardStats,
  getTonKhoReport,
  getNhapXuatReport,
  getKiemKeReport,
  exportExcel,
  getLuanChuyenKhoData,
  getNhapDataByType,
};
