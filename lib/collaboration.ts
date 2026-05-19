import Pusher, { PresenceChannel } from "pusher-js";

export interface CollaborationUser {
  id: string;
  name: string;
  image?: string | null;
  color: string;
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  isActive: boolean;
  lastSeen: Date;
  role: "Host" | "Collaborator";
  status: "active" | "typing" | "running";
}

export interface CollaborationOperation {
  type: "insert" | "delete" | "retain";
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: number;
}

export interface CollaborationMessage {
  type:
    | "operation"
    | "cursor"
    | "selection"
    | "user-join"
    | "user-leave"
    | "presence"
    | "sync-request";
  data: unknown;
  userId: string;
  timestamp: number;
}

export class CollaborationClient {
  private pusher: Pusher | null = null;
  private channel: PresenceChannel | null = null;
  private users: Map<string, CollaborationUser> = new Map();
  private onUsersChange: ((users: CollaborationUser[]) => void) | null = null;
  private onOperation: ((operation: CollaborationOperation) => void) | null = null;
  private onUserJoined: ((user: CollaborationUser) => void) | null = null;
  private onSyncRequest: ((userId: string) => void) | null = null;
  private onCursorChange:
    | ((userId: string, cursor: { line: number; column: number }) => void)
    | null = null;
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private isConnected = false;
  private userColor: string;
  private currentCursor: { line: number; column: number } | undefined;
  private role: "Host" | "Collaborator" = "Collaborator";
  private status: "active" | "typing" | "running" = "active";

  constructor(
    private sessionId: string,
    private userId: string,
    private userName: string,
    private userImage: string | null = null,
    role?: "Host" | "Collaborator"
  ) {
    this.userColor = CollaborationClient.colorForUser(userId);
    if (role) this.role = role;
  }

