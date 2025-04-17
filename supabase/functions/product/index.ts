import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { supabaseClient } from '../shared/supabase.ts'
import { corsHeaders } from '../shared/cors.ts'

serve(async (req) => {
  // 处理 CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname.split('/').filter(Boolean)
    const method = req.method
    
    // 提取路径参数
    const isProductsEndpoint = path[0] === 'products'
    const productId = path[1]
    const action = path[2]
    
    // 如果不是产品 API 端点，返回 404
    if (!isProductsEndpoint) {
      return new Response(
        JSON.stringify({ error: '未找到资源' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // 根据 HTTP 方法和路径参数处理请求
    if (method === 'GET') {
      // 获取单个产品
      if (productId && !action) {
        const { data, error } = await supabaseClient
          .from('product')
          .select('*')
          .eq('id', productId)
          .single()
        
        if (error) throw error
        
        if (!data) {
          return new Response(
            JSON.stringify({ error: '未找到产品' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // 按类别筛选产品
      if (action === 'category' && productId) {
        const { data, error } = await supabaseClient
          .from('product')
          .select('*')
          .contains('category', [productId])
        
        if (error) throw error
        
        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // 搜索产品
      if (action === 'search') {
        const query = url.searchParams.get('query') || ''
        
        const { data, error } = await supabaseClient
          .from('product')
          .select('*')
          .ilike('title', `%${query}%`)
        
        if (error) throw error
        
        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // 分页获取产品
      if (action === 'page') {
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '10')
        const from = (page - 1) * limit
        const to = page * limit - 1
        
        const { data, error, count } = await supabaseClient
          .from('product')
          .select('*', { count: 'exact' })
          .range(from, to)
        
        if (error) throw error
        
        return new Response(
          JSON.stringify({
            success: true,
            count,
            totalPages: Math.ceil((count || 0) / limit),
            currentPage: page,
            data
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // 获取所有产品
      const { data, error, count } = await supabaseClient
        .from('product')
        .select('*', { count: 'exact' })
      
      if (error) throw error
      
      return new Response(
        JSON.stringify({ success: true, count, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // 创建产品
    if (method === 'POST' && !productId) {
      const body = await req.json()
      const { title, price, disPrice, images, detail, category } = body
      
      const { data, error } = await supabaseClient
        .from('product')
        .insert([{ title, price, disPrice, images, detail, category }])
        .select()
      
      if (error) throw error
      
      return new Response(
        JSON.stringify({ success: true, data: data[0] }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // 更新产品
    if (method === 'PUT' && productId) {
      const body = await req.json()
      const { title, price, disPrice, images, detail, category } = body
      
      const { data, error } = await supabaseClient
        .from('product')
        .update({ title, price, disPrice, images, detail, category })
        .eq('id', productId)
        .select()
      
      if (error) throw error
      
      if (data.length === 0) {
        return new Response(
          JSON.stringify({ error: '未找到产品' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({ success: true, data: data[0] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // 删除产品
    if (method === 'DELETE' && productId) {
      const { error } = await supabaseClient
        .from('product')
        .delete()
        .eq('id', productId)
      
      if (error) throw error
      
      return new Response(
        JSON.stringify({ success: true, message: '产品已成功删除' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // 如果没有匹配的路由，返回 404
    return new Response(
      JSON.stringify({ error: '未找到资源' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
