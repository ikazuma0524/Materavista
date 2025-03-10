import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface InputEditorProps {
  inputContent: string;
  onInputChange: (newContent: string) => void;
  onRunSimulation: () => void;
  isLoading: boolean;
}

const InputEditor: React.FC<InputEditorProps> = ({
  inputContent,
  onInputChange,
  onRunSimulation,
  isLoading,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState(inputContent);

  useEffect(() => {
    setEditableContent(inputContent);
  }, [inputContent]);

  const handleSaveEdit = () => {
    onInputChange(editableContent);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditableContent(inputContent);
    setIsEditing(false);
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <span className="bg-indigo-100 text-indigo-800 p-2 rounded-lg mr-3">3</span>
        LAMMPS Input File
      </h2>

      <div className="mb-4 flex justify-between items-center">
        <p className="text-gray-600">
          Review and edit the generated LAMMPS input file before running the simulation.
        </p>
        <div className="space-x-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleSaveEdit}
                className="btn btn-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="btn btn-secondary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="border border-gray-300 rounded-lg overflow-hidden mb-6 shadow-sm">
        {isEditing ? (
          <textarea
            className="w-full h-96 p-4 font-mono text-sm focus:outline-none focus:ring-0 resize-none"
            value={editableContent}
            onChange={(e) => setEditableContent(e.target.value)}
            disabled={isLoading}
            spellCheck="false"
          />
        ) : (
          <div className="relative">
            <div className="absolute top-2 right-2 bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded opacity-70">
              LAMMPS
            </div>
            <SyntaxHighlighter
              language="bash"
              style={vscDarkPlus}
              customStyle={{ margin: 0, borderRadius: '0.5rem', padding: '1.5rem' }}
              className="w-full h-96 overflow-y-auto"
              showLineNumbers={true}
            >
              {inputContent}
            </SyntaxHighlighter>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onRunSimulation}
          className="btn btn-accent"
          disabled={isLoading || !inputContent.trim()}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Running Simulation...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Run Simulation
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputEditor; 