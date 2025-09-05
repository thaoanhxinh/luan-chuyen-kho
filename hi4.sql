-- =============================================
-- DỌN DẸP DATABASE THEO QUY TRÌNH MỚI
-- Chỉ có cấp 3 mới có kho, admin và manager chỉ duyệt
-- =============================================

-- 1. Xóa các bảng và view không cần thiết cho quy trình mới
DROP TABLE IF EXISTS yeu_cau_nhap_kho CASCADE;
DROP TABLE IF EXISTS chi_tiet_yeu_cau_nhap CASCADE;
DROP TABLE IF EXISTS yeu_cau_xuat_kho CASCADE; 
DROP TABLE IF EXISTS chi_tiet_yeu_cau_xuat CASCADE;
DROP TABLE IF EXISTS phieu_kiem_ke CASCADE;
DROP TABLE IF EXISTS chi_tiet_kiem_ke CASCADE;
DROP TABLE IF EXISTS lich_su_kiem_ke CASCADE;
DROP TABLE IF EXISTS quan_he_phong_ban CASCADE;
DROP VIEW IF EXISTS view_ton_kho CASCADE;

-- 2. Xóa các cột thừa trong bảng phieu_nhap
ALTER TABLE phieu_nhap DROP COLUMN IF EXISTS yeu_cau_nhap_id;
ALTER TABLE phieu_nhap DROP COLUMN IF EXISTS tu_dong_chon_cap1;
ALTER TABLE phieu_nhap DROP COLUMN IF EXISTS workflow_type;

-- 3. Xóa các cột thừa trong bảng phieu_xuat  
ALTER TABLE phieu_xuat DROP COLUMN IF EXISTS yeu_cau_xuat_id;
ALTER TABLE phieu_xuat DROP COLUMN IF EXISTS workflow_type;

-- 4. Xóa các cột thừa trong bảng hang_hoa (chỉ cấp 3 có kho)
ALTER TABLE hang_hoa DROP COLUMN IF EXISTS phong_ban_id;

-- 5. Cập nhật enum loai_phieu_nhap - chỉ giữ 3 loại: tu_mua, tren_cap, dieu_chuyen
-- Xóa 'luan_chuyen' vì đã đổi thành 'dieu_chuyen'
-- Kiểm tra và cập nhật dữ liệu
UPDATE phieu_nhap SET loai_phieu = 'dieu_chuyen' WHERE loai_phieu = 'luan_chuyen';

-- 6. Cập nhật enum loai_xuat - chỉ giữ 2 loại: don_vi_su_dung, don_vi_nhan
-- don_vi_su_dung: chính mình sử dụng
-- don_vi_nhan: xuất cho đơn vị khác (luân chuyển)
ALTER TYPE loai_xuat RENAME TO loai_xuat_old;
CREATE TYPE loai_xuat AS ENUM ('don_vi_su_dung', 'don_vi_nhan');

-- Cập nhật dữ liệu trong bảng phieu_xuat
ALTER TABLE phieu_xuat ALTER COLUMN loai_xuat TYPE loai_xuat USING 
  CASE 
    WHEN loai_xuat::text = 'don_vi_nhan' THEN 'don_vi_nhan'::loai_xuat
    ELSE 'don_vi_su_dung'::loai_xuat
  END;

DROP TYPE loai_xuat_old;

-- 7. Cập nhật enum trang_thai_phieu - đơn giản hóa workflow
ALTER TYPE trang_thai_phieu RENAME TO trang_thai_phieu_old;
CREATE TYPE trang_thai_phieu AS ENUM (
  'draft', 
  'confirmed', 
  'pending_approval',
  'pending_level3_approval', -- Cho trường hợp điều chuyển, cấp 3 kia cần duyệt trước
  'approved', 
  'completed',
  'cancelled',
  'revision_required'
);

-- Cập nhật dữ liệu
ALTER TABLE phieu_nhap ALTER COLUMN trang_thai TYPE trang_thai_phieu USING 
  CASE 
    WHEN trang_thai::text IN ('pending_manager_approval', 'pending_admin_approval') THEN 'pending_approval'::trang_thai_phieu
    WHEN trang_thai::text = 'confirmed' THEN 'confirmed'::trang_thai_phieu
    WHEN trang_thai::text = 'approved' THEN 'approved'::trang_thai_phieu
    WHEN trang_thai::text = 'completed' THEN 'completed'::trang_thai_phieu
    WHEN trang_thai::text = 'cancelled' THEN 'cancelled'::trang_thai_phieu
    WHEN trang_thai::text = 'revision_required' THEN 'revision_required'::trang_thai_phieu
    WHEN trang_thai::text = 'pending_level3_approval' THEN 'pending_level3_approval'::trang_thai_phieu
    ELSE 'draft'::trang_thai_phieu
  END;

ALTER TABLE phieu_xuat ALTER COLUMN trang_thai TYPE trang_thai_phieu USING 
  CASE 
    WHEN trang_thai::text IN ('pending_manager_approval', 'pending_admin_approval') THEN 'pending_approval'::trang_thai_phieu
    WHEN trang_thai::text = 'confirmed' THEN 'confirmed'::trang_thai_phieu
    WHEN trang_thai::text = 'approved' THEN 'approved'::trang_thai_phieu
    WHEN trang_thai::text = 'completed' THEN 'completed'::trang_thai_phieu
    WHEN trang_thai::text = 'cancelled' THEN 'cancelled'::trang_thai_phieu
    WHEN trang_thai::text = 'revision_required' THEN 'revision_required'::trang_thai_phieu
    WHEN trang_thai::text = 'pending_level3_approval' THEN 'pending_level3_approval'::trang_thai_phieu
    ELSE 'draft'::trang_thai_phieu
  END;

DROP TYPE trang_thai_phieu_old;

-- 8. Đảm bảo chỉ cấp 3 có tồn kho - xóa tồn kho của cấp 1,2
DELETE FROM ton_kho WHERE phong_ban_id IN (
  SELECT id FROM phong_ban WHERE cap_bac IN (1, 2)
);

-- 9. Xóa các enum không cần thiết
DROP TYPE IF EXISTS trang_thai_yeu_cau;
DROP TYPE IF EXISTS loai_yeu_cau;
DROP TYPE IF EXISTS muc_do_uu_tien;
DROP TYPE IF EXISTS nguon_gia;

-- 10. Cập nhật lại nhà cung cấp - cho loại điều chuyển thì nhà cung cấp là phòng ban nội bộ
-- Đảm bảo có cột is_noi_bo
ALTER TABLE nha_cung_cap ADD COLUMN IF NOT EXISTS is_noi_bo BOOLEAN DEFAULT FALSE;

