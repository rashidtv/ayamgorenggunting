<template>
  <div class="menu-management">
    <!-- Header -->
    <div class="card-header">
      <h3>🍗 Menu Management</h3>
      <button @click="openMenuModal()" class="btn btn-primary btn-sm">+ New Menu Item</button>
    </div>

    <!-- Table -->
    <div class="card-body table-responsive">
      <table class="data-table menu-table">
        <thead>
          <tr>
            <th class="col-item">Item Name</th>
            <th class="col-price">Price</th>
            <th class="col-category">Category</th>
            <th class="col-recipe">Recipe (BOM)</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in menuItems" :key="item.item_name">
            <td class="col-item"><strong>{{ item.item_name }}</strong></td>
            <td class="col-price">{{ formatCurrency(item.price) }}</td>
            <td class="col-category"><span class="badge-tier">{{ item.category || 'Main' }}</span></td>
            <td class="col-recipe">
              <div class="recipe-chips">
                <span v-for="r in item.recipe" :key="r.material_name" class="recipe-chip">
                  {{ r.material_name }}: 
                  <span v-if="r.material_name === 'Oil'">{{ r.quantity_used }}L</span>
                  <span v-else>{{ r.quantity_used }}g</span>
                </span>
                <span v-if="!item.recipe || item.recipe.length === 0" class="recipe-empty">No recipe</span>
              </div>
            </td>
            <td class="col-actions">
              <div class="action-buttons">
                <button @click="openEditMenuModal(item)" class="btn-icon-sm" title="Edit">✏️</button>
                <button @click="deleteMenuItem(item.item_name)" class="btn-icon-sm danger" title="Delete">🗑️</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="menuItems.length === 0" class="empty-state">
        <span class="empty-icon">🍗</span>
        <p>No menu items created yet</p>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="menuModal" class="modal-overlay" @click.self="closeMenuModal">
      <div class="modal modal-lg">
        <h3>{{ editingMenu ? 'Edit Menu Item' : 'New Menu Item' }}</h3>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>Item Name</label>
              <input v-model="menuForm.item_name" placeholder="e.g. Spicy AGG" :disabled="editingMenu" />
            </div>
            <div class="form-group">
              <label>Price (RM)</label>
              <input type="number" v-model="menuForm.price" placeholder="9.00" step="0.01" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Category</label>
              <select v-model="menuForm.category">
                <option value="Main">Main</option>
                <option value="Side">Side</option>
                <option value="Beverage">Beverage</option>
                <option value="Bundle">Bundle</option>
              </select>
            </div>
            <div class="form-group">
              <label>Description</label>
              <input v-model="menuForm.description" placeholder="Brief description" />
            </div>
          </div>

          <div class="recipe-section">
            <label>Recipe (Bill of Materials)</label>
            <div class="recipe-hint">
              <span class="hint-tag">Chicken, Flour → <strong>grams (g)</strong></span>
              <span class="hint-tag">Oil → <strong>liters (L)</strong></span>
            </div>
            <div v-for="(ing, index) in menuForm.recipe" :key="index" class="recipe-row">
              <select v-model="ing.material_name" class="recipe-select">
                <option value="">Select material</option>
                <option v-for="m in materials" :key="m" :value="m">{{ m }}</option>
              </select>
              <input type="number" v-model="ing.quantity_used" 
                :placeholder="ing.material_name === 'Oil' ? 'liters (L)' : 'grams (g)'" 
                step="0.01" class="recipe-qty" />
              <span class="unit-label">{{ ing.material_name === 'Oil' ? 'L' : 'g' }}</span>
              <button @click="removeRecipeIngredient(index)" class="btn-icon-sm danger">✕</button>
            </div>
            <button @click="addRecipeIngredient" class="btn btn-outline btn-sm">+ Add Ingredient</button>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeMenuModal" class="btn btn-ghost">Cancel</button>
          <button @click="saveMenuItem" class="btn btn-primary">{{ editingMenu ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import API_BASE from '../config/api.js'

export default {
  props: ['token'],
  data() {
    return {
      menuItems: [],
      materials: ['Chicken', 'Flour', 'Oil'],
      menuModal: false,
      editingMenu: false,
      menuForm: {
        item_name: '',
        price: '',
        description: '',
        category: 'Main',
        recipe: [{ material_name: '', quantity_used: '' }]
      }
    }
  },
  mounted() {
    this.loadMenu()
    this.loadMaterials()
  },
  methods: {
    formatCurrency(amount) {
      return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount)
    },
    async loadMenu() {
      try {
        const res = await axios.get(`${API_BASE}/menu`, { headers: { Authorization: `Bearer ${this.token}` } })
        this.menuItems = res.data
      } catch (err) {
        console.error('Failed to load menu:', err)
      }
    },
    async loadMaterials() {
      try {
        const res = await axios.get(`${API_BASE}/materials`, { headers: { Authorization: `Bearer ${this.token}` } })
        if (res.data && res.data.length > 0) {
          this.materials = res.data.filter(m => m !== 'Spices')
        }
      } catch (err) {
        console.error('Failed to load materials:', err)
      }
    },
    openMenuModal() {
      this.editingMenu = false
      this.menuForm = {
        item_name: '',
        price: '',
        description: '',
        category: 'Main',
        recipe: [{ material_name: '', quantity_used: '' }]
      }
      this.menuModal = true
    },
    openEditMenuModal(item) {
      this.editingMenu = true
      this.menuForm = {
        item_name: item.item_name,
        price: item.price,
        description: item.description || '',
        category: item.category || 'Main',
        recipe: item.recipe && item.recipe.length > 0 ? item.recipe : [{ material_name: '', quantity_used: '' }]
      }
      this.menuModal = true
    },
    closeMenuModal() {
      this.menuModal = false
    },
    addRecipeIngredient() {
      this.menuForm.recipe.push({ material_name: '', quantity_used: '' })
    },
    removeRecipeIngredient(index) {
      if (this.menuForm.recipe.length > 1) {
        this.menuForm.recipe.splice(index, 1)
      }
    },
    async saveMenuItem() {
      try {
        const recipe = this.menuForm.recipe.filter(r => r.material_name && r.quantity_used)
        
        if (this.editingMenu) {
          await axios.put(`${API_BASE}/menu/${encodeURIComponent(this.menuForm.item_name)}`, {
            price: parseFloat(this.menuForm.price),
            description: this.menuForm.description,
            category: this.menuForm.category,
            recipe: recipe
          }, { headers: { Authorization: `Bearer ${this.token}` } })
        } else {
          await axios.post(`${API_BASE}/menu`, {
            item_name: this.menuForm.item_name,
            price: parseFloat(this.menuForm.price),
            description: this.menuForm.description,
            category: this.menuForm.category,
            recipe: recipe
          }, { headers: { Authorization: `Bearer ${this.token}` } })
        }
        this.closeMenuModal()
        this.loadMenu()
        this.$emit('show-notification', this.editingMenu ? 'Menu updated' : 'Menu created', 'success')
      } catch (err) {
        this.$emit('show-notification', err.response?.data?.error || 'Operation failed', 'error')
      }
    },
    async deleteMenuItem(itemName) {
      if (confirm(`Are you sure you want to delete "${itemName}"? This will also remove its recipe.`)) {
        try {
          await axios.delete(`${API_BASE}/menu/${encodeURIComponent(itemName)}`, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          this.loadMenu()
          this.$emit('show-notification', `"${itemName}" deleted`, 'success')
        } catch (err) {
          this.$emit('show-notification', 'Failed to delete menu item', 'error')
        }
      }
    }
  }
}
</script>

<style scoped>
.menu-management {
  width: 100%;
}

/* Card Header */
.card-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--background);
}

