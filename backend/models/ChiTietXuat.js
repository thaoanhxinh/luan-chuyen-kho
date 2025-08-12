module.exports = (sequelize, DataTypes) => {
  const ChiTietXuat = sequelize.define(
    "ChiTietXuat",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      phieu_xuat_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "phieu_xuat",
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
      so_luong_yeu_cau: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      so_luong_thuc_xuat: {
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
      so_seri_xuat: {
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
      ghi_chu: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: "chi_tiet_xuat",
      timestamps: true,
      updatedAt: false,
    }
  );

  ChiTietXuat.associate = (models) => {
    ChiTietXuat.belongsTo(models.PhieuXuat, {
      foreignKey: "phieu_xuat_id",
      as: "phieu_xuat",
    });
    ChiTietXuat.belongsTo(models.HangHoa, {
      foreignKey: "hang_hoa_id",
      as: "hang_hoa",
    });
  };

  return ChiTietXuat;
};
