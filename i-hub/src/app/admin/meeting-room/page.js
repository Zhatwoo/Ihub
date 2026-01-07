'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './meeting-room.module.css';

const dummyRooms = [
  { id: 'dummy1', name: 'Buffet Hall', capacity: 50, inclusions: 'Projector, Sound System, Buffet Setup', image: '/dining/buffet.png' },
  { id: 'dummy2', name: 'Fine Dining Room', capacity: 20, inclusions: 'TV, Whiteboard, Premium Furniture', image: '/dining/fine_dining.png' },
  { id: 'dummy3', name: 'Private Chef Suite', capacity: 12, inclusions: 'Kitchen Access, Private Chef, Wine Selection', image: '/dining/private_chef.png' },
  { id: 'dummy4', name: 'Rooftop Lounge', capacity: 30, inclusions: 'Open Air, Bar, City View', image: '/dining/rooftop.png' },
];

const dummySchedules = [
  { id: 1, clientName: 'John Smith', room: 'Buffet Hall', date: 'Jan 10, 2026', time: '2hrs (9am - 11am)', guests: 25, purpose: 'Team Meeting', inclusions: 'Projector, Coffee', status: 'upcoming' },
  { id: 2, clientName: 'Sarah Johnson', room: 'Fine Dining Room', date: 'Jan 8, 2026', time: '1hr (2pm - 3pm)', guests: 8, purpose: 'Client Presentation', inclusions: 'TV, Whiteboard', status: 'ongoing' },
  { id: 3, clientName: 'Mike Chen', room: 'Rooftop Lounge', date: 'Jan 12, 2026', time: '3hrs (6pm - 9pm)', guests: 20, purpose: 'Birthday Party', inclusions: 'Bar, Sound System', status: 'pending' },
  { id: 4, clientName: 'Emily Davis', room: 'Private Chef Suite', date: 'Jan 5, 2026', time: '2hrs (12pm - 2pm)', guests: 6, purpose: 'Business Lunch', inclusions: 'Private Chef', status: 'completed' },
  { id: 5, clientName: 'Robert Wilson', room: 'Buffet Hall', date: 'Jan 15, 2026', time: '4hrs (1pm - 5pm)', guests: 40, purpose: 'Workshop', inclusions: 'Projector, Mics', status: 'upcoming' },
  { id: 6, clientName: 'Lisa Anderson', room: 'Fine Dining Room', date: 'Jan 3, 2026', time: '1hr (10am - 11am)', guests: 10, purpose: 'Interview', inclusions: 'None', status: 'rejected' },
  { id: 7, clientName: 'David Brown', room: 'Rooftop Lounge', date: 'Jan 7, 2026', time: '2hrs (7pm - 9pm)', guests: 15, purpose: 'Networking Event', inclusions: 'Bar', status: 'completed' },
  { id: 8, clientName: 'Anna Martinez', room: 'Private Chef Suite', date: 'Jan 9, 2026', time: '1hr (7am - 8am)', guests: 4, purpose: 'Breakfast Meeting', inclusions: 'Private Chef', status: 'ongoing' },
  { id: 9, clientName: 'James Taylor', room: 'Buffet Hall', date: 'Jan 11, 2026', time: '2hrs (3pm - 5pm)', guests: 30, purpose: 'Training Session', inclusions: 'Projector', status: 'pending' },
  { id: 10, clientName: 'Karen White', room: 'Fine Dining Room', date: 'Jan 6, 2026', time: '1hr (4pm - 5pm)', guests: 12, purpose: 'Board Meeting', inclusions: 'TV, Coffee', status: 'completed' },
];

