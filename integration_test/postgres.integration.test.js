const pg = require('pg')

const {test} = require('ava')
const base = require('./datasource.integration.test.base')

const context = {
  helper: undefined
}

test.before(async t => {
  await cleanMemeolistDatabase(t)

  const Helper = require('./helper')
  const helper = new Helper()

  await helper.initialize()

  // delete the all the config 1-time before starting the tests
  await helper.deleteConfig()
  await helper.feedConfig('complete.postgres.valid.memeo')
  await helper.triggerReload()

  context.helper = helper
})

base(context)

async function cleanMemeolistDatabase (t) {
  t.log('Going to prepare memeolist database for the integration tests')

  const {Client} = pg

  const memeoListDbHost = process.env.MEMEOLIST_DB_HOST || '127.0.0.1'
  const memeoListDbPort = process.env.MEMEOLIST_DB_PORT || '15432'

  const client = new Client({
    user: 'postgresql',
    password: 'postgres',
    database: 'memeolist_db',
    host: memeoListDbHost,
    port: memeoListDbPort
  })

  try {
    await client.connect()
    await client.query('SELECT 1')
  } catch (err) {
    t.log('Unable to connect memeolist database for preparing it for the integration tests')
    throw err
  }

  try {
    // language=SQL
    await client.query(`
      DROP TABLE IF EXISTS "Meme";
      DROP TABLE IF EXISTS "Profile";

      CREATE TABLE "Profile" (
        "id"          SERIAL PRIMARY KEY     NOT NULL,
        "email"       CHARACTER VARYING(500) NOT NULL,
        "displayName" CHARACTER VARYING(500) NOT NULL,
        "biography"   CHARACTER VARYING(500) NOT NULL,
        "avatarUrl"   CHARACTER VARYING(500) NOT NULL
      );

      CREATE TABLE "Meme" (
        "id"       SERIAL PRIMARY KEY                NOT NULL,
        "photoUrl" CHARACTER VARYING(500)            NOT NULL,
        "ownerId"  INTEGER REFERENCES "Profile" ("id")
      );
    `)
  } catch (err) {
    t.log('Error while preparing memeolist database for the integration tests')
    throw err
  }

  await client.end()
}
