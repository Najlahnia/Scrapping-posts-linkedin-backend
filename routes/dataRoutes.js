const express = require('express');
const dataController = require('../controllers/dataController');

const router = express.Router();

router.post('/save', dataController.saveData);
router.get('/fetch-and-save', dataController.fetchAndSaveData); // Nouvelle route

module.exports = router;