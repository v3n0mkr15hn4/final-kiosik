import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'];
const DOC_EXTENSIONS = ['doc', 'docx'];

function getExtension(filename = '') {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

function isImage(file) {
  return file?.type?.startsWith('image/') || IMAGE_EXTENSIONS.includes(getExtension(file?.name));
}

function isPdf(file) {
  return file?.type === 'application/pdf' || getExtension(file?.name) === 'pdf';
}

function isDoc(file) {
  return DOC_EXTENSIONS.includes(getExtension(file?.name));
}

const FilePreviewModal = ({ file, isOpen, onClose }) => {
  const { t } = useTranslation();
  const [hasPreviewError, setHasPreviewError] = useState(false);

  const canImagePreview = useMemo(() => isImage(file), [file]);
  const canPdfPreview = useMemo(() => isPdf(file), [file]);
  const isDocFile = useMemo(() => isDoc(file), [file]);

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate pr-4">{file.name}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label={t('filePreview.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-auto">
          {(hasPreviewError || !file.previewUrl) && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Preview could not be loaded. The file may be unavailable.
            </div>
          )}

          {canImagePreview && file.previewUrl ? (
            <img
              src={file.previewUrl}
              alt={file.name}
              className="mx-auto max-h-[72vh] w-auto rounded-lg"
              onError={() => setHasPreviewError(true)}
            />
          ) : null}

          {canPdfPreview && file.previewUrl ? (
            <iframe
              title={file.name}
              src={file.previewUrl}
              className="w-full h-[72vh] rounded-lg border border-gray-200"
              onError={() => setHasPreviewError(true)}
            />
          ) : null}

          {!canImagePreview && !canPdfPreview ? (
            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-700">
                {isDocFile
                  ? 'DOC/DOCX preview is limited in browsers. Please download to view this file.'
                  : 'Preview is not available for this file type.'}
              </p>
              {file.previewUrl ? (
                <a
                  href={file.previewUrl}
                  download={file.name}
                  className="inline-flex items-center rounded-lg bg-government-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
                >
                  Download file
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
