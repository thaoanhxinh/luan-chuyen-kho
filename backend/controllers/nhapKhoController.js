const pool = require("../config/database");
const { sendResponse } = require("../utils/response");
const notificationService = require("../services/notificationService");

// const getList = async (req, res, query, user) => {
//   try {
//     const {
//       page = 1,
//       limit = 20,
//       search,
//       tu_ngay,
//       den_ngay,
//       trang_thai,
//       loai_phieu,
//       sort_by = "created_at",
//       sort_direction = "desc",
//     } = query;

//     const offset = (page - 1) * limit;
//     let whereClause = "WHERE 1=1";
//     const params = [];
//     let paramCount = 0;

//     // TÃ¬m kiáº¿m theo sá»‘ quyáº¿t Ä‘á»‹nh vÃ  tÃªn nhÃ  cung cáº¥p/phÃ²ng ban cung cáº¥p
//     if (search && search.trim()) {
//       paramCount++;
//       whereClause += ` AND (
//         pn.so_quyet_dinh ILIKE $${paramCount} OR
//         ncc.ten_ncc ILIKE $${paramCount} OR
//         pb_cc.ten_phong_ban ILIKE $${paramCount}
//       )`;
//       params.push(`%${search.trim()}%`);
//     }

//     if (tu_ngay && den_ngay) {
//       paramCount += 2;
//       whereClause += ` AND pn.ngay_nhap BETWEEN $${
//         paramCount - 1
//       } AND $${paramCount}`;
//       params.push(tu_ngay, den_ngay);
//     }

//     if (trang_thai) {
//       paramCount++;
//       whereClause += ` AND pn.trang_thai = $${paramCount}`;
//       params.push(trang_thai);
//     }

//     if (loai_phieu) {
//       paramCount++;
//       whereClause += ` AND pn.loai_phieu = $${paramCount}`;
//       params.push(loai_phieu);
//     }

//     // PhÃ¢n quyá»n: hiá»ƒn thá»‹ phiáº¿u cá»§a chÃ­nh phÃ²ng ban hoáº·c phiáº¿u tá»« cáº¥p trÃªn xuá»‘ng
//     if (user.role !== "admin") {
//       paramCount++;
//       whereClause += ` AND (pn.phong_ban_id = $${paramCount} OR
//         (pn.loai_phieu = 'tren_cap' AND pn.phong_ban_id = $${paramCount}))`;
//       params.push(user.phong_ban_id);
//     }

//     // Xá»­ lÃ½ sáº¯p xáº¿p
//     const validSortFields = {
//       so_quyet_dinh: "pn.so_quyet_dinh",
//       ngay_nhap: "pn.ngay_nhap",
//       tong_tien: "pn.tong_tien",
//       created_at: "pn.created_at",
//     };

//     const sortField = validSortFields[sort_by] || "pn.created_at";
//     const sortDir = sort_direction.toLowerCase() === "asc" ? "ASC" : "DESC";
//     const orderClause = `ORDER BY ${sortField} ${sortDir}`;

//     const countQuery = `
//       SELECT COUNT(*)
//       FROM phieu_nhap pn
//       LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
//       LEFT JOIN phong_ban pb_cc ON pn.phong_ban_cung_cap_id = pb_cc.id
//       ${whereClause}
//     `;

//     const dataQuery = `
//       SELECT pn.*,
//              ncc.id as ncc_id, ncc.ma_ncc, ncc.ten_ncc,
//              pb_cc.id as pb_cc_id, pb_cc.ten_phong_ban as ten_pb_cung_cap, pb_cc.cap_bac as cap_bac_cung_cap,
//              u.id as nguoi_tao_id, u.ho_ten as nguoi_tao_ten,
//              pb.ten_phong_ban,
//              pn.decision_pdf_url,
//              pn.decision_pdf_filename,
//              pn.ghi_chu_hoan_thanh,
//              pn.ghi_chu_phan_hoi,
//              -- ThÃ´ng tin phiáº¿u xuáº¥t liÃªn káº¿t
//              px.id as phieu_xuat_lien_ket_id_ref,
//              px.so_phieu as so_phieu_xuat_lien_ket,
//              px.trang_thai as trang_thai_phieu_xuat_lien_ket
//       FROM phieu_nhap pn
//       LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
//       LEFT JOIN phong_ban pb_cc ON pn.phong_ban_cung_cap_id = pb_cc.id
//       LEFT JOIN users u ON pn.nguoi_tao = u.id
//       LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
//       LEFT JOIN phieu_xuat px ON pn.phieu_xuat_lien_ket_id = px.id
//       ${whereClause}
//       ${orderClause}
//       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
//     `;

//     params.push(limit, offset);

//     const [countResult, dataResult] = await Promise.all([
//       pool.query(countQuery, params.slice(0, -2)),
//       pool.query(dataQuery, params),
//     ]);

//     const total = parseInt(countResult.rows[0].count);
//     const pages = Math.ceil(total / limit);
//     const structuredItems = dataResult.rows.map((item) => ({
//       ...item,
//       nha_cung_cap: item.ncc_id
//         ? {
//             id: item.ncc_id,
//             ma_ncc: item.ma_ncc,
//             ten_ncc: item.ten_ncc,
//           }
//         : null,
//       phong_ban_cung_cap: item.pb_cc_id
//         ? {
//             id: item.pb_cc_id,
//             ten_phong_ban: item.ten_pb_cung_cap,
//             cap_bac: item.cap_bac_cung_cap,
//           }
//         : null,
//       user_tao: item.nguoi_tao_id
//         ? {
//             id: item.nguoi_tao_id,
//             ho_ten: item.nguoi_tao_ten,
//           }
//         : null,
//       phieu_xuat_lien_ket: item.phieu_xuat_lien_ket_id_ref
//         ? {
//             id: item.phieu_xuat_lien_ket_id_ref,
//             so_phieu: item.so_phieu_xuat_lien_ket,
//             trang_thai: item.trang_thai_phieu_xuat_lien_ket,
//           }
//         : null,
//     }));

//     sendResponse(res, 200, true, "Láº¥y danh sÃ¡ch thÃ nh cÃ´ng", {
//       items: structuredItems,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total,
//         pages,
//       },
//     });
//   } catch (error) {
//     console.error("Get phieu nhap error:", error);
//     sendResponse(res, 500, false, "Lá»—i server");
//   }
// };

