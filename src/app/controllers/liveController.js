const express = require('express');
const moment = require('moment')
const router = express.Router();
const firebase = require('../helpers/firebase')
const Live = require('../models/live');
const Suggestion = require('../models/suggestion')
const PushScheduled = require('../models/pushScheduled')
const schedule = require('node-schedule');
const mongoose = require('mongoose')


// Isso é pra reprogramar as rotinas que morreram por conta do servidor ter sido restartado
PushScheduled.find().then(
	function(docs) {
		docs.forEach(function(push, index) {
			console.log('RECUPERANDO PUSH QUE NAO FOI ENVIADO')
			schedulePush(push.firebaseToken, push.name, push.date, push.time, push.id)
		})
	}
);



router.post('/sendSuggestion', function(req, res) {


	if(req.body.artist == null) {
		return res.status(400).send({'errorMessage': 'Artista inválido'})
	}

	if(req.body.social_network == null) {
		return res.status(400).send({'errorMessage': 'Social network inválido'})
	}

	var suggestion = new Suggestion(req.body);
	suggestion.save(function(error) {
		if(error) {
			console.log(error)
			return res.status(400).send({'errorMessage': error.message});
		} else {
			res.send(suggestion)
		}
	})
});




router.post('/createMinduca', function(req, res) {

	req.body.forEach(function(live, index){
		req.body[index].dateUTC = moment(`${req.body[index].date} ${req.body[index].time}`, "DD-MM-YYYY HH:mm").tz("UTC").add(3, 'hours')
	})

	console.log(req.body)

	Live.insertMany(req.body)
	    .then(function (docs) {
	        res.json(docs);
	    })
	    .catch(function (err) {
	        res.status(500).send(err);
	    });
});




router.post('/create', function(req, res) {

	if(req.body.date == null || req.body.date.length != 10) {
		return res.status(400).send({'errorMessage': 'Data no formato inválido. Correto: DD/MM/YYYY HH:mm'})
	}

	if(req.body.time == null || req.body.time.length != 5) {
		return res.status(400).send({'errorMessage': 'time no formato inválido. Correto: HH:mm'})
	}

	req.body.dateUTC = moment(`${req.body.date} ${req.body.time}`, "DD-MM-YYYY HH:mm").tz("UTC").add(3, 'hours')

	var live = new Live(req.body);

	live.save(function(error) {
		if(error) {
			console.log(error)
			res.status(400).send({'errorMessage': error.message});
			return
		} else {
			res.send(live)
		}
	})
});


router.post('/convertEverybody', function(req, res) {
	Live.find().then(function(docs) {
    	docs.forEach(function(live, index) {
    		// live.dateUTC = moment(`${live.date} ${live.time}`, "DD-MM-YYYY HH:mm").tz("UTC").add(3, 'hours').format()
    		// live.save()
    		// live.isRecorded = false
    		// live.save()
    	})
  	});
    res.send()
});


router.get('/tomorrow', function(req, res) {
	
	const startTomorrow = moment().tz("UTC").startOf('day').add(1, 'day').add(3, 'hours').format()
	const endTomorrow = moment().tz("UTC").add(1, 'day').endOf('day').add(3, 'hours').format()

	const findRecord = (req.query.findRecord == 'true') || (req.query.findRecord == true)
  	const jsonFind = { 
  		isRecorded: findRecord
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
  				setLiveIsLiveNow(live)
  			})
			return res.send(docs)
		}
	);
});




router.get('/today', function(req, res) {

	const startToday = moment().tz("UTC").subtract(3, 'hours').startOf('day').add(3, 'hours').format()
	console.log(startToday)
	const endToday = moment().tz("UTC").subtract(3, 'hours').endOf('day').add(3, 'hours').format()
	console.log(endToday)
	// const startToday = moment().tz("UTC").startOf('day').add(3, 'hours').add(1, 'seconds').format()
	// const endToday = moment().tz("UTC").endOf('day').add(3, 'hours').format()
	
	const findRecord = (req.query.findRecord == 'true') || (req.query.findRecord == true)
  	const jsonFind = { 
  		isRecorded: findRecord
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
				return res.send(err)
			}
			docs.forEach(function(live, index){
  				setLiveIsLiveNow(live)
  			})
			return res.send(docs)
		}
	);
});



