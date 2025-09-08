--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4
-- Dumped by pg_dump version 16.4

-- Started on 2025-09-08 18:08:20

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 18202)
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- TOC entry 5448 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- TOC entry 978 (class 1247 OID 17502)
-- Name: loai_don_vi; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.loai_don_vi AS ENUM (
    'doi_xe',
    'phong_ban',
    'khac',
    'noi_bo'
);


ALTER TYPE public.loai_don_vi OWNER TO postgres;

--
-- TOC entry 975 (class 1247 OID 17476)
-- Name: loai_phieu_nhap; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.loai_phieu_nhap AS ENUM (
    'tu_mua',
    'tren_cap',
    'dieu_chuyen',
    'luan_chuyen'
);


ALTER TYPE public.loai_phieu_nhap OWNER TO postgres;

--
-- TOC entry 1056 (class 1247 OID 18923)
-- Name: loai_thong_bao; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.loai_thong_bao AS ENUM (
    'phieu_nhap_can_duyet',
    'phieu_nhap_duyet',
    'phieu_nhap_can_sua',
    'phieu_xuat_can_duyet',
    'phieu_xuat_duyet',
    'phieu_xuat_can_sua',
    'system'
);


ALTER TYPE public.loai_thong_bao OWNER TO postgres;

--
-- TOC entry 1059 (class 1247 OID 19111)
-- Name: loai_xuat; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.loai_xuat AS ENUM (
    'don_vi_su_dung',
    'don_vi_nhan'
);


ALTER TYPE public.loai_xuat OWNER TO postgres;

--
-- TOC entry 1053 (class 1247 OID 18311)
-- Name: loai_xuat_old; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.loai_xuat_old AS ENUM (
    'don_vi_nhan',
    'don_vi_su_dung'
);


ALTER TYPE public.loai_xuat_old OWNER TO postgres;

--
-- TOC entry 981 (class 1247 OID 17518)
-- Name: pham_chat; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.pham_chat AS ENUM (
    'tot',
    'kem_pham_chat',
    'mat_pham_chat',
    'hong',
    'can_thanh_ly'
);


ALTER TYPE public.pham_chat OWNER TO postgres;

--
-- TOC entry 972 (class 1247 OID 17470)
-- Name: trang_thai; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.trang_thai AS ENUM (
    'active',
    'inactive'
);


ALTER TYPE public.trang_thai OWNER TO postgres;

--
-- TOC entry 1062 (class 1247 OID 19116)
-- Name: trang_thai_phieu; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.trang_thai_phieu AS ENUM (
    'draft',
    'confirmed',
    'pending_approval',
    'pending_level3_approval',
    'approved',
    'completed',
    'cancelled',
    'revision_required'
);


ALTER TYPE public.trang_thai_phieu OWNER TO postgres;

--
-- TOC entry 990 (class 1247 OID 17484)
-- Name: trang_thai_phieu_old; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.trang_thai_phieu_old AS ENUM (
    'draft',
    'confirmed',
    'cancelled',
    'approved',
    'completed',
    'revision_required',
    'pending_manager_approval',
    'pending_admin_approval',
    'pending_level3_approval'
);


ALTER TYPE public.trang_thai_phieu_old OWNER TO postgres;

--
-- TOC entry 1032 (class 1247 OID 18466)
-- Name: trang_thai_thong_bao; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.trang_thai_thong_bao AS ENUM (
    'unread',
    'read',
    'archived'
);


ALTER TYPE public.trang_thai_thong_bao OWNER TO postgres;

--
-- TOC entry 969 (class 1247 OID 17465)
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'user',
    'manager'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- TOC entry 346 (class 1255 OID 18343)
