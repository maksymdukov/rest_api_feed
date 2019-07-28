const {validationResult} = require('express-validator/check');
const path = require('path');
const fs = require('fs');
const io = require('../socket');
const Post = require('../models/posts');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    try {
        const totalItems = await Post.find().countDocuments();
        const posts = await Post.find()
            .populate('creator')
            .sort({createdAt: -1})
            .skip((currentPage - 1) * perPage)
            .limit(perPage);
        if (!posts) {
            const error = new Error('Posts are not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            message: 'Retrieving posts success',
            posts: posts,
            totalItems: totalItems
        })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.createPost = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error('Validation failed, entered data is incorrect');
            error.statusCode = 422;
            throw error;
        }
        if (!req.file) {
            const error = new Error('Validation failed, no image provided');
            error.statusCode = 422;
            throw error;
        }
        const imageUrl = req.file.path;
        const title = req.body.title;
        const content = req.body.content;
        const post = new Post({
            title: title,
            content: content,
            imageUrl: imageUrl,
            creator: req.userId
        });
        await post.save();
        const user = await User.findById(req.userId);
        user.posts.push(post);
        await user.save();
        io.getIO().emit('posts', {
            action: 'create',
            post: {
                ...post._doc,
                creator: {_id: req.userId, name: user.name}
            }
        });
        res.status(201).json({
            message: 'Post created successfully',
            post: post,
            creator: {_id: user._id, name: user.name}
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getPost = async (req, res, next) => {
    const postId = req.params.postId;
    try {
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error('Post is not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            message: 'Retrieving post success',
            post: post
        })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.editPost = async (req, res, next) => {
    try {
        let imageUrl;
        const postId = req.params.postId;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error('Validation failed, entered data is incorrect');
            error.statusCode = 422;
            throw error;
        }
        const title = req.body.title;
        const content = req.body.content;
        imageUrl = req.body.image;
        if (req.file) {
            imageUrl = req.file.path;
        }
        if (!imageUrl) {
            const error = new Error('Validation failed, no image provided');
            error.statusCode = 422;
            throw error;
        }
        const post = await Post.findById(postId).populate('creator');
        if (!post) {
            throw new Error('Post is not found');
        }
        if (post.creator._id.toString() !== req.userId) {
            const error = new Error('Not authorized for this action');
            error.statusCode = 403;
            throw error;
        }
        if (imageUrl !== post.imageUrl) {
            deleteFile(post.imageUrl);
        }
        post.title = title;
        post.content = content;
        post.imageUrl = imageUrl;
        const result = await post.save();
        res.status(200).json({message: 'Updated successfully', post: result});
        io.getIO().emit('posts', {
            action: 'update',
            post: result
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.deletePost = async (req, res, next) => {
    const postId = req.params.postId;
    try {
        const post = await Post.findById(postId);
        if (!post) {
            throw new Error('Post is not found');
        }
        // Check if the post is owned by a user
        if (post.creator.toString() !== req.userId) {
            const error = new Error('Not authorized for this action');
            error.statusCode = 403;
            throw error;
        }
        deleteFile(post.imageUrl);
        const result = await Post.findByIdAndDelete(postId);
        console.log(result);
        res.status(200).json({message: 'Successfully deleted'});
        io.getIO().emit('posts', {action: 'delete', post: postId});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getStatus = async (req, res, next) => {
    try {
        const userData = await User.findById(req.userId)
            .select('status');
        if (!userData) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        if (!userData.status) {
            const error = new Error('Status field not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({message: 'Success retrieving status', status: userData.status});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.updateStatus = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error('Validation failed, entered data is incorrect');
            error.statusCode = 422;
            throw error;
        }
        const status = req.body.status;
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        user.status = status;
        const result = await user.save();
        console.log(result);
        res.status(200).json({message: 'Status updated'});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const deleteFile = (pathToFile) => {
    const fullPath = path.join(__dirname, '..', pathToFile);
    fs.unlink(fullPath, (err) => {
        if (err) {
            throw err;
        }
    });
};