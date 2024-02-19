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
        return res.code(422).send();

      if (!Number.isInteger(req.body.valor))
        return res.code(422).send();

      if (!Boolean(req.body.descricao) || req.body.descricao.length > 10)
        return res.code(422).send();

      const clientId = req.params.id

      await pgClient.query('BEGIN')

      const result = await saveTransaction(pgClient, {
        clientId,
        valor: req.body.valor,
        tipo: req.body.tipo,
        descricao: req.body.descricao
      })

      await pgClient.query('COMMIT')

      if (result.rows[0].save_transaction) {
        const resultValues = result.rows[0].save_transaction.slice(1, -1).split(',')
        const limite = Number(resultValues[0])
        const saldo = Number(resultValues[1])

        return res.code(200).send({
          "limite": limite, "saldo": saldo
        });
      }

      return res.code(422).send();
    } catch (err) {
      console.error(err)
      await pgClient.query('ROLLBACK')
      res.code(422).send();
    } finally {
      pgClient.release()
    }
  }

  async getBankStatement(req, res) {
    const pgClient = await getPgClient(this.pgPool)

    try {
      const result = await getLastClientTransactions(pgClient, req.params.id)

      const {
        saldo,
        limite,
        moment
      } = result.rows[0]

      res.code(200).send({
        saldo: {
          total: saldo,
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
      res.code(404).send();
    } finally {
      pgClient.release()
    }
  }
}