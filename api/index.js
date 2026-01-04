import app from '../server/server.js';
import serverless from 'serverless-http';

// Wrap the Express app
const handler = serverless(app);

export default handler;
