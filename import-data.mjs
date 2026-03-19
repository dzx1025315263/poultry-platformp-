import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read Excel using openpyxl via child_process (Python)
import { execSync } from 'child_process';

const CONTINENT_MAP = {
  '中东': '中东',
  '非洲': '非洲',
  '东南亚': '东南亚',
  '东亚': '东亚',
  '南亚': '南亚',
  '欧洲': '欧洲',
  '北美洲': '北美洲',
  '南美洲': '南美洲',
  '独联体-中亚': '独联体-中亚',
  '大洋洲': '大洋洲',
  '其他': '其他',
};

async function main() {
  // Step 1: Extract data from Excel using Python
  // 优先使用修正版文件（国家/地区已修正，中英文已规范化）
  const { existsSync } = await import('fs');
  const EXCEL_FILE_FIXED = resolve(process.cwd(), '全球禽肉进口商数据库_修正版.xlsx');
  const EXCEL_FILE_ORIG = resolve(process.cwd(), '全球禽肉进口商数据库_全新版.xlsx');
  const excelFile = existsSync(EXCEL_FILE_FIXED) ? EXCEL_FILE_FIXED : EXCEL_FILE_ORIG;
  const isFixed = excelFile === EXCEL_FILE_FIXED;
  console.log(`使用数据文件: ${excelFile}`);
  console.log(isFixed ? '✅ 使用修正版数据（国家/地区已修正，中英文已规范化）' : '⚠️  使用原始数据文件');

  console.log('Extracting data from Excel...');
  const pyScript = `
import openpyxl, json, sys

wb = openpyxl.load_workbook('${"' + "' + excelFile + '" + "'"}', read_only=True)
is_fixed = ${"' + (isFixed ? 'True' : 'False') + '"}

if is_fixed:
    # 修正版：直接读取大洲列（第4列）
    ws = wb['全部企业']
    companies = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row[1]:
            continue
        companies.append({
            'seqNo': int(row[0]) if row[0] and str(row[0]).isdigit() else None,
            'companyName': str(row[1] or '').strip(),
            'country': str(row[2] or '').strip(),
            'continent': str(row[3] or '其他').strip(),
            'coreRole': str(row[4] or '').strip() if row[4] else None,
            'purchaseTendency': str(row[5] or '').strip() if row[5] else None,
            'companyProfile': str(row[6] or '').strip() if row[6] else None,
            'mainProducts': str(row[7] or '').strip() if row[7] else None,
            'websiteSocial': str(row[8] or '').strip() if row[8] else None,
            'contactInfo': str(row[9] or '').strip() if row[9] else None,
            'hasPurchasedFromChina': str(row[10] or '否').strip(),
        })
else:
    # 原始版：从地区工作表推断大洲
    country_continent = {}
    sheets = ['中东','非洲','东南亚','东亚','南亚','欧洲','北美洲','南美洲','独联体-中亚','大洋洲','其他']
    for sn in sheets:
        ws = wb[sn]
        for row in ws.iter_rows(min_row=2, values_only=True):
            if row[2]:
                country_continent[row[2].strip()] = sn
    ws = wb['全部企业']
    companies = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row[1]:  # skip empty rows
            continue
        country = (row[2] or '').strip()
        continent = country_continent.get(country, '其他')
        companies.append({
            'seqNo': int(row[0]) if row[0] else None,
            'companyName': str(row[1] or '').strip(),
            'country': country,
            'continent': continent,
            'coreRole': str(row[3] or '').strip() if row[3] else None,
            'purchaseTendency': str(row[4] or '').strip() if row[4] else None,
            'companyProfile': str(row[5] or '').strip() if row[5] else None,
            'mainProducts': str(row[6] or '').strip() if row[6] else None,
            'websiteSocial': str(row[7] or '').strip() if row[7] else None,
            'contactInfo': str(row[8] or '').strip() if row[8] else None,
            'hasPurchasedFromChina': str(row[9] or '否').strip(),
        })

json.dump(companies, sys.stdout, ensure_ascii=False)
`;

  const result = execSync(`python3.11 -c '${pyScript.replace(/'/g, "'\"'\"'")}'`, {
    maxBuffer: 50 * 1024 * 1024,
    encoding: 'utf-8',
  });

  const companies = JSON.parse(result);
  console.log(`Extracted ${companies.length} companies from Excel`);

  // Step 2: Connect to database
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const conn = await createConnection(dbUrl);
  console.log('Connected to database');

  // Step 3: Clear existing data
  await conn.execute('DELETE FROM companies');
  console.log('Cleared existing company data');

  // Step 4: Batch insert
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < companies.length; i += batchSize) {
    const batch = companies.slice(i, i + batchSize);
    const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const values = batch.flatMap(c => [
      c.seqNo,
      c.companyName,
      c.country,
      c.continent,
      c.coreRole,
      c.purchaseTendency,
      c.companyProfile,
      c.mainProducts,
      c.websiteSocial,
      c.contactInfo,
      c.hasPurchasedFromChina,
    ]);

    await conn.execute(
      `INSERT INTO companies (seqNo, companyName, country, continent, coreRole, purchaseTendency, companyProfile, mainProducts, websiteSocial, contactInfo, hasPurchasedFromChina) VALUES ${placeholders}`,
      values
    );

    inserted += batch.length;
    if (inserted % 500 === 0 || inserted === companies.length) {
      console.log(`Inserted ${inserted}/${companies.length} companies`);
    }
  }

  // Step 5: Verify
  const [rows] = await conn.execute('SELECT COUNT(*) as cnt FROM companies');
  console.log(`Total companies in database: ${rows[0].cnt}`);

  const [countryCount] = await conn.execute('SELECT COUNT(DISTINCT country) as cnt FROM companies');
  console.log(`Total countries: ${countryCount[0].cnt}`);

  const [continentDist] = await conn.execute('SELECT continent, COUNT(*) as cnt FROM companies GROUP BY continent ORDER BY cnt DESC');
  console.log('Continent distribution:');
  for (const row of continentDist) {
    console.log(`  ${row.continent}: ${row.cnt}`);
  }

  await conn.end();
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
