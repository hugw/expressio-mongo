import app from '../app'

const cmd = process.argv && process.argv[2]
app.mongo.run(cmd)
