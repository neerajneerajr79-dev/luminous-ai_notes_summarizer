const router = require('express').Router();
const controller = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

router.use(auth.authMiddleware);

router.get('/stats', controller.getStats);
router.get('/activity', controller.getActivity);

module.exports = router;
