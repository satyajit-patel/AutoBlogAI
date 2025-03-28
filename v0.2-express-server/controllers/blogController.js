import { firecrawl, llama, gemma, deepseek } from "../utils/langchain.js";
import { publishBlog } from "../utils/publisher.js";
import { getImageUrl } from "../utils/image.js";

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
    console.log("Blog title:", blogTitle);
  } catch (error) {
    console.error("Step 3 Error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  // Step 4: Generating image
  let imageUrl;
  try {
    console.log("Step 4: Generating image...");
    imageUrl = await getImageUrl(blogTitle);
    console.log("imageUrl:", imageUrl);
    if (!imageUrl) {
      console.error("Error: No image URL returned from getImageUrl");
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
    console.log("Blog link:", blogLink);
  } catch (error) {
    console.error("Step 6 Error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  console.log("All steps completed successfully.");
  return res.status(200).json({ link: blogLink });
};
