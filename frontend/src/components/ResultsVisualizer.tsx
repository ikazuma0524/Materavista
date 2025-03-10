import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { SimulationResponse } from '@/types';
import { getTrajectoryFile, downloadTrajectoryFile } from '@/services/api';

// Use dynamic import for Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface ResultsVisualizerProps {
  results: SimulationResponse | null;
}

const ResultsVisualizer: React.FC<ResultsVisualizerProps> = ({ results }) => {
  const [showRawData, setShowRawData] = useState(false);
  const [trajectoryContent, setTrajectoryContent] = useState<string | null>(null);
  const [isLoadingTrajectory, setIsLoadingTrajectory] = useState(false);
  const [showTrajectory, setShowTrajectory] = useState(false);

  // Fetch trajectory file when results change and trajectory_file_id is available
  useEffect(() => {
    if (results?.trajectory_file_id && showTrajectory) {
      fetchTrajectoryFile(results.trajectory_file_id);
    }
  }, [results?.trajectory_file_id, showTrajectory]);

  const fetchTrajectoryFile = async (fileId: string) => {
    setIsLoadingTrajectory(true);
    try {
      const content = await getTrajectoryFile(fileId);
      setTrajectoryContent(content);
    } catch (error) {
      console.error('Failed to fetch trajectory file:', error);
    } finally {
      setIsLoadingTrajectory(false);
    }
  };

  const handleDownloadTrajectory = () => {
    if (results?.trajectory_file_id) {
      downloadTrajectoryFile(results.trajectory_file_id);
    }
  };

  if (!results) {
    return (
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <span className="bg-indigo-100 text-indigo-800 p-2 rounded-lg mr-3">3</span>
          Simulation Results
        </h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 mb-2">Run a simulation to see results here.</p>
          <p className="text-sm text-gray-400">The simulation results will include mean squared displacement, potential energy, and other metrics.</p>
        </div>
      </div>
    );
  }

  if (results.error) {
    return (
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <span className="bg-indigo-100 text-indigo-800 p-2 rounded-lg mr-3">3</span>
          Simulation Results
        </h2>
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-5 rounded-lg">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-bold text-red-800 mb-1">Simulation Error</p>
              <p className="text-red-700">{results.error}</p>
              <p className="mt-3 text-sm text-red-600">
                Try modifying your input file or using a different simulation setup.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const timeSteps = results.msd ? Array.from({ length: results.msd.length }, (_, i) => i) : [];

  return (
    <div className="card">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-2xl font-bold mb-2 md:mb-0 flex items-center">
          <span className="bg-indigo-100 text-indigo-800 p-2 rounded-lg mr-3">3</span>
          Simulation Results
        </h2>
        <div className="flex flex-wrap gap-2">
          {results.trajectory_file_id && (
            <>
              <button
                onClick={() => setShowTrajectory(!showTrajectory)}
                className="btn btn-secondary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                {showTrajectory ? 'Hide Trajectory' : 'Show Trajectory'}
              </button>
              <button
                onClick={handleDownloadTrajectory}
                className="btn btn-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download XYZ
              </button>
            </>
          )}
          <button
            onClick={() => setShowRawData(!showRawData)}
            className="btn btn-secondary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {showRawData ? 'Show Visualizations' : 'Show Raw JSON'}
          </button>
        </div>
      </div>
      
      {showRawData ? (
        <div className="bg-gray-50 p-5 rounded-lg overflow-auto max-h-[600px] border border-gray-200">
          <pre className="text-sm font-mono text-gray-800">{JSON.stringify(results, null, 2)}</pre>
        </div>
      ) : showTrajectory && results.trajectory_file_id ? (
        <div className="bg-gray-50 p-5 rounded-lg overflow-auto max-h-[600px] mb-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Trajectory File (XYZ Format)</h3>
            <div className="badge badge-primary">Molecular Coordinates</div>
          </div>
          {isLoadingTrajectory ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : trajectoryContent ? (
            <pre className="text-xs font-mono bg-gray-800 text-gray-200 p-4 rounded-md overflow-auto">{trajectoryContent}</pre>
          ) : (
            <div className="text-center p-8 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p>Failed to load trajectory file.</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* MSD Plot */}
            {results.msd && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Mean Squared Displacement</h3>
                  <div className="badge badge-info">MSD</div>
                </div>
                <Plot
                  data={[
                    {
                      x: timeSteps,
                      y: results.msd,
                      type: 'scatter',
                      mode: 'lines',
                      marker: { color: '#4f46e5' },
                      name: 'MSD',
                      line: { width: 3 }
                    },
                  ]}
                  layout={{
                    autosize: true,
                    margin: { l: 50, r: 20, t: 20, b: 50 },
                    xaxis: { title: 'Time Step', gridcolor: '#f3f4f6' },
                    yaxis: { title: 'MSD', gridcolor: '#f3f4f6' },
                    height: 400,
                    plot_bgcolor: '#ffffff',
                    paper_bgcolor: '#ffffff',
                    font: { family: 'Inter, sans-serif' }
                  }}
                  config={{ responsive: true, displayModeBar: false }}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            {/* Kinetic Energy Plot */}
            {results.kinetic_energy && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Kinetic Energy</h3>
                  <div className="badge badge-success">Energy</div>
                </div>
                <Plot
                  data={[
                    {
                      x: timeSteps,
                      y: results.kinetic_energy,
                      type: 'scatter',
                      mode: 'lines',
                      marker: { color: '#10b981' },
                      name: 'Kinetic Energy',
                      line: { width: 3 }
                    },
                  ]}
                  layout={{
                    autosize: true,
                    margin: { l: 50, r: 20, t: 20, b: 50 },
                    xaxis: { title: 'Time Step', gridcolor: '#f3f4f6' },
                    yaxis: { title: 'Kinetic Energy', gridcolor: '#f3f4f6' },
                    height: 400,
                    plot_bgcolor: '#ffffff',
                    paper_bgcolor: '#ffffff',
                    font: { family: 'Inter, sans-serif' }
                  }}
                  config={{ responsive: true, displayModeBar: false }}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>

          {/* Simulation Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100 flex items-center">
              <div className="bg-indigo-100 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-indigo-900 text-lg">Number of Frames</h4>
                <p className="text-3xl font-bold text-indigo-700">{results.frames || 'N/A'}</p>
              </div>
            </div>
            <div className="bg-green-50 p-6 rounded-lg border border-green-100 flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-green-900 text-lg">Number of Atoms</h4>
                <p className="text-3xl font-bold text-green-700">{results.atoms || 'N/A'}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ResultsVisualizer; 