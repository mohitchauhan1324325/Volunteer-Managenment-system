const { dbClient } = require('../database/dbClient');

// Event CRUD

exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, location, requiredSkills, maxVolunteers } = req.body;

    if (!title || !description || !date || !location || !maxVolunteers) {
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    const newEvent = await dbClient.events.create({
      title,
      description,
      date,
      location,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      maxVolunteers: Number(maxVolunteers),
      currentVolunteers: 0,
      status: 'open'
    });

    res.status(201).json({
      message: 'Event created successfully.',
      event: newEvent
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error creating event.' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, location, requiredSkills, maxVolunteers, status } = req.body;

    const updated = await dbClient.events.findByIdAndUpdate(id, {
      title,
      description,
      date,
      location,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      maxVolunteers: maxVolunteers !== undefined ? Number(maxVolunteers) : undefined,
      status
    });

    if (!updated) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    res.status(200).json({
      message: 'Event updated successfully.',
      event: updated
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error updating event details.' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await dbClient.events.deleteOne({ _id: id });
    if (deleted.deletedCount === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Clean up registrations associated with this event
    await dbClient.registrations.deleteOne({ eventId: id });

    res.status(200).json({ message: 'Event and associated registrations deleted successfully.' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error deleting event.' });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const events = await dbClient.events.find();
    res.status(200).json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error fetching events list.' });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await dbClient.events.findById(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // If Admin request, embed registration lists
    let registrationsList = [];
    if (req.user && req.user.role === 'admin') {
      const regs = await dbClient.registrations.find({ eventId: id });
      for (const reg of regs) {
        const user = await dbClient.users.findById(reg.volunteerId);
        if (user) {
          registrationsList.push({
            _id: reg._id.toString(),
            status: reg.status,
            registrationDate: reg.registrationDate,
            hoursCredited: reg.hoursCredited,
            volunteer: {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              phone: user.phone,
              skills: user.skills
            }
          });
        }
      }
    }

    res.status(200).json({
      ...event,
      registrations: registrationsList
    });
  } catch (error) {
    console.error('Get event details error:', error);
    res.status(500).json({ message: 'Server error fetching event details.' });
  }
};

// Volunteer Registration Workflows

exports.applyToEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const volunteerId = req.user.id;

    // Check if volunteer is verified
    const user = await dbClient.users.findById(volunteerId);
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Your account is pending verification by an Administrator. You cannot apply for events yet.' });
    }

    const event = await dbClient.events.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    if (event.status !== 'open') {
      return res.status(400).json({ message: 'This event is no longer open for registration.' });
    }

    // Check existing registration
    const existing = await dbClient.registrations.findOne({ eventId, volunteerId });
    if (existing) {
      return res.status(400).json({ message: 'You have already applied for this event.' });
    }

    // Check capacity
    const activeRegs = await dbClient.registrations.find({ eventId, status: 'approved' });
    if (activeRegs.length >= event.maxVolunteers) {
      return res.status(400).json({ message: 'This event has reached its maximum volunteer capacity.' });
    }

    const newReg = await dbClient.registrations.create({
      eventId,
      volunteerId,
      status: 'pending',
      hoursCredited: 0
    });

    res.status(201).json({
      message: 'Application submitted successfully. Pending Admin review.',
      registration: newReg
    });
  } catch (error) {
    console.error('Apply to event error:', error);
    res.status(500).json({ message: 'Server error submitting application.' });
  }
};

exports.getMyRegistrations = async (req, res) => {
  try {
    const volunteerId = req.user.id;
    const regs = await dbClient.registrations.find({ volunteerId });
    
    const detailedRegs = [];
    for (const reg of regs) {
      const event = await dbClient.events.findById(reg.eventId);
      if (event) {
        detailedRegs.push({
          _id: reg._id.toString(),
          status: reg.status,
          registrationDate: reg.registrationDate,
          hoursCredited: reg.hoursCredited,
          event: {
            id: event._id.toString(),
            title: event.title,
            description: event.description,
            date: event.date,
            location: event.location,
            status: event.status
          }
        });
      }
    }

    res.status(200).json(detailedRegs);
  } catch (error) {
    console.error('Get my registrations error:', error);
    res.status(500).json({ message: 'Server error fetching your registrations.' });
  }
};

exports.getRegistrations = async (req, res) => {
  try {
    const regs = await dbClient.registrations.find();
    const detailedRegs = [];

    for (const reg of regs) {
      const event = await dbClient.events.findById(reg.eventId);
      const user = await dbClient.users.findById(reg.volunteerId);
      
      if (event && user) {
        detailedRegs.push({
          _id: reg._id.toString(),
          status: reg.status,
          registrationDate: reg.registrationDate,
          hoursCredited: reg.hoursCredited,
          event: {
            id: event._id.toString(),
            title: event.title,
            date: event.date,
            location: event.location
          },
          volunteer: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone
          }
        });
      }
    }

    res.status(200).json(detailedRegs);
  } catch (error) {
    console.error('Get all registrations error:', error);
    res.status(500).json({ message: 'Server error retrieving registration applications.' });
  }
};

exports.updateRegistrationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, hoursCredited } = req.body; // status can be approved, rejected, attended

    if (!['approved', 'rejected', 'attended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid registration status option.' });
    }

    const reg = await dbClient.registrations.findById(id);
    if (!reg) {
      return res.status(404).json({ message: 'Registration record not found.' });
    }

    const prevStatus = reg.status;
    const hours = hoursCredited ? Number(hoursCredited) : 0;

    const updated = await dbClient.registrations.findByIdAndUpdate(id, {
      status,
      hoursCredited: status === 'attended' ? hours : 0
    });

    const event = await dbClient.events.findById(reg.eventId);
    const volunteer = await dbClient.users.findById(reg.volunteerId);

    // Adjust event counter if approving or removing approval
    if (event) {
      const currentApproved = await dbClient.registrations.find({ eventId: reg.eventId, status: 'approved' });
      await dbClient.events.findByIdAndUpdate(reg.eventId, {
        currentVolunteers: currentApproved.length
      });
    }

    // Add hours to volunteer if marking attended
    if (volunteer && status === 'attended' && prevStatus !== 'attended') {
      const currentHours = volunteer.hoursVolunteered || 0;
      await dbClient.users.findByIdAndUpdate(reg.volunteerId, {
        hoursVolunteered: currentHours + hours
      });
    }

    res.status(200).json({
      message: `Registration status successfully updated to ${status}.`,
      registration: updated
    });
  } catch (error) {
    console.error('Update registration status error:', error);
    res.status(500).json({ message: 'Server error updating registration status.' });
  }
};
