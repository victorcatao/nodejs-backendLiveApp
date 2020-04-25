const express = require('express');
const authMiddleware = require('../middlewares/auth');
const bcrypt = require('bcryptjs');

const User = require('../models/User');

const router = express.Router();

// Verifica se usuário está logado
router.use(authMiddleware);


router.put('/updatePassword', async (req, res) => {

  req.body.password = await bcrypt.hash(req.body.password, 10);

  const user = await User.findOneAndUpdate(
    { _id: req.userId },
    { $set: { password: req.body.password } },
    {upsert: true, new: true}
  ).exec();

  if(user) {
    res.send(user)
  } else {
    res.status(400).send({ error: 'Something went wrong' })
  }

});


router.get('/updatePhoto', (req, res) => {
  res.send({ok: true, user_id: req.userId});
});


router.put('/updateAbout', (req, res) => {

  User.findOneAndUpdate(
    { _id: req.userId },
    { $set: req.body },
    { new: true },
    function(err, doc){
      if(err){
        res.status(400).send({ error: 'Something went wrong' })
      }
      res.send(doc)
  });

});

router.get('/getAbout', async (req, res) => {
  const user = await User.findById(req.userId);
  res.send(user);
});


router.post('/registerToken', (req, res) => {

  User.findOneAndUpdate(
    { _id: req.userId },
    { $set: {
        firebase_token: req.body.firebase_token,
        device: {
          model: req.body.model,
          os: req.body.os,
        },
        app: {
          build: req.body.build,
          version: req.body.version
        }
      }
    },
    { new: true },
    function(err, doc){
      if(err){
        res.status(400).send({ error: 'Something went wrong' })
      }
      res.send(doc)
  });

});


module.exports = app => app.use('/account', router);
