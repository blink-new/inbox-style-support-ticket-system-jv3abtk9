import React from 'react';

interface AvatarUploadProps {
  value: string;
  onChange: (url: string) => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ value, onChange }) => {
  // For now, just simulate avatar upload with a random Unsplash avatar
  const handleClick = () => {
    const random = Math.floor(Math.random() * 70) + 1;
    const url = `https://randomuser.me/api/portraits/men/${random}.jpg`;
    onChange(url);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-full border-4 border-blue-200 shadow hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
      style={{ width: 96, height: 96, overflow: 'hidden', background: '#f3f4f6' }}
      aria-label="Change avatar"
    >
      <img
        src={value || 'https://randomuser.me/api/portraits/lego/1.jpg'}
        alt="Avatar"
        className="w-full h-full object-cover rounded-full"
      />
    </button>
  );
};

export default AvatarUpload;
