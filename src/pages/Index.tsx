
import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Users, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface User {
  userId: string;
  username: string;
}

interface Message {
  id: string;
  sender: User;
  message: string;
  timestamp: string;
  type: 'text' | 'voice';
  audioData?: string;
}

interface TypingUser {
  userId: string;
  username: string;
}

const Index = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [username, setUsername] = useState('');
  const [tempUsername, setTempUsername] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket connection
  const connectWebSocket = () => {
    try {
      // For demo purposes, we'll simulate WebSocket behavior
      console.log('Attempting WebSocket connection...');
      setIsConnected(true);
      toast({
        title: "CONNECTION ESTABLISHED",
        description: ">>> WebSocket ready for backend integration",
      });
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setIsConnected(false);
      toast({
        title: "CONNECTION FAILED",
        description: ">>> Backend not available - demo mode active",
        variant: "destructive"
      });
    }
  };

  // Register user
  const handleRegister = () => {
    if (!tempUsername.trim()) {
      toast({
        title: "INVALID USERNAME",
        description: ">>> Username cannot be empty",
        variant: "destructive"
      });
      return;
    }

    // Simulate backend validation
    console.log('Registering user:', tempUsername);
    setUsername(tempUsername);
    setIsRegistered(true);
    connectWebSocket();
    
    // Add welcome message
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      sender: { userId: 'system', username: 'SYSTEM' },
      message: `Welcome to Crimson Console, ${tempUsername}! Type your message below or use voice chat.`,
      timestamp: new Date().toISOString(),
      type: 'text'
    };
    setMessages([welcomeMessage]);

    toast({
      title: "REGISTRATION SUCCESSFUL",
      description: `>>> Welcome to the console, ${tempUsername}`,
    });
  };

  // Send text message
  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: { userId: 'user1', username },
      message: currentMessage,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setMessages(prev => [...prev, newMessage]);
    setCurrentMessage('');

    // In real implementation, send via WebSocket:
    // wsRef.current?.send(JSON.stringify({
    //   type: 'sendMessage',
    //   roomId: 'general',
    //   message: currentMessage
    // }));

    console.log('Sending message:', currentMessage);
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // In real implementation, send typing status via WebSocket
    console.log('User is typing...');

    typingTimeoutRef.current = setTimeout(() => {
      console.log('User stopped typing');
    }, 1000);
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          console.log('Voice message recorded:', base64Audio.substring(0, 50) + '...');
          
          // Add voice message to chat
          const voiceMessage: Message = {
            id: Date.now().toString(),
            sender: { userId: 'user1', username },
            message: '[Voice Message]',
            timestamp: new Date().toISOString(),
            type: 'voice',
            audioData: base64Audio
          };
          setMessages(prev => [...prev, voiceMessage]);
        };
        reader.readAsDataURL(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "RECORDING ACTIVE",
        description: ">>> Voice message in progress...",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "RECORDING FAILED",
        description: ">>> Microphone access denied",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "RECORDING COMPLETE",
        description: ">>> Voice message sent",
      });
    }
  };

  // Play voice message
  const playVoiceMessage = (audioData: string) => {
    const audio = new Audio(audioData);
    audio.play().catch(console.error);
  };

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-card border-border terminal-glow">
          <div className="text-center mb-8">
            <Terminal className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold terminal-text mb-2">CRIMSON CONSOLE</h1>
            <p className="text-muted-foreground text-sm">>>> SECURE TERMINAL ACCESS</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-primary">
                USERNAME:
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
                  placeholder="Enter temporary username..."
                  className="font-mono bg-input border-border text-foreground placeholder-muted-foreground"
                  maxLength={20}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 terminal-cursor text-primary">
                  |
                </span>
              </div>
            </div>
            
            <Button 
              onClick={handleRegister}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono"
              disabled={!tempUsername.trim()}
            >
              >>> INITIALIZE SESSION
            </Button>
          </div>
          
          <div className="mt-6 text-xs text-muted-foreground text-center">
            <p>No permanent account required</p>
            <p>Session expires on disconnect</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Terminal className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold terminal-text">CRIMSON CONSOLE</h1>
              <p className="text-sm text-muted-foreground">
                USER: {username} | STATUS: {isConnected ? 'ONLINE' : 'OFFLINE'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-primary">
            <Users className="w-4 h-4" />
            <span>{onlineUsers.length + 1} ACTIVE</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-1">
                <div className="flex items-baseline space-x-2 text-xs text-muted-foreground">
                  <span className="text-primary font-medium">
                    [{new Date(message.timestamp).toLocaleTimeString()}]
                  </span>
                  <span className="text-primary font-bold">{message.sender.username}:</span>
                </div>
                <div className="ml-4">
                  {message.type === 'voice' ? (
                    <Button
                      onClick={() => message.audioData && playVoiceMessage(message.audioData)}
                      className="bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm"
                      size="sm"
                    >
                      🔊 Play Voice Message
                    </Button>
                  ) : (
                    <p className="terminal-text">{message.message}</p>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing indicators */}
            {typingUsers.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{typingUsers[0].username} is typing</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-primary rounded-full typing-dot"></div>
                  <div className="w-1 h-1 bg-primary rounded-full typing-dot"></div>
                  <div className="w-1 h-1 bg-primary rounded-full typing-dot"></div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => {
                    setCurrentMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder=">>> Type your message..."
                  className="font-mono bg-input border-border text-foreground placeholder-muted-foreground pr-12"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 terminal-cursor text-primary">
                  |
                </span>
              </div>
              
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                className={`${isRecording ? 'bg-destructive recording-pulse' : 'bg-secondary'} text-white hover:opacity-80`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              
              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar - Online Users */}
        <div className="w-64 border-l border-border p-4">
          <h3 className="text-sm font-bold text-primary mb-4 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            ACTIVE USERS
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-primary font-medium">{username}</span>
              <span className="text-muted-foreground">(you)</span>
            </div>
            
            {onlineUsers.map((user) => (
              <div key={user.userId} className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-foreground">{user.username}</span>
              </div>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          <div className="text-xs text-muted-foreground">
            <p>ROOM: #general</p>
            <p>PROTOCOL: WebSocket</p>
            <p>ENCRYPTION: Active</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