// Cáº­p nháº­t approve Ä‘á»ƒ trigger tá»± Ä‘á»™ng táº¡o phiáº¿u xuáº¥t
const approve = async (req, res, params, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;

    // Chá»‰ admin má»›i cÃ³ quyá»n duyá»‡t
    if (user.role !== "admin") {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        403,
        false,
        "Báº¡n khÃ´ng cÃ³ quyá»n duyá»‡t phiáº¿u"
      );
    }

    const phieu = await client.query("SELECT * FROM phieu_nhap WHERE id = $1", [
      id,
    ]);

    if (phieu.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "KhÃ´ng tÃ¬m tháº¥y phiáº¿u nháº­p");
    }

    if (phieu.rows[0].trang_thai !== "confirmed") {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Chá»‰ cÃ³ thá»ƒ duyá»‡t phiáº¿u Ä‘ang chá» duyá»‡t"
      );
    }

    // Cáº­p nháº­t tráº¡ng thÃ¡i thÃ nh approved - trigger sáº½ tá»± Ä‘á»™ng táº¡o phiáº¿u xuáº¥t náº¿u cáº§n
    await client.query(
      `UPDATE phieu_nhap 
       SET trang_thai = 'approved', nguoi_duyet = $1, ngay_duyet = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [user.id, id]
    );

    // Gá»­i thÃ´ng bÃ¡o cho ngÆ°á»i táº¡o phiáº¿u
    const phieuData = phieu.rows[0];
    await notificationService.createNotifications(
      [phieuData.nguoi_tao],
      "Phiáº¿u nháº­p kho Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t",
      `Phiáº¿u nháº­p ${phieuData.so_phieu} Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t bá»Ÿi ${user.ho_ten}`,
      "phieu_nhap_duyet",
      {
        phieu_id: phieuData.id,
        so_phieu: phieuData.so_phieu,
        nguoi_duyet: user.ho_ten,
        url: `/nhap-kho/${phieuData.id}`,
      }
    );

    // Náº¿u lÃ  phiáº¿u nháº­p tá»« trÃªn cáº¥p, gá»­i thÃ´ng bÃ¡o Ä‘áº¿n phÃ²ng ban cung cáº¥p
    if (
      phieuData.loai_phieu === "tren_cap" &&
      phieuData.phong_ban_cung_cap_id
    ) {
      const adminCapTren = await client.query(
        "SELECT id FROM users WHERE phong_ban_id = $1 AND role IN ('admin', 'manager') AND trang_thai = 'active'",
        [phieuData.phong_ban_cung_cap_id]
      );

      if (adminCapTren.rows.length > 0) {
        const adminIds = adminCapTren.rows.map((row) => row.id);
        await notificationService.createNotifications(
          adminIds,
          "Phiáº¿u nháº­p tá»« cáº¥p dÆ°á»›i Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t",
          `Phiáº¿u nháº­p ${phieuData.so_phieu} tá»« cáº¥p dÆ°á»›i Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t. Há»‡ thá»‘ng Ä‘Ã£ tá»± Ä‘á»™ng táº¡o phiáº¿u xuáº¥t tÆ°Æ¡ng á»©ng.`,
          "phieu_nhap_duyet_cap_duoi",
          {
            phieu_id: phieuData.id,
            so_phieu: phieuData.so_phieu,
            url: `/xuat-kho`,
          }
        );
      }
    }

    await client.query("COMMIT");

    let successMessage = "Duyá»‡t phiáº¿u nháº­p thÃ nh cÃ´ng";
    if (
      phieuData.loai_phieu === "tren_cap" ||
      phieuData.loai_phieu === "dieu_chuyen"
    ) {
      successMessage +=
        ". Há»‡ thá»‘ng Ä‘Ã£ tá»± Ä‘á»™ng táº¡o phiáº¿u xuáº¥t tÆ°Æ¡ng á»©ng cho Ä‘Æ¡n vá»‹ cung cáº¥p.";
    }

    sendResponse(res, 200, true, successMessage);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Approve phieu nhap error:", error);
    sendResponse(res, 500, false, "Lá»—i server");
  } finally {
    client.release();
  }
};

const complete = async (req, res, params, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;

    const phieu = await client.query("SELECT * FROM phieu_nhap WHERE id = $1", [
      id,
    ]);

    if (phieu.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "KhÃ´ng tÃ¬m tháº¥y phiáº¿u nháº­p");
    }

    const phieuData = phieu.rows[0];

    if (phieuData.trang_thai !== "approved") {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Chá»‰ cÃ³ thá»ƒ hoÃ n thÃ nh phiáº¿u Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t"
      );
    }

    // Láº¥y chi tiáº¿t Ä‘á»ƒ cáº­p nháº­t giÃ¡ nháº­p gáº§n nháº¥t
    const chiTiet = await client.query(
      `SELECT ct.*, h.ten_hang_hoa
       FROM chi_tiet_nhap ct
       JOIN hang_hoa h ON ct.hang_hoa_id = h.id
       WHERE ct.phieu_nhap_id = $1`,
      [id]
    );

    // Cáº­p nháº­t giÃ¡ nháº­p gáº§n nháº¥t cho hÃ ng hÃ³a
    for (const item of chiTiet.rows) {
      await client.query(
        `UPDATE hang_hoa
         SET gia_nhap_gan_nhat = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [item.don_gia, item.hang_hoa_id]
      );
    }

    // TÃ­nh láº¡i tá»•ng tiá»n dá»±a trÃªn sá»‘ lÆ°á»£ng thá»±c nháº­p
    const tongTienResult = await client.query(
      `SELECT SUM(so_luong * don_gia) as tong_tien_thuc_te
       FROM chi_tiet_nhap
       WHERE phieu_nhap_id = $1`,
      [id]
    );

    const tongTienThucTe = tongTienResult.rows[0]?.tong_tien_thuc_te || 0;

    // HoÃ n thÃ nh phiáº¿u - trigger sáº½ tá»± Ä‘á»™ng cáº­p nháº­t tá»“n kho
    await client.query(
      `UPDATE phieu_nhap
       SET trang_thai = 'completed',
           tong_tien = $1,
           ngay_hoan_thanh = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [tongTienThucTe, id]
    );

    await client.query("COMMIT");

    let successMessage = "HoÃ n thÃ nh phiáº¿u nháº­p thÃ nh cÃ´ng";
    sendResponse(res, 200, true, successMessage);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Complete phieu nhap error:", error);
    sendResponse(res, 500, false, "Lá»—i server");
  } finally {
    client.release();
  }
};

// Láº¥y danh sÃ¡ch phÃ²ng ban cÃ³ thá»ƒ cung cáº¥p vá»›i thÃ´ng tin chi tiáº¿t hÆ¡n
const getPhongBanCungCap = async (req, res, query, user) => {
  try {
    const { loai_phieu = "tren_cap" } = query;

    const result = await pool.query(
      `SELECT pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac,
              -- Äáº¿m sá»‘ lÆ°á»£ng hÃ ng hÃ³a cÃ³ thá»ƒ cung cáº¥p
              COUNT(tk.hang_hoa_id) as so_hang_hoa_co_the_cung_cap,
              -- Tá»•ng giÃ¡ trá»‹ cÃ³ thá»ƒ cung cáº¥p
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
      "Láº¥y danh sÃ¡ch phÃ²ng ban thÃ nh cÃ´ng",
      result.rows
    );
  } catch (error) {
    console.error("Get phong ban cung cap error:", error);
    sendResponse(res, 500, false, "Lá»—i server");
  }
};

