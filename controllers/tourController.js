const moment = require('moment');

const Tour = require('../models/Tour');
const City = require('../models/City');
const BookingItem = require('../models/BookingItem');
const Favorite = require('../models/Favorite');

const validateTour = require('../validations/tour');

const validateCreateTourInput = validateTour.createTour;
const validateUpdateTourInput = validateTour.updateTour;

const checkEmailPayPalExist = require('../helpers/checkEmailPayPalExist');

const getAllTours = async (req, res) => {
  const page = +req.query.page || 1;
  const page_size = 12;

  const skip = page_size * (page - 1);
  const limit = page_size;

  let tours = [];
  try {
    tours = await Tour.find()
      .populate('city').populate('owner')
      .populate('itineraries.location')
      .skip(skip)
      .limit(limit);
  } catch (error) {
    console.log(error);
    tours = [];
  }

  let total_tours = [];
  try {
    total_tours = await Tour.countDocuments();
  } catch (error) {
    console.log(error);
    total_tours = [];
  }

  const total_page = Math.ceil(total_tours / page_size);

  return res.status(200).json({
    success: true,
    data: {
      tours,
    },
    meta: {
      page,
      page_size: tours.length,
      total_page,
      total_size: total_tours,
    },
  });
};

const getAllToursOwnUser = async (req, res) => {
  const page = +req.query.page || 1;
  const page_size = 12;

  const skip = page_size * (page - 1);
  const limit = page_size;

  const owner = req.user.profile;

  let tours = [];
  try {
    tours = await Tour.find({ owner })
      .populate('city').populate('owner')
      .populate('itineraries.location')
      .skip(skip)
      .limit(limit);
  } catch (error) {
    console.log(error);
    tours = [];
  }

  let total_tours = [];
  try {
    total_tours = await Tour.find({ owner });
  } catch (error) {
    console.log(error);
    total_tours = [];
  }

  const total_page = Math.ceil(total_tours.length / page_size);

  return res.status(200).json({
    success: true,
    data: {
      tours,
    },
    meta: {
      page,
      page_size: tours.length,
      total_page,
      total_size: total_tours.length,
    },
  });
};

const getTopTours = async (req, res) => {
  let tourBooked = [];
  try {
    tourBooked = await BookingItem.aggregate(
      [
        {
          $group: {
            _id: '$tour',
            tour: {
              $first: '$tour',
            },
            total: {
              $sum: 1,
            },
          },
        },
        {
          $project: { _id: 0 },
        },
        {
          $lookup: {
            from: 'tours',
            localField: 'tour',
            foreignField: '_id',
            as: 'tour',
          },
        },
        { $unwind: '$tour' },
        {
          $lookup: {
            from: 'cities',
            localField: 'tour.city',
            foreignField: '_id',
            as: 'tour.city',
          },
        },
        { $unwind: '$tour.city' },
        { $sort: { total: -1, rate: -1, price: 1 } },
        {
          $replaceRoot: { newRoot: '$tour' },
        },
        {
          $lookup: {
            from: 'profiles',
            localField: 'owner',
            foreignField: '_id',
            as: 'owner',
          },
        },
        {
          $unwind: '$owner',
        },
        { $limit: 8 },
      ],
    );
  } catch (error) {
    console.log(error);
    tourBooked = [];
  }

  return res.status(200).json({
    success: true,
    data: {
      tours: tourBooked,
    },
  });
};

const getSimilarTours = async (req, res) => {
  const { tourId } = req.params;

  let tours = [];

  let tourDetail = null;
  try {
    tourDetail = await Tour.findById(tourId);
  } catch (error) {
    console.log(error);
    tourDetail = null;
  }

  if (!tourDetail) {
    return res.status(200).json({
      success: true,
      data: {
        tours,
      },
    });
  }

  try {
    tours = await Tour.find(
      {
        city: tourDetail.city, _id: { $not: { $eq: tourDetail._id } },
      },
    )
      .populate('city').populate('owner')
      .sort({ rate: -1, price: 1 })
      .limit(4);
  } catch (error) {
    console.log(error);
    tours = [];
  }

  return res.status(200).json({
    success: true,
    data: {
      tours,
    },
  });
};

const getTour = async (req, res) => {
  const errors = {};
  const { tourId } = req.params;

  let tour = null;
  try {
    tour = await Tour.findById(tourId).populate('city')
      .populate('itineraries.location')
      .populate('owner');
  } catch (error) {
    console.log(error);
    tour = null;
  }

  if (!tour) {
    errors.error = 'Can\'t get tour item. Please try again later';
    return res.status(500).json(
      {
        success: false,
        errors,
      },
    );
  }

  return res.status(200).json({
    success: true,
    data: {
      tour,
    },
  });
};

