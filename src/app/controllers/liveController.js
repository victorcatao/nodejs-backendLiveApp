const express = require('express');
const moment = require('moment')
const timeHelper = require('../helpers/timeHelper')
const pushHelper = require('../helpers/pushHelper')
const liveHelper = require('../helpers/liveHelper')
const responseHelper = require('../helpers/responseHelper')
const firebase = require('../helpers/firebase')
const Live = require('../models/live');
const Push = require('../models/push');
const GenreCount = require('../models/genreCount')
const Suggestion = require('../models/suggestion')
const PushScheduled = require('../models/pushScheduled')
const schedule = require('node-schedule');
const mongoose = require('mongoose')

const router = express.Router();

// This is to reprogram the routines that died because the server was restarted

PushScheduled.find().then(
	function(docs) {
		var shouldScheduleIds = []
		var arr = []
		docs.forEach(function(push, index) {
			let key = push.firebaseToken + push.body
			if(arr.includes(key)) {
				// delete this push because it is a duplicate
				PushScheduled.remove({'_id': push.id}, function(err){})
			} else {
				arr.push(key)
				shouldScheduleIds.push(push.id)
			}
		})

		docs.forEach(function(push, index) {
			if(shouldScheduleIds.includes(push.id)) {
				sponsorPush(push)	
			}
		})
	}
);

removeTrash()
pushHelper.restartPushes()

router.post('/sendSuggestion', function(req, res) {
	if(req.body.artist == null) {
		return res.status(400).send(responseHelper.jsonError('Artista inválido'))
	}

	if(req.body.social_network == null) {
		return res.status(400).send(responseHelper.jsonError('Social network inválido'))
	}

	var suggestion = new Suggestion(req.body);
	suggestion.save(function(error) {
		if(error) {
			return res.status(400).send(responseHelper.jsonError(error.message))
		} else {
			res.send(suggestion)
		}
	})
});

router.post('/createMinduca', function(req, res) {

	req.body.forEach(function(live, index){
		req.body[index].dateUTC = timeHelper.getDateUTC(live.date, live.time)
	})

	Live.insertMany(req.body)
	    .then(function (docs) {
	    	docs.forEach(function(doc, index){
	    		pushHelper.createPushesForNewLive(req.body[index], doc)
	    	})
	    	pushHelper.restartPushes()
	        res.json(docs);
	    })
});

router.post('/create', function(req, res) {

	if(req.body.date == null || req.body.date.length != 10) {
		return res.status(400).send(responseHelper.jsonError('Invalid date format - DD/MM/YYYY HH:mm'))
	}

	if(req.body.time == null || req.body.time.length != 5) {
		return res.status(400).send(responseHelper.jsonError('Invalid time format - HH:mm'))
	}

	req.body.dateUTC = timeHelper.getDateUTC(req.body.date, req.body.time)

	var live = new Live(req.body);

	live.save(function(error) {
		if(error) {
			console.log(error)
			res.status(400).send(responseHelper.jsonError(error.message));
			return
		} else {
			pushHelper.createPushesForNewLive(req.body, live)
			pushHelper.restartPushes()
			res.send(live)
		}
	})
});

router.get('/tomorrow', function(req, res) {

	const startTomorrow = moment().tz("UTC").subtract(3, 'hours').startOf('day').add(3, 'hours').add(1, 'day').format()
	const endTomorrow = moment().tz("UTC").subtract(3, 'hours').endOf('day').add(3, 'hours').add(1, 'day').format()

	const findRecord = (req.query.findRecord == 'true') || (req.query.findRecord == true)
  	const jsonFind = { 
  		isRecorded: findRecord,
  		hidden: false
  	}
  	
  	if(findRecord == false) {
  		jsonFind.dateUTC = {
    		$gte: startTomorrow,
    		$lte: endTomorrow
  		}
  	}

	Live.find(
		jsonFind,
  		[],
  		{
			sort: {
			    dateUTC: 1 //Sort by Date Added DESC
			}
  		},
		function(err, docs){
			if(err) {
				return res.send(err)
			}
			docs.forEach(function(live, index){
  				liveHelper.setLiveIsLiveNow(live)
  			})
			return res.send(docs)
		}
	);
});

router.get('/today', function(req, res) {

	// subtract 3 (GMT) + 5 (limite live)
	const startToday = moment().tz("UTC").subtract(3, 'hours').startOf('day').add(3, 'hours').format()
	const endToday = moment().tz("UTC").subtract(3, 'hours').endOf('day').add(3, 'hours').format()
	
	const findRecord = (req.query.findRecord == 'true') || (req.query.findRecord == true)
  	const jsonFind = { 
  		isRecorded: findRecord,
  		hidden: false
  	}
  	
  	if(findRecord == false) {
  		jsonFind.dateUTC = {
    		$gte: startToday,
    		$lte: endToday
  		}
  	}

	Live.find(
		jsonFind,
  		[],
  		{
			sort: {
			    dateUTC: 1
			}
  		},
		function(err, docs){
			if(err) {
				return res.send(responseHelper.jsonError(err))
			}
			docs.forEach(function(live, index){
  				liveHelper.setLiveIsLiveNow(live)
  			})
			return res.send(liveHelper.removeFinishedLivesForToday(docs))
		}
	);
});

