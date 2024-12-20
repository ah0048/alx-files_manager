const crypto = require('crypto');
const dbClient = require('../utils/db');

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
module.exports = postNew;
