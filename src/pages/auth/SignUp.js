import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Eye, EyeOff } from 'lucide-react';
import '../../styles/auth.css';
import logo from '../../assets/logo.png';

const SignUp = () => {
  const navigate = useNavigate();
  const { signUpWithEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSignUp = async (e) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    const { data, error: signUpError } = await signUpWithEmail(email, password);

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Mark user as location owner (business details go in locations table on intake)
    if (data?.user) {
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          auth_id: data.user.id,
          email: data.user.email,
          is_location: true,
        }, { onConflict: 'auth_id' });

      if (upsertError) {
        console.error('Error setting location flag:', upsertError);
      }
    }

    navigate('/');
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
          <p className="auth-subtitle">Register as a Location Partner</p>
          <span className="auth-badge">For Business Owners</span>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleEmailSignUp}>
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
                placeholder="At least 8 characters"
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

          <div className="input-group">
            <label className="input-label">Confirm Password</label>
            <div className="password-wrapper">
              <input
                type={showConfirm ? 'text' : 'password'}
                className="auth-input"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? <div className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <span className="auth-footer-text">
            Already registered?{' '}
            <Link to="/login" className="auth-footer-link">Sign in</Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
