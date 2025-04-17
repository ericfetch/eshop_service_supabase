import "jsr:@supabase/functions-js/edge-runtime.d.ts";
Deno.serve(async (req)=>{
  const products = [
    {
      id: 1,
      name: "Product A",
      price: 100
    },
    {
      id: 2,
      name: "Product B",
      price: 150
    },
    {
      id: 3,
      name: "Product C",
      price: 200
    }
  ];
  return new Response(JSON.stringify({success: true, products}), {
    headers: {
      'Content-Type': 'application/json',
      'Connection': 'keep-alive',
      // 'access-control-allow-origin': '*',
      // 'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      // 'access-control-allow-headers': 'Content-Type, Authorization, X-Requested-With'
    }
  });
});
