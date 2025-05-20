import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Loader } from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { useAuth } from '../../context/AuthContext';

const RegisterForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'customer' | 'admin'>('customer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signUp } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await signUp(email, password, userType);
      
      // Reset form after successful signup
      setEmail('');
      setPassword('');
      setUserType('customer');
    } catch (err) {
      console.error('Error in registration form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="w-full max-w-md space-y-8 p-8">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-bold text-gray-900">Create an account</h2>
        <p className="mt-2 text-sm text-gray-600">Sign up to access support services</p>
      </div>
      
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
        
        <div className="space-y-4">
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
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              placeholder="At least 6 characters"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account type
            </label>
            <RadioGroup 
              value={userType} 
              onValueChange={(value) => setUserType(value as 'customer' | 'admin')}
              className="space-y-3"
            >
              <div
                className={
                  `flex items-center gap-3 rounded-lg border transition-colors cursor-pointer px-4 py-3 ` +
                  (userType === 'customer'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-gray-200 bg-white hover:bg-gray-50')
                }
                onClick={() => setUserType('customer')}
                tabIndex={0}
                role="radio"
                aria-checked={userType === 'customer'}
                onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') setUserType('customer') }}
              >
                <RadioGroupItem value="customer" id="customer" className="h-5 w-5" />
                <Label htmlFor="customer" className="text-base font-medium">Customer</Label>
                <span className="ml-2 text-xs text-gray-500">Create tickets & communicate with support</span>
              </div>
              <div
                className={
                  `flex items-center gap-3 rounded-lg border transition-colors cursor-pointer px-4 py-3 ` +
                  (userType === 'admin'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-gray-200 bg-white hover:bg-gray-50')
                }
                onClick={() => setUserType('admin')}
                tabIndex={0}
                role="radio"
                aria-checked={userType === 'admin'}
                onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') setUserType('admin') }}
              >
                <RadioGroupItem value="admin" id="admin" className="h-5 w-5" />
                <Label htmlFor="admin" className="text-base font-medium">Support Admin</Label>
                <span className="ml-2 text-xs text-gray-500">Manage, assign, and respond to tickets</span>
              </div>
            </RadioGroup>
          </div>
        </div>
        
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader size={16} className="mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            'Sign up'
          )}
        </Button>
        
        <div className="text-center text-sm">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;