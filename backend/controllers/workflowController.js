// controllers/workflowController.js
const pool = require("../config/database");
const { sendResponse } = require("../utils/response");

// Phê duyệt yêu cầu nhập kho
const approveYeuCauNhap = async (req, res, params, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;
    const { ghi_chu_duyet, chi_tiet_duyet = [] } = body;

    // Kiểm tra yêu cầu tồn tại
    const yeuCauResult = await client.query(
      "SELECT * FROM yeu_cau_nhap_kho WHERE id = $1",
      [id]
    );

    if (yeuCauResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "Không tìm thấy yêu cầu");
    }

    const yeuCau = yeuCauResult.rows[0];

    // Kiểm tra trạng thái có thể phê duyệt
    if (!["confirmed", "under_review"].includes(yeuCau.trang_thai)) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Yêu cầu không ở trạng thái có thể phê duyệt"
      );
    }

    // Kiểm tra quyền phê duyệt (admin hoặc phòng quản lý kho)
    if (user.role !== "admin") {
      const phongQuanLyKho = await client.query(
        "SELECT id FROM phong_ban WHERE ma_phong_ban IN ('HCK', 'TMKH')"
      );
      const phongQuanLyIds = phongQuanLyKho.rows.map((row) => row.id);

      if (!phongQuanLyIds.includes(user.phong_ban_id)) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          403,
          false,
          "Bạn không có quyền phê duyệt yêu cầu này"
        );
      }
    }

    // Cập nhật số lượng được duyệt nếu có chi tiết
    if (chi_tiet_duyet.length > 0) {
      for (const item of chi_tiet_duyet) {
        await client.query(
          `UPDATE chi_tiet_yeu_cau_nhap 
           SET so_luong_duyet = $1 
           WHERE yeu_cau_nhap_id = $2 AND hang_hoa_id = $3`,
          [item.so_luong_duyet, id, item.hang_hoa_id]
        );
      }
    } else {
      // Nếu không có chi tiết cụ thể, duyệt toàn bộ theo số lượng yêu cầu
      await client.query(
        `UPDATE chi_tiet_yeu_cau_nhap 
         SET so_luong_duyet = so_luong_yeu_cau 
         WHERE yeu_cau_nhap_id = $1`,
        [id]
      );
    }

    // Cập nhật trạng thái yêu cầu
    await client.query(
      `UPDATE yeu_cau_nhap_kho SET
        trang_thai = 'approved',
        nguoi_duyet = $1,
        ngay_duyet = CURRENT_TIMESTAMP,
        ghi_chu_duyet = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3`,
      [user.id, ghi_chu_duyet, id]
    );

    // Tạo bản ghi workflow approval
    await client.query(
      `INSERT INTO workflow_approvals (
        yeu_cau_id, loai_yeu_cau, nguoi_duyet, phong_ban_duyet,
        trang_thai, ngay_xu_ly, ly_do_quyet_dinh, ghi_chu
      ) VALUES ($1, 'nhap_kho', $2, $3, 'approved', CURRENT_TIMESTAMP, $4, $5)`,
      [
        id,
        user.id,
        user.phong_ban_id,
        "Phê duyệt yêu cầu nhập kho",
        ghi_chu_duyet,
      ]
    );

    await client.query("COMMIT");

    sendResponse(res, 200, true, "Phê duyệt yêu cầu thành công");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Approve yeu cau nhap error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

// Từ chối yêu cầu nhập kho
const rejectYeuCauNhap = async (req, res, params, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;
    const { ly_do_tu_choi, ghi_chu_duyet } = body;

    if (!ly_do_tu_choi) {
      await client.query("ROLLBACK");
      return sendResponse(res, 400, false, "Vui lòng nhập lý do từ chối");
    }

    // Kiểm tra yêu cầu tồn tại
    const yeuCauResult = await client.query(
      "SELECT * FROM yeu_cau_nhap_kho WHERE id = $1",
      [id]
    );

    if (yeuCauResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "Không tìm thấy yêu cầu");
    }

    const yeuCau = yeuCauResult.rows[0];

    // Kiểm tra trạng thái
    if (!["confirmed", "under_review"].includes(yeuCau.trang_thai)) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Yêu cầu không ở trạng thái có thể từ chối"
      );
    }

    // Kiểm tra quyền từ chối
    if (user.role !== "admin") {
      const phongQuanLyKho = await client.query(
        "SELECT id FROM phong_ban WHERE ma_phong_ban IN ('HCK', 'TMKH')"
      );
      const phongQuanLyIds = phongQuanLyKho.rows.map((row) => row.id);

      if (!phongQuanLyIds.includes(user.phong_ban_id)) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          403,
          false,
          "Bạn không có quyền từ chối yêu cầu này"
        );
      }
    }

    // Cập nhật trạng thái yêu cầu
    await client.query(
      `UPDATE yeu_cau_nhap_kho SET
        trang_thai = 'rejected',
        nguoi_duyet = $1,
        ngay_duyet = CURRENT_TIMESTAMP,
        ly_do_tu_choi = $2,
        ghi_chu_duyet = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4`,
      [user.id, ly_do_tu_choi, ghi_chu_duyet, id]
    );

    // Tạo bản ghi workflow approval
    await client.query(
      `INSERT INTO workflow_approvals (
        yeu_cau_id, loai_yeu_cau, nguoi_duyet, phong_ban_duyet,
        trang_thai, ngay_xu_ly, ly_do_quyet_dinh, ghi_chu
      ) VALUES ($1, 'nhap_kho', $2, $3, 'rejected', CURRENT_TIMESTAMP, $4, $5)`,
      [id, user.id, user.phong_ban_id, ly_do_tu_choi, ghi_chu_duyet]
    );

    await client.query("COMMIT");

    sendResponse(res, 200, true, "Từ chối yêu cầu thành công");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Reject yeu cau nhap error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

