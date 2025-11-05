import React from 'react';

// A generic sort config type
interface SortConfig {
  key: string;
  direction: 'ascending' | 'descending';
}

export interface TableHeader {
    key: string;
    label: string;
    sortable?: boolean;
}

interface TableProps {
  headers: TableHeader[];
  children: React.ReactNode;
  
  itemCount: number;
  totalItemCount: number; 
  itemName: string;
  itemNamePlural: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  sortConfig: SortConfig | null;
  requestSort: (key: string) => void;
  filterComponents?: React.ReactNode;
}

const SortIcon: React.FC<{ active: boolean, direction?: 'ascending' | 'descending' }> = ({ active, direction }) => {
    const style = { 
        color: active ? 'var(--bs-body-color)' : 'var(--bs-tertiary-color)',
        width: '1em', 
        display: 'inline-block',
        verticalAlign: 'middle',
        marginLeft: '0.25rem'
    };
    if (!active) return <span style={style}>↕</span>;
    return direction === 'ascending' ? <span style={style}>↑</span> : <span style={style}>↓</span>;
};


const Table: React.FC<TableProps> = ({ 
    headers, children, itemCount, totalItemCount, itemName, itemNamePlural,
    searchValue, onSearchChange, sortConfig, requestSort, filterComponents 
}) => {
  return (
    <div className="card shadow-sm">
     <div className="p-3 d-flex justify-content-between align-items-center flex-wrap gap-3 border-bottom">
     <p className="mb-0 text-body-secondary small fw-medium me-auto">
            Showing <strong>{itemCount}</strong> of <strong>{totalItemCount}</strong> {itemCount === 1 ? itemName : itemNamePlural}
        </p>
        <div className="d-flex align-items-center gap-2">
            {filterComponents}
            <input 
                type="search" 
                className="form-control form-control-sm" 
                style={{width: '250px'}}
                placeholder={`Search ${itemNamePlural}...`}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
            />
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-hover mb-0">
            <thead>
                <tr>
                    {headers.map((header) => (
                        <th 
                            key={header.key} 
                            scope="col" 
                            className="p-3"
                            style={{ cursor: header.sortable ? 'pointer' : 'default', whiteSpace: 'nowrap' }}
                            onClick={() => header.sortable && requestSort(header.key)}
                        >
                            {header.label}
                            {header.sortable && <SortIcon active={sortConfig?.key === header.key} direction={sortConfig?.key === header.key ? sortConfig.direction : undefined} />}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {children}
            </tbody>
        </table>
        {itemCount === 0 && (
             <div className="text-center p-4 text-body-secondary">
                No {itemNamePlural} found.
             </div>
        )}
      </div>
    </div>
  );
};

export default Table;
