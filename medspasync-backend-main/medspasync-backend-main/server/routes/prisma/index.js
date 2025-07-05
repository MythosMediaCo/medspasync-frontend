const express = require('express');
const router = express.Router();

router.use('/clients', require('./clients'));
router.use('/appointments', require('./appointments'));
router.use('/services', require('./services'));
router.use('/staff', require('./staff'));

module.exports = router;
