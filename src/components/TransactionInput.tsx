import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { parseTransactionText, ParsedTransaction } from '../lib/gemini';
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface TransactionInputProps {
  userId: string;
  onTransactionsAdded: () => void;
}

export default function TransactionInput({ userId, onTransactionsAdded }: TransactionInputProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleParse() {
    if (!text.trim()) {
      setError('Please enter transaction text');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setParsedTransactions([]);

    try {
      const parsed = await parseTransactionText(text);
      setParsedTransactions(parsed);
      setSuccess(`Successfully parsed ${parsed.length} transaction(s)!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse transactions');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (parsedTransactions.length === 0) {
      setError('No transactions to save');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const transactionsToInsert = parsedTransactions.map((t) => ({
        user_id: userId,
        amount: t.amount,
        type: t.type,
        category: t.category,
        merchant: t.merchant,
        description: t.description,
        transaction_date: t.transaction_date,
        raw_text: text,
      }));

      const { error: insertError } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

      if (insertError) throw insertError;

      setSuccess(`Saved ${parsedTransactions.length} transaction(s) successfully!`);
      setText('');
      setParsedTransactions([]);
      onTransactionsAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transactions');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Upload className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-800">Add Transactions</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Paste email text or transaction details
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Example:&#10;&#10;Transaction Alert: Your account has been debited Rs. 450 on 2024-11-08 at McDonald's&#10;&#10;Credit: Salary of $5000 received on 2024-11-01&#10;&#10;Paid $89.99 to Amazon on 2024-11-05"
            className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={loading}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleParse}
            disabled={loading || !text.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              'Parse with AI'
            )}
          </button>

          {parsedTransactions.length > 0 && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
            >
              Save Transactions
            </button>
          )}
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

        {parsedTransactions.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold text-gray-800">Parsed Transactions:</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {parsedTransactions.map((t, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">{t.merchant}</div>
                      <div className="text-sm text-gray-600">{t.category}</div>
                      <div className="text-xs text-gray-500">{new Date(t.transaction_date).toLocaleDateString()}</div>
                    </div>
                    <div className={`text-lg font-bold ${t.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'credit' ? '+' : '-'}${t.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
