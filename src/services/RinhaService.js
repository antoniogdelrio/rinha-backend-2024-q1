import { getPgClient } from "../database/index.js"
import { getClient, getLastClientTransactions, saveTransaction, updateClient } from "../database/queries.js"

export default class RinhaService {
  constructor({ pgPool }) {
    this.pgPool = pgPool
  }

  async saveTransaction(req, res) {
    const pgClient = await getPgClient(this.pgPool)

    try {
      if (!['d', 'c'].includes(req.body.tipo))
        throw new Error()

      if (!Number.isInteger(req.body.valor))
        throw new Error()

      if (!Boolean(req.body.descricao) || req.body.descricao.length > 10)
        throw new Error()

      const clientId = req.params.id
      const getSignal = req.body.tipo === 'd' ? -1 : 1

      await pgClient.query('BEGIN')

      const { limite, saldo_inicial } = await getClient(pgClient, clientId)

      if (req.body.tipo === 'd') {
        if ((saldo_inicial - req.body.valor) < limite * -1) {
          await pgClient.query('COMMIT')
          return res.status(422).send()
        }
      }

      await saveTransaction(pgClient, {
        clientId,
        valor: req.body.valor,
        tipo: req.body.tipo,
        descricao: req.body.descricao
      })

      const updatedData = await updateClient(pgClient, clientId, (getSignal) * req.body.valor)

      await pgClient.query('COMMIT')

      res.status(200).json({
        "limite": limite, "saldo": updatedData.saldo_inicial
      });
    } catch (err) {
      await pgClient.query('ROLLBACK')
      res.status(422).send();
    } finally {
      pgClient.release()
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
        ultimas_transacoes: result.rows[0].tipo ? result.rows.map((row) => ({
          valor: row.valor,
          tipo: row.tipo,
          descricao: row.descricao,
          realizada_em: row.data_transacao
        })) : []
      });
    } catch (err) {
      res.status(404).send();
    } finally {
      pgClient.release()
    }
  }
}