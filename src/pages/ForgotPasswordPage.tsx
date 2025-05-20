import { Link } from 'react-router-dom';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';

const ForgotPasswordPage = () => {
  return (
    <div className="flex min-h-screen bg-gradient-to-r from-blue-50 to-indigo-50">
      {/* Left side (form) */}
      <div className="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Logo */}
          <div className="flex justify-center lg:justify-start">
            <Link to="/" className="font-bold text-2xl text-blue-600">
              Support<span className="text-gray-900">Desk</span>
            </Link>
          </div>
          
          <ForgotPasswordForm />
        </div>
      </div>
      
      {/* Right side (image/illustration) */}
      <div className="hidden lg:block relative flex-1 bg-cover bg-center" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1592420456106-3f0ea784e3a4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1887&q=80')" }}>
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/70 to-blue-900/30 mix-blend-multiply" />
        <div className="absolute inset-0 flex items-end p-12">
          <div className="text-white max-w-xl">
            <h2 className="text-2xl font-bold mb-2">Reset Your Password</h2>
            <p className="text-blue-100">
              Enter your email address to receive a password reset link. We'll help you get back into your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;