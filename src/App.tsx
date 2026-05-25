import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Menu, 
  X, 
  ChevronRight, 
  Check, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus,
  LayoutDashboard,
  LogOut,
  LogIn,
  Settings,
  Package,
  Users,
  ClipboardList
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import { db, auth } from './firebase';
import { Product, Order, OrderItem, Customer, Category } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { seedProducts } from './seed';

// --- Types & Constants ---
type View = 'store' | 'admin';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo, null, 2));
  // Do not throw to prevent white screen crashes
}

// --- Components ---

export default function App() {
  const [view, setView] = useState<View>('store');
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả sản phẩm');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Simple admin check
        const adminEmails = ["nguyen.thai.son@abusys.co.jp", "thaison.nguyen.dev@gmail.com"];
        if (u.email && adminEmails.includes(u.email)) {
          setIsAdmin(true);
        } else {
          try {
            const adminDoc = await getDocs(query(collection(db, 'admins'), where('email', '==', u.email)));
            setIsAdmin(!adminDoc.empty);
          } catch (e) {
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
      }
    });
    return unsub;
  }, []);

  // Sync Products & Categories
  useEffect(() => {
    const qProds = query(collection(db, 'products'), orderBy('name'));
    const unsubProds = onSnapshot(qProds, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
      setIsLoading(false);
    }, (error) => {
      setIsLoading(false);
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    const qCats = query(collection(db, 'categories'), orderBy('name'));
    const unsubCats = onSnapshot(qCats, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(cats);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'categories');
    });

    return () => {
      unsubProds();
      unsubCats();
    };
  }, []);

  // Connection Test
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  }, []);

  const login = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  const logout = () => {
    signOut(auth);
    setView('store');
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Tất cả sản phẩm' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100 bg-brand-primary text-white">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-brand-primary font-bold text-xs underline">ĐL</span>
          </div>
          <span className="font-bold tracking-tight text-lg">Cửa hàng Độ Lành</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Danh mục</div>
          <button 
            onClick={() => {
              setSelectedCategory('Tất cả sản phẩm');
              setView('store');
            }}
            className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedCategory === 'Tất cả sản phẩm' && view === 'store'
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tất cả sản phẩm
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.name);
                setView('store');
              }}
              className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedCategory === cat.name && view === 'store'
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.name}
            </button>
          ))}

          {isAdmin && (
            <>
              <div className="mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Quản trị</div>
              <button 
                onClick={() => setView('admin')}
                className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors mb-2 ${
                  view === 'admin'
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Trang quản trị</span>
                </div>
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2 py-1">
                <img src={user.photoURL || ''} className="w-6 h-6 rounded-full" alt="" />
                <span className="text-xs font-medium text-slate-600 truncate">{user.displayName}</span>
              </div>
              <button 
                onClick={logout}
                className="w-full py-2 bg-slate-100 text-slate-700 rounded-md text-xs font-bold border border-slate-200 flex items-center justify-center gap-2"
              >
                <LogOut className="w-3 h-3" /> Đăng xuất
              </button>
            </div>
          ) : (
            <button 
              onClick={login}
              className="w-full py-2 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold border border-indigo-200 flex items-center justify-center gap-2"
            >
              <LogIn className="w-3 h-3" /> Đăng nhập Admin
            </button>
          )}
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm shrink-0">
          <div className="relative w-full max-w-md hidden sm:block">
            <input 
              type="text" 
              placeholder="Tìm kiếm sản phẩm Nhật..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          </div>
          
          <div className="flex items-center gap-4 ml-auto">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                    {cart.reduce((a, b) => a + b.quantity, 0)}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold hidden sm:inline">Giỏ hàng</span>
            </button>
            
            <button 
              onClick={() => {
                if (cart.length > 0) setIsOrderModalOpen(true);
                else setIsCartOpen(true);
              }}
              className="bg-brand-secondary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-red-100 hover:bg-red-700 active:scale-95 transition-all"
            >
              Đặt hàng ngay
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
          {view === 'store' ? (
            <StoreView 
              products={filteredProducts} 
              onAddToCart={addToCart} 
              isLoading={isLoading}
              category={selectedCategory}
            />
          ) : (
            <AdminPanel isAdmin={isAdmin} user={user} categories={categories} />
          )}
        </div>

        {/* Footer */}
        <footer className="h-10 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-[10px] text-slate-400 font-medium shrink-0">
          <div>© 2026 Cửa hàng Độ Lành - Hệ thống đặt hàng nội địa Nhật uy tín</div>
          <div className="flex gap-4">
            <span>Hotline: 090-548-9967</span>
            <span className="hidden sm:inline">Địa chỉ: Hachioji, Tokyo / Đức Phổ, Quảng Ngãi</span>
          </div>
        </footer>

        {/* Cart Drawer Overlay */}
        <AnimatePresence>
          {isCartOpen && (
            <CartDrawer 
              cart={cart} 
              onClose={() => setIsCartOpen(false)} 
              onUpdateQuantity={updateCartQuantity}
              onCheckout={() => {
                setIsCartOpen(false);
                setIsOrderModalOpen(true);
              }}
              total={cartTotal}
            />
          )}
        </AnimatePresence>

        {/* Order Modal */}
        <AnimatePresence>
          {isOrderModalOpen && (
            <OrderModal 
              cart={cart}
              total={cartTotal}
              onClose={() => setIsOrderModalOpen(false)}
              onSuccess={() => {
                setCart([]);
                setIsOrderModalOpen(false);
              }}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Floating Zalo Button */}
      <a 
        href="https://zalo.me/0905489967" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors hover:scale-105 active:scale-95 group"
        title="Liên hệ Zalo"
      >
        {/* Simple SVG Zalo-like chat bubble */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="absolute right-14 bg-white text-blue-600 px-3 py-1 rounded-md text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
          Zalo: 090-548-9967
        </span>
      </a>
    </div>
  );
}

// --- Sub-components ---

function StoreView({ 
  products, 
  onAddToCart, 
  isLoading,
  category
}: { 
  products: Product[], 
  onAddToCart: (p: Product) => void,
  isLoading: boolean,
  category: string
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="bg-white rounded-xl h-80 animate-pulse border border-slate-100"></div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{category}</h2>
        <span className="text-slate-500 text-xs">Hiển thị {products.length} sản phẩm</span>
      </div>
      
      {products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800">Không tìm thấy sản phẩm</h3>
          <p className="text-slate-500 text-sm mt-1">Vui lòng thử lại với từ khóa hoặc danh mục khác.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} onAddToCart={() => onAddToCart(product)} />
          ))}
        </div>
      )}
    </>
  );
}

