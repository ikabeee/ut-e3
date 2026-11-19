import { STAFF_CSV_HEADER, parseStaffInvitationCsv } from "@features/accounts/lib/staff-invitation-csv";

const HEADER = "email,name,role,secondary_role,stand,kof_desk";

describe("the header of the staff list (T7)", () => {
  it("is the six columns in this order", () => {
    expect(STAFF_CSV_HEADER.join(",")).toBe(HEADER);
  });

  it("is required as the first line", () => {
    expect(parseStaffInvitationCsv("ana@ut.mx,Ana,help_desk,,,")).toEqual({
      rows: [],
      omitted: [],
      errors: [{ line: 1, message: `La primera línea debe ser el encabezado: ${HEADER}` }],
    });
  });

  it("is required even when the file is empty", () => {
    expect(parseStaffInvitationCsv("").errors).toEqual([
      { line: 1, message: `La primera línea debe ser el encabezado: ${HEADER}` },
    ]);
  });
});

describe("the rows of the staff list that are valid (T7)", () => {
  it("reads every role with its stand, secondary role and KOF desk", () => {
    const result = parseStaffInvitationCsv(
      csv([
        "lider@ut.mx,Líder Uno,stand_admin,kof_admin,101-5,",
        "staff@ut.mx,Staff Uno,stand_staff,,101-5,",
        "mesa@ut.mx,Mesa Dos,kof_staff,,,2",
        "rifa@ut.mx,Rifa Uno,raffle_admin,,,",
      ]),
    );

    expect(result.errors).toEqual([]);
    expect(result.omitted).toEqual([]);
    expect(result.rows).toEqual([
      {
        line: 2,
        email: "lider@ut.mx",
        name: "Líder Uno",
        role: "stand_admin",
        secondaryRole: "kof_admin",
        stand: { groupCode: "101", studio: 5 },
        kofDesk: null,
      },
      {
        line: 3,
        email: "staff@ut.mx",
        name: "Staff Uno",
        role: "stand_staff",
        secondaryRole: null,
        stand: { groupCode: "101", studio: 5 },
        kofDesk: null,
      },
      {
        line: 4,
        email: "mesa@ut.mx",
        name: "Mesa Dos",
        role: "kof_staff",
        secondaryRole: null,
        stand: null,
        kofDesk: 2,
      },
      {
        line: 5,
        email: "rifa@ut.mx",
        name: "Rifa Uno",
        role: "raffle_admin",
        secondaryRole: null,
        stand: null,
        kofDesk: null,
      },
    ]);
  });

  it("lowercases and trims the email and trims the other cells", () => {
    const [row] = parseStaffInvitationCsv(csv(["  ANA@UT.MX , Ana Pérez ,help_desk,,,"])).rows;

    expect(row).toMatchObject({ email: "ana@ut.mx", name: "Ana Pérez", role: "help_desk" });
  });

  it("accepts the cells of a spreadsheet export: a BOM, CRLF, quotes and blank lines", () => {
    const text = `\uFEFF${HEADER}\r\n"ana@ut.mx","Pérez, Ana ""Anita""",help_desk,,,\r\n\r\n`;
    const result = parseStaffInvitationCsv(text);

    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({ line: 2, email: "ana@ut.mx", name: 'Pérez, Ana "Anita"' });
  });

  it("reports the rows without an email as omitted and does not make them an error", () => {
    const result = parseStaffInvitationCsv(csv([",Sin Correo,stand_admin,,103-3,", "ana@ut.mx,Ana,help_desk,,,"]));

    expect(result.errors).toEqual([]);
    expect(result.omitted).toEqual([{ line: 2, name: "Sin Correo" }]);
    expect(result.rows.map((row) => row.email)).toEqual(["ana@ut.mx"]);
  });
});

