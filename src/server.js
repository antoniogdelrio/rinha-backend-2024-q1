import pgPool, { getPgClient } from './database/index.js';
import RinhaService from './services/RinhaService.js';
import HyperExpress from 'hyper-express';
const webserver = new HyperExpress.Server();

const rinhaService = new RinhaService({
  pgPool
})

webserver.post('/clientes/:id/transacoes', async (req, res) => {
  await rinhaService.saveTransaction(req, res)
})

webserver.get('/clientes/:id/extrato', async (req, res) => {
  await rinhaService.getBankStatement(req, res)
})

webserver.listen(process.env.PORT)
  .then((socket) => {
    console.log('Webserver started on port ' + process.env.PORT)
    Promise.all(Array(15).fill().map(() => getPgClient(pgPool))).then((clients) => {
      clients.forEach(cl => cl.release())
      console.log("Server warmed up!")
    })
  })
  .catch(() => console.log('Failed to start webserver on port ' + process.env.PORT));