const express = require('express');
const router = express.Router();
const docController = require('../controllers/document');
const auth = require('../middleware/auth');
const asyncHandler = require('../middleware/async');

router.post("/user/create/document", auth, asyncHandler(docController.createDocument));
router.post("/user/getAllUserDocuments", auth, asyncHandler(docController.getAllUserDocuments));
router.post("/user/marketPlaceDocuments", auth, asyncHandler(docController.marketPlaceDocuments));
router.post("/user/listDocument", auth, asyncHandler(docController.listDocument));
router.post("/user/unlistDocument", auth, asyncHandler(docController.unlistDocument));
router.post("/user/change/document/ownership", auth, asyncHandler(docController.changeDocumentOwnerShip));
router.post("/user/getTransactionHistory", auth, asyncHandler(docController.getTransactionHistory));
router.post("/user/transferFund", auth, asyncHandler(docController.transferFund));

module.exports = router;

