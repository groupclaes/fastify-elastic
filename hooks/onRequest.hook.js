/**
 * onReyest hook
 * Log request received
 * @param {FastifyRequest} req 
 * @param {FastifyReply} reply 
 * @param {*} next 
 */
module.exports = function (req, reply, next) {
  if (!req.raw.url.includes('healthcheck')) {
    req.log.info({ url: req.raw.url }, 'Received request')
  }
  next()
}