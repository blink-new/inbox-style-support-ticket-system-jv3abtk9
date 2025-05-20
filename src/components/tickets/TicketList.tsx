import { useState, useEffect } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { Filter, ChevronDown, Loader2 } from 'lucide-react';
import TicketItem from './TicketItem';
import { getTickets } from '../../lib/api';
import { Button } from '../ui/button';
import type { Ticket } from '../../types/supabase';

interface TicketListProps {
  userType: 'admin' | 'customer';
}

interface OutletContextType {
  showNewTicketForm: boolean;
  setShowNewTicketForm: (show: boolean) => void;
}

const TicketList = ({ userType }: TicketListProps) => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const currentStatus = queryParams.get('status') || 'all';
  // Get the shared modal state from context
  const { setShowNewTicketForm } = useOutletContext<OutletContextType>();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('date');
  
  // Fetch tickets
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setIsLoading(true);
        const status = currentStatus === 'all' ? undefined : currentStatus;
        const fetchedTickets = await getTickets(userType, status);
        setTickets(fetchedTickets);
        setError(null);
      } catch (err) {
        console.error('Error fetching tickets:', err);
        setError('Failed to load tickets. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTickets();
  }, [userType, currentStatus]);
  
  const toggleSelectTicket = (ticketId: string) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId) 
        : [...prev, ticketId]
    );
  };

  const selectAll = () => {
    if (selectedTickets.length === tickets.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(tickets.map(ticket => ticket.id));
    }
  };
  
  // Sort tickets based on sortBy option
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const statusOrder = { open: 0, pending: 1, resolved: 2 };
  
  const sortedTickets = [...tickets].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      case 'priority':
        return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
      case 'status':
        return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading tickets...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-foreground">Something went wrong</h3>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Button 
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedTickets.length === tickets.length && tickets.length > 0}
              onChange={selectAll}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            {selectedTickets.length > 0 && (
              <span className="text-sm text-gray-600">
                {selectedTickets.length} selected
              </span>
            )}
          </div>
          
          {/* Actions for selected tickets - only show when tickets are selected */}
          {selectedTickets.length > 0 && (
            <div className="flex items-center space-x-2">
              <button className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100">
                Mark as read
              </button>
              <button className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100">
                Assign
              </button>
              <button className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100">
                Archive
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
            <Filter size={14} />
            <span>Filter</span>
          </button>
          
          <div className="flex items-center space-x-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
            <span>Sort by:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border-none bg-transparent text-xs font-medium text-gray-700 focus:outline-none focus:ring-0"
            >
              <option value="date">Date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
            <ChevronDown size={14} />
          </div>
        </div>
      </div>
      
      {/* Tickets list */}
      <div className="flex-1 overflow-auto">
        {tickets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="text-center">
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No tickets found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {currentStatus === 'all' 
                  ? 'There are no tickets in your inbox' 
                  : `No ${currentStatus} tickets found`}
              </p>
              {userType === 'customer' && (
                <div className="mt-6">
                  <Button
                    onClick={() => setShowNewTicketForm(true)}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Create new ticket
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {sortedTickets.map((ticket) => (
              <TicketItem
                key={ticket.id}
                ticket={ticket}
                isSelected={selectedTickets.includes(ticket.id)}
                onSelect={() => toggleSelectTicket(ticket.id)}
                userType={userType}
              />
            ))}
          </ul>
        )}
      </div>
      
      {/* Create new ticket button - only for customers */}
      {userType === 'customer' && tickets.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <Button
            onClick={() => setShowNewTicketForm(true)}
            className="w-full"
          >
            Create New Ticket
          </Button>
        </div>
      )}
    </div>
  );
};

export default TicketList;