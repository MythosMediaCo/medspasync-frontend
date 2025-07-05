const jwt = require('jsonwebtoken');
const authenticateToken = require('../middleware/authenticateToken');

describe('authenticateToken middleware', () => {
  it('attaches user and calls next for valid token', () => {
    const token = jwt.sign({ id: '1' }, 'secret');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    process.env.JWT_SECRET = 'secret';
    authenticateToken(req, res, next);
    expect(req.user).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  it('returns 401 when token missing', () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
