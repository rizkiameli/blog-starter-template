import { NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/db/posts';

// Helper function to escape XML special characters
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper function to strip HTML/Markdown and create plain text
function stripMarkdown(text: string): string {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert links to text
    .replace(/[#*_~`]/g, '') // Remove markdown symbols
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .trim();
}

export async function GET() {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Professional Blog';
    const siteDescription = 'A professional blog featuring insights, articles, and thoughts on technology, development, and innovation.';

    // Get all posts
    const posts = await getAllPosts(50); // Limit to 50 most recent posts

    // Generate RSS 2.0 XML
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed" rel="self" type="application/rss+xml" />
    ${posts.map(post => {
      const postUrl = `${siteUrl}/blog/${post.slug}`;
      const pubDate = new Date(post.publishedAt).toUTCString();

      // Parse tags
      let tags: string[] = [];
      try {
        tags = JSON.parse(post.tags);
      } catch {
        tags = [];
      }

      // Create a clean description from excerpt or content
      const description = post.excerpt
        ? stripMarkdown(post.excerpt)
        : stripMarkdown(post.content.substring(0, 200)) + '...';

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description>${escapeXml(description)}</description>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(post.author)}</author>
      ${post.category ? `<category>${escapeXml(post.category)}</category>` : ''}
      ${tags.map(tag => `<category>${escapeXml(tag)}</category>`).join('\n      ')}
      ${post.coverImage ? `<enclosure url="${escapeXml(post.coverImage)}" type="image/jpeg" />` : ''}
      <content:encoded><![CDATA[${post.content}]]></content:encoded>
    </item>`;
    }).join('\n')}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return new NextResponse('Error generating RSS feed', { status: 500 });
  }
}
