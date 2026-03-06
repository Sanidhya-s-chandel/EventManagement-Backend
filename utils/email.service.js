const transporter = require('@config/email.config');

const sendEmail = async (to, subject, text) => {
  
  console.log("From email:",process.env.EMAIL)
  const mailOptions = {
    from: process.env.EMAIL,
    to,
    subject,
    text
  };

  console.log("Mail options are :",mailOptions);

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  };
};

module.exports = { sendEmail };