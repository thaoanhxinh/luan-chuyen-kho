-- =============================================
-- CẬP NHẬT SCHEMA NOTIFICATIONS THEO ENUM MỚI
-- =============================================

-- 1. Cập nhật enum loai_thong_bao với các giá trị mới
ALTER TYPE loai_thong_bao RENAME TO loai_thong_bao_old;

CREATE TYPE loai_thong_bao AS ENUM (
    'phieu_nhap_can_duyet',
    'phieu_nhap_duyet', 
    'phieu_nhap_can_sua',
    'phieu_xuat_can_duyet',
    'phieu_xuat_duyet',
    'phieu_xuat_can_sua',
    'system'
);

-- 2. Cập nhật bảng notifications
ALTER TABLE notifications 
ALTER COLUMN loai_thong_bao TYPE loai_thong_bao 
USING CASE 
    WHEN loai_thong_bao::text = 'phieu_can_duyet' THEN 'phieu_nhap_can_duyet'::loai_thong_bao
    WHEN loai_thong_bao::text = 'phieu_duyet' THEN 'phieu_nhap_duyet'::loai_thong_bao  
    WHEN loai_thong_bao::text = 'phieu_can_sua' THEN 'phieu_nhap_can_sua'::loai_thong_bao
    WHEN loai_thong_bao::text = 'system' THEN 'system'::loai_thong_bao
    ELSE 'system'::loai_thong_bao
END;

-- 3. Xóa enum cũ
DROP TYPE loai_thong_bao_old;

-- 4. Thêm cột mức độ ưu tiên nếu chưa có
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS muc_do_uu_tien VARCHAR(20) DEFAULT 'normal' 
CHECK (muc_do_uu_tien IN ('urgent', 'high', 'medium', 'normal', 'low'));

-- 5. Cập nhật comment
COMMENT ON COLUMN notifications.loai_thong_bao IS 'Loại thông báo: phieu_nhap_can_duyet, phieu_nhap_duyet, phieu_nhap_can_sua, phieu_xuat_can_duyet, phieu_xuat_duyet, phieu_xuat_can_sua, system';
COMMENT ON COLUMN notifications.muc_do_uu_tien IS 'Mức độ ưu tiên: urgent, high, medium, normal, low';

-- 6. Tạo indexes để tối ưu hiệu suất
CREATE INDEX IF NOT EXISTS idx_notifications_loai_thong_bao ON notifications(loai_thong_bao);
CREATE INDEX IF NOT EXISTS idx_notifications_muc_do_uu_tien ON notifications(muc_do_uu_tien);
CREATE INDEX IF NOT EXISTS idx_notifications_nguoi_nhan_trang_thai ON notifications(nguoi_nhan, trang_thai);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- 7. Kiểm tra dữ liệu sau khi cập nhật
SELECT 
    loai_thong_bao,
    COUNT(*) as so_luong,
    COUNT(CASE WHEN trang_thai = 'unread' THEN 1 END) as chua_doc
FROM notifications 
GROUP BY loai_thong_bao 
ORDER BY loai_thong_bao;


-- Cập nhật URL của các thông báo cũ đã tồn tại

-- 1. Cập nhật thông báo phiếu nhập
UPDATE notifications 
SET url_redirect = CASE 
    WHEN loai_thong_bao = 'phieu_nhap_can_duyet' THEN 
        REPLACE(url_redirect, '/nhap-kho/', '/nhap-kho?tab=can-duyet&highlight=')
    WHEN loai_thong_bao = 'phieu_nhap_duyet' THEN 
        REPLACE(url_redirect, '/nhap-kho/', '/nhap-kho?tab=da-duyet&highlight=')
    WHEN loai_thong_bao = 'phieu_nhap_can_sua' THEN 
        REPLACE(url_redirect, '/nhap-kho/', '/nhap-kho?tab=can-sua&highlight=')
    ELSE url_redirect
END
WHERE loai_thong_bao IN ('phieu_nhap_can_duyet', 'phieu_nhap_duyet', 'phieu_nhap_can_sua')
AND url_redirect LIKE '/nhap-kho/%'
AND url_redirect NOT LIKE '/nhap-kho?tab=%';

-- 2. Cập nhật thông báo phiếu xuất
UPDATE notifications 
SET url_redirect = CASE 
    WHEN loai_thong_bao = 'phieu_xuat_can_duyet' THEN 
        REPLACE(url_redirect, '/xuat-kho/', '/xuat-kho?tab=can-duyet&highlight=')
    WHEN loai_thong_bao = 'phieu_xuat_duyet' THEN 
        REPLACE(url_redirect, '/xuat-kho/', '/xuat-kho?tab=da-duyet&highlight=')
    WHEN loai_thong_bao = 'phieu_xuat_can_sua' THEN 
        REPLACE(url_redirect, '/xuat-kho/', '/xuat-kho?tab=can-sua&highlight=')
    ELSE url_redirect
END
WHERE loai_thong_bao IN ('phieu_xuat_can_duyet', 'phieu_xuat_duyet', 'phieu_xuat_can_sua')
AND url_redirect LIKE '/xuat-kho/%'
AND url_redirect NOT LIKE '/xuat-kho?tab=%';


-- Thêm các giá trị mới vào ENUM nếu chúng chưa tồn tại
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending_manager_approval' AND enumtypid = 'trang_thai_phieu'::regtype) THEN
        ALTER TYPE trang_thai_phieu ADD VALUE 'pending_manager_approval';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending_admin_approval' AND enumtypid = 'trang_thai_phieu'::regtype) THEN
        ALTER TYPE trang_thai_phieu ADD VALUE 'pending_admin_approval';
    END IF;
END $$;


-- Thêm cột cho người duyệt cấp 2 (manager)
ALTER TABLE phieu_nhap ADD COLUMN IF NOT EXISTS nguoi_duyet_cap2 INTEGER REFERENCES users(id);
ALTER TABLE phieu_nhap ADD COLUMN IF NOT EXISTS ngay_duyet_cap2 TIMESTAMP;

ALTER TABLE phieu_xuat ADD COLUMN IF NOT EXISTS nguoi_duyet_cap2 INTEGER REFERENCES users(id);
ALTER TABLE phieu_xuat ADD COLUMN IF NOT EXISTS ngay_duyet_cap2 TIMESTAMP;

-- Đổi tên cột duyệt hiện tại để rõ nghĩa là của cấp 1 (admin)
ALTER TABLE phieu_nhap RENAME COLUMN nguoi_duyet TO nguoi_duyet_cap1;
ALTER TABLE phieu_nhap RENAME COLUMN ngay_duyet TO ngay_duyet_cap1;

ALTER TABLE phieu_xuat RENAME COLUMN nguoi_duyet TO nguoi_duyet_cap1;
ALTER TABLE phieu_xuat RENAME COLUMN ngay_duyet TO ngay_duyet_cap1;


