

-- 1. Thêm cấu trúc 3 cấp cho bảng phong_ban
ALTER TABLE phong_ban 
ADD COLUMN IF NOT EXISTS cap_bac INTEGER DEFAULT 2 CHECK (cap_bac IN (1, 2, 3)),
ADD COLUMN IF NOT EXISTS phong_ban_cha_id INTEGER REFERENCES phong_ban(id),
ADD COLUMN IF NOT EXISTS thu_tu_hien_thi INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN phong_ban.cap_bac IS '1: BTL Vùng, 2: Phòng ban/Ban chuyên môn, 3: Đơn vị tác nghiệp';
COMMENT ON COLUMN phong_ban.phong_ban_cha_id IS 'ID của phòng ban cấp trên (NULL cho BTL Vùng)';

-- 2. Cập nhật dữ liệu phòng ban hiện có
-- Cập nhật BTL Vùng làm cấp 1
UPDATE phong_ban SET 
    cap_bac = 1, 
    phong_ban_cha_id = NULL, 
    thu_tu_hien_thi = 1,
    ten_phong_ban = 'BTL Vùng Cảnh sát biển 1',
    mo_ta = 'Bộ Tư lệnh Vùng Cảnh sát biển 1 - Cấp cao nhất'
WHERE ma_phong_ban = 'PTM' OR id = 1;

-- Cập nhật các phòng ban hiện có làm cấp 2
UPDATE phong_ban SET cap_bac = 2, phong_ban_cha_id = 1, thu_tu_hien_thi = 2 WHERE ma_phong_ban = 'HCK';
UPDATE phong_ban SET cap_bac = 2, phong_ban_cha_id = 1, thu_tu_hien_thi = 3 WHERE ma_phong_ban = 'TMKH';
UPDATE phong_ban SET cap_bac = 2, phong_ban_cha_id = 1, thu_tu_hien_thi = 4 WHERE ma_phong_ban = 'HC';
UPDATE phong_ban SET cap_bac = 2, phong_ban_cha_id = 1, thu_tu_hien_thi = 5 WHERE ma_phong_ban = 'HD11';
UPDATE phong_ban SET cap_bac = 2, phong_ban_cha_id = 1, thu_tu_hien_thi = 6 WHERE ma_phong_ban = 'HD102';

-- 3. Thêm các phòng ban mới theo cấu trúc thực tế
-- Các ban trong Phòng Hậu cần - Kỹ thuật
INSERT INTO phong_ban (ma_phong_ban, ten_phong_ban, cap_bac, phong_ban_cha_id, thu_tu_hien_thi, mo_ta)
SELECT 'BAN_TMKH', 'Ban Tham mưu kế hoạch', 2, pb.id, 7, 'Ban Tham mưu kế hoạch - PHCKT'
FROM phong_ban pb WHERE pb.ma_phong_ban = 'HCK'
ON CONFLICT (ma_phong_ban) DO NOTHING;

INSERT INTO phong_ban (ma_phong_ban, ten_phong_ban, cap_bac, phong_ban_cha_id, thu_tu_hien_thi, mo_ta)
SELECT 'BAN_TT', 'Ban Tàu thuyền', 2, pb.id, 8, 'Ban Tàu thuyền - PHCKT'
FROM phong_ban pb WHERE pb.ma_phong_ban = 'HCK'
ON CONFLICT (ma_phong_ban) DO NOTHING;

INSERT INTO phong_ban (ma_phong_ban, ten_phong_ban, cap_bac, phong_ban_cha_id, thu_tu_hien_thi, mo_ta)
SELECT 'BAN_KTDT', 'Ban Khí tài điện tử', 2, pb.id, 9, 'Ban Khí tài điện tử - PHCKT'
FROM phong_ban pb WHERE pb.ma_phong_ban = 'HCK'
ON CONFLICT (ma_phong_ban) DO NOTHING;

INSERT INTO phong_ban (ma_phong_ban, ten_phong_ban, cap_bac, phong_ban_cha_id, thu_tu_hien_thi, mo_ta)
SELECT 'BAN_QK', 'Ban Quân khí', 2, pb.id, 10, 'Ban Quân khí - PHCKT'
FROM phong_ban pb WHERE pb.ma_phong_ban = 'HCK'
ON CONFLICT (ma_phong_ban) DO NOTHING;

INSERT INTO phong_ban (ma_phong_ban, ten_phong_ban, cap_bac, phong_ban_cha_id, thu_tu_hien_thi, mo_ta)
SELECT 'BAN_VT', 'Ban Vật tư', 2, pb.id, 11, 'Ban Vật tư - PHCKT'
FROM phong_ban pb WHERE pb.ma_phong_ban = 'HCK'
ON CONFLICT (ma_phong_ban) DO NOTHING;

INSERT INTO phong_ban (ma_phong_ban, ten_phong_ban, cap_bac, phong_ban_cha_id, thu_tu_hien_thi, mo_ta)
SELECT 'BAN_DT', 'Ban Doanh trại', 2, pb.id, 12, 'Ban Doanh trại - PHCKT'
FROM phong_ban pb WHERE pb.ma_phong_ban = 'HCK'
ON CONFLICT (ma_phong_ban) DO NOTHING;

INSERT INTO phong_ban (ma_phong_ban, ten_phong_ban, cap_bac, phong_ban_cha_id, thu_tu_hien_thi, mo_ta)
SELECT 'BAN_XD', 'Ban Xăng dầu', 2, pb.id, 13, 'Ban Xăng dầu - PHCKT'
FROM phong_ban pb WHERE pb.ma_phong_ban = 'HCK'
ON CONFLICT (ma_phong_ban) DO NOTHING;

INSERT INTO phong_ban (ma_phong_ban, ten_phong_ban, cap_bac, phong_ban_cha_id, thu_tu_hien_thi, mo_ta)
SELECT 'BAN_QN', 'Ban Quân nhu', 2, pb.id, 14, 'Ban Quân nhu - PHCKT'
FROM phong_ban pb WHERE pb.ma_phong_ban = 'HCK'
ON CONFLICT (ma_phong_ban) DO NOTHING;

INSERT INTO phong_ban (ma_phong_ban, ten_phong_ban, cap_bac, phong_ban_cha_id, thu_tu_hien_thi, mo_ta)
SELECT 'BAN_QY', 'Ban Quân y', 2, pb.id, 15, 'Ban Quân y - PHCKT'
FROM phong_ban pb WHERE pb.ma_phong_ban = 'HCK'
ON CONFLICT (ma_phong_ban) DO NOTHING;

INSERT INTO phong_ban (ma_phong_ban, ten_phong_ban, cap_bac, phong_ban_cha_id, thu_tu_hien_thi, mo_ta)
SELECT 'TD_KHO', 'Tiểu đội Kho', 2, pb.id, 16, 'Tiểu đội Kho - PHCKT'
FROM phong_ban pb WHERE pb.ma_phong_ban = 'HCK'
ON CONFLICT (ma_phong_ban) DO NOTHING;

INSERT INTO phong_ban (ma_phong_ban, ten_phong_ban, cap_bac, phong_ban_cha_id, thu_tu_hien_thi, mo_ta)
SELECT 'TO_TGS', 'Tổ Tăng gia sản xuất', 2, pb.id, 17, 'Tổ Tăng gia sản xuất - PHCKT'
FROM phong_ban pb WHERE pb.ma_phong_ban = 'HCK'
ON CONFLICT (ma_phong_ban) DO NOTHING;

-- Thêm phòng ban trong Hải đoàn 11
INSERT INTO phong_ban (ma_phong_ban, ten_phong_ban, cap_bac, phong_ban_cha_id, thu_tu_hien_thi, mo_ta)
SELECT 'PHCKT_HD11', 'Phòng Hậu cần - Kỹ thuật HD11', 2, pb.id, 18, 'Phòng Hậu cần - Kỹ thuật của Hải đoàn 11'
FROM phong_ban pb WHERE pb.ma_phong_ban = 'HD11'
ON CONFLICT (ma_phong_ban) DO NOTHING;

-- Thêm các đơn vị tác nghiệp (Cấp 3)
INSERT INTO phong_ban (ma_phong_ban, ten_phong_ban, cap_bac, phong_ban_cha_id, thu_tu_hien_thi, mo_ta)
SELECT 'NV_HD102', 'Nghiệp vụ Hải đội 102', 3, pb.id, 19, 'Bộ phận nghiệp vụ của Hải đội 102'
FROM phong_ban pb WHERE pb.ma_phong_ban = 'HD102'
ON CONFLICT (ma_phong_ban) DO NOTHING;

INSERT INTO phong_ban (ma_phong_ban, ten_phong_ban, cap_bac, phong_ban_cha_id, thu_tu_hien_thi, mo_ta)
SELECT 'TAU_781', 'Tàu 781', 3, pb.id, 20, 'Tàu 781 thuộc Hải đoàn 11'
FROM phong_ban pb WHERE pb.ma_phong_ban = 'PHCKT_HD11'
ON CONFLICT (ma_phong_ban) DO NOTHING;

INSERT INTO phong_ban (ma_phong_ban, ten_phong_ban, cap_bac, phong_ban_cha_id, thu_tu_hien_thi, mo_ta)
SELECT 'TAU_782', 'Tàu 782', 3, pb.id, 21, 'Tàu 782 thuộc Hải đoàn 11'
FROM phong_ban pb WHERE pb.ma_phong_ban = 'PHCKT_HD11'
ON CONFLICT (ma_phong_ban) DO NOTHING;

INSERT INTO phong_ban (ma_phong_ban, ten_phong_ban, cap_bac, phong_ban_cha_id, thu_tu_hien_thi, mo_ta)
SELECT 'TAU_783', 'Tàu 783', 3, pb.id, 22, 'Tàu 783 thuộc Hải đoàn 11'
FROM phong_ban pb WHERE pb.ma_phong_ban = 'PHCKT_HD11'
ON CONFLICT (ma_phong_ban) DO NOTHING;