  getUserId(): string {
    return this.userId;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (typeof window === "undefined") {
          throw new Error("Collaboration is only available in browser");
        }
        
        this.pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
          authEndpoint: "/api/pusher/auth",
        });

        this.channel = this.pusher.subscribe(
          `presence-collab-${this.sessionId}`
        ) as PresenceChannel;

        this.channel.bind("pusher:member_added", (member: any) => {
          // We ignore pusher member events for our custom user list 
          // because we want each tab to have a unique ID, even if it's the same DB user.
        });

        this.channel.bind("pusher:subscription_succeeded", () => {
          this.isConnected = true;
          this.upsertLocalUser();
          
          // Broadcast our join to others in the room
          this.broadcast({ type: "user-join", data: { name: this.userName, image: this.userImage, role: this.role, status: this.status } });
          this.startHeartbeat();
          resolve();
        });

        this.channel.bind("pusher:member_removed", (member: any) => {
          // Ignore, we rely on pruneInactiveUsers for cleanup
        });

        this.channel.bind("client-message", (data: CollaborationMessage) => {
          this.handleIncomingMessage(data);
        });

        this.channel.bind("pusher:subscription_error", (error: any) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  private static colorForUser(id: string): string {
    const palette = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA94D",
      "#C77DFF",
      "#64DFDF",
      "#7AE582",
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    return palette[Math.abs(hash) % palette.length];
  }

  private upsertLocalUser() {
    const user: CollaborationUser = {
      id: this.userId,
      name: this.userName,
      image: this.userImage,
      color: this.userColor,
      cursor: this.currentCursor,
      isActive: true,
      lastSeen: new Date(),
      role: this.role,
      status: this.status,
    };
    this.users.set(this.userId, user);
    this.onUsersChange?.(Array.from(this.users.values()));
  }

  private startHeartbeat() {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
    }
    this.heartbeat = setInterval(() => {
      this.upsertLocalUser();
      this.broadcast({ type: "presence", data: { name: this.userName, image: this.userImage, role: this.role, status: this.status } });
      this.pruneInactiveUsers();
    }, 5000);
  }

  private pruneInactiveUsers() {
    const now = Date.now();
    let changed = false;
    this.users.forEach((user, id) => {
      if (id === this.userId) return;
      if (now - new Date(user.lastSeen).getTime() > 15000) {
        this.users.delete(id);
        changed = true;
      }
    });
    if (changed) {
      this.onUsersChange?.(Array.from(this.users.values()));
    }
  }

  private broadcast(payload: Omit<CollaborationMessage, "userId" | "timestamp">) {
    if (!this.channel || !this.isConnected) return;
    this.channel.trigger("client-message", {
      ...payload,
      userId: this.userId,
      timestamp: Date.now(),
    } satisfies CollaborationMessage);
  }

  private handleIncomingMessage(message: CollaborationMessage) {
    if (!message || message.userId === this.userId) return;

    switch (message.type) {
      case "user-join":
      case "presence": {
        const existing = this.users.get(message.userId);
        const isNewUser = message.type === "user-join" && !existing;
        const nextUser: CollaborationUser = {
          id: message.userId,
          name: (message.data as any)?.name || existing?.name || "Collaborator",
          image: (message.data as any)?.image || existing?.image,
          color: existing?.color || CollaborationClient.colorForUser(message.userId),
          cursor: existing?.cursor,
          selection: existing?.selection,
          isActive: true,
          lastSeen: new Date(message.timestamp),
          role: (message.data as any)?.role || existing?.role || "Collaborator",
          status: (message.data as any)?.status || existing?.status || "active",
        };
        this.users.set(message.userId, nextUser);
        this.onUsersChange?.(Array.from(this.users.values()));
        if (isNewUser) {
          this.onUserJoined?.(nextUser);
        }
        break;
      }
      case "user-leave": {
        this.users.delete(message.userId);
        this.onUsersChange?.(Array.from(this.users.values()));
        break;
      }
      case "cursor": {
        const cursor = message.data as { line: number; column: number };
        const user = this.users.get(message.userId);
        if (user) {
          user.cursor = cursor;
          user.lastSeen = new Date(message.timestamp);
          this.users.set(message.userId, user);
          this.onCursorChange?.(message.userId, cursor);
          this.onUsersChange?.(Array.from(this.users.values()));
        }
        break;
      }
      case "selection": {
        const selection = message.data as CollaborationUser["selection"];
        const user = this.users.get(message.userId);
        if (user) {
          user.selection = selection;
          user.lastSeen = new Date(message.timestamp);
          this.users.set(message.userId, user);
          this.onUsersChange?.(Array.from(this.users.values()));
        }
        break;
      }
      case "operation": {
        const operation = message.data as CollaborationOperation;
        this.onOperation?.(operation);
        break;
      }
      case "sync-request": {
        this.onSyncRequest?.(message.userId);
        break;
      }
      default:
        break;
    }
  }

  disconnect() {
    this.broadcast({ type: "user-leave", data: null });
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = null;
    }
    if (this.channel) {
      this.pusher?.unsubscribe(`presence-collab-${this.sessionId}`);
      this.channel = null;
    }
    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
    }
    this.isConnected = false;
    this.users.clear();
    this.onUsersChange?.([]);
  }

  requestSync() {
    this.broadcast({ type: "sync-request", data: null });
  }

  sendOperation(operation: CollaborationOperation) {
    this.status = "typing";
    this.upsertLocalUser();
    this.broadcast({ type: "operation", data: operation });
    
    clearTimeout((this as any)._typingTimeout);
    (this as any)._typingTimeout = setTimeout(() => {
      this.status = "active";
      this.upsertLocalUser();
      this.broadcast({ type: "presence", data: { name: this.userName, image: this.userImage, role: this.role, status: this.status } });
    }, 2000);
  }

  sendCursor(cursor: { line: number; column: number }) {
    this.currentCursor = cursor;
    this.status = "typing";
    this.upsertLocalUser();
    this.broadcast({ type: "cursor", data: cursor });
    
    clearTimeout((this as any)._typingTimeout);
    (this as any)._typingTimeout = setTimeout(() => {
      this.status = "active";
      this.upsertLocalUser();
      this.broadcast({ type: "presence", data: { name: this.userName, image: this.userImage, role: this.role, status: this.status } });
    }, 2000);
  }

  sendSelection(selection: CollaborationUser["selection"]) {
    const user = this.users.get(this.userId);
    if (user) {
      user.selection = selection;
      user.lastSeen = new Date();
      this.users.set(this.userId, user);
      this.onUsersChange?.(Array.from(this.users.values()));
    }
    this.broadcast({ type: "selection", data: selection });
  }

  setStatus(status: "active" | "running") {
    this.status = status;
    this.upsertLocalUser();
    this.broadcast({ type: "presence", data: { name: this.userName, image: this.userImage, role: this.role, status: this.status } });
  }

  getUsers(): CollaborationUser[] {
    return Array.from(this.users.values());
  }

  onUsersChangeCallback(callback: (users: CollaborationUser[]) => void) {
    this.onUsersChange = callback;
  }

  onOperationCallback(callback: (operation: CollaborationOperation) => void) {
    this.onOperation = callback;
  }

  onUserJoinedCallback(callback: (user: CollaborationUser) => void) {
    this.onUserJoined = callback;
  }

  onSyncRequestCallback(callback: (userId: string) => void) {
    this.onSyncRequest = callback;
  }

  onCursorChangeCallback(
    callback: (userId: string, cursor: { line: number; column: number }) => void,
  ) {
    this.onCursorChange = callback;
  }

  // Operational Transform for conflict resolution
  static transform(
    op1: CollaborationOperation,
    op2: CollaborationOperation,
  ): [CollaborationOperation, CollaborationOperation] {
    if (op1.position <= op2.position) {
      if (
        op1.type === "insert" &&
        op1.position + (op1.content?.length || 0) <= op2.position
      ) {
        op2.position += op1.content?.length || 0;
      } else if (
        op1.type === "delete" &&
        op1.position + (op1.length || 0) <= op2.position
      ) {
        op2.position -= op1.length || 0;
      }
    }
    return [op1, op2];
  }

  // Apply operation to document
  static applyOperation(
    content: string,
    operation: CollaborationOperation,
  ): string {
    switch (operation.type) {
      case "insert":
        return (
          content.slice(0, operation.position) +
          (operation.content || "") +
          content.slice(operation.position)
        );
      case "delete":
        return (
          content.slice(0, operation.position) +
          content.slice(operation.position + (operation.length || 0))
        );
      case "retain":
        return content;
      default:
        return content;
    }
  }
}
