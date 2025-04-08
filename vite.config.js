export default {
  server: {
    hmr: {
      port: 24678, // Use a fixed port for WebSocket
      host: true, // Allow connections from any network
      protocol: 'ws' // Use WebSocket protocol
    }
  }
} 