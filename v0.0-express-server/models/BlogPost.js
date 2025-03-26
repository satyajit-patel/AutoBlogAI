const mongoose = require("mongoose");

const BlogPostSchema = new mongoose.Schema({
    url: String,
    prompt: String,
    blogContent: String,
    scheduledTime: Date,
    bloggerCredentials: Object,
    posted: { type: Boolean, default: false }
});

module.exports = mongoose.model("BlogPost", BlogPostSchema);
