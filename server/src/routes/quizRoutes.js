const router = require('express').Router();
const controller = require('../controllers/quizController');
const auth = require('../middleware/auth');

router.use(auth.authMiddleware);

router.post('/generate', controller.generateQuiz);
router.get('/', controller.listQuizzes);
router.get('/:id', controller.getQuiz);
router.post('/:id/submit', controller.submitQuiz);
router.get('/:id/attempts', controller.listAttempts);
router.delete('/:id', controller.deleteQuiz);

module.exports = router;
