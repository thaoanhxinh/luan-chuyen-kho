module.exports = (sequelize, DataTypes) => {
  const ChiTietNhap = sequelize.define(
    "ChiTietNhap",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      phieu_nhap_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "phieu_nhap",
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
      so_luong: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      don_gia: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      thanh_tien: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      so_seri_list: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
      },
      pham_chat: {
        type: DataTypes.ENUM(
          "tot",
          "kem_pham_chat",
          "mat_pham_chat",
          "hong",
          "can_thanh_ly"
        ),
        defaultValue: "tot",
      },
      han_su_dung: {
        type: DataTypes.DATEONLY,
      },
      vi_tri_kho: {
        type: DataTypes.STRING(100),
      },
      ghi_chu: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: "chi_tiet_nhap",
      timestamps: true,
      updatedAt: false,
    }
  );

  ChiTietNhap.associate = (models) => {
    ChiTietNhap.belongsTo(models.PhieuNhap, {
      foreignKey: "phieu_nhap_id",
      as: "phieu_nhap",
    });
    ChiTietNhap.belongsTo(models.HangHoa, {
      foreignKey: "hang_hoa_id",
      as: "hang_hoa",
    });
  };

  return ChiTietNhap;
};
