-- =============================================
-- CẬP NHẬT DATABASE CHO WORKFLOW XUẤT KHO MỚI
-- =============================================

BEGIN;

-- ✅ 1. THÊM CÁC CỘT CẦN THIẾT CHO WORKFLOW MỚI
ALTER TABLE phieu_xuat ADD COLUMN IF NOT EXISTS nguoi_phan_hoi INTEGER REFERENCES users(id);
ALTER TABLE phieu_xuat ADD COLUMN IF NOT EXISTS ngay_phan_hoi TIMESTAMP WITH TIME ZONE;
ALTER TABLE phieu_xuat ADD COLUMN IF NOT EXISTS ghi_chu_phan_hoi TEXT;

-- Đảm bảo có đủ cột cho phiếu nhập liên kết
ALTER TABLE phieu_xuat ADD COLUMN IF NOT EXISTS phieu_nhap_lien_ket_id INTEGER REFERENCES phieu_nhap(id);
ALTER TABLE phieu_nhap ADD COLUMN IF NOT EXISTS phieu_xuat_lien_ket_id INTEGER REFERENCES phieu_xuat(id);

-- ✅ 2. THÊM CỘT PHÒNG BAN NHẬN CHO XUẤT LUÂN CHUYỂN NỘI BỘ
ALTER TABLE phieu_xuat ADD COLUMN IF NOT EXISTS phong_ban_nhan_id INTEGER REFERENCES phong_ban(id);

-- ✅ 3. ĐẢM BẢO CÓ ĐỦ ENUM VALUES
DO $$
BEGIN
    -- Enum loại xuất
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'don_vi_su_dung' AND enumtypid = 'loai_xuat'::regtype) THEN
        ALTER TYPE loai_xuat ADD VALUE 'don_vi_su_dung';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'don_vi_nhan' AND enumtypid = 'loai_xuat'::regtype) THEN
        ALTER TYPE loai_xuat ADD VALUE 'don_vi_nhan';
    END IF;
    
    -- Enum loại phiếu nhập
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'dieu_chuyen' AND enumtypid = 'loai_phieu_nhap'::regtype) THEN
        ALTER TYPE loai_phieu_nhap ADD VALUE 'dieu_chuyen';
    END IF;
END $$;

-- ✅ 4. XÓA CÁC TRIGGER CŨ KHÔNG PHÙHỢP
DROP TRIGGER IF EXISTS auto_create_phieu_xuat_dieu_chuyen ON phieu_nhap;
DROP TRIGGER IF EXISTS auto_create_phieu_xuat_when_approved ON phieu_nhap;
DROP TRIGGER IF EXISTS auto_create_phieu_nhap_when_xuat_approved ON phieu_xuat;
DROP FUNCTION IF EXISTS auto_create_phieu_xuat_dieu_chuyen() CASCADE;
DROP FUNCTION IF EXISTS auto_create_phieu_xuat_when_approved() CASCADE;
DROP FUNCTION IF EXISTS auto_create_phieu_nhap_when_xuat_approved() CASCADE;

-- ✅ 5. TẠO FUNCTION TỰ ĐỘNG TẠO PHIẾU NHẬP KHI DUYỆT XUẤT ĐƠN VỊ
CREATE OR REPLACE FUNCTION auto_create_phieu_nhap_from_xuat()
RETURNS TRIGGER AS $$
DECLARE
    v_so_phieu_nhap TEXT;
    v_phieu_nhap_id INTEGER;
    v_date_str TEXT;
    v_max_seq INTEGER;
    v_nha_cung_cap_id INTEGER;
BEGIN
    -- Chỉ tạo phiếu nhập khi:
    -- 1. Phiếu xuất đơn vị được duyệt (confirmed -> approved)
    -- 2. Có phòng ban nhận (xuất nội bộ)
    IF NEW.loai_xuat = 'don_vi_nhan' 
       AND OLD.trang_thai = 'confirmed' 
       AND NEW.trang_thai = 'approved'
       AND NEW.phong_ban_nhan_id IS NOT NULL THEN
        
        -- Tạo số phiếu nhập
        v_date_str := TO_CHAR(NEW.ngay_xuat, 'YYYYMMDD');
        
        SELECT COALESCE(MAX(CAST(SUBSTRING(so_phieu FROM 11) AS INTEGER)), 0) + 1
        INTO v_max_seq
        FROM phieu_nhap 
        WHERE so_phieu LIKE 'PN' || v_date_str || '%';
        
        v_so_phieu_nhap := 'PN' || v_date_str || LPAD(v_max_seq::TEXT, 3, '0');
        
        -- Tìm hoặc tạo nhà cung cấp nội bộ cho phòng ban xuất
        SELECT id INTO v_nha_cung_cap_id
        FROM nha_cung_cap 
        WHERE is_noi_bo = TRUE AND phong_ban_id = NEW.phong_ban_id;
        
        IF v_nha_cung_cap_id IS NULL THEN
            INSERT INTO nha_cung_cap (
                ten_ncc, is_noi_bo, phong_ban_id, dia_chi, 
                trang_thai, created_at
            ) VALUES (
                (SELECT ten_phong_ban FROM phong_ban WHERE id = NEW.phong_ban_id),
                TRUE, NEW.phong_ban_id, 'Đơn vị nội bộ',
                'active', CURRENT_TIMESTAMP
            ) RETURNING id INTO v_nha_cung_cap_id;
        END IF;
        
        -- Tạo phiếu nhập
        INSERT INTO phieu_nhap (
            so_phieu, ngay_nhap, phong_ban_id, nha_cung_cap_id,
            nguoi_nhap_hang, nguoi_giao_hang, ly_do_nhap, loai_phieu,
            trang_thai, nguoi_tao, nguoi_duyet, so_quyet_dinh,
            phieu_xuat_lien_ket_id, is_tu_dong, tong_tien,
            ngay_duyet, ghi_chu, created_at
        ) VALUES (
            v_so_phieu_nhap,
            NEW.ngay_xuat,
            NEW.phong_ban_nhan_id,  -- Phòng ban nhận hàng
            v_nha_cung_cap_id,      -- Nhà cung cấp nội bộ
            'Tự động',
            NEW.nguoi_giao_hang,
            'Luân chuyển từ ' || (SELECT ten_phong_ban FROM phong_ban WHERE id = NEW.phong_ban_id),
            'dieu_chuyen',
            'approved',             -- Tự động approved
            NEW.nguoi_duyet,        -- Người duyệt xuất làm người tạo nhập
            NEW.nguoi_duyet,        -- Người duyệt xuất làm người duyệt nhập
            NEW.so_quyet_dinh,
            NEW.id,                 -- Liên kết với phiếu xuất
            TRUE,                   -- Đánh dấu tự động
            NEW.tong_tien,
            CURRENT_TIMESTAMP,
            'Phiếu nhập tự động từ xuất đơn vị ' || NEW.so_phieu,
            CURRENT_TIMESTAMP
        ) RETURNING id INTO v_phieu_nhap_id;
        
        -- Copy chi tiết từ phiếu xuất sang phiếu nhập
        INSERT INTO chi_tiet_nhap (
            phieu_nhap_id, hang_hoa_id, so_luong_ke_hoach, so_luong,
            don_gia, thanh_tien, pham_chat, danh_diem
        )
        SELECT 
            v_phieu_nhap_id, hang_hoa_id, so_luong_yeu_cau, so_luong_thuc_xuat,
            don_gia, (so_luong_thuc_xuat * don_gia), pham_chat, danh_diem
        FROM chi_tiet_xuat 
        WHERE phieu_xuat_id = NEW.id;
        
        -- Cập nhật liên kết ngược
        UPDATE phieu_xuat 
        SET phieu_nhap_lien_ket_id = v_phieu_nhap_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
        
        RAISE NOTICE 'Đã tự động tạo phiếu nhập % cho phiếu xuất %', v_so_phieu_nhap, NEW.so_phieu;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ✅ 6. TẠO TRIGGER MỚI
CREATE TRIGGER tr_auto_create_phieu_nhap_from_xuat
    AFTER UPDATE ON phieu_xuat
    FOR EACH ROW 
    EXECUTE FUNCTION auto_create_phieu_nhap_from_xuat();

-- ✅ 7. CẬP NHẬT DỮ LIỆU CŨ ĐỂ PHÙHỢP WORKFLOW MỚI
-- Cập nhật loại xuất cũ về giá trị mặc định
UPDATE phieu_xuat 
SET loai_xuat = 'don_vi_su_dung' 
WHERE loai_xuat IS NULL;

-- Cập nhật trạng thái pending_admin_approval về confirmed để phù hợp workflow mới
UPDATE phieu_xuat 
SET trang_thai = 'confirmed'
WHERE trang_thai = 'pending_admin_approval';

-- ✅ 8. TẠO INDEXES ĐỂ TỐI ƯU HIỆU SUẤT
CREATE INDEX IF NOT EXISTS idx_phieu_xuat_loai_trang_thai ON phieu_xuat(loai_xuat, trang_thai);
CREATE INDEX IF NOT EXISTS idx_phieu_xuat_phong_ban_nhan ON phieu_xuat(phong_ban_nhan_id) WHERE phong_ban_nhan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_phieu_xuat_don_vi_nhan ON phieu_xuat(don_vi_nhan_id) WHERE don_vi_nhan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_phieu_xuat_lien_ket ON phieu_xuat(phieu_nhap_lien_ket_id) WHERE phieu_nhap_lien_ket_id IS NOT NULL;

