# Workflow Luân Chuyển Hàng Hóa

## Tổng Quan

Hệ thống workflow luân chuyển cho phép các đơn vị cấp 3 (3A và 3B) trao đổi hàng hóa với nhau thông qua quy trình phê duyệt tự động và đồng bộ.

## Phân Biệt Các Loại Phiếu

| Loại Phiếu              | Workflow | Số Bước Duyệt               | Đơn Vị Nhận     | Ghi Chú                       |
| ----------------------- | -------- | --------------------------- | --------------- | ----------------------------- |
| **Nhập Điều Chuyển**    | 2 bước   | Admin/Cấp 2 → Cấp 3 bên kia | Đơn vị 3A       | Tạo phiếu xuất tự động cho 3B |
| **Xuất Điều Chuyển**    | 2 bước   | Admin/Cấp 2 → Cấp 3 bên kia | Đơn vị 3B       | Tạo phiếu nhập tự động cho 3B |
| **Nhập Tự Mua**         | 1 bước   | Admin/Cấp 2                 | Đơn vị 3A       | Không có bên cấp 3 nào        |
| **Nhập Trên Cấp**       | 1 bước   | Admin/Cấp 2                 | Đơn vị 3A       | Không có bên cấp 3 nào        |
| **Xuất Sử Dụng Nội Bộ** | 1 bước   | Admin/Cấp 2                 | Chính đơn vị 3A | Đơn vị nhận là chính nó       |

## Quy Trình Workflow

### 1. Phiếu Nhập Điều Chuyển (Đơn vị 3A tạo) - WORKFLOW 2 BƯỚC

```
3A tạo phiếu nhập điều chuyển → Gửi duyệt → Admin/Cấp 2 duyệt → Tạo phiếu xuất tự động cho 3B → 3B duyệt nhận → Cả 2 phiếu "approved"
```

**Chi tiết các bước:**

1. **Tạo phiếu nhập**: Đơn vị 3A tạo phiếu nhập với `loai_phieu = "dieu_chuyen"`
2. **Gửi duyệt**: Phiếu chuyển sang trạng thái `confirmed`
3. **Admin/Cấp 2 duyệt**:
   - Phiếu nhập chuyển sang `pending_level3_approval`
   - Tự động tạo phiếu xuất cho đơn vị 3B với trạng thái `pending_level3_approval`
   - Gửi thông báo cho cấp 3 của đơn vị 3B
4. **3B duyệt nhận**: Cả 2 phiếu chuyển sang `approved` đồng thời

### 2. Phiếu Xuất Điều Chuyển (Đơn vị 3A tạo) - WORKFLOW 2 BƯỚC

```
3A tạo phiếu xuất điều chuyển → Gửi duyệt → Admin/Cấp 2 duyệt → Tạo phiếu nhập tự động cho 3B → 3B duyệt nhận → Cả 2 phiếu "approved"
```

**Chi tiết các bước:**

1. **Tạo phiếu xuất**: Đơn vị 3A tạo phiếu xuất với `loai_xuat = "don_vi_nhan"`
2. **Gửi duyệt**: Phiếu chuyển sang trạng thái `confirmed`
3. **Admin/Cấp 2 duyệt**:
   - Phiếu xuất chuyển sang `pending_level3_approval`
   - Tự động tạo phiếu nhập cho đơn vị 3B với trạng thái `pending_level3_approval`
   - Gửi thông báo cho cấp 3 của đơn vị 3B
4. **3B duyệt nhận**: Cả 2 phiếu chuyển sang `approved` đồng thời

### 3. Phiếu Nhập Tự Mua/Trên Cấp - WORKFLOW 1 BƯỚC

```
3A tạo phiếu nhập tự mua/trên cấp → Gửi duyệt → Admin/Cấp 2 duyệt → Phiếu "approved" (1 lần là xong)
```

**Chi tiết các bước:**

1. **Tạo phiếu nhập**: Đơn vị 3A tạo phiếu nhập với `loai_phieu = "tu_mua"` hoặc `"tren_cap"`
2. **Gửi duyệt**: Phiếu chuyển sang trạng thái `confirmed`
3. **Admin/Cấp 2 duyệt**: Phiếu chuyển sang `approved` (không có bên cấp 3 nào)

### 4. Phiếu Xuất Sử Dụng Nội Bộ - WORKFLOW 1 BƯỚC

```
3A tạo phiếu xuất sử dụng nội bộ → Gửi duyệt → Admin/Cấp 2 duyệt → Phiếu "approved" (1 lần là xong)
```

**Chi tiết các bước:**

1. **Tạo phiếu xuất**: Đơn vị 3A tạo phiếu xuất với `loai_xuat = "don_vi_su_dung"`
2. **Gửi duyệt**: Phiếu chuyển sang trạng thái `confirmed`
3. **Admin/Cấp 2 duyệt**: Phiếu chuyển sang `approved` (đơn vị nhận là chính nó)

## Xử Lý Yêu Cầu Sửa

### Đối với Phiếu Điều Chuyển (Workflow 2 bước):

Khi Admin/Cấp 2 hoặc cấp 3 yêu cầu sửa:

1. **Cả 2 phiếu** chuyển sang trạng thái `revision_required`
2. **Thông báo** được gửi cho người tạo phiếu gốc
3. **Người tạo sửa** và gửi duyệt lại
4. **Quy trình tiếp tục** từ bước duyệt tương ứng

### Đối với Phiếu Tự Mua/Trên Cấp/Sử Dụng Nội Bộ (Workflow 1 bước):

Khi Admin/Cấp 2 yêu cầu sửa:

1. **Chỉ phiếu gốc** chuyển sang trạng thái `revision_required`
2. **Thông báo** được gửi cho người tạo phiếu
3. **Người tạo sửa** và gửi duyệt lại
4. **Admin/Cấp 2 duyệt** 1 lần là xong

