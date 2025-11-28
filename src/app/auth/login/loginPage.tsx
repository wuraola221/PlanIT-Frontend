'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import loginImg from '@/assets/asset-login.png';
import { jwtDecode } from "jwt-decode";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

interface JwtPayload {
  sub: string;
  role: string;
  name: string;
  permissions: string;
  exp: number;
  iat: number;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);

  const [activationMsg, setActivationMsg] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    const activated = searchParams.get('activated');
    if (activated === 'true') {
      setActivationMsg({
        text: 'Your account has been successfully activated. You can now log in.',
        type: 'success',
      });
    } else if (activated === 'false') {
      setActivationMsg({
        text: 'Account activation failed. Please contact support.',
        type: 'error',
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (activationMsg) {
      const timer = setTimeout(() => setActivationMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [activationMsg]);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false); // ✅ Loading state

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true); // ✅ Start loading

    try {
      const res = await fetch(`${backendUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        const decoded: JwtPayload = jwtDecode(data.token);
        const user = {
          token: data.token,
          role: decoded.role,
          fullName: decoded.name,
          email: decoded.sub,
        };
        localStorage.setItem("user", JSON.stringify(user));

        switch (decoded.role) {
          case 'LEAD_DEVELOPER':
            router.push('/dashboard/leadDeveloper-dashboard');
            break;
          case 'DEVELOPER':
          default:
            router.push('/developer/developer-dashboard');
            break;
        }
      } else {
        setErrorMsg(data.message || 'Invalid email or password');
      }
    } catch {
      setErrorMsg('Login failed. Please try again.');
    } finally {
      setLoading(false); // ✅ Stop loading
    }
  };

  return (
    <div className="min-h-screen flex bg-blue-900 px-4">
      {/* Activation Message */}
      <AnimatePresence>
        {activationMsg && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed top-0 left-0 right-0 flex justify-center z-50"
          >
            <div
              className={`m-4 p-3 rounded shadow-md ${
                activationMsg.type === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {activationMsg.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Form */}
      <div className="w-1/3 bg-white h-[450px] mt-[110px] ml-[50px] rounded-[10px] mb-[60px]">
        <form onSubmit={handleSubmit} className="justify-center items-center flex flex-col">
          <h2 className="text-[30px] font-bold text-center mt-[56px] text-black">Login</h2>

          {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-[350px] p-2 mt-[40px] border rounded text-black"
          />
          <div className="relative w-[350px] mt-[40px]">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full bg-white p-2 pr-10 border rounded text-black"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        
          <h3 className="mt-[12px] text-blue-900 underline text-[10px] decoration-blue-900 underline-offset-4 ml-[265px]">
            <Link href="forgot-password"> Forgot Password?</Link>
          </h3>

          {/* Login Button with Loading State */}
          <button
            type="submit"
            disabled={loading}
            className={`w-[350px] p-2 rounded mt-[48px] transition-colors ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <h3 className="mt-[8px] text-gray-700 text-[10px]">
            No account yet?{' '}
            <span className="font-bold text-blue-900 underline text-[10px] decoration-blue-900 underline-offset-4">
              <Link href="/">Register</Link>
            </span>
          </h3>
        </form>
      </div>

      {/* Right Side Image */}
      <div className="w-2/3 mt-[110px] rounded-xl">
        <Image
          src={loginImg}
          alt="Login Image"
          className="w-[100%] h-[450px] mx-auto mr-[100px] object-contain rounded-xl"
        />
      </div>
    </div>
  );
}
