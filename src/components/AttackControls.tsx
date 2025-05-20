// In AttackControls.tsx
'use client';

import { useState, useEffect } from 'react';

// Define the types needed
export interface Pod {
  name: string;
  namespace: string;
  containers: string[];
  status: string;
}

export interface AttackStatus {
  isRunning: boolean;
  message: string;
}

export type AttackType = 
  | 'ddos'
  | 'gtp-encapsulation'
  | 'teid-bruteforce'
  | 'upf-dos'
  | 'malformed-gtpu'

interface AttackControlsProps {
  pod: Pod;
  targetIP: string;
  onStatusChange?: (message: string) => void;
  onError?: (error: string) => void;
}


// Continue in AttackControls.tsx
export default function AttackControls({ pod, targetIP, onStatusChange, onError }: AttackControlsProps) {
  const [attackStatuses, setAttackStatuses] = useState<{[key in AttackType]?: AttackStatus}>({});
  const [runningAttacks, setRunningAttacks] = useState<AttackType[]>([]);
  const [isRunningAttack, setIsRunningAttack] = useState(false);
  const [isStoppingAttack, setIsStoppingAttack] = useState(false);

  // Define attack types
  const attackTypes: AttackType[] = [
    'ddos', 
    'gtp-encapsulation', 
    'teid-bruteforce',
    'upf-dos',
    'malformed-gtpu'
  ];

  useEffect(() => {
    // Initial fetch of status for all attack types
    attackTypes.forEach(attackType => {
      fetchAttackStatus(attackType);
    });

    // Set up polling for running attacks
    const interval = setInterval(() => {
      // Check all attack types to make sure we don't miss any changes
      attackTypes.forEach(attackType => {
        fetchAttackStatus(attackType);
      });
    }, 5000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIP, pod.name]);

  const fetchAttackStatus = async (attackType: AttackType) => {
    try {
      const baseEndpoint = `http://100.123.47.114:8081/${`status-${attackType}`}`;
      
      // Use URLSearchParams to build query string
      const params = new URLSearchParams({
        PodName: pod.name,
        TargetIP: targetIP
      });
      
      const endpoint = `${baseEndpoint}?${params.toString()}`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to get status for ${attackType}`);
      }

      const data = await response.json();
      
      // Map backend response format to frontend model
      const isRunning = data.status === 'running';
      const message = data.message || (isRunning ? 'Attack is running' : 'Attack is not running');

      // Update the status for this specific attack
      setAttackStatuses(prev => ({
        ...prev,
        [attackType]: {
          isRunning: isRunning,
          message: message
        }
      }));
      
      // If the attack is no longer running, remove it from runningAttacks
      if (!isRunning && runningAttacks.includes(attackType)) {
        setRunningAttacks(prev => prev.filter(type => type !== attackType));
      } else if (isRunning && !runningAttacks.includes(attackType)) {
        setRunningAttacks(prev => [...prev, attackType]);
      }
      
    } catch (err) {
      console.error(`Error fetching ${attackType} status:`, err);
    }
  };

  const runAttack = async (attackType: AttackType) => {
    setIsRunningAttack(true);
    
    try {
      const endpoint = `http://100.123.47.114:8081/${`run-${attackType}`}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          PodName: pod.name,
          TargetIP: targetIP
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start ${attackType} attack`);
      }

      // Update attack status
      await fetchAttackStatus(attackType);
      
      // Add to running attacks if not already there
      if (!runningAttacks.includes(attackType)) {
        setRunningAttacks(prev => [...prev, attackType]);
      }
      
      if (onStatusChange) {
        onStatusChange(`${formatAttackName(attackType)} started successfully`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : `Failed to start ${attackType} attack`;
      if (onError) onError(errorMsg);
      console.error(errorMsg);
    } finally {
      setIsRunningAttack(false);
    }
  };
  
  const stopAttack = async (attackType: AttackType) => {
    setIsStoppingAttack(true);
    
    try {
      const endpoint = `http://100.123.47.114:8081/${`stop-${attackType}`}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          PodName: pod.name,
          TargetIP: targetIP
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to stop ${attackType} attack`);
      }

      // Update attack status
      await fetchAttackStatus(attackType);
      
      if (onStatusChange) {
        onStatusChange(`${formatAttackName(attackType)} stopped successfully`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : `Failed to stop ${attackType} attack`;
      if (onError) onError(errorMsg);
      console.error(errorMsg);
    } finally {
      setIsStoppingAttack(false);
    }
  };

  const formatAttackName = (attackType: AttackType): string => {
    switch(attackType) {
      case 'ddos': return 'DDoS Attack';
      case 'gtp-encapsulation': return 'GTP Encapsulation';
      case 'teid-bruteforce': return 'TEID Bruteforce';
      case 'upf-dos': return 'UPF DoS';
      case 'malformed-gtpu': return 'Malformed GTPU';
      default: return attackType;
    }
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {attackTypes.map(attackType => {
          const isRunning = attackStatuses[attackType]?.isRunning || false;
          
          return (
            <div key={attackType} className="flex flex-col border rounded p-2 bg-gray-50">
              <span className="text-xs font-semibold mb-1">{formatAttackName(attackType)}</span>
              <div className="flex space-x-2">
                {isRunning ? (
                  <button
                    onClick={() => stopAttack(attackType)}
                    disabled={isStoppingAttack}
                    className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={() => runAttack(attackType)}
                    disabled={isRunningAttack}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    Start
                  </button>
                )}
              </div>
              {attackStatuses[attackType] && (
                <div className="mt-1 text-xs">
                  <span className={`font-medium ${isRunning ? 'text-green-600' : 'text-gray-500'}`}>
                    {isRunning ? 'Running' : 'Stopped'}
                  </span>
                  {attackStatuses[attackType]?.message && (
                    <p className="text-gray-500 truncate max-w-xs" title={attackStatuses[attackType]?.message}>
                      {attackStatuses[attackType]?.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div> 
  );
}