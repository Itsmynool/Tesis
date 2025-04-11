import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const HomePage: React.FC = () => {
  // Animations with Framer Motion
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-800 via-blue-900 to-teal-900 flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Enhanced Background Decorative Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(45,212,191,0.15)_0%,_transparent_70%)] pointer-events-none"></div>
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-mosaic.png')] pointer-events-none"></div>

      {/* Main Container */}
      <motion.div
        className="text-center max-w-4xl mx-auto z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Enhanced Title */}
        <motion.h1
          className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-wide drop-shadow-lg"
          variants={itemVariants}
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
            Monitoreo Inteligente
          </span>
          <br />
          Para un Entorno Saludable
        </motion.h1>

        {/* Enhanced Subtitle */}
        <motion.p
          className="text-lg sm:text-xl md:text-2xl text-gray-100 mb-12 leading-relaxed max-w-3xl mx-auto font-light"
          variants={itemVariants}
        >
          Monitorea en tiempo real la calidad del aire, temperatura, humedad y más. Toma el control de tu entorno con nuestra plataforma avanzada y mantén tu espacio seguro.
        </motion.p>

        {/* Enhanced Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row justify-center gap-6"
          variants={itemVariants}
        >
          <Link
            to="/login"
            className="relative bg-gradient-to-r from-teal-500 to-blue-600 text-white px-10 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            Iniciar Sesión
          </Link>
          <Link
            to="/signup"
            className="relative bg-transparent border-2 border-teal-400 text-teal-300 px-10 py-4 rounded-xl text-lg font-semibold hover:bg-teal-500 hover:text-white hover:border-teal-500 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            Registrarse
          </Link>
        </motion.div>
      </motion.div>

      {/* Enhanced Footer */}
      <footer className="fixed bottom-0 w-full text-center py-4 text-gray-300 text-sm bg-gray-900/70 backdrop-blur-md border-t border-gray-700/50">
        © {new Date().getFullYear()} Plataforma de Monitoreo Inteligente. Todos los derechos reservados.
      </footer>
    </div>
  );
};

export default HomePage;