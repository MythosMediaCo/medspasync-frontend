
const express = require('express');
const { exec } = require('child_process');
const router = express.Router();

router.post('/sandbox', (req, res) => {
  exec('node scripts/seed-sandbox.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error seeding sandbox: ${error}`);
      return res.status(500).send('Error creating sandbox environment.');
    }
    console.log(`Sandbox seeded: ${stdout}`);
    res.status(200).send('Sandbox environment created successfully.');
  });
});

module.exports = router;
