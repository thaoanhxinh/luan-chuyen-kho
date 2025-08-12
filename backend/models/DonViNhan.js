module.exports = (sequelize, DataTypes) => {
  const DonViNhan = sequelize.define(
    "DonViNhan",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ma_don_vi: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      ten_don_vi: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      loai_don_vi: {
        type: DataTypes.ENUM("doi_xe", "phong_ban", "khac"),
        defaultValue: "phong_ban",
      },
      dia_chi: {
        type: DataTypes.TEXT,
      },
      nguoi_lien_he: {
        type: DataTypes.STRING(100),
      },
      phone: {
        type: DataTypes.STRING(20),
      },
    },
    {
      tableName: "don_vi_nhan",
      timestamps: true,
      updatedAt: false,
    }
  );

  DonViNhan.associate = (models) => {
    DonViNhan.hasMany(models.PhieuXuat, {
      foreignKey: "don_vi_nhan_id",
      as: "phieu_xuat",
    });
  };

  return DonViNhan;
};
