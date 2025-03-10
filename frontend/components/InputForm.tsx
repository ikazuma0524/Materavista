import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const InputForm: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [potentialFileId, setPotentialFileId] = useState('');
  const [generatedInput, setGeneratedInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateInput = async () => {
    if (!prompt) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setGeneratedInput('');
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generate-input/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          potential_file_id: potentialFileId || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate input');
      }

      const data = await response.json();
      setGeneratedInput(data.input_content);
      toast.success('Input file generated successfully');
    } catch (err: any) {
      console.error('Error generating input:', err);
      setError(err.message || 'Failed to generate input');
      toast.error(err.message || 'Failed to generate input');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      {/* Render your form components here */}
    </div>
  );
};

export default InputForm; 