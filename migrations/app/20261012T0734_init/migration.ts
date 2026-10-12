#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/7918648351f58b232b28d91336c18f6fbceb65497594d935ebc4f9f6169370ca/contract';
import endContract from '../../snapshots/7918648351f58b232b28d91336c18f6fbceb65497594d935ebc4f9f6169370ca/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'check_in',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('game_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('scanned_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('visitor_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('check_in_scanned_before_received_bf05099b', 'scanned_at <= created_at'),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'game',
        columns: [
          col('about', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('genre_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('itchio_url', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('players', 'int2', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int2@1' },
          }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sort_order', 'int2', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int2@1' },
          }),
          col('team_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('game_about_length_4f46127c', 'char_length(about) <= 3000'),
          checkExpression('game_description_length_9ce16a9b', 'char_length(description) <= 300'),
          checkExpression(
            'game_itchio_url_format_4c9d4c0f',
            "itchio_url ~ '^https://[a-z0-9-]+[.]itch[.]io/'",
          ),
          checkExpression('game_name_length_46b790f5', 'char_length(name) <= 80'),
          checkExpression('game_players_range_42c40983', 'players BETWEEN 1 AND 16'),
          checkExpression(
            'game_slug_format_0d449c04',
            "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 80",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'game_genre',
        columns: [
          col('game_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('genre_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['game_id', 'genre_id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'game_image',
        columns: [
          col('alt_text', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('crop_position', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('game_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('image_url', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('is_cover', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('sort_order', 'int2', { notNull: true, codecRef: { codecId: 'pg/int2@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('game_image_alt_text_length_5b8f0bb2', 'char_length(alt_text) <= 160'),
          checkExpression(
            'game_image_crop_position_length_435ff29f',
            'char_length(crop_position) <= 20',
          ),
          checkExpression('game_image_sort_order_range_31993b07', 'sort_order BETWEEN 0 AND 4'),
          checkExpression('game_image_url_format_1de61377', "image_url ~ '^(https://|/[^/])'"),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'game_platform',
        columns: [
          col('game_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('platform_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['game_id', 'platform_id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'genre',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('genre_name_length_e3707e7a', 'char_length(name) <= 40'),
          checkExpression(
            'genre_slug_format_a2990fec',
            "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 40",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'platform',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('platform_name_length_e3707e7a', 'char_length(name) <= 40'),
          checkExpression(
            'platform_slug_format_a2990fec',
            "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 40",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'raffle_ticket',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('notified_at', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('phone', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('ticket_number', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('visitor_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('won_at', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
        ],
        constraints: [
          primaryKey(['ticket_number']),
          checkExpression(
            'raffle_ticket_notified_winner_ff4de8c9',
            'notified_at IS NULL OR won_at IS NOT NULL',
          ),
          checkExpression('raffle_ticket_phone_format_904f0b6b', "phone ~ '^[+][1-9][0-9]{7,14}$'"),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'team',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('scanner_key_hash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('stand_code', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('team_name_length_46b790f5', 'char_length(name) <= 80'),
          checkExpression(
            'team_scanner_key_hash_hex_8e430906',
            "scanner_key_hash ~ '^[0-9a-f]{64}$'",
          ),
          checkExpression('team_stand_code_format_e4e36fe5', "stand_code ~ '^[AB][1-9]$'"),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'team_member',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('full_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('group_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('is_leader', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('sort_order', 'int2', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int2@1' },
          }),
          col('team_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('team_member_full_name_length_700f57e9', 'char_length(full_name) <= 120'),
          checkExpression(
            'team_member_group_name_check_b42f413d',
            `"group_name" IN ('IDYGS101', 'IDYGS102', 'IDYGS103')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'visitor',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('gamertag', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('qr_token_hash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('visitor_gamertag_format_aeff463d', "gamertag ~ '^[a-z0-9_.-]{3,24}$'"),
          checkExpression('visitor_qr_token_hash_hex_b5a3443a', "qr_token_hash ~ '^[0-9a-f]{64}$'"),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'check_in',
        constraint: 'check_in_visitor_id_game_id_key',
        columns: ['visitor_id', 'game_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'game',
        constraint: 'game_team_id_key',
        columns: ['team_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'game',
        constraint: 'game_slug_key',
        columns: ['slug'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'game_image',
        constraint: 'game_image_game_id_sort_order_key',
        columns: ['game_id', 'sort_order'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'genre',
        constraint: 'genre_slug_key',
        columns: ['slug'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'genre',
        constraint: 'genre_name_key',
        columns: ['name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'platform',
        constraint: 'platform_slug_key',
        columns: ['slug'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'platform',
        constraint: 'platform_name_key',
        columns: ['name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'raffle_ticket',
        constraint: 'raffle_ticket_visitor_id_key',
        columns: ['visitor_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'raffle_ticket',
        constraint: 'raffle_ticket_phone_key',
        columns: ['phone'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'team',
        constraint: 'team_name_key',
        columns: ['name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'team',
        constraint: 'team_stand_code_key',
        columns: ['stand_code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'team',
        constraint: 'team_scanner_key_hash_key',
        columns: ['scanner_key_hash'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'visitor',
        constraint: 'visitor_gamertag_key',
        columns: ['gamertag'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'visitor',
        constraint: 'visitor_qr_token_hash_key',
        columns: ['qr_token_hash'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'check_in',
        index: 'check_in_game_id_idx_aa9dd7a6',
        columns: ['game_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'check_in',
        index: 'check_in_game_id_scanned_at_idx_7ed6ca48',
        columns: ['game_id', 'scanned_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'check_in',
        index: 'check_in_visitor_id_idx_f711bdfd',
        columns: ['visitor_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'game',
        index: 'game_genre_id_idx_44287509',
        columns: ['genre_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'game_genre',
        index: 'game_genre_game_id_idx_aa9dd7a6',
        columns: ['game_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'game_genre',
        index: 'game_genre_genre_id_idx_44287509',
        columns: ['genre_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'game_image',
        index: 'game_image_game_id_idx_aa9dd7a6',
        columns: ['game_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'game_image',
        index: 'game_image_one_cover_b9e9659e',
        columns: ['game_id'],
        extras: { where: 'is_cover', unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'game_platform',
        index: 'game_platform_game_id_idx_aa9dd7a6',
        columns: ['game_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'game_platform',
        index: 'game_platform_platform_id_idx_d54ba338',
        columns: ['platform_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'team_member',
        index: 'team_member_one_leader_da663291',
        columns: ['team_id'],
        extras: { where: 'is_leader', unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'team_member',
        index: 'team_member_team_id_idx_d177da93',
        columns: ['team_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'check_in',
        foreignKey: {
          name: 'check_in_visitor_id_fkey',
          columns: ['visitor_id'],
          references: { schema: 'public', table: 'visitor', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'check_in',
        foreignKey: {
          name: 'check_in_game_id_fkey',
          columns: ['game_id'],
          references: { schema: 'public', table: 'game', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'game',
        foreignKey: {
          name: 'game_team_id_fkey',
          columns: ['team_id'],
          references: { schema: 'public', table: 'team', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'game',
        foreignKey: {
          name: 'game_genre_id_fkey',
          columns: ['genre_id'],
          references: { schema: 'public', table: 'genre', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'game_genre',
        foreignKey: {
          name: 'game_genre_game_id_fkey',
          columns: ['game_id'],
          references: { schema: 'public', table: 'game', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'game_genre',
        foreignKey: {
          name: 'game_genre_genre_id_fkey',
          columns: ['genre_id'],
          references: { schema: 'public', table: 'genre', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'game_image',
        foreignKey: {
          name: 'game_image_game_id_fkey',
          columns: ['game_id'],
          references: { schema: 'public', table: 'game', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'game_platform',
        foreignKey: {
          name: 'game_platform_game_id_fkey',
          columns: ['game_id'],
          references: { schema: 'public', table: 'game', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'game_platform',
        foreignKey: {
          name: 'game_platform_platform_id_fkey',
          columns: ['platform_id'],
          references: { schema: 'public', table: 'platform', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'raffle_ticket',
        foreignKey: {
          name: 'raffle_ticket_visitor_id_fkey',
          columns: ['visitor_id'],
          references: { schema: 'public', table: 'visitor', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'team_member',
        foreignKey: {
          name: 'team_member_team_id_fkey',
          columns: ['team_id'],
          references: { schema: 'public', table: 'team', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