// Chuyển yêu cầu đã duyệt thành phiếu nhập kho
const convertToPhieuNhap = async (req, res, params, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;
    const {
      ngay_nhap,
      nha_cung_cap_id,
      loai_phieu = "tu_mua",
      so_hoa_don,
      ghi_chu_phieu,
    } = body;

    // Kiểm tra yêu cầu đã được duyệt
    const yeuCauResult = await client.query(
      `SELECT ycn.*, pb.ten_phong_ban 
       FROM yeu_cau_nhap_kho ycn
       JOIN phong_ban pb ON ycn.don_vi_yeu_cau_id = pb.id
       WHERE ycn.id = $1`,
      [id]
    );

    if (yeuCauResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "Không tìm thấy yêu cầu");
    }

    const yeuCau = yeuCauResult.rows[0];

    if (yeuCau.trang_thai !== "approved") {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Chỉ có thể chuyển đổi yêu cầu đã được phê duyệt"
      );
    }

    if (yeuCau.phieu_nhap_id) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Yêu cầu đã được chuyển thành phiếu nhập"
      );
    }

    // Lấy chi tiết yêu cầu đã được duyệt
    const chiTietResult = await client.query(
      `SELECT ct.*, h.gia_nhap_gan_nhat
       FROM chi_tiet_yeu_cau_nhap ct
       JOIN hang_hoa h ON ct.hang_hoa_id = h.id
       WHERE ct.yeu_cau_nhap_id = $1 AND ct.so_luong_duyet > 0`,
      [id]
    );

    if (chiTietResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Không có hàng hóa nào được duyệt để tạo phiếu nhập"
      );
    }

    // Tạo số phiếu nhập tự động
    const dateStr = new Date(ngay_nhap || new Date())
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");

    const maxResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(so_phieu FROM 11) AS INTEGER)), 0) as max_seq 
       FROM phieu_nhap 
       WHERE so_phieu LIKE $1`,
      [`PN${dateStr}%`]
    );

    const nextSeq = maxResult.rows[0].max_seq + 1;
    const soPhieu = `PN${dateStr}${String(nextSeq).padStart(3, "0")}`;

    // Tính tổng tiền
    let tongTien = 0;
    chiTietResult.rows.forEach((item) => {
      const donGia = item.don_gia_uoc_tinh || item.gia_nhap_gan_nhat || 0;
      tongTien += item.so_luong_duyet * donGia;
    });

    // Tạo phiếu nhập
    const phieuNhapResult = await client.query(
      `INSERT INTO phieu_nhap (
        so_phieu, ngay_nhap, nha_cung_cap_id, ly_do_nhap, loai_phieu,
        so_hoa_don, phong_ban_id, ghi_chu, nguoi_tao, tong_tien, trang_thai
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft')
      RETURNING *`,
      [
        soPhieu,
        ngay_nhap || new Date().toISOString().split("T")[0],
        nha_cung_cap_id,
        `Từ yêu cầu: ${yeuCau.so_yeu_cau} - ${yeuCau.ly_do_yeu_cau}`,
        loai_phieu,
        so_hoa_don,
        yeuCau.don_vi_yeu_cau_id,
        `${ghi_chu_phieu || ""}\nChuyển từ yêu cầu nhập kho: ${
          yeuCau.so_yeu_cau
        }`,
        user.id,
        tongTien,
      ]
    );

    const phieuNhap = phieuNhapResult.rows[0];

    // Tạo chi tiết phiếu nhập
    for (const item of chiTietResult.rows) {
      const donGia = item.don_gia_uoc_tinh || item.gia_nhap_gan_nhat || 0;
      const thanhTien = item.so_luong_duyet * donGia;

      await client.query(
        `INSERT INTO chi_tiet_nhap (
          phieu_nhap_id, hang_hoa_id, so_luong, don_gia, thanh_tien,
          pham_chat, ghi_chu
        ) VALUES ($1, $2, $3, $4, $5, 'tot', $6)`,
        [
          phieuNhap.id,
          item.hang_hoa_id,
          item.so_luong_duyet,
          donGia,
          thanhTien,
          `Từ yêu cầu: ${item.ly_do_su_dung || ""}`,
        ]
      );
    }

    // Cập nhật yêu cầu với ID phiếu nhập
    await client.query(
      `UPDATE yeu_cau_nhap_kho SET
        phieu_nhap_id = $1,
        trang_thai = 'completed',
        ngay_hoan_thanh = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2`,
      [phieuNhap.id, id]
    );

    await client.query("COMMIT");

    sendResponse(res, 200, true, "Chuyển đổi thành phiếu nhập thành công", {
      phieu_nhap_id: phieuNhap.id,
      so_phieu: phieuNhap.so_phieu,
      tong_tien: tongTien,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Convert to phieu nhap error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

// Phê duyệt yêu cầu xuất kho
const approveYeuCauXuat = async (req, res, params, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;
    const { ghi_chu_duyet, chi_tiet_duyet = [] } = body;

    // Kiểm tra yêu cầu tồn tại
    const yeuCauResult = await client.query(
      "SELECT * FROM yeu_cau_xuat_kho WHERE id = $1",
      [id]
    );

    if (yeuCauResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "Không tìm thấy yêu cầu");
    }

    const yeuCau = yeuCauResult.rows[0];

    // Kiểm tra trạng thái
    if (!["confirmed", "under_review"].includes(yeuCau.trang_thai)) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Yêu cầu không ở trạng thái có thể phê duyệt"
      );
    }

    // Kiểm tra tồn kho trước khi duyệt
    const tonKhoCheck = await client.query(
      `SELECT * FROM check_ton_kho_for_yeu_cau($1)`,
      [id]
    );

    const khongDuHang = tonKhoCheck.rows.filter((item) => !item.co_the_xuat);
    if (khongDuHang.length > 0) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "Không đủ tồn kho để phê duyệt yêu cầu",
        { chi_tiet_thieu: khongDuHang }
      );
    }

    // Cập nhật số lượng được duyệt
    if (chi_tiet_duyet.length > 0) {
      for (const item of chi_tiet_duyet) {
        await client.query(
          `UPDATE chi_tiet_yeu_cau_xuat 
           SET so_luong_duyet = $1 
           WHERE yeu_cau_xuat_id = $2 AND hang_hoa_id = $3`,
          [item.so_luong_duyet, id, item.hang_hoa_id]
        );
      }
    } else {
      // Duyệt toàn bộ theo số lượng yêu cầu
      await client.query(
        `UPDATE chi_tiet_yeu_cau_xuat 
         SET so_luong_duyet = so_luong_yeu_cau 
         WHERE yeu_cau_xuat_id = $1`,
        [id]
      );
    }

    // Cập nhật trạng thái yêu cầu
    await client.query(
      `UPDATE yeu_cau_xuat_kho SET
        trang_thai = 'approved',
        nguoi_duyet = $1,
        ngay_duyet = CURRENT_TIMESTAMP,
        ghi_chu_duyet = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3`,
      [user.id, ghi_chu_duyet, id]
    );

    // Tạo bản ghi workflow approval
    await client.query(
      `INSERT INTO workflow_approvals (
        yeu_cau_id, loai_yeu_cau, nguoi_duyet, phong_ban_duyet,
        trang_thai, ngay_xu_ly, ly_do_quyet_dinh, ghi_chu
      ) VALUES ($1, 'xuat_kho', $2, $3, 'approved', CURRENT_TIMESTAMP, $4, $5)`,
      [
        id,
        user.id,
        user.phong_ban_id,
        "Phê duyệt yêu cầu xuất kho",
        ghi_chu_duyet,
      ]
    );

    await client.query("COMMIT");

    sendResponse(res, 200, true, "Phê duyệt yêu cầu thành công");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Approve yeu cau xuat error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

// Từ chối yêu cầu xuất kho
const rejectYeuCauXuat = async (req, res, params, body, user) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = params;
    const { ly_do_tu_choi, ghi_chu_duyet } = body;

    if (!ly_do_tu_choi) {
      await client.query("ROLLBACK");
      return sendResponse(res, 400, false, "Vui lòng nhập lý do từ chối");
    }

    // Cập nhật trạng thái yêu cầu
    await client.query(
      `UPDATE yeu_cau_xuat_kho SET
        trang_thai = 'rejected',
        nguoi_duyet = $1,
        ngay_duyet = CURRENT_TIMESTAMP,
        ly_do_tu_choi = $2,
        ghi_chu_duyet = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4`,
      [user.id, ly_do_tu_choi, ghi_chu_duyet, id]
    );

    // Tạo bản ghi workflow approval
    await client.query(
      `INSERT INTO workflow_approvals (
        yeu_cau_id, loai_yeu_cau, nguoi_duyet, phong_ban_duyet,
        trang_thai, ngay_xu_ly, ly_do_quyet_dinh, ghi_chu
      ) VALUES ($1, 'xuat_kho', $2, $3, 'rejected', CURRENT_TIMESTAMP, $4, $5)`,
      [id, user.id, user.phong_ban_id, ly_do_tu_choi, ghi_chu_duyet]
    );

    await client.query("COMMIT");

    sendResponse(res, 200, true, "Từ chối yêu cầu thành công");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Reject yeu cau xuat error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  } finally {
    client.release();
  }
};

// Lấy thống kê workflow
const getWorkflowStats = async (req, res, query, user) => {
  try {
    const { tu_ngay, den_ngay } = query;

    let dateFilter = "";
    const params = [];

    if (tu_ngay && den_ngay) {
      dateFilter = " AND created_at BETWEEN $1 AND $2";
      params.push(tu_ngay, den_ngay);
    }

    // Thống kê yêu cầu nhập kho
    const nhapStats = await pool.query(
      `SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE trang_thai = 'draft') as draft_count,
        COUNT(*) FILTER (WHERE trang_thai = 'confirmed') as confirmed_count,
        COUNT(*) FILTER (WHERE trang_thai = 'under_review') as under_review_count,
        COUNT(*) FILTER (WHERE trang_thai = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE trang_thai = 'rejected') as rejected_count,
        COUNT(*) FILTER (WHERE trang_thai = 'completed') as completed_count,
        AVG(EXTRACT(EPOCH FROM (COALESCE(ngay_duyet, CURRENT_TIMESTAMP) - created_at))/3600) as avg_processing_hours
      FROM yeu_cau_nhap_kho 
      WHERE 1=1 ${dateFilter}`,
      params
    );

    // Thống kê yêu cầu xuất kho
    const xuatStats = await pool.query(
      `SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE trang_thai = 'draft') as draft_count,
        COUNT(*) FILTER (WHERE trang_thai = 'confirmed') as confirmed_count,
        COUNT(*) FILTER (WHERE trang_thai = 'under_review') as under_review_count,
        COUNT(*) FILTER (WHERE trang_thai = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE trang_thai = 'rejected') as rejected_count,
        COUNT(*) FILTER (WHERE trang_thai = 'completed') as completed_count,
        AVG(EXTRACT(EPOCH FROM (COALESCE(ngay_duyet, CURRENT_TIMESTAMP) - created_at))/3600) as avg_processing_hours
      FROM yeu_cau_xuat_kho 
      WHERE 1=1 ${dateFilter}`,
      params
    );

    // Thống kê theo đơn vị
    const donViStats = await pool.query(
      `SELECT 
        pb.ten_phong_ban,
        COUNT(ycn.id) as nhap_requests,
        COUNT(ycx.id) as xuat_requests
      FROM phong_ban pb
      LEFT JOIN yeu_cau_nhap_kho ycn ON pb.id = ycn.don_vi_yeu_cau_id ${dateFilter.replace(
        "created_at",
        "ycn.created_at"
      )}
      LEFT JOIN yeu_cau_xuat_kho ycx ON pb.id = ycx.don_vi_yeu_cau_id ${dateFilter.replace(
        "created_at",
        "ycx.created_at"
      )}
      GROUP BY pb.id, pb.ten_phong_ban
      ORDER BY pb.ten_phong_ban`,
      params.concat(params) // Duplicate params for both LEFT JOINs
    );

    sendResponse(res, 200, true, "Lấy thống kê workflow thành công", {
      nhap_kho: nhapStats.rows[0],
      xuat_kho: xuatStats.rows[0],
      don_vi_stats: donViStats.rows,
    });
  } catch (error) {
    console.error("Get workflow stats error:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

module.exports = {
  approveYeuCauNhap,
  rejectYeuCauNhap,
  convertToPhieuNhap,
  approveYeuCauXuat,
  rejectYeuCauXuat,
  getWorkflowStats,
};
