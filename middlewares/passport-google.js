const GoogleStrategy = require('passport-google-oauth2').Strategy;

const Account = require('../models/Account');

const opts = {};
opts.clientID = process.env.GOOGLE_CLIENT_ID;
opts.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
opts.callbackURL = `http://${process.env.HOST}/auth/google/callback`;

module.exports = (passport) => {
  passport.use(new GoogleStrategy(
    opts,
    async (accessToken, refreshToken, profile, done) => {
      const { email } = profile._json;
      let account = null;
      try {
        account = await Account.findOne({ email, type: { $ne: 'google' } });
      } catch (error) {
        console.log(error);
        done(error);
      }

      if (account) {
        done(null, false);
      }

      done(null, profile._json);
    },
  ));
};
