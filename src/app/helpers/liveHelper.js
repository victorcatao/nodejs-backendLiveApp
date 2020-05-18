const schedule = require('node-schedule')
const timeHelper = require('./timeHelper')
const Push = require('../models/push')

const liveEstimatedTime = 12600000 // 3h 30m


const setLiveIsLiveNow = function setLiveIsLiveNow(live) {
	if(live.forcedLive == true) {
		live.live = true
		return
	}

	if(live.isRecorded == true) {
		live.live = false
	} else {
		var diff = live.dateUTC - Date.now()
	  	live.live = diff < 0  && diff > -liveEstimatedTime	
	}
}

function removeFinishedLivesForToday(lives) {
	// return lives
	var filteredResult = []
	lives.forEach(function(live, index){
		const diff = Date.now() - live.dateUTC
		if(diff > liveEstimatedTime && live.forcedLive == false) {
			// NAO DEVE APARECER PQ JA PASSOU DAS HORAS DELE
		} else {
			filteredResult.push(live)
		}	
	})
	
	return filteredResult
}

module.exports = {
	setLiveIsLiveNow: setLiveIsLiveNow,
  	liveEstimatedTime: liveEstimatedTime,
  	removeFinishedLivesForToday: removeFinishedLivesForToday
}