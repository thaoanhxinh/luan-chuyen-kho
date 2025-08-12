const pool = require("../config/database");
const { sendResponse } = require("../utils/response");
const { hashPassword } = require("../utils/auth");

const getUsers = async (req, res, query, user) => {
  try {
    // Check if user has admin role
    if (user.role !== "admin") {
      return sendResponse(res, 403, false, "Không có quyền truy cập");
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = query.search || "";
    const role = query.role || "";

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

    // Map role to enum values in current schema
    const roleMapping = {
      admin: "admin",
      manager: "user", // Since schema only has admin/user
      employee: "user",
    };

    const dbRole = roleMapping[userRole] || "user";

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
    } = body;

    // Map role to enum values in current schema
    const roleMapping = {
      admin: "admin",
      manager: "user",
      employee: "user",
    };

    const dbRole = roleMapping[userRole] || "user";

    const updateQuery = `
      UPDATE users 
      SET ho_ten = $1, email = $2, phone = $3, role = $4, phong_ban_id = $5, trang_thai = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING id, username, ho_ten, email, phone, role::text, phong_ban_id, trang_thai::text
    `;

    const result = await pool.query(updateQuery, [
      ho_ten,
      email,
      phone,
      dbRole,
      phong_ban_id,
      trang_thai ? "active" : "inactive",
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

const updateUserRole = async (req, res, params, body, user) => {
  try {
    if (user.role !== "admin") {
      return sendResponse(res, 403, false, "Không có quyền truy cập");
    }

    const { id } = params;
    const { role: userRole } = body;

    if (!["admin", "manager", "employee"].includes(userRole)) {
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

    // Map role to enum values in current schema
    const roleMapping = {
      admin: "admin",
      manager: "user",
      employee: "user",
    };

    const dbRole = roleMapping[userRole] || "user";

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

const resetPassword = async (req, res, params, user) => {
  try {
    if (user.role !== "admin") {
      return sendResponse(res, 403, false, "Không có quyền truy cập");
    }

    const { id } = params;
    const newPassword = "123456"; // Default password
    const hashedPassword = await hashPassword(newPassword);

    const updateQuery = `
      UPDATE users 
      SET password = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, username, ho_ten
    `;

    const result = await pool.query(updateQuery, [hashedPassword, id]);

    if (result.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy người dùng");
    }

    sendResponse(res, 200, true, "Reset mật khẩu thành công", {
      user: result.rows[0],
      newPassword: newPassword,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  resetPassword,
};
