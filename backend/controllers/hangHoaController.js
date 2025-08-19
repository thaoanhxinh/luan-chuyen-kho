const pool = require("../config/database");
const { sendResponse } = require("../utils/response");

const getList = async (req, res, query, user) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      loai_hang_hoa_id,
      phong_ban_id,
    } = query;

    // Chuẩn bị parameters
    const searchParam = search ? `%${search}%` : "";
    const loaiHangHoaParam = loai_hang_hoa_id
      ? parseInt(loai_hang_hoa_id)
      : null;

    // XÁC ĐỊNH PHÒNG BAN ĐỂ XEM TỒN KHO (QUAN TRỌNG!)
    let targetPhongBanId = user.phong_ban_id; // Mặc định xem tồn kho phòng ban của mình

    if (phong_ban_id && parseInt(phong_ban_id)) {
      const requestedPhongBanId = parseInt(phong_ban_id);

      if (user.role === "admin") {
        // Admin có thể xem TỒN KHO của bất kỳ phòng ban nào
        targetPhongBanId = requestedPhongBanId;
      } else if (user.role === "manager") {
        // Manager chỉ có thể xem TỒN KHO của các đơn vị cấp 3 dưới quyền
        const permissionCheck = await pool.query(
          `SELECT 1 FROM phong_ban 
           WHERE id = $1 AND cap_bac = 3 AND phong_ban_cha_id = $2`,
          [requestedPhongBanId, user.phong_ban_id]
        );

        if (permissionCheck.rows.length > 0) {
          targetPhongBanId = requestedPhongBanId;
        }
      }
      // User (cấp 3) không được phép xem tồn kho phòng ban khác
    }

    // Query để lấy hàng hóa CÓ TỒN KHO HOẶC ĐÃ TỪNG CÓ GIAO DỊCH HOẶC LÀ HÀNG GỐC tại phòng ban được chọn
    const dataQuery = `
      SELECT h.id, h.ma_hang_hoa, h.ten_hang_hoa, h.don_vi_tinh, h.co_so_seri,
             h.gia_nhap_gan_nhat, h.theo_doi_pham_chat, h.la_tai_san_co_dinh, h.created_at,
             lh.ten_loai,
             pb_goc.ten_phong_ban as ten_phong_ban_goc,
             pb_goc.cap_bac as cap_bac_goc,
             -- TỒN KHO CỦA PHÒNG BAN ĐƯỢC CHỌN (có thể = 0)
             COALESCE(tk.sl_tot, 0) as sl_tot, 
             COALESCE(tk.sl_kem_pham_chat, 0) as sl_kem_pham_chat, 
             COALESCE(tk.sl_mat_pham_chat, 0) as sl_mat_pham_chat,
             COALESCE(tk.sl_hong, 0) as sl_hong, 
             COALESCE(tk.sl_can_thanh_ly, 0) as sl_can_thanh_ly,
             (COALESCE(tk.sl_tot, 0) + COALESCE(tk.sl_kem_pham_chat, 0) + COALESCE(tk.sl_mat_pham_chat, 0) + 
              COALESCE(tk.sl_hong, 0) + COALESCE(tk.sl_can_thanh_ly, 0)) as so_luong_ton,
             COALESCE(tk.gia_tri_ton, 0) as gia_tri_ton, 
             tk.don_gia_binh_quan,
             -- Thông tin phòng ban đang xem tồn kho
             pb_view.ten_phong_ban as ten_phong_ban_xem_ton_kho,
             pb_view.cap_bac as cap_bac_xem_ton_kho,
             -- Phân quyền
             check_hang_hoa_permission_v2($1::INTEGER, h.id, 'view') as can_view,
             check_hang_hoa_permission_v2($1::INTEGER, h.id, 'update') as can_edit,
             check_hang_hoa_permission_v2($1::INTEGER, h.id, 'delete') as can_delete,
             -- Thông tin nguồn gốc hàng hóa
             CASE
               WHEN h.phong_ban_id = $2::INTEGER THEN 'Hàng hóa gốc'
               WHEN tk.hang_hoa_id IS NOT NULL AND (tk.sl_tot + tk.sl_kem_pham_chat + tk.sl_mat_pham_chat + tk.sl_hong + tk.sl_can_thanh_ly) > 0 THEN 'Nhận từ cấp trên'
               WHEN EXISTS(SELECT 1 FROM phieu_nhap pn JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id WHERE ctn.hang_hoa_id = h.id AND pn.phong_ban_id = $2::INTEGER AND pn.trang_thai = 'completed') THEN 'Đã từng nhập'
               WHEN EXISTS(SELECT 1 FROM phieu_xuat px JOIN chi_tiet_xuat ctx ON px.id = ctx.phieu_xuat_id WHERE ctx.hang_hoa_id = h.id AND px.phong_ban_id = $2::INTEGER AND px.trang_thai = 'completed') THEN 'Đã từng xuất'
               ELSE 'Không liên quan'
             END as nguon_goc,
             -- Số lần nhập của phòng ban đang xem
             COALESCE((
               SELECT COUNT(DISTINCT pn.id)::INTEGER
               FROM phieu_nhap pn
               JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
               WHERE ctn.hang_hoa_id = h.id
               AND pn.trang_thai = 'completed'
               AND pn.phong_ban_id = $2::INTEGER
             ), 0) as so_lan_nhap,
             -- Số lần xuất của phòng ban đang xem
             COALESCE((
               SELECT COUNT(DISTINCT px.id)::INTEGER
               FROM phieu_xuat px
               JOIN chi_tiet_xuat ctx ON px.id = ctx.phieu_xuat_id
               WHERE ctx.hang_hoa_id = h.id
               AND px.trang_thai = 'completed'
               AND px.phong_ban_id = $2::INTEGER
             ), 0) as so_lan_xuat
      FROM hang_hoa h
      LEFT JOIN loai_hang_hoa lh ON h.loai_hang_hoa_id = lh.id
      LEFT JOIN phong_ban pb_goc ON h.phong_ban_id = pb_goc.id
      LEFT JOIN ton_kho tk ON h.id = tk.hang_hoa_id AND tk.phong_ban_id = $2::INTEGER
      LEFT JOIN phong_ban pb_view ON pb_view.id = $2::INTEGER
      WHERE h.trang_thai = 'active'
      AND check_hang_hoa_permission_v2($1::INTEGER, h.id, 'view') = TRUE
      AND (
        -- HÀNG HÓA GỐC của phòng ban này
        h.phong_ban_id = $2::INTEGER
        OR
        -- CÓ TỒN KHO > 0
        (tk.hang_hoa_id IS NOT NULL AND (tk.sl_tot + tk.sl_kem_pham_chat + tk.sl_mat_pham_chat + tk.sl_hong + tk.sl_can_thanh_ly) > 0)
        OR
        -- HOẶC ĐÃ TỪNG NHẬP
        EXISTS(
          SELECT 1 FROM phieu_nhap pn 
          JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id 
          WHERE ctn.hang_hoa_id = h.id 
          AND pn.phong_ban_id = $2::INTEGER 
          AND pn.trang_thai = 'completed'
        )
        OR
        -- HOẶC ĐÃ TỪNG XUẤT
        EXISTS(
          SELECT 1 FROM phieu_xuat px 
          JOIN chi_tiet_xuat ctx ON px.id = ctx.phieu_xuat_id 
          WHERE ctx.hang_hoa_id = h.id 
          AND px.phong_ban_id = $2::INTEGER 
          AND px.trang_thai = 'completed'
        )
      )
      AND ($3::TEXT = '' OR h.ten_hang_hoa ILIKE $3::TEXT OR h.ma_hang_hoa ILIKE $3::TEXT)
      AND ($4::INTEGER IS NULL OR h.loai_hang_hoa_id = $4::INTEGER)
      ORDER BY
        -- Ưu tiên: Hàng gốc, sau đó có tồn kho > 0, cuối cùng theo ngày tạo
        CASE WHEN h.phong_ban_id = $2::INTEGER THEN 0 ELSE 1 END,
        CASE WHEN (COALESCE(tk.sl_tot, 0) + COALESCE(tk.sl_kem_pham_chat, 0) + COALESCE(tk.sl_mat_pham_chat, 0) + COALESCE(tk.sl_hong, 0) + COALESCE(tk.sl_can_thanh_ly, 0)) > 0 THEN 0 ELSE 1 END,
        COALESCE(tk.sl_tot, 0) DESC,
        h.created_at DESC
      LIMIT $5::INTEGER OFFSET $6::INTEGER
    `;

    const params = [
      user.id,
      targetPhongBanId, // TỒN KHO của phòng ban được chọn
      searchParam,
      loaiHangHoaParam,
      parseInt(limit),
      (page - 1) * limit,
    ];

    // Query đếm hàng hóa CÓ TỒN KHO HOẶC ĐÃ TỪNG CÓ GIAO DỊCH HOẶC LÀ HÀNG GỐC
    const countQuery = `
      SELECT COUNT(h.id)
      FROM hang_hoa h
      LEFT JOIN ton_kho tk ON h.id = tk.hang_hoa_id AND tk.phong_ban_id = $4::INTEGER
      WHERE h.trang_thai = 'active'
      AND check_hang_hoa_permission_v2($1::INTEGER, h.id, 'view') = TRUE
      AND (
        -- HÀNG HÓA GỐC của phòng ban này
        h.phong_ban_id = $4::INTEGER
        OR
        -- CÓ TỒN KHO > 0
        (tk.hang_hoa_id IS NOT NULL AND (tk.sl_tot + tk.sl_kem_pham_chat + tk.sl_mat_pham_chat + tk.sl_hong + tk.sl_can_thanh_ly) > 0)
        OR
        -- HOẶC ĐÃ TỪNG NHẬP
        EXISTS(
          SELECT 1 FROM phieu_nhap pn 
          JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id 
          WHERE ctn.hang_hoa_id = h.id 
          AND pn.phong_ban_id = $4::INTEGER 
          AND pn.trang_thai = 'completed'
        )
        OR
        -- HOẶC ĐÃ TỪNG XUẤT
        EXISTS(
          SELECT 1 FROM phieu_xuat px 
          JOIN chi_tiet_xuat ctx ON px.id = ctx.phieu_xuat_id 
          WHERE ctx.hang_hoa_id = h.id 
          AND px.phong_ban_id = $4::INTEGER 
          AND px.trang_thai = 'completed'
        )
      )
      AND ($2::TEXT = '' OR h.ten_hang_hoa ILIKE $2::TEXT OR h.ma_hang_hoa ILIKE $2::TEXT)
      AND ($3::INTEGER IS NULL OR h.loai_hang_hoa_id = $3::INTEGER)
    `;

    const countParams = [
      user.id,
      searchParam,
      loaiHangHoaParam,
      targetPhongBanId,
    ];

    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, params),
      pool.query(countQuery, countParams),
    ]);

    const total = parseInt(countResult.rows[0].count);
    const pages = Math.ceil(total / limit);

    // Thông tin phòng ban đang xem tồn kho
    const targetPhongBanInfo = await pool.query(
      `SELECT ten_phong_ban, cap_bac, ma_phong_ban FROM phong_ban WHERE id = $1`,
      [targetPhongBanId]
    );

    sendResponse(res, 200, true, "Lấy danh sách thành công", {
      items: dataResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages,
      },
      context: {
        phong_ban_xem_ton_kho: targetPhongBanInfo.rows[0] || null,
        phong_ban_user: {
          id: user.phong_ban_id,
          role: user.role,
        },
        co_the_doi_phong_ban: user.role === "admin" || user.role === "manager",
        message: `Đang xem tồn kho của: ${
          targetPhongBanInfo.rows[0]?.ten_phong_ban || "N/A"
        }`,
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
    // SỬA LỖI: Kiểm tra req.query tồn tại trước khi destructure
    const query = req.query || {};
    const { phong_ban_id } = query;

    // Xác định phòng ban để xem chi tiết
    let targetPhongBanId = user.phong_ban_id;

    if (phong_ban_id && parseInt(phong_ban_id) && user.role === "admin") {
      targetPhongBanId = parseInt(phong_ban_id);
    }

    // Kiểm tra quyền xem với function mới
    const permissionCheck = `
      SELECT check_hang_hoa_permission_v2($1::INTEGER, $2::INTEGER, 'view') as can_view
    `;
    const permissionResult = await pool.query(permissionCheck, [
      user.id,
      parseInt(id),
    ]);

    if (!permissionResult.rows[0]?.can_view) {
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền xem hàng hóa này"
      );
    }

    // Query lấy thông tin chi tiết với tồn kho và phân quyền
    const detailQuery = `
      SELECT h.*,
             lh.ten_loai,
             pb_goc.ten_phong_ban as ten_phong_ban_goc,
             pb_goc.cap_bac as cap_bac_phong_ban_goc,
             -- Tồn kho của phòng ban hiện tại
             tk_current.sl_tot, tk_current.sl_kem_pham_chat, tk_current.sl_mat_pham_chat,
             tk_current.sl_hong, tk_current.sl_can_thanh_ly,
             (COALESCE(tk_current.sl_tot, 0) + COALESCE(tk_current.sl_kem_pham_chat, 0) + 
              COALESCE(tk_current.sl_mat_pham_chat, 0) + COALESCE(tk_current.sl_hong, 0) + 
              COALESCE(tk_current.sl_can_thanh_ly, 0)) as so_luong_ton_current,
             tk_current.gia_tri_ton as gia_tri_ton_current,
             tk_current.don_gia_binh_quan as don_gia_binh_quan_current,
             -- Tổng tồn kho toàn hệ thống (chỉ admin mới thấy)
             CASE WHEN $2::TEXT = 'admin' THEN tk_total.tong_ton ELSE NULL END as tong_ton_he_thong,
             CASE WHEN $2::TEXT = 'admin' THEN tk_total.tong_gia_tri ELSE NULL END as tong_gia_tri_he_thong,
             -- Phân quyền
             check_hang_hoa_permission_v2($1::INTEGER, h.id, 'update') as can_edit,
             check_hang_hoa_permission_v2($1::INTEGER, h.id, 'delete') as can_delete,
             -- Thông tin nguồn gốc
             CASE
               WHEN h.phong_ban_id = $3::INTEGER THEN 'Hàng hóa gốc của phòng ban'
               WHEN tk_current.hang_hoa_id IS NOT NULL THEN 'Nhận từ cấp trên'
               ELSE 'Không có tồn kho'
             END as nguon_goc_chi_tiet
      FROM hang_hoa h
      LEFT JOIN loai_hang_hoa lh ON h.loai_hang_hoa_id = lh.id
      LEFT JOIN phong_ban pb_goc ON h.phong_ban_id = pb_goc.id
      LEFT JOIN ton_kho tk_current ON h.id = tk_current.hang_hoa_id AND tk_current.phong_ban_id = $3::INTEGER
      LEFT JOIN (
        SELECT hang_hoa_id,
               SUM(sl_tot + sl_kem_pham_chat + sl_mat_pham_chat + sl_hong + sl_can_thanh_ly) as tong_ton,
               SUM(gia_tri_ton) as tong_gia_tri
        FROM ton_kho
        GROUP BY hang_hoa_id
      ) tk_total ON h.id = tk_total.hang_hoa_id
      WHERE h.id = $4::INTEGER AND h.trang_thai = 'active'
    `;

    // Lấy lịch sử giá với phân quyền - CHỈ CỦA PHÒNG BAN HIỆN TẠI
    const priceHistoryQuery = `
      SELECT ls.*, pn.so_phieu, pn.ngay_nhap, pn.trang_thai, pn.loai_phieu,
             ncc.ten_ncc, pb.ten_phong_ban as phong_ban_nhap
      FROM lich_su_gia ls
      JOIN phieu_nhap pn ON ls.phieu_nhap_id = pn.id
      LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
      LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
      WHERE ls.hang_hoa_id = $1::INTEGER
      AND pn.trang_thai = 'completed'
      AND pn.phong_ban_id = $2::INTEGER
      ORDER BY ls.ngay_ap_dung DESC, ls.created_at DESC
      LIMIT 20
    `;

    // Lấy lịch sử nhập CHỈ CỦA PHÒNG BAN HIỆN TẠI
    const importHistoryQuery = `
      SELECT pn.so_phieu, pn.ngay_nhap, pn.trang_thai, pn.loai_phieu,
             pn.ly_do_nhap, pn.ghi_chu,
             ctn.so_luong_ke_hoach, ctn.so_luong, ctn.don_gia, ctn.thanh_tien, ctn.pham_chat,
             ncc.ten_ncc,
             pb_cung_cap.ten_phong_ban as ten_don_vi_cung_cap,
             pb_nhap.ten_phong_ban as phong_ban_nhap
      FROM phieu_nhap pn
      JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
      LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
      LEFT JOIN phong_ban pb_cung_cap ON pn.phong_ban_cung_cap_id = pb_cung_cap.id
      LEFT JOIN phong_ban pb_nhap ON pn.phong_ban_id = pb_nhap.id
      WHERE ctn.hang_hoa_id = $1::INTEGER
      AND pn.phong_ban_id = $2::INTEGER
      AND pn.trang_thai = 'completed'
      ORDER BY pn.ngay_nhap DESC, pn.created_at DESC
      LIMIT 50
    `;

    // Lấy lịch sử xuất CHỈ CỦA PHÒNG BAN HIỆN TẠI
    const exportHistoryQuery = `
      SELECT px.so_phieu, px.ngay_xuat, px.trang_thai, px.loai_xuat,
             px.ly_do_xuat, px.ghi_chu,
             ctx.so_luong_yeu_cau, ctx.so_luong_thuc_xuat, ctx.don_gia, ctx.thanh_tien, ctx.pham_chat,
             pb_nhan.ten_phong_ban as ten_phong_ban_nhan,
             pb_xuat.ten_phong_ban as phong_ban_xuat
      FROM phieu_xuat px
      JOIN chi_tiet_xuat ctx ON px.id = ctx.phieu_xuat_id
      LEFT JOIN phong_ban pb_nhan ON px.phong_ban_nhan_id = pb_nhan.id
      LEFT JOIN phong_ban pb_xuat ON px.phong_ban_id = pb_xuat.id
      WHERE ctx.hang_hoa_id = $1::INTEGER
      AND px.phong_ban_id = $2::INTEGER
      AND px.trang_thai = 'completed'
      ORDER BY px.ngay_xuat DESC, px.created_at DESC
      LIMIT 50
    `;

    // Lấy danh sách tồn kho theo phòng ban (phân quyền theo cấp bậc)
    const tonKhoQuery = `
      SELECT tk.*, pb.ten_phong_ban, pb.cap_bac, pb.ma_phong_ban,
             (COALESCE(tk.sl_tot, 0) + COALESCE(tk.sl_kem_pham_chat, 0) + 
              COALESCE(tk.sl_mat_pham_chat, 0) + COALESCE(tk.sl_hong, 0) + 
              COALESCE(tk.sl_can_thanh_ly, 0)) as tong_ton,
             CASE
               WHEN h.phong_ban_id = tk.phong_ban_id THEN 'Hàng hóa gốc'
               ELSE 'Nhận từ cấp trên'
             END as nguon_goc
      FROM ton_kho tk
      JOIN phong_ban pb ON tk.phong_ban_id = pb.id
      JOIN hang_hoa h ON tk.hang_hoa_id = h.id
      WHERE tk.hang_hoa_id = $1::INTEGER
      AND (COALESCE(tk.sl_tot, 0) + COALESCE(tk.sl_kem_pham_chat, 0) + 
           COALESCE(tk.sl_mat_pham_chat, 0) + COALESCE(tk.sl_hong, 0) + 
           COALESCE(tk.sl_can_thanh_ly, 0)) > 0
      AND ($3::TEXT = 'admin' OR tk.phong_ban_id = $2::INTEGER OR 
           EXISTS(SELECT 1 FROM quan_he_phong_ban qh 
                  WHERE qh.phong_ban_cung_cap_id = $2::INTEGER 
                  AND qh.phong_ban_nhan_id = tk.phong_ban_id))
      ORDER BY pb.cap_bac, pb.ten_phong_ban
    `;

    // Thống kê nhập xuất theo phòng ban hiện tại
    const importExportStatsQuery = `
      SELECT
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
          WHERE ctn.hang_hoa_id = $1::INTEGER
          AND pn.trang_thai = 'completed'
          AND pn.phong_ban_id = $2::INTEGER
          AND pn.ngay_nhap >= CURRENT_DATE - INTERVAL '12 months'
          GROUP BY EXTRACT(MONTH FROM pn.ngay_nhap), EXTRACT(YEAR FROM pn.ngay_nhap)
          ORDER BY nam DESC, thang DESC
          LIMIT 12
        ) thang_data) as thong_ke_nhap,

        (SELECT json_agg(
          json_build_object(
            'thang', thang_data.thang,
            'nam', thang_data.nam,
            'so_luong_xuat', thang_data.so_luong_xuat,
            'so_phieu_xuat', thang_data.so_phieu_xuat,
            'gia_tri_xuat', thang_data.gia_tri_xuat
          ) ORDER BY thang_data.nam DESC, thang_data.thang DESC
        ) FROM (
          SELECT
            EXTRACT(MONTH FROM px.ngay_xuat) as thang,
            EXTRACT(YEAR FROM px.ngay_xuat) as nam,
            SUM(ctx.so_luong_thuc_xuat) as so_luong_xuat,
            COUNT(DISTINCT px.id) as so_phieu_xuat,
            SUM(ctx.thanh_tien) as gia_tri_xuat
          FROM phieu_xuat px
          JOIN chi_tiet_xuat ctx ON px.id = ctx.phieu_xuat_id
          WHERE ctx.hang_hoa_id = $1::INTEGER
          AND px.trang_thai = 'completed'
          AND px.phong_ban_id = $2::INTEGER
          AND px.ngay_xuat >= CURRENT_DATE - INTERVAL '12 months'
          GROUP BY EXTRACT(MONTH FROM px.ngay_xuat), EXTRACT(YEAR FROM px.ngay_xuat)
          ORDER BY nam DESC, thang DESC
          LIMIT 12
        ) thang_data) as thong_ke_xuat
    `;

    const [
      detailResult,
      priceHistoryResult,
      importHistoryResult,
      exportHistoryResult,
      tonKhoResult,
      importExportStatsResult,
    ] = await Promise.all([
      pool.query(detailQuery, [
        user.id,
        user.role,
        targetPhongBanId, // Sử dụng phòng ban được chọn
        parseInt(id),
      ]),
      pool.query(priceHistoryQuery, [parseInt(id), targetPhongBanId]),
      pool.query(importHistoryQuery, [parseInt(id), targetPhongBanId]),
      pool.query(exportHistoryQuery, [parseInt(id), targetPhongBanId]),
      pool.query(tonKhoQuery, [parseInt(id), targetPhongBanId, user.role]),
      pool.query(importExportStatsQuery, [parseInt(id), targetPhongBanId]),
    ]);

    if (detailResult.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy hàng hóa");
    }

    const hangHoa = detailResult.rows[0];

    const result = {
      ...hangHoa,
      lich_su_gia: priceHistoryResult.rows,
      lich_su_nhap: importHistoryResult.rows,
      lich_su_xuat: exportHistoryResult.rows,
      ton_kho_chi_tiet: tonKhoResult.rows,
      thong_ke: {
        tong_con_ton_current: hangHoa.so_luong_ton_current || 0,
        tong_con_ton_he_thong: hangHoa.tong_ton_he_thong || null,
        gia_tri_ton_current: hangHoa.gia_tri_ton_current || 0,
        gia_tri_ton_he_thong: hangHoa.tong_gia_tri_he_thong || null,
        nhap_theo_thang: importExportStatsResult.rows[0]?.thong_ke_nhap || [],
        xuat_theo_thang: importExportStatsResult.rows[0]?.thong_ke_xuat || [],
        // Thống kê tổng của phòng ban hiện tại
        tong_da_nhap: importHistoryResult.rows.reduce(
          (sum, item) => sum + (parseFloat(item.so_luong) || 0),
          0
        ),
        tong_da_xuat: exportHistoryResult.rows.reduce(
          (sum, item) => sum + (parseFloat(item.so_luong_thuc_xuat) || 0),
          0
        ),
      },
      permissions: {
        can_edit: hangHoa.can_edit,
        can_delete: hangHoa.can_delete,
        can_view_all_departments: user.role === "admin",
        can_view_system_stats: user.role === "admin",
      },
      context: {
        phong_ban_hien_tai: targetPhongBanId,
        xem_tu_goc_nhin:
          targetPhongBanId === user.phong_ban_id
            ? "phong_ban_chinh"
            : "phong_ban_khac",
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

    // Chuẩn bị parameter search
    const searchParam = search ? `%${search}%` : "";

    // Ưu tiên hàng hóa có tồn kho ở phòng ban hiện tại
    const suggestionQuery = `
      SELECT h.id, h.ma_hang_hoa, h.ten_hang_hoa, h.don_vi_tinh,
             h.co_so_seri, h.gia_nhap_gan_nhat,
             lh.ten_loai, pb_goc.ten_phong_ban as ten_phong_ban_goc,
             COALESCE((tk.sl_tot + tk.sl_kem_pham_chat + tk.sl_mat_pham_chat + 
                      tk.sl_hong + tk.sl_can_thanh_ly), 0) as so_luong_ton, 
             tk.sl_tot, tk.sl_kem_pham_chat,
             tk.don_gia_binh_quan,
             CASE
               WHEN h.phong_ban_id = $2::INTEGER THEN 'Hàng hóa gốc'
               WHEN tk.hang_hoa_id IS NOT NULL THEN 'Nhận từ cấp trên'
               ELSE 'Khác'
             END as nguon_goc
      FROM hang_hoa h
      LEFT JOIN loai_hang_hoa lh ON h.loai_hang_hoa_id = lh.id
      LEFT JOIN phong_ban pb_goc ON h.phong_ban_id = pb_goc.id
      LEFT JOIN ton_kho tk ON h.id = tk.hang_hoa_id AND tk.phong_ban_id = $2::INTEGER
      WHERE h.trang_thai = 'active'
      AND check_hang_hoa_permission_v2($1::INTEGER, h.id, 'view') = TRUE
      ${
        search
          ? "AND (h.ten_hang_hoa ILIKE $4::TEXT OR h.ma_hang_hoa ILIKE $4::TEXT)"
          : ""
      }
      ORDER BY
        CASE WHEN tk.hang_hoa_id IS NOT NULL THEN 0 ELSE 1 END, -- Ưu tiên hàng có tồn kho
        h.ten_hang_hoa ASC
      LIMIT $3::INTEGER
    `;

    const params = [user.id, user.phong_ban_id, parseInt(limit)];
    if (search) params.push(searchParam);

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
    } = body;

    // Validation
    if (!ma_hang_hoa || !ten_hang_hoa || !don_vi_tinh) {
      return sendResponse(res, 400, false, "Thiếu thông tin bắt buộc");
    }

    // Xác định phòng ban đích
    const targetPhongBanId = phong_ban_id || user.phong_ban_id;

    // Kiểm tra quyền tạo hàng hóa cho phòng ban này
    const permissionCheck = `
      SELECT check_phong_ban_permission($1, $2, 'create_hang_hoa') as can_create
    `;
    const permissionResult = await pool.query(permissionCheck, [
      user.id,
      targetPhongBanId,
    ]);

    if (!permissionResult.rows[0]?.can_create) {
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền tạo hàng hóa cho phòng ban này"
      );
    }

    // Kiểm tra trùng mã hàng hóa trong phạm vi được phép
    const existingQuery = `
      SELECT id FROM hang_hoa
      WHERE ma_hang_hoa = $1 AND trang_thai = 'active'
      AND check_hang_hoa_permission_v2($2, id, 'view') = TRUE
    `;
    const existingResult = await pool.query(existingQuery, [
      ma_hang_hoa,
      user.id,
    ]);

    if (existingResult.rows.length > 0) {
      return sendResponse(
        res,
        400,
        false,
        "Mã hàng hóa đã tồn tại trong phạm vi quản lý của bạn"
      );
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
    ]);

    sendResponse(res, 201, true, "Tạo hàng hóa thành công", result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
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
    } = body;

    // Validation
    if (!ma_hang_hoa || !ten_hang_hoa || !don_vi_tinh) {
      return sendResponse(res, 400, false, "Thiếu thông tin bắt buộc");
    }

    // Kiểm tra quyền chỉnh sửa với function mới
    const permissionCheck = `
      SELECT check_hang_hoa_permission_v2($1, $2, 'update') as can_edit
    `;
    const permissionResult = await pool.query(permissionCheck, [user.id, id]);

    if (!permissionResult.rows[0]?.can_edit) {
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền chỉnh sửa hàng hóa này"
      );
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

    // Kiểm tra trùng mã hàng hóa (ngoại trừ chính nó)
    const duplicateQuery = `
      SELECT id FROM hang_hoa
      WHERE ma_hang_hoa = $1 AND id != $2 AND trang_thai = 'active'
      AND check_hang_hoa_permission_v2($3, id, 'view') = TRUE
    `;
    const duplicateResult = await pool.query(duplicateQuery, [
      ma_hang_hoa,
      id,
      user.id,
    ]);

    if (duplicateResult.rows.length > 0) {
      return sendResponse(
        res,
        400,
        false,
        "Mã hàng hóa đã tồn tại trong phạm vi quản lý của bạn"
      );
    }

    // Kiểm tra xem có thể thay đổi cấu hình số seri không
    if (hangHoa.co_so_seri !== co_so_seri) {
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

    // Kiểm tra quyền xóa với function mới
    const permissionCheck = `
      SELECT check_hang_hoa_permission_v2($1, $2, 'delete') as can_delete
    `;
    const permissionResult = await pool.query(permissionCheck, [user.id, id]);

    if (!permissionResult.rows[0]?.can_delete) {
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền xóa hàng hóa này"
      );
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
        "Không thể xóa hàng hóa đã có giao dịch. Bạn có thể ngừng sử dụng thay vì xóa."
      );
    }

    // Kiểm tra tồn kho trong toàn hệ thống
    const inventoryQuery = `
      SELECT SUM(sl_tot + sl_kem_pham_chat + sl_mat_pham_chat + sl_hong + sl_can_thanh_ly) as total_ton
      FROM ton_kho
      WHERE hang_hoa_id = $1
    `;
    const inventoryResult = await pool.query(inventoryQuery, [id]);
    const totalTon = parseFloat(inventoryResult.rows[0]?.total_ton || 0);

    if (totalTon > 0) {
      return sendResponse(
        res,
        400,
        false,
        "Không thể xóa hàng hóa còn tồn kho trong hệ thống"
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

// Function hỗ trợ lấy danh sách phòng ban cung cấp với thông tin chi tiết hơn
const getPhongBanCungCap = async (req, res, query, user) => {
  try {
    const { loai_phieu = "tren_cap" } = query;

    const result = await pool.query(
      `SELECT pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac,
              -- Đếm số lượng hàng hóa có thể cung cấp
              COUNT(tk.hang_hoa_id) as so_hang_hoa_co_the_cung_cap,
              -- Tổng giá trị có thể cung cấp
              COALESCE(SUM(tk.gia_tri_ton), 0) as tong_gia_tri_co_the_cung_cap
       FROM get_phong_ban_co_the_cung_cap($1, $2) pb
       LEFT JOIN ton_kho tk ON pb.id = tk.phong_ban_id
         AND (tk.sl_tot + tk.sl_kem_pham_chat + tk.sl_mat_pham_chat + tk.sl_hong + tk.sl_can_thanh_ly) > 0
       GROUP BY pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac
       ORDER BY pb.cap_bac, pb.ten_phong_ban`,
      [user.phong_ban_id, loai_phieu]
    );

    sendResponse(
      res,
      200,
      true,
      "Lấy danh sách phòng ban thành công",
      result.rows
    );
  } catch (error) {
    console.error("Get phong ban cung cap error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

// Function hỗ trợ lấy danh sách phòng ban có thể nhận hàng
const getPhongBanNhanHang = async (req, res, query, user) => {
  try {
    const result = await pool.query(
      `SELECT * FROM get_phong_ban_co_the_nhan_hang($1)`,
      [user.phong_ban_id]
    );

    sendResponse(
      res,
      200,
      true,
      "Lấy danh sách đơn vị nhận thành công",
      result.rows
    );
  } catch (error) {
    console.error("Get phong ban nhan hang error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

// Function thống kê theo phòng ban - CHỈ ADMIN
const getStatsByDepartment = async (req, res, query, user) => {
  try {
    if (user.role !== "admin") {
      return sendResponse(
        res,
        403,
        false,
        "Chỉ admin mới có quyền xem thống kê theo phòng ban"
      );
    }

    const statsQuery = `
      SELECT 
        pb.id as phong_ban_id,
        pb.ten_phong_ban,
        pb.cap_bac,
        pb.ma_phong_ban,
        COUNT(DISTINCT h.id) as so_hang_hoa_goc,
        COUNT(DISTINCT tk.hang_hoa_id) as so_hang_hoa_co_ton,
        COALESCE(SUM(tk.sl_tot + tk.sl_kem_pham_chat + tk.sl_mat_pham_chat + tk.sl_hong + tk.sl_can_thanh_ly), 0) as tong_so_luong_ton,
        COALESCE(SUM(tk.gia_tri_ton), 0) as tong_gia_tri_ton,
        -- Thống kê nhập trong 30 ngày qua
        COALESCE((
          SELECT SUM(ctn.so_luong)
          FROM phieu_nhap pn
          JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
          WHERE pn.phong_ban_id = pb.id
          AND pn.trang_thai = 'completed'
          AND pn.ngay_nhap >= CURRENT_DATE - INTERVAL '30 days'
        ), 0) as so_luong_nhap_30_ngay,
        -- Thống kê xuất trong 30 ngày qua
        COALESCE((
          SELECT SUM(ctx.so_luong_thuc_xuat)
          FROM phieu_xuat px
          JOIN chi_tiet_xuat ctx ON px.id = ctx.phieu_xuat_id
          WHERE px.phong_ban_id = pb.id
          AND px.trang_thai = 'completed'
          AND px.ngay_xuat >= CURRENT_DATE - INTERVAL '30 days'
        ), 0) as so_luong_xuat_30_ngay
      FROM phong_ban pb
      LEFT JOIN hang_hoa h ON pb.id = h.phong_ban_id AND h.trang_thai = 'active'
      LEFT JOIN ton_kho tk ON pb.id = tk.phong_ban_id 
        AND (tk.sl_tot + tk.sl_kem_pham_chat + tk.sl_mat_pham_chat + tk.sl_hong + tk.sl_can_thanh_ly) > 0
      WHERE pb.is_active = TRUE
      GROUP BY pb.id, pb.ten_phong_ban, pb.cap_bac, pb.ma_phong_ban
      ORDER BY pb.cap_bac, pb.ten_phong_ban
    `;

    const result = await pool.query(statsQuery);

    sendResponse(
      res,
      200,
      true,
      "Lấy thống kê theo phòng ban thành công",
      result.rows
    );
  } catch (error) {
    console.error("Get stats by department error:", error);
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
  getPhongBanCungCap,
  getPhongBanNhanHang,
  getStatsByDepartment,
};
