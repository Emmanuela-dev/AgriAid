"use client";
import React, { useContext, useEffect } from "react";
import LoginForm from "@/components/auth/LoginForm";
import Link from "next/link";
import UserContext from "@/context/UserContext";
import { mission } from "@/config/ImagesUrl";
import { Tractor, Sprout } from "lucide-react";

const LoginPage = () => {
  const userContext = useContext(UserContext);

  // Reset loading state when the login page mounts.
  // UserState persists across client-side navigation, so loading might
  // still be `true` after a signup redirect — which disables all form inputs.
  useEffect(() => {
    userContext?.setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty: run once on mount only

  if (!userContext) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-6 text-center max-w-sm mx-auto">
          <Tractor className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            System Error
          </h2>
          <p className="text-gray-600">
            Please try refreshing the page or contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Left Panel - Login Form */}
      <div className="w-full lg:w-[45%] flex flex-col relative">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} 
        />
        
        <div className="p-8 flex items-center justify-between z-10">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="bg-green-600 p-2 rounded-xl group-hover:scale-110 transition-transform">
              <Sprout className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">AgriAid</span>
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 z-10">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-10 text-center lg:text-left">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
                Welcome Back
              </h1>
              <p className="text-gray-500 text-lg">
                Enter your details to access your dashboard
              </p>
            </div>

            <LoginForm />

            <div className="mt-10 pt-8 border-t border-gray-100 text-center">
              <p className="text-gray-500">
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  className="text-green-600 font-bold hover:text-green-700 transition-colors ml-1"
                >
                  Create free account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Mission Statement */}
      <div className="hidden lg:block lg:w-[55%] relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] hover:scale-110 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.3)), url(${mission})`,
          }}
        />
        <div className="relative h-full flex flex-col justify-center items-start text-white p-20 xl:p-32">
          <div className="space-y-8 max-w-2xl">
            <div className="inline-block px-4 py-1.5 bg-green-500/20 backdrop-blur-md rounded-full border border-green-500/30 text-green-400 text-sm font-bold uppercase tracking-widest">
              Our Vision 2026
            </div>
            <h2 className="text-5xl xl:text-6xl font-black leading-tight">
              Revolutionizing <br />
              <span className="text-green-500 underline decoration-green-500/30">Kenyan Farming</span>
            </h2>
            <p className="text-xl text-gray-200 leading-relaxed font-light">
              AgriAid is building a digital ecosystem that empowers local farmers with
              real-time soil analytics, crop optimization tools, and a global
              marketplace for shared prosperity.
            </p>
            
            <div className="pt-10 grid grid-cols-3 gap-10 border-t border-white/10">
              <div>
                <h3 className="text-3xl font-bold mb-1">10K+</h3>
                <p className="text-gray-400 text-sm font-medium">Farmers Joined</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-1">50K+</h3>
                <p className="text-gray-400 text-sm font-medium">Soil Tests Done</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-1">47</h3>
                <p className="text-gray-400 text-sm font-medium">Counties Covered</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
