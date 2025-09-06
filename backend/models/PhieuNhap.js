module.exports = (sequelize, DataTypes) => {
  const PhieuNhap = sequelize.define(
    "PhieuNhap",
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
      ngay_nhap: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      nha_cung_cap_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "nha_cung_cap",
          key: "id",
        },
      },
      don_vi_van_chuyen_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "don_vi_van_chuyen",
          key: "id",
        },
      },
      ly_do_nhap: {
        type: DataTypes.TEXT,
      },
      loai_phieu: {
        type: DataTypes.ENUM("tu_mua", "tren_cap", "dieu_chuyen"),
        defaultValue: "tu_mua",
      },
      so_hoa_don: {
        type: DataTypes.STRING(50),
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
      phong_ban_cung_cap_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "phong_ban",
          key: "id",
        },
      },
      phieu_xuat_lien_ket_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "phieu_xuat",
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
      tableName: "phieu_nhap",
      timestamps: true,
      hooks: {
        beforeCreate: async (phieu) => {
          if (!phieu.so_phieu) {
            const moment = require("moment");
            const date = moment().format("YYYYMMDD");
            const count = await PhieuNhap.count({
              where: {
                ngay_nhap: phieu.ngay_nhap,
              },
            });
            phieu.so_phieu = `PN${date}${String(count + 1).padStart(3, "0")}`;
          }
        },
      },
    }
  );

  PhieuNhap.associate = (models) => {
    PhieuNhap.belongsTo(models.NhaCungCap, {
      foreignKey: "nha_cung_cap_id",
      as: "nha_cung_cap",
    });
    PhieuNhap.belongsTo(models.DonViVanChuyen, {
      foreignKey: "don_vi_van_chuyen_id",
      as: "don_vi_van_chuyen",
    });
    PhieuNhap.belongsTo(models.User, {
      foreignKey: "nguoi_tao",
      as: "user_tao",
    });
    PhieuNhap.belongsTo(models.User, {
      foreignKey: "nguoi_duyet",
      as: "user_duyet",
    });
    PhieuNhap.belongsTo(models.PhongBan, {
      foreignKey: "phong_ban_id",
      as: "phong_ban",
    });
    PhieuNhap.hasMany(models.ChiTietNhap, {
      foreignKey: "phieu_nhap_id",
      as: "chi_tiet",
      onDelete: "CASCADE",
    });
  };

  return PhieuNhap;
};
