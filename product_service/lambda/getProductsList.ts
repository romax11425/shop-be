export const handler = async () => {

    const products = [
        { id: '1', title: 'Product 1', price: 100 },
        { id: '2', title: 'Product 2', price: 200 },
        { id: '3', title: 'Product 3', price: 300 },
    ]

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "Content-Type"
        },
        body: JSON.stringify(products),
    };
}