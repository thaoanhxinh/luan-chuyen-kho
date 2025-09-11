const pool = require("../config/database");
const { sendResponse } = require("../utils/response");

const getList = async (req, res, query, user) => {
  try {
    const { page = 1, limit = 50, search = "", active_only = true } = query;

    const offset = (page - 1) * limit;
    let whereClause = "";
    const countParams = [];
    const dataParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause = `WHERE ten_loai ILIKE $${paramCount}`;
      countParams.push(`%${search}%`);
      dataParams.push(`%${search}%`);
    }

    const countQuery = `SELECT COUNT(*) FROM loai_hang_hoa ${whereClause}`;
    const countResult = await pool.query(countQuery, countParams);

    dataParams.push(limit, offset);
    const dataQuery = `SELECT * FROM loai_hang_hoa ${whereClause} ORDER BY ten_loai ASC LIMIT $${
      paramCount + 1
    } OFFSET $${paramCount + 2}`;
    const dataResult = await pool.query(dataQuery, dataParams);

    sendResponse(res, 200, "success", {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    console.error("Get loai hang hoa list error:", error);
    sendResponse(res, 500, "error", null, "Failed to get list");
  }
};

const getDetail = async (req, res, params, user) => {
  try {
    const { id } = params;

    const detailQuery = `
      SELECT lhh.*, 
             (SELECT COUNT(*) FROM hang_hoa hh 
              WHERE hh.loai_hang_hoa_id = lhh.id 
              AND hh.trang_thai = 'active'
              AND ($2::integer IS NULL OR hh.phong_ban_id = $2::integer)
             ) as so_hang_hoa,
             (SELECT json_agg(
               json_build_object(
                 'id', hh.id,
                 'ma_hang_hoa', hh.ma_hang_hoa,
                 'ten_hang_hoa', hh.ten_hang_hoa,
                 'don_vi_tinh', hh.don_vi_tinh
               ) ORDER BY hh.ten_hang_hoa ASC
             ) FROM (
               SELECT hh.id, hh.ma_hang_hoa, hh.ten_hang_hoa, hh.don_vi_tinh
               FROM hang_hoa hh 
               WHERE hh.loai_hang_hoa_id = lhh.id 
               AND hh.trang_thai = 'active'
               AND ($2::integer IS NULL OR hh.phong_ban_id = $2::integer)
               ORDER BY hh.ten_hang_hoa ASC
               LIMIT 20
             ) hh
             ) as danh_sach_hang_hoa
      FROM loai_hang_hoa lhh
      WHERE lhh.id = $1
    `;

    // Admin xem tất cả; người thường chỉ xem theo phòng ban của mình
    const phongBanFilter =
      user?.role === "admin"
        ? null
        : user?.phong_ban?.id || user?.phong_ban_id || null;
    const result = await pool.query(detailQuery, [id, phongBanFilter]);

    if (result.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy loại hàng hóa");
    }

    sendResponse(
      res,
      200,
      true,
      "Lấy chi tiết loại hàng hóa thành công",
      result.rows[0]
    );
  } catch (error) {
    console.error("Get loai hang hoa detail error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const create = async (req, res, body, user) => {
  try {
    const { ma_loai, ten_loai, mo_ta } = body;

    // Phân quyền: chỉ admin hoặc cấp 3 được tạo
    const canManage = user?.role === "admin" || user?.phong_ban?.cap_bac === 3;
    if (!canManage) {
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền tạo loại hàng hóa"
      );
    }

    // Validation
    if (!ten_loai) {
      return sendResponse(res, 400, false, "Tên loại hàng hóa là bắt buộc");
    }

    // Tạo mã loại tự động nếu không có
    let finalMaLoai = ma_loai;
    if (!finalMaLoai) {
      const countResult = await pool.query(
        "SELECT COUNT(*) + 1 as next_id FROM loai_hang_hoa"
      );
      const nextId = parseInt(countResult.rows[0].next_id);
      finalMaLoai = "LH" + String(nextId).padStart(3, "0");
    }

    // Kiểm tra trùng tên loại
    const existingQuery = `
      SELECT id FROM loai_hang_hoa 
      WHERE ten_loai = $1
    `;
    const existingResult = await pool.query(existingQuery, [ten_loai]);

    if (existingResult.rows.length > 0) {
      return sendResponse(res, 400, false, "Tên loại hàng hóa đã tồn tại");
    }

    const insertQuery = `
      INSERT INTO loai_hang_hoa (ma_loai, ten_loai, mo_ta)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      finalMaLoai,
      ten_loai.trim(),
      mo_ta?.trim() || "",
    ]);

    sendResponse(
      res,
      201,
      true,
      "Tạo loại hàng hóa thành công",
      result.rows[0]
    );
  } catch (error) {
    if (error.code === "23505") {
      return sendResponse(
        res,
        400,
        false,
        "Mã loại hoặc tên loại hàng hóa đã tồn tại"
      );
    }
    console.error("Create loai hang hoa error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const update = async (req, res, params, body, user) => {
  try {
    const { id } = params;
    const { ma_loai, ten_loai, mo_ta } = body;

    // Phân quyền: chỉ admin hoặc cấp 3 được cập nhật
    const canManage = user?.role === "admin" || user?.phong_ban?.cap_bac === 3;
    if (!canManage) {
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền cập nhật loại hàng hóa"
      );
    }

    // Validation
    if (!ten_loai) {
      return sendResponse(res, 400, false, "Tên loại hàng hóa là bắt buộc");
    }

    // Kiểm tra loại hàng hóa có tồn tại không
    const checkQuery = `
      SELECT * FROM loai_hang_hoa 
      WHERE id = $1
    `;
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy loại hàng hóa");
    }

    // Kiểm tra trùng tên loại (ngoại trừ chính nó)
    const duplicateQuery = `
      SELECT id FROM loai_hang_hoa 
      WHERE ten_loai = $1 AND id != $2
    `;
    const duplicateResult = await pool.query(duplicateQuery, [ten_loai, id]);

    if (duplicateResult.rows.length > 0) {
      return sendResponse(res, 400, false, "Tên loại hàng hóa đã tồn tại");
    }

    const updateQuery = `
      UPDATE loai_hang_hoa 
      SET ma_loai = $1,
          ten_loai = $2, 
          mo_ta = $3, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      ma_loai || checkResult.rows[0].ma_loai,
      ten_loai.trim(),
      mo_ta?.trim() || "",
      id,
    ]);

    sendResponse(
      res,
      200,
      true,
      "Cập nhật loại hàng hóa thành công",
      result.rows[0]
    );
  } catch (error) {
    if (error.code === "23505") {
      return sendResponse(
        res,
        400,
        false,
        "Mã loại hoặc tên loại hàng hóa đã tồn tại"
      );
    }
    console.error("Update loai hang hoa error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const deleteLoaiHangHoa = async (req, res, params, user) => {
  try {
    const { id } = params;

    // Phân quyền: chỉ admin hoặc cấp 3 được xóa
    const canManage = user?.role === "admin" || user?.phong_ban?.cap_bac === 3;
    if (!canManage) {
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền xóa loại hàng hóa"
      );
    }

    // Kiểm tra loại hàng hóa có tồn tại không
    const checkQuery = `
      SELECT * FROM loai_hang_hoa 
      WHERE id = $1
    `;
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy loại hàng hóa");
    }

    // Kiểm tra xem có hàng hóa nào đang sử dụng loại này không
    const hangHoaQuery = `
      SELECT COUNT(*) as count FROM hang_hoa 
      WHERE loai_hang_hoa_id = $1 AND trang_thai = 'active'
    `;
    const hangHoaResult = await pool.query(hangHoaQuery, [id]);

    if (parseInt(hangHoaResult.rows[0].count) > 0) {
      return sendResponse(
        res,
        400,
        false,
        "Không thể xóa loại hàng hóa đang được sử dụng bởi các hàng hóa khác"
      );
    }

    // Xóa vĩnh viễn vì không có cột trang_thai
    const deleteQuery = `
      DELETE FROM loai_hang_hoa 
      WHERE id = $1
      RETURNING ma_loai, ten_loai
    `;

    const result = await pool.query(deleteQuery, [id]);

    sendResponse(res, 200, true, "Xóa loại hàng hóa thành công", {
      deleted_item: result.rows[0],
    });
  } catch (error) {
    console.error("Delete loai hang hoa error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const getSuggestions = async (req, res, query, user) => {
  try {
    const { search = "", limit = 10 } = query;

    let whereClause = "";
    const params = [search];

    if (search) {
      whereClause = "WHERE ten_loai ILIKE '%' || $1 || '%'";
    }

    const suggestionQuery = `
      SELECT id, ma_loai, ten_loai, mo_ta,
             (SELECT COUNT(*) FROM hang_hoa hh 
              WHERE hh.loai_hang_hoa_id = lhh.id 
              AND hh.trang_thai = 'active') as so_hang_hoa
      FROM loai_hang_hoa lhh
      ${whereClause}
      ORDER BY ten_loai ASC
      LIMIT $2
    `;

    params.push(limit);
    const result = await pool.query(suggestionQuery, params);

    sendResponse(
      res,
      200,
      true,
      "Lấy gợi ý loại hàng hóa thành công",
      result.rows
    );
  } catch (error) {
    console.error("Get loai hang hoa suggestions error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

module.exports = {
  getList,
  getDetail,
  create,
  update,
  delete: deleteLoaiHangHoa,
  getSuggestions,
};
