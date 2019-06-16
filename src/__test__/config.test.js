import config from '@/config'

describe('Expressio Mongo / Configs', () => {
  it('should match a valid config object', () => {
    expect(config).toEqual({
      default: {
        mongo: {
          enabled: true,
          debug: true,
          paths: {
            seed: '/db/seed.js',
            models: '/models',
          },
          conn: {
            uri: null,
            options: {
              useNewUrlParser: true,
            },
          },
          schema: {
            options: {
              minimize: false,
              timestamps: true,
            },
          },
        },
      },
      test: {
        mongo: {
          debug: false,
        },
      },
      production: {
        mongo: {
          debug: false,
        },
      },
    })
  })
})
