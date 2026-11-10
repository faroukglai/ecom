import type { ProductMediaItem } from "@/components/dashboard/product-images";

const DB_NAME = "darivo-dashboard-drafts";
const STORE_NAME = "products";

export type ProductDraft = {
  key: string;
  updatedAt: number;
  fields: Record<string, string>;
  images: Array<{ id: string; remote?: string; file?: File }>;
};

function openDraftDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore, resolve: (value: T) => void, reject: (error: unknown) => void) => void): Promise<T> {
  const db = await openDraftDb();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => { db.close(); reject(transaction.error); };
    run(store, resolve, reject);
  });
}

export function readProductDraft(key: string) {
  return withStore<ProductDraft | undefined>("readonly", (store, resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result as ProductDraft | undefined);
    request.onerror = () => reject(request.error);
  });
}

export function writeProductDraft(draft: ProductDraft) {
  return openDraftDb().then((db) => new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(draft);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
    transaction.onabort = () => { db.close(); reject(transaction.error); };
  }));
}

export function removeProductDraft(key: string) {
  return openDraftDb().then((db) => new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(key);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
    transaction.onabort = () => { db.close(); reject(transaction.error); };
  }));
}

export function draftImages(images: ProductMediaItem[]): ProductDraft["images"] {
  return images.map((image) => ({ id: image.id, ...(image.file ? { file: image.file } : { remote: image.remote || image.src }) }));
}

export function restoreDraftImages(images: ProductDraft["images"]): ProductMediaItem[] {
  return images.flatMap<ProductMediaItem>((image) => {
    if (image.file) return [{ id: image.id, file: image.file, src: URL.createObjectURL(image.file) }];
    if (image.remote) return [{ id: image.id, remote: image.remote, src: image.remote }];
    return [];
  });
}
