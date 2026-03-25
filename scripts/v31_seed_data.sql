-- V3.1 Seed Data: Comprehensive production region data
-- =====================================================

-- ==================== 分区域报价数据 ====================

-- 中国 - 分省报价
INSERT INTO `region_sub_area_prices` (`regionCode`,`subArea`,`subAreaLocal`,`date`,`productType`,`productLabel`,`price`,`unit`,`priceUsd`,`trend`,`changePercent`,`source`) VALUES
('CN','Shandong','山东','2026-03-25','broiler','白羽肉鸡','8.60','CNY/kg','1.18','up','2.4','中国鸡病专业网'),
('CN','Shandong','山东','2026-03-25','chick','鸡苗','3.80','CNY/只','0.52','up','5.6','中国鸡病专业网'),
('CN','Shandong','山东','2026-03-25','frozen_whole','冻鸡整只','9200','CNY/吨','1.26','stable','0.3','中国鸡病专业网'),
('CN','Henan','河南','2026-03-25','broiler','白羽肉鸡','8.40','CNY/kg','1.15','up','1.8','中国鸡病专业网'),
('CN','Henan','河南','2026-03-25','chick','鸡苗','3.60','CNY/只','0.49','up','4.3','中国鸡病专业网'),
('CN','Hebei','河北','2026-03-25','broiler','白羽肉鸡','8.50','CNY/kg','1.16','up','2.1','中国鸡病专业网'),
('CN','Hebei','河北','2026-03-25','layer','蛋鸡','7.20','CNY/kg','0.99','down','-1.4','中国鸡病专业网'),
('CN','Liaoning','辽宁','2026-03-25','broiler','白羽肉鸡','8.30','CNY/kg','1.14','stable','0.5','中国鸡病专业网'),
('CN','Jiangsu','江苏','2026-03-25','broiler','白羽肉鸡','8.70','CNY/kg','1.19','up','2.8','中国鸡病专业网'),
('CN','Anhui','安徽','2026-03-25','broiler','白羽肉鸡','8.45','CNY/kg','1.16','up','1.5','中国鸡病专业网'),
('CN','Guangdong','广东','2026-03-25','broiler','黄羽肉鸡','14.50','CNY/kg','1.99','up','3.2','中国鸡病专业网'),
('CN','Guangxi','广西','2026-03-25','broiler','黄羽肉鸡','13.80','CNY/kg','1.89','up','2.6','中国鸡病专业网'),
('CN','Shandong','山东','2026-03-18','broiler','白羽肉鸡','8.40','CNY/kg','1.15','up','1.2','中国鸡病专业网'),
('CN','Henan','河南','2026-03-18','broiler','白羽肉鸡','8.25','CNY/kg','1.13','stable','0.6','中国鸡病专业网'),
('CN','Hebei','河北','2026-03-18','broiler','白羽肉鸡','8.32','CNY/kg','1.14','up','0.9','中国鸡病专业网'),

-- 美国 - 分州报价
('US','Georgia','佐治亚','2026-03-25','broiler','Broiler (Whole)','1.12','USD/lb','1.12','up','3.7','USDA Market News'),
('US','Georgia','佐治亚','2026-03-25','breast','Breast (Boneless)','2.85','USD/lb','2.85','up','5.2','USDA Market News'),
('US','Georgia','佐治亚','2026-03-25','leg_quarter','Leg Quarter','0.42','USD/lb','0.42','down','-2.3','USDA Market News'),
('US','Arkansas','阿肯色','2026-03-25','broiler','Broiler (Whole)','1.08','USD/lb','1.08','up','2.9','USDA Market News'),
('US','Arkansas','阿肯色','2026-03-25','breast','Breast (Boneless)','2.78','USD/lb','2.78','up','4.1','USDA Market News'),
('US','Alabama','阿拉巴马','2026-03-25','broiler','Broiler (Whole)','1.10','USD/lb','1.10','up','3.2','USDA Market News'),
('US','North Carolina','北卡罗来纳','2026-03-25','broiler','Broiler (Whole)','1.14','USD/lb','1.14','up','4.1','USDA Market News'),
('US','Mississippi','密西西比','2026-03-25','broiler','Broiler (Whole)','1.06','USD/lb','1.06','stable','0.9','USDA Market News'),
('US','Texas','德克萨斯','2026-03-25','broiler','Broiler (Whole)','1.15','USD/lb','1.15','up','3.5','USDA Market News'),
('US','Georgia','佐治亚','2026-03-18','broiler','Broiler (Whole)','1.08','USD/lb','1.08','up','2.1','USDA Market News'),
('US','Arkansas','阿肯色','2026-03-18','broiler','Broiler (Whole)','1.05','USD/lb','1.05','up','1.9','USDA Market News'),

