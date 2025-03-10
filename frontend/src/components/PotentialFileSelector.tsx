import React, { useState } from 'react';
import FileDropzone from './FileDropzone';

interface PotentialFileSelectorProps {
  onPotentialFileSelected: (fileId: string | null, fileName: string | null) => void;
  showNextButton?: boolean;
  onNextStep?: () => void;
}

const PotentialFileSelector: React.FC<PotentialFileSelectorProps> = ({ 
  onPotentialFileSelected, 
  showNextButton = false,
  onNextStep
}) => {
  const [uploadedFile, setUploadedFile] = useState<{ id: string; name: string } | null>(null);
  const [usePotentialFile, setUsePotentialFile] = useState(false);

  const handleFileUploaded = (fileId: string, fileName: string) => {
    setUploadedFile({ id: fileId, name: fileName });
    setUsePotentialFile(true);
    onPotentialFileSelected(fileId, fileName);
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setUsePotentialFile(checked);
    onPotentialFileSelected(checked && uploadedFile ? uploadedFile.id : null, 
                           checked && uploadedFile ? uploadedFile.name : null);
  };

  return (
    <div className="card mb-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <span className="bg-indigo-100 text-indigo-800 p-2 rounded-lg mr-3">1</span>
        ポテンシャルファイル（オプション）
      </h2>
      
      <div className="mb-4">
        <p className="text-gray-600 mb-4">
          ポテンシャルファイルをアップロードすると、シミュレーションでより正確な結果が得られます。
          アップロードしたファイルは、inputファイル生成時に参照できます。
        </p>
        
        {uploadedFile && (
          <label className="flex items-center space-x-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
              checked={usePotentialFile}
              onChange={handleToggleChange}
            />
            <span className="text-gray-700">ポテンシャルファイルを使用する</span>
          </label>
        )}
      </div>
      
      {!uploadedFile ? (
        <FileDropzone onFileUploaded={handleFileUploaded} />
      ) : (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium">{uploadedFile.name}</span>
          </div>
          
          <button
            onClick={() => {
              setUploadedFile(null);
              setUsePotentialFile(false);
              onPotentialFileSelected(null, null);
            }}
            className="text-red-500 hover:text-red-700 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p>ポテンシャルファイルをアップロードすると、シミュレーション実行時に自動的に使用されます。</p>
        <p>LAMMPSのinputファイル内で、ファイル名を直接参照してください。</p>
      </div>
      
      {showNextButton && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={onNextStep}
            className="btn btn-primary"
          >
            次へ進む
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default PotentialFileSelector; 