// src/componenets/BlogPost.tsx
import { Link } from "wouter";

export interface Post {
    id: number;
    slug: string;
    title: string;
    excerpt: string;
    date: string;
    content: string;
}

interface BlogPostProps {
    post: Post | undefined;
}

const BlogPost = ({ post }: BlogPostProps ) => {
    if (!post) {
        return (
                  <div className="max-w-4xl mx-auto p-6">
        <p className="text-gray-600">Post not found</p>
        <Link href="/">
          <div className="text-blue-600 hover:underline">← Back to home</div>
        </Link>
      </div>
        );
    }
    return (
        <div className="max-w-4xl mx-auto p-6">
      <Link href="/">
        <div className="text-blue-600 hover:underline mb-6 inline-block">
          ← Back to home
        </div>
      </Link>
      <article>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
        <time className="text-gray-500 mb-6 block">{post.date}</time>
        <div className="prose prose-lg prose-gray max-w-none text-gray-900">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
      </article>
    </div>
    );
};
export default BlogPost;