-- =============================================
-- PHẦN 2: CẬP NHẬT USER ROLES VÀ DỮ LIỆU MẪU
-- =============================================

-- Thêm role manager nếu chưa có
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'manager' AND enumtypid = 'user_role'::regtype) THEN
        ALTER TYPE user_role ADD VALUE 'manager';
    END IF;
END $$;

-- Cập nhật role cho users hiện có
UPDATE users SET role = 'manager' WHERE phong_ban_id IN (
    SELECT id FROM phong_ban WHERE cap_bac = 2
) AND role = 'user';

-- Thêm users mẫu cho các phòng ban mới
INSERT INTO users (username, password, ho_ten, email, phong_ban_id, role, trang_thai) VALUES 
-- Manager cho các ban chuyên môn
('manager_ban_vt', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Đại úy Hoàng Văn E', 'banvt@btlvung1.gov.vn', (SELECT id FROM phong_ban WHERE ma_phong_ban = 'BAN_VT'), 'manager', 'active'),
('manager_ban_xd', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Đại úy Võ Văn F', 'banxd@btlvung1.gov.vn', (SELECT id FROM phong_ban WHERE ma_phong_ban = 'BAN_XD'), 'manager', 'active'),

-- User cho các đơn vị tác nghiệp  
('user_hd102', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Trung úy Nguyễn Văn G', 'nvhd102@btlvung1.gov.vn', (SELECT id FROM phong_ban WHERE ma_phong_ban = 'NV_HD102'), 'user', 'active'),
('user_tau781', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Thượng úy Trần Văn H', 'tau781@btlvung1.gov.vn', (SELECT id FROM phong_ban WHERE ma_phong_ban = 'TAU_781'), 'user', 'active'),
('user_tau782', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Trung úy Lê Văn I', 'tau782@btlvung1.gov.vn', (SELECT id FROM phong_ban WHERE ma_phong_ban = 'TAU_782'), 'user', 'active')
ON CONFLICT (username) DO NOTHING;

-- =============================================
-- PHẦN 3: CẬP NHẬT CẤU TRÚC PHIẾU VÀ YÊU CẦU
-- =============================================

-- Thêm trường liên kết yêu cầu với phiếu thực tế
ALTER TABLE phieu_nhap 
ADD COLUMN IF NOT EXISTS yeu_cau_nhap_id INTEGER REFERENCES yeu_cau_nhap_kho(id),
ADD COLUMN IF NOT EXISTS phong_ban_cung_cap_id INTEGER REFERENCES phong_ban(id),
ADD COLUMN IF NOT EXISTS phieu_xuat_lien_ket_id INTEGER REFERENCES phieu_xuat(id),
ADD COLUMN IF NOT EXISTS ghi_chu_phan_hoi TEXT,
ADD COLUMN IF NOT EXISTS ngay_gui_duyet TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_tu_dong BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS nguoi_giao_hang VARCHAR(100);

ALTER TABLE phieu_xuat 
ADD COLUMN IF NOT EXISTS yeu_cau_xuat_id INTEGER REFERENCES yeu_cau_xuat_kho(id),
ADD COLUMN IF NOT EXISTS phong_ban_nhan_id INTEGER REFERENCES phong_ban(id),
ADD COLUMN IF NOT EXISTS phieu_nhap_lien_ket_id INTEGER REFERENCES phieu_nhap(id),
ADD COLUMN IF NOT EXISTS ghi_chu_phan_hoi TEXT,
ADD COLUMN IF NOT EXISTS is_tu_dong BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS nguoi_giao_hang VARCHAR(100);

-- Thêm các trường cần thiết cho workflow 3 cấp
ALTER TABLE yeu_cau_nhap_kho 
ADD COLUMN IF NOT EXISTS nguon_cung_cap VARCHAR(50) DEFAULT 'tu_mua' CHECK (nguon_cung_cap IN ('tu_mua', 'tren_cap', 'dieu_chuyen')),
ADD COLUMN IF NOT EXISTS nha_cung_cap_id INTEGER REFERENCES nha_cung_cap(id),
ADD COLUMN IF NOT EXISTS phong_ban_xu_ly_id INTEGER REFERENCES phong_ban(id);

ALTER TABLE yeu_cau_xuat_kho
ADD COLUMN IF NOT EXISTS phong_ban_xu_ly_id INTEGER REFERENCES phong_ban(id),
ADD COLUMN IF NOT EXISTS loai_xuat_yc VARCHAR(50) DEFAULT 'don_vi_nhan' CHECK (loai_xuat_yc IN ('don_vi_nhan', 'don_vi_su_dung'));

-- Thêm cột số lượng kế hoạch, giữ nguyên so_luong làm số lượng thực nhập
ALTER TABLE chi_tiet_nhap 
ADD COLUMN IF NOT EXISTS so_luong_ke_hoach DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Cập nhật dữ liệu hiện có: số lượng kế hoạch = số lượng hiện tại
UPDATE chi_tiet_nhap 
SET so_luong_ke_hoach = so_luong 
WHERE so_luong_ke_hoach = 0;

-- Thêm cột cho hàng hóa tài sản cố định
ALTER TABLE hang_hoa ADD COLUMN IF NOT EXISTS la_tai_san_co_dinh BOOLEAN DEFAULT FALSE;

-- =============================================
-- PHẦN 4: CẬP NHẬT ENUM TYPES
-- =============================================

-- Cập nhật enum trạng thái phiếu
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'revision_required' AND enumtypid = 'trang_thai_phieu'::regtype) THEN
        ALTER TYPE trang_thai_phieu ADD VALUE 'revision_required';
    END IF;
END $$;

-- Cập nhật enum trạng thái yêu cầu
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'confirmed' AND enumtypid = 'trang_thai_yeu_cau'::regtype) THEN
        ALTER TYPE trang_thai_yeu_cau ADD VALUE 'confirmed';
    END IF;
END $$;

-- Cập nhật enum loại thông báo
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'phieu_nhap_can_duyet' AND enumtypid = 'loai_thong_bao'::regtype) THEN
        ALTER TYPE loai_thong_bao ADD VALUE 'phieu_nhap_can_duyet';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'phieu_nhap_duyet' AND enumtypid = 'loai_thong_bao'::regtype) THEN
        ALTER TYPE loai_thong_bao ADD VALUE 'phieu_nhap_duyet';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'phieu_nhap_can_sua' AND enumtypid = 'loai_thong_bao'::regtype) THEN
        ALTER TYPE loai_thong_bao ADD VALUE 'phieu_nhap_can_sua';
    END IF;
END $$;

-- Thêm loại đơn vị nội bộ
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'noi_bo' AND enumtypid = 'loai_don_vi'::regtype) THEN
        ALTER TYPE loai_don_vi ADD VALUE 'noi_bo';
    END IF;
END $$;

-- =============================================
-- PHẦN 5: BẢNG QUAN HỆ PHÒNG BAN
-- =============================================

