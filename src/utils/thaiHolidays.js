// Thai public holidays — fixed dates and observed substitutes
// Updated through 2027; add years as needed
const FIXED_HOLIDAYS = [
  // New Year's Day
  '01-01',
  // Chakri Memorial Day
  '04-06',
  // Songkran (fixed portion)
  '04-13', '04-14', '04-15',
  // Labour Day
  '05-01',
  // Coronation Day
  '05-04',
  // HM Queen's Birthday
  '06-03',
  // HM the King's Birthday
  '07-28',
  // Mother's Day
  '08-12',
  // Chulalongkorn Memorial Day
  '10-23',
  // Father's Day / National Day
  '12-05',
  // Constitution Day
  '12-10',
  // New Year's Eve
  '12-31',
];

// Year-specific holidays (Buddhist holidays shift each year)
const YEAR_SPECIFIC = {
  2025: [
    '2025-01-14', // Substitution for New Year
    '2025-02-12', // Makha Bucha
    '2025-05-12', // Visakha Bucha
    '2025-06-10', // Asanha Bucha
    '2025-07-11', // Buddhist Lent (Khao Phansa)
    '2025-10-07', // Ok Phansa
  ],
  2026: [
    '2026-03-04', // Makha Bucha
    '2026-05-01', // Visakha Bucha — same as Labour Day (overlaps)
    '2026-06-29', // Asanha Bucha
    '2026-06-30', // Buddhist Lent (Khao Phansa)
    '2026-09-26', // Ok Phansa
  ],
  2027: [
    '2027-02-22', // Makha Bucha
    '2027-05-21', // Visakha Bucha
    '2027-06-18', // Asanha Bucha
    '2027-06-19', // Buddhist Lent (Khao Phansa)
    '2027-10-15', // Ok Phansa
  ],
};

export function isThaiHoliday(date) {
  const year = date.getFullYear();
  const mmdd = String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  const isoDate = `${year}-${mmdd}`;

  if (FIXED_HOLIDAYS.includes(mmdd)) return true;
  if (YEAR_SPECIFIC[year]?.includes(isoDate)) return true;
  return false;
}
