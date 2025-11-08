import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import TransactionInput from './components/TransactionInput';
import AIChat from './components/AIChat';
import GmailIntegration from './components/GmailIntegration';
import { Wallet, LogOut, Plus, MessageSquare, LayoutDashboard, Mail } from 'lucide-react';

function App() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'gmail' | 'chat'>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        setLoading(false);
      })();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  function handleTransactionsAdded() {
    setRefreshKey((prev) => prev + 1);
    setActiveTab('dashboard');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuth={checkUser} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Money Manager</h1>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition font-medium whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('gmail')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition font-medium whitespace-nowrap ${
              activeTab === 'gmail'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Mail className="w-5 h-5" />
            Gmail
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition font-medium whitespace-nowrap ${
              activeTab === 'add'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Plus className="w-5 h-5" />
            Add Transactions
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition font-medium whitespace-nowrap ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            AI Assistant
          </button>
        </div>

        {activeTab === 'dashboard' && <Dashboard key={refreshKey} userId={user.id} />}
        {activeTab === 'gmail' && (
          <GmailIntegration userId={user.id} onTransactionsImported={handleTransactionsAdded} />
        )}
        {activeTab === 'add' && (
          <TransactionInput userId={user.id} onTransactionsAdded={handleTransactionsAdded} />
        )}
        {activeTab === 'chat' && <AIChat userId={user.id} />}
      </div>
    </div>
  );
}

export default App;
