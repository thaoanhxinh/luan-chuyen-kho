module.exports = (sequelize, DataTypes) => {
  const DonViVanChuyen = sequelize.define(
    "DonViVanChuyen",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ma_dvvc: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      ten_dvvc: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      dia_chi: {
        type: DataTypes.TEXT,
      },
      phone: {
        type: DataTypes.STRING(20),
      },
    },
    {
      tableName: "don_vi_van_chuyen",
      timestamps: true,
      updatedAt: false,
    }
  );

  DonViVanChuyen.associate = (models) => {
    DonViVanChuyen.hasMany(models.PhieuNhap, {
      foreignKey: "don_vi_van_chuyen_id",
      as: "phieu_nhap",
    });
  };

  return DonViVanChuyen;
};
