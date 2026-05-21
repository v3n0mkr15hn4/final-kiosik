import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { validateFileSize, validateFileType } from '../utils/helpers';

/**
 * Touch-optimized file upload component
 */
const FileUpload = ({
  label,
  files = [],
  onFilesChange,
  maxFiles = 5,
  maxSizeMB = 5,
  acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png'],
  error,
  disabled = false,
  required = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
    e.target.value = ''; // Reset input
  };

  const processFiles = (newFiles) => {
    setUploadError('');
    
    if (files.length + newFiles.length > maxFiles) {
      setUploadError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles = [];
    for (const file of newFiles) {
      if (!validateFileType(file, acceptedTypes)) {
        setUploadError(t('errors.invalidFileType'));
        continue;
      }
      if (!validateFileSize(file, maxSizeMB)) {
        setUploadError(t('errors.fileTooLarge'));
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles]);
    }
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-8 h-8 text-blue-500" />;
    }
    return <FileText className="w-8 h-8 text-red-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-kiosk-base font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-kiosk-lg p-8
          transition-all duration-200 cursor-pointer
          ${dragActive ? 'border-government-blue bg-blue-50' : 'border-gray-300 hover:border-government-blue'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center text-center">
          <Upload className={`w-12 h-12 mb-4 ${dragActive ? 'text-government-blue' : 'text-gray-400'}`} />
          <p className="text-kiosk-base font-medium text-gray-700 mb-2">
            {t('form.dragDrop')}
          </p>
          <p className="text-kiosk-sm text-gray-500">
            {t('form.uploadHint')}
          </p>
        </div>
      </div>

      {/* Error Messages */}
      {(error || uploadError) && (
        <p className="mt-2 text-kiosk-sm text-red-500 font-medium">
          {error || uploadError}
        </p>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-kiosk border border-gray-200"
            >
              <div className="flex items-center space-x-4">
                {getFileIcon(file)}
                <div>
                  <p className="text-kiosk-base font-medium text-gray-700 truncate max-w-[200px] md:max-w-[400px]">
                    {file.name}
                  </p>
                  <p className="text-kiosk-sm text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                disabled={disabled}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
