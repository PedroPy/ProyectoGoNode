const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, statsController.calculateStats);

module.exports = router;
