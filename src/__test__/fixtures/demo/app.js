import expressio, { httpError } from 'expressio'
import mongo from '@'

const app = expressio()
app.initialize('mongo', mongo)

app.post('/user', async (req, res) => {
  const { body } = req
  const { models } = req.app.mongo

  const user = await models.User.create({ ...body })
  res.json(user)
})

app.get('/user/:email', async (req, res) => {
  const { params } = req
  const { models } = req.app.mongo

  const user = await models.User.findOne({ email: params.email })
  if (!user) throw httpError(400, { message: 'User does not exist' })
  res.json(user)
})

export default app
