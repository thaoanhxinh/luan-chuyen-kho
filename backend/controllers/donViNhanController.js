const pool = require("../config/database");
const { sendResponse } = require("../utils/response");

const getList = async (req, res, query, user) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      loai_don_vi,
      trang_thai = "active",
    } = query;

    const offset = (page - 1) * limit;
    let whereClause = "WHERE dvn.trang_thai = $1";
    const params = [trang_thai];
    let paramCount = 1;

    // Tìm kiếm theo tên hoặc mã đơn vị
    if (search) {
      paramCount++;
      whereClause += ` AND (dvn.ten_don_vi ILIKE $${paramCount} OR dvn.ma_don_vi ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Lọc theo loại đơn vị
    if (loai_don_vi) {
      paramCount++;
      whereClause += ` AND dvn.loai_don_vi = $${paramCount}`;
      params.push(loai_don_vi);
    }

    // Phân quyền theo phòng ban (nếu không phải admin)
    if (user.role !== "admin") {
      paramCount++;
      whereClause += ` AND dvn.phong_ban_id = $${paramCount}`;
      params.push(user.phong_ban_id);
    }

    const countQuery = `
      SELECT COUNT(*) 
      FROM don_vi_nhan dvn 
      ${whereClause}
    `;

    const dataQuery = `
      SELECT 
        dvn.*,
        pb.ten_phong_ban,
        u1.ho_ten as nguoi_tao_ten,
        u2.ho_ten as nguoi_cap_nhat_ten
      FROM don_vi_nhan dvn
      LEFT JOIN phong_ban pb ON dvn.phong_ban_id = pb.id
      LEFT JOIN users u1 ON dvn.nguoi_tao = u1.id
      LEFT JOIN users u2 ON dvn.nguoi_cap_nhat = u2.id
      ${whereClause}
      ORDER BY dvn.created_at DESC
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
    console.error("Get don vi nhan error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const getDetail = async (req, res, params, user) => {
  try {
    const { id } = params;

    const query = `
      SELECT 
        dvn.*,
        pb.ten_phong_ban,
        u1.ho_ten as nguoi_tao_ten,
        u2.ho_ten as nguoi_cap_nhat_ten
      FROM don_vi_nhan dvn
      LEFT JOIN phong_ban pb ON dvn.phong_ban_id = pb.id
      LEFT JOIN users u1 ON dvn.nguoi_tao = u1.id
      LEFT JOIN users u2 ON dvn.nguoi_cap_nhat = u2.id
      WHERE dvn.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy đơn vị nhận");
    }

    const donVi = result.rows[0];

    // Kiểm tra quyền xem (nếu không phải admin)
    if (user.role !== "admin" && donVi.phong_ban_id !== user.phong_ban_id) {
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền xem đơn vị nhận này"
      );
    }

    sendResponse(res, 200, true, "Lấy chi tiết thành công", donVi);
  } catch (error) {
    console.error("Get don vi nhan detail error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const create = async (req, res, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      ten_don_vi,
      loai_don_vi = "phong_ban",
      dia_chi,
      nguoi_lien_he,
      so_dien_thoai,
      email,
      chuc_vu_nguoi_lien_he,
      phong_ban_id,
      ghi_chu,
    } = body;

    // Validation
    if (!ten_don_vi) {
      await client.query("ROLLBACK");
      return sendResponse(res, 400, false, "Tên đơn vị là bắt buộc");
    }

    // Tạo mã đơn vị tự động
    const maResult = await client.query(
      "SELECT generate_ma_don_vi() as ma_don_vi"
    );
    const ma_don_vi = maResult.rows[0].ma_don_vi;

    // Kiểm tra trùng lặp tên đơn vị
    const existingResult = await client.query(
      "SELECT id FROM don_vi_nhan WHERE ten_don_vi = $1 AND trang_thai = 'active'",
      [ten_don_vi]
    );

    if (existingResult.rows.length > 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 400, false, "Tên đơn vị đã tồn tại");
    }

    // Tạo đơn vị nhận
    const insertQuery = `
      INSERT INTO don_vi_nhan (
        ma_don_vi, ten_don_vi, loai_don_vi, dia_chi, nguoi_lien_he,
        so_dien_thoai, email, chuc_vu_nguoi_lien_he, phong_ban_id, ghi_chu,
        nguoi_tao, trang_thai
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      ma_don_vi,
      ten_don_vi,
      loai_don_vi,
      dia_chi,
      nguoi_lien_he,
      so_dien_thoai,
      email,
      chuc_vu_nguoi_lien_he,
      phong_ban_id || user.phong_ban_id,
      ghi_chu,
      user.id,
    ]);

    await client.query("COMMIT");

    sendResponse(res, 201, true, "Tạo đơn vị nhận thành công", result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create don vi nhan error:", error);
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
    const {
      ten_don_vi,
      loai_don_vi,
      dia_chi,
      nguoi_lien_he,
      so_dien_thoai,
      email,
      chuc_vu_nguoi_lien_he,
      ghi_chu,
    } = body;

    // Kiểm tra đơn vị tồn tại
    const existingResult = await client.query(
      "SELECT * FROM don_vi_nhan WHERE id = $1",
      [id]
    );

    if (existingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "Không tìm thấy đơn vị nhận");
    }

    const donVi = existingResult.rows[0];

    // Kiểm tra quyền sửa
    if (user.role !== "admin" && donVi.phong_ban_id !== user.phong_ban_id) {
      await client.query("ROLLBACK");
      return sendResponse(res, 403, false, "Bạn không có quyền sửa đơn vị này");
    }

    // Kiểm tra trùng lặp tên (trừ chính nó)
    if (ten_don_vi) {
      const duplicateResult = await client.query(
        "SELECT id FROM don_vi_nhan WHERE ten_don_vi = $1 AND id != $2 AND trang_thai = 'active'",
        [ten_don_vi, id]
      );

      if (duplicateResult.rows.length > 0) {
        await client.query("ROLLBACK");
        return sendResponse(res, 400, false, "Tên đơn vị đã tồn tại");
      }
    }

    // Cập nhật đơn vị
    const updateQuery = `
      UPDATE don_vi_nhan 
      SET 
        ten_don_vi = COALESCE($1, ten_don_vi),
        loai_don_vi = COALESCE($2, loai_don_vi),
        dia_chi = COALESCE($3, dia_chi),
        nguoi_lien_he = COALESCE($4, nguoi_lien_he),
        so_dien_thoai = COALESCE($5, so_dien_thoai),
        email = COALESCE($6, email),
        chuc_vu_nguoi_lien_he = COALESCE($7, chuc_vu_nguoi_lien_he),
        ghi_chu = COALESCE($8, ghi_chu),
        nguoi_cap_nhat = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      ten_don_vi,
      loai_don_vi,
      dia_chi,
      nguoi_lien_he,
      so_dien_thoai,
      email,
      chuc_vu_nguoi_lien_he,
      ghi_chu,
      user.id,
      id,
    ]);

    await client.query("COMMIT");

    sendResponse(
      res,
      200,
      true,
      "Cập nhật đơn vị nhận thành công",
      result.rows[0]
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update don vi nhan error:", error);
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

    // Kiểm tra đơn vị tồn tại
    const existingResult = await client.query(
      "SELECT * FROM don_vi_nhan WHERE id = $1 AND trang_thai != 'deleted'",
      [id]
    );

    if (existingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "Không tìm thấy đơn vị nhận");
    }

    const donVi = existingResult.rows[0];

    // Kiểm tra quyền xóa
    if (user.role !== "admin" && donVi.phong_ban_id !== user.phong_ban_id) {
      await client.query("ROLLBACK");
      return sendResponse(res, 403, false, "Bạn không có quyền xóa đơn vị này");
    }

    // Kiểm tra đơn vị có đang được sử dụng không
    const usageResult = await client.query(
      "SELECT COUNT(*) FROM phieu_xuat WHERE don_vi_nhan_id = $1",
      [id]
    );

    const usageCount = parseInt(usageResult.rows[0].count);

    if (usageCount > 0) {
      // Nếu có sử dụng, chỉ đánh dấu xóa (soft delete)
      await client.query(
        "UPDATE don_vi_nhan SET trang_thai = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [id]
      );

      await client.query("COMMIT");

      sendResponse(
        res,
        200,
        true,
        `Đơn vị đã được đánh dấu xóa (có ${usageCount} phiếu xuất liên quan)`
      );
    } else {
      // Nếu không có sử dụng, có thể xóa hẳn
      await client.query("DELETE FROM don_vi_nhan WHERE id = $1", [id]);

      await client.query("COMMIT");

      sendResponse(res, 200, true, "Xóa đơn vị nhận thành công");
    }
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Delete don vi nhan error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

const getSuggestions = async (req, res, query, user) => {
  try {
    const { q = "", limit = 10 } = query;

    let whereClause = "WHERE dvn.trang_thai = 'active'";
    const params = [];
    let paramCount = 0;

    // Tìm kiếm theo từ khóa
    if (q) {
      paramCount++;
      whereClause += ` AND (dvn.ten_don_vi ILIKE ${paramCount} OR dvn.ma_don_vi ILIKE ${paramCount})`;
      params.push(`%${q}%`);
    }

    // Phân quyền theo phòng ban
    if (user.role !== "admin") {
      paramCount++;
      whereClause += ` AND dvn.phong_ban_id = ${paramCount}`;
      params.push(user.phong_ban_id);
    }

    const suggestionsQuery = `
      SELECT 
        dvn.id,
        dvn.ma_don_vi,
        dvn.ten_don_vi,
        dvn.loai_don_vi,
        dvn.dia_chi,
        dvn.nguoi_lien_he,
        dvn.so_dien_thoai
      FROM don_vi_nhan dvn
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN dvn.ten_don_vi ILIKE ${paramCount + 1} THEN 1
          WHEN dvn.ma_don_vi ILIKE ${paramCount + 1} THEN 2
          ELSE 3 
        END,
        dvn.ten_don_vi
      LIMIT ${paramCount + 2}
    `;

    params.push(q ? `${q}%` : "%", limit);

    const result = await pool.query(suggestionsQuery, params);

    sendResponse(res, 200, true, "Lấy gợi ý thành công", result.rows);
  } catch (error) {
    console.error("Get don vi nhan suggestions error:", error);
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
