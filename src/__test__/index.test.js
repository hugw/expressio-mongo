import request from 'supertest'
import path from 'path'

import mongo from '@'
import app from './fixtures/demo/app'

describe('Expressio Mongo', () => {
  const on = jest.fn()

  const config = attrs => ({
    config: {
      mongo: {
        conn: {
          uri: 'mongodb://localhost:27017/expressio-mongo',
        },
        ...attrs,
      },
    },
  })

  const root = path.join(__dirname, '/fixtures/demo')

  afterEach(() => {
    on.mockClear()
  })

  it('should load the initializer and expose an api to the server', () => {
    const server = { root, events: { on }, ...config() }
    mongo(server)

    expect(Object.keys(server.mongo)).toEqual(['connect', 'disconnect', 'truncate', 'seed', 'run', 'models'])
    expect(server.mongoose).toBeTruthy()
    expect(on).toHaveBeenCalledTimes(1)
  })

  it('should not load the initializer if enabled is set to "false"', () => {
    const server = { root, events: { on }, ...config({ enabled: false }) }
    mongo(server)

    expect(server.mongo).toBeFalsy()
    expect(on).toHaveBeenCalledTimes(0)
  })

  it('given no "conn.uri" config, it should throw an error with proper message', () => {
    const server = { root, events: { on }, ...config({ conn: { uri: null } }) }
    const fn = () => mongo(server)
    expect(fn).toThrow('Invalid Mongo config: "uri" must be a string')
  })

  it('given no "paths.models" config, it should throw an error with proper message', () => {
    const server = { root, events: { on }, ...config({ paths: { models: '/modeeels' } }) }
    const fn = () => mongo(server)
    expect(fn).toThrow(`MongoDB Error: "${path.join(root, '/modeeels')}" models path is not valid.`)
  })
})

describe('Expressio Mongo / Demo', () => {
  beforeAll(async () => {
    await app.start()
    await app.mongo.seed()
  })

  afterAll(() => {
    app.stop()
  })

  it('(POST /user) with valid params should return a user payload', async () => {
    const payload = { name: 'John Doe', email: 'john@doe.com' }
    const response = await request(app).post('/user')
      .send(payload)

    expect(response.status).toBe(200)
    expect(response.body.name).toBe('John Doe')
    expect(response.body.email).toBe('john@doe.com')
    expect(response.body.createdAt).toBeDefined()
    expect(response.body.updatedAt).toBeDefined()
    expect(response.body.id).toBeDefined()
  })

  it('(GET /user/:id) with valid params should return an user payload', async () => {
    const data = { name: 'John Doe', email: 'j@doe.com' }
    const user = await app.mongo.models.User.create(data)
    const response = await request(app).get(`/user/${user.email}`)

    expect(response.status).toBe(200)
    expect(response.body.name).toBe(data.name)
    expect(response.body.email).toBe(data.email)
    expect(response.body.id).toBe(user.id)
    expect(response.body.createdAt).toBeDefined()
    expect(response.body.updatedAt).toBeDefined()
  })

  it('(GET /user/:id) with not found id param should return an error message', async () => {
    const id = 30
    const response = await request(app).get(`/user/${id}`)

    expect(response.status).toBe(400)
    expect(response.body.status).toBe(400)
    expect(response.body.message).toEqual('User does not exist')
  })
})
