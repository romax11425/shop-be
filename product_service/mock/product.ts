import { Product } from "../model/product";

export const productsData: Omit<Product, 'id'>[] = [
    {
        title: 'Product 1',
        description: 'Product 1 description',
        price: 20
    },
    {
        title: 'Product 2',
        description: 'Product 2 description',
        price: 200
    },
    {
        title: 'Product 3',
        description: 'Product 3 description',
        price: 60
    },
    {
        title: 'Product 4',
        description: 'Product 4 description',
        price: 49
    },
    {
        title: 'Product 5',
        description: 'Product 5 description',
        price: 10
    }
];