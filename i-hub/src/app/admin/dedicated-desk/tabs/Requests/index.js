"use client";

export default function RequestsView({ 
  requests, 
  loadingRequests, 
  handleAcceptRequest, 
  handleRejectRequest,
  handleDeleteRequest 
}) {
  if (loadingRequests) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-slideUp">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading requests...</div>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-slideUp">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg font-medium">No requests found</p>
          <p className="text-gray-400 text-sm mt-1">All requests will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-slideUp">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Name</th>
              <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Email</th>
              <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Company</th>
              <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Contact</th>
              <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Desk</th>
              <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Request Date</th>
              <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((request) => (
              <tr key={request.id} className="bg-gray-50 hover:bg-gray-100 transition-colors">
                <td className="px-4 py-4">
                  <span className="text-slate-800 font-semibold text-sm">
                    {request.userInfo?.firstName || ''} {request.userInfo?.lastName || ''}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-gray-600 text-sm">{request.userInfo?.email || 'N/A'}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-gray-600 text-sm">{request.userInfo?.companyName || 'N/A'}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-gray-600 text-sm">{request.userInfo?.contact || 'N/A'}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-gray-600 text-sm">{request.deskId || 'N/A'}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-gray-600 text-sm">
                    {request.requestDate 
                      ? new Date(request.requestDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : request.createdAt
                      ? new Date(request.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {request.status === 'rejected' ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-100 text-red-700 border border-red-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Rejected
                      </span>
                      <button
                        onClick={() => handleDeleteRequest(request)}
                        className="group p-2 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-all duration-200"
                        title="Delete this request"
                      >
                        <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => handleAcceptRequest(request)}
                        disabled={request.status === 'approved'}
                        className={`group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ease-out ${
                          request.status === 'approved'
                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            : 'bg-linear-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-emerald-500/50 border-0'
                        }`}
                        title={request.status === 'approved' ? 'Request already approved' : 'Approve this request'}
                      >
                        <svg className={`w-4 h-4 transition-transform duration-300 ${request.status !== 'approved' ? 'group-hover:scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Accept</span>
                        {request.status !== 'approved' && (
                          <span className="absolute inset-0 rounded-lg bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                        )}
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request)}
                        className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ease-out bg-linear-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-red-500/50 border-0"
                        title="Reject this request"
                      >
                        <svg className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Reject</span>
                        <span className="absolute inset-0 rounded-lg bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
