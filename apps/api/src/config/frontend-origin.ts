// Origem permitida para o frontend que utiliza os cookies de sessão.
// O valor também é usado na política de CORS.
export const frontendOrigin = new URL(
  process.env.FRONTEND_ORIGIN ?? "http://localhost:5173"
).origin;
