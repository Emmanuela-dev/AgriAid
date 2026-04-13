import React from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const HeroSection = () => {
  return (
    <div className="relative bg-gradient-to-r from-green-50 to-green-100 py-20 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-block bg-green-100 px-4 py-2 rounded-full text-green-600 font-medium text-sm mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              AI-Powered Farming Assistant
            </motion.div>
            <motion.h1
              className="text-5xl font-bold text-gray-900 leading-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Revolutionizing Agriculture with Voice-Based AI Technology
            </motion.h1>
            <motion.p
              className="text-xl text-gray-600 mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              AgriAid combines cutting-edge AI with established agricultural 
              wisdom to empower farmers around the world with real-time insights.
            </motion.p>
            <motion.div
              className="flex items-center space-x-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Link href="/login">
                <motion.button
                  className="bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-700 transition-colors flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started <ArrowRight className="ml-2 w-5 h-5" />
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative group">
              <div className="absolute -inset-4 bg-green-500/20 rounded-3xl blur-2xl group-hover:bg-green-500/30 transition-all duration-500" />
              <motion.img
                src="/images/hero_kenyan_farmer.png"
                alt="Kenyan Farmer using AgriAid"
                className="relative rounded-2xl shadow-2xl w-full h-auto object-cover aspect-[4/3]"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
