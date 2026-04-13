import { motion } from "motion/react";

const AboutUs = () => {
  return (
    <div id="about" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            About AgriAid
          </h2>
          <p className="text-gray-600 text-lg">
            We are dedicated to revolutionizing agriculture through cutting-edge technology and accessible AI solutions.
          </p>
        </motion.div>
        
        <motion.div
          className="mt-12 text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-gray-600 leading-relaxed text-lg">
            AgriAid represents our commitment to bridging the gap between advanced technology and 
            traditional agricultural practices. Our mission is to create an intuitive, voice-powered 
            platform that provides every farmer—regardless of literacy level or technical 
            expertise—with the insights they need to succeed in a changing world.
          </p>
          <p className="text-gray-600 mt-6 leading-relaxed text-lg">
            By combining real-time data analysis, precision mapping, and multilingual AI support, 
            we empower agricultural communities to improve yields, optimize resources, and 
            secure their livelihoods for the future.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutUs;
