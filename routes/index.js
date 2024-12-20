const express = require('express');
const { getStatus, getStats } = require('../controllers/AppController');
const { postNew, getMe } = require('../controllers/UsersController');
const { getConnect, getDisconnect } = require('../controllers/AuthController');

const routes = express.Router();
routes.use(express.json());

routes.get('/status', getStatus);
routes.get('/stats', getStats);
routes.post('/users', postNew);
routes.get('/connect', getConnect);
routes.get('/disconnect', getDisconnect);
routes.get('/users/me', getMe);

module.exports = routes;