-- ✅ 9. COMMENTS CHO TÀI LIỆU
COMMENT ON COLUMN phieu_xuat.loai_xuat IS 'QUY TRÌNH MỚI - don_vi_su_dung (chính mình duyệt) hoặc don_vi_nhan (đơn vị nhận duyệt)';
COMMENT ON COLUMN phieu_xuat.phong_ban_nhan_id IS 'Phòng ban nhận hàng khi xuất luân chuyển nội bộ';
COMMENT ON COLUMN phieu_xuat.nguoi_phan_hoi IS 'Người yêu cầu chỉnh sửa phiếu (admin/manager)';
COMMENT ON COLUMN phieu_xuat.ngay_phan_hoi IS 'Thời gian yêu cầu chỉnh sửa';
COMMENT ON COLUMN phieu_xuat.ghi_chu_phan_hoi IS 'Nội dung yêu cầu chỉnh sửa';
COMMENT ON COLUMN phieu_xuat.phieu_nhap_lien_ket_id IS 'Phiếu nhập được tạo tự động khi xuất đơn vị';

COMMENT ON TRIGGER tr_auto_create_phieu_nhap_from_xuat ON phieu_xuat IS 'Tự động tạo phiếu nhập cho đơn vị nhận khi duyệt xuất đơn vị';

-- ✅ 10. KIỂM TRA KẾT QUẢ
SELECT 'Kiểm tra cột mới đã được tạo:' as check_name;
SELECT 
    table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'phieu_xuat' 
AND column_name IN ('nguoi_phan_hoi', 'ngay_phan_hoi', 'ghi_chu_phan_hoi', 'phong_ban_nhan_id', 'phieu_nhap_lien_ket_id')
ORDER BY column_name;

SELECT 'Kiểm tra trigger đã được tạo:' as check_name;
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'phieu_xuat'
AND t.tgname = 'tr_auto_create_phieu_nhap_from_xuat';

COMMIT;

-- Thông báo hoàn thành
DO $$
BEGIN
    RAISE NOTICE '✅ Đã cập nhật database thành công cho workflow xuất kho mới!';
    RAISE NOTICE '✅ Trigger tự động tạo phiếu nhập đã được tạo';
    RAISE NOTICE '✅ Các cột mới đã được thêm vào phieu_xuat';
    RAISE NOTICE '✅ Dữ liệu cũ đã được cập nhật để phù hợp workflow mới';
END $$;


-- 🔥 FIX: Update function update_ton_kho_simple() với đúng schema
CREATE OR REPLACE FUNCTION update_ton_kho_simple()
RETURNS TRIGGER AS $$
DECLARE
    chi_tiet_record RECORD;
    v_pham_chat pham_chat;
BEGIN
    -- Chỉ cập nhật tồn kho khi phiếu ở trạng thái completed
    IF NEW.trang_thai = 'completed' AND OLD.trang_thai != 'completed' THEN
        
        -- Cập nhật tồn kho cho phiếu nhập
        IF TG_TABLE_NAME = 'phieu_nhap' THEN
            
            -- Loop qua từng chi tiết để cập nhật theo phẩm chất
            FOR chi_tiet_record IN
                SELECT 
                    ct.hang_hoa_id,
                    ct.so_luong,
                    ct.don_gia,
                    ct.thanh_tien,
                    COALESCE(ct.pham_chat, 'tot') as pham_chat
                FROM chi_tiet_nhap ct
                WHERE ct.phieu_nhap_id = NEW.id
            LOOP
                v_pham_chat := chi_tiet_record.pham_chat;
                
                -- 🔥 FIX: Insert hoặc update với đúng schema ton_kho
                INSERT INTO ton_kho (
                    hang_hoa_id, 
                    phong_ban_id, 
                    sl_tot,
                    sl_kem_pham_chat,
                    sl_mat_pham_chat, 
                    sl_hong,
                    sl_can_thanh_ly,
                    gia_tri_ton,
                    don_gia_binh_quan,
                    ngay_cap_nhat
                ) VALUES (
                    chi_tiet_record.hang_hoa_id,
                    NEW.phong_ban_id,
                    CASE WHEN v_pham_chat = 'tot' THEN chi_tiet_record.so_luong ELSE 0 END,
                    CASE WHEN v_pham_chat = 'kem_pham_chat' THEN chi_tiet_record.so_luong ELSE 0 END,
                    CASE WHEN v_pham_chat = 'mat_pham_chat' THEN chi_tiet_record.so_luong ELSE 0 END,
                    CASE WHEN v_pham_chat = 'hong' THEN chi_tiet_record.so_luong ELSE 0 END,
                    CASE WHEN v_pham_chat = 'can_thanh_ly' THEN chi_tiet_record.so_luong ELSE 0 END,
                
                    chi_tiet_record.thanh_tien, -- Tổng giá trị
                    chi_tiet_record.don_gia, -- Đơn giá bình quân
                    CURRENT_TIMESTAMP
                )
                ON CONFLICT (hang_hoa_id, phong_ban_id) 
                DO UPDATE SET 
                    -- Cập nhật theo phẩm chất
                    sl_tot = ton_kho.sl_tot + CASE WHEN v_pham_chat = 'tot' THEN EXCLUDED.sl_tot ELSE 0 END,
                    sl_kem_pham_chat = ton_kho.sl_kem_pham_chat + CASE WHEN v_pham_chat = 'kem_pham_chat' THEN EXCLUDED.sl_kem_pham_chat ELSE 0 END,
                    sl_mat_pham_chat = ton_kho.sl_mat_pham_chat + CASE WHEN v_pham_chat = 'mat_pham_chat' THEN EXCLUDED.sl_mat_pham_chat ELSE 0 END,
                    sl_hong = ton_kho.sl_hong + CASE WHEN v_pham_chat = 'hong' THEN EXCLUDED.sl_hong ELSE 0 END,
                    sl_can_thanh_ly = ton_kho.sl_can_thanh_ly + CASE WHEN v_pham_chat = 'can_thanh_ly' THEN EXCLUDED.sl_can_thanh_ly ELSE 0 END,
                    
                    -- Cập nhật tổng
                 
                    gia_tri_ton = ton_kho.gia_tri_ton + EXCLUDED.gia_tri_ton,
                    
                    -- Cập nhật đơn giá bình quân = (giá trị cũ + giá trị mới) / (số lượng cũ + số lượng mới)
                    don_gia_binh_quan = 
                        CASE 
                            WHEN (ton_kho.so_luong_ton + EXCLUDED.so_luong_ton) > 0 THEN
                                (ton_kho.gia_tri_ton + EXCLUDED.gia_tri_ton) / (ton_kho.so_luong_ton + EXCLUDED.so_luong_ton)
                            ELSE 0 
                        END,
                    
                    ngay_cap_nhat = CURRENT_TIMESTAMP;
                
            END LOOP;
        
        -- Cập nhật tồn kho cho phiếu xuất
        ELSIF TG_TABLE_NAME = 'phieu_xuat' THEN
            
            FOR chi_tiet_record IN
                SELECT 
                    ct.hang_hoa_id,
                    ct.so_luong_thuc_xuat as so_luong,
                    COALESCE(ct.pham_chat, 'tot') as pham_chat,
                    ct.don_gia
                FROM chi_tiet_xuat ct
                WHERE ct.phieu_xuat_id = NEW.id
            LOOP
                v_pham_chat := chi_tiet_record.pham_chat;
                
                -- Trừ tồn kho theo phẩm chất
                UPDATE ton_kho 
                SET 
                    sl_tot = GREATEST(0, sl_tot - CASE WHEN v_pham_chat = 'tot' THEN chi_tiet_record.so_luong ELSE 0 END),
                    sl_kem_pham_chat = GREATEST(0, sl_kem_pham_chat - CASE WHEN v_pham_chat = 'kem_pham_chat' THEN chi_tiet_record.so_luong ELSE 0 END),
                    sl_mat_pham_chat = GREATEST(0, sl_mat_pham_chat - CASE WHEN v_pham_chat = 'mat_pham_chat' THEN chi_tiet_record.so_luong ELSE 0 END),
                    sl_hong = GREATEST(0, sl_hong - CASE WHEN v_pham_chat = 'hong' THEN chi_tiet_record.so_luong ELSE 0 END),
                    sl_can_thanh_ly = GREATEST(0, sl_can_thanh_ly - CASE WHEN v_pham_chat = 'can_thanh_ly' THEN chi_tiet_record.so_luong ELSE 0 END),
                    
                    -- Trừ tổng số lượng và giá trị
                    
                    gia_tri_ton = GREATEST(0, gia_tri_ton - (chi_tiet_record.so_luong * chi_tiet_record.don_gia)),
                    
                    -- Cập nhật đơn giá bình quân nếu còn tồn
                    don_gia_binh_quan = 
                        CASE 
                            WHEN (so_luong_ton - chi_tiet_record.so_luong) > 0 THEN
                                (gia_tri_ton - (chi_tiet_record.so_luong * chi_tiet_record.don_gia)) / (so_luong_ton - chi_tiet_record.so_luong)
                            ELSE 0 
                        END,
                    
                    ngay_cap_nhat = CURRENT_TIMESTAMP
                WHERE hang_hoa_id = chi_tiet_record.hang_hoa_id 
                AND phong_ban_id = NEW.phong_ban_id;
                
            END LOOP;
            
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 🔥 XÓA VÀ TẠO LẠI TRIGGER
DROP TRIGGER IF EXISTS update_ton_kho_after_completed_nhap ON phieu_nhap;
DROP TRIGGER IF EXISTS update_ton_kho_after_completed_xuat ON phieu_xuat;

