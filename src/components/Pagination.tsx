import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, lastPage, total, perPage, onPageChange }: PaginationProps) {
  if (lastPage <= 1) return null;

  const from = (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, total);

  // Generate visible page numbers with ellipsis
  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    const delta = 1; // pages to show around current

    pages.push(1);

    if (currentPage - delta > 2) {
      pages.push('...');
    }

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(lastPage - 1, currentPage + delta); i++) {
      pages.push(i);
    }

    if (currentPage + delta < lastPage - 1) {
      pages.push('...');
    }

    if (lastPage > 1) {
      pages.push(lastPage);
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4 px-4 sm:px-6 border-t border-slate-100">
      <p className="text-sm text-slate-500 font-medium">
        Menampilkan <span className="font-bold text-slate-700">{from}</span>–<span className="font-bold text-slate-700">{to}</span> dari <span className="font-bold text-slate-700">{total}</span> data
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          title="Halaman pertama"
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Halaman sebelumnya"
        >
          <ChevronLeft className="size-4" />
        </Button>

        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 text-sm select-none">…</span>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size="icon"
              className={`h-8 w-8 rounded-lg text-xs font-bold ${page === currentPage ? 'bg-emerald-700 hover:bg-emerald-800 text-white' : ''}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          disabled={currentPage >= lastPage}
          onClick={() => onPageChange(currentPage + 1)}
          title="Halaman berikutnya"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          disabled={currentPage >= lastPage}
          onClick={() => onPageChange(lastPage)}
          title="Halaman terakhir"
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
