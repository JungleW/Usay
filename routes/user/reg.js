var express = require('express');
var crypto = require('crypto');
var User = require("../../models/user");
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('user/reg', {
        title: 'Register',
        index: 'reg',
        user: req.session.user
    });
});

router.post('/', function(req, res, next) {
    //检验用户输入
    if(req.body.account == undefined || req.body.account == ''){
        res.send({
            done: false,
            msg: "账号不能为空"
        });
        return;
    }else if(req.body.account.legnth > 15){
        res.send({
            done: false,
            msg: "账号长度不能大于15"
        });
        return;
    }
    if(req.body.password == undefined || req.body.password == ''){
        res.send({
            done: false,
            msg: "密码不能为空"
        });
        return;
    }else if(req.body.password.length <6 || req.body.password.legnth > 20){
        res.send({
            done: false,
            msg: "请确保密码长度为6-20"
        });
        return;
    }
    if(req.body.confirm_password != req.body.password){
        res.send({
            done: false,
            msg: "两次输入的口令不一致"
        });
        return;
    }
    
    //生成口令的数列值
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('base64');
    
    //获取待处理数据
    var newUser = {
        account: req.body.account,
        password: password
    };
    
    //检查用户名是否已存在
    User.searchOne({account: newUser.account}, function(err, user) {
        if(user)
            err = '该账户名已存在';
        if(err) {
             res.send({
                done: false,
                msg: err
             });
            return;
        }
        //如果不存在新用户则新增加
        User.save(newUser, function(err) {
            if(err){
                res.send({
                    done: false,
                    msg: err
                });
                return;
            }
            res.send({
                done: true,
                url: '/user/login'
            });
        });
    });
});


module.exports = router;
