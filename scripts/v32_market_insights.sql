-- =============================================
-- V3.2 市场洞察模块 - 数据库表
-- =============================================

-- 1. 市场洞察周报总表（每周一条记录）
CREATE TABLE IF NOT EXISTS market_insight_weeks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  week_label VARCHAR(10) NOT NULL UNIQUE COMMENT '周标签如2026-W13',
  publish_date DATE NOT NULL COMMENT '发布日期',
  summary TEXT COMMENT '本周市场总结（200字以内）',
  status ENUM('draft','published') DEFAULT 'published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. 行业头条（每周3-5条核心动态）
CREATE TABLE IF NOT EXISTS market_headlines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  week_label VARCHAR(10) NOT NULL COMMENT '关联周标签',
  title VARCHAR(200) NOT NULL COMMENT '标题',
  content TEXT NOT NULL COMMENT '正文（Markdown）',
  category ENUM('policy','price','disease','trade','technology','other') NOT NULL COMMENT '分类',
  impact_level ENUM('high','medium','low') DEFAULT 'medium' COMMENT '影响等级',
  region VARCHAR(50) COMMENT '涉及区域',
  source VARCHAR(200) COMMENT '信息来源',
  source_url VARCHAR(500) COMMENT '来源链接',
  sort_order INT DEFAULT 0 COMMENT '排序',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_week (week_label)
);

-- 3. 全球价格速览（6大产区本周报价）
CREATE TABLE IF NOT EXISTS market_price_snapshot (
  id INT AUTO_INCREMENT PRIMARY KEY,
  week_label VARCHAR(10) NOT NULL COMMENT '关联周标签',
  region VARCHAR(50) NOT NULL COMMENT '产区名称',
  region_code VARCHAR(10) NOT NULL COMMENT '产区代码如US/CN/BR',
  product VARCHAR(100) NOT NULL COMMENT '产品名称',
  price_usd DECIMAL(10,2) NOT NULL COMMENT '本周价格USD/吨',
  price_change DECIMAL(5,2) COMMENT '周环比变化%',
  price_local DECIMAL(10,2) COMMENT '本地货币价格',
  currency VARCHAR(10) COMMENT '本地货币代码',
  fob_price DECIMAL(10,2) COMMENT 'FOB价格USD/吨',
  cif_price DECIMAL(10,2) COMMENT 'CIF价格USD/吨（到中国主要港口）',
  note VARCHAR(500) COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_week (week_label)
);

-- 4. 风险预警（禽流感、政策、汇率等）
CREATE TABLE IF NOT EXISTS market_risk_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  week_label VARCHAR(10) NOT NULL COMMENT '关联周标签',
  title VARCHAR(200) NOT NULL COMMENT '预警标题',
  description TEXT NOT NULL COMMENT '预警详情',
  risk_type ENUM('disease','policy','currency','logistics','competition','other') NOT NULL COMMENT '风险类型',
  severity ENUM('critical','warning','info') DEFAULT 'warning' COMMENT '严重程度',
  affected_regions VARCHAR(200) COMMENT '受影响区域',
  recommendation TEXT COMMENT '应对建议',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_week (week_label)
);

-- 5. 热点深度分析（每周1-2篇深度文章）
CREATE TABLE IF NOT EXISTS market_deep_analysis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  week_label VARCHAR(10) NOT NULL COMMENT '关联周标签',
  title VARCHAR(200) NOT NULL COMMENT '文章标题',
  subtitle VARCHAR(300) COMMENT '副标题',
  content TEXT NOT NULL COMMENT '正文（Markdown格式，1000-3000字）',
  category VARCHAR(50) COMMENT '分类',
  tags VARCHAR(300) COMMENT '标签（逗号分隔）',
  read_time_min INT DEFAULT 5 COMMENT '预计阅读时间（分钟）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_week (week_label)
);

-- 6. 产区动态快讯（6大产区各1-2条简短动态）
CREATE TABLE IF NOT EXISTS market_region_briefs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  week_label VARCHAR(10) NOT NULL COMMENT '关联周标签',
  region VARCHAR(50) NOT NULL COMMENT '产区名称',
  region_code VARCHAR(10) NOT NULL COMMENT '产区代码',
  brief TEXT NOT NULL COMMENT '简短动态（100-200字）',
  trend ENUM('up','down','stable') DEFAULT 'stable' COMMENT '趋势方向',
  highlight VARCHAR(200) COMMENT '关键数据亮点',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_week (week_label)
);
