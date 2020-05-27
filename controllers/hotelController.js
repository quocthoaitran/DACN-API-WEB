const mongoose = require('mongoose');

const Hotel = require('../models/Hotel');
const City = require('../models/City');
const BookingItem = require('../models/BookingItem');
const Favorite = require('../models/Favorite');

const validateHotel = require('../validations/hotel');

const validateCreateHotelInput = validateHotel.createHotel;
const validateUpdateHotelInput = validateHotel.updateHotel;

const checkEmailPayPalExist = require('../helpers/checkEmailPayPalExist');

const getAllHotels = async (req, res) => {
  const page = +req.query.page || 1;
  const page_size = 12;

  const skip = page_size * (page - 1);
  const limit = page_size;

  let hotels = [];
  try {
    hotels = await Hotel.find()
      .populate('city')
      .populate('rooms')
      .populate('owner')
      .skip(skip)
      .limit(limit);
  } catch (error) {
    console.log(error);
    hotels = [];
  }

  let total_hotels = [];
  try {
    total_hotels = await Hotel.countDocuments();
  } catch (error) {
    console.log(error);
    total_hotels = [];
  }

  const total_page = Math.ceil(total_hotels / page_size);

  return res.status(200).json({
    success: true,
    data: {
      hotels,
    },
    meta: {
      page,
      page_size: hotels.length,
      total_page,
      total_size: total_hotels,
    },
  });
};

const getAllHotelsOwnUser = async (req, res) => {
  const page = +req.query.page || 1;
  const page_size = 12;

  const skip = page_size * (page - 1);
  const limit = page_size;

  const owner = req.user.profile;

  let hotels = [];
  try {
    hotels = await Hotel.find({
      owner,
    })
      .populate('rooms')
      .populate('city')
      .populate('owner')
      .skip(skip)
      .limit(limit);
  } catch (error) {
    console.log(error);
    hotels = [];
  }

  let total_hotels = [];
  try {
    total_hotels = await Hotel.countDocuments();
  } catch (error) {
    console.log(error);
    total_hotels = [];
  }

  const total_page = Math.ceil(total_hotels / page_size);


  return res.status(200).json({
    success: true,
    data: {
      hotels,
    },
    meta: {
      page,
      page_size: hotels.length,
      total_page,
      total_size: total_hotels,
    },
  });
};

const getTopHotels = async (req, res) => {
  let hotelBooked = null;
  try {
    hotelBooked = await BookingItem.aggregate(
      [{
        $group: {
          _id: '$room',
          room: {
            $first: '$room',
          },
          total: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $lookup: {
          from: 'rooms',
          localField: 'room',
          foreignField: '_id',
          as: 'room',
        },
      },
      {
        $unwind: '$room',
      },
      {
        $project: {
          hotel: '$room.hotel',
          total: 1,
        },
      },
      {
        $group: {
          _id: '$hotel',
          hotel: {
            $first: '$hotel',
          },
          total: {
            $sum: '$total',
          },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $lookup: {
          from: 'hotels',
          localField: 'hotel',
          foreignField: '_id',
          as: 'hotel',
        },
      },
      {
        $unwind: '$hotel',
      },
      {
        $lookup: {
          from: 'rooms',
          localField: 'hotel.rooms',
          foreignField: '_id',
          as: 'hotel.rooms',
        },
      },
      {
        $lookup: {
          from: 'cities',
          localField: 'hotel.city',
          foreignField: '_id',
          as: 'hotel.city',
        },
      },
      {
        $unwind: '$hotel.city',
      },
      {
        $lookup: {
          from: 'profiles',
          localField: 'hotel.owner',
          foreignField: '_id',
          as: 'hotel.owner',
        },
      },
      {
        $unwind: '$hotel.owner',
      },
      {
        $replaceRoot: {
          newRoot: '$hotel',
        },
      },
      {
        $sort: {
          total: -1,
          rate: -1,
        },
      },
      {
        $limit: 8,
      },
      ],
    );
  } catch (error) {
    console.log(error);
    hotelBooked = [];
  }

  return res.status(200).json({
    success: true,
    data: {
      hotels: hotelBooked,
    },
  });
};

const getNearByHotel = async (req, res) => {
  const { hotelId } = req.params;

  let hotels = [];

  let hotelDetail = null;
  try {
    hotelDetail = await Hotel.findById(hotelId);
  } catch (error) {
    console.log(error);
    hotelDetail = null;
  }

  if (!hotelDetail) {
    return res.status(200).json({
      success: true,
      data: {
        hotels,
      },
    });
  }

  try {
    hotels = await Hotel.aggregate([
      {
        $geoNear: {
          near: hotelDetail.location,
          distanceField: 'distance',
          maxDistance: 10000,
          spherical: true,
        },
      },
      {
        $match: {
          _id: {
            $not: {
              $eq: mongoose.mongo.ObjectId(hotelDetail._id),
            },
          },
        },
      },
      {
        $lookup:
          {
            from: 'rooms',
            localField: 'rooms',
            foreignField: '_id',
            as: 'rooms',
          },
      },
      {
        $lookup:
          {
            from: 'cities',
            localField: 'city',
            foreignField: '_id',
            as: 'city',
          },
      },
      { $unwind: '$city' },
      {
        $lookup:
          {
            from: 'profiles',
            localField: 'owner',
            foreignField: '_id',
            as: 'owner',
          },
      },
      { $unwind: '$owner' },
      {
        $sort: {
          rate: -1,
          price: 1,
        },
      },
      {
        $limit: 4,
      },
    ]);
  } catch (error) {
    console.log(error);
    hotels = [];
  }

  return res.status(200).json({
    success: true,
    data: {
      hotels,
    },
  });
};

const getHotel = async (req, res) => {
  const errors = {};

  const {
    hotelId,
  } = req.params;

  let hotel = null;
  try {
    hotel = await Hotel.findById(hotelId)
      .populate('city')
      .populate('rooms')
      .populate('owner');
  } catch (error) {
    console.log(error);
    errors.error = 'Can\'t get hotel item. Please try again later';
    return res.status(500).json({
      success: false,
      errors,
    });
  }

  if (!hotel) {
    errors.error = 'Can\'t get hotel item. Please try again later';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      hotel,
    },
  });
};