router.get('/findByGenre', function(req, res) {
	
	const genreName = `^${req.query.genre_name}$`
	const startToday = moment().tz("UTC").startOf('day').add(3, 'hours').add(1, 'seconds').format()
	const findRecord = (req.query.findRecord == 'true') || (req.query.findRecord == true)
  	const jsonFind = { 
  		isRecorded: findRecord,
  		genres: {'$regex': genreName, $options:'i'}
  	}
  	
  	if(findRecord == false) {
  		jsonFind.dateUTC = {
    		$gte: startToday
  		}
  	}

  	console.log(jsonFind)

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
				return res.send(err)
			}
			docs.forEach(function(live, index){
  				setLiveIsLiveNow(live)
  			})
			return res.send(docs)
		}
	);
});



router.get('/genres', function(req, res) {
	
	const startToday = moment().tz("UTC").startOf('day').add(3, 'hours').add(1, 'seconds').format()
	const findRecord = (req.query.findRecord == 'true') || (req.query.findRecord == true)
  	const jsonFind = { isRecorded: findRecord }
  	
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









router.post('/addToCalendar', async (req, res) => {

	const firebaseToken = req.body.firebaseToken
	const name = req.body.name
	const date = req.body.date
	const time = req.body.time

	var push = new PushScheduled(
			{
				firebaseToken: firebaseToken,
				name: name,
				date: date,
			 	time: time,
				scheduledTime: getScheduledTimeToPush(date, time)
			}
		);

	push.save(
		function(error, doc) {
			if(error) {
				console.log(error)
			}
			console.log(doc)
			schedulePush(firebaseToken, name, date, time, doc.id)
			res.send()
		}
	)

	// const liveDateTime = `${req.body.date} ${req.body.time}`

	// const scheduledTime = moment(liveDateTime, "DD/MM/YYYY HH:mm").tz("UTC").add(3, 'hours').subtract(15, 'minutes').format('YYYY-MM-DD HH:mm:ss')

	// var j = schedule.scheduleJob(scheduledTime, function(){
	// 	firebase.sendPush(firebaseToken, "Olho na Live!", `Daqui a pouco tem live com ${name}! Fique ligado ;)`)
	// });
	// res.send()

});

function schedulePush(firebaseToken, name, date, time, pushMongoDBId){

	const scheduledTime = getScheduledTimeToPush(date, time)
	console.log('firebaseToken: ' + firebaseToken)
	console.log('name: ' + name)
	console.log('date: ' + date)
	console.log('time: ' + time)
	console.log('Disparo: ' + scheduledTime)
	console.log('pushMongoDBId: ' + pushMongoDBId)


	var j = schedule.scheduleJob(scheduledTime, function(){
		firebase.sendPush(firebaseToken, "Olho na Live!", `Daqui a pouco tem live com ${name}! Fique ligado ;)`)

		PushScheduled.deleteOne({ '_id': pushMongoDBId }, function (err) {
		  if (err) {
		  	console.log(`Push enviado mas NÃO DELETADO: ${pushMongoDBId}`)
		  } else {
		  	console.log('PUSH ENVIADO E DELETADO COM SUCESSO')
		  }
		});


	});

}


function getScheduledTimeToPush(date, time) {
	const liveDateTime = `${date} ${time}`
	return moment(liveDateTime, "DD/MM/YYYY HH:mm").tz("UTC").add(3, 'hours').subtract(15, 'minutes').format('YYYY-MM-DD HH:mm:ss')
}









router.get('/getSearchData', async (req, res) => {

	Live.find(
		{},
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
  				setLiveIsLiveNow(live)
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



function setLiveIsLiveNow(live) {
	var diff = live.dateUTC - Date.now()
	var sixHoursInMillis = 21600000
  	live.live = diff < 0  && diff > -sixHoursInMillis
}





router.post('/updateMyLives', async (req, res) => {

	var ids = []
    req.body.ids.forEach(function(id, index){
    	ids.push(mongoose.Types.ObjectId(id))
    })

	Live.find({
		'_id': { $in: ids}
	    }
	    ,function(err, docs){
  			docs.forEach(function(live, index){
  				setLiveIsLiveNow(live)
  			})
    		res.send(docs)
  		});

});






router.get('/all', async (req, res) => {

  	const startToday = moment().tz("UTC").startOf('day').add(3, 'hours').add(1, 'seconds').format()
  	
  	const findRecord = (req.query.findRecord == 'true') || (req.query.findRecord == true)
  	const jsonFind = { isRecorded: findRecord }

  	if(findRecord == false) {
  		jsonFind.dateUTC = {
    		$gte: startToday
  		}
  	}

	console.log(req.query.findRecord)
  	console.log(jsonFind)

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
  				setLiveIsLiveNow(live)
  			})
    		res.send(docs)
  		});

});





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
  				setLiveIsLiveNow(live)
  			})
    		res.send(docs)
  		});

});


module.exports = app => app.use('/lives', router);