-- 巴西 - 分州报价
('BR','Parana','巴拉那','2026-03-25','broiler','Frango Inteiro','6.80','BRL/kg','1.22','up','2.5','CEPEA/ESALQ'),
('BR','Parana','巴拉那','2026-03-25','frozen_whole','Frango Congelado','7.20','BRL/kg','1.29','up','1.8','CEPEA/ESALQ'),
('BR','Santa Catarina','圣卡塔琳娜','2026-03-25','broiler','Frango Inteiro','6.95','BRL/kg','1.25','up','3.1','CEPEA/ESALQ'),
('BR','Rio Grande do Sul','南里奥格兰德','2026-03-25','broiler','Frango Inteiro','6.70','BRL/kg','1.20','stable','0.7','CEPEA/ESALQ'),
('BR','Sao Paulo','圣保罗','2026-03-25','broiler','Frango Inteiro','7.10','BRL/kg','1.27','up','2.8','CEPEA/ESALQ'),
('BR','Goias','戈亚斯','2026-03-25','broiler','Frango Inteiro','6.60','BRL/kg','1.18','up','1.5','CEPEA/ESALQ'),
('BR','Minas Gerais','米纳斯吉拉斯','2026-03-25','broiler','Frango Inteiro','6.85','BRL/kg','1.23','up','2.2','CEPEA/ESALQ'),
('BR','Parana','巴拉那','2026-03-18','broiler','Frango Inteiro','6.63','BRL/kg','1.19','up','1.3','CEPEA/ESALQ'),

-- 欧盟 - 分国报价
('EU','Netherlands','荷兰','2026-03-25','broiler','Whole Chicken','1.85','EUR/kg','2.01','stable','0.5','EU Commission'),
('EU','Netherlands','荷兰','2026-03-25','breast','Breast Fillet','5.20','EUR/kg','5.65','up','2.3','EU Commission'),
('EU','Poland','波兰','2026-03-25','broiler','Whole Chicken','1.45','EUR/kg','1.58','up','1.8','EU Commission'),
('EU','Poland','波兰','2026-03-25','breast','Breast Fillet','3.80','EUR/kg','4.13','up','2.1','EU Commission'),
('EU','France','法国','2026-03-25','broiler','Poulet Entier','2.10','EUR/kg','2.28','stable','0.3','EU Commission'),
('EU','Germany','德国','2026-03-25','broiler','Hähnchen','1.95','EUR/kg','2.12','up','1.2','EU Commission'),
('EU','Spain','西班牙','2026-03-25','broiler','Pollo Entero','1.75','EUR/kg','1.90','down','-0.8','EU Commission'),
('EU','Italy','意大利','2026-03-25','broiler','Pollo Intero','2.05','EUR/kg','2.23','stable','0.4','EU Commission'),
('EU','Netherlands','荷兰','2026-03-18','broiler','Whole Chicken','1.84','EUR/kg','2.00','stable','0.2','EU Commission'),
('EU','Poland','波兰','2026-03-18','broiler','Whole Chicken','1.42','EUR/kg','1.54','up','1.4','EU Commission'),

-- 泰国 - 分区报价
('TH','Central','中部','2026-03-25','broiler','ไก่เนื้อ','42.50','THB/kg','1.24','up','1.8','Thai Broiler Processing Exporters Association'),
('TH','Central','中部','2026-03-25','processed','Cooked Chicken','85.00','THB/kg','2.48','up','2.5','Thai Broiler Processing Exporters Association'),
('TH','Northeast','东北部','2026-03-25','broiler','ไก่เนื้อ','40.80','THB/kg','1.19','up','1.2','Thai Broiler Processing Exporters Association'),
('TH','North','北部','2026-03-25','broiler','ไก่เนื้อ','41.50','THB/kg','1.21','stable','0.5','Thai Broiler Processing Exporters Association'),
('TH','South','南部','2026-03-25','broiler','ไก่เนื้อ','43.00','THB/kg','1.25','up','2.1','Thai Broiler Processing Exporters Association'),
('TH','Central','中部','2026-03-18','broiler','ไก่เนื้อ','41.75','THB/kg','1.22','up','1.0','Thai Broiler Processing Exporters Association'),

-- 土耳其 - 分区报价
('TR','Marmara','马尔马拉','2026-03-25','broiler','Piliç Eti','68.50','TRY/kg','1.96','up','4.2','BESD-BIR'),
('TR','Marmara','马尔马拉','2026-03-25','breast','Göğüs Eti','120.00','TRY/kg','3.43','up','5.8','BESD-BIR'),
('TR','Central Anatolia','中安纳托利亚','2026-03-25','broiler','Piliç Eti','66.00','TRY/kg','1.89','up','3.5','BESD-BIR'),
('TR','Aegean','爱琴海','2026-03-25','broiler','Piliç Eti','67.50','TRY/kg','1.93','up','3.8','BESD-BIR'),
('TR','Mediterranean','地中海','2026-03-25','broiler','Piliç Eti','69.00','TRY/kg','1.97','up','4.5','BESD-BIR'),
('TR','Marmara','马尔马拉','2026-03-18','broiler','Piliç Eti','65.74','TRY/kg','1.88','up','3.0','BESD-BIR');

