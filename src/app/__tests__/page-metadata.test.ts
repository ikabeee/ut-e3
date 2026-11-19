/**
 * @jest-environment node
 */
import type { Metadata } from "next";
import * as activate from "@app/activate/[token]/page";
import * as adminAccounts from "@app/admin/accounts/page";
import * as adminCatalog from "@app/admin/catalog/page";
import * as adminEmails from "@app/admin/emails/page";
import * as adminKof from "@app/admin/kof/page";
import * as adminLogs from "@app/admin/logs/page";
import * as adminModeration from "@app/admin/moderation/page";
import * as admin from "@app/admin/page";
import * as adminRaffle from "@app/admin/raffle/page";
import * as adminRecovery from "@app/admin/recovery/page";
import * as adminServer from "@app/admin/server/page";
import * as adminSettings from "@app/admin/settings/page";
import * as adminSql from "@app/admin/sql/page";
import * as adminVisitors from "@app/admin/visitors/page";
import * as floorPlan from "@app/floor-plan/page";
import * as forgotPassword from "@app/forgot-password/page";
import * as games from "@app/games/page";
import * as help from "@app/help/page";
import * as login from "@app/login/page";
import * as loginVerify from "@app/login/verify/page";
import * as myRole from "@app/my-role/page";
import * as offline from "@app/offline/page";
import * as home from "@app/page";
import * as passport from "@app/passport/page";
import * as recoverConfirm from "@app/passport/recover/confirm/page";
import * as recoverExpired from "@app/passport/recover/expired/page";
import * as recover from "@app/passport/recover/page";
import * as privacy from "@app/privacy/page";
import * as raffleLive from "@app/raffle/live/page";
import * as raffle from "@app/raffle/page";
import * as register from "@app/register/page";
import * as resetPassword from "@app/reset-password/[token]/page";
import * as sponsors from "@app/sponsors/page";
import * as standGame from "@app/stand/game/page";
import * as standKiosk from "@app/stand/kiosk/page";
import * as standTeam from "@app/stand/team/page";
import * as supportRecovery from "@app/support/recovery/page";
import * as tournament from "@app/tournament/page";

interface Route {
  path: string;
  metadata: Metadata | undefined;
}

// Pages anyone can find on a search engine: each one has to say where it lives and how it looks when it is shared.
const INDEXABLE: Route[] = [
  { path: "/", metadata: home.metadata },
  { path: "/games", metadata: games.metadata },
  { path: "/sponsors", metadata: sponsors.metadata },
  { path: "/floor-plan", metadata: floorPlan.metadata },
  { path: "/raffle", metadata: raffle.metadata },
  { path: "/register", metadata: register.metadata },
  { path: "/privacy", metadata: privacy.metadata },
  { path: "/help", metadata: help.metadata },
];

// Live data: a search engine would keep an old copy, but it may follow the links.
const LIVE: Route[] = [
  { path: "/tournament", metadata: tournament.metadata },
  { path: "/raffle/live", metadata: raffleLive.metadata },
];

// The visitor's own passport and its transactional pages: no copy of them belongs in a search engine.
const VISITOR_PRIVATE: Route[] = [
  { path: "/passport", metadata: passport.metadata },
  { path: "/passport/recover", metadata: recover.metadata },
  { path: "/passport/recover/expired", metadata: recoverExpired.metadata },
  { path: "/passport/recover/confirm", metadata: recoverConfirm.metadata },
  { path: "/offline", metadata: offline.metadata },
];

const STAFF_PRIVATE: Route[] = [
  { path: "/login", metadata: login.metadata },
  { path: "/login/verify", metadata: loginVerify.metadata },
  { path: "/forgot-password", metadata: forgotPassword.metadata },
  { path: "/activate/[token]", metadata: activate.metadata },
  { path: "/reset-password/[token]", metadata: resetPassword.metadata },
  { path: "/my-role", metadata: myRole.metadata },
  { path: "/admin", metadata: admin.metadata },
  { path: "/admin/accounts", metadata: adminAccounts.metadata },
  { path: "/admin/catalog", metadata: adminCatalog.metadata },
  { path: "/admin/emails", metadata: adminEmails.metadata },
  { path: "/admin/kof", metadata: adminKof.metadata },
  { path: "/admin/logs", metadata: adminLogs.metadata },
  { path: "/admin/moderation", metadata: adminModeration.metadata },
  { path: "/admin/raffle", metadata: adminRaffle.metadata },
  { path: "/admin/recovery", metadata: adminRecovery.metadata },
  { path: "/admin/server", metadata: adminServer.metadata },
  { path: "/admin/settings", metadata: adminSettings.metadata },
  { path: "/admin/sql", metadata: adminSql.metadata },
  { path: "/admin/visitors", metadata: adminVisitors.metadata },
  { path: "/stand/game", metadata: standGame.metadata },
  { path: "/stand/kiosk", metadata: standKiosk.metadata },
  { path: "/stand/team", metadata: standTeam.metadata },
  { path: "/support/recovery", metadata: supportRecovery.metadata },
];

// The address of these carries a one-use token: a canonical would only repeat it.
const TOKEN_PATHS = new Set(["/activate/[token]", "/reset-password/[token]"]);

describe("the metadata of the public pages", () => {
  it.each(INDEXABLE)(
    "$path has a title, a description, its own canonical and Open Graph, and is indexable",
    (route) => {
      const { metadata } = route;

      expect(metadata?.title).toBeTruthy();
      expect(metadata?.description).toEqual(expect.any(String));
      expect(metadata?.alternates?.canonical).toBe(route.path);
      expect(metadata?.openGraph).toMatchObject({ type: "website", url: route.path });
      expect(metadata?.openGraph?.images).toEqual([
        expect.objectContaining({ url: "/opengraph-image", width: 1200, height: 630 }),
      ]);
      expect(metadata?.robots).toBeUndefined();
    },
  );
});

describe("the metadata of the live pages", () => {
  it.each(LIVE)("$path has a canonical and stays out of the index but keeps its links", ({ path, metadata }) => {
    expect(metadata?.alternates?.canonical).toBe(path);
    expect(metadata?.robots).toEqual({ index: false, follow: true });
  });
});

describe("the metadata of the private and transactional pages", () => {
  it.each([...VISITOR_PRIVATE, ...STAFF_PRIVATE])("$path is neither indexed nor followed", ({ path, metadata }) => {
    expect(metadata?.title).toBeTruthy();
    expect(metadata?.robots).toEqual({ index: false, follow: false });

    if (!TOKEN_PATHS.has(path)) expect(metadata?.alternates?.canonical).toBe(path);
  });
});
