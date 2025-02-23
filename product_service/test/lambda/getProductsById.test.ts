import { handler } from '../../lambda/getProductsById';

describe('getProductByIdHandler', () => {
  it('should return with the correct product', async () => {
    const mockEvent = {
      pathParameters: { productId: "1" },
    };

    const response = await handler(mockEvent);

    expect(response).toBeDefined();
    expect(response.statusCode).toBe(200);
    expect(response.headers).toMatchObject({
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    });

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('id', "1");
    expect(body).toHaveProperty('title', "Product 1");
  });

  it('should return with the product is not found', async () => {
    const mockEvent = {
      pathParameters: { productId: "999" },
    };

    const response = await handler(mockEvent);

    expect(response).toBeDefined();
    expect(response.statusCode).toBe(404);
    expect(response.headers).toMatchObject({
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    });

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('message', 'Product not found');
  });
});