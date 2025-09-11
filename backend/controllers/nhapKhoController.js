const pool = require("../config/database");
const { sendResponse } = require("../utils/response");
//const notificationService = require("./notificationController");
const notificationService = require("../services/notificationService");
const { parseAndRound, calculateTotal } = require("../utils/numberUtils");

const nhapKhoController = {
  async getDetail(req, res, params, user) {
    try {
      const { id } = params;
      console.log("Đang lấy chi tiết phiếu nhập:", id);

      const detailQuery = `
        SELECT 
          pn.*, 
          ncc.id as nha_cung_cap_id, ncc.ma_ncc, ncc.ten_ncc, 
          ncc.dia_chi as ncc_dia_chi, ncc.phone as ncc_phone,
          ncc.email as ncc_email, ncc.is_noi_bo as ncc_is_noi_bo,
          u1.id as nguoi_tao_id, u1.ho_ten as nguoi_tao_ten,
          u2.id as nguoi_duyet_cap1_id, u2.ho_ten as nguoi_duyet_cap1_ten,
          pb.ten_phong_ban,
          pb_cc.id as phong_ban_cung_cap_id,
          pb_cc.ten_phong_ban as ten_phong_ban_cung_cap
        FROM phieu_nhap pn
        LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
        LEFT JOIN users u1 ON pn.nguoi_tao = u1.id
        LEFT JOIN users u2 ON pn.nguoi_duyet_cap1 = u2.id
        LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
        LEFT JOIN phong_ban pb_cc ON pn.phong_ban_cung_cap_id = pb_cc.id
        WHERE pn.id = $1
      `;

      const chiTietQuery = `
        SELECT
          ctn.*,
          h.id as hang_hoa_id_ref, h.ma_hang_hoa, h.ten_hang_hoa, 
          h.don_vi_tinh, h.co_so_seri, h.gia_nhap_gan_nhat
        FROM chi_tiet_nhap ctn
        JOIN hang_hoa h ON ctn.hang_hoa_id = h.id
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

      // ✅ FIX: Logic permission phức tạp hơn theo role
      let hasPermission = false;

      if (user.role === "admin") {
        hasPermission = true;
      } else if (user.role === "user" && user.phong_ban?.cap_bac === 3) {
        // User cấp 3 chỉ xem được phiếu của phòng ban mình
        hasPermission = phieuData.phong_ban_id === user.phong_ban_id;
      } else if (user.role === "manager") {
        // Manager xem được phiếu của các phòng ban cấp 3 thuộc quyền
        const managerPermissionQuery = `
          SELECT COUNT(*) as count
          FROM phong_ban pb
          WHERE pb.id = $1 
          AND (pb.phong_ban_cha_id = $2 OR pb.id = $2)
          AND pb.cap_bac = 3
        `;
        const managerResult = await pool.query(managerPermissionQuery, [
          phieuData.phong_ban_id,
          user.phong_ban_id,
        ]);
        hasPermission = parseInt(managerResult.rows[0].count) > 0;
      }

      if (!hasPermission) {
        console.log("❌ Permission denied:", {
          user: {
            role: user.role,
            phong_ban_id: user.phong_ban_id,
            cap_bac: user.phong_ban?.cap_bac,
          },
          phieu: {
            phong_ban_id: phieuData.phong_ban_id,
          },
        });
        return sendResponse(
          res,
          403,
          false,
          "Bạn không có quyền xem phiếu nhập này"
        );
      }

      const phieuNhap = {
        ...phieuData,
        nha_cung_cap: phieuData.nha_cung_cap_id
          ? {
              id: phieuData.nha_cung_cap_id,
              ma_ncc: phieuData.ma_ncc,
              ten_ncc: phieuData.ten_ncc,
              dia_chi: phieuData.ncc_dia_chi,
              phone: phieuData.ncc_phone,
              email: phieuData.ncc_email,
              is_noi_bo: phieuData.ncc_is_noi_bo,
            }
          : null,
        phong_ban_cung_cap: phieuData.phong_ban_cung_cap_id
          ? {
              id: phieuData.phong_ban_cung_cap_id,
              ten_phong_ban: phieuData.ten_phong_ban_cung_cap,
            }
          : null,
        nguoi_tao_info: phieuData.nguoi_tao_id
          ? {
              id: phieuData.nguoi_tao_id,
              ho_ten: phieuData.nguoi_tao_ten,
            }
          : null,
        nguoi_tao_ten: phieuData.nguoi_tao_ten, // ✅ FIX: Thêm field này để frontend có thể dùng
        nguoi_duyet_info: phieuData.nguoi_duyet_cap1_id
          ? {
              id: phieuData.nguoi_duyet_cap1_id,
              ho_ten: phieuData.nguoi_duyet_cap1_ten,
            }
          : null,
        phong_ban: phieuData.phong_ban_id
          ? {
              id: phieuData.phong_ban_id,
              ten_phong_ban: phieuData.ten_phong_ban,
            }
          : null,
        ten_phong_ban: phieuData.ten_phong_ban, // ✅ FIX: Thêm field này để frontend có thể dùng
        chi_tiet: chiTietResult.rows.map((item) => ({
          ...item,
          hang_hoa: {
            id: item.hang_hoa_id_ref,
            ma_hang_hoa: item.ma_hang_hoa,
            ten_hang_hoa: item.ten_hang_hoa,
            don_vi_tinh: item.don_vi_tinh,
            co_so_seri: item.co_so_seri,
            gia_nhap_gan_nhat: item.gia_nhap_gan_nhat,
          },
        })),
      };

      console.log("Đã lấy chi tiết phiếu thành công:", {
        id: phieuNhap.id,
        so_phieu: phieuNhap.so_phieu,
        loai_phieu: phieuNhap.loai_phieu,
        has_ncc: !!phieuNhap.nha_cung_cap,
        has_phong_ban_cc: !!phieuNhap.phong_ban_cung_cap,
        chi_tiet_count: phieuNhap.chi_tiet.length,
      });

      sendResponse(res, 200, true, "Lấy chi tiết thành công", phieuNhap);
    } catch (error) {
      console.error("Get phieu nhap detail error:", error);
      sendResponse(res, 500, false, "Lỗi server");
    }
  },

  async downloadDecision(req, res, params, user) {
    try {
      const { id } = params;

      const phieuResult = await pool.query(
        "SELECT decision_pdf_url, so_phieu FROM phieu_nhap WHERE id = $1",
        [id]
      );

      if (phieuResult.rows.length === 0) {
        return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
      }

      const phieu = phieuResult.rows[0];

      if (!phieu.decision_pdf_url) {
        return sendResponse(res, 404, false, "Phiếu chưa có quyết định");
      }

      sendResponse(res, 200, true, "Lấy thông tin file thành công", {
        url: phieu.decision_pdf_url,
        filename: `quyet_dinh_${phieu.so_phieu}.pdf`,
      });
    } catch (error) {
      console.error("Download decision error:", error);
      sendResponse(res, 500, false, "Lỗi server");
    }
  },

  async getPhongBanList(req, res, params, user) {
    try {
      // Chỉ admin mới được xem danh sách phòng ban
      if (user.role !== "admin") {
        return sendResponse(
          res,
          403,
          false,
          "Không có quyền xem danh sách phòng ban"
        );
      }

      const query = `
        SELECT
          id,
          ma_phong_ban,
          ten_phong_ban,
          cap_bac,
          phong_ban_cha_id
        FROM phong_ban
        WHERE is_active = TRUE
        ORDER BY cap_bac ASC, ten_phong_ban ASC
      `;

      const result = await pool.query(query);

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
  },

  async create(req, res, body, user) {
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
        phong_ban_cung_cap_id,
        ghi_chu,
        chi_tiet = [],
      } = body;

      console.log("🔄 CREATE PHIEU DEBUG:");
      console.log("- Body received:", body);
      console.log("- Chi tiet length:", chi_tiet.length);
      console.log("- Loai phieu:", loai_phieu);
      console.log("- NCC ID:", nha_cung_cap_id);
      console.log("- Phong ban cung cap ID:", phong_ban_cung_cap_id);

      if (!ngay_nhap) {
        await client.query("ROLLBACK");
        return sendResponse(res, 400, false, "Vui lòng chọn ngày nhập");
      }

      if (!chi_tiet || chi_tiet.length === 0) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          "Vui lòng thêm ít nhất một hàng hóa"
        );
      }

      // ✅ FIXED: Validation logic đúng theo business rules
      if (loai_phieu === "tu_mua" || loai_phieu === "tren_cap") {
        // Tự mua & Trên cấp → đều cần nhà cung cấp (chỉ khác loai_nha_cung_cap)
        if (!nha_cung_cap_id) {
          await client.query("ROLLBACK");
          return sendResponse(res, 400, false, "Vui lòng chọn nhà cung cấp");
        }
      } else if (loai_phieu === "dieu_chuyen") {
        // Điều chuyển → cần phòng ban cung cấp
        if (!phong_ban_cung_cap_id) {
          await client.query("ROLLBACK");
          return sendResponse(
            res,
            400,
            false,
            "Vui lòng chọn phòng ban cung cấp"
          );
        }
      } else {
        // Loại phiếu không hợp lệ
        await client.query("ROLLBACK");
        return sendResponse(res, 400, false, "Loại phiếu không hợp lệ");
      }

      // Tạo số phiếu tự động
      const currentDate = new Date(ngay_nhap);
      const dateStr = currentDate.toISOString().slice(0, 10).replace(/-/g, "");

      const maxSeqResult = await client.query(
        "SELECT COALESCE(MAX(CAST(SUBSTRING(so_phieu FROM 11) AS INTEGER)), 0) as max_seq FROM phieu_nhap WHERE so_phieu LIKE $1",
        [`PN${dateStr}%`]
      );

      const nextSeq = maxSeqResult.rows[0].max_seq + 1;
      const soPhieu = `PN${dateStr}${nextSeq.toString().padStart(3, "0")}`;

      console.log("📋 Generated so_phieu:", soPhieu);

      // ✅ FIX: Validate và tính tổng tiền từ chi tiết
      let tongTien = 0;
      for (let i = 0; i < chi_tiet.length; i++) {
        const item = chi_tiet[i];

        // Kiểm tra hàng hóa
        if (!item.hang_hoa_id) {
          await client.query("ROLLBACK");
          return sendResponse(
            res,
            400,
            false,
            `Dòng ${i + 1}: Chưa chọn hàng hóa`
          );
        }

        // Kiểm tra số lượng
        if (!item.so_luong_ke_hoach && !item.so_luong) {
          await client.query("ROLLBACK");
          return sendResponse(
            res,
            400,
            false,
            `Dòng ${i + 1}: Chưa nhập số lượng`
          );
        }

        // Kiểm tra đơn giá
        if (item.don_gia === undefined || item.don_gia === null) {
          await client.query("ROLLBACK");
          return sendResponse(
            res,
            400,
            false,
            `Dòng ${i + 1}: Chưa nhập đơn giá`
          );
        }

        // Kiểm tra hàng hóa tồn tại
        const hangHoaCheck = await client.query(
          "SELECT id, ten_hang_hoa, gia_nhap_gan_nhat FROM hang_hoa WHERE id = $1",
          [item.hang_hoa_id]
        );

        if (hangHoaCheck.rows.length === 0) {
          await client.query("ROLLBACK");
          return sendResponse(
            res,
            400,
            false,
            `Hàng hóa ID ${item.hang_hoa_id} không tồn tại`
          );
        }

        const hangHoa = hangHoaCheck.rows[0];
        const donGia = parseAndRound(
          item.don_gia || hangHoa.gia_nhap_gan_nhat || 0
        ); // ✅ FIX: Sử dụng utility function
        tongTien += calculateTotal(item.so_luong_ke_hoach || 0, donGia); // ✅ FIX: Sử dụng utility function
      }

      console.log("💰 Tong tien calculated:", tongTien);

      // Tạo phiếu nhập với trạng thái draft (workflow mới)
      const phieuResult = await client.query(
        `INSERT INTO phieu_nhap (
          so_phieu, ngay_nhap, nha_cung_cap_id, don_vi_van_chuyen_id,
          ly_do_nhap, loai_phieu, so_hoa_don, nguoi_nhap_hang, so_quyet_dinh,
          dia_chi_nhap, phuong_thuc_van_chuyen, phong_ban_id, phong_ban_cung_cap_id,
          ghi_chu, nguoi_tao, tong_tien, trang_thai
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'draft')
        RETURNING *`,
        [
          soPhieu,
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
          phong_ban_cung_cap_id,
          ghi_chu,
          user.id,
          tongTien,
        ]
      );

      const phieuNhap = phieuResult.rows[0];
      console.log("✅ Created phieu nhap:", phieuNhap.id);

      // ✅ FIX: Tạo chi tiết nhập với xử lý so_seri_list đúng cách
      for (let i = 0; i < chi_tiet.length; i++) {
        const item = chi_tiet[i];
        console.log(`🔄 Processing chi_tiet item ${i + 1}:`, item);

        const {
          hang_hoa_id,
          so_luong_ke_hoach,
          so_luong,
          don_gia,
          so_seri_list,
          pham_chat = "tot",
          han_su_dung,
          vi_tri_kho,
          ghi_chu: item_ghi_chu,
          la_tai_san_co_dinh = false,
        } = item;

        const hangHoa = await client.query(
          "SELECT gia_nhap_gan_nhat FROM hang_hoa WHERE id = $1",
          [hang_hoa_id]
        );

        const donGiaFinal = parseAndRound(
          don_gia || hangHoa.rows[0]?.gia_nhap_gan_nhat || 0
        ); // ✅ FIX: Sử dụng utility function
        const soLuongKeHoach = parseFloat(so_luong_ke_hoach || so_luong || 0);
        const soLuongThucNhap = parseFloat(so_luong || so_luong_ke_hoach || 0);
        const thanhTien = calculateTotal(soLuongKeHoach, donGiaFinal); // ✅ FIX: Sử dụng utility function

        // ✅ FIX: Xử lý so_seri_list đúng cách - đây là nguyên nhân lỗi chính
        let processedSoSeriList = null;
        if (so_seri_list) {
          if (Array.isArray(so_seri_list)) {
            // Nếu là array, filter ra các giá trị rỗng
            const filtered = so_seri_list.filter(
              (item) => item && typeof item === "string" && item.trim() !== ""
            );
            processedSoSeriList = filtered.length > 0 ? filtered : null;
          } else if (
            typeof so_seri_list === "string" &&
            so_seri_list.trim() !== ""
          ) {
            // Nếu là string, split thành array
            const splitList = so_seri_list
              .split(/[,\n]/)
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
            processedSoSeriList = splitList.length > 0 ? splitList : null;
          }
        }

        console.log(`🔍 Processed so_seri_list for item ${i + 1}:`, {
          original: so_seri_list,
          processed: processedSoSeriList,
          type: typeof processedSoSeriList,
        });

        console.log(`📦 Inserting chi tiet ${i + 1}:`, {
          hang_hoa_id,
          so_luong_ke_hoach: soLuongKeHoach,
          so_luong: soLuongThucNhap,
          don_gia: donGiaFinal,
          so_seri_list: processedSoSeriList,
        });

        // ✅ Insert chi tiết nhập với schema chuẩn
        await client.query(
          `INSERT INTO chi_tiet_nhap (
            phieu_nhap_id, hang_hoa_id, so_luong_ke_hoach, so_luong,
            don_gia, thanh_tien, so_seri_list, pham_chat, han_su_dung,
            vi_tri_kho, ghi_chu, la_tai_san_co_dinh
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            phieuNhap.id,
            hang_hoa_id,
            soLuongKeHoach,
            soLuongThucNhap,
            donGiaFinal,
            thanhTien,
            processedSoSeriList, // ✅ Sử dụng processed array hoặc null
            pham_chat,
            han_su_dung,
            vi_tri_kho,
            item_ghi_chu,
            la_tai_san_co_dinh,
          ]
        );

        console.log(`✅ Successfully inserted chi_tiet_nhap ${i + 1}`);

        // Cập nhật giá nhập gần nhất và đơn vị tính cho hàng hóa
        if (donGiaFinal > 0) {
          await client.query(
            "UPDATE hang_hoa SET gia_nhap_gan_nhat = $1 WHERE id = $2",
            [donGiaFinal, hang_hoa_id]
          );
        }

        // ✅ Cập nhật đơn vị tính nếu có thay đổi
        if (item.don_vi_tinh && item.don_vi_tinh !== "Cái") {
          await client.query(
            "UPDATE hang_hoa SET don_vi_tinh = $1 WHERE id = $2",
            [item.don_vi_tinh, hang_hoa_id]
          );
        }

        // Tạo tài sản cố định nếu cần
        if (la_tai_san_co_dinh && donGiaFinal >= 10000000) {
          try {
            const maTSCD = await generateMaTaiSan(client);
            await client.query(
              `INSERT INTO tai_san_co_dinh (
                ma_tai_san, ten_tai_san, hang_hoa_id, gia_tri_ban_dau,
                phieu_nhap_id, chi_tiet_nhap_id, phong_ban_id, trang_thai
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'hoat_dong')`,
              [
                maTSCD,
                hangHoa.rows[0]?.ten_hang_hoa || `Tài sản ${hang_hoa_id}`,
                hang_hoa_id,
                donGiaFinal,
                phieuNhap.id,
                i + 1, // Tạm thời dùng index
                phong_ban_id || user.phong_ban_id,
              ]
            );
            console.log(`✅ Created TSCD with ma: ${maTSCD}`);
          } catch (tscdError) {
            console.warn("⚠️ TSCD creation failed:", tscdError.message);
            // Không rollback, chỉ warning
          }
        }
      }

      await client.query("COMMIT");

      console.log("🎉 Transaction completed successfully");

      sendResponse(res, 201, true, "Tạo phiếu nhập thành công", {
        id: phieuNhap.id,
        so_phieu: phieuNhap.so_phieu,
        trang_thai: phieuNhap.trang_thai,
        tong_tien: phieuNhap.tong_tien,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Create phieu nhap error:", error);
      console.error("❌ Error stack:", error.stack);

      // Xử lý lỗi cụ thể
      if (error.code === "23505") {
        return sendResponse(res, 400, false, "Số phiếu đã tồn tại");
      }

      if (error.code === "23503") {
        return sendResponse(res, 400, false, "Dữ liệu tham chiếu không hợp lệ");
      }

      if (error.message.includes("malformed array literal")) {
        return sendResponse(
          res,
          400,
          false,
          "Lỗi định dạng danh sách serial number"
        );
      }

      sendResponse(res, 500, false, "Lỗi server", { error: error.message });
    } finally {
      client.release();
      console.log("🔚 Database connection released\n");
    }
  },

  async generateMaTaiSan(client) {
    const year = new Date().getFullYear();
    const result = await client.query(
      "SELECT COUNT(*) + 1 as next_seq FROM tai_san_co_dinh WHERE ma_tai_san LIKE $1",
      [`TSCD${year}%`]
    );
    const seq = result.rows[0].next_seq;
    return `TSCD${year}${seq.toString().padStart(4, "0")}`;
  },

  async createNotification(client, phieu, trangThai, user) {
    try {
      console.log(
        "🔔 Creating notification for phieu:",
        phieu.id,
        "status:",
        trangThai
      );

      let targetUsers = [];
      let notificationType = "";
      let message = "";
      let tieuDe = "Thông báo phiếu nhập";

      if (trangThai === "confirmed") {
        // ✅ Phiếu tự mua/trên cấp được gửi → thông báo Manager + Admin
        notificationType = "phieu_nhap_can_duyet";
        tieuDe = "Phiếu nhập cần duyệt";
        message = `Phiếu nhập ${phieu.so_phieu} từ ${
          user.ho_ten || "User"
        } cần được duyệt`;

        console.log("🔔 Finding managers for phong_ban_id:", user.phong_ban_id);

        // Tìm manager của phòng ban cấp trên
        const managersResult = await client.query(
          `
        SELECT u.id, u.ho_ten FROM users u
        JOIN phong_ban pb ON u.phong_ban_id = pb.id
        WHERE u.role = 'manager' AND pb.id = (
          SELECT phong_ban_cha_id FROM phong_ban WHERE id = $1
        ) AND u.trang_thai = 'active'
      `,
          [user.phong_ban_id]
        );

        // Tìm tất cả admin
        const adminsResult = await client.query(`
        SELECT id, ho_ten FROM users
        WHERE role = 'admin' AND trang_thai = 'active'
      `);

        targetUsers = [
          ...managersResult.rows.map((row) => row.id),
          ...adminsResult.rows.map((row) => row.id),
        ];

        console.log(
          "🔔 Found managers:",
          managersResult.rows.length,
          "admins:",
          adminsResult.rows.length
        );
      } else if (trangThai === "pending_level3_approval") {
        // ✅ Phiếu điều chuyển → thông báo cấp 3 đích
        notificationType = "phieu_nhap_can_duyet";
        tieuDe = "Phiếu điều chuyển cần duyệt";
        message = `Phiếu điều chuyển ${phieu.so_phieu} từ ${
          user.ho_ten || "User"
        } cần bạn duyệt`;

        const targetUsersResult = await client.query(
          `
        SELECT u.id, u.ho_ten FROM users u
        WHERE u.phong_ban_id = $1 AND u.trang_thai = 'active'
      `,
          [phieu.phong_ban_cung_cap_id]
        );

        targetUsers = targetUsersResult.rows.map((row) => row.id);
        console.log("🔔 Found level3 users:", targetUsersResult.rows.length);
      } else if (trangThai === "approved") {
        // ✅ Thông báo cho người tạo khi phiếu được duyệt
        notificationType = "phieu_nhap_duyet";
        tieuDe = "Phiếu nhập đã được duyệt";
        message = `Phiếu nhập ${phieu.so_phieu} của bạn đã được duyệt và có thể thực hiện`;

        targetUsers = [phieu.nguoi_tao];
        console.log("🔔 Notifying creator about approval:", phieu.nguoi_tao);
      } else if (trangThai === "revision_required") {
        // ✅ Thông báo cho người tạo khi cần chỉnh sửa
        notificationType = "phieu_nhap_can_sua";
        tieuDe = "Phiếu nhập cần chỉnh sửa";
        message = `Phiếu nhập ${phieu.so_phieu} của bạn cần chỉnh sửa theo yêu cầu`;

        targetUsers = [phieu.nguoi_tao];
        console.log(
          "🔔 Notifying creator about revision needed:",
          phieu.nguoi_tao
        );
      } else if (trangThai === "completed") {
        // ✅ Thông báo khi phiếu hoàn thành
        notificationType = "phieu_nhap_duyet";
        tieuDe = "Phiếu nhập đã hoàn thành";
        message = `Phiếu nhập ${phieu.so_phieu} đã hoàn thành toàn bộ quy trình`;

        targetUsers = [phieu.nguoi_tao];
        console.log("🔔 Notifying creator about completion:", phieu.nguoi_tao);
      } else {
        console.log("🔔 No notification logic for status:", trangThai);
        return; // Không có logic cho trạng thái này
      }

      // Tạo thông báo cho tất cả target users
      if (targetUsers.length > 0) {
        console.log("🔔 Creating notifications for users:", targetUsers);

        for (const userId of targetUsers) {
          try {
            await client.query(
              `
            INSERT INTO notifications (
              user_id, loai_thong_bao, tieu_de, noi_dung,
              related_id, related_type, url, trang_thai
            ) VALUES ($1, $2, $3, $4, $5, 'phieu_nhap', $6, 'unread')
          `,
              [
                userId,
                notificationType,
                tieuDe,
                message,
                phieu.id,
                `/nhap-kho?tab=${
                  trangThai === "confirmed"
                    ? "cho_duyet"
                    : trangThai === "approved"
                    ? "da_duyet"
                    : trangThai === "revision_required"
                    ? "can_sua"
                    : trangThai === "completed"
                    ? "hoan_thanh"
                    : trangThai === "cancelled"
                    ? "da_huy"
                    : "tat_ca"
                }`,
              ]
            );

            console.log("🔔 Created notification for user:", userId);
          } catch (insertError) {
            console.error(
              "🔔 Error creating notification for user",
              userId,
              ":",
              insertError
            );
          }
        }

        console.log(
          "🔔 Successfully created",
          targetUsers.length,
          "notifications for status:",
          trangThai
        );
      } else {
        console.log("🔔 No target users found for status:", trangThai);
      }
    } catch (error) {
      console.error("🔔 Create notification error:", error);
      // Không throw error để không làm crash main process
    }
  },

  async submit(req, res, params, user) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { id } = params;

      console.log("🔄 Submit phieu nhap - ID:", id, "User:", user.id);

      // Lấy thông tin phiếu và user
      const phieuResult = await client.query(
        `SELECT pn.*, pb.cap_bac, pb.ten_phong_ban, pb.phong_ban_cha_id,
                ncc.ten_ncc, ncc.is_noi_bo,
                u.ho_ten as nguoi_tao_ten, u.phong_ban_id as nguoi_tao_phong_ban_id
         FROM phieu_nhap pn
         LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
         LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
         LEFT JOIN users u ON pn.nguoi_tao = u.id
         WHERE pn.id = $1`,
        [id]
      );

      if (phieuResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
      }

      const phieu = phieuResult.rows[0];

      // Kiểm tra quyền submit - chỉ người tạo
      if (phieu.nguoi_tao !== user.id) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          403,
          false,
          "Chỉ người tạo mới có thể gửi phiếu"
        );
      }

      // Kiểm tra trạng thái có thể submit
      if (!["draft", "revision_required"].includes(phieu.trang_thai)) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          "Phiếu không ở trạng thái có thể gửi"
        );
      }

      // ✅ QUY TRÌNH PHÂN BIỆT THEO LOẠI PHIẾU: Xác định trạng thái tiếp theo
      let trangThaiMoi;
      let message;

      if (phieu.loai_phieu === "dieu_chuyen") {
        // 🔥 ĐIỀU CHUYỂN: Gửi đến Admin/Cấp 2 duyệt trước (workflow 2 bước)
        trangThaiMoi = "confirmed";
        message = "Đã gửi cho Admin/Cấp 2 duyệt điều chuyển";
      } else if (
        phieu.loai_phieu === "tu_mua" ||
        phieu.loai_phieu === "tren_cap"
      ) {
        // 🔥 TỰ MUA/TRÊN CẤP: Gửi confirmed để Admin/Cấp 2 duyệt 1 lần là xong (không có bên cấp 3 nào)
        trangThaiMoi = "confirmed";
        message = "Đã gửi cho Admin/Cấp 2 duyệt (1 lần là xong)";
      } else {
        // Fallback
        trangThaiMoi = "confirmed";
        message = "Đã gửi phiếu để duyệt";
      }

      console.log("✅ Updating status to:", trangThaiMoi);

      // Cập nhật trạng thái
      await client.query(
        `UPDATE phieu_nhap
         SET trang_thai = $1,
             ngay_gui_duyet = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [trangThaiMoi, id]
      );

      // ✅ Tạo thông báo theo logic mới
      await this.createNotificationForSubmit(client, phieu, trangThaiMoi, user);

      await client.query("COMMIT");

      console.log("✅ Submit phieu success - Status:", trangThaiMoi);

      sendResponse(res, 200, true, "Đã gửi phiếu để duyệt", {
        trang_thai: trangThaiMoi,
        message: message,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Submit phieu error:", error);
      sendResponse(res, 500, false, "Lỗi server");
    } finally {
      client.release();
    }
  },

  async createNotificationForSubmit(client, phieu, trangThai, user) {
    try {
      console.log("📧 Creating notification for submit - Status:", trangThai);

      if (trangThai === "confirmed") {
        // ✅ Phiếu tự mua/trên cấp được gửi → thông báo Manager + Admin

        // Tìm manager của phòng ban cấp trên (nếu có)
        const managerQuery = `
          SELECT DISTINCT u.id, u.ho_ten, u.role, pb.ten_phong_ban
          FROM users u
          JOIN phong_ban pb ON u.phong_ban_id = pb.id
          WHERE u.role = 'manager'
            AND u.trang_thai = 'active'
            AND (
              -- Manager của phòng ban cha
              pb.id = (SELECT phong_ban_cha_id FROM phong_ban WHERE id = $1)
              OR
              -- Manager có thể quản lý phòng ban này
              pb.cap_bac = 2
            )
        `;

        const managersResult = await client.query(managerQuery, [
          phieu.phong_ban_id,
        ]);

        // Tìm tất cả admin
        const adminsResult = await client.query(`
          SELECT id, ho_ten, role
          FROM users
          WHERE role = 'admin' AND trang_thai = 'active'
        `);

        console.log(
          "📧 Found managers:",
          managersResult.rows.length,
          "admins:",
          adminsResult.rows.length
        );

        // Tạo danh sách người nhận
        const recipients = [
          ...managersResult.rows.map((u) => u.id),
          ...adminsResult.rows.map((u) => u.id),
        ];

        if (recipients.length > 0) {
          // Sử dụng notificationService để tạo thông báo
          await notificationService.notifyPhieuNhapCanDuyet(
            {
              id: phieu.id,
              so_phieu: phieu.so_phieu,
              loai_phieu: phieu.loai_phieu,
              nguoi_tao: phieu.nguoi_tao_ten || user.ho_ten,
              phong_ban: phieu.ten_phong_ban,
              workflow_type: phieu.workflow_type || "standard",
            },
            recipients
          );

          console.log(
            "✅ Created notifications for",
            recipients.length,
            "users"
          );
        }
      } else if (trangThai === "pending_level3_approval") {
        // ✅ Phiếu điều chuyển → thông báo cấp 3 đích

        const targetUsersResult = await client.query(
          `SELECT u.id, u.ho_ten
           FROM users u
           JOIN phong_ban pb ON u.phong_ban_id = pb.id
           WHERE pb.id = $1 AND u.trang_thai = 'active'`,
          [phieu.phong_ban_cung_cap_id]
        );

        console.log(
          "📧 Found level3 target users:",
          targetUsersResult.rows.length
        );

        if (targetUsersResult.rows.length > 0) {
          const recipients = targetUsersResult.rows.map((u) => u.id);

          await notificationService.notifyPhieuNhapCanDuyet(
            {
              id: phieu.id,
              so_phieu: phieu.so_phieu,
              loai_phieu: phieu.loai_phieu,
              nguoi_tao: phieu.nguoi_tao_ten || user.ho_ten,
              phong_ban: phieu.ten_phong_ban,
              workflow_type: "dieu_chuyen",
            },
            recipients
          );

          console.log(
            "✅ Created level3 notifications for",
            recipients.length,
            "users"
          );
        }
      }
    } catch (error) {
      console.error("❌ Create notification error:", error);
      // Không throw error để không làm crash main process
    }
  },

  // ✅ Manager approve function - tương tự approve nhưng chỉ dành cho manager
  async managerApprove(req, res, params, user) {
    // Gọi method approve với validation role manager
    if (user.role !== "manager") {
      return sendResponse(
        res,
        403,
        false,
        "Chỉ manager mới có quyền duyệt phiếu"
      );
    }

    // Gọi method approve chính
    return await this.approve(req, res, params, user);
  },

  // ✅ FIX: Approve function với notification đúng
  async approve(req, res, params, user) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { id } = params;

      // Kiểm tra quyền duyệt - CHỈ ADMIN VÀ MANAGER
      if (!["admin", "manager"].includes(user.role)) {
        await client.query("ROLLBACK");
        return sendResponse(res, 403, false, "Bạn không có quyền duyệt phiếu");
      }

      // Lấy thông tin phiếu
      const phieuResult = await client.query(
        `SELECT pn.*, pb.cap_bac, pb.ten_phong_ban,
                u.ho_ten as nguoi_tao_ten
         FROM phieu_nhap pn
         LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
         LEFT JOIN users u ON pn.nguoi_tao = u.id
         WHERE pn.id = $1`,
        [id]
      );

      if (phieuResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
      }

      const phieu = phieuResult.rows[0];

      // Kiểm tra trạng thái có thể duyệt
      if (!["confirmed", "pending_approval"].includes(phieu.trang_thai)) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          "Phiếu không ở trạng thái có thể duyệt"
        );
      }

      // ✅ WORKFLOW PHÂN BIỆT THEO LOẠI PHIẾU: Xử lý theo loại phiếu
      if (phieu.loai_phieu === "dieu_chuyen") {
        // 🔥 ĐIỀU CHUYỂN: Admin/Cấp 2 duyệt → Tạo phiếu xuất tự động cho bên kia (workflow 2 bước)
        await this.handleDieuChuyenApproval(client, phieu, user);
      } else if (
        phieu.loai_phieu === "tu_mua" ||
        phieu.loai_phieu === "tren_cap"
      ) {
        // 🔥 TỰ MUA/TRÊN CẤP: Admin/Cấp 2 duyệt 1 lần là xong (không có bên cấp 3 nào)
        await client.query(
          `UPDATE phieu_nhap
           SET trang_thai = 'approved',
               nguoi_duyet_cap1 = $1,
               ngay_duyet_cap1 = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [user.id, id]
        );
      } else {
        // Các loại khác: Duyệt bình thường
        await client.query(
          `UPDATE phieu_nhap
           SET trang_thai = 'approved',
               nguoi_duyet_cap1 = $1,
               ngay_duyet_cap1 = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [user.id, id]
        );
      }

      // 🔗 Đồng bộ phiếu xuất liên kết (nếu có)
      // Chỉ đồng bộ auto-approve PX khi PN thuộc loại KHÔNG phải điều chuyển (điều chuyển cần cấp 3 duyệt)
      if (phieu.loai_phieu !== "dieu_chuyen") {
        const linkRes = await client.query(
          `SELECT phieu_xuat_lien_ket_id FROM phieu_nhap WHERE id = $1`,
          [id]
        );
        const linkedXuatId = linkRes.rows[0]?.phieu_xuat_lien_ket_id;
        if (linkedXuatId) {
          await client.query(
            `UPDATE phieu_xuat SET trang_thai = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND trang_thai IN ('confirmed','pending_level3_approval')`,
            [linkedXuatId]
          );
          // Thông báo cho chủ phiếu xuất
          const owner = await client.query(
            `SELECT nguoi_tao, so_phieu FROM phieu_xuat WHERE id = $1`,
            [linkedXuatId]
          );
          if (owner.rows.length) {
            await client.query(
              `INSERT INTO notifications (nguoi_nhan, loai_thong_bao, tieu_de, noi_dung, phieu_id, url_redirect, trang_thai)
               VALUES ($1, 'phieu_xuat_duyet', $2, $3, $4, '/xuat-kho?tab=da_duyet', 'unread')`,
              [
                owner.rows[0].nguoi_tao,
                "Phiếu xuất đã được duyệt",
                `Phiếu xuất ${owner.rows[0].so_phieu} đã được duyệt theo phiếu nhập liên kết`,
                linkedXuatId,
              ]
            );
          }
        }
      }

      // Thông báo cho người tạo
      await notificationService.notifyPhieuNhapDuyet(
        {
          id: phieu.id,
          so_phieu: phieu.so_phieu,
          nguoi_duyet_cap1: user.ho_ten,
          role_duyet: user.role,
        },
        [phieu.nguoi_tao]
      );

      await client.query("COMMIT");

      console.log("✅ Approved phieu:", id, "by", user.role, user.id);
      sendResponse(
        res,
        200,
        true,
        `Duyệt phiếu thành công (${user.role === "admin" ? "Cấp 1" : "Cấp 2"})`,
        {
          trang_thai: "approved",
        }
      );
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Approve error:", error);
      sendResponse(res, 500, false, "Lỗi server");
    } finally {
      client.release();
    }
  },

  // ✅ Xử lý duyệt phiếu điều chuyển
  async handleDieuChuyenApproval(client, phieu, user) {
    try {
      console.log("🔄 Handling dieu chuyen approval for phieu:", phieu.id);

      // 1. Cập nhật phiếu nhập sang trạng thái chờ cấp 3 duyệt
      await client.query(
        `UPDATE phieu_nhap
         SET trang_thai = 'pending_level3_approval',
             nguoi_duyet_cap1 = $1,
             ngay_duyet_cap1 = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [user.id, phieu.id]
      );

      // 2. Tạo phiếu xuất tự động cho bên kia
      const phieuXuatId = await this.createAutoPhieuXuat(client, phieu);

      // 3. Liên kết 2 phiếu với nhau
      await client.query(
        `UPDATE phieu_nhap 
         SET phieu_xuat_lien_ket_id = $1 
         WHERE id = $2`,
        [phieuXuatId, phieu.id]
      );

      // 4. Gửi thông báo cho cấp 3 bên kia
      await this.notifyLevel3ForDieuChuyen(client, phieu, phieuXuatId);

      console.log("✅ Dieu chuyen approval completed");
    } catch (error) {
      console.error("❌ Handle dieu chuyen approval error:", error);
      throw error;
    }
  },

  // ✅ Tạo phiếu xuất tự động cho điều chuyển
  async createAutoPhieuXuat(client, phieuNhap) {
    try {
      // Lấy chi tiết phiếu nhập
      const chiTietResult = await client.query(
        `SELECT * FROM chi_tiet_nhap WHERE phieu_nhap_id = $1`,
        [phieuNhap.id]
      );

      // Tìm user thuộc phòng ban cung cấp để làm nguoi_tao (tránh trigger permission)
      const userCungCapResult = await client.query(
        `SELECT id FROM users WHERE phong_ban_id = $1 AND trang_thai = 'active' LIMIT 1`,
        [phieuNhap.phong_ban_cung_cap_id]
      );
      const nguoiTaoPhieuXuat =
        userCungCapResult.rows[0]?.id || phieuNhap.nguoi_tao;

      // Tạo phiếu xuất
      console.log("🔍 Debug tạo phiếu xuất tự động:", {
        phong_ban_cung_cap_id: phieuNhap.phong_ban_cung_cap_id,
        phong_ban_id: phieuNhap.phong_ban_id,
        nguoi_tao_original: phieuNhap.nguoi_tao,
        nguoi_tao_phieu_xuat: nguoiTaoPhieuXuat,
        nguoi_duyet_cap1: phieuNhap.nguoi_duyet_cap1,
      });

      const phieuXuatResult = await client.query(
        `INSERT INTO phieu_xuat (
          so_phieu,             -- $1
          ngay_xuat,            -- CURRENT_DATE
          loai_xuat,            -- $2
          phong_ban_id,         -- $3 (Phòng ban xuất)
          phong_ban_nhan_id,    -- $4 (Phòng ban nhận)
          nguoi_tao,            -- $5
          nguoi_duyet_cap1,     -- $6
          ngay_duyet_cap1,      -- CURRENT_TIMESTAMP
          trang_thai,
          tong_tien,            -- $7
          ghi_chu,              -- $8
          is_tu_dong            -- true
        ) VALUES (
          $1, CURRENT_DATE, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP,
          'pending_level3_approval', $7, $8, true
        ) RETURNING id`,
        [
          `PX-AUTO-${phieuNhap.so_phieu}`, // $1: so_phieu
          "don_vi_nhan", // $2: loai_xuat
          phieuNhap.phong_ban_cung_cap_id, // $3: phong_ban_id (Bên cung cấp là bên xuất)
          phieuNhap.phong_ban_id, // $4: phong_ban_nhan_id (Bên yêu cầu là bên nhận)
          nguoiTaoPhieuXuat, // $5: nguoi_tao
          phieuNhap.nguoi_duyet_cap1, // $6: nguoi_duyet_cap1 (Người đã duyệt phiếu nhập)
          phieuNhap.tong_tien, // $7: tong_tien
          `Phiếu xuất tự động từ phiếu nhập ${phieuNhap.so_phieu}`, // $8: ghi_chu
        ]
      );

      const phieuXuatId = phieuXuatResult.rows[0].id;

      // Tạo chi tiết phiếu xuất
      for (const chiTiet of chiTietResult.rows) {
        await client.query(
          `INSERT INTO chi_tiet_xuat (
            phieu_xuat_id, hang_hoa_id, so_luong_yeu_cau, so_luong_thuc_xuat, don_gia, thanh_tien,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
          [
            phieuXuatId,
            chiTiet.hang_hoa_id,
            chiTiet.so_luong_ke_hoach,
            chiTiet.so_luong,
            chiTiet.don_gia,
            chiTiet.thanh_tien,
          ]
        );
      }

      console.log("✅ Created auto phieu xuat:", phieuXuatId);
      return phieuXuatId;
    } catch (error) {
      console.error("❌ Create auto phieu xuat error:", error);
      throw error;
    }
  },

  // ✅ Thông báo cho cấp 3 bên kia về phiếu xuất
  async notifyLevel3ForDieuChuyen(client, phieuNhap, phieuXuatId) {
    try {
      // Lấy danh sách user cấp 3 của phòng ban cung cấp
      const usersResult = await client.query(
        `SELECT u.id, u.ho_ten
         FROM users u
         JOIN phong_ban pb ON u.phong_ban_id = pb.id
         WHERE pb.id = $1 AND u.trang_thai = 'active'`,
        [phieuNhap.phong_ban_cung_cap_id]
      );

      if (usersResult.rows.length > 0) {
        const recipients = usersResult.rows.map((u) => u.id);

        await notificationService.notifyPhieuXuatCanDuyet(
          {
            id: phieuXuatId,
            so_phieu: `PX-${Date.now()}`,
            loai_xuat: "don_vi_nhan",
            don_vi_nhan: { ten: phieuNhap.ten_phong_ban },
            phong_ban: { ten_phong_ban: phieuNhap.ten_phong_ban },
            workflow_type: "dieu_chuyen",
            is_tu_dong: true,
          },
          recipients
        );

        console.log(
          "✅ Notified level3 users for dieu chuyen:",
          recipients.length
        );
      }
    } catch (error) {
      console.error("❌ Notify level3 for dieu chuyen error:", error);
      // Không throw error để không làm crash main process
    }
  },

  //   // ✅ Level3 approve cho điều chuyển
  async level3Approve(req, res, params, user) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { id } = params;

      // Kiểm tra quyền - CHỈ USER CẤP 3
      if (
        user.role !== "user" ||
        !user.phong_ban ||
        user.phong_ban.cap_bac !== 3
      ) {
        await client.query("ROLLBACK");
        return sendResponse(res, 403, false, "Chỉ được duyệt phiếu cho cấp 3");
      }

      // Lấy thông tin phiếu
      const phieuResult = await client.query(
        `SELECT pn.*, pb.cap_bac, pb.ten_phong_ban,
                u.ho_ten as nguoi_tao_ten
         FROM phieu_nhap pn
         LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
         LEFT JOIN users u ON pn.nguoi_tao = u.id
         WHERE pn.id = $1`,
        [id]
      );

      if (phieuResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
      }

      const phieu = phieuResult.rows[0];

      // Kiểm tra trạng thái và quyền duyệt
      if (phieu.trang_thai !== "pending_level3_approval") {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          "Phiếu không ở trạng thái chờ cấp 3 duyệt"
        );
      }

      // Kiểm tra phòng ban có quyền duyệt không
      // User cấp 3 duyệt phiếu nhập của chính phòng ban mình (phong_ban_id)
      if (phieu.phong_ban_id !== user.phong_ban_id) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          403,
          false,
          "Bạn không có quyền duyệt phiếu điều chuyển này"
        );
      }

      // ✅ CẤP 3 DUYỆT ĐIỀU CHUYỂN - ĐỒNG BỘ CẢ 2 PHIẾU
      await this.handleLevel3DieuChuyenApproval(client, phieu, user);

      // Thông báo cho người tạo
      const nguoiTaoId = parseInt(phieu.nguoi_tao);

      if (!isNaN(nguoiTaoId)) {
        await notificationService.notifyPhieuNhapDuyet(
          {
            id: parseInt(phieu.id),
            so_phieu: phieu.so_phieu,
            nguoi_duyet_cap1: user.ho_ten,
            role_duyet: "level3_approve",
          },
          nguoiTaoId // ← SỬA: single integer
        );
      }
      await client.query("COMMIT");

      console.log("✅ Level3 approved phieu:", id, "by user:", user.id);
      sendResponse(res, 200, true, "Cấp 3 duyệt điều chuyển thành công", {
        trang_thai: "approved",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Level3 approve error:", error);
      sendResponse(res, 500, false, "Lỗi server");
    } finally {
      client.release();
    }
  },

  // ✅ Xử lý duyệt cấp 3 cho điều chuyển - đồng bộ cả 2 phiếu
  async handleLevel3DieuChuyenApproval(client, phieu, user) {
    try {
      console.log(
        "🔄 Handling level3 dieu chuyen approval for phieu:",
        phieu.id
      );

      // 1. Cập nhật phiếu nhập sang approved
      await client.query(
        `UPDATE phieu_nhap
         SET trang_thai = 'approved',
             nguoi_duyet_cap1 = $1,
             ngay_duyet_cap1 = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [user.id, phieu.id]
      );

      // 2. Cập nhật phiếu xuất liên kết sang approved
      if (phieu.phieu_xuat_lien_ket_id) {
        await client.query(
          `UPDATE phieu_xuat
           SET trang_thai = 'approved',
               nguoi_duyet_cap1 = $1,
               ngay_duyet_cap1 = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [user.id, phieu.phieu_xuat_lien_ket_id]
        );

        // Thông báo cho người tạo phiếu xuất
        const ownerResult = await client.query(
          `SELECT nguoi_tao, so_phieu FROM phieu_xuat WHERE id = $1`,
          [phieu.phieu_xuat_lien_ket_id]
        );

        if (ownerResult.rows.length > 0) {
          await client.query(
            `INSERT INTO notifications (nguoi_nhan, loai_thong_bao, tieu_de, noi_dung, phieu_id, url_redirect, trang_thai)
             VALUES ($1, 'phieu_xuat_duyet', $2, $3, $4, '/xuat-kho?tab=da_duyet', 'unread')`,
            [
              ownerResult.rows[0].nguoi_tao,
              "Phiếu xuất đã được duyệt",
              `Phiếu xuất ${ownerResult.rows[0].so_phieu} đã được duyệt đồng bộ với phiếu nhập`,
              phieu.phieu_xuat_lien_ket_id,
            ]
          );
        }
      }

      console.log(
        "✅ Level3 dieu chuyen approval completed - both phieus approved"
      );
    } catch (error) {
      console.error("❌ Handle level3 dieu chuyen approval error:", error);
      throw error;
    }
  },

  //   // ✅ Request revision function
  async requestRevision(req, res, params, body, user) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { id } = params;
      const { ghi_chu_phan_hoi } = body;

      if (!ghi_chu_phan_hoi || !ghi_chu_phan_hoi.trim()) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          "Vui lòng nhập lý do yêu cầu chỉnh sửa"
        );
      }

      // Kiểm tra quyền - CHỈ ADMIN VÀ MANAGER
      if (!["admin", "manager"].includes(user.role)) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          403,
          false,
          "Bạn không có quyền yêu cầu chỉnh sửa"
        );
      }

      // Lấy thông tin phiếu
      const phieuResult = await client.query(
        `SELECT pn.*, u.ho_ten as nguoi_tao_ten
         FROM phieu_nhap pn
         LEFT JOIN users u ON pn.nguoi_tao = u.id
         WHERE pn.id = $1`,
        [id]
      );

      if (phieuResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
      }

      const phieu = phieuResult.rows[0];

      // Kiểm tra trạng thái có thể yêu cầu sửa
      if (
        !["confirmed", "pending_approval", "pending_level3_approval"].includes(
          phieu.trang_thai
        )
      ) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          "Phiếu không thể yêu cầu sửa ở trạng thái hiện tại"
        );
      }

      // ✅ WORKFLOW PHÂN BIỆT THEO LOẠI PHIẾU: Xử lý yêu cầu sửa
      if (phieu.loai_phieu === "dieu_chuyen") {
        // 🔥 ĐIỀU CHUYỂN: Đồng bộ cả 2 phiếu khi yêu cầu sửa
        await this.handleDieuChuyenRevision(
          client,
          phieu,
          user,
          ghi_chu_phan_hoi.trim()
        );
      } else {
        // 🔥 TỰ MUA/TRÊN CẤP: Chỉ cập nhật phiếu nhập (không có phiếu liên kết)
        await client.query(
          `UPDATE phieu_nhap
           SET trang_thai = 'revision_required',
               ghi_chu_phan_hoi = $1,
               nguoi_phan_hoi = $2,
               ngay_phan_hoi = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [ghi_chu_phan_hoi.trim(), user.id, phieu.id]
        );
      }

      const nguoiTaoId = parseInt(phieu.nguoi_tao);

      if (isNaN(nguoiTaoId)) {
        console.error(`Invalid nguoi_tao: ${phieu.nguoi_tao}`);
        await client.query("ROLLBACK");
        return sendResponse(res, 500, false, "Lỗi dữ liệu người tạo phiếu");
      }

      await notificationService.notifyPhieuNhapCanSua(
        {
          id: parseInt(phieu.id), // ← THÊM: convert id cũng luôn
          so_phieu: phieu.so_phieu,
          ghi_chu: ghi_chu_phan_hoi.trim(),
          nguoi_phan_hoi: user.ho_ten,
        },
        nguoiTaoId, // ← SỬA: truyền integer, không phải array
        ghi_chu_phan_hoi.trim()
      );

      await client.query("COMMIT");
      sendResponse(res, 200, true, "Yêu cầu chỉnh sửa thành công");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Request revision error:", error);
      sendResponse(res, 500, false, "Lỗi server");
    } finally {
      client.release();
    }
  },

  // ✅ Xử lý yêu cầu sửa cho điều chuyển - đồng bộ cả 2 phiếu
  async handleDieuChuyenRevision(client, phieu, user, ghiChu) {
    try {
      console.log("🔄 Handling dieu chuyen revision for phieu:", phieu.id);

      // 1. Cập nhật phiếu nhập sang revision_required
      await client.query(
        `UPDATE phieu_nhap
         SET trang_thai = 'revision_required',
             ghi_chu_phan_hoi = $1,
             nguoi_phan_hoi = $2,
             ngay_phan_hoi = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [ghiChu, user.id, phieu.id]
      );

      // 2. Cập nhật phiếu xuất liên kết sang revision_required
      if (phieu.phieu_xuat_lien_ket_id) {
        await client.query(
          `UPDATE phieu_xuat
           SET trang_thai = 'revision_required',
               ghi_chu_phan_hoi = $1,
               nguoi_phan_hoi = $2,
               ngay_phan_hoi = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [ghiChu, user.id, phieu.phieu_xuat_lien_ket_id]
        );

        // Thông báo cho người tạo phiếu xuất
        const ownerResult = await client.query(
          `SELECT nguoi_tao, so_phieu FROM phieu_xuat WHERE id = $1`,
          [phieu.phieu_xuat_lien_ket_id]
        );

        if (ownerResult.rows.length > 0) {
          await client.query(
            `INSERT INTO notifications (nguoi_nhan, loai_thong_bao, tieu_de, noi_dung, phieu_id, url_redirect, trang_thai)
             VALUES ($1, 'phieu_xuat_can_sua', $2, $3, $4, '/xuat-kho?tab=can_sua', 'unread')`,
            [
              ownerResult.rows[0].nguoi_tao,
              "Phiếu xuất cần chỉnh sửa",
              `Phiếu xuất ${ownerResult.rows[0].so_phieu} cần chỉnh sửa theo yêu cầu từ bên nhận: ${ghiChu}`,
              phieu.phieu_xuat_lien_ket_id,
            ]
          );
        }
      }

      console.log(
        "✅ Dieu chuyen revision completed - both phieus marked for revision"
      );
    } catch (error) {
      console.error("❌ Handle dieu chuyen revision error:", error);
      throw error;
    }
  },

  //   // ✅ Cancel function
  async cancel(req, res, params, user) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { id } = params;

      const phieuResult = await client.query(
        `SELECT pn.*, u.ho_ten as nguoi_tao_ten
         FROM phieu_nhap pn
         LEFT JOIN users u ON pn.nguoi_tao = u.id
         WHERE pn.id = $1`,
        [id]
      );

      if (phieuResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
      }

      const phieu = phieuResult.rows[0];

      // Kiểm tra quyền hủy
      const isOwner = phieu.nguoi_tao === user.id;
      const isAdmin = user.role === "admin";

      if (!isOwner && !isAdmin) {
        await client.query("ROLLBACK");
        return sendResponse(res, 403, false, "Không có quyền hủy phiếu này");
      }

      // Kiểm tra trạng thái có thể hủy
      if (
        ![
          "draft",
          "confirmed",
          "pending_approval",
          "revision_required",
        ].includes(phieu.trang_thai)
      ) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          "Không thể hủy phiếu ở trạng thái hiện tại"
        );
      }

      // Cập nhật trạng thái cancelled
      await client.query(
        `UPDATE phieu_nhap
         SET trang_thai = 'cancelled',
             ly_do_huy = $1,
             nguoi_huy = $2,
             ngay_huy = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [`Hủy bởi ${user.ho_ten}`, user.id, id]
      );

      await client.query("COMMIT");

      console.log("✅ Cancelled phieu:", id, "by user:", user.id);
      sendResponse(res, 200, true, "Hủy phiếu thành công");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Cancel error:", error);
      sendResponse(res, 500, false, "Lỗi server");
    } finally {
      client.release();
    }
  },

  async getList(req, res, query, user) {
    const client = await pool.connect();
    try {
      const {
        page = 1,
        limit = 20,
        trang_thai,
        loai_phieu,
        phong_ban_filter,
        search,
        tu_ngay,
        den_ngay,
        sort = "created_at",
        order = "desc",
      } = query;

      // ✅ FIX: Xử lý cả trang_thai và trang_thai[] parameters
      let statusFilter = trang_thai || query["trang_thai[]"];

      console.log("🔍 DEBUG statusFilter:", {
        trang_thai,
        "trang_thai[]": query["trang_thai[]"],
        statusFilter,
        type: typeof statusFilter,
        isArray: Array.isArray(statusFilter),
        rawQuery: query,
      });

      // Nếu là string có dấu phẩy, split thành array
      if (typeof statusFilter === "string" && statusFilter.includes(",")) {
        statusFilter = statusFilter
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        console.log("🔍 After split:", statusFilter);
      }

      // ✅ FIX: Đảm bảo statusFilter luôn là array nếu có nhiều giá trị
      if (statusFilter && !Array.isArray(statusFilter)) {
        statusFilter = [statusFilter];
      }

      const validatedPage = Math.max(1, parseInt(page) || 1);
      const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
      const offset = (validatedPage - 1) * validatedLimit;

      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      // ✅ FIX: LUÔN LUÔN áp dụng role-based filter TRƯỚC, bất kể có filter trạng thái hay không
      console.log("🔍 DEBUG role-based filter:", {
        userRole: user.role,
        phongBanId: user.phong_ban_id,
        capBac: user.phong_ban?.cap_bac,
        statusFilter,
      });

      if (user.role === "user" && user.phong_ban?.cap_bac === 3) {
        // User cấp 3: CHỈ xem PN của phòng ban mình, mọi tab
        console.log("🔍 User cấp 3 filter - phong_ban_id:", user.phong_ban_id);
        if (!user.phong_ban_id) {
          console.error("❌ User cấp 3 không có phong_ban_id!");
          return sendResponse(
            res,
            400,
            false,
            "Thông tin phòng ban không hợp lệ"
          );
        }
        whereConditions.push(`pn.phong_ban_id = $${paramIndex++}`);
        queryParams.push(user.phong_ban_id);
      } else if (user.role === "manager") {
        // ✅ FIX: Manager KHÔNG BAO GIỜ thấy draft, kể cả khi filter theo trạng thái
        // NHƯNG chỉ áp dụng khi KHÔNG có status filter cụ thể
        if (!statusFilter || !statusFilter.includes("draft")) {
          whereConditions.push(`pn.trang_thai != 'draft'`);
        }

        // Áp dụng filter phòng ban cho manager
        if (
          phong_ban_filter &&
          phong_ban_filter !== "all" &&
          phong_ban_filter !== "own"
        ) {
          const phongBanId = parseInt(phong_ban_filter);
          if (!isNaN(phongBanId)) {
            whereConditions.push(`pn.phong_ban_id = $${paramIndex++}`);
            queryParams.push(phongBanId);
          }
        } else {
          // ✅ FIX: Manager thấy phiếu của các phòng ban cấp 3 thuộc quyền
          // NHƯNG nếu có status filter cụ thể (như tab "Chờ duyệt"),
          // thì cho phép xem tất cả phiếu có trạng thái đó
          if (
            statusFilter &&
            Array.isArray(statusFilter) &&
            (statusFilter.includes("confirmed") ||
              statusFilter.includes("pending_level3_approval"))
          ) {
            // Tab "Chờ duyệt" - cho phép xem tất cả phiếu confirmed/pending_level3_approval
            console.log(
              "🔍 Manager - Tab Chờ duyệt: cho phép xem tất cả phiếu confirmed/pending_level3_approval",
              "statusFilter:",
              statusFilter,
              "includes confirmed:",
              statusFilter.includes("confirmed"),
              "includes pending_level3_approval:",
              statusFilter.includes("pending_level3_approval")
            );
            // Không thêm điều kiện phòng ban - cho phép xem tất cả
          } else {
            // Các tab khác - chỉ xem phiếu của phòng ban cấp 3 thuộc quyền
            console.log(
              "🔍 Manager filter - phong_ban_id:",
              user.phong_ban_id,
              "cap_bac:",
              user.phong_ban?.cap_bac
            );

            // Debug: Kiểm tra cấu trúc phòng ban
            const debugQuery = `
              SELECT pb.id, pb.ten_phong_ban, pb.cap_bac, pb.phong_ban_cha_id
              FROM phong_ban pb
              WHERE pb.phong_ban_cha_id = $1 AND pb.cap_bac = 3
            `;
            const debugResult = await pool.query(debugQuery, [
              user.phong_ban_id,
            ]);
            console.log(
              "🔍 Manager's subordinate departments:",
              debugResult.rows
            );

            whereConditions.push(`
            pn.phong_ban_id IN (
              SELECT pb.id FROM phong_ban pb
              WHERE pb.phong_ban_cha_id = $${paramIndex++}
              AND pb.cap_bac = 3
            )
          `);
            queryParams.push(user.phong_ban_id);
          }
        }
      } else if (user.role === "admin") {
        // ✅ FIX: Admin KHÔNG thấy draft của người khác, kể cả khi filter theo trạng thái
        // NHƯNG nếu có status filter cụ thể (như tab "Chờ duyệt"),
        // thì cho phép xem tất cả phiếu có trạng thái đó
        if (
          statusFilter &&
          Array.isArray(statusFilter) &&
          (statusFilter.includes("confirmed") ||
            statusFilter.includes("pending_level3_approval"))
        ) {
          // Tab "Chờ duyệt" - cho phép xem tất cả phiếu confirmed/pending_level3_approval
          console.log(
            "🔍 Admin - Tab Chờ duyệt: cho phép xem tất cả phiếu confirmed/pending_level3_approval",
            "statusFilter:",
            statusFilter,
            "includes confirmed:",
            statusFilter.includes("confirmed"),
            "includes pending_level3_approval:",
            statusFilter.includes("pending_level3_approval")
          );
          // Không thêm điều kiện draft - cho phép xem tất cả
        } else {
          // Các tab khác - chỉ xem draft của mình
          whereConditions.push(`
          (pn.trang_thai != 'draft' OR pn.nguoi_tao = $${paramIndex++})
        `);
          queryParams.push(user.id);
        }

        // Áp dụng filter phòng ban cho admin
        if (
          phong_ban_filter &&
          phong_ban_filter !== "all" &&
          phong_ban_filter !== "own"
        ) {
          const phongBanId = parseInt(phong_ban_filter);
          if (!isNaN(phongBanId)) {
            whereConditions.push(`pn.phong_ban_id = $${paramIndex++}`);
            queryParams.push(phongBanId);
          }
        } else if (phong_ban_filter === "own") {
          whereConditions.push(`pn.phong_ban_id = $${paramIndex++}`);
          queryParams.push(user.phong_ban_id);
        }
      }

      // ✅ Áp dụng filter search
      if (search && search.trim()) {
        whereConditions.push(`
        (pn.so_phieu ILIKE $${paramIndex++} OR
         pn.so_quyet_dinh ILIKE $${paramIndex} OR
         COALESCE(ncc.ten_ncc, '') ILIKE $${paramIndex} OR
         COALESCE(pb_cc.ten_phong_ban, '') ILIKE $${paramIndex})
      `);
        const searchPattern = `%${search.trim()}%`;
        queryParams.push(
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern
        );
        paramIndex++;
      }

      // ✅ Áp dụng filter trạng thái (LUÔN đặt CUỐI để không ảnh hưởng role-based filter)
      if (statusFilter) {
        console.log("🔍 DEBUG - Applying status filter:", {
          statusFilter,
          isArray: Array.isArray(statusFilter),
          paramIndex,
        });

        if (Array.isArray(statusFilter)) {
          const placeholders = statusFilter
            .map(() => `$${paramIndex++}`)
            .join(",");
          whereConditions.push(`pn.trang_thai IN (${placeholders})`);
          queryParams.push(...statusFilter);
          console.log(
            "🔍 DEBUG - Added IN condition:",
            `pn.trang_thai IN (${placeholders})`
          );
        } else {
          whereConditions.push(`pn.trang_thai = $${paramIndex++}`);
          queryParams.push(statusFilter);
          console.log(
            "🔍 DEBUG - Added = condition:",
            `pn.trang_thai = $${paramIndex - 1}`
          );
        }
      } else {
        console.log("🔍 DEBUG - No status filter applied");
      }

      // Các filter khác
      if (loai_phieu) {
        whereConditions.push(`pn.loai_phieu = $${paramIndex++}`);
        queryParams.push(loai_phieu);
      }

      if (tu_ngay && den_ngay) {
        whereConditions.push(
          `pn.ngay_nhap BETWEEN $${paramIndex++} AND $${paramIndex++}`
        );
        queryParams.push(tu_ngay, den_ngay);
      }

      // Build query
      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      console.log("🔍 DEBUG Final query conditions:", {
        whereConditions,
        queryParams,
        whereClause,
        user: {
          role: user.role,
          phong_ban_id: user.phong_ban_id,
          cap_bac: user.phong_ban?.cap_bac,
        },
      });

      // Debug: Kiểm tra có phiếu confirmed nào trong database không
      const debugConfirmedQuery = `
        SELECT pn.id, pn.so_phieu, pn.trang_thai, pn.phong_ban_id, pb.ten_phong_ban, pb.cap_bac
        FROM phieu_nhap pn
        LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
        WHERE pn.trang_thai = 'confirmed'
        ORDER BY pn.created_at DESC
        LIMIT 5
      `;
      const debugConfirmedResult = await pool.query(debugConfirmedQuery);
      console.log(
        "🔍 DEBUG - Phiếu confirmed trong DB:",
        debugConfirmedResult.rows
      );

      const validSortColumns = {
        so_phieu: "pn.so_phieu",
        ngay_nhap: "pn.ngay_nhap",
        tong_tien: "pn.tong_tien",
        created_at: "pn.created_at",
        updated_at: "pn.updated_at",
      };

      const sortColumn = validSortColumns[sort] || "pn.created_at";
      const sortDirection = order.toLowerCase() === "asc" ? "ASC" : "DESC";

      const dataQuery = `
      SELECT
        pn.*,
        COALESCE(ncc.ten_ncc, pb_cc.ten_phong_ban) as ten_ncc,
        ncc.ma_ncc,
        ncc.dia_chi as ncc_dia_chi,
        ncc.is_noi_bo,
        pb.id as phong_ban_id,
        pb.ten_phong_ban,
        pb.cap_bac,
        pb_cc.ten_phong_ban as ten_phong_ban_cung_cap,
        nt.ho_ten as nguoi_tao_ten,
        nd1.ho_ten as nguoi_duyet_cap1_ten
      FROM phieu_nhap pn
      LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
      LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
      LEFT JOIN phong_ban pb_cc ON pn.phong_ban_cung_cap_id = pb_cc.id
      LEFT JOIN users nt ON pn.nguoi_tao = nt.id
      LEFT JOIN users nd1 ON pn.nguoi_duyet_cap1 = nd1.id

      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

      queryParams.push(validatedLimit, offset);

      const countQuery = `
      SELECT COUNT(*) as total
      FROM phieu_nhap pn
      LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
      LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
      LEFT JOIN phong_ban pb_cc ON pn.phong_ban_cung_cap_id = pb_cc.id
      ${whereClause}
    `;

      console.log("🔍 DEBUG - Final data query:", dataQuery);
      console.log("🔍 DEBUG - Final query params:", queryParams);
      console.log("🔍 DEBUG - Where clause:", whereClause);

      const [dataResult, countResult] = await Promise.all([
        client.query(dataQuery, queryParams),
        client.query(countQuery, queryParams.slice(0, -2)),
      ]);

      console.log("🔍 DEBUG - Query results:", {
        dataCount: dataResult.rows.length,
        totalCount: countResult.rows[0]?.total || 0,
        firstFewRows: dataResult.rows.slice(0, 3).map((row) => ({
          id: row.id,
          so_phieu: row.so_phieu,
          trang_thai: row.trang_thai,
          phong_ban_id: row.phong_ban_id,
        })),
      });

      const total = parseInt(countResult.rows[0]?.total || 0);
      const pages = Math.ceil(total / validatedLimit);

      const structuredData = dataResult.rows.map((row) => ({
        id: row.id,
        so_phieu: row.so_phieu,
        ngay_nhap: row.ngay_nhap,
        loai_phieu: row.loai_phieu,
        trang_thai: row.trang_thai,
        tong_tien: parseFloat(row.tong_tien || 0),
        so_quyet_dinh: row.so_quyet_dinh,
        so_hoa_don: row.so_hoa_don,
        nguoi_nhap_hang: row.nguoi_nhap_hang,
        ly_do_nhap: row.ly_do_nhap,
        dia_chi_nhap: row.dia_chi_nhap,
        ghi_chu: row.ghi_chu,
        ghi_chu_phan_hoi: row.ghi_chu_phan_hoi,
        workflow_type: row.workflow_type,
        decision_pdf_url: row.decision_pdf_url,
        nguoi_tao: row.nguoi_tao,
        created_at: row.created_at,
        updated_at: row.updated_at,

        phong_ban: row.phong_ban_id
          ? {
              id: row.phong_ban_id,
              ten_phong_ban: row.ten_phong_ban,
              cap_bac: row.cap_bac,
            }
          : null,
        ten_phong_ban: row.ten_phong_ban, // ✅ FIX: Thêm field này để frontend có thể dùng

        nha_cung_cap:
          row.nha_cung_cap_id || row.phong_ban_cung_cap_id
            ? {
                id: row.nha_cung_cap_id || row.phong_ban_cung_cap_id,
                ten_ncc: row.ten_ncc,
                ma_ncc: row.ma_ncc,
                dia_chi: row.ncc_dia_chi,
                is_noi_bo: row.is_noi_bo,
              }
            : null,

        nguoi_tao_info: {
          id: row.nguoi_tao,
          ho_ten: row.nguoi_tao_ten,
        },
        nguoi_tao_ten: row.nguoi_tao_ten, // ✅ FIX: Thêm field này để frontend có thể dùng
      }));

      sendResponse(res, 200, true, "Lấy danh sách thành công", {
        items: structuredData,
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          total,
          pages,
        },
      });
    } catch (error) {
      console.error("❌ Get list error:", error);
      sendResponse(res, 500, false, "Lỗi server");
    } finally {
      client.release();
    }
  },

  async uploadDecision(req, res, params, user) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { id } = params;
      const { ghi_chu_hoan_thanh } = req.body || {}; // Safe access

      if (!req.file) {
        await client.query("ROLLBACK");
        return sendResponse(res, 400, false, "Vui lòng chọn file PDF");
      }

      const phieuResult = await client.query(
        "SELECT * FROM phieu_nhap WHERE id = $1",
        [id]
      );

      if (phieuResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
      }

      const phieu = phieuResult.rows[0];

      // 🔥 FIX: Kiểm tra quyền upload - CHỦ SỞ HỮU CŨNG CÓ THỂ UPLOAD
      const isAdmin = user.role === "admin";
      const isManager = user.role === "manager";
      const isOwner = phieu.nguoi_tao === user.id;

      if (!(isAdmin || isManager || isOwner)) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          403,
          false,
          "Không có quyền upload quyết định"
        );
      }

      if (phieu.trang_thai !== "approved") {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          "Chỉ có thể upload quyết định cho phiếu đã duyệt"
        );
      }

      // Cập nhật đường dẫn file
      const fileName = `decision_${id}_${Date.now()}.pdf`;
      const filePath = `/uploads/decisions/${fileName}`;

      await client.query(
        `UPDATE phieu_nhap SET
        decision_pdf_url = $1,
        ghi_chu_hoan_thanh = $2,
        nguoi_upload_quyet_dinh = $3,
        ngay_upload_quyet_dinh = CURRENT_TIMESTAMP
      WHERE id = $4`,
        [filePath, ghi_chu_hoan_thanh || "", user.id, id]
      );

      await client.query("COMMIT");

      console.log(
        "✅ Upload decision success for phieu:",
        id,
        "by user:",
        user.id
      );
      sendResponse(res, 200, true, "Upload quyết định thành công", {
        file_url: filePath,
        filename: fileName,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Upload decision error:", error);
      sendResponse(res, 500, false, "Lỗi server");
    } finally {
      client.release();
    }
  },

  //   // Trong nhapKhoController.js - complete function
  async complete(req, res, params, user) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { id } = params;

      // 🔥 FIX: Handle req.body safely - có thể undefined
      const body = req.body || {};
      const { nguoi_giao_hang, nguoi_nhap_hang, ghi_chu_hoan_thanh } = body;

      // Lấy thông tin phiếu
      const phieuResult = await client.query(
        "SELECT * FROM phieu_nhap WHERE id = $1",
        [id]
      );

      if (phieuResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
      }

      const phieu = phieuResult.rows[0];

      // 🔥 FIX: Kiểm tra quyền complete - CHỦ SỞ HỮU CŨNG CÓ THỂ HOÀN THÀNH
      const isAdmin = user.role === "admin";
      const isManager = user.role === "manager";
      const isOwner = phieu.nguoi_tao === user.id;

      if (!(isAdmin || isManager || isOwner)) {
        await client.query("ROLLBACK");
        return sendResponse(res, 403, false, "Không có quyền hoàn thành phiếu");
      }

      // Kiểm tra trạng thái phiếu
      if (phieu.trang_thai !== "approved") {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          "Chỉ có thể hoàn thành phiếu đã được duyệt"
        );
      }

      // 🔥 FIX: Validation thông tin hoàn thành - CHỈ YÊU CẦU KHI CÓ DATA
      if (nguoi_giao_hang !== undefined || nguoi_nhap_hang !== undefined) {
        if (!nguoi_giao_hang || !nguoi_giao_hang.trim()) {
          await client.query("ROLLBACK");
          return sendResponse(
            res,
            400,
            false,
            "Vui lòng nhập thông tin người giao hàng"
          );
        }

        if (!nguoi_nhap_hang || !nguoi_nhap_hang.trim()) {
          await client.query("ROLLBACK");
          return sendResponse(
            res,
            400,
            false,
            "Vui lòng nhập thông tin người nhập hàng"
          );
        }
      }

      // Cập nhật trạng thái và thông tin hoàn thành
      await client.query(
        `UPDATE phieu_nhap SET
        trang_thai = 'completed',
        nguoi_giao_hang = COALESCE($1, nguoi_giao_hang),
        nguoi_nhap_hang = COALESCE($2, nguoi_nhap_hang),
        ghi_chu_hoan_thanh = COALESCE($3, ghi_chu_hoan_thanh),
        ngay_hoan_thanh = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4`,
        [
          nguoi_giao_hang || null,
          nguoi_nhap_hang || null,
          ghi_chu_hoan_thanh || null,
          id,
        ]
      );

      // 🔥 TODO: Cập nhật tồn kho - logic này phụ thuộc vào business rules
      // await updateTonKhoFromPhieuNhap(id, client);

      // 🔥 TODO: Gửi thông báo hoàn thành
      // await notificationService.notifyPhieuNhapComplete(id, user);

      // 🔗 CẬP NHẬT PHIẾU XUẤT LIÊN KẾT (nếu có) → Hoàn thành đồng bộ
      if (phieu.phieu_xuat_lien_ket_id) {
        console.log(
          "🔗 Completing linked phieu xuat:",
          phieu.phieu_xuat_lien_ket_id
        );
        await client.query(
          `UPDATE phieu_xuat 
           SET trang_thai = 'completed', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1 AND trang_thai IN ('approved')`,
          [phieu.phieu_xuat_lien_ket_id]
        );
      }

      await client.query("COMMIT");

      console.log("✅ Completed phieu nhap:", id, "by user:", user.id);
      sendResponse(res, 200, true, "Hoàn thành phiếu nhập thành công", {
        phieu_id: id,

        ngay_hoan_thanh: new Date().toISOString(),
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Complete error:", error);
      sendResponse(res, 500, false, "Lỗi server", {
        error_detail: error.message,
      });
    } finally {
      client.release();
    }
  },

  async getPhongBanCungCap(req, res, query, user) {
    try {
      console.log("🏢 Getting phong ban cung cap for user:", user.role);

      const client = await pool.connect();

      let queryStr = `
      SELECT
        pb.id,
        pb.ma_phong_ban,
        pb.ten_phong_ban,
        pb.cap_bac,
        pb.thu_tu_hien_thi
      FROM phong_ban pb
      WHERE pb.is_active = true
    `;

      const params = [];

      // Logic phân quyền xem phòng ban
      if (user.role === "level3") {
        // Cấp 3: chỉ thấy phòng ban cùng cấp (để điều chuyển)
        queryStr += `
        AND pb.cap_bac = 3 
        AND pb.id != $1
        AND pb.phong_ban_cha_id = (
          SELECT phong_ban_cha_id FROM phong_ban WHERE id = $1
        )
      `;
        params.push(user.phong_ban_id);
      } else if (user.role === "manager") {
        // Manager: xem cấp dưới và cùng cấp
        queryStr += `
        AND (
          pb.phong_ban_cha_id = $1 OR
          (pb.cap_bac = 2 AND pb.id != $1)
        )
      `;
        params.push(user.phong_ban_id);
      }
      // Admin xem tất cả

      queryStr += ` ORDER BY pb.cap_bac, pb.thu_tu_hien_thi, pb.ten_phong_ban`;

      const result = await client.query(queryStr, params);
      client.release();

      sendResponse(res, 200, true, "Lấy danh sách thành công", {
        data: result.rows,
      });
    } catch (error) {
      console.error("❌ Get phong ban cung cap error:", error);
      sendResponse(res, 500, false, "Lỗi server");
    }
  },

  async update(req, res, params, body, user) {
    const client = await pool.connect();
    const { id } = params;

    try {
      await client.query("BEGIN");

      console.log("Đang cập nhật phiếu nhập:", id);

      // Kiểm tra phiếu tồn tại và quyền chỉnh sửa
      const checkResult = await client.query(
        "SELECT * FROM phieu_nhap WHERE id = $1",
        [id]
      );

      if (checkResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
      }

      const phieu = checkResult.rows[0];

      if (user.role !== "admin" && phieu.phong_ban_id !== user.phong_ban_id) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          403,
          false,
          "Bạn không có quyền sửa phiếu này"
        );
      }

      // Kiểm tra trạng thái phiếu có thể chỉnh sửa
      if (!["draft", "revision_required"].includes(phieu.trang_thai)) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          "Phiếu không ở trạng thái có thể chỉnh sửa"
        );
      }

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
        phong_ban_cung_cap_id,
        chi_tiet = [],
      } = body;

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

      // Validation logic theo nghiệp vụ
      if (loai_phieu === "tu_mua" || loai_phieu === "tren_cap") {
        if (!nha_cung_cap_id) {
          await client.query("ROLLBACK");
          return sendResponse(res, 400, false, "Vui lòng chọn nhà cung cấp");
        }
      } else if (loai_phieu === "dieu_chuyen") {
        if (!phong_ban_cung_cap_id) {
          await client.query("ROLLBACK");
          return sendResponse(
            res,
            400,
            false,
            "Vui lòng chọn phòng ban cung cấp"
          );
        }
      }

      // Cập nhật thông tin phiếu nhập
      await client.query(
        `UPDATE phieu_nhap 
         SET ngay_nhap = $1, nha_cung_cap_id = $2, ly_do_nhap = $3,
             so_hoa_don = $4, ghi_chu = $5, loai_phieu = $6,
             nguoi_nhap_hang = $7, so_quyet_dinh = $8, dia_chi_nhap = $9,
             phuong_thuc_van_chuyen = $10, phong_ban_cung_cap_id = $11,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $12`,
        [
          ngay_nhap,
          loai_phieu === "dieu_chuyen" ? null : nha_cung_cap_id,
          ly_do_nhap,
          so_hoa_don,
          ghi_chu,
          loai_phieu,
          nguoi_nhap_hang,
          so_quyet_dinh,
          dia_chi_nhap,
          phuong_thuc_van_chuyen,
          loai_phieu === "dieu_chuyen" ? phong_ban_cung_cap_id : null,
          id,
        ]
      );

      // Xóa chi tiết cũ
      await client.query("DELETE FROM chi_tiet_nhap WHERE phieu_nhap_id = $1", [
        id,
      ]);

      // Thêm chi tiết mới
      let tongTien = 0;
      for (const item of chi_tiet) {
        const {
          hang_hoa_id,
          so_luong_ke_hoach,
          so_luong,
          don_gia,
          so_seri_list,
          pham_chat = "tot",
          han_su_dung,
          vi_tri_kho,
          ghi_chu: item_ghi_chu,
        } = item;

        const soLuongKeHoach = parseFloat(so_luong_ke_hoach || so_luong || 0);
        const soLuongThucNhap = parseFloat(so_luong || so_luong_ke_hoach || 0);
        const donGiaFinal = parseFloat(don_gia || 0);
        const thanhTien = soLuongKeHoach * donGiaFinal;
        tongTien += thanhTien;

        await client.query(
          `INSERT INTO chi_tiet_nhap (
            phieu_nhap_id, hang_hoa_id, so_luong_ke_hoach, so_luong,
            don_gia, thanh_tien, so_seri_list, pham_chat, han_su_dung,
            vi_tri_kho, ghi_chu
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            id,
            hang_hoa_id,
            soLuongKeHoach,
            soLuongThucNhap,
            donGiaFinal,
            thanhTien,
            Array.isArray(so_seri_list) && so_seri_list.length > 0
              ? so_seri_list
              : null,
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
        id,
      ]);

      await client.query("COMMIT");
      sendResponse(res, 200, true, "Cập nhật phiếu nhập thành công");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Update phieu nhap error:", error);
      sendResponse(res, 500, false, "Lỗi khi cập nhật phiếu nhập");
    } finally {
      client.release();
    }
  },

  async delete(req, res, params, user) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { id } = params;

      console.log("🗑️ Deleting phieu:", id, "by user:", user.id);

      // Kiểm tra quyền xóa - chỉ admin hoặc người tạo (khi draft)
      const phieuResult = await client.query(
        "SELECT * FROM phieu_nhap WHERE id = $1",
        [id]
      );

      if (phieuResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
      }

      const phieu = phieuResult.rows[0];

      // Kiểm tra quyền xóa
      const canDelete =
        user.role === "admin" ||
        (phieu.nguoi_tao === user.id && phieu.trang_thai === "draft");

      if (!canDelete) {
        await client.query("ROLLBACK");
        return sendResponse(res, 403, false, "Không có quyền xóa phiếu này");
      }

      // Xóa chi tiết trước
      await client.query("DELETE FROM chi_tiet_nhap WHERE phieu_nhap_id = $1", [
        id,
      ]);

      // Xóa lịch sử phê duyệt
      await client.query(
        "DELETE FROM lich_su_phe_duyet WHERE phieu_id = $1 AND loai_phieu = 'nhap'",
        [id]
      );

      // Xóa thông báo liên quan
      await client.query(
        "DELETE FROM notifications WHERE related_id = $1 AND related_type = 'phieu_nhap'",
        [id]
      );

      // Xóa phiếu nhập
      await client.query("DELETE FROM phieu_nhap WHERE id = $1", [id]);

      await client.query("COMMIT");

      console.log("✅ Deleted phieu:", id);
      sendResponse(res, 200, true, "Xóa phiếu nhập thành công");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Delete error:", error);
      sendResponse(res, 500, false, "Lỗi server");
    } finally {
      client.release();
    }
  },

  async exportExcel(req, res, query, user) {
    try {
      console.log("📊 Exporting phieu nhap to Excel for user:", user.id);

      // Logic export tương tự như getList nhưng không phân trang
      const {
        search = "",
        trang_thai = "",
        loai_phieu = "",
        ngay_tu = "",
        ngay_den = "",
      } = query;

      let whereConditions = ["1=1"];
      let params = [];
      let paramCount = 0;

      // Quyền xem theo role
      if (user.role === "level3") {
        whereConditions.push(`pn.phong_ban_id = ${++paramCount}`);
        params.push(user.phong_ban_id);
      } else if (user.role === "manager") {
        whereConditions.push(`(
          pn.phong_ban_id IN (
            SELECT id FROM phong_ban 
            WHERE phong_ban_cha_id = ${++paramCount}
          ) OR pn.phong_ban_id = ${++paramCount}
        )`);
        params.push(user.phong_ban_id, user.phong_ban_id);
      }

      // Các filter khác
      if (search) {
        whereConditions.push(`(
          pn.so_phieu ILIKE ${++paramCount} OR 
          pn.ly_do_nhap ILIKE ${++paramCount}
        )`);
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern);
      }

      if (trang_thai) {
        whereConditions.push(`pn.trang_thai = ${++paramCount}`);
        params.push(trang_thai);
      }

      if (loai_phieu) {
        whereConditions.push(`pn.loai_phieu = ${++paramCount}`);
        params.push(loai_phieu);
      }

      if (ngay_tu) {
        whereConditions.push(`pn.ngay_nhap >= ${++paramCount}`);
        params.push(ngay_tu);
      }

      if (ngay_den) {
        whereConditions.push(`pn.ngay_nhap <= ${++paramCount}`);
        params.push(ngay_den);
      }

      const whereClause = whereConditions.join(" AND ");

      const queryStr = `
        SELECT 
          pn.so_phieu,
          pn.ngay_nhap,
          pn.loai_phieu,
          pn.trang_thai,
          pn.tong_tien,
          pn.ly_do_nhap,
          pb.ten_phong_ban,
          ncc.ten_ncc,
          u_tao.ho_ten as nguoi_tao_ten,
          pn.created_at
        FROM phieu_nhap pn
        LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
        LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
        LEFT JOIN users u_tao ON pn.nguoi_tao = u_tao.id
        WHERE ${whereClause}
        ORDER BY pn.created_at DESC
      `;

      const result = await pool.query(queryStr, params);

      // Tạo Excel file (cần cài đặt thư viện như xlsx)
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Danh sách phiếu nhập");

      // Header
      worksheet.columns = [
        { header: "Số phiếu", key: "so_phieu", width: 15 },
        { header: "Ngày nhập", key: "ngay_nhap", width: 12 },
        { header: "Loại phiếu", key: "loai_phieu", width: 12 },
        { header: "Trạng thái", key: "trang_thai", width: 15 },
        { header: "Tổng tiền", key: "tong_tien", width: 12 },
        { header: "Lý do nhập", key: "ly_do_nhap", width: 20 },
        { header: "Phòng ban", key: "ten_phong_ban", width: 15 },
        { header: "Nhà cung cấp", key: "ten_ncc", width: 15 },
        { header: "Người tạo", key: "nguoi_tao_ten", width: 15 },
      ];

      // Data
      result.rows.forEach((row) => {
        worksheet.addRow({
          so_phieu: row.so_phieu,
          ngay_nhap: row.ngay_nhap,
          loai_phieu: row.loai_phieu,
          trang_thai: row.trang_thai,
          tong_tien: row.tong_tien,
          ly_do_nhap: row.ly_do_nhap,
          ten_phong_ban: row.ten_phong_ban,
          ten_ncc: row.ten_ncc,
          nguoi_tao_ten: row.nguoi_tao_ten,
        });
      });

      // Style header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      const fileName = `phieu_nhap_${new Date().getTime()}.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

      await workbook.xlsx.write(res);
      res.end();

      console.log("✅ Exported Excel successfully");
    } catch (error) {
      console.error("❌ Export Excel error:", error);
      sendResponse(res, 500, false, "Lỗi export Excel");
    }
  },

  async getDashboardStats(req, res, query, user) {
    try {
      console.log("📊 Getting dashboard stats for user:", user.role);

      let whereCondition = "1=1";
      let params = [];

      // Filter theo quyền
      if (user.role === "level3") {
        whereCondition = "pn.phong_ban_id = $1";
        params.push(user.phong_ban_id);
      } else if (user.role === "manager") {
        whereCondition = `(
          pn.phong_ban_id IN (
            SELECT id FROM phong_ban 
            WHERE phong_ban_cha_id = $1
          ) OR pn.phong_ban_id = $1
        )`;
        params.push(user.phong_ban_id);
      }

      // Thống kê theo trạng thái
      const statsQuery = `
        SELECT 
          trang_thai,
          COUNT(*) as count,
          SUM(tong_tien) as total_amount
        FROM phieu_nhap pn
        WHERE ${whereCondition}
        GROUP BY trang_thai
      `;

      const statsResult = await pool.query(statsQuery, params);

      // Thống kê theo loại phiếu
      const typeStatsQuery = `
        SELECT 
          loai_phieu,
          COUNT(*) as count,
          SUM(tong_tien) as total_amount
        FROM phieu_nhap pn
        WHERE ${whereCondition}
        GROUP BY loai_phieu
      `;

      const typeStatsResult = await pool.query(typeStatsQuery, params);

      // Thống kê theo tháng (6 tháng gần nhất)
      const monthlyStatsQuery = `
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as count,
          SUM(tong_tien) as total_amount
        FROM phieu_nhap pn
        WHERE ${whereCondition}
          AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
      `;

      const monthlyStatsResult = await pool.query(monthlyStatsQuery, params);

      sendResponse(res, 200, true, "Lấy thống kê thành công", {
        status_stats: statsResult.rows,
        type_stats: typeStatsResult.rows,
        monthly_stats: monthlyStatsResult.rows,
      });
    } catch (error) {
      console.error("❌ Get dashboard stats error:", error);
      sendResponse(res, 500, false, "Lỗi server");
    }
  },
  async generateSoPhieu(client, loai_phieu) {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");

    let prefix;
    switch (loai_phieu) {
      case "tu_mua":
        prefix = "NTM";
        break;
      case "tren_cap":
        prefix = "NTC";
        break;
      case "dieu_chuyen":
        prefix = "NDC";
        break;
      default:
        prefix = "NH";
    }

    const codePrefix = `${prefix}${year}${month}`;

    const lastPhieuResult = await client.query(
      `SELECT so_phieu FROM phieu_nhap 
       WHERE so_phieu LIKE $1 
       ORDER BY so_phieu DESC LIMIT 1`,
      [`${codePrefix}%`]
    );

    let stt = 1;
    if (lastPhieuResult.rows.length > 0) {
      const lastSoPhieu = lastPhieuResult.rows[0].so_phieu;
      const lastStt = parseInt(lastSoPhieu.slice(-4));
      stt = lastStt + 1;
    }

    return `${codePrefix}${stt.toString().padStart(4, "0")}`;
  },

  async getHangHoaCoTheNhap(req, res, query, user) {
    try {
      const { phong_ban_cung_cap_id } = query;

      if (!phong_ban_cung_cap_id) {
        return sendResponse(
          res,
          400,
          false,
          "Thiếu thông tin phòng ban cung cấp"
        );
      }

      console.log(
        "Đang lấy hàng hóa có thể nhập từ phòng ban:",
        phong_ban_cung_cap_id
      );

      const result = await pool.query(
        `SELECT DISTINCT
          hh.id,
          hh.ma_hang_hoa,
          hh.ten_hang_hoa,
          hh.don_vi_tinh,
          hh.gia_nhap_gan_nhat,
          tk.sl_tot as so_luong_co_the_cap
        FROM hang_hoa hh
        JOIN ton_kho tk ON hh.id = tk.hang_hoa_id
        WHERE tk.phong_ban_id = $1
        AND tk.sl_tot > 0
        AND hh.trang_thai = 'active'
        ORDER BY hh.ten_hang_hoa`,
        [phong_ban_cung_cap_id]
      );

      console.log(`Tìm thấy ${result.rows.length} hàng hóa có thể nhập`);

      sendResponse(
        res,
        200,
        true,
        "Lấy danh sách hàng hóa có thể nhập thành công",
        result.rows
      );
    } catch (error) {
      console.error("Get hang hoa co the nhap error:", error);
      sendResponse(res, 500, false, "Lỗi server", { error: error.message });
    }
  },

  async updateActualQuantity(req, res, params, body, user) {
    const client = await pool.connect();
    const { id } = params;

    try {
      await client.query("BEGIN");

      const { chi_tiet = [], ghi_chu } = body;

      // Kiểm tra phiếu và quyền
      const checkResult = await client.query(
        "SELECT * FROM phieu_nhap WHERE id = $1",
        [id]
      );

      if (checkResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return sendResponse(res, 404, false, "Không tìm thấy phiếu nhập");
      }

      const phieu = checkResult.rows[0];

      if (phieu.trang_thai !== "approved") {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          "Chỉ được cập nhật số lượng thực tế khi phiếu đã được duyệt"
        );
      }

      // Cập nhật từng chi tiết
      for (const item of chi_tiet) {
        const { id: chiTietId, so_luong, ghi_chu: item_ghi_chu } = item;

        if (chiTietId && so_luong !== undefined) {
          await client.query(
            `UPDATE chi_tiet_nhap 
             SET so_luong = $1, 
                 ghi_chu = COALESCE($2, ghi_chu),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3 AND phieu_nhap_id = $4`,
            [parseFloat(so_luong), item_ghi_chu, chiTietId, id]
          );
        }
      }

      // Cập nhật ghi chú phiếu nếu có
      if (ghi_chu !== undefined) {
        await client.query(
          `UPDATE phieu_nhap 
           SET ghi_chu = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [ghi_chu, id]
        );
      }

      // Tính lại tổng tiền
      await client.query(
        `UPDATE phieu_nhap 
         SET tong_tien = (
           SELECT COALESCE(SUM(ctn.so_luong * ctn.don_gia), 0)
           FROM chi_tiet_nhap ctn
           WHERE ctn.phieu_nhap_id = $1
         )
         WHERE id = $1`,
        [id]
      );

      await client.query("COMMIT");

      sendResponse(res, 200, true, "Cập nhật số lượng thực tế thành công");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Update actual quantity error:", error);
      sendResponse(
        res,
        500,
        false,
        "Lỗi server khi cập nhật số lượng thực tế",
        {
          error: error.message,
        }
      );
    } finally {
      client.release();
    }
  },
};

module.exports = nhapKhoController;
