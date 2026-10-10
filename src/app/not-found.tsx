import type { Metadata } from "next";
import { NotFoundView } from "@shared/components/not-found-view";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false },
};

export default NotFoundView;
