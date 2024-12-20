const express = require('express');
const { getStatus, getStats } = require('../controllers/AppController');
const { postNew, getMe } = require('../controllers/UsersController');
const { getConnect, getDisconnect } = require('../controllers/AuthController');
const postUpload = require('../controllers/FilesController');

const routes = express.Router();
routes.use(express.json());

routes.get('/status', getStatus);
routes.get('/stats', getStats);
routes.post('/users', postNew);
routes.get('/connect', getConnect);
routes.get('/disconnect', getDisconnect);
routes.get('/users/me', getMe);
routes.post('/files', postUpload);

module.exports = routes;
