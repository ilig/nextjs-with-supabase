import { HebrewCalendar, HDate } from "@hebcal/core";

export type JewishHoliday = {
  id: string;
  name: string;
  hebrewName: string;
  date: Date;
  dateString: string; // YYYY-MM-DD format
  icon: string;
  isSchoolOff: boolean;
  category: "religious" | "national" | "memorial" | "minor";
};

// Holiday metadata with icons and school-off status
const holidayMetadata: Record<string, { icon: string; isSchoolOff: boolean; hebrewName: string; category: JewishHoliday["category"] }> = {
  // Religious holidays (חגים דתיים)
  "Rosh Hashana": { icon: "🍎", isSchoolOff: true, hebrewName: "ראש השנה", category: "religious" },
  "Rosh Hashana I": { icon: "🍎", isSchoolOff: true, hebrewName: "ראש השנה א׳", category: "religious" },
  "Rosh Hashana II": { icon: "🍎", isSchoolOff: true, hebrewName: "ראש השנה ב׳", category: "religious" },
  "Yom Kippur": { icon: "🕯️", isSchoolOff: true, hebrewName: "יום כיפור", category: "religious" },
  "Erev Yom Kippur": { icon: "🕯️", isSchoolOff: true, hebrewName: "ערב יום כיפור", category: "religious" },
  "Sukkot": { icon: "🌿", isSchoolOff: true, hebrewName: "סוכות", category: "religious" },
  "Sukkot I": { icon: "🌿", isSchoolOff: true, hebrewName: "סוכות א׳", category: "religious" },
  "Sukkot II": { icon: "🌿", isSchoolOff: true, hebrewName: "סוכות ב׳", category: "religious" },
  "Sukkot III (CH''M)": { icon: "🌿", isSchoolOff: true, hebrewName: "סוכות ג׳ (חול המועד)", category: "religious" },
  "Sukkot IV (CH''M)": { icon: "🌿", isSchoolOff: true, hebrewName: "סוכות ד׳ (חול המועד)", category: "religious" },
  "Sukkot V (CH''M)": { icon: "🌿", isSchoolOff: true, hebrewName: "סוכות ה׳ (חול המועד)", category: "religious" },
  "Sukkot VI (CH''M)": { icon: "🌿", isSchoolOff: true, hebrewName: "סוכות ו׳ (חול המועד)", category: "religious" },
  "Sukkot VII (Hoshana Raba)": { icon: "🌿", isSchoolOff: true, hebrewName: "הושענא רבה", category: "religious" },
  "Shmini Atzeret": { icon: "🌿", isSchoolOff: true, hebrewName: "שמיני עצרת", category: "religious" },
  "Simchat Torah": { icon: "📜", isSchoolOff: true, hebrewName: "שמחת תורה", category: "religious" },
  "Chanukah": { icon: "🕎", isSchoolOff: false, hebrewName: "חנוכה", category: "minor" },
  "Chanukah: 1 Candle": { icon: "🕎", isSchoolOff: false, hebrewName: "חנוכה: נר א׳", category: "minor" },
  "Chanukah: 2 Candles": { icon: "🕎", isSchoolOff: false, hebrewName: "חנוכה: נר ב׳", category: "minor" },
  "Chanukah: 3 Candles": { icon: "🕎", isSchoolOff: false, hebrewName: "חנוכה: נר ג׳", category: "minor" },
  "Chanukah: 4 Candles": { icon: "🕎", isSchoolOff: false, hebrewName: "חנוכה: נר ד׳", category: "minor" },
  "Chanukah: 5 Candles": { icon: "🕎", isSchoolOff: false, hebrewName: "חנוכה: נר ה׳", category: "minor" },
  "Chanukah: 6 Candles": { icon: "🕎", isSchoolOff: false, hebrewName: "חנוכה: נר ו׳", category: "minor" },
  "Chanukah: 7 Candles": { icon: "🕎", isSchoolOff: false, hebrewName: "חנוכה: נר ז׳", category: "minor" },
  "Chanukah: 8 Candles": { icon: "🕎", isSchoolOff: false, hebrewName: "חנוכה: נר ח׳", category: "minor" },
  "Chanukah: 8th Day": { icon: "🕎", isSchoolOff: false, hebrewName: "חנוכה: יום ח׳", category: "minor" },
  "Tu BiShvat": { icon: "🌳", isSchoolOff: false, hebrewName: "ט״ו בשבט", category: "minor" },
  "Purim": { icon: "🎭", isSchoolOff: true, hebrewName: "פורים", category: "minor" },
  "Shushan Purim": { icon: "🎭", isSchoolOff: false, hebrewName: "שושן פורים", category: "minor" },
  "Pesach": { icon: "🍷", isSchoolOff: true, hebrewName: "פסח", category: "religious" },
  "Pesach I": { icon: "🍷", isSchoolOff: true, hebrewName: "פסח א׳", category: "religious" },
  "Pesach II": { icon: "🍷", isSchoolOff: true, hebrewName: "פסח ב׳", category: "religious" },
  "Pesach III (CH''M)": { icon: "🍷", isSchoolOff: true, hebrewName: "פסח ג׳ (חול המועד)", category: "religious" },
  "Pesach IV (CH''M)": { icon: "🍷", isSchoolOff: true, hebrewName: "פסח ד׳ (חול המועד)", category: "religious" },
  "Pesach V (CH''M)": { icon: "🍷", isSchoolOff: true, hebrewName: "פסח ה׳ (חול המועד)", category: "religious" },
  "Pesach VI (CH''M)": { icon: "🍷", isSchoolOff: true, hebrewName: "פסח ו׳ (חול המועד)", category: "religious" },
  "Pesach VII": { icon: "🍷", isSchoolOff: true, hebrewName: "פסח ז׳", category: "religious" },
  "Shavuot": { icon: "🌾", isSchoolOff: true, hebrewName: "שבועות", category: "religious" },
  "Shavuot I": { icon: "🌾", isSchoolOff: true, hebrewName: "שבועות", category: "religious" },

  // National holidays (חגים לאומיים)
  "Yom HaAtzma'ut": { icon: "🇮🇱", isSchoolOff: true, hebrewName: "יום העצמאות", category: "national" },
  "Yom Yerushalayim": { icon: "🏛️", isSchoolOff: false, hebrewName: "יום ירושלים", category: "national" },

  // Memorial days (ימי זיכרון)
  "Yom HaShoah": { icon: "🕯️", isSchoolOff: false, hebrewName: "יום השואה", category: "memorial" },
  "Yom HaZikaron": { icon: "🕯️", isSchoolOff: false, hebrewName: "יום הזיכרון", category: "memorial" },

  // Minor holidays
  "Lag BaOmer": { icon: "🔥", isSchoolOff: false, hebrewName: "ל״ג בעומר", category: "minor" },
  "Tish'a B'Av": { icon: "📖", isSchoolOff: false, hebrewName: "תשעה באב", category: "memorial" },
};

