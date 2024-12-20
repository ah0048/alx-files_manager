const crypto = require('crypto');
const { ObjectId } = require('mongodb'); // Import ObjectId
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

function hashPassword(password) {
  return crypto.createHash('sha1').update(password).digest('hex');
}

async function postNew(req, res) {
  const { email } = req.body;
  const { password } = req.body;
  console.log(email);
  console.log(password);
  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Missing password' });
  }
  const usersCollection = dbClient.db.collection('users');
  const check = await usersCollection.findOne({ email });
  if (check) {
    return res.status(400).json({ error: 'Already exist' });
  }
  await usersCollection.insertOne({ email, password: hashPassword(password) });
  const createdUser = await usersCollection.findOne({ email });
  return res.status(201).json({ id: createdUser._id, email });
}

async function getMe(req, res) {
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
  return res.status(200).json({ id: existingUser._id, email: existingUser.email });
}

module.exports = { postNew, getMe };
