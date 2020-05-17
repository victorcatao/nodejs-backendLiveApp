const express = require('express')
const moment = require('moment')
const Live = require('../models/live')
const Push = require('../models/push')
const Suggestion = require('../models/suggestion')
const mongoose = require('mongoose')
const timeHelper = require('../helpers/timeHelper')
const pushHelper = require('../helpers/pushHelper')
const liveHelper = require('../helpers/liveHelper')
const firebase = require('../helpers/firebase')
const responseHelper = require('../helpers/responseHelper')

const router = express.Router();

router.get('/getAllLives', async (req, res) => {

  	
	Live.find(
		{},
  		[],
  		{
			sort: {
			    dateUTC: 1 //Sort by Date Added DESC
			}
  		},
  		function(err, docs){
  			docs.forEach(function(live, index){
  				liveHelper.setLiveIsLiveNow(live)
  			})
    		res.send(docs)
  		});

});

router.post('/update/dateTime', async (req, res) => {
	if(!req.body.time || !req.body.date || !req.body.liveId) {
		return res.status(400).send(responseHelper.jsonError('Faltou enviar date, time ou liveId'))
	}

	let date = req.body.date
	let time = req.body.time

	if(time.length != 5 || date.length != 10){
		return res.status(400).send(responseHelper.jsonError('Date ou time inválido'))
	}

	let query = { '_id': req.body.liveId }
	let newData = {
		date: date,
		time: time,
		dateUTC: timeHelper.getDateUTC(date, time)
	}

	Live.findOneAndUpdate(query, newData, { new: true, upsert: false }, function(err, live) {
    	if (err || !live) {
    		return res.status(400).send(responseHelper.jsonError(err))
    	}

    	Push.find({liveId: live.id}, function(error, pushes) {
    		if(error) {
    			return res.status(400).send(responseHelper.jsonError(error))
    		}
    		pushes.forEach(function(push, index){
    			if(push.isLive == false) {
    				return
    			}
    			if(push.isWarning == true) {
    				push.scheduledTime = timeHelper.getScheduledTimeToPush(date, time)
    			} 
    			else if(push.isSponsored == false) {
					push.scheduledTime = timeHelper.getScheduledTimeToPushOnTime(date, time)
    			}
    			push.save()
    		})
    		pushHelper.restartPushes()
    		return res.send(pushes)
    	})

	});
});

router.post('/update/url', async (req, res) => {

	if(!req.body.url || !req.body.liveId) {
		return res.status(400).send(responseHelper.jsonError('Faltou url ou liveId'))
	}

	let query = { '_id': req.body.liveId }
	let newData = {
		url: [req.body.url]
	}

	Live.findOneAndUpdate(query, newData, { new: true, upsert: false }, function(err, live) {
    	if (err || !live) {
    		return res.status(400).send(responseHelper.jsonError(err))
    	}

    	Push.find({liveId: live.id}, function(error, pushes) {
    		if(error) {
    			return res.status(400).send(responseHelper.jsonError(error))
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
    		pushHelper.restartPushes()
    		return res.send(pushes)
    	})

	});
});


router.post('/update/recorded', async (req, res) => {

	if(!req.body.liveId) {
		return res.status(400).send(responseHelper.jsonError('Faltou recorded ou liveId'))
	}

	let query = { '_id': req.body.liveId }
	let newData = {
		isRecorded: req.body.isRecorded
	}

	Live.findOneAndUpdate(query, newData, { new: true, upsert: false }, function(err, live) {
    	if (err || !live) {
    		return res.status(400).send(responseHelper.jsonError(err))
    	}
    	
    	return res.send(live)

	});
});


router.post('/update/forcedLive', async (req, res) => {

	if(!req.body.liveId) {
		return res.status(400).send(responseHelper.jsonError('Faltou liveId'))
	}

	let query = { '_id': req.body.liveId }
	let newData = {
		forcedLive: req.body.forcedLive
	}

	Live.findOneAndUpdate(query, newData, { new: true, upsert: false }, function(err, live) {
    	if (err || !live) {
    		return res.status(400).send(responseHelper.jsonError(err))
    	}
    	
    	return res.send(live)

	});
});


router.post('/delete/live', async (req, res) => {
	if(!req.body.liveId) {
		return res.status(400).send(responseHelper.jsonError('Envie o liveId'))
	}
	const liveId = req.body.liveId
	let query = { 
		'_id': liveId 
	}

	Live.deleteOne(query, function (err) {
		if (err) {
    		return res.status(400).send(responseHelper.jsonError(err))
    	}

    	Push.deleteMany({ liveId: liveId }, function (errPush) {
    		if (errPush) {
    			return res.status(400).send(responseHelper.jsonError(errPush))
    		}
    		res.send(responseHelper.jsonSuccess('Deletou com sucesso'))
    	});
	});
})



router.post('/hide/live', async (req, res) => {
	if(!req.body.liveId || req.body.hidden == null) {
		return res.status(400).send(responseHelper.jsonError('Envie o liveId e o hidden'))
	}
	const liveId = req.body.liveId
	let query = { '_id': liveId }

	Live.findOneAndUpdate(query, { hidden: req.body.hidden }, { upsert: false }, function(err, live) {
		if (err || !live) {
    		return res.status(400).send({ error: err })
    	}
    	res.send(responseHelper.jsonSuccess('ALTEROU COM SUCESSO'))
	})

})


router.post('/search', async (req, res) => {
	if(!req.body.name) {
		return res.status(400).send(responseHelper.jsonError('Search vazio'))
	}

  	const jsonFind = { 
  		name: {'$regex': `^${req.body.name}$`, '$options':'i'}
  	}

  	Live.find(
  		{ "name": { "$regex": req.body.name, "$options": "i" } }, 
  		function(error, lives){
	  		if(error) { 
	  			return res.status(400).send(responseHelper.jsonError(error))
	  		}
	  		res.send(lives)
  		}
  	)

});


router.get('/suggestions/getAll', async (req, res) => {
	
  	Suggestion.find({}, function(error, suggestions){
	  		if(error) { 
	  			return res.status(400).send(responseHelper.jsonError(error))
	  		}
	  		res.send(suggestions)
  		}
  	)

});



router.get('/suggestions/deleteAll', async (req, res) => {
	
  	Suggestion.remove({}, function(error, suggestions){
	  		if(error) { 
	  			return res.status(400).send(responseHelper.jsonError(error))
	  		}
	  		res.send(responseHelper.jsonSuccess('Todas as sugestões foram deletadas com sucesso'))
  		}
  	)

});




router.post('/suggestions/delete', async (req, res) => {
	if(!req.body.suggestionId) {
		return res.status(400).send(responseHelper.jsonError('suggestionId vazio'))
	}

	Suggestion.deleteOne({ '_id': req.body.suggestionId }, function (err) {
		if (err) {
    		return res.status(400).send(responseHelper.jsonError(err))
    	}
    	res.send(responseHelper.jsonSuccess('Deletou'))
	});

});



module.exports = app => app.use('/adm', router);