// Láº¥y hÃ ng hÃ³a cÃ³ thá»ƒ nháº­p tá»« phÃ²ng ban cung cáº¥p
const getHangHoaCoTheNhap = async (req, res, query, user) => {
  try {
    const { phong_ban_cung_cap_id } = query;

    if (!phong_ban_cung_cap_id) {
      return sendResponse(
        res,
        400,
        false,
        "Thiáº¿u thÃ´ng tin phÃ²ng ban cung cáº¥p"
      );
    }

    // Kiá»ƒm tra quyá»n nháº­n tá»« phÃ²ng ban nÃ y
    const permissionCheck = await pool.query(
      `SELECT check_phong_ban_permission($1, $2, 'request') as can_request`,
      [user.id, phong_ban_cung_cap_id]
    );

    if (!permissionCheck.rows[0]?.can_request) {
      return sendResponse(
        res,
        403,
        false,
        "Báº¡n khÃ´ng cÃ³ quyá»n yÃªu cáº§u nháº­p tá»« Ä‘Æ¡n vá»‹ nÃ y"
      );
    }

    const result = await pool.query(
      `SELECT h.id, h.ma_hang_hoa, h.ten_hang_hoa, h.don_vi_tinh,
              lh.ten_loai,
              tk.sl_tot, tk.sl_kem_pham_chat, tk.sl_mat_pham_chat, 
              tk.sl_hong, tk.sl_can_thanh_ly,
              (tk.sl_tot + tk.sl_kem_pham_chat + tk.sl_mat_pham_chat + tk.sl_hong + tk.sl_can_thanh_ly) as so_luong_ton,
              tk.don_gia_binh_quan,
              tk.gia_tri_ton
       FROM hang_hoa h
       JOIN ton_kho tk ON h.id = tk.hang_hoa_id
       LEFT JOIN loai_hang_hoa lh ON h.loai_hang_hoa_id = lh.id
       WHERE tk.phong_ban_id = $1 
       AND (tk.sl_tot + tk.sl_kem_pham_chat + tk.sl_mat_pham_chat + tk.sl_hong + tk.sl_can_thanh_ly) > 0
       AND h.trang_thai = 'active'
       ORDER BY h.ten_hang_hoa`,
      [phong_ban_cung_cap_id]
    );

    sendResponse(
      res,
      200,
      true,
      "Láº¥y danh sÃ¡ch hÃ ng hÃ³a thÃ nh cÃ´ng",
      result.rows
    );
  } catch (error) {
    console.error("Get hang hoa co the nhap error:", error);
    sendResponse(res, 500, false, "Lá»—i server");
  }
};

// CÃ¡c function khÃ¡c giá»¯ nguyÃªn logic cÅ©
const create = async (req, res, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      ngay_nhap,
      nha_cung_cap_id,
      don_vi_van_chuyen_id,
      ly_do_nhap,
      loai_phieu = "tu_mua",
      so_hoa_don,
      nguoi_nhap_hang,
      so_quyet_dinh,
      dia_chi_nhap,
      phuong_thuc_van_chuyen = "ÄÆ¡n vá»‹ tá»± váº­n chuyá»ƒn",
      phong_ban_id,
      phong_ban_cung_cap_id,
      ghi_chu,
      chi_tiet = [],
    } = body;

    if (!ngay_nhap || !chi_tiet.length) {
      await client.query("ROLLBACK");
      return sendResponse(res, 400, false, "Thiáº¿u thÃ´ng tin báº¯t buá»™c");
    }

    // Validation theo loáº¡i phiáº¿u
    if (
      (loai_phieu === "tren_cap" || loai_phieu === "dieu_chuyen") &&
      !phong_ban_cung_cap_id
    ) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Vui lÃ²ng chá»n Ä‘Æ¡n vá»‹ cung cáº¥p"
      );
    }

    if (loai_phieu === "tu_mua" && !nha_cung_cap_id) {
      await client.query("ROLLBACK");
      return sendResponse(res, 400, false, "Vui lÃ²ng chá»n nhÃ  cung cáº¥p");
    }

    // Kiá»ƒm tra quyá»n nháº­p tá»« phÃ²ng ban cung cáº¥p
    if (phong_ban_cung_cap_id) {
      const permissionCheck = await client.query(
        `SELECT check_phong_ban_permission($1, $2, 'request') as can_request`,
        [user.id, phong_ban_cung_cap_id]
      );

      if (!permissionCheck.rows[0]?.can_request) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          403,
          false,
          "Báº¡n khÃ´ng cÃ³ quyá»n yÃªu cáº§u nháº­p tá»« Ä‘Æ¡n vá»‹ nÃ y"
        );
      }
    }

    // Táº¡o sá»‘ phiáº¿u tá»± Ä‘á»™ng
    const dateStr = new Date(ngay_nhap)
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");

    const maxResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(so_phieu FROM 11) AS INTEGER)), 0) as max_seq 
       FROM phieu_nhap 
       WHERE so_phieu LIKE $1`,
      [`PN${dateStr}%`]
    );

    const nextSeq = maxResult.rows[0].max_seq + 1;
    const soPhieu = `PN${dateStr}${String(nextSeq).padStart(3, "0")}`;

    // Validate vÃ  tÃ­nh tá»•ng tiá»n cho chi tiáº¿t
    let tongTien = 0;
    for (const item of chi_tiet) {
      if (
        !item.hang_hoa_id ||
        !item.so_luong_ke_hoach ||
        item.don_gia === undefined
      ) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          "Chi tiáº¿t nháº­p khÃ´ng há»£p lá»‡"
        );
      }

      // Kiá»ƒm tra hÃ ng hÃ³a tá»“n táº¡i
      const hangHoaCheck = await client.query(
        "SELECT id, ten_hang_hoa, gia_nhap_gan_nhat FROM hang_hoa WHERE id = $1",
        [item.hang_hoa_id]
      );

      if (hangHoaCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          `HÃ ng hÃ³a ID ${item.hang_hoa_id} khÃ´ng tá»“n táº¡i`
        );
      }

      const hangHoa = hangHoaCheck.rows[0];
      const donGia = item.don_gia || hangHoa.gia_nhap_gan_nhat || 0;
      tongTien += item.so_luong_ke_hoach * donGia;
    }

    // Táº¡o phiáº¿u nháº­p vá»›i tráº¡ng thÃ¡i draft
    const phieuResult = await client.query(
      `INSERT INTO phieu_nhap (
        so_phieu, ngay_nhap, nha_cung_cap_id, don_vi_van_chuyen_id,
        ly_do_nhap, loai_phieu, so_hoa_don, nguoi_nhap_hang, so_quyet_dinh,
        dia_chi_nhap, phuong_thuc_van_chuyen, phong_ban_id, phong_ban_cung_cap_id, 
        ghi_chu, nguoi_tao, tong_tien, trang_thai
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'draft')
      RETURNING *`,
      [
        soPhieu,
        ngay_nhap,
        nha_cung_cap_id,
        don_vi_van_chuyen_id,
        ly_do_nhap,
        loai_phieu,
        so_hoa_don,
        nguoi_nhap_hang,
        so_quyet_dinh,
        dia_chi_nhap,
        phuong_thuc_van_chuyen,
        phong_ban_id || user.phong_ban_id,
        phong_ban_cung_cap_id,
        ghi_chu,
        user.id,
        tongTien,
      ]
    );

    const phieuNhap = phieuResult.rows[0];

    // Táº¡o chi tiáº¿t nháº­p
    for (const item of chi_tiet) {
      const {
        hang_hoa_id,
        so_luong_ke_hoach,
        so_luong,
        don_gia,
        so_seri_list = [],
        pham_chat = "tot",
        han_su_dung,
        vi_tri_kho,
        ghi_chu: item_ghi_chu,
      } = item;

      const hangHoa = await client.query(
        "SELECT gia_nhap_gan_nhat FROM hang_hoa WHERE id = $1",
        [hang_hoa_id]
      );

      const donGiaFinal = don_gia || hangHoa.rows[0]?.gia_nhap_gan_nhat || 0;
      const soLuongThucNhap = so_luong || so_luong_ke_hoach;
      const thanhTien = so_luong_ke_hoach * donGiaFinal;

      await client.query(
        `INSERT INTO chi_tiet_nhap (
          phieu_nhap_id, hang_hoa_id, so_luong_ke_hoach, so_luong,
          don_gia, thanh_tien, so_seri_list, pham_chat, han_su_dung, vi_tri_kho, ghi_chu
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          phieuNhap.id,
          hang_hoa_id,
          so_luong_ke_hoach,
          soLuongThucNhap,
          donGiaFinal,
          thanhTien,
          so_seri_list.length > 0 ? so_seri_list : null,
          pham_chat,
          han_su_dung,
          vi_tri_kho,
          item_ghi_chu,
        ]
      );
    }

    await client.query("COMMIT");

    sendResponse(res, 201, true, "Táº¡o phiáº¿u nháº­p thÃ nh cÃ´ng", {
      id: phieuNhap.id,
      so_phieu: phieuNhap.so_phieu,
      tong_tien: tongTien,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create phieu nhap error:", error);
    sendResponse(res, 500, false, "Lá»—i server");
  } finally {
    client.release();
  }
};

