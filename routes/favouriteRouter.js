const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favourites = require('../models/favourites');
const { count } = require("../models/favourites");

const favouriteRouter = express.Router();

favouriteRouter.use(bodyParser.json());

favouriteRouter.route("/")
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favourites.find({user: req.user._id})
            .populate('user')
            .populate('dishes')
            .then((favourites) =>  {
                if(favourites){
                    // if(favourites.user._id.toString() === req.user.id.toString()){
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favourites);
                    // }
                }
                else{
                    var err = new Error('There is no Favourites');
                    err.status = 404;
                    return next(err);
                }
                
                
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        var dishId = req.body._id;
        console.log(dishId);
        Favourites.find({
        user: req.user._id
        }).count()
        .populate('user', 'dishes')
        .then((count) => {
            if (count === 0) {
                Favourites.create({
                user: req.user._id
                })
                .then((favourite) => {
                    favourite.dishes.push(dishId);
                    favourite.save()
                    .then((favourite) => {
                        Favourites.findById(favourite._id)
                        .populate('user')
                        .populate('dishes')
                        .then((favourite) => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type' , 'application/json');
                            res.json(favourite);
                        }, (err) => next(err))
                        .catch((err) => next(err));
                        
                    })
                }, (err) => next(err))
                .catch((err) => next(err));
               
            } 
            else {
                Favourites.findOne({
                user: req.user._id
                })
                .populate('user', 'dishes')
                .then((favorites) => {
                    if(favorites) {
                        if (favorites.dishes.indexOf(dishId) > -1) {
                            console.log('Not Updated Favorites!');
                            res.json(favorites);
                        } else {
                            favorites.dishes.push(dishId);
                            favorites.save()
                            .then((favourite) => {
                                Favourites.findById(favourite._id)
                                .populate('user')
                                .populate('dishes')
                                .then((favourite) => {
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(favourite);
                                })
                            })
                            .catch((err) => next(err));
                        }
                    }
                    
                }, (err) => next(err))
                .catch((err) => next(err));   
        }
        
    })
    .catch((err) => next(err)); 
})
    
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favourites.remove({user: req.user._id})
            .then((resp) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(resp);
            }, (err) => next(err))
            .catch((err) => next(err));

    });

favouriteRouter.route('/:dishId')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, (req, res, next) => {
        Favorites.findOne({user: req.user._id})
        .then((favorites) => {
            if (!favorites) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exists": false, "favorites": favorites});
            }
            else {
                if (favorites.dishes.indexOf(req.params.dishId) < 0) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    return res.json({"exists": false, "favorites": favorites});
                }
                else {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    return res.json({"exists": true, "favorites": favorites});
                }
            }
    
        }, (err) => next(err))
        .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        // Favourites.findById
        // Favourites.find({user: req.user._id})
        //     .populate('user', 'dishes')
        //     .then((favourites) => {
        //         if(favourites != null) {
        //             favourites.dishes.push(req.params.dishId);
        //             favourites.save()
        //                 .then((favs) => {
        //                     res.statusCode = 201;
        //                     res.setHeader("Content-Type", "application/json");
        //                     res.json(favs);
        //                     console.log("Favourites Created");
        //                 }, (err) => next(err))
        //                 .catch((err) => next(err))
        //         }
        //         else{
        //             fav = Favourites.create({user: req.user._id, dishes})
        //                 .then((favs) => {
        //                     favs.dishes.push(req.params.dishId);
        //                     favs.save()
        //                     .then((err, fav) => {
        //                         res.statusCode = 201;
        //                         res.setHeader("Content-Type", "application/json");
        //                         res.json(fav);
        //                     }, (err) => next(err))
        //                     .catch((err) => next(err));
                            
        //                     console.log("Favourites Created");
        //                 }, (err) => next(err))
        //                 .catch((err) => next(err));
        //         }
        //     }, (err) => next(err) )
        //     .catch((err) => next(err));

        Favourites.find({})
            .populate('user')
            .populate('dishes')
            .then((favourites) => {
                var user;
                if(favourites)
                    user = favourites.filter(fav => fav.user._id.toString() === req.user.id.toString())[0];
                if(!user) 
                    user = new Favourites({user: req.user.id});
                if(!user.dishes.find((d_id) => {
                    if(d_id._id)
                        return d_id._id.toString() === req.params.dishId.toString();
                }))
                    user.dishes.push(req.params.dishId);
                
                user.save()
                    .then((userFavs) => {
                        res.statusCode = 201;
                        res.setHeader("Content-Type", "application/json");
                        res.json(userFavs);
                        console.log("Favourites Created");
                    }, (err) => next(err))
                    .catch((err) => next(err));

            })
            .catch((err) => next(err));

    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favourites.update({user: req.user._id}, {$pull: {dishes: req.params.dishId}})
            .then((favourite) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favourite);
            }, (err) => next(err))
            .catch((err) => next(err));
    });


module.exports = favouriteRouter;