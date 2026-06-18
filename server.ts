import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { TrackedProduct, AlertLog, CafeItemTrend, KioskOrder } from './src/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pre-defined menu products for the Barista Cafe Kiosk
export let userProducts: TrackedProduct[] = [
  {
    id: 'prod-matcha',
    ticker: 'MATCHA',
    name: 'Cozy Matcha Latte Cloud',
    sku: '725272730201',
    quantity: 45,
    unitCost: 1.20,
    price: 5.50,
    category: 'Coffee & Tea',
    alertType: 'low-stock',
    alertThreshold: 10,
    lastTriggeredAt: null,
    isActive: true,
    notes: 'Brew with cute whipped cream hat and sweet matcha dust star stars! ⭐'
  },
  {
    id: 'prod-ccino',
    ticker: 'CCINO',
    name: 'Purrfect Catpuccino Foam',
    sku: '110293847562',
    quantity: 12,
    unitCost: 1.10,
    price: 4.80,
    category: 'Coffee & Tea',
    alertType: 'low-stock',
    alertThreshold: 15,
    lastTriggeredAt: null,
    isActive: true,
    notes: 'Etch lovely dynamic stencil cartoon whiskers with custom cocoa dust! 🐾'
  },
  {
    id: 'prod-crois',
    ticker: 'CROIS',
    name: 'Strawberry Glazed Croissant',
    sku: '490001202512',
    quantity: 8,
    unitCost: 1.80,
    price: 3.90,
    category: 'Sweet Pastries',
    alertType: 'low-stock',
    alertThreshold: 12,
    lastTriggeredAt: null,
    isActive: true,
    notes: 'Heat gently for exactly 15 seconds to keep the glaze cute and melty!'
  },
  {
    id: 'prod-mochi',
    ticker: 'MOCHI',
    name: 'Sakura Fluff Redbean Mochi',
    sku: '603829104859',
    quantity: 22,
    unitCost: 0.80,
    price: 2.75,
    category: 'Desserts',
    alertType: 'below',
    alertThreshold: 2.50,
    lastTriggeredAt: null,
    isActive: true,
    notes: 'Best served with extra blossom sprinkles!'
  },
  {
    id: 'prod-boba',
    ticker: 'BOBA',
    name: 'Happy Honey Peach Tea',
    sku: '883929490104',
    quantity: 35,
    unitCost: 1.30,
    price: 5.20,
    category: 'Coffee & Tea',
    alertType: 'above',
    alertThreshold: 5.80,
    lastTriggeredAt: null,
    isActive: true,
    notes: 'Extra chewy peach boba pearls with double happy honey. Shake-shake!'
  },
  {
    id: 'prod-flan',
    ticker: 'FLAN',
    name: 'Creamy Caramel Flan Cubes',
    sku: '400192837465',
    quantity: 18,
    unitCost: 1.00,
    price: 4.50,
    category: 'Desserts',
    alertType: 'none',
    alertThreshold: 0,
    lastTriggeredAt: null,
    isActive: true,
    notes: 'Serve in a little cute star glass mold.'
  }
];

