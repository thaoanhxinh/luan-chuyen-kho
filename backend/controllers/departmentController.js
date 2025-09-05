const pool = require("../config/database");
const { sendResponse } = require("../utils/response");

const getDepartments = async (req, res, query, user) => {
  try {
    if (user.role !== "admin") {
      return sendResponse(res, 403, false, "Không có quyền truy cập");
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = query.search || "";

    let whereClause = "WHERE 1=1";
    let queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (pb.ten_phong_ban ILIKE $${paramIndex} OR pb.ma_phong_ban ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Query departments without truong_phong_id (since it doesn't exist in current schema)
    const departmentsQuery = `
      SELECT 
        pb.id,
        pb.ma_phong_ban,
        pb.ten_phong_ban,
        pb.mo_ta,
        pb.cap_bac,
        pb.phong_ban_cha_id,
        pb.trang_thai::text as is_active,
        pb.created_at,
        COUNT(u.id) as so_nhan_vien
      FROM phong_ban pb
      LEFT JOIN users u ON pb.id = u.phong_ban_id AND u.trang_thai = 'active'
      ${whereClause}
      GROUP BY pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.mo_ta, pb.cap_bac, pb.phong_ban_cha_id, pb.trang_thai, pb.created_at
      ORDER BY pb.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM phong_ban pb
      ${whereClause}
    `;

    const [departmentsResult, countResult] = await Promise.all([
      pool.query(departmentsQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)),
    ]);

    const departments = departmentsResult.rows.map((dept) => ({
      ...dept,
      is_active: dept.is_active === "active",
      so_nhan_vien: parseInt(dept.so_nhan_vien),
      // Set default values for missing fields
      dia_chi: null,
      so_dien_thoai: null,
      email: null,
      truong_phong_id: null,
      truong_phong_name: null,
    }));

    const total = parseInt(countResult.rows[0].total);

    sendResponse(res, 200, true, "Lấy danh sách phòng ban thành công", {
      items: departments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get departments error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

const createDepartment = async (req, res, body, user) => {
  try {
    // Admin (cấp 1) có thể tạo cấp 2,3; Manager (cấp 2) chỉ tạo cấp 3
    if (!["admin", "manager"].includes(user.role)) {
      return sendResponse(res, 403, false, "Không có quyền truy cập");
    }

    const {
      ma_phong_ban,
      ten_phong_ban,
      mo_ta,
      is_active = true,
      cap_bac,
      phong_ban_cha_id,
    } = body;

    if (!ma_phong_ban || !ten_phong_ban) {
      return sendResponse(
        res,
        400,
        false,
        "Mã phòng ban và tên phòng ban là bắt buộc"
      );
    }

    // Validate cap_bac per role
    const capBacValue = parseInt(cap_bac, 10) || 3;
    if (user.role === "manager" && capBacValue !== 3) {
      return sendResponse(
        res,
        400,
        false,
        "Cấp 2 chỉ được tạo phòng ban cấp 3"
      );
    }
    if (user.role === "admin" && ![2, 3].includes(capBacValue)) {
      return sendResponse(
        res,
        400,
        false,
        "Admin chỉ tạo phòng ban cấp 2 hoặc cấp 3"
      );
    }

    // Validate parent
    let parentId = phong_ban_cha_id ? parseInt(phong_ban_cha_id, 10) : null;
    if (capBacValue === 3) {
      // cấp 3 bắt buộc phải có phòng ban cha cấp 2
      if (!parentId) {
        return sendResponse(
          res,
          400,
          false,
          "Phòng ban cấp 3 phải có phòng ban cha"
        );
      }
      // Manager chỉ được đặt parent là phòng ban của mình
      if (user.role === "manager" && parentId !== user.phong_ban_id) {
        return sendResponse(
          res,
          403,
          false,
          "Không được tạo dưới phòng ban khác"
        );
      }
    } else if (capBacValue === 2) {
      // cấp 2: không có cha
      parentId = null;
    }

    // Check if department code already exists
    const existingDeptQuery =
      "SELECT id FROM phong_ban WHERE ma_phong_ban = $1";
    const existingDept = await pool.query(existingDeptQuery, [ma_phong_ban]);

    if (existingDept.rows.length > 0) {
      return sendResponse(res, 400, false, "Mã phòng ban đã tồn tại");
    }

    // Insert with current schema structure
    const insertQuery = `
      INSERT INTO phong_ban (ma_phong_ban, ten_phong_ban, mo_ta, cap_bac, phong_ban_cha_id, trang_thai, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      ma_phong_ban,
      ten_phong_ban,
      mo_ta,
      capBacValue,
      parentId,
      is_active ? "active" : "inactive",
    ]);

    sendResponse(res, 201, true, "Tạo phòng ban thành công", result.rows[0]);
  } catch (error) {
    console.error("Create department error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

const updateDepartment = async (req, res, params, body, user) => {
  try {
    if (user.role !== "admin") {
      return sendResponse(res, 403, false, "Không có quyền truy cập");
    }

    const { id } = params;
    const { ma_phong_ban, ten_phong_ban, mo_ta, is_active } = body;

    const updateQuery = `
      UPDATE phong_ban 
      SET ma_phong_ban = $1, ten_phong_ban = $2, mo_ta = $3, trang_thai = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      ma_phong_ban,
      ten_phong_ban,
      mo_ta,
      is_active ? "active" : "inactive",
      id,
    ]);

    if (result.rows.length === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy phòng ban");
    }

    sendResponse(
      res,
      200,
      true,
      "Cập nhật phòng ban thành công",
      result.rows[0]
    );
  } catch (error) {
    console.error("Update department error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

const deleteDepartment = async (req, res, params, user) => {
  try {
    if (user.role !== "admin") {
      return sendResponse(res, 403, false, "Không có quyền truy cập");
    }

    const { id } = params;

    // Check if department has users
    const usersInDeptQuery =
      "SELECT COUNT(*) as count FROM users WHERE phong_ban_id = $1";
    const usersResult = await pool.query(usersInDeptQuery, [id]);

    if (parseInt(usersResult.rows[0].count) > 0) {
      return sendResponse(
        res,
        400,
        false,
        "Không thể xóa phòng ban có nhân viên"
      );
    }

    const deleteQuery = "DELETE FROM phong_ban WHERE id = $1";
    const result = await pool.query(deleteQuery, [id]);

    if (result.rowCount === 0) {
      return sendResponse(res, 404, false, "Không tìm thấy phòng ban");
    }

    sendResponse(res, 200, true, "Xóa phòng ban thành công");
  } catch (error) {
    console.error("Delete department error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

const assignUsers = async (req, res, params, body, user) => {
  try {
    if (user.role !== "admin") {
      return sendResponse(res, 403, false, "Không có quyền truy cập");
    }

    const { id } = params;
    const { userIds } = body;

    if (!Array.isArray(userIds)) {
      return sendResponse(res, 400, false, "userIds phải là một mảng");
    }

    const updateQuery = `
      UPDATE users 
      SET phong_ban_id = $1, updated_at = NOW()
      WHERE id = ANY($2::int[])
      RETURNING id, ho_ten
    `;

    const result = await pool.query(updateQuery, [id, userIds]);

    sendResponse(res, 200, true, "Phân công nhân viên thành công", {
      departmentId: id,
      assignedUsers: result.rows,
    });
  } catch (error) {
    console.error("Assign users error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

// API cho dropdown trong hàng hóa (có phân quyền)
const getDepartmentsList = async (req, res, query, user) => {
  try {
    console.log("🏢 Getting departments list for dropdown with permissions");

    let departmentsQuery;
    let params = [];

    if (user.role === "admin") {
      // Admin xem được tất cả phòng ban
      departmentsQuery = `
        SELECT 
          id,
          ma_phong_ban,
          ten_phong_ban,
          cap_bac,
          CASE 
            WHEN cap_bac = 1 THEN 'BTL Vùng'
            WHEN cap_bac = 2 THEN 'Phòng ban/Ban chuyên môn'
            WHEN cap_bac = 3 THEN 'Đơn vị tác nghiệp'
            ELSE 'Khác'
          END as mo_ta_cap_bac
        FROM phong_ban 
        WHERE is_active = TRUE
        ORDER BY cap_bac, ten_phong_ban
      `;
    } else if (user.role === "manager") {
      // Manager chỉ xem được các đơn vị cấp 3 dưới quyền
      departmentsQuery = `
        SELECT 
          id,
          ma_phong_ban,
          ten_phong_ban,
          cap_bac,
          'Đơn vị tác nghiệp dưới quyền' as mo_ta_cap_bac
        FROM phong_ban 
        WHERE is_active = TRUE 
        AND cap_bac = 3 
        AND phong_ban_cha_id = $1
        ORDER BY ten_phong_ban
      `;
      params = [user.phong_ban_id];
    } else {
      // User thường không được chọn phòng ban khác
      return sendResponse(res, 200, true, "Danh sách phòng ban khả dụng", []);
    }

    const result = await pool.query(departmentsQuery, params);

    console.log(
      `📦 Found ${result.rows.length} departments for role: ${user.role}`
    );

    sendResponse(
      res,
      200,
      true,
      "Lấy danh sách phòng ban thành công",
      result.rows
    );
  } catch (error) {
    console.error("Get departments list error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignUsers,
  getDepartmentsList,
};
