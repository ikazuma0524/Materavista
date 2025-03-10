import React from 'react';
import Head from 'next/head';
import SimulationHistory from '@/components/SimulationHistory';
import Link from 'next/link';

const HistoryPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>シミュレーション履歴 | LAMMPS Web Interface</title>
        <meta name="description" content="LAMMPS simulation history" />
      </Head>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/" className="flex items-center text-indigo-600 hover:text-indigo-800 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              ホームに戻る
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">シミュレーション履歴</h1>
            <p className="text-gray-600 mt-2">
              過去に実行したシミュレーションの履歴を表示します。
            </p>
          </div>
          <Link href="/" className="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            新しいシミュレーション
          </Link>
        </div>

        <SimulationHistory />
      </main>
    </>
  );
};

export default HistoryPage; 