import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRightIcon, BeakerIcon, SparklesIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const HeroSection: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-dark-200">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-10 dark:opacity-20">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-500 blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-96 h-96 rounded-full bg-secondary-500 blur-3xl" />
        <div className="absolute -bottom-24 right-1/2 w-96 h-96 rounded-full bg-accent-500 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm font-medium mb-4"
              >
                <SparklesIcon className="h-4 w-4 mr-2" />
                <span>Powered by AI and LAMMPS</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-gray-900 dark:text-white"
              >
                <span className="block">Molecular Simulations</span>
                <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-accent-500 to-secondary-500">
                  Made Simple
                </span>
              </motion.h1>
            </div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl"
            >
              Materavest MVP transforms complex molecular dynamics simulations into an intuitive experience. 
              Describe your simulation in natural language and let our AI generate the LAMMPS input for you.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <a
                href="#simulation-form"
                className="btn btn-primary inline-flex items-center justify-center rounded-md text-base font-medium shadow-sm"
              >
                Start Simulating
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </a>
              <a
                href="/docs"
                className="btn btn-outline inline-flex items-center justify-center rounded-md text-base font-medium border border-gray-300 dark:border-gray-700"
              >
                View Documentation
              </a>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-100">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/10" />
              
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">simulation.lmp</div>
                </div>
                
                <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 overflow-x-auto">
                  <code>{`# LAMMPS input file for water simulation
units           real
atom_style      full
boundary        p p p

# Create simulation box and atoms
region          box block -20 20 -20 20 -20 20
create_box      2 box
create_atoms    1 random 100 341341 box

# Define atom properties
mass            1 18.0  # Water molecule
mass            2 1.0   # Hydrogen

# Set up force field
pair_style      lj/cut/coul/long 10.0
pair_coeff      1 1 0.155 3.166  # O-O
pair_coeff      2 2 0.0 0.0      # H-H

# Run simulation
minimize        1.0e-4 1.0e-6 1000 10000
fix             1 all nvt temp 300.0 300.0 100.0
timestep        1.0
thermo          100
thermo_style    custom step temp pe ke etotal press
dump            1 all xyz 100 simulation.xyz
run             1000`}</code>
                </pre>
              </div>
            </div>
            
            {/* Floating elements */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute -top-6 -right-6 bg-white dark:bg-dark-100 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-center space-x-3">
                <BeakerIcon className="h-6 w-6 text-primary-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">AI Generated</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">LAMMPS Input</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute -bottom-6 -left-6 bg-white dark:bg-dark-100 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-center space-x-3">
                <ChartBarIcon className="h-6 w-6 text-secondary-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Instant Results</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Visualize Simulations</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection; 