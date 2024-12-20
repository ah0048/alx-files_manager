const express = require('express');
const { getStatus, getStats } = require('../controllers/AppController');
const postNew = require('../controllers/UsersController');

const routes = express.Router();
routes.use(express.json());

routes.get('/status', getStatus);
routes.get('/stats', getStats);
routes.post('/users', postNew);

module.exports = routes;
