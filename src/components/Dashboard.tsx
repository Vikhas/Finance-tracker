import { useState, useEffect } from 'react';
import { supabase, Transaction } from '../lib/supabase';
import { PieChart, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';

interface DashboardProps {
  userId: string;
}

export default function Dashboard({ userId }: DashboardProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'month' | 'week'>('month');

  useEffect(() => {
    loadTransactions();
  }, [userId, filter]);

  async function loadTransactions() {
    setLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false });

      if (filter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('transaction_date', monthAgo.toISOString());
      } else if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('transaction_date', weekAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalCredit = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalDebit = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalCredit - totalDebit;

  const categoryTotals = transactions
    .filter(t => t.type === 'debit')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const merchantTotals = transactions
    .filter(t => t.type === 'debit' && t.merchant)
    .reduce((acc, t) => {
      acc[t.merchant] = (acc[t.merchant] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const topMerchants = Object.entries(merchantTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('week')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setFilter('month')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8" />
            <span className="text-sm opacity-90">Total Income</span>
          </div>
          <div className="text-3xl font-bold">${totalCredit.toFixed(2)}</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="w-8 h-8" />
            <span className="text-sm opacity-90">Total Expenses</span>
          </div>
          <div className="text-3xl font-bold">${totalDebit.toFixed(2)}</div>
        </div>

        <div className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} rounded-2xl p-6 text-white shadow-lg`}>
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8" />
            <span className="text-sm opacity-90">Balance</span>
          </div>
          <div className="text-3xl font-bold">${balance.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-800">Top Categories</h3>
          </div>
          {topCategories.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No expense data yet</p>
          ) : (
            <div className="space-y-3">
              {topCategories.map(([category, amount]) => (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{category}</span>
                    <span className="text-gray-900 font-semibold">${amount.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${(amount / totalDebit) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-800">Top Merchants</h3>
          </div>
          {topMerchants.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No merchant data yet</p>
          ) : (
            <div className="space-y-3">
              {topMerchants.map(([merchant, amount]) => (
                <div key={merchant} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{merchant}</span>
                    <span className="text-gray-900 font-semibold">${amount.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full transition-all"
                      style={{ width: `${(amount / totalDebit) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Transactions</h3>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transactions yet</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {transactions.slice(0, 10).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{transaction.merchant || transaction.category}</div>
                  <div className="text-sm text-gray-600">{transaction.description}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(transaction.transaction_date).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-lg font-bold ${
                      transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'credit' ? '+' : '-'}${Number(transaction.amount).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">{transaction.category}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
