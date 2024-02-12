import pg from 'pg';

const pgPool = new pg.Pool({
  host: process.env.DB_HOSTNAME,
  port: 5432,
  database: 'rinha',
  user: 'admin',
  keepAlive: true,
  password: '123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
})

export const getPgClient = async (pool) => {
  try {
    const client = await pool.connect()

    console.log({
      client
    })

    return client
  } catch (err) {
    console.error('Error on get pg client')
  }

}

export default pgPool