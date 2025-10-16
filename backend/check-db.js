const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

async function checkDatabase() {
  try {
    const db = await open({
      filename: path.join(__dirname, 'agg_mvp.db'),
      driver: sqlite3.Database
    });

    console.log('🔍 Checking database contents...\n');

    // Check users
    const users = await db.all('SELECT * FROM users');
    console.log('👥 Users:', users.length);
    users.forEach(user => console.log(`   - ${user.username} (${user.role})`));

    // Check inventory
    const inventory = await db.all('SELECT * FROM inventory ORDER BY stall_id, material_name');
    console.log('\n📦 Inventory items:', inventory.length);
    inventory.forEach(item => console.log(`   - Stall ${item.stall_id}: ${item.material_name} (${item.current_level}kg)`));

    // Check recipes
    const recipes = await db.all('SELECT * FROM recipes ORDER BY item_name, material_name');
    console.log('\n📋 Recipes:', recipes.length);
    recipes.forEach(recipe => console.log(`   - ${recipe.item_name}: ${recipe.material_name} (${recipe.quantity_used}kg)`));

    // Check sales
    const sales = await db.all('SELECT * FROM sales ORDER BY created_at DESC LIMIT 5');
    console.log('\n💰 Recent sales:', sales.length);
    sales.forEach(sale => console.log(`   - ${sale.item_name} at Stall ${sale.stall_id} for RM ${sale.price}`));

    await db.close();
    console.log('\n✅ Database check completed!');

  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

checkDatabase();