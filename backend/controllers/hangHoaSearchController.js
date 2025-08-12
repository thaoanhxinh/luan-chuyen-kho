// controllers/hangHoaSearchController.js - Phiên bản đơn giản hóa theo mẫu NCC thành công
const pool = require("../config/database");
const { sendResponse } = require("../utils/response");
const { parseUrl } = require("../utils/helpers");

const searchHangHoa = async (req, res) => {
  try {
    console.log("🔍 Hang Hoa Search Request URL:", req.url);

    const { query } = parseUrl(req.url);
    const q = query.q || "";

    if (!q || q.length < 2) {
      return sendResponse(res, 200, true, "Thành công", []);
    }

    const searchQuery = `
      SELECT 
        id, 
        ma_hang_hoa, 
        ten_hang_hoa, 
        don_vi_tinh,
        co_so_seri,
        gia_nhap_gan_nhat
      FROM hang_hoa 
      WHERE 
        trang_thai = 'active' AND
        (
          ten_hang_hoa ILIKE $1 OR
          ma_hang_hoa ILIKE $1
        )
      ORDER BY 
        CASE WHEN ten_hang_hoa ILIKE $1 THEN 0 ELSE 1 END,
        ten_hang_hoa ASC
      LIMIT 10
    `;

    const result = await pool.query(searchQuery, [`%${q}%`]);
    console.log("✅ Hang Hoa Search results:", result.rows.length);

    sendResponse(res, 200, true, "Tìm kiếm thành công", result.rows);
  } catch (error) {
    console.error("❌ Search hang hoa error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

// Phiên bản đơn giản hoàn toàn - sao chép từ NCC controller đã thành công
const createHangHoaAuto = async (req, res, body) => {
  // <--- THÊM `body`
  console.log("\n🆕 === CREATE HANG HOA AUTO START ===");
  console.log("⏰ Timestamp:", new Date().toISOString());

  try {
    // BỎ HOÀN TOÀN KHỐI PARSE BODY THỦ CÔNG
    // let body = "";
    // await new Promise(...)
    console.log("📦 Body received from server:", body);
    const parsedBody = body; // Chỉ cần gán lại nếu muốn giữ tên biến

    // Validation đơn giản
    const { ten_hang_hoa, don_vi_tinh = "Cái" } = parsedBody;
    if (
      !ten_hang_hoa ||
      typeof ten_hang_hoa !== "string" ||
      ten_hang_hoa.trim() === ""
    ) {
      console.error("❌ Invalid ten_hang_hoa:", ten_hang_hoa);
      return sendResponse(res, 400, false, "Tên hàng hóa không hợp lệ", {
        received: ten_hang_hoa,
        type: typeof ten_hang_hoa,
      });
    }

    console.log("✅ Validation passed for:", ten_hang_hoa);

    // Lấy token đơn giản
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("❌ No valid auth header");
      return sendResponse(res, 401, false, "Thiếu thông tin xác thực");
    }

    const token = authHeader.substring(7);
    console.log("✅ Token extracted");

    // Verify token đơn giản
    const { verifyToken } = require("../utils/auth");
    const decoded = verifyToken(token);
    if (!decoded) {
      console.error("❌ Token verification failed");
      return sendResponse(res, 401, false, "Token không hợp lệ");
    }

    console.log("✅ Token verified for user:", decoded.id);

    // Lấy thông tin user
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

    // Kiểm tra trùng lặp
    const trimmedName = ten_hang_hoa.trim();
    const duplicateCheck = await pool.query(
      "SELECT id, ma_hang_hoa, ten_hang_hoa FROM hang_hoa WHERE LOWER(ten_hang_hoa) = LOWER($1)",
      [trimmedName]
    );

    if (duplicateCheck.rows.length > 0) {
      console.log("⚠️ Duplicate found:", duplicateCheck.rows[0]);
      return sendResponse(
        res,
        400,
        false,
        "Hàng hóa đã tồn tại trong hệ thống",
        duplicateCheck.rows[0]
      );
    }

    console.log("✅ No duplicates found");

    // Tạo mã hàng hóa
    const maHangHoaResult = await pool.query(
      "SELECT generate_ma_hang_hoa() as ma"
    );
    const maHangHoa = maHangHoaResult.rows[0].ma;
    console.log("✅ Generated ma_hang_hoa:", maHangHoa);

    // Tạo bản ghi mới
    const insertQuery = `
      INSERT INTO hang_hoa (
        ma_hang_hoa, 
        ten_hang_hoa, 
        loai_hang_hoa_id, 
        don_vi_tinh, 
        phong_ban_id,
        co_so_seri,
        theo_doi_pham_chat,
        gia_nhap_gan_nhat,
        trang_thai
      ) VALUES ($1, $2, $3, $4, $5, false, true, 0, 'active')
      RETURNING *
    `;

    const insertResult = await pool.query(insertQuery, [
      maHangHoa,
      trimmedName,
      parsedBody.loai_hang_hoa_id || null,
      don_vi_tinh,
      parsedBody.phong_ban_id || user.phong_ban_id,
    ]);

    const newHangHoa = insertResult.rows[0];
    console.log("🎉 SUCCESS: Created hang hoa with ID:", newHangHoa.id);

    return sendResponse(res, 201, true, "Tạo hàng hóa mới thành công", {
      id: newHangHoa.id,
      ma_hang_hoa: newHangHoa.ma_hang_hoa,
      ten_hang_hoa: newHangHoa.ten_hang_hoa,
      don_vi_tinh: newHangHoa.don_vi_tinh,
      co_so_seri: newHangHoa.co_so_seri,
      gia_nhap_gan_nhat: newHangHoa.gia_nhap_gan_nhat || 0,
    });
  } catch (error) {
    console.error("❌ Error in createHangHoaAuto:", error.message);
    console.error("❌ Error stack:", error.stack);

    // Error handling đơn giản
    if (error.message === "Request timeout") {
      return sendResponse(
        res,
        408,
        false,
        "Yêu cầu quá chậm, vui lòng thử lại"
      );
    }

    if (error.code === "23505") {
      return sendResponse(res, 400, false, "Hàng hóa đã tồn tại");
    }

    return sendResponse(res, 500, false, "Lỗi hệ thống", {
      error: error.message,
    });
  } finally {
    console.log("🆕 === CREATE HANG HOA AUTO END ===\n");
  }
};

module.exports = {
  searchHangHoa,
  createHangHoaAuto,
};