-- Tạo nhà cung cấp nội bộ cho các phòng ban cấp 3
INSERT INTO nha_cung_cap (ma_ncc, ten_ncc, is_noi_bo, phong_ban_id, trang_thai)
SELECT 
  CONCAT('NB_', pb.ma_phong_ban),
  CONCAT('[Nội bộ] ', pb.ten_phong_ban),
  TRUE,
  pb.id,
  'active'
FROM phong_ban pb
WHERE pb.cap_bac = 3
AND NOT EXISTS (
  SELECT 1 FROM nha_cung_cap ncc 
  WHERE ncc.phong_ban_id = pb.id AND ncc.is_noi_bo = TRUE
);

-- 11. Cập nhật đơn vị nhận - cho loại xuất đơn vị
ALTER TABLE don_vi_nhan ADD COLUMN IF NOT EXISTS is_noi_bo BOOLEAN DEFAULT FALSE;

-- Tạo đơn vị nhận nội bộ cho các phòng ban cấp 3
INSERT INTO don_vi_nhan (ma_don_vi, ten_don_vi, is_noi_bo, phong_ban_id, trang_thai)
SELECT 
  CONCAT('NB_', pb.ma_phong_ban),
  CONCAT('[Nội bộ] ', pb.ten_phong_ban),
  TRUE,
  pb.id,
  'active'
FROM phong_ban pb
WHERE pb.cap_bac = 3
AND NOT EXISTS (
  SELECT 1 FROM don_vi_nhan dvn 
  WHERE dvn.phong_ban_id = pb.id AND dvn.is_noi_bo = TRUE
);

-- 12. Cập nhật thông báo theo enum mới
UPDATE notifications 
SET loai_thong_bao = 'phieu_nhap_can_duyet'
WHERE loai_thong_bao = 'phieu_can_duyet';

UPDATE notifications 
SET loai_thong_bao = 'phieu_nhap_duyet' 
WHERE loai_thong_bao = 'phieu_duyet';

UPDATE notifications 
SET loai_thong_bao = 'phieu_nhap_can_sua'
WHERE loai_thong_bao = 'phieu_can_sua';

-- 13. Xóa các trigger và function không cần thiết
DROP TRIGGER IF EXISTS update_ton_kho_after_approved ON phieu_nhap;
DROP TRIGGER IF EXISTS update_ton_kho_after_xuat_approved ON phieu_xuat;
DROP TRIGGER IF EXISTS auto_create_phieu_xuat_when_approved ON phieu_nhap;

DROP FUNCTION IF EXISTS update_ton_kho_from_approved_phieu();
DROP FUNCTION IF EXISTS update_ton_kho_from_xuat_approved();  
DROP FUNCTION IF EXISTS auto_create_phieu_xuat_when_approved();
DROP FUNCTION IF EXISTS get_cap3_cung_cap_bac();
DROP FUNCTION IF EXISTS determine_workflow_type();

-- 14. Tạo lại trigger đơn giản cho tồn kho
CREATE OR REPLACE FUNCTION update_ton_kho_simple()
RETURNS TRIGGER AS $$
BEGIN
    -- Chỉ cập nhật tồn kho khi phiếu ở trạng thái completed
    IF NEW.trang_thai = 'completed' AND OLD.trang_thai != 'completed' THEN
        -- Cập nhật tồn kho cho phiếu nhập
        IF TG_TABLE_NAME = 'phieu_nhap' THEN
            INSERT INTO ton_kho (hang_hoa_id, phong_ban_id, so_luong_ton, gia_nhap_gan_nhat)
            SELECT 
                ct.hang_hoa_id,
                NEW.phong_ban_id,
                ct.so_luong,
                ct.don_gia
            FROM chi_tiet_nhap ct
            WHERE ct.phieu_nhap_id = NEW.id
            ON CONFLICT (hang_hoa_id, phong_ban_id) 
            DO UPDATE SET 
                so_luong_ton = ton_kho.so_luong_ton + EXCLUDED.so_luong_ton,
                gia_nhap_gan_nhat = EXCLUDED.gia_nhap_gan_nhat,
                updated_at = CURRENT_TIMESTAMP;
        
        -- Cập nhật tồn kho cho phiếu xuất
        ELSIF TG_TABLE_NAME = 'phieu_xuat' THEN
            UPDATE ton_kho 
            SET so_luong_ton = ton_kho.so_luong_ton - ct.so_luong,
                updated_at = CURRENT_TIMESTAMP
            FROM chi_tiet_xuat ct
            WHERE ct.phieu_xuat_id = NEW.id
            AND ton_kho.hang_hoa_id = ct.hang_hoa_id
            AND ton_kho.phong_ban_id = NEW.phong_ban_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo lại trigger
CREATE TRIGGER update_ton_kho_after_completed_nhap
    AFTER UPDATE ON phieu_nhap
    FOR EACH ROW
    EXECUTE FUNCTION update_ton_kho_simple();

CREATE TRIGGER update_ton_kho_after_completed_xuat
    AFTER UPDATE ON phieu_xuat
    FOR EACH ROW
    EXECUTE FUNCTION update_ton_kho_simple();

-- 15. Tạo function để tự động tạo phiếu xuất khi phiếu nhập điều chuyển được approved
CREATE OR REPLACE FUNCTION auto_create_phieu_xuat_dieu_chuyen()
RETURNS TRIGGER AS $$
DECLARE
    v_so_phieu_xuat TEXT;
    v_phieu_xuat_id INTEGER;
    v_chi_tiet RECORD;
    v_date_str TEXT;
    v_max_seq INTEGER;
    v_don_vi_nhan_id INTEGER;
