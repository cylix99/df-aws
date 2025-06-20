// @ts-check
import nodemailer from "nodemailer";
import { SES, SendRawEmailCommand } from "@aws-sdk/client-ses";

// Configure AWS SES
const { AWS_ACCESS, AWS_SECRET } = process.env;

const ses = new SES({
  region: "eu-west-2",
  credentials: {
    accessKeyId: AWS_ACCESS ?? "", // Coalesce to empty string if undefined
    secretAccessKey: AWS_SECRET ?? "", // Coalesce to empty string if undefined
  },
});

// Create Nodemailer transporter using the SES client
let transporter = nodemailer.createTransport({
  SES: { ses, aws: { SendRawEmailCommand } }, // Correctly pass the SES client instance
});

export const sendOrderEmails = async ({ to, subject, body }) => {
  try {
    await transporter.sendMail({
      from: "email@puzzlesgalore.co.uk", // Ensure this email is verified in SES
      to: to, // Recipient's email address
      cc: 'ian@duncanstoychest.co.uk',
      subject: subject, // Email subject
      text: body, // Email content in HTML format
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
  }
};