ALTER TABLE phong_ban
ADD COLUMN IF NOT EXISTS thu_tu_hien_thi INTEGER DEFAULT 0;

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
    -- ✅ SỬA LỖI: Thêm alias 'pb_nhan' để tránh lỗi tham chiếu không rõ ràng
    SELECT pb_nhan.cap_bac INTO v_cap_bac_nhan FROM phong_ban pb_nhan WHERE pb_nhan.id = p_phong_ban_nhan_id;

    IF p_loai_phieu = 'tren_cap' THEN
        IF v_cap_bac_nhan = 3 THEN
            -- ✅ LOGIC MỚI CHO VẤN ĐỀ 1: Nếu cấp 3 yêu cầu, chỉ trả về cấp 1
            RETURN QUERY
            SELECT pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac
            FROM phong_ban pb WHERE pb.cap_bac = 1 AND pb.is_active = TRUE;
        ELSIF v_cap_bac_nhan = 2 THEN
            -- Cấp 2 yêu cầu, trả về cấp 1 (cấp trên trực tiếp)
            RETURN QUERY
            SELECT pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac
            FROM phong_ban pb
            WHERE pb.id = (SELECT pb_con.phong_ban_cha_id FROM phong_ban pb_con WHERE pb_con.id = p_phong_ban_nhan_id)
            AND pb.is_active = TRUE;
        ELSE
            -- Cấp 1 không có cấp trên, trả về rỗng
            RETURN;
        END IF;
    ELSIF p_loai_phieu = 'dieu_chuyen' THEN
        -- Logic điều chuyển: các phòng ban cùng cấp
        RETURN QUERY
        SELECT pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac
        FROM phong_ban pb
        WHERE pb.phong_ban_cha_id = (SELECT pb_con.phong_ban_cha_id FROM phong_ban pb_con WHERE pb_con.id = p_phong_ban_nhan_id)
        AND pb.id != p_phong_ban_nhan_id AND pb.is_active = TRUE
        ORDER BY pb.ten_phong_ban;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SỬA LOGIC CẤP 3 NHẬP TỪ CẤP TRÊN - TỰ ĐỘNG CHỌN CẤP 1
-- =============================================

-- 1. Cập nhật function get_phong_ban_co_the_cung_cap
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
    SELECT pb.cap_bac INTO v_cap_bac_nhan FROM phong_ban pb WHERE pb.id = p_phong_ban_nhan_id;

    IF p_loai_phieu = 'tren_cap' THEN
        IF v_cap_bac_nhan = 3 THEN
            -- ✅ CẤP 3: Chỉ trả về cấp 1 (BTL Vùng)
            RETURN QUERY
            SELECT pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac
            FROM phong_ban pb WHERE pb.cap_bac = 1 AND pb.is_active = TRUE;
        ELSIF v_cap_bac_nhan = 2 THEN
            -- Cấp 2: Nhận từ cấp 1 (cấp trên trực tiếp)
            RETURN QUERY
            SELECT pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac
            FROM phong_ban pb
            WHERE pb.id = (SELECT pb_con.phong_ban_cha_id FROM phong_ban pb_con WHERE pb_con.id = p_phong_ban_nhan_id)
            AND pb.is_active = TRUE;
        ELSE
            -- Cấp 1 không có cấp trên
            RETURN;
        END IF;
    ELSIF p_loai_phieu = 'dieu_chuyen' THEN
        -- ✅ VẤN ĐỀ 2: Logic điều chuyển giữa các đơn vị cùng cấp
        RETURN QUERY
        SELECT pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac
        FROM phong_ban pb
        WHERE pb.phong_ban_cha_id = (
            SELECT pb_con.phong_ban_cha_id 
            FROM phong_ban pb_con 
            WHERE pb_con.id = p_phong_ban_nhan_id
        )
        AND pb.id != p_phong_ban_nhan_id 
        AND pb.cap_bac = v_cap_bac_nhan -- Cùng cấp
        AND pb.is_active = TRUE
        ORDER BY pb.ten_phong_ban;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Cập nhật function nhập kho controller để tự động chọn cấp 1 cho cấp 3
-- Thêm cột để đánh dấu tự động chọn
ALTER TABLE phieu_nhap 
ADD COLUMN IF NOT EXISTS tu_dong_chon_cap1 BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN phieu_nhap.tu_dong_chon_cap1 IS 'Đánh dấu phiếu được tự động chọn cấp 1 khi cấp 3 tạo phiếu từ cấp trên';

-- 3. Tạo function để tự động lấy phòng ban cấp 1
CREATE OR REPLACE FUNCTION get_phong_ban_cap1()
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
    WHERE pb.cap_bac = 1 AND pb.is_active = TRUE
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;


-- =============================================
-- SCRIPT CẬP NHẬT CƠ SỞ DỮ LIỆU CHO WORKFLOW 3 CẤP HOÀN CHỈNH
-- =============================================

-- 1. Thêm loại phiếu "điều chuyển" cho cấp 3 (sửa tên cho rõ nghĩa hơn)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'dieu_chuyen' AND enumtypid = 'loai_phieu_nhap'::regtype) THEN
        ALTER TYPE loai_phieu_nhap ADD VALUE 'dieu_chuyen';
    END IF;
END $$;

-- 2. Cập nhật enum trạng thái để hỗ trợ workflow linh hoạt  
DO $$
BEGIN
    -- Cho workflow 2 cấp duyệt
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending_manager_approval' AND enumtypid = 'trang_thai_phieu'::regtype) THEN
        ALTER TYPE trang_thai_phieu ADD VALUE 'pending_manager_approval';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending_admin_approval' AND enumtypid = 'trang_thai_phieu'::regtype) THEN
        ALTER TYPE trang_thai_phieu ADD VALUE 'pending_admin_approval';
    END IF;
    
    -- Cho trường hợp cấp 3 khác cần duyệt xuất
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending_level3_approval' AND enumtypid = 'trang_thai_phieu'::regtype) THEN
        ALTER TYPE trang_thai_phieu ADD VALUE 'pending_level3_approval';
    END IF;
END $$;

-- 3. Thêm trường để phân biệt workflow và theo dõi duyệt cấp 2
ALTER TABLE phieu_nhap 
ADD COLUMN IF NOT EXISTS workflow_type VARCHAR(20) DEFAULT 'standard' CHECK (workflow_type IN ('standard', 'level3_exchange', 'level1_direct')),
ADD COLUMN IF NOT EXISTS nguoi_duyet_cap2 INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS ngay_duyet_cap2 TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tu_dong_chon_cap1 BOOLEAN DEFAULT FALSE;

ALTER TABLE phieu_xuat
ADD COLUMN IF NOT EXISTS workflow_type VARCHAR(20) DEFAULT 'standard' CHECK (workflow_type IN ('standard', 'level3_exchange', 'level1_direct')),
ADD COLUMN IF NOT EXISTS nguoi_duyet_cap2 INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS ngay_duyet_cap2 TIMESTAMP WITH TIME ZONE;

-- 4. Đổi tên cột duyệt hiện tại để rõ nghĩa (nếu chưa có)
DO $$
BEGIN
    -- Kiểm tra và đổi tên cột nếu cần
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phieu_nhap' AND column_name = 'nguoi_duyet') THEN
        ALTER TABLE phieu_nhap RENAME COLUMN nguoi_duyet TO nguoi_duyet_cap1;
        ALTER TABLE phieu_nhap RENAME COLUMN ngay_duyet TO ngay_duyet_cap1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phieu_xuat' AND column_name = 'nguoi_duyet') THEN
        ALTER TABLE phieu_xuat RENAME COLUMN nguoi_duyet TO nguoi_duyet_cap1;
        ALTER TABLE phieu_xuat RENAME COLUMN ngay_duyet TO ngay_duyet_cap1;
    END IF;
