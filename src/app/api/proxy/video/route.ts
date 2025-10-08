import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoUrl = searchParams.get('url')
    
    if (!videoUrl) {
      return NextResponse.json({ error: 'Missing video URL parameter' }, { status: 400 })
    }

    // 验证URL是否为允许的域名（安全考虑）
    const allowedDomains = ['img.wjsphy.top']
    const urlObj = new URL(videoUrl)
    
    if (!allowedDomains.includes(urlObj.hostname)) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 })
    }

    // 获取原始视频资源
    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VideoProxy/1.0)',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch video' }, { status: response.status })
    }

    // 获取视频数据
    const videoBuffer = await response.arrayBuffer()
    
    // 设置适当的响应头
    const headers = new Headers()
    headers.set('Content-Type', response.headers.get('Content-Type') || 'video/mp4')
    headers.set('Content-Length', videoBuffer.byteLength.toString())
    headers.set('Accept-Ranges', 'bytes')
    headers.set('Cache-Control', 'public, max-age=31536000') // 缓存1年
    
    // 处理Range请求（支持视频拖拽）
    const range = request.headers.get('range')
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : videoBuffer.byteLength - 1
      const chunkSize = (end - start) + 1
      
      headers.set('Content-Range', `bytes ${start}-${end}/${videoBuffer.byteLength}`)
      headers.set('Content-Length', chunkSize.toString())
      
      const chunk = videoBuffer.slice(start, end + 1)
      return new NextResponse(chunk, { status: 206, headers })
    }

    return new NextResponse(videoBuffer, { status: 200, headers })
    
  } catch (error) {
    console.error('Video proxy error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
