const Profile = require('../models/Profile');

const validateUser = require('../validations/user');

const validateUpdateProfileInput = validateUser.updateProfile;

const getAllProfiles = async (req, res) => {
  const page = +req.query.page || 1;
  const page_size = 12;

  const skip = page_size * (page - 1);
  const limit = page_size;

  let users = [];
  try {
    users = await Profile.find().skip(skip).limit(limit);
  } catch (error) {
    console.log(error);
    users = [];
  }

  let total_users = [];
  try {
    total_users = await Profile.countDocuments();
  } catch (error) {
    console.log(error);
    total_users = [];
  }

  const total_page = Math.ceil(total_users / page_size);

  return res.status(200).json({
    success: true,
    data: {
      users,
    },
    meta: {
      page,
      page_size: users.length,
      total_page,
      total_size: total_users,
    },
  });
};

const getProfile = async (req, res) => {
  const errors = {};
  const { userId } = req.params;

  let user = null;
  try {
    user = await Profile.findById(userId);
  } catch (error) {
    console.log(error);
    user = null;
  }

  if (!user) {
    errors.error = 'Can\'t get user profile. Please try again later';
    return res.status(404).json(
      {
        success: false,
        errors,
      },
    );
  }

  return res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
};

const updateProfile = async (req, res) => {
  const { errors, isValid } = validateUpdateProfileInput({ ...req.body });

  if (!isValid) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  const data = {
    ...req.body,
  };

  if (req.user.role === 2 && data.email_paypal) {
    delete data.email_paypal;
  }

  const avatar = req.file && req.file.path;

  if (avatar) {
    data.avatar = avatar;
  }

  const profileId = req.user.profile;

  try {
    await Profile.findByIdAndUpdate(profileId, data);
  } catch (error) {
    console.log(error);
    errors.error = 'Can\'t update user profile. Please try again later';
    return res.status(400).json(
      {
        success: false,
        errors,
      },
    );
  }

  let user = null;
  try {
    user = await Profile.findById(profileId);
  } catch (error) {
    console.log(error);
  }

  if (!user) {
    errors.error = 'Can\'t update user profile. Please try again later';
    return res.status(404).json(
      {
        success: false,
        errors,
      },
    );
  }

  return res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
};

module.exports = {
  getAllProfiles,
  getProfile,
  updateProfile,
};
