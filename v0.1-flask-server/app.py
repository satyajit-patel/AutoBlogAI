import os
import requests
import time
from flask import Flask, request, jsonify
from bs4 import BeautifulSoup
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from dotenv import load_dotenv
from flask_cors import CORS
from groq import Groq
from openai import OpenAI

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route("/")
def health_check():
    return "Server is up and running!"

print("****************************************************************************************************")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
PEXELS_API_KEY = os.environ.get("PEXELS_API_KEY")
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")

print(GROQ_API_KEY)
print(DEEPSEEK_API_KEY)
print(PEXELS_API_KEY)
print("****************************************************************************************************")



# ----------------------------------- Data Scrape -------------------------------------------------------------

def scrape(url):
    """Scrape content from the provided URL."""
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        content_section = soup.article if soup.article else soup.body
        
        if not content_section:
            return "[ERROR] Could not find main content on the page"
            
        scrape_content = "\n".join(tag.get_text(strip=True) for tag in content_section.find_all(['h1', 'h2', 'h3', 'p', 'ol', 'ul']))
        
        if not scrape_content.strip():
            return "[ERROR] No text content found on the page"
            
        result = scrape_content[:4500] if len(scrape_content) > 4500 else scrape_content
        print("Scraping completed successfully")
        return result
    except requests.exceptions.RequestException as e:
        error_msg = f"[ERROR] Scraping failed: {e}"
        print(error_msg)
        return error_msg

# ----------------------------------- Multi Agent -------------------------------------------------------------

def generate_blog_content(title, scrape_content):
    """Generate blog content using the Groq API."""
    if not scrape_content or "[ERROR]" in scrape_content:
        return "[ERROR] Invalid scrape content"
    try:
        client = Groq(
            api_key=GROQ_API_KEY,
        )
        
        prompt = f"""Write a professional blog on the topic: '{title}'. 
        
        The blog should be well-structured, engaging, and informative, with a formal yet conversational tone. 
        Incorporate insights from this real-time data where relevant: 

        {scrape_content}

        Make the blog compelling with:
        - A strong, attention-grabbing introduction
        - Clear section headings
        - Concise paragraphs with valuable information
        - Real-world examples or case studies
        - A conclusion that summarizes key points and leaves the reader with something to think about

        Focus on readability, and ensure the content provides genuine value to readers interested in this topic."""

        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a professional blog writer with expertise in creating engaging, informative content that ranks well in search engines."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_completion_tokens=5000,
            top_p=1,
            stream=False,
            stop=None,
            model="llama-3.3-70b-versatile",
        )

        content = chat_completion.choices[0].message.content
        print("Blog content generated successfully")
        return content
    except Exception as e:
        error_msg = f"[ERROR] Blog generation failed: {e}"
        print(error_msg)
        return error_msg


def generate_optimized_title(original_title, blog_content):
    """Generate an SEO-optimized title based on the original title and blog content."""
    try:
        client = Groq(
            api_key=GROQ_API_KEY,
        )
        
        prompt = f"""Based on the following original title and blog content, create a new, SEO-optimized title that:
        1. Is more engaging and clickable than the original
        2. Contains keywords that are likely to rank well
        3. Accurately represents the content
        4. Is under 40 characters
        5. Has a hook that creates curiosity

        Original title: {original_title}

        Blog content (first 500 chars only): {blog_content[:500]}

        Provide ONLY the new title, with no additional commentary."""

        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an SEO expert specializing in creating engaging, high-performing blog titles."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_completion_tokens=100,
            top_p=1,
            stream=False,
            stop=None,
            model="llama-3.3-70b-versatile",
        )

        new_title = chat_completion.choices[0].message.content.strip()
        print(f"Generated optimized title: {new_title}")
        return new_title
    except Exception as e:
        error_msg = f"[ERROR] Title optimization failed: {e}"
        print(error_msg)
        return original_title  # Fall back to original title if optimization fails