/**
 * Get the school year date range based on current date
 * School year: September 1st -> August 31st (full academic year including summer break)
 */
export function getSchoolYearRange(): { start: Date; end: Date } {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed (0 = January)
  const currentYear = now.getFullYear();

  // If current month >= September (8), school year started this year
  // Otherwise, school year started last year
  const schoolYearStart = currentMonth >= 8 ? currentYear : currentYear - 1;

  return {
    start: new Date(schoolYearStart, 8, 1), // September 1st
    end: new Date(schoolYearStart + 1, 7, 31), // August 31st next year
  };
}

/**
 * Get all Jewish holidays for the current school year
 */
export function getJewishHolidays(): JewishHoliday[] {
  const { start, end } = getSchoolYearRange();
  const holidays: JewishHoliday[] = [];

  // Get Hebrew calendar events for the date range
  const events = HebrewCalendar.calendar({
    start: new HDate(start),
    end: new HDate(end),
    il: true, // Israel schedule
    noMinorFast: true, // Skip minor fasts
    noSpecialShabbat: true, // Skip special Shabbatot
    noRoshChodesh: true, // Skip Rosh Chodesh
    noModern: false, // Include modern holidays (Yom HaAtzma'ut, etc.)
  });

  for (const event of events) {
    const eventName = event.getDesc();
    const metadata = holidayMetadata[eventName];

    // Skip events we don't have metadata for
    if (!metadata) continue;

    const date = event.getDate().greg();
    const dateString = formatDateString(date);

    holidays.push({
      id: `jewish-holiday-${dateString}-${eventName.replace(/\s+/g, "-").toLowerCase()}`,
      name: metadata.hebrewName,
      hebrewName: metadata.hebrewName,
      date,
      dateString,
      icon: metadata.icon,
      isSchoolOff: metadata.isSchoolOff,
      category: metadata.category,
    });
  }

  return holidays.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Format date as YYYY-MM-DD string
 */
function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get holidays for a specific month
 */
export function getHolidaysForMonth(year: number, month: number): JewishHoliday[] {
  const allHolidays = getJewishHolidays();
  return allHolidays.filter(
    (h) => h.date.getFullYear() === year && h.date.getMonth() === month
  );
}

/**
 * Get holidays for a specific day
 */
export function getHolidaysForDay(year: number, month: number, day: number): JewishHoliday[] {
  const allHolidays = getJewishHolidays();
  return allHolidays.filter(
    (h) =>
      h.date.getFullYear() === year &&
      h.date.getMonth() === month &&
      h.date.getDate() === day
  );
}

// ============================================
// School Breaks (חופשות בתי ספר)
// ============================================

export type SchoolBreak = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  icon: string;
};

