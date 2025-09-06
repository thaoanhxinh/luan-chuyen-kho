const pool = require("../config/database");
const { sendResponse } = require("../utils/response");
const { hashPassword } = require("../utils/auth");

const getUsers = async (req, res, query, user) => {
  try {
    // Only cấp 1 (admin) and cấp 2 (manager) can view this page
    if (!["admin", "manager"].includes(user.role)) {
      return sendResponse(res, 403, false, "Không có quyền truy cập");
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = query.search || "";
    const role = query.role || "";
    const phongBanId = query.phong_ban_id || "";
    const isActive = query.is_active;

    let whereClause = "WHERE 1=1";
    let queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (u.ho_ten ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (role && role !== "all") {
      whereClause += ` AND u.role = $${paramIndex}`;
      queryParams.push(role);
      paramIndex++;
    }

    if (phongBanId) {
      // Include users in selected department (cấp 2 or 3) and all cấp 3 whose parent is the selected cấp 2
      whereClause += ` AND EXISTS (
        SELECT 1 FROM phong_ban dp
        WHERE dp.id = u.phong_ban_id
          AND (dp.id = $${paramIndex} OR dp.phong_ban_cha_id = $${paramIndex})
      )`;
      queryParams.push(parseInt(phongBanId));
      paramIndex++;
    }

    if (typeof isActive !== "undefined" && isActive !== "") {
      // accept true/false or 'active'/'inactive'
      const statusValue =
        String(isActive) === "true" || isActive === "active"
          ? "active"
          : "inactive";
      whereClause += ` AND u.trang_thai = $${paramIndex}`;
      queryParams.push(statusValue);
      paramIndex++;
    }

    // Role-based visibility
    if (user.role === "manager") {
      // Manager chỉ xem cấp 3 thuộc quyền (phòng ban con của phòng ban mình)
      whereClause += ` AND (
        u.phong_ban_id IN (
          SELECT id FROM phong_ban WHERE phong_ban_cha_id = $${paramIndex} AND cap_bac = 3
        )
      )`;
      queryParams.push(user.phong_ban_id);
      paramIndex++;
    }

    const usersQuery = `
      SELECT 
        u.id,
        u.username,
        u.ho_ten as ten_nhan_vien,
        u.ho_ten,
        u.email,
        u.phone as so_dien_thoai,
        u.role::text,
        u.trang_thai::text as is_active,
        u.created_at,
        u.phong_ban_id,
        pb.ten_phong_ban,
        pb.ma_phong_ban,
        CONCAT('NV', LPAD(u.id::text, 3, '0')) as ma_nhan_vien
      FROM users u
      LEFT JOIN phong_ban pb ON u.phong_ban_id = pb.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN phong_ban pb ON u.phong_ban_id = pb.id
      ${whereClause}
    `;

    const [usersResult, countResult] = await Promise.all([
      pool.query(usersQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)),
    ]);

    const users = usersResult.rows.map((user) => ({
      ...user,
      is_active: user.is_active === "active",
      phong_ban: user.ten_phong_ban
        ? {
            id: user.phong_ban_id,
            ten_phong_ban: user.ten_phong_ban,
            ma_phong_ban: user.ma_phong_ban,
          }
        : null,
    }));

    const total = parseInt(countResult.rows[0].total);

    sendResponse(res, 200, true, "Lấy danh sách người dùng thành công", {
      items: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

const createUser = async (req, res, body, user) => {
  try {
    if (user.role !== "admin") {
      return sendResponse(res, 403, false, "Không có quyền truy cập");
    }

    const {
      username,
      ho_ten,
      email,
      password,
      phone,
      role: userRole,
      phong_ban_id,
    } = body;

    if (!username || !ho_ten || !email || !password) {
      return sendResponse(res, 400, false, "Thiếu thông tin bắt buộc");
    }

    // Check if username or email already exists
    const existingUserQuery =
      "SELECT id FROM users WHERE username = $1 OR email = $2";
    const existingUser = await pool.query(existingUserQuery, [username, email]);

    if (existingUser.rows.length > 0) {
      return sendResponse(res, 400, false, "Username hoặc email đã tồn tại");
    }

    const hashedPassword = await hashPassword(password);

    // Accept roles as provided, normalize 'employee' -> 'user'
    const roleMapping = { employee: "user" };
    const rawRole = (userRole || "user").toLowerCase();
    const dbRole = roleMapping[rawRole] || rawRole;

    const insertQuery = `
      INSERT INTO users (username, ho_ten, email, password, phone, role, phong_ban_id, trang_thai, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW())
      RETURNING id, username, ho_ten, email, phone, role::text, phong_ban_id, trang_thai::text, created_at
    `;

    const result = await pool.query(insertQuery, [
      username,
      ho_ten,
      email,
      hashedPassword,
      phone,
      dbRole,
      phong_ban_id,
    ]);

    sendResponse(res, 201, true, "Tạo người dùng thành công", result.rows[0]);
  } catch (error) {
    console.error("Create user error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

const updateUser = async (req, res, params, body, user) => {
  try {
    if (user.role !== "admin") {
      return sendResponse(res, 403, false, "Không có quyền truy cập");
    }

    const { id } = params;
    const {
      ho_ten,
      email,
      phone,
      role: userRole,
      phong_ban_id,
      trang_thai,
      is_active,
    } = body;

    // Accept roles as provided, normalize 'employee' -> 'user'
    const roleMapping = { employee: "user" };
    const rawRole = (userRole || "user").toLowerCase();
    const dbRole = roleMapping[rawRole] || rawRole;

    // Determine status from either boolean is_active or trang_thai string
    let statusValue;
    if (typeof is_active !== "undefined") {
      statusValue = is_active ? "active" : "inactive";
    } else if (typeof trang_thai !== "undefined") {
      statusValue = [true, "active", "true"].includes(trang_thai)
        ? "active"
        : "inactive";
    } else {
      // keep current if not provided
      statusValue = undefined;
    }

    const updateQuery = `
      UPDATE users 
      SET ho_ten = $1, email = $2, phone = $3, role = $4, phong_ban_id = $5, 
          trang_thai = COALESCE($6, trang_thai), updated_at = NOW()
      WHERE id = $7
      RETURNING id, username, ho_ten, email, phone, role::text, phong_ban_id, trang_thai::text
    `;

    const result = await pool.query(updateQuery, [
      ho_ten,
      email,
      phone,
      dbRole,
      phong_ban_id,
      statusValue,
      id,
    ]);

    if (result.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy người dùng");
    }

    sendResponse(
      res,
      200,
      true,
      "Cập nhật người dùng thành công",
      result.rows[0]
    );
  } catch (error) {
    console.error("Update user error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

const deleteUser = async (req, res, params, user) => {
  try {
    if (user.role !== "admin") {
      return sendResponse(res, 403, false, "Không có quyền truy cập");
    }

    const { id } = params;

    // Don't allow deleting self
    if (parseInt(id) === user.id) {
      return sendResponse(
        res,
        400,
        false,
        "Không thể xóa tài khoản của chính mình"
      );
    }

    const deleteQuery = "DELETE FROM users WHERE id = $1";
    const result = await pool.query(deleteQuery, [id]);

    if (result.rowCount === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy người dùng");
    }

    sendResponse(res, 200, true, "Xóa người dùng thành công");
  } catch (error) {
    console.error("Delete user error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

// Get user detail
const getUserDetail = async (req, res, params, user) => {
  try {
    if (!["admin", "manager"].includes(user.role)) {
      return sendResponse(res, 403, false, "Không có quyền truy cập");
    }

    const { id } = params;

    // Manager visibility restriction: only users in cấp 3 under their department
    let visibilityClause = "";
    let visParams = [];
    if (user.role === "manager") {
      visibilityClause = ` AND (
        u.phong_ban_id IN (
          SELECT id FROM phong_ban WHERE phong_ban_cha_id = $1 AND cap_bac = 3
        )
      )`;
      visParams = [user.phong_ban_id];
    }

    const detailQuery = `
      SELECT 
        u.id,
        u.username,
        u.ho_ten,
        u.email,
        u.phone,
        u.role::text as role,
        u.trang_thai::text as trang_thai,
        u.created_at,
        u.updated_at,
        u.phong_ban_id,
        pb.ten_phong_ban,
        pb.ma_phong_ban,
        pb.cap_bac,
        pb.phong_ban_cha_id
      FROM users u
      LEFT JOIN phong_ban pb ON u.phong_ban_id = pb.id
      WHERE u.id = $${visibilityClause ? 2 : 1}
      ${visibilityClause}
    `;

    const result = await pool.query(
      detailQuery,
      visibilityClause ? [id, ...visParams] : [id]
    );

    if (result.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy người dùng");
    }

    const row = result.rows[0];
    return sendResponse(res, 200, true, "Lấy chi tiết người dùng thành công", {
      ...row,
      is_active: row.trang_thai === "active",
      phong_ban: row.ten_phong_ban
        ? {
            id: row.phong_ban_id,
            ten_phong_ban: row.ten_phong_ban,
            ma_phong_ban: row.ma_phong_ban,
            cap_bac: row.cap_bac,
            phong_ban_cha_id: row.phong_ban_cha_id,
          }
        : null,
    });
  } catch (error) {
    console.error("Get user detail error:", error);
    return sendResponse(res, 500, false, "Lỗi server", {
      error: error.message,
    });
  }
};

// Update user active status (enable/disable)
const updateUserStatus = async (req, res, params, body, user) => {
  try {
    if (user.role !== "admin") {
      return sendResponse(res, 403, false, "Không có quyền truy cập");
    }

    const { id } = params;
    const { is_active } = body;
    if (typeof is_active === "undefined") {
      return sendResponse(res, 400, false, "Thiếu tham số is_active");
    }

    const statusValue = is_active ? "active" : "inactive";
    const updateQuery = `
      UPDATE users 
      SET trang_thai = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, username, ho_ten, role::text, trang_thai::text
    `;
    const result = await pool.query(updateQuery, [statusValue, id]);
    if (result.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy người dùng");
    }
    return sendResponse(
      res,
      200,
      true,
      "Cập nhật trạng thái tài khoản thành công",
      {
        ...result.rows[0],
        is_active: result.rows[0].trang_thai === "active",
      }
    );
  } catch (error) {
    console.error("Update user status error:", error);
    return sendResponse(res, 500, false, "Lỗi server", {
      error: error.message,
    });
  }
};

const updateUserRole = async (req, res, params, body, user) => {
  try {
    if (user.role !== "admin") {
      return sendResponse(res, 403, false, "Không có quyền truy cập");
    }

    const { id } = params;
    const { role: userRole } = body;

    if (!["admin", "manager", "employee", "user"].includes(userRole)) {
      return sendResponse(res, 400, false, "Role không hợp lệ");
    }

    // Don't allow changing own role
    if (parseInt(id) === user.id) {
      return sendResponse(
        res,
        400,
        false,
        "Không thể thay đổi quyền của chính mình"
      );
    }

    // Accept roles as provided, normalize 'employee' -> 'user'
    const roleMapping = { employee: "user" };
    const rawRole = (userRole || "user").toLowerCase();
    const dbRole = roleMapping[rawRole] || rawRole;

    const updateQuery = `
      UPDATE users 
      SET role = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, username, ho_ten, role::text
    `;

    const result = await pool.query(updateQuery, [dbRole, id]);

    if (result.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy người dùng");
    }

    sendResponse(res, 200, true, "Cập nhật quyền thành công", result.rows[0]);
  } catch (error) {
    console.error("Update user role error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

// Self-only: change password
const changeOwnPassword = async (req, res, body, user) => {
  try {
    const { current_password, new_password } = body;
    if (!current_password || !new_password) {
      return sendResponse(res, 400, false, "Thiếu thông tin mật khẩu");
    }

    // Verify current password
    const getQuery = `SELECT id, password FROM users WHERE id = $1`;
    const userResult = await pool.query(getQuery, [user.id]);
    if (userResult.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy người dùng");
    }
    const bcrypt = require("bcryptjs");
    const valid = await bcrypt.compare(
      current_password,
      userResult.rows[0].password
    );
    if (!valid) {
      return sendResponse(res, 400, false, "Mật khẩu hiện tại không đúng");
    }

    const hashedPassword = await hashPassword(new_password);
    await pool.query(
      `UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2`,
      [hashedPassword, user.id]
    );
    return sendResponse(res, 200, true, "Đổi mật khẩu thành công");
  } catch (error) {
    console.error("Change own password error:", error);
    return sendResponse(res, 500, false, "Lỗi server", {
      error: error.message,
    });
  }
};

// Self-only: change username
const changeOwnUsername = async (req, res, body, user) => {
  try {
    const { username } = body;
    if (!username) {
      return sendResponse(res, 400, false, "Thiếu username");
    }
    // Check exists
    const exists = await pool.query(
      `SELECT id FROM users WHERE username = $1 AND id != $2`,
      [username, user.id]
    );
    if (exists.rows.length > 0) {
      return sendResponse(res, 400, false, "Tên đăng nhập đã tồn tại");
    }
    await pool.query(
      `UPDATE users SET username = $1, updated_at = NOW() WHERE id = $2`,
      [username, user.id]
    );
    return sendResponse(res, 200, true, "Cập nhật tên đăng nhập thành công", {
      id: user.id,
      username,
    });
  } catch (error) {
    console.error("Change own username error:", error);
    return sendResponse(res, 500, false, "Lỗi server", {
      error: error.message,
    });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  getUserDetail,
  updateUserStatus,
  changeOwnPassword,
  changeOwnUsername,
};
