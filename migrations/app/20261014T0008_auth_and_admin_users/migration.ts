#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/7918648351f58b232b28d91336c18f6fbceb65497594d935ebc4f9f6169370ca/contract';
import startContract from '../../snapshots/7918648351f58b232b28d91336c18f6fbceb65497594d935ebc4f9f6169370ca/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/a840174eae3d06ad4bd1c8fc164989bf53c92d053dc9873f411cabed6bf2c3a4/contract';
import endContract from '../../snapshots/a840174eae3d06ad4bd1c8fc164989bf53c92d053dc9873f411cabed6bf2c3a4/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';
import postgres from '@prisma/orm-postgres/runtime';

const { sql: db, contract } = postgres<End>({ contractJson: endContract });

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'admin_user',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('password_hash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('username', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('admin_user_email_length_31ba217c', 'char_length(email) <= 120'),
          checkExpression(
            'admin_user_password_hash_length_f028b397',
            'char_length(password_hash) <= 255',
          ),
          checkExpression('admin_user_username_length_9b9aec6b', 'char_length(username) <= 40'),
        ],
      }),
      this.addColumn({
        schema: 'public',
        table: 'team_member',
        column: col('confirmation_expires_at', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'team_member',
        column: col('confirmation_token_hash', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'team_member',
        column: col('is_confirmed', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'team_member',
        column: col('email', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dataTransform(contract, 'backfill-team_member-email', {
        check: () => db.public.team_member.select('id').where((f, fns) => fns.eq(f.email, null)).limit(1),
        run: () => db.public.team_member.delete(),
      }),
      this.setNotNull({ schema: 'public', table: 'team_member', column: 'email' }),
      this.addColumn({
        schema: 'public',
        table: 'team_member',
        column: col('password_hash', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dataTransform(contract, 'backfill-team_member-password_hash', {
        check: () => db.public.team_member.select('id').where((f, fns) => fns.eq(f.password_hash, null)).limit(1),
        run: () => db.public.team_member.delete(),
      }),
      this.setNotNull({ schema: 'public', table: 'team_member', column: 'password_hash' }),
      this.addUnique({
        schema: 'public',
        table: 'admin_user',
        constraint: 'admin_user_username_key',
        columns: ['username'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'admin_user',
        constraint: 'admin_user_email_key',
        columns: ['email'],
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'team_member',
        constraint: 'team_member_confirmation_token_hash_hex_dd81ef3d',
        expression: "confirmation_token_hash IS NULL OR confirmation_token_hash ~ '^[0-9a-f]{64}$'",
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'team_member',
        constraint: 'team_member_email_length_31ba217c',
        expression: 'char_length(email) <= 120',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'team_member',
        constraint: 'team_member_password_hash_length_f028b397',
        expression: 'char_length(password_hash) <= 255',
      }),
      this.addUnique({
        schema: 'public',
        table: 'team_member',
        constraint: 'team_member_confirmation_token_hash_key',
        columns: ['confirmation_token_hash'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'team_member',
        constraint: 'team_member_email_key',
        columns: ['email'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
