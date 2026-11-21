const router = require('express').Router();
const controller = require('../controllers/documentController');
const auth = require('../middleware/auth');
const { upload, validateFileContent } = require('../middleware/upload');

router.use(auth.authMiddleware);

router.post('/upload', upload.single('file'), validateFileContent, controller.uploadDocument);
router.get('/', controller.listDocuments);
router.get('/:id', controller.getDocument);
router.patch('/:id', controller.updateDocument);
router.delete('/:id', controller.deleteDocument);

module.exports = router;
