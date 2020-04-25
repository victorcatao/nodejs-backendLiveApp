const mongoose = require('../../database');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name:{
    type: String,
    require: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    select: false // ele não exibe na listagem
  },
  firebase_token: {
    type: String,
    select: false
  },
  device: {
    model: { type: String, select: false },
    os: { type: String, select: false }
  },
  app: {
    build: { type: String, select: false },
    version: { type: String, select: false }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    select: false
  },
});

UserSchema.pre('save', async function(next){
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
  next();
});

UserSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret, options) => {
        delete ret.__v;
        ret.id = ret._id.toString();
        delete ret._id;
    },
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