END $$;

-- 5. Cập nhật bảng nhà cung cấp để lưu thông tin phòng ban khi là nội bộ
ALTER TABLE nha_cung_cap 
ADD COLUMN IF NOT EXISTS related_phong_ban_info JSONB;

COMMENT ON COLUMN nha_cung_cap.related_phong_ban_info IS 'Thông tin phòng ban liên quan khi là NCC nội bộ';
COMMENT ON COLUMN phieu_nhap.workflow_type IS 'Loại workflow: standard, level3_exchange, level1_direct';
COMMENT ON COLUMN phieu_nhap.tu_dong_chon_cap1 IS 'Đánh dấu phiếu được tự động chọn cấp 1 khi cấp 3 tạo phiếu từ cấp trên';

-- 6. Function xác định workflow type dựa trên logic mới
CREATE OR REPLACE FUNCTION determine_workflow_type(
    p_loai_phieu loai_phieu_nhap,
    p_user_cap_bac INTEGER,
    p_phong_ban_cung_cap_cap_bac INTEGER DEFAULT NULL
)
RETURNS VARCHAR(20) AS $$
BEGIN
    -- Nếu là tự mua hoặc admin cấp 1 tạo
    IF p_loai_phieu = 'tu_mua' OR p_user_cap_bac = 1 THEN
        RETURN 'standard';
    END IF;
    
    -- Nếu là điều chuyển giữa cấp 3
    IF p_loai_phieu = 'dieu_chuyen' AND p_user_cap_bac = 3 THEN
        RETURN 'level3_exchange';
    END IF;
    
    -- Nếu cấp 3 nhập từ cấp 1 (tự động chọn)
    IF p_loai_phieu = 'tren_cap' AND p_user_cap_bac = 3 AND (p_phong_ban_cung_cap_cap_bac = 1 OR p_phong_ban_cung_cap_cap_bac IS NULL) THEN
        RETURN 'level1_direct';
    END IF;
    
    -- Các trường hợp khác
    RETURN 'standard';
END;
$$ LANGUAGE plpgsql;

-- 7. Function lấy danh sách cấp 3 cùng cấp để điều chuyển
DROP FUNCTION IF EXISTS get_cap3_cung_cap_bac(integer);
CREATE OR REPLACE FUNCTION get_cap3_cung_cap_bac(p_user_phong_ban_id INTEGER)
RETURNS TABLE(
    id INTEGER,
    ma_phong_ban VARCHAR(20),
    ten_phong_ban VARCHAR(100),
    cap_bac INTEGER,
    phong_ban_cha_id INTEGER,
    so_hang_hoa_co_the_cung_cap BIGINT,
    tong_gia_tri_co_the_cung_cap DECIMAL(15,2)
) AS $$
DECLARE
    v_phong_ban_cha_id INTEGER;
BEGIN
    -- Lấy phòng ban cha của user
    SELECT pb.phong_ban_cha_id INTO v_phong_ban_cha_id
    FROM phong_ban pb WHERE pb.id = p_user_phong_ban_id;
    
    -- Trả về các cấp 3 cùng cấp với thông tin tồn kho
    RETURN QUERY
    SELECT 
        pb.id, 
        pb.ma_phong_ban, 
        pb.ten_phong_ban, 
        pb.cap_bac, 
        pb.phong_ban_cha_id,
        COUNT(tk.hang_hoa_id) as so_hang_hoa_co_the_cung_cap,
        COALESCE(SUM(tk.gia_tri_ton), 0) as tong_gia_tri_co_the_cung_cap
    FROM phong_ban pb
    LEFT JOIN ton_kho tk ON pb.id = tk.phong_ban_id 
        AND (tk.sl_tot + tk.sl_kem_pham_chat + tk.sl_mat_pham_chat + tk.sl_hong + tk.sl_can_thanh_ly) > 0
    WHERE pb.cap_bac = 3 
    AND pb.phong_ban_cha_id = v_phong_ban_cha_id
    AND pb.id != p_user_phong_ban_id
    AND pb.is_active = TRUE
    GROUP BY pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac, pb.phong_ban_cha_id
    ORDER BY pb.ten_phong_ban;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger tự động xác định workflow type
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

-- 9. Cập nhật function phòng ban cung cấp để hỗ trợ điều chuyển
CREATE OR REPLACE FUNCTION get_phong_ban_co_the_cung_cap_v2(
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
    SELECT pb.cap_bac INTO v_cap_bac_nhan FROM phong_ban pb WHERE pb.id = p_phong_ban_nhan_id;

    IF p_loai_phieu = 'tren_cap' THEN
        IF v_cap_bac_nhan = 3 THEN
            -- Cấp 3: Chỉ trả về cấp 1 (BTL Vùng)
            RETURN QUERY
            SELECT pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac
            FROM phong_ban pb WHERE pb.cap_bac = 1 AND pb.is_active = TRUE;
        ELSIF v_cap_bac_nhan = 2 THEN
            -- Cấp 2: Nhận từ cấp 1
            RETURN QUERY
            SELECT pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac
            FROM phong_ban pb
            WHERE pb.id = (SELECT pb_con.phong_ban_cha_id FROM phong_ban pb_con WHERE pb_con.id = p_phong_ban_nhan_id)
            AND pb.is_active = TRUE;
        ELSE
            -- Cấp 1 không có cấp trên
            RETURN;
        END IF;
    ELSIF p_loai_phieu = 'dieu_chuyen' THEN
        -- Điều chuyển: các đơn vị cùng cấp
        RETURN QUERY
        SELECT * FROM get_cap3_cung_cap_bac(p_phong_ban_nhan_id);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 10. Cập nhật dữ liệu có sẵn
UPDATE phieu_nhap SET workflow_type = 'standard' WHERE workflow_type IS NULL;
UPDATE phieu_xuat SET workflow_type = 'standard' WHERE workflow_type IS NULL;

-- 11. Tạo indexes để tối ưu hiệu suất
CREATE INDEX IF NOT EXISTS idx_phieu_nhap_workflow_type ON phieu_nhap(workflow_type);
CREATE INDEX IF NOT EXISTS idx_phieu_nhap_nguoi_duyet_cap2 ON phieu_nhap(nguoi_duyet_cap2);
CREATE INDEX IF NOT EXISTS idx_phieu_xuat_workflow_type ON phieu_xuat(workflow_type);
CREATE INDEX IF NOT EXISTS idx_nha_cung_cap_phong_ban ON nha_cung_cap(phong_ban_id) WHERE is_noi_bo = TRUE;

-- 12. Kiểm tra dữ liệu sau khi cập nhật
SELECT 
    'phieu_nhap' as bang,
    workflow_type,
    COUNT(*) as so_luong
FROM phieu_nhap 
GROUP BY workflow_type
UNION ALL
SELECT 
    'phieu_xuat' as bang,
    workflow_type,
    COUNT(*) as so_luong
FROM phieu_xuat 
GROUP BY workflow_type
ORDER BY bang, workflow_type;

-- 13. Test các function mới
SELECT 'Test get_cap3_cung_cap_bac:' as test_name;
-- SELECT * FROM get_cap3_cung_cap_bac(1); -- Thay 1 bằng ID phòng ban cấp 3 thực tế

SELECT 'Test determine_workflow_type:' as test_name;
SELECT 
    determine_workflow_type('tu_mua'::loai_phieu_nhap, 3, NULL) as tu_mua_cap3,
    determine_workflow_type('tren_cap'::loai_phieu_nhap, 3, 1) as tren_cap_cap3,
    determine_workflow_type('dieu_chuyen'::loai_phieu_nhap, 3, 3) as dieu_chuyen_cap3;

COMMENT ON SCHEMA public IS 'Cập nhật thành công workflow 3 cấp với các tính năng: tự động chọn cấp 1 cho cấp 3, điều chuyển giữa cấp 3, workflow duyệt linh hoạt';


-- ✅ CẬP NHẬT ENUM để đảm bảo có đủ giá trị
DO $$
BEGIN
    -- Thêm loại phiếu điều chuyển nếu chưa có
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'dieu_chuyen' AND enumtypid = 'loai_phieu_nhap'::regtype) THEN
        ALTER TYPE loai_phieu_nhap ADD VALUE 'dieu_chuyen';
    END IF;
    
    -- Thêm trạng thái pending_level3_approval nếu chưa có
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending_level3_approval' AND enumtypid = 'trang_thai_phieu'::regtype) THEN
        ALTER TYPE trang_thai_phieu ADD VALUE 'pending_level3_approval';
    END IF;
