const router = require('express').Router();
const controller = require('../controllers/summaryController');
const auth = require('../middleware/auth');

router.use(auth.authMiddleware);

router.post('/generate', controller.generateSummary);
router.get('/', controller.listSummaries);
router.get('/:id', controller.getSummary);
router.delete('/:id', controller.deleteSummary);

module.exports = router;
