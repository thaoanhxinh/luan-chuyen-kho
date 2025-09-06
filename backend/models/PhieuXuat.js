module.exports = (sequelize, DataTypes) => {
  const PhieuXuat = sequelize.define(
    "PhieuXuat",
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
      ngay_xuat: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      don_vi_nhan_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "don_vi_nhan",
          key: "id",
        },
      },
      nguoi_nhan: {
        type: DataTypes.STRING(100),
      },
      ly_do_xuat: {
        type: DataTypes.TEXT,
      },
      loai_xuat: {
        type: DataTypes.ENUM("cap_phat", "dieu_chuyen", "thanh_ly", "su_dung"),
        defaultValue: "cap_phat",
      },
      tong_tien: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      trang_thai: {
        type: DataTypes.ENUM(
          "draft",
          "confirmed",
          "pending_level3_approval",
          "approved",
          "completed",
          "cancelled",
          "revision_required"
        ),
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
      phong_ban_nhan_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "phong_ban",
          key: "id",
        },
      },
      phieu_nhap_lien_ket_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "phieu_nhap",
          key: "id",
        },
      },
      is_tu_dong: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      workflow_type: {
        type: DataTypes.ENUM("standard", "dieu_chuyen"),
        defaultValue: "standard",
      },
      nguoi_duyet_cap1: {
        type: DataTypes.INTEGER,
        references: {
          model: "users",
          key: "id",
        },
      },
      ngay_duyet_cap1: {
        type: DataTypes.DATE,
      },
      nguoi_phan_hoi: {
        type: DataTypes.INTEGER,
        references: {
          model: "users",
          key: "id",
        },
      },
      ngay_phan_hoi: {
        type: DataTypes.DATE,
      },
      ghi_chu_phan_hoi: {
        type: DataTypes.TEXT,
      },
      ngay_gui_duyet: {
        type: DataTypes.DATE,
      },
      ghi_chu: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: "phieu_xuat",
      timestamps: true,
      hooks: {
        beforeCreate: async (phieu) => {
          if (!phieu.so_phieu) {
            const moment = require("moment");
            const date = moment().format("YYYYMMDD");
            const count = await PhieuXuat.count({
              where: {
                ngay_xuat: phieu.ngay_xuat,
              },
            });
            phieu.so_phieu = `PX${date}${String(count + 1).padStart(3, "0")}`;
          }
        },
      },
    }
  );

  PhieuXuat.associate = (models) => {
    PhieuXuat.belongsTo(models.DonViNhan, {
      foreignKey: "don_vi_nhan_id",
      as: "don_vi_nhan",
    });
    PhieuXuat.belongsTo(models.User, {
      foreignKey: "nguoi_tao",
      as: "user_tao",
    });
    PhieuXuat.belongsTo(models.User, {
      foreignKey: "nguoi_duyet",
      as: "user_duyet",
    });
    PhieuXuat.belongsTo(models.PhongBan, {
      foreignKey: "phong_ban_id",
      as: "phong_ban",
    });
    PhieuXuat.hasMany(models.ChiTietXuat, {
      foreignKey: "phieu_xuat_id",
      as: "chi_tiet",
      onDelete: "CASCADE",
    });
  };

  return PhieuXuat;
};
