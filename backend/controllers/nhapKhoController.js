// const pool = require("../config/database");
// const { sendResponse } = require("../utils/response");

// const getList = async (req, res, query, user) => {
//   try {
//     const {
//       page = 1,
//       limit = 20,
//       tu_ngay,
//       den_ngay,
//       trang_thai,
//       loai_phieu,
//     } = query;

//     const offset = (page - 1) * limit;
//     let whereClause = "WHERE 1=1";
//     const params = [];
//     let paramCount = 0;

//     // Lọc theo ngày
//     if (tu_ngay && den_ngay) {
//       paramCount += 2;
//       whereClause += ` AND pn.ngay_nhap BETWEEN $${
//         paramCount - 1
//       } AND $${paramCount}`;
//       params.push(tu_ngay, den_ngay);
//     }

//     // Lọc theo trạng thái
//     if (trang_thai) {
//       paramCount++;
//       whereClause += ` AND pn.trang_thai = $${paramCount}`;
//       params.push(trang_thai);
//     }

//     // Lọc theo loại phiếu
//     if (loai_phieu) {
//       paramCount++;
//       whereClause += ` AND pn.loai_phieu = $${paramCount}`;
//       params.push(loai_phieu);
//     }

//     // Phân quyền theo phòng ban
//     if (user.role !== "admin") {
//       paramCount++;
//       whereClause += ` AND pn.phong_ban_id = $${paramCount}`;
//       params.push(user.phong_ban_id);
//     }

//     const countQuery = `
//       SELECT COUNT(*) FROM phieu_nhap pn ${whereClause}
//     `;

//     const dataQuery = `
//   SELECT pn.*,
//          ncc.id as ncc_id, ncc.ma_ncc, ncc.ten_ncc,
//          u.id as nguoi_tao_id, u.ho_ten as nguoi_tao_ten,
//          pb.ten_phong_ban,
//          -- Thêm các trường liên quan đến file
//          pn.decision_pdf_url,
//          pn.decision_pdf_filename,
//          pn.ghi_chu_hoan_thanh
//   FROM phieu_nhap pn
//   LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
//   LEFT JOIN users u ON pn.nguoi_tao = u.id
//   LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
//   ${whereClause}
//   ORDER BY pn.created_at DESC
//   LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
// `;

//     params.push(limit, offset);

//     const [countResult, dataResult] = await Promise.all([
//       pool.query(countQuery, params.slice(0, -2)),
//       pool.query(dataQuery, params),
//     ]);

//     const total = parseInt(countResult.rows[0].count);
//     const pages = Math.ceil(total / limit);
//     const structuredItems = dataResult.rows.map((item) => ({
//       ...item,
//       nha_cung_cap: item.ncc_id
//         ? {
//             id: item.ncc_id,
//             ma_ncc: item.ma_ncc,
//             ten_ncc: item.ten_ncc,
//           }
//         : null,
//       user_tao: item.nguoi_tao_id
//         ? {
//             id: item.nguoi_tao_id,
//             ho_ten: item.nguoi_tao_ten,
//           }
//         : null,
//     }));
//     sendResponse(res, 200, true, "Lấy danh sách thành công", {
//       items: structuredItems, // Sử dụng dữ liệu đã cấu trúc lại
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total,
//         pages,
//       },
//     });
//   } catch (error) {
//     console.error("Get phieu nhap error:", error);
//     sendResponse(res, 500, false, "Lỗi server");
//   }
// };

// const update = async (req, res, params, body, user) => {
//   const client = await pool.connect();

//   try {
//     await client.query("BEGIN");

//     const { id } = params;

//     const {
//       ngay_nhap,
//       loai_phieu,
//       nguoi_nhap_hang,
//       so_quyet_dinh,
//       so_hoa_don,
//       dia_chi_nhap,
//       phuong_thuc_van_chuyen,
//       ly_do_nhap,
//       ghi_chu,
//       nha_cung_cap_id,
//       chi_tiet = [],
//     } = body;

//     // Kiểm tra phiếu tồn tại
//     const phieuResult = await client.query(
//       "SELECT * FROM phieu_nhap WHERE id = $1",
//       [id]
//     );
//     if (phieuResult.rows.length === 0) {
//       return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
//     }
//     const phieu = phieuResult.rows[0];
//     if (user.role !== "admin" && phieu.phong_ban_id !== user.phong_ban_id) {
//       return sendResponse(res, 403, false, "Bạn không có quyền sửa phiếu này");
//     }
//     if (phieu.trang_thai === "completed" || phieu.trang_thai === "cancelled") {
//       const trangThaiHienTai =
//         phieu.trang_thai === "completed" ? "hoàn thành" : "bị hủy";
//       return sendResponse(
//         res,
//         400,
//         false,
//         `Không thể sửa phiếu đã ${trangThaiHienTai}.`
//       );
//     }

//     // Cập nhật thông tin phiếu
//     await client.query(
//       `
//       UPDATE phieu_nhap
//       SET
//         ngay_nhap = $1,
//         nha_cung_cap_id = $2,
//         ly_do_nhap = $3,
//         so_hoa_don = $4,
//         ghi_chu = $5,
//         loai_phieu = $6,
//         nguoi_nhap_hang = $7,
//         so_quyet_dinh = $8,
//         dia_chi_nhap = $9,
//         phuong_thuc_van_chuyen = $10,
//         updated_at = CURRENT_TIMESTAMP
//       WHERE id = $11
//     `,
//       [
//         ngay_nhap,
//         nha_cung_cap_id,
//         ly_do_nhap,
//         so_hoa_don,
//         ghi_chu,
//         loai_phieu,
//         nguoi_nhap_hang,
//         so_quyet_dinh,
//         dia_chi_nhap,
//         phuong_thuc_van_chuyen,
//         id,
//       ]
//     );

//     // Xóa chi tiết cũ
//     await client.query("DELETE FROM chi_tiet_nhap WHERE phieu_nhap_id = $1", [
//       id,
//     ]);

//     // Thêm chi tiết mới
//     let tongTien = 0;
//     for (const item of chi_tiet) {
//       const thanhTien = item.so_luong * item.don_gia;
//       tongTien += thanhTien;

//       await client.query(
//         `
//         INSERT INTO chi_tiet_nhap (
//           phieu_nhap_id, hang_hoa_id, so_luong, don_gia, thanh_tien,
//           so_seri_list, pham_chat, han_su_dung, vi_tri_kho, ghi_chu
//         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
//       `,
//         [
//           id,
//           item.hang_hoa_id,
//           item.so_luong,
//           item.don_gia,
//           thanhTien,
//           item.so_seri_list || null,
//           item.pham_chat || "tot",
//           item.han_su_dung,
//           item.vi_tri_kho,
//           item.ghi_chu,
//         ]
//       );
//     }

