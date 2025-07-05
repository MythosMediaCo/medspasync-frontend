jest.mock('nodemailer');
const nodemailer = require('nodemailer');
const sendMail = jest.fn().mockResolvedValue(true);
nodemailer.createTransport.mockReturnValue({ sendMail });
const { sendEmailWithAttachment } = require('../utils/mailer');

describe('mailer utility', () => {
  it('sends email using transporter', async () => {
    await sendEmailWithAttachment({ to: 'a@example.com', subject: 't', text: 'b', attachmentBuffer: Buffer.from(''), filename: 'f' });
    expect(sendMail).toHaveBeenCalled();
  });
});