BEGIN
    -- Chỉ xử lý khi phiếu nhập điều chuyển được approved
    IF NEW.loai_phieu = 'dieu_chuyen' 
       AND NEW.trang_thai = 'approved' 
       AND OLD.trang_thai = 'pending_approval' THEN
        
        -- Tạo số phiếu xuất
        v_date_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
        
        SELECT COALESCE(MAX(CAST(RIGHT(so_phieu, 4) AS INTEGER)), 0) + 1 
        INTO v_max_seq
        FROM phieu_xuat 
        WHERE so_phieu LIKE 'PX' || v_date_str || '%';
        
        v_so_phieu_xuat := 'PX' || v_date_str || LPAD(v_max_seq::text, 4, '0');
        
        -- Tìm đơn vị nhận nội bộ tương ứng với phòng ban nhập
        SELECT id INTO v_don_vi_nhan_id
        FROM don_vi_nhan 
        WHERE phong_ban_id = NEW.phong_ban_id AND is_noi_bo = TRUE
        LIMIT 1;
        
        -- Tạo phiếu xuất cho phòng ban cung cấp
        INSERT INTO phieu_xuat (
            so_phieu, ngay_xuat, don_vi_nhan_id, nguoi_nhan,
            ly_do_xuat, loai_xuat, so_quyet_dinh, trang_thai,
            nguoi_tao, phong_ban_id, phong_ban_nhan_id,
            phieu_nhap_lien_ket_id, is_tu_dong, ghi_chu
        ) VALUES (
            v_so_phieu_xuat,
            NEW.ngay_nhap,
            v_don_vi_nhan_id,
            'Tự động từ phiếu nhập ' || NEW.so_phieu,
            'Điều chuyển hàng hóa cho ' || (SELECT ten_phong_ban FROM phong_ban WHERE id = NEW.phong_ban_id),
            'don_vi_nhan',
            NEW.so_quyet_dinh,
            'approved',
            NEW.nguoi_tao,
            NEW.phong_ban_cung_cap_id,
            NEW.phong_ban_id,
            NEW.id,
            TRUE,
            'Phiếu xuất tự động tạo từ phiếu nhập điều chuyển'
        ) RETURNING id INTO v_phieu_xuat_id;
        
        -- Tạo chi tiết phiếu xuất
        FOR v_chi_tiet IN 
            SELECT hang_hoa_id, so_luong, don_gia, pham_chat
            FROM chi_tiet_nhap 
            WHERE phieu_nhap_id = NEW.id
        LOOP
            INSERT INTO chi_tiet_xuat (
                phieu_xuat_id, hang_hoa_id, so_luong_ke_hoach, 
                so_luong, don_gia, thanh_tien, pham_chat
            ) VALUES (
                v_phieu_xuat_id,
                v_chi_tiet.hang_hoa_id,
                v_chi_tiet.so_luong,
                v_chi_tiet.so_luong,
                v_chi_tiet.don_gia,
                v_chi_tiet.so_luong * v_chi_tiet.don_gia,
                v_chi_tiet.pham_chat
            );
        END LOOP;
        
        -- Cập nhật phiếu nhập với ID phiếu xuất liên kết
        UPDATE phieu_nhap 
        SET phieu_xuat_lien_ket_id = v_phieu_xuat_id
        WHERE id = NEW.id;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger
CREATE TRIGGER auto_create_xuat_dieu_chuyen
    AFTER UPDATE ON phieu_nhap
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_phieu_xuat_dieu_chuyen();

-- =============================================
-- FINAL CLEANUP - XÓA DỮ LIỆU VÀ CỘT THỪA CỤ THỂ
-- Dọn dẹp triệt để để phù hợp quy trình mới
-- =============================================

-- Kiểm tra trước khi xóa
SELECT 'TRƯỚC KHI DỌN DẸP:' as status;
SELECT 
  'phieu_nhap' as table_name, 
  COUNT(*) as total_records,
  COUNT(CASE WHEN trang_thai = 'draft' THEN 1 END) as draft,
  COUNT(CASE WHEN trang_thai = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN trang_thai = 'completed' THEN 1 END) as completed
FROM phieu_nhap
UNION ALL
SELECT 
  'phieu_xuat' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN trang_thai = 'draft' THEN 1 END) as draft,
  COUNT(CASE WHEN trang_thai = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN trang_thai = 'completed' THEN 1 END) as completed
FROM phieu_xuat;

-- =============================================
-- BƯỚC 1: XÓA CÁC CỘT THỪA TRONG BẢNG PHIEU_NHAP
-- =============================================

-- Kiểm tra các cột tồn tại trước khi xóa
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'phieu_nhap' 
AND column_name IN (
  'nguoi_duyet_cap2', 'ngay_duyet_cap2', 'workflow_type', 
  'tu_dong_chon_cap1', 'yeu_cau_nhap_id'
);

-- Xóa các cột thừa trong phieu_nhap
ALTER TABLE phieu_nhap 
DROP COLUMN IF EXISTS nguoi_duyet_cap2 CASCADE,
DROP COLUMN IF EXISTS ngay_duyet_cap2 CASCADE,
DROP COLUMN IF EXISTS workflow_type CASCADE,
DROP COLUMN IF EXISTS tu_dong_chon_cap1 CASCADE,
DROP COLUMN IF EXISTS yeu_cau_nhap_id CASCADE;

-- Đổi tên cột nguoi_duyet thành nguoi_duyet_cap1 nếu chưa đổi
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phieu_nhap' AND column_name = 'nguoi_duyet') THEN
        ALTER TABLE phieu_nhap RENAME COLUMN nguoi_duyet TO nguoi_duyet_cap1;
        ALTER TABLE phieu_nhap RENAME COLUMN ngay_duyet TO ngay_duyet_cap1;
    END IF;
END $$;

-- =============================================
-- BƯỚC 2: XÓA CÁC CỘT THỪA TRONG BẢNG PHIEU_XUAT
-- =============================================

-- Kiểm tra các cột tồn tại
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'phieu_xuat' 
AND column_name IN (
  'nguoi_duyet_cap2', 'ngay_duyet_cap2', 'workflow_type', 'yeu_cau_xuat_id'
);

-- Xóa các cột thừa trong phieu_xuat
ALTER TABLE phieu_xuat 
DROP COLUMN IF EXISTS nguoi_duyet_cap2,
DROP COLUMN IF EXISTS ngay_duyet_cap2,  
DROP COLUMN IF EXISTS workflow_type,
DROP COLUMN IF EXISTS yeu_cau_xuat_id;

-- Đổi tên cột nguoi_duyet thành nguoi_duyet_cap1 nếu chưa đổi
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phieu_xuat' AND column_name = 'nguoi_duyet') THEN
        ALTER TABLE phieu_xuat RENAME COLUMN nguoi_duyet TO nguoi_duyet_cap1;
        ALTER TABLE phieu_xuat RENAME COLUMN ngay_duyet TO ngay_duyet_cap1;
    END IF;
END $$;

-- =============================================
-- BƯỚC 3: XÓA CÁC BẢNG KHÔNG CẦN THIẾT
-- =============================================