-- Tạo bảng liên kết phòng ban để quản lý quan hệ cung cấp
CREATE TABLE IF NOT EXISTS quan_he_phong_ban (
    id SERIAL PRIMARY KEY,
    phong_ban_cung_cap_id INTEGER NOT NULL REFERENCES phong_ban(id),
    phong_ban_nhan_id INTEGER NOT NULL REFERENCES phong_ban(id),
    loai_quan_he VARCHAR(20) NOT NULL CHECK (loai_quan_he IN ('truc_tiep', 'gian_tiep')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(phong_ban_cung_cap_id, phong_ban_nhan_id)
);

-- Tự động tạo quan hệ dựa trên cấu trúc phòng ban
INSERT INTO quan_he_phong_ban (phong_ban_cung_cap_id, phong_ban_nhan_id, loai_quan_he)
SELECT 
    pb_cha.id as phong_ban_cung_cap_id,
    pb_con.id as phong_ban_nhan_id,
    'truc_tiep' as loai_quan_he
FROM phong_ban pb_cha
JOIN phong_ban pb_con ON pb_con.phong_ban_cha_id = pb_cha.id
WHERE pb_cha.id != pb_con.id
ON CONFLICT (phong_ban_cung_cap_id, phong_ban_nhan_id) DO NOTHING;

-- Thêm quan hệ giữa các phòng ban cùng cấp (gián tiếp)
INSERT INTO quan_he_phong_ban (phong_ban_cung_cap_id, phong_ban_nhan_id, loai_quan_he)
SELECT 
    pb1.id as phong_ban_cung_cap_id,
    pb2.id as phong_ban_nhan_id,
    'gian_tiep' as loai_quan_he
FROM phong_ban pb1
JOIN phong_ban pb2 ON pb1.phong_ban_cha_id = pb2.phong_ban_cha_id 
WHERE pb1.id != pb2.id 
AND pb1.cap_bac = pb2.cap_bac 
AND pb1.cap_bac = 2
ON CONFLICT (phong_ban_cung_cap_id, phong_ban_nhan_id) DO NOTHING;

-- =============================================
-- PHẦN 6: CẬP NHẬT NHÀ CUNG CẤP VÀ ĐƠN VỊ NHẬN
-- =============================================

-- Thêm cột cho bảng nha_cung_cap
ALTER TABLE nha_cung_cap 
ADD COLUMN IF NOT EXISTS phong_ban_id INTEGER REFERENCES phong_ban(id),
ADD COLUMN IF NOT EXISTS is_noi_bo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trang_thai VARCHAR(20) DEFAULT 'active';

-- Thêm cột cho bảng don_vi_nhan
ALTER TABLE don_vi_nhan 
ADD COLUMN IF NOT EXISTS is_noi_bo BOOLEAN DEFAULT FALSE;

-- Thêm phòng ban vào bảng nha_cung_cap để có thể chọn làm nhà cung cấp nội bộ
INSERT INTO nha_cung_cap (ma_ncc, ten_ncc, dia_chi, nguoi_lien_he, phone, email, is_noi_bo, phong_ban_id, trang_thai)
SELECT 
    'NCC_' || pb.ma_phong_ban,
    'NCC Nội bộ - ' || pb.ten_phong_ban,
    'Đơn vị nội bộ',
    (SELECT ho_ten FROM users WHERE phong_ban_id = pb.id AND role IN ('admin', 'manager') AND trang_thai = 'active' LIMIT 1),
    '',
    pb.ma_phong_ban || '@btlvung1.gov.vn',
    true,
    pb.id,
    'active'
FROM phong_ban pb
WHERE pb.is_active = TRUE 
AND NOT EXISTS (SELECT 1 FROM nha_cung_cap WHERE phong_ban_id = pb.id)
ON CONFLICT DO NOTHING;

-- Thêm phòng ban vào bảng don_vi_nhan để có thể chọn làm đơn vị nhận nội bộ
INSERT INTO don_vi_nhan (ma_don_vi, ten_don_vi, loai_don_vi, dia_chi, nguoi_lien_he, so_dien_thoai, email, is_noi_bo, phong_ban_id, trang_thai)
SELECT 
    'DV_' || pb.ma_phong_ban,
    'ĐV Nội bộ - ' || pb.ten_phong_ban,
    'noi_bo',
    'Đơn vị nội bộ',
    (SELECT ho_ten FROM users WHERE phong_ban_id = pb.id AND role IN ('admin', 'manager') AND trang_thai = 'active' LIMIT 1),
    '',
    pb.ma_phong_ban || '@btlvung1.gov.vn',
    true,
    pb.id,
    'active'
FROM phong_ban pb
WHERE pb.is_active = TRUE 
AND NOT EXISTS (SELECT 1 FROM don_vi_nhan WHERE phong_ban_id = pb.id)
ON CONFLICT DO NOTHING;

-- =============================================
-- PHẦN 7: CẬP NHẬT TỒN KHO CHO CÁC PHÒNG BAN MỚI
-- =============================================

-- Cập nhật tồn kho cho các phòng ban mới (chỉ thêm, không xóa dữ liệu cũ)
INSERT INTO ton_kho (hang_hoa_id, phong_ban_id, sl_tot, gia_tri_ton, don_gia_binh_quan) 
SELECT 
    h.id as hang_hoa_id,
    pb.id as phong_ban_id,
    CASE h.id
        WHEN 1 THEN 50   -- Lốp 600-14
        WHEN 2 THEN 100  -- Cáp điện  
        WHEN 3 THEN 30   -- Thanh gạt nước
        WHEN 4 THEN 10   -- Ắc quy 12V
        ELSE 0
    END as sl_tot,
    CASE h.id
        WHEN 1 THEN 50 * h.gia_nhap_gan_nhat
        WHEN 2 THEN 100 * h.gia_nhap_gan_nhat
        WHEN 3 THEN 30 * h.gia_nhap_gan_nhat  
        WHEN 4 THEN 10 * h.gia_nhap_gan_nhat
        ELSE 0
    END as gia_tri_ton,
    h.gia_nhap_gan_nhat as don_gia_binh_quan
FROM hang_hoa h
CROSS JOIN phong_ban pb
WHERE pb.ma_phong_ban IN ('BAN_VT', 'BAN_XD', 'BAN_QN') 
AND h.id IN (1, 2, 3, 4)
AND NOT EXISTS (
    SELECT 1 FROM ton_kho tk 
    WHERE tk.hang_hoa_id = h.id AND tk.phong_ban_id = pb.id
);

-- =============================================
-- PHẦN 8: CÁC FUNCTION HỖ TRỢ QUY TRÌNH 3 CẤP
-- =============================================

-- Function xác định phòng ban xử lý
CREATE OR REPLACE FUNCTION get_phong_ban_xu_ly(
    p_don_vi_yeu_cau_id INTEGER,
    p_loai_yeu_cau loai_yeu_cau
)
RETURNS INTEGER AS $$
DECLARE
    v_phong_ban_xu_ly_id INTEGER;
    v_cap_bac INTEGER;
BEGIN
    -- Lấy cấp bậc của đơn vị yêu cầu
    SELECT cap_bac INTO v_cap_bac
    FROM phong_ban 
    WHERE id = p_don_vi_yeu_cau_id;
    
    -- Xác định phòng ban xử lý theo logic 3 cấp
    IF v_cap_bac = 3 THEN
        -- Đơn vị cấp 3 gửi yêu cầu lên phòng ban quản lý (cấp 2)
        SELECT phong_ban_cha_id INTO v_phong_ban_xu_ly_id
        FROM phong_ban 
        WHERE id = p_don_vi_yeu_cau_id;
    ELSIF v_cap_bac = 2 THEN
        -- Phòng ban cấp 2 gửi yêu cầu lên BTL Vùng (cấp 1)
        SELECT phong_ban_cha_id INTO v_phong_ban_xu_ly_id
        FROM phong_ban 
        WHERE id = p_don_vi_yeu_cau_id;
    ELSE
        -- BTL Vùng tự xử lý
        v_phong_ban_xu_ly_id := p_don_vi_yeu_cau_id;
    END IF;
    
    RETURN v_phong_ban_xu_ly_id;
END;
$$ LANGUAGE plpgsql;

-- Function lấy phòng ban có thể cung cấp (phiên bản mới nhất)
CREATE OR REPLACE FUNCTION get_phong_ban_co_the_cung_cap(
    p_phong_ban_nhan_id INTEGER,
    p_loai_phieu loai_phieu_nhap
)
RETURNS TABLE(
    id INTEGER,
    ma_phong_ban VARCHAR(20),
    ten_phong_ban VARCHAR(100),
    cap_bac INTEGER
) AS $$
DECLARE
    v_cap_bac_nhan INTEGER;
BEGIN
    SELECT cap_bac INTO v_cap_bac_nhan FROM phong_ban WHERE id = p_phong_ban_nhan_id;

    IF p_loai_phieu = 'tren_cap' THEN
        IF v_cap_bac_nhan = 3 THEN
            -- Nếu cấp 3 yêu cầu, chỉ trả về cấp 1 (bỏ qua cấp 2)
            RETURN QUERY
            SELECT pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac
            FROM phong_ban pb WHERE pb.cap_bac = 1 AND pb.is_active = TRUE;
        ELSIF v_cap_bac_nhan = 2 THEN
            -- Cấp 2 yêu cầu, trả về cấp 1 (cấp trên trực tiếp)
            RETURN QUERY
            SELECT pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac
            FROM phong_ban pb
            JOIN quan_he_phong_ban qh ON qh.phong_ban_cung_cap_id = pb.id
            WHERE qh.phong_ban_nhan_id = p_phong_ban_nhan_id
            AND qh.loai_quan_he = 'truc_tiep' AND pb.cap_bac < v_cap_bac_nhan
            AND pb.is_active = TRUE;
        ELSE
            -- Cấp 1 không có cấp trên, trả về rỗng
            RETURN QUERY
            SELECT NULL::INTEGER, NULL::VARCHAR(20), NULL::VARCHAR(100), NULL::INTEGER
            LIMIT 0;
        END IF;
    ELSIF p_loai_phieu = 'dieu_chuyen' THEN
        -- Logic điều chuyển: các phòng ban cùng cấp hoặc có quan hệ
        RETURN QUERY
        SELECT pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac
        FROM phong_ban pb
        JOIN quan_he_phong_ban qh ON qh.phong_ban_cung_cap_id = pb.id
        WHERE qh.phong_ban_nhan_id = p_phong_ban_nhan_id
        AND qh.is_active = TRUE AND pb.is_active = TRUE
        ORDER BY pb.cap_bac, pb.ten_phong_ban;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function lấy phòng ban có thể nhận hàng
CREATE OR REPLACE FUNCTION get_phong_ban_co_the_nhan_hang(
    p_phong_ban_xuat_id INTEGER
)
RETURNS TABLE(
    id INTEGER,
    ma_phong_ban VARCHAR(20),
    ten_phong_ban VARCHAR(100),
    cap_bac INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac
    FROM phong_ban pb
    JOIN quan_he_phong_ban qh ON qh.phong_ban_nhan_id = pb.id
    WHERE qh.phong_ban_cung_cap_id = p_phong_ban_xuat_id
    AND qh.is_active = TRUE
    ORDER BY pb.cap_bac DESC, pb.ten_phong_ban;
END;
$$ LANGUAGE plpgsql;

-- Function kiểm tra quyền truy cập hàng hóa (phiên bản mới nhất)
CREATE OR REPLACE FUNCTION check_hang_hoa_permission_v2(
    p_user_id INTEGER,
    p_hang_hoa_id INTEGER,
    p_action VARCHAR DEFAULT 'view'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_role user_role;
    v_user_phong_ban_id INTEGER;
    v_hang_hoa_phong_ban_id INTEGER;
    v_user_cap_bac INTEGER;
    v_hang_hoa_cap_bac INTEGER;
    v_co_ton_kho BOOLEAN := FALSE;
BEGIN
    -- Lấy thông tin user
    SELECT role, phong_ban_id INTO v_user_role, v_user_phong_ban_id
    FROM users WHERE id = p_user_id;
    
    -- Admin có toàn quyền
    IF v_user_role = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Kiểm tra xem phòng ban có tồn kho của hàng hóa này không
    SELECT EXISTS(
        SELECT 1 FROM ton_kho tk 
        WHERE tk.hang_hoa_id = p_hang_hoa_id 
        AND tk.phong_ban_id = v_user_phong_ban_id
        AND (tk.sl_tot + tk.sl_kem_pham_chat + tk.sl_mat_pham_chat + tk.sl_hong + tk.sl_can_thanh_ly) > 0
    ) INTO v_co_ton_kho;
    
    -- Nếu phòng ban có tồn kho thì có quyền view và manage
    IF v_co_ton_kho THEN
        RETURN TRUE;
    END IF;
    
    -- Logic phân quyền cũ cho hàng hóa gốc
    SELECT h.phong_ban_id INTO v_hang_hoa_phong_ban_id
    FROM hang_hoa h WHERE h.id = p_hang_hoa_id;
    
    -- Lấy cấp bậc
    SELECT cap_bac INTO v_user_cap_bac 
    FROM phong_ban WHERE id = v_user_phong_ban_id;
    
    SELECT cap_bac INTO v_hang_hoa_cap_bac 
    FROM phong_ban WHERE id = v_hang_hoa_phong_ban_id;
    
    -- Logic phân quyền theo cấp bậc cho hàng hóa gốc
    CASE v_user_cap_bac
        WHEN 1 THEN -- BTL Vùng
            IF p_action = 'view' THEN
                RETURN TRUE;
            ELSIF p_action IN ('create', 'update', 'delete') THEN
                RETURN v_hang_hoa_cap_bac <= 2;
            END IF;
            
        WHEN 2 THEN -- Phòng ban/Ban chuyên môn
            IF p_action = 'view' THEN
                RETURN v_hang_hoa_phong_ban_id = v_user_phong_ban_id 
                    OR v_hang_hoa_phong_ban_id IN (
                        SELECT id FROM phong_ban WHERE phong_ban_cha_id = v_user_phong_ban_id
                    );
            ELSIF p_action IN ('create', 'update', 'delete') THEN
                RETURN v_hang_hoa_phong_ban_id = v_user_phong_ban_id 
                    OR (v_hang_hoa_cap_bac = 3 AND v_hang_hoa_phong_ban_id IN (
                        SELECT id FROM phong_ban WHERE phong_ban_cha_id = v_user_phong_ban_id
                    ));
            END IF;
            
        WHEN 3 THEN -- Đơn vị tác nghiệp
            RETURN v_hang_hoa_phong_ban_id = v_user_phong_ban_id;
            
        ELSE
            RETURN FALSE;
    END CASE;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function kiểm tra quyền phòng ban
CREATE OR REPLACE FUNCTION check_phong_ban_permission(
    p_user_id INTEGER,
    p_phong_ban_id INTEGER,
    p_action VARCHAR DEFAULT 'view'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_role user_role;
    v_user_phong_ban_id INTEGER;
    v_user_cap_bac INTEGER;
    v_target_cap_bac INTEGER;
    v_is_parent BOOLEAN := FALSE;
    v_is_child BOOLEAN := FALSE;
BEGIN
    -- Lấy thông tin user
    SELECT role, phong_ban_id INTO v_user_role, v_user_phong_ban_id
    FROM users WHERE id = p_user_id;
    
    -- Admin có toàn quyền
    IF v_user_role = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Cùng phòng ban luôn có quyền
    IF v_user_phong_ban_id = p_phong_ban_id THEN
        RETURN TRUE;
    END IF;
    
    -- Lấy cấp bậc
    SELECT cap_bac INTO v_user_cap_bac 
    FROM phong_ban WHERE id = v_user_phong_ban_id;
    
    SELECT cap_bac INTO v_target_cap_bac 
    FROM phong_ban WHERE id = p_phong_ban_id;
    
    -- Kiểm tra quan hệ cha-con
    SELECT EXISTS (
        SELECT 1 FROM phong_ban 
        WHERE id = p_phong_ban_id AND phong_ban_cha_id = v_user_phong_ban_id
    ) INTO v_is_child;
    
    SELECT EXISTS (
        SELECT 1 FROM phong_ban 
        WHERE id = v_user_phong_ban_id AND phong_ban_cha_id = p_phong_ban_id
    ) INTO v_is_parent;
    
    -- Logic phân quyền
    CASE p_action
        WHEN 'view' THEN
            -- Cấp trên có thể xem cấp dưới, cấp dưới có thể xem cấp trên
            RETURN v_is_child OR v_is_parent;
            
        WHEN 'manage', 'create_hang_hoa', 'approve' THEN
            -- Chỉ cấp trên mới có thể quản lý cấp dưới
            RETURN v_is_child;
            
        WHEN 'request' THEN
            -- Cấp dưới có thể yêu cầu từ cấp trên
            RETURN v_is_parent;
            
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function lấy hàng hóa với phân quyền (phiên bản mới nhất)
CREATE OR REPLACE FUNCTION get_hang_hoa_with_permission(
    p_user_id INTEGER,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 20,
    p_search TEXT DEFAULT '',
    p_loai_hang_hoa_id INTEGER DEFAULT NULL
)
RETURNS TABLE(
    id INTEGER,
    ma_hang_hoa VARCHAR(50),
    ten_hang_hoa VARCHAR(200),
    ten_loai VARCHAR(100),
    don_vi_tinh VARCHAR(20),
    so_luong_ton DECIMAL(10,2),
    gia_tri_ton DECIMAL(15,2),
    don_gia_binh_quan DECIMAL(15,2),
    gia_nhap_gan_nhat DECIMAL(15,2),
    ten_phong_ban VARCHAR(100),
    can_edit BOOLEAN,
    can_delete BOOLEAN,
    so_lan_nhap INTEGER
) AS $$
DECLARE
    v_offset INTEGER;
    v_user_role user_role;
    v_user_phong_ban_id INTEGER;
BEGIN
    v_offset := (p_page - 1) * p_limit;
    
    -- Lấy thông tin user
    SELECT role, phong_ban_id INTO v_user_role, v_user_phong_ban_id
    FROM users WHERE id = p_user_id;
    
    RETURN QUERY
    SELECT 
        h.id,
        h.ma_hang_hoa,
        h.ten_hang_hoa,
        lh.ten_loai,
        h.don_vi_tinh,
        COALESCE(tk.so_luong_ton, 0) as so_luong_ton,
        COALESCE(tk.gia_tri_ton, 0) as gia_tri_ton,
        COALESCE(tk.don_gia_binh_quan, 0) as don_gia_binh_quan,
        COALESCE(h.gia_nhap_gan_nhat, 0) as gia_nhap_gan_nhat,
        pb.ten_phong_ban,
        check_hang_hoa_permission_v2(p_user_id, h.id, 'update') as can_edit,
        check_hang_hoa_permission_v2(p_user_id, h.id, 'delete') as can_delete,
        COALESCE((
            SELECT COUNT(DISTINCT pn.id)::INTEGER
            FROM phieu_nhap pn
            JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
            WHERE ctn.hang_hoa_id = h.id 
            AND pn.trang_thai = 'completed'
            AND (v_user_role = 'admin' OR check_hang_hoa_permission_v2(p_user_id, h.id, 'view') = TRUE)
        ), 0) as so_lan_nhap
    FROM hang_hoa h
    LEFT JOIN loai_hang_hoa lh ON h.loai_hang_hoa_id = lh.id
    LEFT JOIN phong_ban pb ON h.phong_ban_id = pb.id
    LEFT JOIN ton_kho tk ON h.id = tk.hang_hoa_id AND tk.phong_ban_id = h.phong_ban_id
    WHERE h.trang_thai = 'active'
    AND check_hang_hoa_permission_v2(p_user_id, h.id, 'view') = TRUE
    AND (p_search = '' OR h.ten_hang_hoa ILIKE '%' || p_search || '%' OR h.ma_hang_hoa ILIKE '%' || p_search || '%')
    AND (p_loai_hang_hoa_id IS NULL OR h.loai_hang_hoa_id = p_loai_hang_hoa_id)
    ORDER BY h.created_at DESC
    LIMIT p_limit OFFSET v_offset;
END;
$$ LANGUAGE plpgsql;

-- Function lấy nhà cung cấp với nội bộ
CREATE OR REPLACE FUNCTION get_nha_cung_cap_with_noi_bo(
    p_user_id INTEGER DEFAULT NULL,
    p_loai_phieu loai_phieu_nhap DEFAULT 'tu_mua'
)
RETURNS TABLE(
    id INTEGER,
    ma_ncc VARCHAR(50),
    ten_ncc VARCHAR(200),
    is_noi_bo BOOLEAN,
    phong_ban_id INTEGER,
    ten_phong_ban VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ncc.id,
        ncc.ma_ncc,
        ncc.ten_ncc,
        COALESCE(ncc.is_noi_bo, false) as is_noi_bo,
        ncc.phong_ban_id,
        pb.ten_phong_ban
    FROM nha_cung_cap ncc
    LEFT JOIN phong_ban pb ON ncc.phong_ban_id = pb.id
    WHERE ncc.trang_thai = 'active'
    AND (
        -- Nhà cung cấp bên ngoài (cho tự mua)
        (p_loai_phieu = 'tu_mua' AND COALESCE(ncc.is_noi_bo, false) = false)
        OR
        -- Nhà cung cấp nội bộ (cho từ trên cấp/điều chuyển)
        (p_loai_phieu IN ('tren_cap', 'dieu_chuyen') AND ncc.is_noi_bo = true)
    )
    ORDER BY COALESCE(ncc.is_noi_bo, false) ASC, ncc.ten_ncc ASC;
END;
$$ LANGUAGE plpgsql;

-- Function lấy đơn vị nhận với nội bộ
CREATE OR REPLACE FUNCTION get_don_vi_nhan_with_noi_bo(
    p_user_id INTEGER DEFAULT NULL
)
RETURNS TABLE(
    id INTEGER,
    ma_don_vi VARCHAR(50),
    ten_don_vi VARCHAR(200),
    loai_don_vi VARCHAR(20),
    is_noi_bo BOOLEAN,
    phong_ban_id INTEGER,
    ten_phong_ban VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dvn.id,
        dvn.ma_don_vi,
        dvn.ten_don_vi,
        dvn.loai_don_vi,
        COALESCE(dvn.is_noi_bo, false) as is_noi_bo,
        dvn.phong_ban_id,
        pb.ten_phong_ban
    FROM don_vi_nhan dvn
    LEFT JOIN phong_ban pb ON dvn.phong_ban_id = pb.id
    WHERE dvn.trang_thai = 'active'
    ORDER BY COALESCE(dvn.is_noi_bo, false) ASC, dvn.ten_don_vi ASC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- PHẦN 9: TRIGGER TỰ ĐỘNG PHÂN QUYỀN VÀ LUÂN CHUYỂN
-- =============================================

-- Trigger tự động xác định phòng ban xử lý
CREATE OR REPLACE FUNCTION auto_assign_phong_ban_xu_ly()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'yeu_cau_nhap_kho' THEN
        NEW.phong_ban_xu_ly_id := get_phong_ban_xu_ly(NEW.don_vi_yeu_cau_id, 'nhap_kho'::loai_yeu_cau);
    ELSIF TG_TABLE_NAME = 'yeu_cau_xuat_kho' THEN  
        NEW.phong_ban_xu_ly_id := get_phong_ban_xu_ly(NEW.don_vi_yeu_cau_id, 'xuat_kho'::loai_yeu_cau);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger tự động tạo phiếu xuất khi phiếu nhập được duyệt (phiên bản mới nhất)
CREATE OR REPLACE FUNCTION auto_create_phieu_xuat_when_approved()
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
    -- Chỉ tạo phiếu xuất cho loại nhập từ trên cấp hoặc điều chuyển
    IF NEW.loai_phieu NOT IN ('tren_cap', 'dieu_chuyen') THEN
        RETURN NEW;
    END IF;
    
    -- Chỉ tạo khi có phòng ban cung cấp
    IF NEW.phong_ban_cung_cap_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Chỉ tạo khi phiếu nhập chuyển từ pending_admin_approval sang approved
    IF OLD.trang_thai != 'pending_admin_approval' OR NEW.trang_thai != 'approved' THEN
        RETURN NEW;
    END IF;
    
    -- Lấy thông tin phòng ban cung cấp và nhận
    SELECT * INTO v_phong_ban_cung_cap_info FROM phong_ban WHERE id = NEW.phong_ban_cung_cap_id;
    SELECT * INTO v_phong_ban_nhan_info FROM phong_ban WHERE id = NEW.phong_ban_id;
    
    -- Tìm admin user của phòng ban cung cấp
    SELECT u.id, u.ho_ten INTO v_admin_user_id, v_nguoi_giao
    FROM users u 
    WHERE u.phong_ban_id = NEW.phong_ban_cung_cap_id 
    AND u.role IN ('admin', 'manager')
    AND u.trang_thai = 'active'
    ORDER BY CASE WHEN u.role = 'admin' THEN 1 ELSE 2 END
    LIMIT 1;
    
    -- Nếu không tìm thấy, dùng system user
    IF v_admin_user_id IS NULL THEN
        v_admin_user_id := 1;
        v_nguoi_giao := 'Hệ thống';
    END IF;
    
    -- Lấy ID của đơn vị nhận từ bảng don_vi_nhan (đã có phòng ban)
    SELECT id INTO v_don_vi_nhan_id 
    FROM don_vi_nhan 
    WHERE phong_ban_id = NEW.phong_ban_id AND is_noi_bo = true;
    
    -- Tạo số quyết định tự động
    v_so_quyet_dinh := 'QD-XK-' || TO_CHAR(NEW.ngay_nhap, 'YYYYMMDD') || '-' || NEW.phong_ban_cung_cap_id || '-' || NEW.phong_ban_id;
    
    -- Tạo số phiếu xuất
    v_date_str := TO_CHAR(NEW.ngay_nhap, 'YYYYMMDD');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(so_phieu FROM 11) AS INTEGER)), 0)
    INTO v_max_seq
    FROM phieu_xuat 
    WHERE so_phieu LIKE 'PX' || v_date_str || '%';
    
    v_so_phieu_xuat := 'PX' || v_date_str || LPAD((v_max_seq + 1)::TEXT, 3, '0');
    
    -- Tạo phiếu xuất với trạng thái APPROVED (đã duyệt) luôn và đủ thông tin
    INSERT INTO phieu_xuat (
        so_phieu, ngay_xuat, phong_ban_id, phong_ban_nhan_id,
        don_vi_nhan_id, nguoi_nhan, nguoi_giao_hang,
        so_quyet_dinh, ly_do_xuat, loai_xuat, 
        trang_thai, nguoi_tao, nguoi_duyet,
        phieu_nhap_lien_ket_id, ghi_chu, tong_tien, 
        ngay_duyet, is_tu_dong
    ) VALUES (
        v_so_phieu_xuat, 
        NEW.ngay_nhap, 
        NEW.phong_ban_cung_cap_id,  -- Phòng ban xuất
        NEW.phong_ban_id,           -- Phòng ban nhận
        v_don_vi_nhan_id,           -- Đơn vị nhận (từ bảng có sẵn)
        COALESCE(NEW.nguoi_nhap_hang, 'Kho ' || v_phong_ban_nhan_info.ten_phong_ban),
        v_nguoi_giao,               -- Người giao hàng
        v_so_quyet_dinh,            -- Số quyết định tự động
        'Xuất hàng cho ' || v_phong_ban_nhan_info.ten_phong_ban || ' theo phiếu nhập ' || NEW.so_phieu,
        'don_vi_nhan', 
        'approved',                 -- Tự động duyệt luôn
        v_admin_user_id,
        v_admin_user_id,            -- Người duyệt cũng là admin của phòng ban cung cấp
        NEW.id, 
        'Tự động tạo khi phiếu nhập được duyệt từ ' || v_phong_ban_cung_cap_info.ten_phong_ban,
        NEW.tong_tien,
        CURRENT_TIMESTAMP,
        true                        -- Đánh dấu là tự động tạo
    ) RETURNING id INTO v_phieu_xuat_id;
    
    -- Tạo chi tiết xuất
    FOR v_chi_tiet IN 
        SELECT hang_hoa_id, so_luong_ke_hoach, don_gia, pham_chat
        FROM chi_tiet_nhap 
        WHERE phieu_nhap_id = NEW.id
    LOOP
        INSERT INTO chi_tiet_xuat (
            phieu_xuat_id, hang_hoa_id, so_luong_yeu_cau, so_luong_thuc_xuat,
            don_gia, thanh_tien, pham_chat
        ) VALUES (
            v_phieu_xuat_id,
            v_chi_tiet.hang_hoa_id,
            v_chi_tiet.so_luong_ke_hoach,
            v_chi_tiet.so_luong_ke_hoach, -- Số lượng thực xuất = kế hoạch
            v_chi_tiet.don_gia,
            v_chi_tiet.so_luong_ke_hoach * v_chi_tiet.don_gia,
            v_chi_tiet.pham_chat
        );
    END LOOP;
    
    -- Cập nhật liên kết ngược
    UPDATE phieu_nhap 
    SET phieu_xuat_lien_ket_id = v_phieu_xuat_id
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger tự động tạo phiếu nhập khi phiếu xuất được duyệt (phiên bản mới nhất)
CREATE OR REPLACE FUNCTION auto_create_phieu_nhap_when_xuat_approved()
RETURNS TRIGGER AS $$
DECLARE
    v_so_phieu_nhap TEXT;
    v_phieu_nhap_id INTEGER;
    v_chi_tiet RECORD;
    v_date_str TEXT;
    v_max_seq INTEGER;
    v_user_nhan_id INTEGER;
    v_nha_cung_cap_id INTEGER;
    v_nguoi_nhan VARCHAR(100);
    v_so_quyet_dinh TEXT;
    v_phong_ban_xuat_info RECORD;
    v_phong_ban_nhan_info RECORD;
BEGIN
    -- Chỉ tạo phiếu nhập khi xuất cho phòng ban khác (có phong_ban_nhan_id)
    IF NEW.phong_ban_nhan_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Chỉ tạo khi phiếu xuất chuyển từ pending_admin_approval sang approved
    IF OLD.trang_thai != 'pending_admin_approval' OR NEW.trang_thai != 'approved' THEN
        RETURN NEW;
    END IF;
    
    -- Lấy thông tin phòng ban xuất và nhận
    SELECT * INTO v_phong_ban_xuat_info FROM phong_ban WHERE id = NEW.phong_ban_id;
    SELECT * INTO v_phong_ban_nhan_info FROM phong_ban WHERE id = NEW.phong_ban_nhan_id;
    
    -- Tìm user của phòng ban nhận
    SELECT u.id, u.ho_ten INTO v_user_nhan_id, v_nguoi_nhan
    FROM users u 
    WHERE u.phong_ban_id = NEW.phong_ban_nhan_id 
    AND u.role IN ('admin', 'manager')
    AND u.trang_thai = 'active'
    ORDER BY CASE WHEN u.role = 'admin' THEN 1 ELSE 2 END
    LIMIT 1;
    
    -- Nếu không tìm thấy, dùng system user
    IF v_user_nhan_id IS NULL THEN
        v_user_nhan_id := 1;
        v_nguoi_nhan := 'Hệ thống';
    END IF;
    
    -- Lấy ID của nhà cung cấp từ bảng nha_cung_cap (đã có phòng ban)
    SELECT id INTO v_nha_cung_cap_id 
    FROM nha_cung_cap 
    WHERE phong_ban_id = NEW.phong_ban_id AND is_noi_bo = true;
    
    -- Tạo số quyết định tự động
    v_so_quyet_dinh := 'QD-NK-' || TO_CHAR(NEW.ngay_xuat, 'YYYYMMDD') || '-' || NEW.phong_ban_id || '-' || NEW.phong_ban_nhan_id;
    
    -- Tạo số phiếu nhập
    v_date_str := TO_CHAR(NEW.ngay_xuat, 'YYYYMMDD');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(so_phieu FROM 11) AS INTEGER)), 0)
    INTO v_max_seq
    FROM phieu_nhap 
    WHERE so_phieu LIKE 'PN' || v_date_str || '%';
    
    v_so_phieu_nhap := 'PN' || v_date_str || LPAD((v_max_seq + 1)::TEXT, 3, '0');
    
    -- Tạo phiếu nhập với trạng thái APPROVED (đã duyệt) luôn và đủ thông tin
    INSERT INTO phieu_nhap (
        so_phieu, ngay_nhap, phong_ban_id, phong_ban_cung_cap_id,
        nha_cung_cap_id, nguoi_nhap_hang, nguoi_giao_hang,
        so_quyet_dinh, ly_do_nhap, loai_phieu, 
        trang_thai, nguoi_tao, nguoi_duyet,
        phieu_xuat_lien_ket_id, ghi_chu, tong_tien, 
        ngay_duyet, is_tu_dong
    ) VALUES (
        v_so_phieu_nhap, 
        NEW.ngay_xuat, 
        NEW.phong_ban_nhan_id,      -- Phòng ban nhận
        NEW.phong_ban_id,           -- Phòng ban cung cấp (xuất)
        v_nha_cung_cap_id,          -- Nhà cung cấp (từ bảng có sẵn)
        COALESCE(NEW.nguoi_nhan, v_nguoi_nhan),
        NEW.nguoi_giao_hang,        -- Người giao hàng
        v_so_quyet_dinh,            -- Số quyết định tự động
        'Nhận hàng từ ' || v_phong_ban_xuat_info.ten_phong_ban || ' theo phiếu xuất ' || NEW.so_phieu,
        'tren_cap', 
        'approved',                 -- Tự động duyệt luôn
        v_user_nhan_id,
        v_user_nhan_id,             -- Người duyệt cũng là admin của phòng ban nhận
        NEW.id, 
        'Tự động tạo khi phiếu xuất được duyệt từ ' || v_phong_ban_xuat_info.ten_phong_ban,
        NEW.tong_tien,
        CURRENT_TIMESTAMP,
        true                        -- Đánh dấu là tự động tạo
    ) RETURNING id INTO v_phieu_nhap_id;
    
    -- Tạo chi tiết nhập
    FOR v_chi_tiet IN 
        SELECT hang_hoa_id, so_luong_yeu_cau, don_gia, pham_chat
        FROM chi_tiet_xuat 
        WHERE phieu_xuat_id = NEW.id
    LOOP
        INSERT INTO chi_tiet_nhap (
            phieu_nhap_id, hang_hoa_id, so_luong_ke_hoach, so_luong,
            don_gia, thanh_tien, pham_chat
        ) VALUES (
            v_phieu_nhap_id,
            v_chi_tiet.hang_hoa_id,
            v_chi_tiet.so_luong_yeu_cau,
            v_chi_tiet.so_luong_yeu_cau, -- Số lượng thực nhập = yêu cầu
            v_chi_tiet.don_gia,
            v_chi_tiet.so_luong_yeu_cau * v_chi_tiet.don_gia,
            v_chi_tiet.pham_chat
        );
    END LOOP;
    
    -- Cập nhật liên kết ngược
    UPDATE phieu_xuat 
    SET phieu_nhap_lien_ket_id = v_phieu_nhap_id
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger tự động cập nhật tồn kho khi hoàn thành phiếu
CREATE OR REPLACE FUNCTION auto_update_ton_kho_on_complete()
RETURNS TRIGGER AS $
DECLARE
    v_chi_tiet RECORD;
