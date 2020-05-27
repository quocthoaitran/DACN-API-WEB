const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_KEY);

const sendEmail = async (msg) => {
  const info = {
    ...msg,
    from: 'support@didauday.me',
  };

  try {
    await sgMail.send(info);
    return true;
  } catch (error) {
    console.log("error")
    console.log(error);
    return false;
  }
};

module.exports = sendEmail;
