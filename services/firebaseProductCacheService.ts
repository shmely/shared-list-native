import { Unsubscribe } from "firebase/firestore";
import { addProductToCache, subscribeToProductCache, updateProductCacheCategory } from "../data-layer/firebase-layer";
import { GroupId, ProductCacheItem } from "../model/types";




class ListSpecificProductCacheService {
  private caches = new Map<string, Map<string, ProductCacheItem>>();
  private activeListId: string | null = null;
  private unsubscribe: Unsubscribe | null = null;

  setActiveList(listId: string | null): void {
    if (this.activeListId === listId) return;

    // Clean up the old listener before starting a new one
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.activeListId = listId;

    if (listId) {
      console.log(`Activating product cache for list: ${listId}`);
      this.unsubscribe = subscribeToProductCache(listId, (products) => {
        const newCache = new Map(products.map(p => [p.id, p]));
        this.caches.set(listId, newCache);
        console.log(`Cache for list ${listId} synced. Contains ${newCache.size} items.`);
      });
    }
  }

  private getActiveCache(): Map<string, ProductCacheItem> | null {
    if (!this.activeListId) return null;
    return this.caches.get(this.activeListId) || null;
  }

  async addProduct(name: string, groupId: GroupId): Promise<void> {
    if (!this.activeListId) return;
    const normalizedName = this.normalizeName(name);
    const trimmedName = name.trim();
    await addProductToCache(this.activeListId, normalizedName, trimmedName, groupId);
  }

  async updateProductCategory(productId: string, newGroupId: GroupId): Promise<void> {
    if (!this.activeListId) return;
    await updateProductCacheCategory(this.activeListId, productId, newGroupId);
  }

  searchSimilar(searchText: string): ProductCacheItem | null {
    const cache = this.getActiveCache();
    if (!cache) return null;

    const normalizedSearch = this.normalizeName(searchText);
    if (cache.has(normalizedSearch)) {
      return cache.get(normalizedSearch)!;
    }
    for (const [key, product] of cache.entries()) {
      if (key.includes(normalizedSearch) || normalizedSearch.includes(key)) {
        return product;
      }
    }
    return null;
  }

  getSuggestions(input: string, limit = 5): string[] {
    const cache = this.getActiveCache();
    if (!cache) return [];

    const normalizedInput = this.normalizeName(input);
    if (normalizedInput.length < 2) return [];

    const suggestions: string[] = [];
    for (const product of cache.values()) {
      if (this.normalizeName(product.name).includes(normalizedInput)) {
        suggestions.push(product.name);
        if (suggestions.length >= limit) break;
      }
    }
    return suggestions.sort((a, b) => a.length - b.length);
  }


  private normalizeName(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
  }
}
export const FirebaseProductCacheService = new ListSpecificProductCacheService();


//   /**
//    * Initializes the service by subscribing to real-time updates from Firestore.
//    * This should be called once when the application starts.
//    */
//   // initialize(): void {
//   //   if (this.unsubscribe) {
//   //     console.log("ProductCacheService already initialized.");
//   //     return;
//   //   }
//   //   console.log("Initializing ProductCacheService...");
//   //   this.unsubscribe = subscribeToProductCache((products) => {
//   //     // Rebuild the Map whenever the cache updates in Firebase
//   //     this.cache = new Map(products.map(p => [p.id, p]));
//   //     console.log(`Product cache synced. Contains ${this.cache.size} items.`);
//   //   });
//   // }

//   // /**
//   //  * Disconnects the real-time listener. Call this when the app is closing.
//   //  */
//   // cleanup(): void {
//   //   if (this.unsubscribe) {
//   //     this.unsubscribe();
//   //     this.unsubscribe = null;
//   //   }
//   // }

//   /**
//    * Adds a new product to the Firebase cache.
//    * The local cache will update automatically via the real-time listener.
//    * @param name The name of the product.
//    * @param groupId The category ID for the product.
//    */
//   async addProduct(name: string, groupId: GroupId): Promise < void> {
//   const normalizedName = this.normalizeName(name);
//   const trimmedName = name.trim();

//   // Optimistically update local cache for instant UI feedback
//   this.cache.set(normalizedName, {
//     id: normalizedName,
//     name: trimmedName,
//     groupId,
//     addedAt: Date.now()
//   });

//   try {
//     await addProductToCache(normalizedName, trimmedName, groupId);
//   } catch(error) {
//     console.error("Failed to add product to Firebase cache:", error);
//     // Note: The real-time listener will eventually correct any optimistic update failure.
//   }
// }

// /**
//  * Searches for a product by name, trying an exact match first, then a partial match.
//  * @param searchText The text to search for.
//  * @returns A matching ProductCacheItem or null.
//  */
// searchSimilar(searchText: string): ProductCacheItem | null {
//   const normalizedSearch = this.normalizeName(searchText);

//   // First, try exact match (very fast)
//   if (this.cache.has(normalizedSearch)) {
//     return this.cache.get(normalizedSearch)!;
//   }

//   // Then, try partial matches
//   for (const [key, product] of this.cache.entries()) {
//     if (key.includes(normalizedSearch) || normalizedSearch.includes(key)) {
//       return product;
//     }
//   }
//   return null;
// }

// /**
//  * Gets suggestions for autocomplete based on partial input.
//  * @param input The partial text from the user.
//  * @param limit The maximum number of suggestions to return.
//  * @returns An array of product names.
//  */
// getSuggestions(input: string, limit = 5): string[] {
//   const normalizedInput = this.normalizeName(input);
//   if (normalizedInput.length < 2) return [];

//   const suggestions: string[] = [];
//   for (const product of this.cache.values()) {
//     if (this.normalizeName(product.name).includes(normalizedInput)) {
//       suggestions.push(product.name);
//       if (suggestions.length >= limit) {
//         break; // Stop once we have enough suggestions
//       }
//     }
//   }
//   return suggestions.sort((a, b) => a.length - b.length); // Prefer shorter matches
// }

//   async updateProductCategory(productId: string, newGroupId: GroupId): Promise < void> {
//   try {
//     await updateProductCacheCategory(productId, newGroupId);
//   } catch(error) {
//     console.error(`Failed to update category for product ${productId}:`, error);
//   }
// }

//   private normalizeName(name: string): string {
//   return name.toLowerCase().trim().replace(/\s+/g, ' ');
// }
// }

// // Export a singleton instance of the service
// export const FirebaseProductCacheService = new ProductCacheService();