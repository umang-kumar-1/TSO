import { useState, useMemo } from 'react';

type SortDirection = 'ascending' | 'descending';

export interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

export const useTable = <T extends { [key: string]: any }>(
  items: T[],
  searchableKeys: (keyof T)[],
  initialSortKey: keyof T,
  initialSortDirection: SortDirection = 'ascending'
) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<any>({ key: initialSortKey, direction: initialSortDirection });

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return items;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return items.filter(item => {
      return searchableKeys.some(key => {
        const value = item[key];
        return value != null && value.toString().toLowerCase().includes(lowercasedTerm);
      });
    });
  }, [items, searchTerm, searchableKeys]);

  const sortedItems = useMemo(() => {
    let sortableItems = [...filteredItems];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        const aIsNull = valA == null;
        const bIsNull = valB == null;

        if (aIsNull && bIsNull) return 0;
        if (aIsNull) return 1; // Push null/undefined values to the end
        if (bIsNull) return -1;

        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredItems, sortConfig]);

  const requestSort = (key: keyof T) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { sortedItems, requestSort, sortConfig, searchTerm, setSearchTerm };
};
