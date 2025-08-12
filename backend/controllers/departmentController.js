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
        pb.trang_thai::text as is_active,
        pb.created_at,
        COUNT(u.id) as so_nhan_vien
      FROM phong_ban pb
      LEFT JOIN users u ON pb.id = u.phong_ban_id AND u.trang_thai = 'active'
      ${whereClause}
      GROUP BY pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.mo_ta, pb.trang_thai, pb.created_at
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
    if (user.role !== "admin") {
      return sendResponse(res, 403, false, "Không có quyền truy cập");
    }

    const { ma_phong_ban, ten_phong_ban, mo_ta, is_active = true } = body;

    if (!ma_phong_ban || !ten_phong_ban) {
      return sendResponse(
        res,
        400,
        false,
        "Mã phòng ban và tên phòng ban là bắt buộc"
      );
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
      INSERT INTO phong_ban (ma_phong_ban, ten_phong_ban, mo_ta, trang_thai, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      ma_phong_ban,
      ten_phong_ban,
      mo_ta,
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

const getDepartmentsList = async (req, res, query, user) => {
  try {
    if (user.role !== "admin") {
      return sendResponse(res, 403, false, "Không có quyền truy cập");
    }

    console.log("🏢 Getting departments list for dropdown");

    const departmentsQuery = `
      SELECT 
        id,
        ten_phong_ban
      FROM phong_ban 
      WHERE trang_thai = 'active'
      ORDER BY ma_phong_ban, ten_phong_ban
    `;

    const result = await pool.query(departmentsQuery);

    console.log(`📦 Found ${result.rows.length} departments`);

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