BEGIN
    -- Chỉ cập nhật tồn kho khi phiếu chuyển sang completed
    IF NEW.trang_thai != 'completed' OR OLD.trang_thai = 'completed' THEN
        RETURN NEW;
    END IF;
    
    -- Xử lý cho phiếu nhập
    IF TG_TABLE_NAME = 'phieu_nhap' THEN
        FOR v_chi_tiet IN 
            SELECT hang_hoa_id, so_luong, don_gia, pham_chat
            FROM chi_tiet_nhap 
            WHERE phieu_nhap_id = NEW.id
        LOOP
            -- Cập nhật tồn kho cho phòng ban nhận
            INSERT INTO ton_kho (
                hang_hoa_id, phong_ban_id, don_gia_binh_quan,
                sl_tot, sl_kem_pham_chat, sl_mat_pham_chat, sl_hong, sl_can_thanh_ly,
                gia_tri_ton
            ) VALUES (
                v_chi_tiet.hang_hoa_id, 
                NEW.phong_ban_id, 
                v_chi_tiet.don_gia,
                CASE WHEN v_chi_tiet.pham_chat = 'tot' THEN v_chi_tiet.so_luong ELSE 0 END,
                CASE WHEN v_chi_tiet.pham_chat = 'kem_pham_chat' THEN v_chi_tiet.so_luong ELSE 0 END,
                CASE WHEN v_chi_tiet.pham_chat = 'mat_pham_chat' THEN v_chi_tiet.so_luong ELSE 0 END,
                CASE WHEN v_chi_tiet.pham_chat = 'hong' THEN v_chi_tiet.so_luong ELSE 0 END,
                CASE WHEN v_chi_tiet.pham_chat = 'can_thanh_ly' THEN v_chi_tiet.so_luong ELSE 0 END,
                v_chi_tiet.so_luong * v_chi_tiet.don_gia
            ) 
            ON CONFLICT (hang_hoa_id, phong_ban_id) 
            DO UPDATE SET 
                sl_tot = ton_kho.sl_tot + CASE WHEN v_chi_tiet.pham_chat = 'tot' THEN v_chi_tiet.so_luong ELSE 0 END,
                sl_kem_pham_chat = ton_kho.sl_kem_pham_chat + CASE WHEN v_chi_tiet.pham_chat = 'kem_pham_chat' THEN v_chi_tiet.so_luong ELSE 0 END,
                sl_mat_pham_chat = ton_kho.sl_mat_pham_chat + CASE WHEN v_chi_tiet.pham_chat = 'mat_pham_chat' THEN v_chi_tiet.so_luong ELSE 0 END,
                sl_hong = ton_kho.sl_hong + CASE WHEN v_chi_tiet.pham_chat = 'hong' THEN v_chi_tiet.so_luong ELSE 0 END,
                sl_can_thanh_ly = ton_kho.sl_can_thanh_ly + CASE WHEN v_chi_tiet.pham_chat = 'can_thanh_ly' THEN v_chi_tiet.so_luong ELSE 0 END,
                gia_tri_ton = ton_kho.gia_tri_ton + (v_chi_tiet.so_luong * v_chi_tiet.don_gia),
                don_gia_binh_quan = (ton_kho.gia_tri_ton + (v_chi_tiet.so_luong * v_chi_tiet.don_gia)) / 
                                  (ton_kho.so_luong_ton + v_chi_tiet.so_luong),
                ngay_cap_nhat = CURRENT_TIMESTAMP;
                
            -- Nếu là nhập từ trên cấp, trừ tồn kho của phòng ban cung cấp
            IF NEW.loai_phieu IN ('tren_cap', 'dieu_chuyen') AND NEW.phong_ban_cung_cap_id IS NOT NULL THEN
                UPDATE ton_kho 
                SET 
                    sl_tot = GREATEST(0, sl_tot - CASE WHEN v_chi_tiet.pham_chat = 'tot' THEN v_chi_tiet.so_luong ELSE 0 END),
                    sl_kem_pham_chat = GREATEST(0, sl_kem_pham_chat - CASE WHEN v_chi_tiet.pham_chat = 'kem_pham_chat' THEN v_chi_tiet.so_luong ELSE 0 END),
                    sl_mat_pham_chat = GREATEST(0, sl_mat_pham_chat - CASE WHEN v_chi_tiet.pham_chat = 'mat_pham_chat' THEN v_chi_tiet.so_luong ELSE 0 END),
                    sl_hong = GREATEST(0, sl_hong - CASE WHEN v_chi_tiet.pham_chat = 'hong' THEN v_chi_tiet.so_luong ELSE 0 END),
                    sl_can_thanh_ly = GREATEST(0, sl_can_thanh_ly - CASE WHEN v_chi_tiet.pham_chat = 'can_thanh_ly' THEN v_chi_tiet.so_luong ELSE 0 END),
                    gia_tri_ton = GREATEST(0, gia_tri_ton - (v_chi_tiet.so_luong * v_chi_tiet.don_gia)),
                    ngay_cap_nhat = CURRENT_TIMESTAMP
                WHERE hang_hoa_id = v_chi_tiet.hang_hoa_id 
                AND phong_ban_id = NEW.phong_ban_cung_cap_id;
            END IF;
        END LOOP;
        
    -- Xử lý cho phiếu xuất  
    ELSIF TG_TABLE_NAME = 'phieu_xuat' THEN
        FOR v_chi_tiet IN 
            SELECT hang_hoa_id, so_luong_thuc_xuat, don_gia, pham_chat
            FROM chi_tiet_xuat 
            WHERE phieu_xuat_id = NEW.id
        LOOP
            -- Trừ tồn kho của phòng ban xuất
            UPDATE ton_kho 
            SET 
                sl_tot = GREATEST(0, sl_tot - CASE WHEN v_chi_tiet.pham_chat = 'tot' THEN v_chi_tiet.so_luong_thuc_xuat ELSE 0 END),
                sl_kem_pham_chat = GREATEST(0, sl_kem_pham_chat - CASE WHEN v_chi_tiet.pham_chat = 'kem_pham_chat' THEN v_chi_tiet.so_luong_thuc_xuat ELSE 0 END),
                sl_mat_pham_chat = GREATEST(0, sl_mat_pham_chat - CASE WHEN v_chi_tiet.pham_chat = 'mat_pham_chat' THEN v_chi_tiet.so_luong_thuc_xuat ELSE 0 END),
                sl_hong = GREATEST(0, sl_hong - CASE WHEN v_chi_tiet.pham_chat = 'hong' THEN v_chi_tiet.so_luong_thuc_xuat ELSE 0 END),
                sl_can_thanh_ly = GREATEST(0, sl_can_thanh_ly - CASE WHEN v_chi_tiet.pham_chat = 'can_thanh_ly' THEN v_chi_tiet.so_luong_thuc_xuat ELSE 0 END),
                gia_tri_ton = GREATEST(0, gia_tri_ton - (v_chi_tiet.so_luong_thuc_xuat * v_chi_tiet.don_gia)),
                ngay_cap_nhat = CURRENT_TIMESTAMP
            WHERE hang_hoa_id = v_chi_tiet.hang_hoa_id 
            AND phong_ban_id = NEW.phong_ban_id;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- =============================================
