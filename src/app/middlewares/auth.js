const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth.json');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({ 'error': 'You need to login' });
  }

  // Bearer eyJhbGciOiJIUzI1NiIsInR5c...
  const parts = authHeader.split(' ');
  if(!parts.lenght === 2) {
    return res.status(401).send({ 'error': 'Token error' });
  }

  const [ schema, token ] = parts;

  if(!/^Bearer$/i){ //procura por "Bearer"
    return res.status(401).send({ 'error': 'Token error' });
  }

  jwt.verify(token, authConfig.secret, (err, decoded) => { // decoded = user id
    if(err) return res.status(401).send({ 'error': 'Invalid token' });
    req.userId = decoded.id;
    return next();
  })

};
