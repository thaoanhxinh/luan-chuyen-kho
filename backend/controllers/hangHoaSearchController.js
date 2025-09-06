// // controllers/hangHoaSearchController.js - SIMPLE FIX FOR DATABASE STRUCTURE
// const pool = require("../config/database");
// const { sendResponse } = require("../utils/response");
// const { parseUrl } = require("../utils/helpers");

// const searchHangHoa = async (req, res) => {
//   try {
//     console.log("🔍 Hang Hoa Search Request URL:", req.url);

//     const { query } = parseUrl(req.url);
//     const q = query.q || "";

//     console.log("🔍 Search query extracted:", q);

//     // ✅ FIX 1: Kiểm tra minimum length
//     if (!q || q.length < 2) {
//       console.log("❌ Query too short or empty, returning empty array");
//       return sendResponse(res, 200, true, "Thành công", []);
//     }

//     // ✅ FIX 2: Query đơn giản chỉ từ bảng hang_hoa - KHÔNG JOIN
//     const searchQuery = `
//       SELECT
//         id,
//         ma_hang_hoa,
//         ten_hang_hoa,
//         don_vi_tinh,
//         co_so_seri,
//         gia_nhap_gan_nhat
//       FROM hang_hoa
//       WHERE
//         trang_thai = 'active' AND
//         (
//           LOWER(ten_hang_hoa) LIKE LOWER($1) OR
//           LOWER(ma_hang_hoa) LIKE LOWER($1)
//         )
//       ORDER BY
//         -- Ưu tiên exact match trước
//         CASE WHEN LOWER(ten_hang_hoa) = LOWER($2) THEN 0 ELSE 1 END,
//         CASE WHEN LOWER(ten_hang_hoa) LIKE LOWER($1) THEN 0 ELSE 1 END,
//         -- Sau đó sắp xếp theo alphabet
//         ten_hang_hoa ASC
//       LIMIT 10
//     `;

//     const searchPattern = `%${q}%`;
//     const exactMatch = q;

//     console.log("🔍 Executing query with patterns:", {
//       searchPattern,
//       exactMatch,
//     });

//     const result = await pool.query(searchQuery, [searchPattern, exactMatch]);

//     console.log(
//       `✅ Hang Hoa Search completed: ${result.rows.length} results found`
//     );

//     // ✅ FIX 3: Log ra một vài kết quả đầu để debug
//     if (result.rows.length > 0) {
//       console.log(
//         "📋 Sample results:",
//         result.rows.slice(0, 3).map((row) => ({
//           id: row.id,
//           ten_hang_hoa: row.ten_hang_hoa,
//           ma_hang_hoa: row.ma_hang_hoa,
//         }))
//       );
//     } else {
//       console.log("⚠️ No results found for query:", q);

//       // ✅ FIX 4: Debug - Kiểm tra có dữ liệu trong bảng không
//       try {
//         const totalCount = await pool.query(
//           "SELECT COUNT(*) FROM hang_hoa WHERE trang_thai = 'active'"
//         );
//         console.log(
//           "📊 Total active hang_hoa in database:",
//           totalCount.rows[0].count
//         );

//         // Thêm debug: kiểm tra một vài record sample
//         const sampleData = await pool.query(
//           "SELECT ten_hang_hoa, ma_hang_hoa FROM hang_hoa WHERE trang_thai = 'active' LIMIT 5"
//         );
//         console.log("📋 Sample hang_hoa in database:", sampleData.rows);
//       } catch (debugError) {
//         console.log("❌ Debug query failed:", debugError.message);
//       }
//     }

//     sendResponse(res, 200, true, "Tìm kiếm thành công", result.rows);
//   } catch (error) {
//     console.error("❌ Search hang hoa error:", error);
//     sendResponse(res, 500, false, "Lỗi server", { error: error.message });
//   }
// };

// // ✅ FIX 5: Cải thiện createHangHoaAuto - SIMPLE VERSION
// const createHangHoaAuto = async (req, res, body) => {
//   console.log("\n🆕 === CREATE HANG HOA AUTO START ===");
//   console.log("📦 Request body:", body);

//   try {
//     // ✅ Validation đầu vào
//     if (!body || !body.ten_hang_hoa) {
//       return sendResponse(res, 400, false, "Thiếu tên hàng hóa");
//     }

//     const trimmedName = body.ten_hang_hoa.trim();
//     if (trimmedName.length < 2) {
//       return sendResponse(
//         res,
//         400,
//         false,
//         "Tên hàng hóa phải có ít nhất 2 ký tự"
//       );
//     }

