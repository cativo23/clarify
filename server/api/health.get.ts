// Health check endpoint for Docker and load balancers
export default defineEventHandler(async () => {
  // Note: In production, consider adding actual ping tests to DB/Redis here
  return {
    status: "ok",
    services: {
      database: "connected", // Placeholder for actual verification
      redis: "connected", // Placeholder
      ai: "active",
    },
    timestamp: new Date().toISOString(),
  };
});
