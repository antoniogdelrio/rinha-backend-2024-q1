import express from 'express'
import pgPool, { getPgClient } from './database/index.js';
import bodyParser from 'body-parser';
import RinhaService from './services/RinhaService.js';

const app = express();

app.use(bodyParser.json())

const rinhaService = new RinhaService({
  pgPool
})

app.post('/clientes/:id/transacoes', async (req, res) => {
  await rinhaService.saveTransaction(req, res)
})

app.get('/clientes/:id/extrato', async (req, res) => {
  await rinhaService.getBankStatement(req, res)
})

app.listen(process.env.PORT, () => {
  console.log("Server started in port " + process.env.PORT)
  console.log("Warming up server...")
  Promise.all(Array(15).fill().map(() => getPgClient(pgPool))).then((clients) => {
    clients.forEach(cl => cl.release())
    console.log("Server warmed up!")
  })
})
