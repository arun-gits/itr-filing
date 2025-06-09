import { ITRData } from './schemas/itr';

const STORAGE_KEY = 'itr-data';
const AUTO_SAVE_INTERVAL = 5000; // 5 seconds

export class ITRStorage {
  private static instance: ITRStorage;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private listeners: Set<(data: Partial<ITRData>) => void> = new Set();

  static getInstance(): ITRStorage {
    if (!ITRStorage.instance) {
      ITRStorage.instance = new ITRStorage();
    }
    return ITRStorage.instance;
  }

  // Save data to localStorage
  save(data: Partial<ITRData>): void {
    try {
      const existingData = this.load();
      const mergedData = { ...existingData, ...data };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedData));
      this.notifyListeners(mergedData);
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  // Load data from localStorage
  load(): Partial<ITRData> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to load data:', error);
      return {};
    }
  }

  // Auto-save functionality
  autoSave(data: Partial<ITRData>): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    this.autoSaveTimer = setTimeout(() => {
      this.save(data);
    }, AUTO_SAVE_INTERVAL);
  }

  // Clear all data
  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      this.notifyListeners({});
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }

  // Subscribe to data changes
  subscribe(callback: (data: Partial<ITRData>) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notify all listeners of data changes
  private notifyListeners(data: Partial<ITRData>): void {
    this.listeners.forEach(callback => callback(data));
  }

  // Export data for backup
  export(): string {
    const data = this.load();
    return JSON.stringify(data, null, 2);
  }

  // Import data from backup
  import(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      this.save(data);
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  // Check if data exists
  hasData(): boolean {
    const data = this.load();
    return Object.keys(data).length > 0;
  }

  // Get completion status of each section
  getCompletionStatus(): {
    personalDetails: boolean;
    incomeDetails: boolean;
    deductions: boolean;
    taxSummary: boolean;
  } {
    const data = this.load();
    return {
      personalDetails: !!data.personalDetails,
      incomeDetails: !!data.incomeDetails,
      deductions: !!data.deductions,
      taxSummary: !!data.taxSummary,
    };
  }
}

export const storage = ITRStorage.getInstance();