const express = require('express');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// const authConfig = require('../../config/auth');
// const User = require('../models/User');

const router = express.Router();

// function generateToken(params = {}){
//   return jwt.sign(params, authConfig.secret, {
//     // se deixar vazio ela nunca expira
//     // expiresIn: 86400, //segundos
//   });
// }

/**
 * @api {POST} /auth/register Register user
 * @apiName RegisterUser
 * @apiGroup Auth
 *
 * @apiParam {String} name User name.
 * @apiParam {String} email User email.
 * @apiParam {String} [password] User password.
 *
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "firstname": "John",
 *       "lastname": "Doe"
 *     }
 *
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "UserNotFound"
 *     }
 */

// router.post('/signup', async(req, res) => {

//   const { email } = req.body;

//   try {

//     if(await User.findOne({ email })) {
//       return res.status(400).send({ 'error': 'User already exists' });
//     }

//     const user = await User.create(req.body);
//     user.password = undefined;
//     return res.send({
//       user,
//       token: generateToken({id: user.id})
//     });
//   } catch (err) {
//     return res.status(400).send({'error': 'Registration failed'});
//   }
// });


// router.post('/signin', async (req, res) => {
//   const { email, password } = req.body;
//   const user = await User.findOne({ email }).select('+password');

//   if(!user){
//     return res.status(400).send({'error':'User not found'});
//   }

//   if(!await bcrypt.compare(password, user.password)){
//     return res.status(400).send({'error':'Invalid password'});
//   }

//   user.password = undefined;

//   const token =

//   res.send({
//     user,
//     token: generateToken({id: user.id})
//   });

// });

module.exports = app => app.use('/auth', router);
