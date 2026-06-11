import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const menuItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be greater than or equal to 0"),
  category: z.string().min(1, "Category is required"),
  isAvailable: z.boolean(),
  imageUrl: z.string().url("Invalid URL").optional()
});

export default async function MenuPage() {
  // Fetch menu items from database
  const menuItems = await prisma.menuItem.findMany({
    orderBy: {
      category: 'asc',
      name: 'asc',
    }
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<z.infer<typeof menuItemSchema>>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: '',
      isAvailable: true,
      imageUrl: ''
    }
  });

  const handleSubmitMenu = async (data: z.infer<typeof menuItemSchema>) => {
    if (selectedItem) {
      // Update existing item
      await prisma.menuItem.update({
        where: { id: selectedItem.id },
        data: data
      });
    } else {
      // Create new item
      await prisma.menuItem.create({
        data: data
      });
    }

    // Reset form and refresh
    reset();
    setSelectedItem(null);
    setShowAddForm(false);
    window.location.reload();
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    // Set form values for editing
    register; // This is needed to trigger re-registration
  };

  const handleDelete = async (id: number) => {
    await prisma.menuItem.delete({
      where: { id }
    });
    window.location.reload();
  };

  const handleToggleAvailability = async (id: number, currentStatus: boolean) => {
    await prisma.menuItem.update({
      where: { id },
      data: { isAvailable: !currentStatus }
    });
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="pb-4">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <p className="text-sm text-gray-500">
          Create and manage your restaurant menu items
        </p>
      </div>

      {/* Add/Edit Menu Item Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {selectedItem ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h2>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(handleSubmitMenu); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Item Name</label>
                <Input
                  {...register("name")}
                  type="text"
                  placeholder="Enter item name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name?.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Input
                  {...register("category")}
                  type="text"
                  placeholder="e.g., appetizer, main, dessert"
                  className={errors.category ? "border-red-500" : ""}
                />
                {errors.category && (
                  <p className="text-xs text-red-500 mt-1">{errors.category?.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Input
                {...register("description")}
                type="textarea"
                placeholder="Enter item description"
                className={errors.description ? "border-red-500" : ""}
                className="h-20"
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">{errors.description?.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Price (₹)</label>
                <Input
                  {...register("price")}
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  className={errors.price ? "border-red-500" : ""}
                />
                {errors.price && (
                  <p className="text-xs text-red-500 mt-1">{errors.price?.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Image URL (optional)</label>
                <Input
                  {...register("imageUrl")}
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  className={errors.imageUrl ? "border-red-500" : ""}
                />
                {errors.imageUrl && (
                  <p className="text-xs text-red-500 mt-1">{errors.imageUrl?.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <label className="flex items-center text-sm font-medium">
                <input
                  type="checkbox"
                  {...register("isAvailable")}
                />
                Available for sale
              </label>
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  reset();
                  setShowAddForm(false);
                  setSelectedItem(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-white">
                {selectedItem ? 'Update Item' : 'Add Item'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Menu Items List and Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">Menu Items</h2>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-primary text-white"
          >
            Add Menu Item
          </Button>
        </div>

        {menuItems.length === 0 ? (
          <p className="text-center py-8 text-gray-500">
            No menu items found. Add your first item above.
          </p>
        ) : (
          <div className="space-y-4">
            {menuItems.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.category}</p>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 text-right">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-medium">₹{item.price}</span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedItem(item);
                          setShowAddForm(true);
                        }}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                        className={`
                          text-sm
                          ${item.isAvailable ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
                        `}
                      >
                        {item.isAvailable ? 'Hide' : 'Show'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}