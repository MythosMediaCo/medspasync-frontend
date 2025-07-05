const express = require('express');
const { prisma } = require('../../../prisma/client');
const authenticateToken = require('../../../middleware/authenticateToken');
const verifySubscription = require('../../../middleware/verifySubscription');
const requireRole = require('../../../middleware/requireRole');
const { isProfessional } = require('../../../utils/planHelpers');
const { clientValidation, validateRequest } = require('../../../middleware/validation');

const router = express.Router();

router.use(authenticateToken);
router.use(verifySubscription);
// All client routes require staff or admin role
router.use(requireRole('staff', 'admin'));
router.use((req, res, next) => {
  if (!isProfessional(req.user)) {
    return res.status(403).json({ success: false, error: 'Professional plan required' });
  }
  next();
});

// ✅ GET /api/clients - Fetch clients with filters and pagination
router.get('/', async (req, res) => {
  try {
    const { search = '', status = 'all', page = 1, limit = 12 } = req.query;
    const practiceId = req.user.practiceId;
    const where = { practiceId };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status !== 'all') {
      where.status = status;
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          appointments: {
            select: {
              id: true,
              dateTime: true,
              status: true,
              service: { select: { name: true } }
            },
            orderBy: { dateTime: 'desc' },
            take: 3
          },
          _count: {
            select: { appointments: true }
          }
        },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.client.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        clients,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('[FETCH_CLIENTS_ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to fetch clients' });
  }
});

// ✅ POST /api/clients - Create a new client
// Only admins can create clients
router.post('/', requireRole('admin'), clientValidation, validateRequest, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, dateOfBirth, status = 'ACTIVE', notes } = req.body;
    const practiceId = req.user.practiceId;


    const existing = await prisma.client.findFirst({ where: { email, practiceId } });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Client with this email already exists'
      });
    }

    const client = await prisma.client.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        status,
        notes,
        practiceId
      }
    });

    res.status(201).json({ success: true, data: client });
  } catch (error) {
    console.error('[CREATE_CLIENT_ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to create client' });
  }
});

// ✅ PUT /api/clients/:id - Update client
// Only admins can update clients
router.put('/:id', requireRole('admin'), clientValidation, validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const practiceId = req.user.practiceId;

    const result = await prisma.client.updateMany({
      where: { id, practiceId },
      data: req.body
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    const client = await prisma.client.findUnique({ where: { id } });
    res.json({ success: true, data: client });
  } catch (error) {
    console.error('[UPDATE_CLIENT_ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to update client' });
  }
});

// ✅ DELETE /api/clients/:id - Delete client
// Only admins can delete clients
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const practiceId = req.user.practiceId;

    const result = await prisma.client.deleteMany({ where: { id, practiceId } });

    if (result.count === 0) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    res.json({ success: true, message: 'Client deleted' });
  } catch (error) {
    console.error('[DELETE_CLIENT_ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to delete client' });
  }
});

module.exports = router;
