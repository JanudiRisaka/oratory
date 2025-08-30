// components/practice/SlidesPanel.tsx
'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { FileText, XCircle, Loader2 } from 'lucide-react';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

interface SlidesPanelProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
}

export function SlidesPanel({ file, onFileSelect }: SlidesPanelProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setCurrentPage(1);
  }

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    },
    multiple: false,
  });

  const handleClearFile = () => {
    onFileSelect(null);
    setNumPages(null);
  };

  if (!file) {
    return (
      <div {...getRootProps()} className={`h-full flex flex-col border-2 border-dashed rounded-lg p-8 text-center justify-center items-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'hover:border-primary/50'}`}>
        <input {...getInputProps()} />
        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        {isDragActive ? <p>Drop the file here...</p> : <p>Drag & drop slides, or click to select</p>}
        <p className="text-xs text-muted-foreground mt-4">Supports: PDF, Images (PNG, JPG)</p>
      </div>
    );
  }

  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';

  return (
    <div className="h-full w-full flex flex-col relative bg-muted/30 rounded-lg">
      <Button variant="ghost" size="icon" className="absolute top-1 right-1 z-20 bg-background/50 hover:bg-background/80" onClick={handleClearFile} title="Clear file">
        <XCircle className="h-5 w-5" />
      </Button>

      {isImage && <img src={URL.createObjectURL(file)} alt="Presentation Slide" className="object-contain h-full w-full" />}

      {isPdf && (
        <div className="h-full w-full flex flex-col">
          <div className="flex-grow overflow-y-auto flex justify-center bg-black/50">
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
            >
              <Page pageNumber={currentPage} />
            </Document>
          </div>
          {numPages && (
            <div className="flex-shrink-0 p-2 bg-background/80 flex items-center justify-center space-x-4 border-t">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(currentPage - 1)}>Previous</Button>
              <p className="text-sm font-medium">Page {currentPage} of {numPages}</p>
              <Button variant="outline" size="sm" disabled={currentPage >= numPages} onClick={() => setCurrentPage(currentPage + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}

      {!isImage && !isPdf && (
         <div className="flex flex-col items-center justify-center h-full text-center p-4">
           <p className="font-semibold">Unsupported File Type</p>
           <p className="text-sm text-muted-foreground mt-1">Please convert your PPTX file to a PDF to view it here.</p>
         </div>
      )}
    </div>
  );
}