import Retell from 'retell-sdk';

export default async function handler(req, res) {
  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Получаем API ключ из переменных окружения
    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey) {
      console.error('RETELL_API_KEY is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Инициализируем Retell SDK
    const retellClient = new Retell({
      apiKey: apiKey,
    });

    // Получаем agent_id из тела запроса
    const { agent_id } = req.body;
    
    if (!agent_id) {
      return res.status(400).json({ error: 'agent_id is required' });
    }

    // Создаем web call через Retell API
    const webCallResponse = await retellClient.call.createWebCall({
      agent_id: agent_id,
    });

    // Возвращаем access_token клиенту
    return res.status(200).json({
      access_token: webCallResponse.access_token,
      call_id: webCallResponse.call_id,
    });

  } catch (error) {
    console.error('Error creating web call:', error);
    return res.status(500).json({ 
      error: 'Failed to create web call',
      message: error.message || 'Unknown error'
    });
  }
}
