import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { roomsAPI, bookingsAPI } from '../utils/api';

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('rooms');
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (activeTab === 'rooms') {
      fetchRooms();
    } else if (activeTab === 'bookings') {
      fetchBookings();
    }
  }, [activeTab]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomsAPI.getAll();
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      showMessage('Failed to load rooms', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingsAPI.getAll();
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showMessage('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitRoom = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description) {
      showMessage('Please fill in all fields', 'error');
      return;
    }

    try {
      if (isEditing) {
        await roomsAPI.update(editingId, formData);
        showMessage('Room updated successfully!', 'success');
      } else {
        await roomsAPI.create(formData);
        showMessage('Room created successfully!', 'success');
      }
      
      // Reset form
      setFormData({ name: '', description: '' });
      setIsEditing(false);
      setEditingId(null);
      
      // Refresh rooms
      fetchRooms();
    } catch (error) {
      console.error('Room operation error:', error);
      showMessage(
        error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} room`,
        'error'
      );
    }
  };

  const handleEditRoom = (room) => {
    setFormData({
      name: room.name,
      description: room.description
    });
    setIsEditing(true);
    setEditingId(room._id);
  };

  const handleCancelEdit = () => {
    setFormData({ name: '', description: '' });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }

    try {
      await roomsAPI.delete(roomId);
      showMessage('Room deleted successfully', 'success');
      fetchRooms();
    } catch (error) {
      console.error('Delete room error:', error);
      showMessage(
        error.response?.data?.message || 'Failed to delete room',
        'error'
      );
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) {
      return;
    }

    try {
      await bookingsAPI.delete(bookingId);
      showMessage('Booking deleted successfully', 'success');
      fetchBookings();
    } catch (error) {
      console.error('Delete booking error:', error);
      showMessage(
        error.response?.data?.message || 'Failed to delete booking',
        'error'
      );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-panel">
      <div className="admin-header" style={{ marginBottom: '2rem' }}>
        <h1>🛠️ Admin Panel</h1>
        <p>Welcome, {user.fullName}! Manage rooms and bookings from here.</p>
      </div>

      {message && (
        <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-nav" style={{ marginBottom: '2rem' }}>
        <button
          className={`btn ${activeTab === 'rooms' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('rooms')}
        >
          📍 Manage Rooms
        </button>
        <button
          className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('bookings')}
        >
          📅 View All Bookings
        </button>
      </div>

      {/* Rooms Tab */}
      {activeTab === 'rooms' && (
        <div className="rooms-tab">
          <div className="grid-2">
            {/* Add/Edit Room Form */}
            <div className="card">
              <h2>{isEditing ? '✏️ Edit Room' : '➕ Add New Room'}</h2>
              
              <form onSubmit={handleSubmitRoom}>
                <div className="form-group">
                  <label htmlFor="name">Room Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g., Conference Room A"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="form-input"
                    rows="4"
                    placeholder="Describe the room features, capacity, equipment, etc."
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-success">
                    {isEditing ? 'Update Room' : 'Add Room'}
                  </button>
                  {isEditing && (
                    <button 
                      type="button" 
                      onClick={handleCancelEdit}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Existing Rooms */}
            <div className="card">
              <h2>📍 Existing Rooms</h2>
              
              {loading && (
                <div className="loading">Loading rooms...</div>
              )}
              
              {!loading && rooms.length === 0 && (
                <p>No rooms created yet. Add your first room!</p>
              )}
              
              {!loading && rooms.length > 0 && (
                <div>
                  {rooms.map((room) => (
                    <div 
                      key={room._id} 
                      className="room-item"
                      style={{
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem',
                        backgroundColor: '#f8f9fa'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: '0 0 0.5rem 0' }}>{room.name}</h4>
                          <p style={{ margin: '0.25rem 0', color: '#666' }}>{room.description}</p>
                          <small style={{ color: '#888' }}>
                            Created by: {room.createdBy?.fullName || 'Unknown'} | 
                            Created: {formatDateTime(room.createdAt)}
                          </small>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleEditRoom(room)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room._id)}
                            className="btn btn-danger"
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="bookings-tab">
          <div className="card">
            <h2>📅 All Bookings</h2>
            
            {loading && (
              <div className="loading">Loading bookings...</div>
            )}
            
            {!loading && bookings.length === 0 && (
              <p>No bookings found.</p>
            )}
            
            {!loading && bookings.length > 0 && (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Full Name</th>
                      <th>Phone</th>
                      <th>ID Proof</th>
                      <th>Room</th>
                      <th>Date</th>
                      <th>Time Slots</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking._id}>
                        <td>
                          <div>
                            <strong>{booking.user?.fullName || 'Unknown'}</strong>
                            <br />
                            <small style={{ color: '#666' }}>
                              @{booking.user?.username || 'unknown'}
                            </small>
                          </div>
                        </td>
                        <td>{booking.fullName || 'N/A'}</td>
                        <td>{booking.phoneNumber || 'N/A'}</td>
                        <td>{booking.idProof || 'N/A'}</td>
                        <td>{booking.room?.name || 'Unknown Room'}</td>
                        <td>{formatDate(booking.date)}</td>
                        <td>
                          <div style={{ fontSize: '0.9rem' }}>
                            {booking.timeSlots?.join(', ') || 'No slots'}
                          </div>
                        </td>
                        <td>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            background: booking.status === 'confirmed' ? '#d4edda' : '#f8d7da',
                            color: booking.status === 'confirmed' ? '#155724' : '#721c24'
                          }}>
                            {booking.status?.toUpperCase()}
                          </span>
                        </td>
                        <td>{formatDateTime(booking.createdAt)}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteBooking(booking._id)}
                            className="btn btn-danger"
                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;