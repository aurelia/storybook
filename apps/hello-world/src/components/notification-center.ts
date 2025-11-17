import { bindable } from 'aurelia';

export type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  level: NotificationLevel;
  timestamp?: string;
}

export class NotificationCenter {
  @bindable() notifications: NotificationItem[] = [];
  @bindable() maxVisible = 4;
  @bindable() showTimestamp = true;
  @bindable() onDismiss?: (notification: NotificationItem) => void;

  get visibleNotifications() {
    return this.notifications.slice(0, this.maxVisible);
  }

  dismiss(notification: NotificationItem) {
    this.notifications = this.notifications.filter((note) => note.id !== notification.id);
    this.onDismiss?.(notification);
  }
}
