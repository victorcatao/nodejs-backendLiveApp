const moment = require('moment')

const getScheduledTimeToPush = function getScheduledTimeToPush(date, time) {
  const liveDateTime = `${date} ${time}`
  return moment(liveDateTime, "DD/MM/YYYY HH:mm").tz("UTC").add(3, 'hours').subtract(30, 'minutes').format('YYYY-MM-DD HH:mm:ss')
  // return moment(liveDateTime, "DD/MM/YYYY HH:mm").tz("UTC").subtract(3, 'hours').subtract(2, 'minutes').format('YYYY-MM-DD HH:mm:ss')
}

const getScheduledTimeToPushOnTime = function getScheduledTimeToPushOnTime(date, time) {
  const liveDateTime = `${date} ${time}`
  return moment(liveDateTime, "DD/MM/YYYY HH:mm").tz("UTC").add(3, 'hours').format('YYYY-MM-DD HH:mm:ss')
  // return moment(liveDateTime, "DD/MM/YYYY HH:mm").tz("UTC").subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')
}

const getDateUTC = function getDateUTC(date, time) {
  return moment(`${date} ${time}`, "DD-MM-YYYY HH:mm").tz("UTC").add(3, 'hours')
}

module.exports = {
  getScheduledTimeToPush: getScheduledTimeToPush,
  getScheduledTimeToPushOnTime: getScheduledTimeToPushOnTime,
  getDateUTC: getDateUTC
}