import { Link } from 'react-router-dom';

interface SignupFormProps {
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  error: string;
  handleSubmit: (e: React.FormEvent) => void;
}

const SignupForm: React.FC<SignupFormProps> = ({
  username,
  setUsername,
  password,
  setPassword,
  error,
  handleSubmit,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-800 flex items-center justify-center p-6">
      <div className="flex flex-col md:flex-row w-full max-w-6xl h-auto md:h-[400px] bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Left Section (Información) */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center bg-gradient-to-br from-gray-800 to-indigo-900 text-white">
          <h1 className="text-4xl font-extrabold mb-4">Regístrate</h1>
          <p className="text-gray-300 text-sm leading-relaxed">
            Crea tu cuenta para comenzar. Por favor, completa el formulario para registrarte. Al continuar, aceptas nuestros términos y condiciones.
          </p>
        </div>

        {/* Right Section (Formulario) */}
        <div className="w-full md:w-1/2 relative bg-gray-100 p-10 flex items-center">
          {/* SVG animado (ajustado para cubrir todo el formulario) */}
          <svg
            className="svg-animated"
            viewBox="0 0 700 700"
          >
            <defs>
              <linearGradient
                id="linearGradient"
                x1="13"
                y1="193.49992"
                x2="687"
                y2="193.49992"
                gradientUnits="userSpaceOnUse"
              >
                <stop style={{ stopColor: '#00ffcc' }} offset="0" id="stop876" />
                <stop style={{ stopColor: '#ff00ff' }} offset="1" id="stop878" />
              </linearGradient>
            </defs>
            <path
              d="m 40,120.00016 619.99984,-3.2e-4 c 0,0 24.99263,0.79932 25.00016,35.00016 0.008,34.20084 -25.00016,35 -25.00016,35 h -619.99984 c 0,-0.0205 -25,4.01348 -25,38.5 0,34.48652 25,38.5 25,38.5 h 595 c 0,0 20,-0.99604 20,-25 0,-24.00396 -20,-25 -20,-25 h -570 c 0,0 -20,1.71033 -20,25 0,24.00396 20,25 20,25 h 548.57143"
              fill="none"
              stroke="url(#linearGradient)"
              strokeWidth="8"
              strokeDasharray="600 3386"
            />
          </svg>

          {/* Formulario */}
          <div className="relative z-20 w-full max-w-md space-y-6">
            {error && (
              <p className="text-red-500 mb-4 text-sm bg-red-100 p-2 rounded-lg">
                {error}
              </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="username"
                  className="block text-gray-700 text-sm font-medium mb-2"
                >
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ingrese su usuario"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-gray-700 text-sm font-medium mb-2"
                >
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ingrese su contraseña"
                  required
                />
              </div>

              <button
                type="submit"
                id="submit"
                className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-colors duration-300 font-semibold"
              >
                Registrarse
              </button>
            </form>

            <p className="text-center text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link
                to="/login"
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;