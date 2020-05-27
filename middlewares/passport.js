const JWTStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const passport = require('passport');

const Account = require('../models/Account');

const opts = {};

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_SECRET_KEY;

const passportStrategy = (passportInit) => {
  passportInit.use(new JWTStrategy(opts, async (jwtPayload, done) => {
    let account = null;
    try {
      account = await Account.findOne({ _id: jwtPayload._id, is_exp: false });
    } catch (error) {
      console.log(error);
      return done(null, false);
    }

    if (!account) {
      return done(null, false);
    }
    return done(null, account);
  }));
};

const passportAuthenticate = (req, res, next) => passport.authenticate('jwt', {
  session: false,
}, (err, user, info) => {
  const errors = {};
  if (err) {
    console.log(err);
    errors.error = 'ANOTHORIZED_USER';
    return res.status(401).json({
      success: false,
      errors,
    });
  }
  if (!user) {
    errors.error = 'ANOTHORIZED_USER';
    return res.status(401).json({
      success: false,
      errors,
    });
  }
  req.user = user;
  next();
})(req, res, next);

module.exports = {
  passportStrategy,
  passportAuthenticate,
};
