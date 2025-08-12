const pool = require("../config/database");
const { sendResponse } = require("../utils/response");
const { comparePassword, generateToken } = require("../utils/auth");

const login = async (req, res, body) => {
  try {
    const { username, password } = body;

    if (!username || !password) {
      return sendResponse(res, 400, false, "Username và password là bắt buộc");
    }

    // Tìm user trong database
    const userQuery = `
      SELECT u.*, pb.ten_phong_ban 
      FROM users u 
      LEFT JOIN phong_ban pb ON u.phong_ban_id = pb.id 
      WHERE u.username = $1 AND u.trang_thai = 'active'
    `;

    const userResult = await pool.query(userQuery, [username]);

    if (userResult.rows.length === 0) {
      return sendResponse(res, 401, false, "Tên đăng nhập không tồn tại");
    }

    const user = userResult.rows[0];

    // Kiểm tra mật khẩu
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return sendResponse(res, 401, false, "Mật khẩu không đúng");
    }

    // Tạo JWT token
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      phong_ban_id: user.phong_ban_id,
    });

    // Trả về thông tin user (không bao gồm password)
    const { password: _, ...userInfo } = user;

    sendResponse(res, 200, true, "Đăng nhập thành công", {
      token,
      user: userInfo,
    });
  } catch (error) {
    console.error("Login error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const getProfile = async (req, res, user) => {
  try {
    const userQuery = `
      SELECT u.id, u.username, u.ho_ten, u.email, u.phone, u.role, u.trang_thai,
             pb.id as phong_ban_id, pb.ten_phong_ban
      FROM users u 
      LEFT JOIN phong_ban pb ON u.phong_ban_id = pb.id 
      WHERE u.id = $1
    `;

    const result = await pool.query(userQuery, [user.id]);

    if (result.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy user");
    }

    sendResponse(res, 200, true, "Lấy thông tin thành công", result.rows[0]);
  } catch (error) {
    console.error("Get profile error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

module.exports = {
  login,
  getProfile,
};
