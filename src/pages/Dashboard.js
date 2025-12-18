import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          Location Dashboard
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '32px' }}>
          Welcome, {user?.email}
        </p>

        <div style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
            Coming Soon
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>
            The location intake form and dashboard are under development.
            You'll be able to manage your store listing, view scheduled trades,
            and configure notifications here.
          </p>
        </div>

        <button
          onClick={handleSignOut}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: 'transparent',
            border: '1px solid #2a2a2a',
            borderRadius: '10px',
            color: '#94a3b8',
            fontSize: '15px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