-- Liệt kê các bảng sẽ bị xóa
SELECT 'CÁC BẢNG SẼ BỊ XÓA:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'yeu_cau_nhap_kho',
  'chi_tiet_yeu_cau_nhap', 
  'yeu_cau_xuat_kho',
  'chi_tiet_yeu_cau_xuat',
  'phieu_kiem_ke',
  'chi_tiet_kiem_ke',
  'lich_su_kiem_ke',
  'quan_he_phong_ban'
);

-- Xóa các bảng không cần thiết (có CASCADE để xóa ràng buộc)
DROP TABLE IF EXISTS chi_tiet_yeu_cau_nhap CASCADE;
DROP TABLE IF EXISTS yeu_cau_nhap_kho CASCADE;
DROP TABLE IF EXISTS chi_tiet_yeu_cau_xuat CASCADE;
DROP TABLE IF EXISTS yeu_cau_xuat_kho CASCADE;
DROP TABLE IF EXISTS chi_tiet_kiem_ke CASCADE;
DROP TABLE IF EXISTS lich_su_kiem_ke CASCADE;
DROP TABLE IF EXISTS phieu_kiem_ke CASCADE;
DROP TABLE IF EXISTS quan_he_phong_ban CASCADE;

-- =============================================
-- BƯỚC 4: XÓA CÁC VIEW KHÔNG CẦN THIẾT
-- =============================================

DROP VIEW IF EXISTS view_ton_kho CASCADE;
DROP VIEW IF EXISTS view_phieu_nhap_full CASCADE;
DROP VIEW IF EXISTS view_phieu_xuat_full CASCADE;

-- =============================================
-- BƯỚC 5: XÓA CÁC FUNCTION VÀ TRIGGER THỪA
-- =============================================

-- Xóa các trigger cũ
DROP TRIGGER IF EXISTS update_ton_kho_after_approved ON phieu_nhap;
DROP TRIGGER IF EXISTS update_ton_kho_after_xuat_approved ON phieu_xuat;
DROP TRIGGER IF EXISTS auto_create_phieu_xuat_when_approved ON phieu_nhap;
DROP TRIGGER IF EXISTS update_phieu_timestamps ON phieu_nhap;
DROP TRIGGER IF EXISTS update_phieu_timestamps ON phieu_xuat;

