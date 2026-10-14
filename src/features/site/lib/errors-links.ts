export const ERRORS_PATH = "/errors";

export function getErrorPath(type: "not-found" | "internal-server-error" | "404" | "500") {
  return `${ERRORS_PATH}/${type}`;
}