router.get('/findByGenre', function(req, res) {
	
	const genreName = `^${req.query.genre_name}$`
	const startToday = moment().tz("UTC").subtract(3, 'hours').startOf('day').add(3, 'hours').format()
	const findRecord = (req.query.findRecord == 'true') || (req.query.findRecord == true)
  	const jsonFind = { 
  		isRecorded: findRecord,
  		hidden: false,
  		genres: {'$regex': genreName, $options:'i'}
  	}
  	
  	if(findRecord == false) {
  		jsonFind.dateUTC = {
    		$gte: startToday
  		}
  	}

  	// console.log(jsonFind)

	Live.find(
		jsonFind,
  		[],
  		{
			sort: {
			    dateUTC: 1
			}
  		},
  		function(err, docs){
			if(err) {
				return res.send(responseHelper.jsonError(err))
			}
			docs.forEach(function(live, index){
  				liveHelper.setLiveIsLiveNow(live)
  			})

  			if(findRecord == true){
				res.send(docs)
  			} else {
  				res.send(liveHelper.removeFinishedLivesForToday(docs))
  			}

  			// pra analisar os dados depois do que o nosso público curte +
			GenreCount.findOneAndUpdate({name: req.query.genre_name}, {$inc: { count: 1} }, { upsert: true, new: true, setDefaultsOnInsert: false }, function(error, counter)   {
		        
		    });

		}
	);
});

router.get('/genres', function(req, res) {
	
	const startToday = moment().tz("UTC").subtract(3, 'hours').startOf('day').add(3, 'hours').format()
	const findRecord = (req.query.findRecord == 'true') || (req.query.findRecord == true)
  	const jsonFind = { 
  		isRecorded: findRecord,
  		hidden: false
  	}
  	
  	if(findRecord == false) {
  		jsonFind.dateUTC = {
    		$gte: startToday
  		}
  	}

	Live.find(
		jsonFind,
		function(err, docs){
			if(err) {
				return res.send(err)
			}
			var genres = ["Sertanejo"] // comecar com esse por questoes de marketing :D

			docs.forEach(function(live, index){
				live.genres.forEach(function(genre, i){
					if(genres.includes(genre) == false){
						genres.push(genre)
					}
				})
		})
		return res.send(genres)

	});
});

router.post('/deletePushes', async (req, res) => {
	res.send()
	if(req.body.firebaseToken){
		let firebaseToken = req.body.firebaseToken
		PushScheduled.remove({ firebaseToken: firebaseToken }, function(error){
			if(error){
				console.log('not removed: ' + error)
			}
			console.log('removed everybody')
		})	
	}	
})

// DEPRECATED
router.post('/addToCalendar', async (req, res) => {

	const firebaseToken = req.body.firebaseToken

	if(firebaseToken == '' || firebaseToken == null || firebaseToken == undefined) {
		return res.send() // erro de token vazio
	} 
	
	const pushSponsored = req.body.pushSponsored

	if(pushSponsored && pushSponsored.date && pushSponsored.time && pushSponsored.title && pushSponsored.body) {
		const sponsoredDate = pushSponsored.date
		const sponsoredTime = pushSponsored.time

		var sponsoredPush = new PushScheduled({
			firebaseToken: firebaseToken,
			date: pushSponsored.date,
			time: pushSponsored.time,
			title: pushSponsored.title,
			body: pushSponsored.body,
			url: pushSponsored.url,
			scheduledTime: timeHelper.getScheduledTimeToPushOnTime(pushSponsored.date, pushSponsored.time),
			platform: req.body.platform,
			isLive: false
		})

		sponsoredPush.save(
			function(error, doc) {
				if(error) {
					console.log(error)
				}
				sponsorPush(doc)
			}
		)
	}


	const name = req.body.name
	const date = req.body.date
	const time = req.body.time

	var titlePush = !req.body.titlePush ? "Olho na Live!" : req.body.titlePush
	var bodyPush = !req.body.bodyPush ? `Daqui a pouco tem live com ${name}! Fique ligado ;)` : req.body.bodyPush


	PushScheduled.find({
		firebaseToken: firebaseToken,
		name: name
	}, function(err, docs){
		if(err) {
			console.log(`Erro ao tentar se inscrever: ${err}`)
			return res.send()
		}
		if(docs.length >= 1) {
			console.log(`Tentou se inscrever em push duplicado`)
			return res.send() // duplicado
		}

		// BLZ, VAI CRIAR UM CARA NOVO
		var push = new PushScheduled(
			{
				firebaseToken: firebaseToken,
				name: name,
				date: date,
			 	time: time,
			 	title: titlePush,
			 	body: bodyPush,
				scheduledTime: timeHelper.getScheduledTimeToPush(date, time),
				platform: req.body.platform,
				isLive: true
			}
		);

		push.save(
			function(error, doc) {
				if(error) {
					console.log(error)
				}
				sponsorPush(doc)
				res.send()
			}
		)

	})
});

