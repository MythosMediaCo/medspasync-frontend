// routes/staff.js
const express = require('express');
const { prisma } = require('../../../prisma/client');
const authenticateToken = require('../../../middleware/authenticateToken');
const verifySubscription = require('../../../middleware/verifySubscription');
const requireRole = require('../../../middleware/requireRole');
const { isProfessional } = require('../../../utils/planHelpers');
const { staffValidation, validateRequest } = require('../../../middleware/validation');

const router = express.Router();

// 🔒 All staff routes require authentication
router.use(authenticateToken);
router.use(verifySubscription);
// Staff routes are only accessible to logged in staff or admins
router.use(requireRole('staff', 'admin'));
router.use((req, res, next) => {
  if (!isProfessional(req.user)) {
    return res.status(403).json({ success: false, error: 'Professional plan required' });
  }
  next();
});

// 👥 GET /api/staff - List all staff for the authenticated user's practice
router.get('/', async (req, res) => {
  try {
    const { role = 'all', available = null, limit = 12, offset = 0 } = req.query;
    const practiceId = req.user.practiceId;

    if (!practiceId) {
      return res.status(403).json({ success: false, error: 'User not associated with any practice' });
    }

    const where = { practiceId };
    if (role !== 'all') where.role = role;
    if (available !== null) where.available = available === 'true';

    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        orderBy: { lastName: 'asc' },
        skip: parseInt(offset),
        take: parseInt(limit)
      }),
      prisma.staff.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        staff,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('[GET_STAFF_ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to fetch staff members' });
  }
});

// 👤 POST /api/staff - Create new staff member
router.post('/', requireRole('admin'), staffValidation, validateRequest, async (req, res) => {
  try {
    const { firstName, lastName, email, role = 'user', available = true } = req.body;
    const practiceId = req.user.practiceId;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ success: false, error: 'First name, last name, and email are required' });
    }

    const existing = await prisma.staff.findFirst({ where: { email, practiceId } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Staff email already exists' });
    }

    const staff = await prisma.staff.create({
      data: {
        firstName,
        lastName,
        email,
        role,
        available,
        practiceId
      }
    });

    res.status(201).json({ success: true, data: staff });
  } catch (error) {
    console.error('[CREATE_STAFF_ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to create staff member' });
  }
});

// 📝 PUT /api/staff/:id - Update staff member
router.put('/:id', requireRole('admin'), staffValidation, validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const practiceId = req.user.practiceId;
    const updates = req.body;

    const result = await prisma.staff.updateMany({
      where: { id, practiceId },
      data: updates
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }

    const staff = await prisma.staff.findUnique({ where: { id } });
    res.json({ success: true, data: staff });
  } catch (error) {
    console.error('[UPDATE_STAFF_ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to update staff member' });
  }
});

// 🗑 DELETE /api/staff/:id - Delete staff member
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const practiceId = req.user.practiceId;

    const result = await prisma.staff.deleteMany({ where: { id, practiceId } });

    if (result.count === 0) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }

    res.json({ success: true, message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('[DELETE_STAFF_ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to delete staff member' });
  }
});

module.exports = router;
