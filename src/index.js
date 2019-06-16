/**
 * Expressio Mongo
 *
 *
 * @copyright Copyright (c) 2019, hugw.io
 * @author Hugo W - contact@hugw.io
 * @license MIT
 */

import Joi from 'joi'
import ndtk from 'ndtk'
import { sanitize } from 'expressio'
import merge from 'lodash/merge'
import { Mongoose } from 'mongoose'
import path from 'path'
import fs from 'fs'

/**
 * Auto load models
 * to keep them registered
 * inside the connection object during
 * the loading phase
 */
function loadModels(dir, conn) {
  ndtk.assert(ndtk.isDir(dir), `MongoDB Error: "${dir}" models path is not valid.`)

  fs.readdirSync(dir)
    .filter(file => ((file.indexOf('.') !== 0) && (file !== 'index.js')))
    .forEach((file) => {
      const model = ndtk.req(path.join(dir, file))
      model(conn)
    })
}

/**
 * schemaPlugin
 *
 * Add global options for
 * mongoose schemas
 */
const schemaPlugin = options => (schema) => {
  const { filter } = schema.options

  const toOpts = {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret._id // eslint-disable-line

      if (Array.isArray(filter)) {
        filter.forEach((key) => {
          delete ret[key] // eslint-disable-line
        })
      }
    },
  }

  Object.keys(options).map(op => schema.set(op, options[op]))
  schema.set('toJSON', toOpts)
  schema.set('toObject', toOpts)
}

/**
 * Object schemas
 * to validate configuration
 */
const schema = Joi.object({
  enabled: Joi.boolean().required(),
  debug: Joi.boolean().required(),

  paths: Joi.object({
    seed: Joi.string().required(),
    models: Joi.string().required(),
  }).required(),

  conn: Joi.object({
    uri: Joi.string().required(),
    options: Joi.object().required(),
  }).required(),

  schema: Joi.object({
    options: Joi.object().required(),
  }).required(),
})

/**
 * Initializer
 */
export default (server) => {
  // Load and sanitize config variables
  const defaults = ndtk.config(ndtk.req('./config'))
  const uncheckedConfig = merge(defaults, server.config)
  const config = sanitize(uncheckedConfig.mongo, schema, 'Invalid Mongo config')

  if (!config.enabled) return

  // Expose local configs
  // to the server object
  server.config = {
    ...server.config,
    mongo: config,
  }

  // Create new Mongoose instance
  // to allow multiple connection between
  // mounted apps
  const mongoose = new Mongoose()

  mongoose.set('debug', config.debug)
  mongoose.plugin(schemaPlugin(config.schema.options))

  // Setup paths
  const seedPath = path.join(server.root, config.paths.seed)
  const modelsPath = path.join(server.root, config.paths.models)

  // Auto load models
  loadModels(modelsPath, mongoose)

  /**
   * Database
   * API
   */
  const database = {
    /**
     * Connect
     */
    connect: async () => {
      const { conn } = config

      try {
        await mongoose.connect(conn.uri, conn.options)
        server.logger.info('MongoDB: Connected')
      } catch (e) {
        ndtk.assert(false, e)
      }
    },

    /**
     * Disconnect
     */
    disconnect: () => {
      mongoose.disconnect()
    },

    /**
     * Drop collections
     */
    drop: async () => {
      server.logger.info('MongoDB: Dropping collections...')
      const promises = Object.values(mongoose.connection.collections).map(collection => collection.deleteMany())

      await Promise.all(promises)
      server.logger.info('MongoDB: Collections dropped successfully')
    },

    /**
     * Seed
     */
    seed: async () => {
      const fn = ndtk.req(seedPath)

      if (fn) {
        await database.drop()
        server.logger.info('MongoDB: Adding seed data...')

        try {
          await fn(mongoose.models, server.env)
          server.logger.info('MongoDB: Seed data added successfuly')
        } catch (e) {
          server.logger.error(e)
        }
      } else {
        ndtk.assert(false, `MongoDB Error: "${seedPath}" seed path is not valid.`)
      }
    },

    /**
     * Run
     */
    run: async (cmd) => {
      const allowed = ['seed', 'drop']

      if (allowed.includes(cmd)) {
        await database.connect()
        await database[cmd]()
        await database.disconnect()
      } else {
        ndtk.assert(false, `Command ${cmd} not allowed. Valid options: ${allowed.join(', ')}.`)
      }

      process.exit(0)
    },
  }

  // Expose Database API
  // to the server object
  server.mongo = database
  server.mongo.models = mongoose.models

  // Expose Mongoose
  server.mongoose = mongoose

  // Register connection
  server.events.on('beforeStart', database.connect)
}