const createHotel = async (req, res) => {
  const {
    errors,
    isValid,
  } = validateCreateHotelInput({
    ...req.body,
    images: req.files,
  });

  if (!isValid) {
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
    return res.status(400).json(
      {
        success: false,
        errors,
      },
    );
  }

  const images = req.files && req.files.map(file => file.path);
  const data = {
    ...req.body,
    images,
    owner: req.user.profile,
    room: [],
    rate: 0,
  };
  const newHotel = new Hotel(data);

  let hotelCreated = null;
  try {
    hotelCreated = await newHotel.save();
  } catch (error) {
    console.log(error);
    errors.error = 'Can\'t create new hotel. Please try again later';
    return res.status(500).json({
      success: false,
      errors,
    });
  }

  if (!hotelCreated) {
    errors.error = 'Can\'t create new hotel. Please try again later';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      hotelCreated,
    },
  });
};

const updateHotel = async (req, res) => {
  const {
    errors,
    isValid,
  } = validateUpdateHotelInput({
    ...req.body,
    images: req.files,
  });

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
      return res.status(400).json(
        {
          success: false,
          errors,
        },
      );
    }
  }

  const { hotelId } = req.params;

  const data = {
    ...req.body,
  };

  const images = req.files && req.files.map(file => file.path);

  if (images && images.length > 0) {
    data.images = images;
  }

  let hotelUpdated = null;
  try {
    hotelUpdated = await Hotel.findByIdAndUpdate(hotelId, data);
  } catch (error) {
    console.log(error);
    hotelUpdated = null;
  }

  if (!hotelUpdated) {
    errors.error = 'Can\'t update hotel. Please try again later';
    return res.status(500).json({
      success: false,
      errors,
    });
  }

  let hotel = null;
  try {
    hotel = await Hotel.findById(hotelId);
  } catch (error) {
    console.log(error);
    errors.error = 'Can\'t update hotel. Please try again later';
    return res.status(500).json({
      success: false,
      errors,
    });
  }

  if (!hotel) {
    errors.error = 'Can\'t update hotel. Please try again later';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      hotelUpdated,
    },
  });
};

const deleteHotel = async (req, res) => {
  const errors = {};
  const {
    hotelId,
  } = req.params;

  let hotelDeleted = null;
  try {
    hotelDeleted = await Hotel.findByIdAndDelete(hotelId);
  } catch (error) {
    console.log(error);
    errors.error = 'Can\'t delete hotel. Please try again later';
    return res.status(500).json({
      success: false,
      errors,
    });
  }

  if (!hotelDeleted) {
    errors.error = 'Can\'t delete hotel. Please try again later';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      hotelDeleted,
    },
  });
};

const addToFavorite = async (req, res) => {
  const errors = {};
  const { hotelId } = req.params;

  let hotel = null;
  try {
    hotel = await Hotel.findById(hotelId);
  } catch (error) {
    console.log(error);
    hotel = null;
  }

  if (!hotel) {
    errors.error = 'Hotel not found!';
    return res.status(500).json({
      success: false,
      errors,
    });
  }

  let favorite = null;
  try {
    favorite = await Favorite.findOne({
      type: 'hotel',
      hotel: hotelId,
    });
  } catch (error) {
    console.log(error);
    favorite = null;
  }

  if (!favorite) {
    const data = {
      type: 'hotel',
      favorite_person: req.user.profile,
      hotel: hotelId,
    };

    const newHotelFavorite = new Favorite(data);

    let hotelFavoriteCreated = null;
    try {
      hotelFavoriteCreated = await newHotelFavorite.save(data);
    } catch (error) {
      console.log(error);
      hotelFavoriteCreated = null;
    }

    if (!hotelFavoriteCreated) {
      errors.error = 'Can\'t not create favorite for hotel!';
      return res.status(400).json({
        success: false,
        errors,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        hotelFavoriteCreated,
      },
    });
  }

  let hotelFavoriteDeleted = null;
  try {
    hotelFavoriteDeleted = await Favorite.findOneAndDelete({
      type: 'hotel',
      hotel: hotelId,
    });
  } catch (error) {
    console.log(error);
    hotelFavoriteDeleted = null;
  }

  if (!hotelFavoriteDeleted) {
    errors.error = 'Can\'t not remove favorite for hotel!';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      hotelFavoriteDeleted,
    },
  });
};

module.exports = {
  getAllHotels,
  getAllHotelsOwnUser,
  getTopHotels,
  getNearByHotel,
  getHotel,
  createHotel,
  updateHotel,
  deleteHotel,
  addToFavorite,
};
