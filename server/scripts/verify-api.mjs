import { spawn } from 'node:child_process';
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create();
const uri = mongo.getUri();
console.log(`Started in-memory MongoDB at ${uri}`);

const child = spawn(process.execPath, ['--test', 'tests/**/*.test.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    MONGO_URI_TEST: uri,
    NODE_ENV: 'test',
    JWT_SECRET: process.env.JWT_SECRET || 'integration-test-secret',
    CLIENT_URL: 'http://localhost:5173',
  },
});

child.on('exit', async (code) => {
  await mongo.stop();
  process.exit(code ?? 1);
});
