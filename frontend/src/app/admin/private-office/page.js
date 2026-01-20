'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { api } from '@/lib/api';

export default function PrivateOffice() {
  const [activeTab, setActiveTab] = useState('rooms');
  const [rooms, setRooms] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [roomFilter, setRoomFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({ name: '', rentFee: '', currency: 'PHP', rentFeePeriod: 'per hour', description: '', inclusions: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmDialogData, setConfirmDialogData] = useState({ type: '', title: '', message: '' });
  const [showEditTenantModal, setShowEditTenantModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [tenantFormData, setTenantFormData] = useState({
    clientName: '',
    email: '',
    contactNumber: '',
    room: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    notes: '',
    status: 'approved'
  });
  
  // Use refs to track intervals and prevent multiple intervals
  const roomsIntervalRef = useRef(null);
  const schedulesIntervalRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Currency symbol helper
  const getCurrencySymbol = (currency) => {
    const symbols = {
      'PHP': '₱',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'AUD': 'A$',
      'CAD': 'C$',
      'CNY': '¥',
      'INR': '₹',
      'SGD': 'S$'
    };
    return symbols[currency] || '₱';
  };

  // Mount state for portal
  useEffect(() => {

    // Redirect to dashboard page by default
    router.replace('/admin/private-office/dashboard');
  }, [router]);