function ProductCard({ product, onAddToCart }: { product: Product, onAddToCart: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group flex flex-col h-full"
    >
      <div className="h-48 bg-slate-50 flex items-center justify-center relative overflow-hidden shrink-0 group/img cursor-pointer">
        {product.hot && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded z-20">HOT</span>
        )}
        <img 
          src={product.imageUrl || 'https://via.placeholder.com/300x300?text=Cửa+hàng+Độ+Lành'} 
          alt={product.name}
          className="w-full h-full object-contain p-4 group-hover/img:scale-105 transition-transform duration-300"
        />
        {/* Description Overlay */}
        <div className="absolute inset-0 bg-indigo-900/95 p-4 flex flex-col justify-center opacity-0 group-hover/img:opacity-100 transition-all duration-300 translate-y-4 group-hover/img:translate-y-0 z-10 w-full h-full custom-scrollbar overflow-y-auto">
          <h4 className="text-white text-xs font-bold mb-2 uppercase border-b border-indigo-700 pb-2">Mô tả sản phẩm</h4>
          <p className="text-indigo-100 text-xs leading-relaxed whitespace-pre-wrap">{product.description || 'Đang cập nhật mô tả.'}</p>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] text-indigo-600 font-bold uppercase mb-1">{product.category}</p>
        <h3 className="text-sm font-bold text-slate-800 mb-2 line-clamp-2 min-h-[40px]">{product.name}</h3>
        <p className="text-lg font-bold text-red-600 mt-auto">~{product.price.toLocaleString('vi-VN')}đ</p>
        <button 
          onClick={onAddToCart}
          className="w-full mt-4 py-2 border-2 border-indigo-600 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-600 hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-3 h-3" /> THÊM GIỎ HÀNG
        </button>
      </div>
    </motion.div>
  );
}

