const fs = require('fs');
const path = require('path');

const PRODUCTS_DIR = path.join(__dirname, 'images', 'products');
const OUTPUT_FILE = path.join(__dirname, 'data', 'products.json');
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

// Folder naming convention:
//   "cutting-boards--50-200"  →  name: "Cutting Boards", price: "$50 - $200"
//   "goblets--30-80"          →  name: "Goblets", price: "$30 - $80"
//   "vases"                   →  name: "Vases", price: null (no price shown)

function parseFolder(folder) {
  const parts = folder.split('--');
  const name = parts[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  let price = null;

  if (parts[1]) {
    const nums = parts[1].split('-');
    if (nums.length === 2) {
      price = `$${nums[0]} - $${nums[1]}`;
    } else if (nums.length === 1) {
      price = `$${nums[0]}+`;
    }
  }

  return { name, price };
}

function scanProducts() {
  if (!fs.existsSync(PRODUCTS_DIR)) {
    fs.mkdirSync(PRODUCTS_DIR, { recursive: true });
    console.log('Created products directory:', PRODUCTS_DIR);
  }

  const categories = fs.readdirSync(PRODUCTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(dir => {
      const dirPath = path.join(PRODUCTS_DIR, dir.name);
      const images = fs.readdirSync(dirPath)
        .filter(f => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
        .sort();

      const { name, price } = parseFolder(dir.name);

      return {
        id: dir.name,
        name,
        price,
        count: images.length,
        images: images.map(img => `images/products/${dir.name}/${img}`)
      };
    })
    .filter(cat => cat.count > 0);

  return { categories };
}

const data = scanProducts();
fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));

console.log(`products.json → ${data.categories.length} categories, ${data.categories.reduce((s, c) => s + c.count, 0)} images`);
data.categories.forEach(c => console.log(`  ${c.name}${c.price ? ' (' + c.price + ')' : ''}: ${c.count}`));
