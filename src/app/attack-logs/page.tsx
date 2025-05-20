// /app/attack-logs/page.tsx
'use client';

import { useState } from 'react';
import AttackLogs from '@/components/AttackLogs';

export default function AttackLogsPage() {
  const [error, setError] = useState<string | null>(null);
  
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Attack Detection Logs</h1>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p>{error}</p>
            <button 
              className="float-right" 
              onClick={() => setError(null)}
              aria-label="Close alert"
            >
              ×
            </button>
          </div>
        )}
        
        <AttackLogs onError={setError} />
      </div>
    </div>
  );
}
