// Health check endpoint for Docker and load balancers
export default defineEventHandler(() => {
    return {
        status: 'ok',
        timestamp: new Date().toISOString(),
    }
})
