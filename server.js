require('dotenv').config({ path: '.env' });
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const morgan = require('morgan');
const cors = require('cors');
const paypal = require('paypal-rest-sdk');

const Passport = require('./middlewares/passport');
const PassportGoogle = require('./middlewares/passport-google');

const AuthRoute = require('./routes/auth');
const CityRoute = require('./routes/city');
const TourRoute = require('./routes/tour');
const LocationRoute = require('./routes/location');
const HotelRoute = require('./routes/hotel');
const BookingRoute = require('./routes/booking');
const FlightRoute = require('./routes/flight');
const RoomRoute = require('./routes/room');
const ReviewRoute = require('./routes/review');
const UserRoute = require('./routes/user');
const FavoriteRoute = require('./routes/favorite');
const DiscountRoute = require('./routes/discount')
const CouponCodeRoute = require('./routes/couponCode');

const app = express();

app.use(morgan('tiny'));

app.use(cors());

app.use('/uploads', express.static('uploads'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(passport.initialize());
Passport.passportStrategy(passport);
PassportGoogle(passport);

paypal.configure({
  mode: 'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

app.use('/auth', AuthRoute);
app.use('/tours', TourRoute);
app.use('/cities', CityRoute);
app.use('/locations', LocationRoute);
app.use('/hotels', HotelRoute);
app.use('/flights', FlightRoute);
app.use('/booking', BookingRoute);
app.use('/rooms', RoomRoute);
app.use('/reviews', ReviewRoute);
app.use('/users', UserRoute);
app.use('/favorites', FavoriteRoute);
app.use('/discounts', DiscountRoute);
app.use('/coupon-codes', CouponCodeRoute);

app.get('/', (req, res) => res.status(200).json(
  {
    message: 'It works.',
  },
));

const createLog = (req, res, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
};

app.use(createLog);

const handleLog = (error, req, res, next) => {
  return res.status(error.status || 500).json({
    success: false,
    errors: {
      error: error.message,
    },
  });
};

app.use(handleLog);

mongoose.connect(process.env.MONGO_URL,
  {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => {
    console.log('Connect mongodb successfully!');
  })
  .catch(err => console.log(err));

const port = process.env.PORT || 8001;
app.listen(port, () => {
  console.log(`Server is running at port ${port}`);
});
