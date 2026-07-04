import { getSalonLocalParts, salonLocalDateTimeToUtc } from "./timezone.js";

type BusinessCodeType = "APT" | "INV" | "EXP" | "PUR" | "RET" | "JC";

const DEFAULT_TIMEZONE = "Asia/Kolkata";

const pad = (value: number, size: number) => String(value).padStart(size, "0");

export const salonInitials = (salonName: string) => {
  const words = salonName
    .trim()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
  const initials =
    words.length > 1
      ? words.map((word) => word[0]).join("")
      : (words[0] ?? salonName).slice(0, 3);

  return initials.replace(/[^a-z0-9]/gi, "").toUpperCase() || "SAL";
};

export const businessCodeDateKey = (
  date: Date = new Date(),
  timezone?: string | null
) => {
  const parts = getSalonLocalParts(date, timezone || DEFAULT_TIMEZONE);
  return `${parts.year}-${pad(parts.month, 2)}-${pad(parts.day, 2)}`;
};

export const businessCodeDayRange = (
  date: Date = new Date(),
  timezone?: string | null
) => {
  const effectiveTimezone = timezone || DEFAULT_TIMEZONE;
  const parts = getSalonLocalParts(date, effectiveTimezone);
  const dateKey = `${parts.year}-${pad(parts.month, 2)}-${pad(parts.day, 2)}`;
  const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));
  const nextDateKey = `${next.getUTCFullYear()}-${pad(
    next.getUTCMonth() + 1,
    2
  )}-${pad(next.getUTCDate(), 2)}`;

  return {
    start: salonLocalDateTimeToUtc(dateKey, "00:00", effectiveTimezone),
    end: salonLocalDateTimeToUtc(nextDateKey, "00:00", effectiveTimezone),
  };
};

export const buildBusinessCode = ({
  salonName,
  type,
  date = new Date(),
  timezone,
  serial,
}: {
  salonName: string;
  type: BusinessCodeType;
  date?: Date | undefined;
  timezone?: string | null | undefined;
  serial?: number | undefined;
}) => {
  const parts = getSalonLocalParts(date, timezone || DEFAULT_TIMEZONE);
  const timePart = `${pad(parts.hour, 2)}${pad(parts.minute, 2)}${pad(
    parts.second,
    2
  )}${pad(date.getMilliseconds(), 3)}`;
  const datePart = `${pad(parts.day, 2)}${pad(parts.month, 2)}${parts.year}`;
  const serialPart = serial === undefined ? "" : pad(serial, 3);

  return `${salonInitials(salonName)}${type}${timePart}${datePart}${serialPart}`;
};

export const buildSalonCode = ({
  salonName,
  date = new Date(),
  timezone,
}: {
  salonName: string;
  date?: Date | undefined;
  timezone?: string | null | undefined;
}) => {
  const parts = getSalonLocalParts(date, timezone || DEFAULT_TIMEZONE);
  const timePart = `${pad(parts.hour, 2)}${pad(parts.minute, 2)}${pad(
    parts.second,
    2
  )}${pad(date.getMilliseconds(), 3)}`;
  const datePart = `${pad(parts.day, 2)}${pad(parts.month, 2)}${parts.year}`;

  return `${salonInitials(salonName)}${timePart}${datePart}`;
};