-- Xóa các function cũ
DROP FUNCTION IF EXISTS update_ton_kho_from_approved_phieu() CASCADE;
DROP FUNCTION IF EXISTS update_ton_kho_from_xuat_approved() CASCADE;
DROP FUNCTION IF EXISTS auto_create_phieu_xuat_when_approved() CASCADE;
DROP FUNCTION IF EXISTS get_cap3_cung_cap_bac(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS determine_workflow_type(loai_phieu_nhap, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_modified_column() CASCADE;

-- =============================================
-- BƯỚC 6: XÓA CÁC ENUM KHÔNG CẦN THIẾT
-- =============================================

-- Kiểm tra các enum hiện có
SELECT enumlabel, enumtypid::regtype as enum_name
FROM pg_enum pe
JOIN pg_type pt ON pe.enumtypid = pt.oid
WHERE pt.typname IN (
  'trang_thai_yeu_cau', 'loai_yeu_cau', 'muc_do_uu_tien', 'nguon_gia'
)
ORDER BY pt.typname, pe.enumsortorder;

-- Xóa enum không cần thiết
DROP TYPE IF EXISTS trang_thai_yeu_cau CASCADE;
DROP TYPE IF EXISTS loai_yeu_cau CASCADE;
DROP TYPE IF EXISTS muc_do_uu_tien CASCADE;
DROP TYPE IF EXISTS nguon_gia CASCADE;

-- =============================================
-- BƯỚC 7: DỌN DẸP DỮ LIỆU TỒN KHO
-- =============================================

-- Xóa tồn kho của cấp 1 và cấp 2 (chỉ cấp 3 mới có kho)
DELETE FROM ton_kho 
WHERE phong_ban_id IN (
  SELECT id FROM phong_ban WHERE cap_bac IN (1, 2)
);

-- Xóa hàng hóa không thuộc về phòng ban nào (do đã xóa cột phong_ban_id)
-- Nhưng trước đó phải cập nhật lại
SELECT 'Số lượng hàng hóa trước khi dọn dẹp:' as info, COUNT(*) as count FROM hang_hoa;

-- Xóa hàng hóa không có trong bất kỳ phiếu nào
DELETE FROM hang_hoa 
WHERE id NOT IN (
  SELECT DISTINCT hang_hoa_id FROM chi_tiet_nhap
  UNION 
  SELECT DISTINCT hang_hoa_id FROM chi_tiet_xuat
  UNION
  SELECT DISTINCT hang_hoa_id FROM ton_kho
);

SELECT 'Số lượng hàng hóa sau khi dọn dẹp:' as info, COUNT(*) as count FROM hang_hoa;

-- =============================================
-- BƯỚC 8: DỌN DẸP NOTIFICATIONS
-- =============================================

-- Xóa thông báo liên quan đến workflow cũ
DELETE FROM notifications 
WHERE phieu_type IN ('yeu_cau_nhap', 'yeu_cau_xuat', 'kiem_ke');

-- Cập nhật loại thông báo
UPDATE notifications 
SET loai_thong_bao = CASE 
  WHEN loai_thong_bao = 'yeu_cau_moi' THEN 'phieu_nhap_can_duyet'
  WHEN loai_thong_bao = 'phe_duyet' THEN 'phieu_nhap_duyet'
  WHEN loai_thong_bao = 'tu_choi' THEN 'phieu_nhap_can_sua'
  ELSE loai_thong_bao
END
WHERE loai_thong_bao IN ('yeu_cau_moi', 'phe_duyet', 'tu_choi');

-- =============================================
-- BƯỚC 9: CẬP NHẬT LẠI CÁC CỘT QUAN TRỌNG
-- =============================================

-- Đảm bảo cột ngay_gui_duyet tồn tại
ALTER TABLE phieu_nhap ADD COLUMN IF NOT EXISTS ngay_gui_duyet TIMESTAMP WITH TIME ZONE;
ALTER TABLE phieu_xuat ADD COLUMN IF NOT EXISTS ngay_gui_duyet TIMESTAMP WITH TIME ZONE;

-- Đảm bảo cột ghi_chu_phan_hoi tồn tại
ALTER TABLE phieu_nhap ADD COLUMN IF NOT EXISTS ghi_chu_phan_hoi TEXT;
ALTER TABLE phieu_xuat ADD COLUMN IF NOT EXISTS ghi_chu_phan_hoi TEXT;

-- Đảm bảo cột is_tu_dong tồn tại
ALTER TABLE phieu_nhap ADD COLUMN IF NOT EXISTS is_tu_dong BOOLEAN DEFAULT FALSE;
ALTER TABLE phieu_xuat ADD COLUMN IF NOT EXISTS is_tu_dong BOOLEAN DEFAULT FALSE;

-- =============================================
-- BƯỚC 10: INDEXES MỚI CHO HIỆU SUẤT
-- =============================================

-- Xóa indexes cũ không cần thiết
DROP INDEX IF EXISTS idx_phieu_nhap_yeu_cau;
DROP INDEX IF EXISTS idx_phieu_xuat_yeu_cau;
DROP INDEX IF EXISTS idx_yeu_cau_nhap_trang_thai;
DROP INDEX IF EXISTS idx_yeu_cau_xuat_trang_thai;

-- Tạo indexes mới tối ưu
CREATE INDEX IF NOT EXISTS idx_phieu_nhap_phong_ban_trang_thai 
ON phieu_nhap(phong_ban_id, trang_thai);

CREATE INDEX IF NOT EXISTS idx_phieu_xuat_phong_ban_trang_thai 
ON phieu_xuat(phong_ban_id, trang_thai);

CREATE INDEX IF NOT EXISTS idx_phieu_nhap_loai_trang_thai 
ON phieu_nhap(loai_phieu, trang_thai);

CREATE INDEX IF NOT EXISTS idx_phieu_xuat_loai_trang_thai 
ON phieu_xuat(loai_xuat, trang_thai);

CREATE INDEX IF NOT EXISTS idx_phieu_nhap_ngay_trang_thai 
ON phieu_nhap(ngay_nhap, trang_thai);

CREATE INDEX IF NOT EXISTS idx_phieu_xuat_ngay_trang_thai 
ON phieu_xuat(ngay_xuat, trang_thai);

-- =============================================
-- BƯỚC 11: CẬP NHẬT COMMENTS VÀ DOCUMENTATION
-- =============================================

COMMENT ON TABLE phieu_nhap IS 'Phiếu nhập kho - QUY TRÌNH MỚI: Chỉ cấp 3 tạo, admin/manager duyệt';
COMMENT ON TABLE phieu_xuat IS 'Phiếu xuất kho - QUY TRÌNH MỚI: Chỉ cấp 3 tạo, admin/manager duyệt';

COMMENT ON COLUMN phieu_nhap.loai_phieu IS 'QUY TRÌNH MỚI - 3 loại: tu_mua (tự mua), tren_cap (cấp trên cấp), dieu_chuyen (điều chuyển cấp 3)';
COMMENT ON COLUMN phieu_xuat.loai_xuat IS 'QUY TRÌNH MỚI - 2 loại: don_vi_su_dung (sử dụng nội bộ), don_vi_nhan (xuất cho đơn vị khác)';

COMMENT ON COLUMN phieu_nhap.trang_thai IS 'QUY TRÌNH MỚI: draft → confirmed → pending_approval/pending_level3_approval → approved → completed';
COMMENT ON COLUMN phieu_xuat.trang_thai IS 'QUY TRÌNH MỚI: draft → confirmed → pending_approval → approved → completed';

COMMENT ON COLUMN phieu_nhap.phong_ban_cung_cap_id IS 'Chỉ dành cho loai_phieu = tren_cap hoặc dieu_chuyen';
COMMENT ON COLUMN phieu_nhap.nha_cung_cap_id IS 'Nhà cung cấp: bên ngoài cho tu_mua, nội bộ cho tren_cap/dieu_chuyen';

COMMENT ON COLUMN phieu_xuat.phong_ban_nhan_id IS 'Chỉ dành cho loai_xuat = don_vi_nhan và là phòng ban nội bộ';
COMMENT ON COLUMN phieu_xuat.don_vi_nhan_id IS 'Đơn vị nhận: nội bộ hoặc bên ngoài cho loai_xuat = don_vi_nhan';

-- =============================================
-- BƯỚC 12: TẠO LẠI CÁC CONSTRAINT CẦN THIẾT
-- =============================================

-- Constraint cho loai_phieu và phong_ban_cung_cap_id
ALTER TABLE phieu_nhap 
DROP CONSTRAINT IF EXISTS check_phong_ban_cung_cap_logic;

ALTER TABLE phieu_nhap 
ADD CONSTRAINT check_phong_ban_cung_cap_logic 
CHECK (
  (loai_phieu = 'tu_mua' AND phong_ban_cung_cap_id IS NULL) OR
  (loai_phieu IN ('tren_cap', 'dieu_chuyen') AND phong_ban_cung_cap_id IS NOT NULL)
);

-- Constraint cho loai_xuat và don_vi_nhan_id
ALTER TABLE phieu_xuat 
DROP CONSTRAINT IF EXISTS check_don_vi_nhan_logic;

ALTER TABLE phieu_xuat 
ADD CONSTRAINT check_don_vi_nhan_logic 
CHECK (
  (loai_xuat = 'don_vi_su_dung' AND don_vi_nhan_id IS NULL AND phong_ban_nhan_id IS NULL) OR
  (loai_xuat = 'don_vi_nhan' AND (don_vi_nhan_id IS NOT NULL OR phong_ban_nhan_id IS NOT NULL))
);

-- =============================================
-- BƯỚC 13: CẬP NHẬT DỮ LIỆU HIỆN CÓ
-- =============================================

-- Cập nhật trạng thái phiếu theo quy trình mới
UPDATE phieu_nhap 
SET trang_thai = CASE 
  WHEN trang_thai IN ('pending_manager_approval', 'pending_admin_approval') THEN 'pending_approval'
  WHEN trang_thai = 'confirmed' THEN 'confirmed'
  ELSE trang_thai
END
WHERE trang_thai IN ('pending_manager_approval', 'pending_admin_approval');

UPDATE phieu_xuat 
SET trang_thai = CASE 
  WHEN trang_thai IN ('pending_manager_approval', 'pending_admin_approval') THEN 'pending_approval'
  WHEN trang_thai = 'confirmed' THEN 'confirmed'
  ELSE trang_thai
END
WHERE trang_thai IN ('pending_manager_approval', 'pending_admin_approval');

-- Cập nhật loại phiếu cũ
UPDATE phieu_nhap 
SET loai_phieu = 'dieu_chuyen' 
WHERE loai_phieu = 'luan_chuyen';

-- =============================================
-- BƯỚC 14: XÓA DỮ LIỆU TỒN KHO CỦA CẤP 1,2
-- =============================================

SELECT 'Tồn kho trước khi xóa:' as info, COUNT(*) as total FROM ton_kho;

-- Xóa tồn kho của cấp 1,2 (chỉ cấp 3 mới có kho)
DELETE FROM ton_kho 
WHERE phong_ban_id IN (
  SELECT id FROM phong_ban WHERE cap_bac IN (1, 2)
);

SELECT 'Tồn kho sau khi xóa:' as info, COUNT(*) as total FROM ton_kho;

-- =============================================
-- BƯỚC 15: TẠO LẠI NHÀ CUNG CẤP VÀ ĐƠN VỊ NHẬN NỘI BỘ
-- =============================================

-- Đảm bảo có nhà cung cấp nội bộ cho tất cả phòng ban cấp 3
INSERT INTO nha_cung_cap (ma_ncc, ten_ncc, is_noi_bo, phong_ban_id, trang_thai)
SELECT 
  CONCAT('NB_', pb.ma_phong_ban),
  CONCAT('[Nội bộ] ', pb.ten_phong_ban),
  TRUE,
  pb.id,
  'active'
FROM phong_ban pb
WHERE pb.cap_bac = 3 AND pb.is_active = TRUE
AND NOT EXISTS (
  SELECT 1 FROM nha_cung_cap ncc 
  WHERE ncc.phong_ban_id = pb.id AND ncc.is_noi_bo = TRUE
)
ORDER BY pb.ten_phong_ban;

-- Đảm bảo có đơn vị nhận nội bộ cho tất cả phòng ban cấp 3
INSERT INTO don_vi_nhan (ma_don_vi, ten_don_vi, is_noi_bo, phong_ban_id, trang_thai)
SELECT 
  CONCAT('NB_', pb.ma_phong_ban),
  CONCAT('[Nội bộ] ', pb.ten_phong_ban),
  TRUE,
  pb.id,
  'active'
FROM phong_ban pb
WHERE pb.cap_bac = 3 AND pb.is_active = TRUE
AND NOT EXISTS (
  SELECT 1 FROM don_vi_nhan dvn 
  WHERE dvn.phong_ban_id = pb.id AND dvn.is_noi_bo = TRUE
)
ORDER BY pb.ten_phong_ban;

-- =============================================
-- BƯỚC 16: CẬP NHẬT THỐNG KÊ CUỐI CÙNG
-- =============================================

-- Thống kê sau khi dọn dẹp
SELECT 'SAU KHI DỌN DẸP HOÀN TẤT:' as status;

SELECT 
  'phieu_nhap' as table_name,
  COUNT(*) as total,
  COUNT(CASE WHEN trang_thai = 'draft' THEN 1 END) as draft,
  COUNT(CASE WHEN trang_thai = 'pending_approval' THEN 1 END) as pending,
  COUNT(CASE WHEN trang_thai = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN trang_thai = 'completed' THEN 1 END) as completed
FROM phieu_nhap
UNION ALL
SELECT 
  'phieu_xuat' as table_name,
  COUNT(*) as total,
  COUNT(CASE WHEN trang_thai = 'draft' THEN 1 END) as draft,
  COUNT(CASE WHEN trang_thai = 'pending_approval' THEN 1 END) as pending,
  COUNT(CASE WHEN trang_thai = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN trang_thai = 'completed' THEN 1 END) as completed
FROM phieu_xuat
UNION ALL
SELECT 
  'ton_kho' as table_name,
  COUNT(*) as total,
  COUNT(CASE WHEN so_luong_ton > 0 THEN 1 END) as co_ton_kho,
  0 as pending,
  0 as approved
FROM ton_kho
UNION ALL
SELECT 
  'hang_hoa' as table_name,
  COUNT(*) as total,
  COUNT(CASE WHEN trang_thai = 'active' THEN 1 END) as active,
  0 as pending,
  0 as approved  
FROM hang_hoa;

-- Thống kê phòng ban
SELECT 
  'phong_ban_statistics' as info,
  cap_bac,
  COUNT(*) as so_luong,
  COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active
FROM phong_ban 
GROUP BY cap_bac 
ORDER BY cap_bac;

-- Thống kê nhà cung cấp
SELECT 
  'nha_cung_cap_statistics' as info,
  is_noi_bo,
  COUNT(*) as so_luong
FROM nha_cung_cap 
WHERE trang_thai = 'active'
GROUP BY is_noi_bo;

-- Thống kê đơn vị nhận
SELECT 
  'don_vi_nhan_statistics' as info,
  is_noi_bo,
  COUNT(*) as so_luong
FROM don_vi_nhan 
WHERE trang_thai = 'active'
GROUP BY is_noi_bo;

-- =============================================
-- HOÀN TẤT
-- =============================================

SELECT 'DỌN DẸP DATABASE HOÀN TẤT!' as result,
       'Hệ thống đã được cập nhật theo quy trình mới' as description,
       'Chỉ cấp 3 có kho, admin/manager chỉ duyệt' as note;


-- Thêm cột loai_nha_cung_cap vào bảng nha_cung_cap
ALTER TABLE nha_cung_cap 
ADD COLUMN IF NOT EXISTS loai_nha_cung_cap VARCHAR(20) DEFAULT 'tu_mua' 
CHECK (loai_nha_cung_cap IN ('tu_mua', 'tren_cap', 'dieu_chuyen'));

-- Cập nhật dữ liệu hiện có
UPDATE nha_cung_cap 
SET loai_nha_cung_cap = CASE 
    WHEN is_noi_bo = TRUE AND phong_ban_id IS NOT NULL THEN 'dieu_chuyen'
    WHEN is_noi_bo = FALSE THEN 'tu_mua'
    ELSE 'tu_mua'
END;

-- Thêm index để tối ưu search
CREATE INDEX IF NOT EXISTS idx_nha_cung_cap_loai ON nha_cung_cap(loai_nha_cung_cap, trang_thai);


-- Fix lỗi workflow_type trong trigger
-- Chạy SQL này để xóa trigger đang gây lỗi (chỉ cấp 3 có kho, không cần workflow_type nữa)

-- 1. Xóa tất cả trigger và function liên quan workflow_type
DROP TRIGGER IF EXISTS tr_auto_set_workflow_type_nhap ON phieu_nhap;
DROP TRIGGER IF EXISTS tr_auto_set_workflow_type_simple ON phieu_nhap;
DROP TRIGGER IF EXISTS auto_set_workflow_type_trigger ON phieu_nhap;
DROP FUNCTION IF EXISTS auto_set_workflow_type() CASCADE;
DROP FUNCTION IF EXISTS auto_set_workflow_type_v2() CASCADE;
DROP FUNCTION IF EXISTS auto_set_workflow_type_simple() CASCADE;
DROP FUNCTION IF EXISTS determine_workflow_type() CASCADE;
DROP FUNCTION IF EXISTS determine_workflow_type_v2() CASCADE;
DROP FUNCTION IF EXISTS determine_workflow_type_simple() CASCADE;

-- 2. Kiểm tra và xóa tất cả trigger liên quan đến workflow_type
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Tìm và xóa tất cả trigger có chứa workflow_type
    FOR trigger_record IN 
        SELECT tgname, relname
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname IN ('phieu_nhap', 'phieu_xuat')
        AND EXISTS (
            SELECT 1 FROM pg_proc p 
            WHERE p.oid = t.tgfoid 
            AND p.prosrc LIKE '%workflow_type%'
        )
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trigger_record.tgname, trigger_record.relname);
        RAISE NOTICE 'Đã xóa trigger: % trên bảng %', trigger_record.tgname, trigger_record.relname;
    END LOOP;
END $$;

-- 3. Xóa tất cả function có chứa workflow_type
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT p.proname
        FROM pg_proc p
        WHERE p.prosrc LIKE '%workflow_type%'
        AND p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I CASCADE', func_record.proname);
        RAISE NOTICE 'Đã xóa function: %', func_record.proname;
    END LOOP;
END $$;

-- 4. Đảm bảo cột workflow_type đã bị xóa khỏi các bảng
ALTER TABLE phieu_nhap DROP COLUMN IF EXISTS workflow_type CASCADE;
ALTER TABLE phieu_xuat DROP COLUMN IF EXISTS workflow_type CASCADE;

-- 5. Xóa type workflow_type nếu không còn sử dụng
DROP TYPE IF EXISTS workflow_type CASCADE;
DROP TYPE IF EXISTS workflow_type_new CASCADE;
DROP TYPE IF EXISTS workflow_type_old CASCADE;

-- 6. Kiểm tra kết quả
SELECT 'Kiểm tra trigger còn lại:' as check_name;
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname IN ('phieu_nhap', 'phieu_xuat')
ORDER BY c.relname, t.tgname;

SELECT 'Kiểm tra cột còn lại:' as check_name;
SELECT 
    table_name, 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name IN ('phieu_nhap', 'phieu_xuat')
AND column_name LIKE '%workflow%'
ORDER BY table_name, column_name;


-- =============================================
-- 🔧 SỬA CÁC VẤN ĐỀ DATABASE ENUM VÀ TRIGGER
-- =============================================

-- ✅ 1. SỬA LỖI TRIGGER ENUM - Vấn đề nghiêm trọng nhất
DROP TRIGGER IF EXISTS auto_create_phieu_xuat_dieu_chuyen ON phieu_nhap;
DROP FUNCTION IF EXISTS auto_create_phieu_xuat_dieu_chuyen() CASCADE;

-- ✅ 2. TẠO LẠI FUNCTION VÀ TRIGGER ĐÚNG
CREATE OR REPLACE FUNCTION auto_create_phieu_xuat_dieu_chuyen()
RETURNS TRIGGER AS $$
DECLARE
    v_so_phieu_xuat TEXT;
    v_phieu_xuat_id INTEGER;
    v_chi_tiet RECORD;
    v_date_str TEXT;
    v_max_seq INTEGER;
    v_admin_user_id INTEGER;
    v_don_vi_nhan_id INTEGER;
    v_nguoi_giao VARCHAR(100);
    v_so_quyet_dinh TEXT;
    v_phong_ban_cung_cap_info RECORD;
    v_phong_ban_nhan_info RECORD;
BEGIN
    -- 🔥 FIX: Chỉ xử lý điều chuyển cấp 3 khi được duyệt
    IF NEW.loai_phieu = 'dieu_chuyen' 
       AND NEW.trang_thai = 'approved' 
       AND OLD.trang_thai = 'pending_level3_approval' THEN
        
        -- Tạo phiếu xuất tự động cho đơn vị cung cấp (điều chuyển)
        v_date_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
        
        SELECT COALESCE(MAX(CAST(RIGHT(so_phieu, 4) AS INTEGER)), 0) + 1 
        INTO v_max_seq
        FROM phieu_xuat 
        WHERE so_phieu LIKE 'PX' || v_date_str || '%';
        
        v_so_phieu_xuat := 'PX' || v_date_str || LPAD(v_max_seq::text, 4, '0');
        
        -- Tìm admin để làm người tạo phiếu xuất
        SELECT id INTO v_admin_user_id 
        FROM users 
        WHERE role = 'admin' 
        AND trang_thai = 'active' 
        LIMIT 1;
        
        -- Lấy thông tin phòng ban
        SELECT * INTO v_phong_ban_cung_cap_info 
        FROM phong_ban 
        WHERE id = NEW.phong_ban_cung_cap_id;
        
        SELECT * INTO v_phong_ban_nhan_info 
        FROM phong_ban 
        WHERE id = NEW.phong_ban_id;
        
        -- Tạo phiếu xuất
        INSERT INTO phieu_xuat (
            so_phieu, ngay_xuat, loai_xuat, 
            noi_dung, phong_ban_id, nguoi_tao, 
            trang_thai, nguoi_duyet_cap1, ngay_duyet_cap1,
            created_at
        ) VALUES (
            v_so_phieu_xuat,
            CURRENT_DATE,
            'don_vi_nhan',
            'Điều chuyển từ ' || v_phong_ban_cung_cap_info.ten_phong_ban || 
            ' đến ' || v_phong_ban_nhan_info.ten_phong_ban,
            NEW.phong_ban_cung_cap_id, -- Phòng ban xuất hàng
            COALESCE(v_admin_user_id, NEW.nguoi_tao),
            'approved', -- Tự động approved
            COALESCE(v_admin_user_id, NEW.nguoi_duyet_cap1),
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        ) RETURNING id INTO v_phieu_xuat_id;
        
        -- Tạo chi tiết xuất từ chi tiết nhập
        FOR v_chi_tiet IN 
            SELECT * FROM chi_tiet_nhap WHERE phieu_nhap_id = NEW.id
        LOOP
            INSERT INTO chi_tiet_xuat (
                phieu_xuat_id, hang_hoa_id, so_luong, 
                don_gia, pham_chat, danh_diem
            ) VALUES (
                v_phieu_xuat_id,
                v_chi_tiet.hang_hoa_id,
                v_chi_tiet.so_luong,
                v_chi_tiet.don_gia,
                v_chi_tiet.pham_chat,
                v_chi_tiet.danh_diem
            );
        END LOOP;
        
        -- Cập nhật tổng tiền phiếu xuất
        UPDATE phieu_xuat 
        SET tong_tien = (
            SELECT SUM(so_luong * don_gia) 
            FROM chi_tiet_xuat 
            WHERE phieu_xuat_id = v_phieu_xuat_id
        ) 
        WHERE id = v_phieu_xuat_id;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ✅ 3. TẠO LẠI TRIGGER
CREATE TRIGGER auto_create_phieu_xuat_dieu_chuyen
    AFTER UPDATE ON phieu_nhap
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_phieu_xuat_dieu_chuyen();

-- ✅ 4. ĐẢM BẢO CÓ ĐỦ ENUM VALUES
DO $$
BEGIN
    -- Thêm enum nếu chưa có
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'dieu_chuyen' AND enumtypid = 'loai_phieu_nhap'::regtype) THEN
        ALTER TYPE loai_phieu_nhap ADD VALUE 'dieu_chuyen';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending_level3_approval' AND enumtypid = 'trang_thai_phieu'::regtype) THEN
        ALTER TYPE trang_thai_phieu ADD VALUE 'pending_level3_approval';
    END IF;
