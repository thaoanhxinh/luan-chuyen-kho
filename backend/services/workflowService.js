// services/workflowService.js
const pool = require("../config/database");

/**
 * Service chứa business logic cho workflow yêu cầu nhập/xuất kho
 */
const workflowService = {
  /**
   * Kiểm tra quyền phê duyệt của user
   */
  async checkApprovalPermission(userId, loaiYeuCau, yeuCauId) {
    try {
      // Admin có toàn quyền
      const userResult = await pool.query(
        "SELECT role, phong_ban_id FROM users WHERE id = $1",
        [userId]
      );

      if (userResult.rows.length === 0) {
        return { hasPermission: false, reason: "User không tồn tại" };
      }

      const user = userResult.rows[0];

      if (user.role === "admin") {
        return { hasPermission: true, level: "admin" };
      }

      // Kiểm tra phòng ban có quyền phê duyệt
      const phongQuanLyKho = await pool.query(
        "SELECT id FROM phong_ban WHERE ma_phong_ban IN ('HCK', 'TMKH')"
      );

      const phongQuanLyIds = phongQuanLyKho.rows.map((row) => row.id);

      if (phongQuanLyIds.includes(user.phong_ban_id)) {
        return { hasPermission: true, level: "manager" };
      }

      return { hasPermission: false, reason: "Không có quyền phê duyệt" };
    } catch (error) {
      console.error("Check approval permission error:", error);
      throw new Error("Lỗi kiểm tra quyền phê duyệt");
    }
  },

  /**
   * Tự động định tuyến yêu cầu đến người phê duyệt
   */
  async routeRequestForApproval(yeuCauId, loaiYeuCau, donViYeuCauId) {
    try {
      // Lấy danh sách người có thể phê duyệt
      const approversResult = await pool.query(
        `SELECT u.id, u.ho_ten, u.email, pb.ten_phong_ban
         FROM users u
         JOIN phong_ban pb ON u.phong_ban_id = pb.id
         WHERE pb.ma_phong_ban IN ('HCK', 'TMKH') 
         AND u.trang_thai = 'active'
         ORDER BY u.role DESC, u.id`
      );

      if (approversResult.rows.length === 0) {
        throw new Error("Không tìm thấy người phê duyệt");
      }

      // Tạo workflow approval records
      const workflowRecords = [];
      for (const approver of approversResult.rows) {
        const result = await pool.query(
          `INSERT INTO workflow_approvals (
            yeu_cau_id, loai_yeu_cau, nguoi_duyet, phong_ban_duyet,
            trang_thai, step_number, ngay_nhan
          ) VALUES ($1, $2, $3, $4, 'under_review', 1, CURRENT_TIMESTAMP)
          RETURNING *`,
          [yeuCauId, loaiYeuCau, approver.id, approver.phong_ban_id]
        );
        workflowRecords.push(result.rows[0]);
      }

      return {
        success: true,
        approvers: approversResult.rows,
        workflowRecords,
      };
    } catch (error) {
      console.error("Route request error:", error);
      throw new Error("Lỗi định tuyến yêu cầu");
    }
  },

  /**
   * Lấy thống kê workflow theo thời gian
   */
  async getWorkflowStatistics(tuNgay, denNgay, phongBanId) {
    try {
      let whereClause = "WHERE 1=1";
      const params = [];
      let paramCount = 0;

      if (tuNgay && denNgay) {
        paramCount += 2;
        whereClause += ` AND created_at BETWEEN $${
          paramCount - 1
        } AND $${paramCount}`;
        params.push(tuNgay, denNgay);
      }

      if (phongBanId) {
        paramCount++;
        whereClause += ` AND don_vi_yeu_cau_id = $${paramCount}`;
        params.push(phongBanId);
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
          AVG(EXTRACT(EPOCH FROM (COALESCE(ngay_duyet, CURRENT_TIMESTAMP) - created_at))/3600) as avg_processing_hours,
          SUM(tong_gia_tri_uoc_tinh) as total_estimated_value
        FROM yeu_cau_nhap_kho ${whereClause}`,
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
          AVG(EXTRACT(EPOCH FROM (COALESCE(ngay_duyet, CURRENT_TIMESTAMP) - created_at))/3600) as avg_processing_hours,
          SUM(tong_gia_tri_uoc_tinh) as total_estimated_value
        FROM yeu_cau_xuat_kho ${whereClause}`,
        params
      );

      // Thống kê theo mức độ ưu tiên
      const priorityStats = await pool.query(
        `SELECT 
          'nhap_kho' as loai_yeu_cau,
          muc_do_uu_tien,
          COUNT(*) as so_luong,
          AVG(EXTRACT(EPOCH FROM (COALESCE(ngay_duyet, CURRENT_TIMESTAMP) - created_at))/3600) as avg_processing_hours
        FROM yeu_cau_nhap_kho ${whereClause}
        GROUP BY muc_do_uu_tien
        UNION ALL
        SELECT 
          'xuat_kho' as loai_yeu_cau,
          muc_do_uu_tien,
          COUNT(*) as so_luong,
          AVG(EXTRACT(EPOCH FROM (COALESCE(ngay_duyet, CURRENT_TIMESTAMP) - created_at))/3600) as avg_processing_hours
        FROM yeu_cau_xuat_kho ${whereClause}
        GROUP BY muc_do_uu_tien
        ORDER BY loai_yeu_cau, 
          CASE muc_do_uu_tien 
            WHEN 'khan_cap' THEN 1
            WHEN 'cao' THEN 2
            WHEN 'binh_thuong' THEN 3
            WHEN 'thap' THEN 4
          END`,
        params.concat(params)
      );

      return {
        nhap_kho: nhapStats.rows[0],
        xuat_kho: xuatStats.rows[0],
        priority_breakdown: priorityStats.rows,
        date_range: { tuNgay, denNgay },
        phong_ban_id: phongBanId,
      };
    } catch (error) {
      console.error("Get workflow statistics error:", error);
      throw new Error("Lỗi lấy thống kê workflow");
    }
  },

  /**
   * Lấy yêu cầu cần phê duyệt cho user
   */
  async getPendingApprovalsForUser(userId, filters = {}) {
    try {
      const { page = 1, limit = 20, loai_yeu_cau, muc_do_uu_tien } = filters;
      const offset = (page - 1) * limit;

      // Kiểm tra quyền của user
      const permission = await this.checkApprovalPermission(userId, null, null);
      if (!permission.hasPermission) {
        return { items: [], total: 0, pages: 0 };
      }

      let unionQuery = "";
      const params = [limit, offset];
      let paramCount = 2;

      // Query cho yêu cầu nhập kho
      if (!loai_yeu_cau || loai_yeu_cau === "nhap_kho") {
        let nhapWhereClause =
          "WHERE ycn.trang_thai IN ('confirmed', 'under_review')";

        if (muc_do_uu_tien) {
          paramCount++;
          nhapWhereClause += ` AND ycn.muc_do_uu_tien = $${paramCount}`;
          params.push(muc_do_uu_tien);
        }

        unionQuery += `
          SELECT 
            'nhap_kho' as loai_yeu_cau,
            ycn.id,
            ycn.so_yeu_cau,
            ycn.ngay_yeu_cau,
            ycn.ly_do_yeu_cau,
            ycn.muc_do_uu_tien,
            ycn.tong_gia_tri_uoc_tinh,
            ycn.so_mat_hang,
            ycn.created_at,
            pb.ten_phong_ban as don_vi_yeu_cau,
            u.ho_ten as nguoi_yeu_cau
          FROM yeu_cau_nhap_kho ycn
          JOIN phong_ban pb ON ycn.don_vi_yeu_cau_id = pb.id
          JOIN users u ON ycn.nguoi_yeu_cau = u.id
          ${nhapWhereClause}
        `;
      }

      // Query cho yêu cầu xuất kho
      if (!loai_yeu_cau || loai_yeu_cau === "xuat_kho") {
        let xuatWhereClause =
          "WHERE ycx.trang_thai IN ('confirmed', 'under_review')";

        if (muc_do_uu_tien) {
          if (unionQuery) paramCount++; // Chỉ tăng nếu đã có query trước
          xuatWhereClause += ` AND ycx.muc_do_uu_tien = $${paramCount}`;
          if (!unionQuery) params.push(muc_do_uu_tien); // Chỉ push nếu chưa push
        }

        if (unionQuery) unionQuery += " UNION ALL ";

        unionQuery += `
          SELECT 
            'xuat_kho' as loai_yeu_cau,
            ycx.id,
            ycx.so_yeu_cau,
            ycx.ngay_yeu_cau,
            ycx.ly_do_yeu_cau,
            ycx.muc_do_uu_tien,
            ycx.tong_gia_tri_uoc_tinh,
            ycx.so_mat_hang,
            ycx.created_at,
            pb.ten_phong_ban as don_vi_yeu_cau,
            u.ho_ten as nguoi_yeu_cau
          FROM yeu_cau_xuat_kho ycx
          JOIN phong_ban pb ON ycx.don_vi_yeu_cau_id = pb.id
          JOIN users u ON ycx.nguoi_yeu_cau = u.id
          ${xuatWhereClause}
        `;
      }

      const finalQuery = `
        WITH pending_requests AS (${unionQuery})
        SELECT * FROM pending_requests
        ORDER BY 
          CASE muc_do_uu_tien 
            WHEN 'khan_cap' THEN 1
            WHEN 'cao' THEN 2
            WHEN 'binh_thuong' THEN 3
            WHEN 'thap' THEN 4
          END,
          created_at ASC
        LIMIT $1 OFFSET $2
      `;

      // Count query
      const countQuery = `
        WITH pending_requests AS (${unionQuery})
        SELECT COUNT(*) FROM pending_requests
      `;

      const [dataResult, countResult] = await Promise.all([
        pool.query(finalQuery, params),
        pool.query(countQuery, params.slice(2)), // Bỏ limit và offset
      ]);

      const total = parseInt(countResult.rows[0].count);
      const pages = Math.ceil(total / limit);

      return {
        items: dataResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages,
        },
      };
    } catch (error) {
      console.error("Get pending approvals error:", error);
      throw new Error("Lỗi lấy danh sách chờ phê duyệt");
    }
  },

  /**
   * Cập nhật trạng thái workflow
   */
  async updateWorkflowStatus(
    yeuCauId,
    loaiYeuCau,
    trangThaiMoi,
    nguoiXuLy,
    lyDo = null
  ) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Cập nhật bản ghi workflow_approvals
      await client.query(
        `UPDATE workflow_approvals 
         SET trang_thai = $1, ngay_xu_ly = CURRENT_TIMESTAMP, ly_do_quyet_dinh = $2
         WHERE yeu_cau_id = $3 AND loai_yeu_cau = $4 AND nguoi_duyet = $5`,
        [trangThaiMoi, lyDo, yeuCauId, loaiYeuCau, nguoiXuLy]
      );

      await client.query("COMMIT");

      return { success: true };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Update workflow status error:", error);
      throw new Error("Lỗi cập nhật trạng thái workflow");
    } finally {
      client.release();
    }
  },

  /**
   * Kiểm tra tồn kho cho yêu cầu xuất
   */
  async validateStockForExportRequest(yeuCauXuatId) {
    try {
      const result = await pool.query(
        "SELECT * FROM check_ton_kho_for_yeu_cau($1)",
        [yeuCauXuatId]
      );

      const validationResults = result.rows.map((row) => ({
        hang_hoa_id: row.hang_hoa_id,
        ten_hang_hoa: row.ten_hang_hoa,
        so_luong_yeu_cau: parseFloat(row.so_luong_yeu_cau),
        so_luong_ton: parseFloat(row.so_luong_ton),
        co_the_xuat: row.co_the_xuat,
        ghi_chu: row.ghi_chu,
      }));

      const invalidItems = validationResults.filter(
        (item) => !item.co_the_xuat
      );

      return {
        isValid: invalidItems.length === 0,
        invalidItems,
        allItems: validationResults,
      };
    } catch (error) {
      console.error("Validate stock error:", error);
      throw new Error("Lỗi kiểm tra tồn kho");
    }
  },
};

module.exports = workflowService;
