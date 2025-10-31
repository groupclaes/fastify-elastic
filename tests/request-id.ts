import { t } from 'tap'
import os from 'os'
import fastifyPlugin from 'fastify-plugin'


t.test('Fastify - RequestId - Use X-Request-Id if available', t => {
  t.plan(1)

  const { generate_request_id } = require('../plugins/request-id')

  t.equal(
    generate_request_id({
      headers: {
        'x-request-id':  '0107df91-73e4-4890-af02-b2b35d0af1a7'
      }
    }, null),
    '0107df91-73e4-4890-af02-b2b35d0af1a7')

  t.end()
})

t.test('Fastify - RequestId - Generate X-Request-Id if unavailable', t => {
  const { generate_request_id } = t.mockRequire<typeof import('../plugins/request-id')>(
    '../plugins/request-id.js',
    { 'os': t.createMock(os, { hostname: () => "testing-bob" }) }
  )


  let output = generate_request_id({ headers: {} }, null)
  t.equal(output, 'testing-bob0000000001')
  t.end()
})

t.test('Fastify - RequestId - Validate correct request id formatting', t => {
  t.plan(6)

  const { generate_request_id } = t.mockRequire<typeof import('../plugins/request-id')>(
    '../plugins/request-id.js',
    { 'os': t.createMock(os, { hostname: () => "testing-bob" }) }
  )

  const expectedResults = [
    'testing-bob0000000001',  // # 1
    'testing-bob000000002s',  // # 100

    'testing-bob000000002t',  // # 101
    'testing-bob000000005k',  // # 200

    'testing-bob000000005l',  // # 201
    'testing-bob000000008c'   // # 300
  ]

  for (let j = 0; j < 3; j++) {
    let output = generate_request_id({ headers: {} }, null)
    t.equal(output, expectedResults[j * 2])

    for (let i = 0; i < 98; i++) {
      generate_request_id({ headers: {} }, null)
    }

    output = generate_request_id({ headers: {} }, null)
    t.equal(output, expectedResults[(j * 2) + 1])
  }

  t.end()
})


t.test('Fastify - RequestId - Expect header to be set by plugin', async t => {
  t.plan(6)

  const mod = t.mockRequire('../plugins/request-id.js', {
    os: t.createMock(os, { hostname: () => 'testing-bob' }), // keep if your file actually uses it
    'fastify-plugin': (fn) => fn
  })

  // 2) Get the plugin function regardless of ESM/CJS shape
  const requestIdPlugin = mod?.default ?? mod?.[Symbol.for('esm.default')] ?? mod

  t.type(requestIdPlugin, 'function', 'plugin is a function')

  // 3) Minimal mock fastify instance
  const calls: any = { addHook: [] }
  const logs: any[] = []

  const mockFastify = {
    addHook(name: any, fn: any) { calls.addHook.push([name, fn]) },
    log: { debug(msg: string) { logs.push(msg) } }
  }

  // 4) Run plugin (registers onResponse)
  const plugin = requestIdPlugin(mockFastify)
  t.ok(logs.includes('adding plugin request_id'), 'logs plugin registration')
  t.equal(calls.addHook.length, 1, 'registers one hook')
  t.equal(calls.addHook[0][0], 'onResponse', 'hook name is onResponse')


  const onResponse = calls.addHook[0][1]
  t.type(onResponse, 'function', 'onResponse handler is a function')

  const headers: any = {}
  const request = { id: 'abc-123' }
  const reply = {
    header(k: string, v: string) { headers[k.toLowerCase()] = v }
  }

  await onResponse(request, reply)

  t.equal(headers['x-request-id'], 'abc-123', 'sets x-request-id from request.id')
  t.end()
})