def get_image_url(title):
    """Get a relevant image URL from Pexels API based on the title."""
    try:
        url = "https://api.pexels.com/v1/search"
        headers = {"Authorization": PEXELS_API_KEY}
        params = {"query": title, "per_page": 1}

        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()

        data = response.json()
        if data.get("photos") and len(data["photos"]) > 0:
            image_url = data["photos"][0]["src"]["large"]
            print(f"Image URL retrieved: {image_url}")
            return image_url
        else:
            print("[WARNING] No image found. Using default image.")
            return "https://images.pexels.com/photos/3560044/pexels-photo-3560044.jpeg"  # Default image
    except Exception as e:
        error_msg = f"[ERROR] Image retrieval failed: {e}"
        print(error_msg)
        return "https://images.pexels.com/photos/3560044/pexels-photo-3560044.jpeg"  # Default image as fallback


# def make_SEO_optimisation(title, blog_content, image_url):
#     try:
#         client = OpenAI(
#             base_url="https://openrouter.ai/api/v1",
#             api_key="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",
#         )

#         prompt = f"""Transform this blog content into an SEO-optimized HTML page with inline CSS styling.
                
#                 TITLE: {title}

#                 BLOG CONTENT:
#                 {blog_content[:4000]}  # Limiting to avoid token limits

#                 FEATURED IMAGE URL: {image_url}

#                 Requirements:
#                 1. Create HTML with inline CSS that makes the blog visually appealing and easy to read
#                 2. Use a responsive design that works well on mobile and desktop
#                 3. Include proper semantic HTML elements (h1, h2, p, etc.)
#                 4. Optimize for SEO with:
#                 - Proper heading hierarchy
#                 - Meta description (commented at the top)
#                 - Alt text for images
#                 - Internal linking where appropriate
#                 - Keyword-rich but natural content
#                 5. Add a featured image at the top using the provided image URL
#                 6. Create a table of contents
#                 7. Include social sharing buttons
#                 8. Add a CTA at the end
#                 9. Make sure the design is modern, clean, and professional

#                 Return ONLY the complete HTML+CSS code with no additional commentary."""

#         completion = client.chat.completions.create(
#         extra_headers={
#             "HTTP-Referer": "<YOUR_SITE_URL>", # Optional. Site URL for rankings on openrouter.ai.
#             "X-Title": "<YOUR_SITE_NAME>", # Optional. Site title for rankings on openrouter.ai.
#         },
#         extra_body={},
#         model="deepseek/deepseek-r1-zero:free",
#         messages=[
#             {
#             "role": "system", 
#             "content": "You are an expert in SEO and web design, specializing in creating beautiful, optimized blog content with HTML and CSS."
#             },
#             {
#             "role": "user",
#             "content": prompt
#             }
#         ]
#         )
#         content = completion.choices[0].message.content
#         print("SEO optimization completed")
#         return content
        
#     except Exception as e:
#         error_msg = f"[ERROR] SEO optimization failed: {e}"
#         print(error_msg)
#         return f"[ERROR] SEO optimization failed: {str(e)}"




def make_SEO_optimisation(title, blog_content, image_url):

    prompt = f"""Transform this blog content into an SEO-optimized HTML page with inline CSS styling.
                
                TITLE: {title}

                BLOG CONTENT:
                {blog_content[:4000]}  # Limiting to avoid token limits

                FEATURED IMAGE URL: {image_url}

                Requirements:
                1. Create HTML with inline CSS that makes the blog visually appealing and easy to read
                2. Use a responsive design that works well on mobile and desktop
                3. Include proper semantic HTML elements (h1, h2, p, etc.)
                4. Optimize for SEO with:
                - Proper heading hierarchy
                - Meta description (commented at the top)
                - Alt text for images
                - Internal linking where appropriate
                - Keyword-rich but natural content
                5. Add a featured image at the top using the provided image URL
                6. Create a table of contents
                7. Include social sharing buttons
                8. Add a CTA at the end
                9. Make sure the design is modern, clean, and professional

                Return ONLY the complete HTML+CSS code with no additional commentary."""


    try:
        client = Groq(
            api_key=os.environ.get("GROQ_API_KEY"),
        )

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system", 
                    "content": "You are an expert in SEO and web design, specializing in creating beautiful, optimized blog content with HTML and CSS."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="deepseek-r1-distill-llama-70b",
        )

        # return chat_completion.choices[0].message.content
        return chat_completion.choices[0].message.content.strip() # without thinking part

    except Exception as e:
        error_msg = f"[ERROR] SEO optimization failed: {e}"
        print(error_msg)
        return f"[ERROR] SEO optimization failed: {str(e)}"







