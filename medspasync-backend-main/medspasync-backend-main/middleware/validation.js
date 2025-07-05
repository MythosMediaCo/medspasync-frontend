const { body, validationResult } = require('express-validator');

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

const registerValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('spaName').notEmpty().withMessage('Medical Spa Name is required'),
];

const loginValidation = [
  body('email').isEmail(),
  body('password').notEmpty()
];

const clientValidation = [
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('email').isEmail()
];

const appointmentValidation = [
  body('date').notEmpty(),
  body('time').notEmpty(),
  body('clientId').notEmpty(),
  body('serviceId').notEmpty(),
  body('staffId').notEmpty()
];

const staffValidation = [
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('email').isEmail()
];

module.exports = {
  validateRequest,
  registerValidation,
  loginValidation,
  clientValidation,
  appointmentValidation,
  staffValidation
};