export default function MeetingRoom() {
  const [activeTab, setActiveTab] = useState('rooms');
  const [rooms, setRooms] = useState(dummyRooms);
  const [schedules] = useState(dummySchedules);
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
  const [formData, setFormData] = useState({ name: '', capacity: '', inclusions: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    const newRoom = { id: Date.now().toString(), name: formData.name, capacity: parseInt(formData.capacity), inclusions: formData.inclusions, image: '/dining/buffet.png' };
    if (editingRoom) {
      setRooms(rooms.map(r => r.id === editingRoom.id ? { ...r, ...newRoom, id: editingRoom.id, image: editingRoom.image } : r));
    } else {
      setRooms([...rooms, newRoom]);
    }
    setFormData({ name: '', capacity: '', inclusions: '' });
    setEditingRoom(null);
    setShowFormModal(false);
    setLoading(false);
  };

  const handleEdit = () => { setShowViewModal(false); setEditingRoom(selectedRoom); setFormData({ name: selectedRoom.name, capacity: selectedRoom.capacity.toString(), inclusions: selectedRoom.inclusions || '' }); setShowFormModal(true); };
  const handleDelete = () => { 
    if (!selectedRoom) return;
    const roomId = selectedRoom.id;
    if (confirm('Delete this room?')) { 
      setShowViewModal(false); 
      setSelectedRoom(null); 
      setRooms(rooms.filter(r => r.id !== roomId)); 
    } 
  };
  const openAddModal = () => { setEditingRoom(null); setFormData({ name: '', capacity: '', inclusions: '' }); setShowFormModal(true); };
  const closeFormModal = () => { setShowFormModal(false); setEditingRoom(null); setFormData({ name: '', capacity: '', inclusions: '' }); };
  const openViewModal = (room) => { setSelectedRoom(room); setShowViewModal(true); };
  const closeViewModal = () => { setShowViewModal(false); setSelectedRoom(null); };

  const filteredRooms = rooms.filter(room => room.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getSchedulesByStatus = (status) => {
    if (status === 'total') return schedules;
    return schedules.filter(s => s.status === status);
  };

  const applyFiltersAndSort = (data) => {
    let result = [...data];
    
    // Search filter
    if (scheduleSearch) {
      const search = scheduleSearch.toLowerCase();
      result = result.filter(s => 
        s.clientName.toLowerCase().includes(search) ||
        s.room.toLowerCase().includes(search) ||
        s.purpose.toLowerCase().includes(search)
      );
    }
    
    // Room filter
    if (roomFilter !== 'all') {
      result = result.filter(s => s.room === roomFilter);
    }
    
    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date) - new Date(b.date);
      } else if (sortBy === 'client') {
        comparison = a.clientName.localeCompare(b.clientName);
      } else if (sortBy === 'room') {
        comparison = a.room.localeCompare(b.room);
      } else if (sortBy === 'guests') {
        comparison = a.guests - b.guests;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return result;
  };

  const filteredSchedules = selectedFilter ? applyFiltersAndSort(getSchedulesByStatus(selectedFilter)) : [];

  const uniqueRooms = [...new Set(schedules.map(s => s.room))];

  const getStatusBadgeClass = (status) => {
    const classes = { pending: styles.badgePending, upcoming: styles.badgeUpcoming, ongoing: styles.badgeOngoing, completed: styles.badgeCompleted, rejected: styles.badgeRejected };
    return classes[status] || '';
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Meeting Room</h1>
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'rooms' ? styles.tabActive : ''}`} onClick={() => setActiveTab('rooms')}>Meeting Rooms</button>
        <button className={`${styles.tab} ${activeTab === 'requests' ? styles.tabActive : ''}`} onClick={() => setActiveTab('requests')}>Request List</button>
        <button className={`${styles.tab} ${activeTab === 'schedule' ? styles.tabActive : ''}`} onClick={() => setActiveTab('schedule')}>Schedule</button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'rooms' && (
          <div className={styles.roomsSection}>
            <div className={styles.toolbar}>
              <input type="text" className={styles.searchInput} placeholder="Search rooms..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <button className={styles.addBtn} onClick={openAddModal}>+ Add Room</button>
            </div>
            <div className={styles.roomsGrid}>
              {filteredRooms.length === 0 ? (
                <p className={styles.emptyMessage}>{searchTerm ? 'No rooms found.' : 'No rooms created yet.'}</p>
              ) : (
                filteredRooms.map((room) => (
                  <div key={room.id} className={styles.roomCard} onClick={() => openViewModal(room)}>
                    <div className={styles.roomImage}>
                      <Image src={room.image} alt={room.name} fill style={{ objectFit: 'cover' }} />
                    </div>
                    <div className={styles.roomCardContent}>
                      <div className={styles.roomName}>{room.name}</div>
                      <div className={styles.roomCapacity}><span className={styles.capacityIcon}>👥</span><span>{room.capacity} people</span></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {activeTab === 'requests' && (<div className={styles.placeholderContent}><h2>Request List</h2><p className={styles.emptyMessage}>No pending requests.</p></div>)}
        {activeTab === 'schedule' && (
          <div className={styles.scheduleSection}>
            <div className={styles.statsGrid}>
              <div className={`${styles.statCard} ${styles.statTotal} ${selectedFilter === 'total' ? styles.statActive : ''}`} onClick={() => setSelectedFilter('total')}>
                <div className={styles.statIcon}>📊</div>
                <div className={styles.statInfo}><span className={styles.statValue}>{schedules.length}</span><span className={styles.statLabel}>Total</span></div>
              </div>
              <div className={`${styles.statCard} ${styles.statUpcoming} ${selectedFilter === 'upcoming' ? styles.statActive : ''}`} onClick={() => setSelectedFilter('upcoming')}>
                <div className={styles.statIcon}>📅</div>
                <div className={styles.statInfo}><span className={styles.statValue}>{schedules.filter(s => s.status === 'upcoming').length}</span><span className={styles.statLabel}>Upcoming</span></div>
              </div>
              <div className={`${styles.statCard} ${styles.statOngoing} ${selectedFilter === 'ongoing' ? styles.statActive : ''}`} onClick={() => setSelectedFilter('ongoing')}>
                <div className={styles.statIcon}>▶️</div>
                <div className={styles.statInfo}><span className={styles.statValue}>{schedules.filter(s => s.status === 'ongoing').length}</span><span className={styles.statLabel}>Ongoing</span></div>
              </div>
              <div className={`${styles.statCard} ${styles.statPending} ${selectedFilter === 'pending' ? styles.statActive : ''}`} onClick={() => setSelectedFilter('pending')}>
                <div className={styles.statIcon}>⏳</div>
                <div className={styles.statInfo}><span className={styles.statValue}>{schedules.filter(s => s.status === 'pending').length}</span><span className={styles.statLabel}>Pending</span></div>
              </div>
              <div className={`${styles.statCard} ${styles.statCompleted} ${selectedFilter === 'completed' ? styles.statActive : ''}`} onClick={() => setSelectedFilter('completed')}>
                <div className={styles.statIcon}>✅</div>
                <div className={styles.statInfo}><span className={styles.statValue}>{schedules.filter(s => s.status === 'completed').length}</span><span className={styles.statLabel}>Completed</span></div>
              </div>
              <div className={`${styles.statCard} ${styles.statRejected} ${selectedFilter === 'rejected' ? styles.statActive : ''}`} onClick={() => setSelectedFilter('rejected')}>
                <div className={styles.statIcon}>❌</div>
                <div className={styles.statInfo}><span className={styles.statValue}>{schedules.filter(s => s.status === 'rejected').length}</span><span className={styles.statLabel}>Rejected</span></div>
              </div>
            </div>

            {selectedFilter && (
              <div className={styles.scheduleList}>
                <div className={styles.listHeader}>
                  <h3>{selectedFilter === 'total' ? 'All Reservations' : `${selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)} Reservations`}</h3>
                  <div className={styles.filterBar}>
                    <input type="text" className={styles.scheduleSearchInput} placeholder="Search..." value={scheduleSearch} onChange={(e) => setScheduleSearch(e.target.value)} />
                    <select className={styles.filterSelect} value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)}>
                      <option value="all">All Rooms</option>
                      {uniqueRooms.map(room => <option key={room} value={room}>{room}</option>)}
                    </select>
                    <select className={styles.filterSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="date">Sort by Date</option>
                      <option value="client">Sort by Client</option>
                      <option value="room">Sort by Room</option>
                      <option value="guests">Sort by Guests</option>
                    </select>
                    <button className={styles.sortOrderBtn} onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </button>
                    <button className={styles.clearFilter} onClick={() => { setSelectedFilter(null); setScheduleSearch(''); setRoomFilter('all'); }}>Clear Filter</button>
                  </div>
                </div>
                {filteredSchedules.length === 0 ? (
                  <p className={styles.emptyMessage}>No reservations found.</p>
                ) : (
                  <div className={styles.scheduleTable}>
                    <div className={styles.tableHeader}>
                      <span>Client</span><span>Room</span><span>Date</span><span>Time</span><span>Guests</span><span>Purpose</span><span>Status</span>
                    </div>
                    {filteredSchedules.map((schedule) => (
                      <div key={schedule.id} className={styles.tableRow}>
                        <span className={styles.clientName}>{schedule.clientName}</span>
                        <span>{schedule.room}</span>
                        <span>{schedule.date}</span>
                        <span>{schedule.time}</span>
                        <span>{schedule.guests}</span>
                        <span>{schedule.purpose}</span>
                        <span className={`${styles.statusBadge} ${getStatusBadgeClass(schedule.status)}`}>{schedule.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showFormModal && (
        <div className={styles.modalOverlay} onClick={closeFormModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}><h2>{editingRoom ? 'Edit Room' : 'Add New Room'}</h2><button className={styles.closeBtn} onClick={closeFormModal}>×</button></div>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}><label>Name of Room</label><input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter room name" required /></div>
              <div className={styles.formGroup}><label>Maximum Capacity</label><input type="number" name="capacity" value={formData.capacity} onChange={handleChange} placeholder="Enter max capacity" min="1" required /></div>
              <div className={styles.formGroup}><label>Inclusions</label><textarea name="inclusions" value={formData.inclusions} onChange={handleChange} placeholder="e.g. Projector, Whiteboard" rows="3" /></div>
              <div className={styles.formButtons}><button type="button" className={styles.cancelBtn} onClick={closeFormModal}>Cancel</button><button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? 'Saving...' : editingRoom ? 'Update' : 'Add Room'}</button></div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedRoom && (
        <div className={styles.modalOverlay} onClick={closeViewModal}>
          <div className={`${styles.modal} ${styles.viewModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Room Details</h2>
              <div className={styles.modalActions}>
                <button className={styles.iconBtn} onClick={handleEdit} title="Edit">✏️</button>
                <button className={styles.iconBtnDelete} onClick={handleDelete} title="Delete">🗑️</button>
                <button className={styles.closeBtn} onClick={closeViewModal}>×</button>
              </div>
            </div>
            <div className={styles.viewImage}><Image src={selectedRoom.image} alt={selectedRoom.name} fill style={{ objectFit: 'cover' }} /></div>
            <div className={styles.viewDetails}>
              <div className={styles.detailRow}><span className={styles.label}>Room Name:</span><span className={styles.value}>{selectedRoom.name}</span></div>
              <div className={styles.detailRow}><span className={styles.label}>Maximum Capacity:</span><span className={styles.value}>{selectedRoom.capacity} people</span></div>
              <div className={styles.detailRow}><span className={styles.label}>Inclusions:</span><span className={styles.value}>{selectedRoom.inclusions || 'None'}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