-- Tạo lại trigger với function đã fix
CREATE TRIGGER update_ton_kho_after_completed_nhap
    AFTER UPDATE ON phieu_nhap
    FOR EACH ROW
    EXECUTE FUNCTION update_ton_kho_simple();

CREATE TRIGGER update_ton_kho_after_completed_xuat
    AFTER UPDATE ON phieu_xuat
    FOR EACH ROW
    EXECUTE FUNCTION update_ton_kho_simple();

	-- ✅ Clean malformed arrays for hang_hoa_id = 15
SELECT 
  id, so_seri_list, 
  CASE 
    WHEN so_seri_list IS NULL THEN 'NULL'
    WHEN so_seri_list = '{}' THEN 'EMPTY_ARRAY' 
    WHEN array_length(so_seri_list, 1) IS NULL THEN 'MALFORMED'
    ELSE 'VALID'
  END as status
FROM chi_tiet_nhap 
WHERE hang_hoa_id = 15
LIMIT 5;

-- ✅ FIX: Clean malformed arrays trong chi_tiet_nhap
UPDATE chi_tiet_nhap 
SET so_seri_list = NULL 
WHERE so_seri_list IS NOT NULL 
AND (
  array_length(so_seri_list, 1) IS NULL OR  -- Malformed arrays
  so_seri_list = '{}' OR                    -- Empty arrays
  (array_length(so_seri_list, 1) = 1 AND so_seri_list[1] = '') -- Arrays with empty string
);

-- ✅ Remove empty strings from existing arrays
UPDATE chi_tiet_nhap 
SET so_seri_list = array_remove(so_seri_list, '')
WHERE so_seri_list IS NOT NULL;

-- ✅ Convert arrays that now have no elements to NULL
UPDATE chi_tiet_nhap 
SET so_seri_list = NULL 
WHERE so_seri_list IS NOT NULL
AND array_length(so_seri_list, 1) IS NULL;

-- ✅ CONSTRAINT: Đảm bảo array không chứa empty string
ALTER TABLE chi_tiet_nhap
DROP CONSTRAINT IF EXISTS check_so_seri_list_valid;

ALTER TABLE chi_tiet_nhap
ADD CONSTRAINT check_so_seri_list_valid 
CHECK (
  so_seri_list IS NULL OR 
  (array_length(so_seri_list, 1) > 0 AND '' != ALL(so_seri_list))
);

-- =============================================
-- FIX DOUBLE NOTIFICATION ISSUE
-- =============================================

BEGIN;

-- 1. XÓA THÔNG BÁO TRÙNG LẶP HIỆN TẠI (giữ lại cái có tên phòng ban đầy đủ)
WITH duplicate_notifications AS (
    SELECT 
        id,
        phieu_id,
        loai_thong_bao,
        nguoi_nhan,
        noi_dung,
        created_at,
        -- Ưu tiên thông báo có tên phòng ban đầy đủ (không có "N/A")
        CASE WHEN noi_dung LIKE '%N/A%' THEN 2 ELSE 1 END as priority,
        ROW_NUMBER() OVER (
            PARTITION BY phieu_id, loai_thong_bao, nguoi_nhan 
            ORDER BY 
                CASE WHEN noi_dung LIKE '%N/A%' THEN 2 ELSE 1 END ASC,
                created_at DESC
        ) as rn
    FROM notifications 
    WHERE phieu_id IS NOT NULL
    AND loai_thong_bao IN ('phieu_nhap_can_duyet', 'phieu_xuat_can_duyet')
    AND created_at > NOW() - INTERVAL '7 days'  -- Chỉ xử lý thông báo trong 7 ngày gần đây
)
DELETE FROM notifications 
WHERE id IN (
    SELECT id FROM duplicate_notifications WHERE rn > 1
);

-- 2. TẠM THỜI VÔ HIỆU HÓA DATABASE TRIGGER để tránh conflict với controller
DROP TRIGGER IF EXISTS tr_auto_notification_phieu_nhap ON phieu_nhap;
DROP TRIGGER IF EXISTS tr_auto_notification_phieu_xuat ON phieu_xuat;

-- 3. TẠO LẠI FUNCTION NOTIFICATION CHỈ XỬ LÝ CÁC CASE ĐẶC BIỆT
-- (Controller sẽ handle chính, trigger chỉ backup cho các case không có controller)
CREATE OR REPLACE FUNCTION auto_create_notification_backup()
RETURNS TRIGGER AS $$
DECLARE
    v_nguoi_nhan INTEGER[];
    v_tieu_de VARCHAR(255);
    v_noi_dung TEXT;
    v_loai_thong_bao loai_thong_bao;
    v_url_redirect VARCHAR(500);
    v_metadata JSONB;
    v_existing_count INTEGER;
    v_phong_ban_ten TEXT;
BEGIN
    -- CHỈ XỬ LÝ CÁC TRẠNG THÁI MÀ CONTROLLER KHÔNG HANDLE
    -- (Bỏ qua 'confirmed' và 'pending_approval' vì controller đã xử lý)
    
    IF TG_TABLE_NAME = 'phieu_nhap' THEN
        CASE NEW.trang_thai
            WHEN 'approved' THEN
                -- Lấy tên phòng ban đầy đủ
                SELECT ten_phong_ban INTO v_phong_ban_ten 
                FROM phong_ban 
                WHERE id = NEW.phong_ban_id;
                
                v_loai_thong_bao := 'phieu_nhap_duyet';
                v_tieu_de := 'Phiếu nhập ' || NEW.so_phieu || ' đã được duyệt';
                v_noi_dung := 'Phiếu nhập kho từ ' || COALESCE(v_phong_ban_ten, 'N/A') || ' đã được phê duyệt và có thể thực hiện';
                v_url_redirect := '/nhap-kho?tab=da-duyet&highlight=' || NEW.id;
                v_nguoi_nhan := ARRAY[NEW.nguoi_tao];
                
            WHEN 'revision_required' THEN
                SELECT ten_phong_ban INTO v_phong_ban_ten 
                FROM phong_ban 
                WHERE id = NEW.phong_ban_id;
                
                v_loai_thong_bao := 'phieu_nhap_can_sua';
                v_tieu_de := 'Phiếu nhập ' || NEW.so_phieu || ' cần chỉnh sửa';
                v_noi_dung := 'Phiếu nhập kho từ ' || COALESCE(v_phong_ban_ten, 'N/A') || ' cần được chỉnh sửa. Lý do: ' || COALESCE(NEW.ghi_chu_phan_hoi, 'Không được cung cấp');
                v_url_redirect := '/nhap-kho?tab=can-sua&highlight=' || NEW.id;
                v_nguoi_nhan := ARRAY[NEW.nguoi_tao];
                
            WHEN 'completed' THEN
                SELECT ten_phong_ban INTO v_phong_ban_ten 
                FROM phong_ban 
                WHERE id = NEW.phong_ban_id;
                
                v_loai_thong_bao := 'system';
                v_tieu_de := 'Phiếu nhập ' || NEW.so_phieu || ' đã hoàn thành';
                v_noi_dung := 'Phiếu nhập kho từ ' || COALESCE(v_phong_ban_ten, 'N/A') || ' đã được hoàn thành. Tồn kho đã được cập nhật.';
                v_url_redirect := '/nhap-kho?tab=hoan-thanh&highlight=' || NEW.id;
                v_nguoi_nhan := ARRAY[NEW.nguoi_tao];
                
            ELSE
                RETURN NEW;
        END CASE;
        
    ELSIF TG_TABLE_NAME = 'phieu_xuat' THEN
        -- Tương tự cho phiếu xuất, chỉ xử lý approved, revision_required, completed
        CASE NEW.trang_thai
            WHEN 'approved' THEN
                SELECT ten_phong_ban INTO v_phong_ban_ten 
                FROM phong_ban 
                WHERE id = NEW.phong_ban_id;
                
                v_loai_thong_bao := 'phieu_xuat_duyet';
                v_tieu_de := 'Phiếu xuất ' || NEW.so_phieu || ' đã được duyệt';
                v_noi_dung := 'Phiếu xuất kho từ ' || COALESCE(v_phong_ban_ten, 'N/A') || ' đã được phê duyệt và có thể thực hiện';
                v_url_redirect := '/xuat-kho?tab=da-duyet&highlight=' || NEW.id;
                v_nguoi_nhan := ARRAY[NEW.nguoi_tao];
                
            WHEN 'revision_required' THEN
                SELECT ten_phong_ban INTO v_phong_ban_ten 
                FROM phong_ban 
                WHERE id = NEW.phong_ban_id;
                
                v_loai_thong_bao := 'phieu_xuat_can_sua';
                v_tieu_de := 'Phiếu xuất ' || NEW.so_phieu || ' cần chỉnh sửa';
                v_noi_dung := 'Phiếu xuất kho từ ' || COALESCE(v_phong_ban_ten, 'N/A') || ' cần được chỉnh sửa. Lý do: ' || COALESCE(NEW.ghi_chu_phan_hoi, 'Không được cung cấp');
                v_url_redirect := '/xuat-kho?tab=can-sua&highlight=' || NEW.id;
                v_nguoi_nhan := ARRAY[NEW.nguoi_tao];
                
            WHEN 'completed' THEN
                SELECT ten_phong_ban INTO v_phong_ban_ten 
                FROM phong_ban 
                WHERE id = NEW.phong_ban_id;
                
                v_loai_thong_bao := 'system';
                v_tieu_de := 'Phiếu xuất ' || NEW.so_phieu || ' đã hoàn thành';
                v_noi_dung := 'Phiếu xuất kho từ ' || COALESCE(v_phong_ban_ten, 'N/A') || ' đã được hoàn thành. Tồn kho đã được cập nhật.';
                v_url_redirect := '/xuat-kho?tab=hoan-thanh&highlight=' || NEW.id;
                v_nguoi_nhan := ARRAY[NEW.nguoi_tao];
                
            ELSE
                RETURN NEW;
        END CASE;
    END IF;

    -- Kiểm tra xem đã có notification tương tự trong 2 phút gần đây chưa
    SELECT COUNT(*) INTO v_existing_count
    FROM notifications 
    WHERE phieu_id = NEW.id
    AND loai_thong_bao = v_loai_thong_bao
    AND created_at > NOW() - INTERVAL '2 minutes';

    -- Chỉ tạo mới nếu chưa có notification tương tự
    IF v_existing_count = 0 AND array_length(v_nguoi_nhan, 1) > 0 THEN
        -- Tạo metadata với thông tin phòng ban đầy đủ
        v_metadata := jsonb_build_object(
            'phieu_type', TG_TABLE_NAME,
            'workflow_type', COALESCE(NEW.workflow_type, ''),
            'so_phieu', NEW.so_phieu,
            'phong_ban_ten', v_phong_ban_ten
        );

        -- Insert notifications cho từng người nhận
        INSERT INTO notifications (
            phieu_id,
            loai_thong_bao,
            tieu_de,
            noi_dung,
            nguoi_nhan,
            url_redirect,
            metadata,
            trang_thai
        )
        SELECT 
            NEW.id,
            v_loai_thong_bao,
            v_tieu_de,
            v_noi_dung,
            nguoi_id,
            v_url_redirect,
            v_metadata,
            'unread'
        FROM unnest(v_nguoi_nhan) AS nguoi_id;

        -- Log để debug
        RAISE NOTICE 'Created % notification for phieu % to % users', 
            v_loai_thong_bao, NEW.so_phieu, array_length(v_nguoi_nhan, 1);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TẠO LẠI TRIGGER CHỈ CHO BACKUP (không xử lý confirmed/pending_approval)
