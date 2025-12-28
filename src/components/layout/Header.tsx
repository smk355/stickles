import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, User, Menu, X, Settings, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { BRAND } from "@/lib/constants";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, loading, isAdmin, signOut } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="font-heading text-2xl font-bold tracking-tight text-foreground hover:text-primary transition-colors"
          >
            {BRAND.name}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/catalogue" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Shop
            </Link>
            
            {isAdmin && (
              <Link 
                to="/admin" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Settings className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate("/cart")}
              >
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                    {totalItems}
                  </span>
                )}
              </Button>
            )}

            {/* User Menu / Auth Button */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden md:flex gap-2">
                    <User className="h-4 w-4" />
                    <span className="max-w-24 truncate">
                      Hello, {profile?.name?.split(" ")[0] || "User"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/cart")}>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    My Cart
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Settings className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate("/auth")}
                disabled={loading}
                className="hidden md:flex"
              >
                Sign In
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <nav className="flex flex-col gap-3">
              <Link 
                to="/catalogue" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Shop
              </Link>
              
              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Admin Dashboard
                </Link>
              )}

              {user ? (
                <>
                  <div className="py-2 text-sm text-muted-foreground">
                    Signed in as {profile?.name || "User"}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-fit"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
               ) : (
                <>
                  {/*
                  <Button
                    size="sm"
                    onClick={() => {
                      navigate("/auth");
                      setMobileMenuOpen(false);
                    }}
                    disabled={loading}
                    className="w-fit"
                  >
                    Sign In with Google
                  </Button>
                  */}
                </>
                )
              }
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
