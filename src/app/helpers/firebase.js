const admin = require("firebase-admin");
const serviceAccount = require("../../config/liveapp-275503-firebase-adminsdk-b7l2m-1f010cb215.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://liveapp-275503.firebaseio.com"
});

const sendPushFunction = function sendPush(token, title, body, url) {

  var data = {}

  if(url != null) {
    data.url = url
  }

  let message = {
    notification: {
        title: title,
        body: body
    },
    data: data,
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
    token: token
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

const sendPushV2Function = function sendPushV2(push) {

  var data = {}

  if(push.url) {
    data.url = push.url
  }

  let message = {
    topic: `/topics/${push.liveId}`,
    notification: {
        title: push.title,
        body: push.body
    },
    data: data,
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
    }
  };
  
  console.log(message)
  
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
  sendPush: sendPushFunction,
  sendPushV2: sendPushV2Function
}