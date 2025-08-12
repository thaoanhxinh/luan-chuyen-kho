const pool = require("../config/database");
const { sendResponse } = require("../utils/response");

const getList = async (req, res, query, user) => {
  try {
    const { page = 1, limit = 20, search } = query;

    const offset = (page - 1) * limit;
    let whereClause = "WHERE 1=1";
    const params = [];
    let paramCount = 0;

    // Tìm kiếm theo tên hoặc mã nhà cung cấp
    if (search) {
      paramCount++;
      whereClause += ` AND (ncc.ten_ncc ILIKE $${paramCount} OR ncc.ma_ncc ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    const countQuery = `
      SELECT COUNT(*) 
      FROM nha_cung_cap ncc 
      ${whereClause}
    `;

    const dataQuery = `
      SELECT 
        ncc.id,
        ncc.ma_ncc,
        ncc.ten_ncc,
        ncc.dia_chi,
        ncc.phone,
        ncc.email,
        ncc.nguoi_lien_he,
        ncc.created_at,
        ncc.updated_at
      FROM nha_cung_cap ncc
      ${whereClause}
      ORDER BY ncc.created_at DESC
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
    console.error("Get nha cung cap error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const getDetail = async (req, res, params, user) => {
  try {
    const { id } = params;

    const query = `
      SELECT 
        id,
        ma_ncc,
        ten_ncc,
        dia_chi,
        phone,
        email,
        nguoi_lien_he,
        created_at,
        updated_at
      FROM nha_cung_cap
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy nhà cung cấp");
    }

    sendResponse(res, 200, true, "Lấy chi tiết thành công", result.rows[0]);
  } catch (error) {
    console.error("Get nha cung cap detail error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const create = async (req, res, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { ma_ncc, ten_ncc, dia_chi, phone, email, nguoi_lien_he } = body;

    // Validation
    if (!ten_ncc) {
      await client.query("ROLLBACK");
      return sendResponse(res, 400, false, "Tên nhà cung cấp là bắt buộc");
    }

    // Tự động tạo mã nếu không có
    let finalMaNcc = ma_ncc;
    if (!finalMaNcc) {
      // Tạo mã tự động dựa trên count
      const countResult = await client.query(
        "SELECT COUNT(*) FROM nha_cung_cap"
      );
      const count = parseInt(countResult.rows[0].count) + 1;
      finalMaNcc = `NCC${String(count).padStart(3, "0")}`;
    }

    // Kiểm tra trùng lặp mã
    const existingResult = await client.query(
      "SELECT id FROM nha_cung_cap WHERE ma_ncc = $1",
      [finalMaNcc]
    );

    if (existingResult.rows.length > 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 400, false, "Mã nhà cung cấp đã tồn tại");
    }

    // Tạo nhà cung cấp
    const insertQuery = `
      INSERT INTO nha_cung_cap (
        ma_ncc, ten_ncc, dia_chi, phone, email, nguoi_lien_he
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      finalMaNcc,
      ten_ncc,
      dia_chi,
      phone,
      email,
      nguoi_lien_he,
    ]);

    await client.query("COMMIT");

    sendResponse(res, 201, true, "Tạo nhà cung cấp thành công", result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create nha cung cap error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

const update = async (req, res, params, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;
    const { ten_ncc, dia_chi, phone, email, nguoi_lien_he } = body;

    // Kiểm tra nhà cung cấp tồn tại
    const existingResult = await client.query(
      "SELECT * FROM nha_cung_cap WHERE id = $1",
      [id]
    );

    if (existingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "Không tìm thấy nhà cung cấp");
    }

    // Cập nhật nhà cung cấp
    const updateQuery = `
      UPDATE nha_cung_cap 
      SET 
        ten_ncc = COALESCE($1, ten_ncc),
        dia_chi = COALESCE($2, dia_chi),
        phone = COALESCE($3, phone),
        email = COALESCE($4, email),
        nguoi_lien_he = COALESCE($5, nguoi_lien_he),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      ten_ncc,
      dia_chi,
      phone,
      email,
      nguoi_lien_he,
      id,
    ]);

    await client.query("COMMIT");

    sendResponse(
      res,
      200,
      true,
      "Cập nhật nhà cung cấp thành công",
      result.rows[0]
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update nha cung cap error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

const deleteItem = async (req, res, params, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;

    // Kiểm tra nhà cung cấp tồn tại
    const existingResult = await client.query(
      "SELECT * FROM nha_cung_cap WHERE id = $1",
      [id]
    );

    if (existingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "Không tìm thấy nhà cung cấp");
    }

    // Kiểm tra nhà cung cấp có đang được sử dụng không
    const usageResult = await client.query(
      "SELECT COUNT(*) FROM phieu_nhap WHERE nha_cung_cap_id = $1",
      [id]
    );

    const usageCount = parseInt(usageResult.rows[0].count);

    if (usageCount > 0) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        `Không thể xóa nhà cung cấp này vì có ${usageCount} phiếu nhập liên quan`
      );
    } else {
      // Có thể xóa hẳn
      await client.query("DELETE FROM nha_cung_cap WHERE id = $1", [id]);

      await client.query("COMMIT");

      sendResponse(res, 200, true, "Xóa nhà cung cấp thành công");
    }
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Delete nha cung cap error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

const getSuggestions = async (req, res, query, user) => {
  try {
    const { q = "", limit = 10 } = query;

    let whereClause = "WHERE 1=1";
    const params = [];
    let paramCount = 0;

    // Tìm kiếm theo từ khóa
    if (q) {
      paramCount++;
      whereClause += ` AND (ncc.ten_ncc ILIKE $${paramCount} OR ncc.ma_ncc ILIKE $${paramCount})`;
      params.push(`%${q}%`);
    }

    const suggestionsQuery = `
      SELECT 
        ncc.id,
        ncc.ma_ncc,
        ncc.ten_ncc,
        ncc.dia_chi,
        ncc.nguoi_lien_he,
        ncc.phone,
        ncc.email
      FROM nha_cung_cap ncc
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN ncc.ten_ncc ILIKE $${paramCount + 1} THEN 1
          WHEN ncc.ma_ncc ILIKE $${paramCount + 1} THEN 2
          ELSE 3 
        END,
        ncc.ten_ncc
      LIMIT $${paramCount + 2}
    `;

    params.push(q ? `${q}%` : "%", limit);

    const result = await pool.query(suggestionsQuery, params);

    sendResponse(res, 200, true, "Lấy gợi ý thành công", result.rows);
  } catch (error) {
    console.error("Get nha cung cap suggestions error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

module.exports = {
  getList,
  getDetail,
  create,
  update,
  delete: deleteItem,
  getSuggestions,
};
