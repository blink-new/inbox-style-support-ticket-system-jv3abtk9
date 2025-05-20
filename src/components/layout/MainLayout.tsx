import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Search, Settings, Bell, Moon, LogOut, User, Sun } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from './Sidebar';
import NewTicketForm from '../tickets/NewTicketForm';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface MainLayoutProps {
  userType: 'admin' | 'customer';
}

const MainLayout = ({ userType }: MainLayoutProps) => {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar 
        userType={userType} 
        onNewTicket={() => setShowNewTicketForm(true)} 
      />
      
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 transition-colors duration-300">
          {/* Search */}
          <div className="flex items-center space-x-3 rounded-md border border-border px-3 py-1.5 bg-card/50 shadow-sm transition-all duration-200">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tickets..."
              className="flex-1 border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          
          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <button className="rounded-full p-1.5 text-muted-foreground hover:bg-accent">
              <Bell size={18} />
            </button>
            <button
              className="rounded-full p-1.5 text-muted-foreground hover:bg-accent"
              aria-label="Toggle theme"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="rounded-full p-1.5 text-muted-foreground hover:bg-accent">
              <Settings size={18} />
            </button>
            
            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User size={16} />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.full_name || profile?.email || ''}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile?.email}
                    </p>
                    <p className="mt-1 text-xs font-medium text-primary capitalize">
                      {userType}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-background transition-colors duration-300">
          <Outlet context={{ showNewTicketForm, setShowNewTicketForm }} />
        </main>
      </div>
      
      {/* New Ticket Form Modal */}
      <NewTicketForm
        isOpen={showNewTicketForm}
        onClose={() => setShowNewTicketForm(false)}
      />
    </div>
  );
};

export default MainLayout;