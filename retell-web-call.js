// Retell Web Call Module
// Использует Retell Web SDK для голосовых звонков

let retellWebClient = null;
let isCallActive = false;

// Динамический импорт Retell Web SDK
async function loadRetellSDK() {
  if (retellWebClient) {
    return retellWebClient;
  }

  try {
    // Пытаемся использовать CDN версию SDK
    // Если SDK доступен как глобальный объект, используем его
    if (window.RetellWebClient) {
      const { RetellWebClient } = window;
      retellWebClient = new RetellWebClient();
      return retellWebClient;
    }

    // Если SDK нужно импортировать через модуль
    // Для production лучше использовать bundler
    console.warn('Retell Web SDK должен быть подключен');
    return null;
  } catch (error) {
    console.error('Error loading Retell SDK:', error);
    return null;
  }
}

// Инициализация SDK
export async function initRetellSDK() {
  retellWebClient = await loadRetellSDK();
  return retellWebClient !== null;
}

// Создание web call (через серверный endpoint)
export async function createWebCall(agentId, endpoint = '/api/create-web-call') {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: agentId
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create web call');
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error creating web call:', error);
    throw error;
  }
}

// Старт звонка
export async function startWebCall(agentId, endpoint) {
  if (isCallActive) {
    throw new Error('Call is already active');
  }

  try {
    // Убеждаемся, что SDK загружен
    if (!retellWebClient) {
      const loaded = await initRetellSDK();
      if (!loaded) {
        throw new Error('Retell Web SDK not available. Please ensure SDK is loaded.');
      }
    }

    // Получаем access token
    const accessToken = await createWebCall(agentId, endpoint);

    // Стартуем звонок
    await retellWebClient.startCall({
      accessToken: accessToken
    });

    isCallActive = true;

    // Настраиваем обработчики событий
    retellWebClient.on('call_started', () => {
      console.log('Call started');
      if (window.onRetellCallStarted) {
        window.onRetellCallStarted();
      }
    });

    retellWebClient.on('call_ended', () => {
      console.log('Call ended');
      isCallActive = false;
      if (window.onRetellCallEnded) {
        window.onRetellCallEnded();
      }
    });

    retellWebClient.on('error', (error) => {
      console.error('Call error:', error);
      isCallActive = false;
      if (window.onRetellCallError) {
        window.onRetellCallError(error);
      }
    });

    return true;
  } catch (error) {
    console.error('Error starting web call:', error);
    isCallActive = false;
    throw error;
  }
}

// Остановка звонка
export function stopWebCall() {
  if (retellWebClient && isCallActive) {
    try {
      retellWebClient.stopCall();
    } catch (error) {
      console.error('Error stopping call:', error);
    }
    isCallActive = false;
  }
}

// Получить статус звонка
export function getCallStatus() {
  return isCallActive;
}
