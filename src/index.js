const express = require('express');
const bodyParser = require('body-parser');

const app = express();

// setup bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// setup controllers
require('./app/controllers/index')(app);

const port = process.env.PORT || 3000;

app.listen(port);