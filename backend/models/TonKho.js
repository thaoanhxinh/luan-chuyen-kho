module.exports = (sequelize, DataTypes) => {
  const TonKho = sequelize.define(
    "TonKho",
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
      phong_ban_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "phong_ban",
          key: "id",
        },
      },
      sl_tot: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      sl_kem_pham_chat: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      sl_mat_pham_chat: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      sl_hong: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      sl_can_thanh_ly: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      so_luong_ton: {
        type: DataTypes.VIRTUAL,
        get() {
          return (
            parseFloat(this.sl_tot || 0) +
            parseFloat(this.sl_kem_pham_chat || 0) +
            parseFloat(this.sl_mat_pham_chat || 0) +
            parseFloat(this.sl_hong || 0) +
            parseFloat(this.sl_can_thanh_ly || 0)
          );
        },
      },
      gia_tri_ton: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      don_gia_binh_quan: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      so_luong_dang_su_dung: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      so_luong_kho_bo: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      so_luong_kho_don_vi: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      ngay_cap_nhat: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "ton_kho",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["hang_hoa_id", "phong_ban_id"],
        },
      ],
    }
  );

  TonKho.associate = (models) => {
    TonKho.belongsTo(models.HangHoa, {
      foreignKey: "hang_hoa_id",
      as: "hang_hoa",
    });
    TonKho.belongsTo(models.PhongBan, {
      foreignKey: "phong_ban_id",
      as: "phong_ban",
    });
  };

  return TonKho;
};
