import { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { AuthProps } from '../types';

interface ErrorResponse {
  message: string;
}

const Login: React.FC<AuthProps> = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post<{ token: string; devices: string[] }>(
        'http://localhost:5000/api/auth/login',
        {
          username,
          password,
        }
      );
      setToken(response.data.token, response.data.devices);
      navigate('/dashboard');
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      if (error.response && error.response.data) {
        setError(
          error.response.data.message === 'Invalid credentials'
            ? 'Credenciales inválidas'
            : 'Error al iniciar sesión'
        );
      } else {
        setError('Error al iniciar sesión');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Nombre de usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Ingrese su usuario"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Ingrese su contraseña"
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Iniciar Sesión
          </button>
        </form>
        <p className="mt-4 text-center">
          ¿No tienes una cuenta? <Link to="/signup" className="text-blue-500 hover:underline">Regístrate</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;