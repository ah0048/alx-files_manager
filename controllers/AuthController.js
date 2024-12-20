const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { ObjectId } = require('mongodb'); // Import ObjectId
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

// Function to hash a password using SHA-1
function hashPassword(password) {
  return crypto.createHash('sha1').update(password).digest('hex');
}

// Function to verify if the received password matches the hashed one
function verifyPassword(receivedPassword, storedHashedPassword) {
  // Hash the received password
  const hashedReceivedPassword = hashPassword(receivedPassword);

  // Compare the hashed password with the stored one
  return hashedReceivedPassword === storedHashedPassword;
}

async function getConnect(req, res) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const base64Credentials = authHeader.split(' ')[1];
  const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [email, password] = decodedCredentials.split(':');
  if (!email || !password) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const usersCollection = dbClient.db.collection('users');
  const requiredUser = await usersCollection.findOne({ email });
  if (!requiredUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!verifyPassword(password, requiredUser.password)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = uuidv4();
  await redisClient.set(`auth_${token}`, requiredUser._id.toString(), 3600 * 24);
  return res.status(200).json({ token });
}

async function getDisconnect(req, res) {
  const token = req.headers['x-token'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userID = await redisClient.get(`auth_${token}`);
  if (!userID) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const usersCollection = dbClient.db.collection('users');
  const existingUser = await usersCollection.findOne({ _id: new ObjectId(userID) });
  if (!existingUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  await redisClient.del(`auth_${token}`);
  return res.status(204).json();
}

module.exports = { getConnect, getDisconnect };
