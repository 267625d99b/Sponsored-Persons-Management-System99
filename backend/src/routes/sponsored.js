const express = require('express');
const router = express.Router();
const {
  getAllSponsored,
  getSponsored,
  createSponsored,
  updateSponsored,
  deleteSponsored
} = require('../controllers/sponsoredController');
const { protect } = require('../middleware/auth');
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');
const { validate, sponsoredSchema } = require('../middleware/validator');

router.use(protect);

// Cache GET requests for 30 seconds
router.route('/')
  .get(cacheMiddleware(30000), getAllSponsored)
  .post(validate(sponsoredSchema), invalidateCache(['/api/sponsored', '/api/reports']), createSponsored);

router.route('/:id')
  .get(cacheMiddleware(30000), getSponsored)
  .put(validate(sponsoredSchema), invalidateCache(['/api/sponsored', '/api/reports']), updateSponsored)
  .delete(invalidateCache(['/api/sponsored', '/api/reports']), deleteSponsored);

module.exports = router;
