import pgPool, { getPgClient } from './database/index.js';
import RinhaService from './services/RinhaService.js';

const rinhaService = new RinhaService({
  pgPool
})

import Fastify from 'fastify'
const fastify = Fastify()

fastify.post('/clientes/:id/transacoes', async function handler(req, res) {
  await rinhaService.saveTransaction(req, res)
})

fastify.get('/clientes/:id/extrato', async function handler(req, res) {
  await rinhaService.getBankStatement(req, res)
})

try {
  await fastify.listen({ port: process.env.PORT })
  Promise.all(Array(15).fill().map(() => getPgClient(pgPool))).then((clients) => {
    clients.forEach(cl => cl.release())
    console.log("Server warmed up!")
  })
} catch (err) {
  process.exit(1)
}