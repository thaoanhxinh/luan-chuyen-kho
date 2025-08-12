module.exports = (sequelize, DataTypes) => {
  const ChiTietKiemKe = sequelize.define(
    "ChiTietKiemKe",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      phieu_kiem_ke_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "phieu_kiem_ke",
          key: "id",
        },
      },
      hang_hoa_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "hang_hoa",
          key: "id",
        },
      },
      so_luong_so_sach: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      sl_tot: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      sl_kem_pham_chat: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      sl_mat_pham_chat: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      sl_hong: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      sl_can_thanh_ly: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      so_luong_thuc_te: {
        type: DataTypes.VIRTUAL,
        get() {
          return (
            parseFloat(this.sl_tot || 0) +
            parseFloat(this.sl_kem_pham_chat || 0) +
            parseFloat(this.sl_mat_pham_chat || 0) +
            parseFloat(this.sl_hong || 0) +
            parseFloat(this.sl_can_thanh_ly || 0)
          );
        },
      },
      so_luong_chenh_lech: {
        type: DataTypes.VIRTUAL,
        get() {
          return (
            this.getDataValue("so_luong_thuc_te") -
            parseFloat(this.so_luong_so_sach || 0)
          );
        },
      },
      don_gia: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      gia_tri_tot: {
        type: DataTypes.VIRTUAL,
        get() {
          return parseFloat(this.sl_tot || 0) * parseFloat(this.don_gia || 0);
        },
      },
      gia_tri_kem: {
        type: DataTypes.VIRTUAL,
        get() {
          return (
            parseFloat(this.sl_kem_pham_chat || 0) *
            parseFloat(this.don_gia || 0) *
            0.7
          );
        },
      },
      gia_tri_mat: {
        type: DataTypes.VIRTUAL,
        get() {
          return (
            parseFloat(this.sl_mat_pham_chat || 0) *
            parseFloat(this.don_gia || 0) *
            0.3
          );
        },
      },
      gia_tri_hong: {
        type: DataTypes.VIRTUAL,
        get() {
          return 0; // Hàng hỏng = 0 đồng
        },
      },
      gia_tri_thanh_ly: {
        type: DataTypes.VIRTUAL,
        get() {
          return (
            parseFloat(this.sl_can_thanh_ly || 0) *
            parseFloat(this.don_gia || 0) *
            0.1
          );
        },
      },
      gia_tri_chenh_lech: {
        type: DataTypes.VIRTUAL,
        get() {
          const giaTriThucTe =
            this.getDataValue("gia_tri_tot") +
            this.getDataValue("gia_tri_kem") +
            this.getDataValue("gia_tri_mat") +
            this.getDataValue("gia_tri_hong") +
            this.getDataValue("gia_tri_thanh_ly");
          const giaTriSoSach =
            parseFloat(this.so_luong_so_sach || 0) *
            parseFloat(this.don_gia || 0);
          return giaTriThucTe - giaTriSoSach;
        },
      },
      ly_do_chenh_lech: {
        type: DataTypes.TEXT,
      },
      de_nghi_xu_ly: {
        type: DataTypes.TEXT,
      },
      danh_sach_seri_kiem_ke: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
      },
    },
    {
      tableName: "chi_tiet_kiem_ke",
      timestamps: true,
      updatedAt: false,
    }
  );

  ChiTietKiemKe.associate = (models) => {
    ChiTietKiemKe.belongsTo(models.PhieuKiemKe, {
      foreignKey: "phieu_kiem_ke_id",
      as: "phieu_kiem_ke",
    });
    ChiTietKiemKe.belongsTo(models.HangHoa, {
      foreignKey: "hang_hoa_id",
      as: "hang_hoa",
    });
  };

  return ChiTietKiemKe;
};
