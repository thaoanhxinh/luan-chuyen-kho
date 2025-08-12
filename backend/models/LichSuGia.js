module.exports = (sequelize, DataTypes) => {
  const LichSuGia = sequelize.define(
    "LichSuGia",
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
      phieu_nhap_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "phieu_nhap",
          key: "id",
        },
      },
      don_gia: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      ngay_ap_dung: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      nguon_gia: {
        type: DataTypes.ENUM("nhap_kho", "kiem_ke", "dieu_chinh"),
        defaultValue: "nhap_kho",
      },
    },
    {
      tableName: "lich_su_gia",
      timestamps: true,
      updatedAt: false,
    }
  );

  LichSuGia.associate = (models) => {
    LichSuGia.belongsTo(models.HangHoa, {
      foreignKey: "hang_hoa_id",
      as: "hang_hoa",
    });
    LichSuGia.belongsTo(models.PhieuNhap, {
      foreignKey: "phieu_nhap_id",
      as: "phieu_nhap",
    });
  };

  return LichSuGia;
};
