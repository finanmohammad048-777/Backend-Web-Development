const express = require('express');
const { posts } = require('../data');
const requireRole = require('../middleware/requireRole');

const router = express.Router();
const privilegedRoles = ['moderator', 'admin'];

function canModifyPost(user, post) {
  return post.authorId === user.id || privilegedRoles.includes(user.role);
}

// List posts — any authenticated user.
router.get('/', (req, res) => {
  return res.status(200).json(posts);
});

// Create a post — the caller becomes the author.
router.post('/', (req, res) => {
  const post = {
    id: String(posts.length + 1),
    authorId: req.user.id,
    title: req.body?.title ?? 'Untitled',
    hidden: false,
  };
  posts.push(post);
  return res.status(201).json(post);
});

router.patch('/:id', (req, res) => {
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
  if (!canModifyPost(req.user, post)) {
    return res
      .status(403)
      .json({ error: { code: 'FORBIDDEN', message: 'You do not have permission to modify this post' } });
  }

  post.title = req.body?.title ?? post.title;
  return res.status(200).json(post);
});

router.delete('/:id', (req, res) => {
  const idx = posts.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
  if (!canModifyPost(req.user, posts[idx])) {
    return res
      .status(403)
      .json({ error: { code: 'FORBIDDEN', message: 'You do not have permission to modify this post' } });
  }

  posts.splice(idx, 1);
  return res.status(200).json({ ok: true });
});

router.post('/:id/hide', requireRole('moderator', 'admin'), (req, res) => {
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
  post.hidden = true;
  return res.status(200).json(post);
});

module.exports = router;
