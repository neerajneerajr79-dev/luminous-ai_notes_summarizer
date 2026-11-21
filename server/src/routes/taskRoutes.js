const router = require('express').Router();
const controller = require('../controllers/taskController');
const auth = require('../middleware/auth');

router.use(auth.authMiddleware);

router.post('/', controller.createTask);
router.get('/', controller.listTasks);
router.patch('/:id', controller.updateTask);
router.delete('/:id', controller.deleteTask);

module.exports = router;
