const co = require('co')
const debug = require('debug')('usay:database')
const mongoose = require('mongoose')

const config = require('../configs/global.js')

const postSchema = mongoose.Schema({
  poster: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created: Date,
  content: String,
  upvoters: [{
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    created: Date
  }],
  images: [{
    url: String
  }],
  comments: [{
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    created: Date
  }]
})

const PostModel = mongoose.model('Post', postSchema)

let Post = function(model) {
  let modelObj = model.toObject()
  for (let prop in modelObj) {
    this[prop] = modelObj[prop]
  }
  this._model = model
}

Post.addPost = function(poster, content, images) {
  return new Promise((resolve, reject) => {
    co(function*() {
      debug(`${poster.username}(id: ${poster._id}) wants to post!`)
      let post = new PostModel({
        poster: poster._id,
        content,
        images,
        created: new Date()
      })
      yield post.save()
      return new Post(post)
    }).then(resolve, reject)
      .catch(reject)
  })
}

Post.getPostById = function(postId) {
  return new Promise((resolve, reject) => {
    co(function*() {
      let post = yield PostModel.findById(postId).exec()
      return new Post(post)
    }).then(resolve, reject)
      .catch(reject)
  })
}

Post.getPosts = function(condition, skip, limit) {
  return new Promise((resolve, reject) => {
    co(function*() {
      let query = PostModel.find(condition)
      skip && query.skip(skip)
      limit && query.limit(limit)
      let posts = yield query.exec()
      // posts.forEach(debug)
      return posts.map((post) => new Post(post))
    }).then(resolve, reject)
      .catch(reject)
  })
}

Post._unifyId = function(post) {
  if (post instanceof Post) {
    return post._id
  } else if (post instanceof String) {
    return mongoose.Types.ObjectId(post)
  } else if (post instanceof Object && post._id) {
    return mongoose.Types.Objectid(post._id)
  } else {
    throw new Error("Cannot cast from " + Object.getPrototypeOf(post) + 
      " to ObjectId")
  }
}

module.exports = Post
