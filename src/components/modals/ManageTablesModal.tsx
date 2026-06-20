'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Check } from 'lucide-react';

interface Table {
  id: string;
  number: number;
  capacity: number;
  status: string;
}

interface ManageTablesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageTablesModal({ isOpen, onClose }: ManageTablesModalProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTable, setNewTable] = useState({ number: '', capacity: '' });

  useEffect(() => {
    if (isOpen) {
      fetchTables();
    }
  }, [isOpen]);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tables');
      const data = await response.json();
      setTables(data);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async () => {
    if (!newTable.number || !newTable.capacity) return;

    try {
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: parseInt(newTable.number),
          capacity: parseInt(newTable.capacity),
          status: 'AVAILABLE',
        }),
      });

      if (response.ok) {
        setNewTable({ number: '', capacity: '' });
        fetchTables();
      }
    } catch (error) {
      console.error('Failed to add table:', error);
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;

    try {
      await fetch(`/api/tables/${id}`, { method: 'DELETE' });
      fetchTables();
    } catch (error) {
      console.error('Failed to delete table:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-black text-foreground">Manage Tables</h2>
            <p className="text-xs text-muted-foreground mt-1">Add, edit, or delete restaurant tables</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add New Table */}
          <div className="bg-muted/50 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-bold text-foreground mb-3">Add New Table</h3>
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="Table Number"
                value={newTable.number}
                onChange={(e) => setNewTable({ ...newTable, number: e.target.value })}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="number"
                placeholder="Capacity"
                value={newTable.capacity}
                onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleAddTable}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>

          {/* Tables List */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : tables.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No tables found</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <p className="font-bold text-foreground">Table {table.number}</p>
                    <p className="text-xs text-muted-foreground">Capacity: {table.capacity} people</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Status: <span className="font-semibold">{table.status}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteTable(table.id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-muted text-foreground rounded-lg font-bold text-sm hover:bg-muted/80 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
