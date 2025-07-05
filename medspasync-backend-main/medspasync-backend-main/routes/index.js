const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/client-auth', require('./clientAuth'));
router.use('/upload', require('./upload'));
router.use('/reconciliation', require('./reconciliation'));
router.use('/reconciliation', require('./reconciliationStream'));
router.use('/pdf', require('./pdf'));
router.use('/analytics', require('./analytics'));
router.use('/leads', require('./leads'));
router.use('/reports', require('./reports'));

module.exports = router;
