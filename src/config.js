/**
 * Default configs
 *
 * @copyright Copyright (c) 2019, hugw.io
 * @author Hugo W - contact@hugw.io
 * @license MIT
 */

export default {
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
        // https://mongoosejs.com/docs/connections.html#options
        options: {
          useNewUrlParser: true,
        },
      },
      schema: {
        // https://mongoosejs.com/docs/guide.html#options
        options: {
          minimize: false,
          timestamps: true,
        },
      },
    },
  },

  // Test environment
  test: {
    mongo: {
      debug: false,
    },
  },

  // Production environment
  production: {
    mongo: {
      debug: false,
    },
  },
}
