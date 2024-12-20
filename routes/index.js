const express = require('express');
const { getStatus, getStats } = require('../controllers/AppController');

const routes = express.Router();

routes.get('/status', getStatus);
routes.get('/stats', getStats);

module.exports = routes;
