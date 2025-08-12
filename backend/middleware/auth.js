const jwt = require("jsonwebtoken");
const { User, PhongBan } = require("../models");
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

    const user = await User.findByPk(decoded.id, {
      include: [
        {
          model: PhongBan,
          as: "phong_ban",
          attributes: ["id", "ma_phong_ban", "ten_phong_ban"],
        },
      ],
      attributes: { exclude: ["password"] },
    });

    if (!user || user.trang_thai !== "active") {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

module.exports = auth;