function CartDrawer({ 
  cart, 
  onClose, 
  onUpdateQuantity,
  onCheckout,
  total
}: { 
  cart: {product: Product, quantity: number}[], 
  onClose: () => void,
  onUpdateQuantity: (id: string, d: number) => void,
  onCheckout: () => void,
  total: number
}) {
  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={onClose} />
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-brand-primary text-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="font-bold">Giỏ hàng của bạn</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingBag className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">Giỏ hàng đang trống</p>
              <button 
                onClick={onClose}
                className="mt-4 text-indigo-600 text-xs font-bold uppercase tracking-wider hover:underline"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.product.id} className="flex gap-4 p-3 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-right-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-lg shrink-0 flex items-center justify-center overflow-hidden">
                    <img src={item.product.imageUrl} className="w-full h-full object-contain p-1" alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{item.product.name}</h4>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">{item.product.price.toLocaleString('vi-VN')}đ</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-slate-200 rounded-md">
                        <button onClick={() => onUpdateQuantity(item.product.id!, -1)} className="p-1 hover:bg-slate-50"><Minus className="w-3 h-3" /></button>
                        <span className="text-[10px] font-bold w-6 text-center">{item.quantity}</span>
                        <button onClick={() => onUpdateQuantity(item.product.id!, 1)} className="p-1 hover:bg-slate-50"><Plus className="w-3 h-3" /></button>
                      </div>
                      <button onClick={() => onUpdateQuantity(item.product.id!, -item.quantity)} className="p-1 text-slate-400 hover:text-red-600">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-100 space-y-4 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Tổng dự kiến:</span>
              <span className="text-xl font-bold text-red-600">{total.toLocaleString('vi-VN')}đ</span>
            </div>
            <button 
              onClick={onCheckout}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 active:scale-95 transition-all text-sm uppercase tracking-wider"
            >
              Tiến hành đặt hàng
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}

