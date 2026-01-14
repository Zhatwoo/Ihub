"use client";

import { useState, useEffect } from "react";

export default function DeskAssignmentModal({ 
  isOpen, 
  onClose, 
  deskTag, 
  existingAssignment, 
  onSave 
}) {
  const [formData, setFormData] = useState({
    name: "",
    type: "Employee",
    email: "",
    contactNumber: "",
    company: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingAssignment) {
      setFormData({
        name: existingAssignment.name || "",
        type: existingAssignment.type || "Employee",
        email: existingAssignment.email || "",
        contactNumber: existingAssignment.contactNumber || "",
        company: existingAssignment.company || ""
      });
    } else {
      setFormData({
        name: "",
        type: "Employee",
        email: "",
        contactNumber: "",
        company: ""
      });
    }
  }, [existingAssignment, isOpen]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter a name");
      return;
    }
    if (!formData.email.trim()) {
      alert("Please enter an email");
      return;
    }
    if (!formData.contactNumber.trim()) {
      alert("Please enter a contact number");
      return;
    }

    setLoading(true);
    try {
      await onSave(deskTag, formData);
      onClose();
      setFormData({ name: "", type: "Employee", email: "", contactNumber: "", company: "" });
    } catch (error) {
      console.error("Error saving assignment:", error);
      alert("Failed to save assignment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove this assignment?")) {
      return;
    }

    setLoading(true);
    try {
      await onSave(deskTag, null); // Pass null to delete
      onClose();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Failed to delete assignment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isViewMode = !!existingAssignment;

  return (
    <div 
      className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-7 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-gray-100">
          <h2 className="text-slate-800 text-lg sm:text-xl font-bold">
            {isViewMode ? "Desk Assignment" : "Assign Desk"}
          </h2>
          <button 
            onClick={onClose} 
            disabled={loading}
            className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-lg sm:text-xl hover:bg-gray-200 hover:text-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ×
          </button>
        </div>

        {isViewMode ? (
          // View Mode - Display existing assignment
          <div className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">
                Desk
              </label>
              <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-50">
                {deskTag}
              </div>
            </div>

            <div>
              <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">
                Name
              </label>
              <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-50">
                {existingAssignment.name}
              </div>
            </div>

            <div>
              <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">
                Type of Occupant
              </label>
              <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-50">
                {existingAssignment.type}
              </div>
            </div>

            <div>
              <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">
                Email
              </label>
              <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-50">
                {existingAssignment.email || "N/A"}
              </div>
            </div>

            <div>
              <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">
                Contact Number
              </label>
              <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-50">
                {existingAssignment.contactNumber || "N/A"}
              </div>
            </div>

            {existingAssignment.type === "Tenant" && existingAssignment.company && (
              <div>
                <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">
                  Company
                </label>
                <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-50">
                  {existingAssignment.company}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Removing..." : "Remove Assignment"}
              </button>
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-200 text-slate-800 font-medium rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          // Form Mode - Create new assignment
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">
                Desk <span className="text-red-500">*</span>
              </label>
              <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-50">
                {deskTag}
              </div>
            </div>

            <div>
              <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">
                Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="Enter occupant name" 
                required 
                disabled={loading}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
              />
            </div>

            <div>
              <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">
                Type of Occupant <span className="text-red-500">*</span>
              </label>
              <select 
                name="type" 
                value={formData.type} 
                onChange={handleChange} 
                required 
                disabled={loading}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="Employee">Employee</option>
                <option value="Tenant">Tenant</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">
                Email <span className="text-red-500">*</span>
              </label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="Enter email address" 
                required 
                disabled={loading}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
              />
            </div>

            <div>
              <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <input 
                type="tel" 
                name="contactNumber" 
                value={formData.contactNumber} 
                onChange={handleChange} 
                placeholder="Enter contact number" 
                required 
                disabled={loading}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
              />
            </div>

            {formData.type === "Tenant" && (
              <div>
                <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">
                  Company
                </label>
                <input 
                  type="text" 
                  name="company" 
                  value={formData.company} 
                  onChange={handleChange} 
                  placeholder="Enter company name (optional)" 
                  disabled={loading}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Assign Desk"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-200 text-slate-800 font-medium rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

