
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const DatabaseManager = () => {
    const navigate = useNavigate();
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [sqlQuery, setSqlQuery] = useState('');
    const [queryResult, setQueryResult] = useState<any>(null);
    const [queryError, setQueryError] = useState<string | null>(null);

    // Fetch Table List
    const { data: tablesData } = useQuery({
        queryKey: ['tables'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/admin/tables`);
            return res.json();
        }
    });

    // Fetch Table Content
    const { data: tableContent, refetch: refetchTable } = useQuery({
        queryKey: ['tableContent', selectedTable],
        queryFn: async () => {
            if (!selectedTable) return null;
            const res = await fetch(`${API_URL}/api/v1/admin/tables/${selectedTable}`);
            return res.json();
        },
        enabled: !!selectedTable
    });

    const handleExecuteSql = async () => {
        try {
            setQueryError(null);
            const res = await fetch(`${API_URL}/api/v1/admin/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sql: sqlQuery })
            });
            const data = await res.json();

            if (data.status === 'error') {
                throw new Error(data.message);
            }
            setQueryResult(data);
        } catch (err: any) {
            setQueryError(err.message);
        }
    };

    const renderTable = (rows: any[], fields?: string[]) => {
        if (!rows || rows.length === 0) return <div className="p-4 text-slate-500">No data found</div>;

        // Get keys from first row if fields not provided
        const headers = fields || Object.keys(rows[0]);

        return (
            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            {headers.map(h => (
                                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200 text-sm">
                        {rows.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                                {headers.map(h => (
                                    <td key={h} className="px-6 py-4 whitespace-nowrap text-slate-700">
                                        {row[h] !== null ? String(row[h]) : <span className="text-slate-300">null</span>}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Database Manager</h1>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar: Tables */}
                <div className="md:col-span-1 bg-white p-4 rounded-lg border border-slate-200 h-fit">
                    <h3 className="font-semibold text-slate-700 mb-3">Tables</h3>
                    <div className="space-y-1">
                        {tablesData?.tables?.map((table: string) => (
                            <button
                                key={table}
                                onClick={() => { setSelectedTable(table); setSqlQuery(`SELECT * FROM ${table} LIMIT 100`); }}
                                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedTable === table
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'hover:bg-slate-50 text-slate-600'}`}
                            >
                                {table}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="md:col-span-3 space-y-6">
                    {/* SQL Editor */}
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Execute SQL</label>
                        <div className="relative">
                            <textarea
                                value={sqlQuery}
                                onChange={(e) => setSqlQuery(e.target.value)}
                                className="w-full h-32 p-3 font-mono text-sm bg-slate-900 text-green-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="SELECT * FROM appointments..."
                            />
                            <div className="absolute bottom-3 right-3">
                                <Button size="sm" onClick={handleExecuteSql}>Run Query</Button>
                            </div>
                        </div>
                        {queryError && (
                            <div className="mt-3 bg-red-50 text-red-600 p-3 rounded text-sm font-mono border border-red-100">
                                Error: {queryError}
                            </div>
                        )}
                        {queryResult && (
                            <div className="mt-3">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-slate-500">Query Status: {queryResult.status} | Rows: {queryResult.rowCount}</span>
                                </div>
                                {renderTable(queryResult.rows)}
                            </div>
                        )}
                    </div>

                    {/* Table View */}
                    {selectedTable && !queryResult && (
                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-slate-800">Table: {selectedTable}</h3>
                                <Button variant="ghost" size="sm" onClick={() => refetchTable()}>Refresh</Button>
                            </div>
                            {renderTable(tableContent?.rows || [])}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
