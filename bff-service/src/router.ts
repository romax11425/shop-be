import { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import fetch from 'node-fetch';
import { getServiceUrl, serviceUrls } from './config';
import { cacheInstance } from './cache';

export async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  try {
    if (!req.url) {
      throw new Error('No URL provided');
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const serviceName = url.pathname.split('/')[1];

    if (!serviceName) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Service name not provided' }));
    }

    if (!serviceUrls[serviceName]) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ message: 'Cannot process request' }));
    }

    // Handle caching for products list
    if (serviceName === 'product' && url.pathname.includes('getProductsList')) {
      const cachedData = cacheInstance.get(req.url);
      if (cachedData) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(cachedData));
      }
    }

    const serviceUrl = getServiceUrl(serviceName);
    const targetUrl = `${serviceUrl}${url.pathname.replace(`/${serviceName}`, '')}${url.search}`;

    const response = await fetch(targetUrl, {
      method: req.method || 'GET',
      headers: req.headers as Record<string, string>,
      body: ['GET', 'HEAD'].includes(req.method || 'GET') ? undefined : req
    });

    // Handle caching for successful product list responses
    if (serviceName === 'product' && 
        url.pathname.includes('getProductsList') && 
        response.ok) {
      const data = await response.json();
      cacheInstance.set(req.url, data);
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(data));
    }

    // Forward response headers
    for (const [key, value] of Object.entries(response.headers.raw())) {
      res.setHeader(key, value);
    }

    res.statusCode = response.status;

    if (response.body) {
      response.body.pipe(res);
    } else {
      res.end();
    }

  } catch (error) {
    console.error('Error handling request:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
}
