const Database = require('better-sqlite3');
const path = require('path');

console.log('🔍 Checking database...');

try {
  const dbPath = path.join(__dirname, 'agg_mvp.db');
  const db = new Database(dbPath);

  console.log('✅ Database connection successful');

  // Check tables
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    ORDER BY name
  `).all();

  console.log('\n📊 Database Tables:');
  tables.forEach(table => {
    console.log(`   📁 ${table.name}`);
  });

  // Check users
  const users = db.prepare('SELECT username, role, stall_id FROM users').all();
  console.log('\n👥 Users:');
  users.forEach(user => {
    console.log(`   👤 ${user.username} (${user.role}) - Stall: ${user.stall_id || 'N/A'}`);
  });

  // Check inventory
  const inventory = db.prepare(`
    SELECT stall_id, material_name, current_level, alert_level 
    FROM inventory 
    ORDER BY stall_id, material_name
  `).all();

  console.log('\n📦 Inventory:');
  inventory.forEach(item => {
    const status = item.current_level <= item.alert_level ? '⚠️ LOW' : '✅ OK';
    console.log(`   Stall ${item.stall_id}: ${item.material_name} - ${item.current_level}kg (Alert: ${item.alert_level}kg) [${status}]`);
  });

  // Check recipes
  const recipes = db.prepare(`
    SELECT item_name, material_name, quantity_used 
    FROM recipes 
    ORDER BY item_name, material_name
  `).all();

  console.log('\n📝 Recipes:');
  const items = {};
  recipes.forEach(recipe => {
    if (!items[recipe.item_name]) {
      items[recipe.item_name] = [];
    }
    items[recipe.item_name].push(`${recipe.material_name} (${recipe.quantity_used}kg)`);
  });

  Object.keys(items).forEach(itemName => {
    console.log(`   🍗 ${itemName}: ${items[itemName].join(', ')}`);
  });

  db.close();
  console.log('\n🎉 Database check completed successfully!');

} catch (error) {
  console.error('❌ Database check failed:', error.message);
}