CREATE TRIGGER tr_auto_notification_backup_phieu_nhap 
    AFTER UPDATE ON phieu_nhap
    FOR EACH ROW 
    WHEN (
        OLD.trang_thai IS DISTINCT FROM NEW.trang_thai 
        AND NEW.trang_thai IN ('approved', 'revision_required', 'completed')
    )
    EXECUTE FUNCTION auto_create_notification_backup();

CREATE TRIGGER tr_auto_notification_backup_phieu_xuat 
    AFTER UPDATE ON phieu_xuat
    FOR EACH ROW 
    WHEN (
        OLD.trang_thai IS DISTINCT FROM NEW.trang_thai 
        AND NEW.trang_thai IN ('approved', 'revision_required', 'completed')
    )
    EXECUTE FUNCTION auto_create_notification_backup();

-- 5. THÊM UNIQUE CONSTRAINT ĐỂ NGĂN DUPLICATE TRONG TƯƠNG LAI
-- (Optional - có thể comment out nếu gây conflict)
-- ALTER TABLE notifications 
-- ADD CONSTRAINT unique_phieu_notification 
-- EXCLUDE (phieu_id WITH =, loai_thong_bao WITH =, nguoi_nhan WITH =) 
-- WHERE (created_at > NOW() - INTERVAL '1 minute');

-- 6. CLEANUP CÁC NOTIFICATION CŨ ĐỂ TRÁNH SPAM
DELETE FROM notifications 
WHERE created_at < NOW() - INTERVAL '30 days'
AND trang_thai = 'read';

COMMIT;

-- Verification: Kiểm tra còn duplicate không
SELECT 
    'Check for remaining duplicates:' as info;
    
SELECT 
    phieu_id, 
    loai_thong_bao, 
    nguoi_nhan, 
    COUNT(*) as count
FROM notifications 
WHERE created_at > NOW() - INTERVAL '7 days'
AND phieu_id IS NOT NULL
GROUP BY phieu_id, loai_thong_bao, nguoi_nhan
HAVING COUNT(*) > 1
ORDER BY phieu_id DESC
LIMIT 10;


-- =============================================
-- FIX DUPLICATE TRIGGERS - SỬA LỖI BỊ NHÂN 3
-- =============================================

-- BƯỚC 1: XÓA TẤT CẢ TRIGGERS LIÊN QUAN ĐÉN TỒN KHO
DROP TRIGGER IF EXISTS tr_update_ton_kho_on_status_change ON phieu_nhap;
DROP TRIGGER IF EXISTS tr_auto_update_ton_kho_nhap ON phieu_nhap;
DROP TRIGGER IF EXISTS update_ton_kho_after_completed_nhap ON phieu_nhap;
DROP TRIGGER IF EXISTS tr_auto_update_ton_kho_xuat ON phieu_xuat;
DROP TRIGGER IF EXISTS update_ton_kho_after_completed_xuat ON phieu_xuat;
DROP TRIGGER IF EXISTS tr_update_ton_kho_when_completed ON phieu_xuat;

-- BƯỚC 2: XÓA CÁC FUNCTIONS KHÔNG SỬ DỤNG
DROP FUNCTION IF EXISTS update_ton_kho_on_status_change() CASCADE;
DROP FUNCTION IF EXISTS auto_update_ton_kho_on_complete() CASCADE;
DROP FUNCTION IF EXISTS update_ton_kho_simple() CASCADE;

-- BƯỚC 3: TẠO 1 FUNCTION DUY NHẤT ĐỂ CẬP NHẬT TỒN KHO
CREATE OR REPLACE FUNCTION update_ton_kho_unified()
RETURNS TRIGGER AS $$
DECLARE
    chi_tiet_record RECORD;
    v_pham_chat pham_chat;
