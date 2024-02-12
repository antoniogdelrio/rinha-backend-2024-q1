import express from 'express'
import pgPool from './database/index.js';
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

app.listen(8080, () => {
  console.log('Server listening in port 8080')
})