END $$;

-- ✅ 5. THÊM CỘT TÀI SẢN CỐ ĐỊNH CHO CHI TIẾT NHẬP (nếu chưa có)
ALTER TABLE chi_tiet_nhap 
ADD COLUMN IF NOT EXISTS la_tai_san_co_dinh BOOLEAN DEFAULT FALSE;


ALTER TABLE chi_tiet_nhap ALTER COLUMN so_seri_list DROP DEFAULT;
ALTER TABLE chi_tiet_nhap ALTER COLUMN so_seri_list SET DEFAULT NULL;

-- =============================================
-- FIX CÁC VẤN ĐỀ ĐƯỢC LIỆT KÊ
-- =============================================

-- 1. FIX MISSING COLUMN nguoi_phan_hoi trong phieu_nhap và phieu_xuat
ALTER TABLE phieu_nhap ADD COLUMN IF NOT EXISTS nguoi_phan_hoi INTEGER REFERENCES users(id);
ALTER TABLE phieu_nhap ADD COLUMN IF NOT EXISTS ngay_phan_hoi TIMESTAMP WITH TIME ZONE;

ALTER TABLE phieu_xuat ADD COLUMN IF NOT EXISTS nguoi_phan_hoi INTEGER REFERENCES users(id); 
ALTER TABLE phieu_xuat ADD COLUMN IF NOT EXISTS ngay_phan_hoi TIMESTAMP WITH TIME ZONE;

