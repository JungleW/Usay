const co = require('co')
const debug = require('debug')('usay:server')
const express = require('express');
const CONST = require('../../models/constants')
const cfg = require('../../configs/global')
const db = require('../../models/db')
const Post = require('../../models/post')
const User = require('../../models/user')
var moment = require('moment');
const router = express.Router()

/* GET item by id */
router.get('/view', function(req, res, next) {
    
});

/* GET list by pageNum, amount, search string */
router.get('/list', function(req, res, next) {

});

//edit
router.get('/edit', function(req, res, next) {
    res.render('admin/_user_edit', {
        title: 'User_edit',
        index: 'user_edit',
        user: {}
    });
});

router.post('/update', function(req, res, next) {
    let id = req.session.user._id;
    let key = req.body.key;
    let value = req.body.value;
    User.getUserById(id).then(function(user) {
        user.modify(key, value).then(function(){
            res.send({
                done: true
            });
        },function(err){
            res.send({
                done: false,
                msg:"修改失败"
            });
        })
    }, function(err) {
        res.send({
            done: false,
            msg: "获取用户失败"
        });
    });
});

router.get('/postsStatus', function(req, res, next) {
    let postIds = req.query.postIds.split(",");
    let userId = req.session.user._id;
    User.getUserById(userId).then(function(user) {
        let favorites = user.favourites.map(function(elem, i){ return String(elem.to)})
        let upvotes = user.upvoteds.map(function(elem, i){ return String(elem.to)})
        let status = postIds.map(function(elem, i){
            return {
                postId: elem,
                favorite: (favorites.indexOf(elem) > -1)?true:false,
                upvote: (upvotes.indexOf(elem) > -1)?true:false
            }
        });
        res.send({
            done: true,
            status: status
        })
    }, console.log)

});

router.post('/upvote', function(req, res, next) {
    let postId = Post._unifyId(req.body.postId);
    let oper = req.body.oper;
    let userId = req.session.user._id;
    if(oper == "add"){
        User.getUserById(userId).then(function(user) {
            user.upvote(postId).then(function(data){
                res.send({
                    done: true,
                    todo: "del"
                })
            }, function(err){
                res.send({
                    done: false,
                    msg: err.toString()
                })
                console.log(arguments)
            })
        }, console.log)
    }else if(oper == "del"){
        User.getUserById(userId).then(function(user) {
            user.unupvote(postId).then(function(data){
                res.send({
                    done: true,
                    todo: "add"
                })
            }, function(err){
                res.send({
                    done: false,
                    msg: err.toString()
                })
                console.log(arguments)
            })
        }, console.log)
    }
});

router.post('/favorite', function(req, res, next) {
    let postId = Post._unifyId(req.body.postId);
    let oper = req.body.oper;
    let userId = req.session.user._id;
    if(oper == "add"){
        User.getUserById(userId).then(function(user) {
            user.favorite(postId).then(function(data){
                res.send({
                    done: true,
                    todo: "del"
                })
            }, function(err){
                res.send({
                    done: false,
                    msg: err.toString()
                })
                console.log(arguments)
            })
        }, console.log)
    }else if(oper == "del"){
        User.getUserById(userId).then(function(user) {
            user.unfavorite(postId).then(function(data){
                res.send({
                    done: true,
                    todo: "add"
                })
            }, function(err){
                res.send({
                    done: false,
                    msg: err.toString()
                })
                console.log(arguments)
            })
        }, console.log)
    }
});


router.post('/follow', function(req, res, next) {
    let followId = Post._unifyId(req.body.userId);
    let oper = req.body.oper;
    let userId = req.session.user._id;
    if(oper == "add"){
        User.getUserById(userId).then(function(user) {
            user.follow(followId).then(function(data){
                res.send({
                    done: true,
                    todo: "del"
                })
            }, function(err){
                res.send({
                    done: false,
                    msg: err.toString()
                })
                console.log(arguments)
            })
        }, console.log)
    }else if(oper == "del"){
        User.getUserById(userId).then(function(user) {
            user.unfollow(followId).then(function(data){
                res.send({
                    done: true,
                    todo: "add"
                })
            }, function(err){
                res.send({
                    done: false,
                    msg: err.toString()
                })
                console.log(arguments)
            })
        }, console.log)
    }else if(oper == "state"){
        User.getUserById(userId).then(function(user) {
            user.followId(followId).then(function(data){
                todo = data==true?"del":"add"
                res.send({
                    done: true,
                    todo: todo
                })
            }, function(err){
                res.send({
                    done: false,
                    msg: err.toString()
                })
                console.log(arguments)
            })
        }, console.log)
    }
});

router.post('/comment', function(req, res, next) {
    let content = req.body.content;
    let postId = req.body.postId;
    let userId = User._unifyId(req.body.userId);
    console.log(postId)
    Post.getPostById(postId).then(function(post) {
        post.addComment(content, req.session.user, userId).then(function(data){
            res.send({
                done: true,
                data: data
            })
        }, function(err){
            res.send({
                done: false,
                msg: err.toString()
            })
            console.log(arguments)
        })
    }, console.log)
});

