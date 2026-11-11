import { parseAdminPerson, parseNewStand, parseStandFields } from "@features/stands/lib/stand-input";
import { getZoneCapacity, STAND_ZONES, toStandZone } from "@features/stands/lib/stand-zones";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";

const ERRORS = STANDS_COPY.admin.errors;

describe("parseStandFields (RF-39)", () => {
  it("reads the zone, the number, the studio and the group", () => {
    expect(parseStandFields(form({ groupCode: " a1b " }))).toEqual({
      isValid: true,
      fields: { zone: "A", number: 1, studio: 6, groupCode: "A1B" },
    });
  });

  it("refuses a zone outside the blocks A to D and T", () => {
    expect(parseStandFields(form({ zone: "Z" }))).toEqual({ isValid: false, message: ERRORS.zoneInvalid });
  });

  it("limits the number to the stands of the zone: 3 in the blocks and 6 in the horror zone", () => {
    expect(parseStandFields(form({ zone: "A", number: "4" }))).toEqual({
      isValid: false,
      message: ERRORS.numberInvalid(3),
    });
    expect(parseStandFields(form({ zone: "T", number: "6" }))).toMatchObject({ isValid: true });
    expect(parseStandFields(form({ zone: "T", number: "7" }))).toEqual({
      isValid: false,
      message: ERRORS.numberInvalid(6),
    });
  });

  it.each(["0", "-1", "1.5", "uno", ""])("refuses the number %j", (number) => {
    expect(parseStandFields(form({ number }))).toMatchObject({ isValid: false });
  });

  it.each(["0", "100", "x", ""])("refuses the studio %j", (studio) => {
    expect(parseStandFields(form({ studio }))).toEqual({ isValid: false, message: ERRORS.studioInvalid });
  });

  it.each(["", "ABCDEFG", "10 1", "10-1"])("refuses the group %j", (groupCode) => {
    expect(parseStandFields(form({ groupCode }))).toEqual({ isValid: false, message: ERRORS.groupInvalid });
  });

  it("has no field for the code: the form cannot type it", () => {
    expect(parseStandFields(form({ code: "ZZ-S9" }))).not.toHaveProperty("fields.code");
  });
});

describe("parseNewStand", () => {
  it("reads the stand and its administrator together", () => {
    expect(parseNewStand(form({ adminName: " Ana ", adminEmail: " ANA@UT.MX " }))).toEqual({
      isValid: true,
      fields: { zone: "A", number: 1, studio: 6, groupCode: "101" },
      admin: { name: "Ana", email: "ana@ut.mx" },
    });
  });

  it("answers the problem of the stand before the one of the administrator", () => {
    expect(parseNewStand(form({ zone: "Z", adminEmail: "bad" }))).toEqual({
      isValid: false,
      message: ERRORS.zoneInvalid,
    });
  });

  it("refuses an administrator without a valid name and email", () => {
    expect(parseNewStand(form({ adminName: "" }))).toMatchObject({ isValid: false });
    expect(parseAdminPerson(form({ adminEmail: "bad" }))).toMatchObject({ isValid: false });
  });
});

describe("the zones of the event", () => {
  it("add up to 18 stands (RN-01)", () => {
    expect(STAND_ZONES.reduce((total, zone) => total + getZoneCapacity(zone), 0)).toBe(18);
  });

  it("only knows the zones of the list", () => {
    expect(toStandZone("T")).toBe("T");
    expect(toStandZone("t")).toBeNull();
  });
});

function form(overrides: Record<string, string>): FormData {
  const fields = {
    zone: "A",
    number: "1",
    studio: "6",
    groupCode: "101",
    adminName: "Ana Pérez",
    adminEmail: "ana@ut.mx",
    ...overrides,
  };

  const data = new FormData();

  Object.entries(fields).forEach(([name, value]) => data.append(name, value));

  return data;
}
