const express = require('express');
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

	var live = new Live(req.body);
	console.log(live);
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


router.get('/tomorrow', function(req, res) {
	
	var tomorrowDate = new Date();
	tomorrowDate.setDate(tomorrowDate.getDate() + 1);

	let options = { day: '2-digit', month: '2-digit', year: 'numeric' };
	let tomorrow = tomorrowDate.toLocaleString('pt-BR', options) // 2020-04-23
	let dateSplit = tomorrow.split('-')

  	let dateBrl = dateSplit[2] + "/" + dateSplit[1] + "/" + dateSplit[0]

	Live.find(
		{ "date": dateBrl },
		function(err, docs){
			if(err) {
				return res.send(err)
			}
			return res.send(docs)
		}
	);
});




router.get('/today', function(req, res) {
	
	// let options = { day: 'numeric', month: '2-digit', year: 'numeric' };
	// let today = new Date().toLocaleString('pt-BR', options) // 2020-04-23
	// let dateSplit = today.split('-')

 //  	let dateBrl = dateSplit[2] + "/" + dateSplit[1] + "/" + dateSplit[0]
 //  	console.log(dateBrl)
 	let dateBrl = "27/04/2020"

	Live.find(
		{ "date": dateBrl },
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
	console.log(genreName)

	Live.find({ 
		genres: {
			$elemMatch: {
				$regex: genreName,
				$options: 'i' // case insensitive
			} 
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
		var genres = []

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

	// const date = new Date('04/27/2020 01:06:00');
	// console.log(date)
	
	// const now = new Date()
	// const diffTime = Math.abs(date - now);
	// const diffMinutes = Math.ceil(diffTime / (1000 * 60));
	// console.log(diffMinutes)

	// var j = schedule.scheduleJob(date, function(){
	//   console.log('The world is going to end today.');
	// });

	firebase.sendPush("token", "title exemplo", "body exemplo")
	// console.log(req.body)
	res.send()

});


router.get('/all', async (req, res) => {

  Live.find().then(function(docs){
    res.send(docs)
  });

});


module.exports = app => app.use('/lives', router);
