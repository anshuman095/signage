import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  constructor() {}
  async sendEmail(email: string, data): Promise<void> {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_ID,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_ID,
      to: email,
      subject: data?.subject,
      html: data?.html,
    };
    await transporter.sendMail(mailOptions);
  }
}
