const pool = require("../config/database");
const { sendResponse } = require("../utils/response");
const notificationService = require("../services/notificationService");

const submit = async (req, res, params, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;

    // Kiểm tra phiếu tồn tại và quyền
    const phieuResult = await client.query(
      "SELECT * FROM phieu_xuat WHERE id = $1",
      [id]
    );

    if (phieuResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
    }

    const phieu = phieuResult.rows[0];

    if (user.role !== "admin" && phieu.nguoi_tao !== user.id) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền thực hiện hành động này"
      );
    }

    if (!["draft", "revision_required"].includes(phieu.trang_thai)) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Chỉ có thể gửi phiếu ở trạng thái nháp hoặc yêu cầu sửa"
      );
    }

    // Kiểm tra có chi tiết hay không
    const chiTietCount = await client.query(
      "SELECT COUNT(*) FROM chi_tiet_xuat WHERE phieu_xuat_id = $1",
      [id]
    );

    if (parseInt(chiTietCount.rows[0].count) === 0) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Phiếu phải có ít nhất một mặt hàng"
      );
    }

    // Kiểm tra tồn kho một lần nữa trước khi gửi
    const chiTietList = await client.query(
      `SELECT ctx.*, h.ten_hang_hoa
       FROM chi_tiet_xuat ctx
       JOIN hang_hoa h ON ctx.hang_hoa_id = h.id
       WHERE ctx.phieu_xuat_id = $1`,
      [id]
    );

    for (const item of chiTietList.rows) {
      const tonKhoResult = await client.query(
        `SELECT so_luong_ton FROM ton_kho 
         WHERE hang_hoa_id = $1 AND phong_ban_id = $2`,
        [item.hang_hoa_id, phieu.phong_ban_id]
      );

      const tonKho = tonKhoResult.rows[0]?.so_luong_ton || 0;

      // ✅ Sửa tên field từ so_luong_ke_hoach thành so_luong_yeu_cau
      if (tonKho < item.so_luong_yeu_cau) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          `Không đủ tồn kho cho ${item.ten_hang_hoa}. Tồn: ${tonKho}, yêu cầu: ${item.so_luong_yeu_cau}`
        );
      }
    }

    // ✅ Sửa query - bỏ cột ngay_gui_duyet không tồn tại
    await client.query(
      `UPDATE phieu_xuat SET 
        trang_thai = 'confirmed',
        ghi_chu_phan_hoi = NULL,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1`,
      [id]
    );

    // Gửi thông báo cho admin sử dụng enum có sẵn
    const adminUsers = await client.query(
      "SELECT id FROM users WHERE role = 'admin' AND trang_thai = 'active'"
    );

    if (adminUsers.rows.length > 0) {
      const phieuData = {
        ...phieu,
        id: phieu.id,
        so_phieu: phieu.so_phieu,
      };

      // Tạo thông báo cho từng admin
      for (const admin of adminUsers.rows) {
        await notificationService.createNotifications(
          [admin.id],
          "Phiếu xuất kho cần duyệt",
          `Phiếu xuất ${phieu.so_phieu} đang chờ duyệt từ ${
            user.ho_ten || "User"
          }`,
          "phieu_xuat_can_duyet", // ✅ Sử dụng enum có sẵn
          {
            phieu_id: phieu.id,
            so_phieu: phieu.so_phieu,
            nguoi_tao: user.ho_ten || "User",
            url: `/xuat-kho/${phieu.id}`,
          }
        );
      }
    }

    await client.query("COMMIT");
    sendResponse(res, 200, true, "Gửi phiếu thành công");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Submit phieu error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

// Sửa function approve trong xuatKhoController.js

const approve = async (req, res, params, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;

    // Chỉ admin mới có quyền duyệt
    if (user.role !== "admin") {
      await client.query("ROLLBACK");
      return sendResponse(res, 403, false, "Bạn không có quyền duyệt phiếu");
    }

    const phieu = await client.query("SELECT * FROM phieu_xuat WHERE id = $1", [
      id,
    ]);

    if (phieu.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
    }

    if (phieu.rows[0].trang_thai !== "confirmed") {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Chỉ có thể duyệt phiếu đang chờ duyệt"
      );
    }

    // Cập nhật trạng thái thành approved - trigger sẽ tự động tạo phiếu nhập nếu cần
    await client.query(
      `UPDATE phieu_xuat 
       SET trang_thai = 'approved', nguoi_duyet = $1, ngay_duyet = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [user.id, id]
    );

    // ✅ Gửi thông báo cho người tạo phiếu
    const phieuData = {
      ...phieu.rows[0],
      id: phieu.rows[0].id,
      so_phieu: phieu.rows[0].so_phieu,
    };

    // Thông báo cho người tạo phiếu
    await notificationService.createNotifications(
      [phieuData.nguoi_tao],
      "Phiếu xuất kho đã được duyệt",
      `Phiếu xuất ${phieuData.so_phieu} đã được duyệt bởi ${
        user.ho_ten || "Admin"
      }`,
      "phieu_xuat_duyet", // ✅ Sử dụng enum có sẵn
      {
        phieu_id: phieuData.id,
        so_phieu: phieuData.so_phieu,
        nguoi_duyet: user.ho_ten || "Admin",
        url: `/xuat-kho/${phieuData.id}`,
      }
    );

    // ✅ Nếu là phiếu xuất cho phòng ban khác, gửi thông báo đến phòng ban nhận
    if (phieuData.phong_ban_nhan_id) {
      const adminCapDuoi = await client.query(
        "SELECT id FROM users WHERE phong_ban_id = $1 AND role IN ('admin', 'manager') AND trang_thai = 'active'",
        [phieuData.phong_ban_nhan_id]
      );

      if (adminCapDuoi.rows.length > 0) {
        for (const admin of adminCapDuoi.rows) {
          // ✅ Sử dụng enum có sẵn cho thông báo cấp dưới
          await notificationService.createNotifications(
            [admin.id],
            "Phiếu xuất từ cấp trên đã được duyệt",
            `Phiếu xuất ${phieuData.so_phieu} từ cấp trên đã được duyệt. Hệ thống đã tự động tạo phiếu nhập tương ứng.`,
            "phieu_nhap_duyet", // ✅ Dùng enum có sẵn (vì tạo phiếu nhập)
            {
              phieu_id: phieuData.id,
              so_phieu: phieuData.so_phieu,
              url: `/nhap-kho?tab=da-duyet&highlight_linked=${phieuData.id}`,
            }
          );
        }
      }
    }

    await client.query("COMMIT");

    let successMessage = "Duyệt phiếu xuất thành công";
    if (phieuData.phong_ban_nhan_id) {
      successMessage +=
        ". Hệ thống đã tự động tạo phiếu nhập tương ứng cho đơn vị nhận.";
    }

    sendResponse(res, 200, true, successMessage);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Approve phieu xuat error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

// Sửa function requestRevision trong xuatKhoController.js

const requestRevision = async (req, res, params, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;
    const { ghi_chu_phan_hoi } = body;

    if (!ghi_chu_phan_hoi) {
      await client.query("ROLLBACK");
      return sendResponse(res, 400, false, "Vui lòng nhập ghi chú phản hồi");
    }

    // Chỉ admin mới có quyền yêu cầu chỉnh sửa
    if (user.role !== "admin") {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền yêu cầu chỉnh sửa"
      );
    }

    const phieu = await client.query("SELECT * FROM phieu_xuat WHERE id = $1", [
      id,
    ]);

    if (phieu.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
    }

    if (phieu.rows[0].trang_thai !== "confirmed") {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Chỉ có thể yêu cầu chỉnh sửa phiếu đang chờ duyệt"
      );
    }

    // Cập nhật trạng thái thành revision_required
    await client.query(
      `UPDATE phieu_xuat 
       SET trang_thai = 'revision_required', 
           ghi_chu_phan_hoi = $1,
           nguoi_duyet = $2,
           ngay_duyet = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [ghi_chu_phan_hoi, user.id, id]
    );

    // ✅ Gửi thông báo cho người tạo phiếu với enum đúng
    const phieuData = {
      ...phieu.rows[0],
      id: phieu.rows[0].id,
      so_phieu: phieu.rows[0].so_phieu,
    };

    await notificationService.createNotifications(
      [phieuData.nguoi_tao],
      "Phiếu xuất kho cần chỉnh sửa",
      `Phiếu xuất ${phieuData.so_phieu} cần chỉnh sửa. Lý do: ${ghi_chu_phan_hoi}`,
      "phieu_xuat_can_sua", // ✅ Sử dụng enum có sẵn
      {
        phieu_id: phieuData.id,
        so_phieu: phieuData.so_phieu,
        nguoi_duyet: user.ho_ten || "Admin",
        ghi_chu: ghi_chu_phan_hoi,
        url: `/xuat-kho/${phieuData.id}`,
      }
    );

    await client.query("COMMIT");
    sendResponse(res, 200, true, "Yêu cầu chỉnh sửa thành công");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Request revision error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

// const getList = async (req, res, query, user) => {
//   try {
//     const {
//       page = 1,
//       limit = 20,
//       search,
//       tu_ngay,
//       den_ngay,
//       trang_thai,
//       loai_xuat,
//       don_vi_nhan_id,
//       sort_by = "created_at",
//       sort_direction = "desc",
//     } = query;

//     const offset = (page - 1) * limit;
//     let whereClause = "WHERE 1=1";
//     const params = [];
//     let paramCount = 0;

//     // Tìm kiếm theo số quyết định, tên đơn vị nhận và phòng ban nhận
//     if (search && search.trim()) {
//       paramCount++;
//       whereClause += ` AND (
//         px.so_quyet_dinh ILIKE $${paramCount} OR
//         dvn.ten_don_vi ILIKE $${paramCount} OR
//         pb_nhan.ten_phong_ban ILIKE $${paramCount}
//       )`;
//       params.push(`%${search.trim()}%`);
//     }

