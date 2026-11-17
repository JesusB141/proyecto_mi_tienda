-- Esquema inicial derivado de las historias de usuario (Anexo A del informe)
-- Sistema de Gestión de Finanzas de Tiendas de Barrio
CREATE DATABASE IF NOT EXISTS tiendas_barrio CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci;
USE tiendas_barrio;

-- HU-01
CREATE TABLE tienda (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  dias_aviso_cobro INT NOT NULL DEFAULT 3,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tienda_id INT NOT NULL,
  usuario VARCHAR(60) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tienda_id) REFERENCES tienda(id)
);

-- HU-02, HU-04
CREATE TABLE categoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tienda_id INT NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  FOREIGN KEY (tienda_id) REFERENCES tienda(id)
);

CREATE TABLE producto (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tienda_id INT NOT NULL,
  categoria_id INT NULL,
  nombre VARCHAR(120) NOT NULL,
  cantidad INT NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  precio_compra DECIMAL(12,2) NOT NULL CHECK (precio_compra >= 0),
  precio_venta DECIMAL(12,2) NOT NULL CHECK (precio_venta >= 0),
  stock_minimo INT NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  activo TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (tienda_id) REFERENCES tienda(id),
  FOREIGN KEY (categoria_id) REFERENCES categoria(id)
);

-- HU-06 (cliente antes de venta, porque una venta puede ser a crédito)
CREATE TABLE cliente (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tienda_id INT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  telefono VARCHAR(20) NULL,
  FOREIGN KEY (tienda_id) REFERENCES tienda(id)
);

-- HU-03
CREATE TABLE venta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tienda_id INT NOT NULL,
  cliente_id INT NULL,
  es_credito TINYINT(1) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tienda_id) REFERENCES tienda(id),
  FOREIGN KEY (cliente_id) REFERENCES cliente(id)
);

CREATE TABLE detalle_venta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (venta_id) REFERENCES venta(id),
  FOREIGN KEY (producto_id) REFERENCES producto(id)
);

CREATE TABLE compra (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tienda_id INT NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tienda_id) REFERENCES tienda(id)
);

CREATE TABLE detalle_compra (
  id INT AUTO_INCREMENT PRIMARY KEY,
  compra_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL CHECK (cantidad > 0),
  costo_unitario DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (compra_id) REFERENCES compra(id),
  FOREIGN KEY (producto_id) REFERENCES producto(id)
);

-- HU-05
CREATE TABLE movimiento_caja (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tienda_id INT NOT NULL,
  tipo ENUM('INGRESO','EGRESO') NOT NULL,
  concepto VARCHAR(150) NOT NULL,
  valor DECIMAL(12,2) NOT NULL CHECK (valor > 0),
  origen ENUM('MANUAL','VENTA','ABONO','COMPRA') NOT NULL DEFAULT 'MANUAL',
  referencia_id INT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tienda_id) REFERENCES tienda(id)
);

-- HU-06, HU-07
CREATE TABLE deuda (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  venta_id INT NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  saldo DECIMAL(12,2) NOT NULL,
  fecha_pago_esperada DATE NOT NULL,
  pagada TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (cliente_id) REFERENCES cliente(id),
  FOREIGN KEY (venta_id) REFERENCES venta(id)
);

CREATE TABLE abono (
  id INT AUTO_INCREMENT PRIMARY KEY,
  deuda_id INT NOT NULL,
  valor DECIMAL(12,2) NOT NULL CHECK (valor > 0),
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (deuda_id) REFERENCES deuda(id)
);

CREATE INDEX idx_movimiento_fecha ON movimiento_caja (tienda_id, fecha);
CREATE INDEX idx_deuda_vence ON deuda (pagada, fecha_pago_esperada);
