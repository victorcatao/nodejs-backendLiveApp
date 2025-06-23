
const jsonError = function jsonError(message) {
  return { errorMessage: message }
}

const jsonSuccess = function jsonSucces(message) {
  return { successMessage: message }
}

module.exports = {
  jsonError: jsonError,
  jsonSuccess: jsonSuccess
}