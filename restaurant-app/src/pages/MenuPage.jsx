import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { Plus, Trash2, Pencil, Check, X, Loader2, UtensilsCrossed, ImagePlus, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateRestaurant } from '../services/api';

const CATEGORIES = ['Burgers', 'Pizza', 'Indian', 'Healthy', 'Sushi', 'Desserts', 'Mexican', 'Sides', 'Drinks', 'Other'];

// Category → default Unsplash image
const CATEGORY_IMAGES = {
  Burgers:  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop',
  Pizza:    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=200&fit=crop',
  Indian:   'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop',
  Healthy:  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop',
  Sushi:    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300&h=200&fit=crop',
  Desserts: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=200&fit=crop',
  Mexican:  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&h=200&fit=crop',
  Sides:    'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&h=200&fit=crop',
  Drinks:   'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=200&fit=crop',
  Other:    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop',
};

const empty = () => ({ name: '', description: '', price: '', category: 'Other', isVeg: false, isPopular: false, imageUrl: '' });

// Convert file to base64 data URL
const fileToDataUrl = (file) => new Promise((res, rej) => {
  const reader = new FileReader();
  reader.onload = () => res(reader.result);
  reader.onerror = rej;
  reader.readAsDataURL(file);
});

export default function MenuPage() {
  const { user, setSession } = useAuth();
  const [menu, setMenu] = useState(user?.menu ?? []);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [form, setForm] = useState(empty());
  const [formError, setFormError] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  // Restaurant cover image
  const [coverSaving, setCoverSaving] = useState(false);
  const [coverPreview, setCoverPreview] = useState(user?.image ?? '');
  const coverRef = useRef();
  const itemImgRef = useRef();

  useEffect(() => { setMenu(user?.menu ?? []); }, [user]);

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [k]: val }));
    if (k === 'imageUrl') setImagePreview(e.target.value);
    if (k === 'category' && !form.imageUrl) setImagePreview(CATEGORY_IMAGES[e.target.value] ?? CATEGORY_IMAGES.Other);
  };

  const handleItemImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setForm(f => ({ ...f, imageUrl: dataUrl }));
    setImagePreview(dataUrl);
  };

  const openAdd = () => {
    setForm(empty());
    setImagePreview(CATEGORY_IMAGES.Other);
    setEditIdx(null); setFormError(''); setShowForm(true);
  };

  const openEdit = (idx) => {
    const item = menu[idx];
    setForm({ ...item, price: String(item.price), imageUrl: item.image ?? '' });
    setImagePreview(item.image ?? CATEGORY_IMAGES[item.category] ?? CATEGORY_IMAGES.Other);
    setEditIdx(idx); setFormError(''); setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditIdx(null); setForm(empty()); setImagePreview(''); };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Item name is required'); return; }
    const price = parseFloat(form.price);
    if (!form.price || isNaN(price) || price <= 0) { setFormError('Enter a valid price'); return; }
    setFormError('');

    const image = form.imageUrl || CATEGORY_IMAGES[form.category] || CATEGORY_IMAGES.Other;
    const item = {
      id: editIdx !== null ? menu[editIdx].id : Date.now(),
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      category: form.category,
      isVeg: form.isVeg,
      isPopular: form.isPopular,
      image,
    };

    const updated = editIdx !== null
      ? menu.map((m, i) => i === editIdx ? item : m)
      : [...menu, item];

    await saveMenu(updated);
    closeForm();
  };

  const handleDelete = async (idx) => {
    if (!confirm('Remove this item?')) return;
    await saveMenu(menu.filter((_, i) => i !== idx));
  };

  const saveMenu = async (newMenu) => {
    setSaving(true);
    try {
      await updateRestaurant(user.restaurantId, { menu: newMenu });
      setMenu(newMenu);
      setSession({ ...user, menu: newMenu }, localStorage.getItem('sq_token'));
      toast.success('Menu saved');
    } catch (err) {
      toast.error(err.message ?? 'Failed to save');
    } finally { setSaving(false); }
  };

  // Save restaurant cover image
  const handleCoverFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setCoverPreview(dataUrl);
    await saveCover(dataUrl);
  };

  const saveCover = async (imageUrl) => {
    setCoverSaving(true);
    try {
      await updateRestaurant(user.restaurantId, { image: imageUrl });
      setSession({ ...user, image: imageUrl }, localStorage.getItem('sq_token'));
      toast.success('Restaurant image updated');
    } catch (err) {
      toast.error(err.message ?? 'Failed to save image');
    } finally { setCoverSaving(false); }
  };

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = menu.filter(m => m.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Restaurant Cover Image */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mb-8 flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <div className="w-24 h-20 rounded-xl overflow-hidden bg-[var(--muted)] flex items-center justify-center">
            {coverPreview
              ? <img src={coverPreview} alt="Restaurant" className="w-full h-full object-cover" />
              : <Store size={28} className="text-[var(--muted-foreground)] opacity-40" />
            }
          </div>
          {coverSaving && (
            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
              <Loader2 size={16} className="animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold">{user?.name}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{user?.location}</p>
          <button onClick={() => coverRef.current?.click()}
            className="mt-2 flex items-center gap-1.5 text-xs text-[var(--primary)] hover:underline font-medium">
            <ImagePlus size={13} /> {coverPreview ? 'Change restaurant image' : 'Add restaurant image'}
          </button>
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverFile} />
        </div>
      </div>

      {/* Menu Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Menu</h1>
          <p className="text-[var(--muted-foreground)] text-sm mt-0.5">
            {menu.length} item{menu.length !== 1 ? 's' : ''} · updates reflect instantly in customer app
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-xl font-medium hover:opacity-90 transition-all text-sm">
          <Plus size={15} /> Add Item
        </button>
      </div>

      {/* Empty state */}
      {menu.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center border-2 border-dashed border-[var(--border)] rounded-2xl">
          <UtensilsCrossed size={44} className="text-[var(--muted-foreground)] opacity-30" />
          <div>
            <p className="font-semibold">No menu items yet</p>
            <p className="text-[var(--muted-foreground)] text-sm mt-1">Add your first item to start taking orders</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl font-medium hover:opacity-90 text-sm">
            <Plus size={14} /> Add First Item
          </button>
        </div>
      )}

      {/* Menu grouped by category */}
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-3 px-1">{cat}</h2>
          <div className="space-y-2">
            {items.map(item => {
              const idx = menu.indexOf(item);
              return (
                <div key={item.id} className="flex items-center gap-4 bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="w-16 h-14 rounded-xl overflow-hidden bg-[var(--muted)] flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover"
                      onError={e => { e.target.src = CATEGORY_IMAGES[item.category] ?? CATEGORY_IMAGES.Other; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{item.name}</span>
                      {item.isVeg && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Veg</span>}
                      {item.isPopular && <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">Bestseller</span>}
                    </div>
                    {item.description && <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">{item.description}</p>}
                  </div>
                  <span className="font-bold text-[var(--primary)] text-sm flex-shrink-0">₹{item.price}</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(idx)} className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(idx)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-[var(--muted-foreground)] hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <h3 className="font-semibold text-lg">{editIdx !== null ? 'Edit Item' : 'Add Menu Item'}</h3>
              <button onClick={closeForm} className="p-1 rounded-lg hover:bg-[var(--muted)] transition-colors"><X size={18} /></button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Image preview + upload */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Item Image</label>
                <div className="flex gap-3 items-start">
                  <div className="w-20 h-16 rounded-xl overflow-hidden bg-[var(--muted)] flex-shrink-0 border border-[var(--border)]">
                    {imagePreview
                      ? <img src={imagePreview} alt="preview" className="w-full h-full object-cover" onError={e => e.target.src = CATEGORY_IMAGES.Other} />
                      : <ImagePlus size={20} className="m-auto mt-4 text-[var(--muted-foreground)] opacity-40" />
                    }
                  </div>
                  <div className="flex-1 space-y-2">
                    <input type="text" value={form.imageUrl} onChange={set('imageUrl')} placeholder="Paste image URL..."
                      className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
                    <button type="button" onClick={() => itemImgRef.current?.click()}
                      className="flex items-center gap-1.5 text-xs text-[var(--primary)] hover:underline font-medium">
                      <ImagePlus size={12} /> Upload from device
                    </button>
                    <input ref={itemImgRef} type="file" accept="image/*" className="hidden" onChange={handleItemImageFile} />
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Item Name *</label>
                <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Classic Cheeseburger"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea value={form.description} onChange={set('description')} placeholder="Short description..." rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none" />
              </div>

              {/* Price + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Price (₹) *</label>
                  <input type="number" value={form.price} onChange={set('price')} placeholder="199" min="1"
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Category</label>
                  <select value={form.category} onChange={set('category')}
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={form.isVeg} onChange={set('isVeg')} className="w-4 h-4 accent-green-600" />
                  Vegetarian
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={form.isPopular} onChange={set('isPopular')} className="w-4 h-4 accent-orange-500" />
                  Bestseller
                </label>
              </div>

              {formError && <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{formError}</p>}
            </div>

            <div className="flex gap-3 p-5 border-t border-[var(--border)]">
              <button onClick={closeForm} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)] transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
                {saving ? <><Loader2 size={15} className="animate-spin" />Saving...</> : <><Check size={15} />{editIdx !== null ? 'Save Changes' : 'Add Item'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
