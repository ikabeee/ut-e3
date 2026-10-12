/** Ruta del pasaporte del visitante: su QR, su avance y su boleto. */
export const PASSPORT_PATH = "/passport";

/** Ruta que abre el QR personal (`/v/<token>`); el escáner del stand lee el token de esta URL. */
export const VISITOR_QR_PATH = "/v";

/** Parámetro de `/passport` que avisa que el QR abierto ya no es válido: `?qr=unknown`. */
export const UNKNOWN_QR_SEARCH_PARAM = "qr";

/** Pasaporte con el aviso de QR desconocido (un QR reemplazado o mal copiado). */
export const UNKNOWN_QR_PASSPORT_PATH = `${PASSPORT_PATH}?${UNKNOWN_QR_SEARCH_PARAM}=unknown`;