// CÃ¡c function khÃ¡c giá»¯ nguyÃªn
const getDetail = async (req, res, params, user) => {
  try {
    const { id } = params;

    const detailQuery = `
      SELECT 
        pn.*, 
        ncc.id as ncc_id, ncc.ma_ncc, ncc.ten_ncc, ncc.dia_chi as ncc_dia_chi,
        pb_cc.id as pb_cc_id, pb_cc.ten_phong_ban as ten_pb_cung_cap, pb_cc.cap_bac as cap_bac_cung_cap,
        u1.id as nguoi_tao_id, u1.ho_ten as nguoi_tao_ten,
        u2.id as nguoi_duyet_id, u2.ho_ten as nguoi_duyet_ten,
        pb.ten_phong_ban,
        px.id as phieu_xuat_lien_ket_id_ref,
        px.so_phieu as so_phieu_xuat_lien_ket,
        px.trang_thai as trang_thai_phieu_xuat_lien_ket
      FROM phieu_nhap pn
      LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
      LEFT JOIN phong_ban pb_cc ON pn.phong_ban_cung_cap_id = pb_cc.id
      LEFT JOIN users u1 ON pn.nguoi_tao = u1.id
      LEFT JOIN users u2 ON pn.nguoi_duyet = u2.id
      LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
      LEFT JOIN phieu_xuat px ON pn.phieu_xuat_lien_ket_id = px.id
      WHERE pn.id = $1
    `;

    const chiTietQuery = `
      SELECT 
        ctn.*, 
        h.id as hang_hoa_id_ref, h.ma_hang_hoa, h.ten_hang_hoa, h.don_vi_tinh, h.co_so_seri, h.la_tai_san_co_dinh,
        seri_data.danh_diem
      FROM chi_tiet_nhap ctn
      JOIN hang_hoa h ON ctn.hang_hoa_id = h.id
      LEFT JOIN (
        SELECT 
          hhs.hang_hoa_id,
          hhs.phieu_nhap_id,
          string_agg(hhs.so_seri, ', ' ORDER BY hhs.so_seri) as danh_diem
        FROM hang_hoa_seri hhs
        GROUP BY hhs.hang_hoa_id, hhs.phieu_nhap_id
      ) seri_data ON seri_data.hang_hoa_id = h.id AND seri_data.phieu_nhap_id = ctn.phieu_nhap_id
      WHERE ctn.phieu_nhap_id = $1
      ORDER BY ctn.id
    `;

    const [phieuResult, chiTietResult] = await Promise.all([
      pool.query(detailQuery, [id]),
      pool.query(chiTietQuery, [id]),
    ]);

    if (phieuResult.rows.length === 0) {
      return sendResponse(res, 404, false, "KhÃ´ng tÃ¬m tháº¥y phiáº¿u nháº­p");
    }

    const phieuData = phieuResult.rows[0];

    // Kiá»ƒm tra quyá»n xem theo cáº¥p báº­c
    if (user.role !== "admin" && phieuData.phong_ban_id !== user.phong_ban_id) {
      return sendResponse(
        res,
        403,
        false,
        "Báº¡n khÃ´ng cÃ³ quyá»n xem phiáº¿u nháº­p nÃ y"
      );
    }

    const phieuNhap = {
      ...phieuData,
      nha_cung_cap: phieuData.ncc_id
        ? {
            id: phieuData.ncc_id,
            ma_ncc: phieuData.ma_ncc,
            ten_ncc: phieuData.ten_ncc,
            dia_chi: phieuData.ncc_dia_chi,
          }
        : null,
      phong_ban_cung_cap: phieuData.pb_cc_id
        ? {
            id: phieuData.pb_cc_id,
            ten_phong_ban: phieuData.ten_pb_cung_cap,
            cap_bac: phieuData.cap_bac_cung_cap,
          }
        : null,
      user_tao: phieuData.nguoi_tao_id
        ? {
            id: phieuData.nguoi_tao_id,
            ho_ten: phieuData.nguoi_tao_ten,
          }
        : null,
      user_duyet: phieuData.nguoi_duyet_id
        ? {
            id: phieuData.nguoi_duyet_id,
            ho_ten: phieuData.nguoi_duyet_ten,
          }
        : null,
      phieu_xuat_lien_ket: phieuData.phieu_xuat_lien_ket_id_ref
        ? {
            id: phieuData.phieu_xuat_lien_ket_id_ref,
            so_phieu: phieuData.so_phieu_xuat_lien_ket,
            trang_thai: phieuData.trang_thai_phieu_xuat_lien_ket,
          }
        : null,
      chi_tiet: chiTietResult.rows.map((item) => ({
        ...item,
        hang_hoa: {
          id: item.hang_hoa_id_ref,
          ma_hang_hoa: item.ma_hang_hoa,
          ten_hang_hoa: item.ten_hang_hoa,
          don_vi_tinh: item.don_vi_tinh,
          co_so_seri: item.co_so_seri,
          la_tai_san_co_dinh: item.la_tai_san_co_dinh,
        },
      })),
    };

    sendResponse(res, 200, true, "Láº¥y chi tiáº¿t thÃ nh cÃ´ng", phieuNhap);
  } catch (error) {
    console.error("Get phieu nhap detail error:", error);
    sendResponse(res, 500, false, "Lá»—i server");
  }
};

