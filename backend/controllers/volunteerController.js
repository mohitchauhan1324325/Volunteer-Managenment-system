const { dbClient } = require('../database/dbClient');

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, skills, availability } = req.body;
    
    // Volunteers can only edit their own profile
    const volunteerId = req.user.id;
    
    const updated = await dbClient.users.findByIdAndUpdate(volunteerId, {
      name,
      phone,
      bio,
      skills: Array.isArray(skills) ? skills : [],
      availability
    });

    if (!updated) {
      return res.status(404).json({ message: 'Volunteer profile not found.' });
    }

    res.status(200).json({
      message: 'Profile updated successfully.',
      user: {
        id: updated._id.toString(),
        name: updated.name,
        email: updated.email,
        role: updated.role,
        isVerified: updated.isVerified,
        hoursVolunteered: updated.hoursVolunteered,
        skills: updated.skills,
        availability: updated.availability,
        bio: updated.bio,
        phone: updated.phone
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile details.' });
  }
};

exports.getAllVolunteers = async (req, res) => {
  try {
    const users = await dbClient.users.find({ role: 'volunteer' });
    
    // Add searching and filtering logically (since our DB client doesn't support complex regex, we do it in code)
    let filteredUsers = users;
    const { search, skill, status } = req.query;

    if (search) {
      const q = search.toLowerCase();
      filteredUsers = filteredUsers.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q)
      );
    }

    if (skill) {
      const s = skill.toLowerCase();
      filteredUsers = filteredUsers.filter(u => 
        u.skills.some(userSkill => userSkill.toLowerCase().includes(s))
      );
    }

    if (status) {
      const isVerifiedStatus = status === 'verified';
      filteredUsers = filteredUsers.filter(u => u.isVerified === isVerifiedStatus);
    }

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error('Get all volunteers error:', error);
    res.status(500).json({ message: 'Server error fetching volunteers list.' });
  }
};

exports.toggleVerify = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const updated = await dbClient.users.findByIdAndUpdate(id, {
      isVerified: !!isVerified
    });

    if (!updated) {
      return res.status(404).json({ message: 'Volunteer not found.' });
    }

    res.status(200).json({
      message: `Volunteer verification status updated to ${isVerified}.`,
      user: updated
    });
  } catch (error) {
    console.error('Toggle verify error:', error);
    res.status(500).json({ message: 'Server error updating verification status.' });
  }
};

exports.updateHours = async (req, res) => {
  try {
    const { id } = req.params;
    const { hours } = req.body;

    if (hours === undefined || isNaN(hours)) {
      return res.status(400).json({ message: 'Please provide a valid hours number.' });
    }

    const updated = await dbClient.users.findByIdAndUpdate(id, {
      hoursVolunteered: Number(hours)
    });

    if (!updated) {
      return res.status(404).json({ message: 'Volunteer not found.' });
    }

    res.status(200).json({
      message: `Successfully updated volunteer hours.`,
      user: updated
    });
  } catch (error) {
    console.error('Update hours error:', error);
    res.status(500).json({ message: 'Server error updating volunteer hours.' });
  }
};
