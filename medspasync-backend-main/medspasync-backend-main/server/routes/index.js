const express = require('express');
const router = express.Router();

router.use('/', require('./mongo'));
router.use('/', require('./prisma'));

module.exports = router;
