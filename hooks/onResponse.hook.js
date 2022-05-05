/**
 * onResponse hook
 * Log response send
 * @param {FastifyRequest} req 
 * @param {FastifyReply} reply 
 * @param {*} next 
 */
module.exports = function (req, reply, next) {
  if (!req.raw.url.includes('healthcheck')) {
    req.log.info({
      url: req.raw.url,
      ip: req.ip,
      statusCode: reply.statusCode,
      responseTime: reply.getResponseTime()
    }, 'Sent response')
  }
  next()
}