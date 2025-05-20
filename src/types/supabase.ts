export type UserType = 'admin' | 'customer' | null;

export interface Ticket {
  id: string;
  subject: string;
  customer_id: string;
  status: 'open' | 'pending' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  category: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  customer?: Profile;
  assigned_to_profile?: Profile;
  messages?: Message[];
  unread?: boolean;
  last_message?: Message;
  message_count?: number;
}

export interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  // Joined fields
  sender?: Profile;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  message_id: string;
  name: string;
  file_path: string;
  size: number;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  user_type: 'admin' | 'customer';
  created_at: string;
  updated_at: string;
}