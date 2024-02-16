export const saveTransaction = async (pgClient, {
  clientId,
  valor,
  tipo,
  descricao
}) => {

  return (await pgClient.query(
    'INSERT INTO transacoes (client_id, valor, tipo, descricao, data_transacao) VALUES ($1, $2, $3, $4, NOW())',
    [clientId, valor, tipo, descricao]
  ))
}

export const getClient = async (pgClient, clientId) => {
  const res = (await pgClient.query(
    'SELECT * FROM clientes WHERE id = $1 FOR UPDATE', [clientId]
  ))

  return res.rows[0]
}

export const updateClient = async (pgClient, clientId, valor) => {
  const res = await pgClient.query(
    'UPDATE clientes SET saldo = saldo + $1 WHERE id = $2 RETURNING saldo',
    [valor, clientId]
  )

  return res.rows[0]
}

export const getLastClientTransactions = async (pgClient, clientId) => {
  return (await pgClient.query(
    `SELECT *, NOW() as moment FROM clientes
    LEFT JOIN transacoes ON clientes.id = transacoes.client_id
    WHERE clientes.id = $1
    ORDER BY transacoes.data_transacao DESC LIMIT 10`,
    [clientId]
  ))
}