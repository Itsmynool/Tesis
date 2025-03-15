import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthProps } from '../types';
import LoginForm from './LoginForm';
import anime from 'animejs';

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

  // SVG animation logic (ajustada para el nuevo tamaño)
  useEffect(() => {
    let current: anime.AnimeInstance | null = null;

    const animatePath = (strokeDashoffset: number) => {
      if (current) current.pause();
      current = anime({
        targets: 'path',
        strokeDashoffset: {
          value: strokeDashoffset,
          duration: 700,
          easing: 'easeOutQuart',
        },
        strokeDasharray: {
          value: '600 3386', // Ajustado para el nuevo tamaño del SVG
          duration: 700,
          easing: 'easeOutQuart',
        },
      });
    };

    const usernameInput = document.querySelector('#username');
    const passwordInput = document.querySelector('#password');
    const submitButton = document.querySelector('#submit');

    // Animación inicial para que el SVG sea visible
    animatePath(0);

    // Animaciones al enfocar cada campo
    usernameInput?.addEventListener('focus', () => animatePath(0));
    passwordInput?.addEventListener('focus', () => animatePath(-336));
    submitButton?.addEventListener('focus', () => animatePath(-730));

    return () => {
      usernameInput?.removeEventListener('focus', () => {});
      passwordInput?.removeEventListener('focus', () => {});
      submitButton?.removeEventListener('focus', () => {});
    };
  }, []);

  return (
    <LoginForm
      username={username}
      setUsername={setUsername}
      password={password}
      setPassword={setPassword}
      error={error}
      handleSubmit={handleSubmit}
    />
  );
};

export default Login;