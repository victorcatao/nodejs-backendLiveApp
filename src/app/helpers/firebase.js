const admin = require("firebase-admin");

// MUDAR AQUI
const serviceAccount = require("../../config/base-ios-swift-firebase-adminsdk-cjup7-96abd87a97.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://base-ios-swift.firebaseio.com" // MUDAR AQUI
});

const teste = "tetes"

const sendPushFunction = function sendPush(token, title, body) {
  var payload = {
    notification: {
      title: title,
      body: body
    }
  };

  var options = {
    priority: "high",
    timeToLive: 60 * 60 * 24
  };

  admin.messaging().sendToDevice(token, payload, options)
    .then(function(response) {
      console.log("Successfully sent message:", response);
    })
    .catch(function(error) {
      console.log("Error sending message:", error);
    });
}

module.exports = {
  sendPush: sendPushFunction
}