const express = require('express')
const moment = require('moment')
const Live = require('../models/live')
const Push = require('../models/push')
const schedule = require('node-schedule')
const mongoose = require('mongoose')
const timeHelper = require('../helpers/timeHelper')
const firebase = require('../helpers/firebase')

const router = express.Router();

router.post('/update/dateTime', async (req, res) => {

	if(!req.body.time || !req.body.date || !req.body.liveId) {
		return res.status(400).send('Faltou enviar date, time ou liveId')
	}

	let date = req.body.date
	let time = req.body.time

	if(time.length != 5 || date.length != 10){
		return res.status(400).send('Date ou time inválido')
	}

	let query = { '_id': req.body.liveId }
	let newData = {
		date: date,
		time: time,
		dateUTC: timeHelper.getDateUTC(date, time)
	}

	Live.findOneAndUpdate(query, newData, { new: true, upsert: false }, function(err, live) {
    	if (err || !live) {
    		return res.status(400).send({ error: err })
    	}

    	Push.find({liveId: live.id}, function(error, pushes) {
    		if(error) {
    			return res.status(400).send({errorMessage: error})
    		}
    		pushes.forEach(function(push, index){
    			if(push.isLive == false) {
    				return
    			}
    			if(push.isWarning == true) {
    				push.scheduledTime = timeHelper.getScheduledTimeToPush(date, time)
    			} else if(push.isSponsored == false) {
					push.scheduledTime = timeHelper.getScheduledTimeToPushOnTime(date, time)
    			}
    			push.save()
    		})
    		restartPushes()
    		return res.send(pushes)
    	})

	});
});

router.post('/update/url', async (req, res) => {

	if(!req.body.url || !req.body.liveId) {
		return res.status(400).send('Faltou url ou liveId')
	}

	let query = { '_id': req.body.liveId }
	let newData = {
		url: [req.body.url]
	}

	Live.findOneAndUpdate(query, newData, { new: true, upsert: false }, function(err, live) {
    	if (err || !live) {
    		return res.status(400).send({ error: err })
    	}

    	Push.find({liveId: live.id}, function(error, pushes) {
    		if(error) {
    			return res.status(400).send({errorMessage: error})
    		}
    		pushes.forEach(function(push, index){
    			if(push.isLive == false) {
    				return
    			}
    			if(push.isWarning == true) {
    				push.url = req.body.url
    			} else if(push.isSponsored == false) {
					push.url = req.body.url
    			}
    			push.save()
    		})
    		restartPushes()
    		return res.send(pushes)
    	})

	});
});


router.post('/update/recorded', async (req, res) => {

	if(req.body.isRecorded == null || req.body.isRecorded == "" || !req.body.liveId) {
		return res.status(400).send('Faltou recorded ou liveId')
	}

	let query = { '_id': req.body.liveId }
	let newData = {
		isRecorded: req.body.isRecorded
	}

	Live.findOneAndUpdate(query, newData, { new: true, upsert: false }, function(err, live) {
    	if (err || !live) {
    		return res.status(400).send({ error: err })
    	}
    	
    	return res.send(live)

	});
});


router.post('/update/forcedLive', async (req, res) => {

	if(req.body.forcedLive == null || req.body.forcedLive == "" || !req.body.liveId) {
		return res.status(400).send('Faltou forcedLive ou liveId')
	}

	let query = { '_id': req.body.liveId }
	let newData = {
		forcedLive: req.body.forcedLive
	}

	Live.findOneAndUpdate(query, newData, { new: true, upsert: false }, function(err, live) {
    	if (err || !live) {
    		return res.status(400).send({ error: err })
    	}
    	
    	return res.send(live)

	});
});


router.post('/delete/live', async (req, res) => {
	if(!req.body.liveId) {
		return res.status(400).send('Envie o liveId')
	}
	const liveId = req.body.liveId
	let query = { 
		'_id': liveId 
	}

	Live.deleteOne(query, function (err) {
		if (err) {
    		return res.status(400).send({ error: err })
    	}

    	Push.deleteMany({ liveId: liveId }, function (errPush) {
    		if (errPush) {
    			return res.status(400).send({ error: errPush })
    		}
    		res.send('DELETOU COM SUCESSO')
    	});
	});
})



router.post('/hide/live', async (req, res) => {
	if(!req.body.liveId || req.body.hidden == null) {
		return res.status(400).send('Envie o liveId e o hidden')
	}
	const liveId = req.body.liveId
	let query = { '_id': liveId }

	Live.findOneAndUpdate(query, { hidden: req.body.hidden }, { upsert: false }, function(err, live) {
		if (err || !live) {
    		return res.status(400).send({ error: err })
    	}
    	res.send('ALTEROU COM SUCESSO')
	})

})


router.post('/search', async (req, res) => {
	if(!req.body.name) {
		return res.status(400).send('Search vazio')
	}

  	const jsonFind = { 
  		name: {'$regex': `^${req.body.name}$`, '$options':'i'}
  	}

  	Live.find(
  		{ "name": { "$regex": req.body.name, "$options": "i" } }, 
  		function(error, lives){
	  		if(error) { 
	  			return res.status(400).send(error) 
	  		}
	  		res.send(lives)
  		}
  	)

});





function restartPushes() {
	Push.find().then(
		function(docs){
			docs.forEach(function(push, index) {
				console.log('RECUPERANDO PUSH V2 QUE NAO FOI ENVIADO')
				schedulePush(push)
			})
		}
	)
}


function schedulePush(push) {
	// console.log('schedulePush: Vai programar o Push:\n' + push.body)
	var k = schedule.scheduleJob(push.id, push.scheduledTime, function(){
				sendPush(push)
			})
}

function sendPush(push) {
	// console.log('sendPush: Vai ENVIAR o Push: ' + push.body)
	firebase.sendPushV2(push)

	Push.deleteOne({ '_id': push.id }, function(err){
		if(err) {
			console.log(err)
		}
		console.log('APAGOU O PUSH')
	})
}




module.exports = app => app.use('/adm', router);
