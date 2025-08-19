const pool = require("../config/database");
const { sendResponse } = require("../utils/response");
const { comparePassword, generateToken } = require("../utils/auth");

// const login = async (req, res, body) => {
//   try {
//     const { username, password } = body;

//     if (!username || !password) {
//       return sendResponse(res, 400, false, "Username và password là bắt buộc");
//     }

//     // Tìm user trong database
//     const userQuery = `
//       SELECT u.*, pb.ten_phong_ban
//       FROM users u
//       LEFT JOIN phong_ban pb ON u.phong_ban_id = pb.id
//       WHERE u.username = $1 AND u.trang_thai = 'active'
//     `;

//     const userResult = await pool.query(userQuery, [username]);

//     if (userResult.rows.length === 0) {
//       return sendResponse(res, 401, false, "Tên đăng nhập không tồn tại");
//     }

//     const user = userResult.rows[0];

//     // Kiểm tra mật khẩu
//     const isValidPassword = await comparePassword(password, user.password);
//     if (!isValidPassword) {
//       return sendResponse(res, 401, false, "Mật khẩu không đúng");
//     }

//     // Tạo JWT token
//     const token = generateToken({
//       id: user.id,
//       username: user.username,
//       role: user.role,
//       phong_ban_id: user.phong_ban_id,
//     });

//     // Trả về thông tin user (không bao gồm password)
//     const { password: _, ...userInfo } = user;

//     sendResponse(res, 200, true, "Đăng nhập thành công", {
//       token,
//       user: userInfo,
//     });
//   } catch (error) {
//     console.error("Login error:", error);
//     sendResponse(res, 500, false, "Lỗi server");
//   }
// };

// const getProfile = async (req, res, user) => {
//   try {
//     const userQuery = `
//       SELECT u.id, u.username, u.ho_ten, u.email, u.phone, u.role, u.trang_thai,
//              pb.id as phong_ban_id, pb.ten_phong_ban
//       FROM users u
//       LEFT JOIN phong_ban pb ON u.phong_ban_id = pb.id
//       WHERE u.id = $1
//     `;

//     const result = await pool.query(userQuery, [user.id]);

//     if (result.rows.length === 0) {
//       return sendResponse(res, 404, false, "Không tìm thấy user");
//     }

//     sendResponse(res, 200, true, "Lấy thông tin thành công", result.rows[0]);
//   } catch (error) {
//     console.error("Get profile error:", error);
//     sendResponse(res, 500, false, "Lỗi server");
//   }
// };

const login = async (req, res, body) => {
  try {
    const { username, password } = body;

    if (!username || !password) {
      return sendResponse(res, 400, false, "Username và password là bắt buộc");
    }

    // ✅ Sửa query để lấy đầy đủ thông tin phòng ban
    const userQuery = `
      SELECT u.id, u.username, u.ho_ten, u.email, u.phone, u.role, u.trang_thai, u.phong_ban_id, u.password,
             pb.id as pb_id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac, pb.phong_ban_cha_id
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

    // ✅ Cấu trúc lại user data với phòng ban đầy đủ
    const userInfo = {
      id: user.id,
      username: user.username,
      ho_ten: user.ho_ten,
      email: user.email,
      phone: user.phone,
      role: user.role,
      trang_thai: user.trang_thai,
      phong_ban_id: user.phong_ban_id,
      phong_ban: user.pb_id
        ? {
            id: user.pb_id,
            ma_phong_ban: user.ma_phong_ban,
            ten_phong_ban: user.ten_phong_ban,
            cap_bac: user.cap_bac,
            phong_ban_cha_id: user.phong_ban_cha_id,
          }
        : null,
    };

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
    // ✅ Sửa query getProfile để lấy đầy đủ thông tin
    const userQuery = `
      SELECT u.id, u.username, u.ho_ten, u.email, u.phone, u.role, u.trang_thai, u.phong_ban_id,
             pb.id as pb_id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac, pb.phong_ban_cha_id
      FROM users u 
      LEFT JOIN phong_ban pb ON u.phong_ban_id = pb.id 
      WHERE u.id = $1
    `;

    const result = await pool.query(userQuery, [user.id]);

    if (result.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy user");
    }

    const userData = result.rows[0];

    // ✅ Cấu trúc lại response
    const userInfo = {
      id: userData.id,
      username: userData.username,
      ho_ten: userData.ho_ten,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      trang_thai: userData.trang_thai,
      phong_ban_id: userData.phong_ban_id,
      phong_ban: userData.pb_id
        ? {
            id: userData.pb_id,
            ma_phong_ban: userData.ma_phong_ban,
            ten_phong_ban: userData.ten_phong_ban,
            cap_bac: userData.cap_bac,
            phong_ban_cha_id: userData.phong_ban_cha_id,
          }
        : null,
    };

    sendResponse(res, 200, true, "Lấy thông tin thành công", userInfo);
  } catch (error) {
    console.error("Get profile error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};
module.exports = {
  login,
  getProfile,
};
