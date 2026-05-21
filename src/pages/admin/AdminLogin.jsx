import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, KeyRound, UserCog } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { initiateAdminLogin, verifyAdminMfa } = useAuth();

  const [identifier, setIdentifier] = useState('EMP-KIOSK-001');
  const [password, setPassword] = useState('Admin@2026!');
  const [mfaCode, setMfaCode] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [devMfaCode, setDevMfaCode] = useState('');
  const [deliveryHint, setDeliveryHint] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isMfaStep = Boolean(challengeId);

  const headerText = useMemo(() => {
    if (isMfaStep) {
      return `MFA verification for ${deliveryHint || 'your official email'}`;
    }
    return 'Employee ID or official email login';
  }, [deliveryHint, isMfaStep]);

  const handlePrimaryLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const result = await initiateAdminLogin({ identifier, password });
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Admin login failed.');
      return;
    }

    setChallengeId(result.challengeId || '');
    setDeliveryHint('official MFA channel');
    setDevMfaCode(result.devMfaCode || '');
    if (result.devMfaCode) {
      setMfaCode(result.devMfaCode);
    }
  };

  const handleMfaSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const result = await verifyAdminMfa({ challengeId, mfaCode });
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'MFA verification failed.');
      return;
    }

    navigate(result.dashboardPath || '/super-admin', { replace: true });
  };

  const goBack = () => {
    if (isMfaStep) {
      setChallengeId('');
      setMfaCode('');
      setError('');
      return;
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-slate-900 text-white mx-auto flex items-center justify-center mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">SUVIDHA Admin Portal</h1>
          <p className="text-sm text-slate-600 mt-1">{headerText}</p>
        </div>

        {!isMfaStep ? (
          <form onSubmit={handlePrimaryLogin} className="space-y-4">
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1">Employee ID / Official Email</span>
              <div className="relative">
                <UserCog className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl pl-10 pr-3 py-3"
                  required
                  autoComplete="username"
                />
              </div>
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1">Password</span>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl pl-10 pr-3 py-3"
                  required
                  autoComplete="current-password"
                />
              </div>
            </label>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white rounded-xl py-3 font-semibold hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? 'Validating...' : 'Continue to MFA'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1">MFA Code</span>
              <input
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full border border-slate-300 rounded-xl px-3 py-3 tracking-[0.4em] text-center text-lg"
                required
                inputMode="numeric"
                maxLength={6}
              />
            </label>

            {devMfaCode ? (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                Dev MFA code: <strong>{devMfaCode}</strong>
              </p>
            ) : null}

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={loading || mfaCode.length !== 6}
              className="w-full bg-slate-900 text-white rounded-xl py-3 font-semibold hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>
        )}

        <button onClick={goBack} className="w-full mt-4 text-sm text-slate-600 hover:text-slate-900">
          {isMfaStep ? 'Back to credentials' : 'Back to landing'}
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
