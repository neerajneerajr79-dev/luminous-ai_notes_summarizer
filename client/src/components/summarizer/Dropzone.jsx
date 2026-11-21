import React from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import clsx from 'clsx';

const ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'text/plain': ['.txt'],
};

/** Drag & drop / browse file picker restricted to supported study formats. */
export default function Dropzone({ onFiles, className }) {
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: ACCEPT,
    maxFiles: 1,
    maxSize: 15 * 1024 * 1024,
    onDrop: (files) => onFiles?.(files),
  });

  return (
    <div
      {...getRootProps()}
      className={clsx(
        'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all',
        isDragReject && 'border-red-300 bg-red-50/50',
        isDragActive ? 'border-accent bg-accent-lavender/50' : 'border-line bg-white hover:border-accent/40 hover:bg-accent-lavender/20',
        className
      )}
    >
      <input {...getInputProps()} />
      <div
        className={clsx(
          'mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-soft transition-transform',
          isDragActive ? 'scale-110 bg-accent text-white' : 'bg-accent-lavender text-accent'
        )}
      >
        <UploadCloud size={26} />
      </div>
      <p className="text-sm font-bold">
        {isDragReject ? 'Unsupported file type or size (max 15 MB)' : 'Drag & drop your file here'}
      </p>
      <p className="mt-1.5 text-xs text-ink-soft">
        {isDragActive ? 'Release to upload' : 'or click to browse — PDF, DOCX, PPTX or TXT (up to 15 MB)'}
      </p>
    </div>
  );
}