function OrderModal({ 
  cart, 
  total, 
  onClose, 
  onSuccess 
}: { 
  cart: {product: Product, quantity: number}[], 
  total: number, 
  onClose: () => void,
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    note: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const order: Partial<Order> = {
        customerName: formData.name,
        customerPhone: formData.phone,
        customerAddress: formData.address,
        items: cart.map(item => ({
          productId: item.product.id!,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price
        })),
        totalPrice: total,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'orders'), order);
      
      // Also add/update customer info
      const customer: Partial<Customer> = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address
      };
      // Simple lookup/add
      const cQuery = query(collection(db, 'customers'), where('phone', '==', formData.phone));
      const cSnap = await getDocs(cQuery);
      if (cSnap.empty) {
        await addDoc(collection(db, 'customers'), customer);
      }

      onSuccess();
      alert('Đặt hàng thành công! Chúng tôi sẽ liên hệ với bạn qua số điện thoại để xác nhận.');
    } catch (err: any) {
      console.error(err);
      alert('Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[60]">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-[70] overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 bg-brand-primary text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">Xác nhận đơn hàng</h3>
            <p className="text-indigo-200 text-xs mt-1">Thông tin nhận hàng và thanh toán (vận chuyển)</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Họ tên *</label>
              <input 
                required
                type="text" 
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Số điện thoại *</label>
              <input 
                required
                type="tel" 
                placeholder="09xx xxx xxx"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Địa chỉ nhận hàng *</label>
            <input 
              required
              type="text" 
              placeholder="Số nhà, đường, phường/xã..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Ghi chú thêm</label>
            <textarea 
              placeholder="Giao giờ hành chính, gọi trước khi đến..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none h-24"
              value={formData.note}
              onChange={e => setFormData({...formData, note: e.target.value})}
            />
          </div>

          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3 px-1">Sản phẩm trong giỏ</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {cart.map(item => (
                <div key={item.product.id} className="flex justify-between text-xs text-slate-600">
                  <span>{item.product.name} (x{item.quantity})</span>
                  <span className="font-bold">{(item.product.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-800">Tổng cộng:</span>
              <span className="text-2xl font-bold text-red-600">{total.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:bg-red-400"
          >
            {loading ? 'ĐANG XỬ LÝ...' : 'HOÀN TẤT ĐẶT HÀNG'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// --- Admin Panel Component ---

function AdminPanel({ isAdmin, user, categories }: { isAdmin: boolean; user: User | null; categories: Category[] }) {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'customers' | 'categories'>('categories');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin || !user) return;
    const unsubProds = onSnapshot(query(collection(db, 'products'), orderBy('name')), snap => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    }, error => handleFirestoreError(error, OperationType.GET, 'products'));
    
    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    }, error => handleFirestoreError(error, OperationType.GET, 'orders'));
    
    const unsubCustomers = onSnapshot(query(collection(db, 'customers'), orderBy('name')), snap => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
    }, error => handleFirestoreError(error, OperationType.GET, 'customers'));
    
    return () => { unsubProds(); unsubOrders(); unsubCustomers(); };
  }, [isAdmin, user]);

  if (!isAdmin) {
    return (
      <div className="h-full flex items-center justify-center p-12 text-center">
        <div className="max-w-sm">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Quyền truy cập bị từ chối</h2>
          <p className="text-slate-500 mb-6">Bạn cần đăng nhập với tài khoản quản trị để xem nội dung này.</p>
        </div>
      </div>
    );
  }

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Xác nhận xóa sản phẩm này?')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    await updateDoc(doc(db, 'orders', orderId), { status });
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Xác nhận xóa danh mục này? Các sản phẩm thuộc danh mục này sẽ hiển thị ở "Tất cả sản phẩm" nếu bạn không đổi danh mục cho chúng.')) {
      await deleteDoc(doc(db, 'categories', id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          {[
            { id: 'categories', label: 'Danh mục', icon: ClipboardList },
            { id: 'products', label: 'Kho hàng', icon: Package },
            { id: 'orders', label: 'Đơn hàng', icon: ClipboardList },
            { id: 'customers', label: 'Khách hàng', icon: Users }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'products' && (
          <div className="flex gap-2">
            <button 
              onClick={() => {
                if (window.confirm('Hệ thống sẽ thêm vào danh sách các sản phẩm mẫu chưa có. Bạn có chắc chắn không?')) {
                  seedProducts().then(() => alert('Đã thêm sản phẩm mẫu.'));
                }
              }}
              className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold border border-emerald-200 hover:bg-emerald-100"
            >
              + Thêm dữ liệu mẫu
            </button>
            <button 
              onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold border border-indigo-200 hover:bg-indigo-100"
            >
              + Thêm sản phẩm
            </button>
          </div>
        )}
        {activeTab === 'categories' && (
          <button 
            onClick={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold border border-indigo-200 hover:bg-indigo-100"
          >
            + Thêm danh mục
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {activeTab === 'categories' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Tên danh mục</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{cat.name}</div>
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                       <button 
                        onClick={() => { setEditingCategory(cat); setIsCategoryModalOpen(true); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(cat.id!)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Sản phẩm</th>
                  <th className="px-6 py-4 text-right">Tổng cộng</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{order.customerName}</div>
                      <div className="text-[11px] text-slate-500">{order.customerPhone}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-1 italic">{order.customerAddress}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex gap-1">
                            <span className="font-bold text-indigo-600 min-w-[20px]">{item.quantity}x</span>
                            <span className="truncate max-w-[200px]">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">
                      {order.totalPrice.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {order.status === 'pending' ? 'Chờ duyệt' :
                         order.status === 'approved' ? 'Đã duyệt' :
                         order.status === 'completed' ? 'Đã xong' : 'Đã hủy'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select 
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id!, e.target.value as any)}
                        className="text-[10px] font-bold bg-white border border-slate-200 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="pending">Chờ duyệt</option>
                        <option value="approved">Duyệt</option>
                        <option value="completed">Xong</option>
                        <option value="cancelled">Hủy</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Tên sản phẩm</th>
                  <th className="px-6 py-4">Danh mục</th>
                  <th className="px-6 py-4 text-right">Giá dự kiến</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(prod => (
                  <tr key={prod.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={prod.imageUrl} className="w-8 h-8 rounded shrink-0 object-contain bg-slate-50 border border-slate-100" alt="" />
                        <div className="font-bold text-slate-800 line-clamp-1">{prod.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-indigo-600 font-medium">{prod.category}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">{prod.price.toLocaleString('vi-VN')}đ</td>
                    <td className="px-6 py-4 text-center space-x-2">
                       <button 
                        onClick={() => { setEditingProduct(prod); setIsProductModalOpen(true); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(prod.id!)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Họ tên</th>
                  <th className="px-6 py-4">Điện thoại</th>
                  <th className="px-6 py-4">Địa chỉ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map(customer => (
                  <tr key={customer.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-800">{customer.name}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{customer.phone}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 italic">{customer.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isProductModalOpen && (
          <ProductModal 
            product={editingProduct} 
            categories={categories}
            onClose={() => setIsProductModalOpen(false)} 
          />
        )}
        {isCategoryModalOpen && (
          <CategoryModal 
            category={editingCategory}
            onClose={() => setIsCategoryModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CategoryModal({ category, onClose }: { category: Category | null, onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<Category>>(category || {
    name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (category?.id) {
        await updateDoc(doc(db, 'categories', category.id), form);
      } else {
        await addDoc(collection(db, 'categories'), form);
      }
      onClose();
    } catch (err) { alert('Có lỗi xảy ra'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[80]">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-[90] space-y-4"
      >
        <h3 className="text-xl font-bold text-slate-800">{category ? 'Cập nhật danh mục' : 'Thêm danh mục'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Tên danh mục</label>
            <input 
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm">Hủy</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-indigo-100">
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ProductModal({ product, categories, onClose }: { product: Product | null, categories: Category[], onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<Product>>(product || {
    name: '',
    category: categories[0]?.name || 'Chưa phân loại',
    price: 0,
    description: '',
    imageUrl: '',
    hot: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (product?.id) {
        await updateDoc(doc(db, 'products', product.id), form);
      } else {
        await addDoc(collection(db, 'products'), form);
      }
      onClose();
    } catch (err) { alert('Có lỗi xảy ra'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[80]">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md z-[90] space-y-4"
      >
        <h3 className="text-xl font-bold text-slate-800">{product ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Tên sản phẩm</label>
            <input 
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Danh mục</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value})}
              >
                {categories.length === 0 && <option value="Chưa phân loại">Chưa phân loại</option>}
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Giá (đ)</label>
              <input 
                required
                type="number"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                value={form.price}
                onChange={e => setForm({...form, price: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">URL Hình ảnh</label>
            <input 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              value={form.imageUrl}
              onChange={e => setForm({...form, imageUrl: e.target.value})}
              placeholder="https://..."
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox"
              checked={form.hot}
              onChange={e => setForm({...form, hot: e.target.checked})}
              className="rounded text-indigo-600"
            />
            <span className="text-sm font-bold text-slate-600">Sản phẩm Nổi bật (HOT)</span>
          </label>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm">Hủy</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-indigo-100">
              {loading ? 'Đang lưu...' : 'Lưu sản phẩm'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
