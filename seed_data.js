const db = require('./db.js');

const initialProducts = [
  {
    name: "MacBook Pro M3",
    description: "The latest Apple Silicon MacBook Pro with M3 chip, 16GB RAM, 512GB SSD.",
    price: 1999.99,
    image_url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "Sony WH-1000XM5",
    description: "Industry leading noise canceling headphones.",
    price: 349.99,
    image_url: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    description: "Android flagship with S-Pen, amazing camera and titanium body.",
    price: 1299.99,
    image_url: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "Logitech MX Master 3S",
    description: "Advanced wireless mouse with ergonomic design.",
    price: 99.99,
    image_url: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=400&q=80"
  }
];

async function seedProducts() {
  try {
    await db.init();
    const query = db.getQuery();

    console.log("Checking for existing products...");
    const [existing] = await query('SELECT COUNT(*) as count FROM products');
    
    if (parseInt(existing[0].count) > 0) {
      console.log('Products already exist. Skipping seed.');
    } else {
      console.log(`Seeding ${initialProducts.length} initial products...`);
      for (const product of initialProducts) {
        await query(
          'INSERT INTO products (name, description, price, image_url) VALUES ($1, $2, $3, $4)',
          [product.name, product.description, product.price, product.image_url]
        );
        console.log(`- Added: ${product.name}`);
      }
      console.log('Product seeding complete.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();
