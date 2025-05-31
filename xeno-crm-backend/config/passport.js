// config/passport.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Enhanced user serialization - important for cross-domain cookies
passport.serializeUser((user, done) => {
  console.log('Serializing user:', user.email, user._id);
  // Use String form of _id to prevent ObjectId serialization issues
  done(null, user._id.toString());
});

// Enhanced deserialization with error logging
passport.deserializeUser(async (id, done) => {
  try {
    console.log('Deserializing user id:', id);
    const user = await User.findById(id);
    if (!user) {
      console.error('User not found during deserialization. ID:', id);
      return done(null, false);
    }
    console.log('User found during deserialization:', user.email);
    done(null, user);
  } catch (err) {
    console.error('Error during deserialization:', err.message);
    done(err, null);
  }
});

// Only configure Google Strategy if client ID and secret are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('Configuring Google OAuth strategy');
  
  // Determine the base URL based on environment
  const baseURL = process.env.NODE_ENV === 'production'
    ? process.env.BACKEND_URL || 'https://full-stack-crm-platform.onrender.com'
    : `http://localhost:${process.env.PORT || 5000}`;
    
  const googleOptions = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${baseURL}/api/auth/google/callback`,
    scope: ['profile', 'email']
  };
  
  console.log(`OAuth callback URL: ${googleOptions.callbackURL}`);
  
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
