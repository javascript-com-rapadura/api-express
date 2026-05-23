const axios = require('axios');

function calcularDesconto(usuarioTipo, valorTotal) {
  let valorFinal = valorTotal;
  if (usuarioTipo === "VIP") {
    valorFinal = valorTotal * 0.90;
    valorFinal = valorFinal - 50;
  }
  return valorFinal;
}

async function calcularFrete(cepDestino) {
  try {
    const response = await axios.get(`https://viacep.com.br/ws/${cepDestino}/json/`);

    if (response.data && response.data.erro) {
      throw new Error("CEP_INVALIDO");
    }

    let frete = 20;
    if (response.data.uf === "SP") {
      frete = 5;
    } else if (response.data.uf === "CE") {
      frete = 40;
    }

    return frete;
  } catch (error) {
    if (error.message === "CEP_INVALIDO") {
      throw error;
    }
    // Qualquer erro de rede do Axios cairá aqui
    throw new Error("ERRO_VIACEP");
  }
}

function debitarSaldo(usuario, valorFinal) {
  if (usuario.saldo < valorFinal) {
    throw new Error("SALDO_INSUFICIENTE");
  }
  usuario.saldo -= valorFinal;
}

module.exports = {
  calcularDesconto,
  calcularFrete,
  debitarSaldo
};
