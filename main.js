const express = require("express");
const fs = require("fs");
const path = require("path");
const { marked } = require("marked");
const matter = require("gray-matter");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  const postsDir = path.join(__dirname, "posts");
  fs.readdir(postsDir, (err, files) => {
    if (err) {
      return res.status(500).send("Error reading posts directory");
    }

    const posts = files
      .filter((file) => file.endsWith(".md"))
      .map((file) => {
        const filePath = path.join(postsDir, file);
        const fileContent = fs.readFileSync(filePath, "utf8");
        const { data: frontmatter } = matter(fileContent);
        const postName = path.basename(file, ".md");
        return {
          title: frontmatter.title || postName,
          link: `/${postName}`,
        };
      });

    res.render("home", { posts });
  });
});

app.get("/:post", (req, res) => {
  const postName = req.params.post;
  const postPath = path.join(__dirname, "posts", `${postName}.md`);

  fs.readFile(postPath, "utf8", (err, data) => {
    if (err) {
      return res.status(404).send("Post not found");
    }

    const { content, data: frontmatter } = matter(data);
    const htmlContent = marked(content);

    res.render("post", { content: htmlContent, frontmatter });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
