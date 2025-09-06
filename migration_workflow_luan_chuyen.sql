-- Migration để cập nhật database cho workflow luân chuyển
-- Chạy file này để cập nhật database với các field mới

-- 1. Cập nhật bảng phieu_nhap
ALTER TABLE phieu_nhap 
ADD COLUMN IF NOT EXISTS phong_ban_cung_cap_id INTEGER REFERENCES phong_ban(id),
ADD COLUMN IF NOT EXISTS phieu_xuat_lien_ket_id INTEGER REFERENCES phieu_xuat(id),
ADD COLUMN IF NOT EXISTS is_tu_dong BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS workflow_type VARCHAR(20) DEFAULT 'standard' CHECK (workflow_type IN ('standard', 'dieu_chuyen')),
ADD COLUMN IF NOT EXISTS nguoi_duyet_cap1 INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS ngay_duyet_cap1 TIMESTAMP,
ADD COLUMN IF NOT EXISTS nguoi_phan_hoi INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS ngay_phan_hoi TIMESTAMP,
ADD COLUMN IF NOT EXISTS ghi_chu_phan_hoi TEXT,
ADD COLUMN IF NOT EXISTS ngay_gui_duyet TIMESTAMP;

-- Cập nhật enum trang_thai cho phieu_nhap
ALTER TABLE phieu_nhap 
DROP CONSTRAINT IF EXISTS phieu_nhap_trang_thai_check;

ALTER TABLE phieu_nhap 
ADD CONSTRAINT phieu_nhap_trang_thai_check 
CHECK (trang_thai IN ('draft', 'confirmed', 'pending_level3_approval', 'approved', 'completed', 'cancelled', 'revision_required'));

-- 2. Cập nhật bảng phieu_xuat
ALTER TABLE phieu_xuat 
ADD COLUMN IF NOT EXISTS phong_ban_nhan_id INTEGER REFERENCES phong_ban(id),
ADD COLUMN IF NOT EXISTS phieu_nhap_lien_ket_id INTEGER REFERENCES phieu_nhap(id),
ADD COLUMN IF NOT EXISTS is_tu_dong BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS workflow_type VARCHAR(20) DEFAULT 'standard' CHECK (workflow_type IN ('standard', 'dieu_chuyen')),
ADD COLUMN IF NOT EXISTS nguoi_duyet_cap1 INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS ngay_duyet_cap1 TIMESTAMP,
ADD COLUMN IF NOT EXISTS nguoi_phan_hoi INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS ngay_phan_hoi TIMESTAMP,
ADD COLUMN IF NOT EXISTS ghi_chu_phan_hoi TEXT,
ADD COLUMN IF NOT EXISTS ngay_gui_duyet TIMESTAMP;

-- Cập nhật enum trang_thai cho phieu_xuat
ALTER TABLE phieu_xuat 
DROP CONSTRAINT IF EXISTS phieu_xuat_trang_thai_check;

ALTER TABLE phieu_xuat 
ADD CONSTRAINT phieu_xuat_trang_thai_check 
CHECK (trang_thai IN ('draft', 'confirmed', 'pending_level3_approval', 'approved', 'completed', 'cancelled', 'revision_required'));

-- 3. Tạo index để tối ưu performance
CREATE INDEX IF NOT EXISTS idx_phieu_nhap_workflow_type ON phieu_nhap(workflow_type);
CREATE INDEX IF NOT EXISTS idx_phieu_nhap_phieu_xuat_lien_ket ON phieu_nhap(phieu_xuat_lien_ket_id);
CREATE INDEX IF NOT EXISTS idx_phieu_nhap_phong_ban_cung_cap ON phieu_nhap(phong_ban_cung_cap_id);

CREATE INDEX IF NOT EXISTS idx_phieu_xuat_workflow_type ON phieu_xuat(workflow_type);
CREATE INDEX IF NOT EXISTS idx_phieu_xuat_phieu_nhap_lien_ket ON phieu_xuat(phieu_nhap_lien_ket_id);
CREATE INDEX IF NOT EXISTS idx_phieu_xuat_phong_ban_nhan ON phieu_xuat(phong_ban_nhan_id);

