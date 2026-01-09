'use client';

import { useState } from 'react';

const dummyInvoices = [
  { id: 'INV-001', client: 'John Smith', room: 'Buffet Hall', date: 'Jan 5, 2026', amount: 15000, status: 'Paid' },
  { id: 'INV-002', client: 'Sarah Johnson', room: 'Fine Dining Room', date: 'Jan 6, 2026', amount: 8500, status: 'Paid' },
  { id: 'INV-003', client: 'Mike Chen', room: 'Rooftop Lounge', date: 'Jan 7, 2026', amount: 22000, status: 'Pending' },
  { id: 'INV-004', client: 'Emily Davis', room: 'Private Chef Suite', date: 'Jan 8, 2026', amount: 12000, status: 'Pending' },
  { id: 'INV-005', client: 'Robert Wilson', room: 'Buffet Hall', date: 'Jan 9, 2026', amount: 18500, status: 'Overdue' },
  { id: 'INV-006', client: 'Lisa Anderson', room: 'Fine Dining Room', date: 'Jan 10, 2026', amount: 9000, status: 'Paid' },
];

export default function Billing() {
  const [filter, setFilter] = useState('all');

  const totalRevenue = dummyInvoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0);
  const pendingAmount = dummyInvoices.filter(i => i.status === 'Pending').reduce((sum, i) => sum + i.amount, 0);
  const overdueAmount = dummyInvoices.filter(i => i.status === 'Overdue').reduce((sum, i) => sum + i.amount, 0);

  const filteredInvoices = filter === 'all' ? dummyInvoices : dummyInvoices.filter(i => i.status === filter);

  const formatCurrency = (amount) => `₱${amount.toLocaleString()}`;

  return (
    <div className="w-full animate-fadeIn">
      <h1 className="text-slate-800 text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 animate-slideInLeft">Billing</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5 xl:gap-6 mb-4 sm:mb-6">
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-gray-200 shadow-sm animate-stagger animate-stagger-1">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-lg">💰</div>
            <div className="min-w-0 flex-1">
              <p className="text-gray-500 text-xs sm:text-sm truncate">Total Revenue</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-800 truncate">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-gray-200 shadow-sm animate-stagger animate-stagger-2">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-lg">⏳</div>
            <div className="min-w-0 flex-1">
              <p className="text-gray-500 text-xs sm:text-sm truncate">Pending</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-800 truncate">{formatCurrency(pendingAmount)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-gray-200 shadow-sm animate-stagger animate-stagger-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-lg">⚠️</div>
            <div className="min-w-0 flex-1">
              <p className="text-gray-500 text-xs sm:text-sm truncate">Overdue</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-800 truncate">{formatCurrency(overdueAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-gray-200 shadow-sm animate-slideUp" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-5 lg:mb-6 gap-3 sm:gap-0">
          <h2 className="text-slate-800 text-base sm:text-lg font-bold">Invoices</h2>
          <div className="flex flex-wrap gap-2">
            {['all', 'Paid', 'Pending', 'Overdue'].map(status => (
              <button key={status} onClick={() => setFilter(status)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === status ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Invoice ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Room</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map(invoice => (
                <tr key={invoice.id} className="bg-gray-50 hover:bg-gray-100 transition-colors">
                  <td className="px-4 py-4 text-slate-800 font-semibold">{invoice.id}</td>
                  <td className="px-4 py-4 text-slate-800">{invoice.client}</td>
                  <td className="px-4 py-4 text-gray-600">{invoice.room}</td>
                  <td className="px-4 py-4 text-gray-600">{invoice.date}</td>
                  <td className="px-4 py-4 text-slate-800 font-semibold">{formatCurrency(invoice.amount)}</td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      invoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                      invoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{invoice.status}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition-colors">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
