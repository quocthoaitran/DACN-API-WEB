const Location = require('../models/Location');
const City = require('../models/City');

const validateLocation = require('../validations/location');

const validateCreateLocationInput = validateLocation.createLocation;
const validateUpdateLocationInput = validateLocation.updateLocation;

const getAllLocations = async (req, res) => {
  let locations = [];
  try {
    locations = await Location.find()
      .populate('city');
  } catch (error) {
    console.log(error);
    locations = [];
  }

  return res.status(200).json({
    success: true,
    data: {
      locations,
    },
  });
};

const createLocation = async (req, res) => {
  const { errors, isValid } = validateCreateLocationInput(req.body);

  if (!isValid) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  let checkCity = false;
  try {
    checkCity = await City.findById(req.body.city);
  } catch (error) {
    console.log(error);
    checkCity = false;
  }

  if (!checkCity) {
    errors.city = 'City is invalid';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  const {
    name,
    position,
    city,
    address,
    location,
  } = req.body;

  const image = req.file && req.file.path;

  const newLocation = new Location({
    name,
    position,
    city,
    address,
    location,
    image,
  });

  let locationCreated = null;
  try {
    locationCreated = await newLocation.save();
  } catch (error) {
    console.log(error);
    errors.error = 'Can\'t create new location. Please try again later!';
    return res.status(500).json(
      {
        success: false,
        errors,
      },
    );
  }

  if (!locationCreated) {
    errors.error = 'Can\'t create new location. Please try again later!';
    return res.status(400).json(
      {
        success: false,
        errors,
      },
    );
  }

  return res.status(200).json({
    success: true,
    data: {
      locationCreated,
    },
  });
};

const updateLocation = async (req, res) => {
  const { errors, isValid } = validateUpdateLocationInput(req.body);

  if (!isValid) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  if (req.body.city) {
    let checkCity = false;
    try {
      checkCity = await City.findById(req.body.city);
    } catch (error) {
      console.log(error);
      checkCity = false;
    }

    if (!checkCity) {
      errors.city = 'City is invalid';
      return res.status(400).json({
        success: false,
        errors,
      });
    }
  }

  const { locationId } = req.params;

  const data = { ...req.body };

  const image = req.file && req.file.path;

  if (image) {
    data.image = image;
  }

  let locationUpdated = null;
  try {
    locationUpdated = await Location.findByIdAndUpdate(locationId, data);
  } catch (error) {
    console.log(error);
    errors.error = 'Can\'t update location. Please try again later!';
    return res.status(500).json(
      {
        success: false,
        errors,
      },
    );
  }

  if (!locationUpdated) {
    errors.error = 'Can\'t update location. Please try again later!';
    return res.status(400).json(
      {
        success: false,
        errors,
      },
    );
  }

  let location = null;
  try {
    location = await Location.findById(locationId);
  } catch (error) {
    console.log(error);
    errors.error = 'Can\'t update location. Please try again later!';
    return res.status(400).json(
      {
        success: false,
        errors,
      },
    );
  }

  if (!location) {
    errors.error = 'Can\'t update location. Please try again later!';
    return res.status(400).json(
      {
        success: false,
        errors,
      },
    );
  }

  return res.status(200).json({
    success: true,
    data: {
      locationUpdated: location,
    },
  });
};

const deleteLocation = async (req, res) => {
  const errors = {};

  const { locationId } = req.params;

  let locationDeleted = null;
  try {
    locationDeleted = await Location.findByIdAndDelete(locationId);
  } catch (error) {
    console.log(error);
    errors.location = 'Can\'t delete location. Please try again later!';
    return res.status(500).json({
      success: false,
      errors,
    });
  }

  if (!locationDeleted) {
    errors.location = 'Can\'t delete location. Please try again later!';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      locationDeleted,
    },
  });
};

module.exports = {
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
};