//     // ✅ Kiểm tra trùng lặp
//     const existingCheck = await pool.query(
//       "SELECT id FROM hang_hoa WHERE LOWER(TRIM(ten_hang_hoa)) = LOWER($1) AND trang_thai = 'active'",
//       [trimmedName]
//     );

//     if (existingCheck.rows.length > 0) {
//       console.log("⚠️ Hang hoa already exists:", existingCheck.rows[0]);
//       return sendResponse(
//         res,
//         400,
//         false,
//         "Hàng hóa đã tồn tại",
//         existingCheck.rows[0]
//       );
//     }

//     // ✅ Tạo mã hàng hóa đơn giản
//     const count = await pool.query("SELECT COUNT(*) FROM hang_hoa");
//     const maHangHoa = `HH${String(parseInt(count.rows[0].count) + 1).padStart(
//       4,
//       "0"
//     )}`;

//     console.log("✅ Generated ma_hang_hoa:", maHangHoa);

//     // ✅ Lấy đơn vị tính hợp lệ
//     const don_vi_tinh = body.don_vi_tinh || "Cái";

//     // ✅ Insert mới - SIMPLE VERSION
//     const insertQuery = `
//       INSERT INTO hang_hoa (
//         ma_hang_hoa,
//         ten_hang_hoa,
//         don_vi_tinh,
//         co_so_seri,
//         ton_kho_hien_tai,
//         gia_nhap_gan_nhat,
//         trang_thai,
//         la_tai_san_co_dinh,
//         created_at
//       ) VALUES ($1, $2, $3, false, 0, 0, 'active', false, NOW())
//       RETURNING *
//     `;

//     const insertResult = await pool.query(insertQuery, [
//       maHangHoa,
//       trimmedName,
//       don_vi_tinh,
//     ]);

//     const newHangHoa = insertResult.rows[0];
//     console.log("🎉 SUCCESS: Created hang hoa with ID:", newHangHoa.id);

//     return sendResponse(res, 201, true, "Tạo hàng hóa mới thành công", {
//       id: newHangHoa.id,
//       ma_hang_hoa: newHangHoa.ma_hang_hoa,
//       ten_hang_hoa: newHangHoa.ten_hang_hoa,
//       don_vi_tinh: newHangHoa.don_vi_tinh,
//       co_so_seri: newHangHoa.co_so_seri,
//       gia_nhap_gan_nhat: newHangHoa.gia_nhap_gan_nhat || 0,
//     });
//   } catch (error) {
//     console.error("❌ Error in createHangHoaAuto:", error.message);
//     console.error("❌ Error stack:", error.stack);

//     // ✅ Error handling chi tiết
//     if (error.code === "23505") {
//       return sendResponse(res, 400, false, "Hàng hóa đã tồn tại");
//     }

//     if (error.code === "23503") {
//       return sendResponse(res, 400, false, "Dữ liệu tham chiếu không hợp lệ");
//     }

//     return sendResponse(res, 500, false, "Lỗi hệ thống", {
//       error: error.message,
//     });
//   } finally {
//     console.log("🆕 === CREATE HANG HOA AUTO END ===\n");
//   }
// };

// const searchHangHoaForXuatKho = async (req, res) => {
//   const client = await pool.connect();
//   try {
//     const url = new URL(req.url, `http://${req.headers.host}`);
//     const q = url.searchParams.get("q");
//     const phong_ban_id = url.searchParams.get("phong_ban_id");

//     console.log("🔍 Search params received:", { q, phong_ban_id });

//     if (!phong_ban_id) {
//       return sendResponse(res, 400, false, "Thiếu thông tin phòng ban");
//     }

//     let whereCondition = `WHERE hh.trang_thai = 'active'
//                           AND tk.phong_ban_id = $1
//                           AND (tk.sl_tot + tk.sl_kem_pham_chat + tk.sl_mat_pham_chat) > 0`;

//     const params = [phong_ban_id];

//     if (q && q.trim()) {
//       whereCondition += ` AND (hh.ten_hang_hoa ILIKE $2 OR hh.ma_hang_hoa ILIKE $2)`;
//       params.push(`%${q.trim()}%`);
//     }

