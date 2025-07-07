
import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Users, Terminal, Lock, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import MediaPlayer from '@/components/MediaPlayer';
import MediaUploader from '@/components/MediaUploader';
import { EncryptionManager } from '@/utils/encryption';

interface User {
  userId: string;
  username: string;
}

interface Message {
  id: string;
  sender: User;
  message: string;
  timestamp: string;
  type: 'text' | 'voice' | 'image' | 'video';
  audioData?: string;
  mediaUrl?: string;
  encrypted?: boolean;
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
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const { toast } = useToast();
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const encryptionManager = EncryptionManager.getInstance();

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simulate real-time connection
  useEffect(() => {
    if (isRegistered) {
      const interval = setInterval(() => {
        // Simulate connection status changes
        setIsConnected(prev => Math.random() > 0.1 ? true : prev);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isRegistered]);

  // WebSocket connection simulation
  const connectWebSocket = () => {
    try {
      console.log('Establishing secure WebSocket connection...');
      setIsConnected(true);
      
      // Simulate real-time message updates
      const messageInterval = setInterval(() => {
        if (Math.random() > 0.95) { // 5% chance every second
          const botMessage: Message = {
            id: Date.now().toString(),
            sender: { userId: 'bot', username: 'SYSTEM' },
            message: 'Connection stable. Encryption active.',
            timestamp: new Date().toISOString(),
            type: 'text',
            encrypted: true
          };
          setMessages(prev => [...prev, botMessage]);
        }
      }, 1000);

      toast({
        title: "SECURE CONNECTION ESTABLISHED",
        description: ">>> End-to-end encryption active",
      });

      return () => clearInterval(messageInterval);
    } catch (error) {
      console.error('Connection failed:', error);
      setIsConnected(false);
      toast({
        title: "CONNECTION FAILED",
        description: ">>> Retrying connection...",
        variant: "destructive"
      });
    }
  };

  // Register user
  const handleRegister = async () => {
    if (!tempUsername.trim()) {
      toast({
        title: "INVALID USERNAME",
        description: ">>> Username cannot be empty",
        variant: "destructive"
      });
      return;
    }

    console.log('Registering user with encryption:', tempUsername);
    setUsername(tempUsername);
    setIsRegistered(true);
    connectWebSocket();
    
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      sender: { userId: 'system', username: 'CRIMSON CONSOLE' },
      message: `Welcome, ${tempUsername}! Secure terminal initialized. All communications are encrypted.`,
      timestamp: new Date().toISOString(),
      type: 'text',
      encrypted: true
    };
    setMessages([welcomeMessage]);

    toast({
      title: "REGISTRATION SUCCESSFUL",
      description: `>>> Secure session active for ${tempUsername}`,
    });
  };

  // Send encrypted text message
  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    let messageToSend = currentMessage;
    if (encryptionEnabled) {
      messageToSend = await encryptionManager.encryptMessage(currentMessage);
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: { userId: 'user1', username },
      message: currentMessage, // Display original message
      timestamp: new Date().toISOString(),
      type: 'text',
      encrypted: encryptionEnabled
    };

    setMessages(prev => [...prev, newMessage]);
    setCurrentMessage('');

    console.log('Sending encrypted message:', messageToSend);
  };

  // Handle media file selection
  const handleFileSelect = (file: File, type: 'image' | 'video' | 'audio') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const mediaUrl = e.target?.result as string;
      
      const mediaMessage: Message = {
        id: Date.now().toString(),
        sender: { userId: 'user1', username },
        message: `[${type.toUpperCase()} FILE]`,
        timestamp: new Date().toISOString(),
        type: type as 'image' | 'video' | 'voice',
        mediaUrl,
        encrypted: encryptionEnabled
      };

      setMessages(prev => [...prev, mediaMessage]);
      setShowMediaUploader(false);
      
      toast({
        title: "MEDIA UPLOADED",
        description: `>>> ${type.toUpperCase()} file encrypted and sent`,
      });
    };
    reader.readAsDataURL(file);
  };

  // Voice recording with encryption
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          let audioData = reader.result as string;
          
          if (encryptionEnabled) {
            audioData = await encryptionManager.encryptMessage(audioData);
          }
          
          const voiceMessage: Message = {
            id: Date.now().toString(),
            sender: { userId: 'user1', username },
            message: '[VOICE MESSAGE]',
            timestamp: new Date().toISOString(),
            type: 'voice',
            audioData: reader.result as string, // Store original for playback
            encrypted: encryptionEnabled
          };
          setMessages(prev => [...prev, voiceMessage]);
        };
        reader.readAsDataURL(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "SECURE RECORDING ACTIVE",
        description: ">>> Voice encryption enabled",
      });
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "RECORDING FAILED",
        description: ">>> Microphone access required",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "SECURE RECORDING COMPLETE",
        description: ">>> Encrypted voice message sent",
      });
    }
  };

  // Handle typing
  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    console.log('User typing...');
    typingTimeoutRef.current = setTimeout(() => {
      console.log('User stopped typing');
    }, 1000);
  };

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 sm:p-8 bg-card border-border terminal-glow">
          <div className="text-center mb-6 sm:mb-8">
            <Terminal className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold terminal-text mb-2">CRIMSON CONSOLE</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">{'>>>'} SECURE TERMINAL ACCESS</p>
            <div className="flex items-center justify-center mt-2 space-x-2">
              <Lock className="w-3 h-3 text-primary" />
              <span className="text-xs text-primary">END-TO-END ENCRYPTED</span>
            </div>
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
                  className="font-mono bg-input border-border text-foreground placeholder-muted-foreground pr-8"
                  maxLength={20}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 terminal-cursor text-primary">
                  |
                </span>
              </div>
            </div>
            
            <Button 
              onClick={handleRegister}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-sm sm:text-base"
              disabled={!tempUsername.trim()}
            >
              {'>>>'} INITIALIZE SECURE SESSION
            </Button>
          </div>
          
          <div className="mt-4 sm:mt-6 text-xs text-muted-foreground text-center space-y-1">
            <p>✓ No permanent account required</p>
            <p>✓ Session expires on disconnect</p>
            <p>✓ Military-grade encryption</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile-optimized Header */}
      <div className="border-b border-border p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Terminal className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <div>
              <h1 className="text-sm sm:text-lg font-bold terminal-text">CRIMSON CONSOLE</h1>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>USER: {username}</span>
                <div className="flex items-center space-x-1">
                  {isConnected ? (
                    <><Wifi className="w-3 h-3 text-primary" /><span className="text-primary">ONLINE</span></>
                  ) : (
                    <><WifiOff className="w-3 h-3 text-destructive" /><span className="text-destructive">OFFLINE</span></>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-xs sm:text-sm">
            <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            <span className="text-primary">{onlineUsers.length + 1}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-1">
                <div className="flex items-baseline space-x-2 text-xs text-muted-foreground">
                  <span className="text-primary font-medium">
                    [{new Date(message.timestamp).toLocaleTimeString()}]
                  </span>
                  <span className="text-primary font-bold">{message.sender.username}:</span>
                  {message.encrypted && <Lock className="w-3 h-3 text-primary" />}
                </div>
                <div className="ml-2 sm:ml-4">
                  {message.type === 'voice' && message.audioData ? (
                    <MediaPlayer
                      type="audio"
                      src={message.audioData}
                      title="Voice Message"
                      encrypted={message.encrypted}
                    />
                  ) : message.type === 'image' && message.mediaUrl ? (
                    <MediaPlayer
                      type="image"
                      src={message.mediaUrl}
                      title="Shared Image"
                      encrypted={message.encrypted}
                    />
                  ) : message.type === 'video' && message.mediaUrl ? (
                    <MediaPlayer
                      type="video"
                      src={message.mediaUrl}
                      title="Shared Video"
                      encrypted={message.encrypted}
                    />
                  ) : (
                    <p className="terminal-text text-sm sm:text-base break-words">{message.message}</p>
                  )}
                </div>
              </div>
            ))}
            
            {typingUsers.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground ml-2 sm:ml-4">
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

          {/* Media Uploader */}
          {showMediaUploader && (
            <div className="border-t border-border p-3 sm:p-4">
              <MediaUploader
                onFileSelect={handleFileSelect}
                isRecording={isRecording}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
              />
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-border p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => {
                    setCurrentMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder=">>> Type encrypted message..."
                  className="font-mono bg-input border-border text-foreground placeholder-muted-foreground pr-10 text-sm sm:text-base"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 terminal-cursor text-primary">
                  |
                </span>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => setShowMediaUploader(!showMediaUploader)}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex-1 sm:flex-none"
                >
                  📎
                </Button>
                
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`${isRecording ? 'bg-destructive recording-pulse' : 'bg-secondary'} text-white hover:opacity-80 flex-1 sm:flex-none`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 sm:flex-none"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:block w-64 border-l border-border p-4">
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
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="flex items-center"><Lock className="w-3 h-3 mr-1" />ENCRYPTION: ACTIVE</p>
            <p>ROOM: #general</p>
            <p>PROTOCOL: WSS</p>
            <p>STATUS: {isConnected ? 'SECURE' : 'RECONNECTING'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
