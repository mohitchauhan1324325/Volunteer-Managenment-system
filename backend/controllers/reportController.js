const { dbClient } = require('../database/dbClient');

exports.getStats = async (req, res) => {
  try {
    const volunteers = await dbClient.users.find({ role: 'volunteer' });
    const events = await dbClient.events.find();
    const registrations = await dbClient.registrations.find();

    const totalVolunteers = volunteers.length;
    const verifiedVolunteers = volunteers.filter(v => v.isVerified).length;
    const pendingVolunteers = totalVolunteers - verifiedVolunteers;

    const totalEvents = events.length;
    const activeEvents = events.filter(e => e.status === 'open').length;
    const completedEvents = events.filter(e => e.status === 'completed').length;

    const totalHours = volunteers.reduce((sum, v) => sum + (v.hoursVolunteered || 0), 0);

    // Skill distribution
    const skillCounts = {};
    volunteers.forEach(v => {
      if (Array.isArray(v.skills)) {
        v.skills.forEach(skill => {
          const cleaned = skill.trim();
          if (cleaned) {
            skillCounts[cleaned] = (skillCounts[cleaned] || 0) + 1;
          }
        });
      }
    });

    res.status(200).json({
      metrics: {
        totalVolunteers,
        verifiedVolunteers,
        pendingVolunteers,
        totalEvents,
        activeEvents,
        completedEvents,
        totalHours
      },
      skillDistribution: skillCounts,
      recentRegistrations: registrations.slice(-5) // Send last 5 applications
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Server error generating dashboard report.' });
  }
};

exports.exportVolunteersCSV = async (req, res) => {
  try {
    const volunteers = await dbClient.users.find({ role: 'volunteer' });
    
    // Construct CSV file string manually
    const headers = ['Name', 'Email', 'Phone', 'Verified Status', 'Skills', 'Availability', 'Hours Volunteered', 'Created At'];
    const rows = volunteers.map(v => {
      const escapedName = `"${(v.name || '').replace(/"/g, '""')}"`;
      const escapedEmail = `"${(v.email || '').replace(/"/g, '""')}"`;
      const escapedPhone = `"${(v.phone || '').replace(/"/g, '""')}"`;
      const verifiedText = v.isVerified ? 'Verified' : 'Pending';
      const escapedSkills = `"${(v.skills || []).join(', ').replace(/"/g, '""')}"`;
      const escapedAvailability = `"${(v.availability || '').replace(/"/g, '""')}"`;
      const hours = v.hoursVolunteered || 0;
      const dateStr = v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '';

      return [
        escapedName,
        escapedEmail,
        escapedPhone,
        verifiedText,
        escapedSkills,
        escapedAvailability,
        hours,
        dateStr
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="volunteers-report.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export volunteers CSV error:', error);
    res.status(500).json({ message: 'Server error generating CSV report.' });
  }
};
