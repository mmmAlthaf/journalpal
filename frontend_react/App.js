import { StyleSheet, SafeAreaView,FlatList, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios'; 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
  },
  button: {
    backgroundColor: '#1e90ff',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  entry: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 25,
  },
  chatContainer: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    backgroundColor: 'white',
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#1e90ff',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  sendButtonText: {
    color: 'white',
  },
});

const renderMessage = (message, index) => {
  const isUser = message.role === 'user';
  return (
    <View
      key={index}
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        backgroundColor: isUser ? '#1e90ff' : '#f1f1f1',
        borderRadius: 5,
        padding: 10,
        marginVertical: 5,
        marginHorizontal: 10,
      }}
    >
      <Text style={{ color: isUser ? 'white' : 'black' }}>{message.content}</Text>
    </View>
  );
};

const saveEntries = async (newEntries) => {
  try {
    await AsyncStorage.setItem('entries', JSON.stringify(newEntries));
  } catch (error) {
    console.error('Error saving entries:', error);
  }
};

const HomePage = ({ entries, setEntries }) => {
  const [text, setText] = useState('');

  const onSubmit = async () => {
    if (text === '') return;
    var day = new Date().getDate(); //To get the Current Date

    const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
    ];
  
    const d = new Date();
    var month = monthNames[d.getMonth()]

    const newEntry = {
      text,
      date: new Date().toLocaleDateString(),
    };

    const updatedEntries = [...entries, newEntry];
    setEntries(updatedEntries);
    saveEntries(updatedEntries);
    setText('');

    const userMessage = { role: 'user', content: "Hello! On " + month + " " + day +" I did the following action below. Please summarize them for me and keep track of this context with the date I mentioned. Save this summary as what I did that day. \n" + text };
    
    try {
      const response = await axios.post('http://localhost:5000/chat', { user_input: userMessage.content });
      const aiMessage = { role: 'assistant', content: response.data.ai_response };
      console.log(aiMessage)
    } catch (error) {
      console.error('Error sending message:', error);
    }

  };

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Write your journal entry"
      />
      <TouchableOpacity style={styles.button} onPress={onSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const EntriesPage = ({entries}) => {

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={entries}
        renderItem={({ item }) => (
          <View style={styles.entry}>
            <Text>
              {item.date}: {item.text}
            </Text>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
    </SafeAreaView>
  );
};

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (inputText.trim() === '') return;

    const userMessage = { role: 'user', content: inputText };
    setMessages([...messages, userMessage]);

    setInputText('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/chat', { user_input: userMessage.content });
      const aiMessage = { role: 'assistant', content: response.data.ai_response };
      setMessages([...messages, userMessage, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    }

    setIsLoading(false);
  };
  
    return (
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 85 : 0}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
          {messages.map(renderMessage)}
        </ScrollView>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={inputText}
            onChangeText={setInputText}
            editable={!isLoading}
          />
          <TouchableOpacity onPress={sendMessage} disabled={isLoading} style={styles.sendButton}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
    
};

const Tab = createBottomTabNavigator();

export default function App() {
  const [entries, setEntries] = useState([]);
  const loadEntries = async () => {
    try {
      const storedEntries = await AsyncStorage.getItem('entries');
      if (storedEntries !== null) {
        setEntries(JSON.parse(storedEntries));
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home">
          {(props) => <HomePage {...props} entries={entries} setEntries={setEntries} />}
        </Tab.Screen>
        <Tab.Screen name="Entries">
          {(props) => <EntriesPage {...props} entries={entries} />}
        </Tab.Screen>
        <Tab.Screen name="Chat" component={ChatPage} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

