const express = require('express');
const router = express.Router();
const {
  createPayment,
  getPaymentsBySponsored,
  deletePayment
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { invalidateCache } = require('../middleware/cache');
const { validate, paymentSchema } = require('../middleware/validator');

router.use(protect);

router.post('/', validate(paymentSchema), invalidateCache(['/api/sponsored', '/api/reports', '/api/payments']), createPayment);
router.get('/sponsored/:sponsoredId', getPaymentsBySponsored);
router.delete('/:id', invalidateCache(['/api/sponsored', '/api/reports', '/api/payments']), deletePayment);

module.exports = router;
