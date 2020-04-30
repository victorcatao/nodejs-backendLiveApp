const admin = require("firebase-admin");
const serviceAccount = require("../../config/liveapp-275503-firebase-adminsdk-b7l2m-1f010cb215.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://liveapp-275503.firebaseio.com"
});


const sendPushFunction = function sendPush(token, title, body, scheduledTime) {

  // var message = {
  //   token: token,
  //   notification: { 
  //     title: title, 
  //     body: body
  //   },
  //   data: {
  //     title: title,
  //     message: body,
  //     body: body,
  //     isScheduled: "true",
  //     scheduledTime: scheduledTime // YYYY-MM-DD HH:MM:SS
  //   }
  // };

  let message = {
    notification: {
        title: title,
        body: body
    },
    data: {
        isScheduled: "true",
        scheduledTime: "2020-04-30 00:40:00"
    },
    // Apple specific settings
    apns: {
        headers: {
            'apns-priority': '10',
        },
        payload: {
            aps: {
                sound: 'default',
            }
        },
    },
    android: {
      priority: 'high',
      notification: {
          sound: 'default',
      }
    },
    token: token,
};


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