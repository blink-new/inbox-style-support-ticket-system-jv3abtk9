import { Link } from 'react-router-dom';
import { Star, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Ticket } from '../../types/supabase';

interface TicketItemProps {
  ticket: Ticket;
  isSelected: boolean;
  onSelect: () => void;
  userType: 'admin' | 'customer';
}

const TicketItem = ({ ticket, isSelected, onSelect, userType }: TicketItemProps) => {
  // Format date to relative time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // If today, show the time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      // If within the last week, show the day name
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Otherwise show the date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
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

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 dark:bg-red-400';
      case 'medium':
        return 'bg-amber-500 dark:bg-amber-400';
      case 'low':
        return 'bg-green-500 dark:bg-green-400';
      default:
        return 'bg-gray-500 dark:bg-gray-400';
    }
  };
  
  // Get customer name and email from ticket
  const customerName = ticket.customer?.full_name || 'Unknown';
  // Get the assigned person's name (keeping for future use)
  // const assignedTo = ticket.assigned_to_profile?.full_name || 'Unassigned';
  
  // Calculate last reply information
  const lastMessage = ticket.last_message || (ticket.messages && ticket.messages.length > 0 ? ticket.messages[ticket.messages.length - 1] : null);
  const lastReplySender = lastMessage?.sender?.user_type === 'customer' ? 'customer' : 'support';
  const lastReplyName = lastMessage?.sender?.full_name || '';

  // Calculate message count
  const messageCount = ticket.message_count || 0;

  // Check if the ticket has unread messages
  const unread = ticket.unread || false;

  return (
    <li 
      className={`relative border-b border-border transition-colors duration-300 group ${
        unread 
          ? 'bg-primary/5 dark:bg-primary/10' 
          : 'bg-card hover:bg-accent/30'
      }`}
    >
      <Link
        to={`/${userType}/ticket/${ticket.id}`}
        className="block w-full cursor-pointer"
      >
        <div className="flex items-start p-4 transition-all duration-200 group-hover:pl-5">
          {/* Checkbox for selection */}
          <div className="mr-4 flex h-6 items-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect();
              }}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/25 transition-shadow"
            />
          </div>
          
          {/* Priority indicator */}
          <div className="mr-4 flex h-6 items-center">
            <div className={`h-3 w-3 rounded-full ${getPriorityColor(ticket.priority)} transition-transform group-hover:scale-110`}></div>
          </div>
          
          {/* Star button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Implement star functionality
            }}
            className="mr-4 flex h-6 items-center text-muted-foreground hover:text-amber-400 transition-colors"
          >
            <Star size={16} />
          </button>
          
          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="truncate text-sm font-medium text-foreground">
                {userType === 'admin' ? customerName : 'Support Team'}
              </p>
              <div className="ml-2 flex flex-shrink-0 items-center space-x-2">
                {/* Status badge */}
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${getStatusBadgeClass(ticket.status)}`}>
                  {getStatusIcon(ticket.status)}
                  <span className="ml-1">{getStatusLabel(ticket.status)}</span>
                </span>
                
                <time 
                  dateTime={ticket.updated_at} 
                  className="whitespace-nowrap text-xs text-muted-foreground"
                >
                  {formatDate(ticket.updated_at)}
                </time>
              </div>
            </div>
            <div className="mt-1">
              <p className={`flex-1 truncate text-sm ${
                unread 
                  ? 'font-semibold text-foreground' 
                  : 'text-muted-foreground'
              }`}>
                {ticket.subject}
              </p>
            </div>
            <div className="mt-1 flex items-center">
              <p className="truncate text-xs text-muted-foreground">
                {lastReplySender === 'customer'
                  ? `${lastReplyName || customerName}: `
                  : 'Support: '}
                <span className="ml-1 text-muted-foreground/60">
                  {lastMessage?.content 
                    ? lastMessage.content.length > 50 
                      ? lastMessage.content.substring(0, 50) + '...' 
                      : lastMessage.content
                    : 'No message content'}
                </span>
              </p>
              
              {/* Message count */}
              {messageCount > 0 && (
                <span className="ml-2 rounded-full bg-primary/10 dark:bg-primary/20 px-2 py-0.5 text-xs text-primary">
                  {messageCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
};

export default TicketItem;
