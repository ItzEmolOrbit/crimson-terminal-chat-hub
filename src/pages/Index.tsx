
import { useState } from 'react';
import { Terminal, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

// Simple Auth Form Component
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
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 sm:p-8 bg-card border-border">
        <div className="text-center mb-6 sm:mb-8">
          <Terminal className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold mb-2">CRIMSON CONSOLE</h1>
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
              className="font-mono"
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
                className="font-mono"
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
              className="font-mono"
              required
            />
          </div>
          
          <Button 
            type="submit"
            className="w-full font-mono"
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

// Simple Chat Interface Component
const ChatInterface = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Terminal className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold">CRIMSON CONSOLE</h1>
              <p className="text-sm text-muted-foreground">
                USER: {user?.user_metadata?.username || user?.email}
              </p>
            </div>
          </div>
          <Button onClick={signOut} variant="outline">
            Sign Out
          </Button>
        </div>
      </div>
      
      <div className="flex-1 p-4">
        <div className="text-center text-muted-foreground">
          <p>Chat interface will be implemented here.</p>
          <p>Welcome to Crimson Console!</p>
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
          <p className="font-mono">INITIALIZING SECURE CONNECTION...</p>
        </div>
      </div>
    );
  }

  return user ? <ChatInterface /> : <AuthForm />;
};

export default Index;
