const express = require('express');
const moment = require('moment')
const router = express.Router();
const firebase = require('../helpers/firebase')
const Live = require('../models/live');
const Suggestion = require('../models/suggestion')
const schedule = require('node-schedule');



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
	Live.find({id: '5eab9dda6a0e6d2bb50e546d'}).then(function(docs) {
    	docs.forEach(function(live, index) {
    		// console.log(`${live.date} ${live.time}`)
    		// console.log(moment(`${live.date} ${live.time}`, "DD-MM-YYYY HH:mm").tz("UTC").add(3, 'hours').format())
    		live.dateUTC = moment(`${live.date} ${live.time}`, "DD-MM-YYYY HH:mm").tz("UTC").add(3, 'hours').format()
    		live.save()
    	})
  	});
    res.send()
});


router.get('/tomorrow', function(req, res) {
	
	const startTomorrow = moment().tz("UTC").startOf('day').add(1, 'day').add(3, 'hours').format()
	const endTomorrow = moment().tz("UTC").add(1, 'day').endOf('day').add(3, 'hours').format()

	Live.find(
		{ 
			dateUTC: {
    			$gte: startTomorrow,
    			$lte: endTomorrow
  			} 
  		},
		function(err, docs){
			if(err) {
				return res.send(err)
			}
			return res.send(docs)
		}
	);
});




router.get('/today', function(req, res) {

	const startToday = moment().tz("UTC").startOf('day').add(3, 'hours').add(1, 'seconds').format()
	const endToday = moment().tz("UTC").endOf('day').add(3, 'hours').format()

	Live.find(
		{ 
			dateUTC: {
    			$gte: startToday,
    			$lte: endToday
  			} 
  		},
		function(err, docs){
			if(err) {
				return res.send(err)
			}
			return res.send(docs)
		}
	);
});



router.get('/findByGenre', function(req, res) {
	
	const genreName = req.query.genre_name
	const startToday = moment().tz("UTC").startOf('day').add(3, 'hours').add(1, 'seconds').format()

	Live.find({ 
		genres: {
			$elemMatch: {
				$regex: genreName,
				$options: 'i' // case insensitive
			} 
		}, 
		dateUTC: {
    		$gte: startToday
  		} 
	}, function(err, docs){
			if(err) {
				return res.send(err)
			}
			return res.send(docs)
		}
	);
});



router.get('/genres', function(req, res) {
	
	Live.find({}, function(err, docs){
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

	const liveDateTime = `${req.body.date} ${req.body.time}`
	console.log(liveDateTime)

	const scheduledTime = moment(liveDateTime, "DD/MM/YYYY HH:mm").tz("UTC").add(3, 'hours').subtract(30, 'minutes').format('YYYY-MM-DD HH:mm:ss')
	console.log(scheduledTime)


	var j = schedule.scheduleJob(scheduledTime, function(){
		firebase.sendPush(firebaseToken, "Olho na Live!", `Daqui a pouco tem live com ${name}! Fique ligado ;)`)
	});
	res.send()

});

























router.get('/all', async (req, res) => {

  	const startToday = moment().tz("UTC").startOf('day').add(3, 'hours').add(1, 'seconds').format()

	Live.find(
		{ 
			dateUTC: {
    			$gte: startToday
  			} 
  		},
  		function(err, docs){
    		res.send(docs)
  		});

});


module.exports = app => app.use('/lives', router);
