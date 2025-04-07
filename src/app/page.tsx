'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Open5GS Web Interface
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Monitor and manage your 5G Core Network
        </p>
        <Link
          href="/kubernetes"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          View Network Status
        </Link>
      </div>
    </div>
  );
} 