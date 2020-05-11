const express = require('express');
const moment = require('moment')
const router = express.Router();
const firebase = require('../helpers/firebase')
const Live = require('../models/live');
const Push = require('../models/push');
const Suggestion = require('../models/suggestion')
const PushScheduled = require('../models/pushScheduled')
const schedule = require('node-schedule');
const mongoose = require('mongoose')

const liveEstimatedTime = 12600000 // 3h 30m

// firebase.sendPush(
// 	"fNopJxfC3kugj1PtnbGBEs:APA91bH20aNyjG3LmPyg9ZUP13yB7JZb4d0rToi1ws7fQWwqBS0Ji0m6mhdYae-A_PtjaNo4a3vdG4G5AJFCngAio5xJcSE1YBxTijBDPZILYLX3L-1iQ14WpACeTIRTENBkegKVV4gu", 
// 	"Começooooou!", 
// 	`Começou a live com pelo app ;)`, 
// 	"https://google.com")


// FORMATO DE PUSH ANTIGO
// Isso é pra reprogramar as rotinas que morreram por conta do servidor ter sido restartado

PushScheduled.find().then(
	function(docs) {
		var shouldScheduleIds = []
		var arr = []
		docs.forEach(function(push, index) {
			let key = push.firebaseToken + push.body
			if(arr.includes(key)) {
				// deleta o push pq tá duplicado
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





startAllPushes()
function startAllPushes() {
	Push.find().then(
		function(docs){
			docs.forEach(function(push, index) {
				console.log('RECUPERANDO PUSH V2 QUE NAO FOI ENVIADO')
				schedulePush(push)
			})
		}
	)
}


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

	console.log(`MANDOU NO MINDUCA: ${req.body}`)

	Live.insertMany(req.body)
	    .then(function (docs) {
	    	console.log(`Acabou de criar as lives: ${docs}`)
	    	docs.forEach(function(docs, index){
	    		createPushesForNewLive(req.body[index], docs[index])
	    	})
	        res.json(docs);
	    })
	    // .catch(function (err) {
	    //     res.status(500).send(err);
	    // });
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
			createPushesForNewLive(req.body, live)
			res.send(live)
		}
	})
});


function createPushesForNewLive(body, live) {
	console.log(`Vai criar push para o body: \n${body} LIVE:\n${live}`)
	// PUSH QUANDO A LIVE COMECAR
	var titleStart = "Começooooou!"
	var bodyStart = `Começou a live com ${body.name}! Acesse pelo app ;)`
	var urlStart = body.url[0]

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
		  	scheduledTime: getScheduledTimeToPushOnTime(body.date, body.time),
		  	isWarning: false,
		  	isLive: true
		}
	)

	pushStart.save(function(error){
		schedulePush(pushStart)
	})





	// PUSH DE AVISO ANTES DA LIVE COMECAR
	var titleBefore = 'Olha na live!'
	var bodyBefore = `Daqui a pouco tem live com ${body.name}! Fique ligado ;)`
	var urlBefore = body.url[0]

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
		  	scheduledTime: getScheduledTimeToPush(body.date, body.time),
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
			  	scheduledTime: getScheduledTimeToPushOnTime(body.push.pushSponsored.date, body.push.pushSponsored.time),
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


