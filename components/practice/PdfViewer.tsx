// app/dashboard/practice/PdfViewer.tsx
'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

interface PdfViewerProps {
  file: File;
}

export function PdfViewer({ file }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setCurrentPage(1);
  }

  const goToPreviousPage = () => setCurrentPage(prev => (prev > 1 ? prev - 1 : 1));
  const goToNextPage = () => setCurrentPage(prev => (numPages && prev < numPages ? prev + 1 : prev));

  return (
    <div className="h-full w-full flex flex-col items-center">
      <div className="flex-grow w-full flex items-center justify-center overflow-hidden">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading PDF...</div>}
          error="Failed to load PDF file."
        >
          <Page pageNumber={currentPage} width={480} renderTextLayer={false} />
        </Document>
      </div>

      {numPages && numPages > 1 && (
        <div className="flex items-center justify-center space-x-4 p-2 border-t mt-2">
          <Button variant="outline" size="icon" onClick={goToPreviousPage} disabled={currentPage <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="text-sm font-medium">
            Page {currentPage} of {numPages}
          </p>
          <Button variant="outline" size="icon" onClick={goToNextPage} disabled={currentPage >= numPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}