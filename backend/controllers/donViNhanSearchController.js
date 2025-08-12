// controllers/donViNhanSearchController.js
const pool = require("../config/database");
const { sendResponse } = require("../utils/response");
const { parseUrl } = require("../utils/helpers");

const searchDonViNhan = async (req, res) => {
  try {
    console.log("🔍 Don Vi Nhan Search Request URL:", req.url);

    const { query } = parseUrl(req.url);
    const q = query.q || "";

    if (!q || q.length < 2) {
      return sendResponse(res, 200, true, "Thành công", []);
    }

    const searchQuery = `
      SELECT 
        id, 
        ma_don_vi, 
        ten_don_vi, 
        loai_don_vi,
        dia_chi
      FROM don_vi_nhan 
      WHERE 
        (
          ten_don_vi ILIKE $1 OR
          ma_don_vi ILIKE $1
        )
      ORDER BY 
        CASE WHEN ten_don_vi ILIKE $1 THEN 0 ELSE 1 END,
        ten_don_vi ASC
      LIMIT 10
    `;

    const result = await pool.query(searchQuery, [`%${q}%`]);
    console.log("✅ Don Vi Nhan Search results:", result.rows.length);

    sendResponse(res, 200, true, "Tìm kiếm thành công", result.rows);
  } catch (error) {
    console.error("❌ Search don vi nhan error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

const createDonViNhanAuto = async (req, res, body) => {
  console.log("\n🆕 === CREATE DON VI NHAN AUTO START ===");
  console.log("⏰ Timestamp:", new Date().toISOString());

  try {
    console.log("✅ Body received from server:", body);

    // Validation
    const { ten_don_vi, loai_don_vi = "phong_ban" } = body;
    if (
      !ten_don_vi ||
      typeof ten_don_vi !== "string" ||
      ten_don_vi.trim() === ""
    ) {
      console.error("❌ Invalid ten_don_vi:", ten_don_vi);
      return sendResponse(res, 400, false, "Tên đơn vị nhận không hợp lệ", {
        received: ten_don_vi,
        type: typeof ten_don_vi,
      });
    }

    console.log("✅ Validation passed for:", ten_don_vi);

    // Authentication
    const { verifyToken, getTokenFromRequest } = require("../utils/auth");
    const token = getTokenFromRequest(req);

    if (!token) {
      console.error("❌ No auth token");
      return sendResponse(res, 401, false, "Thiếu thông tin xác thực");
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.error("❌ Token verification failed");
      return sendResponse(res, 401, false, "Token không hợp lệ");
    }

    console.log("✅ Token verified for user:", decoded.id);

    // Get user info
    const userResult = await pool.query(
      "SELECT * FROM users WHERE id = $1 AND trang_thai = $2",
      [decoded.id, "active"]
    );

    if (userResult.rows.length === 0) {
      console.error("❌ User not found");
      return sendResponse(res, 401, false, "Người dùng không tồn tại");
    }

    const user = userResult.rows[0];
    console.log("✅ User found:", user.id);

    // Check for duplicates
    const trimmedName = ten_don_vi.trim();
    const duplicateCheck = await pool.query(
      "SELECT id, ma_don_vi, ten_don_vi FROM don_vi_nhan WHERE LOWER(ten_don_vi) = LOWER($1)",
      [trimmedName]
    );

    if (duplicateCheck.rows.length > 0) {
      console.log("⚠️ Duplicate found:", duplicateCheck.rows[0]);
      return sendResponse(
        res,
        400,
        false,
        "Đơn vị nhận đã tồn tại trong hệ thống",
        duplicateCheck.rows[0]
      );
    }

    console.log("✅ No duplicates found");

    // Generate ma_don_vi
    const maDonViResult = await pool.query("SELECT generate_ma_don_vi() as ma");
    const maDonVi = maDonViResult.rows[0].ma;
    console.log("✅ Generated ma_don_vi:", maDonVi);

    // Create new record
    const insertQuery = `
      INSERT INTO don_vi_nhan (
        ma_don_vi, 
        ten_don_vi, 
        loai_don_vi,
        dia_chi
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const insertResult = await pool.query(insertQuery, [
      maDonVi,
      trimmedName,
      loai_don_vi,
      body.dia_chi || null,
    ]);

    const newDonVi = insertResult.rows[0];
    console.log("🎉 SUCCESS: Created Don Vi Nhan with ID:", newDonVi.id);

    return sendResponse(res, 201, true, "Tạo đơn vị nhận mới thành công", {
      id: newDonVi.id,
      ma_don_vi: newDonVi.ma_don_vi,
      ten_don_vi: newDonVi.ten_don_vi,
      loai_don_vi: newDonVi.loai_don_vi,
      dia_chi: newDonVi.dia_chi,
    });
  } catch (error) {
    console.error("❌ Error in createDonViNhanAuto:", error.message);
    console.error("❌ Error stack:", error.stack);

    // Error handling
    if (error.code === "23505") {
      return sendResponse(res, 400, false, "Đơn vị nhận đã tồn tại");
    }

    if (error.code === "23503") {
      return sendResponse(res, 400, false, "Dữ liệu tham chiếu không hợp lệ");
    }

    return sendResponse(res, 500, false, "Lỗi hệ thống", {
      error: error.message,
    });
  } finally {
    console.log("🆕 === CREATE DON VI NHAN AUTO END ===\n");
  }
};

module.exports = {
  searchDonViNhan,
  createDonViNhanAuto,
};