router.post('/convertEverybody', function(req, res) {
	Live.find().then(function(docs) {
    	docs.forEach(function(live, index) {
    		// PUSH QUANDO A LIVE COMECAR
			var titleStart = "Começooooou!"
			var bodyStart = `Começou a live com ${live.name}! Acesse pelo app ;)`

			var pushStart = new Push(
				{
					liveId: live.id,
				  	title: titleStart,
				  	body: bodyStart,
				  	url: live.url[0],
				  	scheduledTime: getScheduledTimeToPushOnTime(live.date, live.time),
				  	isWarning: false,
				  	isLive: true
				}
			)

			pushStart.save(function(error){
				schedulePush(pushStart)
			})

			// PUSH DE AVISO ANTES DA LIVE COMECAR
			var titleBefore = 'Olha na live!'
			var bodyBefore = `Daqui a pouco tem live com ${live.name}! Fique ligado ;)`

			var pushBefore = new Push(
				{
					liveId: live.id,
				  	title: titleBefore,
				  	body: bodyBefore,
				  	url: live.url[0],
				  	scheduledTime: getScheduledTimeToPush(live.date, live.time),
				  	isWarning: true,
				  	isLive: true
				}
			)

			pushBefore.save(function(error){
				schedulePush(pushBefore)
			})
    	})
  	});
 	
 	// PushScheduled.remove(
 	// 	{ 
 	// 		$or: [
 	// 			{ 'firebaseToken': null }, 
 	// 			{ 'firebaseToken': ''}
 	// 		] 
 	// 	}, 
 	// 	function(err, docs) {
	 // 		if(err) {
	 // 			res.send({error: err})
	 // 		} else {
	 // 			res.send(docs)
	 // 		}
 	// 	}
 	// );

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
  				setLiveIsLiveNow(live)
  			})
			return res.send(docs)
		}
	);
});




router.get('/today', function(req, res) {

	// subtract 3 (GMT) + 5 (limite live)
	const startToday = moment().tz("UTC").subtract(3, 'hours').startOf('day').add(3, 'hours').format()
	// const startToday = moment().tz("UTC").subtract(8, 'hours').format()
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
				return res.send(err)
			}
			docs.forEach(function(live, index){
  				setLiveIsLiveNow(live)
  			})
			return res.send(removeFinishedLivesForToday(docs))
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
				return res.send(err)
			}
			docs.forEach(function(live, index){
  				setLiveIsLiveNow(live)
  			})

  			if(findRecord == true){
				return res.send(docs)
  			} else {
  				return res.send(removeFinishedLivesForToday(docs))
  			}
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

router.post('/restartPushes', async (req, res) => {
	Push.find().then(function(docs){
		docs.forEach(function(push, index){
			schedule.scheduledJobs[push.id].cancel()
		})

		startAllPushes()

	})
	res.send()
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
			scheduledTime: getScheduledTimeToPushOnTime(pushSponsored.date, pushSponsored.time),
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

	var push = new PushScheduled(
			{
				firebaseToken: firebaseToken,
				name: name,
				date: date,
			 	time: time,
			 	title: titlePush,
			 	body: bodyPush,
				scheduledTime: getScheduledTimeToPush(date, time),
				platform: req.body.platform,
				isLive: true
			}
		);

	push.save(
		function(error, doc) {
			if(error) {
				console.log(error)
			}
			// console.log(doc)
			// schedulePush(firebaseToken, name, date, time, doc.id)
			sponsorPush(doc)
			res.send()
		}
	)

});



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







function sponsorPush(push){
	// console.log(push)

	if(push.isLive == true) {
		const scheduledTimeOnTime = getScheduledTimeToPushOnTime(push.date, push.time)
		// console.log(scheduledTimeOnTime)
		var k = schedule.scheduleJob(scheduledTimeOnTime, function(){
			firebase.sendPush(push.firebaseToken, "Começooooou!", `Começou a live com ${push.name}! Acesse pelo app ;)`, push.url)

			PushScheduled.deleteOne({ '_id': push.id }, function (err) {
			  if (err) {
			  	console.log(`sponsorPush enviado mas NÃO DELETADO: ${pushMongoDBId}`)
			  } else {
			  	console.log('sponsorPush ENVIADO E DELETADO COM SUCESSO')
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
			  	console.log(`sponsorPush enviado mas NÃO DELETADO: ${pushMongoDBId}`)
			  } else {
			  	console.log('sponsorPush ENVIADO E DELETADO COM SUCESSO')
			  }
			});
		}
	});

}

// function schedulePush(firebaseToken, name, date, time, pushMongoDBId){

// 	const scheduledTime = getScheduledTimeToPush(date, time)

// 	var j = schedule.scheduleJob(scheduledTime, function(){
// 		firebase.sendPush(firebaseToken, "Olho na Live!", `Daqui a pouco tem live com ${name}! Fique ligado ;)`)

