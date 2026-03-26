-- 更新各产区2025年最新数据
-- 数据来源: USDA FAS Livestock and Poultry: World Markets and Trade (December 2025)
-- 中国出口数据来源: 中国海关总署 2025年1-12月统计 (108.49万吨)

-- 中国: 产量1620万吨, 出口108万吨(海关数据108.49万吨), 产量排名#2, 出口排名#5
UPDATE production_regions SET 
  annualProductionMt = '1620',
  annualExportMt = '108',
  globalProductionRank = 2,
  globalExportRank = 5,
  statusDescription = '中国是全球第二大禽肉生产国，白羽肉鸡产业高度集约化，前十大企业市占率超40%。2024年白羽鸡祖代引种量约120万套，产能充足。黄羽肉鸡受活禽禁售政策影响正加速冰鲜化转型。深加工出口以日本、欧盟为主要目的地，73°C热处理产品是提速禽肉流通感令的核心竞争力。2025年中国鸡肉出口量达108.49万吨，同比增长50.71%，历史性地成为鸡肉净出口国。行业面临饲料成本波动和消费疲软的双重压力。'
WHERE code = 'CN';

-- 美国: 产量2181万吨, 出口303万吨, 产量排名#1, 出口排名#2
UPDATE production_regions SET 
  annualProductionMt = '2181',
  annualExportMt = '303',
  globalProductionRank = 1,
  globalExportRank = 2,
  statusDescription = '美国是全球最大禽肉生产国和第二大出口国。2024-2025年高致病性禽流感（HPAI H5N1）持续影响产业，累计扑杀禽类超1.1亿只（主要为蛋鸡和火鸡）。肉鸡产业受影响相对较小但出口受阻——中国、韩国等多国对美禽肉实施区域性进口禁令。行业高度集约化，前四大企业控制约60%市场份额。饲料成本（玉米+豆粕）是核心成本变量。2025年出口量约303万吨，受HPAI影响低于往年水平。'
WHERE code = 'US';

-- 巴西: 产量1545万吨, 出口498万吨, 产量排名#3, 出口排名#1
UPDATE production_regions SET 
  annualProductionMt = '1545',
  annualExportMt = '498',
  globalProductionRank = 3,
  globalExportRank = 1,
  statusDescription = '巴西是全球最大禽肉出口国和第三大生产国。2025年出口量接近500万吨，出口至166个国家，受益于竞争性定价、雷亚尔贬值和广泛的市场准入。巴西商业禽场自2025年5月以来未发生HPAI疫情，无疫区优势显著。饲料成本全球最低（玉米+豆粕自给），清真认证体系成熟覆盖主要出口工厂。BRF、JBS等巨头主导出口市场，产业链高度垂直整合。'
WHERE code = 'BR';

-- 欧盟: 产量1182万吨, 出口175万吨, 产量排名#4, 出口排名#3
UPDATE production_regions SET 
  annualProductionMt = '1182',
  annualExportMt = '175',
  globalProductionRank = 4,
  globalExportRank = 3,
  statusDescription = '欧盟是全球第四大禽肉生产国和第三大出口国。2025年产量约1182万吨，出口约175万吨，出口较2024年略有下降。波兰、法国、德国、西班牙和荷兰是主要生产国。欧盟以严格的食品安全标准、动物福利法规和无抗养殖要求著称，品牌溢价能力强。HPAI疫情在部分成员国仍有散发，影响区域性贸易。碳排放政策和Farm to Fork战略正推动产业绿色转型。'
WHERE code = 'EU';

-- 泰国: 产量359万吨, 出口125万吨, 产量排名#7, 出口排名#4
UPDATE production_regions SET 
  annualProductionMt = '359',
  annualExportMt = '125',
  globalProductionRank = 7,
  globalExportRank = 4,
  statusDescription = '泰国是全球第七大禽肉生产国和第四大出口国。2025年产量约359万吨，出口约125万吨。泰国以熟食深加工出口闻名全球，73°C热处理产品是出口核心竞争力，日本和欧盟是最大出口市场。正大集团（CP Group）主导全产业链模式，从饲料到深加工全覆盖。劳动力成本优势和成熟的清真认证体系支撑出口增长。'
WHERE code = 'TH';

-- 土耳其: 产量284万吨, 出口46万吨, 产量排名#8, 出口排名#7
UPDATE production_regions SET 
  annualProductionMt = '284',
  annualExportMt = '46',
  globalProductionRank = 8,
  globalExportRank = 7,
  statusDescription = '土耳其是全球第八大禽肉生产国和第七大出口国。2025年产量约284万吨，较2024年增长13%，出口约46万吨。土耳其地理位置优越，是连接欧洲和中东的贸易枢纽。全面清真认证体系使其在中东和北非市场具有天然优势。Banvit、Beypi等龙头企业主导出口。近年受地缘政治和汇率波动影响，但出口需求推动产能持续扩张。'
WHERE code = 'TR';
