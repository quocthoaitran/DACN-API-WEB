const _ = require('lodash');

const City = require('../models/City');
const Tour = require('../models/Tour');
const Hotel = require('../models/Hotel');

const validateCity = require('../validations/city');

const validateCreateCityInput = validateCity.createCity;
const validateUpdateCityInput = validateCity.updateCity;

const getAllCities = async (req, res) => {
  let cities = [];
  try {
    cities = await City.find();
  } catch (error) {
    console.log(error);
    cities = [];
  }

  return res.status(200).json({
    success: true,
    data: {
      cities,
    },
  });
};

const getAllAirports = async (req, res) => {
  let airports = [];
  try {
    airports = await City.find({ has_airport: true });
  } catch (error) {
    console.log(error);
    airports = [];
  }

  return res.status(200).json({
    success: true,
    data: {
      airports,
    },
  });
};

const getTopDestinates = async (req, res) => {
  let cityOfTours = [];
  try {
    cityOfTours = await Tour.aggregate(
      [
        {
          $group: {
            _id: '$city',
            city: {
              $first: '$city',
            },
            total_tour: {
              $sum: 1,
            },
          },
        },
        {
          $project: { _id: 0 },
        },
        {
          $lookup: {
            from: 'cities',
            localField: 'city',
            foreignField: '_id',
            as: 'city',
          },
        },
        {
          $unwind: '$city',
        },
      ],
    );
  } catch (error) {
    console.log(error);
    cityOfTours = [];
  }

  const quantityToursOfCity = cityOfTours.map(city => ({
    _id: city.city._id,
    name: city.city.name,
    image: city.city.image,
    total_tour: city.total_tour,
  }));

  let cityOfHotels = [];
  try {
    cityOfHotels = await Hotel.aggregate(
      [
        {
          $group: {
            _id: '$city',
            city: {
              $first: '$city',
            },
            total_hotel: {
              $sum: 1,
            },
          },
        },
        {
          $project: { _id: 0 },
        },
        {
          $lookup: {
            from: 'cities',
            localField: 'city',
            foreignField: '_id',
            as: 'city',
          },
        },
        {
          $unwind: '$city',
        },
      ],
    );
  } catch (error) {
    console.log(error);
    cityOfHotels = [];
  }

  const quantityHotelsOfCity = cityOfHotels.map(city => ({
    _id: city.city._id,
    name: city.city.name,
    image: city.city.image,
    total_hotel: city.total_hotel,
  }));

  _.mixin({
    mergeByKey(arr1, arr2, key) {
      const criteria = {};
      criteria[key] = null;
      return arr1.reduce((result, item) => {
        criteria[key] = item[key];
        const check = _.find(arr2, criteria);
        if (check) {
          const index = result.findIndex((item1) => {
            return item1._id === check._id
          });
          if (index !== -1) {
            result[index] = _.merge(item, _.find(arr2, criteria))
            return result;
          }
          return result.concat(_.merge(item, _.find(arr2, criteria)));
        }
        return result.concat(_.find(arr1, criteria))  
      }, [...arr2]);
    },
  });

  const topDestinations = _.mergeByKey(quantityToursOfCity, quantityHotelsOfCity, '_id');

  topDestinations.sort((city1, city2) => {
    const avgCity1 = city1.total_hotel + city1.total_tour;
    const avgCity2 = city2.total_hotel + city2.total_tour;
    return avgCity2 - avgCity1;
  });

  return res.status(200).json({
    success: true,
    data: {
      topDestinations: topDestinations.slice(0, 6),
    },
  });
};

const createCity = async (req, res) => {
  const { errors, isValid } = validateCreateCityInput(req.body);

  if (!isValid) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  const {
    name,
    zipcode,
    country,
  } = req.body;

  let cityExist = null;
  try {
    cityExist = await City.findOne({ zipcode });
  } catch (error) {
    console.log(error);
    errors.city = 'Can\'t create new city. Please try again later!';
    return res.status(500).json({
      success: false,
      errors,
    });
  }

  if (cityExist) {
    errors.city = 'City is exist';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  const image = req.file && req.file.path;

  const newCity = new City({
    name,
    zipcode,
    country,
    image,
  });

  let cityCreated = null;
  try {
    cityCreated = await newCity.save();
  } catch (error) {
    console.log(error);
    errors.error = 'Can\'t create new city. Please try again later!';
    return res.status(500).json(
      {
        success: false,
        errors,
      },
    );
  }

  if (!cityCreated) {
    errors.error = 'Can\'t create new tour. Please try again later';
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
      city: cityCreated,
    },
  });
};

const updateCity = async (req, res) => {
  const { errors, isValid } = validateUpdateCityInput(req.body);

  if (!isValid) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  const { cityId } = req.params;

  const data = { ...req.body };

  const image = req.file && req.file.path;

  if (image) {
    data.image = image;
  }

  let cityUpdated = null;
  try {
    cityUpdated = await City.findByIdAndUpdate(cityId, data);
  } catch (error) {
    console.log(error);
    errors.city = 'Can\'t update city. Please try again later!';
    return res.status(500).json({
      success: false,
      errors,
    });
  }

  if (!cityUpdated) {
    errors.city = 'Can\'t update city. Please try again later!';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  let city = null;
  try {
    city = await City.findById(cityId);
  } catch (error) {
    console.log(error);
    errors.city = 'Can\'t update city. Please try again later!';
    return res.status(500).json({
      success: false,
      errors,
    });
  }

  if (!city) {
    errors.city = 'Can\'t update city. Please try again later!';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      cityUpdated: city,
    },
  });
};

const deleteCity = async (req, res) => {
  const errors = {};

  const { cityId } = req.params;

  let cityDeleted = null;
  try {
    cityDeleted = await City.findByIdAndDelete(cityId);
  } catch (error) {
    console.log(error);
    errors.city = 'Can\'t delete city. Please try again later!';
    return res.status(500).json({
      success: false,
      errors,
    });
  }

  if (!cityDeleted) {
    errors.city = 'Can\'t delete city. Please try again later!';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      cityDeleted,
    },
  });
};

module.exports = {
  getAllCities,
  getAllAirports,
  createCity,
  getTopDestinates,
  updateCity,
  deleteCity,
};
