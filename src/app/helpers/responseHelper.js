
const jsonError = function jsonError(message) {
  return { errorMessage: message }
}


const jsonSucces = function jsonSucces(message) {
  return { successMessage: message }
}

module.exports = {
  jsonError: jsonError,
  jsonSucces: jsonSucces
}