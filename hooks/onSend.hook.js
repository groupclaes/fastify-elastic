/**
 * onSend hook
 * Add request-id header with current requestId
 * @param {FastifyRequest} req 
 * @param {FastifyReply} reply 
 * @param {any} payload 
 * @param {*} next 
 */
module.exports = function (request, reply, payload, next) {
  reply.header('request-id', request.id)
  next()
}