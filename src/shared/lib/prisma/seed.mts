// Datos de ejemplo para desarrollo local: `npm run db:seed`.
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "./contract.d.ts";
import contractJson from "./contract.json" with { type: "json" };

const db = postgres<Contract>({
  contractJson,
  url: process.env["DATABASE_URL"]!,
});

const team = await db.orm.public.Team.create({
  slug: "pixel-owls",
  name: "Pixel Owls",
  group: "5°A",
  members: ["Ana López", "Luis Pérez", "María García"],
});

await db.orm.public.Game.create({
  slug: "night-courier",
  title: "Night Courier",
  description:
    "Un juego de plataformas donde entregas paquetes por los tejados de la ciudad antes de que salga el sol.",
  genre: "platformer",
  engine: "Godot",
  playUrl: "https://itch.io",
  standNumber: 1,
  published: true,
  teamId: team.id,
});

console.log("Datos de ejemplo creados.");
await db.close();
