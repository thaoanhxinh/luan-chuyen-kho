// // controllers/nhaCungCapSearchController.js - Phiên bản sửa lỗi body parsing
// const pool = require("../config/database");
// const { sendResponse } = require("../utils/response");
// const { parseUrl } = require("../utils/helpers");

// const searchNhaCungCap = async (req, res) => {
//   try {
//     console.log("🔍 NCC Request URL:", req.url);

//     const { query } = parseUrl(req.url);
//     console.log("🔍 NCC Parsed query:", query);

//     const q = query.q || "";

//     if (!q || q.length < 2) {
//       return sendResponse(res, 200, true, "Thành công", []);
//     }

//     console.log("🔍 NCC Search keyword:", q);

//     const searchQuery = `
//       SELECT
//         id,
//         ma_ncc,
//         ten_ncc,
//         dia_chi,
//         phone,
//         email
//       FROM nha_cung_cap
//       WHERE
//         (
//           ten_ncc ILIKE $1 OR
//           ma_ncc ILIKE $1
//         )
//       ORDER BY
//         CASE WHEN ten_ncc ILIKE $1 THEN 0 ELSE 1 END,
//         ten_ncc ASC
//       LIMIT 10
//     `;

//     const searchPattern = `%${q}%`;
//     const result = await pool.query(searchQuery, [searchPattern]);

//     console.log("✅ NCC Search results:", result.rows.length);
//     sendResponse(res, 200, true, "Tìm kiếm thành công", result.rows);
//   } catch (error) {
//     console.error("❌ Search nha cung cap error:", error);
//     sendResponse(res, 500, false, "Lỗi server", { error: error.message });
//   }
// };

// const createNhaCungCapAuto = async (req, res) => {
//   try {
//     console.log("=== CREATE NHA CUNG CAP AUTO START ===");
//     console.log("🕒 Timestamp:", new Date().toISOString());
//     console.log("📍 Request method:", req.method);
//     console.log("📍 Request URL:", req.url);

//     // Parse body từ request - BỎ TIMEOUT CHO BODY PARSING
//     const { parseBody } = require("../utils/helpers");
//     let body;

//     try {
//       console.log("🔄 Parsing request body...");
//       body = await parseBody(req);
//       console.log("✅ Request body parsed successfully:", body);
//     } catch (parseError) {
//       console.error("❌ Body parse error:", parseError);
//       return sendResponse(res, 400, false, "Dữ liệu request không hợp lệ", {
//         error: parseError.message,
//       });
//     }

//     const { ten_ncc, dia_chi = "", phone = "", email = "" } = body;

//     // Validation cơ bản
//     if (
//       !ten_ncc ||
//       typeof ten_ncc !== "string" ||
//       ten_ncc.trim().length === 0
//     ) {
//       console.log("❌ ERROR: Ten NCC empty or invalid");
//       return sendResponse(
//         res,
//         400,
//         false,
//         "Tên nhà cung cấp không được để trống và phải là chuỗi hợp lệ"
//       );
//     }

//     // Lấy thông tin user từ token
//     const { verifyToken, getTokenFromRequest } = require("../utils/auth");
//     const token = getTokenFromRequest(req);

//     if (!token) {
//       console.log("❌ ERROR: No authentication token");
//       return sendResponse(res, 401, false, "Yêu cầu đăng nhập");
//     }

//     const decoded = verifyToken(token);
//     if (!decoded) {
//       console.log("❌ ERROR: Invalid token");
//       return sendResponse(res, 401, false, "Token không hợp lệ");
//     }

//     console.log("✅ User authenticated:", decoded.id);

//     // Kiểm tra trùng lặp tên nhà cung cấp
//     const trimmedName = ten_ncc.trim();
//     console.log("🔍 Checking duplicate for:", trimmedName);

//     const duplicateCheck = await pool.query(
//       "SELECT id, ma_ncc, ten_ncc FROM nha_cung_cap WHERE LOWER(ten_ncc) = LOWER($1)",
//       [trimmedName]
//     );

