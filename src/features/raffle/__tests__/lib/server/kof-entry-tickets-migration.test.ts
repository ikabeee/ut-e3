/**
 * @jest-environment node
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { applyMigration, applyMigrationsBefore } from "@shared/__tests__/lib/server/test-migrations";

const MIGRATION = "20261122100000_kof_entry_tickets";

const directory = mkdtempSync(path.join(tmpdir(), "kof-entry-tickets-"));

const file = path.join(directory, "app.db");

afterAll(() => rmSync(directory, { recursive: true, force: true }));

describe(`migration ${MIGRATION}`, () => {
  it("gives every player already entered in the KOF one ticket and keeps the tickets that existed", () => {
    applyMigrationsBefore(file, MIGRATION);
    seedOlderDatabase();

    applyMigration(file, MIGRATION);

    expect(readTickets()).toEqual([
      { number: 7, visitor_id: "drawn", milestone: 9, status: "drawn" },
      { number: 8, visitor_id: "outside", milestone: 9, status: "active" },
      { number: 9, visitor_id: "registered", milestone: 0, status: "active" },
      { number: 10, visitor_id: "checked-in", milestone: 0, status: "active" },
      { number: 11, visitor_id: "no-show", milestone: 0, status: "voided" },
      { number: 12, visitor_id: "excluded", milestone: 0, status: "voided" },
      { number: 13, visitor_id: "drawn", milestone: 0, status: "drawn" },
    ]);
  });

  it("still rejects a milestone that is not 0, 9 or 18", () => {
    const connection = new DatabaseSync(file);

    try {
      expect(() =>
        connection.exec("INSERT INTO raffle_tickets (visitor_id, milestone) VALUES ('outside', 10)"),
      ).toThrow(/CHECK constraint/);
    } finally {
      connection.close();
    }
  });
});

function seedOlderDatabase() {
  const connection = new DatabaseSync(file);

  try {
    const entries: [string, string][] = [
      ["registered", "registered"],
      ["checked-in", "checked_in"],
      ["no-show", "no_show"],
      ["excluded", "registered"],
      ["drawn", "checked_in"],
    ];

    ["outside", ...entries.map(([id]) => id)].forEach((id) => insertVisitor(connection, id));
    connection.exec(
      "UPDATE visitors SET excluded_at = '2026-11-19T10:00:00.000Z', excluded_reason = 'Fraude' WHERE id = 'excluded'",
    );
    entries.forEach(([id, status], index) => {
      connection
        .prepare(
          "INSERT INTO tournament_entries (id, visitor_id, channel, status, checked_in_at, created_at) VALUES (?, ?, 'pre', ?, ?, ?)",
        )
        .run(
          `entry-${id}`,
          id,
          status,
          status === "checked_in" ? "2026-11-20T17:10:00.000Z" : null,
          `2026-11-14T10:0${index}:00.000Z`,
        );
    });
    connection.exec(`
      INSERT INTO raffle_tickets (number, visitor_id, milestone, status) VALUES (7, 'drawn', 9, 'drawn');
      INSERT INTO raffle_tickets (number, visitor_id, milestone, status) VALUES (8, 'outside', 9, 'active');
    `);
  } finally {
    connection.close();
  }
}

function insertVisitor(connection: DatabaseSync, id: string) {
  connection
    .prepare("INSERT INTO visitors (id, full_name, gamertag, email, pin_aes_gcm, pin_hmac) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, `Nombre ${id}`, id, `${id}@example.com`, `pin-${id}`, `lookup-${id}`);
}

function readTickets() {
  const connection = new DatabaseSync(file);

  try {
    return connection
      .prepare("SELECT number, visitor_id, milestone, status FROM raffle_tickets ORDER BY number")
      .all()
      .map((row) => ({ ...row }));
  } finally {
    connection.close();
  }
}
