import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { supabaseClient } from '../shared/supabase.ts'
import { corsHeaders } from '../shared/cors.ts'

serve(async (req) => {
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400', // 缓存预检请求24小时
      }
    })
  }

  // 只接受 POST 请求
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405,
      headers: corsHeaders 
    })
  }

  try {
    const { actionType, id, title, price, disPrice, detail, images, category } = await req.json()

    switch (actionType) {
      case 'query':
        // 查询所有产品，按创建时间倒序排序
        const { data: products, error } = await supabaseClient
          .from('product')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        return new Response(JSON.stringify(products), { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        })

      case 'create':
        // 创建产品
        if (!title) {
          return new Response(JSON.stringify({ 
            error: '产品标题不能为空' 
          }), { 
            status: 400, 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          })
        }

        if (price === undefined) {
          return new Response(JSON.stringify({ 
            error: '产品价格不能为空' 
          }), { 
            status: 400, 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          })
        }

        if (!category) {
          return new Response(JSON.stringify({ 
            error: '产品分类不能为空' 
          }), { 
            status: 400, 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          })
        }

        const { data: createData, error: createError } = await supabaseClient
          .from('product')
          .insert({
            title,
            price,
            ...(disPrice !== undefined && { disPrice }),
            ...(detail && { detail }),
            ...(images && { images }), // images为json字符串
            category
          })
          .select()

        if (createError) throw createError
        return new Response(JSON.stringify(createData[0]), { 
          status: 201, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        })

      case 'update':
        // 更新产品
        if (!id) {
          return new Response(JSON.stringify({ 
            error: '更新操作必须提供产品ID' 
          }), { 
            status: 400, 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          })
        }

        const { data: updateData, error: updateError } = await supabaseClient
          .from('product')
          .update({
            ...(title && { title }),
            ...(price !== undefined && { price }),
            ...(disPrice !== undefined && { disPrice }),
            ...(detail && { detail }),
            ...(images && { images }),
            ...(category && { category })
          })
          .eq('id', id)
          .select()

        if (updateError) throw updateError
        return new Response(JSON.stringify(updateData[0]), { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        })

      case 'delete':
        // 删除产品
        if (!id) {
          return new Response(JSON.stringify({ 
            error: '删除操作必须提供产品ID' 
          }), { 
            status: 400, 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          })
        }

        const { error: deleteError } = await supabaseClient
          .from('product')
          .delete()
          .eq('id', id)

        if (deleteError) throw deleteError
        return new Response(JSON.stringify({ 
          message: '产品删除成功' 
        }), { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        })

      default:
        return new Response(JSON.stringify({ 
          error: '无效的操作类型' 
        }), { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        })
    }
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500, 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      } 
    })
  }
})