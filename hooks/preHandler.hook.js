/**
 * preHandler hook
 * Add default securityHeaders
 * @param {FastifyRequest} req 
 * @param {FastifyReply} reply 
 * @param {*} next 
 */
module.exports = function (req, reply, next) {
  // reply.header('Content-Security-Policy', `default-src 'none'`)
  reply.header('X-Content-Type-Options', `nosniff`)
  // reply.header('X-Frame-Options', `DENY`)
  // reply.header('X-Xss-Protection', `1; mode=block`)
  reply.header('Referrer-Policy', `no-referrer`)
  reply.header('Permissions-Policy', `fullscreen=*`)
  reply.header('Strict-Transport-Security', `max-age=15552000; preload`)
  next()
}