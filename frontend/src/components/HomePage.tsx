import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const HomePage = () => {
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
    <div
      className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden bg-gradient-to-br from-white to-blue-500"
      style={{
        background: 'linear-gradient(to bottom right, #ffffff, #3b82f6)', // Fallback if Tailwind fails
      }}
    >
      {/* Contenido principal */}
      <motion.main
        className="flex flex-col items-center justify-center text-center px-6 sm:px-8 lg:px-10 z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight shadow-md"
          variants={itemVariants}
        >
          Monitoreo Inteligente
        </motion.h1>

        <motion.h2
          className="text-2xl sm:text-3xl md:text-4xl font-semibold text-indigo-600 mb-6 leading-snug"
          variants={itemVariants}
        >
          Para un Entorno Saludable
        </motion.h2>

        <motion.p
          className="text-base sm:text-lg md:text-xl text-gray-700 mb-8 max-w-2xl font-light leading-relaxed"
          variants={itemVariants}
        >
          Monitorea en tiempo real la calidad del aire, temperatura, humedad y más. 
          Toma el control de tu entorno con nuestra plataforma avanzada y mantén tu espacio seguro.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 mb-12"
          variants={itemVariants}
        >
          <Link
            to="/login"
            className="px-8 py-4 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-lg hover:scale-105 transform transition duration-300"
          >
            Iniciar Sesión
          </Link>

          <Link
            to="/signup"
            className="px-8 py-4 rounded-lg bg-white text-blue-500 font-semibold shadow-lg hover:bg-gray-200 hover:scale-105 transform transition duration-300"
          >
            Registrarse
          </Link>
        </motion.div>
      </motion.main>

      {/* Footer fijo */}
      <footer className="fixed bottom-0 w-full text-center py-4 bg-white/80 backdrop-blur-sm text-gray-700 text-sm z-20">
        © {new Date().getFullYear()} Plataforma de Monitoreo Inteligente. Todos los derechos reservados.
      </footer>
    </div>
  );
};

export default HomePage;