-- Script để khắc phục lỗi "current transaction is aborted"
-- Chạy từng câu lệnh một cách riêng biệt

-- Bước 1: Kết thúc transaction hiện tại (nếu có lỗi)
ROLLBACK;

-- Bước 2: Bắt đầu transaction mới
BEGIN;

-- Bước 3: Xóa dữ liệu từng bảng một cách an toàn
-- Xóa chi tiết trước (bảng con)
DELETE FROM chi_tiet_nhap;
DELETE FROM chi_tiet_xuat;

-- Xóa phiếu nhập và phiếu xuất (bảng cha)
DELETE FROM phieu_nhap;
DELETE FROM phieu_xuat;

-- Bước 4: Reset sequence
ALTER SEQUENCE chi_tiet_nhap_id_seq RESTART WITH 1;
ALTER SEQUENCE chi_tiet_xuat_id_seq RESTART WITH 1;
ALTER SEQUENCE phieu_nhap_id_seq RESTART WITH 1;
ALTER SEQUENCE phieu_xuat_id_seq RESTART WITH 1;

-- Bước 5: Commit transaction
COMMIT;

-- ==========================================
-- HOẶC sử dụng cách đơn giản hơn (không dùng transaction):
-- ==========================================

-- Chạy từng câu lệnh này một cách riêng biệt:

-- ROLLBACK;
-- DELETE FROM chi_tiet_nhap;
-- DELETE FROM chi_tiet_xuat;
-- DELETE FROM phieu_nhap;
-- DELETE FROM phieu_xuat;
-- ALTER SEQUENCE chi_tiet_nhap_id_seq RESTART WITH 1;
-- ALTER SEQUENCE chi_tiet_xuat_id_seq RESTART WITH 1;
-- ALTER SEQUENCE phieu_nhap_id_seq RESTART WITH 1;
-- ALTER SEQUENCE phieu_xuat_id_seq RESTART WITH 1;
