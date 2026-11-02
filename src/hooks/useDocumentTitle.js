import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Mhish` : 'Mhish · Personal Finance';
  }, [title]);
}
