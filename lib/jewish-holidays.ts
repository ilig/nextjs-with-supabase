import { HebrewCalendar, HDate, Event as HebcalEvent, flags } from "@hebcal/core";

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
 * School year: September -> December next year
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
    end: new Date(schoolYearStart + 1, 11, 31), // December 31st next year
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
