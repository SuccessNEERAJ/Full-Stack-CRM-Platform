// controllers/userController.js
import User from '../models/User.js';

/**
 * Get user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      _id: user._id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      displayName: user.displayName,
      email: user.email,
      phone: user.phone || '',
      company: user.company || '',
      position: user.position || '',
      profileImage: user.profileImage,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const userId = req.user._id;
    const { firstName, lastName, phone, company, position } = req.body;
    
    // Find and update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        phone,
        company,
        position,
        // Update displayName based on first and last name
        displayName: `${firstName} ${lastName}`.trim()
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      _id: updatedUser._id,
      firstName: updatedUser.firstName || '',
      lastName: updatedUser.lastName || '',
      displayName: updatedUser.displayName,
      email: updatedUser.email,
      phone: updatedUser.phone || '',
      company: updatedUser.company || '',
      position: updatedUser.position || '',
      profileImage: updatedUser.profileImage,
      createdAt: updatedUser.createdAt
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
