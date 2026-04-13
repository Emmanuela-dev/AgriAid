"use client";
import React, { useContext, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { motion } from "framer-motion";
import { Eye, EyeOff, User, Lock, CheckCircle2 } from "lucide-react";
import UserContext from "@/context/UserContext";

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const userContext = useContext(UserContext);

  if (!userContext) {
    throw new Error("UserContext must be used within a RegisterationProvider");
  }

  const { login, loading } = userContext;

  const validationSchema = Yup.object({
    role: Yup.string().required("Please select your role"),
    agree: Yup.boolean().oneOf(
      [true],
      "You must agree to the terms and conditions"
    ),
    username: Yup.string().email("Please enter a valid email address").required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required")
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Formik
        initialValues={{
          role: "farmer",
          username: "",
          password: "",
          agree: false
        }}
        validationSchema={validationSchema}
        onSubmit={(values) => {
          login(values);
        }}
      >
        {({ values, setFieldValue }) => (
          <Form className="flex flex-col w-full space-y-5">
            {/* Premium Role Selection */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-2">
              {["farmer", "soil-agent"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFieldValue("role", r)}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    values.role === r
                      ? "bg-white text-green-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {r === "farmer" ? "Farmer" : "Soil Agent"}
                </button>
              ))}
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400 group-focus-within:text-green-600 transition-colors" />
                </div>
                <Field
                  name="username"
                  type="email"
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="e.g. name@gmail.com"
                />
              </div>
              <ErrorMessage name="username" component="div" className="text-xs text-red-500 ml-1" />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400 group-focus-within:text-green-600 transition-colors" />
                </div>
                <Field
                  name="password"
                  type={showPassword ? "text" : "password"}
                  disabled={loading}
                  className="w-full pl-11 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <ErrorMessage name="password" component="div" className="text-xs text-red-500 ml-1" />
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-3 py-1">
              <div className="flex items-center h-5 mt-0.5">
                <Field
                  type="checkbox"
                  name="agree"
                  disabled={loading}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
                />
              </div>
              <label className="text-sm text-gray-600 cursor-pointer">
                I agree to the{" "}
                <span className="text-green-600 font-medium hover:underline">Terms and Conditions</span>
              </label>
            </div>
            <ErrorMessage name="agree" component="div" className="text-xs text-red-500 -mt-3" />

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  <span>Login to AgriAid</span>
                </>
              )}
            </motion.button>
          </Form>
        )}
      </Formik>
    </motion.div>
  );
};

export default LoginForm;
