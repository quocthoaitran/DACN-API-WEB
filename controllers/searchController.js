const moment = require('moment');
const _ = require('lodash');
const Tour = require('../models/Tour');
const Location = require('../models/Location');

const Hotel = require('../models/Hotel');
const Flight = require('../models/Flight');
const BookingItem = require('../models/BookingItem');

const checkItemExist = require('../helpers/checkItemExist');

const searchTour = async (req, res) => {
  if (typeof req.body.location === 'string') {
    const obj = JSON.parse(req.body.location);
    req.body.location = obj;
    req.body.prices = [+req.body.prices[0], +req.body.prices[1]];
  }
  const page = +req.query.page || 1;
  const page_size = 10;

  const skip = page_size * (page - 1);
  const limit = page_size;

  const { location, dates, prices } = req.body;
  const { coordinates } = location;
  let [date_start, date_end] = dates;
  let [price_start, price_end] = prices;

  if (!date_start && !date_end) {
    date_start = moment().format('DD/MM/YYYY');
  }

  if (!price_start && !price_end) {
    price_start = 0;
  }

  const arrDateStart = date_start.split('/');
  date_start = moment(`${arrDateStart[0]}/${arrDateStart[1]}/${arrDateStart[2]}`, 'DD/MM/YYYY').format();

  const arrDateEnd = date_end.split('/');
  date_end = moment(`${arrDateEnd[0]}/${arrDateEnd[1]}/${arrDateEnd[2]}`, 'DD/MM/YYYY').format();

  let locations = null;
  try {
    locations = await Location.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates },
          distanceField: 'distance',
          maxDistance: 10000,
          spherical: true,
        },
      },
    ]);
  } catch (error) {
    console.log(error);
    locations = [];
  }

  locations = locations.map(locationItem => locationItem._id);

  let tours = null;
  try {
    tours = await Tour.aggregate([
      {
        $project: {
          itineraries: {
            $filter: {
              input: '$itineraries',
              as: 'itinerary',
              cond: {
                $in: ['$$itinerary.location', locations],
              },
            },
          },
          name: 1,
          duration: 1,
          tour_type: 1,
          group_size: 1,
          price: 1,
          language_tour: 1,
          description: 1,
          images: 1,
          rate: 1,
          departure_day: 1,
          city: 1,
          available: 1,
          owner: 1,
          num_review: 1,
        },
      },
      {
        $match: {
          $and: [
            {
              price: {
                $gte: price_start,
                $lte: price_end,
              },
            },
            {
              departure_day: {
                $gte: new Date(date_start),
                $lte: new Date(date_end),
              },
            },
          ],
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
      {
        $unwind: '$city',
      },
      {
        $lookup:
          {
            from: 'profiles',
            localField: 'owner',
            foreignField: '_id',
            as: 'owner',
          },
      },
      {
        $unwind: '$owner',
      },
      { $sort: { rate: -1, price: 1 } },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);
  } catch (error) {
    console.log(error);
    tours = [];
  }

  let total_tours = null;
  try {
    total_tours = await Tour.aggregate([
      {
        $project: {
          itineraries: {
            $filter: {
              input: '$itineraries',
              as: 'itinerary',
              cond: {
                $in: ['$$itinerary.location', locations],
              },
            },
          },
          name: 1,
          duration: 1,
          tour_type: 1,
          group_size: 1,
          price: 1,
          language_tour: 1,
          description: 1,
          images: 1,
          rate: 1,
          departure_day: 1,
          city: 1,
          available: 1,
          owner: 1,
        },
      },
      {
        $match: {
          $and: [
            {
              price: {
                $gte: price_start,
                $lte: price_end,
              },
            },
            {
              departure_day: {
                $gte: new Date(date_start),
                $lte: new Date(date_end),
              },
            },
          ],
        },
      },
      {
        $lookup:
          {
            from: 'locations',
            localField: 'itineraries.location',
            foreignField: '_id',
            as: 'itineraries',
          },
      },
      {
        $lookup:
          {
            from: 'locations',
            localField: 'itineraries.location',
            foreignField: '_id',
            as: 'itineraries',
          },
      },
      { $sort: { rate: -1 } },
    ]);
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

const searchHotel = async (req, res) => {
  const page = +req.query.page || 1;
  const page_size = 12;

  const {
    location,
    prices,
    dates,
    guests,
  } = req.body;

  const { coordinates } = location;
  const [price_start, price_end] = prices;
  const [date_checkin, date_checkout] = dates;
  const { rooms } = guests;

  let hotels = [];
  try {
    hotels = await Hotel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates },
          distanceField: 'distance',
          maxDistance: 5000,
          spherical: true,
        },
      },
      {
        $lookup: {
          from: 'rooms',
          localField: 'rooms',
          foreignField: '_id',
          as: 'rooms',
        },
      },
      {
        $project: {
          rooms: {
            $filter: {
              input: '$rooms',
              as: 'room',
              cond: {
                $and: [
                  {
                    $and: [
                      { $gte: ['$$room.price', price_start] },
                      { $lte: ['$$room.price', price_end] },
                    ],
                  },
                  {
                    $eq: ['$$room.status', 'AVAILABLE'],
                  },
                ],
              },
            },
          },
          num_rooms: {
            $size: '$rooms',
          },
          _id: 1,
          name: 1,
          description: 1,
          rate: 1,
          address: 1,
          facilities: 1,
          images: 1,
          rules: 1,
          location: 1,
          city: 1,
          num_review: 1,
          owner: 1,
        },
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
      {
        $match: {
          num_rooms: {
            $gte: rooms,
          },
        },
      },
      { $sort: { rate: -1 } },
    ]);
  } catch (error) {
    console.log(error);
    hotels = [];
  }

  const hotelResult = [];

  for (let j = 0; j < hotels.length; j += 1) {
    const hotel = hotels[j];
    const roomBooked = [];
    for (let i = 0; i < hotel.rooms.length; i += 1) {
      const room = hotel.rooms[i];
      let check = false;
      try {
        // eslint-disable-next-line no-await-in-loop
        check = await checkItemExist('room', { room: { ID: room._id, checkin: date_checkin, checkout: date_checkout } });
      } catch (error) {
        console.log(error);
        check = false;
      }

      if (!check) {
        roomBooked.push(room);
      }
    }

    if (roomBooked.length === 0 || (hotel.rooms.length - roomBooked.length) >= rooms) {
      hotelResult.push(hotel);
    }
  }

  const total_hotels = [...hotelResult];

  const total_page = Math.ceil(total_hotels.length / page_size);

  if (hotels.length > 0 && total_page >= page) {
    hotels = _.chunk(hotels, page_size)[page - 1];
  }

  return res.status(200).json({
    success: true,
    data: {
      hotels: hotelResult,
    },
    meta: {
      page,
      page_size: hotelResult.length,
      total_page,
      total_size: total_hotels.length,
    },
  });
};

