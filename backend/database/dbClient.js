const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Mongoose Models
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['volunteer', 'admin'], default: 'volunteer' },
  skills: [{ type: String }],
  availability: { type: String, default: 'Flexible' },
  bio: { type: String, default: '' },
  phone: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  hoursVolunteered: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  location: { type: String, required: true },
  requiredSkills: [{ type: String }],
  maxVolunteers: { type: Number, required: true },
  currentVolunteers: { type: Number, default: 0 },
  status: { type: String, enum: ['open', 'completed', 'cancelled'], default: 'open' },
  createdAt: { type: Date, default: Date.now }
});

const RegistrationSchema = new mongoose.Schema({
  eventId: { type: String, required: true },
  volunteerId: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'attended'], default: 'pending' },
  registrationDate: { type: Date, default: Date.now },
  hoursCredited: { type: Number, default: 0 }
});

const MongoUser = mongoose.models.User || mongoose.model('User', UserSchema);
const MongoEvent = mongoose.models.Event || mongoose.model('Event', EventSchema);
const MongoRegistration = mongoose.models.Registration || mongoose.model('Registration', RegistrationSchema);

// JSON File Store Setup
const dataDir = path.join(__dirname, '../data');
const jsonFilePath = path.join(dataDir, 'local_db.json');

const initJsonStore = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(jsonFilePath)) {
    const salt = bcrypt.genSaltSync(10);
    const hashedAdminPassword = bcrypt.hashSync('admin123', salt);
    const initialData = {
      users: [
        {
          _id: 'admin-seed-id-0000',
          name: 'System Admin',
          email: 'admin@volunteer.com',
          password: hashedAdminPassword,
          role: 'admin',
          skills: ['Management', 'Coordination'],
          availability: 'Flexible',
          bio: 'System Administrator account.',
          phone: '+15550199',
          isVerified: true,
          hoursVolunteered: 0,
          createdAt: new Date().toISOString()
        }
      ],
      events: [
        {
          _id: 'event-seed-1',
          title: 'Community Food Drive 2026',
          description: 'Help distribute meals and coordinate food packing for families in need.',
          date: '2026-07-10',
          location: 'Downtown Community Center',
          requiredSkills: ['Packing', 'Heavy Lifting', 'Coordination'],
          maxVolunteers: 15,
          currentVolunteers: 0,
          status: 'open',
          createdAt: new Date().toISOString()
        },
        {
          _id: 'event-seed-2',
          title: 'Park Clean Up & Tree Planting',
          description: 'Planting new saplings and clearing debris from the city central park trail.',
          date: '2026-08-05',
          location: 'Central Green Park',
          requiredSkills: ['Gardening', 'Outdoors'],
          maxVolunteers: 25,
          currentVolunteers: 0,
          status: 'open',
          createdAt: new Date().toISOString()
        }
      ],
      registrations: []
    };
    fs.writeFileSync(jsonFilePath, JSON.stringify(initialData, null, 2), 'utf-8');
  }
};

const readJsonStore = () => {
  initJsonStore();
  try {
    const data = fs.readFileSync(jsonFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading JSON store:', err);
    return { users: [], events: [], registrations: [] };
  }
};

const writeJsonStore = (data) => {
  try {
    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to JSON store:', err);
  }
};

// Seed Admin for MongoDB
const seedMongoAdmin = async () => {
  try {
    const adminCount = await MongoUser.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedAdminPassword = await bcrypt.hash('admin123', salt);
      await MongoUser.create({
        name: 'System Admin',
        email: 'admin@volunteer.com',
        password: hashedAdminPassword,
        role: 'admin',
        skills: ['Management', 'Coordination'],
        availability: 'Flexible',
        bio: 'System Administrator account.',
        phone: '+15550199',
        isVerified: true,
        hoursVolunteered: 0
      });
      console.log('Successfully seeded Admin account in MongoDB.');
    }
  } catch (err) {
    console.error('Error seeding MongoDB admin:', err);
  }
};