describe("the rows of the staff list that are not valid (T7)", () => {
  it.each([
    ["an email that is not one", "ana,Ana,help_desk,,,", "El correo no tiene un formato válido"],
    ["a missing name", "ana@ut.mx,,help_desk,,,", "Falta el nombre"],
    ["a missing role", "ana@ut.mx,Ana,,,,", "Falta el rol"],
    ["an unknown role", "ana@ut.mx,Ana,janitor,,,", 'El rol "janitor" no existe'],
    ["an unknown secondary role", "ana@ut.mx,Ana,stand_admin,janitor,101-5,", 'El rol secundario "janitor" no existe'],
    [
      "a secondary role on a role that is not stand_admin",
      "ana@ut.mx,Ana,stand_staff,help_desk,101-5,",
      "Solo un stand_admin puede tener rol secundario",
    ],
    ["a stand role without stand", "ana@ut.mx,Ana,stand_admin,,,", "Falta el stand (grupo-estudio, como 101-5)"],
    [
      "a stand that is not group-studio",
      "ana@ut.mx,Ana,stand_admin,,1015,",
      'El stand "1015" no tiene el formato grupo-estudio, como 101-5',
    ],
    ["a stand on another role", "ana@ut.mx,Ana,help_desk,,101-5,", "Solo stand_admin y stand_staff llevan stand"],
    ["a KOF staff without desk", "ana@ut.mx,Ana,kof_staff,,,", "Falta la mesa de KOF (1 a 4)"],
    ["a desk out of range", "ana@ut.mx,Ana,kof_staff,,,5", 'La mesa "5" debe ser un número de 1 a 4'],
    ["a desk that is not a number", "ana@ut.mx,Ana,kof_staff,,,uno", 'La mesa "uno" debe ser un número de 1 a 4'],
    ["a desk on another role", "ana@ut.mx,Ana,kof_admin,,,1", "Solo kof_staff lleva mesa de KOF"],
    ["a different number of columns", "ana@ut.mx,Ana,help_desk", "Se esperaban 6 columnas y hay 3"],
  ])("rejects %s", (_name, row, message) => {
    const result = parseStaffInvitationCsv(csv([row]));

    expect(result.rows).toEqual([]);
    expect(result.errors).toEqual([{ line: 2, message }]);
  });

  it("rejects a repeated email, whatever its case", () => {
    const result = parseStaffInvitationCsv(csv(["ana@ut.mx,Ana,help_desk,,,", "ANA@ut.mx,Otra Ana,raffle_admin,,,"]));

    expect(result.errors).toEqual([{ line: 3, message: "El correo se repite (primera vez en la línea 2)" }]);
  });

  it("rejects a second administrator for the same stand", () => {
    const result = parseStaffInvitationCsv(
      csv(["a@ut.mx,A,stand_admin,,101-5,", "b@ut.mx,B,stand_staff,,101-5,", "c@ut.mx,C,stand_admin,,101-5,"]),
    );

    expect(result.errors).toEqual([{ line: 4, message: "El stand 101-5 ya tiene administrador en la línea 2" }]);
  });

  it("rejects a fourth staff member for the same stand and not for another one", () => {
    const result = parseStaffInvitationCsv(
      csv([
        "a@ut.mx,A,stand_staff,,101-5,",
        "b@ut.mx,B,stand_staff,,101-5,",
        "c@ut.mx,C,stand_staff,,101-5,",
        "d@ut.mx,D,stand_staff,,101-5,",
        "e@ut.mx,E,stand_staff,,101-6,",
      ]),
    );

    expect(result.errors).toEqual([{ line: 5, message: "El stand 101-5 tendría más de 3 staff" }]);
  });

  it("rejects two KOF staff at the same desk", () => {
    const result = parseStaffInvitationCsv(csv(["a@ut.mx,A,kof_staff,,,3", "b@ut.mx,B,kof_staff,,,3"]));

    expect(result.errors).toEqual([{ line: 3, message: "La mesa 3 ya la tiene la línea 2" }]);
  });

  it("returns every error of the file at once, in order of line", () => {
    const result = parseStaffInvitationCsv(
      csv(["ana,Ana,help_desk,,,", "luis@ut.mx,,help_desk,,,", "eva@ut.mx,Eva,janitor,,,"]),
    );

    expect(result.rows).toEqual([]);
    expect(result.errors.map((error) => error.line)).toEqual([2, 3, 4]);
  });

  it("reports every problem of one row, and does not accept the row", () => {
    const result = parseStaffInvitationCsv(csv(["ana,,janitor,,,"]));

    expect(result.errors).toEqual([
      { line: 2, message: "El correo no tiene un formato válido" },
      { line: 2, message: "Falta el nombre" },
      { line: 2, message: 'El rol "janitor" no existe' },
    ]);
  });

  it("rejects a row with a quote that is not closed, at the line where it starts", () => {
    const result = parseStaffInvitationCsv(`${HEADER}\nana@ut.mx,"Ana,help_desk,,,\n`);

    expect(result.rows).toEqual([]);
    expect(result.errors).toEqual([{ line: 2, message: "Hay comillas sin cerrar o mal puestas" }]);
  });
});

function csv(rows: string[]): string {
  return [HEADER, ...rows].join("\n") + "\n";
}