//     // Cập nhật tổng tiền
//     await client.query("UPDATE phieu_nhap SET tong_tien = $1 WHERE id = $2", [
//       tongTien,
//       id,
//     ]);

//     await client.query("COMMIT");

//     sendResponse(res, 200, true, "Cập nhật phiếu nhập thành công");
//   } catch (error) {
//     await client.query("ROLLBACK");
//     console.error("Update phieu nhap error:", error);
//     sendResponse(res, 500, false, "Lỗi server");
//   } finally {
//     client.release();
//   }
// };

// const deletePhieu = async (req, res, params, user) => {
//   try {
//     const { id } = params;

//     // Kiểm tra phiếu tồn tại
//     const phieuResult = await pool.query(
//       "SELECT * FROM phieu_nhap WHERE id = $1",
//       [id]
//     );

//     if (phieuResult.rows.length === 0) {
//       return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
//     }

//     const phieu = phieuResult.rows[0];

//     // Kiểm tra quyền xóa
//     if (user.role !== "admin" && phieu.phong_ban_id !== user.phong_ban_id) {
//       return sendResponse(res, 403, false, "Bạn không có quyền xóa phiếu này");
//     }

//     // Chỉ cho phép xóa phiếu ở trạng thái draft
//     if (phieu.trang_thai !== "draft") {
//       return sendResponse(
//         res,
//         400,
//         false,
//         "Chỉ có thể xóa phiếu ở trạng thái nháp"
//       );
//     }

//     // Xóa phiếu (chi tiết sẽ tự động xóa theo CASCADE)
//     await pool.query("DELETE FROM phieu_nhap WHERE id = $1", [id]);

//     sendResponse(res, 200, true, "Xóa phiếu nhập thành công");
//   } catch (error) {
//     console.error("Delete phieu nhap error:", error);
//     sendResponse(res, 500, false, "Lỗi server");
//   }
// };

// const approve = async (req, res, params, user) => {
//   try {
//     const { id } = params;

//     const phieu = await pool.query("SELECT * FROM phieu_nhap WHERE id = $1", [
//       id,
//     ]);

//     if (phieu.rows.length === 0) {
//       return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
//     }

//     if (phieu.rows[0].trang_thai !== "draft") {
//       return sendResponse(res, 400, false, "Phiếu đã được xử lý");
//     }

//     await pool.query(
//       `
//       UPDATE phieu_nhap
//       SET trang_thai = 'approved', nguoi_duyet = $1, ngay_duyet = CURRENT_TIMESTAMP
//       WHERE id = $2
//     `,
//       [user.id, id]
//     );

//     sendResponse(res, 200, true, "Duyệt phiếu nhập thành công");
//   } catch (error) {
//     console.error("Approve phieu nhap error:", error);
//     sendResponse(res, 500, false, "Lỗi server");
//   }
// };

// // Hàm upload quyết định PDF
// const uploadDecision = async (req, res, params, body, user, file) => {
//   try {
//     const { id } = params;
//     const { ghi_chu_hoan_thanh } = body;

//     if (!file) {
//       return sendResponse(res, 400, false, "Cần chọn file PDF quyết định");
//     }

//     // Kiểm tra phiếu tồn tại và có trạng thái approved
//     const phieu = await pool.query("SELECT * FROM phieu_nhap WHERE id = $1", [
//       id,
//     ]);

//     if (phieu.rows.length === 0) {
//       return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
//     }

//     if (phieu.rows[0].trang_thai !== "approved") {
//       return sendResponse(
//         res,
//         400,
//         false,
//         "Phiếu chưa được duyệt hoặc đã hoàn thành"
//       );
//     }

//     // Lưu thông tin file vào database
//     const decision_pdf_url = `/uploads/decisions/${file.filename}`;
//     const decision_pdf_filename = file.originalname;

//     await pool.query(
//       `UPDATE phieu_nhap
//        SET decision_pdf_url = $1, decision_pdf_filename = $2, ghi_chu_hoan_thanh = $3, updated_at = CURRENT_TIMESTAMP
//        WHERE id = $4`,
//       [decision_pdf_url, decision_pdf_filename, ghi_chu_hoan_thanh || "", id]
//     );

//     sendResponse(res, 200, true, "Upload quyết định thành công", {
//       filename: decision_pdf_filename,
//       url: decision_pdf_url,
//     });
//   } catch (error) {
//     console.error("Upload decision error:", error);
//     sendResponse(res, 500, false, "Lỗi server");
//   }
// };

// // Hàm hoàn thành phiếu nhập
// const complete = async (req, res, params, user) => {
//   try {
//     const { id } = params;

//     // Kiểm tra phiếu đã có PDF quyết định chưa
//     const phieu = await pool.query("SELECT * FROM phieu_nhap WHERE id = $1", [
//       id,
//     ]);

//     if (phieu.rows.length === 0) {
//       return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
//     }

//     if (phieu.rows[0].trang_thai !== "approved") {
//       return sendResponse(res, 400, false, "Phiếu chưa được duyệt");
//     }

//     if (!phieu.rows[0].decision_pdf_url) {
//       return sendResponse(
//         res,
//         400,
//         false,
//         "Cần upload quyết định trước khi hoàn thành"
//       );
//     }

//     // Cập nhật trạng thái hoàn thành
//     await pool.query(
//       `UPDATE phieu_nhap
//        SET trang_thai = 'completed', ngay_hoan_thanh = CURRENT_TIMESTAMP
//        WHERE id = $1`,
//       [id]
//     );

//     sendResponse(res, 200, true, "Hoàn thành phiếu nhập thành công");
//   } catch (error) {
//     console.error("Complete phieu nhap error:", error);
//     sendResponse(res, 500, false, "Lỗi server");
//   }
// };

// const create = async (req, res, body, user) => {
//   const client = await pool.connect();

//   try {
//     await client.query("BEGIN");

//     const {
//       ngay_nhap,
//       nha_cung_cap_id,
//       don_vi_van_chuyen_id,
//       ly_do_nhap,
//       loai_phieu = "tu_mua",
//       so_hoa_don,
//       nguoi_nhap_hang,
//       so_quyet_dinh,
//       dia_chi_nhap,
//       phuong_thuc_van_chuyen = "Đơn vị tự vận chuyển", // Thêm trường mới
//       phong_ban_id,
//       ghi_chu,
//       chi_tiet = [],
//     } = body;

