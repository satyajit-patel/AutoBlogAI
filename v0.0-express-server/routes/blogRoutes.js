
const express = require("express");
const { google } = require("googleapis");
const Groq = require("groq-sdk");
const { chromium } = require("playwright");
const schedule = require("node-schedule");
const BlogPost = require("../models/BlogPost");

const router = express.Router();
require("dotenv").config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Function to Publish Blog
const publishBlog = async (credentials, title, content) => {
    try {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: credentials.accessToken });

        const blogger = google.blogger({ version: "v3", auth: oauth2Client });
        await blogger.posts.insert({
            blogId: credentials.blogId,
            requestBody: { title, content }
        });

        console.log("Blog successfully published!");
        return true;
    } catch (error) {
        console.error("Blogger API Error:", error);
        return false;
    }
};

const truncateText = (text, limit) => {
    return text.split(" ").slice(0, limit).join(" ");
};

// Function to Generate Blog Content using Groq
const generateBlogContent = async (title, extractedContent) => {
    try {
        const truncatedContent = truncateText(extractedContent, 500); // Adjust limit
        const response = await groq.chat.completions.create({
            model: "mixtral-8x7b-32768",
            messages: [
                { role: "system", content: "You are a professional blog writer" },
                { role: "user", content: `Write a well-structured blog post about: ${title} based on this content:\n${truncatedContent}`}
            ]
        });
        return response.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("Error in blog generation:", error);
        res.status(500).json({ error: "Error in blog generation"});
    }
};

// API: Schedule Blog Post
router.post("/auto-publish", async (req, res) => {
    try {
        const { url, title, scheduledTime, bloggerCredentials } = req.body;

        // Step 1: Scrape content
        const browser = await chromium.launch();
        const page = await browser.newPage();
        await page.goto(url);
        // const rawContent = await page.textContent("body");
        const rawContent = await page.textContent("main") || 
                        await page.textContent("article") || 
                        await page.textContent("[role='main']") ||
                        await page.textContent(".content");
        await browser.close();
        console.log("Data scraped successfully");
        console.log("********************************************************************************");
        console.log(rawContent);
        console.log("********************************************************************************");

        // Step 2: Generate blog content
        const truncatedContent = truncateText(rawContent, 500); // Adjust limit
        const blogContent = await generateBlogContent(title, truncatedContent);
        console.log("Blog content generated successfully");

        // Step 3: Store in DB
        const newBlog = await BlogPost.create({
            url,
            title,
            blogContent,
            scheduledTime,
            bloggerCredentials,
            posted: false
        });
        console.log("Data stored successfully");

        // Step 4: Schedule Job
        schedule.scheduleJob(new Date(scheduledTime), async () => {
            const success = await publishBlog(bloggerCredentials, title, blogContent);
            if (success) {
                await BlogPost.findByIdAndUpdate(newBlog._id, { posted: true });
                console.log("Blog published successfully");
            }
        });
        console.log("Blog scheduled successfully");

        res.json({ message: "Blog scheduled successfully!", scheduledTime });
    } catch (error) {
        console.error("Error in auto-publishing:", error);
        res.status(500).json({ error: "Failed to process request" });
    }
});

// Re-schedule posts on server restart
const reSchedulePosts = async () => {
    const pendingPosts = await BlogPost.find({ posted: false });
    pendingPosts.forEach(post => {
        if (new Date(post.scheduledTime) > new Date()) {
            schedule.scheduleJob(new Date(post.scheduledTime), async () => {
                const success = await publishBlog(post.bloggerCredentials, post.title, post.blogContent);
                if (success) {
                    await BlogPost.findByIdAndUpdate(post._id, { posted: true });
                }
            });
        }
    });
};

reSchedulePosts(); // Call on server startup

module.exports = router;
