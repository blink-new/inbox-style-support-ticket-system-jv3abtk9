import { supabase } from './supabase';
import type { Ticket, Message, Attachment, Profile, UserType } from '../types/supabase';

// Profile functions
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    // First check if the user exists before using .single()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId);
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    // If no results, return null
    if (!data || data.length === 0) {
      console.log(`No profile found for user ${userId}`);
      return null;
    }
    
    // Otherwise return the first profile
    return data[0];
  } catch (error) {
    console.error('Exception fetching profile:', error);
    return null;
  }
}

export async function updateProfile(profile: Partial<Profile> & { id: string }): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', profile.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }
  
  return data;
}

export async function createProfile(userId: string, email: string, userType: 'admin' | 'customer'): Promise<Profile | null> {
  try {
    // Double-check if profile already exists to avoid duplicates
    const existingProfile = await getProfile(userId);
    if (existingProfile) {
      console.log(`Profile already exists for user ${userId}, returning existing profile`);
      return existingProfile;
    }
    
    // Try to create the profile
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        user_type: userType,
      })
      .select()
      .maybeSingle(); // Use maybeSingle() instead of single() to handle case where no rows returned
    
    if (error) {
      // If we get a duplicate key error, that means another process created the profile
      // between our check and insert - try to fetch it again
      if (error.code === '23505') { // duplicate key value error
        console.log('Duplicate key error - profile was likely created concurrently, fetching profile again');
        return await getProfile(userId);
      }
      
      console.error('Error creating profile:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception creating profile:', error);
    return null;
  }
}

// Ticket functions
export async function getTickets(userType: UserType, status?: string): Promise<Ticket[]> {
  try {
    // Basic query
    let query = supabase
      .from('tickets')
      .select('*')
      .order('updated_at', { ascending: false });
    
    // Add status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    // For customer users, filter to show only their tickets
    if (userType === 'customer') {
      const { data: profile } = await supabase.auth.getUser();
      if (profile?.user?.id) {
        query = query.eq('customer_id', profile.user.id);
      }
    }
    
    const { data: tickets, error } = await query;
    
    if (error) {
      console.error('Error fetching tickets:', error);
      return [];
    }
    
    // If no tickets found, return empty array
    if (!tickets || tickets.length === 0) {
      return [];
    }
    
    // Fetch customer profiles for all tickets
    const customerIds = [...new Set(tickets.map(t => t.customer_id))];
    const { data: customers } = await supabase
      .from('profiles')
      .select('*')
      .in('id', customerIds);
    
    // Fetch assigned_to profiles for tickets that have them
    const assignedToIds = [...new Set(tickets.filter(t => t.assigned_to).map(t => t.assigned_to))];
    const { data: assignedProfiles } = assignedToIds.length > 0 
      ? await supabase.from('profiles').select('*').in('id', assignedToIds)
      : { data: [] };
    
    // Create lookup maps for profiles
    const customerMap = customers ? customers.reduce((map, profile) => ({
      ...map, [profile.id]: profile
    }), {}) : {};
    
    const assignedMap = assignedProfiles ? assignedProfiles.reduce((map, profile) => ({
      ...map, [profile.id]: profile
    }), {}) : {};
    
    // Fetch message counts for each ticket
    const ticketIds = tickets.map(t => t.id);
    
    // Get message counts by querying messages directly
    const { data: messages } = await supabase
      .from('messages')
      .select('ticket_id')
      .in('ticket_id', ticketIds);
    
    // Create a message count map manually
    const messageCountMap: Record<string, number> = {};
    
    if (messages && messages.length > 0) {
      messages.forEach(message => {
        const ticketId = message.ticket_id;
        messageCountMap[ticketId] = (messageCountMap[ticketId] || 0) + 1;
      });
    }
    
    // Fetch last message for each ticket
    const lastMessagesMap: Record<string, Message> = {};
    if (ticketIds.length > 0) {
      for (const ticketId of ticketIds) {
        const { data: lastMessages } = await supabase
          .from('messages')
          .select('*, sender:sender_id(id, email, full_name, avatar_url, user_type)')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (lastMessages && lastMessages.length > 0) {
          lastMessagesMap[ticketId] = lastMessages[0];
        }
      }
    }
    
    // Add customer and assigned_to profiles to tickets
    return tickets.map(ticket => ({
      ...ticket,
      customer: customerMap[ticket.customer_id],
      assigned_to_profile: ticket.assigned_to ? assignedMap[ticket.assigned_to] : null,
      message_count: messageCountMap[ticket.id] || 0,
      last_message: lastMessagesMap[ticket.id] || null,
      messages: [], // Will be populated when viewing a specific ticket
      unread: false // Implement unread logic later
    }));
  } catch (error) {
    console.error('Exception in getTickets:', error);
    return [];
  }
}