ALTER TABLE phieu_nhap ADD COLUMN IF NOT EXISTS ghi_chu_phan_hoi TEXT;
ALTER TABLE phieu_xuat ADD COLUMN IF NOT EXISTS ghi_chu_phan_hoi TEXT;

-- 2. CẬP NHẬT TAB CONFIGURATION CHO NHẬP KHO
-- Tab "Chờ duyệt" chỉ hiển thị phiếu ở trạng thái confirmed và pending_approval
-- Không bao gồm draft (draft chỉ ở tab "Nhập")

-- 3. FIX NOTIFICATION SERVICE FUNCTION NAME
-- Trong notificationService.js cần export đúng function notifyPhieuNhapDuyet

-- 4. CẬP NHẬT XUẤT KHO THEO QUY TRÌNH MỚI  
-- Thêm enum loại xuất mới
DO $$
BEGIN
    -- Kiểm tra và thêm enum values mới cho loại xuất
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'don_vi_su_dung' AND enumtypid = 'loai_xuat'::regtype) THEN
        ALTER TYPE loai_xuat ADD VALUE 'don_vi_su_dung';
    END IF;
END $$;

-- Cập nhật cột loai_xuat trong phieu_xuat để hỗ trợ 2 loại mới
UPDATE phieu_xuat SET loai_xuat = 'don_vi_nhan' WHERE loai_xuat IS NULL;

