'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, RefreshCw, Search, Code, ArrowLeft, Mail, Github, ExternalLink } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGoHome = () => {
    setIsAnimating(true);
    setTimeout(() => {
      router.push('/');
    }, 300);
  };

  const handleGoBack = () => {
    setIsAnimating(true);
    setTimeout(() => {
      router.back();
    }, 300);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className={`max-w-4xl w-full text-center transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* 404 Animation and Icon in same row */}
        <div className="flex items-center justify-center gap-8 mb-8 flex-wrap">
          {/* 404 Text */}
          <div className="relative">
            <div className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-pulse">
              404
            </div>
            <div className="absolute inset-0 text-6xl md:text-8xl font-bold text-gray-200 -z-10 blur-sm">
              404
            </div>
          </div>

          {/* Icon Animation */}
          <div className="relative">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
              <Search className="w-12 h-12 md:w-16 md:h-16 text-blue-600 animate-bounce" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 md:w-8 md:h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg animate-pulse">
              !
            </div>
          </div>
        </div>

        {/* Main Message */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 animate-fade-in">
          Oops! Page Not Found
        </h1>
        
        <p className="text-lg text-gray-600 mb-2 animate-fade-in-delay-1">
          The page you're looking for seems to have vanished into the digital void.
        </p>
        
        <p className="text-md text-gray-500 mb-8 animate-fade-in-delay-2">
          Don't worry, even the best developers create missing pages sometimes! 🚀
        </p>

        {/* Fun Code Block */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8 text-left overflow-hidden animate-fade-in-delay-3">
          <div className="flex items-center mb-3">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <Code className="w-4 h-4 text-gray-400 ml-3" />
            <span className="text-gray-400 text-sm ml-2">error.jsx</span>
          </div>
          <div className="font-mono text-sm">
            <div className="text-blue-400">
              <span className="text-purple-400">function</span>{' '}
              <span className="text-yellow-400">findPage</span>
              <span className="text-gray-300">(</span>
              <span className="text-orange-400">url</span>
              <span className="text-gray-300">) {'{'}</span>
            </div>
            <div className="text-gray-300 ml-4">
              <span className="text-purple-400">if</span>{' '}
              <span className="text-gray-300">(</span>
              <span className="text-orange-400">url</span>
              <span className="text-gray-300"> === </span>
              <span className="text-green-400">&quot;{typeof window !== 'undefined' ? window.location.pathname : '/current-path'}&quot;</span>
              <span className="text-gray-300">) {'{'}</span>
            </div>
            <div className="text-red-400 ml-8">
              <span className="text-purple-400">return</span>{' '}
              <span className="text-green-400">&quot;404 - Page not found 😅&quot;</span>
              <span className="text-gray-300">;</span>
            </div>
            <div className="text-gray-300 ml-4">{'}'}</div>
            <div className="text-gray-300">{'}'}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-300 ${isAnimating ? 'opacity-50 scale-95' : ''}`}>
          <button
            onClick={handleGoHome}
            className="group flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 min-w-[180px]"
          >
            <Home className="w-5 h-5 mr-2 group-hover:animate-bounce" />
            Go to Homepage
          </button>
          
          <button
            onClick={handleGoBack}
            className="group flex items-center justify-center px-8 py-4 bg-white text-gray-700 font-semibold rounded-lg shadow-md hover:shadow-lg border-2 border-gray-200 hover:border-gray-300 transform hover:scale-105 transition-all duration-300 min-w-[180px]"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:animate-pulse" />
            Go Back
          </button>
          
          <button
            onClick={handleRefresh}
            className="group flex items-center justify-center px-6 py-4 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-all duration-300"
          >
            <RefreshCw className="w-4 h-4 mr-2 group-hover:animate-spin" />
            Refresh Page
          </button>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 animate-fade-in-delay-4">
          <p className="text-sm text-gray-500 mb-4">Maybe you were looking for:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => router.push('/playground')}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors duration-200"
            >
              🎮 Playground
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 text-sm text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 rounded-full transition-colors duration-200"
            >
              🔐 Login
            </button>
            <button
              onClick={() => router.push('/register')}
              className="px-4 py-2 text-sm text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 rounded-full transition-colors duration-200"
            >
              📝 Register
            </button>
          </div>
        </div>

        {/* Contact and Repository Links */}
        <div className="mt-8 animate-fade-in-delay-5">
          <div className="bg-white rounded-lg border-2 border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Need Help?</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {/* Mail Admin */}
              <a
                href="mailto:kanchan.dasila1@gmail.com?subject=404%20Page%20Issue&body=Hi,%0A%0AI%20encountered%20a%20404%20error%20on%20your%20website.%0A%0APage%20URL:%20"
                className="group flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 min-w-[180px]"
              >
                <Mail className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Contact Admin
                <ExternalLink className="w-4 h-4 ml-2 opacity-70" />
              </a>
              
              {/* GitHub Repository */}
              <a
                href="https://github.com/Kanchan3D/acciojob"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 min-w-[180px]"
              >
                <Github className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                View Repository
                <ExternalLink className="w-4 h-4 ml-2 opacity-70" />
              </a>
            </div>
            
            {/* Additional Info */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 mb-2">
                🐛 Found a bug? Report it on GitHub or contact our admin team
              </p>
              <div className="flex justify-center items-center space-x-4 text-xs text-gray-400">
                <span className="flex items-center">
                  <Mail className="w-3 h-3 mr-1" />
                  kanchan.dasila1@gmail.com
                </span>
                <span className="flex items-center">
                  <Github className="w-3 h-3 mr-1" />
                  Kanchan3D/acciojob
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fun Footer */}
        <div className="mt-16 text-center animate-fade-in-delay-6">
          <p className="text-xs text-gray-400">
            Lost in the code? That's just part of the developer journey! 🧭
          </p>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
    </div>
  );
}
