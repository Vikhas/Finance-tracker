import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Loader2, CheckCircle, AlertCircle, RefreshCw, Unlink2 } from 'lucide-react';

interface GmailIntegrationProps {
  userId: string;
  onTransactionsImported: () => void;
}

interface Email {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  body: string;
}

export default function GmailIntegration({ userId, onTransactionsImported }: GmailIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingEmails, setLoadingEmails] = useState(false);

  useEffect(() => {
    checkGmailConnection();
  }, [userId]);

  async function checkGmailConnection() {
    try {
      const { data, error } = await supabase
        .from('gmail_tokens')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setIsConnected(!!data);
    } catch (err) {
      console.error('Error checking Gmail connection:', err);
    }
  }

  function handleConnect() {
    setLoading(true);
    setError('');

    const googleClientId = '1058833751561-pspmdneuqcrul9q6iop1kfjgub8quk5h.apps.googleusercontent.com';
    const redirectUri = `${window.location.origin}`;
    const scope = 'https://www.googleapis.com/auth/gmail.readonly';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(googleClientId)}&` +
      `redirect_uri=${encodeURIComponent(`${window.location.origin}/functions/v1/gmail-callback`)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${encodeURIComponent(userId)}&` +
      `access_type=offline&` +
      `prompt=consent`;

    window.location.href = authUrl;
  }

  async function handleFetchEmails() {
    setLoadingEmails(true);
    setError('');
    setEmails([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${window.location.origin}/functions/v1/fetch-gmail`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch emails');
      }

      const fetchedEmails = await response.json();
      setEmails(fetchedEmails);
      setSuccess(`Fetched ${fetchedEmails.length} email(s)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch emails');
    } finally {
      setLoadingEmails(false);
    }
  }

  async function handleImport() {
    if (emails.length === 0) {
      setError('No emails to import');
      return;
    }

    setImporting(true);
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${window.location.origin}/functions/v1/parse-gmail`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ emails }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import transactions');
      }

      const result = await response.json();
      setSuccess(`Successfully imported ${result.transactionsCount} transaction(s)!`);
      setEmails([]);
      onTransactionsImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import transactions');
    } finally {
      setImporting(false);
    }
  }

  async function handleDisconnect() {
    try {
      const { error } = await supabase
        .from('gmail_tokens')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      setIsConnected(false);
      setSuccess('Gmail account disconnected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Mail className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-800">Gmail Integration</h3>
      </div>

      <div className="space-y-4">
        {!isConnected ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <p className="text-gray-600 text-center">
              Connect your Gmail account to automatically fetch transaction emails
            </p>
            <button
              onClick={handleConnect}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Connect Gmail Account
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Gmail account connected</span>
              </div>
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium"
              >
                <Unlink2 className="w-4 h-4" />
                Disconnect
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {emails.length === 0 ? (
              <button
                onClick={handleFetchEmails}
                disabled={loadingEmails}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
              >
                {loadingEmails ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Fetching Emails...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Fetch Transaction Emails
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <h4 className="font-semibold text-gray-800">
                    Found {emails.length} email(s):
                  </h4>
                  {emails.map((email) => (
                    <div key={email.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="font-medium text-gray-800 truncate">{email.subject}</div>
                      <div className="text-xs text-gray-600 mt-1 truncate">{email.from}</div>
                      <div className="text-sm text-gray-600 mt-2 line-clamp-2">{email.snippet}</div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleFetchEmails}
                    disabled={loadingEmails || importing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-200 disabled:cursor-not-allowed transition font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Fetch More
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      'Import Transactions'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
        <p className="font-medium mb-2">Setup Instructions:</p>
        <ol className="space-y-1 text-xs list-decimal list-inside">
          <li>Replace YOUR_GOOGLE_CLIENT_ID with your Google OAuth credentials</li>
          <li>Set up Google OAuth in Supabase dashboard</li>
          <li>Click "Connect Gmail Account" to authorize</li>
          <li>Fetch and import your transaction emails</li>
        </ol>
      </div>
    </div>
  );
}
