import app from './app';
import { env } from './config/env';

const PORT = env.API_PORT;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
});
