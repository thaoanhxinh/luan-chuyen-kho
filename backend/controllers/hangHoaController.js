const pool = require("../config/database");
const { sendResponse } = require("../utils/response");

const getList = async (req, res, query, user) => {
  try {
    const { page = 1, limit = 20, search = "", loai_hang_hoa_id } = query;

    const offset = (page - 1) * limit;
    let whereClause = "WHERE h.trang_thai = 'active'";
    const params = [];
    let paramCount = 0;

    // Tìm kiếm theo tên hoặc mã
    if (search) {
      paramCount++;
      whereClause += ` AND (h.ten_hang_hoa ILIKE $${paramCount} OR h.ma_hang_hoa ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Lọc theo loại hàng hóa
    if (loai_hang_hoa_id) {
      paramCount++;
      whereClause += ` AND h.loai_hang_hoa_id = $${paramCount}`;
      params.push(loai_hang_hoa_id);
    }

    // Phân quyền theo phòng ban
    if (user.role !== "admin") {
      paramCount++;
      whereClause += ` AND h.phong_ban_id = $${paramCount}`;
      params.push(user.phong_ban_id);
    }

    // Query đếm tổng số
    const countQuery = `
      SELECT COUNT(*) 
      FROM hang_hoa h 
      LEFT JOIN loai_hang_hoa lh ON h.loai_hang_hoa_id = lh.id 
      ${whereClause}
    `;

    // Query lấy dữ liệu - CHỈ TÍNH TỪ PHIẾU HOÀN THÀNH
    const dataQuery = `
      SELECT h.*, 
             lh.ten_loai,
             pb.ten_phong_ban,
             tk.so_luong_ton, 
             tk.gia_tri_ton, 
             tk.don_gia_binh_quan,
             tk.sl_tot, 
             tk.sl_kem_pham_chat,
             tk.sl_mat_pham_chat,
             tk.sl_hong,
             tk.sl_can_thanh_ly,
             -- CHỈ LẤY GIÁ TỪ PHIẾU HOÀN THÀNH
             (SELECT ls.don_gia 
              FROM lich_su_gia ls 
              JOIN phieu_nhap pn ON ls.phieu_nhap_id = pn.id
              WHERE ls.hang_hoa_id = h.id 
              AND ls.nguon_gia = 'nhap_kho'
              AND pn.trang_thai = 'completed'
              ORDER BY ls.ngay_ap_dung DESC, ls.created_at DESC 
              LIMIT 1) as gia_nhap_moi_nhat,
             -- CHỈ ĐẾM PHIẾU HOÀN THÀNH
             (SELECT COUNT(DISTINCT pn.id)
              FROM phieu_nhap pn
              JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
              WHERE ctn.hang_hoa_id = h.id 
              AND pn.trang_thai = 'completed') as so_lan_nhap,
             -- CHỈ LẤY NGÀY NHẬP TỪ PHIẾU HOÀN THÀNH
             (SELECT MAX(pn.ngay_nhap)
              FROM phieu_nhap pn
              JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
              WHERE ctn.hang_hoa_id = h.id 
              AND pn.trang_thai = 'completed') as ngay_nhap_gan_nhat
      FROM hang_hoa h
      LEFT JOIN loai_hang_hoa lh ON h.loai_hang_hoa_id = lh.id
      LEFT JOIN phong_ban pb ON h.phong_ban_id = pb.id
      LEFT JOIN ton_kho tk ON h.id = tk.hang_hoa_id 
        AND tk.phong_ban_id = ${
          user.role === "admin" ? "tk.phong_ban_id" : user.phong_ban_id
        }
      ${whereClause}
      ORDER BY h.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(limit, offset);

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, params.slice(0, -2)),
      pool.query(dataQuery, params),
    ]);

    const total = parseInt(countResult.rows[0].count);
    const pages = Math.ceil(total / limit);

    sendResponse(res, 200, true, "Lấy danh sách thành công", {
      items: dataResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages,
      },
    });
  } catch (error) {
    console.error("Get hang hoa list error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const getDetail = async (req, res, params, user) => {
  try {
    const { id } = params;

    // Query lấy thông tin chi tiết hàng hóa
    const detailQuery = `
      SELECT h.*, 
             lh.ten_loai,
             pb.ten_phong_ban,
             tk.so_luong_ton, 
             tk.gia_tri_ton, 
             tk.don_gia_binh_quan,
             tk.sl_tot, 
             tk.sl_kem_pham_chat,
             tk.sl_mat_pham_chat,
             tk.sl_hong,
             tk.sl_can_thanh_ly
      FROM hang_hoa h
      LEFT JOIN loai_hang_hoa lh ON h.loai_hang_hoa_id = lh.id
      LEFT JOIN phong_ban pb ON h.phong_ban_id = pb.id
      LEFT JOIN ton_kho tk ON h.id = tk.hang_hoa_id 
        AND tk.phong_ban_id = ${
          user.role === "admin" ? "tk.phong_ban_id" : user.phong_ban_id
        }
      WHERE h.id = $1
    `;

    // CHỈ LẤY LỊCH SỬ GIÁ TỪ PHIẾU HOÀN THÀNH
    const priceHistoryQuery = `
      SELECT ls.*, pn.so_phieu, pn.ngay_nhap, pn.trang_thai,
             ncc.ten_ncc
      FROM lich_su_gia ls
      JOIN phieu_nhap pn ON ls.phieu_nhap_id = pn.id
      LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
      WHERE ls.hang_hoa_id = $1
      AND pn.trang_thai = 'completed'
      ORDER BY ls.ngay_ap_dung DESC, ls.created_at DESC
      LIMIT 20
    `;

    // CHỈ LẤY SỐ SERI TỪ PHIẾU HOÀN THÀNH
    const seriQuery = `
      SELECT hhs.so_seri, hhs.don_gia, pn.ngay_nhap, hhs.trang_thai, hhs.pham_chat,
             pn.so_phieu
      FROM hang_hoa_seri hhs
      JOIN phieu_nhap pn ON hhs.phieu_nhap_id = pn.id
      WHERE hhs.hang_hoa_id = $1
      AND pn.trang_thai = 'completed'
      ORDER BY pn.ngay_nhap DESC, hhs.created_at DESC
      LIMIT 50
    `;

    const importBatchesQuery = `
  SELECT 
    pn.id, pn.so_phieu, pn.ngay_nhap, pn.trang_thai,
    ncc.ten_ncc,
    ctn.so_luong, ctn.don_gia, ctn.thanh_tien, ctn.pham_chat,
    ctn.so_seri_list,
    ctn.han_su_dung, ctn.vi_tri_kho, ctn.ghi_chu,
    seri_data.danh_diem
  FROM phieu_nhap pn
  JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
  LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
  LEFT JOIN (
    SELECT 
      hhs.hang_hoa_id,
      hhs.phieu_nhap_id,
      string_agg(hhs.so_seri, ', ' ORDER BY hhs.so_seri) as danh_diem
    FROM hang_hoa_seri hhs
    GROUP BY hhs.hang_hoa_id, hhs.phieu_nhap_id
  ) seri_data ON seri_data.hang_hoa_id = $1 AND seri_data.phieu_nhap_id = pn.id
  WHERE ctn.hang_hoa_id = $1
  AND pn.trang_thai = 'completed'
  ORDER BY pn.ngay_nhap DESC, pn.created_at DESC
`;
    // THÊM QUERY CHO LỊCH SỬ XUẤT (CHỈ PHIẾU HOÀN THÀNH)
    const exportHistoryQuery = `
      SELECT px.so_phieu, px.ngay_xuat, px.trang_thai,
             dvn.ten_don_vi,
             ctx.so_luong_yeu_cau, ctx.so_luong_thuc_xuat, 
             ctx.don_gia, ctx.thanh_tien, ctx.pham_chat,
             ctx.so_seri_xuat, ctx.ghi_chu
      FROM phieu_xuat px
      JOIN chi_tiet_xuat ctx ON px.id = ctx.phieu_xuat_id
      LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id
      WHERE ctx.hang_hoa_id = $1
      AND px.trang_thai = 'completed'
      ORDER BY px.ngay_xuat DESC, px.created_at DESC
      LIMIT 50
    `;

    // Query thống kê theo thời gian cho nhập hàng - CHỈ PHIẾU HOÀN THÀNH
    const importStatsQuery = `
      SELECT 
        -- Thống kê theo tháng (12 tháng gần nhất)
        (SELECT json_agg(
          json_build_object(
            'thang', thang_data.thang,
            'nam', thang_data.nam,
            'so_luong_nhap', thang_data.so_luong_nhap,
            'so_phieu_nhap', thang_data.so_phieu_nhap,
            'gia_tri_nhap', thang_data.gia_tri_nhap
          ) ORDER BY thang_data.nam DESC, thang_data.thang DESC
        ) FROM (
          SELECT 
            EXTRACT(MONTH FROM pn.ngay_nhap) as thang,
            EXTRACT(YEAR FROM pn.ngay_nhap) as nam,
            SUM(ctn.so_luong) as so_luong_nhap,
            COUNT(DISTINCT pn.id) as so_phieu_nhap,
            SUM(ctn.thanh_tien) as gia_tri_nhap
          FROM phieu_nhap pn
          JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
          WHERE ctn.hang_hoa_id = $1 
          AND pn.trang_thai = 'completed'
          AND pn.ngay_nhap >= CURRENT_DATE - INTERVAL '12 months'
          GROUP BY EXTRACT(MONTH FROM pn.ngay_nhap), EXTRACT(YEAR FROM pn.ngay_nhap)
          ORDER BY nam DESC, thang DESC
          LIMIT 12
        ) thang_data) as thong_ke_thang,
        
        -- Thống kê theo quý (4 quý gần nhất)
        (SELECT json_agg(
          json_build_object(
            'quy', quy_data.quy,
            'nam', quy_data.nam,
            'so_luong_nhap', quy_data.so_luong_nhap,
            'so_phieu_nhap', quy_data.so_phieu_nhap,
            'gia_tri_nhap', quy_data.gia_tri_nhap
          ) ORDER BY quy_data.nam DESC, quy_data.quy DESC
        ) FROM (
          SELECT 
            EXTRACT(QUARTER FROM pn.ngay_nhap) as quy,
            EXTRACT(YEAR FROM pn.ngay_nhap) as nam,
            SUM(ctn.so_luong) as so_luong_nhap,
            COUNT(DISTINCT pn.id) as so_phieu_nhap,
            SUM(ctn.thanh_tien) as gia_tri_nhap
          FROM phieu_nhap pn
          JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
          WHERE ctn.hang_hoa_id = $1 
          AND pn.trang_thai = 'completed'
          AND pn.ngay_nhap >= CURRENT_DATE - INTERVAL '15 months'
          GROUP BY EXTRACT(QUARTER FROM pn.ngay_nhap), EXTRACT(YEAR FROM pn.ngay_nhap)
          ORDER BY nam DESC, quy DESC
          LIMIT 4
        ) quy_data) as thong_ke_quy,
        
        -- Thống kê theo năm (3 năm gần nhất)
        (SELECT json_agg(
          json_build_object(
            'nam', nam_data.nam,
            'so_luong_nhap', nam_data.so_luong_nhap,
            'so_phieu_nhap', nam_data.so_phieu_nhap,
            'gia_tri_nhap', nam_data.gia_tri_nhap
          ) ORDER BY nam_data.nam DESC
        ) FROM (
          SELECT 
            EXTRACT(YEAR FROM pn.ngay_nhap) as nam,
            SUM(ctn.so_luong) as so_luong_nhap,
            COUNT(DISTINCT pn.id) as so_phieu_nhap,
            SUM(ctn.thanh_tien) as gia_tri_nhap
          FROM phieu_nhap pn
          JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
          WHERE ctn.hang_hoa_id = $1 
          AND pn.trang_thai = 'completed'
          AND pn.ngay_nhap >= CURRENT_DATE - INTERVAL '3 years'
          GROUP BY EXTRACT(YEAR FROM pn.ngay_nhap)
          ORDER BY nam DESC
          LIMIT 3
        ) nam_data) as thong_ke_nam
    `;

    // Query thống kê cho xuất hàng - CHỈ PHIẾU HOÀN THÀNH
    const exportStatsQuery = `
      SELECT 
        -- Tổng số lượng đã xuất
        COALESCE(SUM(ctx.so_luong_thuc_xuat), 0) as tong_da_xuat,
        
        -- Thống kê theo tháng (12 tháng gần nhất)
        (SELECT json_agg(
          json_build_object(
            'thang', xuat_thang.thang,
            'nam', xuat_thang.nam,
            'so_luong_xuat', COALESCE(xuat_thang.so_luong_xuat, 0),
            'so_phieu_xuat', COALESCE(xuat_thang.so_phieu_xuat, 0),
            'gia_tri_xuat', COALESCE(xuat_thang.gia_tri_xuat, 0)
          ) ORDER BY xuat_thang.nam DESC, xuat_thang.thang DESC
        ) FROM (
          SELECT 
            EXTRACT(MONTH FROM px.ngay_xuat) as thang,
            EXTRACT(YEAR FROM px.ngay_xuat) as nam,
            SUM(ctx_sub.so_luong_thuc_xuat) as so_luong_xuat,
            COUNT(DISTINCT px.id) as so_phieu_xuat,
            SUM(ctx_sub.so_luong_thuc_xuat * ctx_sub.don_gia) as gia_tri_xuat
          FROM phieu_xuat px
          JOIN chi_tiet_xuat ctx_sub ON px.id = ctx_sub.phieu_xuat_id
          WHERE ctx_sub.hang_hoa_id = $1 
          AND px.trang_thai = 'completed'
          AND px.ngay_xuat >= CURRENT_DATE - INTERVAL '12 months'
          GROUP BY EXTRACT(MONTH FROM px.ngay_xuat), EXTRACT(YEAR FROM px.ngay_xuat)
          ORDER BY nam DESC, thang DESC
          LIMIT 12
        ) xuat_thang) as thong_ke_xuat_thang,
        
        -- Thống kê theo quý (4 quý gần nhất)
        (SELECT json_agg(
          json_build_object(
            'quy', xuat_quy.quy,
            'nam', xuat_quy.nam,
            'so_luong_xuat', xuat_quy.so_luong_xuat,
            'so_phieu_xuat', xuat_quy.so_phieu_xuat,
            'gia_tri_xuat', xuat_quy.gia_tri_xuat
          ) ORDER BY xuat_quy.nam DESC, xuat_quy.quy DESC
        ) FROM (
          SELECT 
            EXTRACT(QUARTER FROM px.ngay_xuat) as quy,
            EXTRACT(YEAR FROM px.ngay_xuat) as nam,
            SUM(ctx_sub2.so_luong_thuc_xuat) as so_luong_xuat,
            COUNT(DISTINCT px.id) as so_phieu_xuat,
            SUM(ctx_sub2.so_luong_thuc_xuat * ctx_sub2.don_gia) as gia_tri_xuat
          FROM phieu_xuat px
          JOIN chi_tiet_xuat ctx_sub2 ON px.id = ctx_sub2.phieu_xuat_id
          WHERE ctx_sub2.hang_hoa_id = $1 
          AND px.trang_thai = 'completed'
          AND px.ngay_xuat >= CURRENT_DATE - INTERVAL '15 months'
          GROUP BY EXTRACT(QUARTER FROM px.ngay_xuat), EXTRACT(YEAR FROM px.ngay_xuat)
          ORDER BY nam DESC, quy DESC
          LIMIT 4
        ) xuat_quy) as thong_ke_xuat_quy,
        
        -- Thống kê theo năm (3 năm gần nhất)
        (SELECT json_agg(
          json_build_object(
            'nam', xuat_nam.nam,
            'so_luong_xuat', xuat_nam.so_luong_xuat,
            'so_phieu_xuat', xuat_nam.so_phieu_xuat,
            'gia_tri_xuat', xuat_nam.gia_tri_xuat
          ) ORDER BY xuat_nam.nam DESC
        ) FROM (
          SELECT 
            EXTRACT(YEAR FROM px.ngay_xuat) as nam,
            SUM(ctx_sub3.so_luong_thuc_xuat) as so_luong_xuat,
            COUNT(DISTINCT px.id) as so_phieu_xuat,
            SUM(ctx_sub3.so_luong_thuc_xuat * ctx_sub3.don_gia) as gia_tri_xuat
          FROM phieu_xuat px
          JOIN chi_tiet_xuat ctx_sub3 ON px.id = ctx_sub3.phieu_xuat_id
          WHERE ctx_sub3.hang_hoa_id = $1 
          AND px.trang_thai = 'completed'
          AND px.ngay_xuat >= CURRENT_DATE - INTERVAL '3 years'
          GROUP BY EXTRACT(YEAR FROM px.ngay_xuat)
          ORDER BY nam DESC
          LIMIT 3
        ) xuat_nam) as thong_ke_xuat_nam
      FROM chi_tiet_xuat ctx
      JOIN phieu_xuat px ON ctx.phieu_xuat_id = px.id
      WHERE ctx.hang_hoa_id = $1 
      AND px.trang_thai = 'completed'
    `;

    const [
      detailResult,
      priceHistoryResult,
      seriResult,
      importBatchesResult,
      exportHistoryResult,
      importStatsResult,
      exportStatsResult,
    ] = await Promise.all([
      pool.query(detailQuery, [id]),
      pool.query(priceHistoryQuery, [id]),
      pool.query(seriQuery, [id]),
      pool.query(importBatchesQuery, [id]),
      pool.query(exportHistoryQuery, [id]),
      pool.query(importStatsQuery, [id]),
      pool.query(exportStatsQuery, [id]),
    ]);

    if (detailResult.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy hàng hóa");
    }

    // Kiểm tra quyền xem
    const hangHoa = detailResult.rows[0];
    if (user.role !== "admin" && hangHoa.phong_ban_id !== user.phong_ban_id) {
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền xem hàng hóa này"
      );
    }

    // Tính tổng số lượng đã nhập CHỈ TỪ PHIẾU HOÀN THÀNH
    const tongDaNhap = importBatchesResult.rows.reduce(
      (sum, batch) => sum + parseFloat(batch.so_luong || 0),
      0
    );

    // Cấu trúc dữ liệu trả về
    const result = {
      ...hangHoa,
      lich_su_gia: priceHistoryResult.rows,
      lich_su_xuat: exportHistoryResult.rows, // THÊM LỊCH SỬ XUẤT
      danh_sach_seri: seriResult.rows,
      cac_dot_nhap: importBatchesResult.rows,
      thong_ke: {
        // Thông tin tổng quan
        tong_con_ton: hangHoa.so_luong_ton || 0,
        tong_da_xuat: exportStatsResult.rows[0]?.tong_da_xuat || 0,
        tong_da_nhap: tongDaNhap,

        // Thống kê nhập theo thời gian
        nhap_theo_thang: importStatsResult.rows[0]?.thong_ke_thang || [],
        nhap_theo_quy: importStatsResult.rows[0]?.thong_ke_quy || [],
        nhap_theo_nam: importStatsResult.rows[0]?.thong_ke_nam || [],

        // Thống kê xuất theo thời gian
        xuat_theo_thang: exportStatsResult.rows[0]?.thong_ke_xuat_thang || [],
        xuat_theo_quy: exportStatsResult.rows[0]?.thong_ke_xuat_quy || [],
        xuat_theo_nam: exportStatsResult.rows[0]?.thong_ke_xuat_nam || [],

        // Thông tin cũ (CHỈ TỪ PHIẾU HOÀN THÀNH)
        tong_so_lan_nhap: importBatchesResult.rows.length,
        gia_cao_nhat:
          priceHistoryResult.rows.length > 0
            ? Math.max(
                ...priceHistoryResult.rows.map((p) =>
                  parseFloat(p.don_gia || 0)
                )
              )
            : 0,
        gia_thap_nhat:
          priceHistoryResult.rows.length > 0
            ? Math.min(
                ...priceHistoryResult.rows.map((p) =>
                  parseFloat(p.don_gia || 0)
                )
              )
            : 0,
        so_seri_ton_tai: seriResult.rows.filter(
          (s) => s.trang_thai === "ton_kho"
        ).length,
        so_seri_da_xuat: seriResult.rows.filter(
          (s) => s.trang_thai === "da_xuat"
        ).length,
      },
    };

    sendResponse(res, 200, true, "Lấy chi tiết thành công", result);
  } catch (error) {
    console.error("Get hang hoa detail error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const getSuggestions = async (req, res, query, user) => {
  try {
    const { search = "", limit = 10 } = query;

    let whereClause = "WHERE h.trang_thai = 'active'";
    const params = [search, search];

    if (search) {
      whereClause +=
        " AND (h.ten_hang_hoa ILIKE '%' || $1 || '%' OR h.ma_hang_hoa ILIKE '%' || $2 || '%')";
    }

    // Phân quyền theo phòng ban
    if (user.role !== "admin") {
      whereClause += " AND h.phong_ban_id = $3";
      params.push(user.phong_ban_id);
    }

    const suggestionQuery = `
      SELECT h.id, h.ma_hang_hoa, h.ten_hang_hoa, h.don_vi_tinh, 
             h.co_so_seri, h.gia_nhap_gan_nhat,
             lh.ten_loai,
             tk.so_luong_ton, tk.sl_tot, tk.sl_kem_pham_chat,
             tk.don_gia_binh_quan
      FROM hang_hoa h
      LEFT JOIN loai_hang_hoa lh ON h.loai_hang_hoa_id = lh.id
      LEFT JOIN ton_kho tk ON h.id = tk.hang_hoa_id 
        AND tk.phong_ban_id = ${
          user.role === "admin" ? "tk.phong_ban_id" : user.phong_ban_id
        }
      ${whereClause}
      ORDER BY h.ten_hang_hoa ASC
      LIMIT ${params.length + 1}
    `;

    params.push(limit);
    const result = await pool.query(suggestionQuery, params);

    sendResponse(res, 200, true, "Lấy gợi ý thành công", result.rows);
  } catch (error) {
    console.error("Get suggestions error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const create = async (req, res, body, user) => {
  try {
    const {
      ma_hang_hoa,
      ten_hang_hoa,
      loai_hang_hoa_id,
      don_vi_tinh,
      mo_ta_ky_thuat,
      co_so_seri = false,
      theo_doi_pham_chat = true,
      phong_ban_id,
      // ghi_chu,  // <-- BỎ DÒNG NÀY
    } = body;

    // Validation
    if (!ma_hang_hoa || !ten_hang_hoa || !don_vi_tinh) {
      return sendResponse(res, 400, false, "Thiếu thông tin bắt buộc");
    }

    // Kiểm tra quyền tạo cho phòng ban
    const targetPhongBanId = phong_ban_id || user.phong_ban_id;
    if (user.role !== "admin" && targetPhongBanId !== user.phong_ban_id) {
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền tạo hàng hóa cho phòng ban này"
      );
    }

    // Kiểm tra trùng mã hàng hóa
    const existingQuery = `
      SELECT id FROM hang_hoa 
      WHERE ma_hang_hoa = $1 AND trang_thai = 'active'
    `;
    const existingResult = await pool.query(existingQuery, [ma_hang_hoa]);

    if (existingResult.rows.length > 0) {
      return sendResponse(res, 400, false, "Mã hàng hóa đã tồn tại");
    }

    const insertQuery = `
      INSERT INTO hang_hoa (
        ma_hang_hoa, ten_hang_hoa, loai_hang_hoa_id, don_vi_tinh, 
        mo_ta_ky_thuat, co_so_seri, theo_doi_pham_chat, phong_ban_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      ma_hang_hoa,
      ten_hang_hoa,
      loai_hang_hoa_id,
      don_vi_tinh,
      mo_ta_ky_thuat,
      co_so_seri,
      theo_doi_pham_chat,
      targetPhongBanId,
      // ghi_chu,  // <-- BỎ DÒNG NÀY
    ]);

    sendResponse(res, 201, true, "Tạo hàng hóa thành công", result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      // Unique violation
      return sendResponse(res, 400, false, "Mã hàng hóa đã tồn tại");
    }
    console.error("Create hang hoa error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const update = async (req, res, params, body, user) => {
  try {
    const { id } = params;
    const {
      ma_hang_hoa,
      ten_hang_hoa,
      loai_hang_hoa_id,
      don_vi_tinh,
      mo_ta_ky_thuat,
      co_so_seri = false,
      theo_doi_pham_chat = true,
      // ghi_chu,  // <-- BỎ DÒNG NÀY
    } = body;

    // Validation
    if (!ma_hang_hoa || !ten_hang_hoa || !don_vi_tinh) {
      return sendResponse(res, 400, false, "Thiếu thông tin bắt buộc");
    }

    // Kiểm tra hàng hóa có tồn tại không
    const checkQuery = `
      SELECT * FROM hang_hoa 
      WHERE id = $1 AND trang_thai = 'active'
    `;
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy hàng hóa");
    }

    const hangHoa = checkResult.rows[0];

    // Kiểm tra quyền chỉnh sửa
    if (user.role !== "admin" && hangHoa.phong_ban_id !== user.phong_ban_id) {
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền chỉnh sửa hàng hóa này"
      );
    }

    // Kiểm tra trùng mã hàng hóa (ngoại trừ chính nó)
    const duplicateQuery = `
      SELECT id FROM hang_hoa 
      WHERE ma_hang_hoa = $1 AND id != $2 AND trang_thai = 'active'
    `;
    const duplicateResult = await pool.query(duplicateQuery, [ma_hang_hoa, id]);

    if (duplicateResult.rows.length > 0) {
      return sendResponse(res, 400, false, "Mã hàng hóa đã tồn tại");
    }

    // Kiểm tra xem có thể thay đổi cấu hình số seri không
    if (hangHoa.co_so_seri !== co_so_seri) {
      // Kiểm tra xem đã có giao dịch nào chưa
      const transactionQuery = `
        SELECT COUNT(*) as count FROM (
          SELECT 1 FROM chi_tiet_nhap WHERE hang_hoa_id = $1
          UNION ALL
          SELECT 1 FROM chi_tiet_xuat WHERE hang_hoa_id = $1
        ) t
      `;
      const transactionResult = await pool.query(transactionQuery, [id]);

      if (parseInt(transactionResult.rows[0].count) > 0) {
        return sendResponse(
          res,
          400,
          false,
          "Không thể thay đổi cấu hình số seri vì hàng hóa đã có giao dịch"
        );
      }
    }

    const updateQuery = `
      UPDATE hang_hoa 
      SET ma_hang_hoa = $1, 
          ten_hang_hoa = $2, 
          loai_hang_hoa_id = $3, 
          don_vi_tinh = $4,
          mo_ta_ky_thuat = $5, 
          co_so_seri = $6, 
          theo_doi_pham_chat = $7,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      ma_hang_hoa,
      ten_hang_hoa,
      loai_hang_hoa_id,
      don_vi_tinh,
      mo_ta_ky_thuat,
      co_so_seri,
      theo_doi_pham_chat,
      // ghi_chu,  // <-- BỎ DÒNG NÀY
      id,
    ]);

    sendResponse(
      res,
      200,
      true,
      "Cập nhật hàng hóa thành công",
      result.rows[0]
    );
  } catch (error) {
    if (error.code === "23505") {
      return sendResponse(res, 400, false, "Mã hàng hóa đã tồn tại");
    }
    console.error("Update hang hoa error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const deleteHangHoa = async (req, res, params, user) => {
  try {
    const { id } = params;

    // Kiểm tra hàng hóa có tồn tại không
    const checkQuery = `
      SELECT * FROM hang_hoa 
      WHERE id = $1 AND trang_thai = 'active'
    `;
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy hàng hóa");
    }

    const hangHoa = checkResult.rows[0];

    // Kiểm tra quyền xóa
    if (user.role !== "admin" && hangHoa.phong_ban_id !== user.phong_ban_id) {
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền xóa hàng hóa này"
      );
    }

    // Kiểm tra xem có giao dịch nào không
    const transactionQuery = `
      SELECT COUNT(*) as count FROM (
        SELECT 1 FROM chi_tiet_nhap WHERE hang_hoa_id = $1
        UNION ALL
        SELECT 1 FROM chi_tiet_xuat WHERE hang_hoa_id = $1
      ) t
    `;
    const transactionResult = await pool.query(transactionQuery, [id]);

    if (parseInt(transactionResult.rows[0].count) > 0) {
      return sendResponse(
        res,
        400,
        false,
        "Không thể xóa hàng hóa đã có giao dịch. Bạn có thể ngưng sử dụng thay vì xóa."
      );
    }

    // Kiểm tra tồn kho
    const inventoryQuery = `
      SELECT SUM(so_luong_ton) as total_ton FROM ton_kho WHERE hang_hoa_id = $1
    `;
    const inventoryResult = await pool.query(inventoryQuery, [id]);
    const totalTon = parseFloat(inventoryResult.rows[0]?.total_ton || 0);

    if (totalTon > 0) {
      return sendResponse(
        res,
        400,
        false,
        "Không thể xóa hàng hóa còn tồn kho"
      );
    }

    // Soft delete
    const deleteQuery = `
      UPDATE hang_hoa 
      SET trang_thai = 'deleted', 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ma_hang_hoa, ten_hang_hoa
    `;

    const result = await pool.query(deleteQuery, [id]);

    sendResponse(res, 200, true, "Xóa hàng hóa thành công", {
      deleted_item: result.rows[0],
    });
  } catch (error) {
    console.error("Delete hang hoa error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

module.exports = {
  getList,
  getDetail,
  getSuggestions,
  create,
  update,
  delete: deleteHangHoa,
};
