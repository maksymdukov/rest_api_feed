const express = require('express');
const {body} = require('express-validator/check');
const feedControllers = require('../controllers/feed');
const router = express.Router();
const isAuth = require('../middleware/isAuth');

// GET /feed/posts
router.get('/posts', isAuth, feedControllers.getPosts);

// POST //feed/post
router.post('/post', isAuth, [
    body('title')
        .trim()
        .isLength({min: 5}),
    body('content')
        .trim()
        .isLength({min: 5})
], feedControllers.createPost);

// GET /feed/post/:postId
router.get('/post/:postId', isAuth, feedControllers.getPost);

// PUT /feed/post/:postId
router.put('/post/:postId', isAuth, [
    body('title')
        .trim()
        .isLength({min: 5}),
    body('content')
        .trim()
        .isLength({min: 5})
], feedControllers.editPost);

// DELETE /feed/post/:postId
router.delete('/post/:postId', isAuth, feedControllers.deletePost);

// GET /feed/status
router.get('/status', isAuth, feedControllers.getStatus);

// POST /feed/status
router.post('/status', isAuth, [
        body('status')
            .trim()
            .isString()
            .isLength({min: 5, max: 50})
    ],
    feedControllers.updateStatus
)
;

module.exports = router;

