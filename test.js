const { env } = require('process')

// test permissions function
function hasPermission(permission, scope = undefined) {
  if (!env['SCOPE'])
    env['SCOPE'] = 'RIP'
  console.info(permission, scope)
  // if no scope is defined we shall use any * value for the current app
  if (!scope)
    scope = env['SCOPE']

  if (!this.jwt['roles'] || !Array.isArray(this.jwt['roles']))
    return false

  console.debug('jwt.roles', this.jwt['roles'])
  console.debug('env.SCOPE', env['SCOPE'], env['SCOPE'].split('/')[0])

  // get all roles for current app scope, be sure to take only first part from scope
  const roles = this.jwt['roles']
    .filter(x => x.split(':')[1].startsWith(env['SCOPE'].split('/')[0]))

  console.debug('roles', roles)

  return roles.some(x => {
    const parts = x.split(':')
    const role = parts[0]
    const scopes = parts[1].split('/')

    const reqScopes = scope.split('/')

    console.debug('role', role)
    console.debug('scopes', scopes)
    console.debug('reqScopes', reqScopes)
    if (permissions[role].some((perm) => perm == permission)) {
      for (let i = 0; i < reqScopes.length; i++) {
        const scope = scopes[i]
        const reqScope = reqScopes[i]

        if (
          i === 0 &&
          scope === reqScope
        ) {
          console.debug('i === 0 and scopes match; ', scope, reqScope)
          continue
        } else if (
          greaterThanZero(i) &&
          scope === reqScope &&
          i + 1 !== reqScopes.length
        ) {
          console.debug('greaterThanZero(i) and scopes match or length not satisfied; ', scope, reqScope)
          console.debug(reqScopes.length, i - 1)
          continue
        } else if (
          greaterThanZero(i) &&
          (
            (
              scope === reqScope &&
              i + 1 === reqScopes.length
            ) ||
            scope === '*'
          )
        ) {
          return true
        }

      }
    }
    return false
  })
}

function greaterThanZero(number) { return number > 0 }

// fixed permissions per role
const permissions = {
  'admin': [
    'read_all',
    'read',
    'write_all',
    'write',
    'delete_all',
    'delete',
  ],
  'moderator': [
    'read_all',
    'read',
    'write_all',
    'write',
    'delete',
  ],
  'contributor': [
    'read_all',
    'read',
    'write',
    'delete',
  ],
  'user': [
    'read',
    'write',
  ],
  'guest': [
    'read',
  ]
}


console.debug = () => { }

const test = {
  jwt: {
    roles: [
      'admin:GroupClaes.PCM/*'
    ]
  },
  hasPermission
}

env['SCOPE'] = 'GroupClaes.PCM'

console.log(test.hasPermission('read', 'GroupClaes.PCM/brabopak/users'))
console.log(test.hasPermission('write', 'GroupClaes.PCM/brabopak/users'))
console.log(test.hasPermission('delete', 'GroupClaes.PCM/brabopak/users'))
console.log(test.hasPermission('read', 'GroupClaes.PCM/document'))
console.log(test.hasPermission('write', 'GroupClaes.PCM/document'))
console.log(test.hasPermission('read', 'GroupClaes.PCM/*'))
console.log(test.hasPermission('write', 'GroupClaes.PCM/*'))
console.log(test.hasPermission('read'))
console.log(test.hasPermission('write'))