-- PHẦN 10: TẠO VÀ GẮN CÁC TRIGGER
-- =============================================

-- Xóa các trigger cũ trước khi tạo mới
DROP TRIGGER IF EXISTS tr_auto_assign_phong_ban_xu_ly_nhap ON yeu_cau_nhap_kho;
DROP TRIGGER IF EXISTS tr_auto_assign_phong_ban_xu_ly_xuat ON yeu_cau_xuat_kho;
DROP TRIGGER IF EXISTS tr_auto_create_phieu_xuat_when_approved ON phieu_nhap;
DROP TRIGGER IF EXISTS tr_auto_create_phieu_nhap_when_xuat_approved ON phieu_xuat;
DROP TRIGGER IF EXISTS tr_auto_update_ton_kho_nhap ON phieu_nhap;
DROP TRIGGER IF EXISTS tr_auto_update_ton_kho_xuat ON phieu_xuat;

-- Gắn trigger tự động phân công phòng ban xử lý
CREATE TRIGGER tr_auto_assign_phong_ban_xu_ly_nhap
    BEFORE INSERT ON yeu_cau_nhap_kho
    FOR EACH ROW EXECUTE FUNCTION auto_assign_phong_ban_xu_ly();

CREATE TRIGGER tr_auto_assign_phong_ban_xu_ly_xuat
    BEFORE INSERT ON yeu_cau_xuat_kho
    FOR EACH ROW EXECUTE FUNCTION auto_assign_phong_ban_xu_ly();

