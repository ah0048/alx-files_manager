const { ObjectId } = require('mongodb'); // Import ObjectId
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // For generating unique filenames
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

async function postUpload(req, res) {
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

  const {
    name, type, parentId, isPublic = false, data,
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Missing name' });
  }

  if (!type || !['folder', 'file', 'image'].includes(type.toLowerCase())) {
    return res.status(400).json({ error: 'Missing type' });
  }

  const filesCollection = dbClient.db.collection('files');
  let parentFolder = null;

  if (parentId) {
    parentFolder = await filesCollection.findOne({ _id: new ObjectId(parentId) });
    if (!parentFolder) {
      return res.status(400).json({ error: 'Parent not found' });
    }
    if (parentFolder.type !== 'folder') {
      return res.status(400).json({ error: 'Parent is not a folder' });
    }
  }

  if (type === 'folder') {
    // Create folder document
    const newFolder = {
      userId: userID,
      name,
      type,
      isPublic,
      parentId: parentId || '0',
    };

    const result = await filesCollection.insertOne(newFolder);
    return res.status(201).json({ id: result.insertedId, ...newFolder });
  }

  // Handle file or image
  const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const filePath = path.join(folderPath, uuidv4());
  try {
    // Decode Base64 and write to disk
    const fileData = Buffer.from(data, 'base64');
    fs.writeFileSync(filePath, fileData);

    // Create file document
    const newFile = {
      userId: userID,
      name,
      type,
      isPublic,
      parentId: parentId || '0',
      localPath: filePath,
    };

    const result = await filesCollection.insertOne(newFile);
    return res.status(201).json({ id: result.insertedId, ...newFile });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to save file' });
  }
}
module.exports = postUpload;
