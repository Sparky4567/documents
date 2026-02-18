import React from 'react';
import { useBlogPost } from '@docusaurus/plugin-content-blog/client';
import BlogPostItem from '@theme-original/BlogPostItem';
import ShareButtons from '@site/src/components/ShareButtons';

export default function BlogPostItemWrapper(props) {
    const { isBlogPostPage, metadata } = useBlogPost();

    return (
        <>
            <BlogPostItem {...props} />
            {isBlogPostPage && <ShareButtons title={metadata.title} />}
        </>
    );
}
