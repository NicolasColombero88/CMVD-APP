import React, { useState, useEffect } from "react";
import { useDispatch } from 'react-redux';
import { login } from '../store/authActions';
import { useNavigate, Link ,useLocation } from 'react-router-dom';
import Layout from '@/components/LayoutHome';
import ReCAPTCHA from "react-google-recaptcha";
import { clearAuth } from '../store/authSlice';

const RECAPTCHA_KEY = import.meta.env.VITE_RECAPTCHA_KEY;

export default function Login() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || '/waybills';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useEffect(() => {
    index();
  }, []);
  const index = async () => {
    dispatch(clearAuth());
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    if (!captchaVerified) {
      setErrorMessage('Por favor verifica el CAPTCHA.');
      setLoading(false);
      return;
    }
    let message = await dispatch(login(email, password));
    if (message !== "") {
      setErrorMessage(message);
    } else {
      navigate(redirectPath);
    }
    setLoading(false);
  };

  const handleCaptchaChange = (value) => {
    if (value) {
      setCaptchaVerified(true);
    } else {
      setCaptchaVerified(false);
    }
  };

  return (
    <Layout>
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-gray-900">
            Inicia sesión en tu cuenta
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="block max-w-4xl p-8 bg-white border border-gray-300 rounded-lg shadow mx-auto">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                  Dirección de correo electrónico
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-md border-0 py-2 pl-3 pr-12 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                    Contraseña
                  </label>
                  <div className="text-sm">
                    <Link to="/recovery" className="font-semibold text-cyan-600 hover:text-cyan-500">
                      ¿Has olvidado tu contraseña?
                    </Link>
                  </div>
                </div>
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md border-0 py-2 pl-3 pr-12 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                {errorMessage && (
                  <div className="text-red-500 text-sm text-center mb-4">
                    {errorMessage}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                  <ReCAPTCHA
                    sitekey={RECAPTCHA_KEY}
                    onChange={handleCaptchaChange}
                  />
                </div>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-cyan-400 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
                  disabled={loading}
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </button>
              </div>
            </form>

            <p className="mt-10 text-center text-sm text-gray-500">
              ¿No tienes cuenta?{' '}
              <Link  to={`/register?redirect=${redirectPath}`} className="font-semibold text-cyan-600 hover:text-cyan-500">
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
