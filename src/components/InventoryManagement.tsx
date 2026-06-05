import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  TrendingDown, 
  Calendar,
  Trash2,
  Edit2,
  ChevronLeft,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { cn } from '../utils';
import { useLanguage } from '../context/LanguageContext';

interface InventoryItem {
  id: string;
  name: string;
  category: 'reagent' | 'disposable' | 'equipment' | 'other';
  quantity: number;
  unit: string;
  minThreshold: number;
  expiryDate?: string;
  uid: string;
}

interface InventoryManagementProps {
  onBack: () => void;
  theme: 'light' | 'dark';
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({ onBack, theme }) => {
  const { t, dir } = useLanguage();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    category: 'reagent',
    quantity: 0,
    unit: 'ml',
    minThreshold: 5,
    expiryDate: ''
  });

  const getActiveUser = () => {
    if (auth.currentUser) return auth.currentUser;
    const guest = localStorage.getItem('atsa_guest_session');
    if (guest) {
      try {
        return JSON.parse(guest);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    const user = getActiveUser();
    if (!user) return;

    const q = query(collection(db, 'inventory'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventoryData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InventoryItem[];
      setItems(inventoryData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'inventory');
    });

    return () => unsubscribe();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = getActiveUser();
    if (!user) return;

    try {
      await addDoc(collection(db, 'inventory'), {
        ...formData,
        uid: user.uid
      });
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        category: 'reagent',
        quantity: 0,
        unit: 'ml',
        minThreshold: 5,
        expiryDate: ''
      });
    } catch (err) {
      console.error("Failed to add inventory item:", err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteDoc(doc(db, 'inventory', id));
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  const handleUpdateQuantity = async (id: string, newQuantity: number) => {
    try {
      await updateDoc(doc(db, 'inventory', id), { quantity: newQuantity });
    } catch (err) {
      console.error("Failed to update quantity:", err);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = items.filter(item => item.quantity <= item.minThreshold);

  return (
    <div className="space-y-8 animate-in fade-in duration-500" dir={dir}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className={cn(
              "p-2 rounded-xl border transition-all cursor-pointer",
              theme === 'dark' ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className={cn("text-2xl font-bold tracking-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>{t('inventory')}</h2>
            <p className={cn("text-sm", theme === 'dark' ? "text-white/40" : "text-slate-500")}>{t('inventoryManagerTitle')}</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          {t('logNewItem')}
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={cn(
          "p-6 border rounded-[32px]",
          theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-white border-slate-200 shadow-sm"
        )}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <span className={cn("text-sm font-bold uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>{t('totalItems')}</span>
          </div>
          <p className={cn("text-3xl font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>{items.length}</p>
        </div>

        <div className={cn(
          "p-6 border rounded-[32px]",
          theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-white border-slate-200 shadow-sm"
        )}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <span className={cn("text-sm font-bold uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>{t('lowStock')}</span>
          </div>
          <p className={cn("text-3xl font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>{lowStockItems.length}</p>
        </div>

        <div className={cn(
          "p-6 border rounded-[32px]",
          theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-white border-slate-200 shadow-sm"
        )}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-purple-500" />
            </div>
            <span className={cn("text-sm font-bold uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>{t('reorderAlerts')}</span>
          </div>
          <p className={cn("text-3xl font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>{lowStockItems.length > 0 ? "Active" : "None"}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5", theme === 'dark' ? "text-white/20" : "text-slate-400")} />
          <input 
            type="text"
            placeholder={t('searchInventoryPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-12 pr-4 py-4 border rounded-2xl transition-all outline-none",
              theme === 'dark' ? "bg-[#0f0f0f] border-white/10 text-white focus:border-emerald-500/50" : "bg-white border-slate-200 text-slate-900 focus:border-emerald-500/50"
            )}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'reagent', 'disposable', 'equipment'].map(cat => (
            <button 
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all cursor-pointer",
                filterCategory === cat 
                  ? "bg-emerald-500 border-emerald-500 text-white" 
                  : (theme === 'dark' ? "bg-white/5 border-white/10 text-white/40 hover:text-white" : "bg-white border-slate-200 text-slate-400 hover:text-slate-900")
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className={cn(
        "border rounded-[32px] overflow-hidden",
        theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-white border-slate-200 shadow-sm"
      )}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={cn("text-[10px] font-bold uppercase tracking-widest border-b", theme === 'dark' ? "text-white/20 border-white/5" : "text-slate-400 border-slate-100")}>
                <th className="px-6 py-4">{t('itemName')}</th>
                <th className="px-6 py-4">{t('category')}</th>
                <th className="px-6 py-4">{t('quantity')}</th>
                <th className="px-6 py-4">{t('threshold')}</th>
                <th className="px-6 py-4">{t('expiry')}</th>
                <th className="px-6 py-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredItems.map((item) => (
                <tr key={item.id} className={cn("border-b last:border-0 transition-colors", theme === 'dark' ? "border-white/5 hover:bg-white/5" : "border-slate-50 hover:bg-slate-50")}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        item.quantity <= item.minThreshold ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                      )} />
                      <span className={cn("font-semibold", theme === 'dark' ? "text-white" : "text-slate-900")}>{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest",
                      theme === 'dark' ? "bg-white/5 text-white/40" : "bg-slate-100 text-slate-500"
                    )}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                        className={cn("w-6 h-6 rounded-lg border flex items-center justify-center transition-colors cursor-pointer", theme === 'dark' ? "border-white/10 hover:bg-white/10 text-white" : "border-slate-200 hover:bg-slate-100 text-slate-900")}
                      >
                        -
                      </button>
                      <span className={cn("font-mono w-12 text-center", theme === 'dark' ? "text-white" : "text-slate-900")}>
                        {item.quantity} {item.unit}
                      </span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className={cn("w-6 h-6 rounded-lg border flex items-center justify-center transition-colors cursor-pointer", theme === 'dark' ? "border-white/10 hover:bg-white/10 text-white" : "border-slate-200 hover:bg-slate-100 text-slate-900")}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className={cn("px-6 py-4 font-mono", theme === 'dark' ? "text-white/40" : "text-slate-400")}>
                    {item.minThreshold} {item.unit}
                  </td>
                  <td className={cn("px-6 py-4", theme === 'dark' ? "text-white/40" : "text-slate-400")}>
                    {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-white/20 italic">{t('noItemsMatchingFilter')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "relative w-full max-w-lg border rounded-[32px] p-8 shadow-2xl",
                theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-white border-slate-200"
              )}
            >
              <h3 className={cn("text-xl font-bold mb-6", theme === 'dark' ? "text-white" : "text-slate-900")}>{t('logNewItem')}</h3>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="space-y-2">
                  <label className={cn("text-[10px] font-bold uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>{t('itemName')}</label>
                  <input 
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={cn(
                      "w-full px-4 py-3 border rounded-xl outline-none transition-all",
                      theme === 'dark' ? "bg-white/5 border-white/10 text-white focus:border-emerald-500/50" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500/50"
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={cn("text-[10px] font-bold uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>{t('category')}</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                      className={cn(
                        "w-full px-4 py-3 border rounded-xl outline-none transition-all",
                        theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      )}
                    >
                      <option value="reagent">{t('reagentOption')}</option>
                      <option value="disposable">{t('disposableOption')}</option>
                      <option value="equipment">{t('equipmentOption')}</option>
                      <option value="other">{t('otherOption')}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className={cn("text-[10px] font-bold uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>{t('unit')}</label>
                    <input 
                      required
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      placeholder={t('unitPlaceholder')}
                      className={cn(
                        "w-full px-4 py-3 border rounded-xl outline-none transition-all",
                        theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={cn("text-[10px] font-bold uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>{t('quantity')}</label>
                    <input 
                      required
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                      className={cn(
                        "w-full px-4 py-3 border rounded-xl outline-none transition-all",
                        theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={cn("text-[10px] font-bold uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>{t('minThresholdLabel')}</label>
                    <input 
                      required
                      type="number"
                      value={formData.minThreshold}
                      onChange={(e) => setFormData({...formData, minThreshold: Number(e.target.value)})}
                      className={cn(
                        "w-full px-4 py-3 border rounded-xl outline-none transition-all",
                        theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      )}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={cn("text-[10px] font-bold uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>{t('expiryDate')}</label>
                  <input 
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                    className={cn(
                      "w-full px-4 py-3 border rounded-xl outline-none transition-all",
                      theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    )}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className={cn(
                      "flex-1 py-4 font-bold rounded-2xl transition-all cursor-pointer",
                      theme === 'dark' ? "bg-white/5 text-white hover:bg-white/10" : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                    )}
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    {t('logItemButton')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