-- ==================== 饲料原料价格数据 ====================

INSERT INTO `region_feed_prices` (`regionCode`,`date`,`feedType`,`feedLabel`,`price`,`unit`,`priceUsd`,`trend`,`changePercent`,`source`) VALUES
-- 中国
('CN','2026-03-25','corn','玉米','2680','CNY/吨','367','down','-1.2','中国饲料工业信息网'),
('CN','2026-03-25','soybean_meal','豆粕','3450','CNY/吨','473','up','2.8','中国饲料工业信息网'),
('CN','2026-03-25','wheat','小麦','2820','CNY/吨','386','stable','0.3','中国饲料工业信息网'),
('CN','2026-03-25','fish_meal','鱼粉','12500','CNY/吨','1712','up','1.5','中国饲料工业信息网'),
('CN','2026-03-25','premix','预混料','5800','CNY/吨','795','stable','0.2','中国饲料工业信息网'),
('CN','2026-03-18','corn','玉米','2712','CNY/吨','372','down','-0.8','中国饲料工业信息网'),
('CN','2026-03-18','soybean_meal','豆粕','3356','CNY/吨','460','up','1.5','中国饲料工业信息网'),
('CN','2026-03-11','corn','玉米','2734','CNY/吨','375','stable','0.1','中国饲料工业信息网'),
('CN','2026-03-11','soybean_meal','豆粕','3307','CNY/吨','453','up','0.9','中国饲料工业信息网'),

-- 美国
('US','2026-03-25','corn','Corn','4.85','USD/bu','174','down','-2.1','CME Group'),
('US','2026-03-25','soybean_meal','Soybean Meal','320','USD/ton','320','up','3.5','CME Group'),
('US','2026-03-25','wheat','Wheat','5.60','USD/bu','206','stable','0.8','CME Group'),
('US','2026-03-25','ddgs','DDGS','185','USD/ton','185','down','-1.8','USDA ERS'),
('US','2026-03-18','corn','Corn','4.95','USD/bu','178','down','-1.2','CME Group'),
('US','2026-03-18','soybean_meal','Soybean Meal','309','USD/ton','309','up','2.1','CME Group'),

-- 巴西
('BR','2026-03-25','corn','Milho','72.50','BRL/saca','217','down','-1.5','CEPEA/ESALQ'),
('BR','2026-03-25','soybean_meal','Farelo de Soja','2180','BRL/吨','391','up','2.2','CEPEA/ESALQ'),
('BR','2026-03-25','soybean','Soja em Grão','138.50','BRL/saca','415','up','1.8','CEPEA/ESALQ'),
('BR','2026-03-18','corn','Milho','73.60','BRL/saca','220','down','-0.8','CEPEA/ESALQ'),

-- 欧盟
('EU','2026-03-25','corn','Corn (FOB Rotterdam)','218','EUR/吨','237','stable','0.5','EU Commission'),
('EU','2026-03-25','soybean_meal','Soybean Meal (CIF Rotterdam)','425','EUR/吨','462','up','2.8','EU Commission'),
('EU','2026-03-25','wheat','Wheat (FOB Rouen)','235','EUR/吨','256','up','1.2','EU Commission'),
('EU','2026-03-18','corn','Corn (FOB Rotterdam)','217','EUR/吨','236','stable','0.3','EU Commission'),

-- 泰国
('TH','2026-03-25','corn','ข้าวโพด','9.80','THB/kg','286','down','-0.8','Thai Feed Mill Association'),
('TH','2026-03-25','soybean_meal','กากถั่วเหลือง','18.50','THB/kg','540','up','2.5','Thai Feed Mill Association'),
('TH','2026-03-25','fish_meal','ปลาป่น','32.00','THB/kg','934','up','1.2','Thai Feed Mill Association'),
('TH','2026-03-18','corn','ข้าวโพด','9.88','THB/kg','288','stable','0.2','Thai Feed Mill Association'),

-- 土耳其
('TR','2026-03-25','corn','Mısır','8.50','TRY/kg','243','up','3.8','TURKSTAT'),
('TR','2026-03-25','soybean_meal','Soya Küspesi','16.80','TRY/kg','480','up','5.2','TURKSTAT'),
('TR','2026-03-25','wheat','Buğday','9.20','TRY/kg','263','up','4.1','TURKSTAT'),
('TR','2026-03-18','corn','Mısır','8.19','TRY/kg','234','up','2.5','TURKSTAT');