const updateActualQuantity = async (req, res, params, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;
    const { chi_tiet_cap_nhat = [] } = body;

    // Kiá»ƒm tra phiáº¿u tá»“n táº¡i vÃ  tráº¡ng thÃ¡i
    const phieu = await client.query("SELECT * FROM phieu_nhap WHERE id = $1", [
      id,
    ]);

    if (phieu.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "KhÃ´ng tÃ¬m tháº¥y phiáº¿u nháº­p");
    }

    const phieuData = phieu.rows[0];

    if (phieuData.trang_thai !== "approved") {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Chá»‰ cÃ³ thá»ƒ sá»­a sá»‘ lÆ°á»£ng thá»±c táº¿ khi phiáº¿u Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t"
      );
    }

    // Validation sá»‘ lÆ°á»£ng thá»±c nháº­p
    for (const item of chi_tiet_cap_nhat) {
      if (!item.hang_hoa_id || !item.so_luong || item.so_luong <= 0) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          "Sá»‘ lÆ°á»£ng thá»±c nháº­p khÃ´ng há»£p lá»‡"
        );
      }

      // Cáº£nh bÃ¡o náº¿u chÃªnh lá»‡ch quÃ¡ lá»›n so vá»›i káº¿ hoáº¡ch
      const keHoachResult = await client.query(
        "SELECT so_luong_ke_hoach FROM chi_tiet_nhap WHERE phieu_nhap_id = $1 AND hang_hoa_id = $2",
        [id, item.hang_hoa_id]
      );

      if (keHoachResult.rows.length > 0) {
        const soLuongKeHoach = keHoachResult.rows[0].so_luong_ke_hoach;
        const chenhLech =
          Math.abs(item.so_luong - soLuongKeHoach) / soLuongKeHoach;

        if (chenhLech > 0.2) {
          // ChÃªnh lá»‡ch > 20%
          console.warn(
            `Cáº£nh bÃ¡o: Sá»‘ lÆ°á»£ng thá»±c nháº­p chÃªnh lá»‡ch lá»›n so vá»›i káº¿ hoáº¡ch cho hÃ ng hÃ³a ID ${item.hang_hoa_id}`
          );
        }
      }
    }

    // Cáº­p nháº­t sá»‘ lÆ°á»£ng thá»±c nháº­p
    for (const item of chi_tiet_cap_nhat) {
      await client.query(
        `UPDATE chi_tiet_nhap 
         SET so_luong = $1,
             thanh_tien = $1 * don_gia
             
         WHERE phieu_nhap_id = $2 AND hang_hoa_id = $3`,
        [item.so_luong, id, item.hang_hoa_id]
      );
    }

    // TÃ­nh láº¡i tá»•ng tiá»n thá»±c táº¿
    const tongTienResult = await client.query(
      `SELECT SUM(so_luong * don_gia) as tong_tien_thuc_te
       FROM chi_tiet_nhap 
       WHERE phieu_nhap_id = $1`,
      [id]
    );

    const tongTienThucTe = tongTienResult.rows[0]?.tong_tien_thuc_te || 0;

    await client.query(
      `UPDATE phieu_nhap 
       SET tong_tien = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [tongTienThucTe, id]
    );

    await client.query("COMMIT");
    sendResponse(
      res,
      200,
      true,
      "Cáº­p nháº­t sá»‘ lÆ°á»£ng thá»±c táº¿ thÃ nh cÃ´ng"
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update actual quantity error:", error);
    sendResponse(res, 500, false, "Lá»—i server");
  } finally {
    client.release();
  }
};

// Gá»­i phiáº¿u Ä‘á»ƒ duyá»‡t
const submit = async (req, res, params, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;

    // Kiá»ƒm tra phiáº¿u tá»“n táº¡i vÃ  quyá»n
    const phieuResult = await client.query(
      "SELECT * FROM phieu_nhap WHERE id = $1",
      [id]
    );

    if (phieuResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "KhÃ´ng tÃ¬m tháº¥y phiáº¿u nháº­p");
    }

    const phieu = phieuResult.rows[0];

    if (user.role !== "admin" && phieu.nguoi_tao !== user.id) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        403,
        false,
        "Báº¡n khÃ´ng cÃ³ quyá»n thá»±c hiá»‡n hÃ nh Ä‘á»™ng nÃ y"
      );
    }

    if (!["draft", "revision_required"].includes(phieu.trang_thai)) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Chá»‰ cÃ³ thá»ƒ gá»­i phiáº¿u á»Ÿ tráº¡ng thÃ¡i nhÃ¡p hoáº·c yÃªu cáº§u sá»­a"
      );
    }

    // Kiá»ƒm tra cÃ³ chi tiáº¿t hay khÃ´ng
    const chiTietCount = await client.query(
      "SELECT COUNT(*) FROM chi_tiet_nhap WHERE phieu_nhap_id = $1",
      [id]
    );

    if (parseInt(chiTietCount.rows[0].count) === 0) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Phiáº¿u pháº£i cÃ³ Ã­t nháº¥t má»™t máº·t hÃ ng"
      );
    }

    // Cáº­p nháº­t tráº¡ng thÃ¡i thÃ nh confirmed vÃ  xÃ³a ghi chÃº pháº£n há»“i cÅ©
    await client.query(
      `UPDATE phieu_nhap SET 
        trang_thai = 'confirmed', 
        ngay_gui_duyet = CURRENT_TIMESTAMP,
        ghi_chu_phan_hoi = NULL,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1`,
      [id]
    );

    // Gá»­i thÃ´ng bÃ¡o cho admin
    const adminUsers = await client.query(
      "SELECT id FROM users WHERE role = 'admin' AND trang_thai = 'active'"
    );

    if (adminUsers.rows.length > 0) {
      const adminIds = adminUsers.rows.map((row) => row.id);

      await notificationService.createNotifications(
        adminIds,
        "Phiáº¿u nháº­p kho cáº§n duyá»‡t",
        `Phiáº¿u nháº­p ${phieu.so_phieu} Ä‘ang chá» duyá»‡t tá»« ${user.ho_ten}`,
        "phieu_nhap_can_duyet",
        {
          phieu_id: phieu.id,
          so_phieu: phieu.so_phieu,
          nguoi_tao: user.ho_ten,
          url: `/nhap-kho/${phieu.id}`,
        }
      );
    }

    await client.query("COMMIT");
    sendResponse(res, 200, true, "Gá»­i phiáº¿u thÃ nh cÃ´ng");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Submit phieu error:", error);
    sendResponse(res, 500, false, "Lá»—i server");
  } finally {
    client.release();
  }
};

// YÃªu cáº§u chá»‰nh sá»­a phiáº¿u
const requestRevision = async (req, res, params, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;
    const { ghi_chu_phan_hoi } = body;

    if (!ghi_chu_phan_hoi) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Vui lÃ²ng nháº­p ghi chÃº pháº£n há»“i"
      );
    }

    // Chá»‰ admin má»›i cÃ³ quyá»n yÃªu cáº§u chá»‰nh sá»­a
    if (user.role !== "admin") {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        403,
        false,
        "Báº¡n khÃ´ng cÃ³ quyá»n yÃªu cáº§u chá»‰nh sá»­a"
      );
    }

    const phieu = await client.query("SELECT * FROM phieu_nhap WHERE id = $1", [
      id,
    ]);

    if (phieu.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "KhÃ´ng tÃ¬m tháº¥y phiáº¿u nháº­p");
    }

    if (phieu.rows[0].trang_thai !== "confirmed") {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Chá»‰ cÃ³ thá»ƒ yÃªu cáº§u chá»‰nh sá»­a phiáº¿u Ä‘ang chá» duyá»‡t"
      );
    }

    // Cáº­p nháº­t tráº¡ng thÃ¡i thÃ nh revision_required
    await client.query(
      `UPDATE phieu_nhap 
       SET trang_thai = 'revision_required', 
           ghi_chu_phan_hoi = $1,
           nguoi_duyet = $2,
           ngay_duyet = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [ghi_chu_phan_hoi, user.id, id]
    );

    // Gá»­i thÃ´ng bÃ¡o cho ngÆ°á»i táº¡o phiáº¿u
    const phieuData = phieu.rows[0];
    await notificationService.createNotifications(
      [phieuData.nguoi_tao],
      "Phiáº¿u nháº­p kho cáº§n chá»‰nh sá»­a",
      `Phiáº¿u nháº­p ${phieuData.so_phieu} cáº§n chá»‰nh sá»­a. LÃ½ do: ${ghi_chu_phan_hoi}`,
      "phieu_nhap_can_sua",
      {
        phieu_id: phieuData.id,
        so_phieu: phieuData.so_phieu,
        nguoi_duyet: user.ho_ten,
        ghi_chu: ghi_chu_phan_hoi,
        url: `/nhap-kho/${phieuData.id}`,
      }
    );

    await client.query("COMMIT");
    sendResponse(res, 200, true, "YÃªu cáº§u chá»‰nh sá»­a thÃ nh cÃ´ng");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Request revision error:", error);
    sendResponse(res, 500, false, "Lá»—i server");
  } finally {
    client.release();
  }
};