function sponsorPush(push){
	if(push.isLive == true) {
		const scheduledTimeOnTime = timeHelper.getScheduledTimeToPushOnTime(push.date, push.time)
		// console.log(scheduledTimeOnTime)
		var k = schedule.scheduleJob(scheduledTimeOnTime, function(){
			firebase.sendPush(push.firebaseToken, "Começooooou!", `Começou a live com ${push.name}! Acesse pelo app ;)`, push.url)

			PushScheduled.deleteOne({ '_id': push.id }, function (err) {
			  if (err) {
			  	console.log(`sponsorPush sent but not deleted: ${pushMongoDBId}`)
			  } else {
			  	console.log('sponsorPush sent and deleted successfully')
			  }
			});

		})
	}

	var j = schedule.scheduleJob(push.scheduledTime, function(){
		console.log('TA NA HORA DE MANDAAAARRR')
		firebase.sendPush(push.firebaseToken, push.title, push.body, push.url)

		if(push.isLive == false) {
			PushScheduled.deleteOne({ '_id': push.id }, function (err) {
			  if (err) {
			  	console.log(`sponsorPush sent but not deleted: ${pushMongoDBId}`)
			  } else {
			  	console.log('sponsorPush sent and deleted successfully')
			  }
			});
		}
	});
}


router.get('/getSearchData', async (req, res) => {

	Live.find(
		{
			hidden: false
		},
  		[],
  		{
			sort: {
			    dateUTC: 1 //Sort by Date Added DESC
			}
  		},
  		function(err, docs){
  			var liveNow = []
  			var others = []
  			var recorded = []
  			docs.forEach(function(live, index){
  				liveHelper.setLiveIsLiveNow(live)
				var diff = live.dateUTC - Date.now()
				var isFutureLive = diff > 0 
  				
  				if(live.isRecorded == true){
  					recorded.push(live)
  				} else if(live.live == true && isFutureLive == false && live.isRecorded == false) {
  					liveNow.push(live)
  				} else if (isFutureLive) {
  					others.push(live)
  				}
  			})
    		res.send(
    			{
    				liveNow: liveNow,
    				others: others,
    				recorded: recorded
    			}
    		)
  		});
});

router.post('/updateMyLives', async (req, res) => {

	var ids = []
    req.body.ids.forEach(function(id, index){
    	ids.push(mongoose.Types.ObjectId(id))
    })

    const startToday = moment().tz("UTC").subtract(3, 'hours').startOf('day').add(3, 'hours').format()

	Live.find(
		{
			'_id': { $in: ids },
			hidden: false,
			dateUTC: {
	    		$gte: startToday
  			}
	    },
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
    		res.send(liveHelper.removeFinishedLivesForToday(docs))
  		});

});

router.get('/all', async (req, res) => {

  	const startToday = moment().tz("UTC").subtract(3, 'hours').startOf('day').add(3, 'hours').format()
  	
  	const findRecord = (req.query.findRecord == 'true') || (req.query.findRecord == true)
  	const jsonFind = { 
  		isRecorded: findRecord,
  		hidden: false
  	}

  	if(findRecord == false) {
  		jsonFind.dateUTC = {
    		$gte: startToday
  		}
  	}

	Live.find(
		jsonFind,
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

  			if(findRecord == true){
				return res.send(docs)
  			} else {
  				return res.send(liveHelper.removeFinishedLivesForToday(docs))
  			}
  		});

});

router.post('/sendSugestion', function(req, res) {


	if(req.body.artist == null) {
		return res.status(400).send(responseHelper.jsonError('Invalid artist'))
	}

	if(req.body.social_network == null) {
		return res.status(400).send(responseHelper.jsonError('Social network invalid'))
	}

	var suggestion = new Suggestion(req.body);
	suggestion.save(function(error) {
		if(error) {
			return res.status(400).send(responseHelper.jsonError(error.message));
		} else {
			res.send(suggestion)
		}
	})
});



router.get('/getAllLives', async (req, res) => {
	Live.find(
		{hidden: false},
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


router.get('/getDonationURL', async (req, res) => {
  	res.send({url: "https://secure.unicef.org.br/Default.aspx?origem=drtv&gclid=CjwKCAjwtqj2BRBYEiwAqfzur_ZpbfYUjkUqH0boMR-cmm8x0RDS8K9Xe8fKS7I2hMUEFSO513FMAhoCU98QAvD_BwE"})
});

function removeTrash() {
	const startDate = moment().tz("UTC").subtract(7, 'days').format()
  	
  	const jsonFind = { 
  		isRecorded: false,
  		dateUTC: {
  			$lte: startDate
  		}
  	}

	Live.deleteMany(jsonFind, function (err) {
		console.log('REMOVE TRASH ERROR LIVE: ' + err)
	});

	Push.deleteMany({
		scheduledTime: {
			$lte: startDate
		}
	}, function(err) {
		console.log('REMOVE TRASH ERROR PUSHES: ' + err)
	})
}

module.exports = app => app.use('/lives', router);