import { IncomingMessage, ServerResponse } from 'http';
import { handleRequest } from '../src/router';
import fetch from 'node-fetch';
import { cacheInstance } from '../src/cache';

jest.mock('node-fetch');
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Router', () => {
  let req: Partial<IncomingMessage>;
  let res: Partial<ServerResponse>;
  let mockEnd: jest.Mock;
  let mockWriteHead: jest.Mock;
  let mockSetHeader: jest.Mock;

  beforeEach(() => {
    mockEnd = jest.fn();
    mockWriteHead = jest.fn();
    mockSetHeader = jest.fn();
    
    req = {
      url: 'http://localhost:3000/product',
      method: 'GET',
      headers: { host: 'localhost:3000' }
    };
    
    res = {
      end: mockEnd,
      writeHead: mockWriteHead,
      setHeader: mockSetHeader,
      statusCode: 200
    };

    cacheInstance.clear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should return 400 when service name is not provided', async () => {
    req.url = 'http://localhost:3000/';
    
    await handleRequest(req as IncomingMessage, res as ServerResponse);
    
    expect(res.statusCode).toBe(400);
    expect(mockEnd).toHaveBeenCalledWith(JSON.stringify({ error: 'Service name not provided' }));
  });

  test('should return 502 when service is not found', async () => {
    req.url = 'http://localhost:3000/unknown-service';
    
    await handleRequest(req as IncomingMessage, res as ServerResponse);
    
    expect(mockWriteHead).toHaveBeenCalledWith(502, { 'Content-Type': 'application/json' });
    expect(mockEnd).toHaveBeenCalledWith(JSON.stringify({ message: 'Cannot process request' }));
  });

  test('should cache product list response', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ products: [] }),
      headers: new Map(),
      status: 200
    };
    
    mockedFetch.mockResolvedValueOnce(mockResponse as any);
    
    await handleRequest(req as IncomingMessage, res as ServerResponse);
    
    expect(mockSetHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
    
    // Second request should hit cache
    await handleRequest(req as IncomingMessage, res as ServerResponse);
    
    expect(mockSetHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
  });

  test('should forward non-product requests', async () => {
    req.url = 'http://localhost:3000/cart/items';
    const mockResponse = {
      ok: true,
      body: { pipe: jest.fn() },
      headers: new Map(),
      status: 200
    };
    
    mockedFetch.mockResolvedValueOnce(mockResponse as any);
    
    await handleRequest(req as IncomingMessage, res as ServerResponse);
    
    expect(mockedFetch).toHaveBeenCalled();
    expect(mockResponse.body.pipe).toHaveBeenCalled();
   
describe('Cache', () => {
  it('should expire after 2 minutes', async () => {
    const cache = new Cache<string>();
    cache.set('test', 'value');
    jest.advanceTimersByTime(2 * 60 * 1000);
    expect(cache.get('test')).toBeNull();
  });
});
