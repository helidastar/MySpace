/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Barcode, TrendingUp, TrendingDown, Bell, Plus, Trash2, 
  Package, HelpCircle, Check, CheckSquare, Volume2, VolumeX, 
  RefreshCw, Sliders, Tag, Heart, Info, X, Clock, Coffee, 
  ShoppingBag, Send, ChevronRight, User, AlertCircle, ShoppingCart, CupSoda, Cookie
} from 'lucide-react';
import { TrackedProduct, AlertLog, CafeItemTrend, KioskOrder } from './types.js';

// Cute synthesizer helper using Web Audio API to create cute sounds on user actions
const playSynthSound = (type: 'beep' | 'squeak' | 'pop' | 'chime', volEnabled: boolean) => {
  if (!volEnabled) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === 'beep') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'squeak') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.frequency.setValueAtTime(900, ctx.currentTime);
      osc1.frequency.quadraticRampToValueAtTime(1600, ctx.currentTime + 0.12);
      osc2.frequency.setValueAtTime(1050, ctx.currentTime);
      osc2.frequency.quadraticRampToValueAtTime(1800, ctx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.18);
      osc2.stop(ctx.currentTime + 0.18);
    } else if (type === 'pop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'chime') {
      const frequencies = [523.25, 659.25, 783.99, 1046.50]; // Beautiful C major arpeggio chime
      frequencies.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.05);
        gain.gain.setValueAtTime(0.04, ctx.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.05);
        osc.stop(ctx.currentTime + idx * 0.05 + 0.3);
      });
    }
  } catch (e) {
    console.debug('Web audio context is waiting for click interactions', e);
  }
};

