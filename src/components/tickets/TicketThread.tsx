import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  MoreHorizontal,
  PaperclipIcon,
  Send,
  User,
  Loader2
} from 'lucide-react';
import { getTicket, createMessage, updateTicket } from '../../lib/api';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import type { Ticket, Message } from '../../types/supabase';

interface TicketThreadProps {
  userType: 'admin' | 'customer';
}

const TicketThread = ({ userType }: TicketThreadProps) => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  
  // Fetch ticket data
  useEffect(() => {
    const fetchTicket = async () => {
      if (!ticketId) return;
      
      try {
        setIsLoading(true);
        const ticketData = await getTicket(ticketId);
        
        if (ticketData) {
          setTicket(ticketData);
          setError(null);
        } else {
          setError('Ticket not found');
        }
      } catch (err) {
        console.error('Error fetching ticket:', err);
        setError('Failed to load ticket. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTicket();
  }, [ticketId]);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle size={16} className="text-red-500 dark:text-red-400" />;
      case 'pending':
        return <Clock size={16} className="text-amber-500 dark:text-amber-400" />;
      case 'resolved':
        return <CheckCircle size={16} className="text-green-500 dark:text-green-400" />;
      default:
        return null;
    }
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 ring-red-600/20 dark:ring-red-300/20';
      case 'pending':
        return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 ring-amber-600/20 dark:ring-amber-300/20';
      case 'resolved':
        return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 ring-green-600/20 dark:ring-green-300/20';
      default:
        return 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 ring-gray-600/20 dark:ring-gray-300/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };
  
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketId || !user || !replyContent.trim()) {
      return;
    }
    
    try {
      setIsSending(true);
      
      // If the ticket is resolved, reopen it when customer replies
      if (ticket?.status === 'resolved' && userType === 'customer') {
        await updateTicket(ticketId, { status: 'open' });
        
        // Update local state
        setTicket(prev => prev ? { ...prev, status: 'open' } : null);
        
        toast({
          title: 'Ticket Reopened',
          description: 'This ticket has been reopened.'
        });
      }
      
      const message = await createMessage(
        ticketId,
        user.id,
        replyContent
      );
      
      if (message) {
        // Update local state with the new message
        setTicket(prev => {
          if (!prev) return null;
          
          const updatedMessages = [...(prev.messages || []), {
            ...message,
            sender: user,
            created_at: new Date().toISOString(),
          }];
          
          return {
            ...prev,
            messages: updatedMessages,
            updated_at: new Date().toISOString()
          };
        });
        
        setReplyContent('');
        
        toast({
          title: 'Reply Sent',
          description: 'Your reply has been sent successfully.'
        });
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      toast({
        title: 'Error',
        description: 'Failed to send reply. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };
  
  const handleStatusChange = async (newStatus: 'open' | 'pending' | 'resolved') => {
    if (!ticketId || !ticket) return;
    
    try {
      setStatusUpdating(true);
      
      const updatedTicket = await updateTicket(ticketId, { status: newStatus });
      
      if (updatedTicket) {
        // Update local state
        setTicket({ ...ticket, status: newStatus });
        
        toast({
          title: 'Status Updated',
          description: `Ticket status changed to ${newStatus}.`
        });
      }
    } catch (err) {
      console.error('Error updating ticket status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update ticket status.',
        variant: 'destructive'
      });
    } finally {
      setStatusUpdating(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading ticket...</p>
      </div>
    );
  }
  
  if (error || !ticket) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <h3 className="text-lg font-medium text-foreground">Ticket not found</h3>
        <p className="mt-1 text-sm text-muted-foreground">The ticket you're looking for doesn't exist or you don't have access to it.</p>
        <Link
          to={`/${userType}`}
          className="mt-4 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Return to inbox
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-card transition-colors duration-300">
        <div className="flex items-center">
          <Link
            to={`/${userType}`}
            className="mr-4 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-medium text-foreground">{ticket.subject}</h1>
            <div className="mt-1 flex items-center space-x-3 text-sm text-muted-foreground">
              <span>
                From: <span className="font-medium">{ticket.customer?.full_name || 'Unknown'}</span> <span className="text-muted-foreground/60">({ticket.customer?.email || ''})</span>
              </span>
              <span className="text-muted-foreground/40">|</span>
              <span>
                Category: <span className="font-medium">{ticket.category}</span>
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClass(ticket.status)}`}>
            {getStatusIcon(ticket.status)}
            <span className="ml-1 capitalize">{ticket.status}</span>
          </span>
          
          {userType === 'admin' && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs"
                disabled={!ticket.assigned_to_profile}
              >
                {ticket.assigned_to_profile?.full_name || 'Assign'}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" disabled={statusUpdating}>
                    <MoreHorizontal size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange('open')}
                    disabled={ticket.status === 'open' || statusUpdating}
                  >
                    Mark as Open
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange('pending')}
                    disabled={ticket.status === 'pending' || statusUpdating}
                  >
                    Mark as Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange('resolved')}
                    disabled={ticket.status === 'resolved' || statusUpdating}
                  >
                    Mark as Resolved
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
      
      {/* Conversation */}
      <div className="flex-1 overflow-y-auto p-6 bg-background/30 dark:bg-background/20">
        <div className="space-y-6">
          {ticket.messages && ticket.messages.map((message: Message, index: number) => (
            <div 
              key={message.id} 
              className={`flex animate-slide-up ${
                message.sender?.user_type === 'customer' ? 'justify-start' : 'justify-end'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`max-w-3xl rounded-lg p-4 shadow-sm ring-1 ring-border transition-all duration-300 hover:shadow-md ${
                message.sender?.user_type === 'customer' 
                  ? 'bg-card dark:bg-card/80' 
                  : 'bg-primary/5 dark:bg-primary/10'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      message.sender?.user_type === 'customer' 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      <User size={16} />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground">
                        {message.sender?.full_name || 'Unknown User'}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
                  {message.content}
                </div>
                
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Attachments:</p>
                    {message.attachments.map((attachment, i) => (
                      <div key={i} className="flex items-center rounded-md border border-border bg-accent/30 px-3 py-2 transition-colors hover:bg-accent">
                        <PaperclipIcon size={14} className="mr-2 text-muted-foreground" />
                        <span className="text-xs font-medium text-primary">
                          {attachment.name}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({Math.round(attachment.size / 1024)} KB)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Reply composer */}
      <div className="border-t border-border bg-card/80 p-4 transition-colors duration-300">
        <form onSubmit={handleSubmitReply}>
          <div className="overflow-hidden rounded-lg border border-border shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/40 transition-all duration-200">
            <textarea
              rows={3}
              name="reply"
              placeholder="Type your reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="block w-full resize-none border-0 py-3 px-4 text-foreground placeholder:text-muted-foreground bg-transparent focus:ring-0 sm:text-sm sm:leading-6 transition-colors"
            />
            
            <div className="flex items-center justify-between border-t border-border px-3 py-2">
              <div className="flex space-x-1">
                <button
                  type="button"
                  className="inline-flex items-center rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <PaperclipIcon size={20} />
                </button>
              </div>
              <div className="flex-shrink-0">
                <Button
                  type="submit"
                  disabled={!replyContent.trim() || isSending}
                  className={`flex items-center space-x-2 transition-all duration-200 ${
                    replyContent.trim() && !isSending
                      ? 'bg-primary text-white hover:bg-primary/90 shadow-sm hover:shadow'
                      : 'bg-accent text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send</span>
                      <Send size={14} />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketThread;