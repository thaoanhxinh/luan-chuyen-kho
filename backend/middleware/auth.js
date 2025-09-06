const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const jwtConfig = require("../config/jwt");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token is required",
      });
    }

    const decoded = jwt.verify(token, jwtConfig.secret);

    // Lấy thông tin user và phòng ban
    const userQuery = `
      SELECT u.id, u.username, u.ho_ten, u.email, u.phone, u.role, u.trang_thai, u.phong_ban_id,
             pb.id as pb_id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac, pb.phong_ban_cha_id
      FROM users u 
      LEFT JOIN phong_ban pb ON u.phong_ban_id = pb.id 
      WHERE u.id = $1 AND u.trang_thai = 'active'
    `;

    const result = await pool.query(userQuery, [decoded.id]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const userData = result.rows[0];

    // Cấu trúc user object đầy đủ
    const user = {
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

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

module.exports = auth;
