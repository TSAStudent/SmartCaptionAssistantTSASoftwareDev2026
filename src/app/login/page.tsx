'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GraduationCap, Sparkles, ArrowRight, User, BookOpen } from 'lucide-react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      // Clear guest mode when user signs in
      localStorage.removeItem('guestMode');
      router.push('/');
    }
  }, [status, session, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  const handleGuestAccess = () => {
    // Set guest mode flag so home page doesn't redirect back to login
    localStorage.setItem('guestMode', 'true');
    router.push('/');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Main Card with enhanced styling */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-gray-900/30 dark:shadow-black/60 border border-gray-200/60 dark:border-gray-700/60 overflow-hidden transform transition-all duration-300 hover:scale-[1.01]">
          {/* Header Section */}
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-10 text-center relative overflow-hidden">
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}
            ></div>
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white/25 backdrop-blur-md rounded-3xl mb-5 shadow-2xl ring-4 ring-white/20">
                <GraduationCap className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
                Smart Classroom
              </h1>
              <p className="text-blue-100/90 text-base font-medium">
                Caption & Notes Assistant
              </p>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-10 space-y-7">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-base">
                Sign in to organize your classes and sessions
              </p>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full group relative flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-200 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transform"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  or
                </span>
              </div>
            </div>

            {/* Guest Access Button */}
            <button
              onClick={handleGuestAccess}
              className="w-full group flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 border border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-200 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] transform"
            >
              <User className="w-5 h-5" />
              <span>Continue as Guest</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Features List */}
            <div className="pt-6 border-t border-gray-200/80 dark:border-gray-700/80">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-center mb-4 uppercase tracking-wider">
                Sign in to unlock:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 bg-blue-50/50 dark:bg-blue-900/20 px-4 py-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span className="font-medium">Organize sessions by class</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 bg-purple-50/50 dark:bg-purple-900/20 px-4 py-3 rounded-lg border border-purple-100 dark:border-purple-800/30">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <span className="font-medium">Save and manage your notes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

