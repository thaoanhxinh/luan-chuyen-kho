module.exports = (sequelize, DataTypes) => {
  const PhongBan = sequelize.define(
    "PhongBan",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ma_phong_ban: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      ten_phong_ban: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      mo_ta: {
        type: DataTypes.TEXT,
      },
      trang_thai: {
        type: DataTypes.ENUM("active", "inactive"),
        defaultValue: "active",
      },
    },
    {
      tableName: "phong_ban",
      timestamps: true,
    }
  );

  PhongBan.associate = (models) => {
    PhongBan.hasMany(models.User, {
      foreignKey: "phong_ban_id",
      as: "users",
    });
    PhongBan.hasMany(models.HangHoa, {
      foreignKey: "phong_ban_id",
      as: "hang_hoa",
    });
    PhongBan.hasMany(models.TonKho, {
      foreignKey: "phong_ban_id",
      as: "ton_kho",
    });
  };

  return PhongBan;
};
