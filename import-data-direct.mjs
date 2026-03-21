import { createConnection } from 'mysql2/promise';
import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';

async function main() {
  // Step 1: Extract data from Excel using Python
  const EXCEL_FILE_FIXED = resolve(process.cwd(), '全球禽肉进口商数据库_修正版.xlsx');
  const EXCEL_FILE_ORIG = resolve(process.cwd(), '全球禽肉进口商数据库_全新版.xlsx');
  const excelFile = existsSync(EXCEL_FILE_FIXED) ? EXCEL_FILE_FIXED : EXCEL_FILE_ORIG;
  const isFixed = excelFile === EXCEL_FILE_FIXED;
  console.log(`使用数据文件: ${excelFile}`);
  console.log(isFixed ? '✅ 使用修正版数据' : '⚠️  使用原始数据文件');

  // Write Python script to a temp file to avoid escaping issues
  const pyScriptPath = '/tmp/extract_companies.py';
  const pyScript = `
import openpyxl, json, sys

wb = openpyxl.load_workbook('${excelFile}', read_only=True)
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
json.dump(companies, sys.stdout, ensure_ascii=False)
`;

  writeFileSync(pyScriptPath, pyScript, 'utf-8');

  console.log('Extracting data from Excel...');
  const result = execSync(`python3.11 ${pyScriptPath}`, {
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
  // Parse the URL and add SSL options
  const conn = await createConnection({
    uri: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectTimeout: 30000,
  });
  console.log('Connected to database');

  // Step 3: Create table if not exists
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS companies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      seqNo INT,
      companyName VARCHAR(500),
      country VARCHAR(200),
      continent VARCHAR(100),
      coreRole TEXT,
      purchaseTendency TEXT,
      companyProfile LONGTEXT,
      mainProducts TEXT,
      websiteSocial TEXT,
      contactInfo TEXT,
      hasPurchasedFromChina VARCHAR(10),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('Table ready');

  // Step 4: Clear existing data
  await conn.execute('DELETE FROM companies');
  console.log('Cleared existing company data');

  // Step 5: Batch insert
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

  // Step 6: Verify
  const [rows] = await conn.execute('SELECT COUNT(*) as cnt FROM companies');
  console.log(`\n✅ Total companies in database: ${rows[0].cnt}`);
  const [countryCount] = await conn.execute('SELECT COUNT(DISTINCT country) as cnt FROM companies');
  console.log(`✅ Total countries: ${countryCount[0].cnt}`);
  const [continentDist] = await conn.execute('SELECT continent, COUNT(*) as cnt FROM companies GROUP BY continent ORDER BY cnt DESC');
  console.log('Continent distribution:');
  for (const row of continentDist) {
    console.log(`  ${row.continent}: ${row.cnt}`);
  }

  await conn.end();
  console.log('\n🎉 Done! Database updated successfully.');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
