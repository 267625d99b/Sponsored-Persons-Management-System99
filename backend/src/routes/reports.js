const express = require('express');
const router = express.Router();
const { getDashboard, getYearlyReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/yearly/:year?', getYearlyReport);

module.exports = router;
