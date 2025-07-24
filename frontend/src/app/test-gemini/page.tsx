'use client';

import { useState } from 'react';
import { geminiService } from '@/lib/gemini';

export default function TestGemini() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKeyTest, setApiKeyTest] = useState<boolean | null>(null);

  const testApiKey = async () => {
    setLoading(true);
    try {
      const isValid = await geminiService.testApiKey();
      setApiKeyTest(isValid);
      setResult(isValid ? 'API key is valid!' : 'API key test failed');
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
      setApiKeyTest(false);
    } finally {
      setLoading(false);
    }
  };

  const testCodeGeneration = async () => {
    setLoading(true);
    try {
      const code = await geminiService.generateCode('Create a simple button component');
      setResult(code);
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testChat = async () => {
    setLoading(true);
    try {
      const response = await geminiService.chatWithAI('Hello, how are you?', []);
      setResult(response);
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Gemini API Test</h1>
      
      <div className="space-y-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={testApiKey}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test API Key'}
          </button>
          
          <button
            onClick={testCodeGeneration}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Code Generation'}
          </button>
          
          <button
            onClick={testChat}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Chat'}
          </button>
        </div>
        
        {apiKeyTest !== null && (
          <div className={`p-2 rounded ${apiKeyTest ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            API Key Status: {apiKeyTest ? 'Valid ✅' : 'Invalid ❌'}
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Result:</h2>
        <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-white p-3 rounded border max-h-96 overflow-y-auto">
          {result || 'Click a button above to test the Gemini API'}
        </pre>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p><strong>API Key:</strong> {process.env.NEXT_PUBLIC_GEMINI_API_KEY ? 
          `${process.env.NEXT_PUBLIC_GEMINI_API_KEY.substring(0, 10)}...` : 
          'Not found'
        }</p>
        <p><strong>Open browser console to see detailed logs</strong></p>
      </div>
    </div>
  );
}
