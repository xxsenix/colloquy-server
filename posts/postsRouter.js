"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const passport = require("passport");
const { Post } = require("./models");
const { User } = require("./../users/models");
const router = express.Router();
const jwtAuth = passport.authenticate("jwt", { session: false });

// Fetch all posts
router.get("/", (req, res) => {
  Post.find()
    .then(posts => {
      res.json(posts.map(post => post.serialize()));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    });
});

// Fetch one post
router.get("/:id", (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post.serialize()))
    .catch(err => {
      console.log(err);
      res.status(500).json({ error: "something went horribly wrong" });
    });
});

// Create new post
router.post("/", jwtAuth, jsonParser, (req, res) => {
  const requiredFields = ["title", "body", "category"];
  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }
  User.findOne({
    username: req.user.username
  }).then(user => {
    Post.create({
      title: req.body.title,
      body: req.body.body,
      author: user._id,
      category: req.body.category
    })
      .then(post => res.status(201).json(post))
      .catch(err => {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
      });
  });
});

// Delete post
router.delete("/:post", jwtAuth, (req, res) => {
  Post.findById(req.params.post).then(post => {
    if (!(req.user.username === post.author.username)) {
      res.status(403).json({
        message: "You must be the creator of that post in order to do that"
      });
    }
  });
  Post.findByIdAndRemove(req.params.post)
    .then(() => {
      console.log(`Deleted post with id \`${req.params.post}\``);
      res.status(204).end();
    })
    .catch(err => res.status(500).json({ message: "Something went wrong" }));
});

// Update post
router.put("/:post", jwtAuth, jsonParser, (req, res) => {
  Post.findById(req.params.post).then(post => {
    if (!(req.user.username === post.author.username)) {
      res.status(403).json({
        message: "You must be the creator of that post in order to do that"
      });
    }

    if (!(req.params.post && req.body.id && req.params.post === req.body.id)) {
      res.status(500).json({
        message: "Request path id and request body id values must match"
      });
    }

    const updated = {};
    const updateableFields = ["title", "body", "category"];
    updateableFields.forEach(field => {
      if (field in req.body) {
        updated[field] = req.body[field];
      }
    });

    Post.findByIdAndUpdate(req.params.post, { $set: updated }, { new: true })
      .then(post => res.status(204).end())
      .catch(err => res.status(500).json({ message: "Something went wrong" }));
  });
});

// Create new comment
router.post("/:post", jwtAuth, jsonParser, (req, res) => {
  const requiredFields = ["body"];
  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }
  User.findOne({
    username: req.user.username
  }).then(user => {
    Post.findById(req.params.post)
      .then(post => {
        post.comments.push({ body: req.body.body, author: user._id });
        post.save();
        res.status(201).json(post);
      })
      .catch(err => console.error(err));
  });
});

// Delete comment
router.delete("/:post/:comment", jwtAuth, (req, res) => {
  Post.findById(req.params.post)
    .then(post => {
      post.comments.id(req.params.comment).remove();
      post.save();
      res.status(204).end();
    })
    .catch(err => console.error(err));
});

module.exports = router;
