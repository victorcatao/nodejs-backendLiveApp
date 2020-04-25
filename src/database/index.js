const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/noderest');
// mongoose.connect('mongodb://victorcatao:minduca180190@ds045907.mlab.com:45907/liveappdb');


mongoose.Promise = global.Promise;

module.exports = mongoose;
