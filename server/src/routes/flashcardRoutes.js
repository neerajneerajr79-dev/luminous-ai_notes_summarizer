const router = require('express').Router();
const controller = require('../controllers/flashcardController');
const auth = require('../middleware/auth');

router.use(auth.authMiddleware);

router.post('/generate', controller.generateFlashcards);
router.get('/', controller.listFlashcards);
router.patch('/:id', controller.updateFlashcard);
router.delete('/:id', controller.deleteFlashcard);
router.post('/:id/review', controller.reviewFlashcard);

module.exports = router;