// Cafe Price / Popularity Dynamic Trends
let menuTrends: CafeItemTrend[] = [
  {
    ticker: 'MATCHA',
    name: 'Cozy Matcha Latte Cloud',
    currentPrice: 5.50,
    prevPrice: 5.40,
    change: 0.10,
    changePercent: 1.85,
    history: Array.from({ length: 30 }, (_, i) => 4.50 + Math.sin(i / 3) * 0.8 + Math.random() * 0.3),
    sparkline: Array.from({ length: 15 }, () => 5.50 + (Math.random() - 0.5) * 0.3),
    popularityScore: 92,
    lastUpdated: new Date().toISOString()
  },
  {
    ticker: 'CCINO',
    name: 'Purrfect Catpuccino Foam',
    currentPrice: 4.80,
    prevPrice: 4.90,
    change: -0.10,
    changePercent: -2.04,
    history: Array.from({ length: 30 }, (_, i) => 4.20 + Math.cos(i / 4) * 0.5 + Math.random() * 0.2),
    sparkline: Array.from({ length: 15 }, () => 4.80 + (Math.random() - 0.5) * 0.12),
    popularityScore: 88,
    lastUpdated: new Date().toISOString()
  },
  {
    ticker: 'CROIS',
    name: 'Strawberry Glazed Croissant',
    currentPrice: 3.90,
    prevPrice: 3.80,
    change: 0.10,
    changePercent: 2.63,
    history: Array.from({ length: 30 }, (_, i) => 3.20 + Math.sin(i / 2) * 0.4 + Math.random() * 0.15),
    sparkline: Array.from({ length: 15 }, () => 3.90 + (Math.random() - 0.5) * 0.1),
    popularityScore: 95,
    lastUpdated: new Date().toISOString()
  },
  {
    ticker: 'MOCHI',
    name: 'Sakura Fluff Redbean Mochi',
    currentPrice: 2.75,
    prevPrice: 2.75,
    change: 0.00,
    changePercent: 0.00,
    history: Array.from({ length: 30 }, (_, i) => 2.40 + Math.cos(i / 5) * 0.2 + Math.random() * 0.1),
    sparkline: Array.from({ length: 15 }, () => 2.75 + (Math.random() - 0.5) * 0.05),
    popularityScore: 78,
    lastUpdated: new Date().toISOString()
  },
  {
    ticker: 'BOBA',
    name: 'Happy Honey Peach Tea',
    currentPrice: 5.20,
    prevPrice: 5.15,
    change: 0.05,
    changePercent: 0.97,
    history: Array.from({ length: 30 }, (_, i) => 4.80 + Math.sin(i / 4) * 0.6 + Math.random() * 0.2),
    sparkline: Array.from({ length: 15 }, () => 5.20 + (Math.random() - 0.5) * 0.22),
    popularityScore: 85,
    lastUpdated: new Date().toISOString()
  },
  {
    ticker: 'FLAN',
    name: 'Creamy Caramel Flan Cubes',
    currentPrice: 4.50,
    prevPrice: 4.45,
    change: 0.05,
    changePercent: 1.12,
    history: Array.from({ length: 30 }, (_, i) => 3.90 + Math.sin(i / 5) * 0.3 + Math.random() * 0.15),
    sparkline: Array.from({ length: 15 }, () => 4.50 + (Math.random() - 0.5) * 0.1),
    popularityScore: 81,
    lastUpdated: new Date().toISOString()
  }
];

let alertLogs: AlertLog[] = [];
let kioskOrders: KioskOrder[] = [
  {
    id: 'ord-101',
    items: [
      { productId: 'prod-matcha', name: 'Cozy Matcha Latte Cloud', price: 5.50, quantity: 1 },
      { productId: 'prod-crois', name: 'Strawberry Glazed Croissant', price: 3.90, quantity: 2 }
    ],
    totalPrice: 13.30,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    customerName: 'Cheryl Bear',
    status: 'enjoyed'
  },
  {
    id: 'ord-102',
    items: [
      { productId: 'prod-ccino', name: 'Purrfect Catpuccino Foam', price: 4.80, quantity: 1 }
    ],
    totalPrice: 4.80,
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    customerName: 'Kitten-san',
    status: 'brewing'
  }
];

