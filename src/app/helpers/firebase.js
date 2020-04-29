const admin = require("firebase-admin");
const serviceAccount = require("../../config/liveapp-275503-firebase-adminsdk-b7l2m-1f010cb215.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://liveapp-275503.firebaseio.com"
});


const sendPushFunction = function sendPush(token, title, body) {

  var message = {
    // token: "c693_zwcRuqHiZEk-D0uxe:APA91bERmW9t_yI5g97OMZnUZE5BHVnxIlIv6GF8TD-qBX3Kv9yAjC_zQBi8TVBLol5lCVH79a-EORXXkHQ2p72QH7eSy23KAJvDe_O7SGT5jP5-jdrh8XMDzAnlJf6kMYy0VBQl3qIR",
    topic: "all", 
    data: {
      title: "TITLE_HERE",
      message: "MESSAGE_HERE",
      body: "BODY_HERE",
      // isScheduled: "true",
      // scheduledTime: "2020-04-27 12:56:00"
    },
    notification: { 
      title: "teste topic all", 
      body: "funcionou? pelo back",
      sound: "default"
    }
  };

  // var message = {
  //   to: "/topics/all",
  //   notification: { 
  //     title: "Notification title", 
  //     body: "Notification body", 
  //     sound: "default", 
  //     click_action: "FCM_PLUGIN_ACTIVITY", 
  //     icon: "fcm_push_icon" 
  //   },
  //   data: {
  //     "message": "This is a Firebase Cloud Messaging Topic Message!",
  //   }
  // }

  admin.messaging().send(message)
    .then((response) => {
      // Response is a message ID string.
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });

}

module.exports = {
  sendPush: sendPushFunction
}