const update = async (req, res, params, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;
    const {
      ngay_nhap,
      loai_phieu,
      nguoi_nhap_hang,
      so_quyet_dinh,
      so_hoa_don,
      dia_chi_nhap,
      phuong_thuc_van_chuyen,
      ly_do_nhap,
      ghi_chu,
      nha_cung_cap_id,
      chi_tiet = [],
    } = body;

    // Kiá»ƒm tra phiáº¿u tá»“n táº¡i vÃ  quyá»n chá»‰nh sá»­a
    const phieuResult = await client.query(
      "SELECT * FROM phieu_nhap WHERE id = $1",
      [id]
    );

    if (phieuResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "KhÃ´ng tÃ¬m tháº¥y phiáº¿u nháº­p");
    }

    const phieu = phieuResult.rows[0];

    if (user.role !== "admin" && phieu.nguoi_tao !== user.id) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        403,
        false,
        "Báº¡n khÃ´ng cÃ³ quyá»n sá»­a phiáº¿u nÃ y"
      );
    }

    // Chá»‰ cho phÃ©p chá»‰nh sá»­a khi á»Ÿ tráº¡ng thÃ¡i draft hoáº·c revision_required
    if (!["draft", "revision_required"].includes(phieu.trang_thai)) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "KhÃ´ng thá»ƒ sá»­a phiáº¿u Ä‘Ã£ Ä‘Æ°á»£c xá»­ lÃ½."
      );
    }

    // Validate chi tiáº¿t nháº­p
    if (!chi_tiet || chi_tiet.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Cáº§n cÃ³ Ã­t nháº¥t má»™t chi tiáº¿t hÃ ng hÃ³a"
      );
    }

    for (let i = 0; i < chi_tiet.length; i++) {
      const item = chi_tiet[i];
      if (
        !item.hang_hoa_id ||
        !item.so_luong_ke_hoach ||
        item.don_gia === undefined
      ) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          `Chi tiáº¿t dÃ²ng ${i + 1} khÃ´ng há»£p lá»‡`
        );
      }
    }

    // Cáº­p nháº­t thÃ´ng tin phiáº¿u nháº­p
    await client.query(
      `UPDATE phieu_nhap 
       SET ngay_nhap = $1, nha_cung_cap_id = $2, ly_do_nhap = $3,
           so_hoa_don = $4, ghi_chu = $5, loai_phieu = $6,
           nguoi_nhap_hang = $7, so_quyet_dinh = $8, dia_chi_nhap = $9,
           phuong_thuc_van_chuyen = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11`,
      [
        ngay_nhap,
        nha_cung_cap_id,
        ly_do_nhap,
        so_hoa_don,
        ghi_chu,
        loai_phieu,
        nguoi_nhap_hang,
        so_quyet_dinh,
        dia_chi_nhap,
        phuong_thuc_van_chuyen,
        id,
      ]
    );

    // XÃ³a chi tiáº¿t cÅ©
    await client.query("DELETE FROM chi_tiet_nhap WHERE phieu_nhap_id = $1", [
      id,
    ]);

    // ThÃªm chi tiáº¿t má»›i
    let tongTien = 0;
    for (const item of chi_tiet) {
      const thanhTien =
        parseFloat(item.so_luong_ke_hoach) * parseFloat(item.don_gia);
      tongTien += thanhTien;

      await client.query(
        `INSERT INTO chi_tiet_nhap (
          phieu_nhap_id, hang_hoa_id, so_luong_ke_hoach, so_luong, don_gia, thanh_tien,
          so_seri_list, pham_chat, han_su_dung, vi_tri_kho, ghi_chu
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          id,
          item.hang_hoa_id,
          item.so_luong_ke_hoach,
          item.so_luong || item.so_luong_ke_hoach,
          item.don_gia,
          thanhTien,
          item.so_seri_list || null,
          item.pham_chat || "tot",
          item.han_su_dung,
          item.vi_tri_kho,
          item.ghi_chu,
        ]
      );
    }

    // Cáº­p nháº­t tá»•ng tiá»n
    await client.query("UPDATE phieu_nhap SET tong_tien = $1 WHERE id = $2", [
      tongTien,
      id,
    ]);

    await client.query("COMMIT");
    sendResponse(res, 200, true, "Cáº­p nháº­t phiáº¿u nháº­p thÃ nh cÃ´ng");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update phieu nhap error:", error);
    sendResponse(res, 500, false, "Lá»—i server");
  } finally {
    client.release();
  }
};

const deletePhieu = async (req, res, params, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;

    const phieuResult = await client.query(
      "SELECT * FROM phieu_nhap WHERE id = $1",
      [id]
    );

    if (phieuResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "KhÃ´ng tÃ¬m tháº¥y phiáº¿u nháº­p");
    }

    const phieu = phieuResult.rows[0];

    if (user.role !== "admin" && phieu.nguoi_tao !== user.id) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        403,
        false,
        "Báº¡n khÃ´ng cÃ³ quyá»n xÃ³a phiáº¿u nÃ y"
      );
    }

    if (phieu.trang_thai !== "draft") {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Chá»‰ cÃ³ thá»ƒ xÃ³a phiáº¿u á»Ÿ tráº¡ng thÃ¡i nhÃ¡p"
      );
    }

    // XÃ³a phiáº¿u (chi tiáº¿t sáº½ tá»± Ä‘á»™ng xÃ³a theo CASCADE)
    await client.query("DELETE FROM phieu_nhap WHERE id = $1", [id]);

    await client.query("COMMIT");
    sendResponse(res, 200, true, "XÃ³a phiáº¿u nháº­p thÃ nh cÃ´ng");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Delete phieu nhap error:", error);
    sendResponse(res, 500, false, "Lá»—i server");
  } finally {
    client.release();
  }
};

// Há»§y phiáº¿u
const cancel = async (req, res, params, user) => {
  try {
    const { id } = params;

    const phieu = await pool.query("SELECT * FROM phieu_nhap WHERE id = $1", [
      id,
    ]);

    if (phieu.rows.length === 0) {
      return sendResponse(res, 404, false, "KhÃ´ng tÃ¬m tháº¥y phiáº¿u nháº­p");
    }

    if (phieu.rows[0].trang_thai === "completed") {
      return sendResponse(
        res,
        400,
        false,
        "KhÃ´ng thá»ƒ há»§y phiáº¿u Ä‘Ã£ hoÃ n thÃ nh"
      );
    }

    await pool.query(
      `UPDATE phieu_nhap 
       SET trang_thai = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    sendResponse(res, 200, true, "Há»§y phiáº¿u nháº­p thÃ nh cÃ´ng");
  } catch (error) {
    console.error("Cancel phieu nhap error:", error);
    sendResponse(res, 500, false, "Lá»—i server");
  }
};

