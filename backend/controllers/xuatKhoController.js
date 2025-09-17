const pool = require("../config/database");
const { sendResponse } = require("../utils/response");

const xuatKhoController = {
  async create(req, res, body, user) {
    // Kiểm tra chỉ user cấp 3 mới được tạo phiếu
    if (user.role !== "user" || user.phong_ban?.cap_bac !== 3) {
      return sendResponse(
        res,
        403,
        false,
        "Chỉ có cấp 3 mới được tạo phiếu xuất"
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const {
        ngay_xuat,
        loai_xuat,
        don_vi_nhan,
        phong_ban_nhan,
        nguoi_nhan,
        ly_do_xuat,
        ghi_chu,
        chi_tiet,
        so_quyet_dinh,
      } = body;

      console.log("📋 Creating phieu xuat with data:", {
        ngay_xuat,
        loai_xuat,
        phong_ban_id: user.phong_ban_id,
        chi_tiet_count: chi_tiet?.length,
      });

      // ✅ VALIDATION CƠ BẢN
      if (
        !ngay_xuat ||
        !loai_xuat ||
        !ly_do_xuat ||
        !chi_tiet ||
        chi_tiet.length === 0
      ) {
        await client.query("ROLLBACK");
        return sendResponse(res, 400, false, "Thiếu thông tin bắt buộc");
      }

      if (!["don_vi_su_dung", "don_vi_nhan"].includes(loai_xuat)) {
        await client.query("ROLLBACK");
        return sendResponse(res, 400, false, "Loại xuất không hợp lệ");
      }

      // ✅ WORKFLOW LUÂN CHUYỂN: Xác định loại phiếu

      if (loai_xuat === "don_vi_nhan" && !phong_ban_nhan?.id) {
        await client.query("ROLLBACK");
        return sendResponse(res, 400, false, "Thiếu thông tin đơn vị nhận");
      }

      // ✅ VALIDATION CHI TIẾT: Kiểm tra lô/serial và tồn kho
      for (let i = 0; i < chi_tiet.length; i++) {
        const item = chi_tiet[i];

        if (!item.hang_hoa_id || !item.so_luong || item.so_luong <= 0) {
          await client.query("ROLLBACK");
          return sendResponse(
            res,
            400,
            false,
            `Chi tiết ${i + 1}: Thiếu thông tin hàng hóa hoặc số lượng`
          );
        }

        // ✅ Kiểm tra hàng hóa có serial thì phải có danh điểm
        const hangHoaCheck = await client.query(
          "SELECT co_so_seri, ten_hang_hoa FROM hang_hoa WHERE id = $1 AND trang_thai = 'active'",
          [item.hang_hoa_id]
        );

        if (hangHoaCheck.rows.length === 0) {
          await client.query("ROLLBACK");
          return sendResponse(
            res,
            400,
            false,
            `Hàng hóa ${i + 1} không tồn tại hoặc không hoạt động`
          );
        }

        const hangHoa = hangHoaCheck.rows[0];

        // ✅ LOGIC KIỂM TRA SERIAL/DANH ĐIỂM - SỬA LẠI
        console.log(`🔍 Validating item ${i + 1}:`, {
          hang_hoa_id: item.hang_hoa_id,
          ten_hang_hoa: hangHoa.ten_hang_hoa,
          co_so_seri: hangHoa.co_so_seri,
          phieu_nhap_id: item.phieu_nhap_id,
          danh_diem: item.danh_diem,
        });

        // Bắt buộc phải có phieu_nhap_id (cho cả hàng có và không có serial)
        if (!item.phieu_nhap_id) {
          await client.query("ROLLBACK");
          return sendResponse(
            res,
            400,
            false,
            `Hàng hóa "${hangHoa.ten_hang_hoa}" thiếu thông tin lô xuất`
          );
        }

        // ✅ KIỂM TRA TỒN KHO CỦA LÔ CỤ THỂ (dùng phieu_nhap_id)
        const lotCheck = await client.query(
          `
  SELECT 
    pn.so_phieu,
    SUM(ctn.so_luong) AS tong_nhap,
    COALESCE(SUM(ctx.so_luong_thuc_xuat), 0) AS da_xuat,
    MIN(ctn.don_gia) AS don_gia,
    MIN(ctn.pham_chat) AS pham_chat,
    ARRAY_REMOVE(ARRAY_AGG(DISTINCT s.serial), NULL) AS so_seri_list
  FROM chi_tiet_nhap ctn
  JOIN phieu_nhap pn ON ctn.phieu_nhap_id = pn.id
  LEFT JOIN LATERAL (
    SELECT unnest(ctn.so_seri_list) AS serial
  ) s ON TRUE
  LEFT JOIN chi_tiet_xuat ctx ON (
    ctx.phieu_nhap_id = pn.id 
    AND ctx.hang_hoa_id = ctn.hang_hoa_id
  )
  LEFT JOIN phieu_xuat px ON px.id = ctx.phieu_xuat_id
  WHERE pn.id = $1 
    AND ctn.hang_hoa_id = $2
    AND pn.phong_ban_id = $3 
    AND pn.trang_thai IN ('approved','completed')
    AND (px.id IS NULL OR px.trang_thai IN ('draft', 'confirmed', 'pending_level3_approval', 'approved', 'completed'))
  GROUP BY pn.so_phieu
`,
          [item.phieu_nhap_id, item.hang_hoa_id, user.phong_ban_id]
        );

        if (lotCheck.rows.length === 0) {
          await client.query("ROLLBACK");
          return sendResponse(
            res,
            400,
            false,
            `Lô hàng ${i + 1} không hợp lệ hoặc chưa hoàn thành nhập`
          );
        }

        const lot = lotCheck.rows[0];
        const conLai = parseFloat(lot.tong_nhap) - parseFloat(lot.da_xuat);

        console.log(`🔍 Lot info for item ${i + 1}:`, {
          so_phieu: lot.so_phieu,
          tong_nhap: lot.tong_nhap,
          da_xuat: lot.da_xuat,
          con_lai: conLai,
          don_gia: lot.don_gia,
          pham_chat: lot.pham_chat,
          has_serials:
            Array.isArray(lot.so_seri_list) && lot.so_seri_list.length > 0,
        });

        if (item.so_luong > conLai) {
          await client.query("ROLLBACK");
          return sendResponse(
            res,
            400,
            false,
            `Chi tiết ${i + 1}: Số lượng xuất (${
              item.so_luong
            }) vượt quá tồn kho lô ${lot.so_phieu} (${conLai})`
          );
        }

        // ✅ Điền don_gia/pham_chat mặc định từ lô nếu thiếu
        if (!item.don_gia || isNaN(parseFloat(item.don_gia))) {
          item.don_gia = parseFloat(lot.don_gia) || 0;
        }
        if (!item.pham_chat) {
          item.pham_chat = lot.pham_chat || "tot";
        }

        // ✅ LOGIC MỚI: CHỈ KIỂM TRA SERIAL KHI:
        // 1. Hàng hóa CÓ co_so_seri = true
        // 2. VÀ lô thực sự CÓ serial data (so_seri_list không rỗng)
        const lotHasSerials =
          lot.so_seri_list &&
          Array.isArray(lot.so_seri_list) &&
          lot.so_seri_list.length > 0;

        const needsSerial = hangHoa.co_so_seri && lotHasSerials;

        console.log(`🔍 Serial validation for item ${i + 1}:`, {
          hang_hoa_co_so_seri: hangHoa.co_so_seri,
          lot_has_serials: lotHasSerials,
          needs_serial: needsSerial,
          item_danh_diem: item.danh_diem,
        });

        if (needsSerial) {
          // Hàng có serial VÀ lô có serial data: phải chọn danh điểm
          if (!item.danh_diem) {
            await client.query("ROLLBACK");
            return sendResponse(
              res,
              400,
              false,
              `Hàng hóa "${hangHoa.ten_hang_hoa}" cần chọn số seri từ lô ${lot.so_phieu}`
            );
          }

          // Kiểm tra serial có trong lô không
          if (!lot.so_seri_list.includes(item.danh_diem.trim())) {
            await client.query("ROLLBACK");
            return sendResponse(
              res,
              400,
              false,
              `Danh điểm "${item.danh_diem}" không có trong lô ${
                lot.so_phieu
              }. Available serials: ${lot.so_seri_list.join(", ")}`
            );
          }
        } else if (hangHoa.co_so_seri && !lotHasSerials) {
          // Hàng có co_so_seri = true nhưng lô không có serial data
          console.log(
            `⚠️ Item ${
              i + 1
            }: Hang hoa has co_so_seri=true but lot has no serials. Allowing without danh_diem.`
          );
          // Không cần danh điểm trong trường hợp này
        }

        // ✅ Cập nhật đơn giá và phẩm chất theo lô
        chi_tiet[i].don_gia = lot.don_gia;
        chi_tiet[i].pham_chat = lot.pham_chat;

        console.log(`✅ Item ${i + 1} validation passed`);
      }

      // ✅ TẠO SỐ PHIẾU XUẤT
      const dateStr = new Date(ngay_xuat)
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");
      const sequenceQuery = await client.query(
        "SELECT COALESCE(MAX(CAST(SUBSTRING(so_phieu FROM 11) AS INTEGER)), 0) + 1 as next_seq FROM phieu_xuat WHERE so_phieu LIKE $1",
        [`PX${dateStr}%`]
      );
      const soPhieu = `PX${dateStr}${String(
        sequenceQuery.rows[0].next_seq
      ).padStart(3, "0")}`;

      // ✅ TÍNH TỔNG TIỀN an toàn khi don_gia có thể chưa được client gửi
      const tongTien = chi_tiet.reduce((sum, item) => {
        const sl = parseFloat(item.so_luong) || 0;
        const gia = parseFloat(item.don_gia) || 0;
        return sum + sl * gia;
      }, 0);

      // ✅ TẠO PHIẾU XUẤT
      const phieuXuatQuery = `
      INSERT INTO phieu_xuat (
        so_phieu, ngay_xuat, phong_ban_id,
        loai_xuat, ${loai_xuat === "don_vi_nhan" ? "phong_ban_nhan_id," : ""}
        ${don_vi_nhan?.id ? "don_vi_nhan_id," : ""}
        nguoi_nhan, ly_do_xuat, so_quyet_dinh, ghi_chu,
        trang_thai, nguoi_tao, tong_tien, created_at
      ) VALUES (
        $1, $2, $3, $4,
        ${loai_xuat === "don_vi_nhan" ? "$5," : ""}
        ${don_vi_nhan?.id ? "$6," : ""}
        $${loai_xuat === "don_vi_nhan" ? (don_vi_nhan?.id ? "7" : "6") : "5"}, 
        $${loai_xuat === "don_vi_nhan" ? (don_vi_nhan?.id ? "8" : "7") : "6"}, 
        $${loai_xuat === "don_vi_nhan" ? (don_vi_nhan?.id ? "9" : "8") : "7"}, 
        $${loai_xuat === "don_vi_nhan" ? (don_vi_nhan?.id ? "10" : "9") : "8"},
        'draft', 
        $${
          loai_xuat === "don_vi_nhan" ? (don_vi_nhan?.id ? "11" : "10") : "9"
        }, 
        $${
          loai_xuat === "don_vi_nhan" ? (don_vi_nhan?.id ? "12" : "11") : "10"
        },
        CURRENT_TIMESTAMP
      ) RETURNING id
    `;

      let paramValues = [soPhieu, ngay_xuat, user.phong_ban_id, loai_xuat];

      if (loai_xuat === "don_vi_nhan") {
        paramValues.push(phong_ban_nhan.id);
      }
      if (don_vi_nhan?.id) {
        paramValues.push(don_vi_nhan.id);
      }

      paramValues.push(
        nguoi_nhan,
        ly_do_xuat,
        so_quyet_dinh,
        ghi_chu,
        user.id,
        tongTien
      );

      const phieuResult = await client.query(phieuXuatQuery, paramValues);
      const phieuXuatId = phieuResult.rows[0].id;

      // ✅ TẠO CHI TIẾT XUẤT theo đúng schema chi_tiet_xuat
      for (const item of chi_tiet) {
        await client.query(
          `
        INSERT INTO chi_tiet_xuat (
          phieu_xuat_id, hang_hoa_id, so_luong_yeu_cau, so_luong_thuc_xuat,
          don_gia, thanh_tien, pham_chat, so_seri_xuat, 
          phieu_nhap_id, loai_phieu_nhap
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
          [
            phieuXuatId,
            item.hang_hoa_id,
            parseFloat(item.so_luong),
            parseFloat(item.so_luong), // Mặc định số lượng thực = yêu cầu
            parseFloat(item.don_gia),
            parseFloat(item.so_luong) * parseFloat(item.don_gia),
            item.pham_chat,
            item.danh_diem || null, // ✅ so_seri_xuat (tên cột đúng)
            item.phieu_nhap_id || null, // ✅ phieu_nhap_id thay vì chi_tiet_nhap_id
            "dieu_chuyen", // ✅ loai_phieu_nhap
          ]
        );
      }

      await client.query("COMMIT");

      console.log("✅ Created phieu xuat successfully:", soPhieu);

      sendResponse(res, 201, true, "Tạo phiếu xuất thành công", {
        id: phieuXuatId,
        so_phieu: soPhieu,
        tong_tien: tongTien,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Error creating phieu xuat:", error);

      if (error.code === "23503") {
        return sendResponse(res, 400, false, "Dữ liệu tham chiếu không hợp lệ");
      }

      sendResponse(res, 500, false, "Lỗi server", { error: error.message });
    } finally {
      client.release();
    }
  },

  // Cập nhật số lượng thực tế - CHỈ CHỦ PHIẾU CẤP 3 SAU KHI DUYỆT
  async updateActualQuantity(req, res, params, body, user) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { id } = params;
      const { chi_tiet } = body;

      const phieuResult = await client.query(
        "SELECT * FROM phieu_xuat WHERE id = $1",
        [id]
      );

      if (phieuResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
      }

      const phieu = phieuResult.rows[0];

      // Kiểm tra quyền: chỉ chủ phiếu cấp 3
      if (
        phieu.phong_ban_id !== user.phong_ban_id ||
        user.role !== "user" ||
        user.phong_ban?.cap_bac !== 3
      ) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          403,
          false,
          "Bạn không có quyền chỉnh sửa phiếu này"
        );
      }

      // Kiểm tra trạng thái
      if (phieu.trang_thai !== "approved") {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          "Chỉ được chỉnh số lượng khi phiếu đã duyệt"
        );
      }

      // Cập nhật chi tiết theo cột so_luong_thuc_xuat
      for (const item of chi_tiet) {
        const soLuongThuc = parseFloat(item.so_luong_thuc_xuat || 0);
        const donGia = parseFloat(item.don_gia || 0);

        await client.query(
          `UPDATE chi_tiet_xuat 
           SET so_luong_thuc_xuat = $1, thanh_tien = $2
           WHERE id = $3 AND phieu_xuat_id = $4`,
          [soLuongThuc, soLuongThuc * donGia, item.id, id]
        );
      }

      // Cập nhật tổng tiền phiếu
      await client.query(
        `UPDATE phieu_xuat 
         SET tong_tien = (
           SELECT SUM(thanh_tien) FROM chi_tiet_xuat WHERE phieu_xuat_id = $1
         )
         WHERE id = $1`,
        [id]
      );

      await client.query("COMMIT");

      sendResponse(res, 200, true, "Đã cập nhật số lượng thực tế");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error in updateActualQuantity:", error);
      sendResponse(res, 500, false, "Lỗi server");
    } finally {
      client.release();
    }
  },

  // Lấy danh sách phòng ban để chọn khi xuất cho đơn vị - CHỈ CẤP 3
  async getPhongBanList(req, res, query, user) {
    try {
      // Chỉ user cấp 3 mới cần thông tin này
      if (user.role !== "user" || user.phong_ban?.cap_bac !== 3) {
        return sendResponse(res, 403, false, "Bạn không có quyền truy cập");
      }

      // Lấy các phòng ban cấp 3 khác (không bao gồm mình)
      const result = await pool.query(
        `SELECT id, ma_phong_ban, ten_phong_ban, cap_bac
         FROM phong_ban
         WHERE cap_bac = 3 AND is_active = TRUE AND id != $1
         ORDER BY ten_phong_ban`,
        [user.phong_ban_id]
      );

      sendResponse(res, 200, true, "Lấy danh sách thành công", {
        data: result.rows,
      });
    } catch (error) {
      console.error("Error in getPhongBanList:", error);
      sendResponse(res, 500, false, "Lỗi server");
    }
  },

  // Tạo thông báo
  async createNotification(client, phieu, trangThai, user) {
    try {
      let loaiThongBao,
        noiDung,
        nguoiNhan = [];

      switch (trangThai) {
        case "confirmed":
          loaiThongBao = "phieu_xuat_can_duyet";
          noiDung = `Phiếu xuất ${phieu.so_phieu} cần được duyệt`;
          // Gửi cho admin và manager có quyền
          const adminManagerResult = await client.query(
            `SELECT id FROM users WHERE role IN ('admin', 'manager') AND trang_thai = 'active'`
          );
          nguoiNhan = adminManagerResult.rows.map((row) => row.id);
          break;

        case "approved":
          loaiThongBao = "phieu_xuat_duyet";
          noiDung = `Phiếu xuất ${phieu.so_phieu} đã được duyệt`;
          // Gửi cho chủ phiếu
          const ownerResult = await client.query(
            `SELECT u.id FROM users u WHERE u.phong_ban_id = $1 AND u.trang_thai = 'active'`,
            [phieu.phong_ban_id]
          );
          nguoiNhan = ownerResult.rows.map((row) => row.id);
          break;

        case "revision_required":
          loaiThongBao = "phieu_xuat_can_sua";
          noiDung = `Phiếu xuất ${phieu.so_phieu} cần chỉnh sửa`;
          // Gửi cho chủ phiếu
          const revisionResult = await client.query(
            `SELECT u.id FROM users u WHERE u.phong_ban_id = $1 AND u.trang_thai = 'active'`,
            [phieu.phong_ban_id]
          );
          nguoiNhan = revisionResult.rows.map((row) => row.id);
          break;
      }

      // Tạo thông báo cho từng người nhận - chỉ lưu URL tab
      for (const userId of nguoiNhan) {
        await client.query(
          `INSERT INTO notifications (nguoi_nhan, tieu_de, noi_dung, loai_thong_bao, phieu_id, phieu_type, url)
           VALUES ($1, $2, $3, $4, $5, 'phieu_xuat', $6)`,
          [
            userId,
            `Phiếu xuất ${phieu.so_phieu}`,
            noiDung,
            loaiThongBao,
            phieu.id,
            `/xuat-kho?tab=${
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
      }
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  },

  async update(req, res, params, body, user) {
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

      // Kiểm tra quyền: chỉ chủ phiếu cấp 3
      if (
        phieu.phong_ban_id !== user.phong_ban_id ||
        user.role !== "user" ||
        user.phong_ban?.cap_bac !== 3
      ) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          403,
          false,
          "Bạn không có quyền chỉnh sửa phiếu này"
        );
      }

      // Kiểm tra trạng thái
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
        ngay_xuat,
        loai_xuat,
        don_vi_nhan,
        phong_ban_nhan,
        nguoi_nhan,
        ly_do_xuat,
        ghi_chu,
        chi_tiet,
        so_quyet_dinh,
      } = body;

      // Kiểm tra tồn kho cho các mặt hàng mới
      for (const item of chi_tiet) {
        const tonKhoResult = await client.query(
          "SELECT so_luong_ton FROM ton_kho WHERE hang_hoa_id = $1 AND phong_ban_id = $2",
          [item.hang_hoa_id, user.phong_ban_id]
        );

        const tonKho =
          tonKhoResult.rows.length > 0 ? tonKhoResult.rows[0].so_luong_ton : 0;
        if (parseFloat(item.so_luong || 0) > tonKho) {
          await client.query("ROLLBACK");
          return sendResponse(
            res,
            400,
            false,
            `Không đủ tồn kho cho ${item.hang_hoa?.ten_hang_hoa}`
          );
        }
      }

      // Xử lý đơn vị nhận
      let donViNhanId = null;
      let phongBanNhanId = null;

      if (loai_xuat === "don_vi_nhan") {
        if (don_vi_nhan?.isNewItem) {
          const newDvnResult = await client.query(
            `INSERT INTO don_vi_nhan (ma_don_vi, ten_don_vi, dia_chi, nguoi_lien_he, so_dien_thoai, email, trang_thai, is_noi_bo, phong_ban_id)
             VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8) RETURNING id`,
            [
              don_vi_nhan.ma_don_vi || `DVN${Date.now()}`,
              don_vi_nhan.ten_don_vi,
              don_vi_nhan.dia_chi || "",
              don_vi_nhan.nguoi_lien_he || "",
              don_vi_nhan.so_dien_thoai || "",
              don_vi_nhan.email || "",
              don_vi_nhan.is_noi_bo || false,
              don_vi_nhan.phong_ban_id || null,
            ]
          );
          donViNhanId = newDvnResult.rows[0].id;
        } else {
          donViNhanId = don_vi_nhan?.id;
        }

        if (phong_ban_nhan?.id) {
          phongBanNhanId = phong_ban_nhan.id;
        }
      }

      // Tính tổng tiền theo số lượng thực xuất (nếu không có thì dùng yêu cầu)
      const tongTien = chi_tiet.reduce((sum, item) => {
        const soLuongThuc =
          item.so_luong_thuc_xuat !== undefined
            ? parseFloat(item.so_luong_thuc_xuat || 0)
            : parseFloat(item.so_luong || 0);
        return sum + soLuongThuc * parseFloat(item.don_gia || 0);
      }, 0);

      // Cập nhật phiếu xuất
      await client.query(
        `UPDATE phieu_xuat SET
          ngay_xuat = $1, loai_xuat = $2, don_vi_nhan_id = $3, phong_ban_nhan_id = $4,
          nguoi_nhan = $5, ly_do_xuat = $6, ghi_chu = $7, so_quyet_dinh = $8,
          tong_tien = $9, updated_at = CURRENT_TIMESTAMP
         WHERE id = $10`,
        [
          ngay_xuat,
          loai_xuat,
          donViNhanId,
          phongBanNhanId,
          nguoi_nhan,
          ly_do_xuat,
          ghi_chu,
          so_quyet_dinh,
          tongTien,
          id,
        ]
      );

      // Xóa chi tiết cũ
      await client.query("DELETE FROM chi_tiet_xuat WHERE phieu_xuat_id = $1", [
        id,
      ]);

      // Tạo chi tiết mới
      for (const item of chi_tiet) {
        const soLuongYeuCau =
          item.so_luong_yeu_cau !== undefined
            ? parseFloat(item.so_luong_yeu_cau || 0)
            : parseFloat(item.so_luong || 0);
        const soLuongThucXuat =
          item.so_luong_thuc_xuat !== undefined
            ? parseFloat(item.so_luong_thuc_xuat || 0)
            : soLuongYeuCau;
        const donGia = parseFloat(item.don_gia || 0);

        await client.query(
          `INSERT INTO chi_tiet_xuat (
            phieu_xuat_id, hang_hoa_id, so_luong_yeu_cau, so_luong_thuc_xuat, don_gia, thanh_tien, pham_chat
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            id,
            item.hang_hoa_id,
            soLuongYeuCau,
            soLuongThucXuat,
            donGia,
            soLuongThucXuat * donGia,
            item.pham_chat || "tot",
          ]
        );
      }

      await client.query("COMMIT");

      sendResponse(res, 200, true, "Đã cập nhật phiếu xuất");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error in update:", error);
      sendResponse(res, 500, false, "Lỗi server");
    } finally {
      client.release();
    }
  },

  checkViewPermission(phieu, user) {
    if (user.role === "admin") {
      return true; // Admin xem tất cả
    }

    if (user.role === "manager") {
      // TODO: Kiểm tra phạm vi quản lý của manager
      return true; // Tạm thời cho xem tất cả
    }

    if (user.role === "user" && user.phong_ban?.cap_bac === 3) {
      // User cấp 3 chỉ xem phiếu của mình hoặc liên quan đến mình
      return (
        phieu.phong_ban_id === user.phong_ban_id ||
        phieu.phong_ban_nhan_id === user.phong_ban_id
      );
    }

    return false;
  },

  // Xóa phiếu - CHỈ CHỦ PHIẾU CẤP 3 KHI Ở TRẠNG THÁI NHÁP
  async delete(req, res, params, user) {
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

      // Kiểm tra quyền: chỉ chủ phiếu cấp 3
      if (
        phieu.phong_ban_id !== user.phong_ban_id ||
        user.role !== "user" ||
        user.phong_ban?.cap_bac !== 3
      ) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          403,
          false,
          "Bạn không có quyền xóa phiếu này"
        );
      }

      // Kiểm tra trạng thái
      if (phieu.trang_thai !== "draft") {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          "Chỉ được xóa phiếu ở trạng thái nháp"
        );
      }

      // Xóa chi tiết trước
      await client.query("DELETE FROM chi_tiet_xuat WHERE phieu_xuat_id = $1", [
        id,
      ]);

      // Xóa phiếu
      await client.query("DELETE FROM phieu_xuat WHERE id = $1", [id]);

      await client.query("COMMIT");

      sendResponse(res, 200, true, "Đã xóa phiếu xuất");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error in delete:", error);
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
        loai_xuat,
        phong_ban_filter,
        search,
        tu_ngay,
        den_ngay,
        sort_by = "created_at",
        sort_direction = "desc",
      } = query;

      // ✅ Chuẩn hóa tham số trạng thái: hỗ trợ trang_thai, trang_thai[], và CSV
      let trang_thai = query.trang_thai ?? query["trang_thai[]"] ?? null;

      console.log("🔍 DEBUG xuatKho statusFilter:", {
        trang_thai,
        "trang_thai[]": query["trang_thai[]"],
        type: typeof trang_thai,
        isArray: Array.isArray(trang_thai),
        rawQuery: query,
      });
      if (typeof trang_thai === "string") {
        // "confirmed,pending_level3_approval" hoặc "confirmed"
        trang_thai = trang_thai.includes(",")
          ? trang_thai
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [trang_thai];
      }

      // ✅ FIX: Đảm bảo trang_thai luôn là array nếu có nhiều giá trị
      if (trang_thai && !Array.isArray(trang_thai)) {
        trang_thai = [trang_thai];
      }

      // ✅ Validate và parse parameters
      const validatedPage = Math.max(1, parseInt(page) || 1);
      const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
      const offset = (validatedPage - 1) * validatedLimit;

      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      // ✅ QUY TẮC XEM: chỉ cấp 3 thấy phiếu của mình, admin/manager thấy tất cả
      if (user.role === "user" && user.phong_ban?.cap_bac === 3) {
        // Cấp 3: CHỈ xem phiếu do đơn vị mình tạo (đơn vị xuất)
        whereConditions.push(`px.phong_ban_id = $${paramIndex}`);
        queryParams.push(user.phong_ban_id);
        paramIndex++;
      } else if (user.role === "manager") {
        // ✅ FIX: Manager thấy phiếu của các phòng ban thuộc quyền quản lý
        // NHƯNG nếu có status filter cụ thể (như tab "Chờ duyệt"),
        // thì cho phép xem tất cả phiếu có trạng thái đó
        if (
          trang_thai &&
          Array.isArray(trang_thai) &&
          (trang_thai.includes("confirmed") ||
            trang_thai.includes("pending_level3_approval"))
        ) {
          // Tab "Chờ duyệt" - cho phép xem tất cả phiếu confirmed/pending_level3_approval
          console.log(
            "🔍 Manager - Tab Chờ duyệt: cho phép xem tất cả phiếu confirmed/pending_level3_approval",
            "trang_thai:",
            trang_thai,
            "includes confirmed:",
            trang_thai.includes("confirmed"),
            "includes pending_level3_approval:",
            trang_thai.includes("pending_level3_approval")
          );
          // Không thêm điều kiện phòng ban - cho phép xem tất cả
        } else {
          // Các tab khác - chỉ xem phiếu của phòng ban thuộc quyền quản lý
          whereConditions.push(`EXISTS (
            SELECT 1 FROM phong_ban pb 
            WHERE pb.id = px.phong_ban_id 
            AND (pb.phong_ban_cha_id = $${paramIndex} OR pb.id = $${paramIndex})
          )`);
          queryParams.push(user.phong_ban_id);
          paramIndex++;
        }
      }
      // Admin xem tất cả (không thêm điều kiện)
      // ✅ FIX: Admin cũng cần xử lý logic tương tự cho tab "Chờ duyệt"
      else if (user.role === "admin") {
        // Admin xem tất cả phiếu, không cần thêm điều kiện phòng ban
        console.log("🔍 Admin - xem tất cả phiếu");

        // ✅ FIX: Admin cũng cần xử lý logic tương tự cho tab "Chờ duyệt"
        if (
          trang_thai &&
          Array.isArray(trang_thai) &&
          (trang_thai.includes("confirmed") ||
            trang_thai.includes("pending_level3_approval"))
        ) {
          // Tab "Chờ duyệt" - cho phép xem tất cả phiếu confirmed/pending_level3_approval
          console.log(
            "🔍 Admin - Tab Chờ duyệt: cho phép xem tất cả phiếu confirmed/pending_level3_approval",
            "trang_thai:",
            trang_thai,
            "includes confirmed:",
            trang_thai.includes("confirmed"),
            "includes pending_level3_approval:",
            trang_thai.includes("pending_level3_approval")
          );
          // Không thêm điều kiện phòng ban - cho phép xem tất cả
        }
      }

      // Lọc theo trạng thái
      if (trang_thai) {
        if (Array.isArray(trang_thai)) {
          const placeholders = trang_thai
            .map(() => `$${paramIndex++}`)
            .join(",");
          whereConditions.push(`px.trang_thai IN (${placeholders})`);
          queryParams.push(...trang_thai);
        } else {
          whereConditions.push(`px.trang_thai = $${paramIndex++}`);
          queryParams.push(trang_thai);
        }
      }

      // Lọc theo loại xuất
      if (loai_xuat) {
        whereConditions.push(`px.loai_xuat = $${paramIndex++}`);
        queryParams.push(loai_xuat);
      }

      // Tìm kiếm
      if (search && search.trim()) {
        whereConditions.push(`(
          px.so_phieu ILIKE $${paramIndex} OR 
          px.ly_do_xuat ILIKE $${paramIndex} OR
          px.so_quyet_dinh ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${search.trim()}%`);
        paramIndex++;
      }

      // Lọc theo ngày
      if (tu_ngay) {
        whereConditions.push(`px.ngay_xuat >= $${paramIndex++}`);
        queryParams.push(tu_ngay);
      }

      if (den_ngay) {
        whereConditions.push(`px.ngay_xuat <= $${paramIndex++}`);
        queryParams.push(den_ngay);
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      // Sorting
      const validSortColumns = [
        "so_phieu",
        "ngay_xuat",
        "trang_thai",
        "tong_tien",
        "created_at",
      ];
      const sortColumn = validSortColumns.includes(sort_by)
        ? sort_by
        : "created_at";
      const sortDirection =
        sort_direction.toUpperCase() === "ASC" ? "ASC" : "DESC";

      // ✅ Main query với JOIN đầy đủ
      const dataQuery = `
        SELECT 
          px.*,
          pb.ten_phong_ban,
          pb.cap_bac,
          pb_nhan.ten_phong_ban as ten_phong_ban_nhan,
          dvn.ten_don_vi as ten_don_vi_nhan,
          dvn.dia_chi as don_vi_nhan_dia_chi,
          nt.ho_ten as nguoi_tao_ten,
          nd1.ho_ten as nguoi_duyet_cap1_ten
        FROM phieu_xuat px
        LEFT JOIN phong_ban pb ON px.phong_ban_id = pb.id
        LEFT JOIN phong_ban pb_nhan ON px.phong_ban_nhan_id = pb_nhan.id
        LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id
        LEFT JOIN users nt ON px.nguoi_tao = nt.id
        LEFT JOIN users nd1 ON px.nguoi_duyet_cap1 = nd1.id
        ${whereClause}
        ORDER BY ${sortColumn} ${sortDirection}
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `;

      queryParams.push(validatedLimit, offset);

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM phieu_xuat px
        LEFT JOIN phong_ban pb ON px.phong_ban_id = pb.id
        LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id
        ${whereClause}
      `;

      console.log("🔍 Xuat kho query:", dataQuery);
      console.log("📊 Params:", queryParams);

      const [dataResult, countResult] = await Promise.all([
        client.query(dataQuery, queryParams),
        client.query(countQuery, queryParams.slice(0, -2)),
      ]);

      const total = parseInt(countResult.rows[0]?.total || 0);
      const pages = Math.ceil(total / validatedLimit);

      // ✅ Structure data đúng format
      const structuredData = dataResult.rows.map((row) => ({
        id: row.id,
        so_phieu: row.so_phieu,
        ngay_xuat: row.ngay_xuat,
        loai_xuat: row.loai_xuat,
        trang_thai: row.trang_thai,
        tong_tien: parseFloat(row.tong_tien || 0),
        so_quyet_dinh: row.so_quyet_dinh,
        ly_do_xuat: row.ly_do_xuat,
        nguoi_nhan: row.nguoi_nhan,
        nguoi_giao_hang: row.nguoi_giao_hang,
        ghi_chu: row.ghi_chu,
        ghi_chu_phan_hoi: row.ghi_chu_phan_hoi,
        decision_pdf_url: row.decision_pdf_url,
        nguoi_tao: row.nguoi_tao,
        created_at: row.created_at,
        updated_at: row.updated_at,

        // Thông tin phòng ban
        phong_ban: row.phong_ban_id
          ? {
              id: row.phong_ban_id,
              ten_phong_ban: row.ten_phong_ban,
              cap_bac: row.cap_bac,
            }
          : null,

        // Phòng ban nhận (nếu xuất nội bộ)
        ten_phong_ban_nhan: row.ten_phong_ban_nhan || null,

        // Đơn vị nhận
        don_vi_nhan: row.don_vi_nhan_id
          ? {
              id: row.don_vi_nhan_id,
              ten_don_vi: row.ten_don_vi_nhan,
              dia_chi: row.don_vi_nhan_dia_chi,
            }
          : null,

        // Người tạo và duyệt
        nguoi_tao_ten: row.nguoi_tao_ten,
        nguoi_duyet_cap1_ten: row.nguoi_duyet_cap1_ten,
      }));

      sendResponse(res, 200, true, "Lấy danh sách thành công", {
        items: structuredData,
        pagination: {
          currentPage: validatedPage,
          totalPages: pages,
          total: total,
          limit: validatedLimit,
        },
      });
    } catch (error) {
      console.error("❌ Get list error:", error);
      sendResponse(res, 500, false, "Lỗi server");
    } finally {
      client.release();
    }
  },

  async getDetail(req, res, params, user) {
    const client = await pool.connect();
    try {
      const { id } = params;

      // Query chính (giữ nguyên)
      const query = `
      SELECT 
        px.*,
        pb_tao.ten_phong_ban as ten_phong_ban_tao,
        pb_tao.cap_bac as cap_bac_tao,
        pb_tao.ma_phong_ban as ma_phong_ban_tao,
        
        pb_nhan.ten_phong_ban as ten_phong_ban_nhan,
        pb_nhan.cap_bac as cap_bac_nhan,
        pb_nhan.ma_phong_ban as ma_phong_ban_nhan,
        
        dvn.ten_don_vi as ten_don_vi_nhan, 
        dvn.dia_chi as don_vi_nhan_dia_chi,
        dvn.ma_don_vi as ma_don_vi_nhan,
        
        nt.ho_ten as nguoi_tao_ten,
        nd1.ho_ten as nguoi_duyet_cap1_ten,
        
        pn_lk.so_phieu as phieu_nhap_lien_ket_so_phieu,
        pn_lk.ngay_nhap as phieu_nhap_lien_ket_ngay_nhap,
        pn_lk.loai_phieu as phieu_nhap_lien_ket_loai_phieu
        
      FROM phieu_xuat px
      LEFT JOIN phong_ban pb_tao ON px.phong_ban_id = pb_tao.id
      LEFT JOIN phong_ban pb_nhan ON px.phong_ban_nhan_id = pb_nhan.id
      LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id
      LEFT JOIN users nt ON px.nguoi_tao = nt.id
      LEFT JOIN users nd1 ON px.nguoi_duyet_cap1 = nd1.id
      LEFT JOIN phieu_nhap pn_lk ON px.phieu_nhap_lien_ket_id = pn_lk.id
      WHERE px.id = $1
    `;

      const result = await client.query(query, [id]);

      if (result.rows.length === 0) {
        return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
      }

      // ❌ QUERY CŨ - THIẾU JOIN HANG_HOA:
      /*
    const chiTietQuery = `
      SELECT ctx.*
      FROM chi_tiet_xuat ctx
      WHERE ctx.phieu_xuat_id = $1
      ORDER BY ctx.id
    `;
    */

      // ✅ QUERY MỚI - CÓ JOIN HANG_HOA:
      const chiTietQuery = `
      SELECT 
        ctx.*,
        -- ✅ THÊM THÔNG TIN HÀNG HÓA TỪ BẢNG HANG_HOA
        hh.ten_hang_hoa,
        hh.ma_hang_hoa,
        hh.don_vi_tinh,
        hh.co_so_seri,
        hh.gia_nhap_gan_nhat,
        lhh.ten_loai as ten_loai_hang_hoa
      FROM chi_tiet_xuat ctx
      LEFT JOIN hang_hoa hh ON ctx.hang_hoa_id = hh.id
      LEFT JOIN loai_hang_hoa lhh ON hh.loai_hang_hoa_id = lhh.id
      WHERE ctx.phieu_xuat_id = $1
      ORDER BY ctx.id
    `;

      const chiTietResult = await client.query(chiTietQuery, [id]);
      const phieuData = result.rows[0];

      const responseData = {
        id: phieuData.id,
        so_phieu: phieuData.so_phieu,
        ngay_xuat: phieuData.ngay_xuat,
        loai_xuat: phieuData.loai_xuat,
        trang_thai: phieuData.trang_thai,
        so_quyet_dinh: phieuData.so_quyet_dinh,
        nguoi_nhan: phieuData.nguoi_nhan,
        nguoi_giao_hang: phieuData.nguoi_giao_hang,
        ly_do_xuat: phieuData.ly_do_xuat,
        ghi_chu: phieuData.ghi_chu,
        tong_tien: phieuData.tong_tien,

        // Thông tin phòng ban tạo phiếu
        phong_ban_id: phieuData.phong_ban_id,
        ten_phong_ban: phieuData.ten_phong_ban_tao,
        cap_bac: phieuData.cap_bac_tao,
        ma_phong_ban: phieuData.ma_phong_ban_tao,

        // Thông tin đơn vị nhận ngoài
        don_vi_nhan_id: phieuData.don_vi_nhan_id,
        ten_don_vi_nhan: phieuData.ten_don_vi_nhan,
        don_vi_nhan_dia_chi: phieuData.don_vi_nhan_dia_chi,
        ma_don_vi_nhan: phieuData.ma_don_vi_nhan,

        // Thông tin phòng ban nhận (cho luân chuyển)
        phong_ban_nhan_id: phieuData.phong_ban_nhan_id,
        ten_phong_ban_nhan: phieuData.ten_phong_ban_nhan,
        cap_bac_nhan: phieuData.cap_bac_nhan,
        ma_phong_ban_nhan: phieuData.ma_phong_ban_nhan,

        // Thông tin phiếu nhập liên kết
        phieu_nhap_lien_ket_id: phieuData.phieu_nhap_lien_ket_id,
        phieu_nhap_lien_ket: phieuData.phieu_nhap_lien_ket_id
          ? {
              id: phieuData.phieu_nhap_lien_ket_id,
              so_phieu: phieuData.phieu_nhap_lien_ket_so_phieu,
              ngay_nhap: phieuData.phieu_nhap_lien_ket_ngay_nhap,
              loai_phieu: phieuData.phieu_nhap_lien_ket_loai_phieu,
            }
          : null,

        // Thông tin người
        nguoi_tao: phieuData.nguoi_tao,
        nguoi_tao_ten: phieuData.nguoi_tao_ten,
        nguoi_duyet_cap1: phieuData.nguoi_duyet_cap1,
        nguoi_duyet_cap1_ten: phieuData.nguoi_duyet_cap1_ten,

        // Workflow fields
        is_tu_dong: phieuData.is_tu_dong,

        // Timestamps
        created_at: phieuData.created_at,
        updated_at: phieuData.updated_at,
        ngay_duyet_cap1: phieuData.ngay_duyet_cap1,

        // Revision fields
        ghi_chu_phan_hoi: phieuData.ghi_chu_phan_hoi,
        nguoi_phan_hoi: phieuData.nguoi_phan_hoi,
        ngay_phan_hoi: phieuData.ngay_phan_hoi,

        // ✅ CHI TIẾT HÀNG HÓA VỚI THÔNG TIN ĐẦY ĐỦ
        chi_tiet: chiTietResult.rows.map((item) => ({
          id: item.id,
          hang_hoa_id: item.hang_hoa_id,

          // ✅ THÔNG TIN HÀNG HÓA TỪ JOIN (SẼ CÓ DATA)
          ten_hang_hoa: item.ten_hang_hoa,
          ma_hang_hoa: item.ma_hang_hoa,
          don_vi_tinh: item.don_vi_tinh,
          co_so_seri: item.co_so_seri,
          ten_loai_hang_hoa: item.ten_loai_hang_hoa,

          // ✅ OBJECT HÀNG HÓA ĐẦY ĐỦ
          hang_hoa: {
            id: item.hang_hoa_id,
            ten_hang_hoa: item.ten_hang_hoa,
            ma_hang_hoa: item.ma_hang_hoa,
            don_vi_tinh: item.don_vi_tinh,
            co_so_seri: item.co_so_seri || false,
            gia_nhap_gan_nhat: parseFloat(item.gia_nhap_gan_nhat) || 0,
          },

          so_luong_yeu_cau: parseFloat(
            item.so_luong_yeu_cau || item.so_luong || 0
          ),
          so_luong_thuc_xuat: parseFloat(
            item.so_luong_thuc_xuat || item.so_luong || 0
          ),
          don_gia: parseFloat(item.don_gia || 0),
          thanh_tien: parseFloat(item.thanh_tien || 0),
          pham_chat: item.pham_chat || "tot",
          so_seri_xuat: item.so_seri_xuat || "",
          ghi_chu: item.ghi_chu || "",
        })),
        // ✅ Helper flag cho frontend hiển thị nút Duyệt
        can_approve:
          // Bước 2 luân chuyển: CẤP 3 BÊN XUẤT (đơn vị tạo PX) duyệt
          (user.role === "user" &&
            user.phong_ban?.cap_bac === 3 &&
            phieuData.trang_thai === "pending_level3_approval" &&
            user.phong_ban_id === phieuData.phong_ban_id) ||
          // Sử dụng nội bộ hoặc bước 1 luân chuyển: admin/manager duyệt khi confirmed
          (["admin", "manager"].includes(user.role) &&
            phieuData.trang_thai === "confirmed" &&
            ["don_vi_su_dung", "don_vi_nhan"].includes(phieuData.loai_xuat)),
      };

      sendResponse(
        res,
        200,
        true,
        "Lấy chi tiết phiếu xuất thành công",
        responseData
      );
    } catch (error) {
      console.error("❌ Get detail phieu xuat error:", error);
      sendResponse(res, 500, false, "Lỗi server", { error: error.message });
    } finally {
      client.release();
    }
  },

  async getPhongBanNhanHang(req, res, query, user) {
    const client = await pool.connect();
    try {
      console.log(
        "🟢 Getting phong ban nhan hang list for user:",
        user.phong_ban_id
      );

      const result = await client.query(
        `
      SELECT 
        id,
        ten_phong_ban,
        ma_phong_ban,
        cap_bac,
        phong_ban_cha_id
      FROM phong_ban 
      WHERE 
        cap_bac = 3  
        AND trang_thai = 'active'
        AND id != $1  -- Loại trừ phòng ban của user hiện tại
      ORDER BY ten_phong_ban
    `,
        [user.phong_ban_id || 0]
      );

      console.log("📋 Found phong ban nhan hang:", result.rows.length);

      sendResponse(
        res,
        200,
        true,
        "Lấy danh sách phòng ban nhận hàng thành công",
        result.rows
      );
    } catch (error) {
      console.error("❌ Error getting phong ban nhan hang:", error);
      sendResponse(res, 500, false, "Lỗi server");
    } finally {
      client.release();
    }
  },

  // ✅ Update tồn kho khi hoàn thành xuất
  async updateTonKhoOnComplete(client, phieuXuatId) {
    try {
      console.log("🔄 Updating ton kho on complete xuat:", phieuXuatId);

      // Lấy thông tin phiếu và chi tiết
      const phieuResult = await client.query(
        "SELECT phong_ban_id FROM phieu_xuat WHERE id = $1",
        [phieuXuatId]
      );

      if (phieuResult.rows.length === 0) return;

      const phongBanId = phieuResult.rows[0].phong_ban_id;

      // Lấy chi tiết xuất
      const chiTietResult = await client.query(
        "SELECT hang_hoa_id, so_luong, pham_chat FROM chi_tiet_xuat WHERE phieu_xuat_id = $1",
        [phieuXuatId]
      );

      // Trừ tồn kho cho từng mặt hàng
      for (const chiTiet of chiTietResult.rows) {
        await client.query(
          `
          INSERT INTO ton_kho (hang_hoa_id, phong_ban_id, so_luong, pham_chat, nguon_gia)
          VALUES ($1, $2, $3, $4, 'xuat_kho')
          ON CONFLICT (hang_hoa_id, phong_ban_id, pham_chat)
          DO UPDATE SET 
            so_luong = ton_kho.so_luong - EXCLUDED.so_luong,
            updated_at = CURRENT_TIMESTAMP`,
          [
            chiTiet.hang_hoa_id,
            phongBanId,
            -Math.abs(parseFloat(chiTiet.so_luong)), // Âm để trừ
            chiTiet.pham_chat || "tot",
          ]
        );
      }

      console.log("✅ Updated ton kho for xuat:", phieuXuatId);
    } catch (error) {
      console.error("❌ Update ton kho error:", error);
      throw error;
    }
  },

  // ✅ Cancel function
  async cancel(req, res, params, user) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { id } = params;

      const phieuResult = await client.query(
        `SELECT px.*, u.ho_ten as nguoi_tao_ten
         FROM phieu_xuat px
         LEFT JOIN users u ON px.nguoi_tao = u.id
         WHERE px.id = $1`,
        [id]
      );

      if (phieuResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
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
        !["draft", "confirmed", "revision_required"].includes(phieu.trang_thai)
      ) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          "Không thể hủy phiếu ở trạng thái hiện tại"
        );
      }

      // Cập nhật trạng thái cancelled (schema không có các cột ly_do_huy/nguoi_huy/ngay_huy)
      await client.query(
        `UPDATE phieu_xuat 
         SET trang_thai = 'cancelled',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id]
      );

      await client.query("COMMIT");

      console.log("✅ Cancelled phieu xuat:", id, "by user:", user.id);
      sendResponse(res, 200, true, "Hủy phiếu xuất thành công");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Cancel xuat error:", error);
      sendResponse(res, 500, false, "Lỗi server");
    } finally {
      client.release();
    }
  },

  // ✅ Check tồn kho function
  // async checkTonKho(req, res, body, user) {
  //   const client = await pool.connect();
  //   try {
  //     const { items, phong_ban_id } = body;

  //     if (!items || !Array.isArray(items)) {
  //       return sendResponse(res, 400, false, "Danh sách hàng hóa không hợp lệ");
  //     }

  //     const results = [];

  //     for (const item of items) {
  //       const tonKhoResult = await client.query(
  //         `
  //         SELECT
  //           COALESCE(SUM(CASE WHEN pham_chat = 'tot' THEN so_luong ELSE 0 END), 0) as ton_kho_tot,
  //           COALESCE(SUM(CASE WHEN pham_chat = 'kem_pham_chat' THEN so_luong ELSE 0 END), 0) as ton_kho_kem,
  //           COALESCE(SUM(so_luong), 0) as tong_ton_kho
  //         FROM ton_kho
  //         WHERE hang_hoa_id = $1 AND phong_ban_id = $2`,
  //         [item.hang_hoa_id, phong_ban_id]
  //       );

  //       const tonKho = tonKhoResult.rows[0];
  //       const soLuongXuat = parseFloat(item.so_luong || 0);

  //       results.push({
  //         hang_hoa_id: item.hang_hoa_id,
  //         so_luong_xuat: soLuongXuat,
  //         ton_kho_tot: parseFloat(tonKho.ton_kho_tot),
  //         ton_kho_kem: parseFloat(tonKho.ton_kho_kem),
  //         tong_ton_kho: parseFloat(tonKho.tong_ton_kho),
  //         du_hang: parseFloat(tonKho.ton_kho_tot) >= soLuongXuat,
  //         canh_bao:
  //           parseFloat(tonKho.ton_kho_tot) < soLuongXuat
  //             ? `Không đủ hàng (còn ${tonKho.ton_kho_tot}, cần ${soLuongXuat})`
  //             : null,
  //       });
  //     }

  //     sendResponse(res, 200, true, "Kiểm tra tồn kho thành công", results);
  //   } catch (error) {
  //     console.error("❌ Check ton kho error:", error);
  //     sendResponse(res, 500, false, "Lỗi server");
  //   } finally {
  //     client.release();
  //   }
  // },

  async checkTonKho(req, res, body, user) {
    const client = await pool.connect();
    try {
      // ✅ XỬ LÝ CẢ 2 FORMAT: mới (items array) và cũ (hang_hoa_id đơn lẻ)
      let itemsToCheck = [];

      if (body.items && Array.isArray(body.items)) {
        // Format mới: { items: [...], phong_ban_id: ... }
        itemsToCheck = body.items;
      } else if (body.hang_hoa_id) {
        // Format cũ: { hang_hoa_id: ..., phong_ban_id: ... }
        itemsToCheck = [
          {
            hang_hoa_id: body.hang_hoa_id,
            so_luong: body.so_luong || 1,
          },
        ];
      } else {
        return sendResponse(res, 400, false, "Danh sách hàng hóa không hợp lệ");
      }

      const phongBanId = body.phong_ban_id || user.phong_ban_id;

      if (!phongBanId) {
        return sendResponse(res, 400, false, "Không xác định được phòng ban");
      }

      const results = [];

      for (const item of itemsToCheck) {
        // Kiểm tra hàng hóa có tồn tại không
        const hangHoaCheck = await client.query(
          "SELECT id, ten_hang_hoa FROM hang_hoa WHERE id = $1",
          [item.hang_hoa_id]
        );

        if (hangHoaCheck.rows.length === 0) {
          results.push({
            hang_hoa_id: item.hang_hoa_id,
            ton_kho: null,
            error: "Hàng hóa không tồn tại",
          });
          continue;
        }

        // Kiểm tra tồn kho thực tế trừ đi số lượng đã có trong các phiếu chưa hoàn thành
        const tonKhoResult = await client.query(
          `
        WITH ton_kho_thuc_te AS (
          SELECT 
            COALESCE(SUM(CASE WHEN pham_chat = 'tot' THEN so_luong ELSE 0 END), 0) as ton_kho_tot,
            COALESCE(SUM(CASE WHEN pham_chat = 'kem_pham_chat' THEN so_luong ELSE 0 END), 0) as ton_kho_kem,
            COALESCE(SUM(so_luong), 0) as tong_ton_kho
          FROM ton_kho 
          WHERE hang_hoa_id = $1 AND phong_ban_id = $2
        ),
        so_luong_da_xuat AS (
          SELECT 
            COALESCE(SUM(CASE WHEN ctx.pham_chat = 'tot' THEN ctx.so_luong ELSE 0 END), 0) as da_xuat_tot,
            COALESCE(SUM(CASE WHEN ctx.pham_chat = 'kem_pham_chat' THEN ctx.so_luong ELSE 0 END), 0) as da_xuat_kem,
            COALESCE(SUM(ctx.so_luong), 0) as tong_da_xuat
          FROM chi_tiet_xuat ctx
          JOIN phieu_xuat px ON ctx.phieu_xuat_id = px.id
          WHERE ctx.hang_hoa_id = $1 
            AND px.phong_ban_id = $2
            AND px.trang_thai IN ('draft', 'confirmed', 'pending_level3_approval', 'approved')
        )
        SELECT 
          tk.ton_kho_tot - COALESCE(sx.da_xuat_tot, 0) as ton_kho_tot,
          tk.ton_kho_kem - COALESCE(sx.da_xuat_kem, 0) as ton_kho_kem,
          tk.tong_ton_kho - COALESCE(sx.tong_da_xuat, 0) as tong_ton_kho
        FROM ton_kho_thuc_te tk
        CROSS JOIN so_luong_da_xuat sx
      `,
          [item.hang_hoa_id, phongBanId]
        );

        const tonKho = tonKhoResult.rows[0];
        const soLuongYeuCau = parseFloat(item.so_luong || 0);

        results.push({
          hang_hoa_id: item.hang_hoa_id,
          so_luong_yeu_cau: soLuongYeuCau,
          ton_kho: {
            so_luong_ton: parseFloat(tonKho.tong_ton_kho),
            ton_kho_tot: parseFloat(tonKho.ton_kho_tot),
            ton_kho_kem: parseFloat(tonKho.ton_kho_kem),
          },
          du_hang: parseFloat(tonKho.ton_kho_tot) >= soLuongYeuCau,
          canh_bao:
            parseFloat(tonKho.ton_kho_tot) < soLuongYeuCau
              ? `Không đủ hàng! Tồn kho chỉ có: ${tonKho.ton_kho_tot}`
              : null,
        });
      }

      // ✅ Format response tương thích với cả 2 cách gọi
      const responseData = body.hang_hoa_id
        ? { ton_kho: results[0]?.ton_kho || { so_luong_ton: 0 } }
        : results;

      sendResponse(res, 200, true, "Kiểm tra tồn kho thành công", responseData);
    } catch (error) {
      console.error("❌ Check ton kho error:", error);
      sendResponse(res, 500, false, "Lỗi server");
    } finally {
      client.release();
    }
  },

  // ✅ TỰ ĐỘNG TẠO PHIẾU NHẬP KHI DUYỆT XUẤT ĐƠN VỊ
  async autoCreatePhieuNhapFromXuat(
    client,
    phieuXuat,
    actorUser,
    options = {}
  ) {
    try {
      const targetStatus = options.status || "draft";

      // Bỏ qua nếu đã liên kết phiếu nhập
      const linkCheck = await client.query(
        "SELECT phieu_nhap_lien_ket_id FROM phieu_xuat WHERE id = $1",
        [phieuXuat.id]
      );
      if (linkCheck.rows.length && linkCheck.rows[0].phieu_nhap_lien_ket_id) {
        return;
      }
      // Lấy thông tin đơn vị nhận
      let donViNhan = null;
      if (phieuXuat.don_vi_nhan_id) {
        const donViNhanResult = await client.query(
          "SELECT * FROM don_vi_nhan WHERE id = $1",
          [phieuXuat.don_vi_nhan_id]
        );
        donViNhan = donViNhanResult.rows[0] || null;
      }

      // Tìm phòng ban tương ứng của đơn vị nhận (nếu là nội bộ)
      let phongBanNhanId = phieuXuat.phong_ban_nhan_id || null;
      console.log("🔍 Debug phongBanNhanId:", {
        phieuXuat_phong_ban_nhan_id: phieuXuat.phong_ban_nhan_id,
        donViNhan: donViNhan,
        phongBanNhanId: phongBanNhanId,
      });

      if (
        !phongBanNhanId &&
        donViNhan &&
        donViNhan.is_noi_bo &&
        donViNhan.phong_ban_id
      ) {
        phongBanNhanId = donViNhan.phong_ban_id;
        console.log("✅ Set phongBanNhanId from donViNhan:", phongBanNhanId);
      }

      // Tạo số phiếu nhập tự động
      const soPhieuNhap = await this.generateSoPhieu(client, "nhap");

      // Xác định user tạo phù hợp với phòng ban nhận để qua trigger check_permission_phong_ban
      let creatorUserId = actorUser.id;
      if (phongBanNhanId) {
        const receiverUser = await client.query(
          "SELECT id FROM users WHERE phong_ban_id = $1 AND trang_thai = 'active' LIMIT 1",
          [phongBanNhanId]
        );
        if (receiverUser.rows.length > 0) {
          creatorUserId = receiverUser.rows[0].id;
        } else {
          // Fallback: lấy một admin bất kỳ
          const adminUser = await client.query(
            "SELECT id FROM users WHERE role = 'admin' AND trang_thai = 'active' LIMIT 1"
          );
          if (adminUser.rows.length > 0) {
            creatorUserId = adminUser.rows[0].id;
          }
        }
      }

      // Tạo phiếu nhập
      const phieuNhapResult = await client.query(
        `INSERT INTO phieu_nhap (
          so_phieu, ngay_nhap, ly_do_nhap, loai_phieu,
          trang_thai, nguoi_tao, phong_ban_id, phong_ban_cung_cap_id,
          phieu_xuat_lien_ket_id, is_tu_dong, tong_tien,
          nguoi_giao_hang, nguoi_nhap_hang, ngay_gui_duyet
        ) VALUES (
          $1, CURRENT_DATE, $2, 'dieu_chuyen',
          $3, $4, $5, $6, $7, true, $8, $9, $10, $11
        ) RETURNING id`,
        [
          soPhieuNhap, // $1 so_phieu
          `Nhập hàng từ phiếu xuất ${phieuXuat.so_phieu}`, // $2 ly_do_nhap
          targetStatus, // $3 trang_thai ban đầu
          creatorUserId, // $4 nguoi_tao
          phongBanNhanId, // $5 phong_ban_id (phòng ban nhận)
          phieuXuat.phong_ban_id, // $6 phong_ban_cung_cap_id (phòng ban xuất)
          phieuXuat.id, // $7 phieu_xuat_lien_ket_id
          phieuXuat.tong_tien || 0, // $8 tong_tien
          phieuXuat.nguoi_giao_hang || "Hệ thống", // $9 nguoi_giao_hang
          donViNhan && donViNhan.nguoi_lien_he
            ? donViNhan.nguoi_lien_he
            : "Đơn vị nhận", // $10 nguoi_nhap_hang
          targetStatus === "pending_level3_approval" ? new Date() : null, // $11 ngay_gui_duyet
        ]
      );

      const phieuNhapId = phieuNhapResult.rows[0].id;

      // Sao chép chi tiết từ phiếu xuất sang phiếu nhập
      const chiTietXuatResult = await client.query(
        "SELECT * FROM chi_tiet_xuat WHERE phieu_xuat_id = $1",
        [phieuXuat.id]
      );

      for (const chiTiet of chiTietXuatResult.rows) {
        await client.query(
          `INSERT INTO chi_tiet_nhap (
            phieu_nhap_id, hang_hoa_id, so_luong, don_gia, 
            thanh_tien, pham_chat, so_seri_list
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            phieuNhapId,
            chiTiet.hang_hoa_id,
            chiTiet.so_luong_thuc_xuat,
            chiTiet.don_gia,
            chiTiet.thanh_tien,
            chiTiet.pham_chat,
            chiTiet.so_seri_xuat,
          ]
        );
      }

      // Cập nhật trạng thái phiếu nhập vừa tạo và link ngược
      await client.query(
        `UPDATE phieu_nhap 
         SET trang_thai = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [targetStatus, phieuNhapId]
      );

      await client.query(
        "UPDATE phieu_xuat SET phieu_nhap_lien_ket_id = $1 WHERE id = $2",
        [phieuNhapId, phieuXuat.id]
      );

      // ✅ THÔNG BÁO CHO ĐƠN VỊ NHẬN
      if (phongBanNhanId) {
        // Tìm user của phòng ban nhận
        const usersResult = await client.query(
          "SELECT id FROM users WHERE phong_ban_id = $1 AND trang_thai = 'active' LIMIT 1",
          [phongBanNhanId]
        );

        if (usersResult.rows.length > 0) {
          await client.query(
            `INSERT INTO notifications (
              nguoi_nhan, loai_thong_bao, tieu_de, noi_dung, phieu_id, url_redirect, metadata, trang_thai
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'unread')`,
            [
              usersResult.rows[0].id,
              targetStatus === "pending_level3_approval"
                ? "phieu_nhap_can_duyet"
                : "system",
              targetStatus === "pending_level3_approval"
                ? "Phiếu nhập cần duyệt"
                : "Phiếu nhập được tạo",
              `Phiếu nhập ${soPhieuNhap} được tạo tự động từ phiếu xuất ${phieuXuat.so_phieu}`,
              phieuNhapId,
              targetStatus === "pending_level3_approval"
                ? "/nhap-kho?tab=cho_duyet"
                : "/nhap-kho?tab=tat_ca",
              JSON.stringify({
                phieu_id: phieuNhapId,
                linked_from: phieuXuat.id,
              }),
            ]
          );
        }
      }

      console.log(
        "✅ Auto created phieu nhap:",
        phieuNhapId,
        "from xuat:",
        phieuXuat.id
      );
    } catch (error) {
      console.error("❌ Auto create phieu nhap error:", error);
      // Không throw để không crash main process
    }
  },

  // Helper function tạo số phiếu
  async generateSoPhieu(client, loai) {
    const prefix = loai === "nhap" ? "PN" : "PX";
    const today = new Date();
    const dateStr = today.toISOString().slice(2, 10).replace(/-/g, "");

    const result = await client.query(
      `SELECT COUNT(*) as count FROM phieu_${loai} WHERE so_phieu LIKE $1`,
      [`${prefix}${dateStr}%`]
    );

    const count = parseInt(result.rows[0].count) + 1;
    return `${prefix}${dateStr}${count.toString().padStart(3, "0")}`;
  },

  async submit(req, res, params, user) {
    const { id } = params;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Lấy thông tin phiếu
      const phieuResult = await client.query(
        `
        SELECT px.*, pb.cap_bac, pb.ten_phong_ban,
               pb_nhan.id as phong_ban_nhan_id, pb_nhan.ten_phong_ban as phong_ban_nhan_ten
        FROM phieu_xuat px 
        LEFT JOIN phong_ban pb ON px.phong_ban_id = pb.id
        LEFT JOIN phong_ban pb_nhan ON px.phong_ban_nhan_id = pb_nhan.id
        WHERE px.id = $1
      `,
        [id]
      );

      if (phieuResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
      }

      const phieu = phieuResult.rows[0];

      // Kiểm tra quyền submit
      if (phieu.nguoi_tao !== user.id) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          403,
          false,
          "Chỉ người tạo phiếu mới có thể gửi duyệt"
        );
      }

      // Kiểm tra trạng thái
      if (!["draft", "revision_required"].includes(phieu.trang_thai)) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          "Phiếu không ở trạng thái có thể gửi"
        );
      }

      // ✅ KIỂM TRA TỒN KHO TRƯỚC KHI GỬI
      const chiTietResult = await client.query(
        "SELECT * FROM chi_tiet_xuat WHERE phieu_xuat_id = $1",
        [id]
      );

      const stockCheckResults = [];
      let hasInsufficientStock = false;

      for (const chiTiet of chiTietResult.rows) {
        const tonKhoResult = await client.query(
          `
          SELECT COALESCE(SUM(sl_tot), 0) as ton_kho_tot
          FROM ton_kho 
          WHERE hang_hoa_id = $1 AND phong_ban_id = $2
        `,
          [chiTiet.hang_hoa_id, phieu.phong_ban_id]
        );

        const tonKho = parseFloat(tonKhoResult.rows[0]?.ton_kho_tot || 0);
        const soLuongXuat = parseFloat(chiTiet.so_luong_yeu_cau || 0);

        stockCheckResults.push({
          hang_hoa_id: chiTiet.hang_hoa_id,
          so_luong_xuat: soLuongXuat,
          ton_kho: tonKho,
          du_hang: tonKho >= soLuongXuat,
        });

        if (tonKho < soLuongXuat) {
          hasInsufficientStock = true;
        }
      }

      if (hasInsufficientStock) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          "Không đủ hàng trong kho để xuất",
          { stock_check: stockCheckResults }
        );
      }

      // ✅ WORKFLOW PHÂN BIỆT THEO LOẠI PHIẾU: Xác định trạng thái tiếp theo
      let trangThaiMoi;
      let message;

      if (phieu.loai_xuat === "don_vi_nhan") {
        // 🔥 ĐIỀU CHUYỂN: Gửi đến Admin/Cấp 2 duyệt trước (workflow 2 bước)
        trangThaiMoi = "confirmed";
        message = "Đã gửi cho Admin/Cấp 2 duyệt điều chuyển";
      } else if (phieu.loai_xuat === "don_vi_su_dung") {
        // 🔥 SỬ DỤNG NỘI BỘ: Gửi confirmed để Admin/Cấp 2 duyệt 1 lần là xong (đơn vị nhận là chính nó)
        trangThaiMoi = "confirmed";
        message = "Đã gửi cho Admin/Cấp 2 duyệt (1 lần là xong)";
      } else {
        // Fallback
        trangThaiMoi = "confirmed";
        message = "Đã gửi phiếu để duyệt";
      }

      // ✅ CẬP NHẬT TRẠNG THÁI
      await client.query(
        `
        UPDATE phieu_xuat 
        SET trang_thai = $1, 
            ngay_gui_duyet = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `,
        [trangThaiMoi, id]
      );

      // ✅ TẠO THÔNG BÁO CHO ADMIN (chỉ admin theo quy trình mới)
      await this.createNotificationForSubmit(client, phieu, user);

      // ❌ Không tạo phiếu nhập tại thời điểm gửi duyệt. Chỉ tạo sau khi duyệt.

      await client.query("COMMIT");

      sendResponse(res, 200, true, message, { trang_thai: "confirmed" });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Submit phieu xuat error:", error);
      sendResponse(res, 500, false, "Lỗi server");
    } finally {
      client.release();
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

  // ✅ APPROVE - DUYỆT PHIẾU (WORKFLOW MỚI - CHỈ 1 DUYỆT)
  async approve(req, res, params, user) {
    const { id } = params;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Lấy thông tin phiếu
      const phieuResult = await client.query(
        `
        SELECT px.*, pb.cap_bac, pb.ten_phong_ban,
               pb_nhan.id as phong_ban_nhan_id, pb_nhan.ten_phong_ban as phong_ban_nhan_ten,
               dvn.ten_don_vi as don_vi_nhan_ten
        FROM phieu_xuat px 
        LEFT JOIN phong_ban pb ON px.phong_ban_id = pb.id
        LEFT JOIN phong_ban pb_nhan ON px.phong_ban_nhan_id = pb_nhan.id
        LEFT JOIN don_vi_nhan dvn ON px.don_vi_nhan_id = dvn.id
        WHERE px.id = $1
      `,
        [id]
      );

      if (phieuResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
      }

      const phieu = phieuResult.rows[0];

      // ✅ LOGIC DUYỆT THEO LOẠI XUẤT - 2 BƯỚC CHO DON_VI_NHAN
      let step = null; // 'internal_approve' | 'exporter_step1' | 'receiver_step2'
      let approvalMessage = "";

      if (phieu.loai_xuat === "don_vi_su_dung") {
        // Admin hoặc Manager cấp 2 quản lý duyệt khi đang confirmed
        if (phieu.trang_thai === "confirmed") {
          if (user.role === "admin") {
            step = "internal_approve";
            approvalMessage = "Admin duyệt phiếu xuất sử dụng";
          } else if (user.role === "manager" && user.phong_ban?.cap_bac === 2) {
            const isManagingDepartment = await client.query(
              `SELECT 1 FROM phong_ban pb WHERE pb.phong_ban_cha_id = $1 AND pb.id = $2`,
              [user.phong_ban_id, phieu.phong_ban_id]
            );
            if (isManagingDepartment.rows.length > 0) {
              step = "internal_approve";
              approvalMessage = "Manager cấp 2 duyệt phiếu xuất sử dụng";
            }
          }
        }
      } else if (phieu.loai_xuat === "don_vi_nhan") {
        // ✅ WORKFLOW ĐIỀU CHUYỂN: Admin/Manager duyệt → Tạo phiếu nhập tự động cho bên kia (workflow 2 bước)
        if (
          ["admin", "manager"].includes(user.role) &&
          phieu.trang_thai === "confirmed"
        ) {
          step = "exporter_step1";
          approvalMessage =
            "Đã duyệt để luân chuyển (tạo phiếu nhập cho bên kia)";
        }
        // Bước 2: Cấp 3 BÊN XUẤT (đơn vị 3B) duyệt khi pending_level3_approval
        if (
          user.role === "user" &&
          user.phong_ban?.cap_bac === 3 &&
          user.phong_ban_id === phieu.phong_ban_id &&
          phieu.trang_thai === "pending_level3_approval"
        ) {
          step = "exporter_step2";
          approvalMessage = `${
            phieu.ten_phong_ban || "Đơn vị xuất"
          } duyệt luân chuyển cho đơn vị nhận`;
        }
      } else if (phieu.loai_xuat === "don_vi_su_dung") {
        // ✅ WORKFLOW SỬ DỤNG NỘI BỘ: Admin/Manager duyệt 1 lần là xong (đơn vị nhận là chính nó)
        if (
          ["admin", "manager"].includes(user.role) &&
          phieu.trang_thai === "confirmed"
        ) {
          step = "internal_approve";
          approvalMessage =
            "Admin/Cấp 2 duyệt phiếu xuất sử dụng nội bộ (1 lần là xong)";
        }
      }

      if (!step) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          403,
          false,
          "Bạn không có quyền duyệt ở bước hiện tại"
        );
      }

      // ✅ KIỂM TRA TỒN KHO LẦN CUỐI TRƯỚC KHI DUYỆT
      const chiTietResult = await client.query(
        "SELECT * FROM chi_tiet_xuat WHERE phieu_xuat_id = $1",
        [id]
      );

      for (const chiTiet of chiTietResult.rows) {
        const tonKhoResult = await client.query(
          `
          SELECT COALESCE(SUM(sl_tot), 0) as ton_kho_tot
          FROM ton_kho 
          WHERE hang_hoa_id = $1 AND phong_ban_id = $2
        `,
          [chiTiet.hang_hoa_id, phieu.phong_ban_id]
        );

        const tonKho = parseFloat(tonKhoResult.rows[0]?.ton_kho_tot || 0);
        const soLuongXuat = parseFloat(chiTiet.so_luong_yeu_cau || 0);

        if (tonKho < soLuongXuat) {
          await client.query("ROLLBACK");
          return sendResponse(
            res,
            400,
            false,
            `Không đủ hàng để xuất! Hàng hóa ID ${chiTiet.hang_hoa_id} chỉ có ${tonKho}, cần ${soLuongXuat}`
          );
        }
      }

      if (step === "internal_approve") {
        // ✅ WORKFLOW SỬ DỤNG NỘI BỘ: Một lần duyệt: chuyển thẳng approved (đơn vị nhận là chính nó)
        await client.query(
          `UPDATE phieu_xuat SET trang_thai = 'approved', nguoi_duyet_cap1 = $1, ngay_duyet_cap1 = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [user.id, id]
        );
        await this.createNotificationForApprove(client, phieu, user);
      } else if (step === "exporter_step1") {
        // ✅ WORKFLOW ĐIỀU CHUYỂN: Bước 1: chuyển sang pending_level3_approval và tạo PN chờ duyệt cho 3B
        const upd = await client.query(
          `UPDATE phieu_xuat 
           SET trang_thai = 'pending_level3_approval', 
               updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1 
           RETURNING trang_thai`,
          [id]
        );
        if (
          upd.rowCount !== 1 ||
          upd.rows[0]?.trang_thai !== "pending_level3_approval"
        ) {
          await client.query("ROLLBACK");
          return sendResponse(
            res,
            500,
            false,
            "Không thể cập nhật trạng thái sang pending_level3_approval"
          );
        }
        // Tạo phiếu nhập liên kết cho 3B trong SAVEPOINT để không làm hỏng cập nhật trạng thái
        await client.query("SAVEPOINT sp_auto_pn");
        try {
          await this.autoCreatePhieuNhapFromXuat(client, phieu, user, {
            status: "pending_level3_approval",
          });
          await client.query("RELEASE SAVEPOINT sp_auto_pn");
        } catch (autoErr) {
          console.error(
            "❌ Auto-create PN failed, keep status change:",
            autoErr
          );
          await client.query("ROLLBACK TO SAVEPOINT sp_auto_pn");
          // Không throw để giữ nguyên trạng thái phiếu xuất đã cập nhật
        }

        // Re-read to verify persisted value
        const check = await client.query(
          `SELECT trang_thai FROM phieu_xuat WHERE id = $1`,
          [id]
        );
        const persisted = check.rows[0]?.trang_thai;
        if (persisted !== "pending_level3_approval") {
          await client.query("ROLLBACK");
          return sendResponse(
            res,
            500,
            false,
            `Trạng thái không được lưu (hiện tại: ${persisted || "null"})`
          );
        }
      } else if (step === "exporter_step2") {
        // ✅ WORKFLOW ĐIỀU CHUYỂN: Đồng bộ cả 2 phiếu khi cấp 3 duyệt
        await this.handleLevel3DieuChuyenApproval(client, phieu, user);
        await this.createNotificationForApprove(client, phieu, user);
      }

      await client.query("COMMIT");

      console.log(
        "✅ Approved/Processed phieu xuat:",
        id,
        "by",
        user.role,
        user.id,
        "step:",
        step
      );
      const respTrangThai =
        step === "exporter_step1" ? "pending_level3_approval" : "approved";
      sendResponse(res, 200, true, approvalMessage, {
        trang_thai: respTrangThai,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Approve xuat error:", error);
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

      // 1. Cập nhật phiếu xuất sang approved
      await client.query(
        `UPDATE phieu_xuat
         SET trang_thai = 'approved',
             nguoi_duyet_cap1 = $1,
             ngay_duyet_cap1 = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [user.id, phieu.id]
      );

      // 2. Cập nhật phiếu nhập liên kết sang approved
      if (phieu.phieu_nhap_lien_ket_id) {
        await client.query(
          `UPDATE phieu_nhap
           SET trang_thai = 'approved',
               nguoi_duyet_cap1 = $1,
               ngay_duyet_cap1 = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [user.id, phieu.phieu_nhap_lien_ket_id]
        );

        // Thông báo cho người tạo phiếu nhập
        const ownerResult = await client.query(
          `SELECT nguoi_tao, so_phieu FROM phieu_nhap WHERE id = $1`,
          [phieu.phieu_nhap_lien_ket_id]
        );

        if (ownerResult.rows.length > 0) {
          await client.query(
            `INSERT INTO notifications (nguoi_nhan, loai_thong_bao, tieu_de, noi_dung, phieu_id, url_redirect, trang_thai)
             VALUES ($1, 'phieu_nhap_duyet', $2, $3, $4, '/nhap-kho?tab=da_duyet', 'unread')`,
            [
              ownerResult.rows[0].nguoi_tao,
              "Phiếu nhập đã được duyệt",
              `Phiếu nhập ${ownerResult.rows[0].so_phieu} đã được duyệt đồng bộ với phiếu xuất`,
              phieu.phieu_nhap_lien_ket_id,
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

  // ✅ REQUEST REVISION - YÊU CẦU CHỈNH SỬA
  async requestRevision(req, res, params, body, user) {
    const { id } = params;
    const { ghi_chu_phan_hoi } = body;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

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

      // Kiểm tra quyền - chỉ admin/manager
      if (!["admin", "manager"].includes(user.role)) {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          403,
          false,
          "Không có quyền yêu cầu chỉnh sửa"
        );
      }

      // Kiểm tra trạng thái
      if (phieu.trang_thai !== "confirmed") {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          "Chỉ có thể yêu cầu chỉnh sửa phiếu đã gửi duyệt"
        );
      }

      // ✅ WORKFLOW PHÂN BIỆT THEO LOẠI PHIẾU: Xử lý yêu cầu sửa
      if (phieu.loai_xuat === "don_vi_nhan") {
        // 🔥 ĐIỀU CHUYỂN: Đồng bộ cả 2 phiếu khi yêu cầu sửa
        await this.handleDieuChuyenRevision(
          client,
          phieu,
          user,
          ghi_chu_phan_hoi
        );
      } else {
        // 🔥 SỬ DỤNG NỘI BỘ: Chỉ cập nhật phiếu xuất (không có phiếu liên kết)
        await client.query(
          `UPDATE phieu_xuat
           SET trang_thai = 'revision_required',
               ghi_chu_phan_hoi = $1,
               nguoi_phan_hoi = $2,
               ngay_phan_hoi = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [ghi_chu_phan_hoi, user.id, phieu.id]
        );
      }

      // Tạo thông báo cho người tạo phiếu
      await client.query(
        `
        INSERT INTO thong_bao (
          tieu_de, noi_dung, loai_thong_bao, 
          nguoi_nhan, trang_thai, created_at
        ) VALUES ($1, $2, $3, $4, 'unread', CURRENT_TIMESTAMP)
      `,
        [
          "Phiếu xuất cần chỉnh sửa",
          `Phiếu xuất ${phieu.so_phieu} cần chỉnh sửa: ${ghi_chu_phan_hoi}`,
          "phieu_xuat_can_sua",
          phieu.nguoi_tao,
        ]
      );

      await client.query("COMMIT");

      sendResponse(res, 200, true, "Đã yêu cầu chỉnh sửa phiếu xuất", {
        trang_thai: "revision_required",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Request revision xuat error:", error);
      sendResponse(res, 500, false, "Lỗi server");
    } finally {
      client.release();
    }
  },

  // ✅ Xử lý yêu cầu sửa cho điều chuyển - đồng bộ cả 2 phiếu
  async handleDieuChuyenRevision(client, phieu, user, ghiChu) {
    try {
      console.log("🔄 Handling dieu chuyen revision for phieu:", phieu.id);

      // 1. Cập nhật phiếu xuất sang revision_required
      await client.query(
        `UPDATE phieu_xuat
         SET trang_thai = 'revision_required',
             ghi_chu_phan_hoi = $1,
             nguoi_phan_hoi = $2,
             ngay_phan_hoi = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [ghiChu, user.id, phieu.id]
      );

      // 2. Cập nhật phiếu nhập liên kết sang revision_required
      if (phieu.phieu_nhap_lien_ket_id) {
        await client.query(
          `UPDATE phieu_nhap
           SET trang_thai = 'revision_required',
               ghi_chu_phan_hoi = $1,
               nguoi_phan_hoi = $2,
               ngay_phan_hoi = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [ghiChu, user.id, phieu.phieu_nhap_lien_ket_id]
        );

        // Thông báo cho người tạo phiếu nhập
        const ownerResult = await client.query(
          `SELECT nguoi_tao, so_phieu FROM phieu_nhap WHERE id = $1`,
          [phieu.phieu_nhap_lien_ket_id]
        );

        if (ownerResult.rows.length > 0) {
          await client.query(
            `INSERT INTO notifications (nguoi_nhan, loai_thong_bao, tieu_de, noi_dung, phieu_id, url_redirect, trang_thai)
             VALUES ($1, 'phieu_nhap_can_sua', $2, $3, $4, '/nhap-kho?tab=can_sua', 'unread')`,
            [
              ownerResult.rows[0].nguoi_tao,
              "Phiếu nhập cần chỉnh sửa",
              `Phiếu nhập ${ownerResult.rows[0].so_phieu} cần chỉnh sửa theo yêu cầu từ bên xuất: ${ghiChu}`,
              phieu.phieu_nhap_lien_ket_id,
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

  // ✅ COMPLETE - HOÀN THÀNH PHIẾU
  async complete(req, res, params, user) {
    const { id } = params;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const phieuResult = await client.query(
        "SELECT * FROM phieu_xuat WHERE id = $1",
        [id]
      );

      if (phieuResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return sendResponse(res, 404, false, "Không tìm thấy phiếu xuất");
      }

      const phieu = phieuResult.rows[0];

      // Kiểm tra quyền - admin/manager hoặc chủ sở hữu phiếu
      const isAdmin = user.role === "admin";
      const isManager = user.role === "manager";
      const isOwner = phieu.nguoi_tao === user.id;

      if (!(isAdmin || isManager || isOwner)) {
        await client.query("ROLLBACK");
        return sendResponse(res, 403, false, "Không có quyền hoàn thành phiếu");
      }

      // Kiểm tra trạng thái
      if (phieu.trang_thai !== "approved") {
        await client.query("ROLLBACK");
        return sendResponse(
          res,
          400,
          false,
          "Chỉ có thể hoàn thành phiếu đã được duyệt"
        );
      }

      // Cập nhật trạng thái
      await client.query(
        `
        UPDATE phieu_xuat 
        SET trang_thai = 'completed',
          
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
        [id]
      );

      await client.query("COMMIT");

      sendResponse(res, 200, true, "Hoàn thành phiếu xuất thành công", {
        trang_thai: "completed",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Complete xuat error:", error);
      sendResponse(res, 500, false, "Lỗi server");
    } finally {
      client.release();
    }
  },

  // ✅ TẠO THÔNG BÁO KHI SUBMIT
  async createNotificationForSubmit(client, phieu, user) {
    try {
      let notifications = [];

      // Quy trình mới: khi submit chỉ gửi cho ADMIN, không gửi cho 3B nhận tới khi đã duyệt
      if (["don_vi_su_dung", "don_vi_nhan"].includes(phieu.loai_xuat)) {
        const adminsResult = await client.query(
          `SELECT id FROM users WHERE role = 'admin' AND trang_thai = 'active'`
        );
        notifications = adminsResult.rows.map((row) => ({
          tieu_de:
            phieu.loai_xuat === "don_vi_su_dung"
              ? "Phiếu xuất sử dụng cần duyệt"
              : "Phiếu xuất đơn vị cần duyệt",
          noi_dung: `Phiếu ${phieu.so_phieu} từ ${phieu.ten_phong_ban} cần duyệt`,
          nguoi_nhan: row.id,
        }));
      }

      // Tạo thông báo vào bảng notifications (chuẩn hoá URL theo tab)
      for (const notification of notifications) {
        await client.query(
          `
          INSERT INTO notifications (
            nguoi_nhan, loai_thong_bao, tieu_de, noi_dung,
            phieu_id, url_redirect, metadata, trang_thai
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'unread')
        `,
          [
            notification.nguoi_nhan,
            "phieu_xuat_can_duyet",
            notification.tieu_de,
            notification.noi_dung,
            phieu.id,
            `/xuat-kho?tab=cho_duyet&highlight=${phieu.id}`,
            JSON.stringify({
              phieu_id: phieu.id,
              so_phieu: phieu.so_phieu,
              action: "submit",
            }),
          ]
        );
      }
    } catch (error) {
      console.error("❌ Error creating notification for submit:", error);
    }
  },

  // ✅ TẠO THÔNG BÁO KHI APPROVE
  async createNotificationForApprove(client, phieu, user) {
    try {
      const tieuDe = "Phiếu xuất đã được duyệt";
      const noiDung =
        phieu.loai_xuat === "don_vi_nhan"
          ? `Phiếu xuất ${phieu.so_phieu} đã được ${
              phieu.phong_ban_nhan_ten || "đơn vị nhận"
            } duyệt nhận`
          : `Phiếu xuất ${phieu.so_phieu} đã được duyệt bởi ${user.ho_ten}`;

      await client.query(
        `
        INSERT INTO notifications (
          nguoi_nhan, loai_thong_bao, tieu_de, noi_dung,
          phieu_id, url_redirect, metadata, trang_thai
        ) VALUES ($1, 'phieu_xuat_duyet', $2, $3, $4, $5, $6, 'unread')
      `,
        [
          phieu.nguoi_tao,
          tieuDe,
          noiDung,
          phieu.id,
          "/xuat-kho?tab=da_duyet",
          JSON.stringify({
            phieu_id: phieu.id,
            so_phieu: phieu.so_phieu,
            action: "approved",
          }),
        ]
      );
    } catch (error) {
      console.error("❌ Error creating notification for approve:", error);
    }
  },

  // ✅ THÊM API CHO DROPDOWN CẤP 2/3
  async getPhongBanCap2List(req, res, query, user) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT id, ma_phong_ban, ten_phong_ban, cap_bac, phong_ban_cha_id
        FROM phong_ban 
        WHERE cap_bac = 2 
        AND trang_thai = 'active'
        ORDER BY ten_phong_ban
      `);

      sendResponse(
        res,
        200,
        true,
        "Lấy danh sách cấp 2 thành công",
        result.rows
      );
    } catch (error) {
      console.error("❌ Get phong ban cap 2 error:", error);
      sendResponse(res, 500, false, "Lỗi server");
    } finally {
      client.release();
    }
  },

  async getPhongBanCap3ByParent(req, res, params, user) {
    const client = await pool.connect();
    try {
      const { cap2Id } = params;

      const result = await client.query(
        `
        SELECT id, ma_phong_ban, ten_phong_ban, cap_bac, phong_ban_cha_id
        FROM phong_ban 
        WHERE cap_bac = 3 
        AND phong_ban_cha_id = $1
        AND trang_thai = 'active'
        ORDER BY ten_phong_ban
      `,
        [cap2Id]
      );

      sendResponse(
        res,
        200,
        true,
        "Lấy danh sách cấp 3 thành công",
        result.rows
      );
    } catch (error) {
      console.error("❌ Get phong ban cap 3 by parent error:", error);
      sendResponse(res, 500, false, "Lỗi server");
    } finally {
      client.release();
    }
  },
};

module.exports = xuatKhoController;
