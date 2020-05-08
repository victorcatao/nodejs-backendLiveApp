const mongoose = require('../../database/index.js');

const PushScheduledSchema = new mongoose.Schema({
  firebaseToken: String,
  name: String,
  date: String,
  time: String,
  scheduledTime: String,
  platform: String,
  url: String,
  title: String,
  body: String,
  isLive: {
    type: Boolean,
    default: true
  }
});

PushScheduledSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret, options) => {
        delete ret.__v;
        ret.id = ret._id.toString();
        delete ret._id;
    },
});

const PushScheduled = mongoose.model('PushScheduled', PushScheduledSchema);

module.exports = PushScheduled;