export async function getTicket(ticketId: string): Promise<Ticket | null> {
  try {
    // First get the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();
    
    if (ticketError) {
      console.error('Error fetching ticket:', ticketError);
      return null;
    }
    
    // Get customer profile
    const { data: customer, error: customerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', ticket.customer_id)
      .single();
    
    if (customerError) {
      console.error('Error fetching customer profile:', customerError);
    }
    
    // Get assigned profile if exists
    let assignedProfile = null;
    if (ticket.assigned_to) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', ticket.assigned_to)
        .single();
      
      if (profileError) {
        console.error('Error fetching assigned profile:', profileError);
      } else {
        assignedProfile = profile;
      }
    }
    
    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    
    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    }
    
    // Get sender profiles for messages
    let senderProfiles = {};
    if (messages && messages.length > 0) {
      const senderIds = [...new Set(messages.map(m => m.sender_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', senderIds);
      
      if (profilesError) {
        console.error('Error fetching sender profiles:', profilesError);
      } else if (profiles) {
        senderProfiles = profiles.reduce((map, profile) => ({
          ...map, [profile.id]: profile
        }), {});
      }
    }
    
    // Get attachments for messages
    let attachmentsByMessage = {};
    if (messages && messages.length > 0) {
      const messageIds = messages.map(m => m.id);
      const { data: attachments, error: attachmentsError } = await supabase
        .from('attachments')
        .select('*')
        .in('message_id', messageIds);
      
      if (attachmentsError) {
        console.error('Error fetching attachments:', attachmentsError);
      } else if (attachments) {
        // Group attachments by message id
        attachmentsByMessage = attachments.reduce((map, attachment) => {
          const messageAttachments = map[attachment.message_id] || [];
          return {
            ...map,
            [attachment.message_id]: [...messageAttachments, attachment]
          };
        }, {});
      }
    }
    
    // Add sender profiles and attachments to messages
    const enrichedMessages = messages ? messages.map(message => ({
      ...message,
      sender: senderProfiles[message.sender_id] || null,
      attachments: attachmentsByMessage[message.id] || []
    })) : [];
    
    // Return complete ticket with related data
    return {
      ...ticket,
      customer,
      assigned_to_profile: assignedProfile,
      messages: enrichedMessages,
      unread: false // Implement unread logic later
    };
  } catch (error) {
    console.error('Exception fetching ticket:', error);
    return null;
  }
}

export async function createTicket(
  subject: string, 
  customerId: string, 
  priority: 'low' | 'medium' | 'high',
  category: string,
  initialMessage: string
): Promise<Ticket | null> {
  try {
    // First create the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        subject,
        customer_id: customerId,
        priority,
        category,
        status: 'open',
      })
      .select()
      .single();
    
    if (ticketError) {
      console.error('Error creating ticket:', ticketError);
      return null;
    }
    
    // Then create the initial message
    if (initialMessage) {
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: customerId,
          content: initialMessage,
        });
      
      if (messageError) {
        console.error('Error creating initial message:', messageError);
        // We don't return null here since the ticket was created successfully
      }
    }
    
    return ticket;
  } catch (error) {
    console.error('Exception creating ticket:', error);
    return null;
  }
}

export async function updateTicket(
  ticketId: string, 
  updates: Partial<Ticket>
): Promise<Ticket | null> {
  try {
    // Add updated_at timestamp
    const updatesWithTimestamp = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('tickets')
      .update(updatesWithTimestamp)
      .eq('id', ticketId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating ticket:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception updating ticket:', error);
    return null;
  }
}

// Message functions
export async function getMessages(ticketId: string): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    
    // Get sender profiles
    let senderProfiles = {};
    if (data && data.length > 0) {
      const senderIds = [...new Set(data.map(m => m.sender_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', senderIds);
      
      if (profilesError) {
        console.error('Error fetching sender profiles:', profilesError);
      } else if (profiles) {
        senderProfiles = profiles.reduce((map, profile) => ({
          ...map, [profile.id]: profile
        }), {});
      }
    }
    
    // Get attachments
    let attachmentsByMessage = {};
    if (data && data.length > 0) {
      const messageIds = data.map(m => m.id);
      const { data: attachments, error: attachmentsError } = await supabase
        .from('attachments')
        .select('*')
        .in('message_id', messageIds);
      
      if (attachmentsError) {
        console.error('Error fetching attachments:', attachmentsError);
      } else if (attachments) {
        // Group attachments by message id
        attachmentsByMessage = attachments.reduce((map, attachment) => {
          const messageAttachments = map[attachment.message_id] || [];
          return {
            ...map,
            [attachment.message_id]: [...messageAttachments, attachment]
          };
        }, {});
      }
    }
    
    // Return messages with profiles and attachments
    return data.map(message => ({
      ...message,
      sender: senderProfiles[message.sender_id] || null,
      attachments: attachmentsByMessage[message.id] || []
    }));
  } catch (error) {
    console.error('Exception fetching messages:', error);
    return [];
  }
}

export async function createMessage(
  ticketId: string, 
  senderId: string, 
  content: string
): Promise<Message | null> {
  try {
    // Create the message
    const { data, error } = await supabase
      .from('messages')
      .insert({
        ticket_id: ticketId,
        sender_id: senderId,
        content,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating message:', error);
      return null;
    }
    
    // Update the ticket's updated_at timestamp
    await updateTicket(ticketId, {});
    
    return data;
  } catch (error) {
    console.error('Exception creating message:', error);
    return null;
  }
}

// Attachment functions
export async function uploadAttachment(
  file: File, 
  messageId: string
): Promise<Attachment | null> {
  try {
    // First upload the file to storage
    const filePath = `${messageId}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file);
    
    if (uploadError) {
      console.error('Error uploading attachment:', uploadError);
      return null;
    }
    
    // Then create an attachment record
    const { data, error } = await supabase
      .from('attachments')
      .insert({
        message_id: messageId,
        name: file.name,
        file_path: filePath,
        size: file.size,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating attachment record:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception uploading attachment:', error);
    return null;
  }
}