/**
 * Get Israeli Ministry of Education school breaks for the current school year
 * Based on typical Israeli school calendar
 */
export function getSchoolBreaks(): SchoolBreak[] {
  const { start, end } = getSchoolYearRange();
  const schoolYearStart = start.getFullYear();
  const schoolYearEnd = end.getFullYear();

  const breaks: SchoolBreak[] = [
    // Sukkot break (typically late September/October)
    {
      id: `break-sukkot-${schoolYearStart}`,
      name: "חופשת סוכות",
      startDate: getSukkotBreakStart(schoolYearStart),
      endDate: getSukkotBreakEnd(schoolYearStart),
      icon: "🌿",
    },
    // Hanukkah break (December)
    {
      id: `break-hanukkah-${schoolYearStart}`,
      name: "חופשת חנוכה",
      startDate: getHanukkahBreakStart(schoolYearStart),
      endDate: getHanukkahBreakEnd(schoolYearStart),
      icon: "🕎",
    },
    // Winter break / Semester break (late January/February)
    {
      id: `break-winter-${schoolYearEnd}`,
      name: "חופשת סמסטר",
      startDate: new Date(schoolYearEnd, 1, 1), // Feb 1
      endDate: new Date(schoolYearEnd, 1, 5), // Feb 5
      icon: "❄️",
    },
    // Purim break (March)
    {
      id: `break-purim-${schoolYearEnd}`,
      name: "חופשת פורים",
      startDate: getPurimBreakStart(schoolYearEnd),
      endDate: getPurimBreakEnd(schoolYearEnd),
      icon: "🎭",
    },
    // Passover break (April)
    {
      id: `break-passover-${schoolYearEnd}`,
      name: "חופשת פסח",
      startDate: getPassoverBreakStart(schoolYearEnd),
      endDate: getPassoverBreakEnd(schoolYearEnd),
      icon: "🍷",
    },
    // Summer break (July-August)
    {
      id: `break-summer-${schoolYearEnd}`,
      name: "חופשת קיץ",
      startDate: new Date(schoolYearEnd, 6, 1), // July 1
      endDate: new Date(schoolYearEnd, 7, 31), // Aug 31
      icon: "☀️",
    },
  ];

  return breaks.filter(b => b.startDate >= start && b.startDate <= end);
}

