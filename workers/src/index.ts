export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
        service: "sublyon-api"
      });
    }

    return Response.json(
      { error: "Route not found" },
      { status: 404 }
    );
  }
} satisfies ExportedHandler<Env>;