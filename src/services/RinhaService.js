import { getPgClient } from "../database/index.js"
import { getClient, getLastClientTransactions, saveTransaction, updateClient } from "../database/queries.js"

export default class RinhaService {
  constructor({ pgPool }) {
    this.pgPool = pgPool
  }

  async saveTransaction(req, res) {
    const pgClient = await getPgClient(this.pgPool)
    const body = await req.json()

    try {
      if (!['d', 'c'].includes(body.tipo))
        return res.status(422).send();

      if (!Number.isInteger(body.valor))
        return res.status(422).send();

      if (!Boolean(body.descricao) || body.descricao.length > 10)
        return res.status(422).send();

      const clientId = req.path_parameters.id

      if (clientId > 5)
        return res.status(404).send();

      await pgClient.query('BEGIN')

      const result = await saveTransaction(pgClient, {
        clientId,
        valor: body.valor,
        tipo: body.tipo,
        descricao: body.descricao
      })

      await pgClient.query('COMMIT')

      if (result.rows[0].save_transaction) {
        const resultValues = result.rows[0].save_transaction.slice(1, -1).split(',')
        const limite = Number(resultValues[0])
        const saldo = Number(resultValues[1])

        return res.status(200).json({
          "limite": limite, "saldo": saldo
        });
      }

      return res.status(422).send();
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
      const clientId = req.path_parameters.id

      if (clientId > 5)
        return res.status(404).send();

      const result = await getLastClientTransactions(pgClient, req.path_parameters.id)

      const {
        saldo,
        limite,
        moment
      } = result.rows[0]

      res.status(200).json({
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
      res.status(404).send();
    } finally {
      pgClient.release()
    }
  }
}