/**
 * Check if a date falls within a school break
 */
export function isSchoolBreak(date: Date): SchoolBreak | null {
  const breaks = getSchoolBreaks();
  const dateTime = date.getTime();

  for (const brk of breaks) {
    if (dateTime >= brk.startDate.getTime() && dateTime <= brk.endDate.getTime()) {
      return brk;
    }
  }
  return null;
}

/**
 * Get school breaks for a specific month
 */
export function getSchoolBreaksForMonth(year: number, month: number): SchoolBreak[] {
  const breaks = getSchoolBreaks();
  return breaks.filter(brk => {
    const startMonth = brk.startDate.getMonth();
    const startYear = brk.startDate.getFullYear();
    const endMonth = brk.endDate.getMonth();
    const endYear = brk.endDate.getFullYear();

    // Check if the break overlaps with the given month
    return (
      (startYear === year && startMonth === month) ||
      (endYear === year && endMonth === month) ||
      (startYear === year && startMonth < month && endYear === year && endMonth > month)
    );
  });
}

// Helper functions to calculate break dates based on Hebrew calendar
// These use approximate dates - in production, you'd use Hebcal for precise dates

function getSukkotBreakStart(year: number): Date {
  // Sukkot typically starts mid-late September or early October
  const events = HebrewCalendar.calendar({
    start: new HDate(new Date(year, 8, 1)),
    end: new HDate(new Date(year, 10, 30)),
    il: true,
  });

  const sukkotEvent = events.find(e => e.getDesc() === "Sukkot I");
  if (sukkotEvent) {
    const date = sukkotEvent.getDate().greg();
    date.setDate(date.getDate() - 1); // Day before Sukkot
    return date;
  }
  return new Date(year, 8, 25); // Fallback: Sept 25
}

function getSukkotBreakEnd(year: number): Date {
  const events = HebrewCalendar.calendar({
    start: new HDate(new Date(year, 8, 1)),
    end: new HDate(new Date(year, 10, 30)),
    il: true,
  });

  const simchatEvent = events.find(e => e.getDesc() === "Simchat Torah");
  if (simchatEvent) {
    return simchatEvent.getDate().greg();
  }
  return new Date(year, 9, 5); // Fallback: Oct 5
}

function getHanukkahBreakStart(year: number): Date {
  const events = HebrewCalendar.calendar({
    start: new HDate(new Date(year, 10, 15)),
    end: new HDate(new Date(year + 1, 0, 15)),
    il: true,
  });

  const hanukkahEvent = events.find(e => e.getDesc() === "Chanukah: 1 Candle");
  if (hanukkahEvent) {
    return hanukkahEvent.getDate().greg();
  }
  return new Date(year, 11, 20); // Fallback: Dec 20
}

function getHanukkahBreakEnd(year: number): Date {
  const events = HebrewCalendar.calendar({
    start: new HDate(new Date(year, 10, 15)),
    end: new HDate(new Date(year + 1, 0, 15)),
    il: true,
  });

  const hanukkahEndEvent = events.find(e => e.getDesc() === "Chanukah: 8th Day");
  if (hanukkahEndEvent) {
    return hanukkahEndEvent.getDate().greg();
  }
  return new Date(year, 11, 28); // Fallback: Dec 28
}

function getPurimBreakStart(year: number): Date {
  const events = HebrewCalendar.calendar({
    start: new HDate(new Date(year, 1, 1)),
    end: new HDate(new Date(year, 3, 30)),
    il: true,
  });

  const purimEvent = events.find(e => e.getDesc() === "Purim");
  if (purimEvent) {
    const date = purimEvent.getDate().greg();
    date.setDate(date.getDate() - 1); // Day before Purim
    return date;
  }
  return new Date(year, 2, 14); // Fallback: Mar 14
}