// Fluctuate popularity, price demand, and update low-stock warning triggers!
setInterval(() => {
  menuTrends = menuTrends.map(trend => {
    // Small hourly trend swing representing café surge hour demand!
    const variance = (Math.random() - 0.49) * 0.05; // -0.024 to +0.025 variation
    const newPrice = Math.max(1.00, Number((trend.currentPrice + variance).toFixed(2)));
    const prevPrice = trend.currentPrice;
    const change = Number((newPrice - prevPrice).toFixed(2));
    const changePercent = Number(((change / prevPrice) * 100).toFixed(2));
    const newSparkline = [...trend.sparkline.slice(1), newPrice];

    // Readjust popularity based on sales direction
    const popShift = Math.floor((Math.random() - 0.45) * 4);
    const newPop = Math.max(30, Math.min(100, trend.popularityScore + popShift));

    // Update active user products dynamically so prices are tracked on charts
    userProducts.forEach(product => {
      if (product.ticker === trend.ticker) {
        product.price = newPrice;

        // Check if alerts trigger!
        let activeTrigger = false;
        let typeVal: 'above' | 'below' | 'low-stock' = 'above';
        let customTriggerVal = 0;
        let currentStatusVal = 0;

        if (product.alertType === 'above' && newPrice >= product.alertThreshold) {
          activeTrigger = true;
          typeVal = 'above';
          customTriggerVal = product.alertThreshold;
          currentStatusVal = newPrice;
        } else if (product.alertType === 'below' && newPrice <= product.alertThreshold) {
          activeTrigger = true;
          typeVal = 'below';
          customTriggerVal = product.alertThreshold;
          currentStatusVal = newPrice;
        } else if (product.alertType === 'low-stock' && product.quantity <= product.alertThreshold) {
          activeTrigger = true;
          typeVal = 'low-stock';
          customTriggerVal = product.alertThreshold;
          currentStatusVal = product.quantity;
        }

        if (activeTrigger) {
          const nowStr = new Date().toISOString();
          const lastTrig = product.lastTriggeredAt ? new Date(product.lastTriggeredAt).getTime() : 0;
          
          // Anti-flood of notifications (twice a minute max per product)
          if (Date.now() - lastTrig > 15000) {
            product.lastTriggeredAt = nowStr;
            const newLog: AlertLog = {
              id: 'alert-' + Math.random().toString(36).substr(2, 9),
              productId: product.id,
              productName: product.name,
              ticker: product.ticker,
              triggeredValue: currentStatusVal,
              thresholdValue: customTriggerVal,
              triggerType: typeVal,
              timestamp: nowStr,
              read: false
            };
            alertLogs.unshift(newLog);
          }
        }
      }
    });

    return {
      ...trend,
      currentPrice: newPrice,
      change,
      changePercent,
      sparkline: newSparkline,
      popularityScore: newPop,
      lastUpdated: new Date().toISOString()
    };
  });
}, 3000);

// Initialize Gemini
const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: { 'User-Agent': 'aistudio-build' }
    }
  });
};

