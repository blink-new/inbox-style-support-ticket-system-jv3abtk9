import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { AuthError } from '@supabase/supabase-js';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { supabase } from '../../lib/supabase';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Send password reset email through Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/#/', // Redirect to login page after reset with hash router
      });
      
      if (error) throw error;
      
      // Show success message
      setSuccess(true);
      setEmail('');
    } catch (err) {
      console.error('Error sending reset email:', err);
      const authError = err as AuthError;
      setError(authError.message || 'Failed to send password reset email');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="w-full max-w-md space-y-8 p-8">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-bold text-gray-900">Reset password</h2>
        <p className="mt-2 text-sm text-gray-600">Enter your email to receive reset instructions</p>
      </div>
      
      {success ? (
        <div className="rounded-md bg-green-50 p-4 my-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Password reset email sent!
              </p>
              <p className="mt-2 text-sm text-green-700">
                Please check your email for instructions to reset your password. The link will expire in 24 hours.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
              placeholder="you@example.com"
            />
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader size={16} className="mr-2 animate-spin" />
                Sending email...
              </>
            ) : (
              'Send reset instructions'
            )}
          </Button>
          
          <div className="text-center text-sm">
            <p className="text-gray-600">
              Remember your password?{' '}
              <Link to="/" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordForm;