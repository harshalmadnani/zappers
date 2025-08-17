import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { AuthGuard } from './components/AuthGuard';
import { Navbar } from './components/Navbar';
import { Explore } from './components/sections/Explore';
import { Agents } from './components/sections/Agents';
import { CreateAgent } from './components/sections/CreateAgent';
import { userService } from './lib/supabase';

function App() {
  const [activeSection, setActiveSection] = useState('explore');
  const { authenticated, user } = usePrivy();

  // Handle user authentication and Supabase integration
  useEffect(() => {
    const handleUserAuth = async () => {
      if (authenticated && user) {
        try {
          const wallet = user.wallet?.address || '';
          
          console.log('User authentication data:', { wallet, user });
          
          // Store user if we have a wallet address
          if (wallet) {
            await userService.upsertUser(wallet);
            console.log('User synced with Supabase:', { wallet });
          } else {
            console.warn('No wallet address found for user');
          }
        } catch (error) {
          console.error('Error syncing user with Supabase:', error);
        }
      }
    };

    handleUserAuth();
  }, [authenticated, user]);

  const renderSection = () => {
    switch (activeSection) {
      case 'explore':
        return <Explore />;
      case 'agents':
        return <Agents />;
      case 'create':
        return <CreateAgent />;
      default:
        return <Explore />;
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen">
        <Navbar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        
        <main className="main-content">
          {renderSection()}
        </main>
        
        {/* Background decoration */}
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 80%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(212, 175, 55, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.02) 0%, transparent 50%)
            `,
            pointerEvents: 'none',
            zIndex: -1
          }}
        />
      </div>
    </AuthGuard>
  );
}

export default App;