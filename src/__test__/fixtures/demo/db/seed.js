export default async function (models /* env */) {
  await models.User.create({ name: 'Joe Doe', email: 'jon@mail.com' })
  await models.User.create({ name: 'Jane Doe', email: 'jane@mail.com' })
}