// 		PushScheduled.deleteOne({ '_id': pushMongoDBId }, function (err) {
// 		  if (err) {
// 		  	// console.log(`Push enviado mas NÃO DELETADO: ${pushMongoDBId}`)
// 		  } else {
// 		  	// console.log('PUSH ENVIADO E DELETADO COM SUCESSO')
// 		  }
// 		});
// 	});


// 	const scheduledTimeOnTime = getScheduledTimeToPushOnTime(date, time)

// 	var k = schedule.scheduleJob(scheduledTimeOnTime, function(){
// 		firebase.sendPush(firebaseToken, "Começooooou!", `Começou a live com ${name}! Acesse pelo app ;)`)

// 		PushScheduled.deleteOne({ '_id': pushMongoDBId }, function (err) {
// 		  if (err) {
// 		  	// console.log(`Push enviado mas NÃO DELETADO: ${pushMongoDBId}`)
// 		  } else {
// 		  	// console.log('PUSH ENVIADO E DELETADO COM SUCESSO')
// 		  }
// 		});
// 	});
// }


function getScheduledTimeToPush(date, time) {
	const liveDateTime = `${date} ${time}`
	return moment(liveDateTime, "DD/MM/YYYY HH:mm").tz("UTC").add(3, 'hours').subtract(30, 'minutes').format('YYYY-MM-DD HH:mm:ss')
	// return moment(liveDateTime, "DD/MM/YYYY HH:mm").tz("UTC").subtract(3, 'hours').subtract(2, 'minutes').format('YYYY-MM-DD HH:mm:ss')
}

function getScheduledTimeToPushOnTime(date, time) {
	const liveDateTime = `${date} ${time}`
	return moment(liveDateTime, "DD/MM/YYYY HH:mm").tz("UTC").add(3, 'hours').format('YYYY-MM-DD HH:mm:ss')
	// return moment(liveDateTime, "DD/MM/YYYY HH:mm").tz("UTC").subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')
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
	if(live.forcedLive == true) {
		live.live = true
		return
	}

	if(live.isRecorded == true) {
		live.live = false
	} else {
		var diff = live.dateUTC - Date.now()
		var liveEstimatedTime = 12600000
	  	live.live = diff < 0  && diff > -liveEstimatedTime	
	}
}

function removeFinishedLivesForToday(lives) {
	return lives
	// var filteredResult = []
	// lives.forEach(function(live, index){
	// 	const diff = Date.now() - live.dateUTC
	// 	if(diff > liveEstimatedTime && live.forcedLive == false) {
	// 		// NAO DEVE APARECER PQ JA PASSOU DAS HORAS DELE
	// 	} else {
	// 		filteredResult.push(live)
	// 	}	
	// })
	
	// return filteredResult
}



router.post('/updateMyLives', async (req, res) => {

	var ids = []
    req.body.ids.forEach(function(id, index){
    	ids.push(mongoose.Types.ObjectId(id))
    })

    // verificar se eh vazio e mandar de volta

    const startToday = moment().tz("UTC").subtract(3, 'hours').startOf('day').add(3, 'hours').format()

	Live.find(
		{
			'_id': { $in: ids },
			dateUTC: {
	    		$gte: startToday
  			}
	    }
	    ,function(err, docs){
  			docs.forEach(function(live, index){
  				setLiveIsLiveNow(live)
  			})
    		res.send(removeFinishedLivesForToday(docs))
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

	// console.log(req.query.findRecord)
 //  	console.log(jsonFind)

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

  			if(findRecord == true){
				return res.send(docs)
  			} else {
  				return res.send(removeFinishedLivesForToday(docs))
  			}
  		});

});



router.post('/sendSugestion', function(req, res) {


	if(req.body.artist == null) {
		return res.status(400).send({'errorMessage': 'Artista inválido'})
	}

	if(req.body.social_network == null) {
		return res.status(400).send({'errorMessage': 'Social network inválido'})
	}

	var suggestion = new Suggestion(req.body);
	suggestion.save(function(error) {
		if(error) {
			return res.status(400).send({'errorMessage': error.message});
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
  				setLiveIsLiveNow(live)
  			})
    		res.send(docs)
  		});

});


module.exports = app => app.use('/lives', router);
