import React from "react";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export interface DataTableColumn<T> {
  header: React.ReactNode;
  accessorKey?: keyof T | string;
  sortable?: boolean;
  sortKey?: string;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: React.ReactNode;
  onSort?: (key: string) => void;
  sortConfig?: { key: string; direction: "asc" | "desc" } | null;
  rowKey?: (row: T) => React.Key;
  pagination?: React.ReactNode;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
}

function getPaginationRange(
  currentPage: number,
  totalPages: number
): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const range: (number | "...")[] = [1];

  const left = Math.max(2, currentPage - 1);
  const right = Math.min(totalPages - 1, currentPage + 1);

  if (left > 2) range.push("...");

  for (let i = left; i <= right; i++) range.push(i);

  if (right < totalPages - 1) range.push("...");

  range.push(totalPages);

  return range;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "ไม่พบข้อมูล",
  onSort,
  sortConfig,
  rowKey,
  pagination,
  currentPage,
  totalPages,
  onPageChange,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {columns.map((col, index) => {
                const isSortable = col.sortable && col.sortKey && onSort;
                const isSorted =
                  sortConfig &&
                  col.sortKey &&
                  sortConfig.key === col.sortKey;
                const sortIcon = isSorted
                  ? sortConfig.direction === "asc"
                    ? "↑"
                    : "↓"
                  : "";

                return (
                  <th
                    key={index}
                    onClick={() =>
                      isSortable && col.sortKey
                        ? onSort(col.sortKey)
                        : undefined
                    }
                    className={`py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                      isSortable
                        ? "cursor-pointer hover:bg-gray-100 select-none"
                        : ""
                    } ${col.className || ""}`}
                  >
                    <div
                      className={`flex items-center ${
                        col.className?.includes("text-right") ||
                        col.className?.includes("justify-end")
                          ? "justify-end"
                          : col.className?.includes("text-center") ||
                            col.className?.includes("justify-center")
                          ? "justify-center"
                          : "justify-start"
                      } gap-1`}
                    >
                      {col.header}{" "}
                      {isSortable && <span className="w-4">{sortIcon}</span>}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                  <p className="mt-4 text-sm font-medium text-gray-500">
                    กำลังโหลดข้อมูล...
                  </p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <p className="text-sm font-medium text-gray-500">
                    {emptyMessage}
                  </p>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={rowKey ? rowKey(row) : rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors ${
                    onRowClick
                      ? "cursor-pointer hover:bg-slate-50"
                      : "hover:bg-gray-50/50"
                  }`}
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={`py-4 px-6 ${col.className || ""}`}
                    >
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                        ? (row as any)[col.accessorKey]
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination}

      {!pagination &&
        currentPage !== undefined &&
        totalPages !== undefined &&
        totalPages > 1 &&
        onPageChange &&
        !isLoading && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white rounded-b-md">
            <span className="text-sm font-medium text-gray-500">
              หน้า {currentPage} จาก {totalPages}
            </span>
            <div className="flex gap-1 items-center">
              {/* Previous */}
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page range with ellipsis */}
              {getPaginationRange(currentPage, totalPages).map((page, idx) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm select-none"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${
                      currentPage === page
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              {/* Next */}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
    </div>
  );
}