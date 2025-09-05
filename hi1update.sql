-- =============================================
-- WAREHOUSE MANAGEMENT DATABASE SCHEMA - CONSOLIDATED
-- =============================================

\c warehouse_management;

-- =============================================
-- ENUM TYPES
-- =============================================
CREATE TYPE user_role AS ENUM ('admin', 'user', 'manager');
CREATE TYPE trang_thai AS ENUM ('active', 'inactive');
CREATE TYPE loai_phieu_nhap AS ENUM ('tu_mua', 'tren_cap', 'dieu_chuyen');
CREATE TYPE trang_thai_phieu AS ENUM ('draft', 'confirmed', 'cancelled', 'approved', 'completed', 'revision_required');
CREATE TYPE loai_xuat AS ENUM ('don_vi_nhan', 'don_vi_su_dung');
CREATE TYPE loai_don_vi AS ENUM ('doi_xe', 'phong_ban', 'khac', 'noi_bo');
CREATE TYPE nguon_gia AS ENUM ('nhap_kho', 'kiem_ke', 'dieu_chinh');
CREATE TYPE pham_chat AS ENUM ('tot', 'kem_pham_chat', 'mat_pham_chat', 'hong', 'can_thanh_ly');
CREATE TYPE trang_thai_yeu_cau AS ENUM ('draft', 'confirmed', 'under_review', 'approved', 'rejected', 'cancelled', 'completed');
CREATE TYPE loai_yeu_cau AS ENUM ('nhap_kho', 'xuat_kho');
CREATE TYPE muc_do_uu_tien AS ENUM ('thap', 'binh_thuong', 'cao', 'khan_cap');
CREATE TYPE loai_thong_bao AS ENUM ('yeu_cau_moi', 'phe_duyet', 'tu_choi', 'hoan_thanh', 'system', 'phieu_nhap_can_duyet', 'phieu_nhap_duyet', 'phieu_nhap_can_sua');
CREATE TYPE trang_thai_thong_bao AS ENUM ('unread', 'read', 'archived');

-- =============================================
-- CORE TABLES
-- =============================================