export default function App() {
  const [trends, setTrends] = useState<CafeItemTrend[]>([]);
  const [inventory, setInventory] = useState<TrackedProduct[]>([]);
  const [orders, setOrders] = useState<KioskOrder[]>([]);
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [selectedTrend, setSelectedTrend] = useState<CafeItemTrend | null>(null);

  // Filter systems
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Audio state
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Main view navigation state:
  // 'kiosk' = order screen
  // 'supervisor' = inventory product list
  // 'trends' = real time metrics charts
  // 'orders' = active brewing tickets queue list
  const [activeTab, setActiveTab] = useState<'kiosk' | 'supervisor' | 'trends' | 'orders'>('kiosk');
  
  // Shopping Cart state for the Kiosk
  const [cart, setCart] = useState<{ product: TrackedProduct; quantity: number }[]>([]);
  const [customerName, setCustomerName] = useState('');
  
  // Barcode Scanning Simulator
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedSkuInput, setScannedSkuInput] = useState('');
  const [scanningStatus, setScanningStatus] = useState<'idle' | 'searching' | 'found' | 'not-found'>('idle');
  const [scanResult, setScanResult] = useState<{
    found: boolean;
    product?: TrackedProduct;
    trend?: CafeItemTrend;
    suggested?: {
      name: string;
      ticker: string;
      sku: string;
      category: string;
      unitCost: number;
      price: number;
      notes: string;
    };
  } | null>(null);

  // Register New Menu Item Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdTicker, setNewProdTicker] = useState('MATCHA');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdQuantity, setNewProdQuantity] = useState('25');
  const [newProdUnitCost, setNewProdUnitCost] = useState('1.50');
  const [newProdPrice, setNewProdPrice] = useState('5.50');
  const [newProdCategory, setNewProdCategory] = useState('Coffee & Tea');
  const [newProdAlertType, setNewProdAlertType] = useState<'above' | 'below' | 'low-stock' | 'none'>('low-stock');
  const [newProdAlertThreshold, setNewProdAlertThreshold] = useState('10');
  const [newProdNotes, setNewProdNotes] = useState('');

  // AI Meadow Advisor (Coco & Momo)
  const [momoAdvice, setMomoAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // SVG chart interactives
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; value: number } | null>(null);
  const [prevAlertsLength, setPrevAlertsLength] = useState(0);

  // Initial Fetch & Active interval update loop
  useEffect(() => {
    fetchTrends();
    fetchInventory();
    fetchOrders();
    fetchAlerts();

    const interval = setInterval(() => {
      fetchTrendsSilently();
      fetchInventorySilently();
      fetchAlertsSilently();
      fetchOrdersSilently();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Sync chosen trend when elements fluctuation ticks
  useEffect(() => {
    if (trends.length > 0) {
      if (!selectedTrend) {
        setSelectedTrend(trends[0]);
      } else {
        const live = trends.find(t => t.ticker === selectedTrend.ticker);
        if (live) {
          setSelectedTrend(live);
        }
      }
    }
  }, [trends]);

  // Audio response trigger
  useEffect(() => {
    if (alerts.length > 0) {
      if (prevAlertsLength > 0 && alerts.length > prevAlertsLength) {
        // Find unread
        const hasUnread = alerts.some((a, i) => i < (alerts.length - prevAlertsLength) && !a.read);
        if (hasUnread) {
          playSynthSound('chime', soundEnabled);
        }
      }
      setPrevAlertsLength(alerts.length);
    }
  }, [alerts, prevAlertsLength, soundEnabled]);

  const fetchTrends = async () => {
    try {
      const res = await fetch('/api/menu-trends');
      const data = await res.json();
      setTrends(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTrendsSilently = async () => {
    try {
      const res = await fetch('/api/menu-trends');
      const data = await res.json();
      setTrends(data);
    } catch (e) {
      console.debug('silently refresh failed', e);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/menu-products');
      const data = await res.json();
      setInventory(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInventorySilently = async () => {
    try {
      const res = await fetch('/api/menu-products');
      const data = await res.json();
      setInventory(data);
    } catch (e) {}
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/kiosk-orders');
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrdersSilently = async () => {
    try {
      const res = await fetch('/api/kiosk-orders');
      const data = await res.json();
      setOrders(data);
    } catch (e) {}
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      setAlerts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAlertsSilently = async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      setAlerts(data);
    } catch (e) {}
  };

  // Simulating the Scanning logic through typing or preset buttons
  const triggerSimulationScan = async (skuCode: string) => {
    playSynthSound('beep', soundEnabled);
    setScannerOpen(true);
    setScannedSkuInput(skuCode);
    setScanningStatus('searching');
    setScanResult(null);

    setTimeout(async () => {
      try {
        const res = await fetch(`/api/scan/${skuCode}`);
        const data = await res.json();
        setScanResult(data);
        if (data.found) {
          setScanningStatus('found');
          playSynthSound('squeak', soundEnabled);
        } else {
          setScanningStatus('not-found');
          playSynthSound('pop', soundEnabled);
        }
      } catch (err) {
        setScanningStatus('idle');
      }
    }, 1200);
  };

  const handleScanFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedSkuInput.trim()) return;
    await triggerSimulationScan(scannedSkuInput.trim());
  };

  // Accepting procedurally recommended scanned items into real menu choices
  const handleAddNewScannedSuggest = async () => {
    if (!scanResult || !scanResult.suggested) return;
    const sug = scanResult.suggested;

    try {
      const res = await fetch('/api/menu-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sug.name,
          ticker: sug.ticker,
          sku: sug.sku,
          quantity: 25,
          unitCost: sug.unitCost,
          price: sug.price,
          category: sug.category,
          alertType: 'low-stock',
          alertThreshold: 10,
          notes: sug.notes
        })
      });

      if (res.ok) {
        const created = await res.json();
        setInventory(prev => [...prev, created]);
        setScannerOpen(false);
        setScanningStatus('idle');
        setScanResult(null);
        playSynthSound('chime', soundEnabled);
        fetchTrends();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add items straight to user tray cart
  const handleAddProductToCart = (prod: TrackedProduct) => {
    playSynthSound('pop', soundEnabled);
    setCart(prev => {
      const existing = prev.find(item => item.product.id === prod.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === prod.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product: prod, quantity: 1 }];
    });
  };

  const handleAdjustCartQuantity = (productId: string, delta: number) => {
    playSynthSound('pop', soundEnabled);
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    playSynthSound('pop', soundEnabled);
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Checkout order through kiosk cart! Pushes order, updates stock levels in real-time, alerts user if necessary
  const handleCheckoutCart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart.length) return;
    
    // Check stock boundaries locally
    let outOfStock = false;
    let outItemName = '';
    for (const cartItem of cart) {
      if (cartItem.product.quantity < cartItem.quantity) {
        outOfStock = true;
        outItemName = cartItem.product.name;
        break;
      }
    }

    if (outOfStock) {
      alert(`Oh look! We don't have enough prepared stock of "${outItemName}" left in the pantry to checkout that amount yet! Let's bake or brew more first. ☕`);
      return;
    }

    try {
      const res = await fetch('/api/kiosk-orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim() || 'Cozy Guest',
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity
          }))
        })
      });

      if (res.ok) {
        playSynthSound('chime', soundEnabled);
        setCart([]);
        setCustomerName('');
        setActiveTab('orders'); // Jump to brewing visual status queue
        fetchInventory();
        fetchOrders();
        fetchAlerts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Adjust portion quantity in stock supervisor
  const handleSupervisorQtyAdjust = async (id: string, delta: number) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);

    // Optimistically update
    setInventory(prev => prev.map(p => p.id === id ? { ...p, quantity: newQty } : p));
    playSynthSound('pop', soundEnabled);

    try {
      await fetch(`/api/menu-products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Adjust active kiosk price thresholds
  const handleSupervisorPriceUpdate = async (id: string, newPrice: number) => {
    setInventory(prev => prev.map(p => p.id === id ? { ...p, price: newPrice } : p));
    try {
      await fetch(`/api/menu-products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: newPrice })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAlertThresholdChange = async (id: string, newThresh: number) => {
    setInventory(prev => prev.map(p => p.id === id ? { ...p, alertThreshold: newThresh } : p));
    try {
      await fetch(`/api/menu-products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertThreshold: newThresh })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Delete product from cafe menu completely
  const handleDeleteProduct = async (id: string) => {
    playSynthSound('pop', soundEnabled);
    setInventory(prev => prev.filter(p => p.id !== id));
    try {
      await fetch(`/api/menu-products/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  };

  // Put custom item in inventory
  const handleRegisterNewProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdTicker.trim()) {
      alert('Cute message: Please fill in a Menu Name and Coffee code representation (e.g. MOCHI)! 🐹');
      return;
    }

    try {
      const res = await fetch('/api/menu-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProdName,
          ticker: newProdTicker.toUpperCase().trim(),
          sku: newProdSku || Math.floor(100000000000 + Math.random() * 900000000000).toString(),
          quantity: Number(newProdQuantity) || 20,
          unitCost: Number(newProdUnitCost) || 1.20,
          price: Number(newProdPrice) || 5.00,
          category: newProdCategory,
          alertType: newProdAlertType,
          alertThreshold: Number(newProdAlertThreshold) || 10,
          notes: newProdNotes || 'Crafted fresh with love!'
        })
      });

      if (res.ok) {
        const added = await res.json();
        setInventory(prev => [...prev, added]);
        setShowAddForm(false);
        // Clear forms
        setNewProdName('');
        setNewProdSku('');
        setNewProdNotes('');
        playSynthSound('chime', soundEnabled);
        fetchTrends();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Clear all cute reading alerts logs
  const handleClearAlerts = async () => {
    playSynthSound('pop', soundEnabled);
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    try {
      await fetch('/api/alerts/read', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger State change for orders (brewing -> ready -> enjoyed)
  const handleUpdateOrderStatus = async (id: string, nextStatus: 'brewing' | 'ready' | 'enjoyed') => {
    playSynthSound('pop', soundEnabled);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: nextStatus } : o));
    try {
      await fetch(`/api/kiosk-orders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Load cute hamster & bunny expert advisor report
  const handleAskMomoAdvisory = async () => {
    setLoadingAdvice(true);
    playSynthSound('squeak', soundEnabled);
    try {
      const res = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setMomoAdvice(data.analysis);
      playSynthSound('chime', soundEnabled);
    } catch (e) {
      setMomoAdvice(`<h3>*Squeak fall* 😿</h3><p>Momo slipped on vanilla sprinkle! Lets click the advise button again.</p>`);
    } finally {
      setLoadingAdvice(false);
    }
  };

  const categories = ['All', 'Coffee & Tea', 'Sweet Pastries', 'Desserts', 'Merchandise'];

  // Filter items in the kiosk view
  const filteredProducts = inventory.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || 
                        p.ticker.toLowerCase().includes(q) || 
                        p.sku.includes(q);
    if (categoryFilter === 'All') return matchSearch;
    return matchSearch && p.category === categoryFilter;
  });

  const activeOrdersCount = orders.filter(o => o.status !== 'enjoyed').length;
  const unreadAlertsCount = alerts.filter(a => !a.read).length;

  // Compute calculated values
  const totalCartPrice = cart.reduce((acc, c) => acc + (c.product.price * c.quantity), 0);

  return (
    <div className="min-h-screen bg-[#FFFBF7] text-[#4E3D30] font-sans antialiased pb-20 selection:bg-[#FCE7F3] selection:text-[#E11D48] custom-gradients">
      
      {/* Dynamic SURGE demand header ticker bar */}
      <div className="w-full bg-gradient-to-r from-[#FFDEE9] via-[#FCE7F3] to-[#C9FCF9] text-stone-700 text-xs py-2 shadow-sm font-bold border-b border-[#F9A8D4] overflow-hidden whitespace-nowrap">
        <div className="inline-block animate-[marquee_24s_linear_infinite] hover:[animation-play-state:paused] cursor-pointer">
          {trends.map((t, idx) => (
            <span 
              key={idx} 
              onClick={() => {
                setSelectedTrend(t);
                setActiveTab('trends');
                playSynthSound('pop', soundEnabled);
              }}
              className="inline-flex items-center mx-5 bg-white/70 hover:bg-white px-3 py-1 rounded-full text-[#4E3D30] shadow-xs tracking-wide transition-all border border-pink-100"
            >
              <span className="font-extrabold text-[#DB2777] mr-1.5">{t.ticker}</span>
              <span className="mr-2 text-stone-500 font-mono">${t.currentPrice.toFixed(2)}</span>
              {t.change >= 0 ? (
                <span className="text-emerald-500 font-semibold inline-flex items-center text-[10px]">
                  <Heart className="w-2.5 h-2.5 fill-emerald-400 text-emerald-500 inline mr-0.5 animate-pulse" /> 
                  +{t.changePercent}% Popular
                </span>
              ) : (
                <span className="text-rose-400 font-semibold inline-flex items-center text-[10px]">
                  💔 {t.changePercent}% Cool
                </span>
              )}
            </span>
          ))}
          {/* Duplicate loop so it loops endlessly */}
          {trends.map((t, idx) => (
            <span 
              key={`dup-${idx}`} 
              onClick={() => {
                setSelectedTrend(t);
                setActiveTab('trends');
                playSynthSound('pop', soundEnabled);
              }}
              className="inline-flex items-center mx-5 bg-white/70 hover:bg-white px-3 py-1 rounded-full text-[#4E3D30] shadow-xs tracking-wide transition-all border border-pink-100"
            >
              <span className="font-extrabold text-[#DB2777] mr-1.5">{t.ticker}</span>
              <span className="mr-2 text-stone-500 font-mono">${t.currentPrice.toFixed(2)}</span>
              {t.change >= 0 ? (
                <span className="text-emerald-500 font-semibold inline-flex items-center text-[10px]">
                  <Heart className="w-2.5 h-2.5 fill-emerald-400 text-emerald-500 inline mr-0.5 animate-pulse" /> 
                  +{t.changePercent}% Popular
                </span>
              ) : (
                <span className="text-rose-400 font-semibold inline-flex items-center text-[10px]">
                  💔 {t.changePercent}% Cool
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Main Grid View */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        
        {/* Adorable header design */}
        <header className="flex flex-col md:flex-row items-center justify-between bg-white border-4 border-[#FCE7F3] rounded-3xl p-6 mb-8 shadow-[0_8px_0_#FDF2F4] hover:shadow-[0_12px_0_#FDF2F4] transition-all">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="bg-[#FFF0F5] hover:rotate-12 transition-transform p-3 rounded-2xl border-2 border-[#FFE4E6] relative">
              <span className="text-4xl">🐰☕</span>
              <div className="absolute -top-1 -right-1 bg-pink-500 text-white p-0.5 rounded-full animate-bounce">
                <Heart className="w-4 h-4 fill-white text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#4E3D30] inline-flex items-center">
                Myspace Cafe menu kiosk & pantry
              </h1>
              <p className="text-sm text-pink-500 font-bold flex items-center">
                <span>Cozy Barista Interactive System</span>
                <span className="mx-2">•</span>
                <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold text-[10px] animate-pulse">Live</span>
              </p>
            </div>
          </div>

          {/* Quick Stats Configuration */}
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
            
            <button 
              onClick={() => {
                const step = !soundEnabled;
                setSoundEnabled(step);
                if (step) playSynthSound('beep', true);
              }}
              title={soundEnabled ? "Mute cute beeps" : "Unmute sounds"}
              className={`p-3 rounded-xl border-2 transition-colors ${
                soundEnabled 
                  ? 'bg-rose-100 border-rose-200 text-rose-500 hover:bg-rose-200' 
                  : 'bg-stone-100 border-stone-200 text-stone-400 hover:bg-stone-200'
              }`}
              id="id-sound-config"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Simulated Live Scanner button */}
            <button 
              onClick={() => {
                setScannerOpen(true);
                playSynthSound('squeak', soundEnabled);
              }}
              className="bg-white hover:bg-rose-50 text-pink-600 font-bold px-4 py-2.5 rounded-xl border-2 border-pink-200 shadow-sm transition-colors flex items-center space-x-2"
              id="id-barcode-trigger"
            >
              <Barcode className="w-4.5 h-4.5" />
              <span className="text-xs">Barcode Scanner</span>
            </button>

            {/* Quick simulated scan shortcuts */}
            <div className="hidden sm:flex items-center space-x-1.5 bg-[#FAF6F4] p-1.5 rounded-xl border border-pink-100 text-[10px]">
              <span className="text-stone-400 font-bold ml-1">Scan Preset:</span>
              <button 
                onClick={() => triggerSimulationScan('725272730201')} 
                className="bg-white hover:bg-pink-100 px-2 py-1 rounded text-pink-600 font-extrabold border border-pink-100"
              >
                Matcha 🍹
              </button>
              <button 
                onClick={() => triggerSimulationScan('490001202512')} 
                className="bg-white hover:bg-pink-100 px-2 py-1 rounded text-pink-600 font-extrabold border border-pink-100"
              >
                Croissant 🥐
              </button>
            </div>

          </div>
        </header>

        {/* Dashboard layout with 4 categories navigation links */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Content Area (8 Columns) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Main Tabs Navigation */}
            <div className="flex flex-wrap bg-white border-2 border-pink-100 p-1.5 rounded-2xl max-w-2xl shadow-xs gap-1">
              <button 
                onClick={() => { setActiveTab('kiosk'); playSynthSound('pop', soundEnabled); }}
                className={`flex-1 flex justify-center items-center space-x-1.5 py-3 px-2 rounded-xl font-extrabold text-xs sm:text-sm transition-all ${
                  activeTab === 'kiosk' 
                    ? 'bg-gradient-to-r from-pink-200 to-rose-200 text-pink-700 shadow-xs' 
                    : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                }`}
                id="tab-btn-kiosk"
              >
                <ShoppingCart className="w-4 h-4 text-pink-500" />
                <span>Kiosk Cart Menu</span>
              </button>

              <button 
                onClick={() => { setActiveTab('orders'); playSynthSound('pop', soundEnabled); }}
                className={`flex-1 flex justify-center items-center space-x-1.5 py-3 px-2 rounded-xl font-extrabold text-xs sm:text-sm transition-all relative ${
                  activeTab === 'orders' 
                    ? 'bg-gradient-to-r from-pink-200 to-rose-200 text-pink-700 shadow-xs' 
                    : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                }`}
                id="tab-btn-orders"
              >
                <Coffee className="w-4 h-4 text-pink-500 animate-pulse" />
                <span>Brewing Queue</span>
                {activeOrdersCount > 0 && (
                  <span className="bg-rose-500 text-white absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] border border-white animate-bounce">
                    {activeOrdersCount}
                  </span>
                )}
              </button>
              
              <button 
                onClick={() => { setActiveTab('supervisor'); playSynthSound('pop', soundEnabled); }}
                className={`flex-1 flex justify-center items-center space-x-1.5 py-3 px-2 rounded-xl font-extrabold text-xs sm:text-sm transition-all ${
                  activeTab === 'supervisor' 
                    ? 'bg-gradient-to-r from-pink-200 to-rose-200 text-pink-700 shadow-xs' 
                    : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                }`}
                id="tab-btn-supervisor"
              >
                <Package className="w-4 h-4 text-pink-500" />
                <span>Kitchen Pantry supervisor</span>
              </button>

              <button 
                onClick={() => { setActiveTab('trends'); playSynthSound('pop', soundEnabled); }}
                className={`flex-1 flex justify-center items-center space-x-1.5 py-3 px-2 rounded-xl font-extrabold text-xs sm:text-sm transition-all ${
                  activeTab === 'trends' 
                    ? 'bg-gradient-to-r from-pink-200 to-rose-200 text-pink-700 shadow-xs' 
                    : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                }`}
                id="tab-btn-trends"
              >
                <TrendingUp className="w-4 h-4 text-pink-500" />
                <span>Fluctuation Trends</span>
              </button>
            </div>

            {/* TAB VIEW 1: KIOSK MENU & CHECKOUT SCREEN */}
            {activeTab === 'kiosk' && (
              <div className="bg-white border-4 border-[#FCE7F3] rounded-3xl p-6 shadow-[0_8px_0_#FDF2F4] animate-fade-in">
                
                {/* Visual Intro banner */}
                <div className="mb-6 p-4 bg-gradient-to-r from-rose-50 via-pink-50/50 to-white rounded-2xl border border-pink-100/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 text-center sm:text-left">
                    <span className="text-3xl">🧋🧁</span>
                    <div>
                      <h4 className="font-black text-rose-700 text-sm">Welcome Guest! Tap menu items below to load the counter tray!</h4>
                      <p className="text-xs text-stone-500">Checkout decreases inventory potion boxes instantly in real-time.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setCategoryFilter('All');
                      setSearchQuery('');
                      playSynthSound('pop', soundEnabled);
                    }}
                    className="text-xs text-pink-600 hover:underline font-bold"
                  >
                    Clear Search filters
                  </button>
                </div>

                {/* Filter and Category system */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  {/* Search input to test products map */}
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      placeholder="Search café snacks, lattes, or barcodes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#FAF6F4]/50 focus:bg-white border-2 border-pink-100 focus:border-pink-300 rounded-full py-2.5 px-10 text-xs focus:ring-0 outline-none text-stone-700"
                    />
                    <Tag className="w-4 h-4 text-pink-300 absolute left-3.5 top-3.5" />
                  </div>

                  {/* Horizontal Category tags scroll */}
                  <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none">
                    {categories.map((cat, idx) => (
                      <button 
                        key={idx}
                        onClick={() => {
                          setCategoryFilter(cat);
                          playSynthSound('pop', soundEnabled);
                        }}
                        className={`text-xs font-black px-3 py-2 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                          categoryFilter === cat 
                            ? 'bg-pink-500 text-white shadow-xs' 
                            : 'bg-[#FAF6F4] text-stone-600 hover:bg-pink-50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid of tasty Cafe Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredProducts.map((p) => {
                    const matchedTrend = trends.find(t => t.ticker === p.ticker);
                    const isOutOfStock = p.quantity <= 0;

                    return (
                      <div 
                        key={p.id}
                        onClick={() => { if(!isOutOfStock) handleAddProductToCart(p); }}
                        className={`group bg-gradient-to-b from-[#FFFDFDFD] to-[#FAF9F8] border-2 rounded-2xl p-4.5 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                          isOutOfStock 
                            ? 'border-stone-100 opacity-60' 
                            : 'border-pink-50 active:scale-98 hover:border-pink-200 shadow-xs hover:shadow-md'
                        }`}
                      >
                        {/* Out of Stock Indicator */}
                        {isOutOfStock && (
                          <span className="absolute top-3 right-3 bg-stone-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full z-10 uppercase tracking-widest">
                            Temporarily Empty!
                          </span>
                        )}

                        {/* Category Icon tag */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-white border border-pink-100/50 text-stone-500 text-[10px]">
                            {p.category}
                          </span>
                          <span className="text-xs text-stone-400 font-mono font-medium">{p.ticker}</span>
                        </div>

                        {/* Title & Price details */}
                        <div className="space-y-1 mb-4">
                          <div className="flex items-start justify-between">
                            <h4 className="font-extrabold text-stone-800 text-base">{p.name}</h4>
                            <span className="font-mono font-black text-rose-600 text-base ml-2">
                              ${p.price.toFixed(2)}
                            </span>
                          </div>
                          
                          {p.notes && (
                            <p className="text-[11px] text-stone-400 italic line-clamp-1">
                              {p.notes}
                            </p>
                          )}
                        </div>

                        {/* Stock & Bottom Tray control */}
                        <div className="pt-3 border-t border-dashed border-stone-100 flex items-center justify-between">
                          <span className={`text-[10px] font-bold ${p.quantity < 10 ? 'text-rose-500 animate-pulse' : 'text-stone-500'}`}>
                            🥣 {p.quantity} servings Left
                          </span>

                          <button 
                            disabled={isOutOfStock}
                            className={`font-black text-[11px] px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 ${
                              isOutOfStock 
                                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                                : 'bg-pink-100 hover:bg-pink-500 hover:text-white text-pink-600 group-hover:shadow-xs'
                            }`}
                          >
                            <span>Add to Tray</span>
                            <span>+</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* TAB VIEW 2: ACTIVE BREWING QUEUE BOARD */}
            {activeTab === 'orders' && (
              <div className="bg-white border-4 border-[#FCE7F3] rounded-3xl p-6 shadow-[0_8px_0_#FDF2F4] animate-fade-in">
                
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-pink-50">
                  <div>
                    <h3 className="text-lg font-black text-stone-800">☕ Active Brewing orders</h3>
                    <p className="text-xs text-stone-400 mt-0.5">Orders placed at the kiosk counter. Watch drink progress or serve them!</p>
                  </div>
                  <span className="bg-[#FFF0F5] border border-pink-100 text-pink-600 font-bold text-xs px-3 py-1.5 rounded-lg">
                    Real-time Kitchen Simulator
                  </span>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-16 bg-[#FAF6F4]/50 border-2 border-dashed border-pink-100 rounded-2xl">
                    <span className="text-4xl inline-block mb-3 animate-pulse">🛎️</span>
                    <h4 className="font-extrabold text-[#4E3D30]">No brewing tickets currently active.</h4>
                    <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                      Switch to &quot;Kiosk Cart Menu&quot; tab, pick some tasty coffees and strawberries cupcakes, and press &quot;Brew Order&quot;!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((o) => (
                      <div 
                        key={o.id} 
                        className={`border-2 p-4 rounded-2xl transition-all flex flex-col md:flex-row justify-between gap-4 ${
                          o.status === 'brewing' ? 'border-amber-200 bg-amber-50/10' :
                          o.status === 'ready' ? 'border-emerald-300 bg-emerald-50/10' :
                          'border-stone-100 bg-stone-50/50 opacity-65'
                        }`}
                      >
                        {/* Order identifier */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-black text-xs text-stone-800 bg-[#FAF1E6] border border-stone-200/50 px-2 py-1 rounded">
                              TICKET {o.id}
                            </span>
                            <span className="text-xs font-semibold text-stone-400">
                              🕒 {new Date(o.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'})}
                            </span>
                          </div>

                          {/* Customer Name */}
                          <div className="flex items-center space-x-1">
                            <User className="w-3.5 h-3.5 text-pink-400" />
                            <span className="font-extrabold text-sm text-[#4E3D30]">Customer: {o.customerName}</span>
                          </div>

                          {/* Items checklist */}
                          <ul className="space-y-1 pl-1">
                            {o.items.map((it, i) => (
                              <li key={i} className="text-xs text-stone-600 font-medium flex items-center space-x-1">
                                <span className="bg-pink-100 text-pink-700 w-4 h-4 rounded text-[9.5px] font-bold flex items-center justify-center mr-1">
                                  {it.quantity}
                                </span>
                                <span>{it.name}</span>
                                <span className="text-stone-300">•</span>
                                <span className="text-stone-500 font-mono">${(it.quantity * it.price).toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Status tracker & progress bar */}
                        <div className="flex flex-col justify-between items-end gap-2.5">
                          
                          {/* Price breakdown */}
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-widest">Grand Total</span>
                            <span className="text-base font-mono font-black text-stone-800">${o.totalPrice.toFixed(2)}</span>
                          </div>

                          {/* Interactive status togglers */}
                          <div className="flex items-center space-x-2">
                            {o.status === 'brewing' && (
                              <>
                                <span className="text-xs font-bold text-amber-600 animate-pulse inline-flex items-center mr-2">
                                  👩‍🍳 Steaming Milk...
                                </span>
                                <button 
                                  onClick={() => handleUpdateOrderStatus(o.id, 'ready')}
                                  className="bg-amber-400 hover:bg-amber-500 text-stone-900 font-extrabold text-xs px-3 py-1.5 rounded-lg transition-transform active:scale-95"
                                >
                                  Mark as Ready 🌸
                                </button>
                              </>
                            )}

                            {o.status === 'ready' && (
                              <>
                                <span className="text-xs font-bold text-emerald-600 animate-bounce inline-flex items-center mr-2">
                                  ✨ Packaged & Ready!
                                </span>
                                <button 
                                  onClick={() => handleUpdateOrderStatus(o.id, 'enjoyed')}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg transition-transform active:scale-95"
                                >
                                  Serve to Client 🐰
                                </button>
                              </>
                            )}

                            {o.status === 'enjoyed' && (
                              <span className="text-xs font-bold text-stone-400 inline-flex items-center">
                                <Check className="w-3.5 h-3.5 text-emerald-500 inline mr-1" /> Served with love!
                              </span>
                            )}
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* TAB VIEW 3: KITCHEN PANTRY SUPERVISOR / INVENTORY SCREEN */}
            {activeTab === 'supervisor' && (
              <div className="bg-white border-4 border-[#FCE7F3] rounded-3xl p-6 shadow-[0_8px_0_#FDF2F4] animate-fade-in">
                
                {/* Visual statistics controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-pink-50">
                  <div>
                    <h3 className="text-lg font-black text-stone-800">📋 Pantry Ingredients & Baker stock</h3>
                    <p className="text-xs text-stone-400 mt-0.5">Customize base stock servings, costs, and set low-stock thresholds alerts!</p>
                  </div>

                  <button 
                    onClick={() => { setShowAddForm(!showAddForm); playSynthSound('squeak', soundEnabled); }}
                    className="bg-gradient-to-r from-pink-400 to-rose-400 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-pink-300 shadow-xs flex items-center space-x-1 cursor-pointer transition-transform duration-100 hover:scale-[1.02]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Custom recipe</span>
                  </button>
                </div>

                {/* Optional Registration Form popup inside tab */}
                {showAddForm && (
                  <form onSubmit={handleRegisterNewProductSubmit} className="mb-6 p-5 bg-[#FAF3F0] rounded-2xl border-2 border-pink-200 relative animate-fade-in">
                    <button 
                      type="button" 
                      onClick={() => setShowAddForm(false)}
                      className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <h4 className="text-sm font-bold text-pink-700 flex items-center space-x-1 mb-4">
                      <span>🍩 Mix New Potion Recipe parameters</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Product Name</label>
                        <input 
                          type="text" 
                          required
                          placeholder="Melon-pan, Cozy Espresso..."
                          value={newProdName}
                          onChange={(e) => setNewProdName(e.target.value)}
                          className="w-full bg-white border border-pink-200 rounded-xl px-3 py-1.5 text-xs focus:outline-pink-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Code (e.g. MOCHI)</label>
                        <input 
                          type="text" 
                          required
                          placeholder="MOCHI"
                          value={newProdTicker}
                          onChange={(e) => setNewProdTicker(e.target.value)}
                          className="w-full bg-white border border-pink-200 rounded-xl px-3 py-1.5 text-xs focus:outline-pink-400 font-bold uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">SKU Code (Barcode)</label>
                        <input 
                          type="text" 
                          placeholder="Optional barcode numerical"
                          value={newProdSku}
                          onChange={(e) => setNewProdSku(e.target.value)}
                          className="w-full bg-white border border-pink-200 rounded-xl px-3 py-1.5 text-xs focus:outline-pink-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Stock Level (Servings)</label>
                        <input 
                          type="number" 
                          value={newProdQuantity}
                          onChange={(e) => setNewProdQuantity(e.target.value)}
                          className="w-full bg-white border border-pink-200 rounded-xl px-3 py-1.5 text-xs focus:outline-pink-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Raw Cost of Materials ($)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={newProdUnitCost}
                          onChange={(e) => setNewProdUnitCost(e.target.value)}
                          className="w-full bg-white border border-pink-200 rounded-xl px-3 py-1.5 text-xs focus:outline-pink-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Kiosk Retail Price ($)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={newProdPrice}
                          onChange={(e) => setNewProdPrice(e.target.value)}
                          className="w-full bg-white border border-pink-200 rounded-xl px-3 py-1.5 text-xs focus:outline-pink-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Category</label>
                        <select 
                          value={newProdCategory}
                          onChange={(e) => setNewProdCategory(e.target.value)}
                          className="w-full bg-white border border-pink-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-0"
                        >
                          {categories.slice(1).map((c, i) => (
                            <option key={i} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Smart Alert Trigger</label>
                        <select 
                          value={newProdAlertType}
                          onChange={(e) => setNewProdAlertType(e.target.value as any)}
                          className="w-full bg-white border border-pink-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-0"
                        >
                          <option value="low-stock">Warning if ingredients stock drop below</option>
                          <option value="above">Popularity Surge Above target price</option>
                          <option value="below">Cozy Discount below target price</option>
                          <option value="none">No Warnings Needed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Limit Threshold Limit</label>
                        <input 
                          type="number" 
                          value={newProdAlertThreshold}
                          onChange={(e) => setNewProdAlertThreshold(e.target.value)}
                          className="w-full bg-white border border-pink-200 rounded-xl px-3 py-1.5 text-xs focus:outline-pink-400"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Barista Description / Notes</label>
                      <input 
                        type="text" 
                        placeholder="Sprinkle some mint leaves... Serve cold..."
                        value={newProdNotes}
                        onChange={(e) => setNewProdNotes(e.target.value)}
                        className="w-full bg-white border border-pink-200 rounded-xl px-3 py-1.5 text-xs focus:outline-pink-400"
                      />
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button 
                        type="submit"
                        className="bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs px-5 py-2 rounded-full shadow-sm"
                      >
                        🌟 Save Recipe to Pantry
                      </button>
                    </div>
                  </form>
                )}

                {/* Table representation */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-pink-100/50 text-stone-400 text-[10px] font-bold uppercase tracking-wider text-left">
                        <th className="py-2 px-3">Café menu item</th>
                        <th className="py-2 px-3 text-center">Ingredients Stock</th>
                        <th className="py-2 px-3">Dynamic Kiosk Price</th>
                        <th className="py-2 px-3 text-center">Cost Basis</th>
                        <th className="py-2 px-3">Threshold Set</th>
                        <th className="py-2 px-3 text-center">Manage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pink-50 text-xs">
                      {inventory.map((item) => {
                        const isStockWarning = item.alertType === 'low-stock' && item.quantity <= item.alertThreshold;

                        return (
                          <tr key={item.id} className={`group hover:bg-pink-50/10 ${isStockWarning ? 'bg-amber-50/30' : ''}`}>
                            
                            <td className="py-3.5 px-3">
                              <div className="flex items-center space-x-2.5">
                                <div className="text-xl bg-[#FAF6F4] border border-pink-200 rounded p-1.5">
                                  {item.category === 'Coffee & Tea' ? '🍵' : 
                                   item.category === 'Sweet Pastries' ? '🥐' : 
                                   item.category === 'Desserts' ? '🍮' : '🎁'}
                                </div>
                                <div>
                                  <span className="block font-black text-stone-800">{item.name}</span>
                                  <span className="block text-[10px] text-stone-400 font-mono flex items-center mt-0.5">
                                    <Tag className="w-2.5 h-2.5 inline mr-1 text-pink-300" />
                                    {item.sku}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-3 text-center">
                              <div className="inline-flex items-center space-x-1.5">
                                <button 
                                  onClick={() => handleSupervisorQtyAdjust(item.id, -1)}
                                  className="w-6 h-6 bg-white hover:bg-rose-50 border border-pink-100 rounded text-[10px] font-bold"
                                >
                                  -
                                </button>
                                <span className={`font-black w-8 text-center ${item.quantity < 10 ? 'text-rose-500 bg-rose-50 px-1 py-0.5 rounded font-black' : 'text-stone-700'}`}>
                                  {item.quantity}
                                </span>
                                <button 
                                  onClick={() => handleSupervisorQtyAdjust(item.id, 1)}
                                  className="w-6 h-6 bg-white hover:bg-[#E6FDF5] border border-green-100 rounded text-[10px] font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            <td className="py-3.5 px-3">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-mono text-stone-500 font-semibold">$</span>
                                <input 
                                  type="number" 
                                  step="0.05"
                                  value={item.price}
                                  onChange={(e) => handleSupervisorPriceUpdate(item.id, Number(e.target.value))}
                                  className="w-14 bg-[#FAF6F4] focus:bg-white text-stone-800 font-mono font-bold border border-pink-100 rounded px-1.5 py-0.5 text-xs text-center"
                                />
                              </div>
                            </td>

                            <td className="py-3.5 px-3 text-center font-mono font-bold text-stone-500">
                              ${item.unitCost.toFixed(2)}
                            </td>

                            <td className="py-3.5 px-3">
                              {item.alertType === 'none' ? (
                                <span className="text-stone-300 italic text-[10px]">No alerts</span>
                              ) : (
                                <div className="space-y-1">
                                  <span className="text-[10px] text-stone-400 block font-bold">
                                    {item.alertType === 'low-stock' ? '⚠️ Stock <=' : '🍿 Price Target'}
                                  </span>
                                  <div className="flex items-center space-x-1">
                                    <input 
                                      type="number"
                                      value={item.alertThreshold}
                                      onChange={(e) => handleAlertThresholdChange(item.id, Number(e.target.value))}
                                      className="w-12 bg-white border border-stone-200 text-[#DB2777] font-mono font-bold text-center text-[10px] rounded px-1"
                                    />
                                    <span className="text-[10px] text-stone-500">
                                      {item.alertType === 'low-stock' ? 'serv' : '$'}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-3 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <button 
                                  onClick={() => {
                                    const tr = trends.find(t => t.ticker === item.ticker);
                                    if(tr) setSelectedTrend(tr);
                                    setActiveTab('trends');
                                    playSynthSound('pop', soundEnabled);
                                  }}
                                  title="View Trendline"
                                  className="p-1 bg-[#FCE7F3]/50 text-pink-600 rounded hover:bg-pink-100"
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteProduct(item.id)}
                                  className="p-1 hover:bg-rose-50 text-rose-500 rounded"
                                  title="Delete Recipe"
                                  id={`del-${item.id}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* TAB VIEW 4: FLUCTUATION TRENDS & CHARTS */}
            {activeTab === 'trends' && selectedTrend && (
              <div className="bg-white border-4 border-[#FCE7F3] rounded-3xl p-6 shadow-[0_8px_0_#FDF2F4] animate-fade-in">
                
                {/* Selector trend header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-pink-50">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-pink-500 text-white font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-widest">
                        {selectedTrend.ticker}
                      </span>
                      <h3 className="text-lg font-black text-stone-800">{selectedTrend.name}</h3>
                    </div>
                    <p className="text-xs text-stone-400 mt-1">Surge rating: {selectedTrend.popularityScore}% Order Density today</p>
                  </div>

                  {/* Pricing stats block */}
                  <div className="flex items-center space-x-3 bg-[#FFFDFB] border border-pink-100 rounded-2xl p-3">
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-stone-400 block tracking-wider">Momo Price Meter</span>
                      <span className="font-mono text-lg font-black text-stone-800">
                        ${selectedTrend.currentPrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-[10px]">
                      <span className="block font-bold">Trend shift</span>
                      <span className={`block font-extrabold ${selectedTrend.change >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
                        {selectedTrend.change >= 0 ? '▲ +' : '▼ '}{selectedTrend.changePercent}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Draw dynamic SVG chart representation of history prices */}
                <div className="p-4 bg-gradient-to-b from-rose-50/10 to-[#FAF6F4]/30 rounded-2xl border border-pink-100/40 relative mb-6">
                  
                  {/* Absolute indicator badge */}
                  <div className="absolute top-3 right-3 bg-white border border-pink-200 px-2 py-0.5 rounded-full text-[9px] font-bold text-pink-600 flex items-center space-x-1 shadow-xs animate-pulse">
                    <span>💡 Dynamic Coffee Chart</span>
                  </div>

                  {/* Main SVG Graph */}
                  <div className="w-full h-56 relative mt-4">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                      <line x1="0" y1="40" x2="500" y2="40" stroke="#FFE9EC" strokeDasharray="3 3" />
                      <line x1="0" y1="100" x2="500" y2="100" stroke="#FFE9EC" strokeDasharray="3 3" />
                      <line x1="0" y1="160" x2="500" y2="160" stroke="#FFE9EC" strokeDasharray="3 3" />

                      {(() => {
                        const history = selectedTrend.history;
                        const min = Math.min(...history) * 0.95;
                        const max = Math.max(...history) * 1.05;
                        const delta = max - min || 1;

                        const points = history.map((val, idx) => {
                          const x = (idx / (history.length - 1)) * 500;
                          const y = 180 - ((val - min) / delta) * 145;
                          return { x, y, value: val };
                        });

                        let pathD = `M ${points[0].x} ${points[0].y}`;
                        for (let i = 1; i < points.length; i++) {
                          pathD += ` L ${points[i].x} ${points[i].y}`;
                        }

                        const areaD = `${pathD} L ${points[points.length - 1].x} 200 L ${points[0].x} 200 Z`;

                        return (
                          <>
                            <defs>
                              <linearGradient id="softAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#FB7185" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#FFF2F2" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            {/* Area fill */}
                            <path d={areaD} fill="url(#softAreaGrad)" />

                            {/* Line path */}
                            <path d={pathD} fill="none" stroke="#DB2777" strokeWidth="2.5" strokeLinecap="round" />

                            {/* Interactive touch circles */}
                            {points.map((p, idx) => (
                              <circle 
                                key={idx}
                                cx={p.x}
                                cy={p.y}
                                r={hoveredPoint?.index === idx ? 6 : 2}
                                fill={hoveredPoint?.index === idx ? '#E11D48' : '#FDA4AF'}
                                stroke="white"
                                strokeWidth="1.5"
                                onMouseEnter={() => setHoveredPoint({ index: idx, value: p.value })}
                                onMouseLeave={() => setHoveredPoint(null)}
                                className="cursor-pointer transition-all"
                              />
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  {/* Chart Tooltip feedback details */}
                  <div className="h-6 mt-2 text-center">
                    {hoveredPoint ? (
                      <span className="bg-[#4E3D30] text-[#FFF9F2] text-[10px] py-1 px-2.5 rounded-full font-mono font-bold animate-pulse">
                        Hour index {hoveredPoint.index + 1}: price peak was ${hoveredPoint.value.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-400 font-medium">
                        Hover or touch price points on graph path to see historical values!
                      </span>
                    )}
                  </div>

                </div>

                {/* Horizontal item selection grid */}
                <span className="block text-xs uppercase font-extrabold text-stone-400 tracking-wider mb-2">Switch café chart target:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {trends.map((t) => (
                    <button 
                      key={t.ticker}
                      onClick={() => {
                        setSelectedTrend(t);
                        playSynthSound('pop', soundEnabled);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedTrend.ticker === t.ticker 
                          ? 'border-pink-300 bg-pink-50/40 font-bold shadow-xs' 
                          : 'border-stone-100 bg-white hover:border-pink-200'
                      }`}
                    >
                      <span className="block text-[10px] text-stone-400 uppercase font-black">{t.ticker}</span>
                      <span className="block font-extrabold text-[#4E3D30] text-xs truncate">{t.name}</span>
                      <span className="block text-xs font-mono font-bold text-pink-600 mt-1">${t.currentPrice.toFixed(2)}</span>
                    </button>
                  ))}
                </div>

              </div>
            )}

          </div>

          {/* RIGHT SIDEBAR PANEL (4 Columns for Tray Checkout / AI Advisor / Logs) */}
          <div className="lg:col-span-4 space-y-6">

            {/* BLOCK 1: ACTIVE CUSTOMER TRAY SHOPPING CART */}
            <div className="bg-white border-4 border-pink-100 rounded-3xl p-5 shadow-[0_6px_0_#FFF5F5]">
              <div className="flex items-center justify-between mb-4 pb-1 border-b border-pink-50">
                <span className="font-extrabold text-sm text-[#4E3D30] flex items-center space-x-1.5">
                  <ShoppingBag className="w-4 h-4 text-pink-500" />
                  <span>Kiosk Order Tray</span>
                </span>
                <span className="bg-pink-100 text-pink-600 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                  {cart.reduce((ac, x) => ac + x.quantity, 0)} items
                </span>
              </div>

              {cart.length === 0 ? (
                <div className="py-10 text-center text-stone-400">
                  <span className="text-3xl block mb-2">🧁</span>
                  <p className="text-xs font-bold text-stone-500">Kiosk Counter is empty</p>
                  <p className="text-[10px] text-stone-400 mt-1">Tap drinks or pastries in the left menu to pile them here!</p>
                </div>
              ) : (
                <form onSubmit={handleCheckoutCart} className="space-y-4">
                  
                  {/* Cart list items */}
                  <div className="max-h-52 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {cart.map((item) => (
                      <div key={item.product.id} className="bg-rose-50/20 p-2.5 rounded-xl border border-pink-100/30 flex items-center justify-between gap-1">
                        <div className="flex-1">
                          <span className="block font-bold text-xs text-stone-800 line-clamp-1">{item.product.name}</span>
                          <span className="font-mono text-[10px] text-pink-600 font-black">${item.product.price.toFixed(2)} each</span>
                        </div>

                        {/* Adjust qty */}
                        <div className="flex items-center space-x-2.5">
                          <button 
                            type="button"
                            onClick={() => handleAdjustCartQuantity(item.product.id, -1)}
                            className="w-5 h-5 rounded bg-white hover:bg-stone-100 border border-stone-200 font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="font-bold text-stone-700 text-xs">{item.quantity}</span>
                          <button 
                            type="button"
                            onClick={() => handleAdjustCartQuantity(item.product.id, 1)}
                            className="w-5 h-5 rounded bg-white hover:bg-stone-100 border border-stone-200 font-bold text-xs"
                          >
                            +
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleRemoveFromCart(item.product.id)}
                            className="text-stone-300 hover:text-rose-500 p-0.5 ml-1"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Customer naming */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 block uppercase tracking-wider">Your Cute name:</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Blossom Bear, Bunny Lover"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-[#FAF6F4]/60 border border-pink-200 rounded-xl px-3 py-2 pl-8 text-xs outline-none"
                      />
                      <User className="w-3.5 h-3.5 text-pink-400 absolute left-2.5 top-3" />
                    </div>
                  </div>

                  {/* Kiosk totals calculations breakdown */}
                  <div className="bg-[#FAF6F4]/50 p-3 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-stone-500 font-medium">Subtotal</span>
                      <span className="font-mono font-bold text-stone-700">${totalCartPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500 font-medium">Cozy tax (0%)</span>
                      <span className="font-mono text-stone-400 font-bold">$0.00</span>
                    </div>
                    <div className="border-t border-dashed border-stone-200 pt-2.5 flex justify-between font-extrabold">
                      <span className="text-rose-700 font-bold">Counter Total</span>
                      <span className="font-mono text-sm text-rose-700 font-black">${totalCartPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Brew button */}
                  <button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-extrabold py-3.5 rounded-2xl shadow-sm text-xs uppercase tracking-widest flex items-center justify-center space-x-2 transition-transform active:scale-98 cursor-pointer"
                  >
                    <span>Checkout & Brew order</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>

                  <p className="text-[10px] text-stone-400 text-center mt-1">
                    Bakes with cozy butter & sprinkles star star starch. ✨
                  </p>

                </form>
              )}
            </div>

            {/* BLOCK 2: AI BARISTA COCO & MOMO ADVISOR PORTAL */}
            <div className="bg-[#FFFDFB] border-4 border-[#FFF0F4] rounded-3xl p-5 shadow-[0_6px_0_#FDF2F5] relative overflow-hidden">
              
              {/* Little illustration bubble */}
              <div className="absolute top-2 right-2 text-3xl">🐹🎈</div>

              <div className="flex items-center space-x-2.5 mb-3 pb-1.5 border-b border-pink-100/60">
                <Sparkles className="w-5 h-5 text-pink-500 fill-pink-100" />
                <div>
                  <h4 className="font-black text-[#5C321E] text-xs uppercase tracking-wide">Pantry Chef Advice</h4>
                  <p className="text-[10px] text-pink-600 font-medium">Rabbit Coco & Hamster Momo Expert Report</p>
                </div>
              </div>

              {/* Advice container output */}
              <div className="bg-white/80 p-3 rounded-2xl border border-pink-100/30 text-xs min-h-16 text-left">
                {momoAdvice ? (
                  <div 
                    className="prose-pink space-y-2 text-[11px] leading-relaxed text-stone-600 markdown-body font-medium"
                    dangerouslySetInnerHTML={{ __html: momoAdvice }}
                  />
                ) : (
                  <div className="text-center py-4 text-stone-400">
                    <p className="font-bold text-stone-500">Momo and Coco are sleeping on the bakery shelf... 💤</p>
                    <p className="text-[10px] text-stone-400 mt-1">Tap the advise button below to wake them up with cookie crumbs!</p>
                  </div>
                )}
              </div>

              {/* Trigger advice review */}
              <button 
                onClick={handleAskMomoAdvisory}
                disabled={loadingAdvice}
                className="w-full mt-3 bg-[#FAF1F3] hover:bg-pink-100 hover:text-pink-700 text-[#4E3D30] font-bold text-xs py-2 px-4 rounded-xl transition-all border border-pink-200 flex items-center justify-center space-x-1"
                id="btn-ask-momo"
              >
                {loadingAdvice ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-pink-600" />
                    <span className="text-[11px] text-pink-600">Coco is mixing cookie crumbs...</span>
                  </>
                ) : (
                  <>
                    <span>🐾 Bake AI Advisory Report</span>
                  </>
                )}
              </button>

            </div>

            {/* BLOCK 3: REAL-TIME LOW-STOCK & TARGET PRICE ALERTS LOGS */}
            <div className="bg-white border-4 border-pink-100 rounded-3xl p-5 shadow-[0_6px_0_#FFF5F5]">
              <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-stone-100">
                <span className="font-extrabold text-[#4E3D30] text-xs flex items-center space-x-1.5">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span>Real-time Pantry Alerts logs</span>
                </span>

                {alerts.length > 0 && (
                  <button 
                    onClick={handleClearAlerts}
                    className="text-[10px] font-black text-rose-500 hover:text-rose-700 hover:underline"
                  >
                    Mark read ({unreadAlertsCount})
                  </button>
                )}
              </div>

              {alerts.length === 0 ? (
                <div className="py-8 text-center text-stone-400">
                  <span className="text-2xl block mb-1">🔔</span>
                  <p className="text-[10px] font-bold text-stone-500">Alert tracker is calm</p>
                  <p className="text-[9px] text-stone-400 mt-0.5">Alerts trigger dynamically when servings run low or price is matched.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-left scrollbar-thin">
                  {alerts.map((al) => (
                    <div 
                      key={al.id} 
                      className={`p-2.5 rounded-xl text-[11px] leading-snug border transition-colors ${
                        al.read ? 'bg-[#FAFBF9]/80 border-stone-200/50 opacity-70' : 'bg-amber-50/40 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-stone-700">{al.productName}</span>
                        <span className="text-[9px] text-stone-400 font-mono">
                          {new Date(al.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>

                      {al.triggerType === 'low-stock' ? (
                        <p className="text-[#92400E] font-medium flex items-center">
                          <AlertCircle className="w-3.5 h-3.5 inline mr-1 text-amber-500 shrink-0" />
                          <span>Pantry is running dry! Only <b>{al.triggeredValue} remaining</b> (Alert set to &lt;= {al.thresholdValue}).</span>
                        </p>
                      ) : (
                        <p className="text-[#3F3F46] font-medium flex items-center">
                          <AlertCircle className="w-3.5 h-3.5 inline mr-1 text-blue-500 shrink-0" />
                          <span>Dynamic price surged to <b>${al.triggeredValue.toFixed(2)}</b> (alert was set at ${al.thresholdValue.toFixed(2)}).</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* CUTE CAMERA / BARCODE SCANNING SIMULATION DIALOG */}
        {scannerOpen && (
          <div className="fixed inset-0 bg-[#352B24]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white border-4 border-[#FCE7F3] rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-scale-up">
              
              <button 
                onClick={() => {
                  setScannerOpen(false);
                  setScanResult(null);
                  setScanningStatus('idle');
                  playSynthSound('pop', soundEnabled);
                }}
                className="absolute top-4 right-4 bg-[#FAF6F4] text-stone-400 hover:text-stone-600 p-1 rounded-full border border-pink-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2.5 mb-4 pb-2 border-b border-pink-50">
                <span className="text-2xl">📷</span>
                <div>
                  <h3 className="font-black text-[#4E3D30] text-sm">Visual Barcode Scanner</h3>
                  <p className="text-[10px] text-stone-400">Simulate camera or input SKU barcode numbers manually!</p>
                </div>
              </div>

              {/* Dummy camera frame view */}
              <div className="w-full aspect-video bg-[#28211B] rounded-2xl relative overflow-hidden flex flex-col items-center justify-center border border-pink-100">
                
                {/* Simulated light laser beam across scanner */}
                {scanningStatus === 'searching' && (
                  <div className="w-full h-1 bg-red-400 absolute left-0 right-0 animate-bounce shadow-[0_0_8px_red]" />
                )}

                <p className="text-xs font-bold text-stone-400 text-center px-4 space-y-2">
                  <span className="block text-2xl animate-pulse">🔎</span>
                  <span className="block">Simulating Red Laser scan field...</span>
                </p>

                <p className="absolute bottom-2 left-2 bg-stone-900/80 px-2.5 py-1 rounded text-[8px] tracking-widest text-[#FFF] uppercase">
                  Scanner Active
                </p>
              </div>

              {/* Simulation status logs */}
              <div className="mt-4 p-3 bg-[#FAF6F4] rounded-2xl border border-pink-100 text-xs">
                {scanningStatus === 'idle' && (
                  <p className="text-stone-500 font-bold block text-center py-1">Type SKU barcode below to simulate instant scanner beam action!</p>
                )}

                {scanningStatus === 'searching' && (
                  <div className="flex items-center justify-center space-x-2 py-1">
                    <RefreshCw className="w-4 h-4 text-pink-500 animate-spin" />
                    <span className="font-bold text-pink-600">Simulating lookup database query...</span>
                  </div>
                )}

                {scanningStatus === 'found' && scanResult && scanResult.product && (
                  <div className="space-y-1.5 py-1 text-left">
                    <p className="text-emerald-600 font-extrabold flex items-center">
                      <Check className="w-4 h-4 mr-1 text-emerald-500 inline fill-emerald-100" />
                      <span>Found beverage & recipe match in Kiosk!</span>
                    </p>
                    <div className="pl-4 text-stone-600 space-y-0.5 text-[11px]">
                      <span className="block"><b>Product:</b> {scanResult.product.name} ({scanResult.product.ticker})</span>
                      <span className="block"><b>Kiosk price:</b> ${scanResult.product.price.toFixed(2)}</span>
                      <span className="block"><b>Remaining Stock servings:</b> {scanResult.product.quantity} units</span>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button 
                        onClick={() => {
                          if (scanResult.product) handleAddProductToCart(scanResult.product);
                          setScannerOpen(false);
                          setScanResult(null);
                        }}
                        className="bg-emerald-500 text-white font-extrabold px-4  py-1.5 rounded-lg text-[10px] shadow-sm flex items-center space-x-1"
                      >
                        <span>Put in Tray</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {scanningStatus === 'not-found' && scanResult && scanResult.suggested && (
                  <div className="space-y-1.5 py-1 text-left">
                    <p className="text-amber-600 font-extrabold">
                      ⚠️ Barcode not registered! Procedural recipe generated:
                    </p>
                    <div className="pl-3 text-stone-600 text-[11px]">
                      <span className="block"><b>Custom suggested name:</b> {scanResult.suggested.name}</span>
                      <span className="block"><b>Drink Category:</b> {scanResult.suggested.category}</span>
                      <span className="block"><b>Retail unit Cost:</b> ${scanResult.suggested.unitCost.toFixed(2)}</span>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button 
                        onClick={handleAddNewScannedSuggest}
                        className="bg-pink-500 text-white font-extrabold px-3.5 py-1.5 rounded-lg text-[10px] shadow-sm"
                      >
                        🌟 Register Recipe to pantry
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Manual input form */}
              <form onSubmit={handleScanFormSubmit} className="mt-4 flex gap-2">
                <input 
                  type="text" 
                  placeholder="Insert SKU numeric (e.g. 725272730201)"
                  value={scannedSkuInput}
                  onChange={(e) => setScannedSkuInput(e.target.value)}
                  className="flex-1 bg-stone-50 border border-stone-200 focus:border-pink-300 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white text-stone-700"
                />
                <button 
                  type="submit"
                  disabled={scanningStatus === 'searching'}
                  className="bg-[#4E3D30] text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-colors disabled:opacity-50"
                >
                  Scan SKU
                </button>
              </form>

              {/* Helpful presets helper layout */}
              <div className="mt-3.5 border-t border-pink-50 pt-3 text-left">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">Simulation presets barcodes:</span>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <button 
                    type="button"
                    onClick={() => triggerSimulationScan('725272730201')}
                    className="bg-[#FAF6F4] hover:bg-pink-100/50 text-[#DB2777] px-2.5 py-1 rounded"
                  >
                    Matcha (Registered)
                  </button>
                  <button 
                    type="button"
                    onClick={() => triggerSimulationScan('490001202512')}
                    className="bg-[#FAF6F4] hover:bg-pink-100/50 text-[#DB2777] px-2.5 py-1 rounded"
                  >
                    Croissant (Registered)
                  </button>
                  <button 
                    type="button"
                    onClick={() => triggerSimulationScan('999999999999')}
                    className="bg-[#FAF6F4] hover:bg-pink-100/50 text-stone-600 px-2.5 py-1 rounded"
                  >
                    Mock Raw Ingredient (Procedural suggestion)
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
