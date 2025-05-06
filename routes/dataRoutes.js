const express = require('express');
const dataController = require('../controllers/dataController');

const router = express.Router();

router.post('/save', dataController.saveData);
router.get('/fetch-and-save', dataController.fetchAndSaveData);  
router.get('/posts', dataController.getAllPosts);
router.get('/save-to-csv', dataController.exportToCSV);
router.post('/analyze-opportunities', dataController.analyzeAndSaveOpportunities);


module.exports = router;