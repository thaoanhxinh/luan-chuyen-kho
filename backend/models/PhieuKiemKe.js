module.exports = (sequelize, DataTypes) => {
  const PhieuKiemKe = sequelize.define(
    "PhieuKiemKe",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      so_phieu: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      ngay_kiem_ke: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      gio_kiem_ke: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      don_vi_kiem_ke: {
        type: DataTypes.STRING(200),
      },
      nguoi_thuc_hien: {
        type: DataTypes.TEXT,
      },
      ly_do_kiem_ke: {
        type: DataTypes.TEXT,
      },
      trang_thai: {
        type: DataTypes.ENUM("draft", "confirmed", "cancelled"),
        defaultValue: "draft",
      },
      nguoi_tao: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      nguoi_duyet: {
        type: DataTypes.INTEGER,
        references: {
          model: "users",
          key: "id",
        },
      },
      ngay_duyet: {
        type: DataTypes.DATE,
      },
      phong_ban_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "phong_ban",
          key: "id",
        },
      },
      ghi_chu: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: "phieu_kiem_ke",
      timestamps: true,
      hooks: {
        beforeCreate: async (phieu) => {
          if (!phieu.so_phieu) {
            const moment = require("moment");
            const date = moment().format("YYYYMMDD");
            const count = await PhieuKiemKe.count({
              where: {
                ngay_kiem_ke: phieu.ngay_kiem_ke,
              },
            });
            phieu.so_phieu = `PKK${date}${String(count + 1).padStart(3, "0")}`;
          }
        },
      },
    }
  );

  PhieuKiemKe.associate = (models) => {
    PhieuKiemKe.belongsTo(models.User, {
      foreignKey: "nguoi_tao",
      as: "user_tao",
    });
    PhieuKiemKe.belongsTo(models.User, {
      foreignKey: "nguoi_duyet",
      as: "user_duyet",
    });
    PhieuKiemKe.belongsTo(models.PhongBan, {
      foreignKey: "phong_ban_id",
      as: "phong_ban",
    });
    PhieuKiemKe.hasMany(models.ChiTietKiemKe, {
      foreignKey: "phieu_kiem_ke_id",
      as: "chi_tiet",
      onDelete: "CASCADE",
    });
  };

  return PhieuKiemKe;
};
