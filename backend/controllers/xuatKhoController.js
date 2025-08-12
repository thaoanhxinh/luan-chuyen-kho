const pool = require("../config/database");
const { sendResponse } = require("../utils/response");

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
      sort_by = "created_at",
      sort_direction = "desc",
    } = query;

    const offset = (page - 1) * limit;
    let whereClause = "WHERE 1=1";
    const params = [];
    let paramCount = 0;

    // Tìm kiếm theo số quyết định và tên đơn vị nhận
    if (search && search.trim()) {
      paramCount++;
      whereClause += ` AND (
        px.so_quyet_dinh ILIKE $${paramCount} OR 
        dvn.ten_don_vi ILIKE $${paramCount}
      )`;
      params.push(`%${search.trim()}%`);
    }

    // Lọc theo ngày
    if (tu_ngay && den_ngay) {
      paramCount += 2;
      whereClause += ` AND px.ngay_xuat BETWEEN $${
        paramCount - 1
      } AND $${paramCount}`;
      params.push(tu_ngay, den_ngay);
    }

    // Lọc theo trạng thái
    if (trang_thai) {
      paramCount++;
      whereClause += ` AND px.trang_thai = $${paramCount}`;
      params.push(trang_thai);
    }

    // Lọc theo loại xuất
    if (loai_xuat) {
      paramCount++;
      whereClause += ` AND px.loai_xuat = $${paramCount}`;
      params.push(loai_xuat);
    }

    // Lọc theo đơn vị nhận
    if (don_vi_nhan_id) {
      paramCount++;
      whereClause += ` AND px.don_vi_nhan_id = $${paramCount}`;
      params.push(don_vi_nhan_id);
    }

    // Phân quyền theo phòng ban
    if (user.role !== "admin") {
      paramCount++;
      whereClause += ` AND px.phong_ban_id = $${paramCount}`;
      params.push(user.phong_ban_id);
    }

    // Xử lý sắp xếp
    const validSortFields = {
      so_phieu: "px.so_phieu",
      so_quyet_dinh: "px.so_quyet_dinh",
      ngay_xuat: "px.ngay_xuat",
      tong_tien: "px.tong_tien",
      created_at: "px.created_at",
    };

    const sortField = validSortFields[sort_by] || "px.created_at";
    const sortDir = sort_direction.toLowerCase() === "asc" ? "ASC" : "DESC";
    const orderClause = `ORDER BY ${sortField} ${sortDir}`;

    const countQuery = `
      SELECT COUNT(*) 
      FROM phieu_xuat px 
      LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id 
      ${whereClause}
    `;

    const dataQuery = `
      SELECT px.*, 
             dvn.id as dvn_id, dvn.ma_don_vi, dvn.ten_don_vi, dvn.loai_don_vi,
             u.id as nguoi_tao_id, u.ho_ten as nguoi_tao_ten,
             u2.id as nguoi_duyet_id, u2.ho_ten as nguoi_duyet_ten,
             pb.ten_phong_ban,
             px.decision_pdf_url,
             px.decision_pdf_filename,
             px.ghi_chu_xac_nhan
      FROM phieu_xuat px
      LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id
      LEFT JOIN users u ON px.nguoi_tao = u.id
      LEFT JOIN users u2 ON px.nguoi_duyet = u2.id
      LEFT JOIN phong_ban pb ON px.phong_ban_id = pb.id
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
      don_vi_nhan: item.dvn_id
        ? {
            id: item.dvn_id,
            ma_don_vi: item.ma_don_vi,
            ten_don_vi: item.ten_don_vi,
            loai_don_vi: item.loai_don_vi,
          }
        : null,
      user_tao: item.nguoi_tao_id
        ? {
            id: item.nguoi_tao_id,
            ho_ten: item.nguoi_tao_ten,
          }
        : null,
      user_duyet: item.nguoi_duyet_id
        ? {
            id: item.nguoi_duyet_id,
            ho_ten: item.nguoi_duyet_ten,
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

const getDetail = async (req, res, params, user) => {
  try {
    const { id } = params;

    const detailQuery = `
      SELECT 
        px.*, 
        dvn.id as dvn_id, dvn.ma_don_vi, dvn.ten_don_vi, dvn.loai_don_vi, dvn.dia_chi as dvn_dia_chi,
        u1.id as nguoi_tao_id, u1.ho_ten as nguoi_tao_ten,
        u2.id as nguoi_duyet_id, u2.ho_ten as nguoi_duyet_ten,
        pb.ten_phong_ban
      FROM phieu_xuat px
      LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id
      LEFT JOIN users u1 ON px.nguoi_tao = u1.id
      LEFT JOIN users u2 ON px.nguoi_duyet = u2.id
      LEFT JOIN phong_ban pb ON px.phong_ban_id = pb.id
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

    if (user.role !== "admin" && phieuData.phong_ban_id !== user.phong_ban_id) {
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

const create = async (req, res, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      ngay_xuat,
      don_vi_nhan_id,
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

    // Kiểm tra tồn kho thực tế trước khi tạo phiếu (bao gồm phiếu chưa hoàn thành)
    for (const item of chi_tiet) {
      // Lấy tồn kho hiện tại
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

      // Tính số lượng đang chờ xuất từ các phiếu nháp khác
      const dangChoXuatResult = await client.query(
        `SELECT COALESCE(SUM(ctx.so_luong_yeu_cau), 0) as so_luong_dang_cho_xuat
         FROM chi_tiet_xuat ctx
         JOIN phieu_xuat px ON ctx.phieu_xuat_id = px.id
         WHERE ctx.hang_hoa_id = $1 
         AND px.phong_ban_id = $2
         AND px.trang_thai = 'draft'`,
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

    // Tạo phiếu xuất với trường số quyết định
    const phieuResult = await client.query(
      `INSERT INTO phieu_xuat (
        so_phieu, ngay_xuat, don_vi_nhan_id, nguoi_nhan, so_quyet_dinh, ly_do_xuat, loai_xuat,
        phong_ban_id, ghi_chu, nguoi_tao, tong_tien
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0)
      RETURNING *`,
      [
        soPhieu,
        ngay_xuat,
        don_vi_nhan_id,
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
        so_luong_thuc_xuat,
        don_gia,
        so_seri_xuat = [],
        pham_chat = "tot",
        ghi_chu: item_ghi_chu,
      } = item;

      if (!hang_hoa_id || !so_luong_yeu_cau || don_gia === undefined) {
        await client.query("ROLLBACK");
        return sendResponse(res, 400, false, "Chi tiết xuất không hợp lệ");
      }

      const thanhTien = (so_luong_thuc_xuat || so_luong_yeu_cau) * don_gia;
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
          so_luong_thuc_xuat || so_luong_yeu_cau,
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

const update = async (req, res, params, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;
    const {
      ngay_xuat,
      don_vi_nhan_id,
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

    if (user.role !== "admin" && phieu.phong_ban_id !== user.phong_ban_id) {
      await client.query("ROLLBACK");
      return sendResponse(res, 403, false, "Bạn không có quyền sửa phiếu này");
    }

    // Chỉ cho phép chỉnh sửa khi chưa hoàn thành
    if (phieu.trang_thai === "completed") {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Không thể sửa phiếu đã hoàn thành. Tồn kho đã được điều chỉnh."
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

    // Kiểm tra tồn kho thực tế cho các chi tiết mới (bao gồm các phiếu nháp khác)
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

      // Tính số lượng đang chờ xuất từ các phiếu nháp khác (loại trừ phiếu hiện tại)
      const dangChoXuatResult = await client.query(
        `SELECT COALESCE(SUM(ctx.so_luong_yeu_cau), 0) as so_luong_dang_cho_xuat
         FROM chi_tiet_xuat ctx
         JOIN phieu_xuat px ON ctx.phieu_xuat_id = px.id
         WHERE ctx.hang_hoa_id = $1 
         AND px.phong_ban_id = $2
         AND px.trang_thai = 'draft'
         AND px.id != $3`,
        [item.hang_hoa_id, phieu.phong_ban_id, id]
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
            `đang chờ xuất (phiếu khác): ${soLuongDangChoXuat}, ` +
            `có thể xuất: ${soLuongCoTheXuat}, ` +
            `yêu cầu: ${item.so_luong_yeu_cau}`
        );
      }
    }

    // Cập nhật thông tin phiếu bao gồm số quyết định
    await client.query(
      `UPDATE phieu_xuat 
       SET ngay_xuat = $1, don_vi_nhan_id = $2, nguoi_nhan = $3, so_quyet_dinh = $4, ly_do_xuat = $5,
           loai_xuat = $6, ghi_chu = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [
        ngay_xuat,
        don_vi_nhan_id,
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
      const thanhTien =
        (item.so_luong_thuc_xuat || item.so_luong_yeu_cau) * item.don_gia;
      tongTien += thanhTien;

      await client.query(
        `INSERT INTO chi_tiet_xuat (
          phieu_xuat_id, hang_hoa_id, so_luong_yeu_cau, so_luong_thuc_xuat,
          don_gia, thanh_tien, so_seri_xuat, pham_chat, ghi_chu
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          item.hang_hoa_id,
          item.so_luong_yeu_cau,
          item.so_luong_thuc_xuat || item.so_luong_yeu_cau,
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

const approve = async (req, res, params, user) => {
  try {
    const { id } = params;

    const phieu = await pool.query("SELECT * FROM phieu_xuat WHERE id = $1", [
      id,
    ]);

    if (phieu.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
    }

    if (phieu.rows[0].trang_thai !== "draft") {
      return sendResponse(
        res,
        400,
        false,
        "Chỉ có thể duyệt phiếu ở trạng thái nháp"
      );
    }

    // Duyệt phiếu: draft -> approved (giống nhập kho)
    await pool.query(
      `UPDATE phieu_xuat 
       SET trang_thai = 'approved', nguoi_duyet = $1, ngay_duyet = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [user.id, id]
    );

    sendResponse(res, 200, true, "Duyệt phiếu xuất thành công");
  } catch (error) {
    console.error("Approve phieu xuat error:", error);
    sendResponse(res, 500, false, "Lỗi server");
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

// Function upload quyết định PDF (giống nhập kho)
const uploadDecision = async (req, res, params, body, user, file) => {
  try {
    const { id } = params;
    const { ghi_chu_xac_nhan } = body;

    if (!file) {
      return sendResponse(res, 400, false, "Cần chọn file PDF quyết định");
    }

    // Kiểm tra phiếu xuất
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

    // Lưu thông tin file vào database
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

// Function download quyết định PDF
const downloadDecision = async (req, res, params, user) => {
  try {
    const { id } = params;

    // Lấy thông tin file từ database
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

    // Trả về thông tin file để frontend có thể download
    sendResponse(res, 200, true, "Thông tin file", {
      url: decision_pdf_url,
      filename: decision_pdf_filename,
    });
  } catch (error) {
    console.error("Download decision error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

// Function hoàn thành phiếu xuất (giống nhập kho)
const complete = async (req, res, params, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;

    // Kiểm tra phiếu xuất
    const phieuResult = await client.query(
      "SELECT * FROM phieu_xuat WHERE id = $1",
      [id]
    );

    if (phieuResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
    }

    const phieu = phieuResult.rows[0];

    if (user.role !== "admin" && phieu.phong_ban_id !== user.phong_ban_id) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền hoàn thành phiếu này"
      );
    }

    if (phieu.trang_thai !== "approved") {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Chỉ có thể hoàn thành phiếu đã được duyệt"
      );
    }

    if (!phieu.decision_pdf_url) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Cần upload quyết định trước khi hoàn thành"
      );
    }

    // Hoàn thành phiếu: approved -> completed
    // Trigger sẽ tự động trừ tồn kho theo số lượng thực xuất
    await client.query(
      `UPDATE phieu_xuat 
       SET trang_thai = 'completed',
           ngay_xac_nhan = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    await client.query("COMMIT");

    sendResponse(res, 200, true, "Hoàn thành phiếu xuất thành công");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Complete phieu xuat error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

// CẢI TIẾN: Kiểm tra tồn kho có tính cả phiếu chưa hoàn thành để tránh chồng chéo
const checkTonKhoThucTe = async (req, res, body, user) => {
  try {
    const { phong_ban_id, chi_tiet = [], phieu_hien_tai_id } = body;

    if (!chi_tiet.length) {
      return sendResponse(res, 400, false, "Danh sách chi tiết trống");
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
        [item.hang_hoa_id, phong_ban_id || user.phong_ban_id]
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

      const queryParams = [item.hang_hoa_id, phong_ban_id || user.phong_ban_id];

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
        so_luong_yeu_cau: item.so_luong_yeu_cau,
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
        co_the_xuat: soLuongCoTheXuat >= item.so_luong_yeu_cau,
        canh_bao:
          soLuongDangChoXuat > 0
            ? `Có ${soLuongDangChoXuat} đang chờ xuất từ các phiếu nháp khác`
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
        so_luong_yeu_cau: item.so_luong_yeu_cau,
        so_luong_ton: tonKho.so_luong_ton,
        don_gia_binh_quan: tonKho.don_gia_binh_quan,
        ten_hang_hoa: tonKho.ten_hang_hoa,
        ma_hang_hoa: tonKho.ma_hang_hoa,
        co_the_xuat: tonKho.so_luong_ton >= item.so_luong_yeu_cau,
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

module.exports = {
  getList,
  getDetail,
  create,
  update,
  delete: deletePhieu,
  approve,
  cancel,
  complete,
  checkTonKho,
  uploadDecision,
  downloadDecision,
  checkTonKhoThucTe,
};
