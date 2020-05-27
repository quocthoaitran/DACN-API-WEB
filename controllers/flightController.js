const Flight = require('../models/Flight');

const getAllFlights = async (req, res) => {
  const page = +req.query.page || 1;
  const page_size = 12;

  const skip = page_size * (page - 1);
  const limit = page_size;

  let flights = [];
  try {
    flights = await Flight.find().skip(skip).limit(limit);
  } catch (error) {
    console.log(error);
    flights = [];
  }

  let total_flights = [];
  try {
    total_flights = await Flight.countDocuments();
  } catch (error) {
    console.log(error);
    total_flights = [];
  }

  const total_page = Math.ceil(total_flights / page_size);

  return res.status(200).json({
    success: false,
    data: {
      flights,
    },
    meta: {
      page,
      page_size: flights.length,
      total_page,
      total_size: total_flights,
    },
  });
};

module.exports = {
  getAllFlights,
};