//     // Validation
//     if (!ngay_nhap || !chi_tiet.length) {
//       return sendResponse(res, 400, false, "Thiếu thông tin bắt buộc");
//     }

//     // Tạo số phiếu tự động
//     const dateStr = new Date(ngay_nhap)
//       .toISOString()
//       .slice(0, 10)
//       .replace(/-/g, "");
//     const countResult = await client.query(
//       "SELECT COUNT(*) FROM phieu_nhap WHERE ngay_nhap = $1",
//       [ngay_nhap]
//     );
//     const soPhieu = `PN${dateStr}${String(
//       parseInt(countResult.rows[0].count) + 1
//     ).padStart(3, "0")}`;

//     // Tạo phiếu nhập với các trường mới
//     const phieuResult = await client.query(
//       `INSERT INTO phieu_nhap (
//         so_phieu, ngay_nhap, nha_cung_cap_id, don_vi_van_chuyen_id,
//         ly_do_nhap, loai_phieu, so_hoa_don, nguoi_nhap_hang, so_quyet_dinh,
//         dia_chi_nhap, phuong_thuc_van_chuyen, phong_ban_id, ghi_chu, nguoi_tao, tong_tien
//       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 0)
//       RETURNING *`,
//       [
//         soPhieu,
//         ngay_nhap,
//         nha_cung_cap_id,
//         don_vi_van_chuyen_id,
//         ly_do_nhap,
//         loai_phieu,
//         so_hoa_don,
//         nguoi_nhap_hang,
//         so_quyet_dinh,
//         dia_chi_nhap,
//         phuong_thuc_van_chuyen, // Thêm tham số mới
//         phong_ban_id || user.phong_ban_id,
//         ghi_chu,
//         user.id,
//       ]
//     );

//     const phieuNhap = phieuResult.rows[0];
//     let tongTien = 0;

//     // Tạo chi tiết nhập
//     for (const item of chi_tiet) {
//       const {
//         hang_hoa_id,
//         so_luong,
//         don_gia,
//         so_seri_list = [],
//         pham_chat = "tot",
//         han_su_dung,
//         vi_tri_kho,
//         ghi_chu: item_ghi_chu,
//       } = item;

//       if (!hang_hoa_id || !so_luong || don_gia === undefined) {
//         await client.query("ROLLBACK");
//         return sendResponse(res, 400, false, "Chi tiết nhập không hợp lệ");
//       }

//       const thanhTien = so_luong * don_gia;
//       tongTien += thanhTien;

//       await client.query(
//         `
//         INSERT INTO chi_tiet_nhap (
//           phieu_nhap_id, hang_hoa_id, so_luong, don_gia, thanh_tien,
//           so_seri_list, pham_chat, han_su_dung, vi_tri_kho, ghi_chu
//         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
//       `,
//         [
//           phieuNhap.id,
//           hang_hoa_id,
//           so_luong,
//           don_gia,
//           thanhTien,
//           so_seri_list.length > 0 ? so_seri_list : null,
//           pham_chat,
//           han_su_dung,
//           vi_tri_kho,
//           item_ghi_chu,
//         ]
//       );
//     }

//     // Cập nhật tổng tiền
//     await client.query("UPDATE phieu_nhap SET tong_tien = $1 WHERE id = $2", [
//       tongTien,
//       phieuNhap.id,
//     ]);

//     await client.query("COMMIT");

//     sendResponse(res, 201, true, "Tạo phiếu nhập thành công", {
//       id: phieuNhap.id,
//       so_phieu: phieuNhap.so_phieu,
//       tong_tien: tongTien,
//     });
//   } catch (error) {
//     await client.query("ROLLBACK");
//     console.error("Create phieu nhap error:", error);
//     sendResponse(res, 500, false, "Lỗi server");
//   } finally {
//     client.release();
//   }
// };

// // Cập nhật getDetail để bao gồm các trường mới
// const getDetail = async (req, res, params, user) => {
//   try {
//     const { id } = params;

//     // Câu query không đổi, vẫn lấy đủ thông tin
//     const detailQuery = `
//   SELECT
//     pn.*,
//     ncc.id as ncc_id, ncc.ma_ncc, ncc.ten_ncc, ncc.dia_chi as ncc_dia_chi,
//     u1.id as nguoi_tao_id, u1.ho_ten as nguoi_tao_ten,
//     u2.id as nguoi_duyet_id, u2.ho_ten as nguoi_duyet_ten,
//     pb.ten_phong_ban
//   FROM phieu_nhap pn
//   LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
//   LEFT JOIN users u1 ON pn.nguoi_tao = u1.id
//   LEFT JOIN users u2 ON pn.nguoi_duyet = u2.id
//   LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
//   WHERE pn.id = $1
// `;

//     const chiTietQuery = `
//       SELECT
//         ctn.*,
//         h.id as hang_hoa_id_ref, h.ma_hang_hoa, h.ten_hang_hoa, h.don_vi_tinh, h.co_so_seri
//       FROM chi_tiet_nhap ctn
//       JOIN hang_hoa h ON ctn.hang_hoa_id = h.id
//       WHERE ctn.phieu_nhap_id = $1
//       ORDER BY ctn.id
//     `;

//     const [phieuResult, chiTietResult] = await Promise.all([
//       pool.query(detailQuery, [id]),
//       pool.query(chiTietQuery, [id]),
//     ]);

//     if (phieuResult.rows.length === 0) {
//       return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
//     }

//     const phieuData = phieuResult.rows[0];

//     // Kiểm tra quyền xem
//     if (user.role !== "admin" && phieuData.phong_ban_id !== user.phong_ban_id) {
//       return sendResponse(
//         res,
//         403,
//         false,
//         "Bạn không có quyền xem phiếu nhập này"
//       );
//     }

