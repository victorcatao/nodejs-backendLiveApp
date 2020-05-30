const mongoose = require('../../database/index.js');

const SuggestionSchema = new mongoose.Schema({
  artist: {
    type: String,
    required: 'Preencha o artist'
  },
  social_network: {
    type: String,
    required: 'Preencha o social_network'
  },
  created: {
    type: String
  }
});

SuggestionSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret, options) => {
        delete ret.__v;
        ret.id = ret._id.toString();
        delete ret._id;
    },
});

const Suggestion = mongoose.model('Suggestion', SuggestionSchema);

module.exports = Suggestion;
