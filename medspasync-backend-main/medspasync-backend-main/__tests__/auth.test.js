const request = require('supertest');
const express = require('express');

jest.mock('../models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn()
  }
}));

jest.mock('../models/Practice', () => ({
  findOne: jest.fn()
}));

const { User } = require('../models');
const Practice = require('../models/Practice');
const authRoutes = require('../server/routes/mongo/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

describe('POST /api/auth/login', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'testsecret';
    process.env.JWT_REFRESH_SECRET = 'testrefresh';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns a token and user data for valid credentials', async () => {
    const hashed = await bcrypt.hash('password123', 10);
    User.findOne.mockResolvedValue({
      _id: '123',
      email: 'test@example.com',
      password: hashed,
      firstName: 'Test',
      lastName: 'User',
      practiceId: null
    });
    Practice.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200);

    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({
      id: '123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      practiceId: null,
      isSubscribed: null
    });
  });
});

describe('Auth registration and refresh', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'testsecret';
    process.env.JWT_REFRESH_SECRET = 'testrefresh';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registers a new user and sets refresh cookie', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: 'abc',
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
      practiceId: null,
      businessName: null
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      })
      .expect(201);

    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.body).toHaveProperty('token');
  });

  it('refreshes an access token with valid cookie', async () => {
    const refreshToken = jwt.sign({ id: 'abc' }, process.env.JWT_REFRESH_SECRET);
    User.findById.mockResolvedValue({
      _id: 'abc',
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
      practiceId: null
    });
    Practice.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refreshToken=${refreshToken}`])
      .expect(200);

    expect(res.body).toHaveProperty('token');
  });
});
