const sequelize = require("../config/database");
const { DataTypes } = require("sequelize");

// Import all models
const PhongBan = require("./PhongBan");
const User = require("./User");
const LoaiHangHoa = require("./LoaiHangHoa");
const HangHoa = require("./HangHoa");
const HangHoaSeri = require("./HangHoaSeri");
const NhaCungCap = require("./NhaCungCap");
const DonViVanChuyen = require("./DonViVanChuyen");
const DonViNhan = require("./DonViNhan");
const PhieuNhap = require("./PhieuNhap");
const ChiTietNhap = require("./ChiTietNhap");
const PhieuXuat = require("./PhieuXuat");
const ChiTietXuat = require("./ChiTietXuat");
const PhieuKiemKe = require("./PhieuKiemKe");
const ChiTietKiemKe = require("./ChiTietKiemKe");
const TonKho = require("./TonKho");
const LichSuGia = require("./LichSuGia");

// Initialize models
const models = {
  PhongBan: PhongBan(sequelize, DataTypes),
  User: User(sequelize, DataTypes),
  LoaiHangHoa: LoaiHangHoa(sequelize, DataTypes),
  HangHoa: HangHoa(sequelize, DataTypes),
  HangHoaSeri: HangHoaSeri(sequelize, DataTypes),
  NhaCungCap: NhaCungCap(sequelize, DataTypes),
  DonViVanChuyen: DonViVanChuyen(sequelize, DataTypes),
  DonViNhan: DonViNhan(sequelize, DataTypes),
  PhieuNhap: PhieuNhap(sequelize, DataTypes),
  ChiTietNhap: ChiTietNhap(sequelize, DataTypes),
  PhieuXuat: PhieuXuat(sequelize, DataTypes),
  ChiTietXuat: ChiTietXuat(sequelize, DataTypes),
  PhieuKiemKe: PhieuKiemKe(sequelize, DataTypes),
  ChiTietKiemKe: ChiTietKiemKe(sequelize, DataTypes),
  TonKho: TonKho(sequelize, DataTypes),
  LichSuGia: LichSuGia(sequelize, DataTypes),
};

// Define associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = sequelize.Sequelize;

module.exports = models;
