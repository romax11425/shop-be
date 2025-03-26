import { handler } from '../../lambda/createProduct';

describe('createProduct Lambda', () => {
  const product = {
    title: 'Test product',
    description: 'Test description',
    price: 80
  };
  const stock = {
    count: 10
  };

  it('should successfully create a product', async () => {
    const newProduct = {
      ...product,
      ...stock
    };

    const event = {
      body: JSON.stringify(newProduct)
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual("Product created successfully");
  });

  it('should return 400 for invalid product data', async () => {
    const mockProduct = {
      title: 'Test Product',
    };

    const event = {
      body: JSON.stringify(mockProduct)
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toHaveProperty('message', 'Invalid request');
  });
});