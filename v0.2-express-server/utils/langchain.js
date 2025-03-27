import "@mendable/firecrawl-js";
import { FireCrawlLoader } from "@langchain/community/document_loaders/web/firecrawl";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import dotenv from "dotenv";
dotenv.config({path: "../.env"});

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
// console.log(FIRECRAWL_API_KEY, GROQ_API_KEY);

export const llama = async (userPrompt, scrapeContent) => {
    const llamaMeta = new ChatGroq({
        model: "llama-3.3-70b-versatile",
        apiKey: GROQ_API_KEY,
    });
    const promptTemplate = ChatPromptTemplate.fromMessages([
        ["system", "You are an expert blog writer with a deep understanding of SEO, content strategy, and audience engagement. Your goal is to generate a well-structured, informative, and compelling blog that provides valuable insights to readers."],
        ["user", `Understand the core intent behind the user's prompt: "{topic}".  
            Analyze what the user is looking for and expand on it by adding relevant insights, trends, and additional depth to enhance the blog.  

            Structure the blog with:
            - A **strong, attention-grabbing introduction** that clearly defines the topic and its importance.  
            - **Comprehensive sections** that cover essential aspects of the topic, incorporating real-world examples and case studies where relevant.  
            - **Well-researched insights** using real-time data: {realTimeData} to ensure the content is current and valuable.  
            - A **conclusion** that reinforces key points, provides actionable takeaways, and leaves the reader with something thought-provoking.  

            Ensure the writing is **engaging, professional, and informative**, with a balance of formal yet conversational tone.  
            Make it **scannable** with clear section headings and concise paragraphs while maximizing reader engagement.`
        ]
    ]);
    const prompt = await promptTemplate.invoke({ topic: userPrompt, realTimeData: scrapeContent });
    // console.log(prompt);
    const response = await llamaMeta.invoke(prompt);
    // console.log(response.content);
    return response.content;
};

export const deepseek = async (blogTitle, blogContent, imageUrl) => {
    const deepseekAlibabaCloud = new ChatGroq({
        model: "deepseek-r1-distill-llama-70b",
        apiKey: GROQ_API_KEY,
    });
    const promptTemplate = ChatPromptTemplate.fromMessages([
        ["system", "You are an expert in SEO and web design, specializing in creating beautiful, optimized blog content with HTML and CSS."],
        ["user", `Transform this blog content into an SEO-optimized HTML page with inline CSS styling.
                
                TITLE: {blogTitle}

                BLOG CONTENT:
                {blogContent}

                FEATURED IMAGE URL: {imageUrl}

                Requirements:
                1. Create HTML with inline CSS that makes the blog visually appealing and easy to read
                2. Use a responsive design that works well on mobile and desktop
                3. Include proper semantic HTML elements (h2, h3, p, etc.)
                4. Optimize for SEO with:
                - Proper heading hierarchy
                - Alt text for images
                - Internal linking where appropriate
                - Keyword-rich but natural content
                5. Add a featured image at the top using the provided image URL
                6. Create a table of contents
                7. Include social sharing buttons
                8. Add a CTA at the end
                9. Make sure the design is modern, clean, and professional

                Return ONLY the complete HTML+CSS code with no additional commentary and markdown.`
            ]
    ]);
    const prompt = await promptTemplate.invoke({blogTitle, blogContent, imageUrl});
    // console.log(prompt);
    const response = await deepseekAlibabaCloud.invoke(prompt);
    // console.log(response.content);
    // return response.content;
    return response.content.split('</think>').pop().trim();
};

// const deepseekTest = async (text) => {
//     const deepseekAlibabaCloud = new ChatGroq({
//         model: "deepseek-r1-distill-llama-70b",
//         apiKey: GROQ_API_KEY,
//     });
//     const response = await deepseekAlibabaCloud.invoke(text);
    
//     const cleanedResponse = response.content.split('</think>').pop().trim();
//     console.log(cleanedResponse);
// };
// deepseekTest("tell me paradox sentence");

export const gemma = async (blogContent) => {
    const gemmaGoogle = new ChatGroq({
        model: "gemma2-9b-it",
        apiKey: GROQ_API_KEY,
    });
    const promptTemplate = ChatPromptTemplate.fromMessages([
        ["system", "You are an SEO expert specializing in creating engaging, high-performing blog titles."],
        ["user", `Based on the following blog content, create a new, SEO-optimized title that:
            1. Is more engaging and clickable than the original
            2. Contains keywords that are likely to rank well
            3. Accurately represents the content
            4. Is under 30 characters
            5. Has a hook that creates curiosity

            Blog content: {blogContent}

            Provide ONLY the new title, with no additional commentary.`
        ]
    ]);
    const prompt = await promptTemplate.invoke({blogContent});
    // console.log(prompt);
    const response = await gemmaGoogle.invoke(prompt);
    // console.log(response.content);
    return response.content;
};

export const firecrawl = async (url) => {
    const loader = new FireCrawlLoader({
    url: url, // The URL to scrape
    apiKey: FIRECRAWL_API_KEY, // Optional, defaults to `FIRECRAWL_API_KEY` in your env.
    mode: "scrape", // The mode to run the crawler in. Can be "scrape" for single urls or "crawl" for all accessible subpages
    params: {
        // optional parameters based on Firecrawl API docs
        // For API documentation, visit https://docs.firecrawl.dev
        formats: ['markdown'],
    },
    });
    const docs = await loader.load();
    // console.log(docs[0].metadata);
    return docs[0].metadata;
}