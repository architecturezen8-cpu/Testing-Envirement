import { ReactNode } from "react";

interface DataTableProps {
  headers: string[];
  children: ReactNode;
}

export function DataTable({ headers, children }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="bg-stone-50">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="border-b border-stone-200 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
