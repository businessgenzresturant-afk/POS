import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const tableSchema = z.object({
  number: z.number().int().positive("Table number must be a positive integer"),
  capacity: z.number().int().positive("Capacity must be a positive integer")
});

export default function TablesPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tables from database
  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await prisma.table.findMany({
        orderBy: {
          number: 'asc',
        }
      });
      setTables(data);
    } catch (err) {
      setError('Failed to fetch tables');
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<z.infer<typeof tableSchema>>({
    resolver: zodResolver(tableSchema),
    defaultValues: {
      number: 1,
      capacity: 4
    }
  });

  const handleSubmitTable = async (data: z.infer<typeof tableSchema>) => {
    try {
      await prisma.table.create({
        data: {
          number: data.number,
          capacity: data.capacity,
        }
      });
      reset();
      // Refetch tables instead of reloading page
      await fetchTables();
    } catch (err) {
      setError('Failed to create table');
      console.error('Error creating table:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await prisma.table.delete({
        where: { id }
      });
      // Refetch tables instead of reloading page
      await fetchTables();
    } catch (err) {
      setError('Failed to delete table');
      console.error('Error deleting table:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-12 w-12"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-4">
        <h1 className="text-2xl font-bold">Table Management</h1>
        <p className="text-sm text-gray-500">
          Manage your restaurant tables and their status
        </p>
      </div>

      {/* Add Table Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Add New Table</h2>
        <form onSubmit={handleSubmit(handleSubmitTable)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Table Number</label>
              <Input
                {...register("number")}
                type="number"
                placeholder="Enter table number"
                className={errors.number ? "border-red-500" : ""}
              />
              {errors.number && (
                <p className="text-xs text-red-500 mt-1">{errors.number?.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Capacity</label>
              <Input
                {...register("capacity")}
                type="number"
                placeholder="Enter seating capacity"
                className={errors.capacity ? "border-red-500" : ""}
              />
              {errors.capacity && (
                <p className="text-xs text-red-500 mt-1">{errors.capacity?.message}</p>
              )}
            </div>
          </div>
          <Button type="submit" className="w-full bg-primary text-white">
            Add Table
          </Button>
        </form>
      </div>

      {/* Tables List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Current Tables</h2>

        {tables.length === 0 ? (
          <p className="text-center py-8 text-gray-500">
            No tables found. Add your first table above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table #
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tables.map((table) => (
                  <tr key={table.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{table.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {table.capacity} seats
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${table.status === 'available' ? 'bg-green-100 text-green-800' :
                          table.status === 'occupied' ? 'bg-red-100 text-red-800' :
                          table.status === 'reserved' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'}`}>
                        {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="outline"
                        onClick={() => handleDelete(table.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}