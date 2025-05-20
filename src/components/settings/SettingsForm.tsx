import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import AvatarUpload from '../ui/avatar-upload';

const SettingsForm: React.FC = () => {
  const { user, profile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email] = useState(profile?.email || user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // TODO: Implement saveProfile logic
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    // Simulate save
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
    }, 1000);
  };

  return (
    <form
      className="w-full max-w-lg bg-card rounded-lg shadow-sm p-8 space-y-6 border border-border"
      onSubmit={handleSave}
    >
      <div>
        <h3 className="text-xl font-semibold text-foreground">Profile Information</h3>
        <p className="text-muted-foreground text-sm">Update your account settings</p>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-2">
        <AvatarUpload value={avatarUrl} onChange={setAvatarUrl} />
        <span className="text-sm text-gray-500">Click to change avatar</span>
      </div>

      {/* Profile Info */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Your name"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={email}
            disabled
            className="mt-1 bg-gray-100 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="flex items-center justify-between py-4 border-t border-b border-gray-100">
        <span className="text-gray-700">Email notifications</span>
        <Switch checked={notifications} onCheckedChange={setNotifications} />
      </div>

      {/* Save Button */}
      <div className="flex flex-col gap-2">
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        {success && <span className="text-green-600 text-sm text-center">Saved!</span>}
      </div>
    </form>
  );
};

export default SettingsForm;