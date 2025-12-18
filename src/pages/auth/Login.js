import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import '../../styles/auth.css';
import logo from '../../assets/logo.png';

const Login = () => {
  const navigate = useNavigate();
  const { signInWithEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await signInWithEmail(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-header">
          <img
            src={logo}
            alt="CardChase"
            style={{
              width: 120,
              height: 120,
              borderRadius: 24,
              marginBottom: 16,
              objectFit: 'cover'
            }}
          />
          <h1 className="auth-title">CardChase</h1>
          <p className="auth-subtitle">Location Partner Portal</p>
          <span className="auth-badge">For Business Owners</span>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleEmailLogin}>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? <div className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <span className="auth-footer-text">
            New partner?{' '}
            <Link to="/signup" className="auth-footer-link">Register your location</Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