//     // *** BẮT ĐẦU CẤU TRÚC LẠI DỮ LIỆU ***
//     const phieuNhap = {
//       ...phieuData,
//       nha_cung_cap: phieuData.ncc_id
//         ? {
//             // Tạo object lồng nhau cho NCC
//             id: phieuData.ncc_id,
//             ma_ncc: phieuData.ma_ncc,
//             ten_ncc: phieuData.ten_ncc,
//             dia_chi: phieuData.ncc_dia_chi,
//           }
//         : null,
//       user_tao: phieuData.nguoi_tao_id
//         ? {
//             // Tạo object lồng nhau cho người tạo
//             id: phieuData.nguoi_tao_id,
//             ho_ten: phieuData.nguoi_tao_ten,
//           }
//         : null,
//       user_duyet: phieuData.nguoi_duyet_id
//         ? {
//             id: phieuData.nguoi_duyet_id,
//             ho_ten: phieuData.nguoi_duyet_ten,
//           }
//         : null,
//       chi_tiet: chiTietResult.rows.map((item) => ({
//         // Map qua chi tiết để tạo object lồng nhau cho hàng hóa
//         ...item,
//         hang_hoa: {
//           id: item.hang_hoa_id_ref,
//           ma_hang_hoa: item.ma_hang_hoa,
//           ten_hang_hoa: item.ten_hang_hoa,
//           don_vi_tinh: item.don_vi_tinh,
//           co_so_seri: item.co_so_seri,
//         },
//       })),
//     };
//     // *** KẾT THÚC CẤU TRÚC LẠI DỮ LIỆU ***

//     sendResponse(res, 200, true, "Lấy chi tiết thành công", phieuNhap);
//   } catch (error) {
//     console.error("Get phieu nhap detail error:", error);
//     sendResponse(res, 500, false, "Lỗi server");
//   }
// };

// const downloadDecision = async (req, res, params, user) => {
//   try {
//     const { id } = params;

//     // Lấy thông tin file từ database
//     const phieu = await pool.query(
//       "SELECT decision_pdf_url, decision_pdf_filename FROM phieu_nhap WHERE id = $1",
//       [id]
//     );

//     if (phieu.rows.length === 0) {
//       return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
//     }

//     const { decision_pdf_url, decision_pdf_filename } = phieu.rows[0];

//     if (!decision_pdf_url) {
//       return sendResponse(res, 404, false, "Phiếu chưa có file quyết định");
//     }

//     // Trả về thông tin file để frontend có thể download
//     sendResponse(res, 200, true, "Thông tin file", {
//       url: decision_pdf_url,
//       filename: decision_pdf_filename,
//     });
//   } catch (error) {
//     console.error("Download decision error:", error);
//     sendResponse(res, 500, false, "Lỗi server");
//   }
// };

// const cancel = async (req, res, params, user) => {
//   try {
//     const { id } = params;

//     const phieu = await pool.query("SELECT * FROM phieu_nhap WHERE id = $1", [
//       id,
//     ]);

//     if (phieu.rows.length === 0) {
//       return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
//     }

//     if (phieu.rows[0].trang_thai === "completed") {
//       return sendResponse(res, 400, false, "Không thể hủy phiếu đã hoàn thành");
//     }

//     // Chỉ cập nhật trạng thái thành cancelled, KHÔNG tác động đến tồn kho
//     await pool.query(
//       `UPDATE phieu_nhap
//        SET trang_thai = 'cancelled', updated_at = CURRENT_TIMESTAMP
//        WHERE id = $1`,
//       [id]
//     );

//     sendResponse(res, 200, true, "Hủy phiếu nhập thành công");
//   } catch (error) {
//     console.error("Cancel phieu nhap error:", error);
//     sendResponse(res, 500, false, "Lỗi server");
//   }
// };

// module.exports = {
//   getList,
//   getDetail,
//   create,
//   update,
//   delete: deletePhieu,
//   approve,
//   uploadDecision,
//   complete,
//   downloadDecision,
//   cancel,
// };

const pool = require("../config/database");
const { sendResponse } = require("../utils/response");

// const getList = async (req, res, query, user) => {
//   try {
//     const {
//       page = 1,
//       limit = 20,
//       tu_ngay,
//       den_ngay,
//       trang_thai,
//       loai_phieu,
//     } = query;

//     const offset = (page - 1) * limit;
//     let whereClause = "WHERE 1=1";
//     const params = [];
//     let paramCount = 0;

//     if (tu_ngay && den_ngay) {
//       paramCount += 2;
//       whereClause += ` AND pn.ngay_nhap BETWEEN $${
//         paramCount - 1
//       } AND $${paramCount}`;
//       params.push(tu_ngay, den_ngay);
//     }

//     if (trang_thai) {
//       paramCount++;
//       whereClause += ` AND pn.trang_thai = $${paramCount}`;
//       params.push(trang_thai);
//     }

//     if (loai_phieu) {
//       paramCount++;
//       whereClause += ` AND pn.loai_phieu = $${paramCount}`;
//       params.push(loai_phieu);
//     }

//     if (user.role !== "admin") {
//       paramCount++;
//       whereClause += ` AND pn.phong_ban_id = $${paramCount}`;
//       params.push(user.phong_ban_id);
//     }

//     const countQuery = `SELECT COUNT(*) FROM phieu_nhap pn ${whereClause}`;

//     const dataQuery = `
//       SELECT pn.*,
//              ncc.id as ncc_id, ncc.ma_ncc, ncc.ten_ncc,
//              u.id as nguoi_tao_id, u.ho_ten as nguoi_tao_ten,
//              pb.ten_phong_ban,
//              pn.decision_pdf_url,
//              pn.decision_pdf_filename,
//              pn.ghi_chu_hoan_thanh
//       FROM phieu_nhap pn
//       LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
//       LEFT JOIN users u ON pn.nguoi_tao = u.id
//       LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
//       ${whereClause}
//       ORDER BY pn.created_at DESC
//       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
//     `;

//     params.push(limit, offset);

//     const [countResult, dataResult] = await Promise.all([
//       pool.query(countQuery, params.slice(0, -2)),
//       pool.query(dataQuery, params),
//     ]);

//     const total = parseInt(countResult.rows[0].count);
//     const pages = Math.ceil(total / limit);
//     const structuredItems = dataResult.rows.map((item) => ({
//       ...item,
//       nha_cung_cap: item.ncc_id
//         ? {
//             id: item.ncc_id,
//             ma_ncc: item.ma_ncc,
//             ten_ncc: item.ten_ncc,
//           }
//         : null,
//       user_tao: item.nguoi_tao_id
//         ? {
//             id: item.nguoi_tao_id,
//             ho_ten: item.nguoi_tao_ten,
//           }
//         : null,
//     }));

//     sendResponse(res, 200, true, "Lấy danh sách thành công", {
//       items: structuredItems,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total,
//         pages,
//       },
//     });
//   } catch (error) {
//     console.error("Get phieu nhap error:", error);
//     sendResponse(res, 500, false, "Lỗi server");
//   }
// };

