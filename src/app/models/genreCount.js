const mongoose = require('../../database/index.js');

const GenreCountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: 'Preencha o name'
  },
  count: {
    type: Number,
    default: 0
  }
});

GenreCountSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret, options) => {
        delete ret.__v;
        ret.id = ret._id.toString();
        delete ret._id;
    },
});

const GenreCount = mongoose.model('GenreCount', GenreCountSchema);

module.exports = GenreCount;
