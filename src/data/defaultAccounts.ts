// デフォルトの勘定科目データ
// CSVファイルから変換したもの

export interface DefaultAccount {
  code: string
  name: string
  shortName: string
  category: string
  subCategory: string
  accountType: string
  level: number
  parentCode?: string
  isPostable: boolean
  divisionCode: string
  displayOrder: number
  description?: string
}

export const defaultAccountsData: DefaultAccount[] = [
  // 資産
  { code: '1000', name: '流動資産', shortName: '流動資産', category: 'ASSET', subCategory: '流動資産', accountType: 'DEBIT', level: 1, isPostable: false, divisionCode: 'COMMON', displayOrder: 1000 },
  { code: '1100', name: '現金預金', shortName: '現預金', category: 'ASSET', subCategory: '流動資産', accountType: 'DEBIT', level: 2, parentCode: '1000', isPostable: false, divisionCode: 'COMMON', displayOrder: 1100 },
  { code: '1101', name: '現金', shortName: '現金', category: 'ASSET', subCategory: '流動資産', accountType: 'DEBIT', level: 3, parentCode: '1100', isPostable: true, divisionCode: 'KANRI', displayOrder: 1101, description: '小口現金' },
  { code: '1102', name: '普通預金', shortName: '普通預金', category: 'ASSET', subCategory: '流動資産', accountType: 'DEBIT', level: 3, parentCode: '1100', isPostable: true, divisionCode: 'KANRI', displayOrder: 1102, description: '管理費口座' },
  { code: '1103', name: '普通預金（修繕）', shortName: '普通預金（修）', category: 'ASSET', subCategory: '流動資産', accountType: 'DEBIT', level: 3, parentCode: '1100', isPostable: true, divisionCode: 'SHUZEN', displayOrder: 1103, description: '修繕積立金口座' },
  { code: '1104', name: '定期預金', shortName: '定期預金', category: 'ASSET', subCategory: '流動資産', accountType: 'DEBIT', level: 3, parentCode: '1100', isPostable: true, divisionCode: 'SHUZEN', displayOrder: 1104 },
  { code: '1105', name: '普通預金（駐車場）', shortName: '普通預金（駐）', category: 'ASSET', subCategory: '流動資産', accountType: 'DEBIT', level: 3, parentCode: '1100', isPostable: true, divisionCode: 'PARKING', displayOrder: 1105, description: '駐車場会計口座' },
  
  { code: '1200', name: '有価証券', shortName: '有価証券', category: 'ASSET', subCategory: '流動資産', accountType: 'DEBIT', level: 2, parentCode: '1000', isPostable: false, divisionCode: 'SHUZEN', displayOrder: 1200 },
  { code: '1201', name: '国債', shortName: '国債', category: 'ASSET', subCategory: '流動資産', accountType: 'DEBIT', level: 3, parentCode: '1200', isPostable: true, divisionCode: 'SHUZEN', displayOrder: 1201, description: '国債,地方債,すまい・る債' },
  
  { code: '1300', name: '未収入金', shortName: '未収入金', category: 'ASSET', subCategory: '流動資産', accountType: 'DEBIT', level: 2, parentCode: '1000', isPostable: false, divisionCode: 'COMMON', displayOrder: 1300 },
  { code: '1301', name: '管理費未収金', shortName: '管理費未収', category: 'ASSET', subCategory: '流動資産', accountType: 'DEBIT', level: 3, parentCode: '1300', isPostable: true, divisionCode: 'KANRI', displayOrder: 1301 },
  { code: '1302', name: '修繕積立金未収金', shortName: '修繕未収', category: 'ASSET', subCategory: '流動資産', accountType: 'DEBIT', level: 3, parentCode: '1300', isPostable: true, divisionCode: 'SHUZEN', displayOrder: 1302 },
  { code: '1303', name: '使用料未収金', shortName: '使用料未収', category: 'ASSET', subCategory: '流動資産', accountType: 'DEBIT', level: 3, parentCode: '1300', isPostable: true, divisionCode: 'KANRI', displayOrder: 1303 },
  
  { code: '1400', name: '前払費用', shortName: '前払費用', category: 'ASSET', subCategory: '流動資産', accountType: 'DEBIT', level: 2, parentCode: '1000', isPostable: false, divisionCode: 'COMMON', displayOrder: 1400 },
  { code: '1401', name: '前払保険料', shortName: '前払保険料', category: 'ASSET', subCategory: '流動資産', accountType: 'DEBIT', level: 3, parentCode: '1400', isPostable: true, divisionCode: 'COMMON', displayOrder: 1401, description: '未経過保険料,保守契約前払' },
  { code: '1500', name: '仮払金', shortName: '仮払金', category: 'ASSET', subCategory: '流動資産', accountType: 'DEBIT', level: 2, parentCode: '1000', isPostable: false, divisionCode: 'COMMON', displayOrder: 1500 },
  { code: '1501', name: '仮払金', shortName: '仮払金', category: 'ASSET', subCategory: '流動資産', accountType: 'DEBIT', level: 3, parentCode: '1500', isPostable: true, divisionCode: 'COMMON', displayOrder: 1501, description: '立替,一時払,精算待ち' },
    // 流動資産 > 前払金
  { code: '1600', name: '前払金', shortName: '前払金', category: 'ASSET', subCategory: '流動資産', accountType: 'DEBIT', level: 2, parentCode: '1000', isPostable: false, divisionCode: 'COMMON', displayOrder: 1600 },
  { code: '1601', name: '工事前払金', shortName: '工事前払', category: 'ASSET', subCategory: '流動資産', accountType: 'DEBIT', level: 3, parentCode: '1600', isPostable: true, divisionCode: 'SHUZEN', displayOrder: 1601, description: '工事前払金,契約金' },
  // 非流動資産
  { code: '1700', name: '非流動資産', shortName: '非流動資産', category: 'ASSET', subCategory: '非流動資産', accountType: 'DEBIT', level: 1, isPostable: false, divisionCode: 'COMMON', displayOrder: 1700 },
  { code: '1710', name: '投資その他の資産', shortName: '投資その他', category: 'ASSET', subCategory: '非流動資産', accountType: 'DEBIT', level: 2, parentCode: '1700', isPostable: false, divisionCode: 'COMMON', displayOrder: 1710 },
  { code: '1711', name: '差入保証金', shortName: '差入保証金', category: 'ASSET', subCategory: '非流動資産', accountType: 'DEBIT', level: 3, parentCode: '1710', isPostable: true, divisionCode: 'COMMON', displayOrder: 1711, description: '駐車場敷金,施設保証金' },
  { code: '1720', name: '繰延資産', shortName: '繰延資産', category: 'ASSET', subCategory: '非流動資産', accountType: 'DEBIT', level: 2, parentCode: '1700', isPostable: false, divisionCode: 'COMMON', displayOrder: 1720 },
  { code: '1721', name: '長期前払費用', shortName: '長期前払費用', category: 'ASSET', subCategory: '非流動資産', accountType: 'DEBIT', level: 3, parentCode: '1720', isPostable: true, divisionCode: 'COMMON', displayOrder: 1721, description: '長期保険料,長期保守料' },
  // 負債
  { code: '2000', name: '流動負債', shortName: '流動負債', category: 'LIABILITY', subCategory: '流動負債', accountType: 'CREDIT', level: 1, isPostable: false, divisionCode: 'COMMON', displayOrder: 2000 },
  { code: '2100', name: '未払金', shortName: '未払金', category: 'LIABILITY', subCategory: '流動負債', accountType: 'CREDIT', level: 2, parentCode: '2000', isPostable: false, divisionCode: 'COMMON', displayOrder: 2100 },
  { code: '2101', name: '未払金', shortName: '未払金', category: 'LIABILITY', subCategory: '流動負債', accountType: 'CREDIT', level: 3, parentCode: '2100', isPostable: true, divisionCode: 'COMMON', displayOrder: 2101, description: '工事代未払,水道光熱費未払' },
  { code: '2200', name: '未払費用', shortName: '未払費用', category: 'LIABILITY', subCategory: '流動負債', accountType: 'CREDIT', level: 2, parentCode: '2000', isPostable: false, divisionCode: 'COMMON', displayOrder: 2200 },
  { code: '2201', name: '未払費用', shortName: '未払費用', category: 'LIABILITY', subCategory: '流動負債', accountType: 'CREDIT', level: 3, parentCode: '2200', isPostable: true, divisionCode: 'COMMON', displayOrder: 2201, description: '役務提供未払' },
  { code: '2300', name: '前受金', shortName: '前受金', category: 'LIABILITY', subCategory: '流動負債', accountType: 'CREDIT', level: 2, parentCode: '2000', isPostable: false, divisionCode: 'COMMON', displayOrder: 2300 },
  { code: '2301', name: '管理費前受金', shortName: '管理費前受', category: 'LIABILITY', subCategory: '流動負債', accountType: 'CREDIT', level: 3, parentCode: '2300', isPostable: true, divisionCode: 'KANRI', displayOrder: 2301 },
  { code: '2302', name: '修繕積立金前受金', shortName: '修繕前受', category: 'LIABILITY', subCategory: '流動負債', accountType: 'CREDIT', level: 3, parentCode: '2300', isPostable: true, divisionCode: 'SHUZEN', displayOrder: 2302 },
  { code: '2303', name: '使用料前受金', shortName: '使用料前受', category: 'LIABILITY', subCategory: '流動負債', accountType: 'CREDIT', level: 3, parentCode: '2300', isPostable: true, divisionCode: 'KANRI', displayOrder: 2303 },
  { code: '2400', name: '仮受金', shortName: '仮受金', category: 'LIABILITY', subCategory: '流動負債', accountType: 'CREDIT', level: 2, parentCode: '2000', isPostable: false, divisionCode: 'COMMON', displayOrder: 2400 },
  { code: '2401', name: '仮受金', shortName: '仮受金', category: 'LIABILITY', subCategory: '流動負債', accountType: 'CREDIT', level: 3, parentCode: '2400', isPostable: true, divisionCode: 'COMMON', displayOrder: 2401, description: '一時受入,原因不明入金' },
  { code: '2500', name: '預り金', shortName: '預り金', category: 'LIABILITY', subCategory: '流動負債', accountType: 'CREDIT', level: 2, parentCode: '2000', isPostable: false, divisionCode: 'COMMON', displayOrder: 2500 },
  { code: '2501', name: '預り金', shortName: '預り金', category: 'LIABILITY', subCategory: '流動負債', accountType: 'CREDIT', level: 3, parentCode: '2500', isPostable: true, divisionCode: 'COMMON', displayOrder: 2501, description: '敷金,保証金' },
  
  { code: '3000', name: '固定負債', shortName: '固定負債', category: 'LIABILITY', subCategory: '固定負債', accountType: 'CREDIT', level: 1, isPostable: false, divisionCode: 'COMMON', displayOrder: 3000 },
  { code: '3100', name: '長期借入金', shortName: '長期借入金', category: 'LIABILITY', subCategory: '固定負債', accountType: 'CREDIT', level: 2, parentCode: '3000', isPostable: false, divisionCode: 'SHUZEN', displayOrder: 3100 },
  { code: '3101', name: '長期借入金', shortName: '長期借入金', category: 'LIABILITY', subCategory: '固定負債', accountType: 'CREDIT', level: 3, parentCode: '3100', isPostable: true, divisionCode: 'SHUZEN', displayOrder: 3101, description: '修繕資金借入,工事融資' },
  
  // 純資産
  { code: '4000', name: '純資産', shortName: '純資産', category: 'EQUITY', subCategory: '純資産', accountType: 'CREDIT', level: 1, isPostable: false, divisionCode: 'COMMON', displayOrder: 4000 },
  { code: '4100', name: '繰越金', shortName: '繰越金', category: 'EQUITY', subCategory: '純資産', accountType: 'CREDIT', level: 2, parentCode: '4000', isPostable: false, divisionCode: 'COMMON', displayOrder: 4100 },
  { code: '4101', name: '管理費繰越金', shortName: '管理費繰越', category: 'EQUITY', subCategory: '純資産', accountType: 'CREDIT', level: 3, parentCode: '4100', isPostable: true, divisionCode: 'KANRI', displayOrder: 4101 },
  { code: '4102', name: '修繕積立金繰越金', shortName: '修繕繰越', category: 'EQUITY', subCategory: '純資産', accountType: 'CREDIT', level: 3, parentCode: '4100', isPostable: true, divisionCode: 'SHUZEN', displayOrder: 4102 },
  
  // 収益
  { code: '5000', name: '収益', shortName: '収益', category: 'REVENUE', subCategory: '収益', accountType: 'CREDIT', level: 1, isPostable: false, divisionCode: 'COMMON', displayOrder: 5000 },
  { code: '5100', name: '管理収益', shortName: '管理収益', category: 'REVENUE', subCategory: '管理収益', accountType: 'CREDIT', level: 2, parentCode: '5000', isPostable: false, divisionCode: 'KANRI', displayOrder: 5100 },
  { code: '5101', name: '管理費収入', shortName: '管理費', category: 'REVENUE', subCategory: '管理収益', accountType: 'CREDIT', level: 3, parentCode: '5100', isPostable: true, divisionCode: 'KANRI', displayOrder: 5101 },
  { code: '5102', name: '駐車場使用料収入', shortName: '駐車場', category: 'REVENUE', subCategory: '管理収益', accountType: 'CREDIT', level: 3, parentCode: '5100', isPostable: true, divisionCode: 'KANRI', displayOrder: 5102, description: '月極駐車場,来客用駐車場' },
  { code: '5103', name: '駐輪場使用料収入', shortName: '駐輪場', category: 'REVENUE', subCategory: '管理収益', accountType: 'CREDIT', level: 3, parentCode: '5100', isPostable: true, divisionCode: 'KANRI', displayOrder: 5103, description: '自転車置場,バイク置場' },
  { code: '5107', name: '駐車場収入', shortName: '駐車場収入', category: 'REVENUE', subCategory: '管理収益', accountType: 'CREDIT', level: 3, parentCode: '5100', isPostable: true, divisionCode: 'PARKING', displayOrder: 5107, description: '月極駐車場収入（駐車場会計）' },
  { code: '5104', name: 'ルーフバルコニー使用料収入', shortName: 'ルーフバルコニー', category: 'REVENUE', subCategory: '管理収益', accountType: 'CREDIT', level: 3, parentCode: '5100', isPostable: true, divisionCode: 'KANRI', displayOrder: 5104, description: '屋上バルコニー専用使用料' },
  { code: '5105', name: 'テラス使用料収入', shortName: 'テラス', category: 'REVENUE', subCategory: '管理収益', accountType: 'CREDIT', level: 3, parentCode: '5100', isPostable: true, divisionCode: 'KANRI', displayOrder: 5105, description: '専用庭,テラス専用使用料' },
  { code: '5106', name: '集会室使用料収入', shortName: '集会室', category: 'REVENUE', subCategory: '管理収益', accountType: 'CREDIT', level: 3, parentCode: '5100', isPostable: true, divisionCode: 'KANRI', displayOrder: 5106, description: '共用施設使用料' },
  
  { code: '5200', name: '積立金収入', shortName: '積立金収入', category: 'REVENUE', subCategory: '積立金収入', accountType: 'CREDIT', level: 2, parentCode: '5000', isPostable: false, divisionCode: 'SHUZEN', displayOrder: 5200 },
  { code: '5201', name: '修繕積立金収入', shortName: '修繕積立金', category: 'REVENUE', subCategory: '積立金収入', accountType: 'CREDIT', level: 3, parentCode: '5200', isPostable: true, divisionCode: 'SHUZEN', displayOrder: 5201 },
  
  { code: '5300', name: '営業外収益', shortName: '営業外収益', category: 'REVENUE', subCategory: '営業外収益', accountType: 'CREDIT', level: 2, parentCode: '5000', isPostable: false, divisionCode: 'COMMON', displayOrder: 5300 },
  { code: '5301', name: '受取利息', shortName: '受取利息', category: 'REVENUE', subCategory: '営業外収益', accountType: 'CREDIT', level: 3, parentCode: '5300', isPostable: true, divisionCode: 'COMMON', displayOrder: 5301, description: '預金利息,債券利息' },
  { code: '5302', name: '雑収入', shortName: '雑収入', category: 'REVENUE', subCategory: '営業外収益', accountType: 'CREDIT', level: 3, parentCode: '5300', isPostable: true, divisionCode: 'COMMON', displayOrder: 5302, description: '保険金,自販機手数料' },
  { code: '5303', name: '延滞金収入', shortName: '延滞金', category: 'REVENUE', subCategory: '営業外収益', accountType: 'CREDIT', level: 3, parentCode: '5300', isPostable: true, divisionCode: 'KANRI', displayOrder: 5303 },
  { code: '5304', name: '受取保険金', shortName: '保険金', category: 'REVENUE', subCategory: '営業外収益', accountType: 'CREDIT', level: 3, parentCode: '5300', isPostable: true, divisionCode: 'COMMON', displayOrder: 5304 },
  { code: '5305', name: '補助金収入', shortName: '補助金', category: 'REVENUE', subCategory: '営業外収益', accountType: 'CREDIT', level: 3, parentCode: '5300', isPostable: true, divisionCode: 'COMMON', displayOrder: 5305 },
  
  { code: '5400', name: '特別収益', shortName: '特別収益', category: 'REVENUE', subCategory: '特別収益', accountType: 'CREDIT', level: 2, parentCode: '5000', isPostable: false, divisionCode: 'COMMON', displayOrder: 5400 },
  { code: '5401', name: '特別徴収金収入', shortName: '特別徴収金', category: 'REVENUE', subCategory: '特別収益', accountType: 'CREDIT', level: 3, parentCode: '5400', isPostable: true, divisionCode: 'SHUZEN', displayOrder: 5401 },
  { code: '5402', name: '繰入金収入', shortName: '繰入金', category: 'REVENUE', subCategory: '特別収益', accountType: 'CREDIT', level: 3, parentCode: '5400', isPostable: true, divisionCode: 'SHUZEN', displayOrder: 5402 },
  
  // 費用
  { code: '6000', name: '費用', shortName: '費用', category: 'EXPENSE', subCategory: '費用', accountType: 'DEBIT', level: 1, isPostable: false, divisionCode: 'COMMON', displayOrder: 6000 },
  { code: '6100', name: '管理費', shortName: '管理費', category: 'EXPENSE', subCategory: '管理費', accountType: 'DEBIT', level: 2, parentCode: '6000', isPostable: false, divisionCode: 'KANRI', displayOrder: 6100 },
  { code: '6101', name: '管理委託費', shortName: '管理委託費', category: 'EXPENSE', subCategory: '管理費', accountType: 'DEBIT', level: 3, parentCode: '6100', isPostable: true, divisionCode: 'KANRI', displayOrder: 6101, description: '事務管理,管理員,清掃,設備管理' },
  { code: '6102', name: '水道光熱費', shortName: '水道光熱費', category: 'EXPENSE', subCategory: '管理費', accountType: 'DEBIT', level: 3, parentCode: '6100', isPostable: true, divisionCode: 'KANRI', displayOrder: 6102, description: '電気料金,水道料金' },
  { code: '6103', name: '通信費', shortName: '通信費', category: 'EXPENSE', subCategory: '管理費', accountType: 'DEBIT', level: 3, parentCode: '6100', isPostable: true, divisionCode: 'KANRI', displayOrder: 6103, description: '郵送料,電話代,インターネット' },
  { code: '6104', name: '保険料', shortName: '保険料', category: 'EXPENSE', subCategory: '管理費', accountType: 'DEBIT', level: 3, parentCode: '6100', isPostable: true, divisionCode: 'KANRI', displayOrder: 6104, description: 'マンション共用部保険' },
  
  { code: '6200', name: '維持修繕費', shortName: '維持修繕費', category: 'EXPENSE', subCategory: '維持修繕費', accountType: 'DEBIT', level: 2, parentCode: '6000', isPostable: false, divisionCode: 'COMMON', displayOrder: 6200 },
  { code: '6201', name: '修繕費', shortName: '修繕費', category: 'EXPENSE', subCategory: '維持修繕費', accountType: 'DEBIT', level: 3, parentCode: '6200', isPostable: true, divisionCode: 'KANRI', displayOrder: 6201, description: '軽微修繕,日常補修' },
  
  { code: '6300', name: '一般管理費', shortName: '一般管理費', category: 'EXPENSE', subCategory: '一般管理費', accountType: 'DEBIT', level: 2, parentCode: '6000', isPostable: false, divisionCode: 'KANRI', displayOrder: 6300 },
  { code: '6301', name: '消耗品費', shortName: '消耗品費', category: 'EXPENSE', subCategory: '一般管理費', accountType: 'DEBIT', level: 3, parentCode: '6300', isPostable: true, divisionCode: 'KANRI', displayOrder: 6301 },
  { code: '6302', name: '支払手数料', shortName: '手数料', category: 'EXPENSE', subCategory: '一般管理費', accountType: 'DEBIT', level: 3, parentCode: '6300', isPostable: true, divisionCode: 'KANRI', displayOrder: 6302, description: '振込手数料,残高証明料' },
  { code: '6303', name: '会議費', shortName: '会議費', category: 'EXPENSE', subCategory: '一般管理費', accountType: 'DEBIT', level: 3, parentCode: '6300', isPostable: true, divisionCode: 'KANRI', displayOrder: 6303, description: '理事会,総会' },
  { code: '6304', name: '役員手当', shortName: '役員手当', category: 'EXPENSE', subCategory: '一般管理費', accountType: 'DEBIT', level: 3, parentCode: '6300', isPostable: true, divisionCode: 'KANRI', displayOrder: 6304 },
  { code: '6305', name: '専門家謝金', shortName: '専門家謝金', category: 'EXPENSE', subCategory: '一般管理費', accountType: 'DEBIT', level: 3, parentCode: '6300', isPostable: true, divisionCode: 'KANRI', displayOrder: 6305, description: '弁護士,税理士,建築士' },
  { code: '6306', name: '印刷費', shortName: '印刷費', category: 'EXPENSE', subCategory: '一般管理費', accountType: 'DEBIT', level: 3, parentCode: '6300', isPostable: true, divisionCode: 'KANRI', displayOrder: 6306 },
  { code: '6307', name: '租税公課', shortName: '租税公課', category: 'EXPENSE', subCategory: '一般管理費', accountType: 'DEBIT', level: 3, parentCode: '6300', isPostable: true, divisionCode: 'KANRI', displayOrder: 6307 },
  { code: '6308', name: '雑費', shortName: '雑費', category: 'EXPENSE', subCategory: '一般管理費', accountType: 'DEBIT', level: 3, parentCode: '6300', isPostable: true, divisionCode: 'KANRI', displayOrder: 6308 },
  { code: '6310', name: '駐車場管理費', shortName: '駐車場管理費', category: 'EXPENSE', subCategory: '一般管理費', accountType: 'DEBIT', level: 3, parentCode: '6300', isPostable: true, divisionCode: 'PARKING', displayOrder: 6310, description: '駐車場運営費' },
    // 一般管理費 配下の追加
  { code: '6309', name: '旅費交通費', shortName: '旅費交通費', category: 'EXPENSE', subCategory: '一般管理費', accountType: 'DEBIT', level: 3, parentCode: '6300', isPostable: true, divisionCode: 'KANRI', displayOrder: 6309, description: '交通費,旅費,実費精算' },
  { code: '6311', name: '諸会費', shortName: '諸会費', category: 'EXPENSE', subCategory: '一般管理費', accountType: 'DEBIT', level: 3, parentCode: '6300', isPostable: true, divisionCode: 'KANRI', displayOrder: 6310, description: '自治会費,加入団体会費' },

  { code: '6400', name: '長期修繕費', shortName: '長期修繕費', category: 'EXPENSE', subCategory: '長期修繕', accountType: 'DEBIT', level: 2, parentCode: '6000', isPostable: false, divisionCode: 'SHUZEN', displayOrder: 6400 },
  { code: '6401', name: '修繕工事費', shortName: '修繕工事費', category: 'EXPENSE', subCategory: '長期修繕', accountType: 'DEBIT', level: 3, parentCode: '6400', isPostable: true, divisionCode: 'SHUZEN', displayOrder: 6401, description: '大規模修繕工事,計画修繕' },
  { code: '6402', name: '設計監理費', shortName: '設計監理費', category: 'EXPENSE', subCategory: '長期修繕', accountType: 'DEBIT', level: 3, parentCode: '6400', isPostable: true, divisionCode: 'SHUZEN', displayOrder: 6402 },
  
  { code: '6500', name: '特別損失', shortName: '特別損失', category: 'EXPENSE', subCategory: '特別損失', accountType: 'DEBIT', level: 2, parentCode: '6000', isPostable: false, divisionCode: 'COMMON', displayOrder: 6500 },
  { code: '6501', name: '繰出金', shortName: '繰出金', category: 'EXPENSE', subCategory: '特別損失', accountType: 'DEBIT', level: 3, parentCode: '6500', isPostable: true, divisionCode: 'KANRI', displayOrder: 6501, description: '修繕会計繰出' },
  { code: '6503', name: 'その他支出', shortName: 'その他支出', category: 'EXPENSE', subCategory: '特別損失', accountType: 'DEBIT', level: 3, parentCode: '6500', isPostable: true, divisionCode: 'OTHER', displayOrder: 6503, description: 'その他特別会計支出' },
  { code: '6502', name: '雑損失', shortName: '雑損失', category: 'EXPENSE', subCategory: '特別損失', accountType: 'DEBIT', level: 3, parentCode: '6500', isPostable: true, divisionCode: 'COMMON', displayOrder: 6502 },

]