//     if (duplicateCheck.rows.length > 0) {
//       console.log("⚠️ DUPLICATE: NCC already exists");
//       return sendResponse(
//         res,
//         400,
//         false,
//         "Nhà cung cấp đã tồn tại trong hệ thống",
//         duplicateCheck.rows[0]
//       );
//     }

//     // Tạo mã nhà cung cấp tự động
//     console.log("🔄 Generating ma NCC...");
//     const maNccResult = await pool.query("SELECT generate_ma_ncc() as ma");
//     const maNcc = maNccResult.rows[0].ma;
//     console.log("✅ Generated ma NCC:", maNcc);

//     // Tạo nhà cung cấp mới
//     console.log("🔄 Creating new NCC...");
//     const insertQuery = `
//       INSERT INTO nha_cung_cap (
//         ma_ncc,
//         ten_ncc,
//         dia_chi,
//         phone,
//         email
//       ) VALUES ($1, $2, $3, $4, $5)
//       RETURNING *
//     `;

//     const insertParams = [
//       maNcc,
//       trimmedName,
//       dia_chi || null,
//       phone || null,
//       email || null,
//     ];

//     console.log("🔄 Insert params:", insertParams);

//     const result = await pool.query(insertQuery, insertParams);
//     const newNcc = result.rows[0];

//     console.log("🎉 SUCCESS: Created NCC with ID:", newNcc.id);
//     console.log("=== CREATE NHA CUNG CAP AUTO END ===");

//     // Trả về thông tin nhà cung cấp mới tạo
//     sendResponse(res, 201, true, "Tạo nhà cung cấp mới thành công", {
//       id: newNcc.id,
//       ma_ncc: newNcc.ma_ncc,
//       ten_ncc: newNcc.ten_ncc,
//       dia_chi: newNcc.dia_chi,
//       phone: newNcc.phone,
//       email: newNcc.email,
//     });
//   } catch (error) {
//     console.error("=== CREATE NHA CUNG CAP ERROR ===");
//     console.error("❌ Error message:", error.message);
//     console.error("❌ Error stack:", error.stack);

//     // Xử lý các loại lỗi cụ thể
//     if (error.code === "23505") {
//       // Unique constraint violation
//       return sendResponse(
//         res,
//         400,
//         false,
//         "Mã nhà cung cấp hoặc tên nhà cung cấp đã tồn tại"
//       );
//     }

//     if (error.code === "23503") {
//       // Foreign key constraint violation
//       return sendResponse(res, 400, false, "Dữ liệu tham chiếu không hợp lệ");
//     }

//     // Lỗi database connection
//     if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
//       return sendResponse(res, 503, false, "Không thể kết nối cơ sở dữ liệu");
//     }

//     sendResponse(res, 500, false, "Lỗi hệ thống khi tạo nhà cung cấp", {
//       error: error.message,
//       code: error.code,
//     });
//   }
// };

// module.exports = {
//   searchNhaCungCap,
//   createNhaCungCapAuto,
// };

// controllers/nhaCungCapSearchController.js - Phiên bản đơn giản để debug
// controllers/nhaCungCapSearchController.js - Phiên bản đơn giản hóa hoàn toàn

// controllers/nhaCungCapSearchController.js - Fixed Version
const pool = require("../config/database");
const { sendResponse } = require("../utils/response");
const { parseUrl } = require("../utils/helpers");

