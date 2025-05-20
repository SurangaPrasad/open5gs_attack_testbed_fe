'use client';

import { useState, useEffect } from 'react';
import AttackControls from './AttackControls';

interface Pod {
  name: string;
  namespace: string;
  containers: string[];
  status: string;
}

interface NetworkStatus {
  pods: Pod[];
}



export default function PodManagement() {
  const [binningUsers, setBinningUsers] = useState<Pod[]>([]);
  const [attackingUsers, setAttackingUsers] = useState<Pod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedMSISDN, setSelectedMSISDN] = useState('0000000001');
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRunningTraffic, setIsRunningTraffic] = useState(false);
  const [isStoppingTraffic, setIsStoppingTraffic] = useState(false);
  const [runningTrafficPod, setRunningTrafficPod] = useState<string | null>(null);
  const [targetIP, setTargetIP] = useState('10.45.0.1');
  const [isMLModelRunning, setIsMLModelRunning] = useState(false);
  const [isStartingMLModel, setIsStartingMLModel] = useState(false);
  const [isStoppingMLModel, setIsStoppingMLModel] = useState(false);

  // Generate MSISDN options
  const msisdnOptions = Array.from({ length: 10 }, (_, i) => 
    String(i + 1).padStart(10, '0')
  );

  useEffect(() => {
    fetchExistingPods();
    checkMLModelStatus();
    
    // Poll for ML model status every 10 seconds
    const statusInterval = setInterval(checkMLModelStatus, 10000);
    
    return () => clearInterval(statusInterval);
  }, []);

  const fetchExistingPods = async () => {
    try {
      const [accessResponse] = await Promise.all([
        fetch('http://100.123.47.114:8081/access-network'),
      ]);

      if (!accessResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const accessData = await accessResponse.json();
      
      // Filter pods into binning and attacking users (only UE pods)
      setBinningUsers(accessData.pods.filter((pod: Pod) => 
        pod.name.includes('binning') && pod.name.includes('-ues-')
      ));
      setAttackingUsers(accessData.pods.filter((pod: Pod) => 
        pod.name.includes('attacking') && pod.name.includes('-ues-')
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createPod = async (type: 'binning' | 'attacking') => {
    setIsCreating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('http://100.123.47.114:8081/install-ueransim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deploymentName: `ueransim-gnb-${type}`,
          initialMSISDN: selectedMSISDN,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create pod');
      }

      setSuccessMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} user created successfully`);
      fetchExistingPods(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pod');
    } finally {
      setIsCreating(false);
    }
  };

  const deletePod = async (podName: string) => {
    setIsDeleting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Extract the deployment name from the pod name
      const deploymentName = podName.split('-ues-')[0];
      
      const response = await fetch('http://100.123.47.114:8081/uninstall-ueransim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deploymentName: deploymentName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete pod');
      }

      setSuccessMessage('User deleted successfully');
      fetchExistingPods(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pod');
    } finally {
      setIsDeleting(false);
    }
  };

  const runTrafficTest = async (podName: string) => {
    setIsRunningTraffic(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('http://100.123.47.114:8081/run-traffic-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          podName: podName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to run traffic test');
      }

      setSuccessMessage('Traffic test started successfully');
      setRunningTrafficPod(podName);
      fetchExistingPods(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run traffic test');
    } finally {
      setIsRunningTraffic(false);
    }
  };

  const stopTrafficTest = async (podName: string) => {
    setIsStoppingTraffic(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('http://100.123.47.114:8081/stop-traffic-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          podName: podName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to stop traffic test');
      }

      setSuccessMessage('Traffic test stopped successfully');
      setRunningTrafficPod(null);
      fetchExistingPods(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop traffic test');
    } finally {
      setIsStoppingTraffic(false);
    }
  };
  
  // ML Model Control functions
  const checkMLModelStatus = async () => {
    try {
      const response = await fetch('http://100.123.47.114:8081/traces/status');
      
      if (!response.ok) {
        throw new Error('Failed to check ML model status');
      }
      
      const data = await response.json();
      setIsMLModelRunning(data.status);
    } catch (err) {
      console.error('Error checking ML model status:', err);
      // Don't set error message to avoid UI clutter during polling
    }
  };
  
  const startMLModel = async () => {
    setIsStartingMLModel(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await fetch('http://100.123.47.114:8081/traces/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to start ML model');
      }
      
      const data = await response.json();
      
      if (data.message === "Trace collector started successfully") {
        setSuccessMessage('ML threat detection model started successfully');
        setIsMLModelRunning(true);
      } else {
        throw new Error('Unexpected response from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start ML model');
    } finally {
      setIsStartingMLModel(false);
    }
  };
  
  const stopMLModel = async () => {
    setIsStoppingMLModel(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await fetch('http://100.123.47.114:8081/traces/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to stop ML model');
      }
      
      const data = await response.json();
      
      if (data.message === "Trace collector stopped successfully") {
        setSuccessMessage('ML threat detection model stopped successfully');
        setIsMLModelRunning(false);
      } else {
        throw new Error('Unexpected response from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop ML model');
    } finally {
      setIsStoppingMLModel(false);
    }
  };

  const PodTable = ({ pods, title, showTrafficButton = false, showAttackControls = false }: { 
    pods: Pod[]; 
    title: string; 
    showTrafficButton?: boolean;
    showAttackControls?: boolean;
  }) => (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
      </div>
      <div className="border-t border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Namespace</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Containers</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pods.map((pod) => (
                <>
                  <tr key={`${pod.namespace}-${pod.name}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pod.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pod.namespace}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${pod.status === 'Running' ? 'bg-green-100 text-green-800' : 
                          pod.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                          pod.status === 'Failed' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {pod.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {pod.containers.join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-4">
                      {showTrafficButton && (
                        <>
                          {runningTrafficPod === pod.name ? (
                            <button
                              onClick={() => stopTrafficTest(pod.name)}
                              disabled={isStoppingTraffic}
                              className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                            >
                              {isStoppingTraffic ? 'Stopping...' : 'Stop Traffic'}
                            </button>
                          ) : (
                            <button
                              onClick={() => runTrafficTest(pod.name)}
                              disabled={isRunningTraffic}
                              className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                            >
                              {isRunningTraffic ? 'Running...' : 'Run Traffic'}
                            </button>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => deletePod(pod.name)}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                  {showAttackControls && (
                    <tr key={`${pod.namespace}-${pod.name}-controls`} className="bg-gray-50">
                      <td colSpan={5} className="px-6 py-2">
                        <AttackControls 
                          pod={pod} 
                          targetIP={targetIP}
                          onStatusChange={(message) => setSuccessMessage(message)}
                          onError={(error) => setError(error)}
                        />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New User Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Create New User</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="msisdn" className="block text-sm font-medium text-gray-700">
              MSISDN
            </label>
            <select
              id="msisdn"
              value={selectedMSISDN}
              onChange={(e) => setSelectedMSISDN(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              {msisdnOptions.map((msisdn) => (
                <option key={msisdn} value={msisdn}>
                  {msisdn}
                </option>
              ))}
            </select>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => createPod('binning')}
              disabled={isCreating}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Binning User'}
            </button>
            <button
              onClick={() => createPod('attacking')}
              disabled={isCreating}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Attacking User'}
            </button>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error: {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
          {successMessage}
        </div>
      )}

      {/* ML Model Control */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-1">ML Threat Detection System</h2>
            <p className="text-sm text-gray-500">Real-time network traffic analysis and attack detection</p>
          </div>
          <div className="mt-4 md:mt-0">
            {isMLModelRunning ? (
              <button
                onClick={stopMLModel}
                disabled={isStoppingMLModel}
                className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {isStoppingMLModel ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Stopping...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 -ml-1 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                    </svg>
                    Stop ML Detection
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={startMLModel}
                disabled={isStartingMLModel}
                className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isStartingMLModel ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Starting...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 -ml-1 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Start ML Detection
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        <div className="mt-4">
          <div className="bg-gray-50 px-4 py-3 rounded-md">
            <div className="flex items-center">
              <div className={`flex-shrink-0 h-3 w-3 rounded-full ${isMLModelRunning ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <p className="ml-3 text-sm text-gray-700">
                <span className="font-medium">{isMLModelRunning ? 'Active' : 'Inactive'}</span>
                <span className="ml-1">{isMLModelRunning ? 'Analyzing traffic for threats' : 'ML threat detection is not running'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Attack Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Attack Configuration</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="targetIP" className="block text-sm font-medium text-gray-700">
              Target IP Address
            </label>
            <input
              type="text"
              id="targetIP"
              value={targetIP}
              onChange={(e) => setTargetIP(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="10.45.0.1"
            />
          </div>
        </div>
      </div>

      {/* Existing Users */}
      <PodTable pods={binningUsers} title="Existing Benign Users" showTrafficButton={true} />
      <PodTable pods={attackingUsers} title="Existing Attacking Users" showAttackControls={true} />
    </div>
  );
} 