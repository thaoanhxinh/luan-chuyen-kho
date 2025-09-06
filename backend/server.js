const http = require("http");
const url = require("url");
const pool = require("./config/database");
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const { sendResponse } = require("./utils/response");
const { parseBody, parseUrl, extractParams } = require("./utils/helpers");
const { verifyToken, getTokenFromRequest } = require("./utils/auth");
const { Server } = require("socket.io");
const { createServer } = require("http");
const { v4: uuidv4 } = require("uuid");

// Import all controllers
const authController = require("./controllers/authController");
const hangHoaController = require("./controllers/hangHoaController");
const nhapKhoController = require("./controllers/nhapKhoController");
const xuatKhoController = require("./controllers/xuatKhoController");
const kiemKeController = require("./controllers/kiemKeController");
const baoCaoController = require("./controllers/baoCaoController");
const userController = require("./controllers/userController");
const departmentController = require("./controllers/departmentController");
const hangHoaSearchController = require("./controllers/hangHoaSearchController");
const nhaCungCapSearchController = require("./controllers/nhaCungCapSearchController");
const donViNhanSearchController = require("./controllers/donViNhanSearchController");
const printController = require("./controllers/printController");
const donViNhanController = require("./controllers/donViNhanController");
const loaiHangHoaController = require("./controllers/loaiHangHoaController");
const nhaCungCapController = require("./controllers/nhaCungCapController");

const yeuCauNhapKhoController = require("./controllers/yeuCauNhapKhoController");
const yeuCauXuatKhoController = require("./controllers/yeuCauXuatKhoController");
const workflowController = require("./controllers/workflowController");
const notificationController = require("./controllers/notificationController");

const {
  autoApplyWorkflowMiddleware,
  getRouteMiddleware,
  applyMiddlewares,
} = require("./middleware/workflowMiddleware");
const { auditLogger } = require("./middleware/auditLogger");

const PORT = 5000;

const connectedClients = new Map(); // Lưu trữ thông tin clients
const userSocketMap = new Map(); // Map userId -> socketId

// CORS Middleware
const handleCORS = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return true;
  }
  return false;
};

const authenticateWithWorkflow = async (req) => {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  try {
    const userQuery = `
      SELECT u.*, pb.ten_phong_ban, pb.ma_phong_ban 
      FROM users u 
      LEFT JOIN phong_ban pb ON u.phong_ban_id = pb.id 
      WHERE u.id = $1 AND u.trang_thai = $2
    `;
    const result = await pool.query(userQuery, [decoded.id, "active"]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      // Thêm thông tin phòng ban vào user object
      user.phong_ban_info = {
        id: user.phong_ban_id,
        ten_phong_ban: user.ten_phong_ban,
        ma_phong_ban: user.ma_phong_ban,
      };
      return user;
    }
    return null;
  } catch (error) {
    console.error("Enhanced auth error:", error);
    return null;
  }
};

const authenticate = async (req) => {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  try {
    // ✅ SỬA LỖI: JOIN với bảng phong_ban để lấy đầy đủ thông tin
    const userQuery = `
      SELECT 
        u.*, 
        pb.ma_phong_ban, 
        pb.ten_phong_ban, 
        pb.cap_bac, 
        pb.phong_ban_cha_id
      FROM users u
      LEFT JOIN phong_ban pb ON u.phong_ban_id = pb.id
      WHERE u.id = $1 AND u.trang_thai = 'active'
    `;
    const result = await pool.query(userQuery, [decoded.id]);

    if (result.rows.length > 0) {
      const userData = result.rows[0];

      // ✅ SỬA LỖI: Tạo object user có cấu trúc lồng nhau user.phong_ban
      // để controller có thể truy cập user.phong_ban.cap_bac
      const user = {
        ...userData,
        phong_ban: {
          id: userData.phong_ban_id,
          ma_phong_ban: userData.ma_phong_ban,
          ten_phong_ban: userData.ten_phong_ban,
          cap_bac: userData.cap_bac,
          phong_ban_cha_id: userData.phong_ban_cha_id,
        },
      };

      // Xóa các trường thừa ở cấp ngoài cùng để tránh nhầm lẫn
      delete user.ma_phong_ban;
      delete user.ten_phong_ban;
      delete user.cap_bac;
      delete user.phong_ban_cha_id;

      return user;
    }

    return null;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
};

// Hàm xử lý upload file (với formidable v1.2.6)
const handleFileUpload = (req) => {
  return new Promise((resolve, reject) => {
    const IncomingForm = formidable.IncomingForm;
    const form = new IncomingForm();

    const uploadDir = path.join(__dirname, "uploads", "decisions");

    // Tạo thư mục nếu chưa có
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Cấu hình form
    form.uploadDir = uploadDir;
    form.keepExtensions = true;
    form.maxFileSize = 10 * 1024 * 1024; // 10MB

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }

      const uploadedFile = files.decision_pdf;
      if (!uploadedFile) {
        reject(new Error("Không tìm thấy file"));
        return;
      }

      // Lấy file đầu tiên nếu là array
      const file = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;

      resolve({
        file: file,
        ghi_chu: fields.ghi_chu_hoan_thanh
          ? Array.isArray(fields.ghi_chu_hoan_thanh)
            ? fields.ghi_chu_hoan_thanh[0]
            : fields.ghi_chu_hoan_thanh
          : "",
      });
    });
  });
};

// Hàm serve static file
const serveStaticFile = (req, res, filePath) => {
  const fullPath = path.join(__dirname, filePath.substring(1)); // Bỏ dấu / đầu

  if (!fs.existsSync(fullPath)) {
    return sendResponse(res, 404, false, "File không tồn tại");
  }

  const ext = path.extname(fullPath).toLowerCase();
  let contentType = "application/octet-stream";

  if (ext === ".pdf") {
    contentType = "application/pdf";
  }

  res.setHeader("Content-Type", contentType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${path.basename(fullPath)}"`
  );

  const fileStream = fs.createReadStream(fullPath);
  fileStream.pipe(res);
};