-- 5. THÊM VALIDATION CHO COMPLETE FUNCTION
-- Đảm bảo có người giao hàng và người nhận hàng trước khi hoàn thành

-- 6. FIX IN PHIẾU - ĐẢM BẢO LOGIC IN PHIẾU ĐÚNG VỚI WORKFLOW MỚI
-- Không cần thay đổi database, chỉ cần cập nhật logic frontend/backend

-- 7. UPDATE CONSTANTS CHO TAB CONFIG
-- Cập nhật tab configuration để phù hợp với quy trình mới

-- =============================================
-- INDEXES BỔ SUNG ĐỂ TỐI ỰU HIỆU SUẤT
-- =============================================
CREATE INDEX IF NOT EXISTS idx_phieu_nhap_trang_thai_confirmed ON phieu_nhap(trang_thai) WHERE trang_thai IN ('confirmed', 'pending_approval');
CREATE INDEX IF NOT EXISTS idx_phieu_nhap_loai_phieu ON phieu_nhap(loai_phieu);
CREATE INDEX IF NOT EXISTS idx_phieu_xuat_loai_xuat ON phieu_xuat(loai_xuat);

-- =============================================  
-- COMMENTS CHO CÁC CỘT MỚI
-- =============================================
COMMENT ON COLUMN phieu_nhap.nguoi_phan_hoi IS 'Người yêu cầu chỉnh sửa phiếu (admin/manager)';
COMMENT ON COLUMN phieu_nhap.ngay_phan_hoi IS 'Thời gian yêu cầu chỉnh sửa';
COMMENT ON COLUMN phieu_xuat.nguoi_phan_hoi IS 'Người yêu cầu chỉnh sửa phiếu (admin/manager)';  
COMMENT ON COLUMN phieu_xuat.ngay_phan_hoi IS 'Thời gian yêu cầu chỉnh sửa';

-- =============================================
-- CHECK FINAL SCHEMA
-- =============================================
SELECT 
    'phieu_nhap' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'phieu_nhap' 
AND column_name IN ('nguoi_phan_hoi', 'ngay_phan_hoi', 'ghi_chu_phan_hoi')
UNION ALL
SELECT 
    'phieu_xuat' as table_name,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'phieu_xuat'
AND column_name IN ('nguoi_phan_hoi', 'ngay_phan_hoi', 'ghi_chu_phan_hoi')
ORDER BY table_name, column_name;