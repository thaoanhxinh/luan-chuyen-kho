-- Script để xóa hết dữ liệu các bảng phiếu nhập, phiếu xuất và chi tiết
-- Sử dụng cho PostgreSQL

-- Cách 1: Sử dụng TRUNCATE với CASCADE (Khuyến nghị)
-- Lệnh này sẽ xóa hết dữ liệu và tự động xóa luôn dữ liệu ở các bảng có liên kết foreign key

-- Xóa chi tiết trước (bảng con)
TRUNCATE TABLE chi_tiet_nhap CASCADE;
TRUNCATE TABLE chi_tiet_xuat CASCADE;

-- Xóa phiếu nhập và phiếu xuất (bảng cha)
TRUNCATE TABLE phieu_nhap CASCADE;
TRUNCATE TABLE phieu_xuat CASCADE;

-- Reset sequence (để ID bắt đầu lại từ 1)
ALTER SEQUENCE chi_tiet_nhap_id_seq RESTART WITH 1;
ALTER SEQUENCE chi_tiet_xuat_id_seq RESTART WITH 1;
ALTER SEQUENCE phieu_nhap_id_seq RESTART WITH 1;
ALTER SEQUENCE phieu_xuat_id_seq RESTART WITH 1;

-- ==========================================
-- Cách 2: Tạm thời vô hiệu hóa ràng buộc rồi xóa (Backup method)
-- ==========================================

-- Uncomment các dòng dưới nếu cách 1 không hoạt động:

-- -- Tắt trigger và constraint checking
-- SET session_replication_role = replica;

-- -- Xóa dữ liệu theo thứ tự
-- DELETE FROM chi_tiet_nhap;
-- DELETE FROM chi_tiet_xuat;
-- DELETE FROM phieu_nhap;
-- DELETE FROM phieu_xuat;

-- -- Bật lại trigger và constraint checking
-- SET session_replication_role = DEFAULT;

-- -- Reset sequence
-- ALTER SEQUENCE chi_tiet_nhap_id_seq RESTART WITH 1;
-- ALTER SEQUENCE chi_tiet_xuat_id_seq RESTART WITH 1;
-- ALTER SEQUENCE phieu_nhap_id_seq RESTART WITH 1;
-- ALTER SEQUENCE phieu_xuat_id_seq RESTART WITH 1;

-- ==========================================
-- Cách 3: Xóa từng bảng một cách thủ công (Nếu có lỗi foreign key)
-- ==========================================

-- Uncomment nếu cần thiết:

-- -- Bước 1: Xóa tất cả foreign key constraints tạm thời
-- ALTER TABLE chi_tiet_nhap DROP CONSTRAINT IF EXISTS chi_tiet_nhap_phieu_nhap_id_fkey;
-- ALTER TABLE chi_tiet_nhap DROP CONSTRAINT IF EXISTS chi_tiet_nhap_hang_hoa_id_fkey;
-- ALTER TABLE chi_tiet_xuat DROP CONSTRAINT IF EXISTS chi_tiet_xuat_phieu_xuat_id_fkey;
-- ALTER TABLE chi_tiet_xuat DROP CONSTRAINT IF EXISTS chi_tiet_xuat_hang_hoa_id_fkey;

-- -- Bước 2: Xóa dữ liệu
-- TRUNCATE TABLE chi_tiet_nhap;
-- TRUNCATE TABLE chi_tiet_xuat;
-- TRUNCATE TABLE phieu_nhap;
-- TRUNCATE TABLE phieu_xuat;

-- -- Bước 3: Tạo lại foreign key constraints
-- ALTER TABLE chi_tiet_nhap ADD CONSTRAINT chi_tiet_nhap_phieu_nhap_id_fkey 
--     FOREIGN KEY (phieu_nhap_id) REFERENCES phieu_nhap(id) ON DELETE CASCADE;
-- ALTER TABLE chi_tiet_nhap ADD CONSTRAINT chi_tiet_nhap_hang_hoa_id_fkey 
--     FOREIGN KEY (hang_hoa_id) REFERENCES hang_hoa(id);
-- ALTER TABLE chi_tiet_xuat ADD CONSTRAINT chi_tiet_xuat_phieu_xuat_id_fkey 
--     FOREIGN KEY (phieu_xuat_id) REFERENCES phieu_xuat(id) ON DELETE CASCADE;
-- ALTER TABLE chi_tiet_xuat ADD CONSTRAINT chi_tiet_xuat_hang_hoa_id_fkey 
--     FOREIGN KEY (hang_hoa_id) REFERENCES hang_hoa(id);

-- -- Bước 4: Reset sequence
-- ALTER SEQUENCE chi_tiet_nhap_id_seq RESTART WITH 1;
-- ALTER SEQUENCE chi_tiet_xuat_id_seq RESTART WITH 1;
-- ALTER SEQUENCE phieu_nhap_id_seq RESTART WITH 1;
-- ALTER SEQUENCE phieu_xuat_id_seq RESTART WITH 1;
