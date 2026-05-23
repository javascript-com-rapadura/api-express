const express = require('express');
const { calcularDesconto, calcularFrete, debitarSaldo } = require('./services/pedidoService');
const app = express();
app.use(express.json());

const initialUsuarios = [
  { id: 1, nome: "João Silva", tipo: "VIP", saldo: 100 },
  { id: 2, nome: "Maria Souza", tipo: "NORMAL", saldo: 50 },
  { id: 3, nome: "Ana Santos", tipo: "VIP", saldo: 10 }
];

const initialPedidos = [
  { id: 1, usuarioId: 1, valorFinal: 85.00, status: "APROVADO" },
  { id: 2, usuarioId: 2, valorFinal: 105.00, status: "APROVADO" },
  { id: 3, usuarioId: 99, valorFinal: 30.00, status: "APROVADO" },
  { id: 4, usuarioId: 1, valorFinal: 10.00, status: "APROVADO" },
  { id: 5, usuarioId: 2, valorFinal: 100.00, status: "APROVADO" },
  { id: 6, usuarioId: 3, valorFinal: 300.00, status: "REPROVADO" },
];

let usuarios = [...initialUsuarios];
let pedidos = [...initialPedidos];

app.resetState = () => {
  usuarios = JSON.parse(JSON.stringify(initialUsuarios));
  pedidos = JSON.parse(JSON.stringify(initialPedidos));
};

app.get('/pedidos', (req, res) => {
  res.send(pedidos);
})

app.post('/pedidos', async (req, res) => {
  const { usuarioId, valorTotal, cepDestino } = req.body;

  if (!usuarioId || !valorTotal) {
    return res.status(400).json({ erro: "Dados inválidos" });
  }

  const usuario = usuarios.find(u => u.id === usuarioId);
  if (!usuario) {
    return res.status(404).json({ erro: "Usuário não encontrado" });
  }

  let valorFinal = calcularDesconto(usuario.tipo, valorTotal);

  try {
    const frete = await calcularFrete(cepDestino);
    valorFinal += frete;
  } catch (error) {
    if (error.message === "CEP_INVALIDO") {
      return res.status(400).json({ erro: "CEP inválido" });
    }
    return res.status(500).json({ erro: "Erro ao calcular frete externo" });
  }

  try {
    debitarSaldo(usuario, valorFinal);
  } catch (error) {
    return res.status(400).json({ erro: "Saldo insuficiente" });
  }

  const novoPedido = {
    id: pedidos.length + 1,
    usuarioId,
    valorFinal,
    status: "APROVADO"
  };
  pedidos.push(novoPedido);

  return res.status(201).json(novoPedido);
});

app.get('/pedidos/:id', (req, res) => {
  const pedido = pedidos.find(p => p.id == req.params.id);

  if (!pedido) {
    return res.status(404).json({ erro: "Pedido não encontrado" });
  }

  const donoPedido = usuarios.find(u => u.id === pedido.usuarioId);

  res.json({
    pedido,
    cliente: donoPedido ? donoPedido.nome : "Desconhecido"
  });
});

module.exports = app;