const createTour = async (req, res) => {
  const { errors, isValid } = validateCreateTourInput({ ...req.body, images: req.files });
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
    console.log(checkCity);
    checkCity = false;
  }

  if (!checkCity) {
    errors.city = 'City is invalid';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  const userID = req.user.profile;
  let check = false;
  try {
    check = await checkEmailPayPalExist(userID);
  } catch (error) {
    console.log(error);
    check = false;
  }

  if (!check) {
    errors.error = 'This user don\'t have email paypal. Please update them.';
    return res.status(400).json(
      {
        success: false,
        errors,
      },
    );
  }

  const {
    duration,
    tour_type,
    group_size,
    price,
    language_tour,
    description,
    itineraries,
    city,
    name,
  } = req.body;

  let { departure_day } = req.body;
  const arrDate = departure_day.split('/');

  departure_day = moment(`${arrDate[0]}/${arrDate[1]}/${arrDate[2]}`, 'DD/MM/YYYY').format();

  const images = req.files.map(file => file.path);

  const newTour = new Tour({
    duration,
    tour_type,
    group_size,
    price,
    language_tour,
    description,
    itineraries,
    images,
    city,
    departure_day,
    name,
    available: group_size,
    owner: req.user.profile,
  });

  let tourCreated = null;
  try {
    tourCreated = await newTour.save();
  } catch (error) {
    console.log(error);
    errors.error = 'Can\'t create new tour. Please try again later';
    return res.status(500).json(
      {
        success: false,
        errors,
      },
    );
  }

  if (!tourCreated) {
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
      tour: tourCreated,
    },
  });
};

const updateTour = async (req, res) => {
  const { errors, isValid } = validateUpdateTourInput({ ...req.body, images: req.files });
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
      console.log(checkCity);
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

  const { tourId } = req.params;

  const data = {
    ...req.body,
  };

  if (data.departure_day) {
    const arrDate = data.departure_day.split('/');
    data.departure_day = moment(`${arrDate[0]}/${arrDate[1]}/${arrDate[2]}`, 'DD/MM/YYYY').format();
  }

  const images = req.files && req.files.map(file => file.path);

  if (images && images.length > 0) {
    data.images = images;
  }

  let tourUpdated = null;
  try {
    tourUpdated = await Tour.findByIdAndUpdate(tourId, data);
  } catch (error) {
    console.log(error);
    tourUpdated = null;
  }

  if (!tourUpdated) {
    errors.error = 'Can\'t update tour. Please try again later';
    return res.status(400).json(
      {
        success: false,
        errors,
      },
    );
  }

  let tour = null;
  try {
    tour = await Tour.findById(tourId);
  } catch (error) {
    console.log(error);
    tour = null;
  }

  if (!tour) {
    errors.error = 'Can\'t update tour. Please try again later';
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
      tourUpdated: tour,
    },
  });
};

const deleteTour = async (req, res) => {
  const errors = {};
  const { tourId } = req.params;

  let tourDeleted = null;
  try {
    tourDeleted = await Tour.findByIdAndDelete(tourId);
  } catch (error) {
    console.log(error);
    errors.error = 'Can\'t delete tour. Please try again later';
    return res.status(500).json(
      {
        success: false,
        errors,
      },
    );
  }

  if (!tourDeleted) {
    errors.error = 'Can\'t delete tour. Please try again later';
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
      tourDeleted,
    },
  });
};

const addToFavorite = async (req, res) => {
  const errors = {};
  const { tourId } = req.params;

  let tour = null;
  try {
    tour = await Tour.findById(tourId);
  } catch (error) {
    console.log(error);
    tour = null;
  }

  if (!tour) {
    errors.error = 'Tour not found!';
    return res.status(500).json({
      success: false,
      errors,
    });
  }

  let favorite = null;
  try {
    favorite = await Favorite.findOne({
      type: 'tour',
      tour: tourId,
    });
  } catch (error) {
    console.log(error);
    favorite = null;
  }

  if (!favorite) {
    const data = {
      type: 'tour',
      favorite_person: req.user.profile,
      tour: tourId,
    };

    const newTourFavorite = new Favorite(data);

    let tourFavoriteCreated = null;
    try {
      tourFavoriteCreated = await newTourFavorite.save(data);
    } catch (error) {
      console.log(error);
      tourFavoriteCreated = null;
    }

    if (!tourFavoriteCreated) {
      errors.error = 'Can\'t not create favorite for tour!';
      return res.status(400).json({
        success: false,
        errors,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        tourFavoriteCreated,
      },
    });
  }

  let tourFavoriteDeleted = null;
  try {
    tourFavoriteDeleted = await Favorite.findOneAndDelete({
      type: 'tour',
      tour: tourId,
    });
  } catch (error) {
    console.log(error);
    tourFavoriteDeleted = null;
  }

  if (!tourFavoriteDeleted) {
    errors.error = 'Can\'t not remove favorite for tour!';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      tourFavoriteDeleted,
    },
  });
};

module.exports = {
  getAllTours,
  getAllToursOwnUser,
  getTopTours,
  getSimilarTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  addToFavorite,
};
