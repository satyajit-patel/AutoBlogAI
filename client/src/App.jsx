import { useState } from "react";
import axios from "axios";
import { SparklesPreview } from "./components/sparkle/SparklesPreview";

function App() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [blogId, setBlogId] = useState("");

  const [isloading, setIsloading] = useState(false);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");

  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  console.log("** ", VITE_BACKEND_URL, " **");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsloading(true);
    setError("");
    setLink("");
    try {
      const response = await axios.post(`${VITE_BACKEND_URL}/api/v1/auto-publish`, {
        url,
        title,
        accessToken,
        blogId,
      });
      setLink(response.data.link);
    } catch (err) {
      console.log(err.message);
      setError("Something went wrong, please try again.");
    } finally {
      setIsloading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <SparklesPreview />
      <div className="w-full max-w-lg p-8 bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-700">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-400">
          Auto-Publish Your Blog
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Website URL for Web Scraping
            </label>
            <input
              type="url"
              placeholder="Enter website URL"
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-400 outline-none transition-all"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Blog Title
            </label>
            <input
              type="text"
              placeholder="Enter blog title"
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-400 outline-none transition-all"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Access Token{" "}
              <span className="text-gray-400 text-xs">
                (Get it{" "}
                <a
                  className="text-blue-400 hover:text-blue-500 underline"
                  href="https://developers.google.com/oauthplayground/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  here
                </a>
                )
              </span>
            </label>
            <input
              type="text"
              placeholder="Enter access token"
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-400 outline-none transition-all"
              required
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Blogger ID{" "}
              <span className="text-gray-400 text-xs">
                (Find it{" "}
                <a
                  className="text-blue-400 hover:text-blue-500 underline"
                  href="https://www.blogger.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  here
                </a>
                )
              </span>
            </label>
            <input
              type="text"
              placeholder="Enter Blogger ID"
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-400 outline-none transition-all"
              required
              value={blogId}
              onChange={(e) => setBlogId(e.target.value)}
            />
          </div>

          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-lg transition-all">
            Publish Blog
          </button>

          {isloading && (
            <p className="mt-4 text-center text-yellow-400 animate-pulse">
              Please wait... It's publishing!
            </p>
          )}

          {link && (
            <p className="mt-4 text-center text-green-400">
              Your blog is published!{" "}
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-400"
              >
                View it here
              </a>
            </p>
          )}

          {error && <p className="mt-4 text-center text-red-400">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default App;
