var aws = require('aws-sdk');
var multer = require('multer');
var multerS3 = require('multer-s3');

aws.config.loadFromPath('../../config/aws_config.json');

var s3 = new aws.S3();

var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'm2y-bucket',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString())
    }
  })
});