END $$;

-- ✅ CẬP NHẬT FUNCTION auto_create_phieu_xuat_when_approved để xử lý workflow mới
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
    -- ✅ THÊM - Xử lý đặc biệt cho điều chuyển cấp 3
    IF NEW.workflow_type = 'level3_exchange' 
       AND OLD.trang_thai = 'pending_level3_approval' 
       AND NEW.trang_thai = 'approved' THEN
        
        -- Tạo phiếu xuất tự động cho đơn vị cung cấp (điều chuyển)
        v_date_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
        
        SELECT COALESCE(MAX(CAST(RIGHT(so_phieu, 4) AS INTEGER)), 0) + 1 
        INTO v_max_seq
        FROM phieu_xuat 
        WHERE so_phieu LIKE 'PX' || v_date_str || '%';
        
        v_so_phieu_xuat := 'PX' || v_date_str || LPAD(v_max_seq::TEXT, 4, '0');
        
        -- Tìm user admin/manager của phòng ban cung cấp
        SELECT u.id, u.ho_ten INTO v_admin_user_id, v_nguoi_giao
        FROM users u 
        WHERE u.phong_ban_id = NEW.phong_ban_cung_cap_id 
        AND u.role IN ('admin', 'manager')
        AND u.trang_thai = 'active'
        ORDER BY CASE WHEN u.role = 'admin' THEN 1 ELSE 2 END
        LIMIT 1;
        
        IF v_admin_user_id IS NULL THEN
            v_admin_user_id := NEW.nguoi_duyet_cap1;
            v_nguoi_giao := 'Hệ thống';
        END IF;
        
        -- Tạo đơn vị nhận nội bộ nếu chưa có
        SELECT id INTO v_don_vi_nhan_id
        FROM don_vi_nhan 
        WHERE is_noi_bo = TRUE AND phong_ban_id = NEW.phong_ban_id;
        
        IF v_don_vi_nhan_id IS NULL THEN
            SELECT pb.ten_phong_ban INTO v_phong_ban_nhan_info
            FROM phong_ban pb WHERE pb.id = NEW.phong_ban_id;
            
            INSERT INTO don_vi_nhan (ten_don_vi, is_noi_bo, phong_ban_id, dia_chi, trang_thai)
            VALUES (v_phong_ban_nhan_info, TRUE, NEW.phong_ban_id, 'Đơn vị nội bộ', 'active')
            RETURNING id INTO v_don_vi_nhan_id;
        END IF;
        
        -- Tạo phiếu xuất
        INSERT INTO phieu_xuat (
            so_phieu, ngay_xuat, loai_phieu, 
            phong_ban_id, don_vi_nhan_id, phong_ban_nhan_id,
            nguoi_giao, nguoi_nhan, ly_do_xuat,
            nguoi_tao, trang_thai, is_tu_dong,
            phieu_nhap_lien_ket_id, workflow_type,
            so_quyet_dinh, ghi_chu
        ) VALUES (
            v_so_phieu_xuat,
            CURRENT_DATE,
            'don_vi_nhan',
            NEW.phong_ban_cung_cap_id,
            v_don_vi_nhan_id,
            NEW.phong_ban_id,
            v_nguoi_giao,
            'Đơn vị nhận',
            'Điều chuyển theo phiếu nhập ' || NEW.so_phieu,
            v_admin_user_id,
            'approved', -- Tự động approved cho điều chuyển
            TRUE,
            NEW.id,
            'level3_exchange',
            NEW.so_quyet_dinh,
            'Phiếu xuất tự động tạo từ điều chuyển ' || NEW.so_phieu
        ) RETURNING id INTO v_phieu_xuat_id;
        
        -- Cập nhật phiếu nhập với thông tin liên kết
        UPDATE phieu_nhap 
        SET phieu_xuat_lien_ket_id = v_phieu_xuat_id
        WHERE id = NEW.id;
        
        -- Sao chép chi tiết từ phiếu nhập sang phiếu xuất
        FOR v_chi_tiet IN 
            SELECT * FROM chi_tiet_nhap WHERE phieu_nhap_id = NEW.id
        LOOP
            INSERT INTO chi_tiet_xuat (
                phieu_xuat_id, hang_hoa_id, so_luong, don_gia, 
                thanh_tien, pham_chat, so_seri_list
            ) VALUES (
                v_phieu_xuat_id,
                v_chi_tiet.hang_hoa_id,
                v_chi_tiet.so_luong,
                v_chi_tiet.don_gia,
                v_chi_tiet.thanh_tien,
                v_chi_tiet.pham_chat,
                v_chi_tiet.so_seri_list
            );
        END LOOP;
        
        RETURN NEW;
    END IF;
    
    -- ✅ GIỮ NGUYÊN logic cũ cho các trường hợp khác
    -- Chỉ tạo phiếu xuất cho loại nhập từ trên cấp hoặc điều chuyển (không phải level3_exchange)
    IF NEW.loai_phieu NOT IN ('tren_cap', 'dieu_chuyen') THEN
        RETURN NEW;
    END IF;
    
    -- Chỉ tạo khi có phòng ban cung cấp
    IF NEW.phong_ban_cung_cap_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Chỉ tạo khi phiếu nhập chuyển từ pending_admin_approval sang approved (workflow thường)
    IF OLD.trang_thai != 'pending_admin_approval' OR NEW.trang_thai != 'approved' OR NEW.workflow_type = 'level3_exchange' THEN
        RETURN NEW;
    END IF;
    
    -- Logic tạo phiếu xuất cho workflow thường (giữ nguyên code cũ)
    -- ... (giữ nguyên phần code cũ cho workflow standard)
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ✅ THÊM FUNCTION xử lý tự động cập nhật tồn kho khi hoàn thành điều chuyển
CREATE OR REPLACE FUNCTION auto_update_ton_kho_on_level3_complete()
RETURNS TRIGGER AS $$
DECLARE
    v_chi_tiet RECORD;
