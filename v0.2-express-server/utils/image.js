import axios from 'axios';
import dotenv from "dotenv";
dotenv.config({path: "../.env"});

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
// console.log(PEXELS_API_KEY);

export async function getImageUrl(title) {
    try {
        const url = "https://api.pexels.com/v1/search";
        const headers = {
            'Authorization': process.env.PEXELS_API_KEY
        };
        const params = {
            query: title,
            per_page: 1
        };

        const response = await axios.get(url, { 
            headers, 
            params,
            timeout: 10000 
        });

        if (response.data.photos && response.data.photos.length > 0) {
            const imageUrl = response.data.photos[0].src.large;
            console.log(`Image URL retrieved: ${imageUrl}`);
            return imageUrl;
        } else {
            console.warn('[WARNING] No image found. Using default image.');
            return "https://images.pexels.com/photos/3560044/pexels-photo-3560044.jpeg";
        }
    } catch (error) {
        const errorMsg = `[ERROR] Image retrieval failed: ${error.message}`;
        console.error(errorMsg);
        return "https://images.pexels.com/photos/3560044/pexels-photo-3560044.jpeg";
    }
}

// getImageUrl("IPhone 16");