-- Gắn trigger tự động tạo phiếu liên kết
CREATE TRIGGER tr_auto_create_phieu_xuat_when_approved
    AFTER UPDATE ON phieu_nhap
    FOR EACH ROW EXECUTE FUNCTION auto_create_phieu_xuat_when_approved();

CREATE TRIGGER tr_auto_create_phieu_nhap_when_xuat_approved
    AFTER UPDATE ON phieu_xuat
    FOR EACH ROW EXECUTE FUNCTION auto_create_phieu_nhap_when_xuat_approved();

-- Gắn trigger tự động cập nhật tồn kho
CREATE TRIGGER tr_auto_update_ton_kho_nhap
    AFTER UPDATE ON phieu_nhap
    FOR EACH ROW EXECUTE FUNCTION auto_update_ton_kho_on_complete();

CREATE TRIGGER tr_auto_update_ton_kho_xuat
    AFTER UPDATE ON phieu_xuat
    FOR EACH ROW EXECUTE FUNCTION auto_update_ton_kho_on_complete();

-- =============================================
-- PHẦN 11: VIEW VÀ CÁC FUNCTION HIỂN THỊ
-- =============================================

-- Tạo view hiển thị cấu trúc tổ chức
CREATE OR REPLACE VIEW v_cau_truc_to_chuc AS
WITH RECURSIVE org_tree AS (
    -- Bắt đầu từ BTL Vùng (cấp 1)
    SELECT 
        id, ma_phong_ban, ten_phong_ban, cap_bac, phong_ban_cha_id,
        ARRAY[id] as path,
        0 as level,
        ARRAY[thu_tu_hien_thi] as sort_path
    FROM phong_ban 
    WHERE cap_bac = 1
    
    UNION ALL
    
    -- Đệ quy xuống các cấp dưới
    SELECT 
        pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac, pb.phong_ban_cha_id,
        ot.path || pb.id,
        ot.level + 1,
        ot.sort_path || pb.thu_tu_hien_thi
    FROM phong_ban pb
    JOIN org_tree ot ON pb.phong_ban_cha_id = ot.id
)
SELECT 
    id,
    ma_phong_ban,
    ten_phong_ban,
    cap_bac,
    phong_ban_cha_id,
    level,
    REPEAT('  ', level) || ten_phong_ban as ten_phong_ban_indent,
    path
