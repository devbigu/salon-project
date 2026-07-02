const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const isValidTimezone = (timezone: string) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
};

const zonedParts = (date: Date, timezone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
};

export const getSalonLocalParts = (date: Date, timezone: string) => ({
  ...zonedParts(date, timezone),
  weekday: new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
  })
    .format(date)
    .toUpperCase(),
});

const timezoneOffset = (date: Date, timezone: string) => {
  const parts = zonedParts(date, timezone);
  return (
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    ) - date.getTime()
  );
};

const salonLocalToUtc = (
  year: number,
  month: number,
  day: number,
  timezone: string
) => {
  if (!isValidTimezone(timezone)) throw new Error("Invalid salon timezone");
  const guess = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  let result = guess - timezoneOffset(new Date(guess), timezone);
  result = guess - timezoneOffset(new Date(result), timezone);
  return new Date(result);
};

const parseDate = (value: string) => {
  const match = DATE_PATTERN.exec(value);
  if (!match) throw new Error("Invalid date range");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw new Error("Invalid date range");
  }
  return { year, month, day };
};

export const getSalonMonthRange = (
  year: number,
  month: number,
  timezone: string
) => {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Invalid month or year");
  }
  const start = salonLocalToUtc(year, month, 1, timezone);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const end = salonLocalToUtc(nextYear, nextMonth, 1, timezone);
  return { start, end, last: new Date(end.getTime() - 1) };
};

export const parseSalonDateRange = (
  startDate: string | undefined,
  endDate: string | undefined,
  timezone: string
) => {
  const startParts = startDate ? parseDate(startDate) : undefined;
  const endParts = endDate ? parseDate(endDate) : undefined;
  const start = startParts
    ? salonLocalToUtc(startParts.year, startParts.month, startParts.day, timezone)
    : undefined;
  const endStart = endParts
    ? salonLocalToUtc(endParts.year, endParts.month, endParts.day, timezone)
    : undefined;
  if (start && endStart && start > endStart) throw new Error("Invalid date range");
  const end = endParts
    ? salonLocalToUtc(
        new Date(Date.UTC(endParts.year, endParts.month - 1, endParts.day + 1)).getUTCFullYear(),
        new Date(Date.UTC(endParts.year, endParts.month - 1, endParts.day + 1)).getUTCMonth() + 1,
        new Date(Date.UTC(endParts.year, endParts.month - 1, endParts.day + 1)).getUTCDate(),
        timezone
      )
    : undefined;
  return { start, end };
};
