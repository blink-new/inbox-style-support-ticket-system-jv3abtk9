import { Link, useLocation } from 'react-router-dom';
import { 
  Inbox, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  Archive, 
  Trash2, 
  Settings, 
  LifeBuoy,
  Mail
} from 'lucide-react';

interface SidebarProps {
  userType: 'admin' | 'customer';
  onNewTicket?: () => void;
}

const Sidebar = ({ userType, onNewTicket }: SidebarProps) => {
  const location = useLocation();
  const basePath = `/${userType}`;
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const adminNavItems = [
    { name: 'Inbox', icon: <Inbox size={18} />, path: `${basePath}`, count: 24 },
    { name: 'Open', icon: <AlertCircle size={18} />, path: `${basePath}?status=open`, count: 12 },
    { name: 'Pending', icon: <Clock size={18} />, path: `${basePath}?status=pending`, count: 8 },
    { name: 'Resolved', icon: <CheckCircle2 size={18} />, path: `${basePath}?status=resolved`, count: 4 },
    { name: 'Archived', icon: <Archive size={18} />, path: `${basePath}?status=archived` },
    { name: 'Trash', icon: <Trash2 size={18} />, path: `${basePath}?status=trash` },
  ];
  
  const customerNavItems = [
    { name: 'My Tickets', icon: <Inbox size={18} />, path: `${basePath}`, count: 3 },
    { name: 'Open', icon: <AlertCircle size={18} />, path: `${basePath}?status=open`, count: 1 },
    { name: 'Resolved', icon: <CheckCircle2 size={18} />, path: `${basePath}?status=resolved`, count: 2 },
  ];
  
  const navItems = userType === 'admin' ? adminNavItems : customerNavItems;

  return (
    <div className="h-full w-64 border-r border-sidebar-border bg-sidebar flex flex-col transition-colors duration-300">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <div className="flex items-center space-x-2">
          <Mail className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold text-sidebar-foreground">Help Desk</h1>
        </div>
      </div>
      
      {/* New Ticket Button - for customers */}
      {userType === 'customer' && (
        <div className="p-4">
          <button 
            className="flex w-full items-center justify-center space-x-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/80 focus:ring-offset-2 shadow-sm transition-all duration-200"
            onClick={onNewTicket}
          >
            <Plus size={16} />
            <span>New Ticket</span>
          </button>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`sidebar-item ${
              isActive(item.path)
                ? 'sidebar-item-active'
                : 'sidebar-item-inactive'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className={isActive(item.path) ? 'text-sidebar-primary' : 'text-sidebar-foreground/70'}>
                {item.icon}
              </span>
              <span>{item.name}</span>
            </div>
            {item.count && (
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                isActive(item.path)
                  ? 'bg-sidebar-primary/20 text-sidebar-primary'
                  : 'bg-sidebar-accent/40 text-sidebar-foreground/70'
              }`}>
                {item.count}
              </span>
            )}
          </Link>
        ))}
      </nav>
      
      {/* Footer nav */}
      <div className="mt-auto border-t border-sidebar-border p-4">
        <Link
          to={`/${userType}/settings`}
          className="sidebar-item sidebar-item-inactive mt-1"
        >
          <div className="flex items-center space-x-3">
            <Settings size={18} className="text-sidebar-foreground/70" />
            <span>Settings</span>
          </div>
        </Link>
        <Link
          to={`/`}
          className="sidebar-item sidebar-item-inactive mt-1"
        >
          <div className="flex items-center space-x-3">
            <LifeBuoy size={18} className="text-sidebar-foreground/70" />
            <span>Help & Support</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
