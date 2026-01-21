import * as pdfjsLib from 'pdfjs-dist';

// Set worker source. Using unpkg for the worker script matching the library version (4.8.69).
// Critical: The worker version MUST match the library version to avoid "Failed to read PDF" errors.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;

export const extractTextFromPdf = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    // We wrap this in a try/catch specifically for loading errors (like password or corrupt file)
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      cMapUrl: 'https://unpkg.com/pdfjs-dist@4.8.69/cmaps/',
      cMapPacked: true,
    });

    const pdf = await loadingTask.promise;

    let fullText = '';
    
    // Read up to the first 2 pages (usually contains title, author, year)
    // Most metadata is on the first page, but sometimes spills over.
    const maxPages = Math.min(pdf.numPages, 2);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Extract text items and join them with spaces
      // We filter out empty strings to keep it clean
      const pageText = textContent.items
        .map((item: any) => item.str)
        .filter((str: string) => str.trim().length > 0)
        .join(' ');
        
      fullText += pageText + '\n';
    }

    if (!fullText.trim()) {
      throw new Error("PDF contains no extractable text (it might be an image scan).");
    }

    return fullText;
  } catch (error: any) {
    console.error("PDF Parse Error:", error);
    
    if (error.name === 'PasswordException') {
      throw new Error("PDF is password protected.");
    }
    
    if (error.message && error.message.includes('fake worker')) {
        throw new Error("PDF Worker configuration failed. Please refresh.");
    }

    throw new Error("Failed to read PDF. The file might be corrupted or in an unsupported format.");
  }
};