## Cấu Trúc Database

### Bảng `phieu_nhap` - Các field mới:

- `phong_ban_cung_cap_id`: Phòng ban cung cấp hàng
- `phieu_xuat_lien_ket_id`: Phiếu xuất liên kết
- `is_tu_dong`: Phiếu được tạo tự động
- `workflow_type`: Loại workflow (`standard` hoặc `dieu_chuyen`)
- `nguoi_duyet_cap1`: Người duyệt cấp 1
- `ngay_duyet_cap1`: Ngày duyệt cấp 1
- `nguoi_phan_hoi`: Người yêu cầu sửa
- `ngay_phan_hoi`: Ngày yêu cầu sửa
- `ghi_chu_phan_hoi`: Ghi chú yêu cầu sửa
- `ngay_gui_duyet`: Ngày gửi duyệt

### Bảng `phieu_xuat` - Các field mới:

- `phong_ban_nhan_id`: Phòng ban nhận hàng
- `phieu_nhap_lien_ket_id`: Phiếu nhập liên kết
- `is_tu_dong`: Phiếu được tạo tự động
- `workflow_type`: Loại workflow (`standard` hoặc `dieu_chuyen`)
- `nguoi_duyet_cap1`: Người duyệt cấp 1
- `ngay_duyet_cap1`: Ngày duyệt cấp 1
- `nguoi_phan_hoi`: Người yêu cầu sửa
- `ngay_phan_hoi`: Ngày yêu cầu sửa
- `ghi_chu_phan_hoi`: Ghi chú yêu cầu sửa
- `ngay_gui_duyet`: Ngày gửi duyệt

## Trạng Thái Phiếu

### Trạng thái mới được thêm:

- `pending_level3_approval`: Chờ cấp 3 duyệt
- `revision_required`: Yêu cầu sửa

### Trạng thái đầy đủ:

- `draft`: Nháp
- `confirmed`: Đã gửi duyệt
- `pending_level3_approval`: Chờ cấp 3 duyệt
- `approved`: Đã duyệt
- `completed`: Hoàn thành
- `cancelled`: Hủy
- `revision_required`: Yêu cầu sửa

## API Endpoints

### Nhập Kho

- `POST /api/nhap-kho/submit/:id` - Gửi phiếu nhập duyệt
- `POST /api/nhap-kho/approve/:id` - Duyệt phiếu nhập
- `POST /api/nhap-kho/level3-approve/:id` - Duyệt cấp 3 cho điều chuyển
- `POST /api/nhap-kho/request-revision/:id` - Yêu cầu sửa

### Xuất Kho

- `POST /api/xuat-kho/submit/:id` - Gửi phiếu xuất duyệt
- `POST /api/xuat-kho/approve/:id` - Duyệt phiếu xuất
- `POST /api/xuat-kho/request-revision/:id` - Yêu cầu sửa

## Cài Đặt

### 1. Chạy Migration

```sql
-- Chạy file migration để cập nhật database
\i migration_workflow_luan_chuyen.sql
```

### 2. Cập Nhật Frontend

Cần cập nhật frontend để:

- Hiển thị trạng thái mới
- Xử lý workflow luân chuyển
- Hiển thị thông báo liên kết giữa các phiếu

## Tính Năng Đặc Biệt

### 1. Đồng Bộ Tự Động

- Khi một phiếu được duyệt, phiếu liên kết cũng được cập nhật tự động
- Khi yêu cầu sửa, cả 2 phiếu đều chuyển sang trạng thái sửa

### 2. Thông Báo Thông Minh

- Thông báo được gửi đến đúng người cần duyệt
- Thông báo về phiếu liên kết khi có thay đổi

### 3. Validation Tự Động

- Kiểm tra tính hợp lệ của workflow
- Đảm bảo phòng ban nhận và cung cấp khác nhau
- Kiểm tra quyền duyệt theo từng bước

## View và Function Hỗ Trợ

### 1. View `v_workflow_dieu_chuyen`

Hiển thị tất cả phiếu điều chuyển với thông tin liên kết:

```sql
SELECT * FROM v_workflow_dieu_chuyen;
```

### 2. Function `get_workflow_stats()`

Thống kê workflow theo trạng thái:

```sql
SELECT * FROM get_workflow_stats();
```

### 3. Function `sync_dieu_chuyen_status()`

Tự động đồng bộ trạng thái giữa các phiếu liên kết.

## Lưu Ý Quan Trọng

1. **Tính nhất quán**: Luôn đảm bảo cả 2 phiếu có cùng trạng thái
2. **Quyền hạn**: Chỉ Admin/Manager mới có thể duyệt cấp 1
3. **Thông báo**: Hệ thống tự động gửi thông báo cho người liên quan
4. **Rollback**: Nếu có lỗi, hệ thống sẽ rollback để đảm bảo tính nhất quán

## Troubleshooting

### Lỗi thường gặp:

1. **"Phòng ban nhận và cung cấp không được giống nhau"**

   - Kiểm tra `phong_ban_id` và `phong_ban_cung_cap_id` khác nhau

2. **"Bạn không có quyền duyệt ở bước hiện tại"**

   - Kiểm tra role và quyền hạn của user

3. **"Phiếu không ở trạng thái có thể duyệt"**
   - Kiểm tra trạng thái hiện tại của phiếu

### Debug:

```sql
-- Kiểm tra phiếu điều chuyển
SELECT * FROM v_workflow_dieu_chuyen WHERE phieu_nhap_id = ?;

-- Kiểm tra thống kê
SELECT * FROM get_workflow_stats();

-- Kiểm tra notifications
SELECT * FROM notifications WHERE phieu_id = ?;
```
