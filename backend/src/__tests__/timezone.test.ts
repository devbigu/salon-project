import {
  getSalonMonthRange,
  parseSalonDateRange,
} from "../utils/timezone.js";

describe("salon timezone boundaries", () => {
  it("uses Asia/Kolkata local midnight for month and date ranges", () => {
    const july = getSalonMonthRange(2026, 7, "Asia/Kolkata");
    expect(july.start.toISOString()).toBe("2026-06-30T18:30:00.000Z");
    expect(july.end.toISOString()).toBe("2026-07-31T18:30:00.000Z");

    const day = parseSalonDateRange("2026-07-01", "2026-07-01", "Asia/Kolkata");
    expect(day.start?.toISOString()).toBe("2026-06-30T18:30:00.000Z");
    expect(day.end?.toISOString()).toBe("2026-07-01T18:30:00.000Z");
  });

  it("rejects reversed or malformed salon-local date ranges", () => {
    expect(() => parseSalonDateRange("2026-07-02", "2026-07-01", "Asia/Kolkata")).toThrow();
    expect(() => parseSalonDateRange("2026-02-30", "2026-03-01", "Asia/Kolkata")).toThrow();
  });
});
