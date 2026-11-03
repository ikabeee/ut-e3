const NO_STORE = { "Cache-Control": "no-store" };

// The HEALTHCHECK of the Docker image and the monitor of the proxy call this: it only says the server answers, so it
// does not touch the database and stays light.
export async function GET(): Promise<Response> {
  return Response.json({ status: "ok" }, { headers: NO_STORE });
}
