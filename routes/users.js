const express = require("express");
const router = new express.Router();
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
const User = require("../models/user")

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
router.get("/", ensureLoggedIn, async (req, res, next)=>{
  try {
    const users = await User.all()
    res.json({users: users})
  } catch (error) {
    return next(error)
  }
})

/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
router.get("/:username", ensureCorrectUser, async (req, res, next)=>{
  try {
    const {username} = req.params;
    const user = await User.get(username);
    res.json({user:user})
  } catch (error) {
    return next(error)
  };
})

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get("/:username/to", ensureCorrectUser, async (req, res, next)=>{
  try {
    const {username} = req.params;
    const msgsToUser = await User.messagesTo(username);    
    res.json({messages:msgsToUser});
  } catch (error) {
    return next(error);
  };
})

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get("/:username/from", ensureCorrectUser, async(req, res, next)=>{
  try {
    const {username} = req.params;
    const msgsFromUser = await User.messagesFrom(username);
    res.jsons({messages:msgsFromUser}) 
  } catch (error) {
    return next(error)
  }
})
module.exports = router