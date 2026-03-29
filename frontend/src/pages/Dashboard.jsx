import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { roomsAPI, bookingsAPI } from '../utils/api';
import { DEMO_ROOMS } from '../constants/demoData';

const Dashboard = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [idProof, setIdProof] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const fetchRooms = useCallback(async () => {
    try {
      const response = await roomsAPI.getAll();
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms(DEMO_ROOMS);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
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
  }, []);

  const fetchAvailableSlots = useCallback(async (roomId, date) => {
    try {
      const response = await bookingsAPI.getAvailableSlots(roomId, date);
      setAvailableSlots(response.data);
      setSelectedSlots([]); // Reset selected slots when changing room/date
    } catch (error) {
      console.error('Error fetching available slots:', error);
      showMessage('Failed to load available slots', 'error');
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchRooms(), fetchBookings()]);
  }, [fetchRooms, fetchBookings]);

  useEffect(() => {
    if (selectedRoom && selectedDate) {
      fetchAvailableSlots(selectedRoom, selectedDate);
    } else {
      setAvailableSlots([]);
      setSelectedSlots([]);
    }
  }, [selectedRoom, selectedDate, fetchAvailableSlots]);

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleSlotToggle = (slot) => {
    if (availableSlots.bookedSlots?.includes(slot)) {
      return; // Can't select booked slots
    }

    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const handleBooking = async () => {
    if (!selectedRoom || !selectedDate || selectedSlots.length === 0) {
      showMessage('Please select a room, date, and at least one time slot', 'error');
      return;
    }

    if (!fullName || !idProof) {
      showMessage('Please provide your full name and ID proof', 'error');
      return;
    }

    try {
      setBookingLoading(true);
      await bookingsAPI.create({
        roomId: selectedRoom,
        date: selectedDate,
        timeSlots: selectedSlots,
        fullName,
        phoneNumber,
        idProof
      });
      
      showMessage('Booking created successfully!', 'success');
      
      // Reset form
      setSelectedRoom('');
      setSelectedDate('');
      setSelectedSlots([]);
      setAvailableSlots([]);
      setFullName('');
      setPhoneNumber('');
      setIdProof('');
      
      // Refresh bookings
      fetchBookings();
    } catch (error) {
      console.error('Booking error:', error);
      showMessage(
        error.response?.data?.message || 'Failed to create booking',
        'error'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await bookingsAPI.cancel(bookingId);
      showMessage('Booking cancelled successfully', 'success');
      fetchBookings();
    } catch (error) {
      console.error('Cancel booking error:', error);
      showMessage(
        error.response?.data?.message || 'Failed to cancel booking',
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

  const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <h1>📊 Dashboard</h1>
        <p>Welcome back, {user.fullName}! Book rooms and manage your reservations.</p>
      </div>

      {message && (
        <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <div className="grid-2">
        {/* Booking Form */}
        <div className="booking-section">
          <div className="card">
            <h2>🗓️ Book a Room</h2>
            
            <div className="form-group">
              <label htmlFor="fullName">Full Name *</label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="form-input"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number (Optional)</label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="form-input"
                placeholder="Enter your phone number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="idProof">ID Proof / ID Number *</label>
              <input
                type="text"
                id="idProof"
                value={idProof}
                onChange={(e) => setIdProof(e.target.value)}
                className="form-input"
                placeholder="e.g., Driver's License, Passport, etc."
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="room">Select Room</label>
              <select
                id="room"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="form-input"
              >
                <option value="">Choose a room...</option>
                {rooms.map((room) => (
                  <option key={room._id || room.id} value={room._id || room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="date">Select Date</label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-input"
                min={getTomorrow()}
              />
            </div>

            {selectedRoom && selectedDate && (
              <div className="slots-section">
                <h3>Available Time Slots</h3>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                  Room: <strong>{availableSlots.room}</strong> | 
                  Date: <strong>{formatDate(selectedDate)}</strong>
                </p>
                
                {availableSlots.availableSlots?.length === 0 ? (
                  <p style={{ color: '#dc3545' }}>No slots available for this date.</p>
                ) : (
                  <>
                    <div className="time-slots">
                      {availableSlots.availableSlots?.map((slot) => (
                        <div
                          key={slot}
                          className={`time-slot available ${
                            selectedSlots.includes(slot) ? 'selected' : ''
                          }`}
                          onClick={() => handleSlotToggle(slot)}
                        >
                          {slot}
                        </div>
                      ))}
                      {availableSlots.bookedSlots?.map((slot) => (
                        <div
                          key={slot}
                          className="time-slot booked"
                          title="This slot is already booked"
                        >
                          {slot}
                        </div>
                      ))}
                    </div>
                    
                    {selectedSlots.length > 0 && (
                      <div style={{ marginTop: '1rem' }}>
                        <p><strong>Selected slots:</strong> {selectedSlots.join(', ')}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            
            <button 
              onClick={handleBooking}
              disabled={bookingLoading || !fullName || !idProof || !selectedRoom || !selectedDate || selectedSlots.length === 0}
              className="btn btn-primary btn-full"
              style={{ marginTop: '1rem' }}
            >
              {bookingLoading ? 'Booking...' : 'Book Room'}
            </button>
          </div>
        </div>

        {/* My Bookings */}
        <div className="bookings-section">
          <div className="card">
            <h2>📅 My Bookings</h2>
            
            {loading && (
              <div className="loading">Loading bookings...</div>
            )}
            
            {!loading && bookings.length === 0 && (
              <p>No bookings yet. Book a room to get started!</p>
            )}
            
            {!loading && bookings.length > 0 && (
              <div>
                {bookings.map((booking) => (
                  <div 
                    key={booking._id || booking.id} 
                    className="booking-item"
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '1rem',
                      backgroundColor: booking.status === 'cancelled' ? '#fff5f5' : '#f8f9fa'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>
                          📍 {booking.room?.name || 'Unknown Room'}
                        </h4>
                        <p style={{ margin: '0.25rem 0', color: '#666' }}>
                          Name: {booking.fullName || 'N/A'}
                        </p>
                        {booking.phoneNumber && (
                          <p style={{ margin: '0.25rem 0', color: '#666' }}>
                            📱 {booking.phoneNumber}
                          </p>
                        )}
                        <p style={{ margin: '0.25rem 0', color: '#666' }}>
                          🪪 ID: {booking.idProof || 'N/A'}
                        </p>
                        <p style={{ margin: '0.25rem 0', color: '#666' }}>
                          Date: {formatDate(booking.date)}
                        </p>
                        <p style={{ margin: '0.25rem 0', color: '#666' }}>
                          🕒 {booking.timeSlots?.join(', ') || 'No time slots'}
                        </p>
                        <p style={{ 
                          margin: '0.25rem 0', 
                          color: booking.status === 'confirmed' ? '#28a745' : '#dc3545',
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}>
                          Status: {booking.status}
                        </p>
                      </div>
                      
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleCancelBooking(booking._id || booking.id)}
                          className="btn btn-danger"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;