function getPurimBreakEnd(year: number): Date {
  const events = HebrewCalendar.calendar({
    start: new HDate(new Date(year, 1, 1)),
    end: new HDate(new Date(year, 3, 30)),
    il: true,
  });

  const purimEvent = events.find(e => e.getDesc() === "Shushan Purim");
  if (purimEvent) {
    return purimEvent.getDate().greg();
  }
  return new Date(year, 2, 16); // Fallback: Mar 16
}

function getPassoverBreakStart(year: number): Date {
  const events = HebrewCalendar.calendar({
    start: new HDate(new Date(year, 2, 1)),
    end: new HDate(new Date(year, 4, 30)),
    il: true,
  });

  const pesachEvent = events.find(e => e.getDesc() === "Pesach I");
  if (pesachEvent) {
    const date = pesachEvent.getDate().greg();
    date.setDate(date.getDate() - 1); // Day before Pesach
    return date;
  }
  return new Date(year, 3, 10); // Fallback: Apr 10
}

function getPassoverBreakEnd(year: number): Date {
  const events = HebrewCalendar.calendar({
    start: new HDate(new Date(year, 2, 1)),
    end: new HDate(new Date(year, 4, 30)),
    il: true,
  });

  const pesachEndEvent = events.find(e => e.getDesc() === "Pesach VII");
  if (pesachEndEvent) {
    const date = pesachEndEvent.getDate().greg();
    date.setDate(date.getDate() + 1); // Day after last day of Pesach
    return date;
  }
  return new Date(year, 3, 20); // Fallback: Apr 20
}

// ============================================
// Hebrew Date Utilities
// ============================================

/**
 * Get Hebrew month name for a given Gregorian date
 */
export function getHebrewMonthName(date: Date): string {
  const hdate = new HDate(date);
  // Hebrew month names
  const hebrewMonths: Record<string, string> = {
    "Nisan": "ניסן",
    "Iyyar": "אייר",
    "Sivan": "סיון",
    "Tamuz": "תמוז",
    "Av": "אב",
    "Elul": "אלול",
    "Tishrei": "תשרי",
    "Cheshvan": "חשון",
    "Kislev": "כסלו",
    "Tevet": "טבת",
    "Sh'vat": "שבט",
    "Adar": "אדר",
    "Adar I": "אדר א׳",
    "Adar II": "אדר ב׳",
  };
  const englishName = hdate.getMonthName();
  return hebrewMonths[englishName] || englishName;
}

/**
 * Get Hebrew year for a given Gregorian date
 */
export function getHebrewYear(date: Date): string {
  const hdate = new HDate(date);
  const year = hdate.getFullYear();
  return gematriya(year);
}

/**
 * Convert number to Hebrew gematria (e.g., 5785 -> תשפ״ה)
 */
function gematriya(num: number): string {
  const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
  const tens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
  const hundreds = ["", "ק", "ר", "ש", "ת"];

  // For years like 5785, we typically use just the last 3 digits (785)
  const shortYear = num % 1000;

  let result = "";

  // Hundreds
  const h = Math.floor(shortYear / 100);
  if (h <= 4) {
    result += hundreds[h];
  } else {
    result += "ת" + hundreds[h - 4];
  }

  // Tens and ones
  const remainder = shortYear % 100;
  const t = Math.floor(remainder / 10);
  const o = remainder % 10;

  // Special cases: 15 = ט״ו, 16 = ט״ז
  if (remainder === 15) {
    result += "ט״ו";
  } else if (remainder === 16) {
    result += "ט״ז";
  } else {
    result += tens[t];
    if (o > 0) {
      result += "״" + ones[o];
    } else if (t > 0) {
      // Add gershayim before last letter if no ones digit
      result = result.slice(0, -1) + "״" + result.slice(-1);
    }
  }

  return result;
}

/**
 * Format date as Hebrew string (e.g., "טבת תשפ״ו")
 */
export function formatHebrewDate(date: Date): string {
  return `${getHebrewMonthName(date)} ${getHebrewYear(date)}`;
}

/**
 * Format date as Gregorian Hebrew string (e.g., "ינואר 2026")
 */
export function formatGregorianHebrewDate(date: Date): string {
  const months = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}
