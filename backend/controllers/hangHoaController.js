const pool = require("../config/database");
const { sendResponse } = require("../utils/response");

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
    ncc.ten_ncc, pb.ten_phong_ban,
    ctn.so_luong, ctn.don_gia, ctn.thanh_tien, ctn.pham_chat,
    ctn.so_seri_list,
    ctn.han_su_dung, ctn.vi_tri_kho, ctn.ghi_chu,
    seri_data.danh_diem
  FROM phieu_nhap pn
  JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
  LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
  LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
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
             dvn.ten_don_vi, pb.ten_phong_ban,
             ctx.so_luong_yeu_cau, ctx.so_luong_thuc_xuat, 
             ctx.don_gia, ctx.thanh_tien, ctx.pham_chat,
             ctx.so_seri_xuat, ctx.ghi_chu
      FROM phieu_xuat px
      JOIN chi_tiet_xuat ctx ON px.id = ctx.phieu_xuat_id
      LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id
      LEFT JOIN phong_ban pb ON px.phong_ban_id = pb.id
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

    // Admin có thể xem tất cả
    if (user.role === "admin") {
      // Không cần kiểm tra gì thêm
    }
    // Manager cấp 2 có thể xem hàng hóa của phòng ban mình và các cấp 3 trực thuộc
    else if (user.role === "manager" && user.phong_ban?.cap_bac === 2) {
      // Kiểm tra xem hàng hóa có thuộc phòng ban mà manager quản lý không
      const permissionCheck = await pool.query(
        `
        SELECT pb.id 
        FROM phong_ban pb 
        WHERE pb.id = $1 
        AND (pb.id = $2 OR pb.phong_ban_cha_id = $2)
      `,
        [hangHoa.phong_ban_id, user.phong_ban_id]
      );

      if (permissionCheck.rows.length === 0) {
        return sendResponse(
          res,
          403,
          false,
          "Bạn không có quyền xem hàng hóa này"
        );
      }
    }
    // User thường chỉ xem được hàng hóa của phòng ban mình
    // Nếu hàng hóa có phong_ban_id = null, cho phép xem (hàng hóa chung)
    else if (
      hangHoa.phong_ban_id !== null &&
      hangHoa.phong_ban_id !== user.phong_ban_id
    ) {
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

const getPhongBanListForFilter = async (req, res, user) => {
  try {
    let query;
    const params = [];

    // Admin thấy tất cả phòng ban
    if (user.role === "admin") {
      query = `
        SELECT id, ten_phong_ban, cap_bac 
        FROM phong_ban 
        WHERE is_active = TRUE 
        ORDER BY cap_bac, thu_tu_hien_thi, ten_phong_ban
      `;
    }
    // Manager thấy phòng ban của mình và các cấp 3 trực thuộc
    else if (user.phong_ban.cap_bac === 2) {
      query = `
        SELECT id, ten_phong_ban, cap_bac 
        FROM phong_ban 
        WHERE is_active = TRUE AND (id = $1 OR phong_ban_cha_id = $1)
        ORDER BY cap_bac, thu_tu_hien_thi, ten_phong_ban
      `;
      params.push(user.phong_ban_id);
    }
    // User cấp 3 chỉ thấy phòng ban của mình
    else {
      query = `
        SELECT id, ten_phong_ban, cap_bac 
        FROM phong_ban 
        WHERE is_active = TRUE AND id = $1
      `;
      params.push(user.phong_ban_id);
    }

    const result = await pool.query(query, params);
    sendResponse(
      res,
      200,
      true,
      "Lấy danh sách phòng ban thành công",
      result.rows
    );
  } catch (error) {
    console.error("Get Phong Ban List For Filter error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

// const getDetailByPhongBan = async (req, res, params, user) => {
//   try {
//     const { id, phongBanId } = params;

//     // VALIDATION: Kiểm tra tham số đầu vào
//     if (!id || !phongBanId) {
//       return sendResponse(
//         res,
//         400,
//         false,
//         "Thiếu thông tin hangHoaId hoặc phongBanId"
//       );
//     }

//     // VALIDATION: Kiểm tra id và phongBanId là số hợp lệ
//     const hangHoaId = parseInt(id);
//     const phongBan = parseInt(phongBanId);

//     if (isNaN(hangHoaId) || isNaN(phongBan)) {
//       return sendResponse(
//         res,
//         400,
//         false,
//         "hangHoaId và phongBanId phải là số nguyên hợp lệ"
//       );
//     }

//     // KIỂM TRA QUYỀN TRUY CẬP: User chỉ xem được phòng ban của mình
//     if (user.role === "user" && user.phong_ban_id !== phongBan) {
//       return sendResponse(
//         res,
//         403,
//         false,
//         "Bạn không có quyền xem chi tiết hàng hóa của phòng ban khác"
//       );
//     }

//     // KIỂM TRA QUYỀN TRUY CẬP: Manager chỉ xem được phòng ban cấp 3 thuộc quyền
//     if (user.role === "manager") {
//       const permissionCheck = await pool.query(
//         `
//         SELECT pb.id
//         FROM phong_ban pb
//         WHERE pb.id = $1
//         AND (pb.id = $2 OR pb.phong_ban_cha_id = $2)
//       `,
//         [phongBan, user.phong_ban_id]
//       );

//       if (permissionCheck.rows.length === 0) {
//         return sendResponse(
//           res,
//           403,
//           false,
//           "Bạn không có quyền xem chi tiết hàng hóa của phòng ban này"
//         );
//       }
//     }

//     const [
//       detailResult,
//       priceHistoryResult,
//       seriResult,
//       importBatchesResult,
//       exportHistoryResult,
//       importStatsResult,
//       exportStatsResult,
//     ] = await Promise.all([
//       pool.query(
//         `
//         SELECT h.*, lh.ten_loai, pb.ten_phong_ban, tk.so_luong_ton, tk.gia_tri_ton, tk.don_gia_binh_quan,
//                tk.sl_tot, tk.sl_kem_pham_chat, tk.sl_mat_pham_chat, tk.sl_hong, tk.sl_can_thanh_ly
//         FROM hang_hoa h
//         LEFT JOIN loai_hang_hoa lh ON h.loai_hang_hoa_id = lh.id
//         LEFT JOIN ton_kho tk ON h.id = tk.hang_hoa_id AND tk.phong_ban_id = $2
//         LEFT JOIN phong_ban pb ON tk.phong_ban_id = pb.id
//         WHERE h.id = $1`,
//         [hangHoaId, phongBan]
//       ),
//       pool.query(
//         `
//         SELECT ls.*, pn.so_phieu, pn.ngay_nhap, pn.trang_thai, ncc.ten_ncc
//         FROM lich_su_gia ls
//         JOIN phieu_nhap pn ON ls.phieu_nhap_id = pn.id
//         LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
//         WHERE ls.hang_hoa_id = $1 AND pn.phong_ban_id = $2 AND pn.trang_thai = 'completed'
//         ORDER BY ls.ngay_ap_dung DESC, ls.created_at DESC LIMIT 20`,
//         [hangHoaId, phongBan]
//       ),
//       pool.query(
//         `
//         SELECT hhs.so_seri, hhs.don_gia, pn.ngay_nhap, hhs.trang_thai, hhs.pham_chat, pn.so_phieu
//         FROM hang_hoa_seri hhs
//         JOIN phieu_nhap pn ON hhs.phieu_nhap_id = pn.id
//         WHERE hhs.hang_hoa_id = $1 AND pn.phong_ban_id = $2 AND pn.trang_thai = 'completed'
//         ORDER BY pn.ngay_nhap DESC, hhs.created_at DESC LIMIT 50`,
//         [hangHoaId, phongBan]
//       ),
//       pool.query(
//         `
//         SELECT pn.id, pn.so_phieu, pn.ngay_nhap, pn.trang_thai, ncc.ten_ncc, ctn.*
//         FROM phieu_nhap pn
//         JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
//         LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
//         WHERE ctn.hang_hoa_id = $1 AND pn.phong_ban_id = $2 AND pn.trang_thai = 'completed'
//         ORDER BY pn.ngay_nhap DESC, pn.created_at DESC`,
//         [hangHoaId, phongBan]
//       ),
//       pool.query(
//         `
//         SELECT px.so_phieu, px.ngay_xuat, px.trang_thai, dvn.ten_don_vi, ctx.so_luong_thuc_xuat as so_luong_xuat,
//                ctx.don_gia, ctx.ghi_chu
//         FROM phieu_xuat px
//         JOIN chi_tiet_xuat ctx ON px.id = ctx.phieu_xuat_id
//         LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id
//         WHERE ctx.hang_hoa_id = $1 AND px.phong_ban_id = $2 AND px.trang_thai = 'completed'
//         ORDER BY px.ngay_xuat DESC, px.created_at DESC LIMIT 20`,
//         [hangHoaId, phongBan]
//       ),
//       // Stats nhập theo phòng ban cụ thể
//       pool.query(
//         `
//         SELECT
//           json_agg(
//             json_build_object(
//               'thang', EXTRACT(MONTH FROM pn.ngay_nhap),
//               'nam', EXTRACT(YEAR FROM pn.ngay_nhap),
//               'tong_so_luong', SUM(ctn.so_luong),
//               'tong_gia_tri', SUM(ctn.so_luong * ctn.don_gia)
//             ) ORDER BY EXTRACT(YEAR FROM pn.ngay_nhap), EXTRACT(MONTH FROM pn.ngay_nhap)
//           ) FILTER (WHERE pn.ngay_nhap IS NOT NULL) as thong_ke_thang,

//           json_agg(DISTINCT
//             json_build_object(
//               'quy', EXTRACT(QUARTER FROM pn.ngay_nhap),
//               'nam', EXTRACT(YEAR FROM pn.ngay_nhap),
//               'tong_so_luong', SUM(ctn.so_luong) OVER (PARTITION BY EXTRACT(QUARTER FROM pn.ngay_nhap), EXTRACT(YEAR FROM pn.ngay_nhap)),
//               'tong_gia_tri', SUM(ctn.so_luong * ctn.don_gia) OVER (PARTITION BY EXTRACT(QUARTER FROM pn.ngay_nhap), EXTRACT(YEAR FROM pn.ngay_nhap))
//             ) ORDER BY EXTRACT(YEAR FROM pn.ngay_nhap), EXTRACT(QUARTER FROM pn.ngay_nhap)
//           ) FILTER (WHERE pn.ngay_nhap IS NOT NULL) as thong_ke_quy,

//           json_agg(DISTINCT
//             json_build_object(
//               'nam', EXTRACT(YEAR FROM pn.ngay_nhap),
//               'tong_so_luong', SUM(ctn.so_luong) OVER (PARTITION BY EXTRACT(YEAR FROM pn.ngay_nhap)),
//               'tong_gia_tri', SUM(ctn.so_luong * ctn.don_gia) OVER (PARTITION BY EXTRACT(YEAR FROM pn.ngay_nhap))
//             ) ORDER BY EXTRACT(YEAR FROM pn.ngay_nhap)
//           ) FILTER (WHERE pn.ngay_nhap IS NOT NULL) as thong_ke_nam
//         FROM phieu_nhap pn
//         JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
//         WHERE ctn.hang_hoa_id = $1 AND pn.phong_ban_id = $2 AND pn.trang_thai = 'completed'`,
//         [hangHoaId, phongBan]
//       ),
//       // Stats xuất theo phòng ban cụ thể
//       pool.query(
//         `
//         SELECT
//           COALESCE(SUM(ctx.so_luong_thuc_xuat), 0) as tong_da_xuat,

//           json_agg(
//             json_build_object(
//               'thang', EXTRACT(MONTH FROM px.ngay_xuat),
//               'nam', EXTRACT(YEAR FROM px.ngay_xuat),
//               'tong_so_luong', SUM(ctx.so_luong_thuc_xuat),
//               'tong_gia_tri', SUM(ctx.so_luong_thuc_xuat * ctx.don_gia)
//             ) ORDER BY EXTRACT(YEAR FROM px.ngay_xuat), EXTRACT(MONTH FROM px.ngay_xuat)
//           ) FILTER (WHERE px.ngay_xuat IS NOT NULL) as thong_ke_xuat_thang,

//           json_agg(DISTINCT
//             json_build_object(
//               'quy', EXTRACT(QUARTER FROM px.ngay_xuat),
//               'nam', EXTRACT(YEAR FROM px.ngay_xuat),
//               'tong_so_luong', SUM(ctx.so_luong_thuc_xuat) OVER (PARTITION BY EXTRACT(QUARTER FROM px.ngay_xuat), EXTRACT(YEAR FROM px.ngay_xuat)),
//               'tong_gia_tri', SUM(ctx.so_luong_thuc_xuat * ctx.don_gia) OVER (PARTITION BY EXTRACT(QUARTER FROM px.ngay_xuat), EXTRACT(YEAR FROM px.ngay_xuat))
//             ) ORDER BY EXTRACT(YEAR FROM px.ngay_xuat), EXTRACT(QUARTER FROM px.ngay_xuat)
//           ) FILTER (WHERE px.ngay_xuat IS NOT NULL) as thong_ke_xuat_quy,

//           json_agg(DISTINCT
//             json_build_object(
//               'nam', EXTRACT(YEAR FROM px.ngay_xuat),
//               'tong_so_luong', SUM(ctx.so_luong_thuc_xuat) OVER (PARTITION BY EXTRACT(YEAR FROM px.ngay_xuat)),
//               'tong_gia_tri', SUM(ctx.so_luong_thuc_xuat * ctx.don_gia) OVER (PARTITION BY EXTRACT(YEAR FROM px.ngay_xuat))
//             ) ORDER BY EXTRACT(YEAR FROM px.ngay_xuat)
//           ) FILTER (WHERE px.ngay_xuat IS NOT NULL) as thong_ke_xuat_nam
//         FROM phieu_xuat px
//         JOIN chi_tiet_xuat ctx ON px.id = ctx.phieu_xuat_id
//         WHERE ctx.hang_hoa_id = $1 AND px.phong_ban_id = $2 AND px.trang_thai = 'completed'`,
//         [hangHoaId, phongBan]
//       ),
//     ]);

//     if (detailResult.rows.length === 0) {
//       return sendResponse(
//         res,
//         404,
//         false,
//         "Không tìm thấy hàng hóa trong phòng ban này"
//       );
//     }

//     const hangHoa = detailResult.rows[0];
//     const tongDaNhap = importBatchesResult.rows.reduce(
//       (sum, batch) => sum + parseFloat(batch.so_luong_thuc_nhap || 0),
//       0
//     );

//     const result = {
//       ...hangHoa,
//       lich_su_gia: priceHistoryResult.rows,
//       lich_su_xuat: exportHistoryResult.rows,
//       danh_sach_seri: seriResult.rows,
//       cac_dot_nhap: importBatchesResult.rows,
//       thong_ke: {
//         tong_con_ton: hangHoa.so_luong_ton || 0,
//         tong_da_xuat: exportStatsResult.rows[0]?.tong_da_xuat || 0,
//         tong_da_nhap: tongDaNhap,
//         nhap_theo_thang: importStatsResult.rows[0]?.thong_ke_thang || [],
//         nhap_theo_quy: importStatsResult.rows[0]?.thong_ke_quy || [],
//         nhap_theo_nam: importStatsResult.rows[0]?.thong_ke_nam || [],
//         xuat_theo_thang: exportStatsResult.rows[0]?.thong_ke_xuat_thang || [],
//         xuat_theo_quy: exportStatsResult.rows[0]?.thong_ke_xuat_quy || [],
//         xuat_theo_nam: exportStatsResult.rows[0]?.thong_ke_xuat_nam || [],
//       },
//     };

//     sendResponse(res, 200, true, "Lấy chi tiết thành công", result);
//   } catch (error) {
//     console.error("Get hang hoa detail by phong ban error:", error);
//     sendResponse(res, 500, false, "Lỗi server", { error: error.message });
//   }
// };

const getDetailByPhongBan = async (req, res, params, user) => {
  try {
    const { id, phongBanId } = params;

    if (!id || !phongBanId) {
      return sendResponse(
        res,
        400,
        false,
        "Thiếu thông tin hangHoaId hoặc phongBanId"
      );
    }

    const hangHoaId = parseInt(id);
    const phongBan = parseInt(phongBanId);

    if (isNaN(hangHoaId) || isNaN(phongBan)) {
      return sendResponse(
        res,
        400,
        false,
        "hangHoaId và phongBanId phải là số nguyên hợp lệ"
      );
    }

    if (user.role === "user" && user.phong_ban_id !== phongBan) {
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền xem chi tiết hàng hóa của phòng ban khác"
      );
    }

    if (user.role === "manager") {
      const permissionCheck = await pool.query(
        `
        SELECT pb.id 
        FROM phong_ban pb 
        WHERE pb.id = $1 
        AND (pb.id = $2 OR pb.phong_ban_cha_id = $2)
      `,
        [phongBan, user.phong_ban_id]
      );

      if (permissionCheck.rows.length === 0) {
        return sendResponse(
          res,
          403,
          false,
          "Bạn không có quyền xem chi tiết hàng hóa của phòng ban này"
        );
      }
    }

    const [
      detailResult,
      priceHistoryResult,
      seriResult,
      importBatchesResult,
      exportHistoryResult,
      importStatsResult,
      exportStatsResult,
    ] = await Promise.all([
      pool.query(
        `
        SELECT h.*, lh.ten_loai, pb.ten_phong_ban, tk.so_luong_ton, tk.gia_tri_ton, tk.don_gia_binh_quan,
               tk.sl_tot, tk.sl_kem_pham_chat, tk.sl_mat_pham_chat, tk.sl_hong, tk.sl_can_thanh_ly
        FROM hang_hoa h
        LEFT JOIN loai_hang_hoa lh ON h.loai_hang_hoa_id = lh.id
        LEFT JOIN ton_kho tk ON h.id = tk.hang_hoa_id AND tk.phong_ban_id = $2
        LEFT JOIN phong_ban pb ON tk.phong_ban_id = pb.id
        WHERE h.id = $1`,
        [hangHoaId, phongBan]
      ),
      pool.query(
        `
        SELECT ls.*, pn.so_phieu, pn.ngay_nhap, pn.trang_thai, ncc.ten_ncc
        FROM lich_su_gia ls
        JOIN phieu_nhap pn ON ls.phieu_nhap_id = pn.id
        LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
        WHERE ls.hang_hoa_id = $1 AND pn.phong_ban_id = $2 AND pn.trang_thai = 'completed'
        ORDER BY ls.ngay_ap_dung DESC, ls.created_at DESC LIMIT 20`,
        [hangHoaId, phongBan]
      ),
      pool.query(
        `
        SELECT hhs.so_seri, hhs.don_gia, pn.ngay_nhap, hhs.trang_thai, hhs.pham_chat, pn.so_phieu
        FROM hang_hoa_seri hhs
        JOIN phieu_nhap pn ON hhs.phieu_nhap_id = pn.id
        WHERE hhs.hang_hoa_id = $1 AND pn.phong_ban_id = $2 AND pn.trang_thai = 'completed'
        ORDER BY pn.ngay_nhap DESC, hhs.created_at DESC LIMIT 50`,
        [hangHoaId, phongBan]
      ),
      pool.query(
        `
        SELECT pn.id, pn.so_phieu, pn.ngay_nhap, pn.trang_thai, ncc.ten_ncc, ctn.*
        FROM phieu_nhap pn
        JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
        LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
        WHERE ctn.hang_hoa_id = $1 AND pn.phong_ban_id = $2 AND pn.trang_thai = 'completed'
        ORDER BY pn.ngay_nhap DESC, pn.created_at DESC`,
        [hangHoaId, phongBan]
      ),
      pool.query(
        `
        SELECT px.so_phieu, px.ngay_xuat, px.trang_thai, dvn.ten_don_vi, ctx.so_luong_thuc_xuat as so_luong_xuat,
               ctx.don_gia, ctx.ghi_chu
        FROM phieu_xuat px
        JOIN chi_tiet_xuat ctx ON px.id = ctx.phieu_xuat_id
        LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id
        WHERE ctx.hang_hoa_id = $1 AND px.phong_ban_id = $2 AND px.trang_thai = 'completed'
        ORDER BY px.ngay_xuat DESC, px.created_at DESC LIMIT 20`,
        [hangHoaId, phongBan]
      ),
      // ✅ SỬA LỖI: Stats nhập theo phòng ban cụ thể
      pool.query(
        `
        SELECT 
          (SELECT json_agg(json_build_object('thang', t.thang, 'nam', t.nam, 'tong_so_luong', t.tong_so_luong, 'tong_gia_tri', t.tong_gia_tri) ORDER BY t.nam DESC, t.thang DESC)
           FROM (
             SELECT EXTRACT(MONTH FROM pn.ngay_nhap) as thang, EXTRACT(YEAR FROM pn.ngay_nhap) as nam, SUM(ctn.so_luong) as tong_so_luong, SUM(ctn.thanh_tien) as tong_gia_tri
             FROM phieu_nhap pn JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
             WHERE ctn.hang_hoa_id = $1 AND pn.phong_ban_id = $2 AND pn.trang_thai = 'completed' AND pn.ngay_nhap >= CURRENT_DATE - INTERVAL '12 months'
             GROUP BY 1, 2
           ) t) as thong_ke_thang,
          (SELECT json_agg(json_build_object('quy', q.quy, 'nam', q.nam, 'tong_so_luong', q.tong_so_luong, 'tong_gia_tri', q.tong_gia_tri) ORDER BY q.nam DESC, q.quy DESC)
           FROM (
             SELECT EXTRACT(QUARTER FROM pn.ngay_nhap) as quy, EXTRACT(YEAR FROM pn.ngay_nhap) as nam, SUM(ctn.so_luong) as tong_so_luong, SUM(ctn.thanh_tien) as tong_gia_tri
             FROM phieu_nhap pn JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
             WHERE ctn.hang_hoa_id = $1 AND pn.phong_ban_id = $2 AND pn.trang_thai = 'completed' AND pn.ngay_nhap >= CURRENT_DATE - INTERVAL '15 months'
             GROUP BY 1, 2
           ) q) as thong_ke_quy,
          (SELECT json_agg(json_build_object('nam', y.nam, 'tong_so_luong', y.tong_so_luong, 'tong_gia_tri', y.tong_gia_tri) ORDER BY y.nam DESC)
           FROM (
             SELECT EXTRACT(YEAR FROM pn.ngay_nhap) as nam, SUM(ctn.so_luong) as tong_so_luong, SUM(ctn.thanh_tien) as tong_gia_tri
             FROM phieu_nhap pn JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
             WHERE ctn.hang_hoa_id = $1 AND pn.phong_ban_id = $2 AND pn.trang_thai = 'completed' AND pn.ngay_nhap >= CURRENT_DATE - INTERVAL '3 years'
             GROUP BY 1
           ) y) as thong_ke_nam
        `,
        [hangHoaId, phongBan]
      ),
      // ✅ SỬA LỖI: Stats xuất theo phòng ban cụ thể
      pool.query(
        `
        SELECT 
          COALESCE(SUM(ctx.so_luong_thuc_xuat), 0) as tong_da_xuat,
          (SELECT json_agg(json_build_object('thang', t.thang, 'nam', t.nam, 'tong_so_luong', t.tong_so_luong, 'tong_gia_tri', t.tong_gia_tri) ORDER BY t.nam DESC, t.thang DESC)
           FROM (
             SELECT EXTRACT(MONTH FROM px.ngay_xuat) as thang, EXTRACT(YEAR FROM px.ngay_xuat) as nam, SUM(ctx.so_luong_thuc_xuat) as tong_so_luong, SUM(ctx.thanh_tien) as tong_gia_tri
             FROM phieu_xuat px JOIN chi_tiet_xuat ctx ON px.id = ctx.phieu_xuat_id
             WHERE ctx.hang_hoa_id = $1 AND px.phong_ban_id = $2 AND px.trang_thai = 'completed' AND px.ngay_xuat >= CURRENT_DATE - INTERVAL '12 months'
             GROUP BY 1, 2
           ) t) as thong_ke_xuat_thang,
          (SELECT json_agg(json_build_object('quy', q.quy, 'nam', q.nam, 'tong_so_luong', q.tong_so_luong, 'tong_gia_tri', q.tong_gia_tri) ORDER BY q.nam DESC, q.quy DESC)
           FROM (
             SELECT EXTRACT(QUARTER FROM px.ngay_xuat) as quy, EXTRACT(YEAR FROM px.ngay_xuat) as nam, SUM(ctx.so_luong_thuc_xuat) as tong_so_luong, SUM(ctx.thanh_tien) as tong_gia_tri
             FROM phieu_xuat px JOIN chi_tiet_xuat ctx ON px.id = ctx.phieu_xuat_id
             WHERE ctx.hang_hoa_id = $1 AND px.phong_ban_id = $2 AND px.trang_thai = 'completed' AND px.ngay_xuat >= CURRENT_DATE - INTERVAL '15 months'
             GROUP BY 1, 2
           ) q) as thong_ke_xuat_quy,
          (SELECT json_agg(json_build_object('nam', y.nam, 'tong_so_luong', y.tong_so_luong, 'tong_gia_tri', y.tong_gia_tri) ORDER BY y.nam DESC)
           FROM (
             SELECT EXTRACT(YEAR FROM px.ngay_xuat) as nam, SUM(ctx.so_luong_thuc_xuat) as tong_so_luong, SUM(ctx.thanh_tien) as tong_gia_tri
             FROM phieu_xuat px JOIN chi_tiet_xuat ctx ON px.id = ctx.phieu_xuat_id
             WHERE ctx.hang_hoa_id = $1 AND px.phong_ban_id = $2 AND px.trang_thai = 'completed' AND px.ngay_xuat >= CURRENT_DATE - INTERVAL '3 years'
             GROUP BY 1
           ) y) as thong_ke_xuat_nam
        FROM phieu_xuat px
        JOIN chi_tiet_xuat ctx ON px.id = ctx.phieu_xuat_id
        WHERE ctx.hang_hoa_id = $1 AND px.phong_ban_id = $2 AND px.trang_thai = 'completed'
        `,
        [hangHoaId, phongBan]
      ),
    ]);

    if (detailResult.rows.length === 0) {
      return sendResponse(
        res,
        404,
        false,
        "Không tìm thấy hàng hóa trong phòng ban này"
      );
    }

    const hangHoa = detailResult.rows[0];
    const tongDaNhap = importBatchesResult.rows.reduce(
      (sum, batch) => sum + parseFloat(batch.so_luong || 0), // Sử dụng so_luong thay vì so_luong_thuc_nhap
      0
    );

    const result = {
      ...hangHoa,
      lich_su_gia: priceHistoryResult.rows,
      lich_su_xuat: exportHistoryResult.rows,
      danh_sach_seri: seriResult.rows,
      cac_dot_nhap: importBatchesResult.rows,
      thong_ke: {
        tong_con_ton: hangHoa.so_luong_ton || 0,
        tong_da_xuat: exportStatsResult.rows[0]?.tong_da_xuat || 0,
        tong_da_nhap: tongDaNhap,
        nhap_theo_thang: importStatsResult.rows[0]?.thong_ke_thang || [],
        nhap_theo_quy: importStatsResult.rows[0]?.thong_ke_quy || [],
        nhap_theo_nam: importStatsResult.rows[0]?.thong_ke_nam || [],
        xuat_theo_thang: exportStatsResult.rows[0]?.thong_ke_xuat_thang || [],
        xuat_theo_quy: exportStatsResult.rows[0]?.thong_ke_xuat_quy || [],
        xuat_theo_nam: exportStatsResult.rows[0]?.thong_ke_xuat_nam || [],
      },
    };

    sendResponse(res, 200, true, "Lấy chi tiết thành công", result);
  } catch (error) {
    console.error("Get hang hoa detail by phong ban error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};
const getInventoryBreakdown = async (req, res, params, user) => {
  try {
    const { id } = params;
    const hangHoaId = parseInt(id);

    if (!hangHoaId || isNaN(hangHoaId)) {
      return sendResponse(res, 400, false, "hangHoaId không hợp lệ");
    }

    // Kiểm tra quyền truy cập
    let whereClause = "";
    let queryParams = [hangHoaId];
    let paramCount = 1;

    if (user.role === "user") {
      // User chỉ xem phòng ban của mình
      paramCount++;
      whereClause = `AND pb.id = $${paramCount}`;
      queryParams.push(user.phong_ban_id);
    } else if (user.role === "manager") {
      // Manager xem các phòng ban cấp 3 thuộc quyền
      paramCount++;
      whereClause = `AND (pb.id = $${paramCount} OR pb.phong_ban_cha_id = $${paramCount})`;
      queryParams.push(user.phong_ban_id);
    }
    // Admin xem tất cả (không có whereClause)

    const query = `
      SELECT 
        pb.id as phong_ban_id,
        pb.ten_phong_ban,
        pb.cap_bac,
        pb.phong_ban_cha_id,
        h.don_vi_tinh,
        tk.so_luong_ton,
        tk.gia_tri_ton,
        tk.don_gia_binh_quan,
        tk.sl_tot,
        tk.sl_kem_pham_chat,
        tk.sl_mat_pham_chat,
        tk.sl_hong,
        tk.sl_can_thanh_ly
      FROM ton_kho tk
      JOIN hang_hoa h ON tk.hang_hoa_id = h.id
      JOIN phong_ban pb ON tk.phong_ban_id = pb.id
      WHERE tk.hang_hoa_id = $1 
        AND tk.so_luong_ton > 0 
        AND pb.is_active = true
        ${whereClause}
      ORDER BY pb.cap_bac, pb.ten_phong_ban
    `;

    const result = await pool.query(query, queryParams);

    // Tổ chức dữ liệu theo cấp
    const breakdown = result.rows.map((row) => ({
      phong_ban_id: row.phong_ban_id,
      ten_phong_ban: row.ten_phong_ban,
      cap_bac: row.cap_bac,
      phong_ban_cha_id: row.phong_ban_cha_id,
      don_vi_tinh: row.don_vi_tinh,
      so_luong_ton: parseFloat(row.so_luong_ton || 0),
      gia_tri_ton: parseFloat(row.gia_tri_ton || 0),
      don_gia_binh_quan: parseFloat(row.don_gia_binh_quan || 0),
      sl_tot: parseFloat(row.sl_tot || 0),
      sl_kem_pham_chat: parseFloat(row.sl_kem_pham_chat || 0),
      sl_mat_pham_chat: parseFloat(row.sl_mat_pham_chat || 0),
      sl_hong: parseFloat(row.sl_hong || 0),
      sl_can_thanh_ly: parseFloat(row.sl_can_thanh_ly || 0),
    }));

    sendResponse(res, 200, true, "Lấy chi tiết tồn kho thành công", breakdown);
  } catch (error) {
    console.error("Get inventory breakdown error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

// const getList = async (req, res, query, user) => {
//   try {
//     const {
//       page = 1,
//       limit = 20,
//       search,
//       phong_ban_id, // Giữ lại để tương thích
//       loai_hang_hoa_id,
//       cap2_id, // THÊM: Filter cho cấp 2 (dành cho admin)
//       cap3_id, // THÊM: Filter cho cấp 3 (dành cho admin/manager)
//     } = query;

//     const offset = (page - 1) * limit;

//     // Base query với JOIN đầy đủ
//     const baseQuery = `
//       FROM hang_hoa h
//       LEFT JOIN loai_hang_hoa lh ON h.loai_hang_hoa_id = lh.id
//       LEFT JOIN ton_kho tk ON h.id = tk.hang_hoa_id
//       LEFT JOIN phong_ban pb ON tk.phong_ban_id = pb.id
//       WHERE h.trang_thai = 'active' AND tk.so_luong_ton IS NOT NULL
//     `;

//     let whereClause = "";
//     let params = [];
//     let paramCount = 0;

//     // 1. LOGIC PHÂN QUYỀN THEO CẤP NGƯỜI DÙNG
//     if (user.role === "user" && user.phong_ban?.cap_bac === 3) {
//       // User cấp 3: Chỉ xem hàng hóa trong phòng ban của mình
//       paramCount++;
//       whereClause += ` AND tk.phong_ban_id = $${paramCount}`;
//       params.push(user.phong_ban_id);
//     } else if (user.role === "manager" && user.phong_ban?.cap_bac === 2) {
//       // Manager cấp 2: Có filter để chọn xem phòng ban cấp 3 nào
//       if (cap3_id && cap3_id !== "all") {
//         // Nếu chọn phòng ban cấp 3 cụ thể
//         paramCount++;
//         whereClause += ` AND tk.phong_ban_id = $${paramCount}`;
//         params.push(parseInt(cap3_id));

//         // Kiểm tra quyền: chỉ được xem cấp 3 thuộc quyền
//         paramCount++;
//         whereClause += ` AND EXISTS (
//           SELECT 1 FROM phong_ban pb2
//           WHERE pb2.id = tk.phong_ban_id
//           AND pb2.phong_ban_cha_id = $${paramCount}
//         )`;
//         params.push(user.phong_ban_id);
//       } else {
//         // Nếu không chọn hoặc chọn "all": xem tất cả cấp 3 thuộc quyền
//         paramCount++;
//         whereClause += ` AND tk.phong_ban_id IN (
//           SELECT pb3.id FROM phong_ban pb3
//           WHERE pb3.phong_ban_cha_id = $${paramCount} AND pb3.cap_bac = 3
//         )`;
//         params.push(user.phong_ban_id);
//       }
//     } else if (user.role === "admin") {
//       // Admin: Có 2 cấp filter
//       if (cap2_id && cap2_id !== "all") {
//         if (cap3_id && cap3_id !== "all") {
//           // Nếu chọn cả cấp 2 và cấp 3 cụ thể
//           paramCount++;
//           whereClause += ` AND tk.phong_ban_id = $${paramCount}`;
//           params.push(parseInt(cap3_id));
//         } else {
//           // Nếu chỉ chọn cấp 2: xem tất cả cấp 3 thuộc cấp 2 đó
//           paramCount++;
//           whereClause += ` AND tk.phong_ban_id IN (
//             SELECT pb3.id FROM phong_ban pb3
//             WHERE pb3.phong_ban_cha_id = $${paramCount} AND pb3.cap_bac = 3
//           )`;
//           params.push(parseInt(cap2_id));
//         }
//       }
//       // Nếu không chọn filter: xem tất cả
//     }

//     // 2. Lọc theo từ khóa tìm kiếm
//     if (search) {
//       paramCount++;
//       whereClause += ` AND (h.ten_hang_hoa ILIKE $${paramCount} OR h.ma_hang_hoa ILIKE $${paramCount})`;
//       params.push(`%${search}%`);
//     }

//     // 3. Lọc theo loại hàng hóa
//     if (loai_hang_hoa_id) {
//       paramCount++;
//       whereClause += ` AND h.loai_hang_hoa_id = $${paramCount}`;
//       params.push(loai_hang_hoa_id);
//     }

//     // 4. QUERY COUNT VÀ DATA
//     const countQuery = `SELECT COUNT(DISTINCT h.id || '-' || tk.phong_ban_id) ${baseQuery} ${whereClause}`;

//     const dataQuery = `
//       SELECT
//           h.id, h.ma_hang_hoa, h.ten_hang_hoa, h.don_vi_tinh, h.co_so_seri,
//           lh.ten_loai,
//           tk.phong_ban_id,
//           pb.ten_phong_ban,
//           pb.cap_bac as cap_bac_phong_ban,
//           tk.so_luong_ton,
//           tk.gia_tri_ton,
//           tk.don_gia_binh_quan,
//           h.gia_nhap_gan_nhat,
//           (SELECT COUNT(DISTINCT pn.id)
//            FROM phieu_nhap pn
//            JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
//            WHERE ctn.hang_hoa_id = h.id AND pn.phong_ban_id = tk.phong_ban_id AND pn.trang_thai = 'completed') as so_lan_nhap
//       ${baseQuery}
//       ${whereClause}
//       ORDER BY pb.ten_phong_ban, h.ten_hang_hoa
//       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
//     `;

//     const countParams = [...params];
//     const dataParams = [...params, limit, offset];

//     const [countResult, dataResult] = await Promise.all([
//       pool.query(countQuery, countParams),
//       pool.query(dataQuery, dataParams),
//     ]);

//     const total = parseInt(countResult.rows[0].count);
//     const pages = Math.ceil(total / limit);

//     // 5. THÊM THÔNG TIN TỔNG KẾT THEO USER ROLE
//     let summary = null;

//     if (user.role === "admin" || user.role === "manager") {
//       // Nếu là admin/manager và không filter cụ thể, thêm breakdown theo phòng ban
//       const needBreakdown =
//         (user.role === "admin" && !cap2_id && !cap3_id) ||
//         (user.role === "manager" && !cap3_id);

//       if (needBreakdown) {
//         // Query để lấy thống kê theo phòng ban
//         const summaryQuery = `
//           SELECT
//             pb.ten_phong_ban,
//             pb.cap_bac,
//             COUNT(DISTINCT h.id) as so_loai_hang_hoa,
//             COALESCE(SUM(tk.so_luong_ton), 0) as tong_so_luong_ton,
//             COALESCE(SUM(tk.gia_tri_ton), 0) as tong_gia_tri_ton
//           ${baseQuery}
//           ${whereClause}
//           GROUP BY pb.id, pb.ten_phong_ban, pb.cap_bac
//           ORDER BY pb.ten_phong_ban
//         `;

//         const summaryResult = await pool.query(summaryQuery, countParams);
//         summary = summaryResult.rows;
//       }
//     }

//     sendResponse(res, 200, true, "Lấy danh sách thành công", {
//       items: dataResult.rows,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total,
//         pages,
//       },
//       summary, // Thêm thông tin tổng kết
//       user_role: user.role, // Thông tin role để frontend biết cách hiển thị
//       user_department: {
//         id: user.phong_ban_id,
//         name: user.phong_ban?.ten_phong_ban,
//         level: user.phong_ban?.cap_bac,
//       },
//     });
//   } catch (error) {
//     console.error("Get hang hoa list error:", error);
//     sendResponse(res, 500, false, "Lỗi server", { error: error.message });
//   }
// };

// Thêm method để lấy danh sách phòng ban cho filter
const getPhongBanList = async (req, res, user) => {
  try {
    let query = "";
    const params = [];

    // Admin thấy tất cả phòng ban
    if (user.role === "admin") {
      query = `
        SELECT id, ten_phong_ban, cap_bac, phong_ban_cha_id
        FROM phong_ban 
        WHERE is_active = TRUE 
        ORDER BY cap_bac, thu_tu_hien_thi, ten_phong_ban
      `;
    }
    // Manager thấy phòng ban của mình và các cấp 3 trực thuộc
    else if (user.phong_ban.cap_bac === 2) {
      query = `
        SELECT id, ten_phong_ban, cap_bac, phong_ban_cha_id
        FROM phong_ban 
        WHERE is_active = TRUE AND (id = $1 OR phong_ban_cha_id = $1)
        ORDER BY cap_bac, thu_tu_hien_thi, ten_phong_ban
      `;
      params.push(user.phong_ban_id);
    }
    // User cấp 3 chỉ thấy phòng ban của mình
    else {
      query = `
        SELECT id, ten_phong_ban, cap_bac, phong_ban_cha_id
        FROM phong_ban 
        WHERE is_active = TRUE AND id = $1
      `;
      params.push(user.phong_ban_id);
    }

    const result = await pool.query(query, params);
    sendResponse(
      res,
      200,
      true,
      "Lấy danh sách phòng ban thành công",
      result.rows
    );
  } catch (error) {
    console.error("Get Phong Ban List error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const getList = async (req, res, query, user) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      phong_ban_id, // Giữ lại để tương thích
      loai_hang_hoa_id,
      cap2_id, // Filter cho cấp 2 (dành cho admin)
      cap3_id, // Filter cho cấp 3 (dành cho admin/manager)
    } = query;

    const offset = (page - 1) * limit;

    // ✅ FIX: Base query với JOIN đúng điều kiện phong_ban_id
    const baseQuery = `
      FROM hang_hoa h
      LEFT JOIN loai_hang_hoa lh ON h.loai_hang_hoa_id = lh.id
      LEFT JOIN ton_kho tk ON h.id = tk.hang_hoa_id
      LEFT JOIN phong_ban pb ON tk.phong_ban_id = pb.id
    `;

    // ✅ FIX: WHERE clause có filter rõ ràng theo quyền
    let whereClause =
      "WHERE h.trang_thai = 'active' AND tk.so_luong_ton IS NOT NULL";
    let params = [];
    let paramCount = 0;

    // 1. ✅ FIX: Lọc theo quyền truy cập - QUAN TRỌNG để tránh duplicate
    if (user.role === "admin") {
      // Admin: có thể xem tất cả nhưng cần filter theo cap2_id/cap3_id nếu có
      if (cap3_id && cap3_id !== "all") {
        // Ưu tiên cấp 3 nếu được chọn
        paramCount++;
        whereClause += ` AND pb.id = $${paramCount}`;
        params.push(parseInt(cap3_id));
      } else if (cap2_id && cap2_id !== "all") {
        // Nếu chỉ chọn cấp 2: lấy tất cả cấp 3 trực thuộc cấp 2 đó
        paramCount++;
        whereClause += ` AND pb.phong_ban_cha_id = $${paramCount} AND pb.cap_bac = 3`;
        params.push(parseInt(cap2_id));
      }
      // Nếu không có filter cụ thể, admin xem tất cả
    } else if (user.role === "manager" && user.phong_ban?.cap_bac === 2) {
      // Manager cấp 2: chỉ xem phòng ban của mình và các cấp 3 trực thuộc
      if (cap3_id && cap3_id !== "all") {
        // Nếu có filter cấp 3 cụ thể, kiểm tra quyền
        paramCount++;
        whereClause += ` AND pb.id = $${paramCount}`;
        params.push(parseInt(cap3_id));

        // Kiểm tra quyền: chỉ được xem cấp 3 thuộc quyền
        paramCount++;
        whereClause += ` AND EXISTS (
          SELECT 1 FROM phong_ban pb2
          WHERE pb2.id = pb.id
          AND pb2.phong_ban_cha_id = $${paramCount}
        )`;
        params.push(user.phong_ban_id);
      } else {
        // Không có filter, lấy tất cả phòng ban mà manager quản lý
        paramCount++;
        whereClause += ` AND pb.id IN (
          SELECT pb3.id FROM phong_ban pb3
          WHERE pb3.phong_ban_cha_id = $${paramCount} AND pb3.cap_bac = 3
        )`;
        params.push(user.phong_ban_id);
      }
    } else if (user.role === "user") {
      // User: chỉ xem phòng ban của mình (bất kể cấp nào)
      paramCount++;
      whereClause += ` AND pb.id = $${paramCount}`;
      params.push(user.phong_ban_id);
    } else {
      // Các trường hợp khác: không có quyền
      whereClause += ` AND 1 = 0`; // Không trả về kết quả nào
    }

    // 2. Lọc theo từ khóa tìm kiếm
    if (search) {
      paramCount++;
      whereClause += ` AND (h.ten_hang_hoa ILIKE $${paramCount} OR h.ma_hang_hoa ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // 3. Lọc theo loại hàng hóa
    if (loai_hang_hoa_id) {
      paramCount++;
      whereClause += ` AND h.loai_hang_hoa_id = $${paramCount}`;
      params.push(loai_hang_hoa_id);
    }

    // 4. ✅ FIX: COUNT query - đếm đúng theo combination hang_hoa_id + phong_ban_id
    const countQuery = `SELECT COUNT(DISTINCT CONCAT(h.id, '-', tk.phong_ban_id)) ${baseQuery} ${whereClause}`;

    // 5. ✅ FIX: DATA query - đảm bảo mỗi hàng hóa chỉ xuất hiện 1 lần per phòng ban
    const dataQuery = `
      SELECT 
          h.id, h.ma_hang_hoa, h.ten_hang_hoa, h.don_vi_tinh, h.co_so_seri,
          lh.ten_loai,
          tk.phong_ban_id,
          pb.ten_phong_ban,
          pb.cap_bac as cap_bac_phong_ban,
          tk.so_luong_ton, 
          tk.gia_tri_ton, 
          tk.don_gia_binh_quan,
          h.gia_nhap_gan_nhat,
          (SELECT COUNT(DISTINCT pn.id)
           FROM phieu_nhap pn
           JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
           WHERE ctn.hang_hoa_id = h.id AND pn.phong_ban_id = tk.phong_ban_id AND pn.trang_thai = 'completed') as so_lan_nhap
      ${baseQuery}
      ${whereClause}
      ORDER BY pb.ten_phong_ban, h.ten_hang_hoa
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    const countParams = [...params];
    const dataParams = [...params, limit, offset];

    // Debug: Kiểm tra có hàng hóa nào trong phòng ban không
    const debugQuery = `
      SELECT h.id, h.ten_hang_hoa, tk.so_luong_ton, pb.ten_phong_ban
      FROM hang_hoa h
      LEFT JOIN ton_kho tk ON h.id = tk.hang_hoa_id
      LEFT JOIN phong_ban pb ON tk.phong_ban_id = pb.id
      WHERE h.trang_thai = 'active' AND tk.phong_ban_id = $1
    `;
    const debugResult = await pool.query(debugQuery, [user.phong_ban_id]);
    console.log("🔍 Debug - Hàng hóa trong phòng ban:", debugResult.rows);

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, countParams),
      pool.query(dataQuery, dataParams),
    ]);

    const total = parseInt(countResult.rows[0].count);
    const pages = Math.ceil(total / limit);

    // 6. THÊM THÔNG TIN TỔNG KẾT THEO USER ROLE (nếu cần)
    let summary = null;

    if (user.role === "admin" || user.role === "manager") {
      // Chỉ tính summary khi không có filter cụ thể
      const needBreakdown =
        (user.role === "admin" && !cap2_id && !cap3_id) ||
        (user.role === "manager" && !cap3_id);

      if (needBreakdown) {
        const summaryQuery = `
          SELECT 
            pb.ten_phong_ban,
            pb.cap_bac,
            COUNT(DISTINCT h.id) as so_loai_hang_hoa,
            COALESCE(SUM(tk.so_luong_ton), 0) as tong_so_luong_ton,
            COALESCE(SUM(tk.gia_tri_ton), 0) as tong_gia_tri_ton
          ${baseQuery}
          ${whereClause}
          GROUP BY pb.id, pb.ten_phong_ban, pb.cap_bac
          ORDER BY pb.ten_phong_ban
        `;

        const summaryResult = await pool.query(summaryQuery, countParams);
        summary = summaryResult.rows;
      }
    }

    sendResponse(res, 200, true, "Lấy danh sách thành công", {
      items: dataResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages,
      },
      summary, // Thêm thông tin tổng kết
      user_role: user.role, // Thông tin role để frontend biết cách hiển thị
      user_department: {
        id: user.phong_ban_id,
        name: user.phong_ban?.ten_phong_ban,
        level: user.phong_ban?.cap_bac,
      },
    });
  } catch (error) {
    console.error("Get hang hoa list error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};
// Method getById để lấy chi tiết hàng hóa theo ID (không cần phongBanId)
const getById = async (req, res, params, user) => {
  try {
    const { id } = params;
    const hangHoaId = parseInt(id);

    if (!hangHoaId || isNaN(hangHoaId)) {
      return sendResponse(res, 400, false, "hangHoaId không hợp lệ");
    }

    // Query lấy thông tin cơ bản của hàng hóa
    const hangHoaQuery = `
      SELECT h.*, lh.ten_loai
      FROM hang_hoa h
      LEFT JOIN loai_hang_hoa lh ON h.loai_hang_hoa_id = lh.id
      WHERE h.id = $1 AND h.trang_thai = 'active'
    `;

    const hangHoaResult = await pool.query(hangHoaQuery, [hangHoaId]);

    if (hangHoaResult.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy hàng hóa");
    }

    const hangHoa = hangHoaResult.rows[0];

    // Kiểm tra quyền xem
    if (user.role !== "admin" && hangHoa.phong_ban_id !== user.phong_ban_id) {
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền xem hàng hóa này"
      );
    }

    // Query lấy tổng hợp tồn kho từ tất cả phòng ban (nếu admin) hoặc phòng ban của user
    let tonKhoQuery = "";
    let tonKhoParams = [hangHoaId];

    if (user.role === "admin") {
      tonKhoQuery = `
        SELECT 
          SUM(tk.so_luong_ton) as tong_so_luong_ton,
          SUM(tk.gia_tri_ton) as tong_gia_tri_ton,
          CASE 
            WHEN SUM(tk.so_luong_ton) > 0 
            THEN SUM(tk.gia_tri_ton) / SUM(tk.so_luong_ton)
            ELSE 0 
          END as don_gia_binh_quan,
          COUNT(DISTINCT tk.phong_ban_id) as so_phong_ban_co_ton
        FROM ton_kho tk
        WHERE tk.hang_hoa_id = $1 AND tk.so_luong_ton > 0
      `;
    } else {
      tonKhoQuery = `
        SELECT 
          tk.so_luong_ton as tong_so_luong_ton,
          tk.gia_tri_ton as tong_gia_tri_ton,
          tk.don_gia_binh_quan,
          1 as so_phong_ban_co_ton
        FROM ton_kho tk
        WHERE tk.hang_hoa_id = $1 AND tk.phong_ban_id = $2 AND tk.so_luong_ton > 0
      `;
      tonKhoParams.push(user.phong_ban_id);
    }

    const tonKhoResult = await pool.query(tonKhoQuery, tonKhoParams);
    const tonKho = tonKhoResult.rows[0] || {
      tong_so_luong_ton: 0,
      tong_gia_tri_ton: 0,
      don_gia_binh_quan: 0,
      so_phong_ban_co_ton: 0,
    };

    // Query lấy danh sách phòng ban có tồn kho (chỉ cho admin)
    let phongBanList = [];
    if (user.role === "admin") {
      const phongBanQuery = `
        SELECT 
          pb.id as phong_ban_id,
          pb.ten_phong_ban,
          pb.cap_bac,
          tk.so_luong_ton,
          tk.gia_tri_ton,
          tk.don_gia_binh_quan
        FROM ton_kho tk
        JOIN phong_ban pb ON tk.phong_ban_id = pb.id
        WHERE tk.hang_hoa_id = $1 AND tk.so_luong_ton > 0
        ORDER BY pb.ten_phong_ban
      `;
      const phongBanResult = await pool.query(phongBanQuery, [hangHoaId]);
      phongBanList = phongBanResult.rows;
    }

    const result = {
      ...hangHoa,
      tong_so_luong_ton: parseFloat(tonKho.tong_so_luong_ton || 0),
      tong_gia_tri_ton: parseFloat(tonKho.tong_gia_tri_ton || 0),
      don_gia_binh_quan: parseFloat(tonKho.don_gia_binh_quan || 0),
      so_phong_ban_co_ton: parseInt(tonKho.so_phong_ban_co_ton || 0),
      phong_ban_list: phongBanList,
    };

    sendResponse(res, 200, true, "Lấy chi tiết hàng hóa thành công", result);
  } catch (error) {
    console.error("Get hang hoa by id error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

module.exports = {
  getList,
  getDetail,
  getById, // Thêm method mới
  getSuggestions,
  create,
  update,
  delete: deleteHangHoa,
  getPhongBanListForFilter: getPhongBanList, // Alias cho tương thích
  getPhongBanList, // Method mới
  getDetailByPhongBan, // Method đã fix
  getInventoryBreakdown,
};
