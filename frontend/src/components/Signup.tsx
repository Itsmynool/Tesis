import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthProps } from '../types';
import SignupForm from './SignupForm';
import anime from 'animejs';

interface ErrorResponse {
  message: string;
}

const Signup: React.FC<AuthProps> = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post<{ token: string; devices: string[] }>(
        'http://localhost:5000/api/auth/signup',
        {
          username,
          password,
          devices: ['b8:27:eb:bf:9d:51'], // Dispositivo por defecto al registrarse
        }
      );
      setToken(response.data.token, response.data.devices);
      navigate('/dashboard');
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      if (error.response && error.response.data) {
        setError(
          error.response.data.message === 'Username already exists'
            ? 'El nombre de usuario ya existe'
            : 'Error al registrarse'
        );
      } else {
        setError('Error al registrarse');
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
    const handleUsernameFocus = () => animatePath(0);
    const handlePasswordFocus = () => animatePath(-336);
    const handleSubmitFocus = () => animatePath(-730);

    usernameInput?.addEventListener('focus', handleUsernameFocus);
    passwordInput?.addEventListener('focus', handlePasswordFocus);
    submitButton?.addEventListener('focus', handleSubmitFocus);

    return () => {
      usernameInput?.removeEventListener('focus', handleUsernameFocus);
      passwordInput?.removeEventListener('focus', handlePasswordFocus);
      submitButton?.removeEventListener('focus', handleSubmitFocus);
    };
  }, []);

  return (
    <SignupForm
      username={username}
      setUsername={setUsername}
      password={password}
      setPassword={setPassword}
      error={error}
      handleSubmit={handleSubmit}
    />
  );
};

export default Signup;