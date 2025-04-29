import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../shared/cors.ts'  // 复用 CORS 配置
import { supabaseClient } from "../shared/supabase.ts"

serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const { method } = req
  let result

  try {
    switch (method) {
      case 'GET':
        
        const url = new URL(req.url);
        const userId = url.pathname.split('/').pop(); 
        console.log('用户id:',userId)
        if (!userId) {
          throw new Error('User ID is required')
        }


        const { data: readData, error: readError } = await supabaseClient
          .from('user_expansion')
          .select('*')
          .eq('userId', userId)
          .single()
        console.log('读表错误：',readError)
        if (readError) throw readError
        console.log('读到数据：',readData)
        result = readData
        break

      case 'POST':
        const body = await req.json()
        
        if (!body.userId) {
          throw new Error('User ID is required')
        }

        const { data: createData, error: createError } = await supabaseClient
          .from('user_expansion')
          .insert({
            userId: body.userId,
            access: body.access || []
          })
          .select()
        
        if (createError) throw createError
        result = createData
        break

      case 'PUT':
        const updateBody = await req.json()
        
        if (!updateBody.userId) {
          throw new Error('User ID is required')
        }

        const { data: updatedData, error: updateError } = await supabaseClient
          .from('user_expansion')
          .update({ access: updateBody.access })
          .eq('userId', updateBody.userId)
          .select()
        
        if (updateError) throw updateError
        result = updatedData
        break

      case 'DELETE':
        const deleteBody = await req.json()
        
        if (!deleteBody.userId) {
          throw new Error('User ID is required')
        }

        const { data: deletedData, error: deleteError } = await supabaseClient
          .from('user_expansion')
          .delete()
          .eq('userId', deleteBody.userId)
        
        if (deleteError) throw deleteError
        result = deletedData
        break

      default:
        return new Response('Method Not Allowed', { status: 405 })
    }

    // 返回成功响应，使用复用的 CORS 头
    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    })

  } catch (error) {
    // 更细致的错误处理
    const status = error.code === '23505' ? 409 : 500
    return new Response(JSON.stringify({ 
      error: error.message,
      code: error.code 
    }), {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    })
  }
})
