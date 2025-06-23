const express = require('express');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

// Check if user is authenticated
router.use(authMiddleware);

module.exports = app => app.use('/account', router);