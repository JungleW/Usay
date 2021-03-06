const co = require('co')
const debug = require('debug')('usay:database')
const mongoose = require('mongoose')

const config = require('../configs/global')
// const User = 'DO NOT REQUIRE USER.JS HERE'

const postSchema = mongoose.Schema({
  poster: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created: Date,
  baned: Boolean,
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
        created: new Date(),
        baned: false
      })
      yield post.save()
      return new Post(post)
    }).then(resolve, reject)
      .catch(reject)
  })
}

Post.delPost = function(postId) {
  return new Promise((resolve, reject) => {
    co(function*() {
        let result = {};
        yield PostModel.remove({'_id': Post._unifyId(postId)}, function(err, docs){ result = docs.result })
        return {result}
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

Post.getCount = function(condition) {
  return new Promise((resolve, reject) => {
    co(function*() {
      let query = PostModel.find(condition).sort({ created: -1 })
      let posts = yield query.exec()
      // posts.forEach(debug)
      return posts.length
    }).then(resolve, reject)
      .catch(reject)
  })
}

// db.posts.aggregate({$unwind: '$comments'}, {$sort: {created: -1, 'comments.created': -1}}).pretty()
Post.getPosts = function(condition, skip, limit) {
  return new Promise((resolve, reject) => {
    co(function*() {
      let query = PostModel.find(condition).sort({ created: -1 })
      skip && query.skip(skip)
      limit && query.limit(limit)
      let posts = yield query.exec()
      // posts.forEach(debug)
      return posts.map((post) => new Post(post))
    }).then(resolve, reject)
      .catch(reject)
  })
}
// db.posts.aggregate({$unwind: '$comments'}, {$sort: {created: -1, 'comments.created': -1}}).pretty()
Post.getPurePosts = function(condition, projection, skip, limit) {
  return new Promise((resolve, reject) => {
    co(function*() {
      let query = PostModel.find(condition, projection).sort({ created: -1 })
      skip && query.skip(skip)
      limit && query.limit(limit)
      let posts = yield query.exec()
      // posts.forEach(debug)
      return posts.map((post) => new Post(post))
    }).then(resolve, reject)
      .catch(reject)
  })
}

/*Post._unifyId = function(post) {
  if (post instanceof Post) {
    return post._id
  } else if (typeof post === 'undefined') {
    return undefined
  } else if (post === '') {
    return null
  } else if (typeof Post == 'string' || post instanceof String) {
    return mongoose.Types.ObjectId(post)
  } else if (post instanceof Object && post._id) {
    return mongoose.Types.Objectid(post._id)
  } else {
    throw new Error("Cannot cast from " + Object.getPrototypeOf(post) + 
      " to ObjectId")
  }
}*/
Post._unifyId = function(post) {
  if (post instanceof Post) {
    return post._id
  } else if (post === '') {
    return null
  } else if (typeof post === 'string' || post instanceof String) {
    return mongoose.Types.ObjectId(post)
  } else if (post instanceof Object && post._id) {
    return mongoose.Types.ObjectId(post._id)
  } else if (typeof post === 'undefined') {
    return undefined
  } else {
    debug(post instanceof Oost)
    throw new Error("Cannot cast from " + user.constructor.name + 
      " to ObjectId")
  }
}

// due to solving issues caused by circular dependency,
// the type of `from` and `to` must be mongoose.Types.ObjectId,
// which can converted by User._unifyId
Post.prototype.addComment = function(content, from, to) {
  let that = this
  return new Promise((resolve, reject) => {
    co(function*() {
      let comment = {
        from,
        to,
        content,
        created: new Date()
      }
      that.comments.push(comment)
      that._model.comments.push(comment)
      yield that._model.save()
      return that
    }).then(resolve, reject)
      .catch(reject)
  })
}

Post.prototype.removeComment = function(commentId) {
  let that = this
  return new Promise((resolve, reject) => {
    co(function*() {
      let indexToDelete = that.comments.findIndex(elmt => elmt._id == commentId)
      if (indexToDelete >= 0) {
        that.comments.splice(indexToDelete, 1)
        that._model.comments.splice(indexToDelete, 1)
        yield that._model.save()
      }
      return that
    }).then(resolve, reject)
      .catch(reject)
  })
}
Post.prototype.modify = function(key, value) {
  let that = this
  return new Promise((resolve, reject) => {
    co(function*() {
      that._model[key] = value
      yield that._model.save()
      that[key] = value
      resolve(that)
    }).then(resolve, reject)
      .catch(reject)
  })
}
module.exports = Post
