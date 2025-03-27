import { google } from 'googleapis';

export async function publishBlog(title, accessToken, blogId, optimisedContent) {
    try {
        // Create OAuth2 credentials
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });

        // Create Blogger service
        const blogger = google.blogger({
            version: 'v3',
            auth: oauth2Client
        });

        // Insert blog post
        const response = await blogger.posts.insert({
            blogId: blogId,
            requestBody: {
                title: title,
                content: optimisedContent
            }
        });

        // Check if post was successfully created
        if (response.data.id) {
            const blogLink = `https://www.blogger.com/blog/post/edit/${blogId}/${response.data.id}`;
            return blogLink;
        } else {
            const errorMsg = "[ERROR] Blog post created but no ID returned";
            console.log(errorMsg);
            return errorMsg;
        }
    } catch (error) {
        const errorMsg = `[ERROR] Blogger API failed: ${error.message}`;
        console.log(errorMsg);
        return errorMsg;
    }
}