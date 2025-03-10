import React, { useState } from 'react';
import { generateLAMMPSInput } from '@/services/api';

interface InputFormProps {
  onInputGenerated: (inputContent: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  potentialFileId: string | null;
  potentialFileName: string | null;
}

const InputForm: React.FC<InputFormProps> = ({ 
  onInputGenerated, 
  isLoading, 
  setIsLoading,
  potentialFileId,
  potentialFileName
}) => {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please enter a description of the simulation you want to run.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // ポテンシャルファイルの情報をプロンプトに追加
      let enhancedPrompt = prompt;
      if (potentialFileId && potentialFileName) {
        enhancedPrompt += `\n\nPlease use the potential file named "${potentialFileName}" in the simulation.`;
      }

      const response = await generateLAMMPSInput(enhancedPrompt, potentialFileId || undefined);
      onInputGenerated(response.input_content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate input');
    } finally {
      setIsLoading(false);
    }
  };

  const examplePrompts = [
    {
      title: "Water Simulation",
      prompt: "Simulate 100 water molecules in a box at 300K for 10000 steps",
      icon: "💧"
    },
    {
      title: "Argon Simulation",
      prompt: "Run a Lennard-Jones simulation of argon atoms at low temperature",
      icon: "❄️"
    },
    {
      title: "Protein Simulation",
      prompt: "Create a protein in water simulation with NaCl ions at physiological concentration",
      icon: "🧬"
    }
  ];

  const handleExampleClick = (example: string) => {
    setPrompt(example);
    setError(null);
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <span className="bg-indigo-100 text-indigo-800 p-2 rounded-lg mr-3">2</span>
        シミュレーションの説明
      </h2>
      
      {potentialFileId && potentialFileName && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-blue-700">ポテンシャルファイルが選択されています</span>
          </div>
          <p className="text-sm text-blue-600">
            <code className="bg-blue-100 px-1 py-0.5 rounded">{potentialFileName}</code> を使用したシミュレーションが生成されます。
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="prompt" className="input-label">
            実行したい分子動力学シミュレーションを自然言語で説明してください:
          </label>
          <textarea
            id="prompt"
            className="input"
            rows={5}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例: 300Kで100個の水分子をシミュレーションして10000ステップ実行する"
            disabled={isLoading}
          />
          {error && (
            <div className="mt-2 text-red-500 bg-red-50 p-2 rounded-md border border-red-200 animate-fade-in">
              <p className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            </div>
          )}
        </div>
        
        <div>
          <p className="input-label mb-3">
            以下の例を試してみてください:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {examplePrompts.map((example, index) => (
              <div
                key={index}
                onClick={() => handleExampleClick(example.prompt)}
                className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-300 hover:border-indigo-300"
              >
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">{example.icon}</span>
                  <h3 className="font-medium">{example.title}</h3>
                </div>
                <p className="text-sm text-gray-600">{example.prompt}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className={`btn btn-primary ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                生成中...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
                LAMMPSインプットを生成
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InputForm; 