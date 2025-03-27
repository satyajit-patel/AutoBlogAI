import { firecrawl, llama, gemma, deepseek } from "../utils/langchain.js";
import { publishBlog } from "../utils/publisher.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const HF_API_KEY = process.env.HF_API_KEY;
const CLOUDINARY_URL = process.env.CLOUDINARY_URL;
console.log(HF_API_KEY, CLOUDINARY_URL);

async function query(data) {
    const response = await fetch(
        "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-dev",
        {
            headers: {
                Authorization: `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify(data),
        }
    );
    const result = await response.blob();
    return result;
}

const uploadImageToCloudinary = async (blobFile) => {
    try {
      const formData = new FormData();
      formData.append("file", blobFile);
      formData.append("upload_preset", "my_preset"); // Replace with your Cloudinary preset
      
      const response = await axios.post(CLOUDINARY_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
  
      return response.data.secure_url; // Public URL of the uploaded image
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
};
  

export const fluxDev = async (blogTitle) => {
    try {
        // Generate image
        console.log("getting from AI");
        const imageBlob = await query({"inputs": blogTitle});
        
        console.log("getting from cloudinary");
        // Convert to base64 (for logging or web use)
        const publicUrl = await uploadImageToCloudinary(imageBlob);
        console.log(publicUrl);
        return publicUrl;
    } catch (error) {
        return error.message;
    }
}

// fluxDev("iPhone 16 Review: Is it Worth the Hype? ");

export const blogController = async (req, res) => {
    const { userUrl, userPrompt, userAccessToken, userBlogerId } = req.body;

    if (!userUrl || !userPrompt || !userAccessToken || !userBlogerId) {
        console.log("Validation Error: Missing user inputs");
        return res.status(400).json({ error: "Missing required inputs" });
    }

    // Step 1: Scraping content
    let scrapeContent;
    try {
        console.log("Step 1: Scraping content...");
        scrapeContent = await firecrawl(userUrl);
        if (!scrapeContent) {
            console.error("Error: No content returned from firecrawl");
            return res.status(500).json({ error: "Failed to scrape content" });
        }
        // console.log(scrapeContent);
    } catch (error) {
        console.error("Step 1 Error:", error.message);
        return res.status(500).json({ error: error.message });
    }

    // Step 2: Generating blog content
    let blogContent;
    try {
        console.log("Step 2: Generating blog content...");
        blogContent = await llama(userPrompt, scrapeContent);
        if (!blogContent) {
            console.error("Error: No blog content returned from llama");
            return res.status(500).json({ error: "Failed to generate blog content" });
        }
        // console.log(blogContent);
    } catch (error) {
        console.error("Step 2 Error:", error.message);
        return res.status(500).json({ error: error.message });
    }

    // Step 3: Generating blog title
    let blogTitle;
    try {
        console.log("Step 3: Generating blog title...");
        blogTitle = await gemma(blogContent);
        if (!blogTitle) {
            console.error("Error: No title returned from gemma");
            return res.status(500).json({ error: "Failed to generate blog title" });
        }
        console.log(blogTitle);
    } catch (error) {
        console.error("Step 3 Error:", error.message);
        return res.status(500).json({ error: error.message });
    }

    // Step 4: Generating image
    let imageUrl;
    try {
        console.log("Step 4: Generating image...");
        imageUrl = await fluxDev(blogTitle);
        console.log("imageUrl: ", imageUrl);
        if (!imageUrl) {
            console.error("Error: No image URL returned from fluxDev");
            return res.status(500).json({ error: "Failed to generate image" });
        }
    } catch (error) {
        console.error("Step 4 Error:", error.message);
        return res.status(500).json({ error: error.message });
    }

    // Step 5: Optimizing content for SEO
    let blogContentSEO;
    try {
        console.log("Step 5: Optimizing content for SEO...");
        blogContentSEO = await deepseek(blogTitle, blogContent, imageUrl);
        if (!blogContentSEO) {
            console.error("Error: SEO optimization failed");
            return res.status(500).json({ error: "Failed to optimize content for SEO" });
        }
        // console.log(blogContentSEO);
    } catch (error) {
        console.error("Step 5 Error:", error.message);
        return res.status(500).json({ error: error.message });
    }

    // Step 6: Publishing blog
    let blogLink;
    try {
        console.log("Step 6: Publishing blog...");
        blogLink = await publishBlog(blogTitle, userAccessToken, userBlogerId, blogContentSEO);
        if (!blogLink) {
            console.error("Error: No blog link returned from publishBlog");
            return res.status(500).json({ error: "Failed to publish blog" });
        }
        console.log(blogLink);
    } catch (error) {
        console.error("Step 6 Error:", error.message);
        return res.status(500).json({ error: error.message });
    }

    console.log("All steps completed successfully.");
    return res.status(200).json({ link: blogLink });
};