BEGIN
    -- PHIẾU NHẬP: Cập nhật tồn kho khi completed
    IF TG_TABLE_NAME = 'phieu_nhap' AND NEW.trang_thai = 'completed' AND OLD.trang_thai != 'completed' THEN
        
        FOR chi_tiet_record IN 
            SELECT ctn.hang_hoa_id, ctn.so_luong, ctn.don_gia, 
                   ctn.thanh_tien, COALESCE(ctn.pham_chat, 'tot') as pham_chat
            FROM chi_tiet_nhap ctn 
            WHERE ctn.phieu_nhap_id = NEW.id
        LOOP
            v_pham_chat := chi_tiet_record.pham_chat;
            
            -- INSERT hoặc UPDATE tồn kho
            INSERT INTO ton_kho (
                hang_hoa_id, phong_ban_id, 
                sl_tot, sl_kem_pham_chat, sl_mat_pham_chat, sl_hong, sl_can_thanh_ly,
                gia_tri_ton, don_gia_binh_quan, ngay_cap_nhat
            ) VALUES (
                chi_tiet_record.hang_hoa_id, 
                NEW.phong_ban_id,
                CASE WHEN v_pham_chat = 'tot' THEN chi_tiet_record.so_luong ELSE 0 END,
                CASE WHEN v_pham_chat = 'kem_pham_chat' THEN chi_tiet_record.so_luong ELSE 0 END,
                CASE WHEN v_pham_chat = 'mat_pham_chat' THEN chi_tiet_record.so_luong ELSE 0 END,
                CASE WHEN v_pham_chat = 'hong' THEN chi_tiet_record.so_luong ELSE 0 END,
                CASE WHEN v_pham_chat = 'can_thanh_ly' THEN chi_tiet_record.so_luong ELSE 0 END,
                chi_tiet_record.thanh_tien,
                chi_tiet_record.don_gia,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (hang_hoa_id, phong_ban_id) 
            DO UPDATE SET 
                sl_tot = ton_kho.sl_tot + CASE WHEN v_pham_chat = 'tot' THEN EXCLUDED.sl_tot ELSE 0 END,
                sl_kem_pham_chat = ton_kho.sl_kem_pham_chat + CASE WHEN v_pham_chat = 'kem_pham_chat' THEN EXCLUDED.sl_kem_pham_chat ELSE 0 END,
                sl_mat_pham_chat = ton_kho.sl_mat_pham_chat + CASE WHEN v_pham_chat = 'mat_pham_chat' THEN EXCLUDED.sl_mat_pham_chat ELSE 0 END,
                sl_hong = ton_kho.sl_hong + CASE WHEN v_pham_chat = 'hong' THEN EXCLUDED.sl_hong ELSE 0 END,
                sl_can_thanh_ly = ton_kho.sl_can_thanh_ly + CASE WHEN v_pham_chat = 'can_thanh_ly' THEN EXCLUDED.sl_can_thanh_ly ELSE 0 END,
                gia_tri_ton = ton_kho.gia_tri_ton + EXCLUDED.gia_tri_ton,
                don_gia_binh_quan = CASE 
                    WHEN (ton_kho.sl_tot + ton_kho.sl_kem_pham_chat + ton_kho.sl_mat_pham_chat + ton_kho.sl_hong + ton_kho.sl_can_thanh_ly + EXCLUDED.sl_tot + EXCLUDED.sl_kem_pham_chat + EXCLUDED.sl_mat_pham_chat + EXCLUDED.sl_hong + EXCLUDED.sl_can_thanh_ly) > 0 
                    THEN (ton_kho.gia_tri_ton + EXCLUDED.gia_tri_ton) / (ton_kho.sl_tot + ton_kho.sl_kem_pham_chat + ton_kho.sl_mat_pham_chat + ton_kho.sl_hong + ton_kho.sl_can_thanh_ly + EXCLUDED.sl_tot + EXCLUDED.sl_kem_pham_chat + EXCLUDED.sl_mat_pham_chat + EXCLUDED.sl_hong + EXCLUDED.sl_can_thanh_ly)
                    ELSE EXCLUDED.don_gia_binh_quan 
                END,
                ngay_cap_nhat = CURRENT_TIMESTAMP;
        END LOOP;

        -- Cập nhật giá nhập gần nhất cho hàng hóa
        UPDATE hang_hoa 
        SET gia_nhap_gan_nhat = (
            SELECT ctn.don_gia 
            FROM chi_tiet_nhap ctn 
            WHERE ctn.phieu_nhap_id = NEW.id 
            AND ctn.hang_hoa_id = hang_hoa.id
            ORDER BY ctn.id DESC 
            LIMIT 1
        )
        WHERE id IN (SELECT DISTINCT hang_hoa_id FROM chi_tiet_nhap WHERE phieu_nhap_id = NEW.id);
        
    END IF;

    -- PHIẾU XUẤT: Trừ tồn kho khi completed  
    IF TG_TABLE_NAME = 'phieu_xuat' AND NEW.trang_thai = 'completed' AND OLD.trang_thai != 'completed' THEN
        
        FOR chi_tiet_record IN 
            SELECT ctx.hang_hoa_id, ctx.so_luong_thuc_xuat, 
                   COALESCE(ctx.pham_chat, 'tot') as pham_chat
            FROM chi_tiet_xuat ctx 
            WHERE ctx.phieu_xuat_id = NEW.id
        LOOP
            v_pham_chat := chi_tiet_record.pham_chat;
            
            -- Trừ tồn kho theo phẩm chất
            UPDATE ton_kho 
            SET 
                sl_tot = GREATEST(0, sl_tot - CASE WHEN v_pham_chat = 'tot' THEN chi_tiet_record.so_luong_thuc_xuat ELSE 0 END),
                sl_kem_pham_chat = GREATEST(0, sl_kem_pham_chat - CASE WHEN v_pham_chat = 'kem_pham_chat' THEN chi_tiet_record.so_luong_thuc_xuat ELSE 0 END),
                sl_mat_pham_chat = GREATEST(0, sl_mat_pham_chat - CASE WHEN v_pham_chat = 'mat_pham_chat' THEN chi_tiet_record.so_luong_thuc_xuat ELSE 0 END),
                sl_hong = GREATEST(0, sl_hong - CASE WHEN v_pham_chat = 'hong' THEN chi_tiet_record.so_luong_thuc_xuat ELSE 0 END),
                sl_can_thanh_ly = GREATEST(0, sl_can_thanh_ly - CASE WHEN v_pham_chat = 'can_thanh_ly' THEN chi_tiet_record.so_luong_thuc_xuat ELSE 0 END),
                ngay_cap_nhat = CURRENT_TIMESTAMP
            WHERE hang_hoa_id = chi_tiet_record.hang_hoa_id 
            AND phong_ban_id = NEW.phong_ban_id;
            
            -- Cập nhật lại giá trị tồn dựa trên đơn giá bình quân
            UPDATE ton_kho 
            SET gia_tri_ton = (sl_tot + sl_kem_pham_chat * 0.7 + sl_mat_pham_chat * 0.3 + sl_can_thanh_ly * 0.1) * don_gia_binh_quan
            WHERE hang_hoa_id = chi_tiet_record.hang_hoa_id 
            AND phong_ban_id = NEW.phong_ban_id;
        END LOOP;
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- BƯỚC 4: TẠO TRIGGERS MỚI - CHỈ 1 TRIGGER CHO MỖI BẢNG
CREATE TRIGGER tr_ton_kho_unified_nhap
    AFTER UPDATE ON phieu_nhap
    FOR EACH ROW 
    WHEN (NEW.trang_thai IS DISTINCT FROM OLD.trang_thai)
    EXECUTE FUNCTION update_ton_kho_unified();

CREATE TRIGGER tr_ton_kho_unified_xuat
    AFTER UPDATE ON phieu_xuat
    FOR EACH ROW 
    WHEN (NEW.trang_thai IS DISTINCT FROM OLD.trang_thai)
    EXECUTE FUNCTION update_ton_kho_unified();

-- BƯỚC 5: REBUILD DỮ LIỆU TỒN KHO - SỬA SỐ LIỆU BỊ NHÂN 3
CREATE OR REPLACE FUNCTION rebuild_ton_kho_data()
RETURNS TEXT AS $$
DECLARE
    result_message TEXT := '';
BEGIN
    -- Xóa tất cả dữ liệu tồn kho hiện tại
    DELETE FROM ton_kho;
    result_message := 'Đã xóa tất cả dữ liệu tồn kho cũ.' || E'\n';

    -- Rebuild tồn kho từ các phiếu nhập completed
    INSERT INTO ton_kho (
        hang_hoa_id, phong_ban_id, 
        sl_tot, sl_kem_pham_chat, sl_mat_pham_chat, sl_hong, sl_can_thanh_ly,
        gia_tri_ton, don_gia_binh_quan, ngay_cap_nhat
    )
    SELECT 
        ctn.hang_hoa_id,
        pn.phong_ban_id,
        SUM(CASE WHEN COALESCE(ctn.pham_chat, 'tot') = 'tot' THEN ctn.so_luong_thuc_nhap ELSE 0 END) as sl_tot,
        SUM(CASE WHEN ctn.pham_chat = 'kem_pham_chat' THEN ctn.so_luong_thuc_nhap ELSE 0 END) as sl_kem_pham_chat,
        SUM(CASE WHEN ctn.pham_chat = 'mat_pham_chat' THEN ctn.so_luong_thuc_nhap ELSE 0 END) as sl_mat_pham_chat,
        SUM(CASE WHEN ctn.pham_chat = 'hong' THEN ctn.so_luong_thuc_nhap ELSE 0 END) as sl_hong,
        SUM(CASE WHEN ctn.pham_chat = 'can_thanh_ly' THEN ctn.so_luong_thuc_nhap ELSE 0 END) as sl_can_thanh_ly,
        SUM(ctn.thanh_tien) as gia_tri_ton,
        CASE 
            WHEN SUM(ctn.so_luong_thuc_nhap) > 0 
            THEN SUM(ctn.thanh_tien) / SUM(ctn.so_luong_thuc_nhap)
            ELSE 0 
        END as don_gia_binh_quan,
        CURRENT_TIMESTAMP
    FROM chi_tiet_nhap ctn
    JOIN phieu_nhap pn ON ctn.phieu_nhap_id = pn.id
    WHERE pn.trang_thai = 'completed'
    GROUP BY ctn.hang_hoa_id, pn.phong_ban_id
    HAVING SUM(ctn.so_luong_thuc_nhap) > 0;

    result_message := result_message || 'Đã rebuild tồn kho từ phiếu nhập completed.' || E'\n';

    -- Trừ đi các phiếu xuất completed
    WITH xuat_data AS (
        SELECT 
            ctx.hang_hoa_id,
            px.phong_ban_id,
            SUM(CASE WHEN COALESCE(ctx.pham_chat, 'tot') = 'tot' THEN ctx.so_luong_thuc_xuat ELSE 0 END) as sl_tot_xuat,
            SUM(CASE WHEN ctx.pham_chat = 'kem_pham_chat' THEN ctx.so_luong_thuc_xuat ELSE 0 END) as sl_kem_xuat,
            SUM(CASE WHEN ctx.pham_chat = 'mat_pham_chat' THEN ctx.so_luong_thuc_xuat ELSE 0 END) as sl_mat_xuat,
            SUM(CASE WHEN ctx.pham_chat = 'hong' THEN ctx.so_luong_thuc_xuat ELSE 0 END) as sl_hong_xuat,
            SUM(CASE WHEN ctx.pham_chat = 'can_thanh_ly' THEN ctx.so_luong_thuc_xuat ELSE 0 END) as sl_thanh_ly_xuat
        FROM chi_tiet_xuat ctx
        JOIN phieu_xuat px ON ctx.phieu_xuat_id = px.id
        WHERE px.trang_thai = 'completed'
        GROUP BY ctx.hang_hoa_id, px.phong_ban_id
    )
    UPDATE ton_kho 
    SET 
        sl_tot = GREATEST(0, ton_kho.sl_tot - xuat_data.sl_tot_xuat),
        sl_kem_pham_chat = GREATEST(0, ton_kho.sl_kem_pham_chat - xuat_data.sl_kem_xuat),
        sl_mat_pham_chat = GREATEST(0, ton_kho.sl_mat_pham_chat - xuat_data.sl_mat_xuat),
        sl_hong = GREATEST(0, ton_kho.sl_hong - xuat_data.sl_hong_xuat),
        sl_can_thanh_ly = GREATEST(0, ton_kho.sl_can_thanh_ly - xuat_data.sl_thanh_ly_xuat),
        gia_tri_ton = (
            GREATEST(0, ton_kho.sl_tot - xuat_data.sl_tot_xuat) +
            GREATEST(0, ton_kho.sl_kem_pham_chat - xuat_data.sl_kem_xuat) * 0.7 +
            GREATEST(0, ton_kho.sl_mat_pham_chat - xuat_data.sl_mat_xuat) * 0.3 +
            GREATEST(0, ton_kho.sl_can_thanh_ly - xuat_data.sl_thanh_ly_xuat) * 0.1
        ) * ton_kho.don_gia_binh_quan,
        ngay_cap_nhat = CURRENT_TIMESTAMP
    FROM xuat_data
    WHERE ton_kho.hang_hoa_id = xuat_data.hang_hoa_id 
    AND ton_kho.phong_ban_id = xuat_data.phong_ban_id;

    result_message := result_message || 'Đã trừ các phiếu xuất completed.' || E'\n';

    -- Xóa các record có tồn kho = 0
    DELETE FROM ton_kho 
    WHERE (sl_tot + sl_kem_pham_chat + sl_mat_pham_chat + sl_hong + sl_can_thanh_ly) = 0;

    result_message := result_message || 'Đã xóa các record tồn kho = 0.' || E'\n';

    -- Cập nhật giá nhập gần nhất
    UPDATE hang_hoa 
    SET gia_nhap_gan_nhat = (
        SELECT ctn.don_gia 
        FROM chi_tiet_nhap ctn 
        JOIN phieu_nhap pn ON ctn.phieu_nhap_id = pn.id
        WHERE ctn.hang_hoa_id = hang_hoa.id 
        AND pn.trang_thai = 'completed'
        ORDER BY pn.ngay_nhap DESC, pn.created_at DESC
        LIMIT 1
    );

    result_message := result_message || 'Đã cập nhật giá nhập gần nhất.' || E'\n';
    result_message := result_message || 'Rebuild tồn kho hoàn thành!';
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql;

-- BƯỚC 6: CHẠY REBUILD DATA
SELECT rebuild_ton_kho_data();

-- Sửa function auto_create_notification_backup() để loại bỏ workflow_type
CREATE OR REPLACE FUNCTION auto_create_notification_backup()
RETURNS TRIGGER AS $$
DECLARE
    v_nguoi_nhan INTEGER[];
    v_tieu_de VARCHAR(255);
    v_noi_dung TEXT;
    v_loai_thong_bao loai_thong_bao;
    v_url_redirect VARCHAR(500);
    v_metadata JSONB;
    v_existing_count INTEGER;
    v_phong_ban_ten TEXT;
BEGIN
    -- CHỈ XỬ LÝ CÁC TRẠNG THÁI MÀ CONTROLLER KHÔNG HANDLE
    -- (Bỏ qua 'confirmed' và 'pending_approval' vì controller đã xử lý)
    
    IF TG_TABLE_NAME = 'phieu_nhap' THEN
        CASE NEW.trang_thai
            WHEN 'approved' THEN
                -- Lấy tên phòng ban đầy đủ
                SELECT ten_phong_ban INTO v_phong_ban_ten 
                FROM phong_ban 
                WHERE id = NEW.phong_ban_id;
                
                v_loai_thong_bao := 'phieu_nhap_duyet';
                v_tieu_de := 'Phiếu nhập ' || NEW.so_phieu || ' đã được duyệt';
                v_noi_dung := 'Phiếu nhập kho từ ' || COALESCE(v_phong_ban_ten, 'N/A') || ' đã được phê duyệt và có thể thực hiện';
                v_url_redirect := '/nhap-kho?tab=da-duyet&highlight=' || NEW.id;
                v_nguoi_nhan := ARRAY[NEW.nguoi_tao];
                
            WHEN 'revision_required' THEN
                SELECT ten_phong_ban INTO v_phong_ban_ten 
                FROM phong_ban 
                WHERE id = NEW.phong_ban_id;
                
                v_loai_thong_bao := 'phieu_nhap_can_sua';
                v_tieu_de := 'Phiếu nhập ' || NEW.so_phieu || ' cần chỉnh sửa';
                v_noi_dung := 'Phiếu nhập kho từ ' || COALESCE(v_phong_ban_ten, 'N/A') || ' cần được chỉnh sửa. Lý do: ' || COALESCE(NEW.ghi_chu_phan_hoi, 'Không được cung cấp');
                v_url_redirect := '/nhap-kho?tab=can-sua&highlight=' || NEW.id;
                v_nguoi_nhan := ARRAY[NEW.nguoi_tao];
                
            WHEN 'completed' THEN
                SELECT ten_phong_ban INTO v_phong_ban_ten 
                FROM phong_ban 
                WHERE id = NEW.phong_ban_id;
                
                v_loai_thong_bao := 'system';
                v_tieu_de := 'Phiếu nhập ' || NEW.so_phieu || ' đã hoàn thành';
                v_noi_dung := 'Phiếu nhập kho từ ' || COALESCE(v_phong_ban_ten, 'N/A') || ' đã được hoàn thành. Tồn kho đã được cập nhật.';
                v_url_redirect := '/nhap-kho?tab=hoan-thanh&highlight=' || NEW.id;
                v_nguoi_nhan := ARRAY[NEW.nguoi_tao];
                
            ELSE
                RETURN NEW;
        END CASE;
        
    ELSIF TG_TABLE_NAME = 'phieu_xuat' THEN
        -- Tương tự cho phiếu xuất, chỉ xử lý approved, revision_required, completed
        CASE NEW.trang_thai
            WHEN 'approved' THEN
                SELECT ten_phong_ban INTO v_phong_ban_ten 
                FROM phong_ban 
                WHERE id = NEW.phong_ban_id;
                
                v_loai_thong_bao := 'phieu_xuat_duyet';
                v_tieu_de := 'Phiếu xuất ' || NEW.so_phieu || ' đã được duyệt';
                v_noi_dung := 'Phiếu xuất kho từ ' || COALESCE(v_phong_ban_ten, 'N/A') || ' đã được phê duyệt và có thể thực hiện';
                v_url_redirect := '/xuat-kho?tab=da-duyet&highlight=' || NEW.id;
                v_nguoi_nhan := ARRAY[NEW.nguoi_tao];
                
            WHEN 'revision_required' THEN
                SELECT ten_phong_ban INTO v_phong_ban_ten 
                FROM phong_ban 
                WHERE id = NEW.phong_ban_id;
                
                v_loai_thong_bao := 'phieu_xuat_can_sua';
                v_tieu_de := 'Phiếu xuất ' || NEW.so_phieu || ' cần chỉnh sửa';
                v_noi_dung := 'Phiếu xuất kho từ ' || COALESCE(v_phong_ban_ten, 'N/A') || ' cần được chỉnh sửa. Lý do: ' || COALESCE(NEW.ghi_chu_phan_hoi, 'Không được cung cấp');
                v_url_redirect := '/xuat-kho?tab=can-sua&highlight=' || NEW.id;
                v_nguoi_nhan := ARRAY[NEW.nguoi_tao];
                
            WHEN 'completed' THEN
                SELECT ten_phong_ban INTO v_phong_ban_ten 
                FROM phong_ban 
                WHERE id = NEW.phong_ban_id;
                
                v_loai_thong_bao := 'system';
                v_tieu_de := 'Phiếu xuất ' || NEW.so_phieu || ' đã hoàn thành';
                v_noi_dung := 'Phiếu xuất kho từ ' || COALESCE(v_phong_ban_ten, 'N/A') || ' đã được hoàn thành. Tồn kho đã được cập nhật.';
                v_url_redirect := '/xuat-kho?tab=hoan-thanh&highlight=' || NEW.id;
                v_nguoi_nhan := ARRAY[NEW.nguoi_tao];
                
            ELSE
                RETURN NEW;
        END CASE;
    END IF;

    -- Kiểm tra xem đã có notification tương tự trong 2 phút gần đây chưa
    SELECT COUNT(*) INTO v_existing_count
    FROM notifications 
    WHERE phieu_id = NEW.id
    AND loai_thong_bao = v_loai_thong_bao
    AND created_at > NOW() - INTERVAL '2 minutes';

    -- Chỉ tạo mới nếu chưa có notification tương tự
    IF v_existing_count = 0 AND array_length(v_nguoi_nhan, 1) > 0 THEN
        -- Tạo metadata KHÔNG CÓ workflow_type
        v_metadata := jsonb_build_object(
            'phieu_type', TG_TABLE_NAME,
            'so_phieu', NEW.so_phieu,
            'phong_ban_ten', v_phong_ban_ten
        );

        -- Insert notifications cho từng người nhận
        INSERT INTO notifications (
            phieu_id,
            loai_thong_bao,
            tieu_de,
            noi_dung,
            nguoi_nhan,
            url_redirect,
            metadata,
            trang_thai
        )
        SELECT 
            NEW.id,
            v_loai_thong_bao,
            v_tieu_de,
            v_noi_dung,
            nguoi_id,
            v_url_redirect,
            v_metadata,
            'unread'
        FROM unnest(v_nguoi_nhan) AS nguoi_id;

        -- Log để debug
        RAISE NOTICE 'Created % notification for phieu % to % users', 
            v_loai_thong_bao, NEW.so_phieu, array_length(v_nguoi_nhan, 1);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- FIX LOGIC NGHIỆP VỤ ĐÚNG: NCC theo loại phiếu, không phải phòng ban
-- ====================================================================

BEGIN;

-- =============================================
-- BƯỚC 1: XÓA TRIGGERS GÂY CONFLICT VÀ LOGIC SAI
-- =============================================

-- Xóa tất cả triggers tự động
DROP TRIGGER IF EXISTS auto_create_phieu_xuat_when_approved ON phieu_nhap CASCADE;
DROP TRIGGER IF EXISTS auto_create_phieu_nhap_when_xuat_approved ON phieu_xuat CASCADE;
DROP TRIGGER IF EXISTS tr_auto_create_phieu_xuat_when_approved ON phieu_nhap CASCADE;
DROP TRIGGER IF EXISTS tr_auto_create_phieu_nhap_when_xuat_approved ON phieu_xuat CASCADE;

-- Xóa functions gây conflict
DROP FUNCTION IF EXISTS auto_create_phieu_xuat_when_approved() CASCADE;
DROP FUNCTION IF EXISTS auto_create_phieu_nhap_when_xuat_approved() CASCADE;
DROP FUNCTION IF EXISTS auto_create_phieu_nhap_from_xuat() CASCADE;

-- =============================================
-- BƯỚC 2: CẬP NHẬT CẤU TRÚC NCC THEO LOGIC ĐÚNG
-- =============================================

-- Đảm bảo có đầy đủ cột cần thiết
ALTER TABLE nha_cung_cap 
ADD COLUMN IF NOT EXISTS loai_nha_cung_cap VARCHAR(20) DEFAULT 'tu_mua' 
CHECK (loai_nha_cung_cap IN ('tu_mua', 'tren_cap', 'dieu_chuyen'));

-- Cập nhật dữ liệu hiện có
UPDATE nha_cung_cap 
SET loai_nha_cung_cap = CASE 
    WHEN is_noi_bo = TRUE AND phong_ban_id IS NOT NULL THEN 'tren_cap'  -- NCC nội bộ cho "trên cấp"
    WHEN is_noi_bo = FALSE OR is_noi_bo IS NULL THEN 'tu_mua'           -- NCC ngoài cho "tự mua"
    ELSE 'tu_mua'
END
WHERE loai_nha_cung_cap IS NULL OR loai_nha_cung_cap = 'tu_mua';

-- =============================================
-- BƯỚC 3: TẠO NCC NỘI BỘ CHO TẤT CẢ PHÒNG BAN
-- =============================================

-- Tạo NCC nội bộ cho phiếu "trên cấp" (mỗi phòng ban là 1 NCC nội bộ)
INSERT INTO nha_cung_cap (
    ma_ncc, 
    ten_ncc, 
    dia_chi, 
    is_noi_bo, 
    phong_ban_id, 
    loai_nha_cung_cap,
    trang_thai,
    created_at
)
SELECT 
    'NB_' || pb.ma_phong_ban,
    '[Nội bộ] ' || pb.ten_phong_ban,
    'Đơn vị nội bộ',
    TRUE,
    pb.id,
    'tren_cap',  -- NCC này dành cho phiếu "trên cấp"
    'active',
    CURRENT_TIMESTAMP
FROM phong_ban pb
WHERE pb.is_active = TRUE
AND NOT EXISTS (
    SELECT 1 FROM nha_cung_cap ncc 
    WHERE ncc.phong_ban_id = pb.id 
    AND ncc.is_noi_bo = TRUE
    AND ncc.loai_nha_cung_cap = 'tren_cap'
);

-- =============================================
-- BƯỚC 4: CLEAN UP DỮ LIỆU SAI LOGIC
-- =============================================

-- Logic ĐÚNG theo nghiệp vụ:
-- - "tu_mua": chỉ có nha_cung_cap_id (NCC ngoài)
-- - "tren_cap": chỉ có nha_cung_cap_id (NCC nội bộ)  
-- - "dieu_chuyen": có phong_ban_cung_cap_id (phòng ban cùng cấp)

-- Xóa phong_ban_cung_cap_id không đúng logic
UPDATE phieu_nhap 
SET phong_ban_cung_cap_id = NULL 
WHERE loai_phieu IN ('tu_mua', 'tren_cap');

-- Với phiếu "trên cấp" mà chưa có NCC nội bộ, tìm và gán
UPDATE phieu_nhap 
SET nha_cung_cap_id = (
    SELECT ncc.id FROM nha_cung_cap ncc
    WHERE ncc.is_noi_bo = TRUE 
    AND ncc.loai_nha_cung_cap = 'tren_cap'
    AND ncc.trang_thai = 'active'
    LIMIT 1  -- Lấy NCC nội bộ bất kỳ nếu chưa xác định được cụ thể
)
WHERE loai_phieu = 'tren_cap' 
AND nha_cung_cap_id IS NULL;

-- =============================================
-- BƯỚC 5: TẠO FUNCTIONS HỖ TRỢ LOGIC ĐÚNG
-- =============================================

-- Function lấy NCC theo loại phiếu
CREATE OR REPLACE FUNCTION get_nha_cung_cap_by_loai_phieu(
    p_loai_phieu VARCHAR(20)
) RETURNS TABLE (
    id INTEGER,
    ma_ncc VARCHAR(50), 
    ten_ncc VARCHAR(255),
    dia_chi TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    is_noi_bo BOOLEAN,
    phong_ban_id INTEGER,
    ten_phong_ban VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ncc.id,
        ncc.ma_ncc,
        ncc.ten_ncc,
        ncc.dia_chi,
        ncc.phone,
        ncc.email,
        ncc.is_noi_bo,
        ncc.phong_ban_id,
        pb.ten_phong_ban
    FROM nha_cung_cap ncc
    LEFT JOIN phong_ban pb ON ncc.phong_ban_id = pb.id
    WHERE ncc.trang_thai = 'active'
    AND (
        -- NCC ngoài cho "tự mua"
        (p_loai_phieu = 'tu_mua' AND (ncc.is_noi_bo = FALSE OR ncc.is_noi_bo IS NULL))
        OR
        -- NCC nội bộ cho "trên cấp" 
        (p_loai_phieu = 'tren_cap' AND ncc.is_noi_bo = TRUE AND ncc.loai_nha_cung_cap = 'tren_cap')
    )
    ORDER BY ncc.is_noi_bo ASC, ncc.ten_ncc ASC;
END;
$$ LANGUAGE plpgsql;

-- Function lấy phòng ban cung cấp cho điều chuyển
CREATE OR REPLACE FUNCTION get_phong_ban_dieu_chuyen(
    p_user_phong_ban_id INTEGER
) RETURNS TABLE (
    id INTEGER,
    ma_phong_ban VARCHAR(50),
    ten_phong_ban VARCHAR(255),
    cap_bac INTEGER,
    so_hang_hoa_ton BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pb.id,
        pb.ma_phong_ban,
        pb.ten_phong_ban,
        pb.cap_bac,
        COUNT(DISTINCT tk.hang_hoa_id)::BIGINT as so_hang_hoa_ton
    FROM phong_ban pb
    LEFT JOIN ton_kho tk ON pb.id = tk.phong_ban_id AND tk.sl_tot > 0
    WHERE pb.cap_bac = 3 
    AND pb.phong_ban_cha_id = (
        SELECT phong_ban_cha_id FROM phong_ban WHERE id = p_user_phong_ban_id
    )
    AND pb.id != p_user_phong_ban_id
    AND pb.is_active = TRUE
    GROUP BY pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac
    ORDER BY pb.ten_phong_ban;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- BƯỚC 6: CẬP NHẬT CÁC CONSTRAINT ĐÚNG LOGIC
-- =============================================

-- Constraint đúng cho phiếu nhập
ALTER TABLE phieu_nhap 
DROP CONSTRAINT IF EXISTS check_phieu_nhap_logic;

ALTER TABLE phieu_nhap 
ADD CONSTRAINT check_phieu_nhap_logic 
CHECK (
    -- "tu_mua" và "tren_cap": phải có NCC, không có phòng ban cung cấp
    (
        loai_phieu IN ('tu_mua', 'tren_cap') 
        AND nha_cung_cap_id IS NOT NULL 
        AND phong_ban_cung_cap_id IS NULL
    )
    OR
    -- "dieu_chuyen": phải có phòng ban cung cấp, không có NCC
    (
        loai_phieu = 'dieu_chuyen' 
        AND phong_ban_cung_cap_id IS NOT NULL 
        AND nha_cung_cap_id IS NULL
    )
);

-- =============================================
-- BƯỚC 7: VIEW HỖ TRỢ DEBUG VÀ KIỂM TRA
-- =============================================

-- View debug phiếu nhập với logic đúng
CREATE OR REPLACE VIEW v_debug_phieu_nhap_logic AS
SELECT 
    pn.id,
    pn.so_phieu,
    pn.loai_phieu,
    pn.trang_thai,
    
    -- Thông tin NCC 
    ncc.id as ncc_id,
    ncc.ten_ncc,
    ncc.is_noi_bo as ncc_is_noi_bo,
    ncc.loai_nha_cung_cap,
    
    -- Thông tin phòng ban cung cấp
    pn.phong_ban_cung_cap_id,
    pb_cc.ten_phong_ban as ten_phong_ban_cung_cap,
    
    -- Kiểm tra logic đúng/sai
    CASE 
        WHEN pn.loai_phieu = 'tu_mua' AND ncc.id IS NOT NULL AND ncc.is_noi_bo = FALSE THEN 'OK'
        WHEN pn.loai_phieu = 'tren_cap' AND ncc.id IS NOT NULL AND ncc.is_noi_bo = TRUE THEN 'OK'  
        WHEN pn.loai_phieu = 'dieu_chuyen' AND pn.phong_ban_cung_cap_id IS NOT NULL THEN 'OK'
        ELSE 'SAI LOGIC'
    END as logic_check
    
FROM phieu_nhap pn
LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
LEFT JOIN phong_ban pb_cc ON pn.phong_ban_cung_cap_id = pb_cc.id
ORDER BY pn.created_at DESC;

-- =============================================
-- BƯỚC 8: INDEXES TỐI ƯU
-- =============================================

CREATE INDEX IF NOT EXISTS idx_nha_cung_cap_loai_phieu ON nha_cung_cap(loai_nha_cung_cap, is_noi_bo, trang_thai);
CREATE INDEX IF NOT EXISTS idx_phieu_nhap_logic_check ON phieu_nhap(loai_phieu, nha_cung_cap_id, phong_ban_cung_cap_id);

COMMIT;

-- =============================================
-- KIỂM TRA KẾT QUẢ
-- =============================================

-- Kiểm tra phân loại NCC
SELECT 
    loai_nha_cung_cap,
    is_noi_bo,
    COUNT(*) as so_luong
FROM nha_cung_cap 
WHERE trang_thai = 'active'
GROUP BY loai_nha_cung_cap, is_noi_bo
ORDER BY loai_nha_cung_cap;

-- Kiểm tra logic phiếu nhập
SELECT 
    loai_phieu,
    logic_check,
    COUNT(*) as so_phieu
FROM v_debug_phieu_nhap_logic
GROUP BY loai_phieu, logic_check
ORDER BY loai_phieu;

-- Test functions
SELECT 'NCC cho tự mua:' as test, COUNT(*) as count FROM get_nha_cung_cap_by_loai_phieu('tu_mua')
UNION ALL
SELECT 'NCC cho trên cấp:', COUNT(*) FROM get_nha_cung_cap_by_loai_phieu('tren_cap');

SELECT 'Fix logic nghiệp vụ hoàn tất!' as status;

DROP TRIGGER IF EXISTS tr_auto_notification_backup_phieu_nhap ON phieu_nhap;
DROP TRIGGER IF EXISTS tr_auto_notification_backup_phieu_xuat ON phieu_xuat;


-- =============================================
-- KIỂM KÊ
-- =============================================

-- Bảng phiếu kiểm kê
CREATE TABLE IF NOT EXISTS phieu_kiem_ke (
    id SERIAL PRIMARY KEY,
    so_phieu VARCHAR(50) NOT NULL UNIQUE,
    ngay_kiem_ke DATE NOT NULL,
    gio_kiem_ke TIME NOT NULL,
    don_vi_kiem_ke VARCHAR(200),
    so_quyet_dinh VARCHAR(100) DEFAULT '',
    ly_do_kiem_ke TEXT DEFAULT 'Kiểm kê định kỳ',
    loai_kiem_ke VARCHAR(20) DEFAULT 'dinh_ky' CHECK (loai_kiem_ke IN ('dinh_ky', 'dot_xuat', 'dac_biet', 'chuyen_giao', 'thanh_ly')),
    to_kiem_ke JSONB,
    trang_thai trang_thai_phieu DEFAULT 'draft',
    nguoi_tao INTEGER NOT NULL REFERENCES users(id),
    nguoi_duyet INTEGER REFERENCES users(id),
    ngay_duyet TIMESTAMP,
    phong_ban_id INTEGER REFERENCES phong_ban(id),
    ghi_chu TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng chi tiết kiểm kê
CREATE TABLE IF NOT EXISTS chi_tiet_kiem_ke (
    id SERIAL PRIMARY KEY,
    phieu_kiem_ke_id INTEGER NOT NULL REFERENCES phieu_kiem_ke(id) ON DELETE CASCADE,
    hang_hoa_id INTEGER NOT NULL REFERENCES hang_hoa(id),
    so_luong_so_sach DECIMAL(10,2) NOT NULL,
    sl_tot DECIMAL(10,2) DEFAULT 0,
    sl_kem_pham_chat DECIMAL(10,2) DEFAULT 0, 
    sl_mat_pham_chat DECIMAL(10,2) DEFAULT 0,
    sl_hong DECIMAL(10,2) DEFAULT 0,
    sl_can_thanh_ly DECIMAL(10,2) DEFAULT 0,
    so_luong_thuc_te DECIMAL(10,2) GENERATED ALWAYS AS (sl_tot + sl_kem_pham_chat + sl_mat_pham_chat + sl_hong + sl_can_thanh_ly) STORED,
    so_luong_chenh_lech DECIMAL(10,2) GENERATED ALWAYS AS ((sl_tot + sl_kem_pham_chat + sl_mat_pham_chat + sl_hong + sl_can_thanh_ly) - so_luong_so_sach) STORED,
    don_gia DECIMAL(15,2) NOT NULL,
    gia_tri_tot DECIMAL(15,2) GENERATED ALWAYS AS (sl_tot * don_gia) STORED,
    gia_tri_kem DECIMAL(15,2) GENERATED ALWAYS AS (sl_kem_pham_chat * don_gia * 0.7) STORED,
    gia_tri_mat DECIMAL(15,2) GENERATED ALWAYS AS (sl_mat_pham_chat * don_gia * 0.3) STORED,
    gia_tri_hong DECIMAL(15,2) DEFAULT 0,
    gia_tri_thanh_ly DECIMAL(15,2) GENERATED ALWAYS AS (sl_can_thanh_ly * don_gia * 0.1) STORED,
    gia_tri_chenh_lech DECIMAL(15,2) GENERATED ALWAYS AS ((sl_tot * don_gia) + (sl_kem_pham_chat * don_gia * 0.7) + (sl_mat_pham_chat * don_gia * 0.3) + 0 + (sl_can_thanh_ly * don_gia * 0.1) - (so_luong_so_sach * don_gia)) STORED,
    ly_do_chenh_lech TEXT,
    de_nghi_xu_ly TEXT,
    danh_sach_seri_kiem_ke TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng lịch sử kiểm kê
CREATE TABLE IF NOT EXISTS lich_su_kiem_ke (
    id SERIAL PRIMARY KEY,
    hang_hoa_id INTEGER NOT NULL REFERENCES hang_hoa(id),
    phieu_kiem_ke_id INTEGER NOT NULL REFERENCES phieu_kiem_ke(id),
    phong_ban_id INTEGER NOT NULL REFERENCES phong_ban(id),
    ngay_kiem_ke DATE NOT NULL,
    so_luong_so_sach DECIMAL(15,3) NOT NULL DEFAULT 0,
    so_luong_thuc_te DECIMAL(15,3) NOT NULL DEFAULT 0,
    chenh_lech DECIMAL(15,3) NOT NULL DEFAULT 0,
    sl_tot DECIMAL(15,3) DEFAULT 0,
    sl_kem_pham_chat DECIMAL(15,3) DEFAULT 0,
    sl_mat_pham_chat DECIMAL(15,3) DEFAULT 0,
    sl_hong DECIMAL(15,3) DEFAULT 0,
    sl_can_thanh_ly DECIMAL(15,3) DEFAULT 0,
    don_gia DECIMAL(15,2),
    gia_tri_chenh_lech DECIMAL(15,2),
    ly_do_chenh_lech TEXT,
    de_nghi_xu_ly TEXT,
    trang_thai VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo lại các function và trigger liên quan
CREATE TRIGGER tr_update_ton_kho_after_kiem_ke AFTER UPDATE ON phieu_kiem_ke FOR EACH ROW WHEN (NEW.trang_thai IS DISTINCT FROM OLD.trang_thai) EXECUTE FUNCTION update_ton_kho_after_kiem_ke();
CREATE TRIGGER tr_auto_so_phieu_kiem_ke BEFORE INSERT ON phieu_kiem_ke FOR EACH ROW EXECUTE FUNCTION auto_generate_so_phieu_kiem_ke();

CREATE OR REPLACE FUNCTION get_ton_kho_for_kiem_ke(p_phong_ban_id INTEGER)
RETURNS TABLE(
    hang_hoa_id INTEGER,
    ma_hang_hoa VARCHAR(50),
    ten_hang_hoa VARCHAR(200),
    don_vi_tinh VARCHAR(20),
    ten_loai VARCHAR(100),
    so_luong_ton DECIMAL(10,2),
    sl_tot DECIMAL(10,2),
    sl_kem_pham_chat DECIMAL(10,2),
    sl_mat_pham_chat DECIMAL(10,2),
    sl_hong DECIMAL(10,2),
    sl_can_thanh_ly DECIMAL(10,2),
    don_gia_moi_nhat DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tk.hang_hoa_id, 
        h.ma_hang_hoa, 
        h.ten_hang_hoa, 
        h.don_vi_tinh, 
        lh.ten_loai, 
        tk.so_luong_ton, 
        tk.sl_tot, 
        tk.sl_kem_pham_chat, 
        tk.sl_mat_pham_chat, 
        tk.sl_hong, 
        tk.sl_can_thanh_ly,
        COALESCE((
            SELECT ls.don_gia 
            FROM lich_su_gia ls 
            JOIN phieu_nhap pn ON ls.phieu_nhap_id = pn.id
            WHERE ls.hang_hoa_id = h.id 
            -- DÒNG GÂY LỖI "AND ls.nguon_gia = 'nhap_kho'" ĐÃ BỊ XÓA BỎ
            AND pn.trang_thai = 'completed'
            ORDER BY ls.ngay_ap_dung DESC, ls.created_at DESC 
            LIMIT 1
        ), h.gia_nhap_gan_nhat, 0) as don_gia_moi_nhat
    FROM ton_kho tk
    JOIN hang_hoa h ON tk.hang_hoa_id = h.id
    LEFT JOIN loai_hang_hoa lh ON h.loai_hang_hoa_id = lh.id
    WHERE tk.phong_ban_id = p_phong_ban_id AND tk.so_luong_ton > 0 AND h.trang_thai = 'active'
    ORDER BY h.ten_hang_hoa ASC;
END;
$$ LANGUAGE plpgsql;