// Generic Client Wrapper
const dbClient = {
  seedAdminIfNeeded: async () => {
    if (global.isMockDatabase) {
      initJsonStore();
    } else {
      await seedMongoAdmin();
    }
  },

  users: {
    find: async (query = {}) => {
      if (!global.isMockDatabase) {
        return await MongoUser.find(query).lean();
      }
      const store = readJsonStore();
      return store.users.filter(user => {
        for (let key in query) {
          if (query[key] !== undefined) {
            // support simple equality
            if (user[key] !== query[key]) return false;
          }
        }
        return true;
      });
    },

    findOne: async (query = {}) => {
      if (!global.isMockDatabase) {
        return await MongoUser.findOne(query).lean();
      }
      const store = readJsonStore();
      const user = store.users.find(u => {
        for (let key in query) {
          if (u[key] !== query[key]) return false;
        }
        return true;
      });
      return user || null;
    },

    findById: async (id) => {
      if (!global.isMockDatabase) {
        return await MongoUser.findById(id).lean();
      }
      const store = readJsonStore();
      const user = store.users.find(u => u._id === id);
      return user || null;
    },

    create: async (userData) => {
      if (!global.isMockDatabase) {
        const newUser = new MongoUser(userData);
        const saved = await newUser.save();
        return saved.toObject();
      }
      const store = readJsonStore();
      const newUser = {
        _id: 'user-' + Math.random().toString(36).substr(2, 9),
        skills: [],
        availability: 'Flexible',
        bio: '',
        phone: '',
        isVerified: false,
        hoursVolunteered: 0,
        createdAt: new Date().toISOString(),
        ...userData
      };
      store.users.push(newUser);
      writeJsonStore(store);
      return newUser;
    },

    findByIdAndUpdate: async (id, updateData) => {
      if (!global.isMockDatabase) {
        return await MongoUser.findByIdAndUpdate(id, updateData, { new: true }).lean();
      }
      const store = readJsonStore();
      const idx = store.users.findIndex(u => u._id === id);
      if (idx === -1) return null;
      store.users[idx] = { ...store.users[idx], ...updateData };
      writeJsonStore(store);
      return store.users[idx];
    },

    deleteOne: async (query = {}) => {
      if (!global.isMockDatabase) {
        return await MongoUser.deleteOne(query);
      }
      const store = readJsonStore();
      const initialLen = store.users.length;
      store.users = store.users.filter(u => {
        for (let key in query) {
          if (u[key] !== query[key]) return true;
        }
        return false;
      });
      writeJsonStore(store);
      return { deletedCount: initialLen - store.users.length };
    }
  },

  events: {
    find: async (query = {}) => {
      if (!global.isMockDatabase) {
        return await MongoEvent.find(query).lean();
      }
      const store = readJsonStore();
      return store.events.filter(event => {
        for (let key in query) {
          if (query[key] !== undefined) {
            if (event[key] !== query[key]) return false;
          }
        }
        return true;
      });
    },

    findOne: async (query = {}) => {
      if (!global.isMockDatabase) {
        return await MongoEvent.findOne(query).lean();
      }
      const store = readJsonStore();
      const event = store.events.find(e => {
        for (let key in query) {
          if (e[key] !== query[key]) return false;
        }
        return true;
      });
      return event || null;
    },

    findById: async (id) => {
      if (!global.isMockDatabase) {
        return await MongoEvent.findById(id).lean();
      }
      const store = readJsonStore();
      const event = store.events.find(e => e._id === id);
      return event || null;
    },

    create: async (eventData) => {
      if (!global.isMockDatabase) {
        const newEvent = new MongoEvent(eventData);
        const saved = await newEvent.save();
        return saved.toObject();
      }
      const store = readJsonStore();
      const newEvent = {
        _id: 'event-' + Math.random().toString(36).substr(2, 9),
        currentVolunteers: 0,
        status: 'open',
        requiredSkills: [],
        createdAt: new Date().toISOString(),
        ...eventData
      };
      store.events.push(newEvent);
      writeJsonStore(store);
      return newEvent;
    },

    findByIdAndUpdate: async (id, updateData) => {
      if (!global.isMockDatabase) {
        return await MongoEvent.findByIdAndUpdate(id, updateData, { new: true }).lean();
      }
      const store = readJsonStore();
      const idx = store.events.findIndex(e => e._id === id);
      if (idx === -1) return null;
      store.events[idx] = { ...store.events[idx], ...updateData };
      writeJsonStore(store);
      return store.events[idx];
    },

    deleteOne: async (query = {}) => {
      if (!global.isMockDatabase) {
        return await MongoEvent.deleteOne(query);
      }
      const store = readJsonStore();
      const initialLen = store.events.length;
      store.events = store.events.filter(e => {
        for (let key in query) {
          if (e[key] !== query[key]) return true;
        }
        return false;
      });
      writeJsonStore(store);
      return { deletedCount: initialLen - store.events.length };
    }
  },

  registrations: {
    find: async (query = {}) => {
      if (!global.isMockDatabase) {
        return await MongoRegistration.find(query).lean();
      }
      const store = readJsonStore();
      return store.registrations.filter(reg => {
        for (let key in query) {
          if (query[key] !== undefined) {
            if (reg[key] !== query[key]) return false;
          }
        }
        return true;
      });
    },

    findOne: async (query = {}) => {
      if (!global.isMockDatabase) {
        return await MongoRegistration.findOne(query).lean();
      }
      const store = readJsonStore();
      const reg = store.registrations.find(r => {
        for (let key in query) {
          if (r[key] !== query[key]) return false;
        }
        return true;
      });
      return reg || null;
    },

    findById: async (id) => {
      if (!global.isMockDatabase) {
        return await MongoRegistration.findById(id).lean();
      }
      const store = readJsonStore();
      return store.registrations.find(r => r._id === id) || null;
    },

    create: async (regData) => {
      if (!global.isMockDatabase) {
        const newReg = new MongoRegistration(regData);
        const saved = await newReg.save();
        return saved.toObject();
      }
      const store = readJsonStore();
      const newReg = {
        _id: 'reg-' + Math.random().toString(36).substr(2, 9),
        status: 'pending',
        registrationDate: new Date().toISOString(),
        hoursCredited: 0,
        ...regData
      };
      store.registrations.push(newReg);
      writeJsonStore(store);
      return newReg;
    },

    findByIdAndUpdate: async (id, updateData) => {
      if (!global.isMockDatabase) {
        return await MongoRegistration.findByIdAndUpdate(id, updateData, { new: true }).lean();
      }
      const store = readJsonStore();
      const idx = store.registrations.findIndex(r => r._id === id);
      if (idx === -1) return null;
      store.registrations[idx] = { ...store.registrations[idx], ...updateData };
      writeJsonStore(store);
      return store.registrations[idx];
    },

    deleteOne: async (query = {}) => {
      if (!global.isMockDatabase) {
        return await MongoRegistration.deleteOne(query);
      }
      const store = readJsonStore();
      const initialLen = store.registrations.length;
      store.registrations = store.registrations.filter(r => {
        for (let key in query) {
          if (r[key] !== query[key]) return true;
        }
        return false;
      });
      writeJsonStore(store);
      return { deletedCount: initialLen - store.registrations.length };
    }
  }
};

module.exports = {
  dbClient,
  MongoUser,
  MongoEvent,
  MongoRegistration
};
