"use client";

import { Users, Circle, UserPlus, WifiOff, MonitorPlay, Keyboard, Activity, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollaborationUser } from "@/lib/collaboration";

interface CollaborationPanelProps {
  users: CollaborationUser[];
  isConnected: boolean;
  currentUserId: string;
  pillsVisible?: boolean;
  onTogglePills?: () => void;
  onInviteUser?: () => void;
  onDisconnect?: () => void;
}

export default function CollaborationPanel({
  users,
  isConnected,
  currentUserId,
  pillsVisible = true,
  onTogglePills,
  onInviteUser,
  onDisconnect,
}: CollaborationPanelProps) {
  const activeUsers = users.filter(user => user.isActive && user.id !== currentUserId);
  const currentUser = users.find(user => user.id === currentUserId);

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 30) return 'Active now';
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return `${hours}h ago`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "typing": return <Keyboard className="h-3 w-3 text-primary-500 animate-pulse" />;
      case "running": return <MonitorPlay className="h-3 w-3 text-green-500 animate-pulse" />;
      default: return <Activity className="h-3 w-3 text-light-4" />;
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-dark-2/80 backdrop-blur-md rounded-xl border border-dark-4/50 shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-dark-4/50">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-primary-500/10 rounded-lg">
            <Users className="h-4 w-4 text-primary-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-light-1 tracking-wide">Multiplayer</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-2 w-2">
                {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              </span>
              <span className="text-[10px] font-medium text-light-4 uppercase tracking-wider">
                {isConnected ? 'Live Session' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 animate-in fade-in slide-in-from-top-2">
          <WifiOff className="h-4 w-4 text-red-500" />
          <span className="text-xs font-medium text-red-400">Connection lost</span>
          <Button size="sm" variant="ghost" onClick={onDisconnect} className="ml-auto h-7 text-xs hover:bg-red-500/20 hover:text-red-300">
            Leave Room
          </Button>
        </div>
      )}

      {/* Active Users */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold text-light-3 uppercase tracking-wider">
            In Room ({activeUsers.length + 1})
          </span>
          <div className="flex items-center gap-1">
            {/* Toggle cursor name-pills visibility */}
            <Button
              size="sm"
              variant="ghost"
              onClick={onTogglePills}
              title={pillsVisible ? "Hide name labels" : "Show name labels"}
              className="h-6 w-6 p-0 hover:bg-primary-500/20 hover:text-primary-500 rounded-full transition-colors"
            >
              {pillsVisible
                ? <Eye className="h-3.5 w-3.5" />
                : <EyeOff className="h-3.5 w-3.5 text-light-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onInviteUser}
              className="h-6 w-6 p-0 hover:bg-primary-500/20 hover:text-primary-500 rounded-full transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {/* Current User */}
          {currentUser && (
            <div className="group flex items-center gap-3 p-2.5 rounded-lg bg-dark-3/50 border border-dark-4/50 hover:bg-dark-3 hover:border-dark-4 transition-all duration-200">
              <div className="relative">
                {currentUser.image ? (
                  <img src={currentUser.image} alt={currentUser.name} className="h-8 w-8 rounded-full border-2 border-dark-2 shadow-sm object-cover" />
                ) : (
                  <div
                    className="h-8 w-8 rounded-full border-2 border-dark-2 shadow-sm flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: currentUser.color }}
                  >
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-[2px] border-dark-3 bg-green-500"></div>
              </div>
              
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-light-1 truncate">{currentUser.name}</p>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-dark-4/80 text-light-3 px-1.5 py-0.5 rounded-md">
                    {currentUser.role}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {getStatusIcon(currentUser.status)}
                  <p className="text-[11px] text-light-4 font-medium">
                    {currentUser.status === "typing" ? "Typing..." : currentUser.status === "running" ? "Running Code..." : "You"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Other Users */}
          {activeUsers.map((user) => (
            <div
              key={user.id}
              className="group flex items-center gap-3 p-2.5 rounded-lg bg-dark-3/30 border border-transparent hover:bg-dark-3/80 hover:border-dark-4/50 transition-all duration-200"
            >
              <div className="relative">
                {user.image ? (
                  <img src={user.image} alt={user.name} className="h-8 w-8 rounded-full border-2 border-dark-2 shadow-sm object-cover" />
                ) : (
                  <div
                    className="h-8 w-8 rounded-full border-2 border-dark-2 shadow-sm flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-[2px] border-dark-3 bg-green-500"></div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-light-2 group-hover:text-light-1 transition-colors truncate">
                    {user.name}
                  </p>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-dark-4/50 text-light-4 px-1.5 py-0.5 rounded-md">
                    {user.role}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {getStatusIcon(user.status)}
                  <p className="text-[11px] text-light-4">
                    {user.status === "typing" ? (
                      <span className="text-primary-400">Typing...</span>
                    ) : user.status === "running" ? (
                      <span className="text-green-400">Running Code...</span>
                    ) : (
                      <span>{formatLastSeen(user.lastSeen)}</span>
                    )}
                  </p>
                </div>
              </div>

              {user.cursor && user.status === "active" && (
                <div className="text-[10px] font-mono text-light-4/60 group-hover:text-light-4 transition-colors">
                  Ln {user.cursor.line}
                </div>
              )}
            </div>
          ))}

          {activeUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 px-4 text-center border-2 border-dashed border-dark-4/50 rounded-lg bg-dark-3/20">
              <Users className="h-8 w-8 text-light-4/50 mb-3" />
              <p className="text-sm font-medium text-light-3 mb-1">It's quiet here</p>
              <p className="text-xs text-light-4 mb-4">Invite a friend to code together</p>
              <Button size="sm" onClick={onInviteUser} className="h-8 text-xs bg-primary-500 hover:bg-primary-600 text-white rounded-full px-4">
                Invite Collaborator
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {activeUsers.length > 0 && (
        <div className="pt-2 mt-2 border-t border-dark-4/50 flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onDisconnect}
            className="w-full gap-2 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors rounded-lg"
          >
            <WifiOff className="h-3.5 w-3.5" />
            Leave Session
          </Button>
        </div>
      )}
    </div>
  );
}
