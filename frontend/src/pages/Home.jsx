import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { roomsAPI } from '../utils/api';
import { DEMO_ROOMS } from '../constants/demoData';

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
      setRooms(DEMO_ROOMS);
      setError('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-content">
          <p className="home-eyebrow">Smart Workspace Booking</p>
          <h1>Book the right room in seconds</h1>
          <p className="home-subtitle">
            Find available spaces, avoid scheduling conflicts, and keep your team organized with
            a simple real-time booking experience.
          </p>

          {!isAuthenticated() && (
            <div className="home-cta-row">
              <Link to="/register" className="btn btn-primary">
                Create Account
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Sign In
              </Link>
            </div>
          )}

          {isAuthenticated() && (
            <div className="home-cta-row">
              <Link to="/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
            </div>
          )}

          <div className="home-stat-grid">
            <div className="home-stat-card">
              <h3>{rooms.length}</h3>
              <p>Rooms Available</p>
            </div>
            <div className="home-stat-card">
              <h3>9 AM - 5 PM</h3>
              <p>Daily Booking Slots</p>
            </div>
            <div className="home-stat-card">
              <h3>Real-time</h3>
              <p>Conflict Detection</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rooms-section">
        <div className="home-section-head">
          <h2>Available Rooms</h2>
          <p>Choose from active rooms and book instantly.</p>
        </div>
        
        {loading && (
          <div className="loading">Loading rooms...</div>
        )}
        
        {error && (
          <div className="alert alert-error">{error}</div>
        )}
        
        {!loading && !error && rooms.length === 0 && (
          <div className="card home-empty-state">
            <p>No rooms available at the moment.</p>
          </div>
        )}
        
        {!loading && !error && rooms.length > 0 && (
          <div className="grid home-rooms-grid">
            {rooms.map((room) => (
              <div key={room._id || room.id} className="card home-room-card">
                {room.imageUrl ? (
                  <img src={room.imageUrl} alt={room.name} className="home-room-image" />
                ) : (
                  <div className="home-room-placeholder">Meeting Space</div>
                )}
                <div className="home-room-content">
                  <h3>{room.name}</h3>
                  <p>{room.description}</p>
                  <div className="home-room-footer">
                    <small>
                    Created by: {room.createdBy?.fullName || 'Admin'}
                    </small>
                    <Link
                      to={isAuthenticated() ? '/dashboard' : '/login'}
                      className="btn btn-primary home-room-cta"
                    >
                      {isAuthenticated() ? 'Book Now' : 'Sign In to Book'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      
      <section className="features-section home-features-wrap">
        <div className="home-section-head">
          <h2>Why Teams Use This App</h2>
          <p>Simple workflows with practical controls for users and admins.</p>
        </div>
        <div className="grid-3 home-feature-grid">
          <div className="card home-feature-card">
            <h3>Easy Scheduling</h3>
            <p>Select your preferred date and time slots from 9 AM to 5 PM.</p>
          </div>
          
          <div className="card home-feature-card">
            <h3>Secure Booking</h3>
            <p>JWT-based authentication ensures your bookings are secure.</p>
          </div>
          
          <div className="card home-feature-card">
            <h3>Real-time Updates</h3>
            <p>See available slots in real-time and avoid double bookings.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;