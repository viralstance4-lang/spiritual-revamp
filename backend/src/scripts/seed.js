require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');

const connectDB = require('../config/db');

const products = [
  {
    name: 'Golden Abundance Bracelet',
    tagline: 'Magnetize wealth. Rewire your money mindset.',
    description: `The Golden Abundance Bracelet is handcrafted with Citrine, Pyrite, and Green Aventurine — three of the most potent wealth-attracting crystals in ancient Vedic tradition. Worn by thousands who've transformed their financial reality, this bracelet works silently on your subconscious to shift limiting beliefs about money.`,
    category: 'money',
    intention: 'Attract Wealth & Prosperity',
    price: 999,
    comparePrice: 1999,
    images: [
      { url: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800', alt: 'Golden Abundance Bracelet' },
    ],
    benefits: [
      { title: 'Attract Unexpected Wealth', description: 'Citrine is known as the "merchant\'s stone" — it opens channels for money to flow in from unexpected sources.', icon: '💰' },
      { title: 'Destroy Scarcity Mindset', description: 'Pyrite\'s golden energy burns through deep-rooted beliefs of lack and limitation.', icon: '🔥' },
      { title: 'Luck on Your Side', description: 'Green Aventurine, the luckiest crystal, tips the universe\'s favor toward you.', icon: '🍀' },
    ],
    ingredients: ['Citrine', 'Pyrite', 'Green Aventurine', '925 Silver clasp'],
    affirmation: 'I am a magnet for abundance. Money flows to me effortlessly.',
    beforeAfter: {
      before: 'Struggling with bills, feeling stuck in the same income level, watching others succeed',
      after: 'New opportunities appear, money flows more easily, financial anxiety begins to dissolve',
    },
    howToUse: 'Wear on your dominant (giving) hand. Hold the bracelet each morning and set an intention. Cleanse under moonlight on full moon nights.',
    stock: 47,
    isFeatured: true,
    isBestseller: true,
    tags: ['money', 'abundance', 'citrine', 'wealth'],
    seoTitle: 'Golden Abundance Bracelet - Attract Wealth | spiritual-revamp',
    seoDescription: 'Handcrafted Citrine & Pyrite bracelet to attract wealth and destroy scarcity mindset. Free shipping above ₹499.',
  },
  {
    name: 'Black Shield Bracelet',
    tagline: 'Block negative energy. Reclaim your peace.',
    description: `The Black Shield Bracelet harnesses the ancient protective power of Black Tourmaline, Obsidian, and Hematite. These three stones form an impenetrable energetic shield — deflecting toxic people, psychic attacks, and negative frequencies that drain your life force.`,
    category: 'protection',
    intention: 'Shield & Protect Energy',
    price: 899,
    comparePrice: 1799,
    images: [
      { url: 'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=800', alt: 'Black Shield Bracelet' },
    ],
    benefits: [
      { title: 'Psychic Protection 24/7', description: 'Black Tourmaline creates a powerful shield against all forms of negative energy, EMF radiation, and psychic attacks.', icon: '🛡️' },
      { title: 'Absorb & Transmute', description: 'Obsidian, a volcanic glass formed in earth\'s fire, absorbs negativity and transforms it into strength.', icon: '⚫' },
      { title: 'Grounding Presence', description: 'Hematite keeps you rooted in reality, preventing anxiety and overthinking that negative energy causes.', icon: '🌍' },
    ],
    ingredients: ['Black Tourmaline', 'Obsidian', 'Hematite', 'Lava Stone'],
    affirmation: 'I am protected. Only love and light enter my space.',
    beforeAfter: {
      before: 'Absorbing everyone\'s energy, feeling drained after social interactions, anxiety and bad dreams',
      after: 'Strong energetic boundaries, feeling centered and protected, better sleep and mental clarity',
    },
    howToUse: 'Wear on your non-dominant (receiving) hand. Visualize a black protective bubble around you when wearing. Cleanse with sage smoke monthly.',
    stock: 52,
    isFeatured: true,
    isBestseller: false,
    tags: ['protection', 'tourmaline', 'negative energy', 'shield'],
    seoTitle: 'Black Shield Protection Bracelet - Block Negative Energy | spiritual-revamp',
    seoDescription: 'Black Tourmaline & Obsidian protection bracelet. Build energetic shields against toxic people and negative energy.',
  },
  {
    name: 'Rose Love Bracelet',
    tagline: 'Open your heart. Attract your divine love.',
    description: `The Rose Love Bracelet is crafted with Rose Quartz, Rhodonite, and Moonstone — the sacred trinity of love crystals. Whether you seek to heal from heartbreak, deepen an existing relationship, or attract your soulmate, this bracelet works directly with your heart chakra.`,
    category: 'love',
    intention: 'Attract Love & Heal Heart',
    price: 999,
    comparePrice: 1999,
    images: [
      { url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800', alt: 'Rose Love Bracelet' },
    ],
    benefits: [
      { title: 'Open Your Heart Chakra', description: 'Rose Quartz, the ultimate love stone, dissolves emotional walls built from past pain and opens you to receive love.', icon: '💗' },
      { title: 'Heal From the Past', description: 'Rhodonite specializes in healing old wounds, resentment, and abandonment issues that block love from entering.', icon: '🌹' },
      { title: 'Divine Feminine Energy', description: 'Moonstone connects you to the sacred feminine — intuition, mystery, and the magnetic pull that attracts your person.', icon: '🌙' },
    ],
    ingredients: ['Rose Quartz', 'Rhodonite', 'Moonstone', 'Pink Opal'],
    affirmation: 'I am worthy of deep, beautiful love. My heart is open and ready.',
    beforeAfter: {
      before: 'Repeating toxic relationship patterns, fear of vulnerability, feeling unworthy of love',
      after: 'Heart feels lighter, attracting kinder people, deeper self-love and confidence',
    },
    howToUse: 'Wear over your heart chakra (left wrist). Sleep with it under your pillow during new moon. Write your love intentions in a journal while holding it.',
    stock: 38,
    isFeatured: true,
    isBestseller: true,
    tags: ['love', 'rose quartz', 'relationships', 'healing'],
    seoTitle: 'Rose Love Bracelet - Attract Soulmate | spiritual-revamp',
    seoDescription: 'Rose Quartz & Moonstone bracelet for attracting love, healing heartbreak and opening your heart chakra.',
  },
  {
    name: 'Tiger Energy Bracelet',
    tagline: 'Activate your power. Awaken unstoppable energy.',
    description: `The Tiger Energy Bracelet channels the raw power of Tiger's Eye, Carnelian, and Red Jasper — stones of warriors, leaders, and those who refuse to settle for average. If you've been feeling low energy, unmotivated, or disconnected from your purpose, this bracelet is your energetic wake-up call.`,
    category: 'energy',
    intention: 'Boost Energy & Confidence',
    price: 849,
    comparePrice: 1699,
    images: [
      { url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800', alt: 'Tiger Energy Bracelet' },
    ],
    benefits: [
      { title: 'Laser Focus & Clarity', description: 'Tiger\'s Eye cuts through confusion and gives you the mental clarity to see your path forward and take bold action.', icon: '🐯' },
      { title: 'Ignite Passion & Drive', description: 'Carnelian, the stone of motivation, rekindles your inner fire — you\'ll feel energized from the moment you wake up.', icon: '🔥' },
      { title: 'Root Chakra Power', description: 'Red Jasper grounds your energy and gives you the stamina and determination to see things through to completion.', icon: '❤️' },
    ],
    ingredients: ["Tiger's Eye", 'Carnelian', 'Red Jasper', 'Black Onyx'],
    affirmation: 'I am powerful. I have unlimited energy and focus to achieve my goals.',
    beforeAfter: {
      before: 'Chronic fatigue, procrastination, lack of motivation, feeling disconnected from purpose',
      after: 'Natural energy boost, clearer goals, taking action without overthinking, feeling alive',
    },
    howToUse: 'Wear on your dominant hand for maximum energy output. Hold during meditation or before important tasks. Charge in morning sunlight for 10 minutes.',
    stock: 61,
    isFeatured: true,
    isBestseller: false,
    tags: ['energy', 'tigers eye', 'motivation', 'confidence'],
    seoTitle: "Tiger Energy Bracelet - Boost Motivation & Focus | spiritual-revamp",
    seoDescription: "Tiger's Eye & Carnelian bracelet for boosting energy, focus and confidence. Activate your inner power.",
  },
];

async function seed() {
  try {
    await connectDB();
    
    // Drop collection to reset indexes and clear all data
    await Product.collection.drop().catch(() => {});

    // Create products one by one so pre-save hooks generate slugs
    const created = [];
    for (const productData of products) {
      const product = await Product.create(productData);
      created.push(product);
    }
    console.log(`✅ Seeded ${created.length} products`);

    // Set upsells (cross-category recommendations)
    const ids = created.map(p => p._id);
    await Promise.all([
      Product.findByIdAndUpdate(ids[0], { upsells: [ids[1], ids[2]] }), // money → protection + love
      Product.findByIdAndUpdate(ids[1], { upsells: [ids[0], ids[3]] }), // protection → money + energy
      Product.findByIdAndUpdate(ids[2], { upsells: [ids[3], ids[0]] }), // love → energy + money
      Product.findByIdAndUpdate(ids[3], { upsells: [ids[0], ids[1]] }), // energy → money + protection
    ]);
    console.log('✅ Upsells linked');

    // Create admin user
    await User.deleteMany({ role: 'admin' });
    await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@spiritual-revamp.in',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin',
    });
    console.log('✅ Admin user created');

    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
