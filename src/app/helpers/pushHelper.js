const schedule = require('node-schedule')
const timeHelper = require('./timeHelper')
const Push = require('../models/push')
const firebase = require('./firebase')

const createPushesForNewLive = function createPushesForNewLive(body, live) {

	// Push when live starts
	var titleStart = "Tá na horaaa!"
	var bodyStart = `Tá na hora da live com ${body.name}! Clique aqui para acessar ;)`
	var urlStart = live.url[0]

	if(body.push && body.push.title) {
		titleStart = body.push.title
	}

	if(body.push && body.push.body) {
		bodyStart = body.push.body
	}

	if(body.push && body.push.url) {
		urlStart = body.push.url
	}

	var pushStart = new Push(
		{
			liveId: live.id,
		  	title: titleStart,
		  	body: bodyStart,
		  	url: urlStart,
		  	scheduledTime: timeHelper.getScheduledTimeToPushOnTime(body.date, body.time),
		  	isWarning: false,
		  	isLive: true
		}
	)

	pushStart.save(function(error){
		schedulePush(pushStart)
	})

	// Push before the live starts
	var titleBefore = 'Tá chegando a hora!'
	var bodyBefore = `Daqui a pouco tem live com ${body.name}! Fique ligado ;)`
	var urlBefore = live.url[0]

	if(body.push && body.push.pushBefore.title){
		titleBefore = body.push.pushBefore.title
	}

	if(body.push && body.push.pushBefore.body){
		bodyBefore = body.push.pushBefore.body
	}

	if(body.push && body.push.pushBefore.url) {
		urlBefore = body.push.url
	}

	var pushBefore = new Push(
		{
			liveId: live.id,
		  	title: titleBefore,
		  	body: bodyBefore,
		  	url: urlBefore,
		  	scheduledTime: timeHelper.getScheduledTimeToPush(body.date, body.time),
		  	isWarning: true,
		  	isLive: true
		}
	)

	pushBefore.save(function(error){
		schedulePush(pushBefore)
	})

	if(body.push && body.push.pushSponsored && body.push.pushSponsored.date && body.push.pushSponsored.time && body.push.pushSponsored.title && body.push.pushSponsored.body) {
		var pushSponsored = new Push(
			{
				liveId: live.id,
			  	title: body.push.pushSponsored.title,
			  	body: body.push.pushSponsored.body,
			  	url: body.push.pushSponsored.url,
			  	scheduledTime: timeHelper.getScheduledTimeToPushOnTime(body.push.pushSponsored.date, body.push.pushSponsored.time),
			  	isWarning: false,
			  	isSponsored: true,
			  	isLive: true
			}
		)

		pushSponsored.save(function(error) {
			schedulePush(pushSponsored)
		})
		
	}
}

const schedulePush = function schedulePush(push) {
	var k = schedule.scheduleJob(push.id, push.scheduledTime, function(){
				sendPush(push)
			})
}

const sendPush = function sendPush(push) {
	firebase.sendPushV2(push)

	Push.deleteOne({ '_id': push.id }, function(err){
		if(err) {
			console.log(err)
		}
		console.log('Deleting push')
	})
}

const restartPushes = function restartPushes() {
	setTimeout(function(){

		Push.find().then(
			function(docs){

				docs.forEach(function(push, index) {
					if(schedule.scheduledJobs[push.id]) {
						schedule.scheduledJobs[push.id].cancel()
					}
				})

				setTimeout(function () {
					docs.forEach(function(push, index) {
						schedulePush(push)
					})
				}, 10000)
				
			}
		).catch(error => { throw error})

	}, 5000)
}

module.exports = {
	createPushesForNewLive: createPushesForNewLive,
  	schedulePush: schedulePush,
  	sendPush: sendPush,
	restartPushes: restartPushes
}