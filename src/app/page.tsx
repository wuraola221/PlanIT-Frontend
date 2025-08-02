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
      const res = await fetch('http://localhost:8080/api/auth/register', {
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
        const res = await fetch('http://localhost:8080/api/auth/resend-activation', {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-100 p-8 rounded w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold text-center text-black">Register</h1>

        {successMsg && <p className="text-green-600">{successMsg}</p>}
        {errorMsg && <p className="text-red-600">{errorMsg}</p>}

        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Full Name"
          required
          className="w-full p-2 border rounded text-black"
        />

        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          required
          className="w-full p-2 border rounded text-black"
        />

        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          required
          className="w-full p-2 border rounded text-black"
        />

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded text-black"
        >
          <option value="">Select Role</option>
          <option value="leadDeveloper">Lead Developer</option>
          <option value="developer">Developer</option>
        </select>

      <button
        type="button"
        onClick={handleResendActivation}
        className="text-sm text-blue-500 hover:underline cursor-pointer"
      >
        Resend Activation Link
      </button>


        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 cursor-pointer"
        >
          Register
        </button>
      </form>
    </div>
  );
}