FROM org_tree
ORDER BY sort_path;

-- Tạo view tồn kho tổng hợp với thông tin nguồn gốc
CREATE OR REPLACE VIEW v_ton_kho_tong_hop AS
SELECT 
    tk.hang_hoa_id,
    tk.phong_ban_id,
    h.ma_hang_hoa,
    h.ten_hang_hoa,
    h.don_vi_tinh,
    pb.ten_phong_ban,
    pb.cap_bac,
    tk.sl_tot,
    tk.sl_kem_pham_chat,
    tk.sl_mat_pham_chat,
    tk.sl_hong,
    tk.sl_can_thanh_ly,
    (tk.sl_tot + tk.sl_kem_pham_chat + tk.sl_mat_pham_chat + tk.sl_hong + tk.sl_can_thanh_ly) as so_luong_ton,
    tk.gia_tri_ton,
    tk.don_gia_binh_quan,
    tk.ngay_cap_nhat,
    -- Thêm thông tin về nguồn gốc hàng hóa
    CASE 
        WHEN h.phong_ban_id = tk.phong_ban_id THEN 'Hàng hóa gốc'
        ELSE 'Nhận từ cấp trên'
    END as nguon_goc,
    -- Kiểm tra xem có phải hàng từ cấp trên xuống không
    EXISTS(
        SELECT 1 FROM phieu_nhap pn 
        JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
        WHERE ctn.hang_hoa_id = tk.hang_hoa_id 
        AND pn.phong_ban_id = tk.phong_ban_id
        AND pn.loai_phieu = 'tren_cap'
        AND pn.trang_thai = 'completed'
    ) as la_hang_tu_tren_cap
FROM ton_kho tk
JOIN hang_hoa h ON tk.hang_hoa_id = h.id
JOIN phong_ban pb ON tk.phong_ban_id = pb.id
WHERE (tk.sl_tot + tk.sl_kem_pham_chat + tk.sl_mat_pham_chat + tk.sl_hong + tk.sl_can_thanh_ly) > 0
ORDER BY pb.cap_bac, pb.ten_phong_ban, h.ten_hang_hoa;

-- =============================================
-- PHẦN 12: TẠO INDEXES ĐỂ TỐI ƯU HIỆU SUẤT
-- =============================================

-- Indexes cho bảng phòng ban
CREATE INDEX IF NOT EXISTS idx_phong_ban_cap_bac ON phong_ban(cap_bac);
CREATE INDEX IF NOT EXISTS idx_phong_ban_cha ON phong_ban(phong_ban_cha_id);
CREATE INDEX IF NOT EXISTS idx_phong_ban_active ON phong_ban(is_active);

-- Indexes cho quan hệ phòng ban
CREATE INDEX IF NOT EXISTS idx_quan_he_phong_ban_cung_cap ON quan_he_phong_ban(phong_ban_cung_cap_id);
CREATE INDEX IF NOT EXISTS idx_quan_he_phong_ban_nhan ON quan_he_phong_ban(phong_ban_nhan_id);
CREATE INDEX IF NOT EXISTS idx_quan_he_phong_ban_active ON quan_he_phong_ban(is_active);

-- Indexes cho yêu cầu
CREATE INDEX IF NOT EXISTS idx_yeu_cau_nhap_phong_ban_xu_ly ON yeu_cau_nhap_kho(phong_ban_xu_ly_id);
CREATE INDEX IF NOT EXISTS idx_yeu_cau_xuat_phong_ban_xu_ly ON yeu_cau_xuat_kho(phong_ban_xu_ly_id);

-- Indexes cho phiếu nhập/xuất
CREATE INDEX IF NOT EXISTS idx_phieu_nhap_yeu_cau ON phieu_nhap(yeu_cau_nhap_id);
CREATE INDEX IF NOT EXISTS idx_phieu_xuat_yeu_cau ON phieu_xuat(yeu_cau_xuat_id);
CREATE INDEX IF NOT EXISTS idx_phieu_nhap_phong_ban_cung_cap ON phieu_nhap(phong_ban_cung_cap_id);
CREATE INDEX IF NOT EXISTS idx_phieu_xuat_phong_ban_nhan ON phieu_xuat(phong_ban_nhan_id);
CREATE INDEX IF NOT EXISTS idx_phieu_nhap_xuat_lien_ket ON phieu_nhap(phieu_xuat_lien_ket_id);
CREATE INDEX IF NOT EXISTS idx_phieu_xuat_nhap_lien_ket ON phieu_xuat(phieu_nhap_lien_ket_id);
CREATE INDEX IF NOT EXISTS idx_phieu_nhap_tu_dong ON phieu_nhap(is_tu_dong);
CREATE INDEX IF NOT EXISTS idx_phieu_xuat_tu_dong ON phieu_xuat(is_tu_dong);

-- Indexes cho nhà cung cấp và đơn vị nhận
CREATE INDEX IF NOT EXISTS idx_nha_cung_cap_noi_bo ON nha_cung_cap(is_noi_bo, phong_ban_id);
CREATE INDEX IF NOT EXISTS idx_don_vi_nhan_noi_bo ON don_vi_nhan(is_noi_bo, phong_ban_id);

-- Indexes cho tồn kho
CREATE INDEX IF NOT EXISTS idx_ton_kho_phong_ban ON ton_kho(phong_ban_id);
CREATE INDEX IF NOT EXISTS idx_ton_kho_hang_hoa ON ton_kho(hang_hoa_id);
CREATE INDEX IF NOT EXISTS idx_ton_kho_composite ON ton_kho(hang_hoa_id, phong_ban_id);

-- =============================================
-- PHẦN 13: COMMENTS CHO TÀI LIỆU
-- =============================================

