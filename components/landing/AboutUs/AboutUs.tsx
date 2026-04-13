import { motion } from "motion/react";

const AboutUs = () => {
  return (
    <div id="about" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6 relative inline-block">
              About AgriAid
              <div className="absolute -bottom-2 left-0 w-20 h-1.5 bg-green-500 rounded-full" />
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              AgriAid represents our commitment to bridging the gap between advanced technology and 
              traditional agricultural practices. Our mission is to create an intuitive, voice-powered 
              platform that provides every farmer—regardless of literacy level or technical 
              expertise—with the insights they need to succeed in a changing world.
            </p>
            <p className="text-gray-600 leading-relaxed text-lg mb-8">
              By combining real-time data analysis, precision mapping, and multilingual AI support, 
              we empower agricultural communities to improve yields, optimize resources, and 
              secure their livelihoods for the future.
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                    U{i}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 font-medium tracking-wide">TRUSTED BY 10,000+ FARMERS</p>
            </div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <img 
                src="https://images.unsplash.com/photo-1592982537447-744040d7c50a?q=80&w=1000&auto=format&fit=crop" 
                alt="Agri Tech"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative elements */}
            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-green-100 rounded-full -z-0 blur-xl" />
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-green-200/50 rounded-full -z-0 blur-lg" />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