//     // ✅ QUERY ĐÚNG THEO SCHEMA: Chỉ lấy thông tin cơ bản
//     const querySQL = `
//       SELECT DISTINCT
//         hh.id, hh.ma_hang_hoa, hh.ten_hang_hoa, hh.don_vi_tinh, hh.co_so_seri,
//         lhh.ten_loai,
//         (tk.sl_tot + tk.sl_kem_pham_chat + tk.sl_mat_pham_chat) as ton_kho_hien_tai,
//         tk.sl_tot, tk.sl_kem_pham_chat, tk.sl_mat_pham_chat,
//         tk.don_gia_binh_quan,

//         CASE
//           WHEN (tk.sl_tot + tk.sl_kem_pham_chat + tk.sl_mat_pham_chat) > 0 THEN true
//           ELSE false
//         END as co_the_xuat

//       FROM hang_hoa hh
//       LEFT JOIN loai_hang_hoa lhh ON hh.loai_hang_hoa_id = lhh.id
//       INNER JOIN ton_kho tk ON hh.id = tk.hang_hoa_id
//       ${whereCondition}
//       ORDER BY
//         (tk.sl_tot + tk.sl_kem_pham_chat + tk.sl_mat_pham_chat) DESC,
//         hh.ten_hang_hoa
//       LIMIT 20
//     `;

//     const result = await client.query(querySQL, params);

//     const enhancedResults = result.rows.map((item) => ({
//       ...item,
//       display_info: `${item.ten_hang_hoa} (Tồn: ${item.ton_kho_hien_tai} ${item.don_vi_tinh})`,
//       warning: item.ton_kho_hien_tai < 5 ? "Sắp hết hàng" : null,
//     }));

//     console.log(`✅ Found ${enhancedResults.length} items for xuat kho`);

//     sendResponse(
//       res,
//       200,
//       true,
//       "Tìm kiếm hàng hóa xuất kho thành công",
//       enhancedResults
//     );
//   } catch (error) {
//     console.error("❌ Search hang hoa for xuat kho error:", error);
//     sendResponse(res, 500, false, "Lỗi server", { error: error.message });
//   } finally {
//     client.release();
//   }
// };

// // ✅ HÀM PHỤ: Lấy chi tiết lô hàng để xuất (gọi khi user chọn hàng hóa)
// const getLotsForXuatKho = async (req, res) => {
//   const client = await pool.connect();
//   try {
//     // ✅ FIX: Sửa tên parameters cho đúng với route pattern
//     const { hangHoaId, phongBanId } = req.params;

//     console.log("🔍 Getting lots for:", { hangHoaId, phongBanId });

//     const query = `
//   SELECT
//     ctn.id as chi_tiet_nhap_id,
//     pn.id as phieu_nhap_id,
//     pn.so_phieu as phieu_nhap,
//     pn.ngay_nhap,
//     ctn.don_gia,
//     ctn.pham_chat,
//     -- ✅ FIX: Handle empty string to NULL
//     CASE
//       WHEN ctn.so_seri_list = '' THEN NULL
//       ELSE ctn.so_seri_list
//     END as so_seri_list,
//     (ctn.so_luong - COALESCE(SUM(ctx.so_luong_thuc_xuat), 0)) as so_luong_con_lai,

//     CASE
//       WHEN ctn.so_seri_list IS NOT NULL AND ctn.so_seri_list != '' THEN
//         'Serial: ' || ctn.so_seri_list || ' | Giá: ' || ctn.don_gia
//       ELSE
//         'Lô ' || pn.so_phieu || ' (' || pn.ngay_nhap || ') | Giá: ' || ctn.don_gia
//     END as display_text

//   FROM chi_tiet_nhap ctn
//   JOIN phieu_nhap pn ON ctn.phieu_nhap_id = pn.id
//   -- ✅ FIX: JOIN condition đúng theo database structure
//   LEFT JOIN chi_tiet_xuat ctx ON (
//     ctx.phieu_nhap_id = pn.id
//     AND ctx.hang_hoa_id = ctn.hang_hoa_id
//   )
//   WHERE ctn.hang_hoa_id = $1
//     AND pn.phong_ban_id = $2
//     AND pn.trang_thai = 'completed'
//     AND ctn.so_luong > COALESCE(SUM(ctx.so_luong_thuc_xuat), 0)
//   GROUP BY ctn.id, pn.id, pn.so_phieu, pn.ngay_nhap, ctn.don_gia, ctn.pham_chat, ctn.so_seri_list, ctn.so_luong
//   HAVING ctn.so_luong > COALESCE(SUM(ctx.so_luong_thuc_xuat), 0)
//   ORDER BY pn.ngay_nhap ASC
// `;
//     // ✅ FIX: Dùng hangHoaId và phongBanId thay vì hang_hoa_id, phong_ban_id
//     const result = await client.query(query, [hangHoaId, phongBanId]);

