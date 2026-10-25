import type { Sponsor } from "@features/sponsors/lib/types";

export const PIXEL_FORGE: Sponsor = {
  id: "pixel-forge",
  name: "Pixel Forge",
  logoPath: "/sponsors/pixel-forge.png",
  websiteUrl: "https://pixel-forge.example",
  phone: "+529981234567",
  services: "Estudio de arte digital",
  position: 1,
};

export const NORTH_BYTE: Sponsor = {
  id: "north-byte",
  name: "North Byte",
  logoPath: "/sponsors/north-byte.png",
  websiteUrl: "https://north-byte.example",
  phone: "+529987654321",
  services: "Hospedaje de servidores",
  position: 2,
};

export const CODE_LAB: Sponsor = {
  id: "code-lab",
  name: "Code Lab",
  logoPath: "/sponsors/code-lab.png",
  websiteUrl: "https://code-lab.example",
  phone: "+529985550123",
  services: "Talleres de programación",
  position: 3,
};

export const SPONSORS = [PIXEL_FORGE, NORTH_BYTE, CODE_LAB];
