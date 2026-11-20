/**
 * @jest-environment node
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { applyMigration, applyMigrationsBefore } from "@shared/__tests__/lib/server/test-migrations";

const MIGRATION = "20261122110000_kof_no_show_tickets";

const directory = mkdtempSync(path.join(tmpdir(), "kof-no-show-tickets-"));

const file = path.join(directory, "app.db");

afterAll(() => rmSync(directory, { recursive: true, force: true }));

describe(`migration ${MIGRATION}`, () => {
  it("brings back the KOF ticket voided by a no-show and leaves every other ticket as it was", () => {
    applyMigrationsBefore(file, MIGRATION);
    seedOlderDatabase();

    applyMigration(file, MIGRATION);

    expect(readTickets()).toEqual([
      { number: 1, visitor_id: "no-show", milestone: 0, status: "active" },
      { number: 2, visitor_id: "excluded", milestone: 0, status: "voided" },
      { number: 3, visitor_id: "drawn", milestone: 0, status: "voided" },
      { number: 4, visitor_id: "drawn", milestone: 9, status: "drawn" },
      { number: 5, visitor_id: "checked-in", milestone: 0, status: "voided" },
      { number: 6, visitor_id: "no-show", milestone: 9, status: "voided" },
    ]);
  });
});

function seedOlderDatabase() {
  const connection = new DatabaseSync(file);

  try {
    const entries: [string, string][] = [
      ["no-show", "no_show"],
      ["excluded", "no_show"],
      ["drawn", "no_show"],
      ["checked-in", "checked_in"],
    ];

    entries.forEach(([id]) => insertVisitor(connection, id));
    connection.exec(
      "UPDATE visitors SET excluded_at = '2026-11-19T10:00:00.000Z', excluded_reason = 'Fraude' WHERE id = 'excluded'",
    );
    entries.forEach(([id, status]) => insertEntry(connection, id, status));
    connection.exec(`
      INSERT INTO raffle_tickets (number, visitor_id, milestone, status) VALUES (1, 'no-show', 0, 'voided');
      INSERT INTO raffle_tickets (number, visitor_id, milestone, status) VALUES (2, 'excluded', 0, 'voided');
      INSERT INTO raffle_tickets (number, visitor_id, milestone, status) VALUES (3, 'drawn', 0, 'voided');
      INSERT INTO raffle_tickets (number, visitor_id, milestone, status) VALUES (4, 'drawn', 9, 'drawn');
      INSERT INTO raffle_tickets (number, visitor_id, milestone, status) VALUES (5, 'checked-in', 0, 'voided');
      INSERT INTO raffle_tickets (number, visitor_id, milestone, status) VALUES (6, 'no-show', 9, 'voided');
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

function insertEntry(connection: DatabaseSync, id: string, status: string) {
  connection
    .prepare(
      "INSERT INTO tournament_entries (id, visitor_id, channel, status, checked_in_at) VALUES (?, ?, 'pre', ?, ?)",
    )
    .run(`entry-${id}`, id, status, status === "checked_in" ? "2026-11-20T17:10:00.000Z" : null);
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
