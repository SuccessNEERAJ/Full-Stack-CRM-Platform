// config/passport.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Only configure Google Strategy if client ID and secret are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('Configuring Google OAuth strategy');
  
  const googleOptions = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `http://localhost:${process.env.PORT || 5000}/api/auth/google/callback`,
    scope: ['profile', 'email']
  };
  
  const googleCallback = async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        // Update last login time for existing user
        user.lastLogin = new Date();
        await user.save();
        return done(null, user);
      }

      // Create new user if not found
      user = await User.create({
        googleId: profile.id,
        displayName: profile.displayName,
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName,
        email: profile.emails[0].value,
        profileImage: profile.photos[0].value
      });

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  };
  
  passport.use(new GoogleStrategy(googleOptions, googleCallback));
} else {
  console.warn('Google OAuth credentials missing. Google authentication will not be available.');
}

export default passport;
