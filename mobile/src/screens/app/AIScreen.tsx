import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../../contexts/ToastContext';
import { useAnalytics } from '../../lib/analytics';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

const SUGGESTED_PROMPTS = [
  "What's my schedule for today?",
  "How am I doing on my health goals?",
  "Any financial insights for me?",
  "Help me plan my learning session",
  "What's trending in my social circle?",
];

export default function AIScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const navigation = useNavigation();
  const { addToast } = useToast();
  const { trackEvent } = useAnalytics();

  const userId = 'user123'; // In real app, get from auth context

  const { data: conversationData, refetch: refetchConversation } = useQuery({
    queryKey: ['conversation', userId],
    queryFn: async () => {
      // In real app, this would call the API
      return { messages: [] };
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // In real app, this would call the AI service
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      return {
        id: Date.now().toString(),
        content: `AI response to: ${message}`,
        role: 'assistant' as const,
        timestamp: new Date().toISOString(),
      };
    },
    onSuccess: (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      setInputMessage('');
      trackEvent('ai_message_sent');
    },
    onError: (error) => {
      addToast({
        title: 'Error',
        description: 'Failed to send message.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsTyping(false);
    },
  });

  useEffect(() => {
    if (conversationData?.messages) {
      setMessages(conversationData.messages);
    }
  }, [conversationData]);

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      await sendMessageMutation.mutateAsync(inputMessage);
    } catch (error) {
      setIsTyping(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputMessage(prompt);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.role === 'user' ? styles.userMessage : styles.assistantMessage
    ]}>
      <Text style={[
        styles.messageText,
        item.role === 'user' ? styles.userMessageText : styles.assistantMessageText
      ]}>
        {item.content}
      </Text>
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );

  const renderSuggestedPrompts = () => (
    <View style={styles.suggestedContainer}>
      <Text style={styles.suggestedTitle}>Try asking:</Text>
      {SUGGESTED_PROMPTS.map((prompt, index) => (
        <TouchableOpacity
          key={index}
          style={styles.suggestedPrompt}
          onPress={() => handleSuggestedPrompt(prompt)}
        >
          <Text style={styles.suggestedPromptText}>{prompt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Assistant</Text>
        <Text style={styles.headerSubtitle}>Your intelligent companion</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        ListEmptyComponent={renderSuggestedPrompts}
      />

      {isTyping && (
        <View style={styles.typingContainer}>
          <ActivityIndicator size="small" color="#275AF4" />
          <Text style={styles.typingText}>AI is thinking...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Ask me anything..."
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={500}
          onSubmitEditing={handleSendMessage}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputMessage.trim() || sendMessageMutation.isLoading) && styles.sendButtonDisabled
          ]}
          onPress={handleSendMessage}
          disabled={!inputMessage.trim() || sendMessageMutation.isLoading}
        >
          <Text style={styles.sendButtonText}>
            {sendMessageMutation.isLoading ? '...' : 'Send'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F1724',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#275AF4',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  assistantMessageText: {
    color: '#0F1724',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  suggestedContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  suggestedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F1724',
    marginBottom: 16,
  },
  suggestedPrompt: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    width: '90%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestedPromptText: {
    fontSize: 16,
    color: '#0F1724',
    textAlign: 'center',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  typingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748B',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#275AF4',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});