// Initialize OpenTelemetry and logger
const { logger, tracer } = require('./tracing');
const { SpanStatusCode } = require('@opentelemetry/api');

const express = require("express");
const fs = require("fs");
const path = require("path");
const { marked } = require("marked");
const matter = require("gray-matter");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.set("view engine", "ejs");

// Middleware for request logging
app.use((req, res, next) => {
  const start = Date.now();
  logger.info(`Incoming request: ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    ip: req.ip
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`Request completed: ${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
});

// Category descriptions
const categoryDescriptions = {
  tech: 'Explore the latest in technology, programming, and digital innovation.',
  health: 'Tips and guides for maintaining physical and mental wellness in the tech industry.',
  life: 'Insights into lifestyle, productivity, and personal development.',
  devops: 'Learn about DevOps practices, tools, and best practices for modern software development.'
};

// Helper function to get category description
function getCategoryDescription(category) {
  return categoryDescriptions[category.toLowerCase()] || 'Browse all posts in this category.';
}

// Helper function to read all posts
function getAllPosts() {
  const span = tracer.startSpan('getAllPosts');
  try {
    const postsDir = path.join(__dirname, "posts");
    logger.debug(`Reading posts from directory: ${postsDir}`);
    const files = fs.readdirSync(postsDir);
    
    const posts = files
      .filter(file => file.endsWith(".md"))
      .map(file => {
        const filePath = path.join(postsDir, file);
        logger.debug(`Processing post file: ${filePath}`);
        const fileContent = fs.readFileSync(filePath, "utf8");
        const { data: frontmatter } = matter(fileContent);
        const postName = path.basename(file, ".md");
        return {
          title: frontmatter.title || postName,
          link: `/${postName}`,
          date: frontmatter.date,
          author: frontmatter.author,
          summary: frontmatter.summary,
          tags: frontmatter.tags || [],
          categories: frontmatter.categories || []
        };
      });

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
    return posts;
  } catch (error) {
    logger.error('Error reading posts:', { error: error.message, stack: error.stack });
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    span.end();
    return [];
  }
}

// Home route
app.get("/", (req, res) => {
  const span = tracer.startSpan('homeRoute');
  try {
    logger.info('Rendering home page');
    const posts = getAllPosts();
    res.render("home", { posts });
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    logger.error('Error in home route:', { error: error.message, stack: error.stack });
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    res.status(500).send("Error loading posts");
  } finally {
    span.end();
  }
});

// Post route
app.get("/:post", (req, res, next) => {
  const span = tracer.startSpan('postRoute');
  const postName = req.params.post;
  
  // Skip if the request is for a category
  if (['category', 'tech', 'health', 'life', 'devops'].includes(postName)) {
    span.setAttribute('skipped', true);
    span.end();
    return next();
  }

  try {
    logger.info(`Loading post: ${postName}`);
    const postPath = path.join(__dirname, "posts", `${postName}.md`);
    logger.debug(`Reading post file: ${postPath}`);
    const fileContent = fs.readFileSync(postPath, "utf8");
    const { content, data: frontmatter } = matter(fileContent);
    const htmlContent = marked(content);

    logger.debug(`Successfully processed post: ${postName}`);
    res.render("post", { content: htmlContent, frontmatter });
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    logger.error('Error loading post:', { 
      post: postName, 
      error: error.message, 
      stack: error.stack 
    });
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    res.status(404).send("Post not found");
  } finally {
    span.end();
  }
});

// Category route
app.get('/category/:category', (req, res) => {
  const span = tracer.startSpan('categoryRoute');
  try {
    const category = req.params.category.toLowerCase();
    logger.info(`Loading category: ${category}`);
    const allPosts = getAllPosts();
    const categoryPosts = allPosts.filter(post => 
      post.categories && post.categories.some(cat => cat.toLowerCase() === category)
    );
    
    logger.debug(`Found ${categoryPosts.length} posts for category ${category}`);
    res.render('category', {
      category: category.charAt(0).toUpperCase() + category.slice(1),
      posts: categoryPosts,
      getCategoryDescription: getCategoryDescription
    });
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    logger.error('Error in category route:', { 
      category: req.params.category, 
      error: error.message, 
      stack: error.stack 
    });
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    res.status(500).send("Error loading category posts");
  } finally {
    span.end();
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', { 
    error: err.message, 
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
  console.log(`Server is running on http://localhost:${PORT}`);
});