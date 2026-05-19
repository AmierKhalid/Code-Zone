"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CollaborationClient, CollaborationUser } from "@/lib/collaboration";

export default function TestCollaboration() {
  const [client, setClient] = useState<CollaborationClient | null>(null);
  const [users, setUsers] = useState<CollaborationUser[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const initializeCollaboration = async () => {
    try {
      addLog("Initializing collaboration...");
      
      const sessionId = `test-session-${Date.now()}`;
      const userId = `test-user-${Math.random().toString(36).substring(7)}`;
      const testClient = new CollaborationClient(sessionId, userId, "Test User");
      
      await testClient.connect();
      
      testClient.onUsersChangeCallback((users) => {
        addLog(`Users updated: ${users.length} users`);
        setUsers(users);
      });
      
      testClient.onCursorChangeCallback((userId, cursor) => {
        addLog(`Cursor moved: ${userId} at line ${cursor.line}, column ${cursor.column}`);
      });
      
      setClient(testClient);
      addLog("Collaboration initialized successfully!");
    } catch (error) {
      addLog(`Error: ${error}`);
    }
  };

  const disconnect = () => {
    if (client) {
      client.disconnect();
      setClient(null);
      setUsers([]);
      addLog("Disconnected from collaboration");
    }
  };

  const sendTestOperation = () => {
    if (client) {
      const operation = {
        type: 'insert' as const,
        position: Math.floor(Math.random() * 100),
        content: '// Test operation\n',
        userId: client['userId'],
        timestamp: Date.now()
      };
      client.sendOperation(operation);
      addLog("Sent test operation");
    }
  };

  const sendTestCursor = () => {
    if (client) {
      const cursor = {
        line: Math.floor(Math.random() * 50) + 1,
        column: Math.floor(Math.random() * 80) + 1
      };
      client.sendCursor(cursor);
      addLog(`Sent cursor to line ${cursor.line}, column ${cursor.column}`);
    }
  };

  useEffect(() => {
    return () => {
      if (client) {
        client.disconnect();
      }
    };
  }, [client]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Collaboration System Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="bg-dark-2 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Connection</h2>
            <div className="space-y-2">
              <Button
                onClick={initializeCollaboration}
                disabled={!!client}
                className="w-full"
              >
                Initialize Collaboration
              </Button>
              <Button
                onClick={disconnect}
                disabled={!client}
                variant="destructive"
                className="w-full"
              >
                Disconnect
              </Button>
            </div>
          </div>

          <div className="bg-dark-2 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Test Operations</h2>
            <div className="space-y-2">
              <Button
                onClick={sendTestOperation}
                disabled={!client}
                variant="outline"
                className="w-full"
              >
                Send Test Operation
              </Button>
              <Button
                onClick={sendTestCursor}
                disabled={!client}
                variant="outline"
                className="w-full"
              >
                Send Test Cursor
              </Button>
            </div>
          </div>

          <div className="bg-dark-2 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Active Users ({users.length})</h2>
            <div className="space-y-2">
              {users.map(user => (
                <div key={user.id} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: user.color }}
                  />
                  <span className="text-sm">{user.name}</span>
                  {user.isActive && (
                    <span className="text-xs text-green-500">Active</span>
                  )}
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-sm text-light-4">No users connected</p>
              )}
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-dark-2 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Activity Log</h2>
          <div className="h-96 overflow-y-auto bg-dark-3 p-3 rounded font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-light-4">No activity yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
