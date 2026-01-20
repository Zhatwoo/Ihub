'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function Reports() {
  const [selectedType, setSelectedType] = useState('all');
  const [reports, setReports] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const types = ['all', 'Reservations', 'Utilization', 'Financial', 'Clients', 'Summary'];

  // Fetch reports data from backend
  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        setLoading(true);
        
        // Fetch reservation trends and report history
        const [trendsResponse, historyResponse] = await Promise.all([
          api.get('/api/admin/reports/trends'),
          api.get('/api/admin/reports/history')
        ]);
        
        if (trendsResponse.success && trendsResponse.data) {
          setMonthlyData(trendsResponse.data.monthlyData || []);
        }
        
        if (historyResponse.success && historyResponse.data) {
          setReports(historyResponse.data.reports || []);
        }
      } catch (error) {
        console.error('Error fetching reports data:', error);
        // Set fallback data
        setReports([]);
        setMonthlyData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, []);

  // Fetch filtered reports from backend
  const [filteredReports, setFilteredReports] = useState([]);

  useEffect(() => {
    const filterReports = async () => {
      try {
        const params = new URLSearchParams();
        if (selectedType !== 'all') params.append('type', selectedType);

        const response = await api.get(`/api/admin/reports/history?${params.toString()}`);
        if (response.success && response.data) {
          setFilteredReports(response.data.reports || []);
        }
      } catch (error) {
        console.error('Error filtering reports:', error);
        setFilteredReports(reports);
      }
    };

    filterReports();
  }, [selectedType, reports]);

  const maxReservations = monthlyData.length > 0 ? monthlyData.reduce((max, d) => d.reservations > max ? d.reservations : max, 0) : 1;

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
              <p className="text-2xl font-bold text-teal-800">{reports.length}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl">
              <p className="text-green-700 text-sm font-medium">Generated</p>
              <p className="text-2xl font-bold text-green-800">{reports.length > 0 ? reports.reduce((count, r) => r.status === 'Generated' ? count + 1 : count, 0) : 0}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-xl">
              <p className="text-yellow-700 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-800">{reports.length > 0 ? reports.reduce((count, r) => r.status === 'Pending' ? count + 1 : count, 0) : 0}</p>
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
