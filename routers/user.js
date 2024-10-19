const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const auth = require('../middleware/auth');
const asyncHandler = require("../middleware/async")

router.post('/user/login', asyncHandler(userController.login));
router.get('/user/info', auth, asyncHandler(userController.userInfo));
router.post('/user/getallnotifications', auth, asyncHandler(userController.getallnotifications));
router.get('/user/readallnotifications', auth, asyncHandler(userController.readallnotifications));
router.get('/user/unReadNotifications', auth, asyncHandler(userController.unReadNotifications));
router.get('/user/logout',auth,asyncHandler(userController.logout));

module.exports = router;
