/// <reference types="https://deno.land/std@0.168.0/http/server.ts" />
/// <reference types="https://esm.sh/@supabase/supabase-js@2" />

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
    const { actionType, id, title, name, type, parent_id, query_type } = await req.json()

    switch (actionType) {
      case 'query':
        // 查询类目，支持嵌套结构
        if (query_type === 'nested') {
          // 查询一级类目
          const { data: primaryCategories, error: primaryError } = await supabaseClient
            .from('category')
            .select('*')
            .eq('type', 1)
            .order('created_at', { ascending: true })

          if (primaryError) throw primaryError

          // 为每个一级类目查询子类目
          const categoriesWithChildren = await Promise.all(
            primaryCategories.map(async (category) => {
              const { data: subCategories, error: subError } = await supabaseClient
                .from('category')
                .select('*')
                .eq('type', 2)
                .eq('parent_id', category.id)
                .order('created_at', { ascending: true })

              if (subError) throw subError

              return {
                ...category,
                children: subCategories || []
              }
            })
          )

          return new Response(JSON.stringify(categoriesWithChildren), { 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          })
        } else if (query_type === 'flat') {
          // 平铺查询所有类目
          const { data: categories, error } = await supabaseClient
            .from('category')
            .select('*')
            .order('type', { ascending: true })
            .order('created_at', { ascending: true })

          if (error) throw error

          return new Response(JSON.stringify(categories), { 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          })
        } else {
          return new Response(JSON.stringify({ 
            error: '无效的查询类型，支持 "nested" 和 "flat"' 
          }), { 
            status: 400, 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          })
        }

      case 'create':
        // 创建类目
        if (type === 2 && !parent_id) {
          return new Response(JSON.stringify({ 
            error: '二级类目必须指定父级类目ID' 
          }), { 
            status: 400, 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          })
        }

        const { data: createData, error: createError } = await supabaseClient
          .from('category')
          .insert({
            title,
            name,
            type,
            ...(parent_id && { parent_id })
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
        // 更新类目
        if (!id) {
          return new Response(JSON.stringify({ 
            error: '更新操作必须提供类目ID' 
          }), { 
            status: 400, 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          })
        }

        const { data: updateData, error: updateError } = await supabaseClient
          .from('category')
          .update({
            ...(title && { title }),
            ...(name && { name }),
            ...(type && { type }),
            ...(parent_id && { parent_id })
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
        // 删除类目
        if (!id) {
          return new Response(JSON.stringify({ 
            error: '删除操作必须提供类目ID' 
          }), { 
            status: 400, 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          })
        }

        // 检查是否有子类目
        const { data: subCategories, error: subError } = await supabaseClient
          .from('category')
          .select('id')
          .eq('parent_id', id)

        if (subError) throw subError
        if (subCategories.length > 0) {
          return new Response(JSON.stringify({ 
            error: '不能删除包含子类目的类目' 
          }), { 
            status: 400, 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          })
        }

        const { error: deleteError } = await supabaseClient
          .from('category')
          .delete()
          .eq('id', id)

        if (deleteError) throw deleteError
        return new Response(JSON.stringify({ 
          message: '类目删除成功' 
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
