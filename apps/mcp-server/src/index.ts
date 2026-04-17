import { initSentry } from './lib/telemetry';
import { createApp } from './app';
import { config } from './config';

initSentry();

const app = createApp();

const server = app.listen(config.PORT, () => {
  console.log(`🚀 LIZY MCP Server running on port ${config.PORT} [${config.NODE_ENV}]`);
  console.log(`   Abstract RPC: ${config.ABSTRACT_RPC}`);
  console.log(`   Health:       http://localhost:${config.PORT}/health`);
  console.log(`   MCP endpoint: http://localhost:${config.PORT}/mcp`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received — shutting down gracefully');
  server.close(() => process.exit(0));
});
