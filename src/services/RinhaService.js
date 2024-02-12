import { getPgClient } from "../database/index.js"
import { getClient, getLastClientTransactions, saveTransaction, updateClient } from "../database/queries.js"

export default class RinhaService {
  constructor({ pgPool }) {
    this.pgPool = pgPool
  }

  async saveTransaction(req, res) {
    const pgClient = await getPgClient(this.pgPool)

    try {
      const clientId = req.params.id
      const getSignal = req.body.tipo === 'd' ? -1 : 1

      const { limite, saldo_inicial } = await getClient(pgClient, clientId)

      if (req.body.tipo === 'd') {
        if ((saldo_inicial - req.body.valor) < limite * -1) {
          return res.status(422).send()
        }
      }

      await pgClient.query('BEGIN')

      await saveTransaction(pgClient, {
        clientId,
        valor: req.body.valor,
        tipo: req.body.tipo,
        descricao: req.body.descricao
      })

      await pgClient.query('COMMIT')

      const updatedData = await updateClient(pgClient, clientId, (getSignal) * req.body.valor)

      await pgClient.query('COMMIT')

      res.status(200).json({
        "limite": limite, "saldo": updatedData.saldo_inicial
      });
    } catch (err) {
      console.error(err)
      await pgClient.query('ROLLBACK')
      res.status(404).send();
    }
  }

  async getBankStatement(req, res) {
    const pgClient = await getPgClient(this.pgPool)

    try {
      const result = await getLastClientTransactions(pgClient, req.params.id)

      const {
        saldo_inicial,
        limite,
        moment
      } = result.rows[0]

      res.status(200).json({
        saldo: {
          total: saldo_inicial,
          data_extrato: moment,
          limite
        },
        ultimas_transacoes: result.rows.map((row) => ({
          valor: row.valor,
          tipo: row.tipo,
          descricao: row.descricao,
          realizada_em: row.data_transacao
        }))
      });
    } catch (err) {
      res.status(404).send();
    }
  }
}