// controllers/yeuCauXuatKhoController.js
const pool = require("../config/database");
const { sendResponse } = require("../utils/response");

// Lấy danh sách yêu cầu xuất kho
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
      don_vi_nhan_id,
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
        ycx.so_yeu_cau ILIKE $${paramCount} OR 
        ycx.ly_do_yeu_cau ILIKE $${paramCount}
      )`;
      params.push(`%${search.trim()}%`);
    }

    // Lọc theo ngày
    if (tu_ngay && den_ngay) {
      paramCount += 2;
      whereClause += ` AND ycx.ngay_yeu_cau BETWEEN $${
        paramCount - 1
      } AND $${paramCount}`;
      params.push(tu_ngay, den_ngay);
    }

    // Lọc theo trạng thái
    if (trang_thai) {
      paramCount++;
      whereClause += ` AND ycx.trang_thai = $${paramCount}`;
      params.push(trang_thai);
    }

    // Lọc theo mức độ ưu tiên
    if (muc_do_uu_tien) {
      paramCount++;
      whereClause += ` AND ycx.muc_do_uu_tien = $${paramCount}`;
      params.push(muc_do_uu_tien);
    }

    // Lọc theo đơn vị yêu cầu
    if (don_vi_yeu_cau_id) {
      paramCount++;
      whereClause += ` AND ycx.don_vi_yeu_cau_id = $${paramCount}`;
      params.push(don_vi_yeu_cau_id);
    }

    // Lọc theo đơn vị nhận
    if (don_vi_nhan_id) {
      paramCount++;
      whereClause += ` AND ycx.don_vi_nhan_id = $${paramCount}`;
      params.push(don_vi_nhan_id);
    }

    // Phân quyền theo vai trò
    if (user.role !== "admin") {
      // User thường chỉ xem yêu cầu của phòng ban mình hoặc yêu cầu mình tạo
      paramCount++;
      whereClause += ` AND (ycx.don_vi_yeu_cau_id = $${paramCount} OR ycx.nguoi_yeu_cau = $${
        paramCount + 1
      })`;
      params.push(user.phong_ban_id, user.id);
      paramCount++;
    }

    // Xử lý sắp xếp
    const validSortFields = {
      so_yeu_cau: "ycx.so_yeu_cau",
      ngay_yeu_cau: "ycx.ngay_yeu_cau",
      trang_thai: "ycx.trang_thai",
      muc_do_uu_tien: "ycx.muc_do_uu_tien",
      tong_gia_tri: "ycx.tong_gia_tri_uoc_tinh",
      created_at: "ycx.created_at",
    };

    const sortField = validSortFields[sort_by] || "ycx.created_at";
    const sortDir = sort_direction.toLowerCase() === "asc" ? "ASC" : "DESC";
    const orderClause = `ORDER BY ${sortField} ${sortDir}`;

    // Query đếm tổng số
    const countQuery = `
      SELECT COUNT(*) 
      FROM yeu_cau_xuat_kho ycx 
      LEFT JOIN phong_ban pb_yc ON ycx.don_vi_yeu_cau_id = pb_yc.id
      LEFT JOIN don_vi_nhan dvn ON ycx.don_vi_nhan_id = dvn.id
      ${whereClause}
    `;

    // Query lấy dữ liệu
    const dataQuery = `
      SELECT 
        ycx.*,
        pb_yc.id as don_vi_yeu_cau_id_ref,
        pb_yc.ten_phong_ban as ten_don_vi_yeu_cau,
        dvn.id as don_vi_nhan_id_ref,
        dvn.ten_don_vi as ten_don_vi_nhan,
        u_yc.id as nguoi_yeu_cau_id_ref,
        u_yc.ho_ten as ten_nguoi_yeu_cau,
        u_duyet.id as nguoi_duyet_id_ref,
        u_duyet.ho_ten as ten_nguoi_duyet,
        px.id as phieu_xuat_id_ref,
        px.so_phieu as so_phieu_xuat
      FROM yeu_cau_xuat_kho ycx
      LEFT JOIN phong_ban pb_yc ON ycx.don_vi_yeu_cau_id = pb_yc.id
      LEFT JOIN don_vi_nhan dvn ON ycx.don_vi_nhan_id = dvn.id
      LEFT JOIN users u_yc ON ycx.nguoi_yeu_cau = u_yc.id
      LEFT JOIN users u_duyet ON ycx.nguoi_duyet = u_duyet.id
      LEFT JOIN phieu_xuat px ON ycx.phieu_xuat_id = px.id
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
      don_vi_nhan: item.don_vi_nhan_id_ref
        ? {
            id: item.don_vi_nhan_id_ref,
            ten_don_vi: item.ten_don_vi_nhan,
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
      phieu_xuat_info: item.phieu_xuat_id_ref
        ? {
            id: item.phieu_xuat_id_ref,
            so_phieu: item.so_phieu_xuat,
          }
        : null,
    }));

    sendResponse(res, 200, true, "Lấy danh sách yêu cầu xuất kho thành công", {
      items: structuredItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages,
      },
    });
  } catch (error) {
    console.error("Get yeu cau xuat kho list error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

// Lấy chi tiết yêu cầu xuất kho
const getDetail = async (req, res, params, user) => {
  try {
    const { id } = params;

    const detailQuery = `
      SELECT 
        ycx.*,
        pb_yc.ten_phong_ban as ten_don_vi_yeu_cau,
        dvn.ten_don_vi as ten_don_vi_nhan,
        dvn.dia_chi as dia_chi_don_vi_nhan,
        dvn.so_dien_thoai as sdt_don_vi_nhan,
        u_yc.ho_ten as ten_nguoi_yeu_cau,
        u_yc.email as email_nguoi_yeu_cau,
        u_duyet.ho_ten as ten_nguoi_duyet,
        px.so_phieu as so_phieu_xuat,
        px.ngay_xuat as ngay_xuat_thuc_te
      FROM yeu_cau_xuat_kho ycx
      LEFT JOIN phong_ban pb_yc ON ycx.don_vi_yeu_cau_id = pb_yc.id
      LEFT JOIN don_vi_nhan dvn ON ycx.don_vi_nhan_id = dvn.id
      LEFT JOIN users u_yc ON ycx.nguoi_yeu_cau = u_yc.id
      LEFT JOIN users u_duyet ON ycx.nguoi_duyet = u_duyet.id
      LEFT JOIN phieu_xuat px ON ycx.phieu_xuat_id = px.id
      WHERE ycx.id = $1
    `;

    const detailResult = await pool.query(detailQuery, [id]);

    if (detailResult.rows.length === 0) {
      return sendResponse(res, 404, false, "Yêu cầu xuất kho không tồn tại");
    }

    // Lấy chi tiết vật tư
    const chiTietQuery = `
      SELECT 
        ct.*,
        vt.ten_vat_tu,
        vt.ma_vat_tu,
        vt.don_vi_tinh,
        vt.gia_tham_khao,
        tk.so_luong_con_lai
      FROM chi_tiet_yeu_cau_xuat ct
      JOIN vat_tu vt ON ct.vat_tu_id = vt.id
      LEFT JOIN ton_kho tk ON ct.vat_tu_id = tk.vat_tu_id
      WHERE ct.yeu_cau_xuat_id = $1
      ORDER BY ct.id
    `;

    const chiTietResult = await pool.query(chiTietQuery, [id]);

    const yeuCauDetail = {
      ...detailResult.rows[0],
      chi_tiet_vat_tu: chiTietResult.rows,
    };

    // Phân quyền xem chi tiết
    if (user.role !== "admin") {
      const isOwner = yeuCauDetail.nguoi_yeu_cau === user.id;
      const isSameDepartment =
        yeuCauDetail.don_vi_yeu_cau_id === user.phong_ban_id;

      if (!isOwner && !isSameDepartment) {
        return sendResponse(res, 403, false, "Không có quyền xem yêu cầu này");
      }
    }

    sendResponse(
      res,
      200,
      true,
      "Lấy chi tiết yêu cầu xuất kho thành công",
      yeuCauDetail
    );
  } catch (error) {
    console.error("Get yeu cau xuat kho detail error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

// Tạo yêu cầu xuất kho mới
const create = async (req, res, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      so_yeu_cau,
      ngay_yeu_cau,
      don_vi_nhan_id,
      ly_do_yeu_cau,
      muc_do_uu_tien = "binh_thuong",
      ngay_can_xuat,
      ghi_chu,
      chi_tiet_vat_tu = [],
    } = body;

    // Validation
    if (!so_yeu_cau || !ngay_yeu_cau || !don_vi_nhan_id) {
      await client.query("ROLLBACK");
      return sendResponse(res, 400, false, "Thiếu thông tin bắt buộc");
    }

    if (!Array.isArray(chi_tiet_vat_tu) || chi_tiet_vat_tu.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 400, false, "Phải có ít nhất một vật tư");
    }

    // Kiểm tra số yêu cầu đã tồn tại
    const checkSoYeuCau = await client.query(
      "SELECT id FROM yeu_cau_xuat_kho WHERE so_yeu_cau = $1",
      [so_yeu_cau]
    );

    if (checkSoYeuCau.rows.length > 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 400, false, "Số yêu cầu đã tồn tại");
    }

    // Kiểm tra đơn vị nhận có tồn tại
    const checkDonViNhan = await client.query(
      "SELECT id FROM don_vi_nhan WHERE id = $1",
      [don_vi_nhan_id]
    );

    if (checkDonViNhan.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 400, false, "Đơn vị nhận không tồn tại");
    }

    // Kiểm tra tồn kho cho từng vật tư
    for (const item of chi_tiet_vat_tu) {
      const { vat_tu_id, so_luong_yeu_cau } = item;

      if (!vat_tu_id || !so_luong_yeu_cau || so_luong_yeu_cau <= 0) {
        await client.query("ROLLBACK");
        return sendResponse(res, 400, false, "Thông tin vật tư không hợp lệ");
      }

      // Kiểm tra vật tư có tồn tại
      const checkVatTu = await client.query(
        "SELECT id, ten_vat_tu FROM vat_tu WHERE id = $1",
        [vat_tu_id]
      );

      if (checkVatTu.rows.length === 0) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          `Vật tư ID ${vat_tu_id} không tồn tại`
        );
      }

      // Kiểm tra tồn kho
      const checkTonKho = await client.query(
        "SELECT so_luong_con_lai FROM ton_kho WHERE vat_tu_id = $1",
        [vat_tu_id]
      );

      const tonKhoHienTai = checkTonKho.rows[0]?.so_luong_con_lai || 0;

      if (tonKhoHienTai < so_luong_yeu_cau) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          `Vật tư ${checkVatTu.rows[0].ten_vat_tu} không đủ tồn kho. Tồn kho hiện tại: ${tonKhoHienTai}, yêu cầu: ${so_luong_yeu_cau}`
        );
      }
    }

    // Tính tổng giá trị ước tính
    let tongGiaTriUocTinh = 0;
    for (const item of chi_tiet_vat_tu) {
      const vatTuQuery = await client.query(
        "SELECT gia_tham_khao FROM vat_tu WHERE id = $1",
        [item.vat_tu_id]
      );

      const giaThamKhao = vatTuQuery.rows[0]?.gia_tham_khao || 0;
      tongGiaTriUocTinh += giaThamKhao * item.so_luong_yeu_cau;
    }

    // Tạo yêu cầu xuất kho
    const insertYeuCauQuery = `
      INSERT INTO yeu_cau_xuat_kho (
        so_yeu_cau, ngay_yeu_cau, don_vi_yeu_cau_id, don_vi_nhan_id,
        ly_do_yeu_cau, muc_do_uu_tien, ngay_can_xuat, ghi_chu,
        tong_gia_tri_uoc_tinh, nguoi_yeu_cau, trang_thai
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const yeuCauResult = await client.query(insertYeuCauQuery, [
      so_yeu_cau,
      ngay_yeu_cau,
      user.phong_ban_id,
      don_vi_nhan_id,
      ly_do_yeu_cau,
      muc_do_uu_tien,
      ngay_can_xuat,
      ghi_chu,
      tongGiaTriUocTinh,
      user.id,
      "draft",
    ]);

    const yeuCauId = yeuCauResult.rows[0].id;

    // Thêm chi tiết vật tư
    for (const item of chi_tiet_vat_tu) {
      const vatTuQuery = await client.query(
        "SELECT gia_tham_khao FROM vat_tu WHERE id = $1",
        [item.vat_tu_id]
      );

      const giaThamKhao = vatTuQuery.rows[0]?.gia_tham_khao || 0;
      const thanhTien = giaThamKhao * item.so_luong_yeu_cau;

      await client.query(
        `INSERT INTO chi_tiet_yeu_cau_xuat (
          yeu_cau_xuat_id, vat_tu_id, so_luong_yeu_cau, 
          gia_uoc_tinh, thanh_tien, ghi_chu
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          yeuCauId,
          item.vat_tu_id,
          item.so_luong_yeu_cau,
          giaThamKhao,
          thanhTien,
          item.ghi_chu || null,
        ]
      );
    }

    await client.query("COMMIT");

    sendResponse(res, 201, true, "Tạo yêu cầu xuất kho thành công", {
      id: yeuCauId,
      so_yeu_cau: so_yeu_cau,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create yeu cau xuat kho error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

// Cập nhật yêu cầu xuất kho
const update = async (req, res, params, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;
    const {
      ngay_yeu_cau,
      don_vi_nhan_id,
      ly_do_yeu_cau,
      muc_do_uu_tien,
      ngay_can_xuat,
      ghi_chu,
      chi_tiet_vat_tu = [],
    } = body;

    // Kiểm tra yêu cầu có tồn tại và có quyền chỉnh sửa
    const checkQuery = `
      SELECT * FROM yeu_cau_xuat_kho 
      WHERE id = $1 AND trang_thai IN ('draft', 'rejected')
    `;

    const checkResult = await client.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        404,
        false,
        "Yêu cầu không tồn tại hoặc không thể chỉnh sửa"
      );
    }

    const yeuCau = checkResult.rows[0];

    // Phân quyền chỉnh sửa
    if (user.role !== "admin" && yeuCau.nguoi_yeu_cau !== user.id) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        403,
        false,
        "Không có quyền chỉnh sửa yêu cầu này"
      );
    }

    // Kiểm tra tồn kho cho từng vật tư (nếu có chi_tiet_vat_tu)
    if (chi_tiet_vat_tu.length > 0) {
      for (const item of chi_tiet_vat_tu) {
        const { vat_tu_id, so_luong_yeu_cau } = item;

        if (!vat_tu_id || !so_luong_yeu_cau || so_luong_yeu_cau <= 0) {
          await client.query("ROLLBACK");
          return sendResponse(res, 400, false, "Thông tin vật tư không hợp lệ");
        }

        // Kiểm tra tồn kho
        const checkTonKho = await client.query(
          "SELECT so_luong_con_lai FROM ton_kho WHERE vat_tu_id = $1",
          [vat_tu_id]
        );

        const tonKhoHienTai = checkTonKho.rows[0]?.so_luong_con_lai || 0;

        if (tonKhoHienTai < so_luong_yeu_cau) {
          const vatTuInfo = await client.query(
            "SELECT ten_vat_tu FROM vat_tu WHERE id = $1",
            [vat_tu_id]
          );

          await client.query("ROLLBACK");
          return sendResponse(
            res,
            400,
            false,
            `Vật tư ${vatTuInfo.rows[0]?.ten_vat_tu} không đủ tồn kho. Tồn kho hiện tại: ${tonKhoHienTai}, yêu cầu: ${so_luong_yeu_cau}`
          );
        }
      }
    }

    // Tính lại tổng giá trị nếu có cập nhật chi tiết
    let tongGiaTriUocTinh = yeuCau.tong_gia_tri_uoc_tinh;
    if (chi_tiet_vat_tu.length > 0) {
      tongGiaTriUocTinh = 0;
      for (const item of chi_tiet_vat_tu) {
        const vatTuQuery = await client.query(
          "SELECT gia_tham_khao FROM vat_tu WHERE id = $1",
          [item.vat_tu_id]
        );

        const giaThamKhao = vatTuQuery.rows[0]?.gia_tham_khao || 0;
        tongGiaTriUocTinh += giaThamKhao * item.so_luong_yeu_cau;
      }
    }

    // Cập nhật thông tin chính
    const updateQuery = `
      UPDATE yeu_cau_xuat_kho 
      SET 
        ngay_yeu_cau = COALESCE($1, ngay_yeu_cau),
        don_vi_nhan_id = COALESCE($2, don_vi_nhan_id),
        ly_do_yeu_cau = COALESCE($3, ly_do_yeu_cau),
        muc_do_uu_tien = COALESCE($4, muc_do_uu_tien),
        ngay_can_xuat = COALESCE($5, ngay_can_xuat),
        ghi_chu = COALESCE($6, ghi_chu),
        tong_gia_tri_uoc_tinh = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;

    const updateResult = await client.query(updateQuery, [
      ngay_yeu_cau,
      don_vi_nhan_id,
      ly_do_yeu_cau,
      muc_do_uu_tien,
      ngay_can_xuat,
      ghi_chu,
      tongGiaTriUocTinh,
      id,
    ]);

    // Cập nhật chi tiết vật tư nếu có
    if (chi_tiet_vat_tu.length > 0) {
      // Xóa chi tiết cũ
      await client.query(
        "DELETE FROM chi_tiet_yeu_cau_xuat WHERE yeu_cau_xuat_id = $1",
        [id]
      );

      // Thêm chi tiết mới
      for (const item of chi_tiet_vat_tu) {
        const vatTuQuery = await client.query(
          "SELECT gia_tham_khao FROM vat_tu WHERE id = $1",
          [item.vat_tu_id]
        );

        const giaThamKhao = vatTuQuery.rows[0]?.gia_tham_khao || 0;
        const thanhTien = giaThamKhao * item.so_luong_yeu_cau;

        await client.query(
          `INSERT INTO chi_tiet_yeu_cau_xuat (
            yeu_cau_xuat_id, vat_tu_id, so_luong_yeu_cau, 
            gia_uoc_tinh, thanh_tien, ghi_chu
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            id,
            item.vat_tu_id,
            item.so_luong_yeu_cau,
            giaThamKhao,
            thanhTien,
            item.ghi_chu || null,
          ]
        );
      }
    }

    await client.query("COMMIT");

    sendResponse(
      res,
      200,
      true,
      "Cập nhật yêu cầu xuất kho thành công",
      updateResult.rows[0]
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update yeu cau xuat kho error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

// Gửi yêu cầu xuất kho (chuyển từ draft -> confirmed)
const submit = async (req, res, params, user) => {
  try {
    const { id } = params;

    // Kiểm tra yêu cầu có tồn tại và ở trạng thái draft
    const checkQuery = `
      SELECT ycx.*, COUNT(ct.id) as so_luong_vat_tu
      FROM yeu_cau_xuat_kho ycx
      LEFT JOIN chi_tiet_yeu_cau_xuat ct ON ycx.id = ct.yeu_cau_xuat_id
      WHERE ycx.id = $1 AND ycx.trang_thai = 'draft'
      GROUP BY ycx.id
    `;

    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return sendResponse(
        res,
        404,
        false,
        "Yêu cầu không tồn tại hoặc không ở trạng thái draft"
      );
    }

    const yeuCau = checkResult.rows[0];

    // Phân quyền gửi yêu cầu
    if (user.role !== "admin" && yeuCau.nguoi_yeu_cau !== user.id) {
      return sendResponse(res, 403, false, "Không có quyền gửi yêu cầu này");
    }

    // Kiểm tra có vật tư hay không
    if (parseInt(yeuCau.so_luong_vat_tu) === 0) {
      return sendResponse(
        res,
        400,
        false,
        "Yêu cầu phải có ít nhất một vật tư"
      );
    }

    // Cập nhật trạng thái
    const updateQuery = `
      UPDATE yeu_cau_xuat_kho 
      SET 
        trang_thai = 'confirmed',
        ngay_gui_yeu_cau = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [id]);

    sendResponse(
      res,
      200,
      true,
      "Gửi yêu cầu xuất kho thành công",
      result.rows[0]
    );
  } catch (error) {
    console.error("Submit yeu cau xuat kho error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

// Hủy yêu cầu xuất kho
const cancel = async (req, res, params, user) => {
  try {
    const { id } = params;

    // Kiểm tra yêu cầu có tồn tại
    const checkQuery = `
      SELECT * FROM yeu_cau_xuat_kho 
      WHERE id = $1 AND trang_thai NOT IN ('cancelled', 'completed')
    `;

    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return sendResponse(
        res,
        404,
        false,
        "Yêu cầu không tồn tại hoặc không thể hủy"
      );
    }

    const yeuCau = checkResult.rows[0];

    // Phân quyền hủy yêu cầu
    if (user.role !== "admin" && yeuCau.nguoi_yeu_cau !== user.id) {
      return sendResponse(res, 403, false, "Không có quyền hủy yêu cầu này");
    }

    // Cập nhật trạng thái
    const updateQuery = `
      UPDATE yeu_cau_xuat_kho 
      SET 
        trang_thai = 'cancelled',
        ly_do_huy = $1,
        ngay_huy = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      req.body?.ly_do_huy || "Hủy bởi người dùng",
      id,
    ]);

    sendResponse(
      res,
      200,
      true,
      "Hủy yêu cầu xuất kho thành công",
      result.rows[0]
    );
  } catch (error) {
    console.error("Cancel yeu cau xuat kho error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

// Xóa yêu cầu xuất kho
const deleteYeuCau = async (req, res, params, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;

    // Kiểm tra yêu cầu có tồn tại và có thể xóa
    const checkQuery = `
      SELECT * FROM yeu_cau_xuat_kho 
      WHERE id = $1 AND trang_thai IN ('draft', 'cancelled')
    `;

    const checkResult = await client.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        404,
        false,
        "Yêu cầu không tồn tại hoặc không thể xóa"
      );
    }

    const yeuCau = checkResult.rows[0];

    // Phân quyền xóa
    if (user.role !== "admin" && yeuCau.nguoi_yeu_cau !== user.id) {
      await client.query("ROLLBACK");
      return sendResponse(res, 403, false, "Không có quyền xóa yêu cầu này");
    }

    // Xóa chi tiết trước
    await client.query(
      "DELETE FROM chi_tiet_yeu_cau_xuat WHERE yeu_cau_xuat_id = $1",
      [id]
    );

    // Xóa yêu cầu chính
    await client.query("DELETE FROM yeu_cau_xuat_kho WHERE id = $1", [id]);

    await client.query("COMMIT");

    sendResponse(res, 200, true, "Xóa yêu cầu xuất kho thành công");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Delete yeu cau xuat kho error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

// Lấy danh sách yêu cầu chờ phê duyệt (cho admin/manager)
const getPendingApprovals = async (req, res, query, user) => {
  try {
    const { page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    // Chỉ admin mới có quyền xem danh sách chờ phê duyệt
    if (user.role !== "admin") {
      return sendResponse(res, 403, false, "Không có quyền truy cập");
    }

    const pendingQuery = `
      SELECT 
        ycx.*,
        pb.ten_phong_ban as ten_don_vi_yeu_cau,
        dvn.ten_don_vi as ten_don_vi_nhan,
        u.ho_ten as ten_nguoi_yeu_cau,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ycx.created_at))/3600 as hours_pending
      FROM yeu_cau_xuat_kho ycx
      JOIN phong_ban pb ON ycx.don_vi_yeu_cau_id = pb.id
      JOIN don_vi_nhan dvn ON ycx.don_vi_nhan_id = dvn.id
      JOIN users u ON ycx.nguoi_yeu_cau = u.id
      WHERE ycx.trang_thai IN ('confirmed', 'under_review')
      ORDER BY 
        CASE ycx.muc_do_uu_tien 
          WHEN 'khan_cap' THEN 1
          WHEN 'cao' THEN 2
          WHEN 'binh_thuong' THEN 3
          WHEN 'thap' THEN 4
        END,
        ycx.created_at ASC
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `
      SELECT COUNT(*) 
      FROM yeu_cau_xuat_kho 
      WHERE trang_thai IN ('confirmed', 'under_review')
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

// Kiểm tra tồn kho cho yêu cầu xuất
const checkTonKho = async (req, res, params, user) => {
  try {
    const { id } = params;

    // Lấy chi tiết yêu cầu xuất và kiểm tra tồn kho
    const checkQuery = `
      SELECT 
        ct.vat_tu_id,
        ct.so_luong_yeu_cau,
        vt.ten_vat_tu,
        vt.ma_vat_tu,
        tk.so_luong_con_lai,
        CASE 
          WHEN tk.so_luong_con_lai >= ct.so_luong_yeu_cau THEN true
          ELSE false
        END as du_ton_kho
      FROM chi_tiet_yeu_cau_xuat ct
      JOIN vat_tu vt ON ct.vat_tu_id = vt.id
      LEFT JOIN ton_kho tk ON ct.vat_tu_id = tk.vat_tu_id
      WHERE ct.yeu_cau_xuat_id = $1
      ORDER BY vt.ten_vat_tu
    `;

    const result = await pool.query(checkQuery, [id]);

    if (result.rows.length === 0) {
      return sendResponse(
        res,
        404,
        false,
        "Yêu cầu xuất kho không tồn tại hoặc không có vật tư"
      );
    }

    const allAvailable = result.rows.every((item) => item.du_ton_kho);

    sendResponse(res, 200, true, "Kiểm tra tồn kho thành công", {
      items: result.rows,
      all_available: allAvailable,
      summary: {
        total_items: result.rows.length,
        available_items: result.rows.filter((item) => item.du_ton_kho).length,
        unavailable_items: result.rows.filter((item) => !item.du_ton_kho)
          .length,
      },
    });
  } catch (error) {
    console.error("Check ton kho error:", error);
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
  checkTonKho,
};
