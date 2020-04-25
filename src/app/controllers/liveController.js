const express = require('express');
const router = express.Router();
const firebase = require('../helpers/firebase')
const Live = require('../models/live');

router.post('/createLive', function(req, res) {


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



router.get('/getLives/tomorrow', function(req, res) {
	
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




router.get('/getLives/today', function(req, res) {
	
	let options = { day: 'numeric', month: '2-digit', year: 'numeric' };
	let today = new Date().toLocaleString('pt-BR', options) // 2020-04-23
	let dateSplit = today.split('-')

  	let dateBrl = dateSplit[2] + "/" + dateSplit[1] + "/" + dateSplit[0]
  	console.log(dateBrl)

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
	firebase.sendPush("asfd", 1, 2)
	console.log(req.body)
	res.send()

});


router.get('/all', async (req, res) => {

  Live.find().then(function(docs){
    res.send(docs)
  });

});


module.exports = app => app.use('/lives', router);
