import { firecrawl, llama, gemma, deepseek } from "../utils/langchain";
import { publisher } from "../utils/publisher";

export const blogController = async (req, res) => {
    try {
        const { userUrl, userPrompt, userAccessToken, userBlogerId } = req.body;

        if (!userUrl || !userPrompt || !userAccessToken || !userBlogerId) {
            console.log("Validation Error: Missing user inputs");
            return res.status(400).json({ error: "Missing required inputs" });
        }

        console.log("Step 1: Scraping content...");
        let scrapeContent;
        try {
            scrapeContent = await firecrawl(userUrl);
            console.log("Scraping successful.");
        } catch (error) {
            console.error("Scraping Failed:", error.message);
            return res.status(500).json({ error: "Scraping failed", details: error.message });
        }

        console.log("Step 2: Generating blog content...");
        let blogContent;
        try {
            blogContent = await llama(userPrompt, scrapeContent);
            console.log("Blog content generated successfully.");
        } catch (error) {
            console.error("Llama Processing Failed:", error.message);
            return res.status(500).json({ error: "Blog content generation failed", details: error.message });
        }

        console.log("Step 3: Generating blog title...");
        let blogTitle;
        try {
            blogTitle = await gemma(blogContent);
            console.log("Blog title generated successfully.");
        } catch (error) {
            console.error("Mistral Processing Failed:", error.message);
            return res.status(500).json({ error: "Blog title generation failed", details: error.message });
        }

        console.log("Step 4: Fetching image...");
        let imageUrl;
        try {
            imageUrl = await pexels(blogTitle);
            console.log("Image fetched successfully.");
        } catch (error) {
            console.error("Image Fetching Failed:", error.message);
            return res.status(500).json({ error: "Image fetching failed", details: error.message });
        }

        console.log("Step 5: Optimizing content for SEO...");
        let blogContentSEO;
        try {
            blogContentSEO = await deepseek(blogTitle, blogContent, imageUrl);
            console.log("SEO optimization successful.");
        } catch (error) {
            console.error("SEO Optimization Failed:", error.message);
            return res.status(500).json({ error: "SEO optimization failed", details: error.message });
        }

        console.log("Step 6: Publishing blog...");
        let blogLink;
        try {
            blogLink = await publisher(userAccessToken, userBlogerId, blogContentSEO);
            console.log("Blog published successfully:", blogLink);
        } catch (error) {
            console.error("Publishing Failed:", error.message);
            return res.status(500).json({ error: "Blog publishing failed", details: error.message });
        }

        console.log("All steps completed successfully.");
        res.status(200).json({ link: blogLink });

    } catch (error) {
        console.error("Unexpected Server Error:", error.message);
        res.status(500).json({ error: "Unexpected server error", details: error.message });
    }
};
