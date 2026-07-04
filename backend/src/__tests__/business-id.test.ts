import {
  buildBusinessCode,
  buildSalonCode,
  salonInitials,
} from "../utils/business-id.js";

describe("business ID formatting", () => {
  const createdAt = new Date("2026-07-04T09:00:25.123Z");

  it("uses salon initials, type, local time, and local date", () => {
    expect(
      buildBusinessCode({
        salonName: "Glam Lounge",
        type: "APT",
        date: createdAt,
        timezone: "Asia/Kolkata",
      })
    ).toBe("GLAPT14302512304072026");
  });

  it("adds a three-digit invoice serial", () => {
    expect(
      buildBusinessCode({
        salonName: "Glam Lounge",
        type: "INV",
        date: createdAt,
        timezone: "Asia/Kolkata",
        serial: 1,
      })
    ).toBe("GLINV14302512304072026001");
  });

  it("formats salon codes and single-word initials", () => {
    expect(salonInitials("Radiance")).toBe("RAD");
    expect(
      buildSalonCode({
        salonName: "Glam Lounge",
        date: createdAt,
        timezone: "Asia/Kolkata",
      })
    ).toBe("GL14302512304072026");
  });
});
