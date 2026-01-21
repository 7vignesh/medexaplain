'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { uploadReport } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { setAuthToken } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function UploadSection() {
  const [uploading, setUploading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const { getToken } = useAuth();
  const router = useRouter();

  const performOCR = async (file: File): Promise<string> => {
    try {
      setOcrProgress(0);
      
      const worker = await createWorker('eng', 1, {
        corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v4/tesseract-core.wasm.js',
      });
      
      const { data: { text } } = await worker.recognize(file);
      setOcrProgress(100);
      
      await worker.terminate();
      
      return text;
    } catch (error) {
      console.error('OCR error:', error);
      throw error;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setOcrProgress(0);

    try {
      // Get auth token
      const token = getToken();
      if (token) {
        setAuthToken(token);
      }

      const formData = new FormData();
      formData.append('file', file);

      // Perform OCR if image
      if (file.type.startsWith('image/')) {
        toast.loading('Extracting text from image...', { id: 'ocr' });
        const extractedText = await performOCR(file);
        formData.append('extractedText', extractedText);
        toast.success('Text extracted successfully', { id: 'ocr' });
      }

      // Upload to backend
      toast.loading('Uploading report...', { id: 'upload' });
      const response = await uploadReport(formData);
      toast.success('Report uploaded successfully!', { id: 'upload' });

      // Redirect to report detail page
      router.push(`/reports/${response.data.data._id}`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload report', { id: 'upload' });
    } finally {
      setUploading(false);
      setOcrProgress(0);
    }
  }, [getToken, router]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Medical Report</h2>
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-12 w-12 text-primary-600 animate-spin" />
            <p className="text-sm text-gray-600">
              {ocrProgress > 0 ? `Processing... ${ocrProgress}%` : 'Uploading...'}
            </p>
          </div>
        ) : (
          <>
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive ? (
                'Drop the file here'
              ) : (
                <>
                  Drag and drop your medical report here, or{' '}
                  <span className="text-primary-600 font-medium">browse</span>
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Supports PDF, PNG, JPG, JPEG, TIFF (max 10MB)
            </p>
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FileText className="h-5 w-5 text-blue-500" />
          <span>PDF Reports</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <ImageIcon className="h-5 w-5 text-green-500" />
          <span>Image Scans</span>
        </div>
      </div>
    </div>
  );
}