-- Bảng phòng ban
CREATE TABLE phong_ban (
    id SERIAL PRIMARY KEY,
    ma_phong_ban VARCHAR(20) NOT NULL UNIQUE,
    ten_phong_ban VARCHAR(100) NOT NULL,
    mo_ta TEXT,
    cap_bac INTEGER DEFAULT 2 CHECK (cap_bac IN (1, 2, 3)),
    phong_ban_cha_id INTEGER REFERENCES phong_ban(id),
    thu_tu_hien_thi INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    trang_thai trang_thai DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng người dùng
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    ho_ten VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    phong_ban_id INTEGER REFERENCES phong_ban(id),
    role user_role DEFAULT 'user',
    trang_thai trang_thai DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng loại hàng hóa
CREATE TABLE loai_hang_hoa (
    id SERIAL PRIMARY KEY,
    ma_loai VARCHAR(20) NOT NULL UNIQUE,
    ten_loai VARCHAR(100) NOT NULL,
    mo_ta TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng hàng hóa
CREATE TABLE hang_hoa (
    id SERIAL PRIMARY KEY,
    ma_hang_hoa VARCHAR(50) NOT NULL UNIQUE,
    ten_hang_hoa VARCHAR(200) NOT NULL,
    loai_hang_hoa_id INTEGER REFERENCES loai_hang_hoa(id),
    don_vi_tinh VARCHAR(20) NOT NULL,
    mo_ta_ky_thuat TEXT,
    co_so_seri BOOLEAN DEFAULT TRUE,
    theo_doi_pham_chat BOOLEAN DEFAULT TRUE,
    la_tai_san_co_dinh BOOLEAN DEFAULT FALSE,
    gia_nhap_gan_nhat DECIMAL(15,2) DEFAULT 0,
    phong_ban_id INTEGER REFERENCES phong_ban(id),
    trang_thai trang_thai DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng số seri hàng hóa
CREATE TABLE hang_hoa_seri (
    id SERIAL PRIMARY KEY,
    hang_hoa_id INTEGER NOT NULL REFERENCES hang_hoa(id),
    so_seri VARCHAR(100) NOT NULL,
    don_gia DECIMAL(15,2) NOT NULL,
    ngay_nhap DATE NOT NULL,
    phieu_nhap_id INTEGER,
    trang_thai VARCHAR(20) DEFAULT 'ton_kho',
    pham_chat pham_chat DEFAULT 'tot',
    vi_tri_kho VARCHAR(100),
    han_su_dung DATE,
    ghi_chu TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hang_hoa_id, so_seri)
);

-- Bảng nhà cung cấp
CREATE TABLE nha_cung_cap (
    id SERIAL PRIMARY KEY,
    ma_ncc VARCHAR(50) NOT NULL UNIQUE,
    ten_ncc VARCHAR(200) NOT NULL,
    dia_chi TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    nguoi_lien_he VARCHAR(100),
    phong_ban_id INTEGER REFERENCES phong_ban(id),
    is_noi_bo BOOLEAN DEFAULT FALSE,
    trang_thai VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng đơn vị vận chuyển
CREATE TABLE don_vi_van_chuyen (
    id SERIAL PRIMARY KEY,
    ma_dvvc VARCHAR(20) NOT NULL UNIQUE,
    ten_dvvc VARCHAR(200) NOT NULL,
    dia_chi TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng đơn vị nhận hàng
CREATE TABLE don_vi_nhan (
    id SERIAL PRIMARY KEY,
    ma_don_vi VARCHAR(50) NOT NULL UNIQUE,
    ten_don_vi VARCHAR(200) NOT NULL,
    loai_don_vi loai_don_vi DEFAULT 'phong_ban',
    dia_chi TEXT,
    nguoi_lien_he VARCHAR(100),
    so_dien_thoai VARCHAR(20),
    email VARCHAR(100),
    chuc_vu_nguoi_lien_he VARCHAR(100),
    phong_ban_id INTEGER REFERENCES phong_ban(id),
    is_noi_bo BOOLEAN DEFAULT FALSE,
    ghi_chu TEXT,
    trang_thai VARCHAR(20) DEFAULT 'active' CHECK (trang_thai IN ('active', 'inactive', 'deleted')),
    nguoi_tao INTEGER REFERENCES users(id),
    nguoi_cap_nhat INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- PHIẾU NHẬP/XUẤT
-- =============================================

-- Bảng phiếu nhập kho
CREATE TABLE phieu_nhap (
    id SERIAL PRIMARY KEY,
    so_phieu VARCHAR(50) NOT NULL UNIQUE,
    ngay_nhap DATE NOT NULL,
    nha_cung_cap_id INTEGER REFERENCES nha_cung_cap(id),
    don_vi_van_chuyen_id INTEGER REFERENCES don_vi_van_chuyen(id),
    ly_do_nhap TEXT,
    loai_phieu loai_phieu_nhap DEFAULT 'tu_mua',
    so_hoa_don VARCHAR(50),
    tong_tien DECIMAL(15,2) DEFAULT 0,
    trang_thai trang_thai_phieu DEFAULT 'draft',
    nguoi_tao INTEGER NOT NULL REFERENCES users(id),
    nguoi_duyet INTEGER REFERENCES users(id),
    ngay_duyet TIMESTAMP,
    phong_ban_id INTEGER REFERENCES phong_ban(id),
    ghi_chu TEXT,
    nguoi_nhap_hang VARCHAR(200),
    nguoi_giao_hang VARCHAR(100),
    so_quyet_dinh VARCHAR(100),
    dia_chi_nhap TEXT,
    phuong_thuc_van_chuyen VARCHAR(255) DEFAULT 'Đơn vị tự vận chuyển',
    decision_pdf_url TEXT,
    decision_pdf_filename VARCHAR(255),
    ghi_chu_hoan_thanh TEXT,
    ghi_chu_phan_hoi TEXT,
    ngay_hoan_thanh TIMESTAMP,
    ngay_gui_duyet TIMESTAMP WITH TIME ZONE,
    yeu_cau_nhap_id INTEGER REFERENCES yeu_cau_nhap_kho(id),
    phong_ban_cung_cap_id INTEGER REFERENCES phong_ban(id),
    phieu_xuat_lien_ket_id INTEGER REFERENCES phieu_xuat(id),
    is_tu_dong BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng chi tiết nhập kho
CREATE TABLE chi_tiet_nhap (
    id SERIAL PRIMARY KEY,
    phieu_nhap_id INTEGER NOT NULL REFERENCES phieu_nhap(id) ON DELETE CASCADE,
    hang_hoa_id INTEGER NOT NULL REFERENCES hang_hoa(id),
    so_luong_ke_hoach DECIMAL(10,2) NOT NULL DEFAULT 0,
    so_luong DECIMAL(10,2) NOT NULL,
    don_gia DECIMAL(15,2) NOT NULL,
    thanh_tien DECIMAL(15,2) NOT NULL,
    so_seri_list TEXT[],
    pham_chat pham_chat DEFAULT 'tot',
    han_su_dung DATE,
    vi_tri_kho VARCHAR(100),
    ghi_chu TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng phiếu xuất kho
CREATE TABLE phieu_xuat (
    id SERIAL PRIMARY KEY,
    so_phieu VARCHAR(50) NOT NULL UNIQUE,
    ngay_xuat DATE NOT NULL,
    don_vi_nhan_id INTEGER REFERENCES don_vi_nhan(id),
    nguoi_nhan VARCHAR(100),
    nguoi_giao_hang VARCHAR(100),
    ly_do_xuat TEXT,
    loai_xuat loai_xuat DEFAULT 'don_vi_nhan',
    so_quyet_dinh VARCHAR(100) DEFAULT '',
    tong_tien DECIMAL(15,2) DEFAULT 0,
    trang_thai trang_thai_phieu DEFAULT 'draft',
    nguoi_tao INTEGER NOT NULL REFERENCES users(id),
    nguoi_duyet INTEGER REFERENCES users(id),
    ngay_duyet TIMESTAMP,
    phong_ban_id INTEGER REFERENCES phong_ban(id),
    phong_ban_nhan_id INTEGER REFERENCES phong_ban(id),
    ghi_chu TEXT,
    decision_pdf_url TEXT,
    decision_pdf_filename VARCHAR(255),
    ghi_chu_xac_nhan TEXT,
    ghi_chu_phan_hoi TEXT,
    ngay_xac_nhan TIMESTAMP,
    yeu_cau_xuat_id INTEGER REFERENCES yeu_cau_xuat_kho(id),
    phieu_nhap_lien_ket_id INTEGER REFERENCES phieu_nhap(id),
    is_tu_dong BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng chi tiết xuất kho
CREATE TABLE chi_tiet_xuat (
    id SERIAL PRIMARY KEY,
    phieu_xuat_id INTEGER NOT NULL REFERENCES phieu_xuat(id) ON DELETE CASCADE,
    hang_hoa_id INTEGER NOT NULL REFERENCES hang_hoa(id),
    so_luong_yeu_cau DECIMAL(10,2) NOT NULL,
    so_luong_thuc_xuat DECIMAL(10,2) NOT NULL,
    don_gia DECIMAL(15,2) NOT NULL,
    thanh_tien DECIMAL(15,2) NOT NULL,
    so_seri_xuat TEXT[],
    pham_chat pham_chat DEFAULT 'tot',
    phieu_nhap_id INTEGER REFERENCES phieu_nhap(id),
    loai_phieu_nhap loai_phieu_nhap,
    ghi_chu TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- KIỂM KÊ
-- =============================================

-- Bảng phiếu kiểm kê
CREATE TABLE phieu_kiem_ke (
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
CREATE TABLE chi_tiet_kiem_ke (
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

-- =============================================
-- TỒN KHO VÀ LỊCH SỬ
-- =============================================

-- Bảng tồn kho theo phẩm chất
CREATE TABLE ton_kho (
    id SERIAL PRIMARY KEY,
    hang_hoa_id INTEGER NOT NULL REFERENCES hang_hoa(id),
    phong_ban_id INTEGER NOT NULL REFERENCES phong_ban(id),
    sl_tot DECIMAL(10,2) DEFAULT 0,
    sl_kem_pham_chat DECIMAL(10,2) DEFAULT 0,
    sl_mat_pham_chat DECIMAL(10,2) DEFAULT 0,
    sl_hong DECIMAL(10,2) DEFAULT 0,
    sl_can_thanh_ly DECIMAL(10,2) DEFAULT 0,
    so_luong_ton DECIMAL(10,2) GENERATED ALWAYS AS (sl_tot + sl_kem_pham_chat + sl_mat_pham_chat + sl_hong + sl_can_thanh_ly) STORED,
    gia_tri_ton DECIMAL(15,2) DEFAULT 0,
    don_gia_binh_quan DECIMAL(15,2) DEFAULT 0,
    so_luong_dang_su_dung DECIMAL(10,2) DEFAULT 0,
    so_luong_kho_bo DECIMAL(10,2) DEFAULT 0,
    so_luong_kho_don_vi DECIMAL(10,2) DEFAULT 0,
    ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat_pham_chat TIMESTAMP,
    UNIQUE(hang_hoa_id, phong_ban_id)
);

-- Bảng lịch sử giá
CREATE TABLE lich_su_gia (
    id SERIAL PRIMARY KEY,
    hang_hoa_id INTEGER NOT NULL REFERENCES hang_hoa(id),
    phieu_nhap_id INTEGER REFERENCES phieu_nhap(id),
    don_gia DECIMAL(15,2) NOT NULL,
    ngay_ap_dung DATE NOT NULL,
    nguon_gia nguon_gia DEFAULT 'nhap_kho',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng lịch sử kiểm kê
CREATE TABLE lich_su_kiem_ke (
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

-- =============================================
-- WORKFLOW SYSTEM
-- =============================================

-- Bảng yêu cầu nhập kho
CREATE TABLE yeu_cau_nhap_kho (
    id SERIAL PRIMARY KEY,
    so_yeu_cau VARCHAR(50) NOT NULL UNIQUE,
    don_vi_yeu_cau_id INTEGER NOT NULL REFERENCES phong_ban(id),
    nguoi_yeu_cau INTEGER NOT NULL REFERENCES users(id),
    ngay_yeu_cau DATE NOT NULL DEFAULT CURRENT_DATE,
    ngay_can_hang DATE,
    ly_do_yeu_cau TEXT NOT NULL,
    muc_do_uu_tien muc_do_uu_tien DEFAULT 'binh_thuong',
    trang_thai trang_thai_yeu_cau DEFAULT 'draft',
    nguoi_duyet INTEGER REFERENCES users(id),
    ngay_duyet TIMESTAMP,
    ly_do_tu_choi TEXT,
    ghi_chu_duyet TEXT,
    phieu_nhap_id INTEGER REFERENCES phieu_nhap(id),
    ngay_hoan_thanh TIMESTAMP,
    tong_gia_tri_uoc_tinh DECIMAL(15,2) DEFAULT 0,
    so_mat_hang INTEGER DEFAULT 0,
    file_dinh_kem_url TEXT,
    file_dinh_kem_name VARCHAR(255),
    nguon_cung_cap VARCHAR(50) DEFAULT 'tu_mua' CHECK (nguon_cung_cap IN ('tu_mua', 'tren_cap', 'dieu_chuyen')),
    nha_cung_cap_id INTEGER REFERENCES nha_cung_cap(id),
    phong_ban_xu_ly_id INTEGER REFERENCES phong_ban(id),
    ghi_chu TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_ngay_can_hang CHECK (ngay_can_hang >= ngay_yeu_cau)
);

-- Bảng chi tiết yêu cầu nhập
CREATE TABLE chi_tiet_yeu_cau_nhap (
    id SERIAL PRIMARY KEY,
    yeu_cau_nhap_id INTEGER NOT NULL REFERENCES yeu_cau_nhap_kho(id) ON DELETE CASCADE,
    hang_hoa_id INTEGER NOT NULL REFERENCES hang_hoa(id),
    so_luong_yeu_cau DECIMAL(10,2) NOT NULL,
    so_luong_duyet DECIMAL(10,2) DEFAULT 0,
    don_gia_uoc_tinh DECIMAL(15,2) DEFAULT 0,
    ly_do_su_dung TEXT,
    ghi_chu TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_so_luong_yeu_cau_positive CHECK (so_luong_yeu_cau > 0),
    CONSTRAINT check_so_luong_duyet_not_negative CHECK (so_luong_duyet >= 0),
    CONSTRAINT check_don_gia_not_negative CHECK (don_gia_uoc_tinh >= 0)
);

-- Bảng yêu cầu xuất kho
CREATE TABLE yeu_cau_xuat_kho (
    id SERIAL PRIMARY KEY,
    so_yeu_cau VARCHAR(50) NOT NULL UNIQUE,
    don_vi_yeu_cau_id INTEGER NOT NULL REFERENCES phong_ban(id),
    nguoi_yeu_cau INTEGER NOT NULL REFERENCES users(id),
    don_vi_nhan_id INTEGER REFERENCES don_vi_nhan(id),
    ngay_yeu_cau DATE NOT NULL DEFAULT CURRENT_DATE,
    ngay_can_hang DATE,
    ly_do_yeu_cau TEXT NOT NULL,
    muc_do_uu_tien muc_do_uu_tien DEFAULT 'binh_thuong',
    trang_thai trang_thai_yeu_cau DEFAULT 'draft',
    nguoi_duyet INTEGER REFERENCES users(id),
    ngay_duyet TIMESTAMP,
    ly_do_tu_choi TEXT,
    ghi_chu_duyet TEXT,
    phieu_xuat_id INTEGER REFERENCES phieu_xuat(id),
    ngay_hoan_thanh TIMESTAMP,
    tong_gia_tri_uoc_tinh DECIMAL(15,2) DEFAULT 0,
    so_mat_hang INTEGER DEFAULT 0,
    file_dinh_kem_url TEXT,
    file_dinh_kem_name VARCHAR(255),
    phong_ban_xu_ly_id INTEGER REFERENCES phong_ban(id),
    loai_xuat_yc VARCHAR(50) DEFAULT 'don_vi_nhan' CHECK (loai_xuat_yc IN ('don_vi_nhan', 'don_vi_su_dung')),
    ghi_chu TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_ngay_can_hang_xuat CHECK (ngay_can_hang >= ngay_yeu_cau)
);

-- Bảng chi tiết yêu cầu xuất
CREATE TABLE chi_tiet_yeu_cau_xuat (
    id SERIAL PRIMARY KEY,
    yeu_cau_xuat_id INTEGER NOT NULL REFERENCES yeu_cau_xuat_kho(id) ON DELETE CASCADE,
    hang_hoa_id INTEGER NOT NULL REFERENCES hang_hoa(id),
    so_luong_yeu_cau DECIMAL(10,2) NOT NULL,
    so_luong_duyet DECIMAL(10,2) DEFAULT 0,
    don_gia_uoc_tinh DECIMAL(15,2) DEFAULT 0,
    ly_do_su_dung TEXT,
    ghi_chu TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_so_luong_yeu_cau_xuat_positive CHECK (so_luong_yeu_cau > 0),
    CONSTRAINT check_so_luong_duyet_xuat_not_negative CHECK (so_luong_duyet >= 0),
    CONSTRAINT check_don_gia_xuat_not_negative CHECK (don_gia_uoc_tinh >= 0)
);

-- Bảng workflow approvals
CREATE TABLE workflow_approvals (
    id SERIAL PRIMARY KEY,
    yeu_cau_id INTEGER NOT NULL,
    loai_yeu_cau loai_yeu_cau NOT NULL,
    step_number INTEGER NOT NULL DEFAULT 1,
    nguoi_duyet INTEGER NOT NULL REFERENCES users(id),
    phong_ban_duyet INTEGER NOT NULL REFERENCES phong_ban(id),
    trang_thai trang_thai_yeu_cau NOT NULL,
    ngay_nhan TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ngay_xu_ly TIMESTAMP WITH TIME ZONE,
    deadline TIMESTAMP WITH TIME ZONE,
    ly_do_quyet_dinh TEXT,
    ghi_chu TEXT,
    file_dinh_kem_url TEXT,
    chu_ky_so TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    nguoi_nhan INTEGER NOT NULL REFERENCES users(id),
    loai_thong_bao loai_thong_bao NOT NULL,
    tieu_de VARCHAR(255) NOT NULL,
    noi_dung TEXT NOT NULL,
    trang_thai trang_thai_thong_bao DEFAULT 'unread',
    yeu_cau_id INTEGER,
    loai_yeu_cau loai_yeu_cau,
    phieu_id INTEGER,
    metadata JSONB,
    url_redirect VARCHAR(500),
    ngay_gui TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ngay_doc TIMESTAMP WITH TIME ZONE,
    ngay_het_han TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng digital signatures
CREATE TABLE digital_signatures (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    yeu_cau_id INTEGER NOT NULL,
    loai_yeu_cau loai_yeu_cau NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    signature_hash TEXT NOT NULL,
    signature_data TEXT NOT NULL,
    public_key TEXT,
    ip_address INET NOT NULL,
    user_agent TEXT,
    browser_fingerprint TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng workflow settings
CREATE TABLE workflow_settings (
    id SERIAL PRIMARY KEY,
    phong_ban_id INTEGER NOT NULL REFERENCES phong_ban(id),
    loai_yeu_cau loai_yeu_cau NOT NULL,
    auto_approval_limit DECIMAL(15,2) DEFAULT 0,
    required_approvers INTEGER DEFAULT 1,
    approval_timeout_hours INTEGER DEFAULT 72,
    notify_on_submit BOOLEAN DEFAULT TRUE,
    notify_on_approve BOOLEAN DEFAULT TRUE,
    notify_on_reject BOOLEAN DEFAULT TRUE,
    escalation_hours INTEGER DEFAULT 24,
    allow_self_approval BOOLEAN DEFAULT FALSE,
    require_attachment BOOLEAN DEFAULT FALSE,
    max_items_per_request INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(phong_ban_id, loai_yeu_cau)
);

-- Bảng quan hệ phòng ban
CREATE TABLE quan_he_phong_ban (
    id SERIAL PRIMARY KEY,
    phong_ban_cung_cap_id INTEGER NOT NULL REFERENCES phong_ban(id),
    phong_ban_nhan_id INTEGER NOT NULL REFERENCES phong_ban(id),
    loai_quan_he VARCHAR(20) NOT NULL CHECK (loai_quan_he IN ('truc_tiep', 'gian_tiep')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(phong_ban_cung_cap_id, phong_ban_nhan_id)
);

-- =============================================
-- SEQUENCES
-- =============================================
CREATE SEQUENCE IF NOT EXISTS seq_phieu_nhap START 1;
CREATE SEQUENCE IF NOT EXISTS seq_phieu_xuat START 1;
CREATE SEQUENCE IF NOT EXISTS seq_phieu_kiem_ke START 1;
CREATE SEQUENCE IF NOT EXISTS seq_yeu_cau_nhap START 1;
CREATE SEQUENCE IF NOT EXISTS seq_yeu_cau_xuat START 1;

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function tạo số phiếu nhập tự động
CREATE OR REPLACE FUNCTION auto_generate_so_phieu_nhap()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.so_phieu IS NULL OR NEW.so_phieu = '' THEN
        NEW.so_phieu := 'PN' || to_char(NEW.ngay_nhap, 'YYYYMMDD') || lpad(nextval('seq_phieu_nhap')::TEXT, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function kiểm tra quyền phòng ban
CREATE OR REPLACE FUNCTION check_permission_phong_ban()
RETURNS TRIGGER AS $$
DECLARE
    v_user_phong_ban INTEGER;
    v_user_role user_role;
    v_phong_ban_id INTEGER;
BEGIN
    IF TG_TABLE_NAME = 'phieu_nhap' THEN
        v_phong_ban_id := NEW.phong_ban_id;
    ELSIF TG_TABLE_NAME = 'phieu_xuat' THEN
        v_phong_ban_id := NEW.phong_ban_id;
    ELSIF TG_TABLE_NAME = 'phieu_kiem_ke' THEN
        v_phong_ban_id := NEW.phong_ban_id;
    END IF;
    
    SELECT phong_ban_id, role INTO v_user_phong_ban, v_user_role
    FROM users WHERE id = NEW.nguoi_tao;
    
    IF v_user_role = 'admin' THEN
        RETURN NEW;
    END IF;
    
    IF v_user_phong_ban != v_phong_ban_id THEN
        RAISE EXCEPTION 'Bạn không có quyền thao tác với phòng ban này';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function cập nhật tồn kho khi thay đổi trạng thái phiếu
CREATE OR REPLACE FUNCTION update_ton_kho_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
    chi_tiet_record RECORD;
    v_pham_chat pham_chat;
BEGIN
    IF NEW.trang_thai = 'completed' AND OLD.trang_thai != 'completed' THEN
        FOR chi_tiet_record IN 
            SELECT * FROM chi_tiet_nhap WHERE phieu_nhap_id = NEW.id
        LOOP
            v_pham_chat := COALESCE(chi_tiet_record.pham_chat, 'tot');
            
            INSERT INTO ton_kho (hang_hoa_id, phong_ban_id, sl_tot, sl_kem_pham_chat, sl_mat_pham_chat, sl_hong, sl_can_thanh_ly, gia_tri_ton, don_gia_binh_quan, ngay_cap_nhat)
            VALUES (chi_tiet_record.hang_hoa_id, NEW.phong_ban_id,
                CASE WHEN v_pham_chat = 'tot' THEN chi_tiet_record.so_luong ELSE 0 END,
                CASE WHEN v_pham_chat = 'kem_pham_chat' THEN chi_tiet_record.so_luong ELSE 0 END,
                CASE WHEN v_pham_chat = 'mat_pham_chat' THEN chi_tiet_record.so_luong ELSE 0 END,
                CASE WHEN v_pham_chat = 'hong' THEN chi_tiet_record.so_luong ELSE 0 END,
                CASE WHEN v_pham_chat = 'can_thanh_ly' THEN chi_tiet_record.so_luong ELSE 0 END,
                chi_tiet_record.thanh_tien, chi_tiet_record.don_gia, CURRENT_TIMESTAMP)
            ON CONFLICT (hang_hoa_id, phong_ban_id) 
            DO UPDATE SET
                sl_tot = ton_kho.sl_tot + CASE WHEN v_pham_chat = 'tot' THEN chi_tiet_record.so_luong ELSE 0 END,
                sl_kem_pham_chat = ton_kho.sl_kem_pham_chat + CASE WHEN v_pham_chat = 'kem_pham_chat' THEN chi_tiet_record.so_luong ELSE 0 END,
                sl_mat_pham_chat = ton_kho.sl_mat_pham_chat + CASE WHEN v_pham_chat = 'mat_pham_chat' THEN chi_tiet_record.so_luong ELSE 0 END,
                sl_hong = ton_kho.sl_hong + CASE WHEN v_pham_chat = 'hong' THEN chi_tiet_record.so_luong ELSE 0 END,
                sl_can_thanh_ly = ton_kho.sl_can_thanh_ly + CASE WHEN v_pham_chat = 'can_thanh_ly' THEN chi_tiet_record.so_luong ELSE 0 END,
                gia_tri_ton = ton_kho.gia_tri_ton + chi_tiet_record.thanh_tien,
                don_gia_binh_quan = CASE 
                    WHEN (ton_kho.so_luong_ton + chi_tiet_record.so_luong) > 0 
                    THEN (ton_kho.gia_tri_ton + chi_tiet_record.thanh_tien) / (ton_kho.so_luong_ton + chi_tiet_record.so_luong)
                    ELSE chi_tiet_record.don_gia 
                END,
                ngay_cap_nhat = CURRENT_TIMESTAMP;
                
            IF chi_tiet_record.so_seri_list IS NOT NULL AND array_length(chi_tiet_record.so_seri_list, 1) > 0 THEN
                INSERT INTO hang_hoa_seri (hang_hoa_id, so_seri, don_gia, ngay_nhap, phieu_nhap_id, pham_chat, trang_thai)
                SELECT chi_tiet_record.hang_hoa_id, unnest(chi_tiet_record.so_seri_list), chi_tiet_record.don_gia, NEW.ngay_nhap, chi_tiet_record.phieu_nhap_id, v_pham_chat, 'ton_kho'
                ON CONFLICT (hang_hoa_id, so_seri) DO NOTHING;
            END IF;
        END LOOP;
        
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function hoàn trả tồn kho khi xóa chi tiết nhập
CREATE OR REPLACE FUNCTION reverse_ton_kho_nhap()
RETURNS TRIGGER AS $$
DECLARE
    v_phong_ban_id INTEGER;
    v_pham_chat pham_chat;
    v_phieu_trang_thai trang_thai_phieu;
BEGIN
    SELECT phong_ban_id, trang_thai INTO v_phong_ban_id, v_phieu_trang_thai
    FROM phieu_nhap WHERE id = OLD.phieu_nhap_id;
    
    IF v_phieu_trang_thai != 'completed' THEN
        RETURN OLD;
    END IF;
    
    v_pham_chat := COALESCE(OLD.pham_chat, 'tot');
    
    UPDATE ton_kho 
    SET 
        sl_tot = GREATEST(0, sl_tot - CASE WHEN v_pham_chat = 'tot' THEN OLD.so_luong ELSE 0 END),
        sl_kem_pham_chat = GREATEST(0, sl_kem_pham_chat - CASE WHEN v_pham_chat = 'kem_pham_chat' THEN OLD.so_luong ELSE 0 END),
        sl_mat_pham_chat = GREATEST(0, sl_mat_pham_chat - CASE WHEN v_pham_chat = 'mat_pham_chat' THEN OLD.so_luong ELSE 0 END),
        sl_hong = GREATEST(0, sl_hong - CASE WHEN v_pham_chat = 'hong' THEN OLD.so_luong ELSE 0 END),
        sl_can_thanh_ly = GREATEST(0, sl_can_thanh_ly - CASE WHEN v_pham_chat = 'can_thanh_ly' THEN OLD.so_luong ELSE 0 END),
        gia_tri_ton = GREATEST(0, gia_tri_ton - OLD.thanh_tien),
        ngay_cap_nhat = CURRENT_TIMESTAMP
    WHERE hang_hoa_id = OLD.hang_hoa_id AND phong_ban_id = v_phong_ban_id;
    
    UPDATE ton_kho 
    SET don_gia_binh_quan = CASE 
        WHEN so_luong_ton > 0 THEN gia_tri_ton / so_luong_ton
        ELSE 0 
    END
    WHERE hang_hoa_id = OLD.hang_hoa_id AND phong_ban_id = v_phong_ban_id;
    
    IF OLD.so_seri_list IS NOT NULL AND array_length(OLD.so_seri_list, 1) > 0 THEN
        DELETE FROM hang_hoa_seri 
        WHERE hang_hoa_id = OLD.hang_hoa_id 
        AND so_seri = ANY(OLD.so_seri_list)
        AND phieu_nhap_id = OLD.phieu_nhap_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function cập nhật tồn kho xuất completed
CREATE OR REPLACE FUNCTION update_ton_kho_when_completed()
RETURNS TRIGGER AS $$
DECLARE
    chi_tiet_record RECORD;
    v_don_gia_ton DECIMAL(15,2);
    v_pham_chat pham_chat;
    v_so_luong_xuat DECIMAL(10,2);
    fifo_record RECORD;
    v_so_luong_can_xuat DECIMAL(10,2);
    v_so_luong_co_the_xuat DECIMAL(10,2);
BEGIN
    IF NEW.trang_thai = 'completed' AND OLD.trang_thai != 'completed' THEN
        FOR chi_tiet_record IN
            SELECT ctx.* FROM chi_tiet_xuat ctx WHERE ctx.phieu_xuat_id = NEW.id
        LOOP
            v_pham_chat := chi_tiet_record.pham_chat;
            v_so_luong_xuat := chi_tiet_record.so_luong_thuc_xuat;
            
            SELECT don_gia_binh_quan INTO v_don_gia_ton
            FROM ton_kho
            WHERE hang_hoa_id = chi_tiet_record.hang_hoa_id
            AND phong_ban_id = NEW.phong_ban_id;

            v_so_luong_can_xuat := v_so_luong_xuat;
            
            FOR fifo_record IN
                SELECT pn.id as phieu_nhap_id, pn.loai_phieu, pn.ngay_nhap, ctn.so_luong,
                    COALESCE((SELECT SUM(ctx2.so_luong_thuc_xuat) FROM chi_tiet_xuat ctx2 WHERE ctx2.phieu_nhap_id = pn.id AND ctx2.hang_hoa_id = chi_tiet_record.hang_hoa_id), 0) as da_xuat,
                    (ctn.so_luong - COALESCE((SELECT SUM(ctx2.so_luong_thuc_xuat) FROM chi_tiet_xuat ctx2 WHERE ctx2.phieu_nhap_id = pn.id AND ctx2.hang_hoa_id = chi_tiet_record.hang_hoa_id), 0)) as con_lai
                FROM phieu_nhap pn
                JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
                WHERE ctn.hang_hoa_id = chi_tiet_record.hang_hoa_id
                AND pn.trang_thai = 'completed'
                AND pn.phong_ban_id = NEW.phong_ban_id
                AND (ctn.so_luong - COALESCE((SELECT SUM(ctx2.so_luong_thuc_xuat) FROM chi_tiet_xuat ctx2 WHERE ctx2.phieu_nhap_id = pn.id AND ctx2.hang_hoa_id = chi_tiet_record.hang_hoa_id), 0)) > 0
                ORDER BY pn.ngay_nhap ASC, pn.created_at ASC
            LOOP
                EXIT WHEN v_so_luong_can_xuat <= 0;
                
                v_so_luong_co_the_xuat := LEAST(v_so_luong_can_xuat, fifo_record.con_lai);
                
                IF v_so_luong_co_the_xuat > 0 THEN
                    UPDATE chi_tiet_xuat
                    SET 
                        phieu_nhap_id = CASE WHEN phieu_nhap_id IS NULL THEN fifo_record.phieu_nhap_id ELSE phieu_nhap_id END,
                        loai_phieu_nhap = CASE WHEN loai_phieu_nhap IS NULL THEN fifo_record.loai_phieu ELSE loai_phieu_nhap END
                    WHERE id = chi_tiet_record.id;
                    
                    v_so_luong_can_xuat := v_so_luong_can_xuat - v_so_luong_co_the_xuat;
                END IF;
            END LOOP;

            UPDATE ton_kho
            SET
                sl_tot = GREATEST(0, sl_tot - CASE WHEN v_pham_chat = 'tot' THEN v_so_luong_xuat ELSE 0 END),
                sl_kem_pham_chat = GREATEST(0, sl_kem_pham_chat - CASE WHEN v_pham_chat = 'kem_pham_chat' THEN v_so_luong_xuat ELSE 0 END),
                sl_mat_pham_chat = GREATEST(0, sl_mat_pham_chat - CASE WHEN v_pham_chat = 'mat_pham_chat' THEN v_so_luong_xuat ELSE 0 END),
                sl_hong = GREATEST(0, sl_hong - CASE WHEN v_pham_chat = 'hong' THEN v_so_luong_xuat ELSE 0 END),
                sl_can_thanh_ly = GREATEST(0, sl_can_thanh_ly - CASE WHEN v_pham_chat = 'can_thanh_ly' THEN v_so_luong_xuat ELSE 0 END),
                gia_tri_ton = GREATEST(0, gia_tri_ton - (v_so_luong_xuat * COALESCE(v_don_gia_ton, chi_tiet_record.don_gia))),
                ngay_cap_nhat = CURRENT_TIMESTAMP
            WHERE hang_hoa_id = chi_tiet_record.hang_hoa_id
            AND phong_ban_id = NEW.phong_ban_id;

            IF chi_tiet_record.so_seri_xuat IS NOT NULL AND array_length(chi_tiet_record.so_seri_xuat, 1) > 0 THEN
                UPDATE hang_hoa_seri
                SET trang_thai = 'da_xuat'
                WHERE hang_hoa_id = chi_tiet_record.hang_hoa_id
                AND so_seri = ANY(chi_tiet_record.so_seri_xuat);
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function cập nhật tồn kho sau kiểm kê
CREATE OR REPLACE FUNCTION update_ton_kho_after_kiem_ke()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.trang_thai != 'confirmed' AND NEW.trang_thai = 'confirmed' THEN
        UPDATE ton_kho 
        SET 
            sl_tot = ctkk.sl_tot,
            sl_kem_pham_chat = ctkk.sl_kem_pham_chat,
            sl_mat_pham_chat = ctkk.sl_mat_pham_chat,
            sl_hong = ctkk.sl_hong,
            sl_can_thanh_ly = ctkk.sl_can_thanh_ly,
            ngay_cap_nhat_pham_chat = CURRENT_TIMESTAMP,
            ngay_cap_nhat = CURRENT_TIMESTAMP
        FROM chi_tiet_kiem_ke ctkk
        WHERE ton_kho.hang_hoa_id = ctkk.hang_hoa_id 
        AND ton_kho.phong_ban_id = NEW.phong_ban_id
        AND ctkk.phieu_kiem_ke_id = NEW.id;

        INSERT INTO lich_su_kiem_ke (hang_hoa_id, phieu_kiem_ke_id, phong_ban_id, ngay_kiem_ke, so_luong_so_sach, so_luong_thuc_te, chenh_lech, sl_tot, sl_kem_pham_chat, sl_mat_pham_chat, sl_hong, sl_can_thanh_ly, don_gia, gia_tri_chenh_lech, ly_do_chenh_lech, de_nghi_xu_ly)
        SELECT ctkk.hang_hoa_id, NEW.id, NEW.phong_ban_id, NEW.ngay_kiem_ke, ctkk.so_luong_so_sach, ctkk.so_luong_thuc_te, ctkk.so_luong_chenh_lech, ctkk.sl_tot, ctkk.sl_kem_pham_chat, ctkk.sl_mat_pham_chat, ctkk.sl_hong, ctkk.sl_can_thanh_ly, ctkk.don_gia, ctkk.gia_tri_chenh_lech, ctkk.ly_do_chenh_lech, ctkk.de_nghi_xu_ly
        FROM chi_tiet_kiem_ke ctkk
        WHERE ctkk.phieu_kiem_ke_id = NEW.id;

        UPDATE hang_hoa_seri 
        SET 
            pham_chat = CASE 
                WHEN so_seri = ANY(ctkk.danh_sach_seri_kiem_ke) THEN 
                    CASE 
                        WHEN ctkk.sl_tot > 0 THEN 'tot'::pham_chat
                        WHEN ctkk.sl_kem_pham_chat > 0 THEN 'kem_pham_chat'::pham_chat
                        WHEN ctkk.sl_mat_pham_chat > 0 THEN 'mat_pham_chat'::pham_chat
                        WHEN ctkk.sl_hong > 0 THEN 'hong'::pham_chat
                        WHEN ctkk.sl_can_thanh_ly > 0 THEN 'can_thanh_ly'::pham_chat
                        ELSE pham_chat
                    END
                ELSE pham_chat
            END
        FROM chi_tiet_kiem_ke ctkk
        WHERE ctkk.phieu_kiem_ke_id = NEW.id
        AND hang_hoa_seri.hang_hoa_id = ctkk.hang_hoa_id
        AND ctkk.danh_sach_seri_kiem_ke IS NOT NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function tạo số phiếu kiểm kê tự động
CREATE OR REPLACE FUNCTION auto_generate_so_phieu_kiem_ke()
RETURNS TRIGGER AS $$
DECLARE
    quy INTEGER;
    nam INTEGER;
    counter INTEGER;
BEGIN
    IF NEW.so_phieu IS NULL OR NEW.so_phieu = '' THEN
        quy := EXTRACT(QUARTER FROM NEW.ngay_kiem_ke);
        nam := EXTRACT(YEAR FROM NEW.ngay_kiem_ke);
        
        SELECT COUNT(*) + 1 INTO counter
        FROM phieu_kiem_ke 
        WHERE EXTRACT(YEAR FROM ngay_kiem_ke) = nam 
        AND EXTRACT(QUARTER FROM ngay_kiem_ke) = quy;
        
        NEW.so_phieu := LPAD(counter::TEXT, 2, '0') || '/KK-Q' || quy || '-' || nam;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function workflow tạo số yêu cầu
CREATE OR REPLACE FUNCTION generate_so_yeu_cau_nhap()
RETURNS TRIGGER AS $$
DECLARE
    date_str VARCHAR;
    counter INTEGER;
    new_so_yeu_cau VARCHAR;
BEGIN
    IF NEW.so_yeu_cau IS NULL OR NEW.so_yeu_cau = '' THEN
        date_str := to_char(NEW.ngay_yeu_cau, 'YYYYMMDD');
        counter := nextval('seq_yeu_cau_nhap');
        new_so_yeu_cau := 'YCN' || date_str || LPAD(counter::TEXT, 3, '0');
        
        WHILE EXISTS(SELECT 1 FROM yeu_cau_nhap_kho WHERE so_yeu_cau = new_so_yeu_cau) LOOP
            counter := nextval('seq_yeu_cau_nhap');
            new_so_yeu_cau := 'YCN' || date_str || LPAD(counter::TEXT, 3, '0');
        END LOOP;
        
        NEW.so_yeu_cau := new_so_yeu_cau;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_so_yeu_cau_xuat()
RETURNS TRIGGER AS $$
DECLARE
    date_str VARCHAR;
    counter INTEGER;
    new_so_yeu_cau VARCHAR;
BEGIN
    IF NEW.so_yeu_cau IS NULL OR NEW.so_yeu_cau = '' THEN
        date_str := to_char(NEW.ngay_yeu_cau, 'YYYYMMDD');
        counter := nextval('seq_yeu_cau_xuat');
        new_so_yeu_cau := 'YCX' || date_str || LPAD(counter::TEXT, 3, '0');
        
        WHILE EXISTS(SELECT 1 FROM yeu_cau_xuat_kho WHERE so_yeu_cau = new_so_yeu_cau) LOOP
            counter := nextval('seq_yeu_cau_xuat');
            new_so_yeu_cau := 'YCX' || date_str || LPAD(counter::TEXT, 3, '0');
        END LOOP;
        
        NEW.so_yeu_cau := new_so_yeu_cau;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function cập nhật metadata yêu cầu
CREATE OR REPLACE FUNCTION update_yeu_cau_metadata()
RETURNS TRIGGER AS $$
DECLARE
    v_tong_gia_tri DECIMAL(15,2);
    v_so_mat_hang INTEGER;
    v_table_name VARCHAR;
    v_yeu_cau_id INTEGER;
BEGIN
    IF TG_TABLE_NAME = 'chi_tiet_yeu_cau_nhap' THEN
        v_table_name := 'yeu_cau_nhap_kho';
        v_yeu_cau_id := COALESCE(NEW.yeu_cau_nhap_id, OLD.yeu_cau_nhap_id);
        
        SELECT COALESCE(SUM(so_luong_yeu_cau * don_gia_uoc_tinh), 0), COUNT(*)
        INTO v_tong_gia_tri, v_so_mat_hang
        FROM chi_tiet_yeu_cau_nhap WHERE yeu_cau_nhap_id = v_yeu_cau_id;
        
        UPDATE yeu_cau_nhap_kho 
        SET tong_gia_tri_uoc_tinh = v_tong_gia_tri, so_mat_hang = v_so_mat_hang, updated_at = CURRENT_TIMESTAMP
        WHERE id = v_yeu_cau_id;
        
    ELSIF TG_TABLE_NAME = 'chi_tiet_yeu_cau_xuat' THEN
        v_table_name := 'yeu_cau_xuat_kho';
        v_yeu_cau_id := COALESCE(NEW.yeu_cau_xuat_id, OLD.yeu_cau_xuat_id);
        
        SELECT COALESCE(SUM(so_luong_yeu_cau * don_gia_uoc_tinh), 0), COUNT(*)
        INTO v_tong_gia_tri, v_so_mat_hang
        FROM chi_tiet_yeu_cau_xuat WHERE yeu_cau_xuat_id = v_yeu_cau_id;
        
        UPDATE yeu_cau_xuat_kho 
        SET tong_gia_tri_uoc_tinh = v_tong_gia_tri, so_mat_hang = v_so_mat_hang, updated_at = CURRENT_TIMESTAMP
        WHERE id = v_yeu_cau_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function tự động tạo thông báo
CREATE OR REPLACE FUNCTION auto_create_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_nguoi_nhan INTEGER[];
    v_tieu_de VARCHAR(255);
    v_noi_dung TEXT;
    v_loai_thong_bao loai_thong_bao;
    v_url_redirect VARCHAR(500);
    v_metadata JSONB;
    user_id INTEGER;
BEGIN
    IF TG_TABLE_NAME = 'phieu_nhap' THEN
        CASE NEW.trang_thai
            WHEN 'confirmed' THEN
                v_loai_thong_bao := 'phieu_nhap_can_duyet';
                v_tieu_de := 'Phiếu nhập ' || NEW.so_phieu || ' cần duyệt';
                v_noi_dung := 'Phiếu nhập kho từ ' || COALESCE((SELECT ten_phong_ban FROM phong_ban WHERE id = NEW.phong_ban_id), 'N/A') || ' đang chờ phê duyệt';
                v_url_redirect := '/nhap-kho?tab=can-duyet&highlight=' || NEW.id;
                SELECT ARRAY_AGG(id) INTO v_nguoi_nhan FROM users WHERE role = 'admin' AND trang_thai = 'active';
            WHEN 'approved' THEN
                v_loai_thong_bao := 'phieu_nhap_duyet';
                v_tieu_de := 'Phiếu nhập ' || NEW.so_phieu || ' đã được duyệt';
                v_noi_dung := 'Phiếu nhập kho của bạn đã được phê duyệt và có thể thực hiện';
                v_url_redirect := '/nhap-kho?tab=da-duyet&highlight=' || NEW.id;
                v_nguoi_nhan := ARRAY[NEW.nguoi_tao];
            WHEN 'revision_required' THEN
                v_loai_thong_bao := 'phieu_nhap_can_sua';
                v_tieu_de := 'Phiếu nhập ' || NEW.so_phieu || ' cần chỉnh sửa';
                v_noi_dung := 'Phiếu nhập kho của bạn cần được chỉnh sửa. Lý do: ' || COALESCE(NEW.ghi_chu_phan_hoi, 'Không được cung cấp');
                v_url_redirect := '/nhap-kho?tab=can-sua&highlight=' || NEW.id;
                v_nguoi_nhan := ARRAY[NEW.nguoi_tao];
            WHEN 'completed' THEN
                v_loai_thong_bao := 'system';
                v_tieu_de := 'Phiếu nhập ' || NEW.so_phieu || ' đã hoàn thành';
                v_noi_dung := 'Phiếu nhập kho của bạn đã được hoàn thành. Tồn kho đã được cập nhật.';
                v_url_redirect := '/nhap-kho?tab=hoan-thanh&highlight=' || NEW.id;
                v_nguoi_nhan := ARRAY[NEW.nguoi_tao];
            ELSE
                RETURN NEW;
        END CASE;
        
    ELSIF TG_TABLE_NAME = 'phieu_xuat' THEN
        CASE NEW.trang_thai
            WHEN 'confirmed' THEN
                v_loai_thong_bao := 'phieu_xuat_can_duyet';
                v_tieu_de := 'Phiếu xuất ' || NEW.so_phieu || ' cần duyệt';
                v_noi_dung := 'Phiếu xuất kho từ ' || COALESCE((SELECT ten_phong_ban FROM phong_ban WHERE id = NEW.phong_ban_id), 'N/A') || ' đang chờ phê duyệt';
                v_url_redirect := '/xuat-kho?tab=can-duyet&highlight=' || NEW.id;
                SELECT ARRAY_AGG(id) INTO v_nguoi_nhan FROM users WHERE role = 'admin' AND trang_thai = 'active';
            WHEN 'approved' THEN
                v_loai_thong_bao := 'phieu_xuat_duyet';
                v_tieu_de := 'Phiếu xuất ' || NEW.so_phieu || ' đã được duyệt';
                v_noi_dung := 'Phiếu xuất kho của bạn đã được phê duyệt và có thể thực hiện';
                v_url_redirect := '/xuat-kho?tab=da-duyet&highlight=' || NEW.id;
                v_nguoi_nhan := ARRAY[NEW.nguoi_tao];
            WHEN 'revision_required' THEN
                v_loai_thong_bao := 'phieu_xuat_can_sua';
                v_tieu_de := 'Phiếu xuất ' || NEW.so_phieu || ' cần chỉnh sửa';
                v_noi_dung := 'Phiếu xuất kho của bạn cần được chỉnh sửa. Lý do: ' || COALESCE(NEW.ghi_chu_phan_hoi, 'Không được cung cấp');
                v_url_redirect := '/xuat-kho?tab=can-sua&highlight=' || NEW.id;
                v_nguoi_nhan := ARRAY[NEW.nguoi_tao];
            WHEN 'completed' THEN
                v_loai_thong_bao := 'system';
                v_tieu_de := 'Phiếu xuất ' || NEW.so_phieu || ' đã hoàn thành';
                v_noi_dung := 'Phiếu xuất kho của bạn đã được hoàn thành. Tồn kho đã được cập nhật.';
                v_url_redirect := '/xuat-kho?tab=hoan-thanh&highlight=' || NEW.id;
                v_nguoi_nhan := ARRAY[NEW.nguoi_tao];
            ELSE
                RETURN NEW;
        END CASE;
    ELSE
        RETURN NEW;
    END IF;
    
    v_metadata := jsonb_build_object(
        'phieu_id', NEW.id,
        'so_phieu', NEW.so_phieu,
        'loai_phieu', CASE TG_TABLE_NAME 
            WHEN 'phieu_nhap' THEN 'nhap_kho'
            WHEN 'phieu_xuat' THEN 'xuat_kho'
        END,
        'action', CASE NEW.trang_thai
            WHEN 'confirmed' THEN 'can_duyet'
            WHEN 'approved' THEN 'duyet'
            WHEN 'revision_required' THEN 'can_sua'
            WHEN 'completed' THEN 'hoan_thanh'
        END,
        'trang_thai_cu', COALESCE(OLD.trang_thai::TEXT, 'new'),
        'trang_thai_moi', NEW.trang_thai::TEXT
    );
    
    IF NEW.ghi_chu_phan_hoi IS NOT NULL THEN
        v_metadata := v_metadata || jsonb_build_object('ghi_chu_phan_hoi', NEW.ghi_chu_phan_hoi);
    END IF;
    
    IF v_nguoi_nhan IS NOT NULL THEN
        FOREACH user_id IN ARRAY v_nguoi_nhan LOOP
            INSERT INTO notifications (nguoi_nhan, loai_thong_bao, tieu_de, noi_dung, url_redirect, metadata, trang_thai) 
            VALUES (user_id, v_loai_thong_bao, v_tieu_de, v_noi_dung, v_url_redirect, v_metadata, 'unread');
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Function utility
CREATE OR REPLACE FUNCTION generate_ma_hang_hoa()
RETURNS VARCHAR AS $
DECLARE
    counter INTEGER;
    new_ma VARCHAR;
BEGIN
    SELECT COUNT(*) + 1 INTO counter FROM hang_hoa;
    new_ma := 'HH' || LPAD(counter::TEXT, 6, '0');
    
    WHILE EXISTS(SELECT 1 FROM hang_hoa WHERE ma_hang_hoa = new_ma) LOOP
        counter := counter + 1;
        new_ma := 'HH' || LPAD(counter::TEXT, 6, '0');
    END LOOP;
    
    RETURN new_ma;
END;
$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_ma_ncc()
RETURNS VARCHAR AS $
DECLARE
    counter INTEGER;
    new_ma VARCHAR;
BEGIN
    SELECT COUNT(*) + 1 INTO counter FROM nha_cung_cap;
    new_ma := 'NCC' || LPAD(counter::TEXT, 6, '0');
    
    WHILE EXISTS(SELECT 1 FROM nha_cung_cap WHERE ma_ncc = new_ma) LOOP
        counter := counter + 1;
        new_ma := 'NCC' || LPAD(counter::TEXT, 6, '0');
    END LOOP;
    
    RETURN new_ma;
END;
$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_ma_don_vi()
RETURNS VARCHAR(50) AS $
DECLARE
    next_id INTEGER;
    new_ma VARCHAR(50);
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(ma_don_vi FROM 3) AS INTEGER)), 0) + 1 
    INTO next_id 
    FROM don_vi_nhan 
    WHERE ma_don_vi ~ '^DV[0-9]+;
    
    new_ma := 'DV' || LPAD(next_id::TEXT, 4, '0');
    RETURN new_ma;
END;
$ LANGUAGE plpgsql;

-- Function tồn kho thực tế
CREATE OR REPLACE FUNCTION get_ton_kho_thuc_te(
    p_hang_hoa_id INTEGER,
    p_phong_ban_id INTEGER
)
RETURNS TABLE(
    so_luong_ton DECIMAL(10,2),
    so_luong_dang_cho_xuat DECIMAL(10,2),
    so_luong_co_the_xuat DECIMAL(10,2),
    don_gia_binh_quan DECIMAL(15,2)
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(tk.so_luong_ton, 0) as so_luong_ton,
        COALESCE((SELECT SUM(ctx.so_luong_yeu_cau) FROM chi_tiet_xuat ctx JOIN phieu_xuat px ON ctx.phieu_xuat_id = px.id WHERE ctx.hang_hoa_id = p_hang_hoa_id AND px.phong_ban_id = p_phong_ban_id AND px.trang_thai IN ('draft', 'approved', 'confirmed')), 0) as so_luong_dang_cho_xuat,
        GREATEST(0, COALESCE(tk.so_luong_ton, 0) - COALESCE((SELECT SUM(ctx.so_luong_yeu_cau) FROM chi_tiet_xuat ctx JOIN phieu_xuat px ON ctx.phieu_xuat_id = px.id WHERE ctx.hang_hoa_id = p_hang_hoa_id AND px.phong_ban_id = p_phong_ban_id AND px.trang_thai IN ('draft', 'approved', 'confirmed')), 0)) as so_luong_co_the_xuat,
        COALESCE(tk.don_gia_binh_quan, 0) as don_gia_binh_quan
    FROM ton_kho tk
    WHERE tk.hang_hoa_id = p_hang_hoa_id AND tk.phong_ban_id = p_phong_ban_id;
END;
$ LANGUAGE plpgsql;

-- Function lấy tồn kho cho kiểm kê
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
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        tk.hang_hoa_id, h.ma_hang_hoa, h.ten_hang_hoa, h.don_vi_tinh, lh.ten_loai, tk.so_luong_ton, tk.sl_tot, tk.sl_kem_pham_chat, tk.sl_mat_pham_chat, tk.sl_hong, tk.sl_can_thanh_ly,
        COALESCE((SELECT ls.don_gia FROM lich_su_gia ls JOIN phieu_nhap pn ON ls.phieu_nhap_id = pn.id WHERE ls.hang_hoa_id = h.id AND ls.nguon_gia = 'nhap_kho' AND pn.trang_thai = 'completed' ORDER BY ls.ngay_ap_dung DESC, ls.created_at DESC LIMIT 1), h.gia_nhap_gan_nhat, 0) as don_gia_moi_nhat
    FROM ton_kho tk
    JOIN hang_hoa h ON tk.hang_hoa_id = h.id
    LEFT JOIN loai_hang_hoa lh ON h.loai_hang_hoa_id = lh.id
    WHERE tk.phong_ban_id = p_phong_ban_id AND tk.so_luong_ton > 0 AND h.trang_thai = 'active'
    ORDER BY h.ten_hang_hoa ASC;
END;
$ LANGUAGE plpgsql;

-- Function thống kê kiểm kê
CREATE OR REPLACE FUNCTION get_kiem_ke_statistics(
    p_phong_ban_id INTEGER DEFAULT NULL,
    p_tu_ngay DATE DEFAULT NULL,
    p_den_ngay DATE DEFAULT NULL
)
RETURNS TABLE(
    thang INTEGER,
    nam INTEGER,
    so_phieu_kiem_ke INTEGER,
    tong_mat_hang INTEGER,
    tong_chenh_lech_duong INTEGER,
    tong_chenh_lech_am INTEGER,
    gia_tri_chenh_lech DECIMAL(15,2)
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(MONTH FROM pkk.ngay_kiem_ke)::INTEGER as thang,
        EXTRACT(YEAR FROM pkk.ngay_kiem_ke)::INTEGER as nam,
        COUNT(DISTINCT pkk.id)::INTEGER as so_phieu_kiem_ke,
        COUNT(ctkk.id)::INTEGER as tong_mat_hang,
        SUM(CASE WHEN ctkk.so_luong_chenh_lech > 0 THEN 1 ELSE 0 END)::INTEGER as tong_chenh_lech_duong,
        SUM(CASE WHEN ctkk.so_luong_chenh_lech < 0 THEN 1 ELSE 0 END)::INTEGER as tong_chenh_lech_am,
        SUM(ctkk.gia_tri_chenh_lech) as gia_tri_chenh_lech
    FROM phieu_kiem_ke pkk
    LEFT JOIN chi_tiet_kiem_ke ctkk ON pkk.id = ctkk.phieu_kiem_ke_id
    WHERE (p_phong_ban_id IS NULL OR pkk.phong_ban_id = p_phong_ban_id)
    AND (p_tu_ngay IS NULL OR pkk.ngay_kiem_ke >= p_tu_ngay)
    AND (p_den_ngay IS NULL OR pkk.ngay_kiem_ke <= p_den_ngay)
    AND pkk.trang_thai = 'confirmed'
    GROUP BY EXTRACT(MONTH FROM pkk.ngay_kiem_ke), EXTRACT(YEAR FROM pkk.ngay_kiem_ke)
    ORDER BY nam DESC, thang DESC;
END;
$ LANGUAGE plpgsql;

-- Function rebuild tồn kho
CREATE OR REPLACE FUNCTION rebuild_ton_kho_completed_only()
RETURNS TEXT AS $
DECLARE
    result_message TEXT := '';
    affected_rows INTEGER := 0;
    chi_tiet_record RECORD;
    v_pham_chat pham_chat;
BEGIN
    DELETE FROM ton_kho;
    DELETE FROM hang_hoa_seri WHERE trang_thai = 'ton_kho';
    result_message := result_message || 'Đã xóa dữ liệu tồn kho cũ.' || E'\n';
    
    FOR chi_tiet_record IN 
        SELECT ctn.*, pn.phong_ban_id, pn.ngay_nhap
        FROM chi_tiet_nhap ctn
        JOIN phieu_nhap pn ON ctn.phieu_nhap_id = pn.id
        WHERE pn.trang_thai = 'completed'
        ORDER BY pn.ngay_nhap, pn.created_at, ctn.id
    LOOP
        v_pham_chat := COALESCE(chi_tiet_record.pham_chat, 'tot');
        
        INSERT INTO ton_kho (hang_hoa_id, phong_ban_id, sl_tot, sl_kem_pham_chat, sl_mat_pham_chat, sl_hong, sl_can_thanh_ly, gia_tri_ton, don_gia_binh_quan, ngay_cap_nhat)
        VALUES (chi_tiet_record.hang_hoa_id, chi_tiet_record.phong_ban_id,
            CASE WHEN v_pham_chat = 'tot' THEN chi_tiet_record.so_luong ELSE 0 END,
            CASE WHEN v_pham_chat = 'kem_pham_chat' THEN chi_tiet_record.so_luong ELSE 0 END,
            CASE WHEN v_pham_chat = 'mat_pham_chat' THEN chi_tiet_record.so_luong ELSE 0 END,
            CASE WHEN v_pham_chat = 'hong' THEN chi_tiet_record.so_luong ELSE 0 END,
            CASE WHEN v_pham_chat = 'can_thanh_ly' THEN chi_tiet_record.so_luong ELSE 0 END,
            chi_tiet_record.thanh_tien, chi_tiet_record.don_gia, CURRENT_TIMESTAMP)
        ON CONFLICT (hang_hoa_id, phong_ban_id) 
        DO UPDATE SET
            sl_tot = ton_kho.sl_tot + CASE WHEN v_pham_chat = 'tot' THEN chi_tiet_record.so_luong ELSE 0 END,
            sl_kem_pham_chat = ton_kho.sl_kem_pham_chat + CASE WHEN v_pham_chat = 'kem_pham_chat' THEN chi_tiet_record.so_luong ELSE 0 END,
            sl_mat_pham_chat = ton_kho.sl_mat_pham_chat + CASE WHEN v_pham_chat = 'mat_pham_chat' THEN chi_tiet_record.so_luong ELSE 0 END,
            sl_hong = ton_kho.sl_hong + CASE WHEN v_pham_chat = 'hong' THEN chi_tiet_record.so_luong ELSE 0 END,
            sl_can_thanh_ly = ton_kho.sl_can_thanh_ly + CASE WHEN v_pham_chat = 'can_thanh_ly' THEN chi_tiet_record.so_luong ELSE 0 END,
            gia_tri_ton = ton_kho.gia_tri_ton + chi_tiet_record.thanh_tien,
            don_gia_binh_quan = CASE WHEN (ton_kho.so_luong_ton + chi_tiet_record.so_luong) > 0 THEN (ton_kho.gia_tri_ton + chi_tiet_record.thanh_tien) / (ton_kho.so_luong_ton + chi_tiet_record.so_luong) ELSE chi_tiet_record.don_gia END,
            ngay_cap_nhat = CURRENT_TIMESTAMP;
            
        IF chi_tiet_record.so_seri_list IS NOT NULL AND array_length(chi_tiet_record.so_seri_list, 1) > 0 THEN
            INSERT INTO hang_hoa_seri (hang_hoa_id, so_seri, don_gia, ngay_nhap, phieu_nhap_id, pham_chat, trang_thai)
            SELECT chi_tiet_record.hang_hoa_id, unnest(chi_tiet_record.so_seri_list), chi_tiet_record.don_gia, chi_tiet_record.ngay_nhap, chi_tiet_record.phieu_nhap_id, v_pham_chat, 'ton_kho'
            ON CONFLICT (hang_hoa_id, so_seri) DO NOTHING;
        END IF;
        
        affected_rows := affected_rows + 1;
    END LOOP;
    
    FOR chi_tiet_record IN 
        SELECT ctx.*, px.phong_ban_id
        FROM chi_tiet_xuat ctx
        JOIN phieu_xuat px ON ctx.phieu_xuat_id = px.id
        WHERE px.trang_thai = 'completed'
        ORDER BY px.ngay_xuat, px.created_at, ctx.id
    LOOP
        v_pham_chat := COALESCE(chi_tiet_record.pham_chat, 'tot');
        
        UPDATE ton_kho 
        SET 
            sl_tot = GREATEST(0, sl_tot - CASE WHEN v_pham_chat = 'tot' THEN chi_tiet_record.so_luong_thuc_xuat ELSE 0 END),
            sl_kem_pham_chat = GREATEST(0, sl_kem_pham_chat - CASE WHEN v_pham_chat = 'kem_pham_chat' THEN chi_tiet_record.so_luong_thuc_xuat ELSE 0 END),
            sl_mat_pham_chat = GREATEST(0, sl_mat_pham_chat - CASE WHEN v_pham_chat = 'mat_pham_chat' THEN chi_tiet_record.so_luong_thuc_xuat ELSE 0 END),
            sl_hong = GREATEST(0, sl_hong - CASE WHEN v_pham_chat = 'hong' THEN chi_tiet_record.so_luong_thuc_xuat ELSE 0 END),
            sl_can_thanh_ly = GREATEST(0, sl_can_thanh_ly - CASE WHEN v_pham_chat = 'can_thanh_ly' THEN chi_tiet_record.so_luong_thuc_xuat ELSE 0 END),
            gia_tri_ton = GREATEST(0, gia_tri_ton - (chi_tiet_record.so_luong_thuc_xuat * chi_tiet_record.don_gia)),
            ngay_cap_nhat = CURRENT_TIMESTAMP
        WHERE hang_hoa_id = chi_tiet_record.hang_hoa_id AND phong_ban_id = chi_tiet_record.phong_ban_id;
        
        IF chi_tiet_record.so_seri_xuat IS NOT NULL AND array_length(chi_tiet_record.so_seri_xuat, 1) > 0 THEN
            UPDATE hang_hoa_seri 
            SET trang_thai = 'da_xuat'
            WHERE hang_hoa_id = chi_tiet_record.hang_hoa_id AND so_seri = ANY(chi_tiet_record.so_seri_xuat);
        END IF;
    END LOOP;
    
    result_message := result_message || 'Đã rebuild tồn kho từ ' || affected_rows || ' chi tiết phiếu nhập hoàn thành.' || E'\n';
    
    UPDATE hang_hoa 
    SET gia_nhap_gan_nhat = (
        SELECT ls.don_gia FROM lich_su_gia ls JOIN phieu_nhap pn ON ls.phieu_nhap_id = pn.id
        WHERE ls.hang_hoa_id = hang_hoa.id AND ls.nguon_gia = 'nhap_kho' AND pn.trang_thai = 'completed'
        ORDER BY ls.ngay_ap_dung DESC, ls.created_at DESC LIMIT 1
    );
    
    result_message := result_message || 'Đã cập nhật giá nhập gần nhất từ phiếu hoàn thành.' || E'\n';
    result_message := result_message || 'Rebuild hoàn thành!';
    
    RETURN result_message;
END;
$ LANGUAGE plpgsql;

-- =============================================
-- VIEWS
-- =============================================

-- View thống kê kiểm kê
CREATE OR REPLACE VIEW v_thong_ke_kiem_ke AS
SELECT 
    pkk.id, pkk.so_phieu, pkk.ngay_kiem_ke, pkk.loai_kiem_ke, pkk.trang_thai, pb.ten_phong_ban,
    COUNT(ctkk.id) as so_mat_hang,
    SUM(ctkk.so_luong_so_sach) as tong_sl_so_sach,
    SUM(ctkk.so_luong_thuc_te) as tong_sl_thuc_te,
    SUM(ctkk.so_luong_chenh_lech) as chenh_lech_so_luong,
    SUM(ctkk.so_luong_so_sach * ctkk.don_gia) as gia_tri_so_sach,
    SUM(ctkk.gia_tri_tot + ctkk.gia_tri_kem + ctkk.gia_tri_mat + ctkk.gia_tri_hong + ctkk.gia_tri_thanh_ly) as gia_tri_thuc_te,
    SUM(ctkk.gia_tri_chenh_lech) as chenh_lech_gia_tri,
    SUM(ctkk.sl_tot) as tong_sl_tot,
    SUM(ctkk.sl_kem_pham_chat) as tong_sl_kem_pham_chat,
    SUM(ctkk.sl_mat_pham_chat) as tong_sl_mat_pham_chat,
    SUM(ctkk.sl_hong) as tong_sl_hong,
    SUM(ctkk.sl_can_thanh_ly) as tong_sl_can_thanh_ly
FROM phieu_kiem_ke pkk
LEFT JOIN chi_tiet_kiem_ke ctkk ON pkk.id = ctkk.phieu_kiem_ke_id
LEFT JOIN phong_ban pb ON pkk.phong_ban_id = pb.id
GROUP BY pkk.id, pkk.so_phieu, pkk.ngay_kiem_ke, pkk.loai_kiem_ke, pkk.trang_thai, pb.ten_phong_ban;

-- =============================================
-- TRIGGERS
-- =============================================

-- Updated_at triggers
CREATE TRIGGER tr_phong_ban_updated_at BEFORE UPDATE ON phong_ban FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_hang_hoa_updated_at BEFORE UPDATE ON hang_hoa FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_phieu_nhap_updated_at BEFORE UPDATE ON phieu_nhap FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_phieu_xuat_updated_at BEFORE UPDATE ON phieu_xuat FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_don_vi_nhan_updated_at BEFORE UPDATE ON don_vi_nhan FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Permission triggers
CREATE TRIGGER tr_check_permission_nhap BEFORE INSERT ON phieu_nhap FOR EACH ROW EXECUTE FUNCTION check_permission_phong_ban();
CREATE TRIGGER tr_check_permission_xuat BEFORE INSERT ON phieu_xuat FOR EACH ROW EXECUTE FUNCTION check_permission_phong_ban();
CREATE TRIGGER tr_check_permission_kiem_ke BEFORE INSERT ON phieu_kiem_ke FOR EACH ROW EXECUTE FUNCTION check_permission_phong_ban();

-- Auto number generation triggers
CREATE TRIGGER tr_auto_so_phieu_nhap BEFORE INSERT ON phieu_nhap FOR EACH ROW EXECUTE FUNCTION auto_generate_so_phieu_nhap();
CREATE TRIGGER tr_auto_so_phieu_kiem_ke BEFORE INSERT ON phieu_kiem_ke FOR EACH ROW EXECUTE FUNCTION auto_generate_so_phieu_kiem_ke();

-- Inventory triggers
CREATE TRIGGER tr_update_ton_kho_on_status_change AFTER UPDATE ON phieu_nhap FOR EACH ROW WHEN (NEW.trang_thai IS DISTINCT FROM OLD.trang_thai) EXECUTE FUNCTION update_ton_kho_on_status_change();
CREATE TRIGGER tr_reverse_ton_kho_before_delete BEFORE DELETE ON chi_tiet_nhap FOR EACH ROW EXECUTE FUNCTION reverse_ton_kho_nhap();
CREATE TRIGGER tr_update_ton_kho_when_completed AFTER UPDATE ON phieu_xuat FOR EACH ROW WHEN (NEW.trang_thai = 'completed' AND OLD.trang_thai != 'completed') EXECUTE FUNCTION update_ton_kho_when_completed();
CREATE TRIGGER tr_update_ton_kho_after_kiem_ke AFTER UPDATE ON phieu_kiem_ke FOR EACH ROW WHEN (NEW.trang_thai IS DISTINCT FROM OLD.trang_thai) EXECUTE FUNCTION update_ton_kho_after_kiem_ke();

-- Workflow triggers
CREATE TRIGGER tr_generate_so_yeu_cau_nhap BEFORE INSERT ON yeu_cau_nhap_kho FOR EACH ROW EXECUTE FUNCTION generate_so_yeu_cau_nhap();
CREATE TRIGGER tr_generate_so_yeu_cau_xuat BEFORE INSERT ON yeu_cau_xuat_kho FOR EACH ROW EXECUTE FUNCTION generate_so_yeu_cau_xuat();
CREATE TRIGGER tr_update_metadata_nhap AFTER INSERT OR UPDATE OR DELETE ON chi_tiet_yeu_cau_nhap FOR EACH ROW EXECUTE FUNCTION update_yeu_cau_metadata();
CREATE TRIGGER tr_update_metadata_xuat AFTER INSERT OR UPDATE OR DELETE ON chi_tiet_yeu_cau_xuat FOR EACH ROW EXECUTE FUNCTION update_yeu_cau_metadata();

-- Notification triggers
CREATE TRIGGER tr_auto_notification_phieu_nhap AFTER UPDATE ON phieu_nhap FOR EACH ROW WHEN (OLD.trang_thai IS DISTINCT FROM NEW.trang_thai) EXECUTE FUNCTION auto_create_notification();
CREATE TRIGGER tr_auto_notification_phieu_xuat AFTER UPDATE ON phieu_xuat FOR EACH ROW WHEN (OLD.trang_thai IS DISTINCT FROM NEW.trang_thai) EXECUTE FUNCTION auto_create_notification();

-- =============================================
-- INDEXES
-- =============================================

-- Core indexes
CREATE INDEX idx_hang_hoa_ma ON hang_hoa(ma_hang_hoa);
CREATE INDEX idx_hang_hoa_ten ON hang_hoa USING gin(to_tsvector('simple', ten_hang_hoa));
CREATE INDEX idx_hang_hoa_loai ON hang_hoa(loai_hang_hoa_id);
CREATE INDEX idx_hang_hoa_phong_ban ON hang_hoa(phong_ban_id);
CREATE INDEX idx_hang_hoa_seri_hang_hoa ON hang_hoa_seri(hang_hoa_id);
CREATE INDEX idx_hang_hoa_seri_seri ON hang_hoa_seri(so_seri);
CREATE INDEX idx_hang_hoa_seri_trang_thai ON hang_hoa_seri(trang_thai);

-- Phiếu indexes
CREATE INDEX idx_phieu_nhap_ngay ON phieu_nhap(ngay_nhap);
CREATE INDEX idx_phieu_nhap_phong_ban ON phieu_nhap(phong_ban_id);
CREATE INDEX idx_phieu_nhap_so_phieu ON phieu_nhap(so_phieu);
CREATE INDEX idx_phieu_xuat_ngay ON phieu_xuat(ngay_xuat);
CREATE INDEX idx_phieu_xuat_phong_ban ON phieu_xuat(phong_ban_id);
CREATE INDEX idx_phieu_xuat_so_phieu ON phieu_xuat(so_phieu);
CREATE INDEX idx_phieu_xuat_so_quyet_dinh ON phieu_xuat(so_quyet_dinh);
CREATE INDEX idx_phieu_kiem_ke_so_quyet_dinh ON phieu_kiem_ke(so_quyet_dinh);

-- Tồn kho indexes
CREATE INDEX idx_ton_kho_hang_hoa_phong_ban ON ton_kho(hang_hoa_id, phong_ban_id);
CREATE INDEX idx_ton_kho_phong_ban ON ton_kho(phong_ban_id);
CREATE INDEX idx_chi_tiet_kiem_ke_phieu ON chi_tiet_kiem_ke(phieu_kiem_ke_id);
CREATE INDEX idx_chi_tiet_kiem_ke_hang_hoa ON chi_tiet_kiem_ke(hang_hoa_id);

-- Workflow indexes
CREATE INDEX idx_yeu_cau_nhap_so_yeu_cau ON yeu_cau_nhap_kho(so_yeu_cau);
CREATE INDEX idx_yeu_cau_nhap_don_vi ON yeu_cau_nhap_kho(don_vi_yeu_cau_id);
CREATE INDEX idx_yeu_cau_nhap_nguoi_yeu_cau ON yeu_cau_nhap_kho(nguoi_yeu_cau);
CREATE INDEX idx_yeu_cau_nhap_trang_thai ON yeu_cau_nhap_kho(trang_thai);
CREATE INDEX idx_yeu_cau_nhap_ngay ON yeu_cau_nhap_kho(ngay_yeu_cau);
CREATE INDEX idx_yeu_cau_nhap_created ON yeu_cau_nhap_kho(created_at DESC);
CREATE INDEX idx_chi_tiet_yc_nhap_yeu_cau ON chi_tiet_yeu_cau_nhap(yeu_cau_nhap_id);
CREATE INDEX idx_chi_tiet_yc_nhap_hang_hoa ON chi_tiet_yeu_cau_nhap(hang_hoa_id);
CREATE INDEX idx_yeu_cau_xuat_so_yeu_cau ON yeu_cau_xuat_kho(so_yeu_cau);
CREATE INDEX idx_yeu_cau_xuat_don_vi ON yeu_cau_xuat_kho(don_vi_yeu_cau_id);
CREATE INDEX idx_yeu_cau_xuat_nguoi_yeu_cau ON yeu_cau_xuat_kho(nguoi_yeu_cau);
CREATE INDEX idx_yeu_cau_xuat_trang_thai ON yeu_cau_xuat_kho(trang_thai);
CREATE INDEX idx_yeu_cau_xuat_ngay ON yeu_cau_xuat_kho(ngay_yeu_cau);
CREATE INDEX idx_yeu_cau_xuat_created ON yeu_cau_xuat_kho(created_at DESC);
CREATE INDEX idx_chi_tiet_yc_xuat_yeu_cau ON chi_tiet_yeu_cau_xuat(yeu_cau_xuat_id);
CREATE INDEX idx_chi_tiet_yc_xuat_hang_hoa ON chi_tiet_yeu_cau_xuat(hang_hoa_id);

-- Workflow system indexes
CREATE INDEX idx_workflow_yeu_cau ON workflow_approvals (yeu_cau_id, loai_yeu_cau);
CREATE INDEX idx_workflow_nguoi_duyet ON workflow_approvals (nguoi_duyet);
CREATE INDEX idx_workflow_trang_thai ON workflow_approvals (trang_thai);
CREATE INDEX idx_notifications_nguoi_nhan ON notifications (nguoi_nhan);
CREATE INDEX idx_notifications_trang_thai ON notifications (trang_thai);
CREATE INDEX idx_notifications_loai ON notifications (loai_thong_bao);
CREATE INDEX idx_notifications_created_desc ON notifications (created_at DESC);
CREATE INDEX idx_signatures_user ON digital_signatures (user_id);
CREATE INDEX idx_signatures_yeu_cau ON digital_signatures (yeu_cau_id, loai_yeu_cau);
CREATE INDEX idx_signatures_hash ON digital_signatures (signature_hash);

-- Don vi nhan indexes
CREATE INDEX idx_don_vi_nhan_ma_don_vi ON don_vi_nhan(ma_don_vi);
CREATE INDEX idx_don_vi_nhan_ten_don_vi ON don_vi_nhan(ten_don_vi);
CREATE INDEX idx_don_vi_nhan_loai_don_vi ON don_vi_nhan(loai_don_vi);
CREATE INDEX idx_don_vi_nhan_phong_ban_id ON don_vi_nhan(phong_ban_id);
CREATE INDEX idx_don_vi_nhan_trang_thai ON don_vi_nhan(trang_thai);

-- Lịch sử indexes
CREATE INDEX idx_lich_su_kiem_ke_hang_hoa ON lich_su_kiem_ke(hang_hoa_id);
CREATE INDEX idx_lich_su_kiem_ke_phieu ON lich_su_kiem_ke(phieu_kiem_ke_id);
CREATE INDEX idx_lich_su_kiem_ke_ngay ON lich_su_kiem_ke(ngay_kiem_ke);
CREATE INDEX idx_lich_su_kiem_ke_phong_ban ON lich_su_kiem_ke(phong_ban_id);

-- Search indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_hang_hoa_ten_search ON hang_hoa USING gin(to_tsvector('simple', ten_hang_hoa));
CREATE INDEX idx_nha_cung_cap_ten_search ON nha_cung_cap USING gin(to_tsvector('simple', ten_ncc));
CREATE INDEX idx_hang_hoa_ten_trgm ON hang_hoa USING gin(ten_hang_hoa gin_trgm_ops);
CREATE INDEX idx_nha_cung_cap_ten_trgm ON nha_cung_cap USING gin(ten_ncc gin_trgm_ops);

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Phòng ban
INSERT INTO phong_ban (ma_phong_ban, ten_phong_ban, mo_ta) VALUES
('PTM', 'Phòng Tham mưu', 'Phòng Tham mưu'),
('HCK', 'Phòng Hậu cần - Kỹ thuật', 'Phòng Hậu cần - Kỹ thuật'),
('TMKH', 'Ban Trang thiết bị - Kho hàng', 'Ban Trang thiết bị - Kho hàng'),
('HC', 'Ban Hành chính', 'Ban Hành chính'),
('HD11', 'PKT HĐ11', 'Phòng Kỹ thuật Hạm đội 11'),
('HD102', 'Đội xe HĐ102', 'Đội xe Hạm đội 102');

-- Users mẫu (password: 123456)
INSERT INTO users (username, password, ho_ten, role, phong_ban_id) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin', 1),
('ptm_user', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Nhân viên PTM', 'user', 1),
('tmkh_user', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Nhân viên TMKH', 'user', 3);


