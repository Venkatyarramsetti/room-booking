import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { roomsAPI } from '../utils/api';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomsAPI.getAll();
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      // Use static demo data when API fails
      setRooms([
        {
          _id: '1',
          name: 'Conference Room A',
          description: 'Large conference room with projector and whiteboard. Seats up to 12 people.',
          createdBy: { fullName: 'Admin' }
        },
        {
          _id: '2', 
          name: 'Meeting Room B',
          description: 'Small meeting room perfect for team discussions. Seats up to 6 people.',
          createdBy: { fullName: 'Admin' }
        },
        {
          _id: '3',
          name: 'Boardroom',
          description: 'Executive boardroom with premium furniture. Seats up to 16 people.',
          createdBy: { fullName: 'Admin' }
        }
      ]);
      setError('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="card" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1>Welcome to Room Booking System</h1>
          <p style={{ fontSize: '1.1rem', margin: '1rem 0' }}>
            Book meeting rooms easily and efficiently. Choose from available rooms
            and reserve your preferred time slots.
          </p>
          
          {!isAuthenticated() && (
            <div style={{ marginTop: '2rem' }}>
              <Link to="/register" className="btn btn-primary" style={{ marginRight: '1rem' }}>
                Get Started
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Sign In
              </Link>
            </div>
          )}
          
          {isAuthenticated() && (
            <div style={{ marginTop: '2rem' }}>
              <Link to="/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="rooms-section">
        <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>Available Rooms</h2>
        
        {loading && (
          <div className="loading">Loading rooms...</div>
        )}
        
        {error && (
          <div className="alert alert-error">{error}</div>
        )}
        
        {!loading && !error && rooms.length === 0 && (
          <div className="card" style={{ textAlign: 'center' }}>
            <p>No rooms available at the moment.</p>
          </div>
        )}
        
        {!loading && !error && rooms.length > 0 && (
          <div className="grid">
            {rooms.map((room) => (
              <div key={room._id} className="card">
                <h3>📍 {room.name}</h3>
                <p>{room.description}</p>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '1rem'
                }}>
                  <small style={{ color: '#666' }}>
                    Created by: {room.createdBy?.fullName || 'Admin'}
                  </small>
                  {isAuthenticated() && (
                    <Link 
                      to="/dashboard" 
                      className="btn btn-primary"
                      style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                    >
                      Book Now
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="features-section" style={{ marginTop: '3rem' }}>
        <div className="grid-3">
          <div className="card" style={{ textAlign: 'center' }}>
            <h3>🕒 Easy Scheduling</h3>
            <p>Select your preferred date and time slots from 9AM to 5PM.</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center' }}>
            <h3>🔒 Secure Booking</h3>
            <p>JWT-based authentication ensures your bookings are secure.</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center' }}>
            <h3>📱 Real-time Updates</h3>
            <p>See available slots in real-time and avoid double bookings.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;