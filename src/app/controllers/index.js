const fs = require('fs');
const path = require('path');

// This file is used to load all controllers dynamically
// It reads all files in the current directory and requires them
module.exports = app => {
  fs
    .readdirSync(__dirname)
    .filter(file => ((file.indexOf('.')) !== 0 && (file !== "index.js")))
    .forEach(file => require(path.resolve(__dirname, file))(app));
};
