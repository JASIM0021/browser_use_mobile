import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Message = {
  role: 'user' | 'agent';
  content: string;
};

type Settings = {
  apiKey: string;
  model: string;
  serverUrl: string;
};

const defaultSettings: Settings = {
  apiKey: '',
  model: 'gpt-4-mini',
  serverUrl: 'http://localhost:8000', // Replace this with your Mac's LAN IP
};

export default function App() {
  const [input, setInput] = useState('');
  const [chat, setChat] = useState<Message[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [showSetup, setShowSetup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('agent_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      } else {
        setShowSetup(true);
      }
    } catch (e) {
      Alert.alert('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    await AsyncStorage.setItem('agent_settings', JSON.stringify(newSettings));
    setSettings(newSettings);
    setShowSetup(false);
    setShowSettings(false);
  };
  const getKey = async () => {
    const saved = await AsyncStorage.getItem('agent_settings');
    if (saved) {
      const settings = JSON.parse(saved);
      return settings.apiKey;
    }
    return '';
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const newChat = [...chat, { role: 'user', content: input }];
    setChat(newChat);
    setInput('');

    try {
      const res = await fetch(`${settings.serverUrl}/run-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: input,
          apiKey: settings.apiKey,
          model: settings.model,
        }),
      });

      const data = await res.json();
      console.log('Server response:', data);

      newChat.push({
        role: 'agent',
        content:
          data.status === 'success'
            ? `✅ Task completed: ${data.task}`
            : `❌ Error: ${data.message || 'Unknown error'}`,
      });

      setChat([...newChat]);
    } catch (err) {
      console.log('API call failed', err);
      newChat.push({
        role: 'agent',
        content: '❌ Failed to connect to server.',
      });
      setChat([...newChat]);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.message,
        item.role === 'user' ? styles.userMessage : styles.agentMessage,
      ]}
    >
      <Text style={styles.messageText}>
        <Text style={{ fontWeight: 'bold' }}>
          {item.role === 'user' ? 'You' : 'Agent'}:
        </Text>{' '}
        {item.content}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <Text style={{ marginTop: 100, textAlign: 'center' }}>Loading...</Text>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>🤖 Assistant</Text>

      <FlatList
        data={chat}
        renderItem={renderMessage}
        keyExtractor={(_, index) => index.toString()}
        style={styles.chat}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a command..."
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSubmit}
        />
        <Button title="Send" onPress={handleSubmit} />
        <TouchableOpacity onPress={() => setShowSettings(true)}>
          <Text style={styles.gear}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showSetup || showSettings}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>🛠 Setup Assistant</Text>

          <TextInput
            placeholder="OpenAI API Key"
            style={styles.modalInput}
            value={settings.apiKey}
            secureTextEntry
            onChangeText={text => setSettings({ ...settings, apiKey: text })}
          />
          <TextInput
            placeholder="Model (e.g. gpt-4-mini)"
            style={styles.modalInput}
            value={settings.model}
            onChangeText={text => setSettings({ ...settings, model: text })}
          />
          <TextInput
            placeholder="Server URL (e.g. http://192.168.1.100:8000)"
            style={styles.modalInput}
            value={settings.serverUrl}
            onChangeText={text => setSettings({ ...settings, serverUrl: text })}
          />

          <View style={styles.modalButtons}>
            <Button title="Save" onPress={() => saveSettings(settings)} />
            {showSettings && (
              <Button
                title="Cancel"
                onPress={() => setShowSettings(false)}
                color="#aaa"
              />
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  chat: {
    flex: 0.6,
    marginBottom: 10,
  },
  message: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
    maxWidth: '85%',
  },
  userMessage: {
    backgroundColor: '#d6f5ff',
    alignSelf: 'flex-end',
  },
  agentMessage: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
  },
  inputRow: {
    flex: 0.4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 10,
    borderRadius: 6,
    marginRight: 6,
  },
  gear: {
    fontSize: 24,
    paddingHorizontal: 10,
  },
  modalView: {
    marginTop: 100,
    marginHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