.card-header h3 {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
}

.card-body {
  padding: 1.25rem;
}

/* Table Styles */
.menu-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.menu-table th {
  text-align: left;
  padding: 0.6rem 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border);
}

.menu-table td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--border-light);
  color: var(--text);
  vertical-align: middle;
}

.menu-table tr:hover td {
  background: var(--background);
}

/* Column Widths */
.col-item { min-width: 140px; }
.col-price { min-width: 80px; }
.col-category { min-width: 100px; }
.col-recipe { min-width: 200px; }
.col-actions { min-width: 80px; text-align: center; }

/* Recipe Chips */
.recipe-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.recipe-chip {
  display: inline-block;
  background: var(--background);
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  border: 1px solid var(--border);
}

.recipe-empty {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-style: italic;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 0.25rem;
}

/* Badge */
.badge-tier {
  background: var(--background);
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  text-transform: capitalize;
}

/* Recipe Hint */
.recipe-hint {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.hint-tag {
  background: var(--background);
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
}

/* Modal */
.modal-lg {
  max-width: 700px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.form-group input,
.form-group select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.9rem;
  background: var(--surface);
  color: var(--text);
}

.recipe-section {
  margin-top: 0.5rem;
}

.recipe-section label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 0.3rem;
}

.recipe-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
  align-items: center;
}

.recipe-select {
  flex: 2;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text);
}

.recipe-qty {
  flex: 1;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  min-width: 80px;
  background: var(--surface);
  color: var(--text);
}

.unit-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 20px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #F94908, #fa6a2e);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(249, 73, 8, 0.3);
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
}

.btn-outline:hover {
  background: var(--background);
}

.btn-sm {
  padding: 0.3rem 0.75rem;
  font-size: 0.75rem;
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}

.btn-ghost:hover {
  background: var(--background);
}

.btn-icon-sm {
  background: transparent;
  border: none;
  padding: 0.2rem 0.4rem;
  cursor: pointer;
  border-radius: 4px;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-icon-sm:hover {
  background: var(--background);
}

.btn-icon-sm.danger {
  color: #ef4444;
}

.btn-icon-sm.danger:hover {
  background: #fee2e2;
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--surface);
  border-radius: 16px;
  padding: 1.5rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-lg {
  max-width: 700px;
}

.modal h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-secondary);
}

.empty-state .empty-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-lg {
    max-width: 95%;
  }
  
  .menu-table {
    font-size: 0.8rem;
  }
  
  .col-item { min-width: 100px; }
  .col-price { min-width: 60px; }
  .col-category { min-width: 70px; }
  .col-recipe { min-width: 120px; }
  .col-actions { min-width: 60px; }
  
  .recipe-row {
    flex-wrap: wrap;
  }
}
</style>