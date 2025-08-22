'use client';

import { useState } from 'react';
import { useEffect } from "react";
import { useCallback } from "react";
import Link from 'next/link';
import Image from 'next/image';
import testImg from "@/assets/asset-test-img.png"
//import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  // const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: '',
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  

  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isFormValid, setIsFormValid] = useState(false);


// ...

const validateForm = useCallback(() => {
  const newErrors: { [key: string]: string } = {};

  if (touched.fullName && !formData.fullName.trim()) {
    newErrors.fullName = "Full Name is required";
  }

  if (touched.email) {
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
  }

  if (touched.password) {
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (
      !/[A-Z]/.test(formData.password) ||
      !/[0-9]/.test(formData.password) ||
      !/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
    ) {
      newErrors.password =
        "Password must contain at least one uppercase letter, one number, and one special character";
    }
  }

  if (touched.role && !formData.role) {
    newErrors.role = "Role is required";
  }

  setErrors(newErrors);

  const allFieldsValid =
    formData.fullName.trim() &&
    formData.email.trim() &&
    /\S+@\S+\.\S+/.test(formData.email) &&
    formData.password.trim() &&
    formData.password.length >= 8 &&
    /[A-Z]/.test(formData.password) &&
    /[0-9]/.test(formData.password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) &&
    formData.role;

  setIsFormValid(!!allFieldsValid);
}, [formData, touched]);

useEffect(() => {
  validateForm();
}, [validateForm]);




  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });


    if (!touched[name]) {
      setTouched({ ...touched, [name]: true });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    // Mark field as touched when user leaves the field
    setTouched({ ...touched, [name]: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      fullName: true,
      email: true,
      password: true,
      role: true,
    });
    
    if (!isFormValid) {
      setErrorMsg("Please fix the errors before submitting.");
      return;
    }
    

    //Replace the await below to the correct path of your api
    try {
      const res = await fetch('http://localhost:8080/api/v2.0/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    
      if (res.ok) {
        setFormData({ fullName: '', email: '', password: '', role: '' });
        setTouched({}); 
        setErrors({});
        setSuccessMsg('Registration successful! Please check your email to activate your account.');
        setErrorMsg('');
      } else {
        let errorData;
        try {
          errorData = await res.json();
        } catch {
          errorData = { message : 'An error occurred during registration.' };
        }
        setErrorMsg(errorData.message || 'Registration failed');
      }
    } catch (error: unknown) {
      setErrorMsg(
        'Server error: ' +
        (error instanceof Error ? error.message : 'Something went wrong. Please try again later.')
      );
      setSuccessMsg('');
    }
}

      //Replace the await below to the correct path of your api for resending the activation link
      const handleResendActivation = async () => {
        setSuccessMsg('');
        setErrorMsg('');
  
        if (!formData.email) {
          setErrorMsg('Please enter your email above first.');
          return;
        }

      try {
        const res = await fetch('http://localhost:8080/api/v2.0/auth/resend-activation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email }),
        });

        const data = await res.json();

        if (res.ok) {
          setSuccessMsg('Activation link has been resent to your email.');
        } else {
          setErrorMsg(data.message || 'Failed to resend activation link.');
        }
      } catch (_) {
        setErrorMsg("Something went wrong.");
      }      
    };

  

  return (

    <div className="flex min-h-screen bg-gray-50">
  {/* Left Panel */}
  <div className="w-1/2 bg-blue-900 text-white">
    <div className="max-w-md mx-auto ml-10 px-12 pt-17 text-left">
     
      <h1 className="text-3xl font-bold  pr-26 mt-2">Welcome to <br/>our community </h1>
      <p className="text-base mt-[24px] mb-[80px]">
        Register today to gain secure access.<br/> manage tasks seamlessly,
        and collaborate<br/> effortlessly with your team.
      </p>
      
      <div className="bg-white p-6 rounded-xl shadow-md">
        <Image
          src={testImg}
          alt="Illustration"
          width={192}
          height={280}
          className="w-48 h-70 mx-auto object-contain"
        />
      </div>
    </div>
  </div>

    <div className="flex flex-col justify-center w-1/2 p-12">
        <div className="max-w-md w-full mx-auto">
          <h2 className="text-2xl font-bold mb-2">Join PlanIT</h2>
          <p className="text-gray-600 mb-6">
            Your platform for organized, efficient task management
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium text-black">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                onBlur={handleBlur} 
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.fullName && <p className="text-red-600 text-sm">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block mb-1 font-medium text-black">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
            </div>

            <div>
              <label className="block mb-1 font-medium text-black">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.password && <p className="text-red-600 text-sm">{errors.password}</p>}
            </div>

            <div>
              <label className="block mb-1 font-medium text-black">Role</label>
              <div className="relative">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full border border-gray-300 rounded-lg p-2 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a role</option>
                  <option value="LEAD_DEVELOPER">Lead Developer</option>
                  <option value="DEVELOPER">Developer</option>
                </select>

    
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 pl-2 pointer-events-none text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>


            <button
              type="submit"
              disabled={!isFormValid}
              className="mt-4 w-full bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-800 transition"
            >
              Register
            </button>
          </form>
          {successMsg && (
            <div className="mt-4 p-3 rounded-lg bg-green-100 text-green-700 border border-green-300">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="mt-4 p-3 rounded-lg bg-red-100 text-red-700 border border-red-300">
              {errorMsg}
           </div>
          )}

          <div > 
            <p className='text-gray-600 mt-3 mb-4'>Have an account already?<Link href="/login"> <span className='text-blue-900'>Login</span></Link></p>
          </div>
        </div>
      </div>
    </div>
  );
    
    
}