//     // Lọc theo ngày
//     if (tu_ngay && den_ngay) {
//       paramCount += 2;
//       whereClause += ` AND px.ngay_xuat BETWEEN $${
//         paramCount - 1
//       } AND $${paramCount}`;
//       params.push(tu_ngay, den_ngay);
//     }

//     // Lọc theo trạng thái
//     if (trang_thai) {
//       paramCount++;
//       whereClause += ` AND px.trang_thai = $${paramCount}`;
//       params.push(trang_thai);
//     }

//     // Lọc theo loại xuất
//     if (loai_xuat) {
//       paramCount++;
//       whereClause += ` AND px.loai_xuat = $${paramCount}`;
//       params.push(loai_xuat);
//     }

//     // Lọc theo đơn vị nhận
//     if (don_vi_nhan_id) {
//       paramCount++;
//       whereClause += ` AND px.don_vi_nhan_id = $${paramCount}`;
//       params.push(don_vi_nhan_id);
//     }

//     // Phân quyền: hiển thị phiếu của chính phòng ban hoặc phiếu xuất cho phòng ban này
//     if (user.role !== "admin") {
//       paramCount++;
//       whereClause += ` AND (px.phong_ban_id = $${paramCount} OR
//         px.phong_ban_nhan_id = $${paramCount})`;
//       params.push(user.phong_ban_id);
//     }

//     // Xử lý sắp xếp
//     const validSortFields = {
//       so_phieu: "px.so_phieu",
//       so_quyet_dinh: "px.so_quyet_dinh",
//       ngay_xuat: "px.ngay_xuat",
//       tong_tien: "px.tong_tien",
//       created_at: "px.created_at",
//     };

//     const sortField = validSortFields[sort_by] || "px.created_at";
//     const sortDir = sort_direction.toLowerCase() === "asc" ? "ASC" : "DESC";
//     const orderClause = `ORDER BY ${sortField} ${sortDir}`;

//     const countQuery = `
//       SELECT COUNT(*)
//       FROM phieu_xuat px
//       LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id
//       LEFT JOIN phong_ban pb_nhan ON px.phong_ban_nhan_id = pb_nhan.id
//       ${whereClause}
//     `;

//     const dataQuery = `
//       SELECT px.*,
//              dvn.id as dvn_id, dvn.ma_don_vi, dvn.ten_don_vi, dvn.loai_don_vi,
//              pb_nhan.id as pb_nhan_id, pb_nhan.ten_phong_ban as ten_pb_nhan, pb_nhan.cap_bac as cap_bac_nhan,
//              u.id as nguoi_tao_id, u.ho_ten as nguoi_tao_ten,
//              u2.id as nguoi_duyet_id, u2.ho_ten as nguoi_duyet_ten,
//              pb.ten_phong_ban,
//              px.decision_pdf_url,
//              px.decision_pdf_filename,
//              px.ghi_chu_xac_nhan,
//              px.ghi_chu_phan_hoi,
//              -- Thông tin phiếu nhập liên kết
//              pn.id as phieu_nhap_lien_ket_id_ref,
//              pn.so_phieu as so_phieu_nhap_lien_ket,
//              pn.trang_thai as trang_thai_phieu_nhap_lien_ket
//       FROM phieu_xuat px
//       LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id
//       LEFT JOIN phong_ban pb_nhan ON px.phong_ban_nhan_id = pb_nhan.id
//       LEFT JOIN users u ON px.nguoi_tao = u.id
//       LEFT JOIN users u2 ON px.nguoi_duyet = u2.id
//       LEFT JOIN phong_ban pb ON px.phong_ban_id = pb.id
//       LEFT JOIN phieu_nhap pn ON px.phieu_nhap_lien_ket_id = pn.id
//       ${whereClause}
//       ${orderClause}
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
//       don_vi_nhan: item.dvn_id
//         ? {
//             id: item.dvn_id,
//             ma_don_vi: item.ma_don_vi,
//             ten_don_vi: item.ten_don_vi,
//             loai_don_vi: item.loai_don_vi,
//           }
//         : null,
//       phong_ban_nhan: item.pb_nhan_id
//         ? {
//             id: item.pb_nhan_id,
//             ten_phong_ban: item.ten_pb_nhan,
//             cap_bac: item.cap_bac_nhan,
//           }
//         : null,
//       user_tao: item.nguoi_tao_id
//         ? {
//             id: item.nguoi_tao_id,
//             ho_ten: item.nguoi_tao_ten,
//           }
//         : null,
//       user_duyet: item.nguoi_duyet_id
//         ? {
//             id: item.nguoi_duyet_id,
//             ho_ten: item.nguoi_duyet_ten,
//           }
//         : null,
//       phieu_nhap_lien_ket: item.phieu_nhap_lien_ket_id_ref
//         ? {
//             id: item.phieu_nhap_lien_ket_id_ref,
//             so_phieu: item.so_phieu_nhap_lien_ket,
//             trang_thai: item.trang_thai_phieu_nhap_lien_ket,
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
//     console.error("Get phieu xuat error:", error);
//     sendResponse(res, 500, false, "Lỗi server");
//   }
// };

const complete = async (req, res, params, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;
    const { chi_tiet_cap_nhat = [] } = body;

    const phieu = await client.query("SELECT * FROM phieu_xuat WHERE id = $1", [
      id,
    ]);

    if (phieu.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
    }

    const phieuData = phieu.rows[0];

    if (phieuData.trang_thai !== "approved") {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Chỉ có thể hoàn thành phiếu đã được duyệt"
      );
    }

    // Cập nhật số lượng thực xuất nếu có thay đổi
    if (chi_tiet_cap_nhat.length > 0) {
      for (const item of chi_tiet_cap_nhat) {
        await client.query(
          `UPDATE chi_tiet_xuat 
           SET so_luong_thuc_xuat = $1,
               thanh_tien = $1 * don_gia
           WHERE phieu_xuat_id = $2 AND hang_hoa_id = $3`,
          [item.so_luong_thuc_xuat, id, item.hang_hoa_id]
        );
      }
    }

    // Tính lại tổng tiền dựa trên số lượng thực xuất
    const tongTienResult = await client.query(
      `SELECT SUM(so_luong_thuc_xuat * don_gia) as tong_tien_thuc_te
       FROM chi_tiet_xuat 
       WHERE phieu_xuat_id = $1`,
      [id]
    );

    const tongTienThucTe = tongTienResult.rows[0]?.tong_tien_thuc_te || 0;

    // Hoàn thành phiếu - trigger sẽ tự động cập nhật tồn kho
    await client.query(
      `UPDATE phieu_xuat 
       SET trang_thai = 'completed',
           tong_tien = $1
         
       WHERE id = $2`,
      [tongTienThucTe, id]
    );

    // ✅ Gửi thông báo hoàn thành bằng notificationService
    await notificationService.createNotifications(
      [phieuData.nguoi_tao],
      "Phiếu xuất kho đã hoàn thành",
      `Phiếu xuất ${phieuData.so_phieu} đã được hoàn thành xuất kho. Tồn kho đã được cập nhật.`,
      "system", // ✅ Sử dụng enum có sẵn
      {
        phieu_id: phieuData.id,
        so_phieu: phieuData.so_phieu,
        tong_tien_thuc_te: tongTienThucTe,
        url: `/xuat-kho/${phieuData.id}`,
      }
    );

    await client.query("COMMIT");

    let successMessage = "Hoàn thành phiếu xuất thành công";
    sendResponse(res, 200, true, successMessage);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Complete phieu xuat error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