//     console.log(
//       `✅ Found ${result.rows.length} lots for hang_hoa_id: ${hangHoaId}`
//     );

//     sendResponse(
//       res,
//       200,
//       true,
//       "Lấy danh sách lô hàng thành công",
//       result.rows
//     );
//   } catch (error) {
//     console.error("❌ Get lots for xuat kho error:", error);
//     sendResponse(res, 500, false, "Lỗi server", { error: error.message });
//   } finally {
//     client.release();
//   }
// };
// module.exports = {
//   searchHangHoa,
//   createHangHoaAuto,
//   searchHangHoaForXuatKho, // ✅ THÊM VÀO EXPORTS
//   getLotsForXuatKho,
// };

// controllers/hangHoaSearchController.js - FIXED VERSION
const pool = require("../config/database");
const { sendResponse } = require("../utils/response");
const { parseUrl } = require("../utils/helpers");

const searchHangHoa = async (req, res) => {
  try {
    console.log("🔍 Hang Hoa Search Request URL:", req.url);

    const { query } = parseUrl(req.url);
    const q = query.q || "";

    console.log("🔍 Search query extracted:", q);

    // ✅ FIX 1: Kiểm tra minimum length
    if (!q || q.length < 2) {
      console.log("⚠ Query too short or empty, returning empty array");
      return sendResponse(res, 200, true, "Thành công", []);
    }

    // ✅ FIX 2: Query đơn giản chỉ từ bảng hang_hoa - KHÔNG JOIN
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
          LOWER(ten_hang_hoa) LIKE LOWER($1) OR
          LOWER(ma_hang_hoa) LIKE LOWER($1)
        )
      ORDER BY 
        -- Ưu tiên exact match trước
        CASE WHEN LOWER(ten_hang_hoa) = LOWER($2) THEN 0 ELSE 1 END,
        CASE WHEN LOWER(ten_hang_hoa) LIKE LOWER($1) THEN 0 ELSE 1 END,
        -- Sau đó sắp xếp theo alphabet
        ten_hang_hoa ASC
      LIMIT 10
    `;

    const searchPattern = `%${q}%`;
    const exactMatch = q;

    console.log("🔍 Executing query with patterns:", {
      searchPattern,
      exactMatch,
    });

    const result = await pool.query(searchQuery, [searchPattern, exactMatch]);

    console.log(
      `✅ Hang Hoa Search completed: ${result.rows.length} results found`
    );

    // ✅ FIX 3: Log ra một vài kết quả đầu để debug
    if (result.rows.length > 0) {
      console.log(
        "📋 Sample results:",
        result.rows.slice(0, 3).map((row) => ({
          id: row.id,
          ten_hang_hoa: row.ten_hang_hoa,
          ma_hang_hoa: row.ma_hang_hoa,
        }))
      );
    } else {
      console.log("⚠️ No results found for query:", q);

      // ✅ FIX 4: Debug - Kiểm tra có dữ liệu trong bảng không
      try {
        const totalCount = await pool.query(
          "SELECT COUNT(*) FROM hang_hoa WHERE trang_thai = 'active'"
        );
        console.log(
          "📊 Total active hang_hoa in database:",
          totalCount.rows[0].count
        );

        // Thêm debug: kiểm tra một vài record sample
        const sampleData = await pool.query(
          "SELECT ten_hang_hoa, ma_hang_hoa FROM hang_hoa WHERE trang_thai = 'active' LIMIT 5"
        );
        console.log("📋 Sample hang_hoa in database:", sampleData.rows);
      } catch (debugError) {
        console.log("❌ Debug query failed:", debugError.message);
      }
    }

    sendResponse(res, 200, true, "Tìm kiếm thành công", result.rows);
  } catch (error) {
    console.error("❌ Search hang hoa error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

// ✅ FIXED: createHangHoaAuto - SỬA LỖI COLUMN KHÔNG TỒN TẠI
const createHangHoaAuto = async (req, res, body) => {
  console.log("\n🆕 === CREATE HANG HOA AUTO START ===");
  console.log("📦 Request body:", body);
  console.log("📦 Request headers:", req.headers);
  console.log("📦 Request method:", req.method);

  try {
    // ✅ Validation đầu vào
    if (!body || !body.ten_hang_hoa) {
      return sendResponse(res, 400, false, "Thiếu tên hàng hóa");
    }

    const trimmedName = body.ten_hang_hoa.trim();
    if (trimmedName.length < 2) {
      return sendResponse(
        res,
        400,
        false,
        "Tên hàng hóa phải có ít nhất 2 ký tự"
      );
    }

    // ✅ Kiểm tra trùng lặp
    const existingCheck = await pool.query(
      "SELECT id FROM hang_hoa WHERE LOWER(TRIM(ten_hang_hoa)) = LOWER($1) AND trang_thai = 'active'",
      [trimmedName]
    );

    if (existingCheck.rows.length > 0) {
      console.log("⚠️ Hang hoa already exists:", existingCheck.rows[0]);
      return sendResponse(
        res,
        400,
        false,
        "Hàng hóa đã tồn tại",
        existingCheck.rows[0]
      );
    }

    // ✅ Tạo mã hàng hóa đơn giản
    const count = await pool.query("SELECT COUNT(*) FROM hang_hoa");
    const maHangHoa = `HH${String(parseInt(count.rows[0].count) + 1).padStart(
      4,
      "0"
    )}`;

    console.log("✅ Generated ma_hang_hoa:", maHangHoa);

    // ✅ Lấy đơn vị tính hợp lệ
    const don_vi_tinh = body.don_vi_tinh || "Cái";

    // ✅ FIXED INSERT - XÓA CỘT ton_kho_hien_tai VÀ phong_ban_id
    const insertQuery = `
      INSERT INTO hang_hoa (
        ma_hang_hoa, 
        ten_hang_hoa, 
        don_vi_tinh,
        co_so_seri,
        gia_nhap_gan_nhat,
        trang_thai,
        la_tai_san_co_dinh,
        theo_doi_pham_chat,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;

    const insertResult = await pool.query(insertQuery, [
      maHangHoa,
      trimmedName,
      don_vi_tinh,
      body.co_so_seri !== undefined ? body.co_so_seri : true,
      0, // gia_nhap_gan_nhat
      "active", // trang_thai
      body.la_tai_san_co_dinh || false,
      body.theo_doi_pham_chat !== undefined ? body.theo_doi_pham_chat : true,
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

    // ✅ Error handling chi tiết
    if (error.code === "23505") {
      return sendResponse(res, 400, false, "Hàng hóa đã tồn tại");
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
    console.log("🆕 === CREATE HANG HOA AUTO END ===\n");
  }
};

const searchHangHoaForXuatKho = async (req, res) => {
  const client = await pool.connect();
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const q = url.searchParams.get("q");
    const phong_ban_id = url.searchParams.get("phong_ban_id");

    console.log("🔍 Search params:", { q, phong_ban_id });

    if (!q || q.length < 2) {
      return sendResponse(res, 200, true, "Tìm kiếm thành công", []);
    }

    if (!phong_ban_id) {
      return sendResponse(res, 400, false, "Thiếu thông tin phòng ban");
    }

    // ✅ Query với tồn kho đơn giản hơn
    const query = `
      SELECT DISTINCT
        h.id,
        h.ma_hang_hoa,
        h.ten_hang_hoa,
        h.don_vi_tinh,
        h.co_so_seri,
        h.gia_nhap_gan_nhat,
        COALESCE(tk.sl_tot + tk.sl_kem_pham_chat, 0) as ton_kho_hien_tai
      FROM hang_hoa h
      LEFT JOIN ton_kho tk ON h.id = tk.hang_hoa_id AND tk.phong_ban_id = $2
      WHERE h.trang_thai = 'active'
        AND (
          LOWER(h.ten_hang_hoa) LIKE LOWER($1) OR
          LOWER(h.ma_hang_hoa) LIKE LOWER($1)
        )
        AND COALESCE(tk.sl_tot + tk.sl_kem_pham_chat, 0) > 0
      ORDER BY h.ten_hang_hoa ASC
      LIMIT 20
    `;

    const searchPattern = `%${q}%`;
    const result = await client.query(query, [searchPattern, phong_ban_id]);

    console.log(
      `✅ Found ${result.rows.length} hang hoa for xuat kho with query: ${q}`
    );

    sendResponse(res, 200, true, "Tìm kiếm thành công", result.rows);
  } catch (error) {
    console.error("❌ Search hang hoa for xuat kho error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  } finally {
    client.release();
  }
};

// ✅ HÀM CHÍNH: getLotsForXuatKho - SỬA LẠI HOÀN TOÀN
const getLotsForXuatKho = async (req, res) => {
  const client = await pool.connect();

  try {
    // ✅ Lấy params từ req.params (đã được set trong server.js)
    const { hangHoaId, phongBanId } = req.params;

    console.log("📦 Getting lots for xuat kho:", { hangHoaId, phongBanId });

    if (!hangHoaId || !phongBanId) {
      return sendResponse(
        res,
        400,
        false,
        "Thiếu thông tin hàng hóa hoặc phòng ban"
      );
    }

    // ✅ Query SỬA LẠI - XỬ LÝ ĐÚNG so_seri_list KIỂU TEXT[]
    const query = `
      SELECT 
        pn.id as phieu_nhap_id,
        pn.so_phieu,
        pn.ngay_nhap,
        ctn.don_gia,
        ctn.pham_chat,
        ctn.so_seri_list,
        ctn.so_luong as so_luong_con_lai,
        CONCAT(
          pn.so_phieu, 
          ' - ', 
          TO_CHAR(pn.ngay_nhap, 'DD/MM/YYYY'), 
          ' (Còn: ', 
          ctn.so_luong, 
          ')'
        ) as display_text
      FROM chi_tiet_nhap ctn
      JOIN phieu_nhap pn ON ctn.phieu_nhap_id = pn.id
      WHERE ctn.hang_hoa_id = $1
        AND pn.phong_ban_id = $2
        AND pn.trang_thai IN ('approved','completed')
        AND ctn.so_luong > 0
      ORDER BY pn.ngay_nhap ASC, pn.created_at ASC
    `;

    let result = await client.query(query, [hangHoaId, phongBanId]);

    console.log(
      `✅ Found ${result.rows.length} lots for hang_hoa_id: ${hangHoaId}`
    );

    // 🔁 Fallback: nếu không tìm được lô từ chi_tiet_nhap/chi_tiet_xuat, dùng ton_kho + phiếu nhập gần nhất
    if (result.rows.length === 0) {
      const fallbackQuery = `
        WITH tk AS (
          SELECT COALESCE(sl_tot + sl_kem_pham_chat, 0) AS so_luong_con_lai
          FROM ton_kho
          WHERE hang_hoa_id = $1 AND phong_ban_id = $2
          LIMIT 1
        ), latest_inbound AS (
          SELECT 
            pn.id AS phieu_nhap_id,
            pn.so_phieu,
            pn.ngay_nhap,
            MIN(ctn.don_gia) AS don_gia,
            MIN(ctn.pham_chat) AS pham_chat
          FROM chi_tiet_nhap ctn
          JOIN phieu_nhap pn ON ctn.phieu_nhap_id = pn.id
          WHERE ctn.hang_hoa_id = $1
            AND pn.phong_ban_id = $2
            AND pn.trang_thai IN ('approved','completed')
          GROUP BY pn.id, pn.so_phieu, pn.ngay_nhap
          ORDER BY pn.ngay_nhap DESC
          LIMIT 1
        )
        SELECT 
          l.phieu_nhap_id,
          l.so_phieu,
          l.ngay_nhap,
          l.don_gia,
          l.pham_chat,
          NULL::text[] AS so_seri_list,
          tk.so_luong_con_lai,
          CONCAT(
            l.so_phieu,
            ' - ',
            TO_CHAR(l.ngay_nhap, 'DD/MM/YYYY'),
            ' (Còn: ',
            tk.so_luong_con_lai,
            ')'
          ) AS display_text
        FROM latest_inbound l
        JOIN tk ON TRUE
        WHERE tk.so_luong_con_lai > 0
      `;

      const fb = await client.query(fallbackQuery, [hangHoaId, phongBanId]);
      if (fb.rows.length > 0) {
        console.log("🔁 Fallback provided", fb.rows.length, "lot(s)");
        result = { rows: fb.rows };
      }
    }

    sendResponse(
      res,
      200,
      true,
      "Lấy danh sách lô hàng thành công",
      result.rows
    );
  } catch (error) {
    console.error("❌ Get lots for xuat kho error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  } finally {
    client.release();
  }
};
module.exports = {
  searchHangHoa,
  createHangHoaAuto,
  searchHangHoaForXuatKho,
  getLotsForXuatKho,
};
