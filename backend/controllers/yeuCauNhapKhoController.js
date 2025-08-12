// controllers/yeuCauNhapKhoController.js
const pool = require("../config/database");
const { sendResponse } = require("../utils/response");

// Lấy danh sách yêu cầu nhập kho
const getList = async (req, res, query, user) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      tu_ngay,
      den_ngay,
      trang_thai,
      muc_do_uu_tien,
      don_vi_yeu_cau_id,
      sort_by = "created_at",
      sort_direction = "desc",
    } = query;

    const offset = (page - 1) * limit;
    let whereClause = "WHERE 1=1";
    const params = [];
    let paramCount = 0;

    // Tìm kiếm theo số yêu cầu hoặc lý do
    if (search && search.trim()) {
      paramCount++;
      whereClause += ` AND (
        ycn.so_yeu_cau ILIKE $${paramCount} OR 
        ycn.ly_do_yeu_cau ILIKE $${paramCount}
      )`;
      params.push(`%${search.trim()}%`);
    }

    // Lọc theo ngày
    if (tu_ngay && den_ngay) {
      paramCount += 2;
      whereClause += ` AND ycn.ngay_yeu_cau BETWEEN $${
        paramCount - 1
      } AND $${paramCount}`;
      params.push(tu_ngay, den_ngay);
    }

    // Lọc theo trạng thái
    if (trang_thai) {
      paramCount++;
      whereClause += ` AND ycn.trang_thai = $${paramCount}`;
      params.push(trang_thai);
    }

    // Lọc theo mức độ ưu tiên
    if (muc_do_uu_tien) {
      paramCount++;
      whereClause += ` AND ycn.muc_do_uu_tien = $${paramCount}`;
      params.push(muc_do_uu_tien);
    }

    // Lọc theo đơn vị yêu cầu
    if (don_vi_yeu_cau_id) {
      paramCount++;
      whereClause += ` AND ycn.don_vi_yeu_cau_id = $${paramCount}`;
      params.push(don_vi_yeu_cau_id);
    }

    // Phân quyền theo vai trò
    if (user.role !== "admin") {
      // User thường chỉ xem yêu cầu của phòng ban mình hoặc yêu cầu mình tạo
      paramCount++;
      whereClause += ` AND (ycn.don_vi_yeu_cau_id = $${paramCount} OR ycn.nguoi_yeu_cau = $${
        paramCount + 1
      })`;
      params.push(user.phong_ban_id, user.id);
      paramCount++;
    }

    // Xử lý sắp xếp
    const validSortFields = {
      so_yeu_cau: "ycn.so_yeu_cau",
      ngay_yeu_cau: "ycn.ngay_yeu_cau",
      trang_thai: "ycn.trang_thai",
      muc_do_uu_tien: "ycn.muc_do_uu_tien",
      tong_gia_tri: "ycn.tong_gia_tri_uoc_tinh",
      created_at: "ycn.created_at",
    };

    const sortField = validSortFields[sort_by] || "ycn.created_at";
    const sortDir = sort_direction.toLowerCase() === "asc" ? "ASC" : "DESC";
    const orderClause = `ORDER BY ${sortField} ${sortDir}`;

    // Query đếm tổng số
    const countQuery = `
      SELECT COUNT(*) 
      FROM yeu_cau_nhap_kho ycn 
      LEFT JOIN phong_ban pb_yc ON ycn.don_vi_yeu_cau_id = pb_yc.id
      ${whereClause}
    `;

    // Query lấy dữ liệu
    const dataQuery = `
      SELECT 
        ycn.*,
        pb_yc.id as don_vi_yeu_cau_id_ref,
        pb_yc.ten_phong_ban as ten_don_vi_yeu_cau,
        u_yc.id as nguoi_yeu_cau_id_ref,
        u_yc.ho_ten as ten_nguoi_yeu_cau,
        u_duyet.id as nguoi_duyet_id_ref,
        u_duyet.ho_ten as ten_nguoi_duyet,
        pn.id as phieu_nhap_id_ref,
        pn.so_phieu as so_phieu_nhap
      FROM yeu_cau_nhap_kho ycn
      LEFT JOIN phong_ban pb_yc ON ycn.don_vi_yeu_cau_id = pb_yc.id
      LEFT JOIN users u_yc ON ycn.nguoi_yeu_cau = u_yc.id
      LEFT JOIN users u_duyet ON ycn.nguoi_duyet = u_duyet.id
      LEFT JOIN phieu_nhap pn ON ycn.phieu_nhap_id = pn.id
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

    // Cấu trúc lại dữ liệu
    const structuredItems = dataResult.rows.map((item) => ({
      ...item,
      don_vi_yeu_cau: item.don_vi_yeu_cau_id_ref
        ? {
            id: item.don_vi_yeu_cau_id_ref,
            ten_phong_ban: item.ten_don_vi_yeu_cau,
          }
        : null,
      nguoi_yeu_cau_info: item.nguoi_yeu_cau_id_ref
        ? {
            id: item.nguoi_yeu_cau_id_ref,
            ho_ten: item.ten_nguoi_yeu_cau,
          }
        : null,
      nguoi_duyet_info: item.nguoi_duyet_id_ref
        ? {
            id: item.nguoi_duyet_id_ref,
            ho_ten: item.ten_nguoi_duyet,
          }
        : null,
      phieu_nhap_info: item.phieu_nhap_id_ref
        ? {
            id: item.phieu_nhap_id_ref,
            so_phieu: item.so_phieu_nhap,
          }
        : null,
    }));

    sendResponse(res, 200, true, "Lấy danh sách yêu cầu nhập kho thành công", {
      items: structuredItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages,
      },
    });
  } catch (error) {
    console.error("Get yeu cau nhap kho list error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

// Lấy chi tiết yêu cầu nhập kho
const getDetail = async (req, res, params, user) => {
  try {
    const { id } = params;

    const detailQuery = `
      SELECT 
        ycn.*,
        pb_yc.ten_phong_ban as ten_don_vi_yeu_cau,
        u_yc.ho_ten as ten_nguoi_yeu_cau,
        u_yc.email as email_nguoi_yeu_cau,
        u_duyet.ho_ten as ten_nguoi_duyet,
        pn.so_phieu as so_phieu_nhap,
        pn.trang_thai as trang_thai_phieu_nhap
      FROM yeu_cau_nhap_kho ycn
      LEFT JOIN phong_ban pb_yc ON ycn.don_vi_yeu_cau_id = pb_yc.id
      LEFT JOIN users u_yc ON ycn.nguoi_yeu_cau = u_yc.id
      LEFT JOIN users u_duyet ON ycn.nguoi_duyet = u_duyet.id
      LEFT JOIN phieu_nhap pn ON ycn.phieu_nhap_id = pn.id
      WHERE ycn.id = $1
    `;

    const chiTietQuery = `
      SELECT 
        ct.*,
        h.ma_hang_hoa,
        h.ten_hang_hoa,
        h.don_vi_tinh,
        h.gia_nhap_gan_nhat,
        lhh.ten_loai as ten_loai_hang_hoa
      FROM chi_tiet_yeu_cau_nhap ct
      JOIN hang_hoa h ON ct.hang_hoa_id = h.id
      LEFT JOIN loai_hang_hoa lhh ON h.loai_hang_hoa_id = lhh.id
      WHERE ct.yeu_cau_nhap_id = $1
      ORDER BY ct.id
    `;

    const workflowQuery = `
      SELECT 
        wa.*,
        u.ho_ten as ten_nguoi_duyet,
        pb.ten_phong_ban as ten_phong_ban_duyet
      FROM workflow_approvals wa
      LEFT JOIN users u ON wa.nguoi_duyet = u.id
      LEFT JOIN phong_ban pb ON wa.phong_ban_duyet = pb.id
      WHERE wa.yeu_cau_id = $1 AND wa.loai_yeu_cau = 'nhap_kho'
      ORDER BY wa.step_number, wa.created_at
    `;

    const [yeuCauResult, chiTietResult, workflowResult] = await Promise.all([
      pool.query(detailQuery, [id]),
      pool.query(chiTietQuery, [id]),
      pool.query(workflowQuery, [id]),
    ]);

    if (yeuCauResult.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy yêu cầu nhập kho");
    }

    const yeuCauData = yeuCauResult.rows[0];

    // Kiểm tra quyền xem
    if (user.role !== "admin") {
      const hasPermission =
        yeuCauData.don_vi_yeu_cau_id === user.phong_ban_id ||
        yeuCauData.nguoi_yeu_cau === user.id;

      if (!hasPermission) {
        return sendResponse(
          res,
          403,
          false,
          "Bạn không có quyền xem yêu cầu này"
        );
      }
    }

    // Cấu trúc dữ liệu response
    const response = {
      ...yeuCauData,
      chi_tiet: chiTietResult.rows.map((item) => ({
        ...item,
        hang_hoa: {
          id: item.hang_hoa_id,
          ma_hang_hoa: item.ma_hang_hoa,
          ten_hang_hoa: item.ten_hang_hoa,
          don_vi_tinh: item.don_vi_tinh,
          gia_nhap_gan_nhat: item.gia_nhap_gan_nhat,
          ten_loai_hang_hoa: item.ten_loai_hang_hoa,
        },
      })),
      workflow_history: workflowResult.rows,
    };

    sendResponse(res, 200, true, "Lấy chi tiết yêu cầu thành công", response);
  } catch (error) {
    console.error("Get yeu cau nhap kho detail error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

// Tạo yêu cầu nhập kho mới
const create = async (req, res, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      ngay_yeu_cau = new Date().toISOString().split("T")[0],
      ngay_can_hang,
      ly_do_yeu_cau,
      muc_do_uu_tien = "binh_thuong",
      don_vi_yeu_cau_id,
      ghi_chu,
      file_dinh_kem_url,
      file_dinh_kem_name,
      chi_tiet = [],
    } = body;

    // Validation
    if (!ly_do_yeu_cau || !chi_tiet.length) {
      await client.query("ROLLBACK");
      return sendResponse(res, 400, false, "Thiếu thông tin bắt buộc");
    }

    // Kiểm tra ngày cần hàng
    if (ngay_can_hang && new Date(ngay_can_hang) < new Date(ngay_yeu_cau)) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Ngày cần hàng không thể trước ngày yêu cầu"
      );
    }

    // Validate chi tiết
    for (let i = 0; i < chi_tiet.length; i++) {
      const item = chi_tiet[i];
      if (
        !item.hang_hoa_id ||
        !item.so_luong_yeu_cau ||
        item.so_luong_yeu_cau <= 0
      ) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          `Chi tiết dòng ${i + 1} không hợp lệ`
        );
      }
    }

    // Tạo yêu cầu nhập kho
    const yeuCauResult = await client.query(
      `INSERT INTO yeu_cau_nhap_kho (
        ngay_yeu_cau, ngay_can_hang, ly_do_yeu_cau, muc_do_uu_tien,
        don_vi_yeu_cau_id, nguoi_yeu_cau, ghi_chu, 
        file_dinh_kem_url, file_dinh_kem_name, trang_thai
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft')
      RETURNING *`,
      [
        ngay_yeu_cau,
        ngay_can_hang,
        ly_do_yeu_cau,
        muc_do_uu_tien,
        don_vi_yeu_cau_id || user.phong_ban_id,
        user.id,
        ghi_chu,
        file_dinh_kem_url,
        file_dinh_kem_name,
      ]
    );

    const yeuCau = yeuCauResult.rows[0];

    // Tạo chi tiết yêu cầu
    for (const item of chi_tiet) {
      await client.query(
        `INSERT INTO chi_tiet_yeu_cau_nhap (
          yeu_cau_nhap_id, hang_hoa_id, so_luong_yeu_cau, 
          don_gia_uoc_tinh, ly_do_su_dung, ghi_chu
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          yeuCau.id,
          item.hang_hoa_id,
          item.so_luong_yeu_cau,
          item.don_gia_uoc_tinh || 0,
          item.ly_do_su_dung,
          item.ghi_chu,
        ]
      );
    }

    await client.query("COMMIT");

    sendResponse(res, 201, true, "Tạo yêu cầu nhập kho thành công", {
      id: yeuCau.id,
      so_yeu_cau: yeuCau.so_yeu_cau,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create yeu cau nhap kho error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

// Cập nhật yêu cầu nhập kho
const update = async (req, res, params, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;
    const {
      ngay_yeu_cau,
      ngay_can_hang,
      ly_do_yeu_cau,
      muc_do_uu_tien,
      ghi_chu,
      file_dinh_kem_url,
      file_dinh_kem_name,
      chi_tiet = [],
    } = body;

    // Kiểm tra yêu cầu tồn tại và quyền chỉnh sửa
    const yeuCauResult = await client.query(
      "SELECT * FROM yeu_cau_nhap_kho WHERE id = $1",
      [id]
    );

    if (yeuCauResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "Không tìm thấy yêu cầu");
    }

    const yeuCau = yeuCauResult.rows[0];

    // Kiểm tra quyền chỉnh sửa
    if (user.role !== "admin") {
      const hasPermission =
        yeuCau.nguoi_yeu_cau === user.id ||
        yeuCau.don_vi_yeu_cau_id === user.phong_ban_id;

      if (!hasPermission) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          403,
          false,
          "Bạn không có quyền chỉnh sửa yêu cầu này"
        );
      }
    }

    // Chỉ cho phép chỉnh sửa khi ở trạng thái draft hoặc submitted
    if (!["draft", "submitted"].includes(yeuCau.trang_thai)) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Không thể chỉnh sửa yêu cầu đã được xử lý"
      );
    }

    // Cập nhật thông tin yêu cầu
    await client.query(
      `UPDATE yeu_cau_nhap_kho SET
        ngay_yeu_cau = $1, ngay_can_hang = $2, ly_do_yeu_cau = $3,
        muc_do_uu_tien = $4, ghi_chu = $5, file_dinh_kem_url = $6,
        file_dinh_kem_name = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8`,
      [
        ngay_yeu_cau,
        ngay_can_hang,
        ly_do_yeu_cau,
        muc_do_uu_tien,
        ghi_chu,
        file_dinh_kem_url,
        file_dinh_kem_name,
        id,
      ]
    );

    // Xóa và tạo lại chi tiết
    await client.query(
      "DELETE FROM chi_tiet_yeu_cau_nhap WHERE yeu_cau_nhap_id = $1",
      [id]
    );

    for (const item of chi_tiet) {
      await client.query(
        `INSERT INTO chi_tiet_yeu_cau_nhap (
          yeu_cau_nhap_id, hang_hoa_id, so_luong_yeu_cau,
          don_gia_uoc_tinh, ly_do_su_dung, ghi_chu
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          item.hang_hoa_id,
          item.so_luong_yeu_cau,
          item.don_gia_uoc_tinh || 0,
          item.ly_do_su_dung,
          item.ghi_chu,
        ]
      );
    }

    await client.query("COMMIT");
    sendResponse(res, 200, true, "Cập nhật yêu cầu thành công");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update yeu cau nhap kho error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

// Gửi yêu cầu (chuyển từ draft sang submitted)
const submit = async (req, res, params, user) => {
  try {
    const { id } = params;

    // Kiểm tra yêu cầu và quyền
    const yeuCauResult = await pool.query(
      "SELECT * FROM yeu_cau_nhap_kho WHERE id = $1",
      [id]
    );

    if (yeuCauResult.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy yêu cầu");
    }

    const yeuCau = yeuCauResult.rows[0];

    if (yeuCau.nguoi_yeu_cau !== user.id && user.role !== "admin") {
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền thực hiện hành động này"
      );
    }

    if (yeuCau.trang_thai !== "draft") {
      return sendResponse(
        res,
        400,
        false,
        "Chỉ có thể gửi yêu cầu ở trạng thái nháp"
      );
    }

    // Kiểm tra có chi tiết hay không
    const chiTietCount = await pool.query(
      "SELECT COUNT(*) FROM chi_tiet_yeu_cau_nhap WHERE yeu_cau_nhap_id = $1",
      [id]
    );

    if (parseInt(chiTietCount.rows[0].count) === 0) {
      return sendResponse(
        res,
        400,
        false,
        "Yêu cầu phải có ít nhất một mặt hàng"
      );
    }

    // Cập nhật trạng thái
    await pool.query(
      "UPDATE yeu_cau_nhap_kho SET trang_thai = 'submitted', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );

    sendResponse(res, 200, true, "Gửi yêu cầu thành công");
  } catch (error) {
    console.error("Submit yeu cau error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

// Xóa yêu cầu
const deleteYeuCau = async (req, res, params, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;

    const yeuCauResult = await client.query(
      "SELECT * FROM yeu_cau_nhap_kho WHERE id = $1",
      [id]
    );

    if (yeuCauResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "Không tìm thấy yêu cầu");
    }

    const yeuCau = yeuCauResult.rows[0];

    // Kiểm tra quyền xóa
    if (user.role !== "admin" && yeuCau.nguoi_yeu_cau !== user.id) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền xóa yêu cầu này"
      );
    }

    // Chỉ cho phép xóa ở trạng thái draft
    if (yeuCau.trang_thai !== "draft") {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Chỉ có thể xóa yêu cầu ở trạng thái nháp"
      );
    }

    // Xóa yêu cầu (chi tiết sẽ tự động xóa theo CASCADE)
    await client.query("DELETE FROM yeu_cau_nhap_kho WHERE id = $1", [id]);

    await client.query("COMMIT");
    sendResponse(res, 200, true, "Xóa yêu cầu thành công");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Delete yeu cau error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

// Hủy yêu cầu
const cancel = async (req, res, params, user) => {
  try {
    const { id } = params;
    const { ly_do_huy } = req.body || {};

    const yeuCauResult = await pool.query(
      "SELECT * FROM yeu_cau_nhap_kho WHERE id = $1",
      [id]
    );

    if (yeuCauResult.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy yêu cầu");
    }

    const yeuCau = yeuCauResult.rows[0];

    // Kiểm tra quyền hủy
    if (user.role !== "admin" && yeuCau.nguoi_yeu_cau !== user.id) {
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền hủy yêu cầu này"
      );
    }

    // Không thể hủy yêu cầu đã hoàn thành
    if (["completed", "cancelled"].includes(yeuCau.trang_thai)) {
      return sendResponse(res, 400, false, "Không thể hủy yêu cầu đã xử lý");
    }

    await pool.query(
      `UPDATE yeu_cau_nhap_kho SET 
        trang_thai = 'cancelled', 
        ly_do_tu_choi = $1,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2`,
      [ly_do_huy || "Người yêu cầu hủy", id]
    );

    sendResponse(res, 200, true, "Hủy yêu cầu thành công");
  } catch (error) {
    console.error("Cancel yeu cau error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

// Lấy danh sách yêu cầu chờ phê duyệt
const getPendingApprovals = async (req, res, query, user) => {
  try {
    const { page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    // Lấy các yêu cầu mà user có thể phê duyệt
    const pendingQuery = `
      SELECT 
        ycn.*,
        pb.ten_phong_ban as ten_don_vi_yeu_cau,
        u.ho_ten as ten_nguoi_yeu_cau,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ycn.created_at))/3600 as hours_pending
      FROM yeu_cau_nhap_kho ycn
      JOIN phong_ban pb ON ycn.don_vi_yeu_cau_id = pb.id
      JOIN users u ON ycn.nguoi_yeu_cau = u.id
      WHERE ycn.trang_thai IN ('submitted', 'under_review')
      ORDER BY 
        CASE ycn.muc_do_uu_tien 
          WHEN 'khan_cap' THEN 1
          WHEN 'cao' THEN 2
          WHEN 'binh_thuong' THEN 3
          WHEN 'thap' THEN 4
        END,
        ycn.created_at ASC
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `
      SELECT COUNT(*) 
      FROM yeu_cau_nhap_kho 
      WHERE trang_thai IN ('submitted', 'under_review')
    `;

    const [dataResult, countResult] = await Promise.all([
      pool.query(pendingQuery, [limit, offset]),
      pool.query(countQuery),
    ]);

    const total = parseInt(countResult.rows[0].count);
    const pages = Math.ceil(total / limit);

    sendResponse(res, 200, true, "Lấy danh sách chờ phê duyệt thành công", {
      items: dataResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages,
      },
    });
  } catch (error) {
    console.error("Get pending approvals error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

module.exports = {
  getList,
  getDetail,
  create,
  update,
  submit,
  delete: deleteYeuCau,
  cancel,
  getPendingApprovals,
};
