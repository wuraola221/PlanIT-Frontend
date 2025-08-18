'use client';

import { useState } from 'react';
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    //Replace the await below to the correct path of your api
    try {
      const res = await fetch('http://localhost:8080/api/v2.0/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ fullName: '', email: '', password: '', role: '' });
        setSuccessMsg('Registration successful! Please check your email to activate your account.');
      } else {
        const error = await res.json();
        setErrorMsg(error.message || 'Registration failed');
      }
    } catch (error: unknown) {
      setErrorMsg('Server error: ' + (error instanceof Error ? error.message : 'Try again later.'));
    }
    
  };

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
      } catch (err: unknown) {
        setErrorMsg('Error resending activation link: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    };

  

  return (

    <div className="flex min-h-screen bg-gray-50">
  {/* Left Panel */}
  <div className="w-1/2 bg-blue-900 text-white">
    <div className="max-w-md mx-auto px-12 pt-24 text-left">
     
      <h1 className="text-3xl font-bold pr-26 mb-4">Welcome to our community </h1>
      <p className="text-base mb-10">
        Register today to gain secure access, manage tasks seamlessly,
        and collaborate effortlessly with your team.
      </p>
      <div className="bg-white p-6 rounded-xl shadow-md">
        <img
          src="/register copy.png"  
          alt="Illustration"
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
              <label className="block mb-1 font-medium">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Role</label>
              <div className="relative">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
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
              className="mt-4 w-full bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-800 transition"
            >
              Register
            </button>
          </form>
          <div > 
            <p className='text-gray-600 mt-3 mb-4'>Have an account already?<a href=""> <span className='text-blue-900'>Login</span></a></p>
          </div>
        </div>
      </div>
    </div>
  );
    
    
}