const searchNhaCungCap = async (req, res) => {
  try {
    console.log("🔍 NCC Search Request URL:", req.url);

    const { query } = parseUrl(req.url);
    const q = query.q || "";

    if (!q || q.length < 2) {
      return sendResponse(res, 200, true, "Thành công", []);
    }

    const searchQuery = `
      SELECT 
        id, 
        ma_ncc, 
        ten_ncc, 
        dia_chi,
        phone,
        email
      FROM nha_cung_cap 
      WHERE 
        (
          ten_ncc ILIKE $1 OR
          ma_ncc ILIKE $1
        )
      ORDER BY 
        CASE WHEN ten_ncc ILIKE $1 THEN 0 ELSE 1 END,
        ten_ncc ASC
      LIMIT 10
    `;

    const result = await pool.query(searchQuery, [`%${q}%`]);
    console.log("✅ NCC Search results:", result.rows.length);

    sendResponse(res, 200, true, "Tìm kiếm thành công", result.rows);
  } catch (error) {
    console.error("❌ Search nha cung cap error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

// FIXED VERSION - Simplified and reliable
const createNhaCungCapAuto = async (req, res, body) => {
  // <--- THÊM `body` vào tham số
  console.log("\n🆕 === CREATE NCC AUTO START (FINAL) ===");
  console.log("⏰ Timestamp:", new Date().toISOString());

  try {
    // KHÔNG CẦN PARSE BODY Ở ĐÂY NỮA
    console.log("✅ Body received from server:", body);

    // Validation
    const { ten_ncc } = body;
    if (!ten_ncc || typeof ten_ncc !== "string" || ten_ncc.trim() === "") {
      console.error("❌ Invalid ten_ncc:", ten_ncc);
      return sendResponse(res, 400, false, "Tên nhà cung cấp không hợp lệ", {
        received: ten_ncc,
        type: typeof ten_ncc,
      });
    }

    console.log("✅ Validation passed for:", ten_ncc);

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
    const trimmedName = ten_ncc.trim();
    const duplicateCheck = await pool.query(
      "SELECT id, ma_ncc, ten_ncc FROM nha_cung_cap WHERE LOWER(ten_ncc) = LOWER($1)",
      [trimmedName]
    );

    if (duplicateCheck.rows.length > 0) {
      console.log("⚠️ Duplicate found:", duplicateCheck.rows[0]);
      return sendResponse(
        res,
        400,
        false,
        "Nhà cung cấp đã tồn tại trong hệ thống",
        duplicateCheck.rows[0]
      );
    }

    console.log("✅ No duplicates found");

    // Generate ma_ncc
    const maNccResult = await pool.query("SELECT generate_ma_ncc() as ma");
    const maNcc = maNccResult.rows[0].ma;
    console.log("✅ Generated ma_ncc:", maNcc);

    // Create new record
    const insertQuery = `
      INSERT INTO nha_cung_cap (
        ma_ncc, 
        ten_ncc, 
        dia_chi, 
        phone, 
        email
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const insertResult = await pool.query(insertQuery, [
      maNcc,
      trimmedName,
      body.dia_chi || null,
      body.phone || null,
      body.email || null,
    ]);

    const newNcc = insertResult.rows[0];
    console.log("🎉 SUCCESS: Created NCC with ID:", newNcc.id);

    return sendResponse(res, 201, true, "Tạo nhà cung cấp mới thành công", {
      id: newNcc.id,
      ma_ncc: newNcc.ma_ncc,
      ten_ncc: newNcc.ten_ncc,
      dia_chi: newNcc.dia_chi,
      phone: newNcc.phone,
      email: newNcc.email,
    });
  } catch (error) {
    console.error("❌ Error in createNhaCungCapAuto:", error.message);
    console.error("❌ Error stack:", error.stack);

    // Error handling
    if (error.code === "23505") {
      return sendResponse(res, 400, false, "Nhà cung cấp đã tồn tại");
    }

    if (error.code === "23503") {
      return sendResponse(res, 400, false, "Dữ liệu tham chiếu không hợp lệ");
    }

    return sendResponse(res, 500, false, "Lỗi hệ thống", {
      error: error.message,
    });
  } finally {
    console.log("🆕 === CREATE NCC AUTO END (FIXED) ===\n");
  }
};

module.exports = {
  searchNhaCungCap,
  createNhaCungCapAuto,
};