// Main Router
const router = async (req, res) => {
  try {
    if (handleCORS(req, res)) return;

    const { pathname, query } = parseUrl(req.url);
    const method = req.method;

    console.log(`\n📍 === NEW REQUEST ===`);
    console.log(`🔗 ${method} ${pathname}`);
    console.log(`🕒 Time: ${new Date().toISOString()}`);

    // Serve static files
    if (pathname.startsWith("/uploads/") && method === "GET") {
      try {
        serveStaticFile(req, res, pathname);
        return;
      } catch (error) {
        return sendResponse(res, 500, false, "Lỗi đọc file");
      }
    }

    // Route upload file (TRƯỚC parse body)
    const nhapKhoUploadParams = extractParams(
      "/api/nhap-kho/:id/upload-decision",
      pathname
    );
    if (nhapKhoUploadParams && method === "POST") {
      try {
        console.log(
          `📤 Upload endpoint hit for phieu ${nhapKhoUploadParams.id}`
        );

        const { file, ghi_chu } = await handleFileUpload(req);

        if (!file) {
          return sendResponse(res, 400, false, "Cần chọn file PDF");
        }

        // Kiểm tra là file PDF
        if (!file.originalFilename.toLowerCase().endsWith(".pdf")) {
          fs.unlinkSync(file.filepath); // Xóa file không hợp lệ
          return sendResponse(res, 400, false, "Chỉ chấp nhận file PDF");
        }

        // Authenticate user
        const user = await authenticate(req);
        if (!user) {
          fs.unlinkSync(file.filepath); // Xóa file nếu không có quyền
          return sendResponse(res, 401, false, "Unauthorized");
        }

        // Kiểm tra phiếu nhập
        const phieu = await pool.query(
          "SELECT * FROM phieu_nhap WHERE id = $1",
          [nhapKhoUploadParams.id]
        );

        if (phieu.rows.length === 0) {
          fs.unlinkSync(file.filepath);
          return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
        }

        if (phieu.rows[0].trang_thai !== "approved") {
          fs.unlinkSync(file.filepath);
          return sendResponse(res, 400, false, "Phiếu chưa được duyệt");
        }

        // Đổi tên file theo format chuẩn
        const timestamp = Date.now();
        const ext = path.extname(file.originalFilename);
        const newFilename = `decision_${nhapKhoUploadParams.id}_${timestamp}${ext}`;
        const newFilePath = path.join(path.dirname(file.filepath), newFilename);

        fs.renameSync(file.filepath, newFilePath);

        // Lưu thông tin vào database
        const decision_pdf_url = `/uploads/decisions/${newFilename}`;

        await pool.query(
          `UPDATE phieu_nhap 
           SET decision_pdf_url = $1, decision_pdf_filename = $2, ghi_chu_hoan_thanh = $3 
           WHERE id = $4`,
          [
            decision_pdf_url,
            file.originalFilename,
            ghi_chu || "",
            nhapKhoUploadParams.id,
          ]
        );

        return sendResponse(res, 200, true, "Upload thành công", {
          filename: file.originalFilename,
          url: decision_pdf_url,
        });
      } catch (error) {
        console.error("Upload error:", error);
        return sendResponse(res, 500, false, "Lỗi upload file");
      }
    }

    // Route download file
    const nhapKhoDownloadParams = extractParams(
      "/api/nhap-kho/:id/download-decision",
      pathname
    );
    if (nhapKhoDownloadParams && method === "GET") {
      const user = await authenticate(req);
      if (!user) {
        return sendResponse(res, 401, false, "Unauthorized");
      }

      try {
        const phieu = await pool.query(
          "SELECT decision_pdf_url, decision_pdf_filename FROM phieu_nhap WHERE id = $1",
          [nhapKhoDownloadParams.id]
        );

        if (phieu.rows.length === 0 || !phieu.rows[0].decision_pdf_url) {
          return sendResponse(res, 404, false, "File không tồn tại");
        }

        const { decision_pdf_url, decision_pdf_filename } = phieu.rows[0];
        return sendResponse(res, 200, true, "Thông tin file", {
          url: decision_pdf_url,
          filename: decision_pdf_filename,
        });
      } catch (error) {
        console.error("Download error:", error);
        return sendResponse(res, 500, false, "Lỗi server");
      }
    }

    // Parse body for POST/PUT/DELETE/PATCH (NGOẠI TRỪ upload)
    let body = {};
    if (
      ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
      !pathname.includes("upload-decision")
    ) {
      try {
        console.log(`🔄 Parsing body for ${method} request...`);
        body = await parseBody(req);
        console.log(`✅ Body parsed successfully`);
        console.log(`📦 Body keys:`, Object.keys(body));
      } catch (error) {
        console.error(`❌ Body parse error:`, error.message);
        return sendResponse(res, 400, false, "Invalid JSON", {
          error: error.message,
          details: "Request body could not be parsed as JSON",
        });
      }
    }

    // Public Routes
    if (pathname === "/api/health" && method === "GET") {
      return sendResponse(res, 200, true, "Server is healthy", {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      });
    }

    if (pathname === "/api/test/ncc-create" && method === "POST") {
      console.log("🧪 TEST NCC CREATE endpoint hit");

      try {
        console.log("📦 Body received:", body);

        // Test authentication
        const user = await authenticate(req);
        if (!user) {
          return sendResponse(res, 401, false, "Authentication test failed");
        }
        console.log("✅ Auth test passed:", user.id);

        // Test database connection
        const dbTest = await pool.query("SELECT NOW() as current_time");
        console.log("✅ DB test passed:", dbTest.rows[0]);

        // Test function
        const functionTest = await pool.query(
          "SELECT generate_ma_ncc() as test_ma"
        );
        console.log("✅ Function test passed:", functionTest.rows[0]);

        return sendResponse(res, 200, true, "Test passed", {
          body: body,
          user: { id: user.id, role: user.role },
          db_time: dbTest.rows[0].current_time,
          generated_ma: functionTest.rows[0].test_ma,
        });
      } catch (error) {
        console.error("❌ Test failed:", error);
        return sendResponse(res, 500, false, "Test failed", {
          error: error.message,
          stack: error.stack,
        });
      }
    }

    // Thay thế phần endpoints trong route "/" của server.js

    if (pathname === "/" && method === "GET") {
      return sendResponse(res, 200, true, "Warehouse Management API", {
        version: "2.0.0",
        endpoints: {
          auth: ["POST /api/auth/login", "GET /api/auth/profile"],
          test: ["POST /api/test/ncc-create"],
          users: [
            "GET /api/users",
            "POST /api/users",
            "PUT /api/users/:id",
            "DELETE /api/users/:id",
            "PUT /api/users/:id/role",
            "POST /api/users/:id/reset-password",
          ],
          departments: [
            "GET /api/departments",
            "POST /api/departments",
            "PUT /api/departments/:id",
            "DELETE /api/departments/:id",
            "POST /api/departments/:id/assign-users",
          ],
          hangHoa: [
            "GET /api/hang-hoa",
            "POST /api/hang-hoa",
            "GET /api/hang-hoa/:id",
            "PUT /api/hang-hoa/:id",
            "DELETE /api/hang-hoa/:id",
            "GET /api/hang-hoa/suggestions",
            "GET /api/hang-hoa/search/suggestions",
            "POST /api/hang-hoa/auto-create",
          ],
          loaiHangHoa: [
            "GET /api/loai-hang-hoa",
            "POST /api/loai-hang-hoa",
            "GET /api/loai-hang-hoa/:id",
            "PUT /api/loai-hang-hoa/:id",
            "DELETE /api/loai-hang-hoa/:id",
            "GET /api/loai-hang-hoa/suggestions",
          ],
          nhaCungCap: [
            "GET /api/nha-cung-cap/search/suggestions",
            "POST /api/nha-cung-cap/auto-create",
          ],
          donViNhan: [
            "GET /api/don-vi-nhan",
            "POST /api/don-vi-nhan",
            "GET /api/don-vi-nhan/:id",
            "PUT /api/don-vi-nhan/:id",
            "DELETE /api/don-vi-nhan/:id",
            "GET /api/don-vi-nhan/search/suggestions",
            "POST /api/don-vi-nhan/auto-create",
          ],
          nhapKho: [
            "GET /api/nhap-kho",
            "POST /api/nhap-kho",
            "GET /api/nhap-kho/:id",
            "PUT /api/nhap-kho/:id",
            "DELETE /api/nhap-kho/:id",
            "PATCH /api/nhap-kho/:id/approve",
            "PATCH /api/nhap-kho/:id/complete",
            "PATCH /api/nhap-kho/:id/cancel",
            "POST /api/nhap-kho/:id/upload-decision",
            "GET /api/nhap-kho/:id/download-decision",
            "POST /api/nhap-kho/:id/print",
          ],
          xuatKho: [
            "GET /api/xuat-kho",
            "POST /api/xuat-kho",
            "GET /api/xuat-kho/:id",
            "PUT /api/xuat-kho/:id",
            "DELETE /api/xuat-kho/:id",
            "POST /api/xuat-kho/:id/approve",
            "PATCH /api/xuat-kho/:id/cancel",
            "PATCH /api/xuat-kho/:id/complete",
            "POST /api/xuat-kho/check-ton-kho",
            "POST /api/xuat-kho/check-ton-kho-thuc-te",
            "PUT /api/xuat-kho/:id/update-so-luong-thuc-xuat",
            "POST /api/xuat-kho/:id/upload-decision",
            "GET /api/xuat-kho/:id/download-decision",
            "POST /api/xuat-kho/:id/print",
          ],
          kiemKe: {
            basic: [
              "GET /api/kiem-ke",
              "POST /api/kiem-ke",
              "GET /api/kiem-ke/:id",
              "PUT /api/kiem-ke/:id",
              "GET /api/kiem-ke/:id/ton-kho-hien-tai",
              "POST /api/kiem-ke/:id/approve",
              "PATCH /api/kiem-ke/:id/cancel",
            ],
            print_export: [
              "POST /api/kiem-ke/:id/print",
              "GET /api/kiem-ke/export",
              "POST /api/kiem-ke/import",
              "GET /api/kiem-ke/:id/import-template",
            ],
            statistics: [
              "GET /api/kiem-ke/statistics",
              "GET /api/kiem-ke/statistics/phong-ban",
              "GET /api/kiem-ke/statistics/loai-hang",
              "GET /api/kiem-ke/statistics/efficiency",
            ],
            reports: [
              "GET /api/kiem-ke/report/summary",
              "GET /api/kiem-ke/report/chenh-lech",
              "GET /api/kiem-ke/report/pham-chat",
              "GET /api/kiem-ke/compare",
              "GET /api/kiem-ke/history/hang-hoa/:hangHoaId",
            ],
            management: [
              "GET /api/kiem-ke/pending",
              "PATCH /api/kiem-ke/:id/chenh-lech",
              "GET /api/kiem-ke/warnings",
              "GET /api/kiem-ke/special-items",
            ],
            templates: [
              "GET /api/kiem-ke/templates",
              "POST /api/kiem-ke/templates",
              "PUT /api/kiem-ke/templates/:id",
              "DELETE /api/kiem-ke/templates/:id",
              "POST /api/kiem-ke/create-from-template/:templateId",
            ],
            automation: [
              "POST /api/kiem-ke/create-automatic",
              "GET /api/kiem-ke/schedule",
              "POST /api/kiem-ke/schedule",
              "PUT /api/kiem-ke/schedule/:id",
              "DELETE /api/kiem-ke/schedule/:id",
            ],
            utilities: [
              "GET /api/kiem-ke/backup",
              "POST /api/kiem-ke/restore",
              "POST /api/kiem-ke/:id/validate",
              "GET /api/kiem-ke/:id/qr-code",
              "POST /api/kiem-ke/advanced-search",
            ],
          },
          baoCao: [
            "GET /api/bao-cao/dashboard-stats",
            "GET /api/bao-cao/ton-kho",
            "GET /api/bao-cao/nhap-xuat",
            "GET /api/bao-cao/kiem-ke",
          ],
          files: [
            "GET /uploads/*",
            "GET /api/download-temp/:filename",
            "GET /temp/*",
          ],

          yeuCauNhap: [
            "GET /api/yeu-cau-nhap - Danh sách yêu cầu nhập kho",
            "POST /api/yeu-cau-nhap - Tạo yêu cầu nhập kho mới",
            "GET /api/yeu-cau-nhap/:id - Chi tiết yêu cầu nhập kho",
            "PUT /api/yeu-cau-nhap/:id - Cập nhật yêu cầu nhập kho",
            "DELETE /api/yeu-cau-nhap/:id - Xóa yêu cầu nhập kho",
            "PATCH /api/yeu-cau-nhap/:id/submit - Gửi yêu cầu phê duyệt",
            "PATCH /api/yeu-cau-nhap/:id/cancel - Hủy yêu cầu nhập kho",
          ],
          yeuCauXuat: [
            "GET /api/yeu-cau-xuat - Danh sách yêu cầu xuất kho",
            "POST /api/yeu-cau-xuat - Tạo yêu cầu xuất kho mới",
            "GET /api/yeu-cau-xuat/:id - Chi tiết yêu cầu xuất kho",
            "PUT /api/yeu-cau-xuat/:id - Cập nhật yêu cầu xuất kho",
            "DELETE /api/yeu-cau-xuat/:id - Xóa yêu cầu xuất kho",
            "PATCH /api/yeu-cau-xuat/:id/submit - Gửi yêu cầu phê duyệt",
            "PATCH /api/yeu-cau-xuat/:id/cancel - Hủy yêu cầu xuất kho",
            "GET /api/yeu-cau-xuat/:id/check-ton-kho - Kiểm tra tồn kho",
          ],
          workflow: [
            "POST /api/workflow/yeu-cau-nhap/:id/approve - Phê duyệt yêu cầu nhập",
            "POST /api/workflow/yeu-cau-nhap/:id/reject - Từ chối yêu cầu nhập",
            "POST /api/workflow/yeu-cau-nhap/:id/convert-to-phieu - Chuyển thành phiếu nhập",
            "POST /api/workflow/yeu-cau-xuat/:id/approve - Phê duyệt yêu cầu xuất",
            "POST /api/workflow/yeu-cau-xuat/:id/reject - Từ chối yêu cầu xuất",
            "POST /api/workflow/yeu-cau-xuat/:id/convert-to-phieu - Chuyển thành phiếu xuất",
            "GET /api/workflow/statistics - Thống kê workflow",
            "GET /api/workflow/pending-approvals - Yêu cầu chờ phê duyệt",
          ],
          notifications: [
            "GET /api/notifications - Danh sách thông báo",
            "PATCH /api/notifications/:id/read - Đánh dấu đã đọc",
            "PATCH /api/notifications/bulk-read - Đánh dấu nhiều thông báo đã đọc",
            "PATCH /api/notifications/mark-all-read - Đánh dấu tất cả đã đọc",
            "GET /api/notifications/unread-count - Số thông báo chưa đọc",
            "GET /api/notifications/statistics - Thống kê thông báo",
            "POST /api/notifications/system - Tạo thông báo hệ thống (admin)",
            "DELETE /api/notifications/:id/archive - Lưu trữ thông báo",
            "GET /api/notifications/preferences - Lấy cài đặt thông báo",
            "PUT /api/notifications/preferences - Cập nhật cài đặt thông báo",
            "POST /api/notifications/cleanup - Dọn dẹp thông báo cũ (admin)",
          ],
        },
        features: {
          authentication: "JWT Token based",
          file_upload: "PDF, Excel support",
          permissions: "Role-based access control",
          inventory_tracking: "Real-time stock management",
          quality_control: "Product quality classification",
          audit_trail: "Complete transaction history",
          reporting: "Comprehensive reports and analytics",
          automation: "Scheduled inventory checks",
          templates: "Reusable audit templates",
        },
      });
    }

    // Auth Routes
    if (pathname === "/api/auth/login" && method === "POST") {
      console.log(`🔐 Login endpoint hit`);
      return await authController.login(req, res, body);
    }

    // Route download temp files (TRƯỚC authentication)
    const downloadTempParams = extractParams(
      "/api/download-temp/:filename",
      pathname
    );
    if (downloadTempParams && method === "GET") {
      try {
        const tempPath = path.join(
          __dirname,
          "temp",
          downloadTempParams.filename
        );
        if (fs.existsSync(tempPath)) {
          res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${downloadTempParams.filename}"`
          );

          const fileStream = fs.createReadStream(tempPath);
          fileStream.pipe(res);

          // Xóa file sau khi download
          fileStream.on("end", () => {
            setTimeout(() => {
              if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
              }
            }, 1000);
          });

          return;
        } else {
          return sendResponse(res, 404, false, "File không tồn tại");
        }
      } catch (error) {
        return sendResponse(res, 500, false, "Lỗi tải file");
      }
    }

    // Route serve temp files (alternative)
    if (pathname.startsWith("/temp/") && method === "GET") {
      try {
        const tempPath = path.join(__dirname, pathname);
        if (fs.existsSync(tempPath)) {
          res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${path.basename(tempPath)}"`
          );

          const fileStream = fs.createReadStream(tempPath);
          fileStream.pipe(res);

          // Xóa file sau khi download
          fileStream.on("end", () => {
            setTimeout(() => {
              if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
              }
            }, 1000);
          });

          return;
        } else {
          return sendResponse(res, 404, false, "File không tồn tại");
        }
      } catch (error) {
        return sendResponse(res, 500, false, "Lỗi tải file");
      }
    }
    // Apply workflow middleware tự động cho workflow routes
    if (
      pathname.startsWith("/api/yeu-cau-") ||
      pathname.startsWith("/api/workflow/") ||
      pathname.startsWith("/api/notifications/")
    ) {
      // Enhanced authentication cho workflow routes
      console.log(
        `🔄 Enhanced authentication for workflow route: ${method} ${pathname}`
      );
      const user = await authenticateWithWorkflow(req);
      if (!user) {
        console.log(`❌ Enhanced authentication failed for workflow route`);
        return sendResponse(
          res,
          401,
          false,
          "Unauthorized - Enhanced authentication required",
          {
            route_type: "workflow",
            authentication_level: "enhanced",
          }
        );
      }

      // Attach enhanced user object to request
      req.user = user;
      console.log(`✅ Enhanced user authenticated:`, {
        id: user.id,
        role: user.role,
        department: user.ma_phong_ban,
        route_type: "workflow",
      });
    }
    // Protected Routes - Require Authentication
    console.log(`🔒 Authenticating user...`);
    const user = await authenticate(req);
    if (!user) {
      console.log(`❌ Authentication failed`);
      return sendResponse(res, 401, false, "Unauthorized - Token required");
    }
    console.log(`✅ User authenticated:`, { id: user.id, role: user.role });

    // Auth Profile
    if (pathname === "/api/auth/profile" && method === "GET") {
      return await authController.getProfile(req, res, user);
    }

    // Admin Routes - User Management
    if (pathname === "/api/users") {
      switch (method) {
        case "GET":
          return await userController.getUsers(req, res, query, user);
        case "POST":
          return await userController.createUser(req, res, body, user);
      }
    }

    // User routes with ID
    const userParams = extractParams("/api/users/:id", pathname);
    if (userParams) {
      switch (method) {
        case "PUT":
          return await userController.updateUser(
            req,
            res,
            userParams,
            body,
            user
          );
        case "DELETE":
          return await userController.deleteUser(req, res, userParams, user);
        case "GET":
          return await userController.getUserDetail(req, res, userParams, user);
      }
    }

    // User role update
    const userRoleParams = extractParams("/api/users/:id/role", pathname);
    if (userRoleParams && method === "PUT") {
      return await userController.updateUserRole(
        req,
        res,
        userRoleParams,
        body,
        user
      );
    }

    // Update user active status (enable/disable)
    const userStatusParams = extractParams("/api/users/:id/status", pathname);
    if (userStatusParams && method === "PATCH") {
      return await userController.updateUserStatus(
        req,
        res,
        userStatusParams,
        body,
        user
      );
    }

    // Self account endpoints
    if (pathname === "/api/account/change-password" && method === "POST") {
      return await userController.changeOwnPassword(req, res, body, user);
    }
    if (pathname === "/api/account/change-username" && method === "POST") {
      return await userController.changeOwnUsername(req, res, body, user);
    }

    // Admin Routes - Department Management
    if (pathname === "/api/departments") {
      switch (method) {
        case "GET":
          return await departmentController.getDepartments(
            req,
            res,
            query,
            user
          );
        case "POST":
          return await departmentController.createDepartment(
            req,
            res,
            body,
            user
          );
      }
    }

    if (pathname === "/api/departments/cap-2" && method === "GET") {
      try {
        console.log("🔍 Getting cap 2 departments for user:", user.role);

        const client = await pool.connect();
        let query;
        let params = [];

        if (user.role === "admin") {
          // Admin xem tất cả cấp 2
          query = `
        SELECT id, ten_phong_ban, ma_phong_ban
        FROM phong_ban 
        WHERE cap_bac = 2 AND trang_thai = 'active'
        ORDER BY ten_phong_ban
      `;
        } else if (user.role === "manager") {
          // Manager chỉ xem các cấp 2 khác (không bao gồm phòng ban của mình)
          query = `
        SELECT id, ten_phong_ban, ma_phong_ban
        FROM phong_ban 
        WHERE cap_bac = 2 AND trang_thai = 'active' AND id != $1
        ORDER BY ten_phong_ban
      `;
          params = [user.phong_ban_id];
        } else {
          // User cấp 3 xem các cấp 2 khác (không bao gồm phòng ban cha của mình)
          query = `
        SELECT id, ten_phong_ban, ma_phong_ban
        FROM phong_ban 
        WHERE cap_bac = 2 AND trang_thai = 'active' 
        AND id != (SELECT phong_ban_cha_id FROM phong_ban WHERE id = $1)
        ORDER BY ten_phong_ban
      `;
          params = [user.phong_ban_id];
        }

        const result = await client.query(query, params);
        client.release();

        console.log("🔍 Found cap 2 departments:", result.rows.length);
        return sendResponse(
          res,
          200,
          true,
          "Lấy danh sách phòng ban cấp 2 thành công",
          result.rows
        );
      } catch (error) {
        console.error("❌ Error fetching phong ban cap 2:", error);
        return sendResponse(res, 500, false, "Lỗi server");
      }
    }

    // Route lấy danh sách cấp 3 theo cấp 2 parent
    const cap3ByParentParams = extractParams(
      "/api/departments/cap-3/:parentId",
      pathname
    );
    if (cap3ByParentParams && method === "GET") {
      try {
        const { parentId } = cap3ByParentParams;
        console.log(
          "🔍 Getting cap 3 departments for parent:",
          parentId,
          "user:",
          user.phong_ban_id
        );

        const client = await pool.connect();

        const result = await client.query(
          `
      SELECT id, ten_phong_ban, ma_phong_ban
      FROM phong_ban 
      WHERE cap_bac = 3 
        AND phong_ban_cha_id = $1 
        AND trang_thai = 'active'
        AND id != $2
      ORDER BY ten_phong_ban
    `,
          [parentId, user.phong_ban_id || 0]
        ); // Loại trừ phòng ban của user hiện tại

        client.release();

        console.log("🔍 Found cap 3 departments:", result.rows.length);
        return sendResponse(
          res,
          200,
          true,
          "Lấy danh sách phòng ban cấp 3 thành công",
          result.rows
        );
      } catch (error) {
        console.error("❌ Error fetching phong ban cap 3:", error);
        return sendResponse(res, 500, false, "Lỗi server");
      }
    }

    const parentParams = extractParams("/api/departments/:id/parent", pathname);
    if (parentParams && method === "GET") {
      try {
        const { id } = parentParams;
        console.log("🔍 Getting parent department for:", id);

        const client = await pool.connect();

        const query = `
      SELECT 
        pb_cha.id,
        pb_cha.ma_phong_ban,
        pb_cha.ten_phong_ban,
        pb_cha.cap_bac,
        pb_cha.phong_ban_cha_id
      FROM phong_ban pb
      JOIN phong_ban pb_cha ON pb.phong_ban_cha_id = pb_cha.id
      WHERE pb.id = $1 AND pb_cha.trang_thai = 'active'
    `;

        const result = await client.query(query, [id]);
        client.release();

        if (result.rows.length === 0) {
          return sendResponse(res, 404, false, "Không tìm thấy phòng ban cha");
        }

        console.log("✅ Found parent department:", result.rows[0]);
        return sendResponse(
          res,
          200,
          true,
          "Lấy thông tin phòng ban cha thành công",
          result.rows[0]
        );
      } catch (error) {
        console.error("❌ Error getting parent department:", error);
        return sendResponse(res, 500, false, "Lỗi server");
      }
    }
    // Thêm route mới cho departments list (dành cho dropdown)
    if (pathname === "/api/departments/list" && method === "GET") {
      console.log(`🏢 HIT: Departments list endpoint for dropdown`);
      return await departmentController.getDepartmentsList(
        req,
        res,
        query,
        user
      );
    }
    if (pathname === "/api/departments/list-for-filter" && method === "GET") {
      console.log(`🏢 HIT: Departments list endpoint for filtering`);
      // Chúng ta sẽ tạo hàm này trong hangHoaController
      return await hangHoaController.getPhongBanListForFilter(req, res, user);
    }

    if (
      pathname.startsWith("/api/departments/") &&
      method === "GET" &&
      !pathname.includes("/list/")
    ) {
      const departmentId = pathname.split("/").pop();
      try {
        const query = `
      SELECT 
        pb.id,
        pb.ma_phong_ban,
        pb.ten_phong_ban,
        pb.cap_bac,
        pb.phong_ban_cha_id,
        pb.thu_tu_hien_thi,
        pb.mo_ta,
        pb.is_active,
        pb_cha.ten_phong_ban as ten_phong_ban_cha,
        pb_cha.cap_bac as cap_bac_cha
      FROM phong_ban pb
      LEFT JOIN phong_ban pb_cha ON pb.phong_ban_cha_id = pb_cha.id
      WHERE pb.id = $1
    `;

        const result = await pool.query(query, [departmentId]);

        if (result.rows.length === 0) {
          return sendResponse(res, 404, false, "Không tìm thấy phòng ban");
        }

        return sendResponse(
          res,
          200,
          true,
          "Lấy thông tin phòng ban thành công",
          result.rows[0]
        );
      } catch (error) {
        console.error("Get department info error:", error);
        return sendResponse(res, 500, false, "Lỗi server", {
          error: error.message,
        });
      }
    }

    // Lấy danh sách phòng ban hierarchy
    if (pathname === "/api/departments/list/hierarchy" && method === "GET") {
      try {
        const query = `
      WITH RECURSIVE org_tree AS (
        SELECT 
          id, ma_phong_ban, ten_phong_ban, cap_bac, phong_ban_cha_id,
          ARRAY[id] as path,
          0 as level,
          ARRAY[thu_tu_hien_thi] as sort_path
        FROM phong_ban 
        WHERE cap_bac = 1 AND is_active = TRUE
        
        UNION ALL
        
        SELECT 
          pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac, pb.phong_ban_cha_id,
          ot.path || pb.id,
          ot.level + 1,
          ot.sort_path || pb.thu_tu_hien_thi
        FROM phong_ban pb
        JOIN org_tree ot ON pb.phong_ban_cha_id = ot.id
        WHERE pb.is_active = TRUE
      )
      SELECT 
        id, ma_phong_ban, ten_phong_ban, cap_bac, phong_ban_cha_id, level,
        REPEAT('  ', level) || ten_phong_ban as ten_phong_ban_indent, path
      FROM org_tree
      ORDER BY sort_path
    `;

        const result = await pool.query(query);
        return sendResponse(
          res,
          200,
          true,
          "Lấy danh sách phòng ban hierarchy thành công",
          result.rows
        );
      } catch (error) {
        console.error("Get hierarchy departments error:", error);
        return sendResponse(res, 500, false, "Lỗi server", {
          error: error.message,
        });
      }
    }

    // Lấy danh sách phòng ban có quyền xem
    if (pathname === "/api/departments/list/accessible" && method === "GET") {
      try {
        // Lấy thông tin cấp bậc của user
        const userCapBacQuery = `SELECT cap_bac FROM phong_ban WHERE id = $1`;
        const userCapBacResult = await pool.query(userCapBacQuery, [
          user.phong_ban_id,
        ]);
        const userCapBac = userCapBacResult.rows[0]?.cap_bac;

        let query = "";
        let params = [];

        if (user.role === "admin") {
          // Admin (Cấp 1): Xem tất cả phòng ban
          query = `
        SELECT id, ma_phong_ban, ten_phong_ban, cap_bac, phong_ban_cha_id
        FROM phong_ban WHERE is_active = TRUE ORDER BY cap_bac, thu_tu_hien_thi
      `;
        } else if (user.role === "manager") {
          // Manager (Cấp 2): Xem phòng ban của mình + các cấp 3 thuộc quyền
          query = `
        SELECT pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac, pb.phong_ban_cha_id
        FROM phong_ban pb WHERE pb.is_active = TRUE 
        AND (pb.id = $1 OR pb.phong_ban_cha_id = $1)
        ORDER BY pb.cap_bac, pb.thu_tu_hien_thi
      `;
          params = [user.phong_ban_id];
        } else {
          // User (Cấp 3): Chỉ xem phòng ban của mình
          query = `
        SELECT pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac, pb.phong_ban_cha_id
        FROM phong_ban pb WHERE pb.is_active = TRUE AND pb.id = $1
        ORDER BY pb.cap_bac, pb.thu_tu_hien_thi
      `;
          params = [user.phong_ban_id];
        }

        const result = await pool.query(query, params);
        return sendResponse(
          res,
          200,
          true,
          "Lấy danh sách phòng ban có quyền truy cập thành công",
          result.rows
        );
      } catch (error) {
        console.error("Get accessible departments error:", error);
        return sendResponse(res, 500, false, "Lỗi server", {
          error: error.message,
        });
      }
    }

    // Department routes with ID
    const deptParams = extractParams("/api/departments/:id", pathname);
    if (deptParams) {
      switch (method) {
        case "PUT":
          return await departmentController.updateDepartment(
            req,
            res,
            deptParams,
            body,
            user
          );
        case "DELETE":
          return await departmentController.deleteDepartment(
            req,
            res,
            deptParams,
            user
          );
      }
    }

    // Department user assignment
    const deptAssignParams = extractParams(
      "/api/departments/:id/assign-users",
      pathname
    );
    if (deptAssignParams && method === "POST") {
      return await departmentController.assignUsers(
        req,
        res,
        deptAssignParams,
        body,
        user
      );
    }

    // Nha Cung Cap Search Routes
    if (
      pathname === "/api/nha-cung-cap/search/suggestions" &&
      method === "GET"
    ) {
      console.log(`🎯 HIT: Nha cung cap search endpoint`);
      return await nhaCungCapSearchController.searchNhaCungCap(req, res);
    }

    if (
      pathname === "/api/nha-cung-cap/search/searchNhaCungCapByType" &&
      method === "GET"
    ) {
      console.log(`🎯 HIT: Nha cung cap search endpoint`);
      return await nhaCungCapSearchController.searchNhaCungCapByType(
        req,
        res,
        query,
        user
      );
    }

    if (pathname === "/api/nha-cung-cap/auto-create" && method === "POST") {
      console.log(`🎯 HIT: Nha cung cap auto-create endpoint`);
      console.log(`📦 Passing parsed body to auto-create:`, body);
      return await nhaCungCapSearchController.createNhaCungCapAuto(
        req,
        res,
        body
      );
    }

    // ===== NHÀ CUNG CẤP ROUTES =====
    // Nha cung cap list route (ĐẶT TRƯỚC :id route)
    if (pathname === "/api/nha-cung-cap/list" && method === "GET") {
      return await nhaCungCapController.getList(req, res, query, user);
    }

    if (pathname === "/api/nha-cung-cap") {
      switch (method) {
        case "GET":
          return await nhaCungCapController.getList(req, res, query, user);
        case "POST":
          return await nhaCungCapController.create(req, res, body, user);
      }
    }

    // Nha cung cap suggestions
    if (pathname === "/api/nha-cung-cap/suggestions" && method === "GET") {
      return await nhaCungCapController.getSuggestions(req, res, query, user);
    }

    // Nha cung cap with ID routes
    const nhaCungCapParams = extractParams("/api/nha-cung-cap/:id", pathname);
    if (nhaCungCapParams) {
      switch (method) {
        case "GET":
          return await nhaCungCapController.getDetail(
            req,
            res,
            nhaCungCapParams,
            user
          );
        case "PUT":
          return await nhaCungCapController.update(
            req,
            res,
            nhaCungCapParams,
            body,
            user
          );
        case "DELETE":
          return await nhaCungCapController.delete(
            req,
            res,
            nhaCungCapParams,
            user
          );
      }
    }

    // ===== ROUTES CHO ĐƠN VỊ NHẬN =====
    if (pathname === "/api/don-vi-nhan") {
      switch (method) {
        case "GET":
          return await donViNhanController.getList(req, res, query, user);
        case "POST":
          return await donViNhanController.create(req, res, body, user);
      }
    }

    // Don vi nhan list route (THÊM DÒNG NÀY TRƯỚC)
    // if (pathname === "/api/don-vi-nhan/list" && method === "GET") {
    //   return await donViNhanController.getList(req, res, query, user);
    // }
    // Don vi nhan with ID routes
    const donViNhanParams = extractParams("/api/don-vi-nhan/:id", pathname);
    if (donViNhanParams) {
      switch (method) {
        case "GET":
          return await donViNhanController.getDetail(
            req,
            res,
            donViNhanParams,
            user
          );
        case "PUT":
          return await donViNhanController.update(
            req,
            res,
            donViNhanParams,
            body,
            user
          );
        case "DELETE":
          return await donViNhanController.delete(
            req,
            res,
            donViNhanParams,
            user
          );
      }
    }

    // Don vi nhan suggestions
    // Thêm vào phần Protected Routes - sau các routes của Nha Cung Cap Search
    // Don Vi Nhan Search Routes
    if (
      pathname === "/api/don-vi-nhan/search/suggestions" &&
      method === "GET"
    ) {
      console.log(`🎯 HIT: Don vi nhan search endpoint`);
      return await donViNhanSearchController.searchDonViNhan(req, res);
    }

    if (pathname === "/api/don-vi-nhan/auto-create" && method === "POST") {
      console.log(`🎯 HIT: Don vi nhan auto-create endpoint`);
      console.log(`📦 Passing parsed body to auto-create:`, body);
      return await donViNhanSearchController.createDonViNhanAuto(
        req,
        res,
        body
      );
    }

    // Hang Hoa Search Routes
    if (pathname === "/api/hang-hoa/search/suggestions" && method === "GET") {
      console.log(`🎯 HIT: Hang hoa search endpoint`);
      return await hangHoaSearchController.searchHangHoa(req, res);
    }

    if (pathname === "/api/hang-hoa/search/xuat-kho" && method === "GET") {
      console.log(`🎯 HIT: Hang hoa search for xuat kho endpoint`);
      return await hangHoaSearchController.searchHangHoaForXuatKho(req, res);
    }

    // ✅ THÊM ROUTE CHO LOTS - PHẢI ĐẶT TRƯỚC ROUTE GENERIC /api/hang-hoa/:id
    const hangHoaLotsParams = extractParams(
      "/api/hang-hoa/:hangHoaId/lots/:phongBanId",
      pathname
    );
    if (hangHoaLotsParams && method === "GET") {
      console.log(`🎯 HIT: Hang hoa lots endpoint`, hangHoaLotsParams);
      req.user = user;
      req.params = hangHoaLotsParams; // ✅ GÁN PARAMS VÀO REQ
      return await hangHoaSearchController.getLotsForXuatKho(req, res);
    }

    if (pathname === "/api/hang-hoa/auto-create" && method === "POST") {
      console.log(`🎯 HIT: Hang hoa auto-create endpoint`);
      return await hangHoaSearchController.createHangHoaAuto(req, res, body);
    }

    // Hang Hoa Routes (generic)
    // ===== HANG HOA ROUTES - CẬP NHẬT =====

    // ✅ 1. SPECIFIC ROUTES TRƯỚC - Department stats (PHẢI TRƯỚC /api/hang-hoa)
    if (pathname === "/api/hang-hoa/department-stats" && method === "GET") {
      req.user = user; // Gán user vào req
      return await hangHoaController.getDepartmentStats(req, res, user);
    }

    // ✅ 2. Stats by department
    if (pathname === "/api/hang-hoa/stats-by-department" && method === "GET") {
      req.user = user;
      return await hangHoaController.getStatsByDepartment(
        req,
        res,
        query,
        user
      );
    }

    // ✅ 3. Suggestions
    if (pathname === "/api/hang-hoa/suggestions" && method === "GET") {
      req.user = user;
      return await hangHoaController.getSuggestions(req, res, query, user);
    }

    // ✅ 4. Phong ban routes
    if (pathname === "/api/hang-hoa/departments/list" && method === "GET") {
      req.user = user;
      return await hangHoaController.getPhongBanList(req, res, user);
    }

    if (pathname === "/api/hang-hoa/phong-ban-cung-cap" && method === "GET") {
      req.user = user;
      return await hangHoaController.getPhongBanCungCap(req, res, query, user);
    }

    if (pathname === "/api/hang-hoa/phong-ban-nhan-hang" && method === "GET") {
      req.user = user;
      return await hangHoaController.getPhongBanNhanHang(req, res, user);
    }

    // ✅ 5. Inventory overview
    if (pathname === "/api/hang-hoa/inventory/overview" && method === "GET") {
      req.user = user;
      return await hangHoaController.getInventoryOverview(
        req,
        res,
        query,
        user
      );
    }

    // ✅ 6. Department by level routes
    const deptLevelParams = extractParams(
      "/api/hang-hoa/departments/level/:level",
      pathname
    );
    if (deptLevelParams && method === "GET") {
      req.user = user;
      return await hangHoaController.getDepartmentsByLevel(
        req,
        res,
        deptLevelParams,
        user
      );
    }

    // ✅ 7. Cap3 under Cap2
    const cap3Params = extractParams(
      "/api/hang-hoa/departments/cap2/:cap2Id/cap3",
      pathname
    );
    if (cap3Params && method === "GET") {
      req.user = user;
      return await hangHoaController.getCap3UnderCap2(
        req,
        res,
        cap3Params,
        user
      );
    }

    // ✅ 8. ROUTES VỚI ID - PHẢI TRƯỚC /api/hang-hoa

    // Inventory breakdown cho specific hang hoa
    const inventoryBreakdownParams = extractParams(
      "/api/hang-hoa/:id/inventory-breakdown",
      pathname
    );
    if (inventoryBreakdownParams && method === "GET") {
      req.user = user;
      return await hangHoaController.getInventoryBreakdown(
        req,
        res,
        inventoryBreakdownParams,
        user
      );
    }

    // Phieu history cho specific hang hoa
    const phieuHistoryParams = extractParams(
      "/api/hang-hoa/:id/phieu-history",
      pathname
    );
    if (phieuHistoryParams && method === "GET") {
      req.user = user;
      return await hangHoaController.getPhieuHistory(
        req,
        res,
        phieuHistoryParams,
        user
      );
    }

    // Hang hoa routes with ID
    const hangHoaParams = extractParams("/api/hang-hoa/:id", pathname);
    const hangHoaDetailParams = extractParams(
      "/api/hang-hoa/:id/phong-ban/:phongBanId",
      pathname
    );

    // Route lấy chi tiết MỚI (PHẢI ĐẶT TRƯỚC ROUTE CŨ)
    if (hangHoaDetailParams && method === "GET") {
      req.user = user;
      return await hangHoaController.getDetailByPhongBan(
        req,
        res,
        hangHoaDetailParams,
        user
      );
    }

    // Route GET chi tiết tổng hợp theo id (không theo phòng ban cụ thể)
    if (hangHoaParams && method === "GET") {
      req.user = user;
      return await hangHoaController.getDetail(req, res, hangHoaParams, user);
    }

    // Route cũ cho update, delete
    if (hangHoaParams) {
      req.user = user;
      switch (method) {
        case "PUT":
          return await hangHoaController.update(
            req,
            res,
            hangHoaParams,
            body,
            user
          );
        case "DELETE":
          return await hangHoaController.delete(req, res, hangHoaParams, user);
      }
    }

    // ✅ 9. GENERIC ROUTES CUỐI CÙNG
    if (pathname === "/api/hang-hoa") {
      req.user = user; // Gán user vào req
      switch (method) {
        case "GET":
          console.log(`🎯 HIT: Get hang hoa list with filters:`, {
            phong_ban_id: query.phong_ban_id,
            search: query.search,
            loai_hang_hoa_id: query.loai_hang_hoa_id,
            user_role: user.role,
          });
          // ✅ SỬA: Truyền đầy đủ parameters (req, res, query, user)
          return await hangHoaController.getList(req, res, query, user);
        case "POST":
          return await hangHoaController.create(req, res, body, user);
      }
    }
    // ===== LOẠI HÀNG HÓA ROUTES =====
    if (pathname === "/api/loai-hang-hoa") {
      switch (method) {
        case "GET":
          return await loaiHangHoaController.getList(req, res, query, user);
        case "POST":
          return await loaiHangHoaController.create(req, res, body, user);
      }
    }

    // Loai hang hoa suggestions
    if (pathname === "/api/loai-hang-hoa/suggestions" && method === "GET") {
      return await loaiHangHoaController.getSuggestions(req, res, query, user);
    }

    // Loai hang hoa with ID routes
    const loaiHangHoaParams = extractParams("/api/loai-hang-hoa/:id", pathname);
    if (loaiHangHoaParams) {
      switch (method) {
        case "GET":
          return await loaiHangHoaController.getDetail(
            req,
            res,
            loaiHangHoaParams,
            user
          );
        case "PUT":
          return await loaiHangHoaController.update(
            req,
            res,
            loaiHangHoaParams,
            body,
            user
          );
        case "DELETE":
          return await loaiHangHoaController.delete(
            req,
            res,
            loaiHangHoaParams,
            user
          );
      }
    }

    // Nhap Kho Routes
    if (pathname === "/api/nhap-kho") {
      switch (method) {
        case "GET":
          return await nhapKhoController.getList(req, res, query, user);
        case "POST":
          return await nhapKhoController.create(req, res, body, user);
      }
    }

    // Thêm vào phần Nhap Kho Routes
    if (pathname === "/api/nhap-kho/phong-ban-cung-cap" && method === "GET") {
      return await nhapKhoController.getPhongBanCungCap(req, res, query, user);
    }

    if (pathname === "/api/nhap-kho/hang-hoa-co-the-nhap" && method === "GET") {
      return await nhapKhoController.getHangHoaCoTheNhap(req, res, query, user);
    }
    if (pathname === "/api/nhap-kho/phong-ban-list" && method === "GET") {
      return await nhapKhoController.getPhongBanList(req, res, query, user);
    }

    const nhapKhoParams = extractParams("/api/nhap-kho/:id", pathname);
    if (nhapKhoParams) {
      switch (method) {
        case "GET":
          return await nhapKhoController.getDetail(
            req,
            res,
            nhapKhoParams,
            user
          );
        case "PUT":
          return await nhapKhoController.update(
            req,
            res,
            nhapKhoParams,
            body,
            user
          );
        case "DELETE":
          return await nhapKhoController.delete(req, res, nhapKhoParams, user);
      }
    }

    const nhapKhoApproveParams = extractParams(
      "/api/nhap-kho/:id/approve",
      pathname
    );
    if (nhapKhoApproveParams && method === "PATCH") {
      return await nhapKhoController.approve(
        req,
        res,
        nhapKhoApproveParams,
        user
      );
    }

    const nhapKhoManagerApproveParams = extractParams(
      "/api/nhap-kho/:id/manager-approve",
      pathname
    );
    if (nhapKhoManagerApproveParams && method === "PATCH") {
      return await nhapKhoController.managerApprove(
        req,
        res,
        nhapKhoManagerApproveParams,
        user
      );
    }

    const nhapKholevel3ApproveParams = extractParams(
      "/api/nhap-kho/:id/level3-approve",
      pathname
    );
    if (nhapKholevel3ApproveParams && method === "PATCH") {
      return await nhapKhoController.level3Approve(
        req,
        res,
        nhapKholevel3ApproveParams,
        user
      );
    }

    const nhapKhoSubmitParams = extractParams(
      "/api/nhap-kho/:id/submit",
      pathname
    );
    if (nhapKhoSubmitParams && method === "PATCH") {
      return await nhapKhoController.submit(
        req,
        res,
        nhapKhoSubmitParams,
        user
      );
    }

    // Yêu cầu chỉnh sửa phiếu (MỚI)
    const nhapKhoRevisionParams = extractParams(
      "/api/nhap-kho/:id/request-revision",
      pathname
    );
    if (nhapKhoRevisionParams && method === "PATCH") {
      return await nhapKhoController.requestRevision(
        req,
        res,
        nhapKhoRevisionParams,
        body,
        user
      );
    }

    // Hoàn thành phiếu
    const nhapKhoCompleteParams = extractParams(
      "/api/nhap-kho/:id/complete",
      pathname
    );
    if (nhapKhoCompleteParams && method === "PATCH") {
      return await nhapKhoController.complete(
        req,
        res,
        nhapKhoCompleteParams,
        user
      );
    }

    // Route in phiếu nhập
    const nhapKhoPrintParams = extractParams(
      "/api/nhap-kho/:id/print",
      pathname
    );
    if (nhapKhoPrintParams && method === "POST") {
      return await printController.generatePhieuNhapExcel(
        req,
        res,
        nhapKhoPrintParams,
        body,
        user
      );
    }

    // Hủy phiếu
    const nhapKhoCancelParams = extractParams(
      "/api/nhap-kho/:id/cancel",
      pathname
    );
    if (nhapKhoCancelParams && method === "PATCH") {
      return await nhapKhoController.cancel(
        req,
        res,
        nhapKhoCancelParams,
        user
      );
    }
    // Route cập nhật số lượng thực tế nhập
    const nhapKhoActualQuantityParams = extractParams(
      "/api/nhap-kho/:id/actual-quantity",
      pathname
    );
    if (nhapKhoActualQuantityParams && method === "PUT") {
      return await nhapKhoController.updateActualQuantity(
        req,
        res,
        nhapKhoActualQuantityParams,
        body,
        user
      );
    }

    // Xuat Kho Routes
    if (pathname === "/api/xuat-kho") {
      switch (method) {
        case "GET":
          return await xuatKhoController.getList(req, res, query, user);
        case "POST":
          return await xuatKhoController.create(req, res, body, user);
      }
    }

    if (pathname === "/api/xuat-kho/check-ton-kho" && method === "POST") {
      return await xuatKhoController.checkTonKho(req, res, body, user);
    }

    if (
      pathname === "/api/xuat-kho/check-ton-kho-thuc-te" &&
      method === "POST"
    ) {
      console.log(`🎯 HIT: Check ton kho thuc te endpoint`);
      return await xuatKhoController.checkTonKhoThucTe(req, res, body, user);
    }

    // Thêm vào phần Xuat Kho Routes
    if (pathname === "/api/xuat-kho/phong-ban-nhan-hang" && method === "GET") {
      return await xuatKhoController.getPhongBanNhanHang(req, res, query, user);
    }
    if (pathname === "/api/xuat-kho/phong-ban-list" && method === "GET") {
      return await xuatKhoController.getPhongBanList(req, res, query, user);
    }
    // Thêm vào phần Xuat Kho Routes
    if (pathname === "/api/xuat-kho/phong-ban-cap2" && method === "GET") {
      return await xuatKhoController.getPhongBanCap2List(req, res, query, user);
    }

    const xuatKhoCap3Params = extractParams(
      "/api/xuat-kho/phong-ban-cap3/:cap2Id",
      pathname
    );
    if (xuatKhoCap3Params && method === "GET") {
      return await xuatKhoController.getPhongBanCap3ByParent(
        req,
        res,
        xuatKhoCap3Params,
        user
      );
    }
    const xuatKhoParams = extractParams("/api/xuat-kho/:id", pathname);
    if (xuatKhoParams) {
      switch (method) {
        case "GET":
          return await xuatKhoController.getDetail(
            req,
            res,
            xuatKhoParams,
            user
          );
        case "PUT":
          return await xuatKhoController.update(
            req,
            res,
            xuatKhoParams,
            body,
            user
          );
        case "DELETE":
          return await xuatKhoController.delete(req, res, xuatKhoParams, user);
      }
    }

    // Route cập nhật số lượng thực tế xuất (mới)
    const xuatKhoActualQuantityParams = extractParams(
      "/api/xuat-kho/:id/actual-quantity",
      pathname
    );
    if (xuatKhoActualQuantityParams && method === "PUT") {
      return await xuatKhoController.updateActualQuantity(
        req,
        res,
        xuatKhoActualQuantityParams,
        body,
        user
      );
    }

    const xuatKhoApproveParams = extractParams(
      "/api/xuat-kho/:id/approve",
      pathname
    );
    if (xuatKhoApproveParams && method === "PATCH") {
      return await xuatKhoController.approve(
        req,
        res,
        xuatKhoApproveParams,
        user
      );
    }

    const xuatKhoManagerApproveParams = extractParams(
      "/api/xuat-kho/:id/manager-approve",
      pathname
    );
    if (xuatKhoManagerApproveParams && method === "PATCH") {
      return await xuatKhoController.managerApprove(
        req,
        res,
        xuatKhoManagerApproveParams,
        user
      );
    }

    // Gửi phiếu để duyệt (MỚI)
    const xuatKhoSubmitParams = extractParams(
      "/api/xuat-kho/:id/submit",
      pathname
    );
    if (xuatKhoSubmitParams && method === "PATCH") {
      return await xuatKhoController.submit(
        req,
        res,
        xuatKhoSubmitParams,
        user
      );
    }

    // Yêu cầu chỉnh sửa phiếu (MỚI)
    const xuatKhoRevisionParams = extractParams(
      "/api/xuat-kho/:id/request-revision",
      pathname
    );
    if (xuatKhoRevisionParams && method === "PATCH") {
      return await xuatKhoController.requestRevision(
        req,
        res,
        xuatKhoRevisionParams,
        body,
        user
      );
    }
    // Thêm route cập nhật số lượng thực xuất
    const xuatKhoUpdateSoLuongParams = extractParams(
      "/api/xuat-kho/:id/update-so-luong-thuc-xuat",
      pathname
    );
    if (xuatKhoUpdateSoLuongParams && method === "PUT") {
      return await xuatKhoController.updateSoLuongThucXuat(
        req,
        res,
        xuatKhoUpdateSoLuongParams,
        body,
        user
      );
    }

    // Route upload quyết định cho phiếu xuất

    const xuatKhoUploadParams = extractParams(
      "/api/xuat-kho/:id/upload-decision",
      pathname
    );
    if (xuatKhoUploadParams && method === "POST") {
      try {
        console.log(
          `📤 Upload endpoint hit for phieu xuat ${xuatKhoUploadParams.id}`
        );

        const { file, ghi_chu } = await handleFileUpload(req);

        if (!file) {
          return sendResponse(res, 400, false, "Cần chọn file PDF");
        }

        // Kiểm tra là file PDF
        if (!file.originalFilename.toLowerCase().endsWith(".pdf")) {
          fs.unlinkSync(file.filepath); // Xóa file không hợp lệ
          return sendResponse(res, 400, false, "Chỉ chấp nhận file PDF");
        }

        // Authenticate user
        const user = await authenticate(req);
        if (!user) {
          fs.unlinkSync(file.filepath); // Xóa file nếu không có quyền
          return sendResponse(res, 401, false, "Unauthorized");
        }

        // Kiểm tra phiếu xuất
        const phieu = await pool.query(
          "SELECT * FROM phieu_xuat WHERE id = $1",
          [xuatKhoUploadParams.id]
        );

        if (phieu.rows.length === 0) {
          fs.unlinkSync(file.filepath);
          return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
        }

        if (phieu.rows[0].trang_thai !== "approved") {
          fs.unlinkSync(file.filepath);
          return sendResponse(res, 400, false, "Phiếu chưa được duyệt");
        }

        // Đổi tên file theo format chuẩn
        const timestamp = Date.now();
        const ext = path.extname(file.originalFilename);
        const newFilename = `decision_xuat_${xuatKhoUploadParams.id}_${timestamp}${ext}`;
        const newFilePath = path.join(path.dirname(file.filepath), newFilename);

        fs.renameSync(file.filepath, newFilePath);

        // Lưu thông tin vào database
        const decision_pdf_url = `/uploads/decisions/${newFilename}`;

        await pool.query(
          `UPDATE phieu_xuat 
       SET decision_pdf_url = $1, decision_pdf_filename = $2, ghi_chu_xac_nhan = $3 
       WHERE id = $4`,
          [
            decision_pdf_url,
            file.originalFilename,
            ghi_chu || "",
            xuatKhoUploadParams.id,
          ]
        );

        return sendResponse(res, 200, true, "Upload thành công", {
          filename: file.originalFilename,
          url: decision_pdf_url,
        });
      } catch (error) {
        console.error("Upload error:", error);
        return sendResponse(res, 500, false, "Lỗi upload file");
      }
    }

    // Route cập nhật số lượng thực xuất
    const xuatKhoUpdateQuantityParams = extractParams(
      "/api/xuat-kho/:id/update-so-luong-thuc-xuat",
      pathname
    );
    if (xuatKhoUpdateQuantityParams && method === "PUT") {
      return await xuatKhoController.updateSoLuongThucXuat(
        req,
        res,
        xuatKhoUpdateQuantityParams,
        body,
        user
      );
    }

    // Route download file cho xuất kho
    const xuatKhoDownloadParams = extractParams(
      "/api/xuat-kho/:id/download-decision",
      pathname
    );
    if (xuatKhoDownloadParams && method === "GET") {
      const user = await authenticate(req);
      if (!user) {
        return sendResponse(res, 401, false, "Unauthorized");
      }

      try {
        const phieu = await pool.query(
          "SELECT decision_pdf_url, decision_pdf_filename FROM phieu_xuat WHERE id = $1",
          [xuatKhoDownloadParams.id]
        );

        if (phieu.rows.length === 0 || !phieu.rows[0].decision_pdf_url) {
          return sendResponse(res, 404, false, "File không tồn tại");
        }

        const { decision_pdf_url, decision_pdf_filename } = phieu.rows[0];
        return sendResponse(res, 200, true, "Thông tin file", {
          url: decision_pdf_url,
          filename: decision_pdf_filename,
        });
      } catch (error) {
        console.error("Download error:", error);
        return sendResponse(res, 500, false, "Lỗi server");
      }
    }

    // Hủy phiếu xuất
    const xuatKhoCancelParams = extractParams(
      "/api/xuat-kho/:id/cancel",
      pathname
    );
    if (xuatKhoCancelParams && method === "PATCH") {
      return await xuatKhoController.cancel(
        req,
        res,
        xuatKhoCancelParams,
        user
      );
    }

    // Hoàn thành phiếu xuất
    const xuatKhoCompleteParams = extractParams(
      "/api/xuat-kho/:id/complete",
      pathname
    );
    if (xuatKhoCompleteParams && method === "PATCH") {
      return await xuatKhoController.complete(
        req,
        res,
        xuatKhoCompleteParams,
        user
      );
    }

    // Kiểm tra tồn kho trước khi xuất

    // Route in phiếu xuất
    const xuatKhoPrintParams = extractParams(
      "/api/xuat-kho/:id/print",
      pathname
    );
    if (xuatKhoPrintParams && method === "POST") {
      return await printController.generatePhieuXuatExcel(
        req,
        res,
        xuatKhoPrintParams,
        body,
        user
      );
    }

    // Lấy danh sách đơn vị nhận
    if (pathname === "/api/don-vi-nhan" && method === "GET") {
      return await xuatKhoController.getDonViNhanList(req, res, query, user);
    }

    // Kiem Ke Routes
    if (pathname === "/api/kiem-ke") {
      switch (method) {
        case "GET":
          return await kiemKeController.getList(req, res, query, user);
        case "POST":
          return await kiemKeController.create(req, res, body, user);
      }
    }

    if (pathname === "/api/kiem-ke/hang-hoa" && method === "GET") {
      return await kiemKeController.getHangHoaForKiemKe(req, res, query, user);
    }

    const kiemKeParams = extractParams("/api/kiem-ke/:id", pathname);
    if (kiemKeParams) {
      switch (method) {
        case "GET":
          return await kiemKeController.getDetail(req, res, kiemKeParams, user);
        case "PUT":
          return await kiemKeController.update(
            req,
            res,
            kiemKeParams,
            body,
            user
          );
      }
    }

    const kiemKeTonKhoParams = extractParams(
      "/api/kiem-ke/:id/ton-kho-hien-tai",
      pathname
    );
    if (kiemKeTonKhoParams && method === "GET") {
      return await kiemKeController.getTonKhoHienTai(
        req,
        res,
        kiemKeTonKhoParams,
        user
      );
    }

    const kiemKeApproveParams = extractParams(
      "/api/kiem-ke/:id/approve",
      pathname
    );
    if (kiemKeApproveParams && method === "PATCH") {
      return await kiemKeController.approve(
        req,
        res,
        kiemKeApproveParams,
        user
      );
    }

    // ===== THÊM CÁC ROUTES KIỂM KÊ MỚI =====

    // Route in biên bản kiểm kê
    const kiemKePrintParams = extractParams("/api/kiem-ke/:id/print", pathname);
    if (kiemKePrintParams && method === "POST") {
      console.log(
        `📄 HIT: Kiem ke print endpoint for ID ${kiemKePrintParams.id}`
      );
      return await kiemKeController.print(
        req,
        res,
        kiemKePrintParams,
        body,
        user
      );
    }

    // Route thống kê kiểm kê
    if (pathname === "/api/kiem-ke/statistics" && method === "GET") {
      return await kiemKeController.getStatistics(req, res, query, user);
    }

    // Route hủy phiếu kiểm kê
    const kiemKeCancelParams = extractParams(
      "/api/kiem-ke/:id/cancel",
      pathname
    );
    if (kiemKeCancelParams && method === "PATCH") {
      return await kiemKeController.cancel(req, res, kiemKeCancelParams, user);
    }

    // Route xuất Excel danh sách kiểm kê
    if (pathname === "/api/kiem-ke/export" && method === "GET") {
      return await kiemKeController.exportList(req, res, query, user);
    }

    // Route import từ Excel
    if (pathname === "/api/kiem-ke/import" && method === "POST") {
      try {
        const { file, phieu_id } = await handleFileUpload(req);

        if (!file) {
          return sendResponse(res, 400, false, "Cần chọn file Excel");
        }

        // Kiểm tra file Excel
        const allowedTypes = [".xlsx", ".xls"];
        const fileExt = path.extname(file.originalFilename).toLowerCase();
        if (!allowedTypes.includes(fileExt)) {
          fs.unlinkSync(file.filepath);
          return sendResponse(
            res,
            400,
            false,
            "Chỉ chấp nhận file Excel (.xlsx, .xls)"
          );
        }

        return await kiemKeController.importFromExcel(
          req,
          res,
          { file, phieu_id },
          user
        );
      } catch (error) {
        console.error("Import error:", error);
        return sendResponse(res, 500, false, "Lỗi import file");
      }
    }

    // Route tạo template Excel
    const kiemKeTemplateParams = extractParams(
      "/api/kiem-ke/:id/import-template",
      pathname
    );
    if (kiemKeTemplateParams && method === "GET") {
      return await kiemKeController.getImportTemplate(
        req,
        res,
        kiemKeTemplateParams,
        user
      );
    }

    // Route so sánh kỳ kiểm kê
    if (pathname === "/api/kiem-ke/compare" && method === "GET") {
      return await kiemKeController.compareResults(req, res, query, user);
    }

    // Route lịch sử kiểm kê theo hàng hóa
    const kiemKeHistoryParams = extractParams(
      "/api/kiem-ke/history/hang-hoa/:hangHoaId",
      pathname
    );
    if (kiemKeHistoryParams && method === "GET") {
      return await kiemKeController.getHistoryByHangHoa(
        req,
        res,
        kiemKeHistoryParams,
        query,
        user
      );
    }

    // Route báo cáo tổng hợp kiểm kê
    if (pathname === "/api/kiem-ke/report/summary" && method === "GET") {
      return await kiemKeController.getReportSummary(req, res, query, user);
    }

    // Route phiếu kiểm kê chờ xử lý
    if (pathname === "/api/kiem-ke/pending" && method === "GET") {
      return await kiemKeController.getPendingList(req, res, query, user);
    }

    // Route cập nhật xử lý chênh lệch
    const kiemKeChenhLechParams = extractParams(
      "/api/kiem-ke/:id/chenh-lech",
      pathname
    );
    if (kiemKeChenhLechParams && method === "PATCH") {
      return await kiemKeController.updateChenhLech(
        req,
        res,
        kiemKeChenhLechParams,
        body,
        user
      );
    }

    // ===== TEMPLATE KIỂM KÊ =====

    // Template routes
    if (pathname === "/api/kiem-ke/templates") {
      switch (method) {
        case "GET":
          return await kiemKeController.getTemplates(req, res, query, user);
        case "POST":
          return await kiemKeController.saveTemplate(req, res, body, user);
      }
    }

    // Template with ID
    const templateParams = extractParams(
      "/api/kiem-ke/templates/:id",
      pathname
    );
    if (templateParams) {
      switch (method) {
        case "DELETE":
          return await kiemKeController.deleteTemplate(
            req,
            res,
            templateParams,
            user
          );
        case "PUT":
          return await kiemKeController.updateTemplate(
            req,
            res,
            templateParams,
            body,
            user
          );
      }
    }

    // Tạo từ template
    const createFromTemplateParams = extractParams(
      "/api/kiem-ke/create-from-template/:templateId",
      pathname
    );
    if (createFromTemplateParams && method === "POST") {
      return await kiemKeController.createFromTemplate(
        req,
        res,
        createFromTemplateParams,
        body,
        user
      );
    }

    // ===== TỰ ĐỘNG HÓA =====

    // Tạo phiếu kiểm kê tự động
    if (pathname === "/api/kiem-ke/create-automatic" && method === "POST") {
      return await kiemKeController.createAutomatic(req, res, body, user);
    }

    // Lịch kiểm kê
    if (pathname === "/api/kiem-ke/schedule") {
      switch (method) {
        case "GET":
          return await kiemKeController.getSchedule(req, res, query, user);
        case "POST":
          return await kiemKeController.createSchedule(req, res, body, user);
      }
    }

    // Lịch kiểm kê with ID
    const scheduleParams = extractParams("/api/kiem-ke/schedule/:id", pathname);
    if (scheduleParams) {
      switch (method) {
        case "PUT":
          return await kiemKeController.updateSchedule(
            req,
            res,
            scheduleParams,
            body,
            user
          );
        case "DELETE":
          return await kiemKeController.deleteSchedule(
            req,
            res,
            scheduleParams,
            user
          );
      }
    }

    // ===== CẢNH BÁO VÀ TIỆN ÍCH =====

    // Cảnh báo kiểm kê
    if (pathname === "/api/kiem-ke/warnings" && method === "GET") {
      return await kiemKeController.getWarnings(req, res, query, user);
    }

    // Hàng hóa cần kiểm kê đặc biệt
    if (pathname === "/api/kiem-ke/special-items" && method === "GET") {
      return await kiemKeController.getSpecialItems(req, res, query, user);
    }

    // Backup dữ liệu
    if (pathname === "/api/kiem-ke/backup" && method === "GET") {
      return await kiemKeController.backupData(req, res, query, user);
    }

    // Restore dữ liệu
    if (pathname === "/api/kiem-ke/restore" && method === "POST") {
      try {
        const { file } = await handleFileUpload(req);

        if (!file) {
          return sendResponse(res, 400, false, "Cần chọn file backup");
        }

        return await kiemKeController.restoreData(req, res, { file }, user);
      } catch (error) {
        console.error("Restore error:", error);
        return sendResponse(res, 500, false, "Lỗi restore dữ liệu");
      }
    }

    // Validate dữ liệu kiểm kê
    const validateParams = extractParams("/api/kiem-ke/:id/validate", pathname);
    if (validateParams && method === "POST") {
      return await kiemKeController.validateData(
        req,
        res,
        validateParams,
        user
      );
    }

    // Tạo QR code
    const qrCodeParams = extractParams("/api/kiem-ke/:id/qr-code", pathname);
    if (qrCodeParams && method === "GET") {
      return await kiemKeController.generateQRCode(
        req,
        res,
        qrCodeParams,
        user
      );
    }

    // Tìm kiếm nâng cao
    if (pathname === "/api/kiem-ke/advanced-search" && method === "POST") {
      return await kiemKeController.advancedSearch(req, res, body, user);
    }

    // ===== BÁO CÁO KIỂM KÊ =====

    // Báo cáo chênh lệch
    if (pathname === "/api/kiem-ke/report/chenh-lech" && method === "GET") {
      return await kiemKeController.generateChenhLechReport(
        req,
        res,
        query,
        user
      );
    }

    // Báo cáo phẩm chất
    if (pathname === "/api/kiem-ke/report/pham-chat" && method === "GET") {
      return await kiemKeController.generatePhamChatReport(
        req,
        res,
        query,
        user
      );
    }

    // Thống kê theo phòng ban
    if (pathname === "/api/kiem-ke/statistics/phong-ban" && method === "GET") {
      return await kiemKeController.getStatisticsByPhongBan(
        req,
        res,
        query,
        user
      );
    }

    // Thống kê theo loại hàng hóa
    if (pathname === "/api/kiem-ke/statistics/loai-hang" && method === "GET") {
      return await kiemKeController.getStatisticsByLoaiHang(
        req,
        res,
        query,
        user
      );
    }

    // Thống kê hiệu quả
    if (pathname === "/api/kiem-ke/statistics/efficiency" && method === "GET") {
      return await kiemKeController.getEfficiencyStats(req, res, query, user);
    }

    // Bao Cao Routes

    // Route báo cáo nhập (danh sách phiếu nhập)
    if (pathname === "/api/bao-cao/export/nhap-xuat-nhap" && method === "GET") {
      return await printController.generateBaoCaoNhapExcel(
        req,
        res,
        query,
        user
      );
    }

    // Route báo cáo xuất (danh sách phiếu xuất)
    if (pathname === "/api/bao-cao/export/nhap-xuat-xuat" && method === "GET") {
      return await printController.generateBaoCaoXuatExcel(
        req,
        res,
        query,
        user
      );
    }

    if (pathname === "/api/bao-cao/dashboard" && method === "GET") {
      return await baoCaoController.getDashboardStats(req, res, query, user);
    }

    if (pathname === "/api/bao-cao/dashboard-stats" && method === "GET") {
      return await baoCaoController.getDashboardStats(req, res, query, user);
    }

    if (pathname === "/api/bao-cao/chart-data" && method === "GET") {
      return await baoCaoController.getChartData(req, res, query, user);
    }

    if (pathname === "/api/bao-cao/pham-chat-stats" && method === "GET") {
      return await baoCaoController.getPhamChatStats(req, res, query, user);
    }

    if (pathname === "/api/bao-cao/luan-chuyen" && method === "GET") {
      console.log(`🔍 HIT: Báo cáo luân chuyển endpoint (FIX)`);
      return await baoCaoController.getLuanChuyenReport(req, res, query, user);
    }

    // ✅ FIX VẤN ĐỀ 3: Route lấy danh sách phòng ban cho báo cáo
    if (pathname === "/api/bao-cao/phong-ban-list" && method === "GET") {
      console.log(`🏢 HIT: Phòng ban list for report endpoint`);
      return await baoCaoController.getPhongBanForReport(req, res, query, user);
    }

    if (pathname === "/api/bao-cao/ton-kho" && method === "GET") {
      return await baoCaoController.getTonKhoReport(req, res, query, user);
    }

    if (pathname === "/api/bao-cao/nhap-xuat" && method === "GET") {
      return await baoCaoController.getNhapXuatReport(req, res, query, user);
    }

    if (pathname === "/api/bao-cao/kiem-ke" && method === "GET") {
      return await baoCaoController.getKiemKeReport(req, res, query, user);
    }

    if (pathname === "/api/bao-cao/nhap-by-type" && method === "GET") {
      return await baoCaoController.getNhapDataByType(req, res, query, user);
    }

    if (pathname === "/api/bao-cao/xuat-by-type" && method === "GET") {
      return await baoCaoController.getXuatDataByType(req, res, query, user);
    }

    // Route export Excel với 2 tabs (MỚI)
    if (pathname === "/api/bao-cao/export/nhap-with-tabs" && method === "GET") {
      return await printController.generateNhapReportWithTabs(
        req,
        res,
        query,
        user
      );
    }

    // Route export Excel xuất với 2 tabs (MỚI)
    if (pathname === "/api/bao-cao/export/xuat-with-tabs" && method === "GET") {
      return await printController.generateXuatReportWithTabs(
        req,
        res,
        query,
        user
      );
    }

    if (pathname.startsWith("/api/bao-cao/export/") && method === "GET") {
      const reportType = pathname.split("/").pop();
      return await baoCaoController.exportExcel(req, res, { reportType }, user);
    }

    if (pathname === "/api/bao-cao/luan-chuyen-data" && method === "GET") {
      return await baoCaoController.getLuanChuyenKhoData(req, res, query, user);
    }

    // Thêm route này vào phần Bao Cao Routes
    // if (pathname === "/api/bao-cao/luan-chuyen-kho" && method === "GET") {
    //   return await printController.generateLuanChuyenKhoReport(
    //     req,
    //     res,
    //     query,
    //     user
    //   );
    // }

    if (pathname === "/api/bao-cao/luan-chuyen-kho" && method === "GET") {
      return await baoCaoController.exportLuanChuyenExcel(
        req,
        res,
        query,
        user
      );
    }

    // Thống kê nhanh cho dashboard
    if (pathname === "/api/bao-cao/quick-stats" && method === "GET") {
      return await baoCaoController.getQuickStats(req, res, query, user);
    }

    // Báo cáo xu hướng theo loại
    if (pathname.startsWith("/api/bao-cao/trend/") && method === "GET") {
      const trendType = pathname.split("/").pop();
      return await baoCaoController.getTrendReport(
        req,
        res,
        { type: trendType },
        user
      );
    }

    // Báo cáo tùy chỉnh
    if (pathname === "/api/bao-cao/custom" && method === "POST") {
      return await baoCaoController.getCustomReport(req, res, body, user);
    }

    if (pathname === "/api/yeu-cau-nhap") {
      switch (method) {
        case "GET":
          return await yeuCauNhapKhoController.getList(req, res, query, user);

        case "POST":
          try {
            // Gọi controller và lưu kết quả trước
            const result = await yeuCauNhapKhoController.create(
              req,
              res,
              body,
              user
            );

            // Kiểm tra và gửi notification nếu thành công
            if (global.realTimeHelpers && !res.headersSent) {
              try {
                global.realTimeHelpers.broadcastToRole("admin", "new_request", {
                  type: "new_yeu_cau_nhap",
                  title: "Yêu cầu nhập kho mới",
                  message: "Có yêu cầu nhập kho mới cần phê duyệt",
                  requester: user.ho_ten,
                  department: user.ten_phong_ban,
                });
              } catch (notificationError) {
                console.error(
                  "Real-time notification error:",
                  notificationError
                );
              }
            }

            // Return kết quả cuối cùng
            return result;
          } catch (error) {
            console.error("Create yeu cau nhap error:", error);
            return sendResponse(res, 500, false, "Lỗi server");
          }
      }
    }

    // Chi tiết yêu cầu nhập kho
    const yeuCauNhapParams = extractParams("/api/yeu-cau-nhap/:id", pathname);
    if (yeuCauNhapParams) {
      switch (method) {
        case "GET":
          return await yeuCauNhapKhoController.getDetail(
            req,
            res,
            yeuCauNhapParams,
            user
          );
        case "PUT":
          return await yeuCauNhapKhoController.update(
            req,
            res,
            yeuCauNhapParams,
            body,
            user
          );
        case "DELETE":
          return await yeuCauNhapKhoController.delete(
            req,
            res,
            yeuCauNhapParams,
            user
          );
      }
    }

    // Gửi yêu cầu nhập kho (chuyển từ draft -> confirmed)
    const yeuCauNhapSubmitParams = extractParams(
      "/api/yeu-cau-nhap/:id/submit",
      pathname
    );
    if (yeuCauNhapSubmitParams && method === "PATCH") {
      return await yeuCauNhapKhoController.submit(
        req,
        res,
        yeuCauNhapSubmitParams,
        user
      );
    }

    // Hủy yêu cầu nhập kho
    const yeuCauNhapCancelParams = extractParams(
      "/api/yeu-cau-nhap/:id/cancel",
      pathname
    );
    if (yeuCauNhapCancelParams && method === "PATCH") {
      return await yeuCauNhapKhoController.cancel(
        req,
        res,
        yeuCauNhapCancelParams,
        user
      );
    }

    // =============================================
    // YÊU CẦU XUẤT KHO ROUTES (Tương tự nhập kho)
    // =============================================

    // Danh sách yêu cầu xuất kho
    if (pathname === "/api/yeu-cau-xuat") {
      switch (method) {
        case "GET":
          return await yeuCauXuatKhoController.getList(req, res, query, user);
        case "POST":
          return await yeuCauXuatKhoController.create(req, res, body, user);
      }
    }

    // Chi tiết yêu cầu xuất kho
    const yeuCauXuatParams = extractParams("/api/yeu-cau-xuat/:id", pathname);
    if (yeuCauXuatParams) {
      switch (method) {
        case "GET":
          return await yeuCauXuatKhoController.getDetail(
            req,
            res,
            yeuCauXuatParams,
            user
          );
        case "PUT":
          return await yeuCauXuatKhoController.update(
            req,
            res,
            yeuCauXuatParams,
            body,
            user
          );
        case "DELETE":
          return await yeuCauXuatKhoController.delete(
            req,
            res,
            yeuCauXuatParams,
            user
          );
      }
    }

    const yeuCauXuatCheckTonKhoParams = extractParams(
      "/api/yeu-cau-xuat/:id/check-ton-kho",
      pathname
    );
    if (yeuCauXuatCheckTonKhoParams && method === "GET") {
      return await yeuCauXuatKhoController.checkTonKho(
        req,
        res,
        yeuCauXuatCheckTonKhoParams,
        user
      );
    }

    // Gửi yêu cầu xuất kho
    const yeuCauXuatSubmitParams = extractParams(
      "/api/yeu-cau-xuat/:id/submit",
      pathname
    );
    if (yeuCauXuatSubmitParams && method === "PATCH") {
      return await yeuCauXuatKhoController.submit(
        req,
        res,
        yeuCauXuatSubmitParams,
        user
      );
    }

    // Hủy yêu cầu xuất kho
    const yeuCauXuatCancelParams = extractParams(
      "/api/yeu-cau-xuat/:id/cancel",
      pathname
    );
    if (yeuCauXuatCancelParams && method === "PATCH") {
      return await yeuCauXuatKhoController.cancel(
        req,
        res,
        yeuCauXuatCancelParams,
        user
      );
    }

    // Kiểm tra tồn kho cho yêu cầu xuất

    if (yeuCauXuatCheckTonKhoParams && method === "GET") {
      return await yeuCauXuatKhoController.checkTonKho(
        req,
        res,
        yeuCauXuatCheckTonKhoParams,
        user
      );
    }

    // =============================================
    // WORKFLOW APPROVAL ROUTES
    // =============================================

    const workflowApproveNhapParams = extractParams(
      "/api/workflow/yeu-cau-nhap/:id/approve",
      pathname
    );
    if (workflowApproveNhapParams && method === "POST") {
      try {
        const result = await workflowController.approveYeuCauNhap(
          req,
          res,
          workflowApproveNhapParams,
          body,
          user
        );

        // Gửi real-time notification sau khi approve thành công
        if (global.realTimeHelpers && !res.headersSent) {
          try {
            global.realTimeHelpers.sendRealTimeNotification(
              body.requester_id || user.id,
              {
                type: "workflow_approved",
                title: "Yêu cầu đã được phê duyệt",
                message: "Yêu cầu nhập kho đã được phê duyệt",
                request_id: workflowApproveNhapParams.id,
              }
            );
          } catch (notificationError) {
            console.error("Real-time notification error:", notificationError);
          }
        }

        return result;
      } catch (error) {
        console.error("Workflow approve error:", error);
        return sendResponse(res, 500, false, "Lỗi server");
      }
    }

    // Từ chối yêu cầu nhập kho
    // Từ chối yêu cầu nhập kho
    const workflowRejectNhapParams = extractParams(
      "/api/workflow/yeu-cau-nhap/:id/reject",
      pathname
    );
    if (workflowRejectNhapParams && method === "POST") {
      try {
        const result = await workflowController.rejectYeuCauNhap(
          req,
          res,
          workflowRejectNhapParams,
          body,
          user
        );

        // Gửi real-time notification sau khi reject thành công
        if (global.realTimeHelpers && !res.headersSent) {
          try {
            global.realTimeHelpers.sendRealTimeNotification(
              body.requester_id || user.id,
              {
                type: "workflow_rejected",
                title: "Yêu cầu bị từ chối",
                message: "Yêu cầu nhập kho đã bị từ chối",
                request_id: workflowRejectNhapParams.id,
              }
            );
          } catch (notificationError) {
            console.error("Real-time notification error:", notificationError);
          }
        }

        return result;
      } catch (error) {
        console.error("Workflow reject error:", error);
        return sendResponse(res, 500, false, "Lỗi server");
      }
    }

    // Chuyển đổi yêu cầu nhập kho thành phiếu nhập
    const workflowConvertNhapParams = extractParams(
      "/api/workflow/yeu-cau-nhap/:id/convert-to-phieu",
      pathname
    );
    if (workflowConvertNhapParams && method === "POST") {
      return await workflowController.convertToPhieuNhap(
        req,
        res,
        workflowConvertNhapParams,
        body,
        user
      );
    }

    // Phê duyệt yêu cầu xuất kho
    const workflowApproveXuatParams = extractParams(
      "/api/workflow/yeu-cau-xuat/:id/approve",
      pathname
    );
    if (workflowApproveXuatParams && method === "POST") {
      return await workflowController.approveYeuCauXuat(
        req,
        res,
        workflowApproveXuatParams,
        body,
        user
      );
    }

    // Từ chối yêu cầu xuất kho
    const workflowRejectXuatParams = extractParams(
      "/api/workflow/yeu-cau-xuat/:id/reject",
      pathname
    );
    if (workflowRejectXuatParams && method === "POST") {
      return await workflowController.rejectYeuCauXuat(
        req,
        res,
        workflowRejectXuatParams,
        body,
        user
      );
    }

    // Chuyển đổi yêu cầu xuất kho thành phiếu xuất
    const workflowConvertXuatParams = extractParams(
      "/api/workflow/yeu-cau-xuat/:id/convert-to-phieu",
      pathname
    );
    if (workflowConvertXuatParams && method === "POST") {
      return await workflowController.convertToPhieuXuat(
        req,
        res,
        workflowConvertXuatParams,
        body,
        user
      );
    }

    // Thống kê workflow
    if (pathname === "/api/workflow/statistics" && method === "GET") {
      return await workflowController.getWorkflowStats(req, res, query, user);
    }

    // Danh sách yêu cầu chờ phê duyệt
    if (pathname === "/api/workflow/pending-approvals" && method === "GET") {
      return await yeuCauNhapKhoController.getPendingApprovals(
        req,
        res,
        query,
        user
      );
    }

    // =============================================
    // NOTIFICATION ROUTES
    // =============================================

    // Danh sách thông báo của user
    if (pathname === "/api/notifications") {
      switch (method) {
        case "GET":
          return await notificationController.getList(req, res, query, user);
      }
    }

    // Đánh dấu thông báo đã đọc
    const notificationReadParams = extractParams(
      "/api/notifications/:id/read",
      pathname
    );
    if (notificationReadParams && method === "PATCH") {
      return await notificationController.markAsRead(
        req,
        res,
        notificationReadParams,
        user
      );
    }

    // Đánh dấu nhiều thông báo đã đọc
    if (pathname === "/api/notifications/bulk-read" && method === "PATCH") {
      return await notificationController.bulkMarkAsRead(req, res, body, user);
    }

    // Đánh dấu tất cả thông báo đã đọc
    if (pathname === "/api/notifications/mark-all-read" && method === "PATCH") {
      return await notificationController.markAllAsRead(req, res, body, user);
    }

    // Số lượng thông báo chưa đọc
    if (pathname === "/api/notifications/unread-count" && method === "GET") {
      return await notificationController.getUnreadCount(req, res, query, user);
    }

    // Thống kê thông báo
    if (pathname === "/api/notifications/statistics" && method === "GET") {
      return await notificationController.getStatistics(req, res, query, user);
    }

    // Tạo thông báo hệ thống (admin only)
    if (pathname === "/api/notifications/system" && method === "POST") {
      return await notificationController.createSystemNotification(
        req,
        res,
        body,
        user
      );
    }

    // Lưu trữ thông báo
    const notificationArchiveParams = extractParams(
      "/api/notifications/:id/archive",
      pathname
    );
    if (notificationArchiveParams && method === "DELETE") {
      return await notificationController.archiveNotification(
        req,
        res,
        notificationArchiveParams,
        user
      );
    }

    // Cài đặt thông báo
    if (pathname === "/api/notifications/preferences") {
      switch (method) {
        case "GET":
          return await notificationController.getNotificationPreferences(
            req,
            res,
            query,
            user
          );
        case "PUT":
          return await notificationController.updateNotificationPreferences(
            req,
            res,
            body,
            user
          );
      }
    }

    // Dọn dẹp thông báo cũ (admin only)
    if (pathname === "/api/notifications/cleanup" && method === "POST") {
      return await notificationController.cleanupNotifications(
        req,
        res,
        body,
        user
      );
    }

    // WebSocket status endpoints
    if (pathname === "/api/websocket/status" && method === "GET") {
      if (user.role !== "admin") {
        return sendResponse(res, 403, false, "Admin access required");
      }

      const connectedUsers = Array.from(connectedClients.values());
      return sendResponse(res, 200, true, "WebSocket status retrieved", {
        total_connections: connectedUsers.length,
        connected_users: connectedUsers.map((client) => ({
          user_id: client.userId,
          user_name: client.userInfo.ho_ten,
          department: client.userInfo.ten_phong_ban,
          connected_at: client.connectedAt,
          last_activity: client.lastActivity,
        })),
        uptime: process.uptime(),
      });
    }

    // Force disconnect user (admin only)
    const forceDisconnectParams = extractParams(
      "/api/websocket/disconnect/:userId",
      pathname
    );
    if (forceDisconnectParams && method === "POST") {
      if (user.role !== "admin") {
        return sendResponse(res, 403, false, "Admin access required");
      }

      const socketId = userSocketMap.get(
        parseInt(forceDisconnectParams.userId)
      );
      if (socketId) {
        io.to(socketId).emit("force_disconnect", {
          reason: "Administrative action",
          message: "Your connection has been terminated by administrator",
        });
        io.sockets.sockets.get(socketId)?.disconnect(true);
        return sendResponse(res, 200, true, "User disconnected");
      } else {
        return sendResponse(res, 404, false, "User not connected");
      }
    }

    // 404 - Route not found
    console.log(`❌ 404 - Route not found: ${method} ${pathname}`);
    sendResponse(res, 404, false, "API endpoint not found", {
      path: pathname,
      method: method,
    });
  } catch (error) {
    console.error("❌ Server error:", error);
    sendResponse(res, 500, false, "Internal server error", {
      error: error.message,
    });
  }
};

