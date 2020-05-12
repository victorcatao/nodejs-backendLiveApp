const mongoose = require('../../database/index.js');

const PushSchema = new mongoose.Schema({
  liveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Live'
  },
  title: String,
  body: String,
  url: String,
  scheduledTime: String,
  isWarning: { type: Boolean, default: false },
  isSponsored: { type: Boolean, default: false },
  isLive: Boolean
});

PushSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret, options) => {
        delete ret.__v;
        ret.id = ret._id.toString();
        delete ret._id;
    },
});

const Push = mongoose.model('Push', PushSchema);

module.exports = Push;
