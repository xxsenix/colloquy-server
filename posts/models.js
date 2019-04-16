"use strict";

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const commentSchema = mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  body: { type: String, required: true },
  created: { type: Date, default: Date.now }
});

const postSchema = mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  category: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  comments: [commentSchema],
  votes: { type: Number, default: 0 },
  created: { type: Date, default: Date.now }
});

postSchema.pre("find", function(next) {
  this.populate("author");
  next();
});

postSchema.pre("findOne", function(next) {
  this.populate("author");
  next();
});

postSchema.pre("findById", function(next) {
  this.populate("author");
  next();
});

postSchema.virtual("username").get(function() {
  return this.author.username;
});

postSchema.methods.serialize = function() {
  return {
    id: this._id,
    title: this.title,
    body: this.body,
    author: this.username,
    comments: this.comments,
    category: this.category,
    votes: this.votes,
    created: this.created
  };
};

const Post = mongoose.model("Post", postSchema);

module.exports = { Post };
