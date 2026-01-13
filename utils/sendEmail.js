import nodemailer from 'nodemailer';

export const sendEmail = async ({ email, subject, html, text }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT),
    secure: false, // true for 465, false for 587
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
    to: email,
    subject: subject,
    text: text || '',
    html: html || '',
  };

  await transporter.sendMail(mailOptions);
};