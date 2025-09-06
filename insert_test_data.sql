-- Script tạo dữ liệu test cho phiếu nhập/xuất
-- Chạy script này để có dữ liệu test

-- Tắt trigger tạm thời
SET session_replication_role = replica;

-- 1. Tạo phiếu nhập test
INSERT INTO phieu_nhap (
    so_phieu, ngay_nhap, nha_cung_cap_id, ly_do_nhap, loai_phieu,
    trang_thai, nguoi_tao, phong_ban_id, tong_tien, is_tu_dong
) VALUES (
    'PN-TEST-001', CURRENT_DATE, 1, 'Nhập hàng test', 'tu_mua',
    'approved', 1, 1, 3000, false
);

-- Lấy ID phiếu nhập vừa tạo
-- (Thay 1 bằng ID phiếu nhập thực tế nếu cần)

-- 2. Tạo chi tiết phiếu nhập (tồn kho)
INSERT INTO chi_tiet_nhap (
    phieu_nhap_id, hang_hoa_id, so_luong, don_gia, pham_chat,
    so_phieu_lot, ngay_san_xuat, han_su_dung, so_seri_list
) VALUES (
    (SELECT id FROM phieu_nhap WHERE so_phieu = 'PN-TEST-001' LIMIT 1),
    1, -- Thay bằng ID hàng hóa "df" thực tế
    10, 3000, 'tot',
    'LOT-TEST-001', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year',
    '["SERI001", "SERI002", "SERI003"]'::jsonb
);

-- Bật lại trigger
SET session_replication_role = DEFAULT;

-- Hiển thị kết quả
SELECT 'Dữ liệu test đã được tạo thành công!' as message;
