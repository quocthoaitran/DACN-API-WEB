const Profile = require('../models/Profile');

module.exports = async (userID) => {
  let user = null;
  try {
    user = await Profile.findById(userID);
  } catch (error) {
    console.log(error);
    user = null;
  }

  if (!user) {
    return false;
  }

  if (!user.email_paypal) {
    return false;
  }

  return true;
};
