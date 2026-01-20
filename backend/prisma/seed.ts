import { PrismaClient, ReportCategory, StoreType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 開始種子資料...');

  // ==================== 報表資料 ====================
  console.log('📊 建立報表資料...');
  const reports = [
    // 營運類
    { code: 'R001', name: '護理部消耗報表', category: 'OPERATION' as ReportCategory },
    { code: 'R006', name: '進銷貨明細', category: 'OPERATION' as ReportCategory },
    { code: 'R009', name: '手術追蹤報表', category: 'OPERATION' as ReportCategory },
    { code: 'R016', name: '諮詢師消耗額統計', category: 'OPERATION' as ReportCategory },
    { code: 'R020', name: '生美、醫美品項明細表', category: 'OPERATION' as ReportCategory },
    { code: 'R021', name: '非護理部手術消耗報表', category: 'OPERATION' as ReportCategory },
    { code: 'R023', name: '高耗材異常領用清單', category: 'OPERATION' as ReportCategory },
    { code: 'R024', name: '近半年銷售或消耗低於50報表', category: 'OPERATION' as ReportCategory },
    { code: 'R028', name: '中醫藥膳消耗統計', category: 'OPERATION' as ReportCategory },
    // 人資類
    { code: 'R003a', name: '新進人員名單&離職報表', category: 'HR' as ReportCategory },
    { code: 'R003b', name: '新人關懷名單', category: 'HR' as ReportCategory },
    { code: 'R011', name: '離職人數統計表', category: 'HR' as ReportCategory },
    { code: 'R014', name: '每月時數表', category: 'HR' as ReportCategory },
    { code: 'R025', name: '醫師考勤明細', category: 'HR' as ReportCategory },
    // 財務類
    { code: 'R004', name: '員購報表', category: 'FINANCE' as ReportCategory },
    { code: 'R012', name: '電銷獎金經營客表', category: 'FINANCE' as ReportCategory },
    { code: 'R013', name: '電銷獎金總表', category: 'FINANCE' as ReportCategory },
    { code: 'R017', name: '諮詢師積分', category: 'FINANCE' as ReportCategory },
    { code: 'R018', name: '營養師獎金報表', category: 'FINANCE' as ReportCategory },
    { code: 'R026', name: '中醫諮詢師積分', category: 'FINANCE' as ReportCategory },
    // 行銷類
    { code: 'R005', name: '好友專案報表', category: 'MARKETING' as ReportCategory },
    { code: 'R007', name: '好友介紹人報表', category: 'MARKETING' as ReportCategory },
    { code: 'R008', name: '電銷報表', category: 'MARKETING' as ReportCategory },
    // 會員類
    { code: 'R010', name: '設定影片名單', category: 'MEMBER' as ReportCategory },
    { code: 'R022', name: '會員資料異動報表', category: 'MEMBER' as ReportCategory },
    // 系統類
    { code: 'R015', name: '報修系統報表', category: 'SYSTEM' as ReportCategory },
    { code: 'R019', name: '報修系統積分表', category: 'SYSTEM' as ReportCategory },
    { code: 'R027', name: '各體系分院代碼', category: 'SYSTEM' as ReportCategory },
  ];

  for (const report of reports) {
    await prisma.report.upsert({
      where: { code: report.code },
      update: {},
      create: report,
    });
  }

  // ==================== 門市資料 ====================
  console.log('🏪 建立門市資料...');
  const stores = [
    // 醫美部門
    { code: 'N1_MED', name: '北一區星辰醫美', type: 'MED' as StoreType, roleEmail: 'store01.manager@example.com' },
    { code: 'C0_MED', name: '中央區星辰診所', type: 'MED' as StoreType, roleEmail: 'store02.manager@example.com' },
    { code: 'W1_MED', name: '西區星辰診所', type: 'MED' as StoreType, roleEmail: 'store03.manager@example.com' },
    { code: 'N1_HC', name: '北一區星辰健康門診', type: 'MED' as StoreType, roleEmail: 'store04.manager@example.com' },
    { code: 'N2_MED', name: '北二區星辰診所', type: 'MED' as StoreType, roleEmail: 'store05.manager@example.com' },
    { code: 'N3_MED', name: '北三區星辰診所', type: 'MED' as StoreType, roleEmail: 'store06.manager@example.com' },
    { code: 'NW_MED', name: '西北區晨曦診所', type: 'MED' as StoreType, roleEmail: 'store07.manager@example.com' },
    { code: 'E1_HC', name: '東區健康門診', type: 'MED' as StoreType, roleEmail: 'store08.manager@example.com' },
    { code: 'S1_MED', name: '南一區星辰診所', type: 'MED' as StoreType, roleEmail: 'store09.manager@example.com' },
    { code: 'C1_MED', name: '中一區星辰診所', type: 'MED' as StoreType, roleEmail: 'store10.manager@example.com' },
    { code: 'C2_MED', name: '中二區星辰診所', type: 'MED' as StoreType, roleEmail: 'store11.manager@example.com' },
    { code: 'C3_MED', name: '中三區星辰診所', type: 'MED' as StoreType, roleEmail: 'store12.manager@example.com' },
    { code: 'NE_MED', name: '東北區星辰診所', type: 'MED' as StoreType, roleEmail: 'store13.manager@example.com' },
    { code: 'SE_MED', name: '東南區星辰診所', type: 'MED' as StoreType, roleEmail: 'store14.manager@example.com' },
    { code: 'S2_MED', name: '南區醫美診所', type: 'MED' as StoreType, roleEmail: 'store15.manager@example.com' },
    { code: 'SW_MED', name: '西南區晨曦醫美', type: 'MED' as StoreType, roleEmail: 'store16.manager@example.com' },
    { code: 'SW_HC', name: '西南區晨曦健康門診', type: 'MED' as StoreType, roleEmail: 'store17.manager@example.com' },
    { code: 'W2_MED', name: '西二區醫美診所', type: 'MED' as StoreType, roleEmail: 'store18.manager@example.com' },
    { code: 'CT_MED', name: '中區星辰診所', type: 'MED' as StoreType, roleEmail: 'store19.manager@example.com' },
    { code: 'N4_MED', name: '北四區晨曦診所', type: 'MED' as StoreType, roleEmail: 'store20.manager@example.com' },
    // 養生館部門
    { code: 'N1_SPA', name: '北一區養生館', type: 'SPA' as StoreType, roleEmail: 'spa01.manager@example.com' },
    { code: 'C0_SPA', name: '中央區養生館', type: 'SPA' as StoreType, roleEmail: 'spa02.manager@example.com' },
    { code: 'CT_SPA', name: '中區養生館', type: 'SPA' as StoreType, roleEmail: 'spa03.manager@example.com' },
    { code: 'SE_SPA', name: '東南區養生館', type: 'SPA' as StoreType, roleEmail: 'spa04.manager@example.com' },
    { code: 'SW_SPA', name: '西南區養生館', type: 'SPA' as StoreType, roleEmail: 'spa05.manager@example.com' },
    { code: 'W2_SPA', name: '西二區養生館', type: 'SPA' as StoreType, roleEmail: 'spa06.manager@example.com' },
    // 其他
    { code: 'W3_SPA', name: '西三區養生館', type: 'OTHER' as StoreType, roleEmail: 'w3_spa.manager@example.com' },
    { code: 'CC_SPA', name: '市中心養生館', type: 'OTHER' as StoreType, roleEmail: 'cc_spa.manager@example.com' },
    { code: 'W3_MED', name: '西三區晨曦診所', type: 'OTHER' as StoreType, roleEmail: 'w3_med.manager@example.com' },
    { code: 'E1_SPA', name: '東區養生館', type: 'OTHER' as StoreType, roleEmail: 'e1_spa.manager@example.com' },
    { code: 'C1_OFC', name: '中一區辦公室', type: 'OTHER' as StoreType, roleEmail: 'c1_ofc.manager@example.com' },
    { code: 'HQ', name: '星辰集團總管理處', type: 'OTHER' as StoreType, roleEmail: 'hq.manager@example.com' },
  ];

  for (const store of stores) {
    await prisma.store.upsert({
      where: { code: store.code },
      update: {},
      create: store,
    });
  }

  // ==================== 報表組合 ====================
  console.log('📋 建立報表組合...');
  const templates = [
    { templateCode: 'RT001', name: '營運管理組合', description: '適用於店長、區經理', reportCodes: ['R001', 'R006', 'R014', 'R016', 'R020'] },
    { templateCode: 'RT002', name: '人資報表組合', description: '適用於人資相關人員', reportCodes: ['R003a', 'R003b', 'R011', 'R014'] },
    { templateCode: 'RT003', name: '財務報表組合', description: '適用於財務相關人員', reportCodes: ['R004', 'R006', 'R012', 'R013'] },
    { templateCode: 'RT004', name: '諮詢師組合', description: '適用於諮詢師', reportCodes: ['R016', 'R017', 'R026'] },
    { templateCode: 'RT005', name: '電銷組合', description: '適用於電銷人員', reportCodes: ['R008', 'R012', 'R013'] },
    { templateCode: 'RT006', name: '全報表組合', description: '適用於高階主管', isAllReports: true, reportCodes: [] },
  ];

  for (const template of templates) {
    const existingTemplate = await prisma.reportTemplate.findUnique({
      where: { templateCode: template.templateCode },
    });

    if (!existingTemplate) {
      // 取得報表 IDs
      const reportIds = template.reportCodes.length > 0
        ? await prisma.report.findMany({
            where: { code: { in: template.reportCodes } },
            select: { id: true },
          })
        : [];

      await prisma.reportTemplate.create({
        data: {
          templateCode: template.templateCode,
          name: template.name,
          description: template.description,
          isAllReports: template.isAllReports || false,
          ...(reportIds.length > 0 && {
            reports: {
              create: reportIds.map((r) => ({ reportId: r.id })),
            },
          }),
        },
      });
    }
  }

  console.log('✅ 種子資料建立完成！');
}

main()
  .catch((e) => {
    console.error('❌ 種子資料建立失敗:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
