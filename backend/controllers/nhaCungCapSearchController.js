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
        trang_thai = 'active' AND
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

// ✅ FIX CHÍNH: SỬA FUNCTION createNhaCungCapAuto
const createNhaCungCapAuto = async (req, res, body) => {
  console.log("\n🆕 === CREATE NCC AUTO START (FIXED VERSION) ===");
  console.log("⏰ Timestamp:", new Date().toISOString());

  try {
    console.log("✅ Body received from server:", body);

    // ✅ Validation cơ bản
    const { ten_ncc, loai_nha_cung_cap } = body;
    if (!ten_ncc || typeof ten_ncc !== "string" || ten_ncc.trim() === "") {
      console.error("❌ Invalid ten_ncc:", ten_ncc);
      return sendResponse(res, 400, false, "Tên nhà cung cấp không hợp lệ", {
        received: ten_ncc,
        type: typeof ten_ncc,
      });
    }

    console.log("✅ Validation passed for:", ten_ncc);

    // ✅ Authentication
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

    // ✅ Get user info
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

    // ✅ Check for duplicates
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

    // ✅ Generate ma_ncc using function
    const maNccResult = await pool.query("SELECT generate_ma_ncc() as ma");
    const maNcc = maNccResult.rows[0].ma;
    console.log("✅ Generated ma_ncc:", maNcc);

    // ✅ FIXED: Xác định loại nhà cung cấp và is_noi_bo
    // Yêu cầu: tu_mua -> is_noi_bo = false; tren_cap & dieu_chuyen -> is_noi_bo = true
    const finalLoaiNcc = loai_nha_cung_cap || "tu_mua";
    const isNoiBo = finalLoaiNcc !== "tu_mua";

    console.log("🔧 NCC Type determined:", { finalLoaiNcc, isNoiBo });

    // ✅ FIXED: CREATE với đầy đủ columns theo hi4.sql schema
    const insertQuery = `
      INSERT INTO nha_cung_cap (
        ma_ncc, 
        ten_ncc, 
        dia_chi, 
        phone, 
        email,
        nguoi_lien_he,
        is_noi_bo,
        loai_nha_cung_cap,
        phong_ban_id,
        trang_thai,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', NOW(), NOW())
      RETURNING *
    `;

    const insertResult = await pool.query(insertQuery, [
      maNcc,
      trimmedName,
      body.dia_chi || null,
      body.phone || null,
      body.email || null,
      body.nguoi_lien_he || null,
      isNoiBo,
      finalLoaiNcc,
      isNoiBo ? user.phong_ban_id : null, // Nếu nội bộ thì gán phòng ban
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
      is_noi_bo: newNcc.is_noi_bo,
      loai_nha_cung_cap: newNcc.loai_nha_cung_cap,
    });
  } catch (error) {
    console.error("❌ Error in createNhaCungCapAuto:", error.message);
    console.error("❌ Error stack:", error.stack);

    // ✅ Error handling
    if (error.code === "23505") {
      return sendResponse(res, 400, false, "Nhà cung cấp đã tồn tại");
    }

    if (error.code === "23503") {
      return sendResponse(res, 400, false, "Dữ liệu tham chiếu không hợp lệ");
    }

    if (error.code === "42703") {
      return sendResponse(
        res,
        500,
        false,
        "Lỗi cấu trúc database - cột không tồn tại"
      );
    }

    return sendResponse(res, 500, false, "Lỗi hệ thống", {
      error: error.message,
    });
  } finally {
    console.log("🆕 === CREATE NCC AUTO END (FIXED) ===\n");
  }
};

const searchNhaCungCapByType = async (req, res, query, user) => {
  try {
    console.log("🔍 NCC SearchByType - Request URL:", req.url);
    console.log("🔍 NCC SearchByType - Query params:", query);
    console.log("🔍 NCC SearchByType - User:", user);

    const { search = "", loai_phieu = "tu_mua" } = query;
    console.log("🔍 NCC SearchByType - Parsed params:", { search, loai_phieu });

    let whereConditions = ["ncc.trang_thai = 'active'"];
    const params = [];
    let paramIndex = 1;

    // ✅ Filter theo loại phiếu - SỬA LOGIC CHO ĐÚNG VỚI HI4.SQL
    if (loai_phieu === "tu_mua") {
      whereConditions.push(
        `(ncc.loai_nha_cung_cap = 'tu_mua' OR ncc.loai_nha_cung_cap IS NULL) AND ncc.is_noi_bo = FALSE`
      );
    } else if (loai_phieu === "tren_cap") {
      whereConditions.push(
        `ncc.loai_nha_cung_cap = 'tren_cap' AND ncc.is_noi_bo = TRUE`
      );
    } else if (loai_phieu === "dieu_chuyen") {
      whereConditions.push(
        `ncc.loai_nha_cung_cap = 'dieu_chuyen' AND ncc.is_noi_bo = TRUE`
      );
      // Chỉ lấy các phòng ban cấp 3 khác (không phải của user)
      if (user && user.phong_ban_id) {
        whereConditions.push(`ncc.phong_ban_id != $${paramIndex++}`);
        params.push(user.phong_ban_id);
      }
    }

    // Search theo tên
    if (search && search.trim()) {
      whereConditions.push(
        `(ncc.ten_ncc ILIKE $${paramIndex++} OR ncc.ma_ncc ILIKE $${paramIndex})`
      );
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
      paramIndex++;
    }

    const whereClause = whereConditions.join(" AND ");

    const query_str = `
      SELECT ncc.id, ncc.ma_ncc, ncc.ten_ncc, ncc.dia_chi, ncc.phone, ncc.email, 
             ncc.nguoi_lien_he, ncc.is_noi_bo, ncc.loai_nha_cung_cap, ncc.phong_ban_id,
             pb.ten_phong_ban, pb.cap_bac
      FROM nha_cung_cap ncc
      LEFT JOIN phong_ban pb ON ncc.phong_ban_id = pb.id
      WHERE ${whereClause}
      ORDER BY ncc.ten_ncc
      LIMIT 20
    `;

    const result = await pool.query(query_str, params);

    sendResponse(res, 200, true, "Tìm kiếm thành công", result.rows);
  } catch (error) {
    console.error("Search NCC by type error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

module.exports = {
  searchNhaCungCap,
  createNhaCungCapAuto,
  searchNhaCungCapByType,
};
