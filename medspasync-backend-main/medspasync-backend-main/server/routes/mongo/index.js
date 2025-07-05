const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/client-auth', require('./clientAuth'));
router.use('/leads', require('./leads'));
router.use('/uploads', require('./upload'));
router.use('/reconciliation', require('./reconciliation'));
router.use('/reconciliation', require('./reconciliationStream'));
router.use('/reconciliation', require('./reconciliationPdf'));
router.use('/reconciliation', require('./reconciliationPdfemail'));
router.use('/pdf', require('./pdf'));
router.use('/analytics', require('./analytics'));

module.exports = router;
