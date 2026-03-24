// Load html2pdf from CDN to avoid Metro bundling jspdf (which uses AMD-style requires)
let _html2pdf: any = null;

export default async function loadHtml2pdf(): Promise<any> {
  if (_html2pdf) return _html2pdf;
  if (typeof window === 'undefined') return null;

  return new Promise((resolve, reject) => {
    const existing = document.getElementById('html2pdf-cdn');
    if (existing) {
      _html2pdf = (window as any).html2pdf;
      resolve(_html2pdf);
      return;
    }
    const script = document.createElement('script');
    script.id = 'html2pdf-cdn';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => {
      _html2pdf = (window as any).html2pdf;
      resolve(_html2pdf);
    };
    script.onerror = () => reject(new Error('Failed to load html2pdf'));
    document.head.appendChild(script);
  });
}
