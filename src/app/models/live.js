const mongoose = require('../../database/index.js');

const LiveSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true
  },
  picture: {
    type: String,
    require: true
  },
  logo: {
    type: String,
    require: true
  },
  url: [
    { 
      type: String
    }
  ],
  social_network: [ 
    {
      type: String,
      require: true
    }
  ],
  genres: [
    {
      type: String,
      require: true
    }
  ],
  artists: [
    { 
      type: String,
      require: true
    }
  ],
  date: {
    type: String,
    require: true
  },
  time: {
      type: String,
      require: true
  },
  live: {
    type: Boolean,
    default: false
  }, 
  isRecorded: {
    type: Boolean,
    default: false
  },
  forcedLive: {
    type: Boolean,
    default: false
  },
  hidden: {
    type: Boolean,
    default: false
  },
  dateUTC: {
    type: Date 
  }
});

LiveSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret, options) => {
        delete ret.__v;
        ret.id = ret._id.toString();
        delete ret._id;
    },
});

const Live = mongoose.model('Live', LiveSchema);

module.exports = Live;