// Upload quyáº¿t Ä‘á»‹nh vÃ  download giá»¯ nguyÃªn
const uploadDecision = async (req, res, params, body, user, file) => {
  try {
    const { id } = params;
    const { ghi_chu_hoan_thanh } = body;

    if (!file) {
      return sendResponse(
        res,
        400,
        false,
        "Cáº§n chá»n file PDF quyáº¿t Ä‘á»‹nh"
      );
    }

    const phieu = await pool.query("SELECT * FROM phieu_nhap WHERE id = $1", [
      id,
    ]);

    if (phieu.rows.length === 0) {
      return sendResponse(res, 404, false, "KhÃ´ng tÃ¬m tháº¥y phiáº¿u nháº­p");
    }

    if (phieu.rows[0].trang_thai !== "approved") {
      return sendResponse(
        res,
        400,
        false,
        "Phiáº¿u chÆ°a Ä‘Æ°á»£c duyá»‡t hoáº·c Ä‘Ã£ hoÃ n thÃ nh"
      );
    }

    const decision_pdf_url = `/uploads/decisions/${file.filename}`;
    const decision_pdf_filename = file.originalname;

    await pool.query(
      `UPDATE phieu_nhap 
       SET decision_pdf_url = $1, decision_pdf_filename = $2, 
           ghi_chu_hoan_thanh = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [decision_pdf_url, decision_pdf_filename, ghi_chu_hoan_thanh || "", id]
    );

    sendResponse(res, 200, true, "Upload quyáº¿t Ä‘á»‹nh thÃ nh cÃ´ng", {
      filename: decision_pdf_filename,
      url: decision_pdf_url,
    });
  } catch (error) {
    console.error("Upload decision error:", error);
    sendResponse(res, 500, false, "Lá»—i server");
  }
};

const downloadDecision = async (req, res, params, user) => {
  try {
    const { id } = params;

    const phieu = await pool.query(
      "SELECT decision_pdf_url, decision_pdf_filename FROM phieu_nhap WHERE id = $1",
      [id]
    );

    if (phieu.rows.length === 0) {
      return sendResponse(res, 404, false, "KhÃ´ng tÃ¬m tháº¥y phiáº¿u nháº­p");
    }

    const { decision_pdf_url, decision_pdf_filename } = phieu.rows[0];

    if (!decision_pdf_url) {
      return sendResponse(
        res,
        404,
        false,
        "Phiáº¿u chÆ°a cÃ³ file quyáº¿t Ä‘á»‹nh"
      );
    }

    sendResponse(res, 200, true, "ThÃ´ng tin file", {
      url: decision_pdf_url,
      filename: decision_pdf_filename,
    });
  } catch (error) {
    console.error("Download decision error:", error);
    sendResponse(res, 500, false, "Lá»—i server");
  }
};

const getPhongBanList = async (req, res, query, user) => {
  try {
    let whereClause = "WHERE pb.is_active = true";
    const params = [];
    let paramCount = 0;

    console.log("🔍 GetPhongBanList - User info:", {
      role: user.role,
      phong_ban_id: user.phong_ban_id,
      cap_bac: user.phong_ban?.cap_bac,
    });

    // Phân quyền theo cấp bậc
    if (user.role === "admin" && user.phong_ban?.cap_bac === 1) {
      // Admin cấp 1: Lấy TẤT CẢ phòng ban cấp 2 và 3 (không bao gồm chính mình)
      console.log("🔥 Admin cấp 1 - lấy phòng ban cấp 2,3");
      whereClause += ` AND pb.cap_bac IN (2, 3)`;
    } else if (user.phong_ban?.cap_bac === 2) {
      // Cấp 2: Lấy các đơn vị cấp 3 thuộc quyền quản lý
      console.log("🔥 Cấp 2 - lấy phòng ban cấp 3 thuộc quyền");
      paramCount++;
      whereClause += ` AND pb.cap_bac = 3 AND pb.phong_ban_cha_id = $${paramCount}`;
      params.push(user.phong_ban_id);
    } else {
      // Cấp 3: Không có dropdown (trả về rỗng)
      console.log("🔥 Cấp 3 - không có dropdown");
      return sendResponse(res, 200, true, "Cấp 3 không có dropdown", []);
    }

    const queryStr = `
      SELECT pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac,
             pb.phong_ban_cha_id,
             pb_cha.ten_phong_ban as ten_phong_ban_cha
      FROM phong_ban pb
      LEFT JOIN phong_ban pb_cha ON pb.phong_ban_cha_id = pb_cha.id
      ${whereClause}
      ORDER BY pb.cap_bac ASC, pb.ten_phong_ban ASC
    `;

    console.log("🔍 Query:", queryStr);
    console.log("🔍 Params:", params);

    const result = await pool.query(queryStr, params);

    console.log("📊 Result:", result.rows);

    sendResponse(
      res,
      200,
      true,
      "Lấy danh sách phòng ban thành công",
      result.rows
    );
  } catch (error) {
    console.error("Get phong ban list error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

// Sửa function getList để xử lý filter đúng logic
const getList = async (req, res, query, user) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      tu_ngay,
      den_ngay,
      trang_thai,
      loai_phieu,
      phong_ban_filter = "own", // ✅ Mặc định là "own" (phòng ban của mình)
      sort_by = "created_at",
      sort_direction = "desc",
    } = query;

    const offset = (page - 1) * limit;
    let whereClause = "WHERE 1=1";
    const params = [];
    let paramCount = 0;

    // ✅ SỬA: Tìm kiếm theo số quyết định, số phiếu và tên nhà cung cấp/phòng ban cung cấp
    if (search && search.trim()) {
      paramCount++;
      // Sử dụng COALESCE để xử lý các giá trị NULL từ LEFT JOIN
      whereClause += ` AND (
        pn.so_quyet_dinh ILIKE $${paramCount} OR 
        pn.so_phieu ILIKE $${paramCount} OR
        COALESCE(ncc.ten_ncc, '') ILIKE $${paramCount} OR
        COALESCE(pb_cc.ten_phong_ban, '') ILIKE $${paramCount}
      )`;
      params.push(`%${search.trim()}%`);
    }

    if (tu_ngay && den_ngay) {
      paramCount += 2;
      whereClause += ` AND pn.ngay_nhap BETWEEN $${
        paramCount - 1
      } AND $${paramCount}`;
      params.push(tu_ngay, den_ngay);
    }

    if (trang_thai) {
      paramCount++;
      whereClause += ` AND pn.trang_thai = $${paramCount}`;
      params.push(trang_thai);
    }

    if (loai_phieu) {
      paramCount++;
      whereClause += ` AND pn.loai_phieu = $${paramCount}`;
      params.push(loai_phieu);
    }

    // ✅ XỬ LÝ FILTER THEO PHÒNG BAN
    console.log("🟢 Filter logic:", {
      user_role: user.role,
      user_cap_bac: user.phong_ban?.cap_bac,
      user_phong_ban_id: user.phong_ban_id,
      phong_ban_filter,
    });

    if (user.role === "admin" && user.phong_ban?.cap_bac === 1) {
      // Admin cấp 1
      if (phong_ban_filter === "own") {
        // Mặc định: chỉ xem phiếu của chính kho cấp 1
        paramCount++;
        whereClause += ` AND pn.phong_ban_id = $${paramCount}`;
        params.push(user.phong_ban_id);
      } else if (phong_ban_filter !== "all") {
        // Chọn phòng ban cụ thể từ dropdown
        paramCount++;
        whereClause += ` AND pn.phong_ban_id = $${paramCount}`;
        params.push(phong_ban_filter);
      }
      // Nếu phong_ban_filter === "all" thì không thêm điều kiện (xem tất cả)
    } else if (user.phong_ban?.cap_bac === 2) {
      // Cấp 2
      if (phong_ban_filter === "own") {
        // Mặc định: chỉ xem phiếu của chính phòng ban cấp 2
        paramCount++;
        whereClause += ` AND pn.phong_ban_id = $${paramCount}`;
        params.push(user.phong_ban_id);
      } else if (phong_ban_filter !== "all") {
        // Chọn đơn vị cấp 3 cụ thể
        paramCount++;
        whereClause += ` AND pn.phong_ban_id = $${paramCount}`;
        params.push(phong_ban_filter);
      } else {
        // "all": xem tất cả phiếu của phòng ban mình + cấp 3 thuộc quyền
        const phongBanCap3Result = await pool.query(
          "SELECT id FROM phong_ban WHERE phong_ban_cha_id = $1 AND is_active = true",
          [user.phong_ban_id]
        );

        const phongBanIds = [
          user.phong_ban_id,
          ...phongBanCap3Result.rows.map((pb) => pb.id),
        ];
        paramCount++;
        whereClause += ` AND pn.phong_ban_id = ANY($${paramCount}::int[])`;
        params.push(phongBanIds);
      }
    } else {
      // Cấp 3: chỉ xem phiếu của chính mình
      paramCount++;
      whereClause += ` AND pn.phong_ban_id = $${paramCount}`;
      params.push(user.phong_ban_id);
    }

    // Xử lý sắp xếp
    const validSortFields = {
      so_quyet_dinh: "pn.so_quyet_dinh",
      ngay_nhap: "pn.ngay_nhap",
      tong_tien: "pn.tong_tien",
      created_at: "pn.created_at",
    };

    const sortField = validSortFields[sort_by] || "pn.created_at";
    const sortDir = sort_direction.toLowerCase() === "asc" ? "ASC" : "DESC";
    const orderClause = `ORDER BY ${sortField} ${sortDir}`;

    const countQuery = `
      SELECT COUNT(*) 
      FROM phieu_nhap pn 
      LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id 
      LEFT JOIN phong_ban pb_cc ON pn.phong_ban_cung_cap_id = pb_cc.id
      ${whereClause}
    `;

    const dataQuery = `
      SELECT pn.*, 
             ncc.id as ncc_id, ncc.ma_ncc, ncc.ten_ncc,
             pb_cc.id as pb_cc_id, pb_cc.ten_phong_ban as ten_pb_cung_cap, pb_cc.cap_bac as cap_bac_cung_cap,
             u.id as nguoi_tao_id, u.ho_ten as nguoi_tao_ten,
             pb.ten_phong_ban,
             pn.decision_pdf_url,
             pn.decision_pdf_filename,
             pn.ghi_chu_hoan_thanh,
             pn.ghi_chu_phan_hoi,
             -- Thông tin phiếu xuất liên kết
             px.id as phieu_xuat_lien_ket_id_ref,
             px.so_phieu as so_phieu_xuat_lien_ket,
             px.trang_thai as trang_thai_phieu_xuat_lien_ket
      FROM phieu_nhap pn
      LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
      LEFT JOIN phong_ban pb_cc ON pn.phong_ban_cung_cap_id = pb_cc.id
      LEFT JOIN users u ON pn.nguoi_tao = u.id
      LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
      LEFT JOIN phieu_xuat px ON pn.phieu_xuat_lien_ket_id = px.id
      ${whereClause}
      ${orderClause}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(limit, offset);

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, params.slice(0, -2)),
      pool.query(dataQuery, params),
    ]);

    const total = parseInt(countResult.rows[0].count);
    const pages = Math.ceil(total / limit);
    const structuredItems = dataResult.rows.map((item) => ({
      ...item,
      nha_cung_cap: item.ncc_id
        ? {
            id: item.ncc_id,
            ma_ncc: item.ma_ncc,
            ten_ncc: item.ten_ncc,
          }
        : null,
      phong_ban_cung_cap: item.pb_cc_id
        ? {
            id: item.pb_cc_id,
            ten_phong_ban: item.ten_pb_cung_cap,
            cap_bac: item.cap_bac_cung_cap,
          }
        : null,
      user_tao: item.nguoi_tao_id
        ? {
            id: item.nguoi_tao_id,
            ho_ten: item.nguoi_tao_ten,
          }
        : null,
      phieu_xuat_lien_ket: item.phieu_xuat_lien_ket_id_ref
        ? {
            id: item.phieu_xuat_lien_ket_id_ref,
            so_phieu: item.so_phieu_xuat_lien_ket,
            trang_thai: item.trang_thai_phieu_xuat_lien_ket,
          }
        : null,
    }));

    sendResponse(res, 200, true, "Lấy danh sách thành công", {
      items: structuredItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages,
      },
    });
  } catch (error) {
    console.error("Get phieu nhap error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

module.exports = {
  getList,
  getDetail,
  create,
  update,
  delete: deletePhieu,
  submit,
  approve,
  requestRevision,
  complete,
  updateActualQuantity,
  uploadDecision,
  downloadDecision,
  cancel,
  getPhongBanCungCap,
  getHangHoaCoTheNhap,
  getPhongBanList,
};