const getList = async (req, res, query, user) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      tu_ngay,
      den_ngay,
      trang_thai,
      loai_phieu,
      sort_by = "created_at",
      sort_direction = "desc",
    } = query;

    const offset = (page - 1) * limit;
    let whereClause = "WHERE 1=1";
    const params = [];
    let paramCount = 0;

    // Tìm kiếm theo số quyết định và tên nhà cung cấp
    if (search && search.trim()) {
      paramCount++;
      whereClause += ` AND (
        pn.so_quyet_dinh ILIKE $${paramCount} OR 
        ncc.ten_ncc ILIKE $${paramCount}
      )`;
      params.push(`%${search.trim()}%`);
    }

    if (tu_ngay && den_ngay) {
      paramCount += 2;
      whereClause += ` AND pn.ngay_nhap BETWEEN $${
        paramCount - 1
      } AND $${paramCount}`;
      params.push(tu_ngay, den_ngay);
    }

    if (trang_thai) {
      paramCount++;
      whereClause += ` AND pn.trang_thai = $${paramCount}`;
      params.push(trang_thai);
    }

    if (loai_phieu) {
      paramCount++;
      whereClause += ` AND pn.loai_phieu = $${paramCount}`;
      params.push(loai_phieu);
    }

    if (user.role !== "admin") {
      paramCount++;
      whereClause += ` AND pn.phong_ban_id = $${paramCount}`;
      params.push(user.phong_ban_id);
    }

    // Xử lý sắp xếp
    const validSortFields = {
      so_quyet_dinh: "pn.so_quyet_dinh",
      ngay_nhap: "pn.ngay_nhap",
      tong_tien: "pn.tong_tien",
      created_at: "pn.created_at",
    };

    const sortField = validSortFields[sort_by] || "pn.created_at";
    const sortDir = sort_direction.toLowerCase() === "asc" ? "ASC" : "DESC";
    const orderClause = `ORDER BY ${sortField} ${sortDir}`;

    const countQuery = `
      SELECT COUNT(*) 
      FROM phieu_nhap pn 
      LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id 
      ${whereClause}
    `;

    const dataQuery = `
      SELECT pn.*, 
             ncc.id as ncc_id, ncc.ma_ncc, ncc.ten_ncc,
             u.id as nguoi_tao_id, u.ho_ten as nguoi_tao_ten,
             pb.ten_phong_ban,
             pn.decision_pdf_url,
             pn.decision_pdf_filename,
             pn.ghi_chu_hoan_thanh
      FROM phieu_nhap pn
      LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
      LEFT JOIN users u ON pn.nguoi_tao = u.id
      LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
      ${whereClause}
      ${orderClause}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(limit, offset);

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, params.slice(0, -2)),
      pool.query(dataQuery, params),
    ]);

    const total = parseInt(countResult.rows[0].count);
    const pages = Math.ceil(total / limit);
    const structuredItems = dataResult.rows.map((item) => ({
      ...item,
      nha_cung_cap: item.ncc_id
        ? {
            id: item.ncc_id,
            ma_ncc: item.ma_ncc,
            ten_ncc: item.ten_ncc,
          }
        : null,
      user_tao: item.nguoi_tao_id
        ? {
            id: item.nguoi_tao_id,
            ho_ten: item.nguoi_tao_ten,
          }
        : null,
    }));

    sendResponse(res, 200, true, "Lấy danh sách thành công", {
      items: structuredItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages,
      },
    });
  } catch (error) {
    console.error("Get phieu nhap error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};
const update = async (req, res, params, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;
    const {
      ngay_nhap,
      loai_phieu,
      nguoi_nhap_hang,
      so_quyet_dinh,
      so_hoa_don,
      dia_chi_nhap,
      phuong_thuc_van_chuyen,
      ly_do_nhap,
      ghi_chu,
      nha_cung_cap_id,
      chi_tiet = [],
    } = body;

    // Kiểm tra phiếu tồn tại và quyền chỉnh sửa
    const phieuResult = await client.query(
      "SELECT * FROM phieu_nhap WHERE id = $1",
      [id]
    );

    if (phieuResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
    }

    const phieu = phieuResult.rows[0];

    if (user.role !== "admin" && phieu.phong_ban_id !== user.phong_ban_id) {
      await client.query("ROLLBACK");
      return sendResponse(res, 403, false, "Bạn không có quyền sửa phiếu này");
    }

    // Kiểm tra trạng thái phiếu có thể chỉnh sửa
    if (phieu.trang_thai === "completed" || phieu.trang_thai === "cancelled") {
      await client.query("ROLLBACK");
      const trangThaiHienTai =
        phieu.trang_thai === "completed" ? "hoàn thành" : "bị hủy";
      return sendResponse(
        res,
        400,
        false,
        `Không thể sửa phiếu đã ${trangThaiHienTai}.`
      );
    }

    // Validate chi tiết nhập
    if (!chi_tiet || chi_tiet.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Cần có ít nhất một chi tiết hàng hóa"
      );
    }

    for (let i = 0; i < chi_tiet.length; i++) {
      const item = chi_tiet[i];
      if (!item.hang_hoa_id || !item.so_luong || item.don_gia === undefined) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          `Chi tiết dòng ${i + 1} không hợp lệ`
        );
      }
    }

    // Lưu thông tin chi tiết cũ để có thể khôi phục nếu cần
    const oldChiTietResult = await client.query(
      "SELECT * FROM chi_tiet_nhap WHERE phieu_nhap_id = $1 ORDER BY id",
      [id]
    );
    const oldChiTiet = oldChiTietResult.rows;

    try {
      // Bước 1: Cập nhật thông tin phiếu nhập
      await client.query(
        `UPDATE phieu_nhap 
         SET ngay_nhap = $1, nha_cung_cap_id = $2, ly_do_nhap = $3,
             so_hoa_don = $4, ghi_chu = $5, loai_phieu = $6,
             nguoi_nhap_hang = $7, so_quyet_dinh = $8, dia_chi_nhap = $9,
             phuong_thuc_van_chuyen = $10, updated_at = CURRENT_TIMESTAMP
         WHERE id = $11`,
        [
          ngay_nhap,
          nha_cung_cap_id,
          ly_do_nhap,
          so_hoa_don,
          ghi_chu,
          loai_phieu,
          nguoi_nhap_hang,
          so_quyet_dinh,
          dia_chi_nhap,
          phuong_thuc_van_chuyen,
          id,
        ]
      );

      // Bước 2: Xóa chi tiết cũ (triggers sẽ tự động hoàn tác tồn kho)
      await client.query("DELETE FROM chi_tiet_nhap WHERE phieu_nhap_id = $1", [
        id,
      ]);

      // Bước 3: Thêm chi tiết mới
      let tongTien = 0;
      for (const item of chi_tiet) {
        const thanhTien = parseFloat(item.so_luong) * parseFloat(item.don_gia);
        tongTien += thanhTien;

        await client.query(
          `INSERT INTO chi_tiet_nhap (
            phieu_nhap_id, hang_hoa_id, so_luong, don_gia, thanh_tien,
            so_seri_list, pham_chat, han_su_dung, vi_tri_kho, ghi_chu
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            id,
            item.hang_hoa_id,
            item.so_luong,
            item.don_gia,
            thanhTien,
            item.so_seri_list || null,
            item.pham_chat || "tot",
            item.han_su_dung,
            item.vi_tri_kho,
            item.ghi_chu,
          ]
        );
      }

      // Bước 4: Cập nhật tổng tiền
      await client.query("UPDATE phieu_nhap SET tong_tien = $1 WHERE id = $2", [
        tongTien,
        id,
      ]);

      // Bước 5: Cập nhật lại giá nhập gần nhất cho các hàng hóa
      const uniqueHangHoaIds = [
        ...new Set(chi_tiet.map((item) => item.hang_hoa_id)),
      ];
      for (const hangHoaId of uniqueHangHoaIds) {
        await client.query(
          `UPDATE hang_hoa 
           SET gia_nhap_gan_nhat = (
             SELECT ls.don_gia 
             FROM lich_su_gia ls
             JOIN phieu_nhap pn ON ls.phieu_nhap_id = pn.id
             WHERE ls.hang_hoa_id = $1 
             AND ls.nguon_gia = 'nhap_kho'
             AND pn.trang_thai = 'completed'
             ORDER BY ls.ngay_ap_dung DESC, ls.created_at DESC 
             LIMIT 1
           )
           WHERE id = $1`,
          [hangHoaId]
        );
      }

      await client.query("COMMIT");
      sendResponse(res, 200, true, "Cập nhật phiếu nhập thành công");
    } catch (error) {
      // Nếu có lỗi, rollback sẽ tự động khôi phục dữ liệu
      throw error;
    }
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update phieu nhap error:", error);

    let errorMessage = "Lỗi khi cập nhật phiếu nhập";
    if (error.message.includes("không thể chỉnh sửa")) {
      errorMessage = error.message;
    }

    sendResponse(res, 500, false, errorMessage);
  } finally {
    client.release();
  }
};

