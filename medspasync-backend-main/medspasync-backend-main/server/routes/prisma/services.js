const express = require('express');
const { prisma } = require('../../../prisma/client');
const authenticateToken = require('../../../middleware/authenticateToken');
const verifySubscription = require('../../../middleware/verifySubscription');
const { isProfessional } = require('../../../utils/planHelpers');

const router = express.Router();

// 🔐 All service routes require authentication
router.use(authenticateToken);
router.use(verifySubscription);
router.use((req, res, next) => {
  if (!isProfessional(req.user)) {
    return res.status(403).json({ success: false, error: 'Professional plan required' });
  }
  next();
});

// ✅ GET /api/services - Fetch all active services grouped by category
router.get('/', async (req, res) => {
  try {
    const { limit = 12, offset = 0 } = req.query;

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where: { active: true },
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ],
        skip: parseInt(offset),
        take: parseInt(limit)
      }),
      prisma.service.count({ where: { active: true } })
    ]);

    // Group services by category
    const servicesByCategory = services.reduce((acc, service) => {
      const category = service.category || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(service);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        services,
        servicesByCategory,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('[FETCH_SERVICES_ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch services'
    });
  }
});

module.exports = router;