// Create HTTP Server
//const server = http.createServer(router);

// Thay thế phần Create HTTP Server hiện tại
const server = createServer(router);

// Khởi tạo Socket.IO server
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"], // Frontend URLs
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Thêm sau phần khởi tạo Socket.IO server

// WebSocket Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error("Invalid authentication token"));
    }

    // Lấy thông tin user từ database
    const userQuery = `
      SELECT u.*, pb.ten_phong_ban, pb.ma_phong_ban 
      FROM users u 
      LEFT JOIN phong_ban pb ON u.phong_ban_id = pb.id 
      WHERE u.id = $1 AND u.trang_thai = $2
    `;
    const result = await pool.query(userQuery, [decoded.id, "active"]);

    if (result.rows.length === 0) {
      return next(new Error("User not found or inactive"));
    }

    socket.user = result.rows[0];
    next();
  } catch (error) {
    console.error("WebSocket auth error:", error);
    next(new Error("Authentication failed"));
  }
});

// Thêm sau WebSocket Authentication Middleware

// WebSocket Connection Handling
io.on("connection", (socket) => {
  const user = socket.user;
  console.log(
    `🔌 User ${user.ho_ten} (ID: ${user.id}) connected via WebSocket`
  );

  // Lưu thông tin connection
  connectedClients.set(socket.id, {
    userId: user.id,
    userInfo: user,
    connectedAt: new Date(),
    lastActivity: new Date(),
  });

  userSocketMap.set(user.id, socket.id);

  // Join user vào room theo phòng ban
  if (user.phong_ban_id) {
    socket.join(`department_${user.phong_ban_id}`);
  }

  // Join user vào room theo role
  socket.join(`role_${user.role}`);

  // Join user vào personal room
  socket.join(`user_${user.id}`);

  // Gửi thông tin connection success
  socket.emit("connection_established", {
    message: "WebSocket connection established",
    userId: user.id,
    timestamp: new Date(),
  });

  // Handle ping để maintain connection
  socket.on("ping", () => {
    const clientInfo = connectedClients.get(socket.id);
    if (clientInfo) {
      clientInfo.lastActivity = new Date();
      connectedClients.set(socket.id, clientInfo);
    }
    socket.emit("pong", { timestamp: new Date() });
  });

  // Handle request for notification count
  socket.on("get_notification_count", async () => {
    try {
      const countResult = await pool.query(
        "SELECT COUNT(*) as count FROM notifications WHERE nguoi_nhan = $1 AND trang_thai = 'unread'",
        [user.id]
      );

      socket.emit("notification_count_update", {
        unread_count: parseInt(countResult.rows[0].count),
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error getting notification count:", error);
    }
  });

  // Handle join specific rooms
  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    console.log(`User ${user.id} joined room: ${roomName}`);
  });

  // Handle leave specific rooms
  socket.on("leave_room", (roomName) => {
    socket.leave(roomName);
    console.log(`User ${user.id} left room: ${roomName}`);
  });

  // Handle disconnection
  socket.on("disconnect", (reason) => {
    console.log(
      `🔌 User ${user.ho_ten} (ID: ${user.id}) disconnected: ${reason}`
    );
    connectedClients.delete(socket.id);
    userSocketMap.delete(user.id);
  });
});

