
import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Users, Terminal, Lock, Wifi, WifiOff, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRealtime } from '@/hooks/useRealtime';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import MediaPlayer from '@/components/MediaPlayer';
import MediaUploader from '@/components/MediaUploader';

// Auth Components
const AuthForm = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignIn) {
        await signIn(email, password);
      } else {
        await signUp(email, password, username);
      }
    } catch (error) {
      // Error handling is done in the auth hook
    } finally {
      setLoading(false);
    }
  };

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
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-primary">
              EMAIL:
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email..."
              className="font-mono bg-input border-border text-foreground"
              required
            />
          </div>

          {!isSignIn && (
            <div>
              <label className="block text-sm font-medium mb-2 text-primary">
                USERNAME:
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose username..."
                className="font-mono bg-input border-border text-foreground"
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2 text-primary">
              PASSWORD:
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              className="font-mono bg-input border-border text-foreground"
              required
            />
          </div>
          
          <Button 
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono"
            disabled={loading}
          >
            {loading ? 'PROCESSING...' : (isSignIn ? '>>> SIGN IN' : '>>> SIGN UP')}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full font-mono text-sm"
            onClick={() => setIsSignIn(!isSignIn)}
          >
            {isSignIn ? 'Need an account? Sign Up' : 'Have an account? Sign In'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

// Main Chat Interface
const ChatInterface = () => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [roomId] = useState('general');
  
  const { user, signOut } = useAuth();
  const { messages, onlineUsers, typingUsers, sendMessage, updateTypingStatus } = useRealtime(roomId);
  const { uploadFile, uploading } = useMediaUpload();
  const { toast } = useToast();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send text message
  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    await sendMessage(currentMessage);
    setCurrentMessage('');
  };

  // Handle typing
  const handleTyping = () => {
    updateTypingStatus(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 2000);
  };

  // Handle file selection
  const handleFileSelect = async (file: File, type: 'image' | 'video' | 'audio') => {
    const mediaUrl = await uploadFile(file);
    if (mediaUrl) {
      await sendMessage(`[${type.toUpperCase()} FILE]`, type, mediaUrl);
      setShowMediaUploader(false);
    }
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

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], `voice-${Date.now()}.wav`, { type: 'audio/wav' });
        
        const mediaUrl = await uploadFile(audioFile);
        if (mediaUrl) {
          await sendMessage('[VOICE MESSAGE]', 'audio', mediaUrl);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "SECURE RECORDING ACTIVE",
        description: ">>> Voice encryption enabled",
      });
    } catch (error) {
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
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Terminal className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <div>
              <h1 className="text-sm sm:text-lg font-bold terminal-text">CRIMSON CONSOLE</h1>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>USER: {user?.user_metadata?.username || user?.email}</span>
                <div className="flex items-center space-x-1">
                  <Wifi className="w-3 h-3 text-primary" />
                  <span className="text-primary">ONLINE</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 text-xs sm:text-sm">
              <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <span className="text-primary">{onlineUsers.length + 1}</span>
            </div>
            <Button
              onClick={signOut}
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
            </Button>
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
                    [{new Date(message.created_at).toLocaleTimeString()}]
                  </span>
                  <span className="text-primary font-bold">
                    {(message as any).sender?.username || 'Unknown'}:
                  </span>
                  {message.encrypted && <Lock className="w-3 h-3 text-primary" />}
                </div>
                <div className="ml-2 sm:ml-4">
                  {message.message_type === 'audio' && message.media_url ? (
                    <MediaPlayer
                      type="audio"
                      src={message.media_url}
                      title="Voice Message"
                      encrypted={message.encrypted}
                    />
                  ) : message.message_type === 'image' && message.media_url ? (
                    <MediaPlayer
                      type="image"
                      src={message.media_url}
                      title="Shared Image"
                      encrypted={message.encrypted}
                    />
                  ) : message.message_type === 'video' && message.media_url ? (
                    <MediaPlayer
                      type="video"
                      src={message.media_url}
                      title="Shared Video"
                      encrypted={message.encrypted}
                    />
                  ) : (
                    <p className="terminal-text text-sm sm:text-base break-words">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            
            {typingUsers.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground ml-2 sm:ml-4">
                <span>Someone is typing</span>
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
                  className="font-mono bg-input border-border text-foreground placeholder-muted-foreground pr-10"
                  disabled={uploading}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 terminal-cursor text-primary">
                  |
                </span>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => setShowMediaUploader(!showMediaUploader)}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  disabled={uploading}
                >
                  📎
                </Button>
                
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`${isRecording ? 'bg-destructive recording-pulse' : 'bg-secondary'} text-white hover:opacity-80`}
                  disabled={uploading}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || uploading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block w-64 border-l border-border p-4">
          <h3 className="text-sm font-bold text-primary mb-4 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            ACTIVE USERS
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-primary font-medium">
                {user?.user_metadata?.username || user?.email}
              </span>
              <span className="text-muted-foreground">(you)</span>
            </div>
            
            {onlineUsers.map((presence) => (
              <div key={presence.user_id} className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-foreground">User {presence.user_id.slice(0, 8)}</span>
              </div>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="flex items-center"><Lock className="w-3 h-3 mr-1" />ENCRYPTION: ACTIVE</p>
            <p>ROOM: #{roomId}</p>
            <p>PROTOCOL: WSS</p>
            <p>STATUS: SECURE</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Terminal className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-primary font-mono">INITIALIZING SECURE CONNECTION...</p>
        </div>
      </div>
    );
  }

  return user ? <ChatInterface /> : <AuthForm />;
};

export default Index;
