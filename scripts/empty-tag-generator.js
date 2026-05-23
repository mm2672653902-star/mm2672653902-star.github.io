const fs = require('fs');
const path = require('path');

hexo.extend.generator.register('empty-tags', function(locals) {
  const tagsJsonPath = path.join(hexo.source_dir, '_data/tags.json');
  let tags = [];
  if (fs.existsSync(tagsJsonPath)) {
    try {
      tags = JSON.parse(fs.readFileSync(tagsJsonPath, 'utf8'));
    } catch (e) {
      console.error('Failed to parse tags.json:', e);
    }
  }

  const routes = [];
  tags.forEach(tagName => {
    const hexoTag = locals.tags.findOne({ name: tagName });
    // If tag doesn't exist in Hexo database (no posts have it), or has 0 posts
    if (!hexoTag || hexoTag.length === 0) {
      routes.push({
        path: `tags/${tagName}/index.html`,
        layout: ['tag', 'archive', 'index'],
        data: {
          tag: tagName,
          posts: hexo.locals.get('posts').filter(() => false) // Empty posts collection
        }
      });
    }
  });

  return routes;
});