-- Comments cho các cột mới
COMMENT ON COLUMN phieu_nhap.yeu_cau_nhap_id IS 'Liên kết với yêu cầu nhập kho đã được phê duyệt';
COMMENT ON COLUMN phieu_xuat.yeu_cau_xuat_id IS 'Liên kết với yêu cầu xuất kho đã được phê duyệt';
COMMENT ON COLUMN phieu_nhap.phong_ban_cung_cap_id IS 'Phòng ban cung cấp hàng (khi loại phiếu là tren_cap hoặc dieu_chuyen)';
COMMENT ON COLUMN phieu_nhap.phieu_xuat_lien_ket_id IS 'Phiếu xuất tương ứng của phòng ban cung cấp';
COMMENT ON COLUMN phieu_xuat.phong_ban_nhan_id IS 'Phòng ban nhận hàng khi xuất cho cấp dưới';
COMMENT ON COLUMN phieu_xuat.phieu_nhap_lien_ket_id IS 'Phiếu nhập tương ứng của phòng ban nhận';

COMMENT ON COLUMN yeu_cau_nhap_kho.nguon_cung_cap IS 'Nguồn cung cấp dự kiến: tu_mua, tren_cap, dieu_chuyen';
COMMENT ON COLUMN yeu_cau_nhap_kho.phong_ban_xu_ly_id IS 'Phòng ban chịu trách nhiệm xử lý yêu cầu';
COMMENT ON COLUMN yeu_cau_xuat_kho.phong_ban_xu_ly_id IS 'Phòng ban chịu trách nhiệm xử lý yêu cầu';
COMMENT ON COLUMN yeu_cau_xuat_kho.loai_xuat_yc IS 'Loại xuất: cho đơn vị nhận hay đơn vị sử dụng';

COMMENT ON COLUMN chi_tiet_nhap.so_luong_ke_hoach IS 'Số lượng dự kiến ban đầu, cố định sau khi duyệt';
COMMENT ON COLUMN chi_tiet_nhap.so_luong IS 'Số lượng thực nhập, ảnh hưởng đến tồn kho';

COMMENT ON COLUMN phieu_nhap.is_tu_dong IS 'Đánh dấu phiếu được tạo tự động bởi hệ thống';
COMMENT ON COLUMN phieu_xuat.is_tu_dong IS 'Đánh dấu phiếu được tạo tự động bởi hệ thống';
COMMENT ON COLUMN nha_cung_cap.is_noi_bo IS 'Đánh dấu nhà cung cấp nội bộ (phòng ban)';
COMMENT ON COLUMN don_vi_nhan.is_noi_bo IS 'Đánh dấu đơn vị nhận nội bộ (phòng ban)';

COMMENT ON TABLE quan_he_phong_ban IS 'Quản lý quan hệ cung cấp hàng hóa giữa các phòng ban';
COMMENT ON COLUMN quan_he_phong_ban.loai_quan_he IS 'truc_tiep: cấp trên-dưới trực tiếp, gian_tiep: có thể cung cấp cho nhau';

-- =============================================
-- =============================================
-- CẬP NHẬT DATABASE CHO QUY TRÌNH NÂNG CAO
-- =============================================

-- 1. Thêm loại phiếu "luân chuyển" cho cấp 3
ALTER TYPE loai_phieu_nhap ADD VALUE IF NOT EXISTS 'luan_chuyen';

-- 2. Cập nhật enum trạng thái để hỗ trợ workflow linh hoạt  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending_level3_approval' AND enumtypid = 'trang_thai_phieu'::regtype) THEN
        ALTER TYPE trang_thai_phieu ADD VALUE 'pending_level3_approval';
    END IF;
END $$;

-- 3. Thêm trường để phân biệt workflow
ALTER TABLE phieu_nhap 
ADD COLUMN IF NOT EXISTS workflow_type VARCHAR(20) DEFAULT 'standard' CHECK (workflow_type IN ('standard', 'level3_exchange', 'level1_direct')),
ADD COLUMN IF NOT EXISTS approved_by_manager INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS ngay_duyet_manager TIMESTAMP WITH TIME ZONE;

ALTER TABLE phieu_xuat
ADD COLUMN IF NOT EXISTS workflow_type VARCHAR(20) DEFAULT 'standard' CHECK (workflow_type IN ('standard', 'level3_exchange', 'level1_direct')),
ADD COLUMN IF NOT EXISTS approved_by_manager INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS ngay_duyet_manager TIMESTAMP WITH TIME ZONE;

-- 4. Cập nhật bảng nhà cung cấp để lưu thông tin phòng ban khi là nội bộ
ALTER TABLE nha_cung_cap 
ADD COLUMN IF NOT EXISTS related_phong_ban_info JSONB;

COMMENT ON COLUMN nha_cung_cap.related_phong_ban_info IS 'Thông tin phòng ban liên quan khi là NCC nội bộ (tên, cấp bậc, etc.)';

-- 5. Function mới để xác định workflow type
CREATE OR REPLACE FUNCTION determine_workflow_type(
    p_loai_phieu loai_phieu_nhap,
    p_user_cap_bac INTEGER,
    p_phong_ban_cung_cap_cap_bac INTEGER DEFAULT NULL
)
RETURNS VARCHAR(20) AS $$
BEGIN
    -- Nếu là tự mua hoặc admin tạo từ cấp 1
    IF p_loai_phieu = 'tu_mua' OR p_user_cap_bac = 1 THEN
        RETURN 'standard';
    END IF;
    
    -- Nếu là luân chuyển giữa cấp 3
    IF p_loai_phieu = 'luan_chuyen' AND p_user_cap_bac = 3 THEN
        RETURN 'level3_exchange';
    END IF;
    
    -- Nếu cấp 3 nhập từ cấp 1
    IF p_loai_phieu = 'tren_cap' AND p_user_cap_bac = 3 AND p_phong_ban_cung_cap_cap_bac = 1 THEN
        RETURN 'level1_direct';
    END IF;
    
    RETURN 'standard';
END;
$$ LANGUAGE plpgsql;

-- 6. Function lấy danh sách cấp 3 cùng cấp để luân chuyển
CREATE OR REPLACE FUNCTION get_cap3_cung_cap_bac(p_user_phong_ban_id INTEGER)
RETURNS TABLE(
    id INTEGER,
    ma_phong_ban VARCHAR(20),
    ten_phong_ban VARCHAR(100),
    cap_bac INTEGER,
    phong_ban_cha_id INTEGER
) AS $$
BEGIN
    -- Lấy phòng ban cha của user
    DECLARE
        v_phong_ban_cha_id INTEGER;
    BEGIN
        SELECT pb.phong_ban_cha_id INTO v_phong_ban_cha_id
        FROM phong_ban pb WHERE pb.id = p_user_phong_ban_id;
        
        -- Trả về các cấp 3 cùng cấp (trừ chính mình)
        RETURN QUERY
        SELECT pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac, pb.phong_ban_cha_id
        FROM phong_ban pb
        WHERE pb.cap_bac = 3 
        AND pb.phong_ban_cha_id = v_phong_ban_cha_id
        AND pb.id != p_user_phong_ban_id
        AND pb.is_active = TRUE
        ORDER BY pb.ten_phong_ban;
    END;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger tự động xác định workflow type
CREATE OR REPLACE FUNCTION auto_set_workflow_type()
RETURNS TRIGGER AS $$
DECLARE
    v_user_cap_bac INTEGER;
    v_phong_ban_cung_cap_cap_bac INTEGER;
BEGIN
    -- Lấy cấp bậc của user tạo
    SELECT pb.cap_bac INTO v_user_cap_bac
    FROM users u
    JOIN phong_ban pb ON u.phong_ban_id = pb.id
    WHERE u.id = NEW.nguoi_tao;
    
    -- Lấy cấp bậc phòng ban cung cấp nếu có
    IF NEW.phong_ban_cung_cap_id IS NOT NULL THEN
        SELECT pb.cap_bac INTO v_phong_ban_cung_cap_cap_bac
        FROM phong_ban pb WHERE pb.id = NEW.phong_ban_cung_cap_id;
    END IF;
    
    -- Xác định workflow type
    NEW.workflow_type := determine_workflow_type(
        NEW.loai_phieu::loai_phieu_nhap, 
        v_user_cap_bac, 
        v_phong_ban_cung_cap_cap_bac
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gắn trigger
DROP TRIGGER IF EXISTS tr_auto_set_workflow_type_nhap ON phieu_nhap;
CREATE TRIGGER tr_auto_set_workflow_type_nhap
    BEFORE INSERT ON phieu_nhap
    FOR EACH ROW EXECUTE FUNCTION auto_set_workflow_type();

-- 8. Cập nhật dữ liệu mẫu cho các loại phiếu nhập
UPDATE phieu_nhap SET workflow_type = 'standard' WHERE workflow_type IS NULL;

-- 9. View tổng hợp thông tin workflow
CREATE OR REPLACE VIEW v_phieu_nhap_workflow AS
SELECT 
    pn.*,
    pb.ten_phong_ban,
    pb.cap_bac as user_cap_bac,
    pb_cc.ten_phong_ban as ten_phong_ban_cung_cap,
    pb_cc.cap_bac as cap_bac_cung_cap,
    ncc.ten_ncc,
    u_tao.ho_ten as nguoi_tao_ten,
    u_duyet.ho_ten as nguoi_duyet_ten,
    u_manager.ho_ten as manager_duyet_ten,
    CASE 
        WHEN pn.workflow_type = 'level3_exchange' THEN 'Luân chuyển cấp 3'
        WHEN pn.workflow_type = 'level1_direct' THEN 'Nhập từ BTL Vùng'
        ELSE 'Quy trình tiêu chuẩn'
    END as mo_ta_workflow
FROM phieu_nhap pn
LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
LEFT JOIN phong_ban pb_cc ON pn.phong_ban_cung_cap_id = pb_cc.id  
LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
LEFT JOIN users u_tao ON pn.nguoi_tao = u_tao.id
LEFT JOIN users u_duyet ON pn.nguoi_duyet = u_duyet.id
LEFT JOIN users u_manager ON pn.approved_by_manager = u_manager.id;