-- 4. Cập nhật bảng notifications nếu cần
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    nguoi_nhan INTEGER NOT NULL REFERENCES users(id),
    loai_thong_bao VARCHAR(50) NOT NULL,
    tieu_de VARCHAR(255) NOT NULL,
    noi_dung TEXT,
    phieu_id INTEGER,
    url_redirect VARCHAR(255),
    trang_thai VARCHAR(20) DEFAULT 'unread' CHECK (trang_thai IN ('unread', 'read')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tạo trigger để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger cho phieu_nhap
DROP TRIGGER IF EXISTS update_phieu_nhap_updated_at ON phieu_nhap;
CREATE TRIGGER update_phieu_nhap_updated_at 
    BEFORE UPDATE ON phieu_nhap 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger cho phieu_xuat
DROP TRIGGER IF EXISTS update_phieu_xuat_updated_at ON phieu_xuat;
CREATE TRIGGER update_phieu_xuat_updated_at 
    BEFORE UPDATE ON phieu_xuat 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger cho notifications
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Tạo view để dễ dàng query workflow luân chuyển
CREATE OR REPLACE VIEW v_workflow_dieu_chuyen AS
SELECT 
    pn.id as phieu_nhap_id,
    pn.so_phieu as so_phieu_nhap,
    pn.trang_thai as trang_thai_nhap,
    pn.phong_ban_id as phong_ban_nhan_id,
    pb_nhan.ten_phong_ban as phong_ban_nhan_ten,
    pn.phong_ban_cung_cap_id,
    pb_cung_cap.ten_phong_ban as phong_ban_cung_cap_ten,
    px.id as phieu_xuat_id,
    px.so_phieu as so_phieu_xuat,
    px.trang_thai as trang_thai_xuat,
    pn.created_at as ngay_tao_nhap,
    px.created_at as ngay_tao_xuat,
    pn.nguoi_tao as nguoi_tao_nhap,
    px.nguoi_tao as nguoi_tao_xuat
FROM phieu_nhap pn
LEFT JOIN phieu_xuat px ON pn.phieu_xuat_lien_ket_id = px.id
LEFT JOIN phong_ban pb_nhan ON pn.phong_ban_id = pb_nhan.id
LEFT JOIN phong_ban pb_cung_cap ON pn.phong_ban_cung_cap_id = pb_cung_cap.id
WHERE pn.workflow_type = 'dieu_chuyen';

-- 7. Tạo function để đồng bộ trạng thái 2 phiếu
CREATE OR REPLACE FUNCTION sync_dieu_chuyen_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Nếu là phiếu nhập được cập nhật
    IF TG_TABLE_NAME = 'phieu_nhap' AND NEW.workflow_type = 'dieu_chuyen' THEN
        -- Cập nhật phiếu xuất liên kết
        IF NEW.phieu_xuat_lien_ket_id IS NOT NULL THEN
            UPDATE phieu_xuat 
            SET trang_thai = NEW.trang_thai,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.phieu_xuat_lien_ket_id;
        END IF;
    END IF;
    
    -- Nếu là phiếu xuất được cập nhật
    IF TG_TABLE_NAME = 'phieu_xuat' AND NEW.workflow_type = 'dieu_chuyen' THEN
        -- Cập nhật phiếu nhập liên kết
        IF NEW.phieu_nhap_lien_ket_id IS NOT NULL THEN
            UPDATE phieu_nhap 
            SET trang_thai = NEW.trang_thai,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.phieu_nhap_lien_ket_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger để đồng bộ trạng thái
DROP TRIGGER IF EXISTS sync_phieu_nhap_status ON phieu_nhap;
CREATE TRIGGER sync_phieu_nhap_status 
    AFTER UPDATE ON phieu_nhap 
    FOR EACH ROW 
    EXECUTE FUNCTION sync_dieu_chuyen_status();

DROP TRIGGER IF EXISTS sync_phieu_xuat_status ON phieu_xuat;
CREATE TRIGGER sync_phieu_xuat_status 
    AFTER UPDATE ON phieu_xuat 
    FOR EACH ROW 
    EXECUTE FUNCTION sync_dieu_chuyen_status();

-- 8. Tạo comment cho các field mới
COMMENT ON COLUMN phieu_nhap.phong_ban_cung_cap_id IS 'Phòng ban cung cấp hàng (cho điều chuyển)';
COMMENT ON COLUMN phieu_nhap.phieu_xuat_lien_ket_id IS 'Phiếu xuất liên kết (cho điều chuyển)';
COMMENT ON COLUMN phieu_nhap.is_tu_dong IS 'Phiếu được tạo tự động từ phiếu khác';
COMMENT ON COLUMN phieu_nhap.workflow_type IS 'Loại workflow: standard hoặc dieu_chuyen';
COMMENT ON COLUMN phieu_nhap.nguoi_duyet_cap1 IS 'Người duyệt cấp 1 (Admin/Manager)';
COMMENT ON COLUMN phieu_nhap.ngay_duyet_cap1 IS 'Ngày duyệt cấp 1';
COMMENT ON COLUMN phieu_nhap.nguoi_phan_hoi IS 'Người yêu cầu sửa';
COMMENT ON COLUMN phieu_nhap.ngay_phan_hoi IS 'Ngày yêu cầu sửa';
COMMENT ON COLUMN phieu_nhap.ghi_chu_phan_hoi IS 'Ghi chú yêu cầu sửa';
COMMENT ON COLUMN phieu_nhap.ngay_gui_duyet IS 'Ngày gửi duyệt';

COMMENT ON COLUMN phieu_xuat.phong_ban_nhan_id IS 'Phòng ban nhận hàng (cho điều chuyển)';
COMMENT ON COLUMN phieu_xuat.phieu_nhap_lien_ket_id IS 'Phiếu nhập liên kết (cho điều chuyển)';
COMMENT ON COLUMN phieu_xuat.is_tu_dong IS 'Phiếu được tạo tự động từ phiếu khác';
COMMENT ON COLUMN phieu_xuat.workflow_type IS 'Loại workflow: standard hoặc dieu_chuyen';
COMMENT ON COLUMN phieu_xuat.nguoi_duyet_cap1 IS 'Người duyệt cấp 1 (Admin/Manager)';
COMMENT ON COLUMN phieu_xuat.ngay_duyet_cap1 IS 'Ngày duyệt cấp 1';
COMMENT ON COLUMN phieu_xuat.nguoi_phan_hoi IS 'Người yêu cầu sửa';
COMMENT ON COLUMN phieu_xuat.ngay_phan_hoi IS 'Ngày yêu cầu sửa';
COMMENT ON COLUMN phieu_xuat.ghi_chu_phan_hoi IS 'Ghi chú yêu cầu sửa';
COMMENT ON COLUMN phieu_xuat.ngay_gui_duyet IS 'Ngày gửi duyệt';

-- 9. Tạo function để kiểm tra tính hợp lệ của workflow
CREATE OR REPLACE FUNCTION validate_dieu_chuyen_workflow()
RETURNS TRIGGER AS $$
BEGIN
    -- Kiểm tra phiếu nhập điều chuyển
    IF TG_TABLE_NAME = 'phieu_nhap' AND NEW.workflow_type = 'dieu_chuyen' THEN
        IF NEW.phong_ban_cung_cap_id IS NULL THEN
            RAISE EXCEPTION 'Phiếu nhập điều chuyển phải có phòng ban cung cấp';
        END IF;
        IF NEW.phong_ban_id = NEW.phong_ban_cung_cap_id THEN
            RAISE EXCEPTION 'Phòng ban nhận và cung cấp không được giống nhau';
        END IF;
    END IF;
    
    -- Kiểm tra phiếu xuất điều chuyển
    IF TG_TABLE_NAME = 'phieu_xuat' AND NEW.workflow_type = 'dieu_chuyen' THEN
        IF NEW.phong_ban_nhan_id IS NULL THEN
            RAISE EXCEPTION 'Phiếu xuất điều chuyển phải có phòng ban nhận';
        END IF;
        IF NEW.phong_ban_id = NEW.phong_ban_nhan_id THEN
            RAISE EXCEPTION 'Phòng ban xuất và nhận không được giống nhau';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger để validate workflow
DROP TRIGGER IF EXISTS validate_phieu_nhap_workflow ON phieu_nhap;
CREATE TRIGGER validate_phieu_nhap_workflow 
    BEFORE INSERT OR UPDATE ON phieu_nhap 
    FOR EACH ROW 
    EXECUTE FUNCTION validate_dieu_chuyen_workflow();

DROP TRIGGER IF EXISTS validate_phieu_xuat_workflow ON phieu_xuat;
CREATE TRIGGER validate_phieu_xuat_workflow 
    BEFORE INSERT OR UPDATE ON phieu_xuat 
    FOR EACH ROW 
    EXECUTE FUNCTION validate_dieu_chuyen_workflow();

-- 10. Tạo function để lấy thống kê workflow
CREATE OR REPLACE FUNCTION get_workflow_stats()
RETURNS TABLE (
    workflow_type VARCHAR,
    total_count BIGINT,
    draft_count BIGINT,
    confirmed_count BIGINT,
    pending_level3_approval_count BIGINT,
    approved_count BIGINT,
    completed_count BIGINT,
    cancelled_count BIGINT,
    revision_required_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'phieu_nhap'::VARCHAR as workflow_type,
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE trang_thai = 'draft') as draft_count,
        COUNT(*) FILTER (WHERE trang_thai = 'confirmed') as confirmed_count,
        COUNT(*) FILTER (WHERE trang_thai = 'pending_level3_approval') as pending_level3_approval_count,
        COUNT(*) FILTER (WHERE trang_thai = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE trang_thai = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE trang_thai = 'cancelled') as cancelled_count,
        COUNT(*) FILTER (WHERE trang_thai = 'revision_required') as revision_required_count
    FROM phieu_nhap
    WHERE workflow_type = 'dieu_chuyen'
    
    UNION ALL
    
    SELECT 
        'phieu_xuat'::VARCHAR as workflow_type,
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE trang_thai = 'draft') as draft_count,
        COUNT(*) FILTER (WHERE trang_thai = 'confirmed') as confirmed_count,
        COUNT(*) FILTER (WHERE trang_thai = 'pending_level3_approval') as pending_level3_approval_count,
        COUNT(*) FILTER (WHERE trang_thai = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE trang_thai = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE trang_thai = 'cancelled') as cancelled_count,
        COUNT(*) FILTER (WHERE trang_thai = 'revision_required') as revision_required_count
    FROM phieu_xuat
    WHERE workflow_type = 'dieu_chuyen';
END;
$$ language 'plpgsql';

-- Kết thúc migration
SELECT 'Migration workflow luân chuyển hoàn thành!' as message;
