"use client";

export default function ListView({ 
  assignmentsList, 
  setSelectedDesk, 
  setShowModal, 
  setSelectedUserInfo, 
  setShowUserInfoModal 
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-slideUp">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Desk</th>
              <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Name</th>
              <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Type</th>
              <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Email</th>
              <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Contact Number</th>
              <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Company</th>
              <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Assigned At</th>
              <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assignmentsList.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                  No desk assignments found.
                </td>
              </tr>
            ) : (
              assignmentsList.map((assignment) => (
                <tr key={assignment.deskTag} className="bg-gray-50 hover:bg-gray-100 transition-colors">
                  <td className="px-4 py-4">
                    <span className="text-slate-800 font-semibold text-sm">{assignment.deskTag}</span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => {
                        setSelectedUserInfo(assignment);
                        setShowUserInfoModal(true);
                      }}
                      className="text-gray-600 text-sm hover:text-teal-600 hover:underline transition-colors cursor-pointer font-medium"
                    >
                      {assignment.name || 'N/A'}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      assignment.type === 'Tenant' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {assignment.type || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-600 text-sm truncate block max-w-[200px]" title={assignment.email || 'N/A'}>
                      {assignment.email || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-600 text-sm">{assignment.contactNumber || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-600 text-sm">{assignment.company || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-600 text-sm">
                      {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => {
                        setSelectedDesk(assignment.deskTag);
                        setShowModal(true);
                      }}
                      className="px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
