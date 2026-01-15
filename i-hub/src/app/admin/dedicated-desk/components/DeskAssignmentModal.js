"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

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
  const [mounted, setMounted] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    setIsEditMode(false);
    setShowDropdown(false);
  }, [existingAssignment, isOpen]);

  const showToast = (message, type = "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "error" }), 4000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Please enter a name", "error");
      return;
    }
    if (!formData.email.trim()) {
      showToast("Please enter an email", "error");
      return;
    }
    if (!formData.contactNumber.trim()) {
      showToast("Please enter a contact number", "error");
      return;
    }

    setLoading(true);
    try {
      await onSave(deskTag, formData);
      showToast("Desk assigned successfully!", "success");
      setTimeout(() => {
        onClose();
        setFormData({ name: "", type: "Employee", email: "", contactNumber: "", company: "" });
      }, 1000);
    } catch (error) {
      console.error("Error saving assignment:", error);
      showToast(error.message || "Failed to save assignment. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setShowDropdown(false);
    setConfirmAction(() => async () => {
    setLoading(true);
    try {
      await onSave(deskTag, null); // Pass null to delete
      showToast("Assignment removed successfully!", "success");
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Error deleting assignment:", error);
      showToast(error.message || "Failed to delete assignment. Please try again.", "error");
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
    });
    setShowConfirmDialog(true);
  };

  const handleEdit = () => {
    setShowDropdown(false);
    setIsEditMode(true);
  };

  const handleMove = () => {
    setShowDropdown(false);
    showToast("Move Assignment feature coming soon!", "info");
    // TODO: Implement move assignment functionality
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    // Reset form data to existing assignment
    if (existingAssignment) {
      setFormData({
        name: existingAssignment.name || "",
        type: existingAssignment.type || "Employee",
        email: existingAssignment.email || "",
        contactNumber: existingAssignment.contactNumber || "",
        company: existingAssignment.company || ""
      });
    }
  };

  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Please enter a name", "error");
      return;
    }
    if (!formData.email.trim()) {
      showToast("Please enter an email", "error");
      return;
    }
    if (!formData.contactNumber.trim()) {
      showToast("Please enter a contact number", "error");
      return;
    }

    setLoading(true);
    try {
      await onSave(deskTag, formData);
      showToast("Assignment updated successfully!", "success");
      setTimeout(() => {
        setIsEditMode(false);
        setShowDropdown(false);
      }, 1000);
    } catch (error) {
      console.error("Error updating assignment:", error);
      showToast(error.message || "Failed to update assignment. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const isViewMode = !!existingAssignment && !isEditMode;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-[fadeIn_0.2s_ease] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-7 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-slate-800 text-lg sm:text-xl font-bold">
              {isEditMode ? "Edit Assignment" : isViewMode ? "Desk Assignment" : "Assign Desk"}
            </h2>
            {isViewMode && (
              <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                existingAssignment 
                  ? 'bg-red-100 text-red-700 border border-red-200' 
                  : 'bg-teal-100 text-teal-700 border border-teal-200'
              }`}>
                {existingAssignment ? 'Occupied' : 'Vacant'}
              </span>
            )}
            {!isViewMode && !isEditMode && (
              <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-teal-100 text-teal-700 border border-teal-200">
                Vacant
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 relative">
            {!isViewMode && !isEditMode && (
              <button
                type="submit"
                form="desk-assignment-form"
                disabled={loading}
                className="px-4 py-2 sm:py-2.5 bg-teal-600 text-white text-xs sm:text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Assign Desk"}
              </button>
            )}
            {isEditMode && (
              <>
                <button
                  type="submit"
                  form="desk-assignment-form"
                  disabled={loading}
                  className="px-4 py-2 sm:py-2.5 bg-teal-600 text-white text-xs sm:text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Updating..." : "Update"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={loading}
                  className="px-4 py-2 sm:py-2.5 bg-gray-200 text-slate-800 text-xs sm:text-sm font-medium rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </>
            )}
            {isViewMode && (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  disabled={loading}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    showDropdown 
                      ? 'bg-teal-100 text-teal-600 hover:bg-teal-200' 
                      : 'bg-gray-100 hover:bg-gray-200 hover:text-slate-800'
                  }`}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                {showDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 overflow-hidden transform transition-all duration-200 ease-out opacity-100 scale-100">
                      <div className="py-2">
                        <button
                          onClick={handleEdit}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-800 hover:bg-teal-50 transition-colors group"
                        >
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-teal-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="font-medium">Edit Assignment</span>
                        </button>
                        <button
                          onClick={handleMove}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-800 hover:bg-teal-50 transition-colors group"
                        >
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-teal-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          <span className="font-medium">Move Assignment</span>
                        </button>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          onClick={handleDelete}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors group"
                        >
                          <svg className="w-5 h-5 text-red-400 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="font-medium">Remove Assignment</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            <button 
              onClick={onClose} 
              disabled={loading}
              className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-lg sm:text-xl hover:bg-gray-200 hover:text-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ×
            </button>
          </div>
        </div>

        {isViewMode ? (
          // View Mode - Display existing assignment
          <div className="space-y-4 sm:space-y-5">
            {/* Row 1: Desk --- Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">
                  Desk
                </label>
                <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-300 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-300 cursor-not-allowed">
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
            </div>

            {/* Row 2: Type of Occupant --- Contact Number */}
            <div className="grid grid-cols-2 gap-4">
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
                  Contact Number
                </label>
                <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-50">
                  {existingAssignment.contactNumber || "N/A"}
                </div>
              </div>
            </div>

            {/* Row 3: Email --- Company (if Tenant) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">
                  Email
                </label>
                <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-50">
                  {existingAssignment.email || "N/A"}
                </div>
              </div>

              {existingAssignment.type === "Tenant" && existingAssignment.company ? (
                <div>
                  <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">
                    Company
                  </label>
                  <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-50">
                    {existingAssignment.company}
                  </div>
                </div>
              ) : (
                <div>
                  {/* Empty space for Employee type */}
                </div>
              )}
            </div>
          </div>
        ) : isEditMode ? (
          // Edit Mode - Edit existing assignment
          <form id="desk-assignment-form" onSubmit={handleUpdateAssignment} className="space-y-4 sm:space-y-5">
            {/* Row 1: Desk --- Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">
                  Desk <span className="text-red-500">*</span>
                </label>
                <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-300 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-300 cursor-not-allowed">
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
            </div>

            {/* Row 2: Type of Occupant --- Contact Number */}
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* Row 3: Email --- Company (if Tenant) */}
            <div className="grid grid-cols-2 gap-4">
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

              {formData.type === "Tenant" ? (
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
              ) : (
                <div>
                  {/* Empty space for Employee type */}
                </div>
              )}
            </div>
          </form>
        ) : (
          // Form Mode - Create new assignment
          <form id="desk-assignment-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Row 1: Desk --- Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">
                  Desk <span className="text-red-500">*</span>
                </label>
                <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-300 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-300 cursor-not-allowed">
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
            </div>

            {/* Row 2: Type of Occupant --- Contact Number */}
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* Row 3: Email --- Company (if Tenant) */}
            <div className="grid grid-cols-2 gap-4">
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

              {formData.type === "Tenant" ? (
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
              ) : (
                <div>
                  {/* Empty space for Employee type */}
                </div>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-[10000] animate-slideInRight">
          <div className={`px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md ${
            toast.type === "error" 
              ? "bg-gradient-to-r from-red-500 to-red-600 text-white" 
              : toast.type === "success"
              ? "bg-gradient-to-r from-teal-600 to-teal-700 text-white"
              : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              toast.type === "error" 
                ? "bg-red-400/30" 
                : toast.type === "success"
                ? "bg-teal-400/30"
                : "bg-blue-400/30"
            }`}>
              <span className="text-lg font-bold">
                {toast.type === "error" ? "✕" : toast.type === "success" ? "✓" : "ℹ"}
              </span>
            </div>
            <span className="font-medium flex-1 text-sm sm:text-base">{toast.message}</span>
            <button 
              onClick={() => setToast({ show: false, message: "", type: "error" })} 
              className="ml-2 text-white/80 hover:text-white text-xl font-bold transition-colors flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10001] animate-[fadeIn_0.2s_ease] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConfirmDialog(false);
              setConfirmAction(null);
            }
          }}
        >
          <div 
            className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-[slideUp_0.3s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">Confirm Action</h3>
                <p className="text-sm text-gray-600">Are you sure you want to remove this assignment?</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirmDialog(false);
                  setConfirmAction(null);
                }}
                disabled={loading}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-200 text-slate-800 font-medium rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction) {
                    confirmAction();
                  }
                }}
                disabled={loading}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}

