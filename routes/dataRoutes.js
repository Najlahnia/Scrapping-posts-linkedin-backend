const express = require('express');
const dataController = require('../controllers/dataController');

const router = express.Router();

router.post('/save', dataController.saveData);
router.get('/fetch-and-save', dataController.fetchAndSaveData);  
router.get('/posts', dataController.getAllPosts);

module.exports = router;