import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export function getStatus(req, res) {
  const status = {
    redis: redisClient.isAlive(),
    db: dbClient.isAlive(),
  };
  res.send(JSON.stringify(status));
}

export async function getStats(req, res) {
  const stats = {
    users: await dbClient.nbUsers(),
    files: await dbClient.nbFiles(),
  };
  res.send(JSON.stringify(stats));
}
