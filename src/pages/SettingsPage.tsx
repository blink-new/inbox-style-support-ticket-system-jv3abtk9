import React from 'react';
import SettingsForm from '../components/settings/SettingsForm';

const SettingsPage = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      <div className="flex justify-center">
        <SettingsForm />
      </div>
    </div>
  );
};

export default SettingsPage;
