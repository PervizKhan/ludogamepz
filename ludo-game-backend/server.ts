import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initWebSocket } from './src/lib/websocket';
import { connectDB } from './src/lib/db';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  // Connect to MongoDB
  await connectDB();
  console.log('MongoDB connected');

  // Seed clubs if empty
  const { Club } = await import('./src/models/Club');
  const count = await Club.countDocuments();
  if (count === 0) {
    await Club.insertMany([
      { name: 'Mumbai Club', code: 'mumbai', betAmount: 100, onlinePlayers: 156 },
      { name: 'Karachi Club', code: 'karachi', betAmount: 250, onlinePlayers: 323 },
      { name: 'Delhi Club', code: 'delhi', betAmount: 500, onlinePlayers: 89 },
      { name: 'Lahore Club', code: 'lahore', betAmount: 1000, onlinePlayers: 45 },
      { name: 'Bangalore Club', code: 'bangalore', betAmount: 50, onlinePlayers: 234 },
      { name: 'Dubai Club', code: 'dubai', betAmount: 2000, onlinePlayers: 12 },
    ]);
    console.log('Clubs seeded');
  }

  // Seed house account
  const { User } = await import('./src/models/User');
  const house = await User.findOne({ username: 'House' });
  if (!house) {
    await User.create({ username: 'House', balance: 0 });
  }

  const server = createServer(async (req, res) => {
    try {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error:', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  initWebSocket(server);

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket ready on ws://${hostname}:${port}`);
  });
});