async function startServer() {
  const app = express();
  app.use(express.json());

  // GET Menu Item Trends (equivalent to stock data)
  app.get('/api/menu-trends', (req, res) => {
    res.json(menuTrends);
  });

  // GET Full List of Registered Cute Products
  app.get('/api/menu-products', (req, res) => {
    res.json(userProducts);
  });

  // POST Create standard cozy menu product
  app.post('/api/menu-products', (req, res) => {
    const { name, ticker, sku, quantity, unitCost, price, category, alertType, alertThreshold, notes } = req.body;
    if (!name || !ticker) {
      return res.status(400).json({ error: 'Drink/Pastry Name and Code are required!' });
    }

    const upperTicker = ticker.toUpperCase();
    const cleanPrice = Number(price) || 5.00;

    // Check if trends exist for this code, if not generate them beautifully
    if (!menuTrends.find(t => t.ticker === upperTicker)) {
      menuTrends.push({
        ticker: upperTicker,
        name: name,
        currentPrice: cleanPrice,
        prevPrice: cleanPrice,
        change: 0,
        changePercent: 0,
        history: Array.from({ length: 30 }, (_, i) => cleanPrice - 1.0 + Math.sin(i / 4) * 0.5 + Math.random() * 0.2),
        sparkline: Array.from({ length: 15 }, () => cleanPrice + (Math.random() - 0.5) * 0.2),
        popularityScore: 75,
        lastUpdated: new Date().toISOString()
      });
    }

    const newProduct: TrackedProduct = {
      id: 'prod-' + Math.random().toString(36).substr(2, 9),
      name,
      ticker: upperTicker,
      sku: sku || Math.floor(100000000000 + Math.random() * 900000000000).toString(),
      quantity: Number(quantity) !== undefined ? Number(quantity) : 20,
      unitCost: Number(unitCost) !== undefined ? Number(unitCost) : 1.50,
      price: cleanPrice,
      category: category || 'General',
      alertType: alertType || 'none',
      alertThreshold: Number(alertThreshold) || 0,
      lastTriggeredAt: null,
      isActive: true,
      notes: notes || 'Serve with warm love!'
    };

    userProducts.push(newProduct);
    res.json(newProduct);
  });

  // PUT Update Menu attributes
  app.put('/api/menu-products/:id', (req, res) => {
    const { id } = req.params;
    const body = req.body;
    const idx = userProducts.findIndex(p => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Cannot find this item in our cafe pantry.' });
    }

    userProducts[idx] = {
      ...userProducts[idx],
      quantity: body.quantity !== undefined ? Number(body.quantity) : userProducts[idx].quantity,
      unitCost: body.unitCost !== undefined ? Number(body.unitCost) : userProducts[idx].unitCost,
      price: body.price !== undefined ? Number(body.price) : userProducts[idx].price,
      alertThreshold: body.alertThreshold !== undefined ? Number(body.alertThreshold) : userProducts[idx].alertThreshold,
      alertType: body.alertType !== undefined ? body.alertType : userProducts[idx].alertType,
      isActive: body.isActive !== undefined ? body.isActive : userProducts[idx].isActive,
      notes: body.notes !== undefined ? body.notes : userProducts[idx].notes,
    };

    res.json(userProducts[idx]);
  });

  // DELETE Remove a product from layout
  app.delete('/api/menu-products/:id', (req, res) => {
    const { id } = req.params;
    userProducts = userProducts.filter(p => p.id !== id);
    res.json({ success: true, message: 'Say sweet goodbye!' });
  });

  // GET Active logs
  app.get('/api/alerts', (req, res) => {
    res.json(alertLogs);
  });

  // POST Ack
  app.post('/api/alerts/read', (req, res) => {
    alertLogs = alertLogs.map(l => ({ ...l, read: true }));
    res.json({ success: true });
  });

  // GET Scan helper (Kiosk Scanner)
  app.get('/api/scan/:sku', (req, res) => {
    const { sku } = req.params;
    const product = userProducts.find(p => p.sku === sku);
    if (product) {
      const trend = menuTrends.find(t => t.ticker === product.ticker);
      return res.json({
        found: true,
        product,
        trend
      });
    }

    // Default suggested items if barcode not registered
    const presetSkus = [
      { sku: '490001202512', ticker: 'CROIS', name: 'Strawberry Glazed Croissant', category: 'Sweet Pastries', price: 3.90, desc: 'Flaky baked layers glaze' },
      { sku: '883929490104', ticker: 'BOBA', name: 'Happy Honey Peach Tea', category: 'Coffee & Tea', price: 5.20, desc: 'Chewy sweet bubble beverage' },
      { sku: '725272730201', ticker: 'MATCHA', name: 'Cozy Matcha Latte Cloud', category: 'Coffee & Tea', price: 5.50, desc: 'Warm barista signature blend' },
      { sku: '110293847562', ticker: 'CCINO', name: 'Purrfect Catpuccino Foam', category: 'Coffee & Tea', price: 4.80, desc: 'Gently structured capuccino art' },
      { sku: '603829104859', ticker: 'MOCHI', name: 'Sakura Fluff Redbean Mochi', category: 'Desserts', price: 2.75, desc: 'Blossom sticky flour rice mochi' }
    ];

    const preset = presetSkus.find(p => p.sku === sku);
    if (preset) {
      return res.json({
        found: false,
        suggested: {
          ticker: preset.ticker,
          name: preset.name,
          sku: sku,
          category: preset.category,
          unitCost: Math.round(preset.price * 0.3 * 100) / 100,
          price: preset.price,
          notes: preset.desc
        }
      });
    }

    // Dynamic procedural creation
    const prefixes = ['Fluffy', 'Purrfect', 'Warm', 'Jelly', 'Milky', 'Sparkling', 'Chilled'];
    const items = ['Danish Puff', 'Earl Grey Muffin', 'Sakura Cheesecake', 'Cocoa Cookie Paw', 'Espresso Drop', 'Honey Boba Pot', 'Rosebud Brew'];
    const cats = ['Coffee & Tea', 'Sweet Pastries', 'Desserts', 'Merchandise'];

    const rndPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const rndItem = items[Math.floor(Math.random() * items.length)];
    const chosenName = `${rndPrefix} ${rndItem}`;
    const cleanTicker = rndItem.split(' ').map(w => w[0]).join('').toUpperCase() || 'DRINK';
    const chosenCat = cats[Math.floor(Math.random() * cats.length)];
    
    res.json({
      found: false,
      suggested: {
        ticker: cleanTicker,
        name: chosenName,
        sku: sku,
        category: chosenCat,
        unitCost: 1.25,
        price: 4.95,
        notes: 'Procedural custom barista flavor.'
      }
    });
  });

  // GET Orders list
  app.get('/api/kiosk-orders', (req, res) => {
    res.json(kioskOrders);
  });

  // POST Checkout custom order (reduces inventory quantities instantly and pushes order log!)
  app.post('/api/kiosk-orders/checkout', (req, res) => {
    const { items, customerName } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ error: 'Order must have adorable items!' });
    }

    const processedItems = [];
    let totalPrice = 0;

    for (const orderItem of items) {
      const prod = userProducts.find(p => p.id === orderItem.productId);
      if (prod) {
        // Reduce item stock cleanly
        const quantityToReduce = Number(orderItem.quantity) || 1;
        prod.quantity = Math.max(0, prod.quantity - quantityToReduce);
        
        processedItems.push({
          productId: prod.id,
          name: prod.name,
          price: prod.price,
          quantity: quantityToReduce
        });
        totalPrice += prod.price * quantityToReduce;

        // Instantly generate stock warning if low-stock threshold triggers
        if (prod.alertType === 'low-stock' && prod.quantity <= prod.alertThreshold) {
          const nowStr = new Date().toISOString();
          const newLog: AlertLog = {
            id: 'alert-' + Math.random().toString(36).substr(2, 9),
            productId: prod.id,
            productName: prod.name,
            ticker: prod.ticker,
            triggeredValue: prod.quantity,
            thresholdValue: prod.alertThreshold,
            triggerType: 'low-stock',
            timestamp: nowStr,
            read: false
          };
          alertLogs.unshift(newLog);
        }
      }
    }

    const newOrder: KioskOrder = {
      id: 'ord-' + Math.floor(100 + Math.random() * 900),
      items: processedItems,
      totalPrice: Number(totalPrice.toFixed(2)),
      timestamp: new Date().toISOString(),
      customerName: customerName || 'Cozy Customer',
      status: 'brewing'
    };

    kioskOrders.unshift(newOrder);

    // Simulate barista brewing speed finished
    setTimeout(() => {
      const live = kioskOrders.find(o => o.id === newOrder.id);
      if (live) {
        live.status = 'ready';
      }
    }, 15000);

    res.json({ success: true, order: newOrder, inventory: userProducts });
  });

  // POST update state of an order
  app.post('/api/kiosk-orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const order = kioskOrders.find(o => o.id === id);
    if (order) {
      order.status = status;
      return res.json(order);
    }
    res.status(404).json({ error: 'Could not find order' });
  });

  // POST endpoint: Gemini AI Assistant "Momo the Meadow Hamster Barista"
  app.post('/api/gemini/advisor', async (req, res) => {
    const ai = getGeminiClient();

    const systemPrompt = `You are "Coco the Barista Bunny & Momo the Pantry Hamster", two cozy companions who manage a sweet, lovely café kitchen kiosk pantry.
Your tone is extremely cute, pastel, cheerful, extremely helperly, and fluffy! You use gestures like "*holds whisk*", "*pours sweet cream*", "*twitches bunnies ears*", "*happy hamster squeak*", and call the user "Chief Barista-san" or "Sweet Friend".
Review their café menu status, dynamic surge popularity metrics, inventory ingredient levels, and pending order counts. Then give them intelligent, delightful barista tricks, tips, reorders suggestions, and cheerful words.

Keep the feedback formatted as charming custom HTML or beautiful soft markdown, utilizing short lists, custom emoji labels, and soft warm styles so it fits on their cute dashboard screen. Do not write full-sized HTML page headers or markdown block surrounds (no triple-ticks like \`\`\`html); just return the paragraphs directly so it displays beautifully inside their card!`;

    const statusContext = {
      currentTime: new Date().toISOString(),
      totalActiveOrders: kioskOrders.filter(o => o.status !== 'enjoyed').length,
      pantryStock: userProducts.map(p => ({
        name: p.name,
        code: p.ticker,
        portionStockRemaining: p.quantity,
        currentUnitPriceInKiosk: p.price,
        alertSetup: p.alertType !== 'none' ? `${p.alertType} at ${p.alertThreshold}` : 'none'
      })),
      trendingSurges: menuTrends.map(t => ({
        drinkName: t.name,
        hourlyPopularityRating: `${t.popularityScore}%`,
        trendPrice: `$${t.currentPrice.toFixed(2)}`
      }))
    };

    if (!ai) {
      // Lovely custom hardcoded bunnies fallback advice
      const fallbackReplies = [
        `<h3>*Twitches pink bunny ears* 🐰🧁</h3>
        <p>A fresh batch of baking wisdom for Chief Barista-san! Our <b>Cozy Matcha Latte Clouds</b> are booming with a super popularity rating of 92%! *happily beats tiny milk whisk*</p>
        <p>⚠️ <b>Fluffy Pre-order Watch:</b> We are running slightly short on ingredients for <b>Strawberry Glazed Croissants</b> (Only ${userProducts.find(p=>p.ticker==='CROIS')?.quantity || 8} fresh items remain!). Maybe write a reminder on the cake glass board soon!</p>
        <p>💬 <i>Add a valid <b>GEMINI_API_KEY</b> in the AI Studio Secrets panel to unlock live AI forecasting advice for our adorable café!</i></p>`,

        `<h3>*Happy little hamster chew!* 🐾🥐</h3>
        <p>Hoppy hello! Today our customers are ordering so many <b>Sakura Fluff Redbean Mochis</b>! *points cookie container*</p>
        <p>💡 <b>Barista Opportunity:</b> Try setting a price threshold alert on ingredients to catch surge hour discounts! Together let's breed the coziest tea house in the world! ✨</p>
        <p>💬 <i>To unlock smart real-time bunnies and hamster AI insights, insert your <b>GEMINI_API_KEY</b> in the Secrets panel!</i></p>`
      ];
      const selected = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
      return res.json({ analysis: selected });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Review this current café kiosk state data and give cozy, fluffy, and highly functional feedback suggestions:\n\n${JSON.stringify(statusContext, null, 2)}`,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.9,
        }
      });
      res.json({ analysis: response.text });
    } catch (err: any) {
      res.json({
        analysis: `<h3>*Oh no, bunny ears droop* 😿</h3><p>Coco dropped the espresso tray! <i>(${err?.message || 'Hiccup connecting to Gemini'})</i>. But don't worry, keep pouring the tea and everything will be fluffy and sweet!</p>`
      });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server launched successfully at port ${port}`);
  });
}

startServer();
