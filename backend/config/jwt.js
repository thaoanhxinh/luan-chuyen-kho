module.exports = {
  secret: process.env.JWT_SECRET || "2201",
  expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
};
