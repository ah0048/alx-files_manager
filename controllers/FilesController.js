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
  if (!data && type.toLowerCase() !== 'folder') {
    return res.status(400).json({ error: 'Missing data' });
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

  if (type.toLowerCase() === 'folder') {
    // Create folder document
    const newFolder = {
      userId: userID,
      name,
      type: type.toLowerCase(),
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
      type: type.toLowerCase(),
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

async function getShow(req, res) {
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
  const fileId = req.params.id;
  const file = await dbClient.db.collection('files').findOne({
    _id: new ObjectId(fileId),
    userId: userID,
  });
  if (!file) {
    return res.status(404).json({ error: 'Not found' });
  }
  return res.status(200).json({ ...file });
}

async function getIndex(req, res) {
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
  const { parentId } = req.query;
  const page = req.query.page || 0;
  const limit = 20;
  if (!parentId) {
    const files = await dbClient.db.collection('files').aggregate([
      // Match documents with the given id
      { $match: { userId: userID } },

      // Sort by `createdAt` in descending order
      { $sort: { createdAt: -1 } },

      // Skip documents for previous pages
      { $skip: page * limit },

      // Limit the results to `limit` items
      { $limit: limit },
    ]).toArray();
    return res.status(200).json(files);
  }
  const files = await dbClient.db.collection('files').aggregate([
    // Match documents with the given id
    {
      $match: {
        userId: userID,
        parentId,
      },
    },

    // Sort by `createdAt` in descending order
    { $sort: { createdAt: -1 } },

    // Skip documents for previous pages
    { $skip: page * limit },

    // Limit the results to `limit` items
    { $limit: limit },
  ]).toArray();
  return res.status(200).json(files);
}
module.exports = { postUpload, getShow, getIndex };
