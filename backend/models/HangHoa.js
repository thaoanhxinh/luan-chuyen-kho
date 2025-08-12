module.exports = (sequelize, DataTypes) => {
  const HangHoa = sequelize.define(
    "HangHoa",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ma_hang_hoa: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      ten_hang_hoa: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      loai_hang_hoa_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "loai_hang_hoa",
          key: "id",
        },
      },
      don_vi_tinh: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      mo_ta_ky_thuat: {
        type: DataTypes.TEXT,
      },
      co_so_seri: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      theo_doi_pham_chat: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      gia_nhap_gan_nhat: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      phong_ban_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "phong_ban",
          key: "id",
        },
      },
      trang_thai: {
        type: DataTypes.ENUM("active", "inactive"),
        defaultValue: "active",
      },
    },
    {
      tableName: "hang_hoa",
      timestamps: true,
    }
  );

  HangHoa.associate = (models) => {
    HangHoa.belongsTo(models.LoaiHangHoa, {
      foreignKey: "loai_hang_hoa_id",
      as: "loai_hang_hoa",
    });
    HangHoa.belongsTo(models.PhongBan, {
      foreignKey: "phong_ban_id",
      as: "phong_ban",
    });
    HangHoa.hasMany(models.HangHoaSeri, {
      foreignKey: "hang_hoa_id",
      as: "seri_list",
    });
    HangHoa.hasMany(models.TonKho, {
      foreignKey: "hang_hoa_id",
      as: "ton_kho",
    });
  };

  return HangHoa;
};
