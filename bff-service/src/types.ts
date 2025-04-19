export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface CacheOptions {
  ttl: number;
}

export interface ServiceConfig {
  [key: string]: string;
}

export interface RequestError extends Error {
  statusCode: number;
}

export interface CacheItem<T> {
  data: T;
  timestamp: number;
}