const searchFlight = async (req, res) => {
  const { cities, dates } = req.body;
  const [start_location, end_location] = cities;
  let [date_start] = dates;

  const page = +req.query.page || 1;
  const page_size = 10;

  const skip = page_size * (page - 1);
  const limit = page_size;

  let flights = null;

  const arrDateStart = date_start.split('/');
  date_start = moment(`${arrDateStart[0]}/${arrDateStart[1]}/${arrDateStart[2]}`, 'DD/MM/YYYY').format();

  const isAfter = moment(`${arrDateStart[0]}/${arrDateStart[1]}/${arrDateStart[2]}`, 'DD/MM/YYYY').isAfter(new Date());

  if (!isAfter) {
    return res.status(200).json({
      success: true,
      data: {
        flights: [],
      },
      meta: {
        page: 1,
        page_size: 0,
        total_page: 0,
        total_size: 0,
      },
    });
  }

  let flightBookedIds = [];
  try {
    flightBookedIds = await BookingItem.find({ type: 'flight', is_checkout: true }).select('flight');
  } catch (error) {
    console.log(error);
    flightBookedIds = [];
  }

  flightBookedIds = flightBookedIds.map(flight => flight.flight);

  try {
    flights = await Flight.aggregate([
      {
        $match: {
          start_location: { $eq: start_location },
          end_location: { $eq: end_location },
          date_start: { $eq: new Date(date_start) },
          _id: {
            $nin: flightBookedIds,
          },
        },
      },
      {
        $lookup: {
          from: 'cities',
          localField: 'start_location',
          foreignField: 'acronym',
          as: 'start_location',
        },
      },
      {
        $lookup: {
          from: 'cities',
          localField: 'end_location',
          foreignField: 'acronym',
          as: 'end_location',
        },
      },
      {
        $lookup: {
          from: 'providers',
          localField: 'provider',
          foreignField: 'acronym',
          as: 'provider',
        },
      },
      { $unwind: '$start_location' },
      { $unwind: '$end_location' },
      { $unwind: '$provider' },
      {
        $project: {
          _id: 1,
          date_end: 1,
          date_start: 1,
          end_location: '$end_location',
          price: 1,
          provider: '$provider',
          start_location: '$start_location',
          time_end: 1,
          time_start: 1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);
  } catch (error) {
    console.log(error);
    flights = [];
  }

  let total_flights = [];

  try {
    total_flights = await Flight.aggregate([
      {
        $match: {
          start_location: { $eq: start_location },
          end_location: { $eq: end_location },
          date_start: { $eq: new Date(date_start) },
        },
      },
      {
        $lookup: {
          from: 'cities',
          localField: 'start_location',
          foreignField: 'acronym',
          as: 'start_location',
        },
      },
      {
        $lookup: {
          from: 'cities',
          localField: 'end_location',
          foreignField: 'acronym',
          as: 'end_location',
        },
      },
      {
        $lookup: {
          from: 'providers',
          localField: 'provider',
          foreignField: 'acronym',
          as: 'provider',
        },
      },
      { $unwind: '$start_location' },
      { $unwind: '$end_location' },
      { $unwind: '$provider' },
      {
        $project: {
          _id: 1,
          date_end: 1,
          date_start: 1,
          end_location: '$end_location',
          price: 1,
          provider: '$provider',
          start_location: '$start_location',
          time_end: 1,
          time_start: 1,
        },
      },
    ]);
  } catch (error) {
    console.log(error);
    total_flights = [];
  }

  const total_page = Math.ceil(total_flights.length / page_size);

  return res.status(200).json({
    success: true,
    data: {
      flights,
    },
    meta: {
      page,
      page_size: flights.length,
      total_page,
      total_size: total_flights.length,
    },
  });
};

module.exports = {
  searchTour,
  searchHotel,
  searchFlight,
};
