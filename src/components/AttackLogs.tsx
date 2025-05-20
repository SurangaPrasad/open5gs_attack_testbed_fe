'use client';

import { useState, useEffect } from 'react';

// Types for the attack logs data
interface LogEntry {
  timestamp: string;
  file: string;
  totalFlows: number;
  detectedRows: number;
  detectionPercentage: number;
  attackType: string;
  count: number;
}

interface LogsResponse {
  entries: LogEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface LatestAttackStatus {
  timestamp: string;
  file: string;
  attackDetected: boolean;
  attackType: string;
  severity: 'none' | 'low' | 'medium' | 'high';
  detectionPct: number;
}

interface AttackLogsProps {
  onError?: (error: string) => void;
}

export default function AttackLogs({ onError }: AttackLogsProps) {
  const [logs, setLogs] = useState<LogsResponse | null>(null);
  const [latestStatus, setLatestStatus] = useState<LatestAttackStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [attackTypeFilter, setAttackTypeFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Fetch logs with filtering and pagination
  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '50',
        sort: sortOrder
      });
      
      if (attackTypeFilter) {
        params.append('attackType', attackTypeFilter);
      }
      
      if (fromDate) {
        params.append('fromDate', fromDate);
      }
      
      if (toDate) {
        params.append('toDate', toDate);
      }
      
      const response = await fetch(`http://100.123.47.114:8081/attack-logs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch attack logs');
      }
      
      const data = await response.json();
      setLogs(data);
    } catch (err) {
      console.error('Error fetching attack logs:', err);
      if (onError) onError(err instanceof Error ? err.message : 'Error fetching logs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch the latest attack status
  const fetchLatestStatus = async () => {
    try {
      const response = await fetch('http://100.123.47.114:8081/attack-logs/latest');
      
      if (!response.ok) {
        throw new Error('Failed to fetch latest attack status');
      }
      
      const data = await response.json();
      setLatestStatus(data);
    } catch (err) {
      console.error('Error fetching latest attack status:', err);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchLogs();
    fetchLatestStatus();
    
    // Set up polling for latest status
    const statusInterval = setInterval(fetchLatestStatus, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  // Refetch when filters or pagination change
  useEffect(() => {
    fetchLogs();
  }, [page, attackTypeFilter, fromDate, toDate, sortOrder]);

  // Handle filter changes
  const handleFilterChange = () => {
    setPage(1); // Reset to first page when filter changes
    fetchLogs();
  };

  // Handle date inputs
  const formatDateForInput = (date: string) => {
    return date ? date.split(' ')[0] : '';
  };

  // Get severity class for styling
  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'none': return 'bg-gray-100 text-gray-800';
      case 'low': return 'bg-yellow-100 text-yellow-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Attack Detection Logs</h2>
      
      {/* Latest Attack Status Card */}
      {latestStatus && (
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-2">Latest Detection Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Timestamp</p>
              <p className="font-medium">{latestStatus.timestamp}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">File</p>
              <p className="font-medium truncate">{latestStatus.file}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Attack Type</p>
              <p className="font-medium">
                {latestStatus.attackDetected ? latestStatus.attackType : 'No attack detected'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Severity</p>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityClass(latestStatus.severity)}`}>
                {latestStatus.severity.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 p-4 border rounded-lg">
        <h3 className="text-lg font-medium mb-2">Filter Logs</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attack Type
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              value={attackTypeFilter}
              onChange={(e) => setAttackTypeFilter(e.target.value)}
              placeholder="e.g. UPF_DoS"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-md"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-md"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort Order
            </label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={handleFilterChange}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Apply Filters
        </button>
      </div>
      
      {/* Logs Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        ) : logs && logs.entries.length > 0 ? (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Flows
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detection %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attack Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.entries.map((entry, index) => (
                  <tr key={`${entry.timestamp}-${index}`} className={entry.detectedRows > 0 ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.timestamp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                      {entry.file}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.totalFlows}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.detectedRows}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.detectionPercentage.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {entry.attackType ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {entry.attackType} ({entry.count})
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          None
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{logs.entries.length}</span> of{' '}
                <span className="font-medium">{logs.totalCount}</span> results
              </p>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded text-sm font-medium disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={!logs.hasMore}
                  className="px-4 py-2 border rounded text-sm font-medium disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No logs found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