-- Name: adjust_ton_kho_on_approve(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.adjust_ton_kho_on_approve() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    chi_tiet_record RECORD;
    v_pham_chat pham_chat;
    v_chenh_lech DECIMAL(10,2);
    v_don_gia_ton DECIMAL(15,2);
BEGIN
    -- Chỉ xử lý khi phiếu chuyển sang trạng thái completed (đã duyệt)
    IF NEW.trang_thai = 'completed' AND OLD.trang_thai != 'completed' THEN
        -- Duyệt qua tất cả chi tiết xuất để điều chỉnh
        FOR chi_tiet_record IN 
            SELECT * FROM chi_tiet_xuat WHERE phieu_xuat_id = NEW.id
        LOOP
            v_pham_chat := COALESCE(chi_tiet_record.pham_chat, 'tot');
            
            -- Tính chênh lệch giữa số lượng yêu cầu và thực xuất
            v_chenh_lech := chi_tiet_record.so_luong_yeu_cau - chi_tiet_record.so_luong_thuc_xuat;
            
            -- Lấy đơn giá bình quân từ tồn kho
            SELECT don_gia_binh_quan INTO v_don_gia_ton
            FROM ton_kho 
            WHERE hang_hoa_id = chi_tiet_record.hang_hoa_id AND phong_ban_id = NEW.phong_ban_id;
            
            -- Nếu có chênh lệch dương (thực xuất ít hơn yêu cầu), hoàn trả phần dư
            IF v_chenh_lech > 0 THEN
                UPDATE ton_kho 
                SET 
                    sl_tot = sl_tot + CASE WHEN v_pham_chat = 'tot' THEN v_chenh_lech ELSE 0 END,
                    sl_kem_pham_chat = sl_kem_pham_chat + CASE WHEN v_pham_chat = 'kem_pham_chat' THEN v_chenh_lech ELSE 0 END,
                    sl_mat_pham_chat = sl_mat_pham_chat + CASE WHEN v_pham_chat = 'mat_pham_chat' THEN v_chenh_lech ELSE 0 END,
                    sl_hong = sl_hong + CASE WHEN v_pham_chat = 'hong' THEN v_chenh_lech ELSE 0 END,
                    sl_can_thanh_ly = sl_can_thanh_ly + CASE WHEN v_pham_chat = 'can_thanh_ly' THEN v_chenh_lech ELSE 0 END,
                    gia_tri_ton = gia_tri_ton + (v_chenh_lech * COALESCE(v_don_gia_ton, chi_tiet_record.don_gia)),
                    ngay_cap_nhat = CURRENT_TIMESTAMP
                WHERE hang_hoa_id = chi_tiet_record.hang_hoa_id AND phong_ban_id = NEW.phong_ban_id;
                
                RAISE NOTICE 'Hoàn trả % đơn vị cho hàng hóa ID % do xuất ít hơn yêu cầu', v_chenh_lech, chi_tiet_record.hang_hoa_id;
            END IF;
            
            -- Nếu có chênh lệch âm (thực xuất nhiều hơn yêu cầu), trừ thêm
            IF v_chenh_lech < 0 THEN
                UPDATE ton_kho 
                SET 
                    sl_tot = GREATEST(0, sl_tot - CASE WHEN v_pham_chat = 'tot' THEN ABS(v_chenh_lech) ELSE 0 END),
                    sl_kem_pham_chat = GREATEST(0, sl_kem_pham_chat - CASE WHEN v_pham_chat = 'kem_pham_chat' THEN ABS(v_chenh_lech) ELSE 0 END),
                    sl_mat_pham_chat = GREATEST(0, sl_mat_pham_chat - CASE WHEN v_pham_chat = 'mat_pham_chat' THEN ABS(v_chenh_lech) ELSE 0 END),
                    sl_hong = GREATEST(0, sl_hong - CASE WHEN v_pham_chat = 'hong' THEN ABS(v_chenh_lech) ELSE 0 END),
                    sl_can_thanh_ly = GREATEST(0, sl_can_thanh_ly - CASE WHEN v_pham_chat = 'can_thanh_ly' THEN ABS(v_chenh_lech) ELSE 0 END),
                    gia_tri_ton = GREATEST(0, gia_tri_ton - (ABS(v_chenh_lech) * COALESCE(v_don_gia_ton, chi_tiet_record.don_gia))),
                    ngay_cap_nhat = CURRENT_TIMESTAMP
                WHERE hang_hoa_id = chi_tiet_record.hang_hoa_id AND phong_ban_id = NEW.phong_ban_id;
                
                RAISE NOTICE 'Trừ thêm % đơn vị cho hàng hóa ID % do xuất nhiều hơn yêu cầu', ABS(v_chenh_lech), chi_tiet_record.hang_hoa_id;
            END IF;
            
            -- Cập nhật thành tiền dựa trên số lượng thực xuất
            UPDATE chi_tiet_xuat 
            SET thanh_tien = so_luong_thuc_xuat * don_gia
            WHERE id = chi_tiet_record.id;
        END LOOP;
        
        -- Cập nhật lại tổng tiền phiếu xuất
        UPDATE phieu_xuat 
        SET tong_tien = (
            SELECT COALESCE(SUM(thanh_tien), 0) 
            FROM chi_tiet_xuat 
            WHERE phieu_xuat_id = NEW.id
        )
        WHERE id = NEW.id;
        
        RAISE NOTICE 'Đã điều chỉnh tồn kho cho phiếu xuất được duyệt: %', NEW.so_phieu;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.adjust_ton_kho_on_approve() OWNER TO postgres;

--
-- TOC entry 269 (class 1255 OID 18795)
-- Name: auto_assign_phong_ban_xu_ly(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auto_assign_phong_ban_xu_ly() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_TABLE_NAME = 'yeu_cau_nhap_kho' THEN
        NEW.phong_ban_xu_ly_id := get_phong_ban_xu_ly(NEW.don_vi_yeu_cau_id, 'nhap_kho'::loai_yeu_cau);
    ELSIF TG_TABLE_NAME = 'yeu_cau_xuat_kho' THEN  
        NEW.phong_ban_xu_ly_id := get_phong_ban_xu_ly(NEW.don_vi_yeu_cau_id, 'xuat_kho'::loai_yeu_cau);
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.auto_assign_phong_ban_xu_ly() OWNER TO postgres;

--
-- TOC entry 296 (class 1255 OID 18726)
-- Name: auto_create_notification(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auto_create_notification() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_nguoi_nhan INTEGER[];
    v_tieu_de VARCHAR(255);
    v_noi_dung TEXT;
    v_loai_thong_bao loai_thong_bao;
    v_url_redirect VARCHAR(500);
    v_metadata JSONB;
    user_id INTEGER;
BEGIN
    -- Xác định loại thông báo và người nhận
    IF TG_TABLE_NAME = 'phieu_nhap' THEN
        -- ✅ Sửa URL để khớp với notificationService.js
        CASE NEW.trang_thai
            WHEN 'confirmed' THEN
                -- Phiếu nhập cần duyệt
                v_loai_thong_bao := 'phieu_nhap_can_duyet';
                v_tieu_de := 'Phiếu nhập ' || NEW.so_phieu || ' cần duyệt';
                v_noi_dung := 'Phiếu nhập kho từ ' || 
                             COALESCE((SELECT ten_phong_ban FROM phong_ban WHERE id = NEW.phong_ban_id), 'N/A') ||
                             ' đang chờ phê duyệt';
                v_url_redirect := '/nhap-kho?tab=can-duyet&highlight=' || NEW.id;
                
                -- Gửi cho admin
                SELECT ARRAY_AGG(id) INTO v_nguoi_nhan
                FROM users 
                WHERE role = 'admin' AND trang_thai = 'active';
                
            WHEN 'approved' THEN
                -- Phiếu nhập đã duyệt
                v_loai_thong_bao := 'phieu_nhap_duyet';
                v_tieu_de := 'Phiếu nhập ' || NEW.so_phieu || ' đã được duyệt';
                v_noi_dung := 'Phiếu nhập kho của bạn đã được phê duyệt và có thể thực hiện';
                v_url_redirect := '/nhap-kho?tab=da-duyet&highlight=' || NEW.id;
                v_nguoi_nhan := ARRAY[NEW.nguoi_tao];
                
            WHEN 'revision_required' THEN
                -- Phiếu nhập cần sửa
                v_loai_thong_bao := 'phieu_nhap_can_sua';
                v_tieu_de := 'Phiếu nhập ' || NEW.so_phieu || ' cần chỉnh sửa';
                v_noi_dung := 'Phiếu nhập kho của bạn cần được chỉnh sửa. Lý do: ' || 
                             COALESCE(NEW.ghi_chu_phan_hoi, 'Không được cung cấp');
                v_url_redirect := '/nhap-kho?tab=can-sua&highlight=' || NEW.id;
                v_nguoi_nhan := ARRAY[NEW.nguoi_tao];
                
            WHEN 'completed' THEN
                -- Phiếu nhập hoàn thành
                v_loai_thong_bao := 'system';
                v_tieu_de := 'Phiếu nhập ' || NEW.so_phieu || ' đã hoàn thành';
                v_noi_dung := 'Phiếu nhập kho của bạn đã được hoàn thành. Tồn kho đã được cập nhật.';
                v_url_redirect := '/nhap-kho?tab=hoan-thanh&highlight=' || NEW.id;
                v_nguoi_nhan := ARRAY[NEW.nguoi_tao];
                
            ELSE
                RETURN NEW; -- Không gửi thông báo cho các trạng thái khác
        END CASE;
        
    ELSIF TG_TABLE_NAME = 'phieu_xuat' THEN
        -- ✅ Sửa URL để khớp với notificationService.js  
        CASE NEW.trang_thai
            WHEN 'confirmed' THEN
                -- Phiếu xuất cần duyệt
                v_loai_thong_bao := 'phieu_xuat_can_duyet';
                v_tieu_de := 'Phiếu xuất ' || NEW.so_phieu || ' cần duyệt';
                v_noi_dung := 'Phiếu xuất kho từ ' || 
                             COALESCE((SELECT ten_phong_ban FROM phong_ban WHERE id = NEW.phong_ban_id), 'N/A') ||
                             ' đang chờ phê duyệt';
                v_url_redirect := '/xuat-kho?tab=can-duyet&highlight=' || NEW.id;
                
                -- Gửi cho admin
                SELECT ARRAY_AGG(id) INTO v_nguoi_nhan
                FROM users 
                WHERE role = 'admin' AND trang_thai = 'active';
                
            WHEN 'approved' THEN
                -- Phiếu xuất đã duyệt
                v_loai_thong_bao := 'phieu_xuat_duyet';
                v_tieu_de := 'Phiếu xuất ' || NEW.so_phieu || ' đã được duyệt';
                v_noi_dung := 'Phiếu xuất kho của bạn đã được phê duyệt và có thể thực hiện';
                v_url_redirect := '/xuat-kho?tab=da-duyet&highlight=' || NEW.id;
                v_nguoi_nhan := ARRAY[NEW.nguoi_tao];
                
            WHEN 'revision_required' THEN
                -- Phiếu xuất cần sửa
                v_loai_thong_bao := 'phieu_xuat_can_sua';
                v_tieu_de := 'Phiếu xuất ' || NEW.so_phieu || ' cần chỉnh sửa';
                v_noi_dung := 'Phiếu xuất kho của bạn cần được chỉnh sửa. Lý do: ' || 
                             COALESCE(NEW.ghi_chu_phan_hoi, 'Không được cung cấp');
                v_url_redirect := '/xuat-kho?tab=can-sua&highlight=' || NEW.id;
                v_nguoi_nhan := ARRAY[NEW.nguoi_tao];
                
            WHEN 'completed' THEN
                -- Phiếu xuất hoàn thành
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
    
    -- ✅ Tạo metadata phù hợp với notificationService.js
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
    
    -- ✅ Thêm ghi chú phản hồi nếu có
    IF NEW.ghi_chu_phan_hoi IS NOT NULL THEN
        v_metadata := v_metadata || jsonb_build_object('ghi_chu_phan_hoi', NEW.ghi_chu_phan_hoi);
    END IF;
    
    -- Tạo thông báo cho từng người nhận
    IF v_nguoi_nhan IS NOT NULL THEN
        FOREACH user_id IN ARRAY v_nguoi_nhan LOOP
            -- ✅ Sử dụng cấu trúc bảng giống notificationService.js
            INSERT INTO notifications (
                nguoi_nhan, loai_thong_bao, tieu_de, noi_dung,
                url_redirect, metadata, muc_do_uu_tien, trang_thai
            ) VALUES (
                user_id, 
                v_loai_thong_bao, 
                v_tieu_de, 
                v_noi_dung,
                v_url_redirect,
                v_metadata,
                CASE v_loai_thong_bao
                    WHEN 'phieu_nhap_can_duyet' THEN 'high'
                    WHEN 'phieu_xuat_can_duyet' THEN 'high'
                    WHEN 'phieu_nhap_can_sua' THEN 'high'
                    WHEN 'phieu_xuat_can_sua' THEN 'high'
                    ELSE 'normal'
                END,
                'unread'
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.auto_create_notification() OWNER TO postgres;

--
-- TOC entry 290 (class 1255 OID 27484)
-- Name: auto_create_notification_backup(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auto_create_notification_backup() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.auto_create_notification_backup() OWNER TO postgres;

--
-- TOC entry 349 (class 1255 OID 18864)
-- Name: auto_create_phieu_xuat_lien_ket(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auto_create_phieu_xuat_lien_ket() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_so_phieu_xuat TEXT;
    v_phieu_xuat_id INTEGER;
    v_chi_tiet RECORD;
    v_date_str TEXT;
    v_max_seq INTEGER;
    v_admin_user_id INTEGER;
BEGIN
    -- Chỉ tạo phiếu xuất cho loại nhập từ trên cấp hoặc điều chuyển
    IF NEW.loai_phieu NOT IN ('tren_cap', 'dieu_chuyen') THEN
        RETURN NEW;
    END IF;
    
    -- Chỉ tạo khi có phòng ban cung cấp
    IF NEW.phong_ban_cung_cap_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Tìm admin user của phòng ban cung cấp
    SELECT u.id INTO v_admin_user_id
    FROM users u 
    WHERE u.phong_ban_id = NEW.phong_ban_cung_cap_id 
    AND u.role IN ('admin', 'manager')
    AND u.trang_thai = 'active'
    ORDER BY CASE WHEN u.role = 'admin' THEN 1 ELSE 2 END
    LIMIT 1;
    
    -- Nếu không tìm thấy, dùng system user
    IF v_admin_user_id IS NULL THEN
        v_admin_user_id := 1; -- System user
    END IF;
    
    -- Tạo số phiếu xuất
    v_date_str := TO_CHAR(NEW.ngay_nhap, 'YYYYMMDD');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(so_phieu FROM 11) AS INTEGER)), 0)
    INTO v_max_seq
    FROM phieu_xuat 
    WHERE so_phieu LIKE 'PX' || v_date_str || '%';
    
    v_so_phieu_xuat := 'PX' || v_date_str || LPAD((v_max_seq + 1)::TEXT, 3, '0');
    
    -- Tạo phiếu xuất với user có quyền
    INSERT INTO phieu_xuat (
        so_phieu, ngay_xuat, phong_ban_id, phong_ban_nhan_id,
        ly_do_xuat, loai_xuat, trang_thai, nguoi_tao,
        phieu_nhap_lien_ket_id, ghi_chu, tong_tien
    ) VALUES (
        v_so_phieu_xuat, 
        NEW.ngay_nhap, 
        NEW.phong_ban_cung_cap_id,  -- Phòng ban xuất
        NEW.phong_ban_id,           -- Phòng ban nhận
        'Xuất hàng cho cấp dưới theo phiếu nhập ' || NEW.so_phieu,
        'don_vi_nhan', 
        'completed',  -- Tự động hoàn thành
        v_admin_user_id, -- User có quyền với phòng ban cung cấp
        NEW.id, 
        'Tự động tạo khi phiếu nhập được hoàn thành',
        NEW.tong_tien
    ) RETURNING id INTO v_phieu_xuat_id;
    
    -- Tạo chi tiết xuất
    FOR v_chi_tiet IN 
        SELECT hang_hoa_id, so_luong, don_gia, pham_chat
        FROM chi_tiet_nhap 
        WHERE phieu_nhap_id = NEW.id
    LOOP
        INSERT INTO chi_tiet_xuat (
            phieu_xuat_id, hang_hoa_id, so_luong_yeu_cau, so_luong_thuc_xuat,
            don_gia, thanh_tien, pham_chat
        ) VALUES (
            v_phieu_xuat_id,
            v_chi_tiet.hang_hoa_id,
            v_chi_tiet.so_luong,
            v_chi_tiet.so_luong,
            v_chi_tiet.don_gia,
            v_chi_tiet.so_luong * v_chi_tiet.don_gia,
            v_chi_tiet.pham_chat
        );
        
        -- Cập nhật tồn kho cho phòng ban cung cấp (trừ đi)
        -- Chú ý: Cập nhật các cột số lượng chi tiết, không cập nhật so_luong_ton
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
        
        -- Nếu chưa có bản ghi tồn kho thì tạo mới (với số âm)
        -- Chú ý: Chèn giá trị vào các cột số lượng chi tiết, không chèn vào so_luong_ton
        IF NOT FOUND THEN
            INSERT INTO ton_kho (
                hang_hoa_id, phong_ban_id, don_gia_binh_quan,
                sl_tot, sl_kem_pham_chat, sl_mat_pham_chat, sl_hong, sl_can_thanh_ly,
                gia_tri_ton
            ) VALUES (
                v_chi_tiet.hang_hoa_id, 
                NEW.phong_ban_cung_cap_id, 
                v_chi_tiet.don_gia,
                CASE WHEN v_chi_tiet.pham_chat = 'tot' THEN -v_chi_tiet.so_luong ELSE 0 END,
                CASE WHEN v_chi_tiet.pham_chat = 'kem_pham_chat' THEN -v_chi_tiet.so_luong ELSE 0 END,
                CASE WHEN v_chi_tiet.pham_chat = 'mat_pham_chat' THEN -v_chi_tiet.so_luong ELSE 0 END,
                CASE WHEN v_chi_tiet.pham_chat = 'hong' THEN -v_chi_tiet.so_luong ELSE 0 END,
                CASE WHEN v_chi_tiet.pham_chat = 'can_thanh_ly' THEN -v_chi_tiet.so_luong ELSE 0 END,
                - (v_chi_tiet.so_luong * v_chi_tiet.don_gia)
            );
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.auto_create_phieu_xuat_lien_ket() OWNER TO postgres;

--
-- TOC entry 329 (class 1255 OID 18408)
-- Name: auto_generate_so_phieu_kiem_ke(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auto_generate_so_phieu_kiem_ke() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    quy INTEGER;
    nam INTEGER;
    counter INTEGER;
BEGIN
    IF NEW.so_phieu IS NULL OR NEW.so_phieu = '' THEN
        -- Tính quý và năm
        quy := EXTRACT(QUARTER FROM NEW.ngay_kiem_ke);
        nam := EXTRACT(YEAR FROM NEW.ngay_kiem_ke);
        
        -- Đếm số phiếu cùng quý
        SELECT COUNT(*) + 1 INTO counter
        FROM phieu_kiem_ke 
        WHERE EXTRACT(YEAR FROM ngay_kiem_ke) = nam 
        AND EXTRACT(QUARTER FROM ngay_kiem_ke) = quy;
        
        NEW.so_phieu := LPAD(counter::TEXT, 2, '0') || '/KK-Q' || quy || '-' || nam;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.auto_generate_so_phieu_kiem_ke() OWNER TO postgres;

--
-- TOC entry 276 (class 1255 OID 18194)
-- Name: auto_generate_so_phieu_nhap(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auto_generate_so_phieu_nhap() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.so_phieu IS NULL OR NEW.so_phieu = '' THEN
        NEW.so_phieu := 'PN' || to_char(NEW.ngay_nhap, 'YYYYMMDD') || 
                        lpad(nextval('seq_phieu_nhap')::TEXT, 3, '0');
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.auto_generate_so_phieu_nhap() OWNER TO postgres;

--
-- TOC entry 344 (class 1255 OID 18861)
-- Name: check_hang_hoa_permission(integer, integer, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_hang_hoa_permission(p_user_id integer, p_hang_hoa_id integer, p_action character varying DEFAULT 'view'::character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_user_role user_role;
    v_user_phong_ban_id INTEGER;
    v_hang_hoa_phong_ban_id INTEGER;
    v_user_cap_bac INTEGER;
    v_hang_hoa_cap_bac INTEGER;
BEGIN
    -- Lấy thông tin user
    SELECT role, phong_ban_id INTO v_user_role, v_user_phong_ban_id
    FROM users WHERE id = p_user_id;
    
    -- Admin có toàn quyền
    IF v_user_role = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Lấy thông tin hàng hóa
    SELECT h.phong_ban_id INTO v_hang_hoa_phong_ban_id
    FROM hang_hoa h WHERE h.id = p_hang_hoa_id;
    
    -- Lấy cấp bậc của user và hàng hóa
    SELECT cap_bac INTO v_user_cap_bac 
    FROM phong_ban WHERE id = v_user_phong_ban_id;
    
    SELECT cap_bac INTO v_hang_hoa_cap_bac 
    FROM phong_ban WHERE id = v_hang_hoa_phong_ban_id;
    
    -- Logic phân quyền theo cấp bậc
    CASE v_user_cap_bac
        WHEN 1 THEN -- BTL Vùng
            -- Có thể xem tất cả, chỉnh sửa hàng hóa của cấp 1 và 2
            IF p_action = 'view' THEN
                RETURN TRUE;
            ELSIF p_action IN ('create', 'update', 'delete') THEN
                RETURN v_hang_hoa_cap_bac <= 2;
            END IF;
            
        WHEN 2 THEN -- Phòng ban/Ban chuyên môn
            -- Xem được hàng hóa của cấp 2 và 3 thuộc quyền quản lý
            -- Chỉnh sửa được hàng hóa của chính mình và cấp dưới trực tiếp
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
            -- Chỉ xem và quản lý hàng hóa của chính mình
            RETURN v_hang_hoa_phong_ban_id = v_user_phong_ban_id;
            
        ELSE
            RETURN FALSE;
    END CASE;
    
    RETURN FALSE;
END;
$$;


ALTER FUNCTION public.check_hang_hoa_permission(p_user_id integer, p_hang_hoa_id integer, p_action character varying) OWNER TO postgres;

--
-- TOC entry 316 (class 1255 OID 18888)
-- Name: check_hang_hoa_permission_v2(integer, integer, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_hang_hoa_permission_v2(p_user_id integer, p_hang_hoa_id integer, p_action character varying DEFAULT 'view'::character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.check_hang_hoa_permission_v2(p_user_id integer, p_hang_hoa_id integer, p_action character varying) OWNER TO postgres;

--
-- TOC entry 306 (class 1255 OID 18187)
-- Name: check_permission_phong_ban(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_permission_phong_ban() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_user_phong_ban INTEGER;
    v_user_role user_role;
    v_phong_ban_id INTEGER;
BEGIN
    -- Xác định phòng ban cần kiểm tra
    IF TG_TABLE_NAME = 'phieu_nhap' THEN
        v_phong_ban_id := NEW.phong_ban_id;
    ELSIF TG_TABLE_NAME = 'phieu_xuat' THEN
        v_phong_ban_id := NEW.phong_ban_id;
    ELSIF TG_TABLE_NAME = 'phieu_kiem_ke' THEN
        v_phong_ban_id := NEW.phong_ban_id;
    END IF;
    
    -- Lấy thông tin user
    SELECT phong_ban_id, role INTO v_user_phong_ban, v_user_role
    FROM users 
    WHERE id = NEW.nguoi_tao;
    
    -- Admin có toàn quyền
    IF v_user_role = 'admin' THEN
        RETURN NEW;
    END IF;
    
    -- User chỉ được thao tác với phòng ban của mình
    IF v_user_phong_ban != v_phong_ban_id THEN
        RAISE EXCEPTION 'Bạn không có quyền thao tác với phòng ban này';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_permission_phong_ban() OWNER TO postgres;

--
-- TOC entry 342 (class 1255 OID 18297)
-- Name: check_phieu_nhap_editable(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_phieu_nhap_editable() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Chỉ cho phép chỉnh sửa phiếu ở trạng thái draft và approved
    IF OLD.trang_thai IN ('completed', 'cancelled') THEN
        RAISE EXCEPTION 'Không thể chỉnh sửa phiếu đã hoàn thành hoặc bị hủy';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_phieu_nhap_editable() OWNER TO postgres;

--
-- TOC entry 297 (class 1255 OID 18874)
-- Name: check_phong_ban_permission(integer, integer, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_phong_ban_permission(p_user_id integer, p_phong_ban_id integer, p_action character varying DEFAULT 'view'::character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.check_phong_ban_permission(p_user_id integer, p_phong_ban_id integer, p_action character varying) OWNER TO postgres;

--
-- TOC entry 307 (class 1255 OID 18728)
-- Name: check_ton_kho_for_yeu_cau(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_ton_kho_for_yeu_cau(p_yeu_cau_xuat_id integer) RETURNS TABLE(hang_hoa_id integer, ten_hang_hoa character varying, so_luong_yeu_cau numeric, so_luong_ton numeric, co_the_xuat boolean, ghi_chu text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ctx.hang_hoa_id,
        h.ten_hang_hoa,
        ctx.so_luong_yeu_cau,
        COALESCE(tk.so_luong_ton, 0) as so_luong_ton,
        (COALESCE(tk.so_luong_ton, 0) >= ctx.so_luong_yeu_cau) as co_the_xuat,
        CASE 
            WHEN COALESCE(tk.so_luong_ton, 0) = 0 THEN 'Hết hàng'
            WHEN COALESCE(tk.so_luong_ton, 0) < ctx.so_luong_yeu_cau THEN 
                'Không đủ hàng (thiếu ' || (ctx.so_luong_yeu_cau - COALESCE(tk.so_luong_ton, 0)) || ')'
            ELSE 'Đủ hàng'
        END as ghi_chu
    FROM chi_tiet_yeu_cau_xuat ctx
    JOIN hang_hoa h ON ctx.hang_hoa_id = h.id
    LEFT JOIN ton_kho tk ON h.id = tk.hang_hoa_id
    JOIN yeu_cau_xuat_kho ycx ON ctx.yeu_cau_xuat_id = ycx.id
    WHERE ctx.yeu_cau_xuat_id = p_yeu_cau_xuat_id
    AND tk.phong_ban_id = ycx.don_vi_yeu_cau_id;
END;
$$;


ALTER FUNCTION public.check_ton_kho_for_yeu_cau(p_yeu_cau_xuat_id integer) OWNER TO postgres;

--
-- TOC entry 326 (class 1255 OID 18727)
-- Name: cleanup_old_notifications(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cleanup_old_notifications() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Xóa thông báo đã đọc cũ hơn 30 ngày
    DELETE FROM notifications 
    WHERE trang_thai = 'read' 
    AND ngay_doc < CURRENT_DATE - INTERVAL '30 days';
    
    -- Chuyển thông báo chưa đọc cũ hơn 90 ngày sang archived
    UPDATE notifications 
    SET trang_thai = 'archived'
    WHERE trang_thai = 'unread' 
    AND created_at < CURRENT_DATE - INTERVAL '90 days';
    
    RAISE NOTICE 'Cleaned up old notifications';
END;
$$;


ALTER FUNCTION public.cleanup_old_notifications() OWNER TO postgres;

--
-- TOC entry 350 (class 1255 OID 18339)
-- Name: generate_ma_don_vi(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_ma_don_vi() RETURNS character varying
    LANGUAGE plpgsql
    AS $_$
DECLARE
    new_code VARCHAR(20);
    counter INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(ma_don_vi FROM 4) AS INTEGER)), 0) + 1
    INTO counter
    FROM don_vi_nhan
    WHERE ma_don_vi ~ '^DVN[0-9]+$';
    
    new_code := 'DVN' || LPAD(counter::text, 4, '0');
    
    RETURN new_code;
END;
$_$;


ALTER FUNCTION public.generate_ma_don_vi() OWNER TO postgres;

--
-- TOC entry 314 (class 1255 OID 18200)
-- Name: generate_ma_hang_hoa(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_ma_hang_hoa() RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
    counter INTEGER;
    new_ma VARCHAR;
BEGIN
    SELECT COUNT(*) + 1 INTO counter FROM hang_hoa;
    new_ma := 'HH' || LPAD(counter::TEXT, 6, '0');
    
    -- Kiểm tra trùng lặp
    WHILE EXISTS(SELECT 1 FROM hang_hoa WHERE ma_hang_hoa = new_ma) LOOP
        counter := counter + 1;
        new_ma := 'HH' || LPAD(counter::TEXT, 6, '0');
    END LOOP;
    
    RETURN new_ma;
END;
$$;


ALTER FUNCTION public.generate_ma_hang_hoa() OWNER TO postgres;

--
-- TOC entry 301 (class 1255 OID 18201)
-- Name: generate_ma_ncc(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_ma_ncc() RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
    counter INTEGER;
    new_ma VARCHAR;
BEGIN
    SELECT COUNT(*) + 1 INTO counter FROM nha_cung_cap;
    new_ma := 'NCC' || LPAD(counter::TEXT, 6, '0');
    
    -- Kiểm tra trùng lặp
    WHILE EXISTS(SELECT 1 FROM nha_cung_cap WHERE ma_ncc = new_ma) LOOP
        counter := counter + 1;
        new_ma := 'NCC' || LPAD(counter::TEXT, 6, '0');
    END LOOP;
    
    RETURN new_ma;
END;
$$;


ALTER FUNCTION public.generate_ma_ncc() OWNER TO postgres;

--
-- TOC entry 317 (class 1255 OID 18193)
-- Name: generate_so_phieu(character varying, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_so_phieu(prefix character varying, date_val date) RETURNS character varying
    LANGUAGE plpgsql
    AS $_$
DECLARE
    date_str VARCHAR;
    counter INTEGER;
    so_phieu VARCHAR;
BEGIN
    date_str := to_char(date_val, 'YYYYMMDD');
    
    -- Đếm số phiếu cùng ngày
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE DATE(created_at) = $1', TG_TABLE_NAME)
    INTO counter
    USING date_val;
    
    so_phieu := prefix || date_str || lpad((counter + 1)::TEXT, 3, '0');
    
    RETURN so_phieu;
END;
$_$;


ALTER FUNCTION public.generate_so_phieu(prefix character varying, date_val date) OWNER TO postgres;

--
-- TOC entry 328 (class 1255 OID 18723)
-- Name: generate_so_yeu_cau_nhap(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_so_yeu_cau_nhap() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    date_str VARCHAR;
    counter INTEGER;
    new_so_yeu_cau VARCHAR;
BEGIN
    IF NEW.so_yeu_cau IS NULL OR NEW.so_yeu_cau = '' THEN
        date_str := to_char(NEW.ngay_yeu_cau, 'YYYYMMDD');
        
        -- Lấy số thứ tự tiếp theo
        counter := nextval('seq_yeu_cau_nhap');
        
        -- Tạo số yêu cầu: YCN + YYYYMMDD + 001
        new_so_yeu_cau := 'YCN' || date_str || LPAD(counter::TEXT, 3, '0');
        
        -- Kiểm tra trùng lặp và retry nếu cần
        WHILE EXISTS(SELECT 1 FROM yeu_cau_nhap_kho WHERE so_yeu_cau = new_so_yeu_cau) LOOP
            counter := nextval('seq_yeu_cau_nhap');
            new_so_yeu_cau := 'YCN' || date_str || LPAD(counter::TEXT, 3, '0');
        END LOOP;
        
        NEW.so_yeu_cau := new_so_yeu_cau;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.generate_so_yeu_cau_nhap() OWNER TO postgres;

--
-- TOC entry 332 (class 1255 OID 18724)
-- Name: generate_so_yeu_cau_xuat(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_so_yeu_cau_xuat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    date_str VARCHAR;
    counter INTEGER;
    new_so_yeu_cau VARCHAR;
BEGIN
    IF NEW.so_yeu_cau IS NULL OR NEW.so_yeu_cau = '' THEN
        date_str := to_char(NEW.ngay_yeu_cau, 'YYYYMMDD');
        
        -- Lấy số thứ tự tiếp theo
        counter := nextval('seq_yeu_cau_xuat');
        
        -- Tạo số yêu cầu: YCX + YYYYMMDD + 001
        new_so_yeu_cau := 'YCX' || date_str || LPAD(counter::TEXT, 3, '0');
        
        -- Kiểm tra trùng lặp và retry nếu cần
        WHILE EXISTS(SELECT 1 FROM yeu_cau_xuat_kho WHERE so_yeu_cau = new_so_yeu_cau) LOOP
            counter := nextval('seq_yeu_cau_xuat');
            new_so_yeu_cau := 'YCX' || date_str || LPAD(counter::TEXT, 3, '0');
        END LOOP;
        
        NEW.so_yeu_cau := new_so_yeu_cau;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.generate_so_yeu_cau_xuat() OWNER TO postgres;

--
-- TOC entry 288 (class 1255 OID 19029)
-- Name: get_cap3_co_the_dieu_chuyen(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_cap3_co_the_dieu_chuyen(p_phong_ban_id integer DEFAULT NULL::integer) RETURNS TABLE(id integer, ten_phong_ban character varying, ma_phong_ban character varying, cap_bac integer, co_the_nhan boolean)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.get_cap3_co_the_dieu_chuyen(p_phong_ban_id integer) OWNER TO postgres;

--
-- TOC entry 271 (class 1255 OID 18985)
-- Name: get_don_vi_nhan_with_noi_bo(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_don_vi_nhan_with_noi_bo(p_user_id integer DEFAULT NULL::integer) RETURNS TABLE(id integer, ma_don_vi character varying, ten_don_vi character varying, loai_don_vi character varying, is_noi_bo boolean, phong_ban_id integer, ten_phong_ban character varying)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.get_don_vi_nhan_with_noi_bo(p_user_id integer) OWNER TO postgres;

--
-- TOC entry 289 (class 1255 OID 18867)
-- Name: get_hang_hoa_with_permission(integer, integer, integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_hang_hoa_with_permission(p_user_id integer, p_page integer DEFAULT 1, p_limit integer DEFAULT 20, p_search text DEFAULT ''::text) RETURNS TABLE(id integer, ma_hang_hoa character varying, ten_hang_hoa character varying, ten_loai character varying, don_vi_tinh character varying, so_luong_ton numeric, gia_tri_ton numeric, don_gia_binh_quan numeric, gia_nhap_gan_nhat numeric, ten_phong_ban character varying, can_edit boolean, can_delete boolean)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_offset INTEGER;
    v_user_role user_role;
    v_user_phong_ban_id INTEGER;
    v_user_cap_bac INTEGER;
BEGIN
    v_offset := (p_page - 1) * p_limit;
    
    -- Lấy thông tin user
    SELECT role, phong_ban_id INTO v_user_role, v_user_phong_ban_id
    FROM users WHERE id = p_user_id;
    
    SELECT cap_bac INTO v_user_cap_bac 
    FROM phong_ban WHERE id = v_user_phong_ban_id;
    
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
        check_hang_hoa_permission(p_user_id, h.id, 'update') as can_edit,
        check_hang_hoa_permission(p_user_id, h.id, 'delete') as can_delete
    FROM hang_hoa h
    LEFT JOIN loai_hang_hoa lh ON h.loai_hang_hoa_id = lh.id
    LEFT JOIN phong_ban pb ON h.phong_ban_id = pb.id
    LEFT JOIN ton_kho tk ON h.id = tk.hang_hoa_id AND tk.phong_ban_id = h.phong_ban_id
    WHERE h.trang_thai = 'active'
    AND check_hang_hoa_permission(p_user_id, h.id, 'view') = TRUE
    AND (p_search = '' OR h.ten_hang_hoa ILIKE '%' || p_search || '%' OR h.ma_hang_hoa ILIKE '%' || p_search || '%')
    ORDER BY h.created_at DESC
    LIMIT p_limit OFFSET v_offset;
END;
$$;


ALTER FUNCTION public.get_hang_hoa_with_permission(p_user_id integer, p_page integer, p_limit integer, p_search text) OWNER TO postgres;

--
-- TOC entry 283 (class 1255 OID 18875)
-- Name: get_hang_hoa_with_permission(integer, integer, integer, text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_hang_hoa_with_permission(p_user_id integer, p_page integer DEFAULT 1, p_limit integer DEFAULT 20, p_search text DEFAULT ''::text, p_loai_hang_hoa_id integer DEFAULT NULL::integer) RETURNS TABLE(id integer, ma_hang_hoa character varying, ten_hang_hoa character varying, ten_loai character varying, don_vi_tinh character varying, so_luong_ton numeric, gia_tri_ton numeric, don_gia_binh_quan numeric, gia_nhap_gan_nhat numeric, ten_phong_ban character varying, can_edit boolean, can_delete boolean, so_lan_nhap integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_offset INTEGER;
    v_user_role user_role;
    v_user_phong_ban_id INTEGER;
BEGIN
    v_offset := (p_page - 1) * p_limit;
    
    -- Sửa lỗi: thêm alias u cho bảng users
    SELECT u.role, u.phong_ban_id INTO v_user_role, v_user_phong_ban_id
    FROM users u WHERE u.id = p_user_id;
    
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
        check_hang_hoa_permission(p_user_id, h.id, 'update') as can_edit,
        check_hang_hoa_permission(p_user_id, h.id, 'delete') as can_delete,
        COALESCE((
            SELECT COUNT(DISTINCT pn.id)::INTEGER
            FROM phieu_nhap pn
            JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
            WHERE ctn.hang_hoa_id = h.id 
            AND pn.trang_thai = 'completed'
            AND (v_user_role = 'admin' OR check_hang_hoa_permission(p_user_id, h.id, 'view') = TRUE)
        ), 0) as so_lan_nhap
    FROM hang_hoa h
    LEFT JOIN loai_hang_hoa lh ON h.loai_hang_hoa_id = lh.id
    LEFT JOIN phong_ban pb ON h.phong_ban_id = pb.id
    LEFT JOIN ton_kho tk ON h.id = tk.hang_hoa_id AND tk.phong_ban_id = h.phong_ban_id
    WHERE h.trang_thai = 'active'
    AND check_hang_hoa_permission(p_user_id, h.id, 'view') = TRUE
    AND (p_search = '' OR h.ten_hang_hoa ILIKE '%' || p_search || '%' OR h.ma_hang_hoa ILIKE '%' || p_search || '%')
    AND (p_loai_hang_hoa_id IS NULL OR h.loai_hang_hoa_id = p_loai_hang_hoa_id)
    ORDER BY h.created_at DESC
    LIMIT p_limit OFFSET v_offset;
END;
$$;


ALTER FUNCTION public.get_hang_hoa_with_permission(p_user_id integer, p_page integer, p_limit integer, p_search text, p_loai_hang_hoa_id integer) OWNER TO postgres;

--
-- TOC entry 341 (class 1255 OID 18411)
-- Name: get_kiem_ke_statistics(integer, date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_kiem_ke_statistics(p_phong_ban_id integer DEFAULT NULL::integer, p_tu_ngay date DEFAULT NULL::date, p_den_ngay date DEFAULT NULL::date) RETURNS TABLE(thang integer, nam integer, so_phieu_kiem_ke integer, tong_mat_hang integer, tong_chenh_lech_duong integer, tong_chenh_lech_am integer, gia_tri_chenh_lech numeric)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.get_kiem_ke_statistics(p_phong_ban_id integer, p_tu_ngay date, p_den_ngay date) OWNER TO postgres;

--
-- TOC entry 354 (class 1255 OID 27517)
-- Name: get_nha_cung_cap_by_loai_phieu(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_nha_cung_cap_by_loai_phieu(p_loai_phieu character varying) RETURNS TABLE(id integer, ma_ncc character varying, ten_ncc character varying, dia_chi text, phone character varying, email character varying, is_noi_bo boolean, phong_ban_id integer, ten_phong_ban character varying)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.get_nha_cung_cap_by_loai_phieu(p_loai_phieu character varying) OWNER TO postgres;

--
-- TOC entry 353 (class 1255 OID 18984)
-- Name: get_nha_cung_cap_with_noi_bo(integer, public.loai_phieu_nhap); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_nha_cung_cap_with_noi_bo(p_user_id integer DEFAULT NULL::integer, p_loai_phieu public.loai_phieu_nhap DEFAULT 'tu_mua'::public.loai_phieu_nhap) RETURNS TABLE(id integer, ma_ncc character varying, ten_ncc character varying, is_noi_bo boolean, phong_ban_id integer, ten_phong_ban character varying)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.get_nha_cung_cap_with_noi_bo(p_user_id integer, p_loai_phieu public.loai_phieu_nhap) OWNER TO postgres;

--
-- TOC entry 310 (class 1255 OID 19014)
-- Name: get_phong_ban_cap1(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_phong_ban_cap1() RETURNS TABLE(id integer, ma_phong_ban character varying, ten_phong_ban character varying, cap_bac integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac
    FROM phong_ban pb 
    WHERE pb.cap_bac = 1 AND pb.is_active = TRUE
    LIMIT 1;
END;
$$;


ALTER FUNCTION public.get_phong_ban_cap1() OWNER TO postgres;

--
-- TOC entry 320 (class 1255 OID 18862)
-- Name: get_phong_ban_co_the_cung_cap(integer, public.loai_phieu_nhap); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_phong_ban_co_the_cung_cap(p_phong_ban_nhan_id integer, p_loai_phieu public.loai_phieu_nhap) RETURNS TABLE(id integer, ma_phong_ban character varying, ten_phong_ban character varying, cap_bac integer)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.get_phong_ban_co_the_cung_cap(p_phong_ban_nhan_id integer, p_loai_phieu public.loai_phieu_nhap) OWNER TO postgres;

--
-- TOC entry 282 (class 1255 OID 19017)
-- Name: get_phong_ban_co_the_cung_cap_v2(integer, public.loai_phieu_nhap); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_phong_ban_co_the_cung_cap_v2(p_phong_ban_nhan_id integer, p_loai_phieu public.loai_phieu_nhap) RETURNS TABLE(id integer, ma_phong_ban character varying, ten_phong_ban character varying, cap_bac integer)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.get_phong_ban_co_the_cung_cap_v2(p_phong_ban_nhan_id integer, p_loai_phieu public.loai_phieu_nhap) OWNER TO postgres;

--
-- TOC entry 305 (class 1255 OID 18863)
-- Name: get_phong_ban_co_the_nhan_hang(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_phong_ban_co_the_nhan_hang(p_phong_ban_xuat_id integer) RETURNS TABLE(id integer, ma_phong_ban character varying, ten_phong_ban character varying, cap_bac integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT pb.id, pb.ma_phong_ban, pb.ten_phong_ban, pb.cap_bac
    FROM phong_ban pb
    JOIN quan_he_phong_ban qh ON qh.phong_ban_nhan_id = pb.id
    WHERE qh.phong_ban_cung_cap_id = p_phong_ban_xuat_id
    AND qh.is_active = TRUE
    ORDER BY pb.cap_bac DESC, pb.ten_phong_ban;
END;
$$;


ALTER FUNCTION public.get_phong_ban_co_the_nhan_hang(p_phong_ban_xuat_id integer) OWNER TO postgres;

--
-- TOC entry 295 (class 1255 OID 27518)
-- Name: get_phong_ban_dieu_chuyen(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_phong_ban_dieu_chuyen(p_user_phong_ban_id integer) RETURNS TABLE(id integer, ma_phong_ban character varying, ten_phong_ban character varying, cap_bac integer, so_hang_hoa_ton bigint)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.get_phong_ban_dieu_chuyen(p_user_phong_ban_id integer) OWNER TO postgres;

--
-- TOC entry 315 (class 1255 OID 18410)
-- Name: get_ton_kho_for_kiem_ke(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_ton_kho_for_kiem_ke(p_phong_ban_id integer) RETURNS TABLE(hang_hoa_id integer, ma_hang_hoa character varying, ten_hang_hoa character varying, don_vi_tinh character varying, ten_loai character varying, so_luong_ton numeric, sl_tot numeric, sl_kem_pham_chat numeric, sl_mat_pham_chat numeric, sl_hong numeric, sl_can_thanh_ly numeric, don_gia_moi_nhat numeric)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.get_ton_kho_for_kiem_ke(p_phong_ban_id integer) OWNER TO postgres;

--
-- TOC entry 336 (class 1255 OID 18354)
-- Name: get_ton_kho_thuc_te(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_ton_kho_thuc_te(p_hang_hoa_id integer, p_phong_ban_id integer) RETURNS TABLE(so_luong_ton numeric, so_luong_dang_cho_xuat numeric, so_luong_co_the_xuat numeric, don_gia_binh_quan numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(tk.so_luong_ton, 0) as so_luong_ton,
        COALESCE(
            (SELECT SUM(ctx.so_luong_yeu_cau)
             FROM chi_tiet_xuat ctx
             JOIN phieu_xuat px ON ctx.phieu_xuat_id = px.id
             WHERE ctx.hang_hoa_id = p_hang_hoa_id 
             AND px.phong_ban_id = p_phong_ban_id
             AND px.trang_thai IN ('draft', 'approved', 'confirmed')), 0
        ) as so_luong_dang_cho_xuat,
        GREATEST(0, 
            COALESCE(tk.so_luong_ton, 0) - 
            COALESCE(
                (SELECT SUM(ctx.so_luong_yeu_cau)
                 FROM chi_tiet_xuat ctx
                 JOIN phieu_xuat px ON ctx.phieu_xuat_id = px.id
                 WHERE ctx.hang_hoa_id = p_hang_hoa_id 
                 AND px.phong_ban_id = p_phong_ban_id
                 AND px.trang_thai IN ('draft', 'approved', 'confirmed')), 0
            )
        ) as so_luong_co_the_xuat,
        COALESCE(tk.don_gia_binh_quan, 0) as don_gia_binh_quan
    FROM ton_kho tk
    WHERE tk.hang_hoa_id = p_hang_hoa_id 
    AND tk.phong_ban_id = p_phong_ban_id;
END;
$$;


ALTER FUNCTION public.get_ton_kho_thuc_te(p_hang_hoa_id integer, p_phong_ban_id integer) OWNER TO postgres;

--
-- TOC entry 311 (class 1255 OID 18306)
-- Name: rebuild_ton_kho(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.rebuild_ton_kho() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    result_message TEXT := '';
    affected_rows INTEGER := 0;
    chi_tiet_record RECORD;
    v_pham_chat pham_chat;
BEGIN
    -- Bước 1: Xóa toàn bộ tồn kho hiện tại
    DELETE FROM ton_kho;
    DELETE FROM hang_hoa_seri WHERE trang_thai = 'ton_kho';
    
    result_message := result_message || 'Đã xóa dữ liệu tồn kho cũ.' || E'\n';
    
    -- Bước 2: Rebuild từ các phiếu nhập đã hoàn thành
    FOR chi_tiet_record IN 
        SELECT ctn.*, pn.phong_ban_id, pn.ngay_nhap
        FROM chi_tiet_nhap ctn
        JOIN phieu_nhap pn ON ctn.phieu_nhap_id = pn.id
        WHERE pn.trang_thai = 'completed'
        ORDER BY pn.ngay_nhap, pn.created_at, ctn.id
    LOOP
        v_pham_chat := COALESCE(chi_tiet_record.pham_chat, 'tot');
        
        -- Cập nhật tồn kho cho từng chi tiết
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
        )
        VALUES (
            chi_tiet_record.hang_hoa_id, 
            chi_tiet_record.phong_ban_id,
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
            
        -- Cập nhật số seri nếu có
        IF chi_tiet_record.so_seri_list IS NOT NULL AND array_length(chi_tiet_record.so_seri_list, 1) > 0 THEN
            INSERT INTO hang_hoa_seri (hang_hoa_id, so_seri, don_gia, ngay_nhap, phieu_nhap_id, pham_chat, trang_thai)
            SELECT 
                chi_tiet_record.hang_hoa_id, 
                unnest(chi_tiet_record.so_seri_list), 
                chi_tiet_record.don_gia, 
                chi_tiet_record.ngay_nhap,
                chi_tiet_record.phieu_nhap_id, 
                v_pham_chat,
                'ton_kho'
            ON CONFLICT (hang_hoa_id, so_seri) DO NOTHING;
        END IF;
        
        affected_rows := affected_rows + 1;
    END LOOP;
    
    result_message := result_message || 'Đã rebuild tồn kho từ ' || affected_rows || ' chi tiết phiếu nhập.' || E'\n';
    
    -- Bước 3: Cập nhật giá nhập gần nhất
    UPDATE hang_hoa 
    SET gia_nhap_gan_nhat = (
        SELECT ls.don_gia 
        FROM lich_su_gia ls
        JOIN phieu_nhap pn ON ls.phieu_nhap_id = pn.id
        WHERE ls.hang_hoa_id = hang_hoa.id 
        AND ls.nguon_gia = 'nhap_kho'
        AND pn.trang_thai = 'completed'
        ORDER BY ls.ngay_ap_dung DESC, ls.created_at DESC 
        LIMIT 1
    );
    
    result_message := result_message || 'Đã cập nhật giá nhập gần nhất.' || E'\n';
    result_message := result_message || 'Rebuild hoàn thành!';
    
    RETURN result_message;
END;
$$;


ALTER FUNCTION public.rebuild_ton_kho() OWNER TO postgres;

--
-- TOC entry 337 (class 1255 OID 18356)
-- Name: rebuild_ton_kho_completed_only(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.rebuild_ton_kho_completed_only() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    result_message TEXT := '';
    affected_rows INTEGER := 0;
    chi_tiet_record RECORD;
    v_pham_chat pham_chat;
BEGIN
    -- Bước 1: Xóa toàn bộ tồn kho hiện tại
    DELETE FROM ton_kho;
    DELETE FROM hang_hoa_seri WHERE trang_thai = 'ton_kho';
    
    result_message := result_message || 'Đã xóa dữ liệu tồn kho cũ.' || E'\n';
    
    -- Bước 2: Rebuild CHỈ từ các phiếu nhập đã hoàn thành
    FOR chi_tiet_record IN 
        SELECT ctn.*, pn.phong_ban_id, pn.ngay_nhap
        FROM chi_tiet_nhap ctn
        JOIN phieu_nhap pn ON ctn.phieu_nhap_id = pn.id
        WHERE pn.trang_thai = 'completed'
        ORDER BY pn.ngay_nhap, pn.created_at, ctn.id
    LOOP
        v_pham_chat := COALESCE(chi_tiet_record.pham_chat, 'tot');
        
        -- Cập nhật tồn kho cho từng chi tiết
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
        )
        VALUES (
            chi_tiet_record.hang_hoa_id, 
            chi_tiet_record.phong_ban_id,
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
            
        -- Cập nhật số seri nếu có
        IF chi_tiet_record.so_seri_list IS NOT NULL AND array_length(chi_tiet_record.so_seri_list, 1) > 0 THEN
            INSERT INTO hang_hoa_seri (hang_hoa_id, so_seri, don_gia, ngay_nhap, phieu_nhap_id, pham_chat, trang_thai)
            SELECT 
                chi_tiet_record.hang_hoa_id, 
                unnest(chi_tiet_record.so_seri_list), 
                chi_tiet_record.don_gia, 
                chi_tiet_record.ngay_nhap,
                chi_tiet_record.phieu_nhap_id, 
                v_pham_chat,
                'ton_kho'
            ON CONFLICT (hang_hoa_id, so_seri) DO NOTHING;
        END IF;
        
        affected_rows := affected_rows + 1;
    END LOOP;
    
    -- Bước 3: Trừ đi các phiếu xuất đã hoàn thành
    FOR chi_tiet_record IN 
        SELECT ctx.*, px.phong_ban_id
        FROM chi_tiet_xuat ctx
        JOIN phieu_xuat px ON ctx.phieu_xuat_id = px.id
        WHERE px.trang_thai = 'completed'
        ORDER BY px.ngay_xuat, px.created_at, ctx.id
    LOOP
        v_pham_chat := COALESCE(chi_tiet_record.pham_chat, 'tot');
        
        -- Trừ tồn kho cho từng chi tiết xuất
        UPDATE ton_kho 
        SET 
            sl_tot = GREATEST(0, sl_tot - CASE WHEN v_pham_chat = 'tot' THEN chi_tiet_record.so_luong_thuc_xuat ELSE 0 END),
            sl_kem_pham_chat = GREATEST(0, sl_kem_pham_chat - CASE WHEN v_pham_chat = 'kem_pham_chat' THEN chi_tiet_record.so_luong_thuc_xuat ELSE 0 END),
            sl_mat_pham_chat = GREATEST(0, sl_mat_pham_chat - CASE WHEN v_pham_chat = 'mat_pham_chat' THEN chi_tiet_record.so_luong_thuc_xuat ELSE 0 END),
            sl_hong = GREATEST(0, sl_hong - CASE WHEN v_pham_chat = 'hong' THEN chi_tiet_record.so_luong_thuc_xuat ELSE 0 END),
            sl_can_thanh_ly = GREATEST(0, sl_can_thanh_ly - CASE WHEN v_pham_chat = 'can_thanh_ly' THEN chi_tiet_record.so_luong_thuc_xuat ELSE 0 END),
            gia_tri_ton = GREATEST(0, gia_tri_ton - (chi_tiet_record.so_luong_thuc_xuat * chi_tiet_record.don_gia)),
            ngay_cap_nhat = CURRENT_TIMESTAMP
        WHERE hang_hoa_id = chi_tiet_record.hang_hoa_id 
        AND phong_ban_id = chi_tiet_record.phong_ban_id;
        
        -- Cập nhật trạng thái số seri đã xuất
        IF chi_tiet_record.so_seri_xuat IS NOT NULL AND array_length(chi_tiet_record.so_seri_xuat, 1) > 0 THEN
            UPDATE hang_hoa_seri 
            SET trang_thai = 'da_xuat'
            WHERE hang_hoa_id = chi_tiet_record.hang_hoa_id 
            AND so_seri = ANY(chi_tiet_record.so_seri_xuat);
        END IF;
    END LOOP;
    
    result_message := result_message || 'Đã rebuild tồn kho từ ' || affected_rows || ' chi tiết phiếu nhập hoàn thành.' || E'\n';
    
    -- Bước 4: Cập nhật giá nhập gần nhất chỉ từ phiếu hoàn thành
    UPDATE hang_hoa 
    SET gia_nhap_gan_nhat = (
        SELECT ls.don_gia 
        FROM lich_su_gia ls
        JOIN phieu_nhap pn ON ls.phieu_nhap_id = pn.id
        WHERE ls.hang_hoa_id = hang_hoa.id 
        AND ls.nguon_gia = 'nhap_kho'
        AND pn.trang_thai = 'completed'
        ORDER BY ls.ngay_ap_dung DESC, ls.created_at DESC 
        LIMIT 1
    );
    
    result_message := result_message || 'Đã cập nhật giá nhập gần nhất từ phiếu hoàn thành.' || E'\n';
    result_message := result_message || 'Rebuild hoàn thành!';
    
    RETURN result_message;
END;
$$;


ALTER FUNCTION public.rebuild_ton_kho_completed_only() OWNER TO postgres;

--
-- TOC entry 286 (class 1255 OID 27516)
-- Name: rebuild_ton_kho_data(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.rebuild_ton_kho_data() RETURNS text
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.rebuild_ton_kho_data() OWNER TO postgres;

--
-- TOC entry 293 (class 1255 OID 18292)
-- Name: reverse_ton_kho_nhap(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.reverse_ton_kho_nhap() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_phong_ban_id INTEGER;
    v_pham_chat pham_chat;
    v_phieu_trang_thai trang_thai_phieu;
BEGIN
    -- Lấy phòng ban và trạng thái phiếu
    SELECT phong_ban_id, trang_thai INTO v_phong_ban_id, v_phieu_trang_thai
    FROM phieu_nhap 
    WHERE id = OLD.phieu_nhap_id;
    
    -- Chỉ hoàn tác nếu phiếu đã được duyệt (completed)
    IF v_phieu_trang_thai != 'completed' THEN
        RETURN OLD;
    END IF;
    
    v_pham_chat := COALESCE(OLD.pham_chat, 'tot');
    
    -- Hoàn tác tồn kho theo phẩm chất
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
    
    -- Tính lại đơn giá bình quân nếu còn tồn kho
    UPDATE ton_kho 
    SET don_gia_binh_quan = CASE 
        WHEN so_luong_ton > 0 THEN gia_tri_ton / so_luong_ton
        ELSE 0 
    END
    WHERE hang_hoa_id = OLD.hang_hoa_id AND phong_ban_id = v_phong_ban_id;
    
    -- Xóa số seri liên quan nếu có
    IF OLD.so_seri_list IS NOT NULL AND array_length(OLD.so_seri_list, 1) > 0 THEN
        DELETE FROM hang_hoa_seri 
        WHERE hang_hoa_id = OLD.hang_hoa_id 
        AND so_seri = ANY(OLD.so_seri_list)
        AND phieu_nhap_id = OLD.phieu_nhap_id;
    END IF;
    
    RETURN OLD;
END;
$$;


ALTER FUNCTION public.reverse_ton_kho_nhap() OWNER TO postgres;

--
-- TOC entry 308 (class 1255 OID 18342)
-- Name: reverse_ton_kho_xuat(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.reverse_ton_kho_xuat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    chi_tiet_record RECORD;
    v_pham_chat pham_chat;
BEGIN
    -- Chỉ hoàn trả tồn kho khi phiếu bị hủy
    IF NEW.trang_thai = 'cancelled' AND OLD.trang_thai != 'cancelled' THEN
        -- Duyệt qua tất cả chi tiết xuất của phiếu bị hủy
        FOR chi_tiet_record IN 
            SELECT * FROM chi_tiet_xuat WHERE phieu_xuat_id = NEW.id
        LOOP
            v_pham_chat := COALESCE(chi_tiet_record.pham_chat, 'tot');
            
            -- Hoàn trả số lượng yêu cầu (không phải thực xuất) vào tồn kho
            UPDATE ton_kho 
            SET 
                sl_tot = sl_tot + CASE WHEN v_pham_chat = 'tot' THEN chi_tiet_record.so_luong_yeu_cau ELSE 0 END,
                sl_kem_pham_chat = sl_kem_pham_chat + CASE WHEN v_pham_chat = 'kem_pham_chat' THEN chi_tiet_record.so_luong_yeu_cau ELSE 0 END,
                sl_mat_pham_chat = sl_mat_pham_chat + CASE WHEN v_pham_chat = 'mat_pham_chat' THEN chi_tiet_record.so_luong_yeu_cau ELSE 0 END,
                sl_hong = sl_hong + CASE WHEN v_pham_chat = 'hong' THEN chi_tiet_record.so_luong_yeu_cau ELSE 0 END,
                sl_can_thanh_ly = sl_can_thanh_ly + CASE WHEN v_pham_chat = 'can_thanh_ly' THEN chi_tiet_record.so_luong_yeu_cau ELSE 0 END,
                gia_tri_ton = gia_tri_ton + (chi_tiet_record.so_luong_yeu_cau * chi_tiet_record.don_gia),
                ngay_cap_nhat = CURRENT_TIMESTAMP
            WHERE hang_hoa_id = chi_tiet_record.hang_hoa_id AND phong_ban_id = NEW.phong_ban_id;
            
            -- Hoàn trả trạng thái số seri về tồn kho nếu có
            IF chi_tiet_record.so_seri_xuat IS NOT NULL AND array_length(chi_tiet_record.so_seri_xuat, 1) > 0 THEN
                UPDATE hang_hoa_seri 
                SET trang_thai = 'ton_kho'
                WHERE hang_hoa_id = chi_tiet_record.hang_hoa_id 
                AND so_seri = ANY(chi_tiet_record.so_seri_xuat)
                AND trang_thai = 'da_xuat';
            END IF;
        END LOOP;
        
        RAISE NOTICE 'Đã hoàn trả tồn kho cho phiếu xuất bị hủy: %', NEW.so_phieu;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.reverse_ton_kho_xuat() OWNER TO postgres;

--
-- TOC entry 285 (class 1255 OID 18294)
-- Name: update_gia_nhap_gan_nhat(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_gia_nhap_gan_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Cập nhật giá nhập gần nhất cho hàng hóa dựa trên lịch sử giá
    UPDATE hang_hoa 
    SET gia_nhap_gan_nhat = (
        SELECT don_gia 
        FROM lich_su_gia 
        WHERE hang_hoa_id = NEW.hang_hoa_id 
        AND nguon_gia = 'nhap_kho'
        ORDER BY ngay_ap_dung DESC, created_at DESC 
        LIMIT 1
    )
    WHERE id = NEW.hang_hoa_id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_gia_nhap_gan_nhat() OWNER TO postgres;

--
-- TOC entry 280 (class 1255 OID 18346)
-- Name: update_so_luong_thuc_xuat(integer, integer, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_so_luong_thuc_xuat(p_phieu_xuat_id integer, p_hang_hoa_id integer, p_so_luong_thuc_xuat numeric) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    result_message TEXT;
BEGIN
    -- Cập nhật số lượng thực xuất cho chi tiết cụ thể
    UPDATE chi_tiet_xuat 
    SET 
        so_luong_thuc_xuat = p_so_luong_thuc_xuat,
        thanh_tien = p_so_luong_thuc_xuat * don_gia
    WHERE phieu_xuat_id = p_phieu_xuat_id 
    AND hang_hoa_id = p_hang_hoa_id;
    
    -- Cập nhật lại tổng tiền phiếu xuất
    UPDATE phieu_xuat 
    SET tong_tien = (
        SELECT COALESCE(SUM(thanh_tien), 0) 
        FROM chi_tiet_xuat 
        WHERE phieu_xuat_id = p_phieu_xuat_id
    )
    WHERE id = p_phieu_xuat_id;
    
    result_message := 'Đã cập nhật số lượng thực xuất thành công';
    
    RETURN result_message;
END;
$$;


ALTER FUNCTION public.update_so_luong_thuc_xuat(p_phieu_xuat_id integer, p_hang_hoa_id integer, p_so_luong_thuc_xuat numeric) OWNER TO postgres;

--
-- TOC entry 330 (class 1255 OID 18406)
-- Name: update_ton_kho_after_kiem_ke(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_ton_kho_after_kiem_ke() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Chỉ xử lý khi phiếu chuyển từ trạng thái khác sang 'confirmed'
    IF OLD.trang_thai != 'confirmed' AND NEW.trang_thai = 'confirmed' THEN
        -- Cập nhật tồn kho dựa trên kết quả kiểm kê
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

        -- Lưu lịch sử kiểm kê
        INSERT INTO lich_su_kiem_ke (
            hang_hoa_id, phieu_kiem_ke_id, phong_ban_id, ngay_kiem_ke,
            so_luong_so_sach, so_luong_thuc_te, chenh_lech,
            sl_tot, sl_kem_pham_chat, sl_mat_pham_chat, sl_hong, sl_can_thanh_ly,
            don_gia, gia_tri_chenh_lech, ly_do_chenh_lech, de_nghi_xu_ly
        )
        SELECT 
            ctkk.hang_hoa_id, NEW.id, NEW.phong_ban_id, NEW.ngay_kiem_ke,
            ctkk.so_luong_so_sach,
            ctkk.so_luong_thuc_te,
            ctkk.so_luong_chenh_lech,
            ctkk.sl_tot, ctkk.sl_kem_pham_chat, ctkk.sl_mat_pham_chat, ctkk.sl_hong, ctkk.sl_can_thanh_ly,
            ctkk.don_gia,
            ctkk.gia_tri_chenh_lech,
            ctkk.ly_do_chenh_lech, ctkk.de_nghi_xu_ly
        FROM chi_tiet_kiem_ke ctkk
        WHERE ctkk.phieu_kiem_ke_id = NEW.id;

        -- Cập nhật trạng thái số seri dựa trên kết quả kiểm kê
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
$$;


ALTER FUNCTION public.update_ton_kho_after_kiem_ke() OWNER TO postgres;

--
-- TOC entry 291 (class 1255 OID 18865)
-- Name: update_ton_kho_after_xuat(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_ton_kho_after_xuat(p_phieu_xuat_id integer, p_phong_ban_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    chi_tiet_record RECORD;
    v_pham_chat pham_chat;
BEGIN
    FOR chi_tiet_record IN
        SELECT * FROM chi_tiet_xuat WHERE phieu_xuat_id = p_phieu_xuat_id
    LOOP
        v_pham_chat := COALESCE(chi_tiet_record.pham_chat, 'tot');
        
        -- Trừ tồn kho theo phẩm chất
        UPDATE ton_kho 
        SET 
            sl_tot = GREATEST(0, sl_tot - CASE WHEN v_pham_chat = 'tot' THEN chi_tiet_record.so_luong_thuc_xuat ELSE 0 END),
            sl_kem_pham_chat = GREATEST(0, sl_kem_pham_chat - CASE WHEN v_pham_chat = 'kem_pham_chat' THEN chi_tiet_record.so_luong_thuc_xuat ELSE 0 END),
            sl_mat_pham_chat = GREATEST(0, sl_mat_pham_chat - CASE WHEN v_pham_chat = 'mat_pham_chat' THEN chi_tiet_record.so_luong_thuc_xuat ELSE 0 END),
            sl_hong = GREATEST(0, sl_hong - CASE WHEN v_pham_chat = 'hong' THEN chi_tiet_record.so_luong_thuc_xuat ELSE 0 END),
            sl_can_thanh_ly = GREATEST(0, sl_can_thanh_ly - CASE WHEN v_pham_chat = 'can_thanh_ly' THEN chi_tiet_record.so_luong_thuc_xuat ELSE 0 END),
            gia_tri_ton = GREATEST(0, gia_tri_ton - (chi_tiet_record.so_luong_thuc_xuat * chi_tiet_record.don_gia)),
            ngay_cap_nhat = CURRENT_TIMESTAMP
        WHERE hang_hoa_id = chi_tiet_record.hang_hoa_id 
        AND phong_ban_id = p_phong_ban_id;
        
        -- Cập nhật trạng thái số seri
        IF chi_tiet_record.so_seri_xuat IS NOT NULL AND array_length(chi_tiet_record.so_seri_xuat, 1) > 0 THEN
            UPDATE hang_hoa_seri 
            SET trang_thai = 'da_xuat'
            WHERE hang_hoa_id = chi_tiet_record.hang_hoa_id 
            AND so_seri = ANY(chi_tiet_record.so_seri_xuat)
            AND EXISTS (
                SELECT 1 FROM phieu_nhap pn 
                WHERE pn.phong_ban_id = p_phong_ban_id 
                AND pn.id = hang_hoa_seri.phieu_nhap_id
            );
        END IF;
    END LOOP;
END;
$$;


ALTER FUNCTION public.update_ton_kho_after_xuat(p_phieu_xuat_id integer, p_phong_ban_id integer) OWNER TO postgres;

--
-- TOC entry 327 (class 1255 OID 18185)
-- Name: update_ton_kho_nhap(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_ton_kho_nhap() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_phong_ban_id INTEGER;
    v_pham_chat pham_chat;
    v_current_ton DECIMAL(10,2);
    v_current_gia_tri DECIMAL(15,2);
    v_phieu_trang_thai trang_thai_phieu;
BEGIN
    -- Lấy phòng ban và trạng thái phiếu từ phiếu nhập
    SELECT phong_ban_id, trang_thai INTO v_phong_ban_id, v_phieu_trang_thai
    FROM phieu_nhap 
    WHERE id = NEW.phieu_nhap_id;
    
    v_pham_chat := COALESCE(NEW.pham_chat, 'tot');
    
    -- Luôn cập nhật giá nhập gần nhất và lưu lịch sử giá
    UPDATE hang_hoa 
    SET gia_nhap_gan_nhat = NEW.don_gia 
    WHERE id = NEW.hang_hoa_id;
    
    -- Lưu lịch sử giá
    INSERT INTO lich_su_gia (hang_hoa_id, phieu_nhap_id, don_gia, ngay_ap_dung, nguon_gia)
    SELECT 
        NEW.hang_hoa_id, 
        NEW.phieu_nhap_id, 
        NEW.don_gia, 
        pn.ngay_nhap, 
        'nhap_kho'
    FROM phieu_nhap pn 
    WHERE pn.id = NEW.phieu_nhap_id
    ON CONFLICT (hang_hoa_id, phieu_nhap_id, nguon_gia, ngay_ap_dung) DO NOTHING;
    
    -- CHỈ cập nhật tồn kho khi phiếu đã được hoàn thành (completed)
    IF v_phieu_trang_thai = 'completed' THEN
        -- Lấy tồn kho hiện tại
        SELECT COALESCE(so_luong_ton, 0), COALESCE(gia_tri_ton, 0)
        INTO v_current_ton, v_current_gia_tri
        FROM ton_kho 
        WHERE hang_hoa_id = NEW.hang_hoa_id AND phong_ban_id = v_phong_ban_id;
        
        -- Cập nhật hoặc tạo mới record tồn kho
        INSERT INTO ton_kho (
            hang_hoa_id, 
            phong_ban_id, 
            sl_tot, 
            sl_kem_pham_chat, 
            sl_mat_pham_chat, 
            sl_hong, 
            sl_can_thanh_ly, 
            gia_tri_ton, 
            don_gia_binh_quan
        )
        VALUES (
            NEW.hang_hoa_id, 
            v_phong_ban_id,
            CASE WHEN v_pham_chat = 'tot' THEN NEW.so_luong ELSE 0 END,
            CASE WHEN v_pham_chat = 'kem_pham_chat' THEN NEW.so_luong ELSE 0 END,
            CASE WHEN v_pham_chat = 'mat_pham_chat' THEN NEW.so_luong ELSE 0 END,
            CASE WHEN v_pham_chat = 'hong' THEN NEW.so_luong ELSE 0 END,
            CASE WHEN v_pham_chat = 'can_thanh_ly' THEN NEW.so_luong ELSE 0 END,
            NEW.thanh_tien, 
            NEW.don_gia
        )
        ON CONFLICT (hang_hoa_id, phong_ban_id) 
        DO UPDATE SET
            sl_tot = ton_kho.sl_tot + CASE WHEN v_pham_chat = 'tot' THEN NEW.so_luong ELSE 0 END,
            sl_kem_pham_chat = ton_kho.sl_kem_pham_chat + CASE WHEN v_pham_chat = 'kem_pham_chat' THEN NEW.so_luong ELSE 0 END,
            sl_mat_pham_chat = ton_kho.sl_mat_pham_chat + CASE WHEN v_pham_chat = 'mat_pham_chat' THEN NEW.so_luong ELSE 0 END,
            sl_hong = ton_kho.sl_hong + CASE WHEN v_pham_chat = 'hong' THEN NEW.so_luong ELSE 0 END,
            sl_can_thanh_ly = ton_kho.sl_can_thanh_ly + CASE WHEN v_pham_chat = 'can_thanh_ly' THEN NEW.so_luong ELSE 0 END,
            gia_tri_ton = ton_kho.gia_tri_ton + NEW.thanh_tien,
            don_gia_binh_quan = CASE 
                WHEN (ton_kho.so_luong_ton + NEW.so_luong) > 0 
                THEN (ton_kho.gia_tri_ton + NEW.thanh_tien) / (ton_kho.so_luong_ton + NEW.so_luong)
                ELSE NEW.don_gia 
            END,
            ngay_cap_nhat = CURRENT_TIMESTAMP;
        
        -- Cập nhật số seri nếu có
        IF NEW.so_seri_list IS NOT NULL AND array_length(NEW.so_seri_list, 1) > 0 THEN
            INSERT INTO hang_hoa_seri (hang_hoa_id, so_seri, don_gia, ngay_nhap, phieu_nhap_id, pham_chat)
            SELECT 
                NEW.hang_hoa_id, 
                unnest(NEW.so_seri_list), 
                NEW.don_gia, 
                pn.ngay_nhap,
                NEW.phieu_nhap_id, 
                v_pham_chat
            FROM phieu_nhap pn 
            WHERE pn.id = NEW.phieu_nhap_id
            ON CONFLICT (hang_hoa_id, so_seri) DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_ton_kho_nhap() OWNER TO postgres;

--
-- TOC entry 334 (class 1255 OID 18353)
-- Name: update_ton_kho_nhap_v2(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_ton_kho_nhap_v2() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_phong_ban_id INTEGER;
    v_pham_chat pham_chat;
    v_phieu_trang_thai trang_thai_phieu;
BEGIN
    -- Lấy phòng ban và trạng thái phiếu từ phiếu nhập
    SELECT phong_ban_id, trang_thai INTO v_phong_ban_id, v_phieu_trang_thai
    FROM phieu_nhap 
    WHERE id = NEW.phieu_nhap_id;
    
    v_pham_chat := COALESCE(NEW.pham_chat, 'tot');
    
    -- Luôn cập nhật giá nhập gần nhất và lưu lịch sử giá
    UPDATE hang_hoa 
    SET gia_nhap_gan_nhat = NEW.don_gia 
    WHERE id = NEW.hang_hoa_id;
    
    -- Lưu lịch sử giá (chỉ khi phiếu hoàn thành)
    IF v_phieu_trang_thai = 'completed' THEN
        INSERT INTO lich_su_gia (hang_hoa_id, phieu_nhap_id, don_gia, ngay_ap_dung, nguon_gia)
        SELECT 
            NEW.hang_hoa_id, 
            NEW.phieu_nhap_id, 
            NEW.don_gia, 
            pn.ngay_nhap, 
            'nhap_kho'
        FROM phieu_nhap pn 
        WHERE pn.id = NEW.phieu_nhap_id
        ON CONFLICT (hang_hoa_id, phieu_nhap_id, nguon_gia, ngay_ap_dung) DO NOTHING;
    END IF;
    
    -- CHỈ cập nhật tồn kho khi phiếu đã được hoàn thành (completed)
    IF v_phieu_trang_thai = 'completed' THEN
        -- Cập nhật hoặc tạo mới record tồn kho
        INSERT INTO ton_kho (
            hang_hoa_id, 
            phong_ban_id, 
            sl_tot, 
            sl_kem_pham_chat, 
            sl_mat_pham_chat, 
            sl_hong, 
            sl_can_thanh_ly, 
            gia_tri_ton, 
            don_gia_binh_quan
        )
        VALUES (
            NEW.hang_hoa_id, 
            v_phong_ban_id,
            CASE WHEN v_pham_chat = 'tot' THEN NEW.so_luong ELSE 0 END,
            CASE WHEN v_pham_chat = 'kem_pham_chat' THEN NEW.so_luong ELSE 0 END,
            CASE WHEN v_pham_chat = 'mat_pham_chat' THEN NEW.so_luong ELSE 0 END,
            CASE WHEN v_pham_chat = 'hong' THEN NEW.so_luong ELSE 0 END,
            CASE WHEN v_pham_chat = 'can_thanh_ly' THEN NEW.so_luong ELSE 0 END,
            NEW.thanh_tien, 
            NEW.don_gia
        )
        ON CONFLICT (hang_hoa_id, phong_ban_id) 
        DO UPDATE SET
            sl_tot = ton_kho.sl_tot + CASE WHEN v_pham_chat = 'tot' THEN NEW.so_luong ELSE 0 END,
            sl_kem_pham_chat = ton_kho.sl_kem_pham_chat + CASE WHEN v_pham_chat = 'kem_pham_chat' THEN NEW.so_luong ELSE 0 END,
            sl_mat_pham_chat = ton_kho.sl_mat_pham_chat + CASE WHEN v_pham_chat = 'mat_pham_chat' THEN NEW.so_luong ELSE 0 END,
            sl_hong = ton_kho.sl_hong + CASE WHEN v_pham_chat = 'hong' THEN NEW.so_luong ELSE 0 END,
            sl_can_thanh_ly = ton_kho.sl_can_thanh_ly + CASE WHEN v_pham_chat = 'can_thanh_ly' THEN NEW.so_luong ELSE 0 END,
            gia_tri_ton = ton_kho.gia_tri_ton + NEW.thanh_tien,
            don_gia_binh_quan = CASE 
                WHEN (ton_kho.so_luong_ton + NEW.so_luong) > 0 
                THEN (ton_kho.gia_tri_ton + NEW.thanh_tien) / (ton_kho.so_luong_ton + NEW.so_luong)
                ELSE NEW.don_gia 
            END,
            ngay_cap_nhat = CURRENT_TIMESTAMP;
        
        -- Cập nhật số seri nếu có
        IF NEW.so_seri_list IS NOT NULL AND array_length(NEW.so_seri_list, 1) > 0 THEN
            INSERT INTO hang_hoa_seri (hang_hoa_id, so_seri, don_gia, ngay_nhap, phieu_nhap_id, pham_chat)
            SELECT 
                NEW.hang_hoa_id, 
                unnest(NEW.so_seri_list), 
                NEW.don_gia, 
                pn.ngay_nhap,
                NEW.phieu_nhap_id, 
                v_pham_chat
            FROM phieu_nhap pn 
            WHERE pn.id = NEW.phieu_nhap_id
            ON CONFLICT (hang_hoa_id, so_seri) DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_ton_kho_nhap_v2() OWNER TO postgres;

--
-- TOC entry 277 (class 1255 OID 27513)
-- Name: update_ton_kho_unified(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_ton_kho_unified() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.update_ton_kho_unified() OWNER TO postgres;

--
-- TOC entry 292 (class 1255 OID 18359)
-- Name: update_ton_kho_when_completed(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_ton_kho_when_completed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    chi_tiet_record RECORD;
    v_don_gia_ton DECIMAL(15,2);
    v_pham_chat pham_chat;
    v_so_luong_xuat DECIMAL(10,2);
    fifo_record RECORD;
    v_so_luong_can_xuat DECIMAL(10,2);
    v_so_luong_co_the_xuat DECIMAL(10,2);
BEGIN
    -- Chỉ xử lý khi phiếu chuyển sang completed
    IF NEW.trang_thai = 'completed' AND OLD.trang_thai != 'completed' THEN
        
        -- Duyệt qua từng chi tiết xuất
        FOR chi_tiet_record IN
            SELECT ctx.*
            FROM chi_tiet_xuat ctx
            WHERE ctx.phieu_xuat_id = NEW.id
        LOOP
            v_pham_chat := chi_tiet_record.pham_chat;
            v_so_luong_xuat := chi_tiet_record.so_luong_thuc_xuat;
            
            -- Lấy đơn giá bình quân hiện tại
            SELECT don_gia_binh_quan INTO v_don_gia_ton
            FROM ton_kho
            WHERE hang_hoa_id = chi_tiet_record.hang_hoa_id
            AND phong_ban_id = NEW.phong_ban_id;

            -- THEO NGUYÊN TẮC FIFO: Tìm phiếu nhập cũ nhất còn hàng
            v_so_luong_can_xuat := v_so_luong_xuat;
            
            FOR fifo_record IN
                SELECT 
                    pn.id as phieu_nhap_id,
                    pn.loai_phieu,
                    pn.ngay_nhap,
                    ctn.so_luong,
                    -- Tính số lượng đã xuất từ phiếu nhập này
                    COALESCE((
                        SELECT SUM(ctx2.so_luong_thuc_xuat)
                        FROM chi_tiet_xuat ctx2
                        WHERE ctx2.phieu_nhap_id = pn.id
                        AND ctx2.hang_hoa_id = chi_tiet_record.hang_hoa_id
                    ), 0) as da_xuat,
                    -- Số lượng còn lại có thể xuất
                    (ctn.so_luong - COALESCE((
                        SELECT SUM(ctx2.so_luong_thuc_xuat)
                        FROM chi_tiet_xuat ctx2
                        WHERE ctx2.phieu_nhap_id = pn.id
                        AND ctx2.hang_hoa_id = chi_tiet_record.hang_hoa_id
                    ), 0)) as con_lai
                FROM phieu_nhap pn
                JOIN chi_tiet_nhap ctn ON pn.id = ctn.phieu_nhap_id
                WHERE ctn.hang_hoa_id = chi_tiet_record.hang_hoa_id
                AND pn.trang_thai = 'completed'
                AND pn.phong_ban_id = NEW.phong_ban_id
                AND (ctn.so_luong - COALESCE((
                    SELECT SUM(ctx2.so_luong_thuc_xuat)
                    FROM chi_tiet_xuat ctx2
                    WHERE ctx2.phieu_nhap_id = pn.id
                    AND ctx2.hang_hoa_id = chi_tiet_record.hang_hoa_id
                ), 0)) > 0
                ORDER BY pn.ngay_nhap ASC, pn.created_at ASC -- FIFO: Nhập trước xuất trước
            LOOP
                EXIT WHEN v_so_luong_can_xuat <= 0;
                
                -- Tính số lượng sẽ xuất từ lô này
                v_so_luong_co_the_xuat := LEAST(v_so_luong_can_xuat, fifo_record.con_lai);
                
                IF v_so_luong_co_the_xuat > 0 THEN
                 
                    
                    -- Cập nhật trường trong chi_tiet_xuat chính (nếu chưa có)
                    UPDATE chi_tiet_xuat
                    SET 
                        phieu_nhap_id = CASE 
                            WHEN phieu_nhap_id IS NULL THEN fifo_record.phieu_nhap_id 
                            ELSE phieu_nhap_id 
                        END,
                        loai_phieu_nhap = CASE 
                            WHEN loai_phieu_nhap IS NULL THEN fifo_record.loai_phieu 
                            ELSE loai_phieu_nhap 
                        END
                    WHERE id = chi_tiet_record.id;
                    
                    v_so_luong_can_xuat := v_so_luong_can_xuat - v_so_luong_co_the_xuat;
                END IF;
            END LOOP;

            -- Cập nhật tồn kho (logic cũ)
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

            -- Cập nhật số seri
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
$$;


ALTER FUNCTION public.update_ton_kho_when_completed() OWNER TO postgres;

--
-- TOC entry 348 (class 1255 OID 18179)
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at() OWNER TO postgres;

--
-- TOC entry 303 (class 1255 OID 18725)
-- Name: update_yeu_cau_metadata(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_yeu_cau_metadata() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_tong_gia_tri DECIMAL(15,2);
    v_so_mat_hang INTEGER;
    v_table_name VARCHAR;
    v_yeu_cau_id INTEGER;
BEGIN
    -- Xác định bảng và ID
    IF TG_TABLE_NAME = 'chi_tiet_yeu_cau_nhap' THEN
        v_table_name := 'yeu_cau_nhap_kho';
        v_yeu_cau_id := COALESCE(NEW.yeu_cau_nhap_id, OLD.yeu_cau_nhap_id);
        
        -- Tính toán metadata cho yêu cầu nhập
        SELECT 
            COALESCE(SUM(so_luong_yeu_cau * don_gia_uoc_tinh), 0),
            COUNT(*)
        INTO v_tong_gia_tri, v_so_mat_hang
        FROM chi_tiet_yeu_cau_nhap 
        WHERE yeu_cau_nhap_id = v_yeu_cau_id;
        
        -- Cập nhật bảng yêu cầu nhập
        UPDATE yeu_cau_nhap_kho 
        SET 
            tong_gia_tri_uoc_tinh = v_tong_gia_tri,
            so_mat_hang = v_so_mat_hang,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_yeu_cau_id;
        
    ELSIF TG_TABLE_NAME = 'chi_tiet_yeu_cau_xuat' THEN
        v_table_name := 'yeu_cau_xuat_kho';
        v_yeu_cau_id := COALESCE(NEW.yeu_cau_xuat_id, OLD.yeu_cau_xuat_id);
        
        -- Tính toán metadata cho yêu cầu xuất
        SELECT 
            COALESCE(SUM(so_luong_yeu_cau * don_gia_uoc_tinh), 0),
            COUNT(*)
        INTO v_tong_gia_tri, v_so_mat_hang
        FROM chi_tiet_yeu_cau_xuat 
        WHERE yeu_cau_xuat_id = v_yeu_cau_id;
        
        -- Cập nhật bảng yêu cầu xuất
        UPDATE yeu_cau_xuat_kho 
        SET 
            tong_gia_tri_uoc_tinh = v_tong_gia_tri,
            so_mat_hang = v_so_mat_hang,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_yeu_cau_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.update_yeu_cau_metadata() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 262 (class 1259 OID 27554)
-- Name: chi_tiet_kiem_ke; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chi_tiet_kiem_ke (
    id integer NOT NULL,
    phieu_kiem_ke_id integer NOT NULL,
    hang_hoa_id integer NOT NULL,
    so_luong_so_sach numeric(10,2) NOT NULL,
    sl_tot numeric(10,2) DEFAULT 0,
    sl_kem_pham_chat numeric(10,2) DEFAULT 0,
    sl_mat_pham_chat numeric(10,2) DEFAULT 0,
    sl_hong numeric(10,2) DEFAULT 0,
    sl_can_thanh_ly numeric(10,2) DEFAULT 0,
    so_luong_thuc_te numeric(10,2) GENERATED ALWAYS AS (((((sl_tot + sl_kem_pham_chat) + sl_mat_pham_chat) + sl_hong) + sl_can_thanh_ly)) STORED,
    so_luong_chenh_lech numeric(10,2) GENERATED ALWAYS AS ((((((sl_tot + sl_kem_pham_chat) + sl_mat_pham_chat) + sl_hong) + sl_can_thanh_ly) - so_luong_so_sach)) STORED,
    don_gia numeric(15,2) NOT NULL,
    gia_tri_tot numeric(15,2) GENERATED ALWAYS AS ((sl_tot * don_gia)) STORED,
    gia_tri_kem numeric(15,2) GENERATED ALWAYS AS (((sl_kem_pham_chat * don_gia) * 0.7)) STORED,
    gia_tri_mat numeric(15,2) GENERATED ALWAYS AS (((sl_mat_pham_chat * don_gia) * 0.3)) STORED,
    gia_tri_hong numeric(15,2) DEFAULT 0,
    gia_tri_thanh_ly numeric(15,2) GENERATED ALWAYS AS (((sl_can_thanh_ly * don_gia) * 0.1)) STORED,
    gia_tri_chenh_lech numeric(15,2) GENERATED ALWAYS AS (((((((sl_tot * don_gia) + ((sl_kem_pham_chat * don_gia) * 0.7)) + ((sl_mat_pham_chat * don_gia) * 0.3)) + (0)::numeric) + ((sl_can_thanh_ly * don_gia) * 0.1)) - (so_luong_so_sach * don_gia))) STORED,
    ly_do_chenh_lech text,
    de_nghi_xu_ly text,
    danh_sach_seri_kiem_ke text[],
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.chi_tiet_kiem_ke OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 27553)
-- Name: chi_tiet_kiem_ke_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chi_tiet_kiem_ke_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chi_tiet_kiem_ke_id_seq OWNER TO postgres;

--
-- TOC entry 5449 (class 0 OID 0)
-- Dependencies: 261
-- Name: chi_tiet_kiem_ke_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chi_tiet_kiem_ke_id_seq OWNED BY public.chi_tiet_kiem_ke.id;


--
-- TOC entry 233 (class 1259 OID 17945)
-- Name: chi_tiet_nhap; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chi_tiet_nhap (
    id integer NOT NULL,
    phieu_nhap_id integer NOT NULL,
    hang_hoa_id integer NOT NULL,
    so_luong numeric(10,2) NOT NULL,
    don_gia numeric(15,2) NOT NULL,
    thanh_tien numeric(15,2) NOT NULL,
    so_seri_list text[],
    pham_chat public.pham_chat DEFAULT 'tot'::public.pham_chat,
    han_su_dung date,
    vi_tri_kho character varying(100),
    ghi_chu text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    so_luong_ke_hoach numeric(10,2) DEFAULT 0 NOT NULL,
    la_tai_san_co_dinh boolean DEFAULT false,
    CONSTRAINT check_so_seri_list_valid CHECK (((so_seri_list IS NULL) OR ((array_length(so_seri_list, 1) > 0) AND (''::text <> ALL (so_seri_list)))))
);


ALTER TABLE public.chi_tiet_nhap OWNER TO postgres;

--
-- TOC entry 5450 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN chi_tiet_nhap.so_luong; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.chi_tiet_nhap.so_luong IS 'Số lượng thực nhập, ảnh hưởng đến tồn kho';


--
-- TOC entry 5451 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN chi_tiet_nhap.so_luong_ke_hoach; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.chi_tiet_nhap.so_luong_ke_hoach IS 'Số lượng dự kiến ban đầu, cố định sau khi duyệt';


--
-- TOC entry 232 (class 1259 OID 17944)
-- Name: chi_tiet_nhap_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chi_tiet_nhap_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chi_tiet_nhap_id_seq OWNER TO postgres;

--
-- TOC entry 5452 (class 0 OID 0)
-- Dependencies: 232
-- Name: chi_tiet_nhap_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chi_tiet_nhap_id_seq OWNED BY public.chi_tiet_nhap.id;


--
-- TOC entry 239 (class 1259 OID 18016)
-- Name: chi_tiet_xuat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chi_tiet_xuat (
    id integer NOT NULL,
    phieu_xuat_id integer NOT NULL,
    hang_hoa_id integer NOT NULL,
    so_luong_yeu_cau numeric(10,2) NOT NULL,
    so_luong_thuc_xuat numeric(10,2) NOT NULL,
    don_gia numeric(15,2) NOT NULL,
    thanh_tien numeric(15,2) NOT NULL,
    so_seri_xuat text[],
    pham_chat public.pham_chat DEFAULT 'tot'::public.pham_chat,
    ghi_chu text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    phieu_nhap_id integer,
    loai_phieu_nhap public.loai_phieu_nhap
);


ALTER TABLE public.chi_tiet_xuat OWNER TO postgres;

--
-- TOC entry 5453 (class 0 OID 0)
-- Dependencies: 239
-- Name: COLUMN chi_tiet_xuat.phieu_nhap_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.chi_tiet_xuat.phieu_nhap_id IS 'ID của phiếu nhập cung cấp hàng hóa cho chi tiết xuất này';


--
-- TOC entry 5454 (class 0 OID 0)
-- Dependencies: 239
-- Name: COLUMN chi_tiet_xuat.loai_phieu_nhap; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.chi_tiet_xuat.loai_phieu_nhap IS 'Loại phiếu nhập (tu_mua, tren_cap, dieu_chuyen)';


--
-- TOC entry 238 (class 1259 OID 18015)
-- Name: chi_tiet_xuat_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chi_tiet_xuat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chi_tiet_xuat_id_seq OWNER TO postgres;

--
-- TOC entry 5455 (class 0 OID 0)
-- Dependencies: 238
-- Name: chi_tiet_xuat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chi_tiet_xuat_id_seq OWNED BY public.chi_tiet_xuat.id;


--
-- TOC entry 252 (class 1259 OID 18656)
-- Name: digital_signatures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.digital_signatures (
    id integer NOT NULL,
    user_id integer NOT NULL,
    yeu_cau_id integer NOT NULL,
    action_type character varying(50) NOT NULL,
    signature_hash text NOT NULL,
    signature_data text NOT NULL,
    public_key text,
    ip_address inet NOT NULL,
    user_agent text,
    browser_fingerprint text,
    is_verified boolean DEFAULT false,
    verified_at timestamp with time zone,
    verified_by integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.digital_signatures OWNER TO postgres;

--
-- TOC entry 5456 (class 0 OID 0)
-- Dependencies: 252
-- Name: TABLE digital_signatures; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.digital_signatures IS 'Lưu trữ chữ ký số cho các quyết định quan trọng';


--
-- TOC entry 251 (class 1259 OID 18655)
-- Name: digital_signatures_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.digital_signatures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.digital_signatures_id_seq OWNER TO postgres;

--
-- TOC entry 5457 (class 0 OID 0)
-- Dependencies: 251
-- Name: digital_signatures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.digital_signatures_id_seq OWNED BY public.digital_signatures.id;


--
-- TOC entry 235 (class 1259 OID 17966)
-- Name: don_vi_nhan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.don_vi_nhan (
    id integer NOT NULL,
    ma_don_vi character varying(20) NOT NULL,
    ten_don_vi character varying(200) NOT NULL,
    loai_don_vi public.loai_don_vi DEFAULT 'phong_ban'::public.loai_don_vi,
    dia_chi text,
    nguoi_lien_he character varying(100),
    so_dien_thoai_old character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    so_dien_thoai character varying(20),
    email character varying(100),
    chuc_vu_nguoi_lien_he character varying(100),
    phong_ban_id integer,
    ghi_chu text,
    trang_thai character varying(20) DEFAULT 'active'::character varying,
    nguoi_tao integer,
    nguoi_cap_nhat integer,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_noi_bo boolean DEFAULT false,
    CONSTRAINT don_vi_nhan_trang_thai_check CHECK (((trang_thai)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'deleted'::character varying])::text[])))
);


ALTER TABLE public.don_vi_nhan OWNER TO postgres;

--
-- TOC entry 5458 (class 0 OID 0)
-- Dependencies: 235
-- Name: COLUMN don_vi_nhan.is_noi_bo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.don_vi_nhan.is_noi_bo IS 'Đánh dấu đơn vị nhận nội bộ (phòng ban)';


--
-- TOC entry 234 (class 1259 OID 17965)
-- Name: don_vi_nhan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.don_vi_nhan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.don_vi_nhan_id_seq OWNER TO postgres;

--
-- TOC entry 5459 (class 0 OID 0)
-- Dependencies: 234
-- Name: don_vi_nhan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.don_vi_nhan_id_seq OWNED BY public.don_vi_nhan.id;


--
-- TOC entry 229 (class 1259 OID 17892)
-- Name: don_vi_van_chuyen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.don_vi_van_chuyen (
    id integer NOT NULL,
    ma_dvvc character varying(20) NOT NULL,
    ten_dvvc character varying(200) NOT NULL,
    dia_chi text,
    phone character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.don_vi_van_chuyen OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 17891)
-- Name: don_vi_van_chuyen_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.don_vi_van_chuyen_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.don_vi_van_chuyen_id_seq OWNER TO postgres;

--
-- TOC entry 5460 (class 0 OID 0)
-- Dependencies: 228
-- Name: don_vi_van_chuyen_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.don_vi_van_chuyen_id_seq OWNED BY public.don_vi_van_chuyen.id;


--
-- TOC entry 223 (class 1259 OID 17833)
-- Name: hang_hoa; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hang_hoa (
    id integer NOT NULL,
    ma_hang_hoa character varying(50) NOT NULL,
    ten_hang_hoa character varying(200) NOT NULL,
    loai_hang_hoa_id integer,
    don_vi_tinh character varying(20) NOT NULL,
    mo_ta_ky_thuat text,
    co_so_seri boolean DEFAULT true,
    theo_doi_pham_chat boolean DEFAULT true,
    gia_nhap_gan_nhat numeric(15,2) DEFAULT 0,
    phong_ban_id integer,
    trang_thai public.trang_thai DEFAULT 'active'::public.trang_thai,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    la_tai_san_co_dinh boolean DEFAULT false
);


ALTER TABLE public.hang_hoa OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 17832)
-- Name: hang_hoa_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hang_hoa_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hang_hoa_id_seq OWNER TO postgres;

--
-- TOC entry 5461 (class 0 OID 0)
-- Dependencies: 222
-- Name: hang_hoa_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hang_hoa_id_seq OWNED BY public.hang_hoa.id;


--
-- TOC entry 225 (class 1259 OID 17860)
-- Name: hang_hoa_seri; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hang_hoa_seri (
    id integer NOT NULL,
    hang_hoa_id integer NOT NULL,
    so_seri character varying(100) NOT NULL,
    don_gia numeric(15,2) NOT NULL,
    ngay_nhap date NOT NULL,
    phieu_nhap_id integer,
    trang_thai character varying(20) DEFAULT 'ton_kho'::character varying,
    pham_chat public.pham_chat DEFAULT 'tot'::public.pham_chat,
    vi_tri_kho character varying(100),
    han_su_dung date,
    ghi_chu text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.hang_hoa_seri OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 17859)
-- Name: hang_hoa_seri_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hang_hoa_seri_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hang_hoa_seri_id_seq OWNER TO postgres;

--
-- TOC entry 5462 (class 0 OID 0)
-- Dependencies: 224
-- Name: hang_hoa_seri_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hang_hoa_seri_id_seq OWNED BY public.hang_hoa_seri.id;


--
-- TOC entry 243 (class 1259 OID 18141)
-- Name: lich_su_gia; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lich_su_gia (
    id integer NOT NULL,
    hang_hoa_id integer NOT NULL,
    phieu_nhap_id integer,
    don_gia numeric(15,2) NOT NULL,
    ngay_ap_dung date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.lich_su_gia OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 18140)
-- Name: lich_su_gia_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lich_su_gia_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lich_su_gia_id_seq OWNER TO postgres;

--
-- TOC entry 5463 (class 0 OID 0)
-- Dependencies: 242
-- Name: lich_su_gia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lich_su_gia_id_seq OWNED BY public.lich_su_gia.id;


--
-- TOC entry 264 (class 1259 OID 27587)
-- Name: lich_su_kiem_ke; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lich_su_kiem_ke (
    id integer NOT NULL,
    hang_hoa_id integer NOT NULL,
    phieu_kiem_ke_id integer NOT NULL,
    phong_ban_id integer NOT NULL,
    ngay_kiem_ke date NOT NULL,
    so_luong_so_sach numeric(15,3) DEFAULT 0 NOT NULL,
    so_luong_thuc_te numeric(15,3) DEFAULT 0 NOT NULL,
    chenh_lech numeric(15,3) DEFAULT 0 NOT NULL,
    sl_tot numeric(15,3) DEFAULT 0,
    sl_kem_pham_chat numeric(15,3) DEFAULT 0,
    sl_mat_pham_chat numeric(15,3) DEFAULT 0,
    sl_hong numeric(15,3) DEFAULT 0,
    sl_can_thanh_ly numeric(15,3) DEFAULT 0,
    don_gia numeric(15,2),
    gia_tri_chenh_lech numeric(15,2),
    ly_do_chenh_lech text,
    de_nghi_xu_ly text,
    trang_thai character varying(20) DEFAULT 'completed'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.lich_su_kiem_ke OWNER TO postgres;

--
-- TOC entry 263 (class 1259 OID 27586)
-- Name: lich_su_kiem_ke_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lich_su_kiem_ke_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lich_su_kiem_ke_id_seq OWNER TO postgres;

--
-- TOC entry 5464 (class 0 OID 0)
-- Dependencies: 263
-- Name: lich_su_kiem_ke_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lich_su_kiem_ke_id_seq OWNED BY public.lich_su_kiem_ke.id;


--
-- TOC entry 221 (class 1259 OID 17820)
-- Name: loai_hang_hoa; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loai_hang_hoa (
    id integer NOT NULL,
    ma_loai character varying(20) NOT NULL,
    ten_loai character varying(100) NOT NULL,
    mo_ta text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.loai_hang_hoa OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 17819)
-- Name: loai_hang_hoa_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.loai_hang_hoa_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.loai_hang_hoa_id_seq OWNER TO postgres;

--
-- TOC entry 5465 (class 0 OID 0)
-- Dependencies: 220
-- Name: loai_hang_hoa_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.loai_hang_hoa_id_seq OWNED BY public.loai_hang_hoa.id;


--
-- TOC entry 227 (class 1259 OID 17879)
-- Name: nha_cung_cap; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nha_cung_cap (
    id integer NOT NULL,
    ma_ncc character varying(20) NOT NULL,
    ten_ncc character varying(200) NOT NULL,
    dia_chi text,
    phone character varying(20),
    email character varying(100),
    nguoi_lien_he character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    phong_ban_id integer,
    is_noi_bo boolean DEFAULT false,
    trang_thai character varying(20) DEFAULT 'active'::character varying,
    related_phong_ban_info jsonb,
    loai_nha_cung_cap character varying(20) DEFAULT 'tu_mua'::character varying,
    CONSTRAINT nha_cung_cap_loai_nha_cung_cap_check CHECK (((loai_nha_cung_cap)::text = ANY ((ARRAY['tu_mua'::character varying, 'tren_cap'::character varying, 'dieu_chuyen'::character varying])::text[])))
);


ALTER TABLE public.nha_cung_cap OWNER TO postgres;

--
-- TOC entry 5466 (class 0 OID 0)
-- Dependencies: 227
-- Name: COLUMN nha_cung_cap.is_noi_bo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.nha_cung_cap.is_noi_bo IS 'Đánh dấu nhà cung cấp nội bộ (phòng ban)';


--
-- TOC entry 5467 (class 0 OID 0)
-- Dependencies: 227
-- Name: COLUMN nha_cung_cap.related_phong_ban_info; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.nha_cung_cap.related_phong_ban_info IS 'Thông tin phòng ban liên quan khi là NCC nội bộ';


--
-- TOC entry 226 (class 1259 OID 17878)
-- Name: nha_cung_cap_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nha_cung_cap_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.nha_cung_cap_id_seq OWNER TO postgres;

--
-- TOC entry 5468 (class 0 OID 0)
-- Dependencies: 226
-- Name: nha_cung_cap_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nha_cung_cap_id_seq OWNED BY public.nha_cung_cap.id;


--
-- TOC entry 248 (class 1259 OID 18608)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    nguoi_nhan integer NOT NULL,
    loai_thong_bao public.loai_thong_bao NOT NULL,
    tieu_de character varying(255) NOT NULL,
    noi_dung text NOT NULL,
    trang_thai public.trang_thai_thong_bao DEFAULT 'unread'::public.trang_thai_thong_bao,
    yeu_cau_id integer,
    phieu_id integer,
    metadata jsonb,
    url_redirect character varying(500),
    ngay_gui timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ngay_doc timestamp with time zone,
    ngay_het_han timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    muc_do_uu_tien character varying(20) DEFAULT 'normal'::character varying,
    CONSTRAINT notifications_muc_do_uu_tien_check CHECK (((muc_do_uu_tien)::text = ANY ((ARRAY['urgent'::character varying, 'high'::character varying, 'medium'::character varying, 'normal'::character varying, 'low'::character varying])::text[])))
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 5469 (class 0 OID 0)
-- Dependencies: 248
-- Name: TABLE notifications; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.notifications IS 'Hệ thống thông báo cho users';


--
-- TOC entry 5470 (class 0 OID 0)
-- Dependencies: 248
-- Name: COLUMN notifications.loai_thong_bao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notifications.loai_thong_bao IS 'Loại thông báo: phieu_nhap_can_duyet, phieu_nhap_duyet, phieu_nhap_can_sua, phieu_xuat_can_duyet, phieu_xuat_duyet, phieu_xuat_can_sua, system';


--
-- TOC entry 5471 (class 0 OID 0)
-- Dependencies: 248
-- Name: COLUMN notifications.muc_do_uu_tien; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notifications.muc_do_uu_tien IS 'Mức độ ưu tiên: urgent, high, medium, normal, low';


--
-- TOC entry 247 (class 1259 OID 18607)
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- TOC entry 5472 (class 0 OID 0)
-- Dependencies: 247
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- TOC entry 260 (class 1259 OID 27521)
-- Name: phieu_kiem_ke; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phieu_kiem_ke (
    id integer NOT NULL,
    so_phieu character varying(50) NOT NULL,
    ngay_kiem_ke date NOT NULL,
    gio_kiem_ke time without time zone NOT NULL,
    don_vi_kiem_ke character varying(200),
    so_quyet_dinh character varying(100) DEFAULT ''::character varying,
    ly_do_kiem_ke text DEFAULT 'Kiểm kê định kỳ'::text,
    loai_kiem_ke character varying(20) DEFAULT 'dinh_ky'::character varying,
    to_kiem_ke jsonb,
    trang_thai public.trang_thai_phieu DEFAULT 'draft'::public.trang_thai_phieu,
    nguoi_tao integer NOT NULL,
    nguoi_duyet integer,
    ngay_duyet timestamp without time zone,
    phong_ban_id integer,
    ghi_chu text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT phieu_kiem_ke_loai_kiem_ke_check CHECK (((loai_kiem_ke)::text = ANY ((ARRAY['dinh_ky'::character varying, 'dot_xuat'::character varying, 'dac_biet'::character varying, 'chuyen_giao'::character varying, 'thanh_ly'::character varying])::text[])))
);


ALTER TABLE public.phieu_kiem_ke OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 27520)
-- Name: phieu_kiem_ke_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.phieu_kiem_ke_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.phieu_kiem_ke_id_seq OWNER TO postgres;

--
-- TOC entry 5473 (class 0 OID 0)
-- Dependencies: 259
-- Name: phieu_kiem_ke_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.phieu_kiem_ke_id_seq OWNED BY public.phieu_kiem_ke.id;


--
-- TOC entry 231 (class 1259 OID 17904)
-- Name: phieu_nhap; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phieu_nhap (
    id integer NOT NULL,
    so_phieu character varying(50) NOT NULL,
    ngay_nhap date NOT NULL,
    nha_cung_cap_id integer,
    don_vi_van_chuyen_id integer,
    ly_do_nhap text,
    loai_phieu public.loai_phieu_nhap DEFAULT 'tu_mua'::public.loai_phieu_nhap,
    so_hoa_don character varying(50),
    tong_tien numeric(15,2) DEFAULT 0,
    trang_thai public.trang_thai_phieu_old DEFAULT 'draft'::public.trang_thai_phieu_old,
    nguoi_tao integer NOT NULL,
    nguoi_duyet_cap1 integer,
    ngay_duyet_cap1 timestamp without time zone,
    phong_ban_id integer,
    ghi_chu text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    nguoi_nhap_hang character varying(200),
    so_quyet_dinh character varying(100),
    dia_chi_nhap text,
    decision_pdf_url text,
    decision_pdf_filename character varying(255),
    ghi_chu_hoan_thanh text,
    ngay_hoan_thanh timestamp without time zone,
    phuong_thuc_van_chuyen character varying(255) DEFAULT 'Đơn vị tự vận chuyển'::character varying,
    ghi_chu_phan_hoi text,
    ngay_gui_duyet timestamp with time zone,
    phong_ban_cung_cap_id integer,
    phieu_xuat_lien_ket_id integer,
    is_tu_dong boolean DEFAULT false,
    nguoi_giao_hang character varying(100),
    approved_by_manager integer,
    ngay_duyet_manager timestamp with time zone,
    nguoi_phan_hoi integer,
    ngay_phan_hoi timestamp with time zone,
    CONSTRAINT check_phieu_nhap_logic CHECK ((((loai_phieu = ANY (ARRAY['tu_mua'::public.loai_phieu_nhap, 'tren_cap'::public.loai_phieu_nhap])) AND (nha_cung_cap_id IS NOT NULL) AND (phong_ban_cung_cap_id IS NULL)) OR ((loai_phieu = 'dieu_chuyen'::public.loai_phieu_nhap) AND (phong_ban_cung_cap_id IS NOT NULL) AND (nha_cung_cap_id IS NULL))))
);


ALTER TABLE public.phieu_nhap OWNER TO postgres;

--
-- TOC entry 5474 (class 0 OID 0)
-- Dependencies: 231
-- Name: COLUMN phieu_nhap.phong_ban_cung_cap_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.phieu_nhap.phong_ban_cung_cap_id IS 'Phòng ban cung cấp hàng (khi loại phiếu là tren_cap hoặc dieu_chuyen)';


--
-- TOC entry 5475 (class 0 OID 0)
-- Dependencies: 231
-- Name: COLUMN phieu_nhap.phieu_xuat_lien_ket_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.phieu_nhap.phieu_xuat_lien_ket_id IS 'Phiếu xuất tương ứng của phòng ban cung cấp';


--
-- TOC entry 5476 (class 0 OID 0)
-- Dependencies: 231
-- Name: COLUMN phieu_nhap.is_tu_dong; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.phieu_nhap.is_tu_dong IS 'Đánh dấu phiếu được tạo tự động bởi hệ thống';


--
-- TOC entry 230 (class 1259 OID 17903)
-- Name: phieu_nhap_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.phieu_nhap_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.phieu_nhap_id_seq OWNER TO postgres;

--
-- TOC entry 5477 (class 0 OID 0)
-- Dependencies: 230
-- Name: phieu_nhap_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.phieu_nhap_id_seq OWNED BY public.phieu_nhap.id;


--
-- TOC entry 237 (class 1259 OID 17980)
-- Name: phieu_xuat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phieu_xuat (
    id integer NOT NULL,
    so_phieu character varying(50) NOT NULL,
    ngay_xuat date NOT NULL,
    don_vi_nhan_id integer,
    nguoi_nhan character varying(100),
    ly_do_xuat text,
    tong_tien numeric(15,2) DEFAULT 0,
    trang_thai public.trang_thai_phieu_old DEFAULT 'draft'::public.trang_thai_phieu_old,
    nguoi_tao integer NOT NULL,
    nguoi_duyet_cap1 integer,
    ngay_duyet_cap1 timestamp without time zone,
    phong_ban_id integer,
    ghi_chu text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    loai_xuat public.loai_xuat_old DEFAULT 'don_vi_nhan'::public.loai_xuat_old,
    decision_pdf_url text,
    decision_pdf_filename character varying(255),
    ghi_chu_xac_nhan text,
    ngay_xac_nhan timestamp without time zone,
    so_quyet_dinh character varying(100) DEFAULT ''::character varying,
    ghi_chu_phan_hoi text,
    phong_ban_nhan_id integer,
    phieu_nhap_lien_ket_id integer,
    is_tu_dong boolean DEFAULT false,
    nguoi_giao_hang character varying(100),
    approved_by_manager integer,
    ngay_duyet_manager timestamp with time zone,
    ngay_gui_duyet timestamp with time zone,
    nguoi_phan_hoi integer,
    ngay_phan_hoi timestamp with time zone
);


ALTER TABLE public.phieu_xuat OWNER TO postgres;

--
-- TOC entry 5478 (class 0 OID 0)
-- Dependencies: 237
-- Name: COLUMN phieu_xuat.so_quyet_dinh; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.phieu_xuat.so_quyet_dinh IS 'Số quyết định xuất kho';


--
-- TOC entry 5479 (class 0 OID 0)
-- Dependencies: 237
-- Name: COLUMN phieu_xuat.phong_ban_nhan_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.phieu_xuat.phong_ban_nhan_id IS 'Phòng ban nhận hàng khi xuất cho cấp dưới';


--
-- TOC entry 5480 (class 0 OID 0)
-- Dependencies: 237
-- Name: COLUMN phieu_xuat.phieu_nhap_lien_ket_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.phieu_xuat.phieu_nhap_lien_ket_id IS 'Phiếu nhập tương ứng của phòng ban nhận';


--
-- TOC entry 5481 (class 0 OID 0)
-- Dependencies: 237
-- Name: COLUMN phieu_xuat.is_tu_dong; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.phieu_xuat.is_tu_dong IS 'Đánh dấu phiếu được tạo tự động bởi hệ thống';


--
-- TOC entry 236 (class 1259 OID 17979)
-- Name: phieu_xuat_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.phieu_xuat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.phieu_xuat_id_seq OWNER TO postgres;

--
-- TOC entry 5482 (class 0 OID 0)
-- Dependencies: 236
-- Name: phieu_xuat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.phieu_xuat_id_seq OWNED BY public.phieu_xuat.id;


--
-- TOC entry 217 (class 1259 OID 17530)
-- Name: phong_ban; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phong_ban (
    id integer NOT NULL,
    ma_phong_ban character varying(20) NOT NULL,
    ten_phong_ban character varying(100) NOT NULL,
    mo_ta text,
    trang_thai public.trang_thai DEFAULT 'active'::public.trang_thai,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cap_bac integer DEFAULT 2,
    phong_ban_cha_id integer,
    thu_tu_hien_thi integer DEFAULT 0,
    is_active boolean DEFAULT true,
    CONSTRAINT phong_ban_cap_bac_check CHECK ((cap_bac = ANY (ARRAY[1, 2, 3])))
);


ALTER TABLE public.phong_ban OWNER TO postgres;

--
-- TOC entry 5483 (class 0 OID 0)
-- Dependencies: 217
-- Name: COLUMN phong_ban.cap_bac; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.phong_ban.cap_bac IS '1: BTL Vùng, 2: Phòng ban/Ban chuyên môn, 3: Đơn vị tác nghiệp';


--
-- TOC entry 5484 (class 0 OID 0)
-- Dependencies: 217
-- Name: COLUMN phong_ban.phong_ban_cha_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.phong_ban.phong_ban_cha_id IS 'ID của phòng ban cấp trên (NULL cho BTL Vùng)';


--
-- TOC entry 216 (class 1259 OID 17529)
-- Name: phong_ban_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.phong_ban_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.phong_ban_id_seq OWNER TO postgres;

--
-- TOC entry 5485 (class 0 OID 0)
-- Dependencies: 216
-- Name: phong_ban_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.phong_ban_id_seq OWNED BY public.phong_ban.id;


--
-- TOC entry 246 (class 1259 OID 18197)
-- Name: seq_phieu_kiem_ke; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seq_phieu_kiem_ke
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seq_phieu_kiem_ke OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 18195)
-- Name: seq_phieu_nhap; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seq_phieu_nhap
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seq_phieu_nhap OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 18196)
-- Name: seq_phieu_xuat; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seq_phieu_xuat
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seq_phieu_xuat OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 18679)
-- Name: seq_yeu_cau_nhap; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seq_yeu_cau_nhap
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seq_yeu_cau_nhap OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 18680)
-- Name: seq_yeu_cau_xuat; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seq_yeu_cau_xuat
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seq_yeu_cau_xuat OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 18110)
-- Name: ton_kho; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ton_kho (
    id integer NOT NULL,
    hang_hoa_id integer NOT NULL,
    phong_ban_id integer NOT NULL,
    sl_tot numeric(10,2) DEFAULT 0,
    sl_kem_pham_chat numeric(10,2) DEFAULT 0,
    sl_mat_pham_chat numeric(10,2) DEFAULT 0,
    sl_hong numeric(10,2) DEFAULT 0,
    sl_can_thanh_ly numeric(10,2) DEFAULT 0,
    so_luong_ton numeric(10,2) GENERATED ALWAYS AS (((((sl_tot + sl_kem_pham_chat) + sl_mat_pham_chat) + sl_hong) + sl_can_thanh_ly)) STORED,
    gia_tri_ton numeric(15,2) DEFAULT 0,
    don_gia_binh_quan numeric(15,2) DEFAULT 0,
    so_luong_dang_su_dung numeric(10,2) DEFAULT 0,
    so_luong_kho_bo numeric(10,2) DEFAULT 0,
    so_luong_kho_don_vi numeric(10,2) DEFAULT 0,
    ngay_cap_nhat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat_pham_chat timestamp without time zone
);


ALTER TABLE public.ton_kho OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 18109)
-- Name: ton_kho_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ton_kho_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ton_kho_id_seq OWNER TO postgres;

--
-- TOC entry 5486 (class 0 OID 0)
-- Dependencies: 240
-- Name: ton_kho_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ton_kho_id_seq OWNED BY public.ton_kho.id;


--
-- TOC entry 219 (class 1259 OID 17544)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    ho_ten character varying(100) NOT NULL,
    email character varying(100),
    phone character varying(20),
    phong_ban_id integer,
    role public.user_role DEFAULT 'user'::public.user_role,
    trang_thai public.trang_thai DEFAULT 'active'::public.trang_thai,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 17543)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5487 (class 0 OID 0)
-- Dependencies: 218
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 257 (class 1259 OID 18798)
-- Name: v_cau_truc_to_chuc; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_cau_truc_to_chuc AS
 WITH RECURSIVE org_tree AS (
         SELECT phong_ban.id,
            phong_ban.ma_phong_ban,
            phong_ban.ten_phong_ban,
            phong_ban.cap_bac,
            phong_ban.phong_ban_cha_id,
            ARRAY[phong_ban.id] AS path,
            0 AS level,
            ARRAY[phong_ban.thu_tu_hien_thi] AS sort_path
           FROM public.phong_ban
          WHERE (phong_ban.cap_bac = 1)
        UNION ALL
         SELECT pb.id,
            pb.ma_phong_ban,
            pb.ten_phong_ban,
            pb.cap_bac,
            pb.phong_ban_cha_id,
            (ot.path || pb.id),
            (ot.level + 1),
            (ot.sort_path || pb.thu_tu_hien_thi)
           FROM (public.phong_ban pb
             JOIN org_tree ot ON ((pb.phong_ban_cha_id = ot.id)))
        )
 SELECT id,
    ma_phong_ban,
    ten_phong_ban,
    cap_bac,
    phong_ban_cha_id,
    level,
    (repeat('  '::text, level) || (ten_phong_ban)::text) AS ten_phong_ban_indent,
    path
   FROM org_tree
  ORDER BY sort_path;


ALTER VIEW public.v_cau_truc_to_chuc OWNER TO postgres;

--
-- TOC entry 258 (class 1259 OID 18883)
-- Name: v_ton_kho_tong_hop; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_ton_kho_tong_hop AS
 SELECT tk.hang_hoa_id,
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
    ((((tk.sl_tot + tk.sl_kem_pham_chat) + tk.sl_mat_pham_chat) + tk.sl_hong) + tk.sl_can_thanh_ly) AS so_luong_ton,
    tk.gia_tri_ton,
    tk.don_gia_binh_quan,
    tk.ngay_cap_nhat,
        CASE
            WHEN (h.phong_ban_id = tk.phong_ban_id) THEN 'Hàng hóa gốc'::text
            ELSE 'Nhận từ cấp trên'::text
        END AS nguon_goc,
    (EXISTS ( SELECT 1
           FROM (public.phieu_nhap pn
             JOIN public.chi_tiet_nhap ctn ON ((pn.id = ctn.phieu_nhap_id)))
          WHERE ((ctn.hang_hoa_id = tk.hang_hoa_id) AND (pn.phong_ban_id = tk.phong_ban_id) AND (pn.loai_phieu = 'tren_cap'::public.loai_phieu_nhap) AND (pn.trang_thai = 'completed'::public.trang_thai_phieu_old)))) AS la_hang_tu_tren_cap
   FROM ((public.ton_kho tk
     JOIN public.hang_hoa h ON ((tk.hang_hoa_id = h.id)))
     JOIN public.phong_ban pb ON ((tk.phong_ban_id = pb.id)))
  WHERE (((((tk.sl_tot + tk.sl_kem_pham_chat) + tk.sl_mat_pham_chat) + tk.sl_hong) + tk.sl_can_thanh_ly) > (0)::numeric)
  ORDER BY pb.cap_bac, pb.ten_phong_ban, h.ten_hang_hoa;


ALTER VIEW public.v_ton_kho_tong_hop OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 18698)
-- Name: workflow_approvals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workflow_approvals (
    id integer NOT NULL,
    yeu_cau_id integer NOT NULL,
    step_number integer DEFAULT 1 NOT NULL,
    nguoi_duyet integer NOT NULL,
    phong_ban_duyet integer NOT NULL,
    ngay_nhan timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ngay_xu_ly timestamp with time zone,
    deadline timestamp with time zone,
    ly_do_quyet_dinh text,
    ghi_chu text,
    file_dinh_kem_url text,
    chu_ky_so text,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.workflow_approvals OWNER TO postgres;

--
-- TOC entry 5488 (class 0 OID 0)
-- Dependencies: 256
-- Name: TABLE workflow_approvals; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.workflow_approvals IS 'Lịch sử phê duyệt cho workflow yêu cầu';


--
-- TOC entry 255 (class 1259 OID 18697)
-- Name: workflow_approvals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.workflow_approvals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workflow_approvals_id_seq OWNER TO postgres;

--
-- TOC entry 5489 (class 0 OID 0)
-- Dependencies: 255
-- Name: workflow_approvals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.workflow_approvals_id_seq OWNED BY public.workflow_approvals.id;


--
-- TOC entry 250 (class 1259 OID 18629)
-- Name: workflow_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workflow_settings (
    id integer NOT NULL,
    phong_ban_id integer NOT NULL,
    auto_approval_limit numeric(15,2) DEFAULT 0,
    required_approvers integer DEFAULT 1,
    approval_timeout_hours integer DEFAULT 72,
    notify_on_submit boolean DEFAULT true,
    notify_on_approve boolean DEFAULT true,
    notify_on_reject boolean DEFAULT true,
    escalation_hours integer DEFAULT 24,
    allow_self_approval boolean DEFAULT false,
    require_attachment boolean DEFAULT false,
    max_items_per_request integer DEFAULT 50,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.workflow_settings OWNER TO postgres;

--
-- TOC entry 5490 (class 0 OID 0)
-- Dependencies: 250
-- Name: TABLE workflow_settings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.workflow_settings IS 'Cấu hình workflow cho từng phòng ban';


--
-- TOC entry 249 (class 1259 OID 18628)
-- Name: workflow_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.workflow_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workflow_settings_id_seq OWNER TO postgres;

--
-- TOC entry 5491 (class 0 OID 0)
-- Dependencies: 249
-- Name: workflow_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.workflow_settings_id_seq OWNED BY public.workflow_settings.id;


--
-- TOC entry 5045 (class 2604 OID 27557)
-- Name: chi_tiet_kiem_ke id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chi_tiet_kiem_ke ALTER COLUMN id SET DEFAULT nextval('public.chi_tiet_kiem_ke_id_seq'::regclass);


--
-- TOC entry 4975 (class 2604 OID 17948)
-- Name: chi_tiet_nhap id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chi_tiet_nhap ALTER COLUMN id SET DEFAULT nextval('public.chi_tiet_nhap_id_seq'::regclass);


--
-- TOC entry 4994 (class 2604 OID 18019)
-- Name: chi_tiet_xuat id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chi_tiet_xuat ALTER COLUMN id SET DEFAULT nextval('public.chi_tiet_xuat_id_seq'::regclass);


--
-- TOC entry 5031 (class 2604 OID 18659)
-- Name: digital_signatures id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.digital_signatures ALTER COLUMN id SET DEFAULT nextval('public.digital_signatures_id_seq'::regclass);


--
-- TOC entry 4980 (class 2604 OID 17969)
-- Name: don_vi_nhan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.don_vi_nhan ALTER COLUMN id SET DEFAULT nextval('public.don_vi_nhan_id_seq'::regclass);


--
-- TOC entry 4965 (class 2604 OID 17895)
-- Name: don_vi_van_chuyen id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.don_vi_van_chuyen ALTER COLUMN id SET DEFAULT nextval('public.don_vi_van_chuyen_id_seq'::regclass);


--
-- TOC entry 4947 (class 2604 OID 17836)
-- Name: hang_hoa id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hang_hoa ALTER COLUMN id SET DEFAULT nextval('public.hang_hoa_id_seq'::regclass);


--
-- TOC entry 4955 (class 2604 OID 17863)
-- Name: hang_hoa_seri id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hang_hoa_seri ALTER COLUMN id SET DEFAULT nextval('public.hang_hoa_seri_id_seq'::regclass);


--
-- TOC entry 5010 (class 2604 OID 18144)
-- Name: lich_su_gia id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_su_gia ALTER COLUMN id SET DEFAULT nextval('public.lich_su_gia_id_seq'::regclass);


--
-- TOC entry 5060 (class 2604 OID 27590)
-- Name: lich_su_kiem_ke id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_su_kiem_ke ALTER COLUMN id SET DEFAULT nextval('public.lich_su_kiem_ke_id_seq'::regclass);


--
-- TOC entry 4944 (class 2604 OID 17823)
-- Name: loai_hang_hoa id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loai_hang_hoa ALTER COLUMN id SET DEFAULT nextval('public.loai_hang_hoa_id_seq'::regclass);


--
-- TOC entry 4959 (class 2604 OID 17882)
-- Name: nha_cung_cap id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nha_cung_cap ALTER COLUMN id SET DEFAULT nextval('public.nha_cung_cap_id_seq'::regclass);


--
-- TOC entry 5012 (class 2604 OID 18611)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 5038 (class 2604 OID 27524)
-- Name: phieu_kiem_ke id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_kiem_ke ALTER COLUMN id SET DEFAULT nextval('public.phieu_kiem_ke_id_seq'::regclass);


--
-- TOC entry 4967 (class 2604 OID 17907)
-- Name: phieu_nhap id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_nhap ALTER COLUMN id SET DEFAULT nextval('public.phieu_nhap_id_seq'::regclass);


--
-- TOC entry 4986 (class 2604 OID 17983)
-- Name: phieu_xuat id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_xuat ALTER COLUMN id SET DEFAULT nextval('public.phieu_xuat_id_seq'::regclass);


--
-- TOC entry 4932 (class 2604 OID 17533)
-- Name: phong_ban id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phong_ban ALTER COLUMN id SET DEFAULT nextval('public.phong_ban_id_seq'::regclass);


--
-- TOC entry 4997 (class 2604 OID 18113)
-- Name: ton_kho id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ton_kho ALTER COLUMN id SET DEFAULT nextval('public.ton_kho_id_seq'::regclass);


--
-- TOC entry 4939 (class 2604 OID 17547)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5034 (class 2604 OID 18701)
-- Name: workflow_approvals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_approvals ALTER COLUMN id SET DEFAULT nextval('public.workflow_approvals_id_seq'::regclass);


--
-- TOC entry 5017 (class 2604 OID 18632)
-- Name: workflow_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_settings ALTER COLUMN id SET DEFAULT nextval('public.workflow_settings_id_seq'::regclass);


--
-- TOC entry 5440 (class 0 OID 27554)
-- Dependencies: 262
-- Data for Name: chi_tiet_kiem_ke; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chi_tiet_kiem_ke (id, phieu_kiem_ke_id, hang_hoa_id, so_luong_so_sach, sl_tot, sl_kem_pham_chat, sl_mat_pham_chat, sl_hong, sl_can_thanh_ly, don_gia, gia_tri_hong, ly_do_chenh_lech, de_nghi_xu_ly, danh_sach_seri_kiem_ke, created_at) FROM stdin;
2	2	22	2.00	1.00	1.00	0.00	0.00	0.00	300000.00	0.00			\N	2025-09-06 08:50:39.929982
3	2	20	1.00	1.00	0.00	0.00	0.00	0.00	30000.00	0.00			\N	2025-09-06 08:50:39.929982
\.


--
-- TOC entry 5413 (class 0 OID 17945)
-- Dependencies: 233
-- Data for Name: chi_tiet_nhap; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chi_tiet_nhap (id, phieu_nhap_id, hang_hoa_id, so_luong, don_gia, thanh_tien, so_seri_list, pham_chat, han_su_dung, vi_tri_kho, ghi_chu, created_at, so_luong_ke_hoach, la_tai_san_co_dinh) FROM stdin;
1	1	20	2.00	30000.00	60000.00	\N	tot	\N	\N	\N	2025-09-06 07:49:12.082326	2.00	f
2	2	21	3.00	50000.00	150000.00	{tcc}	tot	\N	\N	\N	2025-09-06 07:57:41.82219	3.00	f
3	2	22	3.00	300000.00	900000.00	\N	tot	\N	\N	\N	2025-09-06 07:57:41.82219	3.00	f
4	3	20	1.00	30000.00	30000.00	\N	tot	\N	\N	\N	2025-09-06 08:12:21.107114	0.00	f
5	4	23	2.00	200000.00	400000.00	\N	tot	\N	\N	\N	2025-09-06 16:45:56.028975	2.00	f
6	4	21	2.00	60000.00	120000.00	\N	tot	\N	\N	\N	2025-09-06 16:45:56.028975	2.00	f
\.


--
-- TOC entry 5419 (class 0 OID 18016)
-- Dependencies: 239
-- Data for Name: chi_tiet_xuat; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chi_tiet_xuat (id, phieu_xuat_id, hang_hoa_id, so_luong_yeu_cau, so_luong_thuc_xuat, don_gia, thanh_tien, so_seri_xuat, pham_chat, ghi_chu, created_at, phieu_nhap_id, loai_phieu_nhap) FROM stdin;
1	1	22	1.00	1.00	300000.00	300000.00	\N	tot	\N	2025-09-06 08:01:25.911625	2	dieu_chuyen
2	2	20	1.00	1.00	30000.00	30000.00	\N	tot	\N	2025-09-06 08:12:00.585427	1	dieu_chuyen
\.


--
-- TOC entry 5432 (class 0 OID 18656)
-- Dependencies: 252
-- Data for Name: digital_signatures; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.digital_signatures (id, user_id, yeu_cau_id, action_type, signature_hash, signature_data, public_key, ip_address, user_agent, browser_fingerprint, is_verified, verified_at, verified_by, created_at) FROM stdin;
\.


--
-- TOC entry 5415 (class 0 OID 17966)
-- Dependencies: 235
-- Data for Name: don_vi_nhan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.don_vi_nhan (id, ma_don_vi, ten_don_vi, loai_don_vi, dia_chi, nguoi_lien_he, so_dien_thoai_old, created_at, so_dien_thoai, email, chuc_vu_nguoi_lien_he, phong_ban_id, ghi_chu, trang_thai, nguoi_tao, nguoi_cap_nhat, updated_at, is_noi_bo) FROM stdin;
\.


--
-- TOC entry 5409 (class 0 OID 17892)
-- Dependencies: 229
-- Data for Name: don_vi_van_chuyen; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.don_vi_van_chuyen (id, ma_dvvc, ten_dvvc, dia_chi, phone, created_at) FROM stdin;
1	XE_BO_DOI	Xe bộ đội	Nội bộ		2025-07-09 22:42:47.598722
2	VAN_TAI_A	Công ty vận tải A	Hà Nội	024-9999999	2025-07-09 22:42:47.598722
3	VAN_TAI_B	Công ty vận tải B	TP.HCM	028-8888888	2025-07-09 22:42:47.598722
\.


--
-- TOC entry 5403 (class 0 OID 17833)
-- Dependencies: 223
-- Data for Name: hang_hoa; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hang_hoa (id, ma_hang_hoa, ten_hang_hoa, loai_hang_hoa_id, don_vi_tinh, mo_ta_ky_thuat, co_so_seri, theo_doi_pham_chat, gia_nhap_gan_nhat, phong_ban_id, trang_thai, created_at, updated_at, la_tai_san_co_dinh) FROM stdin;
21	HH0002	Tay côn thép 885mm	\N	Cái	\N	t	t	60000.00	\N	active	2025-09-06 07:57:41.789565	2025-09-06 16:48:32.741004	f
23	HH0004	Bình điện 12V-100Ah	\N	Cái	\N	t	t	200000.00	\N	active	2025-09-06 16:45:55.926566	2025-09-06 16:48:32.741004	f
22	HH0003	Lá chắn kính	\N	Cái	\N	t	t	300000.00	\N	active	2025-09-06 07:57:41.805809	2025-09-06 08:00:29.939358	f
20	HH0001	Nước lau sàn Sunlight	\N	Cái	\N	t	t	30000.00	\N	active	2025-09-06 07:42:30.678411	2025-09-06 08:34:07.359406	f
\.


--
-- TOC entry 5405 (class 0 OID 17860)
-- Dependencies: 225
-- Data for Name: hang_hoa_seri; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hang_hoa_seri (id, hang_hoa_id, so_seri, don_gia, ngay_nhap, phieu_nhap_id, trang_thai, pham_chat, vi_tri_kho, han_su_dung, ghi_chu, created_at) FROM stdin;
\.


--
-- TOC entry 5423 (class 0 OID 18141)
-- Dependencies: 243
-- Data for Name: lich_su_gia; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lich_su_gia (id, hang_hoa_id, phieu_nhap_id, don_gia, ngay_ap_dung, created_at) FROM stdin;
\.


--
-- TOC entry 5442 (class 0 OID 27587)
-- Dependencies: 264
-- Data for Name: lich_su_kiem_ke; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lich_su_kiem_ke (id, hang_hoa_id, phieu_kiem_ke_id, phong_ban_id, ngay_kiem_ke, so_luong_so_sach, so_luong_thuc_te, chenh_lech, sl_tot, sl_kem_pham_chat, sl_mat_pham_chat, sl_hong, sl_can_thanh_ly, don_gia, gia_tri_chenh_lech, ly_do_chenh_lech, de_nghi_xu_ly, trang_thai, created_at) FROM stdin;
2	22	2	34	2025-09-06	2.000	2.000	0.000	1.000	1.000	0.000	0.000	0.000	300000.00	-90000.00			completed	2025-09-06 08:50:57.248171
3	20	2	34	2025-09-06	1.000	1.000	0.000	1.000	0.000	0.000	0.000	0.000	30000.00	0.00			completed	2025-09-06 08:50:57.248171
\.


--
-- TOC entry 5401 (class 0 OID 17820)
-- Dependencies: 221
-- Data for Name: loai_hang_hoa; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.loai_hang_hoa (id, ma_loai, ten_loai, mo_ta, created_at, updated_at) FROM stdin;
1	LOP	Lốp xe	Lốp các loại xe	2025-07-09 22:42:32.796271	2025-07-09 22:42:32.796271
2	ACQUY	Ắc quy	Ắc quy các loại	2025-07-09 22:42:32.796271	2025-07-09 22:42:32.796271
3	PTKD	Phụ tùng khí cụ điện	Phụ tùng điện và khí cụ	2025-07-09 22:42:32.796271	2025-07-09 22:42:32.796271
4	NHOT	Nhiên liệu - Hóa chất	Xăng dầu, hóa chất	2025-07-09 22:42:32.796271	2025-07-09 22:42:32.796271
5	DUNGCU	Dụng cụ	Dụng cụ sửa chữa	2025-07-09 22:42:32.796271	2025-07-09 22:42:32.796271
6	VANCHUYEN	Vận chuyển	Phương tiện vận chuyển	2025-07-09 22:42:32.796271	2025-07-09 22:42:32.796271
\.


--
-- TOC entry 5407 (class 0 OID 17879)
-- Dependencies: 227
-- Data for Name: nha_cung_cap; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nha_cung_cap (id, ma_ncc, ten_ncc, dia_chi, phone, email, nguoi_lien_he, created_at, updated_at, phong_ban_id, is_noi_bo, trang_thai, related_phong_ban_info, loai_nha_cung_cap) FROM stdin;
64	NCC000001	siêu thị Minh Anh	\N	\N	\N	\N	2025-09-05 20:51:06.372822	2025-09-05 20:51:06.372822	\N	f	active	\N	tu_mua
65	NCC000002	df	\N	\N	\N	\N	2025-09-05 21:55:52.905147	2025-09-05 21:55:52.905147	\N	f	active	\N	tu_mua
66	NCC000003	BTL 86	\N	\N	\N	\N	2025-09-06 07:57:41.765699	2025-09-06 07:57:41.765699	\N	f	active	\N	tu_mua
67	NCC000004	Bộ tư lệnh 86	\N	\N	\N	\N	2025-09-06 16:45:55.849478	2025-09-06 16:45:55.849478	\N	f	active	\N	tu_mua
\.


--
-- TOC entry 5428 (class 0 OID 18608)
-- Dependencies: 248
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, nguoi_nhan, loai_thong_bao, tieu_de, noi_dung, trang_thai, yeu_cau_id, phieu_id, metadata, url_redirect, ngay_gui, ngay_doc, ngay_het_han, created_at, muc_do_uu_tien) FROM stdin;
61	10	phieu_nhap_can_duyet	Phiếu nhập PN20250905001 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	unread	\N	\N	{"action": "can_duyet", "phieu_id": 12, "priority": "high", "so_phieu": "PN20250905001", "workflow_type": "standard"}	/nhap-kho?tab=tat-ca	2025-09-05 21:59:12.259548+07	\N	\N	2025-09-05 21:59:12.259548+07	high
62	11	phieu_nhap_can_duyet	Phiếu nhập PN20250905001 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	unread	\N	\N	{"action": "can_duyet", "phieu_id": 12, "priority": "high", "so_phieu": "PN20250905001", "workflow_type": "standard"}	/nhap-kho?tab=tat-ca	2025-09-05 21:59:12.273784+07	\N	\N	2025-09-05 21:59:12.273784+07	high
65	1	phieu_nhap_can_duyet	Phiếu nhập PN20250905001 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	read	\N	\N	{"action": "can_duyet", "phieu_id": 12, "priority": "high", "so_phieu": "PN20250905001", "workflow_type": "standard"}	/nhap-kho?tab=can-duyet-cuoi	2025-09-05 21:59:12.282309+07	2025-09-05 21:59:24.623147+07	\N	2025-09-05 21:59:12.282309+07	high
66	17	phieu_nhap_duyet	Phiếu nhập PN20250905001 đã được duyệt	Phiếu nhập kho của bạn đã được phê duyệt và có thể thực hiện	read	\N	\N	{"action": "duyet", "phieu_id": 12, "priority": "normal", "so_phieu": "PN20250905001"}	/nhap-kho?tab=da-duyet	2025-09-05 21:59:45.777834+07	2025-09-05 22:00:06.190551+07	\N	2025-09-05 21:59:45.777834+07	normal
67	1	phieu_xuat_can_duyet	Phiếu xuất đơn vị cần duyệt	Phiếu PX20250905001 từ Phòng HC-KT cần duyệt	read	\N	10	{"action": "submit", "phieu_id": 10, "so_phieu": "PX20250905001"}	/xuat-kho?tab=cho_duyet&highlight=10	2025-09-05 22:06:48.641315+07	2025-09-05 22:07:02.242325+07	\N	2025-09-05 22:06:48.641315+07	normal
64	14	phieu_nhap_can_duyet	Phiếu nhập PN20250905001 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	read	\N	\N	{"action": "can_duyet", "phieu_id": 12, "priority": "high", "so_phieu": "PN20250905001", "workflow_type": "standard"}	/nhap-kho?tab=tat-ca	2025-09-05 21:59:12.279523+07	2025-09-05 22:07:37.961962+07	\N	2025-09-05 21:59:12.279523+07	high
68	16	phieu_nhap_can_duyet	Phiếu nhập cần duyệt	Phiếu nhập PN250905001 được tạo tự động từ phiếu xuất PX20250905001	read	\N	13	{"phieu_id": 13, "linked_from": 10}	/nhap-kho?tab=cho_duyet	2025-09-05 22:07:16.703521+07	2025-09-05 22:21:44.180237+07	\N	2025-09-05 22:07:16.703521+07	normal
70	10	phieu_nhap_can_duyet	Phiếu nhập PN20250905001 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	unread	\N	\N	{"action": "can_duyet", "phieu_id": 1, "priority": "high", "so_phieu": "PN20250905001", "workflow_type": "standard"}	/nhap-kho?tab=tat-ca	2025-09-05 23:32:30.794317+07	\N	\N	2025-09-05 23:32:30.794317+07	high
71	11	phieu_nhap_can_duyet	Phiếu nhập PN20250905001 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	unread	\N	\N	{"action": "can_duyet", "phieu_id": 1, "priority": "high", "so_phieu": "PN20250905001", "workflow_type": "standard"}	/nhap-kho?tab=tat-ca	2025-09-05 23:32:30.80129+07	\N	\N	2025-09-05 23:32:30.80129+07	high
74	1	phieu_nhap_can_duyet	Phiếu nhập PN20250905001 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	read	\N	\N	{"action": "can_duyet", "phieu_id": 1, "priority": "high", "so_phieu": "PN20250905001", "workflow_type": "standard"}	/nhap-kho?tab=can-duyet-cuoi	2025-09-05 23:32:30.811183+07	2025-09-05 23:32:42.529371+07	\N	2025-09-05 23:32:30.811183+07	high
75	17	phieu_nhap_duyet	Phiếu nhập PN20250905001 đã được duyệt	Phiếu nhập kho của bạn đã được phê duyệt và có thể thực hiện	read	\N	\N	{"action": "duyet", "phieu_id": 1, "priority": "normal", "so_phieu": "PN20250905001"}	/nhap-kho?tab=da-duyet	2025-09-05 23:52:34.868665+07	2025-09-05 23:52:51.233577+07	\N	2025-09-05 23:52:34.868665+07	normal
76	1	phieu_xuat_can_duyet	Phiếu xuất đơn vị cần duyệt	Phiếu PX20250905001 từ Phòng HC-KT cần duyệt	read	\N	1	{"action": "submit", "phieu_id": 1, "so_phieu": "PX20250905001"}	/xuat-kho?tab=cho_duyet&highlight=1	2025-09-05 23:54:22.978036+07	2025-09-05 23:54:34.400804+07	\N	2025-09-05 23:54:22.978036+07	normal
77	16	phieu_nhap_can_duyet	Phiếu nhập cần duyệt	Phiếu nhập PN250905001 được tạo tự động từ phiếu xuất PX20250905001	read	\N	2	{"phieu_id": 2, "linked_from": 1}	/nhap-kho?tab=cho_duyet	2025-09-05 23:54:41.995072+07	2025-09-05 23:55:01.296015+07	\N	2025-09-05 23:54:41.995072+07	normal
78	10	phieu_nhap_can_duyet	Phiếu nhập PN20250906001 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	unread	\N	\N	{"action": "can_duyet", "phieu_id": 1, "priority": "high", "so_phieu": "PN20250906001", "workflow_type": "standard"}	/nhap-kho?tab=tat-ca	2025-09-06 07:49:35.666188+07	\N	\N	2025-09-06 07:49:35.666188+07	high
79	11	phieu_nhap_can_duyet	Phiếu nhập PN20250906001 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	unread	\N	\N	{"action": "can_duyet", "phieu_id": 1, "priority": "high", "so_phieu": "PN20250906001", "workflow_type": "standard"}	/nhap-kho?tab=tat-ca	2025-09-06 07:49:35.672022+07	\N	\N	2025-09-06 07:49:35.672022+07	high
82	1	phieu_nhap_can_duyet	Phiếu nhập PN20250906001 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	read	\N	\N	{"action": "can_duyet", "phieu_id": 1, "priority": "high", "so_phieu": "PN20250906001", "workflow_type": "standard"}	/nhap-kho?tab=can-duyet-cuoi	2025-09-06 07:49:35.680454+07	2025-09-06 07:49:59.424308+07	\N	2025-09-06 07:49:35.680454+07	high
83	17	phieu_nhap_duyet	Phiếu nhập PN20250906001 đã được duyệt	Phiếu nhập kho của bạn đã được phê duyệt và có thể thực hiện	read	\N	\N	{"action": "duyet", "phieu_id": 1, "priority": "normal", "so_phieu": "PN20250906001"}	/nhap-kho?tab=da-duyet	2025-09-06 07:50:07.505959+07	2025-09-06 07:50:29.598223+07	\N	2025-09-06 07:50:07.505959+07	normal
84	10	phieu_nhap_can_duyet	Phiếu nhập PN20250906002 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	unread	\N	\N	{"action": "can_duyet", "phieu_id": 2, "priority": "high", "so_phieu": "PN20250906002", "workflow_type": "standard"}	/nhap-kho?tab=tat-ca	2025-09-06 07:57:47.107639+07	\N	\N	2025-09-06 07:57:47.107639+07	high
85	11	phieu_nhap_can_duyet	Phiếu nhập PN20250906002 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	unread	\N	\N	{"action": "can_duyet", "phieu_id": 2, "priority": "high", "so_phieu": "PN20250906002", "workflow_type": "standard"}	/nhap-kho?tab=tat-ca	2025-09-06 07:57:47.110947+07	\N	\N	2025-09-06 07:57:47.110947+07	high
63	13	phieu_nhap_can_duyet	Phiếu nhập PN20250905001 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	read	\N	\N	{"action": "can_duyet", "phieu_id": 12, "priority": "high", "so_phieu": "PN20250905001", "workflow_type": "standard"}	/nhap-kho?tab=tat-ca	2025-09-05 21:59:12.276842+07	2025-09-06 16:39:43.663339+07	\N	2025-09-05 21:59:12.276842+07	high
72	13	phieu_nhap_can_duyet	Phiếu nhập PN20250905001 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	read	\N	\N	{"action": "can_duyet", "phieu_id": 1, "priority": "high", "so_phieu": "PN20250905001", "workflow_type": "standard"}	/nhap-kho?tab=tat-ca	2025-09-05 23:32:30.804062+07	2025-09-06 16:39:43.663339+07	\N	2025-09-05 23:32:30.804062+07	high
88	1	phieu_nhap_can_duyet	Phiếu nhập PN20250906002 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	read	\N	\N	{"action": "can_duyet", "phieu_id": 2, "priority": "high", "so_phieu": "PN20250906002", "workflow_type": "standard"}	/nhap-kho?tab=can-duyet-cuoi	2025-09-06 07:57:47.120247+07	2025-09-06 07:58:07.006893+07	\N	2025-09-06 07:57:47.120247+07	high
89	17	phieu_nhap_duyet	Phiếu nhập PN20250906002 đã được duyệt	Phiếu nhập kho của bạn đã được phê duyệt và có thể thực hiện	read	\N	\N	{"action": "duyet", "phieu_id": 2, "priority": "normal", "so_phieu": "PN20250906002"}	/nhap-kho?tab=da-duyet	2025-09-06 07:58:11.283659+07	2025-09-06 08:00:11.797838+07	\N	2025-09-06 07:58:11.283659+07	normal
90	1	phieu_xuat_can_duyet	Phiếu xuất sử dụng cần duyệt	Phiếu PX20250906001 từ Phòng HC-KT cần duyệt	read	\N	1	{"action": "submit", "phieu_id": 1, "so_phieu": "PX20250906001"}	/xuat-kho?tab=cho_duyet&highlight=1	2025-09-06 08:01:29.832302+07	2025-09-06 08:01:44.00249+07	\N	2025-09-06 08:01:29.832302+07	normal
91	17	phieu_xuat_duyet	Phiếu xuất đã được duyệt	Phiếu xuất PX20250906001 đã được duyệt bởi admin	read	\N	1	{"action": "approved", "phieu_id": 1, "so_phieu": "PX20250906001"}	/xuat-kho?tab=da_duyet	2025-09-06 08:03:37.335145+07	2025-09-06 08:03:53.197188+07	\N	2025-09-06 08:03:37.335145+07	normal
92	1	phieu_xuat_can_duyet	Phiếu xuất đơn vị cần duyệt	Phiếu PX20250906002 từ Phòng HC-KT cần duyệt	read	\N	2	{"action": "submit", "phieu_id": 2, "so_phieu": "PX20250906002"}	/xuat-kho?tab=cho_duyet&highlight=2	2025-09-06 08:12:05.574488+07	2025-09-06 08:12:15.810187+07	\N	2025-09-06 08:12:05.574488+07	normal
93	16	phieu_nhap_can_duyet	Phiếu nhập cần duyệt	Phiếu nhập PN250906001 được tạo tự động từ phiếu xuất PX20250906002	read	\N	3	{"phieu_id": 3, "linked_from": 2}	/nhap-kho?tab=cho_duyet	2025-09-06 08:12:21.107114+07	2025-09-06 08:12:31.311609+07	\N	2025-09-06 08:12:21.107114+07	normal
95	16	phieu_nhap_duyet	Phiếu nhập PN250906001 đã được duyệt	Phiếu nhập kho của bạn đã được phê duyệt và có thể thực hiện	read	\N	\N	{"action": "duyet", "phieu_id": 3, "priority": "normal", "so_phieu": "PN250906001"}	/nhap-kho?tab=da-duyet	2025-09-06 08:33:08.117774+07	2025-09-06 08:33:16.375436+07	\N	2025-09-06 08:33:08.117774+07	normal
94	17	phieu_xuat_duyet	Phiếu xuất đã được duyệt	Phiếu xuất PX20250906002 đã được duyệt đồng bộ với phiếu nhập	read	\N	2	\N	/xuat-kho?tab=da_duyet	2025-09-06 08:33:07.921572+07	2025-09-06 08:34:58.827801+07	\N	2025-09-06 08:33:07.921572+07	normal
73	14	phieu_nhap_can_duyet	Phiếu nhập PN20250905001 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	read	\N	\N	{"action": "can_duyet", "phieu_id": 1, "priority": "high", "so_phieu": "PN20250905001", "workflow_type": "standard"}	/nhap-kho?tab=tat-ca	2025-09-05 23:32:30.807815+07	2025-09-06 08:37:20.325395+07	\N	2025-09-05 23:32:30.807815+07	high
81	14	phieu_nhap_can_duyet	Phiếu nhập PN20250906001 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	read	\N	\N	{"action": "can_duyet", "phieu_id": 1, "priority": "high", "so_phieu": "PN20250906001", "workflow_type": "standard"}	/nhap-kho?tab=tat-ca	2025-09-06 07:49:35.678354+07	2025-09-06 08:37:20.325395+07	\N	2025-09-06 07:49:35.678354+07	high
87	14	phieu_nhap_can_duyet	Phiếu nhập PN20250906002 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	read	\N	\N	{"action": "can_duyet", "phieu_id": 2, "priority": "high", "so_phieu": "PN20250906002", "workflow_type": "standard"}	/nhap-kho?tab=tat-ca	2025-09-06 07:57:47.11655+07	2025-09-06 08:37:20.325395+07	\N	2025-09-06 07:57:47.11655+07	high
80	13	phieu_nhap_can_duyet	Phiếu nhập PN20250906001 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	read	\N	\N	{"action": "can_duyet", "phieu_id": 1, "priority": "high", "so_phieu": "PN20250906001", "workflow_type": "standard"}	/nhap-kho?tab=tat-ca	2025-09-06 07:49:35.674932+07	2025-09-06 16:39:43.663339+07	\N	2025-09-06 07:49:35.674932+07	high
86	13	phieu_nhap_can_duyet	Phiếu nhập PN20250906002 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	read	\N	\N	{"action": "can_duyet", "phieu_id": 2, "priority": "high", "so_phieu": "PN20250906002", "workflow_type": "standard"}	/nhap-kho?tab=tat-ca	2025-09-06 07:57:47.112454+07	2025-09-06 16:39:43.663339+07	\N	2025-09-06 07:57:47.112454+07	high
96	10	phieu_nhap_can_duyet	Phiếu nhập PN20250906003 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	unread	\N	\N	{"action": "can_duyet", "phieu_id": 4, "priority": "high", "so_phieu": "PN20250906003", "workflow_type": "standard"}	/nhap-kho?tab=tat-ca	2025-09-06 16:46:01.159608+07	\N	\N	2025-09-06 16:46:01.159608+07	high
97	11	phieu_nhap_can_duyet	Phiếu nhập PN20250906003 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	unread	\N	\N	{"action": "can_duyet", "phieu_id": 4, "priority": "high", "so_phieu": "PN20250906003", "workflow_type": "standard"}	/nhap-kho?tab=tat-ca	2025-09-06 16:46:01.167887+07	\N	\N	2025-09-06 16:46:01.167887+07	high
98	13	phieu_nhap_can_duyet	Phiếu nhập PN20250906003 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	unread	\N	\N	{"action": "can_duyet", "phieu_id": 4, "priority": "high", "so_phieu": "PN20250906003", "workflow_type": "standard"}	/nhap-kho?tab=tat-ca	2025-09-06 16:46:01.171094+07	\N	\N	2025-09-06 16:46:01.171094+07	high
99	14	phieu_nhap_can_duyet	Phiếu nhập PN20250906003 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	unread	\N	\N	{"action": "can_duyet", "phieu_id": 4, "priority": "high", "so_phieu": "PN20250906003", "workflow_type": "standard"}	/nhap-kho?tab=tat-ca	2025-09-06 16:46:01.17627+07	\N	\N	2025-09-06 16:46:01.17627+07	high
100	1	phieu_nhap_can_duyet	Phiếu nhập PN20250906003 cần duyệt	Phiếu nhập kho từ N/A đang chờ phê duyệt	read	\N	\N	{"action": "can_duyet", "phieu_id": 4, "priority": "high", "so_phieu": "PN20250906003", "workflow_type": "standard"}	/nhap-kho?tab=can_duyet	2025-09-06 16:46:01.179883+07	2025-09-06 16:46:32.087781+07	\N	2025-09-06 16:46:01.179883+07	high
101	15	phieu_nhap_duyet	Phiếu nhập PN20250906003 đã được duyệt	Phiếu nhập kho của bạn đã được phê duyệt và có thể thực hiện	read	\N	\N	{"action": "duyet", "phieu_id": 4, "priority": "normal", "so_phieu": "PN20250906003"}	/nhap-kho?tab=da-duyet	2025-09-06 16:46:46.169786+07	2025-09-06 16:49:29.997477+07	\N	2025-09-06 16:46:46.169786+07	normal
\.


--
-- TOC entry 5438 (class 0 OID 27521)
-- Dependencies: 260
-- Data for Name: phieu_kiem_ke; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.phieu_kiem_ke (id, so_phieu, ngay_kiem_ke, gio_kiem_ke, don_vi_kiem_ke, so_quyet_dinh, ly_do_kiem_ke, loai_kiem_ke, to_kiem_ke, trang_thai, nguoi_tao, nguoi_duyet, ngay_duyet, phong_ban_id, ghi_chu, created_at, updated_at) FROM stdin;
2	01/KK-Q3-2025	2025-09-06	08:00:00	Phòng HC-KT		Kiểm kê định kỳ	dinh_ky	{"thu_kho": "Hoàng Đức Thọ", "to_truong": "Nguyễn Văn Anh", "uy_vien_1": "Lê Tiến Dũng", "uy_vien_2": "Phạm Tuấn Tài", "uy_vien_3": "Lê Việt Anh", "uy_vien_4": "Trần Thúy Hồng"}	confirmed	17	17	2025-09-06 08:50:57.248171	34		2025-09-06 08:50:39.929982	2025-09-06 08:50:39.929982
\.


--
-- TOC entry 5411 (class 0 OID 17904)
-- Dependencies: 231
-- Data for Name: phieu_nhap; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.phieu_nhap (id, so_phieu, ngay_nhap, nha_cung_cap_id, don_vi_van_chuyen_id, ly_do_nhap, loai_phieu, so_hoa_don, tong_tien, trang_thai, nguoi_tao, nguoi_duyet_cap1, ngay_duyet_cap1, phong_ban_id, ghi_chu, created_at, updated_at, nguoi_nhap_hang, so_quyet_dinh, dia_chi_nhap, decision_pdf_url, decision_pdf_filename, ghi_chu_hoan_thanh, ngay_hoan_thanh, phuong_thuc_van_chuyen, ghi_chu_phan_hoi, ngay_gui_duyet, phong_ban_cung_cap_id, phieu_xuat_lien_ket_id, is_tu_dong, nguoi_giao_hang, approved_by_manager, ngay_duyet_manager, nguoi_phan_hoi, ngay_phan_hoi) FROM stdin;
1	PN20250906001	2025-09-06	64	\N	nhu cầu	tu_mua	2311	60000.00	completed	17	1	2025-09-06 07:50:07.50005	34		2025-09-06 07:49:12.082326	2025-09-06 07:50:48.881662	Vũ Văn Biển	QĐ-HV/111	cầu giấy, hà nội	\N	\N	\N	2025-09-06 07:50:48.881662	Đơn vị tự vận chuyển	\N	2025-09-06 07:49:35.651948+07	\N	\N	f	\N	\N	\N	\N	\N
2	PN20250906002	2025-09-06	66	\N	nhu cầu	tren_cap	33	1050000.00	completed	17	1	2025-09-06 07:58:11.278505	34		2025-09-06 07:57:41.82219	2025-09-06 08:00:29.939358	Vũ Văn Biển	QĐ-HV/112	cầu giấy, hà nội	\N	\N	\N	2025-09-06 08:00:29.939358	Đơn vị tự vận chuyển	\N	2025-09-06 07:57:47.087184+07	\N	\N	f	\N	\N	\N	\N	\N
3	PN250906001	2025-09-06	\N	\N	Nhập hàng từ phiếu xuất PX20250906002	dieu_chuyen	\N	30000.00	completed	16	16	2025-09-06 08:33:07.921572	36	\N	2025-09-06 08:12:21.107114	2025-09-06 08:34:07.359406	Đơn vị nhận	\N	\N	\N	\N	\N	2025-09-06 08:34:07.359406	Đơn vị tự vận chuyển	\N	2025-09-06 08:12:21.125+07	34	2	t	Hệ thống	\N	\N	\N	\N
4	PN20250906003	2025-09-06	67	\N	nhu cầu	tren_cap	231142	520000.00	completed	15	1	2025-09-06 16:46:46.157038	28		2025-09-06 16:45:56.028975	2025-09-06 16:48:32.741004	Trung úy Nguyễn Văn G	QĐ-HV/102	cầu giấy, hà nội	\N	\N	\N	2025-09-06 16:48:32.741004	Đơn vị tự vận chuyển	\N	2025-09-06 16:46:01.138768+07	\N	\N	f	\N	\N	\N	\N	\N
\.


--
-- TOC entry 5417 (class 0 OID 17980)
-- Dependencies: 237
-- Data for Name: phieu_xuat; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.phieu_xuat (id, so_phieu, ngay_xuat, don_vi_nhan_id, nguoi_nhan, ly_do_xuat, tong_tien, trang_thai, nguoi_tao, nguoi_duyet_cap1, ngay_duyet_cap1, phong_ban_id, ghi_chu, created_at, updated_at, loai_xuat, decision_pdf_url, decision_pdf_filename, ghi_chu_xac_nhan, ngay_xac_nhan, so_quyet_dinh, ghi_chu_phan_hoi, phong_ban_nhan_id, phieu_nhap_lien_ket_id, is_tu_dong, nguoi_giao_hang, approved_by_manager, ngay_duyet_manager, ngay_gui_duyet, nguoi_phan_hoi, ngay_phan_hoi) FROM stdin;
1	PX20250906001	2025-09-06	\N	Vân Anh	nhu cầu	300000.00	completed	17	1	2025-09-06 08:03:37.335145	34		2025-09-06 08:01:25.911625	2025-09-06 08:09:06.091601	don_vi_su_dung	\N	\N	\N	\N	12/QĐ/HV	\N	\N	\N	f	\N	\N	\N	2025-09-06 08:01:29.832302+07	\N	\N
2	PX20250906002	2025-09-06	\N	thảo 	nhu cầu	30000.00	completed	17	16	2025-09-06 08:33:07.921572	34		2025-09-06 08:12:00.585427	2025-09-06 08:35:03.582659	don_vi_nhan	\N	\N	\N	\N	33/QĐ/HV	\N	36	3	f	\N	\N	\N	2025-09-06 08:12:05.574488+07	\N	\N
\.


--
-- TOC entry 5397 (class 0 OID 17530)
-- Dependencies: 217
-- Data for Name: phong_ban; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.phong_ban (id, ma_phong_ban, ten_phong_ban, mo_ta, trang_thai, created_at, updated_at, cap_bac, phong_ban_cha_id, thu_tu_hien_thi, is_active) FROM stdin;
1	PTM	BTL Vùng Cảnh sát biển 1	Bộ Tư lệnh Vùng Cảnh sát biển 1	active	2025-07-09 22:41:42.510958	2025-09-05 14:08:57.595215	1	\N	1	t
21	TMKH	Ban TMKH	Trực thuộc phòng HC-KT	active	2025-09-05 14:47:13.361201	2025-09-05 14:47:13.361201	3	20	0	t
20	HCKT	Phòng Hậu cần - Kỹ thuật	Trực thuộc BTL Cảnh sát biển. 	active	2025-09-05 14:22:25.698676	2025-09-05 14:54:31.312478	2	\N	0	t
22	HCKT-TT	Ban Tàu thuyền		active	2025-09-05 15:52:06.616712	2025-09-05 15:52:06.616712	3	20	0	t
23	KTDT	Ban Khí tài điện tử		active	2025-09-05 15:52:24.084809	2025-09-05 15:52:24.084809	3	20	0	t
24	QK	Ban Quân khí		active	2025-09-05 15:52:37.45174	2025-09-05 15:52:37.45174	3	20	0	t
25	VT	Ban Vật tư		active	2025-09-05 15:52:51.887849	2025-09-05 15:52:51.887849	3	20	0	t
26	DT	Ban Doanh Trại		active	2025-09-05 15:53:08.715852	2025-09-05 15:53:08.715852	3	20	0	t
27	XD	Ban Xăng dầu		active	2025-09-05 15:53:41.696963	2025-09-05 15:53:41.696963	3	20	0	t
28	QN	Ban Quân nhu		active	2025-09-05 15:53:55.479973	2025-09-05 15:53:55.479973	3	20	0	t
29	QY	Ban Quân y		active	2025-09-05 15:54:08.897321	2025-09-05 15:54:08.897321	3	20	0	t
30	TCDLCL	Ngành TC-ĐL-CL		active	2025-09-05 15:54:28.183214	2025-09-05 15:54:28.183214	3	20	0	t
31	TĐK	Tiểu đội kho		active	2025-09-05 15:54:40.975794	2025-09-05 15:54:40.975794	3	20	0	t
32	TGSX	Tổ tăng gia sản xuất		active	2025-09-05 15:54:59.576078	2025-09-05 15:54:59.576078	3	20	0	t
33	HĐ11	Hải Đoàn 11		active	2025-09-05 15:55:13.097635	2025-09-05 15:55:13.097635	2	\N	0	t
34	PHCKT	Phòng HC-KT		active	2025-09-05 15:56:48.357582	2025-09-05 15:56:48.357582	3	33	0	t
35	HĐ102	Hải Đội 102		active	2025-09-05 15:57:12.40456	2025-09-05 15:57:12.40456	2	\N	0	t
36	NVHĐ	Nghiệp vụ Hải đội		active	2025-09-05 15:57:51.74261	2025-09-05 15:57:51.74261	3	35	0	t
\.


--
-- TOC entry 5421 (class 0 OID 18110)
-- Dependencies: 241
-- Data for Name: ton_kho; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ton_kho (id, hang_hoa_id, phong_ban_id, sl_tot, sl_kem_pham_chat, sl_mat_pham_chat, sl_hong, sl_can_thanh_ly, gia_tri_ton, don_gia_binh_quan, so_luong_dang_su_dung, so_luong_kho_bo, so_luong_kho_don_vi, ngay_cap_nhat, ngay_cap_nhat_pham_chat) FROM stdin;
12	21	34	3.00	0.00	0.00	0.00	0.00	150000.00	50000.00	0.00	0.00	0.00	2025-09-06 08:00:29.939358	\N
14	20	36	1.00	0.00	0.00	0.00	0.00	30000.00	30000.00	0.00	0.00	0.00	2025-09-06 08:34:07.359406	\N
13	22	34	1.00	1.00	0.00	0.00	0.00	300000.00	300000.00	0.00	0.00	0.00	2025-09-06 08:50:57.248171	2025-09-06 08:50:57.248171
11	20	34	1.00	0.00	0.00	0.00	0.00	30000.00	30000.00	0.00	0.00	0.00	2025-09-06 08:50:57.248171	2025-09-06 08:50:57.248171
15	23	28	2.00	0.00	0.00	0.00	0.00	400000.00	200000.00	0.00	0.00	0.00	2025-09-06 16:48:32.741004	\N
16	21	28	2.00	0.00	0.00	0.00	0.00	120000.00	60000.00	0.00	0.00	0.00	2025-09-06 16:48:32.741004	\N
\.


--
-- TOC entry 5399 (class 0 OID 17544)
-- Dependencies: 219
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password, ho_ten, email, phone, phong_ban_id, role, trang_thai, created_at, updated_at) FROM stdin;
11	thaoanh	$2b$10$yUUKK1WtQc7jHw3MgtEEeeMaYJuprbPCnInNfAi2L2d.GZXaR2uKW	Nguyễn Thảo	a@gmail.com	\N	20	manager	active	2025-09-05 14:45:15.201378	2025-09-05 14:45:15.201378
10	hckt	$2b$10$eJpgv9dITzLDgVLRHWBq7.ZDlQx4ueOLjHDdIfZlW3GMED0SMiKhS	Thảo Anh	thaoanhx8@gmail.com	\N	20	manager	active	2025-09-05 14:23:20.015367	2025-09-05 14:45:23.227796
12	tmkh	$2b$10$YHbltpAr63yWbfCUChBWU.8kHqYTZ9NpxFECFGIyEgs4D4WIMc6oO	Bằng	tmkh@gmail.com	\N	21	user	active	2025-09-05 14:53:09.59311	2025-09-05 14:53:09.59311
13	haidoan11	$2b$10$5565UYjg6yBx7K0AtPA92..XzS6OSL8kLPJ9tykgzhso33RXFg1vK	Thanh Thoại	thoai@gmail.com	\N	33	manager	active	2025-09-05 15:59:42.655758	2025-09-05 16:01:47.802745
14	haidoi102	$2b$10$ina1hwdnA2T7EredPmZ0ouTvIVs9o6LV50/Ph2x3rooYGSF2NmaHS	Quang Cường	cuong@gmail.com	\N	35	manager	active	2025-09-05 16:03:19.079144	2025-09-05 16:03:19.079144
15	quannhu	$2b$10$PodC4QdtSuJakNUDvqMhTeuI6blxsedMRCKDtYeWtNuamf1j3z9xu	Vũ Duy Anh	duy@gmail.com	\N	28	user	active	2025-09-05 16:04:33.992793	2025-09-05 16:04:33.992793
16	nghiepvu	$2b$10$EGVEIIuddhZ5YZvxvEb/r.UfYWDYyPR2oWnuJqNd0M7KNWR0NPGuW	Trần Nhật Hiếu	hieu@gmail.com	\N	36	user	active	2025-09-05 16:06:35.608605	2025-09-05 16:06:35.608605
17	haidoan1	$2b$10$nQ6ABSPNVKVpXO3N3ieQDefC0TmgONlyozEmUnGH1ZOlav.MLXsAG	Văn Biển	bien@gmail.com	\N	34	user	active	2025-09-05 19:42:53.650341	2025-09-05 19:42:53.650341
1	admin	$2b$10$bUcBDw.hGK6N3xDzY2A.F.IexgtRKcnfcCaL36wDzzcleuX39arkK	admin	\N	\N	1	admin	active	2025-07-09 22:49:35.323981	2025-09-06 07:58:04.861855
\.


--
-- TOC entry 5436 (class 0 OID 18698)
-- Dependencies: 256
-- Data for Name: workflow_approvals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workflow_approvals (id, yeu_cau_id, step_number, nguoi_duyet, phong_ban_duyet, ngay_nhan, ngay_xu_ly, deadline, ly_do_quyet_dinh, ghi_chu, file_dinh_kem_url, chu_ky_so, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- TOC entry 5430 (class 0 OID 18629)
-- Dependencies: 250
-- Data for Name: workflow_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workflow_settings (id, phong_ban_id, auto_approval_limit, required_approvers, approval_timeout_hours, notify_on_submit, notify_on_approve, notify_on_reject, escalation_hours, allow_self_approval, require_attachment, max_items_per_request, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5492 (class 0 OID 0)
-- Dependencies: 261
-- Name: chi_tiet_kiem_ke_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chi_tiet_kiem_ke_id_seq', 3, true);


--
-- TOC entry 5493 (class 0 OID 0)
-- Dependencies: 232
-- Name: chi_tiet_nhap_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chi_tiet_nhap_id_seq', 6, true);


--
-- TOC entry 5494 (class 0 OID 0)
-- Dependencies: 238
-- Name: chi_tiet_xuat_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chi_tiet_xuat_id_seq', 2, true);


--
-- TOC entry 5495 (class 0 OID 0)
-- Dependencies: 251
-- Name: digital_signatures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.digital_signatures_id_seq', 1, false);


--
-- TOC entry 5496 (class 0 OID 0)
-- Dependencies: 234
-- Name: don_vi_nhan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.don_vi_nhan_id_seq', 27, true);


--
-- TOC entry 5497 (class 0 OID 0)
-- Dependencies: 228
-- Name: don_vi_van_chuyen_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.don_vi_van_chuyen_id_seq', 3, true);


--
-- TOC entry 5498 (class 0 OID 0)
-- Dependencies: 222
-- Name: hang_hoa_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hang_hoa_id_seq', 23, true);


--
-- TOC entry 5499 (class 0 OID 0)
-- Dependencies: 224
-- Name: hang_hoa_seri_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hang_hoa_seri_id_seq', 1, false);


--
-- TOC entry 5500 (class 0 OID 0)
-- Dependencies: 242
-- Name: lich_su_gia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lich_su_gia_id_seq', 1, false);


--
-- TOC entry 5501 (class 0 OID 0)
-- Dependencies: 263
-- Name: lich_su_kiem_ke_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lich_su_kiem_ke_id_seq', 3, true);


--
-- TOC entry 5502 (class 0 OID 0)
-- Dependencies: 220
-- Name: loai_hang_hoa_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.loai_hang_hoa_id_seq', 6, true);


--
-- TOC entry 5503 (class 0 OID 0)
-- Dependencies: 226
-- Name: nha_cung_cap_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nha_cung_cap_id_seq', 67, true);


--
-- TOC entry 5504 (class 0 OID 0)
-- Dependencies: 247
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 101, true);


--
-- TOC entry 5505 (class 0 OID 0)
-- Dependencies: 259
-- Name: phieu_kiem_ke_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.phieu_kiem_ke_id_seq', 2, true);


--
-- TOC entry 5506 (class 0 OID 0)
-- Dependencies: 230
-- Name: phieu_nhap_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.phieu_nhap_id_seq', 4, true);


--
-- TOC entry 5507 (class 0 OID 0)
-- Dependencies: 236
-- Name: phieu_xuat_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.phieu_xuat_id_seq', 2, true);


--
-- TOC entry 5508 (class 0 OID 0)
-- Dependencies: 216
-- Name: phong_ban_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.phong_ban_id_seq', 36, true);


--
-- TOC entry 5509 (class 0 OID 0)
-- Dependencies: 246
-- Name: seq_phieu_kiem_ke; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seq_phieu_kiem_ke', 1, false);


--
-- TOC entry 5510 (class 0 OID 0)
-- Dependencies: 244
-- Name: seq_phieu_nhap; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seq_phieu_nhap', 3, true);


--
-- TOC entry 5511 (class 0 OID 0)
-- Dependencies: 245
-- Name: seq_phieu_xuat; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seq_phieu_xuat', 2, true);


--
-- TOC entry 5512 (class 0 OID 0)
-- Dependencies: 253
-- Name: seq_yeu_cau_nhap; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seq_yeu_cau_nhap', 1, false);


--
-- TOC entry 5513 (class 0 OID 0)
-- Dependencies: 254
-- Name: seq_yeu_cau_xuat; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seq_yeu_cau_xuat', 1, false);


--
-- TOC entry 5514 (class 0 OID 0)
-- Dependencies: 240
-- Name: ton_kho_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ton_kho_id_seq', 16, true);


--
-- TOC entry 5515 (class 0 OID 0)
-- Dependencies: 218
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 17, true);


--
-- TOC entry 5516 (class 0 OID 0)
-- Dependencies: 255
-- Name: workflow_approvals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.workflow_approvals_id_seq', 1, false);


--
-- TOC entry 5517 (class 0 OID 0)
-- Dependencies: 249
-- Name: workflow_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.workflow_settings_id_seq', 1, false);


--
-- TOC entry 5180 (class 2606 OID 27575)
-- Name: chi_tiet_kiem_ke chi_tiet_kiem_ke_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chi_tiet_kiem_ke
    ADD CONSTRAINT chi_tiet_kiem_ke_pkey PRIMARY KEY (id);


--
-- TOC entry 5126 (class 2606 OID 17954)
-- Name: chi_tiet_nhap chi_tiet_nhap_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chi_tiet_nhap
    ADD CONSTRAINT chi_tiet_nhap_pkey PRIMARY KEY (id);


--
-- TOC entry 5149 (class 2606 OID 18025)
-- Name: chi_tiet_xuat chi_tiet_xuat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chi_tiet_xuat
    ADD CONSTRAINT chi_tiet_xuat_pkey PRIMARY KEY (id);


--
-- TOC entry 5169 (class 2606 OID 18665)
-- Name: digital_signatures digital_signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.digital_signatures
    ADD CONSTRAINT digital_signatures_pkey PRIMARY KEY (id);


--
-- TOC entry 5128 (class 2606 OID 17977)
-- Name: don_vi_nhan don_vi_nhan_ma_don_vi_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.don_vi_nhan
    ADD CONSTRAINT don_vi_nhan_ma_don_vi_key UNIQUE (ma_don_vi);


--
-- TOC entry 5130 (class 2606 OID 17975)
-- Name: don_vi_nhan don_vi_nhan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.don_vi_nhan
    ADD CONSTRAINT don_vi_nhan_pkey PRIMARY KEY (id);


--
-- TOC entry 5112 (class 2606 OID 17902)
-- Name: don_vi_van_chuyen don_vi_van_chuyen_ma_dvvc_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.don_vi_van_chuyen
    ADD CONSTRAINT don_vi_van_chuyen_ma_dvvc_key UNIQUE (ma_dvvc);


--
-- TOC entry 5114 (class 2606 OID 17900)
-- Name: don_vi_van_chuyen don_vi_van_chuyen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.don_vi_van_chuyen
    ADD CONSTRAINT don_vi_van_chuyen_pkey PRIMARY KEY (id);


--
-- TOC entry 5093 (class 2606 OID 17848)
-- Name: hang_hoa hang_hoa_ma_hang_hoa_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hang_hoa
    ADD CONSTRAINT hang_hoa_ma_hang_hoa_key UNIQUE (ma_hang_hoa);


--
-- TOC entry 5095 (class 2606 OID 17846)
-- Name: hang_hoa hang_hoa_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hang_hoa
    ADD CONSTRAINT hang_hoa_pkey PRIMARY KEY (id);


--
-- TOC entry 5099 (class 2606 OID 17872)
-- Name: hang_hoa_seri hang_hoa_seri_hang_hoa_id_so_seri_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hang_hoa_seri
    ADD CONSTRAINT hang_hoa_seri_hang_hoa_id_so_seri_key UNIQUE (hang_hoa_id, so_seri);


--
-- TOC entry 5101 (class 2606 OID 17870)
-- Name: hang_hoa_seri hang_hoa_seri_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hang_hoa_seri
    ADD CONSTRAINT hang_hoa_seri_pkey PRIMARY KEY (id);


--
-- TOC entry 5155 (class 2606 OID 18148)
-- Name: lich_su_gia lich_su_gia_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_su_gia
    ADD CONSTRAINT lich_su_gia_pkey PRIMARY KEY (id);


--
-- TOC entry 5182 (class 2606 OID 27604)
-- Name: lich_su_kiem_ke lich_su_kiem_ke_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_su_kiem_ke
    ADD CONSTRAINT lich_su_kiem_ke_pkey PRIMARY KEY (id);


--
-- TOC entry 5089 (class 2606 OID 17831)
-- Name: loai_hang_hoa loai_hang_hoa_ma_loai_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loai_hang_hoa
    ADD CONSTRAINT loai_hang_hoa_ma_loai_key UNIQUE (ma_loai);


--
-- TOC entry 5091 (class 2606 OID 17829)
-- Name: loai_hang_hoa loai_hang_hoa_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loai_hang_hoa
    ADD CONSTRAINT loai_hang_hoa_pkey PRIMARY KEY (id);


--
-- TOC entry 5108 (class 2606 OID 17890)
-- Name: nha_cung_cap nha_cung_cap_ma_ncc_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nha_cung_cap
    ADD CONSTRAINT nha_cung_cap_ma_ncc_key UNIQUE (ma_ncc);


--
-- TOC entry 5110 (class 2606 OID 17888)
-- Name: nha_cung_cap nha_cung_cap_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nha_cung_cap
    ADD CONSTRAINT nha_cung_cap_pkey PRIMARY KEY (id);


--
-- TOC entry 5165 (class 2606 OID 18618)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 5176 (class 2606 OID 27535)
-- Name: phieu_kiem_ke phieu_kiem_ke_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_kiem_ke
    ADD CONSTRAINT phieu_kiem_ke_pkey PRIMARY KEY (id);


--
-- TOC entry 5178 (class 2606 OID 27537)
-- Name: phieu_kiem_ke phieu_kiem_ke_so_phieu_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_kiem_ke
    ADD CONSTRAINT phieu_kiem_ke_so_phieu_key UNIQUE (so_phieu);


--
-- TOC entry 5122 (class 2606 OID 17916)
-- Name: phieu_nhap phieu_nhap_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_nhap
    ADD CONSTRAINT phieu_nhap_pkey PRIMARY KEY (id);


--
-- TOC entry 5124 (class 2606 OID 17918)
-- Name: phieu_nhap phieu_nhap_so_phieu_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_nhap
    ADD CONSTRAINT phieu_nhap_so_phieu_key UNIQUE (so_phieu);


--
-- TOC entry 5145 (class 2606 OID 17992)
-- Name: phieu_xuat phieu_xuat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_xuat
    ADD CONSTRAINT phieu_xuat_pkey PRIMARY KEY (id);


--
-- TOC entry 5147 (class 2606 OID 17994)
-- Name: phieu_xuat phieu_xuat_so_phieu_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_xuat
    ADD CONSTRAINT phieu_xuat_so_phieu_key UNIQUE (so_phieu);


--
-- TOC entry 5081 (class 2606 OID 17542)
-- Name: phong_ban phong_ban_ma_phong_ban_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phong_ban
    ADD CONSTRAINT phong_ban_ma_phong_ban_key UNIQUE (ma_phong_ban);


--
-- TOC entry 5083 (class 2606 OID 17540)
-- Name: phong_ban phong_ban_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phong_ban
    ADD CONSTRAINT phong_ban_pkey PRIMARY KEY (id);


--
-- TOC entry 5151 (class 2606 OID 18129)
-- Name: ton_kho ton_kho_hang_hoa_id_phong_ban_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ton_kho
    ADD CONSTRAINT ton_kho_hang_hoa_id_phong_ban_id_key UNIQUE (hang_hoa_id, phong_ban_id);


--
-- TOC entry 5153 (class 2606 OID 18127)
-- Name: ton_kho ton_kho_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ton_kho
    ADD CONSTRAINT ton_kho_pkey PRIMARY KEY (id);


--
-- TOC entry 5085 (class 2606 OID 17555)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5087 (class 2606 OID 17557)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 5174 (class 2606 OID 18708)
-- Name: workflow_approvals workflow_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_approvals
    ADD CONSTRAINT workflow_approvals_pkey PRIMARY KEY (id);


--
-- TOC entry 5167 (class 2606 OID 18647)
-- Name: workflow_settings workflow_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_settings
    ADD CONSTRAINT workflow_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 5131 (class 1259 OID 18335)
-- Name: idx_don_vi_nhan_loai_don_vi; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_don_vi_nhan_loai_don_vi ON public.don_vi_nhan USING btree (loai_don_vi);


--
-- TOC entry 5132 (class 1259 OID 18333)
-- Name: idx_don_vi_nhan_ma_don_vi; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_don_vi_nhan_ma_don_vi ON public.don_vi_nhan USING btree (ma_don_vi);


--
-- TOC entry 5133 (class 1259 OID 18991)
-- Name: idx_don_vi_nhan_noi_bo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_don_vi_nhan_noi_bo ON public.don_vi_nhan USING btree (is_noi_bo, phong_ban_id);


--
-- TOC entry 5134 (class 1259 OID 18336)
-- Name: idx_don_vi_nhan_phong_ban_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_don_vi_nhan_phong_ban_id ON public.don_vi_nhan USING btree (phong_ban_id);


--
-- TOC entry 5135 (class 1259 OID 18334)
-- Name: idx_don_vi_nhan_ten_don_vi; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_don_vi_nhan_ten_don_vi ON public.don_vi_nhan USING btree (ten_don_vi);


--
-- TOC entry 5136 (class 1259 OID 18337)
-- Name: idx_don_vi_nhan_trang_thai; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_don_vi_nhan_trang_thai ON public.don_vi_nhan USING btree (trang_thai);


--
-- TOC entry 5096 (class 1259 OID 18283)
-- Name: idx_hang_hoa_ten_search; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hang_hoa_ten_search ON public.hang_hoa USING gin (to_tsvector('simple'::regconfig, (ten_hang_hoa)::text));


--
-- TOC entry 5097 (class 1259 OID 18285)
-- Name: idx_hang_hoa_ten_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hang_hoa_ten_trgm ON public.hang_hoa USING gin (ten_hang_hoa public.gin_trgm_ops);


--
-- TOC entry 5102 (class 1259 OID 19148)
-- Name: idx_nha_cung_cap_loai; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nha_cung_cap_loai ON public.nha_cung_cap USING btree (loai_nha_cung_cap, trang_thai);


--
-- TOC entry 5103 (class 1259 OID 18990)
-- Name: idx_nha_cung_cap_noi_bo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nha_cung_cap_noi_bo ON public.nha_cung_cap USING btree (is_noi_bo, phong_ban_id);


--
-- TOC entry 5104 (class 1259 OID 19021)
-- Name: idx_nha_cung_cap_phong_ban; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nha_cung_cap_phong_ban ON public.nha_cung_cap USING btree (phong_ban_id) WHERE (is_noi_bo = true);


--
-- TOC entry 5105 (class 1259 OID 18284)
-- Name: idx_nha_cung_cap_ten_search; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nha_cung_cap_ten_search ON public.nha_cung_cap USING gin (to_tsvector('simple'::regconfig, (ten_ncc)::text));


--
-- TOC entry 5106 (class 1259 OID 18286)
-- Name: idx_nha_cung_cap_ten_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nha_cung_cap_ten_trgm ON public.nha_cung_cap USING gin (ten_ncc public.gin_trgm_ops);


--
-- TOC entry 5156 (class 1259 OID 18921)
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- TOC entry 5157 (class 1259 OID 18627)
-- Name: idx_notifications_created_desc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_created_desc ON public.notifications USING btree (created_at DESC);


--
-- TOC entry 5158 (class 1259 OID 18937)
-- Name: idx_notifications_loai; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_loai ON public.notifications USING btree (loai_thong_bao);


--
-- TOC entry 5159 (class 1259 OID 18938)
-- Name: idx_notifications_loai_thong_bao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_loai_thong_bao ON public.notifications USING btree (loai_thong_bao);


--
-- TOC entry 5160 (class 1259 OID 18919)
-- Name: idx_notifications_muc_do_uu_tien; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_muc_do_uu_tien ON public.notifications USING btree (muc_do_uu_tien);


--
-- TOC entry 5161 (class 1259 OID 18624)
-- Name: idx_notifications_nguoi_nhan; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_nguoi_nhan ON public.notifications USING btree (nguoi_nhan);


--
-- TOC entry 5162 (class 1259 OID 18920)
-- Name: idx_notifications_nguoi_nhan_trang_thai; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_nguoi_nhan_trang_thai ON public.notifications USING btree (nguoi_nhan, trang_thai);


--
-- TOC entry 5163 (class 1259 OID 18625)
-- Name: idx_notifications_trang_thai; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_trang_thai ON public.notifications USING btree (trang_thai);


--
-- TOC entry 5115 (class 1259 OID 19140)
-- Name: idx_phieu_nhap_loai_trang_thai; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_phieu_nhap_loai_trang_thai ON public.phieu_nhap USING btree (loai_phieu, trang_thai);


--
-- TOC entry 5116 (class 1259 OID 19142)
-- Name: idx_phieu_nhap_ngay_trang_thai; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_phieu_nhap_ngay_trang_thai ON public.phieu_nhap USING btree (ngay_nhap, trang_thai);


--
-- TOC entry 5117 (class 1259 OID 18870)
-- Name: idx_phieu_nhap_phong_ban_cung_cap; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_phieu_nhap_phong_ban_cung_cap ON public.phieu_nhap USING btree (phong_ban_cung_cap_id);


--
-- TOC entry 5118 (class 1259 OID 19138)
-- Name: idx_phieu_nhap_phong_ban_trang_thai; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_phieu_nhap_phong_ban_trang_thai ON public.phieu_nhap USING btree (phong_ban_id, trang_thai);


--
-- TOC entry 5119 (class 1259 OID 18988)
-- Name: idx_phieu_nhap_tu_dong; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_phieu_nhap_tu_dong ON public.phieu_nhap USING btree (is_tu_dong);


--
-- TOC entry 5120 (class 1259 OID 18872)
-- Name: idx_phieu_nhap_xuat_lien_ket; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_phieu_nhap_xuat_lien_ket ON public.phieu_nhap USING btree (phieu_xuat_lien_ket_id);


--
-- TOC entry 5137 (class 1259 OID 19141)
-- Name: idx_phieu_xuat_loai_trang_thai; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_phieu_xuat_loai_trang_thai ON public.phieu_xuat USING btree (loai_xuat, trang_thai);


--
-- TOC entry 5138 (class 1259 OID 19143)
-- Name: idx_phieu_xuat_ngay_trang_thai; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_phieu_xuat_ngay_trang_thai ON public.phieu_xuat USING btree (ngay_xuat, trang_thai);


--
-- TOC entry 5139 (class 1259 OID 18873)
-- Name: idx_phieu_xuat_nhap_lien_ket; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_phieu_xuat_nhap_lien_ket ON public.phieu_xuat USING btree (phieu_nhap_lien_ket_id);


--
-- TOC entry 5140 (class 1259 OID 18871)
-- Name: idx_phieu_xuat_phong_ban_nhan; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_phieu_xuat_phong_ban_nhan ON public.phieu_xuat USING btree (phong_ban_nhan_id);


--
-- TOC entry 5141 (class 1259 OID 19139)
-- Name: idx_phieu_xuat_phong_ban_trang_thai; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_phieu_xuat_phong_ban_trang_thai ON public.phieu_xuat USING btree (phong_ban_id, trang_thai);


--
-- TOC entry 5142 (class 1259 OID 18358)
-- Name: idx_phieu_xuat_so_quyet_dinh; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_phieu_xuat_so_quyet_dinh ON public.phieu_xuat USING btree (so_quyet_dinh);


--
-- TOC entry 5143 (class 1259 OID 18989)
-- Name: idx_phieu_xuat_tu_dong; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_phieu_xuat_tu_dong ON public.phieu_xuat USING btree (is_tu_dong);


--
-- TOC entry 5078 (class 1259 OID 18803)
-- Name: idx_phong_ban_cap_bac; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_phong_ban_cap_bac ON public.phong_ban USING btree (cap_bac);


--
-- TOC entry 5079 (class 1259 OID 18804)
-- Name: idx_phong_ban_cha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_phong_ban_cha ON public.phong_ban USING btree (phong_ban_cha_id);


--
-- TOC entry 5170 (class 1259 OID 18678)
-- Name: idx_signatures_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signatures_hash ON public.digital_signatures USING btree (signature_hash);


--
-- TOC entry 5171 (class 1259 OID 18676)
-- Name: idx_signatures_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signatures_user ON public.digital_signatures USING btree (user_id);


--
-- TOC entry 5172 (class 1259 OID 18720)
-- Name: idx_workflow_nguoi_duyet; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_workflow_nguoi_duyet ON public.workflow_approvals USING btree (nguoi_duyet);


--
-- TOC entry 5249 (class 2620 OID 27621)
-- Name: phieu_kiem_ke tr_auto_so_phieu_kiem_ke; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_auto_so_phieu_kiem_ke BEFORE INSERT ON public.phieu_kiem_ke FOR EACH ROW EXECUTE FUNCTION public.auto_generate_so_phieu_kiem_ke();


--
-- TOC entry 5235 (class 2620 OID 18198)
-- Name: phieu_nhap tr_auto_so_phieu_nhap; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_auto_so_phieu_nhap BEFORE INSERT ON public.phieu_nhap FOR EACH ROW EXECUTE FUNCTION public.auto_generate_so_phieu_nhap();


--
-- TOC entry 5236 (class 2620 OID 18190)
-- Name: phieu_nhap tr_check_permission_nhap; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_check_permission_nhap BEFORE INSERT ON public.phieu_nhap FOR EACH ROW EXECUTE FUNCTION public.check_permission_phong_ban();


--
-- TOC entry 5244 (class 2620 OID 18191)
-- Name: phieu_xuat tr_check_permission_xuat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_check_permission_xuat BEFORE INSERT ON public.phieu_xuat FOR EACH ROW EXECUTE FUNCTION public.check_permission_phong_ban();


--
-- TOC entry 5237 (class 2620 OID 18298)
-- Name: phieu_nhap tr_check_phieu_nhap_editable; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_check_phieu_nhap_editable BEFORE UPDATE ON public.phieu_nhap FOR EACH ROW EXECUTE FUNCTION public.check_phieu_nhap_editable();


--
-- TOC entry 5243 (class 2620 OID 18338)
-- Name: don_vi_nhan tr_don_vi_nhan_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_don_vi_nhan_updated_at BEFORE UPDATE ON public.don_vi_nhan FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- TOC entry 5234 (class 2620 OID 18182)
-- Name: hang_hoa tr_hang_hoa_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_hang_hoa_updated_at BEFORE UPDATE ON public.hang_hoa FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- TOC entry 5238 (class 2620 OID 18183)
-- Name: phieu_nhap tr_phieu_nhap_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_phieu_nhap_updated_at BEFORE UPDATE ON public.phieu_nhap FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- TOC entry 5245 (class 2620 OID 18184)
-- Name: phieu_xuat tr_phieu_xuat_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_phieu_xuat_updated_at BEFORE UPDATE ON public.phieu_xuat FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- TOC entry 5232 (class 2620 OID 18180)
-- Name: phong_ban tr_phong_ban_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_phong_ban_updated_at BEFORE UPDATE ON public.phong_ban FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- TOC entry 5240 (class 2620 OID 18295)
-- Name: chi_tiet_nhap tr_reverse_ton_kho_before_delete; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_reverse_ton_kho_before_delete BEFORE DELETE ON public.chi_tiet_nhap FOR EACH ROW EXECUTE FUNCTION public.reverse_ton_kho_nhap();


--
-- TOC entry 5241 (class 2620 OID 18293)
-- Name: chi_tiet_nhap tr_reverse_ton_kho_before_delete_nhap; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_reverse_ton_kho_before_delete_nhap BEFORE DELETE ON public.chi_tiet_nhap FOR EACH ROW EXECUTE FUNCTION public.reverse_ton_kho_nhap();


--
-- TOC entry 5239 (class 2620 OID 27514)
-- Name: phieu_nhap tr_ton_kho_unified_nhap; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_ton_kho_unified_nhap AFTER UPDATE ON public.phieu_nhap FOR EACH ROW WHEN ((new.trang_thai IS DISTINCT FROM old.trang_thai)) EXECUTE FUNCTION public.update_ton_kho_unified();


--
-- TOC entry 5246 (class 2620 OID 27515)
-- Name: phieu_xuat tr_ton_kho_unified_xuat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_ton_kho_unified_xuat AFTER UPDATE ON public.phieu_xuat FOR EACH ROW WHEN ((new.trang_thai IS DISTINCT FROM old.trang_thai)) EXECUTE FUNCTION public.update_ton_kho_unified();


--
-- TOC entry 5247 (class 2620 OID 18296)
-- Name: lich_su_gia tr_update_gia_nhap_gan_nhat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_update_gia_nhap_gan_nhat AFTER INSERT ON public.lich_su_gia FOR EACH ROW EXECUTE FUNCTION public.update_gia_nhap_gan_nhat();


--
-- TOC entry 5250 (class 2620 OID 27620)
-- Name: phieu_kiem_ke tr_update_ton_kho_after_kiem_ke; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_update_ton_kho_after_kiem_ke AFTER UPDATE ON public.phieu_kiem_ke FOR EACH ROW WHEN ((new.trang_thai IS DISTINCT FROM old.trang_thai)) EXECUTE FUNCTION public.update_ton_kho_after_kiem_ke();


--
-- TOC entry 5242 (class 2620 OID 18355)
-- Name: chi_tiet_nhap tr_update_ton_kho_after_nhap; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_update_ton_kho_after_nhap AFTER INSERT ON public.chi_tiet_nhap FOR EACH ROW EXECUTE FUNCTION public.update_ton_kho_nhap_v2();


--
-- TOC entry 5233 (class 2620 OID 18181)
-- Name: users tr_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- TOC entry 5248 (class 2620 OID 18733)
-- Name: workflow_settings tr_workflow_settings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_workflow_settings_updated_at BEFORE UPDATE ON public.workflow_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- TOC entry 5227 (class 2606 OID 27581)
-- Name: chi_tiet_kiem_ke chi_tiet_kiem_ke_hang_hoa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chi_tiet_kiem_ke
    ADD CONSTRAINT chi_tiet_kiem_ke_hang_hoa_id_fkey FOREIGN KEY (hang_hoa_id) REFERENCES public.hang_hoa(id);


--
-- TOC entry 5228 (class 2606 OID 27576)
-- Name: chi_tiet_kiem_ke chi_tiet_kiem_ke_phieu_kiem_ke_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chi_tiet_kiem_ke
    ADD CONSTRAINT chi_tiet_kiem_ke_phieu_kiem_ke_id_fkey FOREIGN KEY (phieu_kiem_ke_id) REFERENCES public.phieu_kiem_ke(id) ON DELETE CASCADE;


--
-- TOC entry 5198 (class 2606 OID 17960)
-- Name: chi_tiet_nhap chi_tiet_nhap_hang_hoa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chi_tiet_nhap
    ADD CONSTRAINT chi_tiet_nhap_hang_hoa_id_fkey FOREIGN KEY (hang_hoa_id) REFERENCES public.hang_hoa(id);


--
-- TOC entry 5199 (class 2606 OID 17955)
-- Name: chi_tiet_nhap chi_tiet_nhap_phieu_nhap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chi_tiet_nhap
    ADD CONSTRAINT chi_tiet_nhap_phieu_nhap_id_fkey FOREIGN KEY (phieu_nhap_id) REFERENCES public.phieu_nhap(id) ON DELETE CASCADE;


--
-- TOC entry 5211 (class 2606 OID 18031)
-- Name: chi_tiet_xuat chi_tiet_xuat_hang_hoa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chi_tiet_xuat
    ADD CONSTRAINT chi_tiet_xuat_hang_hoa_id_fkey FOREIGN KEY (hang_hoa_id) REFERENCES public.hang_hoa(id);


--
-- TOC entry 5212 (class 2606 OID 18415)
-- Name: chi_tiet_xuat chi_tiet_xuat_phieu_nhap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chi_tiet_xuat
    ADD CONSTRAINT chi_tiet_xuat_phieu_nhap_id_fkey FOREIGN KEY (phieu_nhap_id) REFERENCES public.phieu_nhap(id);


--
-- TOC entry 5213 (class 2606 OID 18026)
-- Name: chi_tiet_xuat chi_tiet_xuat_phieu_xuat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chi_tiet_xuat
    ADD CONSTRAINT chi_tiet_xuat_phieu_xuat_id_fkey FOREIGN KEY (phieu_xuat_id) REFERENCES public.phieu_xuat(id) ON DELETE CASCADE;


--
-- TOC entry 5220 (class 2606 OID 18666)
-- Name: digital_signatures digital_signatures_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.digital_signatures
    ADD CONSTRAINT digital_signatures_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5221 (class 2606 OID 18671)
-- Name: digital_signatures digital_signatures_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.digital_signatures
    ADD CONSTRAINT digital_signatures_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- TOC entry 5200 (class 2606 OID 18328)
-- Name: don_vi_nhan don_vi_nhan_nguoi_cap_nhat_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.don_vi_nhan
    ADD CONSTRAINT don_vi_nhan_nguoi_cap_nhat_fkey FOREIGN KEY (nguoi_cap_nhat) REFERENCES public.users(id);


--
-- TOC entry 5201 (class 2606 OID 18323)
-- Name: don_vi_nhan don_vi_nhan_nguoi_tao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.don_vi_nhan
    ADD CONSTRAINT don_vi_nhan_nguoi_tao_fkey FOREIGN KEY (nguoi_tao) REFERENCES public.users(id);


--
-- TOC entry 5202 (class 2606 OID 18317)
-- Name: don_vi_nhan don_vi_nhan_phong_ban_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.don_vi_nhan
    ADD CONSTRAINT don_vi_nhan_phong_ban_id_fkey FOREIGN KEY (phong_ban_id) REFERENCES public.phong_ban(id);


--
-- TOC entry 5185 (class 2606 OID 17849)
-- Name: hang_hoa hang_hoa_loai_hang_hoa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hang_hoa
    ADD CONSTRAINT hang_hoa_loai_hang_hoa_id_fkey FOREIGN KEY (loai_hang_hoa_id) REFERENCES public.loai_hang_hoa(id);


--
-- TOC entry 5186 (class 2606 OID 17854)
-- Name: hang_hoa hang_hoa_phong_ban_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hang_hoa
    ADD CONSTRAINT hang_hoa_phong_ban_id_fkey FOREIGN KEY (phong_ban_id) REFERENCES public.phong_ban(id);


--
-- TOC entry 5187 (class 2606 OID 17873)
-- Name: hang_hoa_seri hang_hoa_seri_hang_hoa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hang_hoa_seri
    ADD CONSTRAINT hang_hoa_seri_hang_hoa_id_fkey FOREIGN KEY (hang_hoa_id) REFERENCES public.hang_hoa(id);


--
-- TOC entry 5216 (class 2606 OID 18149)
-- Name: lich_su_gia lich_su_gia_hang_hoa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_su_gia
    ADD CONSTRAINT lich_su_gia_hang_hoa_id_fkey FOREIGN KEY (hang_hoa_id) REFERENCES public.hang_hoa(id);


--
-- TOC entry 5217 (class 2606 OID 18154)
-- Name: lich_su_gia lich_su_gia_phieu_nhap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_su_gia
    ADD CONSTRAINT lich_su_gia_phieu_nhap_id_fkey FOREIGN KEY (phieu_nhap_id) REFERENCES public.phieu_nhap(id);


--
-- TOC entry 5229 (class 2606 OID 27605)
-- Name: lich_su_kiem_ke lich_su_kiem_ke_hang_hoa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_su_kiem_ke
    ADD CONSTRAINT lich_su_kiem_ke_hang_hoa_id_fkey FOREIGN KEY (hang_hoa_id) REFERENCES public.hang_hoa(id);


--
-- TOC entry 5230 (class 2606 OID 27610)
-- Name: lich_su_kiem_ke lich_su_kiem_ke_phieu_kiem_ke_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_su_kiem_ke
    ADD CONSTRAINT lich_su_kiem_ke_phieu_kiem_ke_id_fkey FOREIGN KEY (phieu_kiem_ke_id) REFERENCES public.phieu_kiem_ke(id);


--
-- TOC entry 5231 (class 2606 OID 27615)
-- Name: lich_su_kiem_ke lich_su_kiem_ke_phong_ban_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_su_kiem_ke
    ADD CONSTRAINT lich_su_kiem_ke_phong_ban_id_fkey FOREIGN KEY (phong_ban_id) REFERENCES public.phong_ban(id);


--
-- TOC entry 5188 (class 2606 OID 18971)
-- Name: nha_cung_cap nha_cung_cap_phong_ban_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nha_cung_cap
    ADD CONSTRAINT nha_cung_cap_phong_ban_id_fkey FOREIGN KEY (phong_ban_id) REFERENCES public.phong_ban(id);


--
-- TOC entry 5218 (class 2606 OID 18619)
-- Name: notifications notifications_nguoi_nhan_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_nguoi_nhan_fkey FOREIGN KEY (nguoi_nhan) REFERENCES public.users(id);


--
-- TOC entry 5224 (class 2606 OID 27543)
-- Name: phieu_kiem_ke phieu_kiem_ke_nguoi_duyet_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_kiem_ke
    ADD CONSTRAINT phieu_kiem_ke_nguoi_duyet_fkey FOREIGN KEY (nguoi_duyet) REFERENCES public.users(id);


--
-- TOC entry 5225 (class 2606 OID 27538)
-- Name: phieu_kiem_ke phieu_kiem_ke_nguoi_tao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_kiem_ke
    ADD CONSTRAINT phieu_kiem_ke_nguoi_tao_fkey FOREIGN KEY (nguoi_tao) REFERENCES public.users(id);


--
-- TOC entry 5226 (class 2606 OID 27548)
-- Name: phieu_kiem_ke phieu_kiem_ke_phong_ban_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_kiem_ke
    ADD CONSTRAINT phieu_kiem_ke_phong_ban_id_fkey FOREIGN KEY (phong_ban_id) REFERENCES public.phong_ban(id);


--
-- TOC entry 5189 (class 2606 OID 18997)
-- Name: phieu_nhap phieu_nhap_approved_by_manager_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_nhap
    ADD CONSTRAINT phieu_nhap_approved_by_manager_fkey FOREIGN KEY (approved_by_manager) REFERENCES public.users(id);


--
-- TOC entry 5190 (class 2606 OID 17924)
-- Name: phieu_nhap phieu_nhap_don_vi_van_chuyen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_nhap
    ADD CONSTRAINT phieu_nhap_don_vi_van_chuyen_id_fkey FOREIGN KEY (don_vi_van_chuyen_id) REFERENCES public.don_vi_van_chuyen(id);


--
-- TOC entry 5191 (class 2606 OID 17934)
-- Name: phieu_nhap phieu_nhap_nguoi_duyet_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_nhap
    ADD CONSTRAINT phieu_nhap_nguoi_duyet_fkey FOREIGN KEY (nguoi_duyet_cap1) REFERENCES public.users(id);


--
-- TOC entry 5192 (class 2606 OID 19152)
-- Name: phieu_nhap phieu_nhap_nguoi_phan_hoi_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_nhap
    ADD CONSTRAINT phieu_nhap_nguoi_phan_hoi_fkey FOREIGN KEY (nguoi_phan_hoi) REFERENCES public.users(id);


--
-- TOC entry 5193 (class 2606 OID 17929)
-- Name: phieu_nhap phieu_nhap_nguoi_tao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_nhap
    ADD CONSTRAINT phieu_nhap_nguoi_tao_fkey FOREIGN KEY (nguoi_tao) REFERENCES public.users(id);


--
-- TOC entry 5194 (class 2606 OID 17919)
-- Name: phieu_nhap phieu_nhap_nha_cung_cap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_nhap
    ADD CONSTRAINT phieu_nhap_nha_cung_cap_id_fkey FOREIGN KEY (nha_cung_cap_id) REFERENCES public.nha_cung_cap(id);


--
-- TOC entry 5195 (class 2606 OID 18846)
-- Name: phieu_nhap phieu_nhap_phieu_xuat_lien_ket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_nhap
    ADD CONSTRAINT phieu_nhap_phieu_xuat_lien_ket_id_fkey FOREIGN KEY (phieu_xuat_lien_ket_id) REFERENCES public.phieu_xuat(id);


--
-- TOC entry 5196 (class 2606 OID 18841)
-- Name: phieu_nhap phieu_nhap_phong_ban_cung_cap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_nhap
    ADD CONSTRAINT phieu_nhap_phong_ban_cung_cap_id_fkey FOREIGN KEY (phong_ban_cung_cap_id) REFERENCES public.phong_ban(id);


--
-- TOC entry 5197 (class 2606 OID 17939)
-- Name: phieu_nhap phieu_nhap_phong_ban_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_nhap
    ADD CONSTRAINT phieu_nhap_phong_ban_id_fkey FOREIGN KEY (phong_ban_id) REFERENCES public.phong_ban(id);


--
-- TOC entry 5203 (class 2606 OID 19004)
-- Name: phieu_xuat phieu_xuat_approved_by_manager_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_xuat
    ADD CONSTRAINT phieu_xuat_approved_by_manager_fkey FOREIGN KEY (approved_by_manager) REFERENCES public.users(id);


--
-- TOC entry 5204 (class 2606 OID 17995)
-- Name: phieu_xuat phieu_xuat_don_vi_nhan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_xuat
    ADD CONSTRAINT phieu_xuat_don_vi_nhan_id_fkey FOREIGN KEY (don_vi_nhan_id) REFERENCES public.don_vi_nhan(id);


--
-- TOC entry 5205 (class 2606 OID 18005)
-- Name: phieu_xuat phieu_xuat_nguoi_duyet_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_xuat
    ADD CONSTRAINT phieu_xuat_nguoi_duyet_fkey FOREIGN KEY (nguoi_duyet_cap1) REFERENCES public.users(id);


--
-- TOC entry 5206 (class 2606 OID 19157)
-- Name: phieu_xuat phieu_xuat_nguoi_phan_hoi_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_xuat
    ADD CONSTRAINT phieu_xuat_nguoi_phan_hoi_fkey FOREIGN KEY (nguoi_phan_hoi) REFERENCES public.users(id);


--
-- TOC entry 5207 (class 2606 OID 18000)
-- Name: phieu_xuat phieu_xuat_nguoi_tao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_xuat
    ADD CONSTRAINT phieu_xuat_nguoi_tao_fkey FOREIGN KEY (nguoi_tao) REFERENCES public.users(id);


--
-- TOC entry 5208 (class 2606 OID 18856)
-- Name: phieu_xuat phieu_xuat_phieu_nhap_lien_ket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_xuat
    ADD CONSTRAINT phieu_xuat_phieu_nhap_lien_ket_id_fkey FOREIGN KEY (phieu_nhap_lien_ket_id) REFERENCES public.phieu_nhap(id);


--
-- TOC entry 5209 (class 2606 OID 18010)
-- Name: phieu_xuat phieu_xuat_phong_ban_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_xuat
    ADD CONSTRAINT phieu_xuat_phong_ban_id_fkey FOREIGN KEY (phong_ban_id) REFERENCES public.phong_ban(id);


--
-- TOC entry 5210 (class 2606 OID 18851)
-- Name: phieu_xuat phieu_xuat_phong_ban_nhan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_xuat
    ADD CONSTRAINT phieu_xuat_phong_ban_nhan_id_fkey FOREIGN KEY (phong_ban_nhan_id) REFERENCES public.phong_ban(id);


--
-- TOC entry 5183 (class 2606 OID 18756)
-- Name: phong_ban phong_ban_phong_ban_cha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phong_ban
    ADD CONSTRAINT phong_ban_phong_ban_cha_id_fkey FOREIGN KEY (phong_ban_cha_id) REFERENCES public.phong_ban(id);


--
-- TOC entry 5214 (class 2606 OID 18130)
-- Name: ton_kho ton_kho_hang_hoa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ton_kho
    ADD CONSTRAINT ton_kho_hang_hoa_id_fkey FOREIGN KEY (hang_hoa_id) REFERENCES public.hang_hoa(id);


--
-- TOC entry 5215 (class 2606 OID 18135)
-- Name: ton_kho ton_kho_phong_ban_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ton_kho
    ADD CONSTRAINT ton_kho_phong_ban_id_fkey FOREIGN KEY (phong_ban_id) REFERENCES public.phong_ban(id);


--
-- TOC entry 5184 (class 2606 OID 17558)
-- Name: users users_phong_ban_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phong_ban_id_fkey FOREIGN KEY (phong_ban_id) REFERENCES public.phong_ban(id);


--
-- TOC entry 5222 (class 2606 OID 18709)
-- Name: workflow_approvals workflow_approvals_nguoi_duyet_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_approvals
    ADD CONSTRAINT workflow_approvals_nguoi_duyet_fkey FOREIGN KEY (nguoi_duyet) REFERENCES public.users(id);


--
-- TOC entry 5223 (class 2606 OID 18714)
-- Name: workflow_approvals workflow_approvals_phong_ban_duyet_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_approvals
    ADD CONSTRAINT workflow_approvals_phong_ban_duyet_fkey FOREIGN KEY (phong_ban_duyet) REFERENCES public.phong_ban(id);


--
-- TOC entry 5219 (class 2606 OID 18650)
-- Name: workflow_settings workflow_settings_phong_ban_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_settings
    ADD CONSTRAINT workflow_settings_phong_ban_id_fkey FOREIGN KEY (phong_ban_id) REFERENCES public.phong_ban(id);


-- Completed on 2025-09-08 18:08:21

--
-- PostgreSQL database dump complete
--