def publish_blog(title, accessToken, blogId, optimised_content):
    """Publish the blog to Blogger using Google API."""
    try:
        creds = Credentials(token=accessToken)
        blogger = build("blogger", "v3", credentials=creds)
        post = blogger.posts().insert(
            blogId=blogId,
            body={"title": title, "content": optimised_content}
        ).execute()
        
        if "id" in post:
            blog_link = f"https://www.blogger.com/blog/post/edit/{blogId}/{post['id']}"
            print(f"Blog published successfully: {blog_link}")
            return blog_link
        else:
            error_msg = "[ERROR] Blog post created but no ID returned"
            print(error_msg)
            return error_msg
    except Exception as e:
        error_msg = f"[ERROR] Blogger API failed: {e}"
        print(error_msg)
        return error_msg


@app.route("/api/v1/auto-publish", methods=["POST"])
def auto_publish():
    """Main API endpoint to handle the auto-publish process."""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        # Extract required fields
        url = data.get("url")
        original_title = data.get("title")
        accessToken = data.get("accessToken")
        blogId = data.get("blogId")

        print(url)
        print(original_title)
        print(accessToken)
        print(blogId)
        
        # Validate required fields
        if not all([url, original_title, accessToken, blogId]):
            missing_fields = [f for f in ["url", "title", "accessToken", "blogId"] 
                             if not data.get(f)]
            return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400
        
        print(f"\nStarting blog auto-publish process for: {original_title}\n")
        
        # Step 1: Scrape content
        print(f"Scraping content from: {url}")
        scrape_content = scrape(url)
        if "[ERROR]" in scrape_content:
            return jsonify({"error": scrape_content}), 500
        # print(scrape_content)
            
        # Step 2: Generate blog content
        print("Generating blog content...")
        blog_content = generate_blog_content(original_title, scrape_content)
        if "[ERROR]" in blog_content:
            return jsonify({"error": blog_content}), 500
        # print(blog_content)
            
        # Step 3: Generate optimized title
        print("Creating optimized title...")
        optimized_title = generate_optimized_title(original_title, blog_content)
        # print(optimized_title)
        
        # Step 4: Get image URL based on the new title
        print("Retrieving relevant image...")
        image_url = get_image_url(optimized_title)
        # print(image_url)
        
        # Step 5: SEO optimization with DeepSeek
        print("Performing SEO optimization...")
        optimised_content = make_SEO_optimisation(optimized_title, blog_content, image_url)
        # print(optimised_content)
        
        # Step 6: Publish the blog
        print("Publishing blog...")
        blog_link = publish_blog(optimized_title, accessToken, blogId, optimised_content)
        
        if "[ERROR]" in blog_link:
            return jsonify({"error": blog_link}), 500
        # print(blog_link)
            
        # Return success with both links and the new title
        return jsonify({
            "link": blog_link,
            "original_title": original_title,
            "optimized_title": optimized_title,
            "image_url": image_url
        })
        
    except Exception as e:
        error_msg = f"[ERROR] Auto-publishing failed: {str(e)}"
        print(error_msg)
        return jsonify({"error": error_msg}), 500

# ----------------------------------- Run -------------------------------------------------------------

if __name__ == "__main__":
    app.run()  