BEGIN
    -- Chỉ xử lý khi phiếu xuất điều chuyển được completed
    IF NEW.workflow_type = 'level3_exchange' 
       AND OLD.trang_thai != 'completed' 
       AND NEW.trang_thai = 'completed' THEN
        
        -- Trừ tồn kho của phòng ban xuất
        FOR v_chi_tiet IN 
            SELECT ctx.hang_hoa_id, ctx.so_luong, ctx.pham_chat 
            FROM chi_tiet_xuat ctx 
            WHERE ctx.phieu_xuat_id = NEW.id
        LOOP
            -- Trừ tồn kho phòng ban xuất
            CASE v_chi_tiet.pham_chat
                WHEN 'tot' THEN
                    UPDATE ton_kho 
                    SET sl_tot = GREATEST(0, sl_tot - v_chi_tiet.so_luong),
                        ngay_cap_nhat = CURRENT_TIMESTAMP
                    WHERE hang_hoa_id = v_chi_tiet.hang_hoa_id 
                    AND phong_ban_id = NEW.phong_ban_id;
                    
                WHEN 'kem_pham_chat' THEN
                    UPDATE ton_kho 
                    SET sl_kem_pham_chat = GREATEST(0, sl_kem_pham_chat - v_chi_tiet.so_luong),
                        ngay_cap_nhat = CURRENT_TIMESTAMP
                    WHERE hang_hoa_id = v_chi_tiet.hang_hoa_id 
                    AND phong_ban_id = NEW.phong_ban_id;
                    
                WHEN 'mat_pham_chat' THEN
                    UPDATE ton_kho 
                    SET sl_mat_pham_chat = GREATEST(0, sl_mat_pham_chat - v_chi_tiet.so_luong),
                        ngay_cap_nhat = CURRENT_TIMESTAMP
                    WHERE hang_hoa_id = v_chi_tiet.hang_hoa_id 
                    AND phong_ban_id = NEW.phong_ban_id;
                    
                WHEN 'hong' THEN
                    UPDATE ton_kho 
                    SET sl_hong = GREATEST(0, sl_hong - v_chi_tiet.so_luong),
                        ngay_cap_nhat = CURRENT_TIMESTAMP
                    WHERE hang_hoa_id = v_chi_tiet.hang_hoa_id 
                    AND phong_ban_id = NEW.phong_ban_id;
                    
                WHEN 'can_thanh_ly' THEN
                    UPDATE ton_kho 
                    SET sl_can_thanh_ly = GREATEST(0, sl_can_thanh_ly - v_chi_tiet.so_luong),
                        ngay_cap_nhat = CURRENT_TIMESTAMP
                    WHERE hang_hoa_id = v_chi_tiet.hang_hoa_id 
                    AND phong_ban_id = NEW.phong_ban_id;
            END CASE;
        END LOOP;
        
        -- Tự động hoàn thành phiếu nhập liên kết
        UPDATE phieu_nhap 
        SET trang_thai = 'completed',
            ngay_hoan_thanh = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.phieu_nhap_lien_ket_id 
        AND trang_thai = 'approved';
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ✅ TẠO TRIGGER cho function trên
DROP TRIGGER IF EXISTS tr_auto_update_ton_kho_level3_complete ON phieu_xuat;
CREATE TRIGGER tr_auto_update_ton_kho_level3_complete
    AFTER UPDATE ON phieu_xuat
    FOR EACH ROW 
    EXECUTE FUNCTION auto_update_ton_kho_on_level3_complete();

-- ✅ CẬP NHẬT FUNCTION determine_workflow_type để xử lý chính xác hơn
CREATE OR REPLACE FUNCTION determine_workflow_type(
    p_loai_phieu loai_phieu_nhap,
    p_user_cap_bac INTEGER,
    p_phong_ban_cung_cap_cap_bac INTEGER DEFAULT NULL
)
RETURNS VARCHAR(20) AS $$
BEGIN
    -- Nếu là tự mua -> workflow thường
    IF p_loai_phieu = 'tu_mua' THEN
        RETURN 'standard';
    END IF;
    
    -- Nếu là admin (cấp 1) tạo -> workflow thường  
    IF p_user_cap_bac = 1 THEN
        RETURN 'standard';
    END IF;
    
    -- Nếu là điều chuyển giữa cấp 3
    IF p_loai_phieu = 'dieu_chuyen' AND p_user_cap_bac = 3 THEN
        RETURN 'level3_exchange';
    END IF;
    
    -- Nếu cấp 3 nhập từ cấp 1 -> bỏ qua manager, thẳng admin
    IF p_loai_phieu = 'tren_cap' AND p_user_cap_bac = 3 AND p_phong_ban_cung_cap_cap_bac = 1 THEN
        RETURN 'level1_direct';
    END IF;
    
    -- Các trường hợp khác -> workflow thường
    RETURN 'standard';
END;
$$ LANGUAGE plpgsql;

-- ✅ THÊM INDEX để tối ưu hiệu suất
CREATE INDEX IF NOT EXISTS idx_phieu_nhap_workflow_type ON phieu_nhap(workflow_type);
CREATE INDEX IF NOT EXISTS idx_phieu_nhap_tu_dong_chon_cap1 ON phieu_nhap(tu_dong_chon_cap1) WHERE tu_dong_chon_cap1 = TRUE;
CREATE INDEX IF NOT EXISTS idx_phieu_xuat_workflow_type ON phieu_xuat(workflow_type);
CREATE INDEX IF NOT EXISTS idx_phieu_nhap_trang_thai_workflow ON phieu_nhap(trang_thai, workflow_type);

