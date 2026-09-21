export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
        service: "sublyon-api"
      });
    }

    return Response.json(
      {
        error: "Route not found"
      },
      {
        status: 404
      }
    );
  }
};