router.post('/uncomment', function(req, res, next) {
    let postId = req.body.postId;
    let commentId = req.body.commentId;
    console.log(postId, commentId)
    Post.getPostById(postId).then(function(post) {
        post.removeComment(commentId).then(function(data){
            res.send({
                done: true,
                data: data
            })
        }, function(err){
            res.send({
                done: false,
                msg: err.toString()
            })
            console.log(arguments)
        })
    }, console.log)

});

router.get('/listFolloweds', function(req, res, next) {
    let currPage = req.query.currPage
    let pageSize = req.query.pageSize
    let totalPages
    co(function*() {
        let user = yield User.getUserById(req.session.user._id)
        let followed = yield user.getFollowedUsers()
        count = Math.ceil(followed.length / pageSize)
        let sliced = followed.slice((currPage - 1) * pageSize, currPage * pageSize)
        for (let userIndex in sliced) {
            sliced[userIndex] = {
                _id: sliced[userIndex],
                name: yield getUsername(sliced[userIndex]),
                bio: yield getBio(sliced[userIndex])
            }
        }
    }).then(function(followed) {
        res.send({
            done: true,
            list: followed,
            pageInfo: {
                currentPage: currentPage,
                pageSize: pageSize,
                totalPages: totalPages
            }
        })
    }, console.log).catch(console.log)
})

router.get('/getFollowedList', function(req, res, next) {
    let currentPage = req.query.currentPage*1
    let pageSize = req.query.pageSize*1;
    var condition = {}, skip = (currentPage-1)*pageSize, limit = pageSize;
    co(function*() {
        // here needs optimization someday
        let user = yield User.getUserById(req.session.user._id)
        let count = yield Post.getCount(condition);
        let totalPages = Math.ceil(count/pageSize)
        let followers = yield user.getFollowers()
        for (let follower of followers) {
            post.poster = yield User.getUserById(post.poster)
            post.created = moment(post.created).format('YYYY/MM/DD HH:mm')
            if (!post.poster.nickname) {
                post.poster.nickname = post.poster.username
            }
            if (!post.poster.avatar) {
                post.poster.avatar = cfg.user.defaultAvatar
            }
            for (let cmt of post.comments) {
                cmt.from = { _id: cmt.from, name: yield getUsername(cmt.from) }
                cmt.to = { _id: cmt.to, name: yield getUsername(cmt.to) }

            }
        }
        return {
            done: true,
            list: followers,
            pageInfo: {
                currentPage:currentPage,
                user: req.session.user,
                pageSize: pageSize,
                totalPages: totalPages
            }
        }
    }).then(function(data) {
        // debug(data)
        res.send(data)
    }, console.log)
        .catch(console.log);
});

router.get('/getListByUserId', function(req, res, next) {
    let isMe = false
    let userId = req.query.userid
    if(!userId || userId == "null"){
        if(req.session.user){
            userId = req.session.user._id
            isMe = true
        }else{
            res.send({
                done: false,
                msg: "用户未登录 && userId为空"
            })
            return;
        }
    }
    if( !isMe && req.session.user && userId == req.session.user._id){
        isMe = true
    }
    let currentPage = req.query.currentPage*1
    let pageSize = req.query.pageSize*1;
    var condition = {}, skip = (currentPage-1)*pageSize, limit = pageSize;
    var totalPages = 1;
    co(function*() {
        // here needs optimization someday
        let user = yield User.getUserById(userId)
        let allPosts = yield user.getPosts()
        let count = allPosts.length
        totalPages = Math.ceil(count/pageSize)
        let posts = yield user.getPosts()
        for (let post of posts) {
            post.poster = yield User.getUserById(post.poster)
            post.created = moment(post.created).format('YYYY年MM月DD日')
            if (!post.poster.nickname) {
                post.poster.nickname = post.poster.username
            }
            if (!post.poster.avatar) {
                post.poster.avatar = cfg.user.defaultAvatar
            }
            for (let cmt of post.comments) {
                cmt.from = { _id: cmt.from, name: yield getUsername(cmt.from) }
                cmt.to = { _id: cmt.to, name: yield getUsername(cmt.to) }

            }
        }
        return posts
    }).then(function(data) {
        // debug(data)
        res.send({
            done: true,
            isMe: isMe,
            list: data,
            pageInfo: {
                currentPage:currentPage,
                user: req.session.user,
                pageSize: pageSize,
                totalPages: totalPages
            }
        })
    }, console.log)
        .catch(console.log);
});

let usernames = new Map()
let bios = new Map()

function getUsername(id) {
    return new Promise((resolve, reject) => {
        if (!id) {
            resolve(null)
        } else if (usernames.has(id)) {
            resolve(usernames.get(id))
        } else {
            co(function*() {
                let user = yield User.getUserById(id)
                usernames.set(id, user.username)
                // debug(id, user.username)
                return user.username
            }).then(resolve, reject).catch(reject)
        }
    })
}

function getBio(id) {
    return new Promise((resolve, reject) => {
        if (!id) {
            resolve(null)
        } else if (bios.has(id)) {
            resolve(bios.get(id))
        } else {
            co(function*() {
                let user = yield User.getUserById(id)
                bios.set(id, user.bio)
                // debug(id, user.username)
                return user.bio
            }).then(resolve, reject).catch(reject)
        }
    })
}

module.exports = router;