const deletePhieu = async (req, res, params, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;

    const phieuResult = await client.query(
      "SELECT * FROM phieu_nhap WHERE id = $1",
      [id]
    );

    if (phieuResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
    }

    const phieu = phieuResult.rows[0];

    if (user.role !== "admin" && phieu.phong_ban_id !== user.phong_ban_id) {
      await client.query("ROLLBACK");
      return sendResponse(res, 403, false, "Bạn không có quyền xóa phiếu này");
    }

    if (phieu.trang_thai !== "draft") {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Chỉ có thể xóa phiếu ở trạng thái nháp"
      );
    }

    // Xóa phiếu (chi tiết sẽ tự động xóa theo CASCADE và triggers sẽ xử lý)
    await client.query("DELETE FROM phieu_nhap WHERE id = $1", [id]);

    await client.query("COMMIT");
    sendResponse(res, 200, true, "Xóa phiếu nhập thành công");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Delete phieu nhap error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

const approve = async (req, res, params, user) => {
  try {
    const { id } = params;

    const phieu = await pool.query("SELECT * FROM phieu_nhap WHERE id = $1", [
      id,
    ]);

    if (phieu.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
    }

    if (phieu.rows[0].trang_thai !== "draft") {
      return sendResponse(res, 400, false, "Phiếu đã được xử lý");
    }

    await pool.query(
      `UPDATE phieu_nhap 
       SET trang_thai = 'approved', nguoi_duyet = $1, ngay_duyet = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [user.id, id]
    );

    sendResponse(res, 200, true, "Duyệt phiếu nhập thành công");
  } catch (error) {
    console.error("Approve phieu nhap error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const uploadDecision = async (req, res, params, body, user, file) => {
  try {
    const { id } = params;
    const { ghi_chu_hoan_thanh } = body;

    if (!file) {
      return sendResponse(res, 400, false, "Cần chọn file PDF quyết định");
    }

    const phieu = await pool.query("SELECT * FROM phieu_nhap WHERE id = $1", [
      id,
    ]);

    if (phieu.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
    }

    if (phieu.rows[0].trang_thai !== "approved") {
      return sendResponse(
        res,
        400,
        false,
        "Phiếu chưa được duyệt hoặc đã hoàn thành"
      );
    }

    const decision_pdf_url = `/uploads/decisions/${file.filename}`;
    const decision_pdf_filename = file.originalname;

    await pool.query(
      `UPDATE phieu_nhap 
       SET decision_pdf_url = $1, decision_pdf_filename = $2, 
           ghi_chu_hoan_thanh = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [decision_pdf_url, decision_pdf_filename, ghi_chu_hoan_thanh || "", id]
    );

    sendResponse(res, 200, true, "Upload quyết định thành công", {
      filename: decision_pdf_filename,
      url: decision_pdf_url,
    });
  } catch (error) {
    console.error("Upload decision error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const complete = async (req, res, params, user) => {
  try {
    const { id } = params;

    const phieu = await pool.query("SELECT * FROM phieu_nhap WHERE id = $1", [
      id,
    ]);

    if (phieu.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
    }

    if (phieu.rows[0].trang_thai !== "approved") {
      return sendResponse(res, 400, false, "Phiếu chưa được duyệt");
    }

    if (!phieu.rows[0].decision_pdf_url) {
      return sendResponse(
        res,
        400,
        false,
        "Cần upload quyết định trước khi hoàn thành"
      );
    }

    await pool.query(
      `UPDATE phieu_nhap 
       SET trang_thai = 'completed', ngay_hoan_thanh = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    sendResponse(res, 200, true, "Hoàn thành phiếu nhập thành công");
  } catch (error) {
    console.error("Complete phieu nhap error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const create = async (req, res, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      ngay_nhap,
      nha_cung_cap_id,
      don_vi_van_chuyen_id,
      ly_do_nhap,
      loai_phieu = "tu_mua",
      so_hoa_don,
      nguoi_nhap_hang,
      so_quyet_dinh,
      dia_chi_nhap,
      phuong_thuc_van_chuyen = "Đơn vị tự vận chuyển",
      phong_ban_id,
      ghi_chu,
      chi_tiet = [],
    } = body;

    if (!ngay_nhap || !chi_tiet.length) {
      await client.query("ROLLBACK");
      return sendResponse(res, 400, false, "Thiếu thông tin bắt buộc");
    }

    // Tạo số phiếu tự động
    // Tạo số phiếu tự động sử dụng MAX + 1
    const dateStr = new Date(ngay_nhap)
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");

    // Sử dụng MAX để tìm số phiếu cao nhất trong ngày và cộng thêm 1
    const maxResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(so_phieu FROM 11) AS INTEGER)), 0) as max_seq 
   FROM phieu_nhap 
   WHERE so_phieu LIKE $1`,
      [`PN${dateStr}%`]
    );

    const nextSeq = maxResult.rows[0].max_seq + 1;
    const soPhieu = `PN${dateStr}${String(nextSeq).padStart(3, "0")}`;

    // Kiểm tra trùng lặp và retry nếu cần
    let attempts = 0;
    let finalSoPhieu = soPhieu;
    while (attempts < 5) {
      const existsResult = await client.query(
        "SELECT 1 FROM phieu_nhap WHERE so_phieu = $1",
        [finalSoPhieu]
      );

      if (existsResult.rows.length === 0) {
        break; // Số phiếu chưa tồn tại, có thể sử dụng
      }

      // Nếu trùng, tăng số thứ tự và thử lại
      attempts++;
      const retrySeq = nextSeq + attempts;
      finalSoPhieu = `PN${dateStr}${String(retrySeq).padStart(3, "0")}`;
    }

    if (attempts >= 5) {
      throw new Error("Không thể tạo số phiếu duy nhất sau nhiều lần thử");
    }

    // Tạo phiếu nhập
    const phieuResult = await client.query(
      `INSERT INTO phieu_nhap (
        so_phieu, ngay_nhap, nha_cung_cap_id, don_vi_van_chuyen_id,
        ly_do_nhap, loai_phieu, so_hoa_don, nguoi_nhap_hang, so_quyet_dinh,
        dia_chi_nhap, phuong_thuc_van_chuyen, phong_ban_id, ghi_chu, nguoi_tao, tong_tien
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 0)
      RETURNING *`,
      [
        finalSoPhieu,
        ngay_nhap,
        nha_cung_cap_id,
        don_vi_van_chuyen_id,
        ly_do_nhap,
        loai_phieu,
        so_hoa_don,
        nguoi_nhap_hang,
        so_quyet_dinh,
        dia_chi_nhap,
        phuong_thuc_van_chuyen,
        phong_ban_id || user.phong_ban_id,
        ghi_chu,
        user.id,
      ]
    );

    const phieuNhap = phieuResult.rows[0];
    let tongTien = 0;

    // Tạo chi tiết nhập
    for (const item of chi_tiet) {
      const {
        hang_hoa_id,
        so_luong,
        don_gia,
        so_seri_list = [],
        pham_chat = "tot",
        han_su_dung,
        vi_tri_kho,
        ghi_chu: item_ghi_chu,
      } = item;

      if (!hang_hoa_id || !so_luong || don_gia === undefined) {
        await client.query("ROLLBACK");
        return sendResponse(res, 400, false, "Chi tiết nhập không hợp lệ");
      }

      const thanhTien = so_luong * don_gia;
      tongTien += thanhTien;

      await client.query(
        `INSERT INTO chi_tiet_nhap (
          phieu_nhap_id, hang_hoa_id, so_luong, don_gia, thanh_tien,
          so_seri_list, pham_chat, han_su_dung, vi_tri_kho, ghi_chu
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          phieuNhap.id,
          hang_hoa_id,
          so_luong,
          don_gia,
          thanhTien,
          so_seri_list.length > 0 ? so_seri_list : null,
          pham_chat,
          han_su_dung,
          vi_tri_kho,
          item_ghi_chu,
        ]
      );
    }

    // Cập nhật tổng tiền
    await client.query("UPDATE phieu_nhap SET tong_tien = $1 WHERE id = $2", [
      tongTien,
      phieuNhap.id,
    ]);

    await client.query("COMMIT");

    sendResponse(res, 201, true, "Tạo phiếu nhập thành công", {
      id: phieuNhap.id,
      so_phieu: phieuNhap.so_phieu,
      tong_tien: tongTien,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create phieu nhap error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

// const getDetail = async (req, res, params, user) => {
//   try {
//     const { id } = params;

//     const detailQuery = `
//       SELECT
//         pn.*,
//         ncc.id as ncc_id, ncc.ma_ncc, ncc.ten_ncc, ncc.dia_chi as ncc_dia_chi,
//         u1.id as nguoi_tao_id, u1.ho_ten as nguoi_tao_ten,
//         u2.id as nguoi_duyet_id, u2.ho_ten as nguoi_duyet_ten,
//         pb.ten_phong_ban
//       FROM phieu_nhap pn
//       LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
//       LEFT JOIN users u1 ON pn.nguoi_tao = u1.id
//       LEFT JOIN users u2 ON pn.nguoi_duyet = u2.id
//       LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
//       WHERE pn.id = $1
//     `;

//     const chiTietQuery = `
//       SELECT
//         ctn.*,
//         h.id as hang_hoa_id_ref, h.ma_hang_hoa, h.ten_hang_hoa, h.don_vi_tinh, h.co_so_seri
//       FROM chi_tiet_nhap ctn
//       JOIN hang_hoa h ON ctn.hang_hoa_id = h.id
//       WHERE ctn.phieu_nhap_id = $1
//       ORDER BY ctn.id
//     `;

//     const [phieuResult, chiTietResult] = await Promise.all([
//       pool.query(detailQuery, [id]),
//       pool.query(chiTietQuery, [id]),
//     ]);

//     if (phieuResult.rows.length === 0) {
//       return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
//     }

//     const phieuData = phieuResult.rows[0];

//     if (user.role !== "admin" && phieuData.phong_ban_id !== user.phong_ban_id) {
//       return sendResponse(
//         res,
//         403,
//         false,
//         "Bạn không có quyền xem phiếu nhập này"
//       );
//     }

//     const phieuNhap = {
//       ...phieuData,
//       nha_cung_cap: phieuData.ncc_id
//         ? {
//             id: phieuData.ncc_id,
//             ma_ncc: phieuData.ma_ncc,
//             ten_ncc: phieuData.ten_ncc,
//             dia_chi: phieuData.ncc_dia_chi,
//           }
//         : null,
//       user_tao: phieuData.nguoi_tao_id
//         ? {
//             id: phieuData.nguoi_tao_id,
//             ho_ten: phieuData.nguoi_tao_ten,
//           }
//         : null,
//       user_duyet: phieuData.nguoi_duyet_id
//         ? {
//             id: phieuData.nguoi_duyet_id,
//             ho_ten: phieuData.nguoi_duyet_ten,
//           }
//         : null,
//       chi_tiet: chiTietResult.rows.map((item) => ({
//         ...item,
//         hang_hoa: {
//           id: item.hang_hoa_id_ref,
//           ma_hang_hoa: item.ma_hang_hoa,
//           ten_hang_hoa: item.ten_hang_hoa,
//           don_vi_tinh: item.don_vi_tinh,
//           co_so_seri: item.co_so_seri,
//         },
//       })),
//     };

//     sendResponse(res, 200, true, "Lấy chi tiết thành công", phieuNhap);
//   } catch (error) {
//     console.error("Get phieu nhap detail error:", error);
//     sendResponse(res, 500, false, "Lỗi server");
//   }
// };
// Sửa hàm getDetail trong nhapKhoController.js
// Sửa hàm getDetail trong nhapKhoController.js
// Sửa hàm getDetail trong nhapKhoController.js - LẤY so_seri
// Sửa hàm getDetail trong nhapKhoController.js - FIX GROUP BY
const getDetail = async (req, res, params, user) => {
  try {
    const { id } = params;

    const detailQuery = `
      SELECT 
        pn.*, 
        ncc.id as ncc_id, ncc.ma_ncc, ncc.ten_ncc, ncc.dia_chi as ncc_dia_chi,
        u1.id as nguoi_tao_id, u1.ho_ten as nguoi_tao_ten,
        u2.id as nguoi_duyet_id, u2.ho_ten as nguoi_duyet_ten,
        pb.ten_phong_ban
      FROM phieu_nhap pn
      LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
      LEFT JOIN users u1 ON pn.nguoi_tao = u1.id
      LEFT JOIN users u2 ON pn.nguoi_duyet = u2.id
      LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
      WHERE pn.id = $1
    `;

    // FIXED: Sử dụng subquery riêng để tránh GROUP BY
    const chiTietQuery = `
      SELECT 
        ctn.*, 
        h.id as hang_hoa_id_ref, 
        h.ma_hang_hoa, 
        h.ten_hang_hoa, 
        h.don_vi_tinh, 
        h.co_so_seri,
        seri_data.danh_diem
      FROM chi_tiet_nhap ctn
      JOIN hang_hoa h ON ctn.hang_hoa_id = h.id
      LEFT JOIN (
        SELECT 
          hhs.hang_hoa_id,
          hhs.phieu_nhap_id,
          string_agg(hhs.so_seri, ', ' ORDER BY hhs.so_seri) as danh_diem
        FROM hang_hoa_seri hhs
        GROUP BY hhs.hang_hoa_id, hhs.phieu_nhap_id
      ) seri_data ON seri_data.hang_hoa_id = h.id AND seri_data.phieu_nhap_id = ctn.phieu_nhap_id
      WHERE ctn.phieu_nhap_id = $1
      ORDER BY ctn.id
    `;

    const [phieuResult, chiTietResult] = await Promise.all([
      pool.query(detailQuery, [id]),
      pool.query(chiTietQuery, [id]),
    ]);

    if (phieuResult.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
    }

    const phieuData = phieuResult.rows[0];

    if (user.role !== "admin" && phieuData.phong_ban_id !== user.phong_ban_id) {
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền xem phiếu nhập này"
      );
    }

    const phieuNhap = {
      ...phieuData,
      nha_cung_cap: phieuData.ncc_id
        ? {
            id: phieuData.ncc_id,
            ma_ncc: phieuData.ma_ncc,
            ten_ncc: phieuData.ten_ncc,
            dia_chi: phieuData.ncc_dia_chi,
          }
        : null,
      user_tao: phieuData.nguoi_tao_id
        ? {
            id: phieuData.nguoi_tao_id,
            ho_ten: phieuData.nguoi_tao_ten,
          }
        : null,
      user_duyet: phieuData.nguoi_duyet_id
        ? {
            id: phieuData.nguoi_duyet_id,
            ho_ten: phieuData.nguoi_duyet_ten,
          }
        : null,
      chi_tiet: chiTietResult.rows.map((item) => ({
        ...item,
        // danh_diem chứa danh sách so_seri đã được group
        hang_hoa: {
          id: item.hang_hoa_id_ref,
          ma_hang_hoa: item.ma_hang_hoa,
          ten_hang_hoa: item.ten_hang_hoa,
          don_vi_tinh: item.don_vi_tinh,
          co_so_seri: item.co_so_seri,
        },
      })),
    };

    sendResponse(res, 200, true, "Lấy chi tiết thành công", phieuNhap);
  } catch (error) {
    console.error("Get phieu nhap detail error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};
const downloadDecision = async (req, res, params, user) => {
  try {
    const { id } = params;

    const phieu = await pool.query(
      "SELECT decision_pdf_url, decision_pdf_filename FROM phieu_nhap WHERE id = $1",
      [id]
    );

    if (phieu.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
    }

    const { decision_pdf_url, decision_pdf_filename } = phieu.rows[0];

    if (!decision_pdf_url) {
      return sendResponse(res, 404, false, "Phiếu chưa có file quyết định");
    }

    sendResponse(res, 200, true, "Thông tin file", {
      url: decision_pdf_url,
      filename: decision_pdf_filename,
    });
  } catch (error) {
    console.error("Download decision error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const cancel = async (req, res, params, user) => {
  try {
    const { id } = params;

    const phieu = await pool.query("SELECT * FROM phieu_nhap WHERE id = $1", [
      id,
    ]);

    if (phieu.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
    }

    if (phieu.rows[0].trang_thai === "completed") {
      return sendResponse(res, 400, false, "Không thể hủy phiếu đã hoàn thành");
    }

    await pool.query(
      `UPDATE phieu_nhap 
       SET trang_thai = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    sendResponse(res, 200, true, "Hủy phiếu nhập thành công");
  } catch (error) {
    console.error("Cancel phieu nhap error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

module.exports = {
  getList,
  getDetail,
  create,
  update,
  delete: deletePhieu,
  approve,
  uploadDecision,
  complete,
  downloadDecision,
  cancel,
};
