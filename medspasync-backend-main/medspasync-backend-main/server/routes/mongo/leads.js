const express = require('express');
const router = express.Router();
const Lead = require('../../../models/Lead');

// 📥 Create a new lead
router.post('/', async (req, res) => {
  try {
    const newLead = new Lead(req.body);
    const savedLead = await newLead.save();
    res.status(201).json({ success: true, data: savedLead });
  } catch (err) {
    console.error('[LEAD_CREATE_ERROR]', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// 📊 Get all leads (optionally filtered by email)
router.get('/', async (req, res) => {
  try {
    const filter = req.query.email ? { email: req.query.email.toLowerCase() } : {};
    const leads = await Lead.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: leads });
  } catch (err) {
    console.error('[LEAD_GET_ALL_ERROR]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🔍 Get a single lead by ID
router.get('/:id', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (err) {
    console.error('[LEAD_GET_ERROR]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✏️ Update a lead by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedLead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updatedLead });
  } catch (err) {
    console.error('[LEAD_UPDATE_ERROR]', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// ❌ Delete a lead by ID
router.delete('/:id', async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (err) {
    console.error('[LEAD_DELETE_ERROR]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
