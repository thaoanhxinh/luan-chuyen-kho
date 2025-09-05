const pool = require("../config/database");
const { sendResponse } = require("../utils/response");
const printController = require("./printController");

const getList = async (req, res, query, user) => {
  try {
    const { page = 1, limit = 20, tu_ngay, den_ngay, trang_thai } = query;
    const offset = (page - 1) * limit;
    let whereClause = "WHERE 1=1";
    const params = [];
    let paramCount = 0;

    if (tu_ngay && den_ngay) {
      paramCount += 2;
      whereClause += ` AND pkk.ngay_kiem_ke BETWEEN $${
        paramCount - 1
      } AND $${paramCount}`;
      params.push(tu_ngay, den_ngay);
    }

    if (trang_thai) {
      paramCount++;
      whereClause += ` AND pkk.trang_thai = $${paramCount}`;
      params.push(trang_thai);
    }

    if (user.role !== "admin") {
      paramCount++;
      whereClause += ` AND pkk.phong_ban_id = $${paramCount}`;
      params.push(user.phong_ban_id);
    }

    // SỬA: Thêm LIMIT và OFFSET vào params
    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;

    params.push(parseInt(limit), parseInt(offset));

    const dataQuery = `
      SELECT pkk.*, 
             u.ho_ten as nguoi_tao_ten,
             pb.ten_phong_ban,
             -- Tính toán thống kê
             (SELECT COUNT(*) FROM chi_tiet_kiem_ke WHERE phieu_kiem_ke_id = pkk.id) as so_mat_hang,
             (SELECT SUM(
               (sl_tot + sl_kem_pham_chat + sl_mat_pham_chat + sl_hong + sl_can_thanh_ly) - so_luong_so_sach
             ) FROM chi_tiet_kiem_ke WHERE phieu_kiem_ke_id = pkk.id) as chenh_lech,
             (SELECT SUM(
               ((sl_tot + sl_kem_pham_chat + sl_mat_pham_chat + sl_hong + sl_can_thanh_ly) - so_luong_so_sach) * don_gia
             ) FROM chi_tiet_kiem_ke WHERE phieu_kiem_ke_id = pkk.id) as gia_tri_chenh_lech
      FROM phieu_kiem_ke pkk
      LEFT JOIN users u ON pkk.nguoi_tao = u.id
      LEFT JOIN phong_ban pb ON pkk.phong_ban_id = pb.id
      ${whereClause}
      ORDER BY pkk.created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const result = await pool.query(dataQuery, params);

    // Đếm tổng số bản ghi
    const countQuery = `
      SELECT COUNT(*) as total
      FROM phieu_kiem_ke pkk
      ${whereClause}
    `;

    // Loại bỏ limit và offset khỏi params cho count query
    const countParams = params.slice(0, -2);
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    sendResponse(res, 200, true, "Lấy danh sách thành công", {
      items: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get phieu kiem ke error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const getDetail = async (req, res, params, user) => {
  try {
    const { id } = params;

    const detailQuery = `
      SELECT pkk.*, 
             u1.ho_ten as nguoi_tao_ten,
             u2.ho_ten as nguoi_duyet_ten,
             pb.ten_phong_ban
      FROM phieu_kiem_ke pkk
      LEFT JOIN users u1 ON pkk.nguoi_tao = u1.id
      LEFT JOIN users u2 ON pkk.nguoi_duyet = u2.id
      LEFT JOIN phong_ban pb ON pkk.phong_ban_id = pb.id
      WHERE pkk.id = $1
    `;

    const chiTietQuery = `
      SELECT ctkk.*, 
             h.ma_hang_hoa, h.ten_hang_hoa, h.don_vi_tinh,
             lh.ten_loai,
             -- Tính toán
             (ctkk.sl_tot + ctkk.sl_kem_pham_chat + ctkk.sl_mat_pham_chat + ctkk.sl_hong + ctkk.sl_can_thanh_ly) as so_luong_thuc_te,
             ((ctkk.sl_tot + ctkk.sl_kem_pham_chat + ctkk.sl_mat_pham_chat + ctkk.sl_hong + ctkk.sl_can_thanh_ly) - ctkk.so_luong_so_sach) as so_luong_chenh_lech,
             (((ctkk.sl_tot + ctkk.sl_kem_pham_chat + ctkk.sl_mat_pham_chat + ctkk.sl_hong + ctkk.sl_can_thanh_ly) - ctkk.so_luong_so_sach) * ctkk.don_gia) as gia_tri_chenh_lech
      FROM chi_tiet_kiem_ke ctkk
      JOIN hang_hoa h ON ctkk.hang_hoa_id = h.id
      LEFT JOIN loai_hang_hoa lh ON h.loai_hang_hoa_id = lh.id
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

    const phieuKiemKe = phieuResult.rows[0];
    phieuKiemKe.chi_tiet = chiTietResult.rows;

    // Tính toán thống kê tổng hợp
    const tongSoMatHang = chiTietResult.rows.length;
    const tongChenhLech = chiTietResult.rows.reduce(
      (sum, item) => sum + parseFloat(item.so_luong_chenh_lech || 0),
      0
    );
    const tongGiaTriChenhLech = chiTietResult.rows.reduce(
      (sum, item) => sum + parseFloat(item.gia_tri_chenh_lech || 0),
      0
    );

    phieuKiemKe.thong_ke = {
      so_mat_hang: tongSoMatHang,
      chenh_lech: tongChenhLech,
      gia_tri_chenh_lech: tongGiaTriChenhLech,
    };

    sendResponse(res, 200, true, "Lấy chi tiết thành công", phieuKiemKe);
  } catch (error) {
    console.error("Get phieu kiem ke detail error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const getTonKhoHienTai = async (req, res, params, user) => {
  try {
    const { id } = params;

    // Lấy thông tin phiếu kiểm kê
    const phieuResult = await pool.query(
      "SELECT phong_ban_id FROM phieu_kiem_ke WHERE id = $1",
      [id]
    );

    if (phieuResult.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy phiếu kiểm kê");
    }

    const phongBanId = phieuResult.rows[0].phong_ban_id;

    // Sử dụng function mới để lấy tồn kho
    const result = await pool.query(
      "SELECT * FROM get_ton_kho_for_kiem_ke($1)",
      [phongBanId]
    );

    sendResponse(res, 200, true, "Lấy tồn kho thành công", result.rows);
  } catch (error) {
    console.error("Get ton kho hien tai error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const create = async (req, res, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      ngay_kiem_ke,
      gio_kiem_ke,
      so_quyet_dinh,
      don_vi_kiem_ke,
      ly_do_kiem_ke = "Kiểm kê định kỳ",
      loai_kiem_ke = "dinh_ky",
      phong_ban_id,
      ghi_chu,
      to_kiem_ke,
      chi_tiet = [],
    } = body;

    if (!ngay_kiem_ke || !gio_kiem_ke || !don_vi_kiem_ke) {
      return sendResponse(res, 400, false, "Thiếu thông tin bắt buộc");
    }

    // Tạo số phiếu theo format mới
    const ngayKiemKe = new Date(ngay_kiem_ke);
    const quy = Math.ceil((ngayKiemKe.getMonth() + 1) / 3);
    const nam = ngayKiemKe.getFullYear();

    const countResult = await client.query(
      "SELECT COUNT(*) FROM phieu_kiem_ke WHERE EXTRACT(YEAR FROM ngay_kiem_ke) = $1 AND EXTRACT(QUARTER FROM ngay_kiem_ke) = $2",
      [nam, quy]
    );

    const soPhieu = `${String(parseInt(countResult.rows[0].count) + 1).padStart(
      2,
      "0"
    )}/KK-Q${quy}-${nam}`;

    // Tạo phiếu kiểm kê
    const phieuResult = await client.query(
      `
      INSERT INTO phieu_kiem_ke (
        so_phieu, ngay_kiem_ke, gio_kiem_ke, so_quyet_dinh, don_vi_kiem_ke,
        ly_do_kiem_ke, loai_kiem_ke,
        phong_ban_id, ghi_chu, to_kiem_ke, nguoi_tao
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `,
      [
        soPhieu,
        ngay_kiem_ke,
        gio_kiem_ke,
        so_quyet_dinh || "",
        don_vi_kiem_ke,
        ly_do_kiem_ke,
        loai_kiem_ke,
        phong_ban_id || user.phong_ban_id,
        ghi_chu,
        JSON.stringify(to_kiem_ke || {}),
        user.id,
      ]
    );

    const phieuId = phieuResult.rows[0].id;

    // Thêm chi tiết kiểm kê nếu có (KHÔNG CẬP NHẬT TỒN KHO)
    if (chi_tiet && chi_tiet.length > 0) {
      for (const item of chi_tiet) {
        const {
          hang_hoa_id,
          so_luong_so_sach,
          sl_tot = 0,
          sl_kem_pham_chat = 0,
          sl_mat_pham_chat = 0,
          sl_hong = 0,
          sl_can_thanh_ly = 0,
          don_gia,
          ly_do_chenh_lech,
          de_nghi_xu_ly,
          danh_sach_seri_kiem_ke = [],
        } = item;

        await client.query(
          `
          INSERT INTO chi_tiet_kiem_ke (
            phieu_kiem_ke_id, hang_hoa_id, so_luong_so_sach,
            sl_tot, sl_kem_pham_chat, sl_mat_pham_chat, sl_hong, sl_can_thanh_ly,
            don_gia, ly_do_chenh_lech, de_nghi_xu_ly, danh_sach_seri_kiem_ke
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `,
          [
            phieuId,
            hang_hoa_id,
            so_luong_so_sach,
            sl_tot,
            sl_kem_pham_chat,
            sl_mat_pham_chat,
            sl_hong,
            sl_can_thanh_ly,
            don_gia,
            ly_do_chenh_lech,
            de_nghi_xu_ly,
            danh_sach_seri_kiem_ke.length > 0 ? danh_sach_seri_kiem_ke : null,
          ]
        );
      }
    }

    await client.query("COMMIT");

    sendResponse(
      res,
      201,
      true,
      "Tạo phiếu kiểm kê thành công",
      phieuResult.rows[0]
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create phieu kiem ke error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

const updateResults = async (req, res, params, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;
    const { chi_tiet = [] } = body;

    // Kiểm tra phiếu
    const phieuResult = await client.query(
      "SELECT * FROM phieu_kiem_ke WHERE id = $1",
      [id]
    );

    if (phieuResult.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy phiếu kiểm kê");
    }

    if (phieuResult.rows[0].trang_thai !== "draft") {
      return sendResponse(
        res,
        400,
        false,
        "Chỉ có thể cập nhật phiếu ở trạng thái nháp"
      );
    }

    // Xóa chi tiết cũ
    await client.query(
      "DELETE FROM chi_tiet_kiem_ke WHERE phieu_kiem_ke_id = $1",
      [id]
    );

    // Thêm chi tiết mới (KHÔNG CẬP NHẬT TỒN KHO)
    for (const item of chi_tiet) {
      const {
        hang_hoa_id,
        so_luong_so_sach,
        sl_tot = 0,
        sl_kem_pham_chat = 0,
        sl_mat_pham_chat = 0,
        sl_hong = 0,
        sl_can_thanh_ly = 0,
        don_gia,
        ly_do_chenh_lech,
        de_nghi_xu_ly,
        danh_sach_seri_kiem_ke = [],
      } = item;

      // Chỉ thêm chi tiết kiểm kê, không cập nhật tồn kho
      await client.query(
        `
        INSERT INTO chi_tiet_kiem_ke (
          phieu_kiem_ke_id, hang_hoa_id, so_luong_so_sach,
          sl_tot, sl_kem_pham_chat, sl_mat_pham_chat, sl_hong, sl_can_thanh_ly,
          don_gia, ly_do_chenh_lech, de_nghi_xu_ly, danh_sach_seri_kiem_ke
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `,
        [
          id,
          hang_hoa_id,
          so_luong_so_sach,
          sl_tot,
          sl_kem_pham_chat,
          sl_mat_pham_chat,
          sl_hong,
          sl_can_thanh_ly,
          don_gia,
          ly_do_chenh_lech,
          de_nghi_xu_ly,
          danh_sach_seri_kiem_ke.length > 0 ? danh_sach_seri_kiem_ke : null,
        ]
      );
    }

    await client.query("COMMIT");

    sendResponse(res, 200, true, "Cập nhật kết quả kiểm kê thành công");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update kiem ke results error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

const approve = async (req, res, params, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;

    // Lấy thông tin phiếu kiểm kê và chi tiết
    const phieuResult = await client.query(
      "SELECT * FROM phieu_kiem_ke WHERE id = $1 AND trang_thai = 'draft'",
      [id]
    );

    if (phieuResult.rows.length === 0) {
      return sendResponse(
        res,
        404,
        false,
        "Không tìm thấy phiếu kiểm kê hoặc phiếu đã được duyệt"
      );
    }

    const phieu = phieuResult.rows[0];

    // Lấy chi tiết kiểm kê
    const chiTietResult = await client.query(
      "SELECT * FROM chi_tiet_kiem_ke WHERE phieu_kiem_ke_id = $1",
      [id]
    );

    // CẬP NHẬT TỒN KHO KHI DUYỆT
    const phongBanId = phieu.phong_ban_id;

    for (const item of chiTietResult.rows) {
      const {
        hang_hoa_id,
        sl_tot,
        sl_kem_pham_chat,
        sl_mat_pham_chat,
        sl_hong,
        sl_can_thanh_ly,
      } = item;

      // Cập nhật tồn kho với phân loại phẩm chất mới
      const updateTonKhoQuery = `
        UPDATE ton_kho 
        SET 
          sl_tot = $1,
          sl_kem_pham_chat = $2,
          sl_mat_pham_chat = $3,
          sl_hong = $4,
          sl_can_thanh_ly = $5,
          gia_tri_ton = ($1 * don_gia_binh_quan)
        WHERE hang_hoa_id = $6 AND phong_ban_id = $7
        `;

      await client.query(updateTonKhoQuery, [
        sl_tot,
        sl_kem_pham_chat,
        sl_mat_pham_chat,
        sl_hong,
        sl_can_thanh_ly,
        hang_hoa_id,
        phongBanId,
      ]);
    }

    // Duyệt phiếu kiểm kê
    await client.query(
      `
      UPDATE phieu_kiem_ke 
      SET trang_thai = 'confirmed', nguoi_duyet = $1, ngay_duyet = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [user.id, id]
    );

    await client.query("COMMIT");

    sendResponse(
      res,
      200,
      true,
      "Duyệt phiếu kiểm kê và cập nhật tồn kho thành công"
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Approve kiem ke error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

// Thêm method cancel
const cancel = async (req, res, params, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;

    // Kiểm tra phiếu kiểm kê
    const phieuResult = await client.query(
      "SELECT * FROM phieu_kiem_ke WHERE id = $1",
      [id]
    );

    if (phieuResult.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy phiếu kiểm kê");
    }

    const phieu = phieuResult.rows[0];

    if (phieu.trang_thai === "cancelled") {
      return sendResponse(res, 400, false, "Phiếu kiểm kê đã bị hủy");
    }

    if (phieu.trang_thai === "confirmed") {
      return sendResponse(
        res,
        400,
        false,
        "Không thể hủy phiếu kiểm kê đã được duyệt"
      );
    }

    // Hủy phiếu kiểm kê
    await client.query(
      `
      UPDATE phieu_kiem_ke 
      SET trang_thai = 'cancelled', nguoi_duyet = $1, ngay_duyet = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [user.id, id]
    );

    await client.query("COMMIT");

    sendResponse(res, 200, true, "Hủy phiếu kiểm kê thành công");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Cancel kiem ke error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

// Thêm method mới cho thống kê
const getStatistics = async (req, res, query, user) => {
  try {
    const { tu_ngay, den_ngay } = query;
    const phong_ban_id = user.role === "admin" ? null : user.phong_ban_id;

    const result = await pool.query(
      "SELECT * FROM get_kiem_ke_statistics($1, $2, $3)",
      [phong_ban_id, tu_ngay || null, den_ngay || null]
    );

    sendResponse(res, 200, true, "Lấy thống kê thành công", result.rows);
  } catch (error) {
    console.error("Get kiem ke statistics error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

// THÊM METHOD MỚI: Lấy danh sách hàng hóa để kiểm kê
const getHangHoaForKiemKe = async (req, res, query, user) => {
  try {
    const { phieu_id } = query;
    let phong_ban_id = user.phong_ban_id;

    // Nếu có phieu_id, lấy phòng ban từ phiếu kiểm kê
    if (phieu_id) {
      const phieuResult = await pool.query(
        "SELECT phong_ban_id FROM phieu_kiem_ke WHERE id = $1",
        [phieu_id]
      );

      if (phieuResult.rows.length > 0) {
        phong_ban_id = phieuResult.rows[0].phong_ban_id;
      }
    }

    // Admin có thể chọn phòng ban
    if (user.role === "admin" && query.phong_ban_id) {
      phong_ban_id = query.phong_ban_id;
    }

    // Sử dụng function để lấy tồn kho
    const result = await pool.query(
      "SELECT * FROM get_ton_kho_for_kiem_ke($1)",
      [phong_ban_id]
    );

    sendResponse(
      res,
      200,
      true,
      "Lấy danh sách hàng hóa thành công",
      result.rows
    );
  } catch (error) {
    console.error("Get hang hoa for kiem ke error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const print = async (req, res, params, body, user) => {
  try {
    const { id } = params;
    const {
      to_truong = "",
      uy_vien_1 = "",
      uy_vien_2 = "",
      uy_vien_3 = "",
      uy_vien_4 = "",
      thu_kho = "",
    } = body;

    // Gọi hàm tạo Excel từ printController
    const response = await printController.generatePhieuKiemKeExcel(
      req,
      res,
      params,
      body,
      user
    );

    return response;
  } catch (error) {
    console.error("Print kiem ke error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};
const update = async (req, res, params, body, user) => {
  const client = await pool.connect();
  try {
    const { id } = params;
    const {
      ngay_kiem_ke,
      gio_kiem_ke,
      so_quyet_dinh,
      don_vi_kiem_ke,
      ly_do_kiem_ke,
      loai_kiem_ke,
      ghi_chu,
      to_kiem_ke,
      chi_tiet = [],
    } = body;

    await client.query("BEGIN");

    // 1. Kiểm tra phiếu có tồn tại và ở trạng thái 'draft' không
    const phieuCheck = await client.query(
      "SELECT trang_thai FROM phieu_kiem_ke WHERE id = $1",
      [id]
    );
    if (phieuCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "Không tìm thấy phiếu kiểm kê.");
    }
    if (phieuCheck.rows[0].trang_thai !== "draft") {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Chỉ có thể sửa phiếu ở trạng thái Nháp."
      );
    }

    // 2. Cập nhật thông tin chính của phiếu
    const updatedPhieu = await client.query(
      `UPDATE phieu_kiem_ke SET 
        ngay_kiem_ke = $1, gio_kiem_ke = $2, so_quyet_dinh = $3, don_vi_kiem_ke = $4,
        ly_do_kiem_ke = $5, loai_kiem_ke = $6, ghi_chu = $7, to_kiem_ke = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 RETURNING *`,
      [
        ngay_kiem_ke,
        gio_kiem_ke,
        so_quyet_dinh,
        don_vi_kiem_ke,
        ly_do_kiem_ke,
        loai_kiem_ke,
        ghi_chu,
        JSON.stringify(to_kiem_ke),
        id,
      ]
    );

    // 3. Xóa tất cả chi tiết cũ
    await client.query(
      "DELETE FROM chi_tiet_kiem_ke WHERE phieu_kiem_ke_id = $1",
      [id]
    );

    // 4. Thêm lại chi tiết mới
    if (chi_tiet.length > 0) {
      for (const item of chi_tiet) {
        await client.query(
          `INSERT INTO chi_tiet_kiem_ke (
             phieu_kiem_ke_id, hang_hoa_id, so_luong_so_sach, sl_tot, sl_kem_pham_chat, 
             sl_mat_pham_chat, sl_hong, sl_can_thanh_ly, don_gia, ly_do_chenh_lech, de_nghi_xu_ly
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            id,
            item.hang_hoa_id,
            item.so_luong_so_sach,
            item.sl_tot || 0,
            item.sl_kem_pham_chat || 0,
            item.sl_mat_pham_chat || 0,
            item.sl_hong || 0,
            item.sl_can_thanh_ly || 0,
            item.don_gia,
            item.ly_do_chenh_lech,
            item.de_nghi_xu_ly,
          ]
        );
      }
    }

    await client.query("COMMIT");
    sendResponse(
      res,
      200,
      true,
      "Cập nhật phiếu kiểm kê thành công.",
      updatedPhieu.rows[0]
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update Kiem Ke error:", error);
    sendResponse(res, 500, false, "Lỗi server khi cập nhật phiếu kiểm kê.");
  } finally {
    client.release();
  }
};

module.exports = {
  getList,
  getDetail,
  getTonKhoHienTai,
  create,
  updateResults,
  approve,
  cancel, // Thêm method cancel
  getStatistics,
  getHangHoaForKiemKe,
  print,
};
