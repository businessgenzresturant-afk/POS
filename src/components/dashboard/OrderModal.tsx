import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, UtensilsCrossed, ShoppingBag, Package, Bike } from 'lucide-react';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrderType: (type: 'DINE_IN' | 'TAKEAWAY' | 'PARCEL' | 'DELIVERY', customerDetails?: any) => void;
}

export function OrderModal({ isOpen, onClose, onSelectOrderType }: OrderModalProps) {
  const [customerName, setCustomerName] = React.useState('');
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [guests, setGuests] = React.useState('');
  const [selectedType, setSelectedType] = React.useState<'DINE_IN' | 'TAKEAWAY' | 'PARCEL' | 'DELIVERY' | null>(null);

  if (!isOpen) return null;

  const handleContinue = () => {
    if (selectedType) {
      onSelectOrderType(selectedType, { customerName, customerPhone, address, guests });
    }
  };

  const OrderTypeCard = ({ type, title, icon: Icon, color }: any) => (
    <div 
      onClick={() => setSelectedType(type)}
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
        selectedType === type 
          ? `border-${color}-500 bg-${color}-500/10 shadow-md shadow-${color}-500/20 transform scale-105` 
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
      }`}
    >
      <div className={`p-3 rounded-full ${selectedType === type ? `bg-${color}-500 text-white` : 'bg-muted text-muted-foreground'}`}>
        <Icon className="w-8 h-8" />
      </div>
      <p className="font-bold text-foreground">{title}</p>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-background border border-border shadow-2xl rounded-3xl z-50 overflow-hidden animate-fade-in">
        
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10">
          <h2 className="text-2xl font-black text-foreground">New Order</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider text-center">Select Order Type</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <OrderTypeCard type="DINE_IN" title="Dine In" icon={UtensilsCrossed} color="blue" />
            <OrderTypeCard type="TAKEAWAY" title="Takeaway" icon={ShoppingBag} color="amber" />
            <OrderTypeCard type="PARCEL" title="Parcel" icon={Package} color="emerald" />
            <OrderTypeCard type="DELIVERY" title="Delivery" icon={Bike} color="rose" />
          </div>

          {selectedType && (
            <div className="space-y-4 pt-4 border-t border-border animate-fade-in">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                {selectedType === 'DINE_IN' ? 'Table Details' : 'Customer Details (Optional)'}
              </h3>
              
              {selectedType === 'DINE_IN' ? (
                <div className="grid grid-cols-1 gap-3">
                  <Input 
                    type="number"
                    placeholder="Number of Guests" 
                    value={guests} 
                    onChange={(e) => setGuests(e.target.value)} 
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Input 
                    placeholder="Customer Name" 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)} 
                  />
                  <Input 
                    placeholder="Phone Number" 
                    value={customerPhone} 
                    onChange={(e) => setCustomerPhone(e.target.value)} 
                  />
                </div>
              )}
              
              {selectedType === 'DELIVERY' && (
                <Input 
                  placeholder="Delivery Address" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                />
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border bg-muted/10">
          <Button 
            className="w-full h-14 text-lg font-bold shadow-lg"
            variant="gradient"
            disabled={!selectedType}
            onClick={handleContinue}
          >
            Continue to Menu
          </Button>
        </div>

      </div>
    </>
  );
}
