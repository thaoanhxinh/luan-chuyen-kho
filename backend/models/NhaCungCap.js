module.exports = (sequelize, DataTypes) => {
  const NhaCungCap = sequelize.define(
    "NhaCungCap",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ma_ncc: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      ten_ncc: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      dia_chi: {
        type: DataTypes.TEXT,
      },
      phone: {
        type: DataTypes.STRING(20),
      },
      email: {
        type: DataTypes.STRING(100),
      },
      nguoi_lien_he: {
        type: DataTypes.STRING(100),
      },
    },
    {
      tableName: "nha_cung_cap",
      timestamps: true,
    }
  );

  NhaCungCap.associate = (models) => {
    NhaCungCap.hasMany(models.PhieuNhap, {
      foreignKey: "nha_cung_cap_id",
      as: "phieu_nhap",
    });
  };

  return NhaCungCap;
};
