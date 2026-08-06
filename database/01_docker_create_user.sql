-- Application database user (Docker + local)
CREATE USER IF NOT EXISTS 'satish'@'%' IDENTIFIED BY 'SatishDATAbase';
CREATE USER IF NOT EXISTS 'satish'@'localhost' IDENTIFIED BY 'SatishDATAbase';
GRANT ALL PRIVILEGES ON food_supply.* TO 'satish'@'%';
GRANT ALL PRIVILEGES ON food_supply.* TO 'satish'@'localhost';
FLUSH PRIVILEGES;
