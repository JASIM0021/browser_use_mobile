// Storage keys
const STORAGE_KEYS = {
  MODEL: 'assistant_model',
  API_KEY: 'assistant_api_key',
  SERVER_URL: 'assistant_server_url',
  IS_FIRST_VISIT: 'assistant_first_visit',
};

// DOM Elements
const welcomeModal = document.getElementById('welcomeModal');
const settingsModal = document.getElementById('settingsModal');
const settingsButton = document.getElementById('settingsButton');
const saveSettingsButton = document.getElementById('saveSettings');
const saveWelcomeSettingsButton = document.getElementById(
  'saveWelcomeSettings',
);
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// Check if it's the first visit
if (!localStorage.getItem(STORAGE_KEYS.IS_FIRST_VISIT)) {
  welcomeModal.classList.remove('hidden');
  localStorage.setItem(STORAGE_KEYS.IS_FIRST_VISIT, 'false');
} else {
  welcomeModal.classList.add('hidden');
}

// Event Listeners
settingsButton.addEventListener('click', () => {
  settingsModal.classList.remove('hidden');
  loadSettings();
});

saveSettingsButton.addEventListener('click', saveSettings);
saveWelcomeSettingsButton.addEventListener('click', saveWelcomeSettings);

sendButton.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') {
    handleSendMessage();
  }
});

// Functions
function loadSettings() {
  document.getElementById('modelSelect').value =
    localStorage.getItem(STORAGE_KEYS.MODEL) || 'gpt-3.5-turbo';
  document.getElementById('apiKeyInput').value =
    localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  document.getElementById('serverUrlInput').value =
    localStorage.getItem(STORAGE_KEYS.SERVER_URL) || 'http://localhost:8000';
}

function saveSettings() {
  const model = document.getElementById('modelSelect').value;
  const apiKey = document.getElementById('apiKeyInput').value;
  const serverUrl = document.getElementById('serverUrlInput').value;

  localStorage.setItem(STORAGE_KEYS.MODEL, model);
  localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
  localStorage.setItem(STORAGE_KEYS.SERVER_URL, serverUrl);

  settingsModal.classList.add('hidden');
}

function saveWelcomeSettings() {
  const model = document.getElementById('welcomeModelSelect').value;
  const apiKey = document.getElementById('welcomeApiKeyInput').value;
  const serverUrl = document.getElementById('welcomeServerUrlInput').value;

  localStorage.setItem(STORAGE_KEYS.MODEL, model);
  localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
  localStorage.setItem(STORAGE_KEYS.SERVER_URL, serverUrl);

  welcomeModal.classList.add('hidden');
}

function addMessage(content, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message');
  messageDiv.classList.add(isUser ? 'user-message' : 'assistant-message');
  messageDiv.textContent = content;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function handleSendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  // Add user message to chat
  addMessage(message, true);
  userInput.value = '';

  try {
    const serverUrl = localStorage.getItem(STORAGE_KEYS.SERVER_URL);
    const response = await fetch(`${serverUrl}/run-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.API_KEY)}`,
      },
      body: JSON.stringify({ task: message }),
    });

    const data = await response.json();

    if (data.status === 'success') {
      addMessage(`Task executed successfully: ${data.task}`);
    } else {
      addMessage(`Error: ${data.error || 'Unknown error occurred'}`);
    }
  } catch (error) {
    addMessage(`Error: ${error.message}`);
  }
}

// Close modals when clicking outside
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.add('hidden');
  }
});
