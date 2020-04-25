const express = require('express');
const bodyParser = require('body-parser');

const app = express();

// setup bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// setup controllers
require('./app/controllers/index')(app);

app.listen(3000);
