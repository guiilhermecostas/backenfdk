import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('🚀 Backend AbacatePay está rodando!');
});

// Rota para criar pagamento (se necessário futuramente)
app.post('/abacatepay', async (req, res) => {
  try {
    const response = await fetch('https://api.abacatepay.com/v1/pixQrCode/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ABACATEPAY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const result = await response.json();
    res.status(response.status).json(result);
  } catch (err) {
    console.error('Erro ao chamar AbacatePay:', err);
    res.status(500).json({ error: 'Erro ao processar pagamento' });
  }
});

app.get('/abacatepay/v1/pixQrCode/check', async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID da transação não informado' });
  }

  if (!process.env.ABACATEPAY_TOKEN) {
    return res.status(500).json({ error: 'Token da AbacatePay não configurado' });
  }

  try {
    const response = await fetch(`https://api.abacatepay.com/v1/pixQrCode/check?id=${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.ABACATEPAY_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const contentType = response.headers.get('content-type') || '';

    // Proteção contra resposta malformada (HTML em vez de JSON)
    if (!contentType.includes('application/json')) {
      const text = await response.text(); // lê o HTML
      console.error('❌ A API retornou HTML:', text.slice(0, 200));
      return res.status(502).json({ error: 'Resposta inválida da AbacatePay', html: true });
    }

    const result = await response.json();

    if (!response.ok) {
      return res.status(502).json({ error: 'Erro da AbacatePay', detalhes: result });
    }

    res.json(result);
  } catch (err) {
    console.error('Erro ao checar status na AbacatePay:', err.message || err);
    res.status(500).json({ error: 'Erro ao checar status do pagamento' });
  }
});
