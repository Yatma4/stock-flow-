import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, Notification } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Bell, CheckCheck, Trash2, AlertTriangle, Info, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle,
};

const colorMap = {
  info: 'text-primary bg-primary/10',
  warning: 'text-warning bg-warning/10',
  error: 'text-destructive bg-destructive/10',
  success: 'text-success bg-success/10',
};

export function NotificationPanel() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate to the linked page if available
    if (notification.linkTo) {
      setIsOpen(false);
      // Navigate with state to highlight the item
      navigate(notification.linkTo, { 
        state: { highlightId: notification.linkItemId } 
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center bg-destructive text-destructive-foreground">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Notifications</span>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Tout marquer lu
                </Button>
              )}
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearNotifications}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </SheetTitle>
          <SheetDescription>
            {unreadCount > 0 
              ? `${unreadCount} notification(s) non lue(s)` 
              : 'Toutes les notifications ont été lues'}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          <AnimatePresence>
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Aucune notification</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = iconMap[notification.type];
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'p-4 rounded-lg border cursor-pointer transition-all hover:bg-secondary/50',
                      !notification.read && 'bg-primary/5 border-primary/20'
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shrink-0', colorMap[notification.type])}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-foreground">
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1">
                            {notification.linkTo && (
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            )}
                            {!notification.read && (
                              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: fr })}
                          </p>
                          {notification.linkTo && (
                            <span className="text-xs text-primary hover:underline">
                              Voir détails →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}