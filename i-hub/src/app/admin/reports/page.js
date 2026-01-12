'use client';

import { useState } from 'react';

const dummyReports = [
  { id: 1, title: 'Monthly Reservation Summary', type: 'Reservations', date: 'Jan 2026', status: 'Generated' },
  { id: 2, title: 'Room Utilization Report', type: 'Utilization', date: 'Jan 2026', status: 'Generated' },
  { id: 3, title: 'Revenue Report Q4 2025', type: 'Financial', date: 'Dec 2025', status: 'Generated' },
  { id: 4, title: 'Client Activity Report', type: 'Clients', date: 'Jan 2026', status: 'Pending' },
  { id: 5, title: 'Yearly Overview 2025', type: 'Summary', date: 'Dec 2025', status: 'Generated' },
];

const monthlyData = [
  { month: 'Aug', reservations: 45 },
  { month: 'Sep', reservations: 52 },
  { month: 'Oct', reservations: 48 },
  { month: 'Nov', reservations: 61 },
  { month: 'Dec', reservations: 55 },
  { month: 'Jan', reservations: 38 },
];

export default function Reports() {
  const [selectedType, setSelectedType] = useState('all');
  const types = ['all', 'Reservations', 'Utilization', 'Financial', 'Clients', 'Summary'];

  const filteredReports = selectedType === 'all' ? dummyReports : dummyReports.filter(r => r.type === selectedType);
  const maxReservations = Math.max(...monthlyData.map(d => d.reservations));

  return (
    <div className="w-full animate-fadeIn">
      <h1 className="text-slate-800 text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 animate-slideInLeft">Reports</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-4 sm:mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-gray-200 shadow-sm animate-slideUp" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>
          <h2 className="text-slate-800 text-base sm:text-lg font-bold mb-3 sm:mb-4">Reservation Trends</h2>
          <div className="flex items-end justify-between h-40 sm:h-44 lg:h-48 gap-2 sm:gap-3 lg:gap-4">
            {monthlyData.map((data, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gradient-to-t from-teal-500 to-teal-400 rounded-t-lg transition-all hover:from-teal-600 hover:to-teal-500 animate-slideUp" style={{ height: `${(data.reservations / maxReservations) * 100}%`, animationDelay: `${0.2 + i * 0.05}s`, animationFillMode: 'backwards' }}></div>
                <span className="text-xs text-gray-500 font-medium">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-gray-200 shadow-sm animate-slideInRight" style={{ animationDelay: '0.15s', animationFillMode: 'backwards' }}>
          <h2 className="text-slate-800 text-base sm:text-lg font-bold mb-3 sm:mb-4">Summary</h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="p-4 bg-teal-50 rounded-xl">
              <p className="text-teal-700 text-sm font-medium">Total Reports</p>
              <p className="text-2xl font-bold text-teal-800">{dummyReports.length}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl">
              <p className="text-green-700 text-sm font-medium">Generated</p>
              <p className="text-2xl font-bold text-green-800">{dummyReports.filter(r => r.status === 'Generated').length}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-xl">
              <p className="text-yellow-700 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-800">{dummyReports.filter(r => r.status === 'Pending').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-gray-200 shadow-sm animate-scaleIn" style={{ animationDelay: '0.25s', animationFillMode: 'backwards' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-5 lg:mb-6 gap-3 sm:gap-0">
          <h2 className="text-slate-800 text-base sm:text-lg font-bold">Report History</h2>
          <div className="flex flex-wrap gap-2">
            {types.map(type => (
              <button key={type} onClick={() => setSelectedType(type)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedType === type ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {type === 'all' ? 'All' : type}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Report Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReports.map(report => (
                <tr key={report.id} className="bg-gray-50 hover:bg-gray-100 transition-colors">
                  <td className="px-4 py-4 text-slate-800 font-medium">{report.title}</td>
                  <td className="px-4 py-4 text-gray-600">{report.type}</td>
                  <td className="px-4 py-4 text-gray-600">{report.date}</td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${report.status === 'Generated' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{report.status}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition-colors">Download</button>
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
