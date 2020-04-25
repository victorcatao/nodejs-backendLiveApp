const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth.json');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({ 'error': 'Você precisa fazer login' });
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

  jwt.verify(token, authConfig.secret, (err, decoded) => { // decoded = id do usuario
    if(err) return res.status(401).send({ 'error': 'Token inválido' });
    req.userId = decoded.id;
    return next();
  })

};
