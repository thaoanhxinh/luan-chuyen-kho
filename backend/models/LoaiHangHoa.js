module.exports = (sequelize, DataTypes) => {
  const LoaiHangHoa = sequelize.define(
    "LoaiHangHoa",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ma_loai: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      ten_loai: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      mo_ta: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: "loai_hang_hoa",
      timestamps: true,
    }
  );

  LoaiHangHoa.associate = (models) => {
    LoaiHangHoa.hasMany(models.HangHoa, {
      foreignKey: "loai_hang_hoa_id",
      as: "hang_hoa",
    });
  };

  return LoaiHangHoa;
};
