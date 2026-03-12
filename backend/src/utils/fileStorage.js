const fs = require('fs').promises;
const path = require('path');

class FileStorage {
  constructor(dataDir = path.join(__dirname, '../../data')) {
    this.dataDir = dataDir;
    this.files = {
      users: path.join(dataDir, 'users.json'),
      applications: path.join(dataDir, 'applications.json'),
      documents: path.join(dataDir, 'documents.json'),
      analyses: path.join(dataDir, 'analyses.json'),
      decisions: path.join(dataDir, 'decisions.json'),
      auditLog: path.join(dataDir, 'audit_log.json')
    };
  }

  async ensureDataDir() {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  async read(fileKey) {
    try {
      await this.ensureDataDir();
      const filePath = this.files[fileKey];
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async write(fileKey, data) {
    try {
      await this.ensureDataDir();
      const filePath = this.files[fileKey];
      
      // Create backup before writing
      try {
        await fs.access(filePath);
        const backupPath = `${filePath}.backup`;
        await fs.copyFile(filePath, backupPath);
      } catch {
        // No existing file to backup
      }

      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`Error writing to ${fileKey}:`, error);
      throw error;
    }
  }

  async append(fileKey, item) {
    const data = await this.read(fileKey);
    data.push(item);
    await this.write(fileKey, data);
    return item;
  }

  async update(fileKey, id, updates) {
    const data = await this.read(fileKey);
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error(`Item with id ${id} not found in ${fileKey}`);
    }

    const oldItem = { ...data[index] };
    data[index] = { ...data[index], ...updates, updated_at: new Date().toISOString() };
    await this.write(fileKey, data);
    
    return { old: oldItem, new: data[index] };
  }

  async delete(fileKey, id) {
    const data = await this.read(fileKey);
    const filtered = data.filter(item => item.id !== id);
    
    if (filtered.length === data.length) {
      throw new Error(`Item with id ${id} not found in ${fileKey}`);
    }

    await this.write(fileKey, filtered);
    return true;
  }

  async findById(fileKey, id) {
    const data = await this.read(fileKey);
    return data.find(item => item.id === id);
  }

  async findOne(fileKey, predicate) {
    const data = await this.read(fileKey);
    return data.find(predicate);
  }

  async findMany(fileKey, predicate) {
    const data = await this.read(fileKey);
    return predicate ? data.filter(predicate) : data;
  }

  async initialize() {
    await this.ensureDataDir();
    
    // Initialize empty files if they don't exist
    for (const [key, filePath] of Object.entries(this.files)) {
      try {
        await fs.access(filePath);
      } catch {
        await fs.writeFile(filePath, '[]', 'utf8');
        console.log(`Initialized ${key}.json`);
      }
    }
  }
}

module.exports = new FileStorage();

// Made with Bob
