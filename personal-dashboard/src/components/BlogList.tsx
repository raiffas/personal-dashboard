// src/componenets/BlogList.tsx
import { Link } from "wouter";
import { Post } from "./BlogPost";

interface BlogListProps {
    posts: Post[];
}

const BlogList = ({ posts }: BlogListProps) => {
    return (
            <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">My Blog</h1>
      <div className="space-y-6">
        {posts.map((post) => (
          <article key={post.id} className="border-b border-gray-200 pb-6">
            <Link href={`/post/${post.slug}`}>
              <div className="block group">
                <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-blue-600 mb-2">
                  {post.title}
                </h2>
                <p className="text-gray-600 mb-2">{post.excerpt}</p>
                <time className="text-sm text-gray-500">{post.date}</time>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
    );
};

export default BlogList;