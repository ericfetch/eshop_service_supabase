import "jsr:@supabase/functions-js/edge-runtime.d.ts";
Deno.serve(async (req)=>{
  const url = new URL(req.url);
  const productId = url.searchParams.get("id");
  const products = {
    1: {
      id: 1,
      title: "Product A",
      images: [
        "https://example.com/images/product-a1.jpg",
        "https://example.com/images/product-a2.jpg"
      ],
      soldQuantity: 50,
      originalPrice: 200,
      discountedPrice: 150,
      stock: 100,
      description: "This is a detailed description of Product A."
    },
    2: {
      id: 2,
      title: "Product B",
      images: [
        "https://example.com/images/product-b1.jpg",
        "https://example.com/images/product-b2.jpg"
      ],
      soldQuantity: 30,
      originalPrice: 300,
      discountedPrice: 250,
      stock: 50,
      description: "This is a detailed description of Product B."
    },
    3: {
      id: 3,
      title: "Product C",
      images: [
        "https://example.com/images/product-c1.jpg",
        "https://example.com/images/product-c2.jpg"
      ],
      soldQuantity: 20,
      originalPrice: 400,
      discountedPrice: 350,
      stock: 25,
      description: "This is a detailed description of Product C."
    }
  };
  const product = products[productId];
  if (!product) {
    return new Response(JSON.stringify({
      error: "Product not found"
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  return new Response(JSON.stringify(product), {
    headers: {
      'Content-Type': 'application/json',
      'Connection': 'keep-alive'
    }
  });
});
