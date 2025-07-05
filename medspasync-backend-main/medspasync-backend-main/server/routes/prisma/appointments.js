const express = require('express');
const { prisma } = require('../../../prisma/client');
const authenticateToken = require('../../../middleware/authenticateToken');
const verifySubscription = require('../../../middleware/verifySubscription');
const requireRole = require('../../../middleware/requireRole');
const { isProfessional } = require('../../../utils/planHelpers');
const { appointmentValidation, validateRequest } = require('../../../middleware/validation');

const router = express.Router();

// 🔒 All routes require authentication
router.use(authenticateToken);
router.use(verifySubscription);
// Appointments are managed by staff or admins only
router.use(requireRole('staff', 'admin'));
router.use((req, res, next) => {
  if (!isProfessional(req.user)) {
    return res.status(403).json({ success: false, error: 'Professional plan required' });
  }
  next();
});

// 📅 GET /api/appointments - All appointments for the user's practice
router.get('/', async (req, res) => {
  try {
    const practiceId = req.user.practiceId;
    const { page = 1, limit = 12 } = req.query;

    if (!practiceId) {
      return res.status(400).json({ success: false, error: 'No practice ID found in user context' });
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: { practiceId },
        orderBy: { date: 'desc' },
        include: { client: true, service: true, staff: true },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.appointment.count({ where: { practiceId } })
    ]);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    console.error('[GET_APPOINTMENTS_ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch appointments' });
  }
});

// 📅 POST /api/appointments - Create a new appointment
// Only admins can create appointments
router.post('/', requireRole('admin'), appointmentValidation, validateRequest, async (req, res) => {
  try {
    const { date, time, clientId, serviceId, staffId, notes } = req.body;
    const practiceId = req.user.practiceId;

    const newAppointment = await prisma.appointment.create({
      data: {
        date: new Date(`${date}T${time}`),
        clientId,
        serviceId,
        staffId,
        notes,
        practiceId
      }
    });

    res.status(201).json({ success: true, appointment: newAppointment });
  } catch (err) {
    console.error('[CREATE_APPOINTMENT_ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to create appointment' });
  }
});

// 📅 PUT /api/appointments/:id - Update an appointment
// Only admins can update appointments
router.put('/:id', requireRole('admin'), appointmentValidation, validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const practiceId = req.user.practiceId;
    const result = await prisma.appointment.updateMany({
      where: { id, practiceId },
      data: req.body
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    const appointment = await prisma.appointment.findUnique({ where: { id } });

    res.json({ success: true, appointment });
  } catch (err) {
    console.error('[UPDATE_APPOINTMENT_ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to update appointment' });
  }
});

// 🗑️ DELETE /api/appointments/:id - Delete an appointment
// Only admins can delete appointments
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const practiceId = req.user.practiceId;

    const result = await prisma.appointment.deleteMany({ where: { id, practiceId } });

    if (result.count === 0) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    res.json({ success: true, message: 'Appointment deleted' });
  } catch (err) {
    console.error('[DELETE_APPOINTMENT_ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to delete appointment' });
  }
});

module.exports = router;
