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
      className="relative min-h-screen flex flex-col justify-start items-center overflow-hidden bg-gradient-to-br from-white to-blue-500"
      style={{
        background: 'linear-gradient(to bottom right, #ffffff, #3b82f6)', // Fallback por si Tailwind falla
      }}
    >
      {/* Contenido principal */}
      <motion.main
        className="flex flex-col items-center justify-start text-center px-6 sm:px-8 lg:px-10 z-10 mt-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight shadow-md font-sans"
          variants={itemVariants}
        >
          Monitoreo Inteligente
        </motion.h1>

        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-semibold text-indigo-600 mb-8 leading-snug font-sans"
          variants={itemVariants}
        >
          Para un Entorno Saludable
        </motion.h2>

        <motion.p
          className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-12 max-w-3xl font-light leading-relaxed font-sans"
          variants={itemVariants}
        >
          Monitorea en tiempo real la calidad del aire, temperatura, humedad y más. 
          Toma el control de tu entorno con nuestra plataforma avanzada y mantén tu espacio seguro.
        </motion.p>

        <motion.div
          className="flex flex-row gap-6"
          variants={itemVariants}
        >
          <Link
            to="/login"
            className="px-10 py-5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transform transition duration-300"
          >
            Iniciar Sesión
          </Link>

          <Link
            to="/signup"
            className="px-10 py-5 rounded-xl bg-white text-blue-500 font-semibold text-lg shadow-xl hover:bg-gray-100 hover:shadow-2xl hover:-translate-y-1 transform transition duration-300 border border-blue-200"
          >
            Registrarse
          </Link>
        </motion.div>
      </motion.main>
    </div>
  );
};

export default HomePage;