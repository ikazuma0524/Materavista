import React, { useState } from 'react';
import Head from 'next/head';
import InputForm from '@/components/InputForm';
import InputEditor from '@/components/InputEditor';
import ResultsVisualizer from '@/components/ResultsVisualizer';
import ChatAssistant from '@/components/ChatAssistant';
import PotentialFileSelector from '@/components/PotentialFileSelector';
import { runLAMMPSSimulation } from '@/services/api';
import { SimulationResponse } from '@/types';

export default function Home() {
  const [inputContent, setInputContent] = useState<string>('');
  const [simulationResults, setSimulationResults] = useState<SimulationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [potentialFileId, setPotentialFileId] = useState<string | null>(null);
  const [potentialFileName, setPotentialFileName] = useState<string | null>(null);

  const handleInputGenerated = (content: string) => {
    setInputContent(content);
    setSimulationResults(null);
    setCurrentStep(3);
  };

  const handleInputChange = (newContent: string) => {
    setInputContent(newContent);
  };

  const handlePotentialFileSelected = (fileId: string | null, fileName: string | null) => {
    setPotentialFileId(fileId);
    setPotentialFileName(fileName);
    if (fileId) {
      setCurrentStep(2);
    }
  };

  const handleRunSimulation = async () => {
    setIsLoading(true);
    try {
      const results = await runLAMMPSSimulation(inputContent, potentialFileId || undefined);
      setSimulationResults(results);
      setCurrentStep(4);
    } catch (error) {
      console.error('Error running simulation:', error);
      setSimulationResults({ error: 'Failed to run simulation' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => {
    setShowChat(!showChat);
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <>
      <Head>
        <title>LAMMPS Web Interface</title>
        <meta name="description" content="Web interface for running LAMMPS molecular dynamics simulations" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">LAMMPS Web Interface</h1>
          <p className="text-gray-600">
            Run molecular dynamics simulations in your browser using LAMMPS
          </p>
        </header>

        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer ${currentStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-300'}`}
              onClick={() => setCurrentStep(1)}
            >
              1
            </div>
            <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer ${currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-300'}`}
              onClick={() => potentialFileId ? setCurrentStep(2) : null}
            >
              2
            </div>
            <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer ${currentStep >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-300'}`}
              onClick={() => inputContent ? setCurrentStep(3) : null}
            >
              3
            </div>
            <div className={`w-16 h-1 ${currentStep >= 4 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer ${currentStep >= 4 ? 'bg-indigo-600 text-white' : 'bg-gray-300'}`}
              onClick={() => simulationResults ? setCurrentStep(4) : null}
            >
              4
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-2 text-sm text-gray-600 mb-8">
          <div className="w-10 text-center">ファイル</div>
          <div className="w-16"></div>
          <div className="w-10 text-center">生成</div>
          <div className="w-16"></div>
          <div className="w-10 text-center">編集</div>
          <div className="w-16"></div>
          <div className="w-10 text-center">結果</div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {currentStep === 1 && (
            <>
              <PotentialFileSelector 
                onPotentialFileSelected={handlePotentialFileSelected} 
                showNextButton={true}
                onNextStep={() => setCurrentStep(2)}
              />
              <div className="flex justify-between mt-6">
                <div></div>
                <button
                  onClick={() => potentialFileId && setCurrentStep(2)}
                  className={`btn ${potentialFileId ? 'btn-primary' : 'btn-disabled'}`}
                  disabled={!potentialFileId}
                >
                  次へ進む
                </button>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <InputForm
                onInputGenerated={handleInputGenerated}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                potentialFileId={potentialFileId}
                potentialFileName={potentialFileName}
              />
              <div className="flex justify-between mt-6">
                <button
                  onClick={goToPreviousStep}
                  className="btn btn-secondary"
                >
                  戻る
                </button>
                <button
                  onClick={() => inputContent && setCurrentStep(3)}
                  className={`btn ${inputContent ? 'btn-primary' : 'btn-disabled'}`}
                  disabled={!inputContent}
                >
                  次へ進む
                </button>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <InputEditor
                inputContent={inputContent}
                onInputChange={handleInputChange}
                onRunSimulation={handleRunSimulation}
                isLoading={isLoading}
              />
              
              {potentialFileId && (
                <div className="card mb-6">
                  <h2 className="text-xl font-bold mb-4">使用するポテンシャルファイル</h2>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium">{potentialFileName}</span>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    <p>このポテンシャルファイルはシミュレーション実行時に自動的に使用されます。</p>
                    <p>LAMMPSのinputファイル内で、<code className="bg-gray-100 px-1 py-0.5 rounded">{potentialFileName}</code>として参照できます。</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between mt-6">
                <button
                  onClick={goToPreviousStep}
                  className="btn btn-secondary"
                >
                  戻る
                </button>
                <button
                  onClick={handleRunSimulation}
                  className={`btn ${isLoading ? 'btn-disabled' : 'btn-primary'}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'シミュレーション実行中...' : 'シミュレーション実行'}
                </button>
              </div>
            </>
          )}

          {currentStep === 4 && simulationResults && (
            <>
              <ResultsVisualizer results={simulationResults} />
              <div className="flex justify-between mt-6">
                <button
                  onClick={goToPreviousStep}
                  className="btn btn-secondary"
                >
                  入力編集に戻る
                </button>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="btn btn-primary"
                >
                  新しいシミュレーションを開始
                </button>
              </div>
            </>
          )}
        </div>

        <div className="fixed bottom-6 right-6">
          <button
            onClick={toggleChat}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Chat with assistant"
          >
            {showChat ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            )}
          </button>
        </div>

        {showChat && (
          <div className="fixed bottom-20 right-6 w-96 h-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            <ChatAssistant 
              onInputGenerated={handleInputGenerated} 
              potentialFileId={potentialFileId}
              potentialFileName={potentialFileName}
            />
          </div>
        )}
      </main>
    </>
  );
} 