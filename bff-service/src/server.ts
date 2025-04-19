import { createServer } from 'http';
import { handleRequest } from './router';
import { validateConfig } from './config';

// Validate config on startup
validateConfig();

const port = process.env.PORT || 3000;

const server = createServer(async (req, res) => {
  try {
    await handleRequest(req, res);
  } catch (error) {
    console.error('Server error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
});

server.listen(port, () => {
  console.log(`BFF Service running on port ${port}`);
});