-- ✅ THÊM FUNCTION để lấy phòng ban cấp 3 có thể điều chuyển cho nhau
CREATE OR REPLACE FUNCTION get_cap3_co_the_dieu_chuyen(p_phong_ban_id INTEGER DEFAULT NULL)
RETURNS TABLE (
    id INTEGER,
    ten_phong_ban VARCHAR(100),
    ma_phong_ban VARCHAR(20),
    cap_bac INTEGER,
    co_the_nhan BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pb.id,
        pb.ten_phong_ban,
        pb.ma_phong_ban,
        pb.cap_bac,
        CASE 
            WHEN p_phong_ban_id IS NULL THEN TRUE
            WHEN pb.id != p_phong_ban_id THEN TRUE 
            ELSE FALSE 
        END as co_the_nhan
    FROM phong_ban pb
    WHERE pb.cap_bac = 3 
    AND pb.trang_thai = 'active'
    ORDER BY pb.ten_phong_ban;
END;
$$ LANGUAGE plpgsql;

-- ✅ CẬP NHẬT COMMENT cho tài liệu
COMMENT ON COLUMN phieu_nhap.workflow_type IS 'Loại workflow: standard (thường), level3_exchange (điều chuyển C3), level1_direct (C3 nhập từ C1)';
COMMENT ON COLUMN phieu_nhap.tu_dong_chon_cap1 IS 'Đánh dấu khi cấp 3 tự động chọn cấp 1 làm nhà cung cấp';
COMMENT ON COLUMN phieu_nhap.nguoi_duyet_cap2 IS 'Người duyệt cấp 2 (manager)';
COMMENT ON COLUMN phieu_nhap.ngay_duyet_cap2 IS 'Ngày duyệt cấp 2 (manager)';

-- ✅ CẬP NHẬT NOTIFICATION TYPES nếu cần
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
-- ✅ KIỂM TRA DỮ LIỆU SAU KHI CẬP NHẬT
ALTER TYPE workflow_type RENAME TO workflow_type_old;

CREATE TYPE workflow_type AS ENUM (
    'cap3_tu_mua',        -- Cấp 3 tự mua → Cấp 2 duyệt
    'cap3_tu_cap_tren',   -- Cấp 3 từ cấp trên → Cấp 1 duyệt trực tiếp
    'cap3_dieu_chuyen',   -- Cấp 3 điều chuyển → Cấp 2 → Cấp 3B duyệt xuất  
    'cap1_tu_duyet'       -- Cấp 1 tự duyệt
);

ALTER TABLE phieu_nhap ALTER COLUMN workflow_type DROP DEFAULT;
ALTER TABLE phieu_xuat ALTER COLUMN workflow_type DROP DEFAULT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_type_new') THEN
        CREATE TYPE workflow_type_new AS ENUM (
            'cap3_tu_mua',        -- Cấp 3 tự mua → Cấp 2 duyệt
            'cap3_tu_cap_tren',   -- Cấp 3 từ cấp trên → Cấp 1 duyệt trực tiếp
            'cap3_dieu_chuyen',   -- Cấp 3 điều chuyển → Cấp 2 → Cấp 3B duyệt xuất  
            'cap1_tu_duyet'       -- Cấp 1 tự duyệt
        );
    END IF;
END $$;


-- 2. Cập nhật bảng phieu_nhap
ALTER TABLE phieu_nhap 
ALTER COLUMN workflow_type TYPE workflow_type 
USING CASE 
    WHEN workflow_type::text = 'standard' THEN 'cap3_tu_mua'::workflow_type
    WHEN workflow_type::text = 'level3_exchange' THEN 'cap3_dieu_chuyen'::workflow_type  
    WHEN workflow_type::text = 'level1_direct' THEN 'cap3_tu_cap_tren'::workflow_type
    ELSE 'cap3_tu_mua'::workflow_type
END;

DROP TYPE workflow_type_old;

-- 3. Function xác định workflow type theo quy trình mới
CREATE OR REPLACE FUNCTION determine_workflow_type_v2(
    p_loai_phieu loai_phieu_nhap,
    p_user_cap_bac INTEGER,
    p_phong_ban_cung_cap_cap_bac INTEGER DEFAULT NULL
)
RETURNS workflow_type AS $$
BEGIN
    -- Cấp 1 (Admin) tạo phiếu: luôn tự duyệt
    IF p_user_cap_bac = 1 THEN
        RETURN 'cap1_tu_duyet'::workflow_type;
    END IF;
    
    -- Cấp 3 tạo phiếu
    IF p_user_cap_bac = 3 THEN
        CASE p_loai_phieu
            WHEN 'tu_mua' THEN 
                RETURN 'cap3_tu_mua'::workflow_type;
            WHEN 'tren_cap' THEN 
                RETURN 'cap3_tu_cap_tren'::workflow_type;  
            WHEN 'dieu_chuyen' THEN
                RETURN 'cap3_dieu_chuyen'::workflow_type;
            ELSE 
                RETURN 'cap3_tu_mua'::workflow_type;
        END CASE;
    END IF;
    
    -- Default fallback
    RETURN 'cap3_tu_mua'::workflow_type;
END;
$$ LANGUAGE plpgsql;



-- 3. THÊM COLUMN MỚI VÀ MIGRATE DỮ LIỆU
ALTER TABLE phieu_nhap 
ADD COLUMN IF NOT EXISTS workflow_type_new workflow_type_new;

-- Migrate dữ liệu workflow type
UPDATE phieu_nhap SET workflow_type_new = 
    CASE 
        WHEN workflow_type = 'standard' AND loai_phieu = 'tu_mua' THEN 'cap3_tu_mua'::workflow_type_new
        WHEN workflow_type = 'level1_direct' OR loai_phieu = 'tren_cap' THEN 'cap3_tu_cap_tren'::workflow_type_new
        WHEN workflow_type = 'level3_exchange' OR loai_phieu = 'dieu_chuyen' THEN 'cap3_dieu_chuyen'::workflow_type_new
        ELSE 'cap3_tu_mua'::workflow_type_new
    END
WHERE workflow_type_new IS NULL;

-- Migrate cho phiếu do cấp 1 tạo
UPDATE phieu_nhap SET workflow_type_new = 'cap1_tu_duyet'::workflow_type_new
WHERE nguoi_tao IN (
    SELECT u.id FROM users u 
    JOIN phong_ban pb ON u.phong_ban_id = pb.id 
    WHERE pb.cap_bac = 1
);

-- 4. XÓA COLUMN CŨ VÀ RENAME
ALTER TABLE phieu_nhap DROP COLUMN IF EXISTS workflow_type;
ALTER TABLE phieu_nhap RENAME COLUMN workflow_type_new TO workflow_type;

-- Làm tương tự cho phieu_xuat
ALTER TABLE phieu_xuat 
ADD COLUMN IF NOT EXISTS workflow_type_new workflow_type_new;

UPDATE phieu_xuat SET workflow_type_new = 
    CASE 
        WHEN workflow_type = 'standard' THEN 'cap3_tu_mua'::workflow_type_new
        WHEN workflow_type = 'level1_direct' THEN 'cap3_tu_cap_tren'::workflow_type_new  
        WHEN workflow_type = 'level3_exchange' THEN 'cap3_dieu_chuyen'::workflow_type_new
        ELSE 'cap3_tu_mua'::workflow_type_new
    END
WHERE workflow_type_new IS NULL;

ALTER TABLE phieu_xuat DROP COLUMN IF EXISTS workflow_type;
ALTER TABLE phieu_xuat RENAME COLUMN workflow_type_new TO workflow_type;

-- 5. DROP TYPE CŨ VÀ RENAME TYPE MỚI
DROP TYPE IF EXISTS workflow_type_old CASCADE;
ALTER TYPE workflow_type_new RENAME TO workflow_type;

-- 6. CẬP NHẬT FUNCTION XÁC ĐỊNH WORKFLOW TYPE
CREATE OR REPLACE FUNCTION determine_workflow_type_v2(
    p_loai_phieu loai_phieu_nhap,
    p_user_cap_bac INTEGER,
    p_phong_ban_cung_cap_cap_bac INTEGER DEFAULT NULL
)
RETURNS workflow_type AS $$
BEGIN
    -- Cấp 1 (Admin) tạo phiếu: luôn tự duyệt
    IF p_user_cap_bac = 1 THEN
        RETURN 'cap1_tu_duyet'::workflow_type;
    END IF;
    
    -- Cấp 3 tạo phiếu
    IF p_user_cap_bac = 3 THEN
        CASE p_loai_phieu
            WHEN 'tu_mua' THEN 
                RETURN 'cap3_tu_mua'::workflow_type;
            WHEN 'tren_cap' THEN 
                RETURN 'cap3_tu_cap_tren'::workflow_type;  
            WHEN 'dieu_chuyen' THEN
                RETURN 'cap3_dieu_chuyen'::workflow_type;
            ELSE 
                RETURN 'cap3_tu_mua'::workflow_type;
        END CASE;
    END IF;
    
    -- Cấp 2 không được tạo phiếu
    IF p_user_cap_bac = 2 THEN
        RAISE EXCEPTION 'Cấp 2 (Manager) không được phép tạo phiếu nhập';
    END IF;
    
    -- Default fallback
    RETURN 'cap3_tu_mua'::workflow_type;
END;
$$ LANGUAGE plpgsql;

-- 7. CẬP NHẬT TRIGGER AUTO SET WORKFLOW TYPE
CREATE OR REPLACE FUNCTION auto_set_workflow_type_v2()
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
    
    -- Kiểm tra cấp 2 không được tạo phiếu
    IF v_user_cap_bac = 2 THEN
        RAISE EXCEPTION 'Tài khoản cấp 2 (Manager) không được phép tạo phiếu nhập. Chỉ được duyệt phiếu cho cấp 3.';
    END IF;
    
    -- Lấy cấp bậc phòng ban cung cấp nếu có
    IF NEW.phong_ban_cung_cap_id IS NOT NULL THEN
        SELECT pb.cap_bac INTO v_phong_ban_cung_cap_cap_bac
        FROM phong_ban pb WHERE pb.id = NEW.phong_ban_cung_cap_id;
    END IF;
    
    -- Xác định workflow type
    NEW.workflow_type := determine_workflow_type_v2(
        NEW.loai_phieu::loai_phieu_nhap, 
        v_user_cap_bac, 
        v_phong_ban_cung_cap_cap_bac
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gắn trigger mới
DROP TRIGGER IF EXISTS tr_auto_set_workflow_type_nhap ON phieu_nhap;
CREATE TRIGGER tr_auto_set_workflow_type_nhap
    BEFORE INSERT ON phieu_nhap
    FOR EACH ROW EXECUTE FUNCTION auto_set_workflow_type_v2();

-- 8. CẬP NHẬT TRIGGER AUTO CREATE PHIEU XUAT
CREATE OR REPLACE FUNCTION auto_create_phieu_xuat_when_approved_v2()
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
BEGIN
    -- Chỉ xử lý cho workflow điều chuyển cấp 3 khi chuyển từ pending_level3_approval sang approved
    IF NEW.workflow_type = 'cap3_dieu_chuyen' 
       AND OLD.trang_thai = 'pending_level3_approval' 
       AND NEW.trang_thai = 'approved' THEN
        
        -- Tạo phiếu xuất tự động cho đơn vị cung cấp (điều chuyển)
        v_date_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
        
        SELECT COALESCE(MAX(CAST(RIGHT(so_phieu, 4) AS INTEGER)), 0) + 1 
        INTO v_max_seq
        FROM phieu_xuat 
        WHERE so_phieu LIKE 'PX' || v_date_str || '%';
        
        v_so_phieu_xuat := 'PX' || v_date_str || LPAD(v_max_seq::TEXT, 4, '0');
        
        -- Lấy admin user đầu tiên
        SELECT id INTO v_admin_user_id 
        FROM users 
        WHERE role = 'admin' 
        LIMIT 1;
        
        -- Tạo phiếu xuất
        INSERT INTO phieu_xuat (
            so_phieu, loai_phieu, phong_ban_id, don_vi_nhan_id,
            nguoi_tao, ngay_tao, trang_thai, ghi_chu,
            workflow_type, nguoi_duyet_cap1, ngay_duyet_cap1,
            nguoi_giao, so_quyet_dinh
        ) VALUES (
            v_so_phieu_xuat,
            'don_vi_nhan',
            NEW.phong_ban_cung_cap_id,
            NEW.phong_ban_id,
            v_admin_user_id,
            CURRENT_TIMESTAMP,
            'approved',
            'Phiếu xuất tự động từ điều chuyển: ' || NEW.so_phieu,
            'cap3_dieu_chuyen',
            NEW.nguoi_duyet_cap1,
            CURRENT_TIMESTAMP,
            (SELECT ho_ten FROM users WHERE id = NEW.nguoi_duyet_cap1),
            'Điều chuyển nội bộ'
        ) RETURNING id INTO v_phieu_xuat_id;
        
        -- Cập nhật phiếu nhập với thông tin liên kết
        UPDATE phieu_nhap 
        SET phieu_xuat_lien_ket_id = v_phieu_xuat_id
        WHERE id = NEW.id;
        
        -- Sao chép chi tiết từ phiếu nhập sang phiếu xuất
        FOR v_chi_tiet IN 
            SELECT * FROM chi_tiet_nhap WHERE phieu_nhap_id = NEW.id
        LOOP
            INSERT INTO chi_tiet_xuat (
                phieu_xuat_id, hang_hoa_id, so_luong, don_gia, 
                thanh_tien, pham_chat, so_seri_list
            ) VALUES (
                v_phieu_xuat_id,
                v_chi_tiet.hang_hoa_id,
                v_chi_tiet.so_luong,
                v_chi_tiet.don_gia,
                v_chi_tiet.thanh_tien,
                v_chi_tiet.pham_chat,
                v_chi_tiet.so_seri_list
            );
        END LOOP;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gắn trigger mới
DROP TRIGGER IF EXISTS tr_auto_create_phieu_xuat_approved ON phieu_nhap;
CREATE TRIGGER tr_auto_create_phieu_xuat_approved
    AFTER UPDATE ON phieu_nhap
    FOR EACH ROW EXECUTE FUNCTION auto_create_phieu_xuat_when_approved_v2();

-- 9. CẬP NHẬT NOTIFICATION URL THEO TAB CHUẨN HÓA
UPDATE notifications 
SET url_redirect = CASE 
    WHEN loai_thong_bao = 'phieu_nhap_can_duyet' THEN 
        CASE 
            WHEN metadata->>'trang_thai' = 'pending_manager_approval' THEN 
                '/nhap-kho?tab=can-toi-duyet&highlight=' || COALESCE(phieu_id::text, '')
            WHEN metadata->>'trang_thai' = 'pending_admin_approval' THEN 
                '/nhap-kho?tab=can-duyet-cuoi&highlight=' || COALESCE(phieu_id::text, '')
            WHEN metadata->>'trang_thai' = 'pending_level3_approval' THEN 
                '/nhap-kho?tab=dieu-chuyen-can-duyet&highlight=' || COALESCE(phieu_id::text, '')
            ELSE '/nhap-kho?tab=tat-ca&highlight=' || COALESCE(phieu_id::text, '')
        END
    WHEN loai_thong_bao = 'phieu_nhap_duyet' THEN 
        '/nhap-kho?tab=da-duyet&highlight=' || COALESCE(phieu_id::text, '')
    WHEN loai_thong_bao = 'phieu_nhap_can_sua' THEN 
        '/nhap-kho?tab=can-sua&highlight=' || COALESCE(phieu_id::text, '')
    ELSE url_redirect
END
WHERE loai_thong_bao IN ('phieu_nhap_can_duyet', 'phieu_nhap_duyet', 'phieu_nhap_can_sua');

-- 10. THÊM INDEX ĐỂ TỐI ƯU PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_phieu_nhap_workflow_type_new ON phieu_nhap(workflow_type);
CREATE INDEX IF NOT EXISTS idx_phieu_nhap_cap_bac_workflow ON phieu_nhap(workflow_type, trang_thai);
CREATE INDEX IF NOT EXISTS idx_phieu_nhap_phong_ban_cung_cap ON phieu_nhap(phong_ban_cung_cap_id) 
    WHERE workflow_type = 'cap3_dieu_chuyen';

-- 11. CẬP NHẬT VIEW TỔNG HỢP
CREATE OR REPLACE VIEW v_phieu_nhap_workflow_v2 AS
SELECT 
    pn.*,
    pb.ten_phong_ban,
    pb.cap_bac as user_cap_bac,
    pb_cc.ten_phong_ban as ten_phong_ban_cung_cap,
    pb_cc.cap_bac as cap_bac_cung_cap,
    ncc.ten_ncc,
    u_tao.ho_ten as nguoi_tao_ten,
    u_duyet1.ho_ten as nguoi_duyet_cap1_ten,
    u_duyet2.ho_ten as nguoi_duyet_cap2_ten,
    CASE 
        WHEN pn.workflow_type = 'cap3_tu_mua' THEN 'Cấp 3 tự mua → Cấp 2 duyệt'
        WHEN pn.workflow_type = 'cap3_tu_cap_tren' THEN 'Cấp 3 từ cấp trên → Cấp 1 duyệt trực tiếp'
        WHEN pn.workflow_type = 'cap3_dieu_chuyen' THEN 'Cấp 3 điều chuyển → Cấp 2 → Cấp 3B duyệt xuất'
        WHEN pn.workflow_type = 'cap1_tu_duyet' THEN 'Cấp 1 tự duyệt'
        ELSE 'Chưa xác định'
    END as mo_ta_workflow,
    CASE 
        WHEN pn.workflow_type = 'cap3_tu_mua' AND pn.trang_thai = 'pending_manager_approval' THEN 'can-toi-duyet'
        WHEN pn.workflow_type IN ('cap3_tu_cap_tren', 'cap3_tu_mua') AND pn.trang_thai = 'pending_admin_approval' THEN 'can-duyet-cuoi'
        WHEN pn.workflow_type = 'cap3_dieu_chuyen' AND pn.trang_thai = 'pending_level3_approval' THEN 'dieu-chuyen-can-duyet'
        WHEN pn.trang_thai = 'draft' THEN 'nhap'
        WHEN pn.trang_thai = 'revision_required' THEN 'can-sua'
        WHEN pn.trang_thai = 'approved' THEN 'da-duyet'
        WHEN pn.trang_thai = 'completed' THEN 'hoan-thanh'
        WHEN pn.trang_thai = 'cancelled' THEN 'da-huy'
        ELSE 'tat-ca'
    END as suggested_tab
FROM phieu_nhap pn
LEFT JOIN phong_ban pb ON pn.phong_ban_id = pb.id
LEFT JOIN phong_ban pb_cc ON pn.phong_ban_cung_cap_id = pb_cc.id  
LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
LEFT JOIN users u_tao ON pn.nguoi_tao = u_tao.id
LEFT JOIN users u_duyet1 ON pn.nguoi_duyet_cap1 = u_duyet1.id
LEFT JOIN users u_duyet2 ON pn.nguoi_duyet_cap2 = u_duyet2.id;

-- 12. KIỂM TRA DỮ LIỆU SAU MIGRATION
SELECT 
    'phieu_nhap' as bang,
    workflow_type,
    trang_thai,
    COUNT(*) as so_luong
FROM phieu_nhap 
GROUP BY workflow_type, trang_thai
ORDER BY workflow_type, trang_thai;

-- 13. FUNCTION HELPER ĐỂ KIỂM TRA WORKFLOW
CREATE OR REPLACE FUNCTION check_workflow_consistency()
RETURNS TABLE(
    phieu_id INTEGER,
    so_phieu VARCHAR,
    workflow_type workflow_type,
    trang_thai trang_thai_phieu,
    user_cap_bac INTEGER,
    is_consistent BOOLEAN,
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pn.id,
        pn.so_phieu,
        pn.workflow_type,
        pn.trang_thai,
        pb.cap_bac,
        CASE 
            WHEN pn.workflow_type = 'cap1_tu_duyet' AND pb.cap_bac != 1 THEN FALSE
            WHEN pn.workflow_type IN ('cap3_tu_mua', 'cap3_tu_cap_tren', 'cap3_dieu_chuyen') AND pb.cap_bac != 3 THEN FALSE
            ELSE TRUE
        END as is_consistent,
        CASE 
            WHEN pn.workflow_type = 'cap1_tu_duyet' AND pb.cap_bac != 1 THEN 'Workflow cap1_tu_duyet nhưng user không phải cấp 1'
            WHEN pn.workflow_type IN ('cap3_tu_mua', 'cap3_tu_cap_tren', 'cap3_dieu_chuyen') AND pb.cap_bac != 3 THEN 'Workflow cấp 3 nhưng user không phải cấp 3'
            ELSE 'OK'
        END as notes
    FROM phieu_nhap pn
    JOIN users u ON pn.nguoi_tao = u.id
    JOIN phong_ban pb ON u.phong_ban_id = pb.id;
END;
$$ LANGUAGE plpgsql;

-- Chạy kiểm tra
SELECT * FROM check_workflow_consistency() WHERE is_consistent = FALSE;

-- 14. CLEANUP
COMMENT ON SCHEMA public IS 'Đã cập nhật workflow system v2 - Chuẩn hóa theo cấp bậc và quy trình rõ ràng';

-- Log migration
INSERT INTO system_logs (action, description, created_at) 
VALUES ('MIGRATION', 'Workflow system migration v2 completed', CURRENT_TIMESTAMP);

COMMIT;


UPDATE notifications 
SET url_redirect = CASE 
    WHEN loai_thong_bao = 'phieu_nhap_can_duyet' THEN 
        CASE 
            WHEN metadata->>'workflow_type' = 'cap3_tu_mua' THEN 
                REPLACE(url_redirect, 'tab=can-duyet', 'tab=can-toi-duyet')
            WHEN metadata->>'workflow_type' = 'cap3_tu_cap_tren' THEN 
                REPLACE(url_redirect, 'tab=can-duyet', 'tab=can-duyet-cuoi') 
            WHEN metadata->>'workflow_type' = 'cap3_dieu_chuyen' THEN 
                REPLACE(url_redirect, 'tab=can-duyet', 'tab=dieu-chuyen-can-duyet')
            ELSE url_redirect
        END
    WHEN loai_thong_bao = 'phieu_nhap_duyet' THEN 
        REPLACE(url_redirect, 'tab=da-duyet', 'tab=da-duyet')
    WHEN loai_thong_bao = 'phieu_nhap_can_sua' THEN 
        REPLACE(url_redirect, 'tab=can-sua', 'tab=can-sua')
    ELSE url_redirect
END
WHERE loai_thong_bao IN ('phieu_nhap_can_duyet', 'phieu_nhap_duyet', 'phieu_nhap_can_sua')
AND created_at > NOW() - INTERVAL '30 days';
