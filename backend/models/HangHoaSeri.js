module.exports = (sequelize, DataTypes) => {
  const HangHoaSeri = sequelize.define(
    "HangHoaSeri",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      hang_hoa_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "hang_hoa",
          key: "id",
        },
      },
      so_seri: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      don_gia: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      ngay_nhap: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      phieu_nhap_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "phieu_nhap",
          key: "id",
        },
      },
      trang_thai: {
        type: DataTypes.STRING(20),
        defaultValue: "ton_kho", // ton_kho, da_xuat, hong
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
      vi_tri_kho: {
        type: DataTypes.STRING(100),
      },
      han_su_dung: {
        type: DataTypes.DATEONLY,
      },
      ghi_chu: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: "hang_hoa_seri",
      timestamps: true,
      updatedAt: false,
      indexes: [
        {
          unique: true,
          fields: ["hang_hoa_id", "so_seri"],
        },
      ],
    }
  );

  HangHoaSeri.associate = (models) => {
    HangHoaSeri.belongsTo(models.HangHoa, {
      foreignKey: "hang_hoa_id",
      as: "hang_hoa",
    });
    HangHoaSeri.belongsTo(models.PhieuNhap, {
      foreignKey: "phieu_nhap_id",
      as: "phieu_nhap",
    });
  };

  return HangHoaSeri;
};
