const router = require('express').Router();
const controller = require('../controllers/aiController');
const auth = require('../middleware/auth');

router.use(auth.authMiddleware);

router.post('/chat', controller.chat);
router.get('/conversations', controller.listConversations);
router.get('/conversations/:id', controller.getConversation);
router.delete('/conversations/:id', controller.deleteConversation);

module.exports = router;