// Thêm sau WebSocket event handlers

// Helper Functions cho Real-time Notifications
const sendRealTimeNotification = (userId, notification) => {
  const socketId = userSocketMap.get(userId);
  if (socketId && connectedClients.has(socketId)) {
    io.to(`user_${userId}`).emit("new_notification", {
      ...notification,
      timestamp: new Date(),
    });

    // Cập nhật notification count
    updateNotificationCount(userId);
  }
};

const updateNotificationCount = async (userId) => {
  try {
    const countResult = await pool.query(
      "SELECT COUNT(*) as count FROM notifications WHERE nguoi_nhan = $1 AND trang_thai = 'unread'",
      [userId]
    );

    io.to(`user_${userId}`).emit("notification_count_update", {
      unread_count: parseInt(countResult.rows[0].count),
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error updating notification count:", error);
  }
};

const broadcastToRole = (role, event, data) => {
  io.to(`role_${role}`).emit(event, {
    ...data,
    timestamp: new Date(),
  });
};

const broadcastToDepartment = (departmentId, event, data) => {
  io.to(`department_${departmentId}`).emit(event, {
    ...data,
    timestamp: new Date(),
  });
};

const broadcastSystemMessage = (message, excludeUserId = null) => {
  const eventData = {
    type: "system_message",
    message: message,
    timestamp: new Date(),
  };

  if (excludeUserId) {
    const socketId = userSocketMap.get(excludeUserId);
    if (socketId) {
      socket.broadcast.emit("system_notification", eventData);
    }
  } else {
    io.emit("system_notification", eventData);
  }
};

// Export functions để sử dụng ở các controllers khác
global.realTimeHelpers = {
  sendRealTimeNotification,
  updateNotificationCount,
  broadcastToRole,
  broadcastToDepartment,
  broadcastSystemMessage,
  getConnectedUsers: () => Array.from(connectedClients.values()),
  isUserOnline: (userId) => userSocketMap.has(userId),
};

// Cập nhật phần startServer function hiện có
const startServer = async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("✅ Database connected successfully");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📝 API Documentation: http://localhost:${PORT}/`);
      console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🔌 WebSocket Server: ws://localhost:${PORT}`);
      console.log(
        `📡 Socket.IO Client: http://localhost:${PORT}/socket.io/socket.io.js`
      );
      console.log("");
      console.log("📋 WebSocket Events:");
      console.log("  📥 connection - User connects");
      console.log("  📤 new_notification - Real-time notifications");
      console.log("  📊 notification_count_update - Unread count updates");
      console.log("  🏓 ping/pong - Connection keepalive");
      console.log("");
      console.log("🎯 Ready to accept HTTP and WebSocket connections!");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});

startServer();