// Cập nhật getDetail để hiển thị thông tin phòng ban nhận và liên kết
const getDetail = async (req, res, params, user) => {
  try {
    const { id } = params;

    const detailQuery = `
      SELECT 
        px.*, 
        dvn.id as dvn_id, dvn.ma_don_vi, dvn.ten_don_vi, dvn.loai_don_vi, dvn.dia_chi as dvn_dia_chi,
        pb_nhan.id as pb_nhan_id, pb_nhan.ten_phong_ban as ten_pb_nhan, pb_nhan.cap_bac as cap_bac_nhan,
        u1.id as nguoi_tao_id, u1.ho_ten as nguoi_tao_ten,
        u2.id as nguoi_duyet_id, u2.ho_ten as nguoi_duyet_ten,
        pb.ten_phong_ban,
        pn.id as phieu_nhap_lien_ket_id_ref,
        pn.so_phieu as so_phieu_nhap_lien_ket,
        pn.trang_thai as trang_thai_phieu_nhap_lien_ket
      FROM phieu_xuat px
      LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id
      LEFT JOIN phong_ban pb_nhan ON px.phong_ban_nhan_id = pb_nhan.id
      LEFT JOIN users u1 ON px.nguoi_tao = u1.id
      LEFT JOIN users u2 ON px.nguoi_duyet = u2.id
      LEFT JOIN phong_ban pb ON px.phong_ban_id = pb.id
      LEFT JOIN phieu_nhap pn ON px.phieu_nhap_lien_ket_id = pn.id
      WHERE px.id = $1
    `;

    const chiTietQuery = `
      SELECT 
        ctx.*, 
        h.id as hang_hoa_id_ref, h.ma_hang_hoa, h.ten_hang_hoa, h.don_vi_tinh, h.co_so_seri,
        tk.so_luong_ton, tk.don_gia_binh_quan
      FROM chi_tiet_xuat ctx
      JOIN hang_hoa h ON ctx.hang_hoa_id = h.id
      LEFT JOIN ton_kho tk ON ctx.hang_hoa_id = tk.hang_hoa_id AND tk.phong_ban_id = (
        SELECT phong_ban_id FROM phieu_xuat WHERE id = $1
      )
      WHERE ctx.phieu_xuat_id = $1
      ORDER BY ctx.id
    `;

    const [phieuResult, chiTietResult] = await Promise.all([
      pool.query(detailQuery, [id]),
      pool.query(chiTietQuery, [id]),
    ]);

    if (phieuResult.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
    }

    const phieuData = phieuResult.rows[0];

    // Kiểm tra quyền xem: của chính phòng ban hoặc phòng ban nhận
    if (
      user.role !== "admin" &&
      phieuData.phong_ban_id !== user.phong_ban_id &&
      phieuData.pb_nhan_id !== user.phong_ban_id
    ) {
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền xem phiếu xuất này"
      );
    }

    const phieuXuat = {
      ...phieuData,
      don_vi_nhan: phieuData.dvn_id
        ? {
            id: phieuData.dvn_id,
            ma_don_vi: phieuData.ma_don_vi,
            ten_don_vi: phieuData.ten_don_vi,
            loai_don_vi: phieuData.loai_don_vi,
            dia_chi: phieuData.dvn_dia_chi,
          }
        : null,
      phong_ban_nhan: phieuData.pb_nhan_id
        ? {
            id: phieuData.pb_nhan_id,
            ten_phong_ban: phieuData.ten_pb_nhan,
            cap_bac: phieuData.cap_bac_nhan,
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
      phieu_nhap_lien_ket: phieuData.phieu_nhap_lien_ket_id_ref
        ? {
            id: phieuData.phieu_nhap_lien_ket_id_ref,
            so_phieu: phieuData.so_phieu_nhap_lien_ket,
            trang_thai: phieuData.trang_thai_phieu_nhap_lien_ket,
          }
        : null,
      chi_tiet: chiTietResult.rows.map((item) => ({
        ...item,
        hang_hoa: {
          id: item.hang_hoa_id_ref,
          ma_hang_hoa: item.ma_hang_hoa,
          ten_hang_hoa: item.ten_hang_hoa,
          don_vi_tinh: item.don_vi_tinh,
          co_so_seri: item.co_so_seri,
        },
        ton_kho: {
          so_luong_ton: item.so_luong_ton || 0,
          don_gia_binh_quan: item.don_gia_binh_quan || 0,
        },
      })),
    };

    sendResponse(res, 200, true, "Lấy chi tiết thành công", phieuXuat);
  } catch (error) {
    console.error("Get phieu xuat detail error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

// Lấy danh sách phòng ban có thể nhận hàng
const getPhongBanNhanHang = async (req, res, query, user) => {
  try {
    const result = await pool.query(
      `SELECT pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac
       FROM get_phong_ban_co_the_nhan_hang($1) pb
       ORDER BY pb.cap_bac DESC, pb.ten_phong_ban`,
      [user.phong_ban_id]
    );

    sendResponse(
      res,
      200,
      true,
      "Lấy danh sách đơn vị nhận thành công",
      result.rows
    );
  } catch (error) {
    console.error("Get phong ban nhan hang error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

// Cập nhật create để hỗ trợ xuất cho phòng ban khác
const create = async (req, res, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      ngay_xuat,
      don_vi_nhan_id,
      phong_ban_nhan_id,
      nguoi_nhan,
      so_quyet_dinh,
      ly_do_xuat,
      loai_xuat = "don_vi_nhan",
      phong_ban_id,
      ghi_chu,
      chi_tiet = [],
    } = body;

    // Validation
    if (!ngay_xuat || !chi_tiet.length) {
      await client.query("ROLLBACK");
      return sendResponse(res, 400, false, "Thiếu thông tin bắt buộc");
    }

    // Validation cho phòng ban nhận (khi xuất cho cấp dưới)
    if (phong_ban_nhan_id) {
      const permissionCheck = await client.query(
        `SELECT check_phong_ban_permission($1, $2, 'manage') as can_provide`,
        [user.id, phong_ban_nhan_id]
      );

      if (!permissionCheck.rows[0]?.can_provide) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          403,
          false,
          "Bạn không có quyền cấp phát cho đơn vị này"
        );
      }
    }

    // Kiểm tra tồn kho thực tế trước khi tạo phiếu
    for (const item of chi_tiet) {
      const tonKhoResult = await client.query(
        `SELECT tk.so_luong_ton, tk.don_gia_binh_quan 
         FROM ton_kho tk 
         WHERE tk.hang_hoa_id = $1 AND tk.phong_ban_id = $2`,
        [item.hang_hoa_id, phong_ban_id || user.phong_ban_id]
      );

      if (tonKhoResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          `Hàng hóa ID ${item.hang_hoa_id} không có trong kho`
        );
      }

      const tonKho = tonKhoResult.rows[0];

      // Tính số lượng đang chờ xuất từ các phiếu khác
      const dangChoXuatResult = await client.query(
        `SELECT COALESCE(SUM(ctx.so_luong_yeu_cau), 0) as so_luong_dang_cho_xuat
         FROM chi_tiet_xuat ctx
         JOIN phieu_xuat px ON ctx.phieu_xuat_id = px.id
         WHERE ctx.hang_hoa_id = $1 
         AND px.phong_ban_id = $2
         AND px.trang_thai IN ('draft', 'confirmed')`,
        [item.hang_hoa_id, phong_ban_id || user.phong_ban_id]
      );

      const soLuongDangChoXuat =
        dangChoXuatResult.rows[0]?.so_luong_dang_cho_xuat || 0;
      const soLuongCoTheXuat = Math.max(
        0,
        tonKho.so_luong_ton - soLuongDangChoXuat
      );

      if (soLuongCoTheXuat < item.so_luong_yeu_cau) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          `Không đủ hàng có thể xuất cho hàng hóa ID ${item.hang_hoa_id}. ` +
            `Tồn kho: ${tonKho.so_luong_ton}, ` +
            `đang chờ xuất: ${soLuongDangChoXuat}, ` +
            `có thể xuất: ${soLuongCoTheXuat}, ` +
            `yêu cầu: ${item.so_luong_yeu_cau}`
        );
      }
    }

    // Tạo số phiếu tự động
    const dateStr = new Date(ngay_xuat)
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");

    const maxResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(so_phieu FROM 11) AS INTEGER)), 0) as max_seq 
       FROM phieu_xuat 
       WHERE so_phieu LIKE $1`,
      [`PX${dateStr}%`]
    );

    const nextSeq = maxResult.rows[0].max_seq + 1;
    let soPhieu = `PX${dateStr}${String(nextSeq).padStart(3, "0")}`;

    // Kiểm tra trùng lặp
    let attempts = 0;
    while (attempts < 5) {
      const existsResult = await client.query(
        "SELECT 1 FROM phieu_xuat WHERE so_phieu = $1",
        [soPhieu]
      );

      if (existsResult.rows.length === 0) {
        break;
      }

      attempts++;
      const retrySeq = nextSeq + attempts;
      soPhieu = `PX${dateStr}${String(retrySeq).padStart(3, "0")}`;
    }

    if (attempts >= 5) {
      await client.query("ROLLBACK");
      return sendResponse(res, 500, false, "Không thể tạo số phiếu duy nhất");
    }

    // Tạo phiếu xuất với trạng thái draft
    const phieuResult = await client.query(
      `INSERT INTO phieu_xuat (
        so_phieu, ngay_xuat, don_vi_nhan_id, phong_ban_nhan_id, nguoi_nhan, so_quyet_dinh, ly_do_xuat, loai_xuat,
        phong_ban_id, ghi_chu, nguoi_tao, tong_tien, trang_thai
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, 'draft')
      RETURNING *`,
      [
        soPhieu,
        ngay_xuat,
        don_vi_nhan_id,
        phong_ban_nhan_id,
        nguoi_nhan,
        so_quyet_dinh || "",
        ly_do_xuat,
        loai_xuat,
        phong_ban_id || user.phong_ban_id,
        ghi_chu,
        user.id,
      ]
    );

    const phieuXuat = phieuResult.rows[0];
    let tongTien = 0;

    // Tạo chi tiết xuất
    for (const item of chi_tiet) {
      const {
        hang_hoa_id,
        so_luong_yeu_cau,
        so_luong_thuc_xuat = so_luong_yeu_cau,
        don_gia,
        so_seri_xuat = [],
        pham_chat = "tot",
        ghi_chu: item_ghi_chu,
      } = item;

      if (!hang_hoa_id || !so_luong_yeu_cau || don_gia === undefined) {
        await client.query("ROLLBACK");
        return sendResponse(res, 400, false, "Chi tiết xuất không hợp lệ");
      }

      const thanhTien = so_luong_yeu_cau * don_gia;
      tongTien += thanhTien;

      await client.query(
        `INSERT INTO chi_tiet_xuat (
          phieu_xuat_id, hang_hoa_id, so_luong_yeu_cau, so_luong_thuc_xuat, 
          don_gia, thanh_tien, so_seri_xuat, pham_chat, ghi_chu
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          phieuXuat.id,
          hang_hoa_id,
          so_luong_yeu_cau,
          so_luong_thuc_xuat,
          don_gia,
          thanhTien,
          so_seri_xuat.length > 0 ? so_seri_xuat : null,
          pham_chat,
          item_ghi_chu,
        ]
      );
    }

    // Cập nhật tổng tiền
    await client.query("UPDATE phieu_xuat SET tong_tien = $1 WHERE id = $2", [
      tongTien,
      phieuXuat.id,
    ]);

    await client.query("COMMIT");

    sendResponse(res, 201, true, "Tạo phiếu xuất thành công", {
      id: phieuXuat.id,
      so_phieu: phieuXuat.so_phieu,
      tong_tien: tongTien,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create phieu xuat error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

// Thêm function kiểm tra tồn kho thực tế với phân quyền
const checkTonKhoThucTe = async (req, res, body, user) => {
  try {
    const { phong_ban_id, chi_tiet = [], phieu_hien_tai_id } = body;

    if (!chi_tiet.length) {
      return sendResponse(res, 400, false, "Danh sách chi tiết trống");
    }

    // Kiểm tra quyền truy cập tồn kho của phòng ban
    const targetPhongBanId = phong_ban_id || user.phong_ban_id;

    if (user.role !== "admin" && targetPhongBanId !== user.phong_ban_id) {
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền kiểm tra tồn kho của phòng ban này"
      );
    }

    const tonKhoResults = [];

    for (const item of chi_tiet) {
      // 1. Lấy tồn kho thực tế
      const tonKhoResult = await pool.query(
        `SELECT tk.so_luong_ton, tk.don_gia_binh_quan, 
                tk.sl_tot, tk.sl_kem_pham_chat, tk.sl_mat_pham_chat, 
                tk.sl_hong, tk.sl_can_thanh_ly,
                h.ten_hang_hoa, h.ma_hang_hoa
         FROM ton_kho tk
         JOIN hang_hoa h ON tk.hang_hoa_id = h.id
         WHERE tk.hang_hoa_id = $1 AND tk.phong_ban_id = $2`,
        [item.hang_hoa_id, targetPhongBanId]
      );

      // 2. Tính số lượng đang chờ xuất (LOẠI TRỪ phiếu hiện tại nếu đang chỉnh sửa)
      let dangChoXuatQuery = `
        SELECT COALESCE(SUM(ctx.so_luong_yeu_cau), 0) as so_luong_dang_cho_xuat
        FROM chi_tiet_xuat ctx
        JOIN phieu_xuat px ON ctx.phieu_xuat_id = px.id
        WHERE ctx.hang_hoa_id = $1 
        AND px.phong_ban_id = $2
        AND px.trang_thai = 'draft'
      `;

      const queryParams = [item.hang_hoa_id, targetPhongBanId];

      // Nếu đang chỉnh sửa phiếu, loại trừ phiếu hiện tại
      if (phieu_hien_tai_id) {
        dangChoXuatQuery += ` AND px.id != $3`;
        queryParams.push(phieu_hien_tai_id);
      }

      const dangChoXuatResult = await pool.query(dangChoXuatQuery, queryParams);

      const tonKho = tonKhoResult.rows[0] || {
        so_luong_ton: 0,
        don_gia_binh_quan: 0,
        sl_tot: 0,
        sl_kem_pham_chat: 0,
        sl_mat_pham_chat: 0,
        sl_hong: 0,
        sl_can_thanh_ly: 0,
        ten_hang_hoa: "Không xác định",
        ma_hang_hoa: "Không xác định",
      };

      const soLuongDangChoXuat =
        dangChoXuatResult.rows[0]?.so_luong_dang_cho_xuat || 0;

      // 3. Tính số lượng có thể xuất thực tế
      const soLuongCoTheXuat = Math.max(
        0,
        tonKho.so_luong_ton - soLuongDangChoXuat
      );

      tonKhoResults.push({
        hang_hoa_id: item.hang_hoa_id,
        so_luong_yeu_cau: item.so_luong_ke_hoach || item.so_luong_yeu_cau,
        so_luong_ton_thuc_te: tonKho.so_luong_ton,
        so_luong_dang_cho_xuat: soLuongDangChoXuat,
        so_luong_co_the_xuat: soLuongCoTheXuat,
        sl_tot: tonKho.sl_tot,
        sl_kem_pham_chat: tonKho.sl_kem_pham_chat,
        sl_mat_pham_chat: tonKho.sl_mat_pham_chat,
        sl_hong: tonKho.sl_hong,
        sl_can_thanh_ly: tonKho.sl_can_thanh_ly,
        don_gia_binh_quan: tonKho.don_gia_binh_quan,
        ten_hang_hoa: tonKho.ten_hang_hoa,
        ma_hang_hoa: tonKho.ma_hang_hoa,
        co_the_xuat:
          soLuongCoTheXuat >= (item.so_luong_ke_hoach || item.so_luong_yeu_cau),
        canh_bao:
          soLuongDangChoXuat > 0
            ? `Có ${soLuongDangChoXuat} đang chờ xuất từ các phiếu nhập khác`
            : null,
      });
    }

    sendResponse(res, 200, true, "Kiểm tra tồn kho thực tế thành công", {
      ton_kho: tonKhoResults,
    });
  } catch (error) {
    console.error("Check ton kho thuc te error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

// Gửi phiếu để duyệt
// const submit = async (req, res, params, user) => {
//   const client = await pool.connect();

//   try {
//     await client.query("BEGIN");

//     const { id } = params;

//     // Kiểm tra phiếu tồn tại và quyền
//     const phieuResult = await client.query(
//       "SELECT * FROM phieu_xuat WHERE id = $1",
//       [id]
//     );

//     if (phieuResult.rows.length === 0) {
//       await client.query("ROLLBACK");
//       return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
//     }

//     const phieu = phieuResult.rows[0];

//     if (user.role !== "admin" && phieu.nguoi_tao !== user.id) {
//       await client.query("ROLLBACK");
//       return sendResponse(
//         res,
//         403,
//         false,
//         "Bạn không có quyền thực hiện hành động này"
//       );
//     }

//     if (!["draft", "revision_required"].includes(phieu.trang_thai)) {
//       await client.query("ROLLBACK");
//       return sendResponse(
//         res,
//         400,
//         false,
//         "Chỉ có thể gửi phiếu ở trạng thái nháp hoặc yêu cầu sửa"
//       );
//     }

//     // Kiểm tra có chi tiết hay không
//     const chiTietCount = await client.query(
//       "SELECT COUNT(*) FROM chi_tiet_xuat WHERE phieu_xuat_id = $1",
//       [id]
//     );

//     if (parseInt(chiTietCount.rows[0].count) === 0) {
//       await client.query("ROLLBACK");
//       return sendResponse(
//         res,
//         400,
//         false,
//         "Phiếu phải có ít nhất một mặt hàng"
//       );
//     }

//     // Kiểm tra tồn kho một lần nữa trước khi gửi
//     const chiTietList = await client.query(
//       `SELECT ctx.*, h.ten_hang_hoa
//        FROM chi_tiet_xuat ctx
//        JOIN hang_hoa h ON ctx.hang_hoa_id = h.id
//        WHERE ctx.phieu_xuat_id = $1`,
//       [id]
//     );

//     for (const item of chiTietList.rows) {
//       const tonKhoResult = await client.query(
//         `SELECT so_luong_ton FROM ton_kho
//          WHERE hang_hoa_id = $1 AND phong_ban_id = $2`,
//         [item.hang_hoa_id, phieu.phong_ban_id]
//       );

//       const tonKho = tonKhoResult.rows[0]?.so_luong_ton || 0;

//       if (tonKho < item.so_luong_ke_hoach) {
//         await client.query("ROLLBACK");
//         return sendResponse(
//           res,
//           400,
//           false,
//           `Không đủ tồn kho cho ${item.ten_hang_hoa}. Tồn: ${tonKho}, yêu cầu: ${item.so_luong_ke_hoach}`
//         );
//       }
//     }

//     // Cập nhật trạng thái thành confirmed và xóa ghi chú phản hồi cũ
//     await client.query(
//       `UPDATE phieu_xuat SET
//         trang_thai = 'confirmed',
//         ngay_gui_duyet = CURRENT_TIMESTAMP,
//         ghi_chu_phan_hoi = NULL,
//         updated_at = CURRENT_TIMESTAMP
//       WHERE id = $1`,
//       [id]
//     );

//     // Gửi thông báo cho admin
//     const adminUsers = await client.query(
//       "SELECT id FROM users WHERE role = 'admin' AND trang_thai = 'active'"
//     );

//     if (adminUsers.rows.length > 0) {
//       const adminIds = adminUsers.rows.map((row) => row.id);

//       await notificationService.createNotifications(
//         adminIds,
//         "Phiếu xuất kho cần duyệt",
//         `Phiếu xuất ${phieu.so_phieu} đang chờ duyệt từ ${user.ho_ten}`,
//         "phieu_xuat_can_duyet",
//         {
//           phieu_id: phieu.id,
//           so_phieu: phieu.so_phieu,
//           nguoi_tao: user.ho_ten,
//           url: `/xuat-kho/${phieu.id}`,
//         }
//       );
//     }

//     await client.query("COMMIT");
//     sendResponse(res, 200, true, "Gửi phiếu thành công");
//   } catch (error) {
//     await client.query("ROLLBACK");
//     console.error("Submit phieu error:", error);
//     sendResponse(res, 500, false, "Lỗi server");
//   } finally {
//     client.release();
//   }
// };

// Yêu cầu chỉnh sửa phiếu xuất
// const requestRevision = async (req, res, params, body, user) => {
//   const client = await pool.connect();

//   try {
//     await client.query("BEGIN");

//     const { id } = params;
//     const { ghi_chu_phan_hoi } = body;

//     if (!ghi_chu_phan_hoi) {
//       await client.query("ROLLBACK");
//       return sendResponse(res, 400, false, "Vui lòng nhập ghi chú phản hồi");
//     }

//     // Chỉ admin mới có quyền yêu cầu chỉnh sửa
//     if (user.role !== "admin") {
//       await client.query("ROLLBACK");
//       return sendResponse(
//         res,
//         403,
//         false,
//         "Bạn không có quyền yêu cầu chỉnh sửa"
//       );
//     }

//     const phieu = await client.query("SELECT * FROM phieu_xuat WHERE id = $1", [
//       id,
//     ]);

//     if (phieu.rows.length === 0) {
//       await client.query("ROLLBACK");
//       return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
//     }

//     if (phieu.rows[0].trang_thai !== "confirmed") {
//       await client.query("ROLLBACK");
//       return sendResponse(
//         res,
//         400,
//         false,
//         "Chỉ có thể yêu cầu chỉnh sửa phiếu đang chờ duyệt"
//       );
//     }

//     // Cập nhật trạng thái thành revision_required
//     await client.query(
//       `UPDATE phieu_xuat
//        SET trang_thai = 'revision_required',
//            ghi_chu_phan_hoi = $1,
//            nguoi_duyet = $2,
//            ngay_duyet = CURRENT_TIMESTAMP,
//            updated_at = CURRENT_TIMESTAMP
//        WHERE id = $3`,
//       [ghi_chu_phan_hoi, user.id, id]
//     );

//     // Gửi thông báo cho người tạo phiếu
//     const phieuData = phieu.rows[0];
//     await notificationService.createNotifications(
//       [phieuData.nguoi_tao],
//       "Phiếu xuất kho cần chỉnh sửa",
//       `Phiếu xuất ${phieuData.so_phieu} cần chỉnh sửa. Lý do: ${ghi_chu_phan_hoi}`,
//       "phieu_xuat_can_sua",
//       {
//         phieu_id: phieuData.id,
//         so_phieu: phieuData.so_phieu,
//         nguoi_duyet: user.ho_ten,
//         ghi_chu: ghi_chu_phan_hoi,
//         url: `/xuat-kho/${phieuData.id}`,
//       }
//     );

//     await client.query("COMMIT");
//     sendResponse(res, 200, true, "Yêu cầu chỉnh sửa thành công");
//   } catch (error) {
//     await client.query("ROLLBACK");
//     console.error("Request revision error:", error);
//     sendResponse(res, 500, false, "Lỗi server");
//   } finally {
//     client.release();
//   }
// };

// Cập nhật số lượng thực xuất
const updateActualQuantity = async (req, res, params, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;
    const { chi_tiet_cap_nhat = [] } = body;

    // Kiểm tra phiếu tồn tại và trạng thái
    const phieu = await client.query("SELECT * FROM phieu_xuat WHERE id = $1", [
      id,
    ]);

    if (phieu.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
    }

    const phieuData = phieu.rows[0];

    if (phieuData.trang_thai !== "approved") {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Chỉ có thể sửa số lượng thực tế khi phiếu đã được duyệt"
      );
    }

    // Validation số lượng thực xuất và kiểm tra tồn kho
    for (const item of chi_tiet_cap_nhat) {
      if (
        !item.hang_hoa_id ||
        !item.so_luong_thuc_xuat ||
        item.so_luong_thuc_xuat <= 0
      ) {
        await client.query("ROLLBACK");
        return sendResponse(res, 400, false, "Số lượng thực xuất không hợp lệ");
      }

      // Kiểm tra tồn kho nghiêm ngặt
      const tonKhoResult = await client.query(
        `SELECT so_luong_ton FROM ton_kho 
         WHERE hang_hoa_id = $1 AND phong_ban_id = $2`,
        [item.hang_hoa_id, phieuData.phong_ban_id]
      );

      const tonKho = tonKhoResult.rows[0]?.so_luong_ton || 0;

      if (tonKho < item.so_luong_thuc_xuat) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          `Không đủ tồn kho cho hàng hóa ID ${item.hang_hoa_id}. Tồn: ${tonKho}, yêu cầu xuất: ${item.so_luong_thuc_xuat}`
        );
      }

      // Cảnh báo nếu chênh lệch quá lớn so với kế hoạch
      const keHoachResult = await client.query(
        "SELECT so_luong_yeu_cau FROM chi_tiet_xuat WHERE phieu_xuat_id = $1 AND hang_hoa_id = $2",
        [id, item.hang_hoa_id]
      );

      if (keHoachResult.rows.length > 0) {
        const soLuongYeuCau = keHoachResult.rows[0].so_luong_yeu_cau;
        const chenhLech =
          Math.abs(item.so_luong_thuc_xuat - soLuongYeuCau) / soLuongYeuCau;

        if (chenhLech > 0.2) {
          // Chênh lệch > 20%
          console.warn(
            `Cảnh báo: Số lượng thực xuất chênh lệch lớn so với yêu cầu cho hàng hóa ID ${item.hang_hoa_id}`
          );
        }
      }
    }

    // Cập nhật số lượng thực xuất
    for (const item of chi_tiet_cap_nhat) {
      await client.query(
        `UPDATE chi_tiet_xuat 
         SET so_luong_thuc_xuat = $1,
             thanh_tien = $1 * don_gia,
             updated_at = CURRENT_TIMESTAMP
         WHERE phieu_xuat_id = $2 AND hang_hoa_id = $3`,
        [item.so_luong_thuc_xuat, id, item.hang_hoa_id]
      );
    }

    // Tính lại tổng tiền thực tế
    const tongTienResult = await client.query(
      `SELECT SUM(so_luong_thuc_xuat * don_gia) as tong_tien_thuc_te
       FROM chi_tiet_xuat 
       WHERE phieu_xuat_id = $1`,
      [id]
    );

    const tongTienThucTe = tongTienResult.rows[0]?.tong_tien_thuc_te || 0;

    await client.query(
      `UPDATE phieu_xuat 
       SET tong_tien_thuc_te = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [tongTienThucTe, id]
    );

    await client.query("COMMIT");
    sendResponse(res, 200, true, "Cập nhật số lượng thực tế thành công");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update actual quantity error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

// Các functions khác như update, delete, cancel giữ nguyên logic cũ nhưng thêm kiểm tra trạng thái mới
// const update = async (req, res, params, body, user) => {
//   const client = await pool.connect();

//   try {
//     await client.query("BEGIN");

//     const { id } = params;
//     const {
//       ngay_xuat,
//       don_vi_nhan_id,
//       nguoi_nhan,
//       so_quyet_dinh,
//       ly_do_xuat,
//       loai_xuat,
//       ghi_chu,
//       chi_tiet = [],
//     } = body;

//     // Kiểm tra phiếu tồn tại
//     const phieuResult = await client.query(
//       "SELECT * FROM phieu_xuat WHERE id = $1",
//       [id]
//     );

//     if (phieuResult.rows.length === 0) {
//       await client.query("ROLLBACK");
//       return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
//     }

//     const phieu = phieuResult.rows[0];

//     if (user.role !== "admin" && phieu.nguoi_tao !== user.id) {
//       await client.query("ROLLBACK");
//       return sendResponse(res, 403, false, "Bạn không có quyền sửa phiếu này");
//     }

//     // Chỉ cho phép chỉnh sửa khi chưa hoàn thành
//     if (!["draft", "revision_required"].includes(phieu.trang_thai)) {
//       await client.query("ROLLBACK");
//       return sendResponse(
//         res,
//         400,
//         false,
//         "Không thể sửa phiếu đã được xử lý."
//       );
//     }

//     // Validation chi tiết
//     if (!chi_tiet || chi_tiet.length === 0) {
//       await client.query("ROLLBACK");
//       return sendResponse(
//         res,
//         400,
//         false,
//         "Cần có ít nhất một chi tiết hàng hóa"
//       );
//     }

//     // Kiểm tra tồn kho cho các chi tiết mới
//     for (const item of chi_tiet) {
//       const tonKhoResult = await client.query(
//         `SELECT tk.so_luong_ton
//          FROM ton_kho tk
//          WHERE tk.hang_hoa_id = $1 AND tk.phong_ban_id = $2`,
//         [item.hang_hoa_id, phieu.phong_ban_id]
//       );

//       if (tonKhoResult.rows.length === 0) {
//         await client.query("ROLLBACK");
//         return sendResponse(
//           res,
//           400,
//           false,
//           `Hàng hóa ID ${item.hang_hoa_id} không có trong kho`
//         );
//       }

//       const tonKho = tonKhoResult.rows[0];

//       // Tính số lượng đang chờ xuất từ các phiếu nháp khác (loại trừ phiếu hiện tại)
//       const dangChoXuatResult = await client.query(
//         `SELECT COALESCE(SUM(ctx.so_luong_yeu_cau), 0) as so_luong_dang_cho_xuat
//          FROM chi_tiet_xuat ctx
//          JOIN phieu_xuat px ON ctx.phieu_xuat_id = px.id
//          WHERE ctx.hang_hoa_id = $1
//          AND px.phong_ban_id = $2
//          AND px.trang_thai = 'draft'
//          AND px.id != $3`,
//         [item.hang_hoa_id, phieu.phong_ban_id, id]
//       );

//       const soLuongDangChoXuat =
//         dangChoXuatResult.rows[0]?.so_luong_dang_cho_xuat || 0;
//       const soLuongCoTheXuat = Math.max(
//         0,
//         tonKho.so_luong_ton - soLuongDangChoXuat
//       );

//       if (soLuongCoTheXuat < item.so_luong_) {
//         await client.query("ROLLBACK");
//         return sendResponse(
//           res,
//           400,
//           false,
//           `Không đủ hàng có thể xuất cho hàng hóa ID ${item.hang_hoa_id}. ` +
//             `Tồn kho: ${tonKho.so_luong_ton}, ` +
//             `đang chờ xuất (phiếu khác): ${soLuongDangChoXuat}, ` +
//             `có thể xuất: ${soLuongCoTheXuat}, ` +
//             `yêu cầu: ${item.so_luong_ke_hoach}`
//         );
//       }
//     }

//     // Cập nhật thông tin phiếu
//     await client.query(
//       `UPDATE phieu_xuat
//        SET ngay_xuat = $1, don_vi_nhan_id = $2, nguoi_nhan = $3, so_quyet_dinh = $4, ly_do_xuat = $5,
//            loai_xuat = $6, ghi_chu = $7, updated_at = CURRENT_TIMESTAMP
//        WHERE id = $8`,
//       [
//         ngay_xuat,
//         don_vi_nhan_id,
//         nguoi_nhan,
//         so_quyet_dinh || "",
//         ly_do_xuat,
//         loai_xuat,
//         ghi_chu,
//         id,
//       ]
//     );

//     // Xóa chi tiết cũ
//     await client.query("DELETE FROM chi_tiet_xuat WHERE phieu_xuat_id = $1", [
//       id,
//     ]);

//     // Thêm chi tiết mới
//     let tongTien = 0;
//     for (const item of chi_tiet) {
//       const thanhTien = item.so_luong_ke_hoach * item.don_gia;
//       tongTien += thanhTien;

//       await client.query(
//         `INSERT INTO chi_tiet_xuat (
//           phieu_xuat_id, hang_hoa_id, so_luong_ke_hoach, so_luong_thuc_xuat,
//           don_gia, thanh_tien, so_seri_xuat, pham_chat, ghi_chu
//         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
//         [
//           id,
//           item.hang_hoa_id,
//           item.so_luong_ke_hoach,
//           item.so_luong_thuc_xuat || item.so_luong_ke_hoach,
//           item.don_gia,
//           thanhTien,
//           item.so_seri_xuat || null,
//           item.pham_chat || "tot",
//           item.ghi_chu,
//         ]
//       );
//     }

//     // Cập nhật tổng tiền
//     await client.query("UPDATE phieu_xuat SET tong_tien = $1 WHERE id = $2", [
//       tongTien,
//       id,
//     ]);

//     await client.query("COMMIT");
//     sendResponse(res, 200, true, "Cập nhật phiếu xuất thành công");
//   } catch (error) {
//     await client.query("ROLLBACK");
//     console.error("Update phieu xuat error:", error);
//     sendResponse(res, 500, false, "Lỗi server");
//   } finally {
//     client.release();
//   }
// };

// Sửa function update trong xuatKhoController.js

const update = async (req, res, params, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;
    const {
      ngay_xuat,
      don_vi_nhan_id,
      phong_ban_nhan_id, // ✅ Thêm field này
      nguoi_nhan,
      so_quyet_dinh,
      ly_do_xuat,
      loai_xuat,
      ghi_chu,
      chi_tiet = [],
    } = body;

    // Kiểm tra phiếu tồn tại
    const phieuResult = await client.query(
      "SELECT * FROM phieu_xuat WHERE id = $1",
      [id]
    );

    if (phieuResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
    }

    const phieu = phieuResult.rows[0];

    if (user.role !== "admin" && phieu.nguoi_tao !== user.id) {
      await client.query("ROLLBACK");
      return sendResponse(res, 403, false, "Bạn không có quyền sửa phiếu này");
    }

    // Chỉ cho phép chỉnh sửa khi chưa hoàn thành
    if (!["draft", "revision_required"].includes(phieu.trang_thai)) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Không thể sửa phiếu đã được xử lý."
      );
    }

    // Validation chi tiết
    if (!chi_tiet || chi_tiet.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Cần có ít nhất một chi tiết hàng hóa"
      );
    }

    // Kiểm tra tồn kho cho các chi tiết mới
    for (const item of chi_tiet) {
      const tonKhoResult = await client.query(
        `SELECT tk.so_luong_ton 
         FROM ton_kho tk 
         WHERE tk.hang_hoa_id = $1 AND tk.phong_ban_id = $2`,
        [item.hang_hoa_id, phieu.phong_ban_id]
      );

      if (tonKhoResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          `Hàng hóa ID ${item.hang_hoa_id} không có trong kho`
        );
      }

      const tonKho = tonKhoResult.rows[0];

      // Tính số lượng đang chờ xuất từ các phiếu nhập khác (loại trừ phiếu hiện tại)
      const dangChoXuatResult = await client.query(
        `SELECT COALESCE(SUM(ctx.so_luong_yeu_cau), 0) as so_luong_dang_cho_xuat
         FROM chi_tiet_xuat ctx
         JOIN phieu_xuat px ON ctx.phieu_xuat_id = px.id
         WHERE ctx.hang_hoa_id = $1 
         AND px.phong_ban_id = $2
         AND px.trang_thai IN ('draft', 'confirmed')
         AND px.id != $3`,
        [item.hang_hoa_id, phieu.phong_ban_id, id]
      );

      const soLuongDangChoXuat =
        dangChoXuatResult.rows[0]?.so_luong_dang_cho_xuat || 0;
      const soLuongCoTheXuat = Math.max(
        0,
        tonKho.so_luong_ton - soLuongDangChoXuat
      );

      // ✅ Sửa tên field từ so_luong_ke_hoach thành so_luong_yeu_cau
      if (soLuongCoTheXuat < item.so_luong_yeu_cau) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          `Không đủ hàng có thể xuất cho hàng hóa ID ${item.hang_hoa_id}. ` +
            `Tồn kho: ${tonKho.so_luong_ton}, ` +
            `đang chờ xuất (phiếu khác): ${soLuongDangChoXuat}, ` +
            `có thể xuất: ${soLuongCoTheXuat}, ` +
            `yêu cầu: ${item.so_luong_yeu_cau}`
        );
      }
    }

    // Cập nhật thông tin phiếu
    await client.query(
      `UPDATE phieu_xuat 
       SET ngay_xuat = $1, 
           don_vi_nhan_id = $2, 
           phong_ban_nhan_id = $3,
           nguoi_nhan = $4, 
           so_quyet_dinh = $5, 
           ly_do_xuat = $6,
           loai_xuat = $7, 
           ghi_chu = $8, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9`,
      [
        ngay_xuat,
        don_vi_nhan_id,
        phong_ban_nhan_id, // ✅ Thêm field này
        nguoi_nhan,
        so_quyet_dinh || "",
        ly_do_xuat,
        loai_xuat,
        ghi_chu,
        id,
      ]
    );

    // Xóa chi tiết cũ
    await client.query("DELETE FROM chi_tiet_xuat WHERE phieu_xuat_id = $1", [
      id,
    ]);

    // Thêm chi tiết mới
    let tongTien = 0;
    for (const item of chi_tiet) {
      // ✅ Sửa tên field từ so_luong_ke_hoach thành so_luong_yeu_cau
      const thanhTien = item.so_luong_yeu_cau * item.don_gia;
      tongTien += thanhTien;

      await client.query(
        `INSERT INTO chi_tiet_xuat (
          phieu_xuat_id, hang_hoa_id, so_luong_yeu_cau, so_luong_thuc_xuat,
          don_gia, thanh_tien, so_seri_xuat, pham_chat, ghi_chu
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          item.hang_hoa_id,
          item.so_luong_yeu_cau, // ✅ Sửa tên field
          item.so_luong_thuc_xuat || item.so_luong_yeu_cau, // ✅ Sửa tên field
          item.don_gia,
          thanhTien,
          item.so_seri_xuat || null,
          item.pham_chat || "tot",
          item.ghi_chu,
        ]
      );
    }

    // Cập nhật tổng tiền
    await client.query("UPDATE phieu_xuat SET tong_tien = $1 WHERE id = $2", [
      tongTien,
      id,
    ]);

    await client.query("COMMIT");
    sendResponse(res, 200, true, "Cập nhật phiếu xuất thành công");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update phieu xuat error:", error);
    sendResponse(res, 500, false, "Lỗi server");
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
      "SELECT * FROM phieu_xuat WHERE id = $1",
      [id]
    );

    if (phieuResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
    }

    const phieu = phieuResult.rows[0];

    if (user.role !== "admin" && phieu.nguoi_tao !== user.id) {
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

    // Xóa phiếu (chi tiết sẽ tự động xóa theo CASCADE)
    await client.query("DELETE FROM phieu_xuat WHERE id = $1", [id]);

    await client.query("COMMIT");
    sendResponse(res, 200, true, "Xóa phiếu xuất thành công");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Delete phieu xuat error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

const cancel = async (req, res, params, user) => {
  try {
    const { id } = params;

    const phieu = await pool.query("SELECT * FROM phieu_xuat WHERE id = $1", [
      id,
    ]);

    if (phieu.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
    }

    if (phieu.rows[0].trang_thai === "completed") {
      return sendResponse(res, 400, false, "Không thể hủy phiếu đã hoàn thành");
    }

    await pool.query(
      `UPDATE phieu_xuat 
       SET trang_thai = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    sendResponse(res, 200, true, "Hủy phiếu xuất thành công");
  } catch (error) {
    console.error("Cancel phieu xuat error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

// Upload và download decision giữ nguyên
const uploadDecision = async (req, res, params, body, user, file) => {
  try {
    const { id } = params;
    const { ghi_chu_xac_nhan } = body;

    if (!file) {
      return sendResponse(res, 400, false, "Cần chọn file PDF quyết định");
    }

    const phieu = await pool.query("SELECT * FROM phieu_xuat WHERE id = $1", [
      id,
    ]);

    if (phieu.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
    }

    if (phieu.rows[0].trang_thai !== "approved") {
      return sendResponse(
        res,
        400,
        false,
        "Phiếu chưa được duyệt hoặc đã được xử lý"
      );
    }

    const decision_pdf_url = `/uploads/decisions/${file.filename}`;
    const decision_pdf_filename = file.originalname;

    await pool.query(
      `UPDATE phieu_xuat 
       SET decision_pdf_url = $1, 
           decision_pdf_filename = $2, 
           ghi_chu_xac_nhan = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [decision_pdf_url, decision_pdf_filename, ghi_chu_xac_nhan || "", id]
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

const downloadDecision = async (req, res, params, user) => {
  try {
    const { id } = params;

    const phieu = await pool.query(
      "SELECT decision_pdf_url, decision_pdf_filename FROM phieu_xuat WHERE id = $1",
      [id]
    );

    if (phieu.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
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

const checkTonKho = async (req, res, body, user) => {
  try {
    const { phong_ban_id, chi_tiet = [] } = body;

    if (!chi_tiet.length) {
      return sendResponse(res, 400, false, "Danh sách chi tiết trống");
    }

    const tonKhoResults = [];

    for (const item of chi_tiet) {
      const tonKhoResult = await pool.query(
        `SELECT tk.so_luong_ton, tk.don_gia_binh_quan, h.ten_hang_hoa, h.ma_hang_hoa
         FROM ton_kho tk
         JOIN hang_hoa h ON tk.hang_hoa_id = h.id
         WHERE tk.hang_hoa_id = $1 AND tk.phong_ban_id = $2`,
        [item.hang_hoa_id, phong_ban_id || user.phong_ban_id]
      );

      const tonKho = tonKhoResult.rows[0] || {
        so_luong_ton: 0,
        don_gia_binh_quan: 0,
        ten_hang_hoa: "Không xác định",
        ma_hang_hoa: "Không xác định",
      };

      tonKhoResults.push({
        hang_hoa_id: item.hang_hoa_id,
        so_luong_yeu_cau: item.so_luong_yeu_cau || item.so_luong_ke_hoach,
        so_luong_ton: tonKho.so_luong_ton,
        don_gia_binh_quan: tonKho.don_gia_binh_quan,
        ten_hang_hoa: tonKho.ten_hang_hoa,
        ma_hang_hoa: tonKho.ma_hang_hoa,
        co_the_xuat:
          tonKho.so_luong_ton >=
          (item.so_luong_yeu_cau || item.so_luong_ke_hoach),
      });
    }

    sendResponse(res, 200, true, "Kiểm tra tồn kho thành công", {
      ton_kho: tonKhoResults,
    });
  } catch (error) {
    console.error("Check ton kho error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

// const getPhongBanList = async (req, res, query, user) => {
//   try {
//     let whereClause = "WHERE pb.trang_thai = 'active'";
//     const params = [];
//     let paramCount = 0;

//     // Phân quyền theo cấp bậc
//     if (user.role === "admin" && user.phong_ban?.cap_bac === 1) {
//       // Admin cấp 1: xem tất cả phòng ban
//       // Không cần điều kiện thêm
//     } else if (user.phong_ban?.cap_bac === 2) {
//       // Cấp 2: chỉ xem phòng ban cấp 3 thuộc quyền quản lý
//       paramCount++;
//       whereClause += ` AND pb.cap_bac = 3 AND pb.phong_ban_cha_id = $${paramCount}`;
//       params.push(user.phong_ban_id);
//     } else {
//       // Cấp 3: chỉ xem chính phòng ban của mình
//       paramCount++;
//       whereClause += ` AND pb.id = $${paramCount}`;
//       params.push(user.phong_ban_id);
//     }

//     const query = `
//       SELECT pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac,
//              pb.phong_ban_cha_id,
//              pb_cha.ten_phong_ban as ten_phong_ban_cha
//       FROM phong_ban pb
//       LEFT JOIN phong_ban pb_cha ON pb.phong_ban_cha_id = pb_cha.id
//       ${whereClause}
//       ORDER BY pb.cap_bac ASC, pb.ten_phong_ban ASC
//     `;

//     const result = await pool.query(query, params);

//     sendResponse(
//       res,
//       200,
//       true,
//       "Lấy danh sách phòng ban thành công",
//       result.rows
//     );
//   } catch (error) {
//     console.error("Get phong ban list error:", error);
//     sendResponse(res, 500, false, "Lỗi server");
//   }
// };

// const getList = async (req, res, query, user) => {
//   try {
//     const {
//       page = 1,
//       limit = 20,
//       search,
//       tu_ngay,
//       den_ngay,
//       trang_thai,
//       loai_xuat,
//       don_vi_nhan_id,
//       phong_ban_filter, // Thêm filter mới
//       sort_by = "created_at",
//       sort_direction = "desc",
//     } = query;

//     const offset = (page - 1) * limit;
//     let whereClause = "WHERE 1=1";
//     const params = [];
//     let paramCount = 0;

//     // Tìm kiếm theo số quyết định, tên đơn vị nhận và phòng ban nhận
//     if (search && search.trim()) {
//       paramCount++;
//       whereClause += ` AND (
//         px.so_quyet_dinh ILIKE $${paramCount} OR
//         dvn.ten_don_vi ILIKE $${paramCount} OR
//         pb_nhan.ten_phong_ban ILIKE $${paramCount}
//       )`;
//       params.push(`%${search.trim()}%`);
//     }

//     // Lọc theo ngày
//     if (tu_ngay && den_ngay) {
//       paramCount += 2;
//       whereClause += ` AND px.ngay_xuat BETWEEN $${
//         paramCount - 1
//       } AND $${paramCount}`;
//       params.push(tu_ngay, den_ngay);
//     }

//     // Lọc theo trạng thái
//     if (trang_thai) {
//       paramCount++;
//       whereClause += ` AND px.trang_thai = $${paramCount}`;
//       params.push(trang_thai);
//     }

//     // Lọc theo loại xuất
//     if (loai_xuat) {
//       paramCount++;
//       whereClause += ` AND px.loai_xuat = $${paramCount}`;
//       params.push(loai_xuat);
//     }

//     // Lọc theo đơn vị nhận
//     if (don_vi_nhan_id) {
//       paramCount++;
//       whereClause += ` AND px.don_vi_nhan_id = $${paramCount}`;
//       params.push(don_vi_nhan_id);
//     }

//     // Xử lý filter theo phòng ban
//     if (phong_ban_filter && phong_ban_filter !== "all") {
//       paramCount++;
//       whereClause += ` AND px.phong_ban_id = $${paramCount}`;
//       params.push(phong_ban_filter);
//     } else {
//       // Phân quyền mặc định theo cấp bậc
//       if (user.role !== "admin") {
//         // Nếu là cấp 2, có thể xem phiếu của cấp 3 thuộc quyền
//         if (user.phong_ban?.cap_bac === 2) {
//           const phongBanCap3Result = await pool.query(
//             "SELECT id FROM phong_ban WHERE phong_ban_cha_id = $1 AND trang_thai = 'active'",
//             [user.phong_ban_id]
//           );

//           const phongBanIds = [
//             user.phong_ban_id,
//             ...phongBanCap3Result.rows.map((pb) => pb.id),
//           ];
//           paramCount++;
//           whereClause += ` AND (px.phong_ban_id = ANY($${paramCount}::int[]) OR px.phong_ban_nhan_id = ANY($${paramCount}::int[]))`;
//           params.push(phongBanIds);
//         } else {
//           // Cấp 3 chỉ xem của chính mình hoặc nhận từ cấp trên
//           paramCount++;
//           whereClause += ` AND (px.phong_ban_id = $${paramCount} OR px.phong_ban_nhan_id = $${paramCount})`;
//           params.push(user.phong_ban_id);
//         }
//       } else {
//         // Admin cấp 1: nếu không chọn filter cụ thể, mặc định hiển thị phiếu của cấp 1
//         if (user.phong_ban?.cap_bac === 1) {
//           paramCount++;
//           whereClause += ` AND px.phong_ban_id = $${paramCount}`;
//           params.push(user.phong_ban_id);
//         }
//       }
//     }

//     // Xử lý sắp xếp
//     const validSortFields = {
//       so_phieu: "px.so_phieu",
//       so_quyet_dinh: "px.so_quyet_dinh",
//       ngay_xuat: "px.ngay_xuat",
//       tong_tien: "px.tong_tien",
//       created_at: "px.created_at",
//     };

//     const sortField = validSortFields[sort_by] || "px.created_at";
//     const sortDir = sort_direction.toLowerCase() === "asc" ? "ASC" : "DESC";
//     const orderClause = `ORDER BY ${sortField} ${sortDir}`;

//     const countQuery = `
//       SELECT COUNT(*)
//       FROM phieu_xuat px
//       LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id
//       LEFT JOIN phong_ban pb_nhan ON px.phong_ban_nhan_id = pb_nhan.id
//       ${whereClause}
//     `;

//     const dataQuery = `
//       SELECT px.*,
//              dvn.id as dvn_id, dvn.ma_don_vi, dvn.ten_don_vi, dvn.loai_don_vi,
//              pb_nhan.id as pb_nhan_id, pb_nhan.ten_phong_ban as ten_pb_nhan, pb_nhan.cap_bac as cap_bac_nhan,
//              u.id as nguoi_tao_id, u.ho_ten as nguoi_tao_ten,
//              u2.id as nguoi_duyet_id, u2.ho_ten as nguoi_duyet_ten,
//              pb.ten_phong_ban,
//              px.decision_pdf_url,
//              px.decision_pdf_filename,
//              px.ghi_chu_xac_nhan,
//              px.ghi_chu_phan_hoi,
//              -- Thông tin phiếu nhập liên kết
//              pn.id as phieu_nhap_lien_ket_id_ref,
//              pn.so_phieu as so_phieu_nhap_lien_ket,
//              pn.trang_thai as trang_thai_phieu_nhap_lien_ket
//       FROM phieu_xuat px
//       LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id
//       LEFT JOIN phong_ban pb_nhan ON px.phong_ban_nhan_id = pb_nhan.id
//       LEFT JOIN users u ON px.nguoi_tao = u.id
//       LEFT JOIN users u2 ON px.nguoi_duyet = u2.id
//       LEFT JOIN phong_ban pb ON px.phong_ban_id = pb.id
//       LEFT JOIN phieu_nhap pn ON px.phieu_nhap_lien_ket_id = pn.id
//       ${whereClause}
//       ${orderClause}
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
//       don_vi_nhan: item.dvn_id
//         ? {
//             id: item.dvn_id,
//             ma_don_vi: item.ma_don_vi,
//             ten_don_vi: item.ten_don_vi,
//             loai_don_vi: item.loai_don_vi,
//           }
//         : null,
//       phong_ban_nhan: item.pb_nhan_id
//         ? {
//             id: item.pb_nhan_id,
//             ten_phong_ban: item.ten_pb_nhan,
//             cap_bac: item.cap_bac_nhan,
//           }
//         : null,
//       user_tao: item.nguoi_tao_id
//         ? {
//             id: item.nguoi_tao_id,
//             ho_ten: item.nguoi_tao_ten,
//           }
//         : null,
//       user_duyet: item.nguoi_duyet_id
//         ? {
//             id: item.nguoi_duyet_id,
//             ho_ten: item.nguoi_duyet_ten,
//           }
//         : null,
//       phieu_nhap_lien_ket: item.phieu_nhap_lien_ket_id_ref
//         ? {
//             id: item.phieu_nhap_lien_ket_id_ref,
//             so_phieu: item.so_phieu_nhap_lien_ket,
//             trang_thai: item.trang_thai_phieu_nhap_lien_ket,
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
//     console.error("Get phieu xuat error:", error);
//     sendResponse(res, 500, false, "Lỗi server");
//   }
// };

const getPhongBanList = async (req, res, query, user) => {
  try {
    let whereClause = "WHERE pb.is_active = true";
    const params = [];
    let paramCount = 0;

    console.log("🏢 GetPhongBanList - User info:", {
      role: user.role,
      phong_ban_id: user.phong_ban_id,
      cap_bac: user.phong_ban?.cap_bac,
    });

    // Phân quyền theo cấp bậc - GIỐNG NHẬP KHO
    if (user.role === "admin" && user.phong_ban?.cap_bac === 1) {
      // Admin cấp 1: Lấy TẤT CẢ phòng ban cấp 2 và 3 (không bao gồm chính mình)
      console.log("🔥 Admin cấp 1 - lấy phòng ban cấp 2,3");
      whereClause += ` AND pb.cap_bac IN (2, 3)`;
    } else if (user.phong_ban?.cap_bac === 2) {
      // Cấp 2: Lấy các đơn vị cấp 3 thuộc quyền quản lý
      console.log("🔥 Cấp 2 - lấy phòng ban cấp 3 thuộc quyền");
      paramCount++;
      whereClause += ` AND pb.cap_bac = 3 AND pb.phong_ban_cha_id = $${paramCount}`;
      params.push(user.phong_ban_id);
    } else {
      // Cấp 3: Không trả về gì (không có dropdown)
      console.log("🔥 Cấp 3 - không có dropdown");
      return sendResponse(res, 200, true, "Cấp 3 không có dropdown", []);
    }

    const queryStr = `
      SELECT pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac,
             pb.phong_ban_cha_id,
             pb_cha.ten_phong_ban as ten_phong_ban_cha
      FROM phong_ban pb
      LEFT JOIN phong_ban pb_cha ON pb.phong_ban_cha_id = pb_cha.id
      ${whereClause}
      ORDER BY pb.cap_bac ASC, pb.ten_phong_ban ASC
    `;

    console.log("🔍 Query:", queryStr);
    console.log("🔍 Params:", params);

    const result = await pool.query(queryStr, params);

    console.log("📊 Result:", result.rows);

    sendResponse(
      res,
      200,
      true,
      "Lấy danh sách phòng ban thành công",
      result.rows
    );
  } catch (error) {
    console.error("Get phong ban list error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

const getList = async (req, res, query, user) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      tu_ngay,
      den_ngay,
      trang_thai,
      loai_xuat,
      don_vi_nhan_id,
      phong_ban_filter = "own",
      sort_by = "created_at",
      sort_direction = "desc",
    } = query;

    const offset = (page - 1) * limit;
    let whereClause = "WHERE 1=1";
    const params = [];
    let paramCount = 0;

    if (search && search.trim()) {
      paramCount++;
      whereClause += ` AND (
        px.so_quyet_dinh ILIKE $${paramCount} OR 
        px.so_phieu ILIKE $${paramCount} OR
        COALESCE(dvn.ten_don_vi, '') ILIKE $${paramCount} OR
        COALESCE(pb_nhan.ten_phong_ban, '') ILIKE $${paramCount}
      )`;
      params.push(`%${search.trim()}%`);
    }

    if (tu_ngay && den_ngay) {
      paramCount++;
      paramCount++;
      whereClause += ` AND px.ngay_xuat BETWEEN $${
        paramCount - 1
      } AND $${paramCount}`;
      params.push(tu_ngay, den_ngay);
    }

    if (trang_thai) {
      paramCount++;
      whereClause += ` AND px.trang_thai = $${paramCount}`;
      params.push(trang_thai);
    }

    if (loai_xuat) {
      paramCount++;
      whereClause += ` AND px.loai_xuat = $${paramCount}`;
      params.push(loai_xuat);
    }

    if (don_vi_nhan_id) {
      paramCount++;
      whereClause += ` AND px.don_vi_nhan_id = $${paramCount}`;
      params.push(don_vi_nhan_id);
    }

    // ✅ XỬ LÝ FILTER THEO PHÒNG BAN - GIỐNG NHẬP KHO
    console.log("🏢 Filter logic for XuatKho:", {
      user_role: user.role,
      user_cap_bac: user.phong_ban?.cap_bac,
      user_phong_ban_id: user.phong_ban_id,
      phong_ban_filter,
    });

    if (user.role === "admin" && user.phong_ban?.cap_bac === 1) {
      if (phong_ban_filter === "own") {
        paramCount++;
        whereClause += ` AND px.phong_ban_id = $${paramCount}`;
        params.push(user.phong_ban_id);
      } else if (phong_ban_filter !== "all") {
        paramCount++;
        whereClause += ` AND px.phong_ban_id = $${paramCount}`;
        params.push(phong_ban_filter);
      }
    } else if (user.phong_ban?.cap_bac === 2) {
      if (phong_ban_filter === "own") {
        paramCount++;
        whereClause += ` AND px.phong_ban_id = $${paramCount}`;
        params.push(user.phong_ban_id);
      } else if (phong_ban_filter !== "all") {
        paramCount++;
        whereClause += ` AND px.phong_ban_id = $${paramCount}`;
        params.push(phong_ban_filter);
      } else {
        const phongBanCap3Result = await pool.query(
          "SELECT id FROM phong_ban WHERE phong_ban_cha_id = $1 AND is_active = true",
          [user.phong_ban_id]
        );
        const phongBanIds = [
          user.phong_ban_id,
          ...phongBanCap3Result.rows.map((pb) => pb.id),
        ];
        paramCount++;
        // Xem phiếu do mình hoặc cấp dưới tạo, HOẶC phiếu mình hoặc cấp dưới nhận
        whereClause += ` AND (px.phong_ban_id = ANY($${paramCount}::int[]) OR px.phong_ban_nhan_id = ANY($${paramCount}::int[]))`;
        params.push(phongBanIds);
      }
    } else {
      // Cấp 3: chỉ xem phiếu của chính mình (tạo hoặc nhận)
      paramCount++;
      whereClause += ` AND (px.phong_ban_id = $${paramCount} OR px.phong_ban_nhan_id = $${paramCount})`;
      params.push(user.phong_ban_id);
    }

    const validSortFields = {
      so_quyet_dinh: "px.so_quyet_dinh",
      ngay_xuat: "px.ngay_xuat",
      tong_tien: "px.tong_tien",
      created_at: "px.created_at",
    };
    const sortField = validSortFields[sort_by] || "px.created_at";
    const sortDir = sort_direction.toLowerCase() === "asc" ? "ASC" : "DESC";
    const orderClause = `ORDER BY ${sortField} ${sortDir}`;

    const countQuery = `SELECT COUNT(*) FROM phieu_xuat px LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id LEFT JOIN phong_ban pb_nhan ON px.phong_ban_nhan_id = pb_nhan.id ${whereClause}`;
    const dataQuery = `SELECT px.*, dvn.id as dvn_id, dvn.ma_don_vi, dvn.ten_don_vi, dvn.loai_don_vi, pb_nhan.id as pb_nhan_id, pb_nhan.ten_phong_ban as ten_pb_nhan, pb_nhan.cap_bac as cap_bac_nhan, u.id as nguoi_tao_id, u.ho_ten as nguoi_tao_ten, u2.id as nguoi_duyet_id, u2.ho_ten as nguoi_duyet_ten, pb.ten_phong_ban, px.decision_pdf_url, px.decision_pdf_filename, px.ghi_chu_xac_nhan, px.ghi_chu_phan_hoi, pn.id as phieu_nhap_lien_ket_id_ref, pn.so_phieu as so_phieu_nhap_lien_ket, pn.trang_thai as trang_thai_phieu_nhap_lien_ket FROM phieu_xuat px LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id LEFT JOIN phong_ban pb_nhan ON px.phong_ban_nhan_id = pb_nhan.id LEFT JOIN users u ON px.nguoi_tao = u.id LEFT JOIN users u2 ON px.nguoi_duyet = u2.id LEFT JOIN phong_ban pb ON px.phong_ban_id = pb.id LEFT JOIN phieu_nhap pn ON px.phieu_nhap_lien_ket_id = pn.id ${whereClause} ${orderClause} LIMIT $${
      paramCount + 1
    } OFFSET $${paramCount + 2}`;

    params.push(limit, offset);

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, params.slice(0, -2)),
      pool.query(dataQuery, params),
    ]);

    const total = parseInt(countResult.rows[0].count);
    const pages = Math.ceil(total / limit);
    const structuredItems = dataResult.rows.map((item) => ({
      ...item,
      don_vi_nhan: item.dvn_id
        ? {
            id: item.dvn_id,
            ma_don_vi: item.ma_don_vi,
            ten_don_vi: item.ten_don_vi,
            loai_don_vi: item.loai_don_vi,
          }
        : null,
      phong_ban_nhan: item.pb_nhan_id
        ? {
            id: item.pb_nhan_id,
            ten_phong_ban: item.ten_pb_nhan,
            cap_bac: item.cap_bac_nhan,
          }
        : null,
      user_tao: item.nguoi_tao_id
        ? { id: item.nguoi_tao_id, ho_ten: item.nguoi_tao_ten }
        : null,
      user_duyet: item.nguoi_duyet_id
        ? { id: item.nguoi_duyet_id, ho_ten: item.nguoi_duyet_ten }
        : null,
      phieu_nhap_lien_ket: item.phieu_nhap_lien_ket_id_ref
        ? {
            id: item.phieu_nhap_lien_ket_id_ref,
            so_phieu: item.so_phieu_nhap_lien_ket,
            trang_thai: item.trang_thai_phieu_nhap_lien_ket,
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
    console.error("Get phieu xuat error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};
module.exports = {
  getList,
  getDetail,
  create,
  update,
  delete: deletePhieu,
  submit,
  approve,
  requestRevision,
  complete,
  cancel,
  checkTonKho,
  uploadDecision,
  downloadDecision,
  checkTonKhoThucTe,
  updateActualQuantity,
  getPhongBanNhanHang,
  getPhongBanList,
};
