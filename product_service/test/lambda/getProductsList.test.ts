import { handler } from '../../lambda/getProductsList';

describe('getProductListHandler', () => {
  it('should return a 200 status code and a list of products', async () => {

    // Call the handler
    const response = await handler();

    // Expectations
    expect(response).toBeDefined();
    expect(response.statusCode).toBe(200);
    expect(response.headers).toMatchObject({
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    });

    const body = JSON.parse(response.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('id');
    expect(body[0]).toHaveProperty('title');
    expect(body[0]).toHaveProperty('price');
  });
});