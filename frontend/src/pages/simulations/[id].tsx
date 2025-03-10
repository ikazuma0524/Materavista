import React from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { GET_SIMULATION } from '@/graphql/queries';
import Head from 'next/head';
import Link from 'next/link';
import ResultsVisualizer from '@/components/ResultsVisualizer';

const SimulationDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const { loading, error, data, refetch } = useQuery(GET_SIMULATION, {
    variables: { id },
    skip: !id,
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleBack = () => {
    router.back();
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Convert simulation data to ResultsVisualizer format
  const convertToResultsFormat = (simulation: any) => {
    if (!simulation) return null;

    return {
      msd: simulation.msd ? JSON.parse(simulation.msd) : null,
      kinetic_energy: simulation.kinetic_energy ? JSON.parse(simulation.kinetic_energy) : null,
      frames: simulation.frames,
      atoms: simulation.atoms,
      error: simulation.error,
      trajectory_file_id: simulation.trajectory_file_path ? simulation.trajectory_file_path.split('/').pop() : null,
    };
  };

  return (
    <>
      <Head>
        <title>シミュレーション詳細 | LAMMPS Web Interface</title>
        <meta name="description" content="LAMMPS simulation details" />
      </Head>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              onClick={handleBack}
              className="flex items-center text-indigo-600 hover:text-indigo-800 mb-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              戻る
            </button>
            <h1 className="text-3xl font-bold text-gray-800">シミュレーション詳細</h1>
          </div>
          <button
            onClick={handleRefresh}
            className="btn btn-secondary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            更新
          </button>
        </div>

        {loading ? (
          <div className="card p-8">
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          </div>
        ) : error ? (
          <div className="card p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-5 rounded-lg">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-bold text-red-800 mb-1">エラーが発生しました</p>
                  <p className="text-red-700">{error.message}</p>
                </div>
              </div>
            </div>
          </div>
        ) : !data?.simulations_by_pk ? (
          <div className="card p-6">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-5 rounded-lg">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 mt-0.5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-bold text-yellow-800 mb-1">シミュレーションが見つかりません</p>
                  <p className="text-yellow-700">指定されたIDのシミュレーションは存在しません。</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            <div className="card p-6">
              <h2 className="text-2xl font-bold mb-6">基本情報</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">シミュレーション名</p>
                    <p className="font-medium">{data.simulations_by_pk.input.name}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">ステータス</p>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(data.simulations_by_pk.status)}`}>
                      {data.simulations_by_pk.status}
                    </span>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">作成日時</p>
                    <p>{formatDate(data.simulations_by_pk.created_at)}</p>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">原子数</p>
                    <p>{data.simulations_by_pk.atoms || '-'}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">フレーム数</p>
                    <p>{data.simulations_by_pk.frames || '-'}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">ポテンシャルファイル</p>
                    <p>{data.simulations_by_pk.input.potential_file?.filename || 'なし'}</p>
                  </div>
                </div>
              </div>
            </div>

            {data.simulations_by_pk.error && (
              <div className="card p-6">
                <h2 className="text-2xl font-bold mb-6">エラー</h2>
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-5 rounded-lg">
                  <p className="font-bold text-red-800 mb-2">シミュレーションエラー</p>
                  <p className="text-red-700">{data.simulations_by_pk.error}</p>
                </div>
              </div>
            )}

            <div className="card p-6">
              <h2 className="text-2xl font-bold mb-6">入力ファイル</h2>
              <div className="bg-gray-800 text-gray-200 p-4 rounded-lg overflow-auto max-h-96">
                <pre className="text-sm font-mono">{data.simulations_by_pk.input.content}</pre>
              </div>
            </div>

            {data.simulations_by_pk.status === 'completed' && (
              <ResultsVisualizer results={convertToResultsFormat(data.simulations_by_pk)} />
            )}
          </div>
        )}
      </main>
    </>
  );
};

export default SimulationDetailPage; 