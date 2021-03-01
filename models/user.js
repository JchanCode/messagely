/** User class for message.ly */
const db = require("../db")
const bcrypt = require("bcrypt")
const moment = require("moment")
const {BCRYPT_WORK_FACTOR} = require("../config")
const ExpressError = require("../expressError")

/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
    if (!username || !password || !first_name || !last_name || !phone) {
      throw new ExpressError("Missing Data", 400)
    }
    const hashedPw = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)
    const result = await db.query(`INSERT INTO users (username, password, first_name, last_name, phone,join_at, last_login_at)
                                   VALUES ($1,$2,$3,$4,$5, current_timestamp, current_timestamp)
                                   RETURNING username, password, first_name, last_name, phone, join_at, last_login_at`,
                                   [username, hashedPw, first_name, last_name, phone])
    return result.rows[0]
   }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(`SELECT password
                                     FROM users
                                     WHERE username=$1`,[username]);
    const hashedPw = result.rows[0].password
    return await bcrypt.compare(password, hashedPw);
   }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(`UPDATE users
                    SET last_login_at=current_timestamp
                    WHERE username=$1
                    RETURNING last_login_at`,[username])
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    const results = await db.query(`SELECT username, first_name, last_name, phone
                                    FROM users`)
    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(`SELECT username, first_name, last_name, phone, join_at, last_login_at
                                   FROM users
                                   WHERE username=$1`,[username]);
    return result.rows[0]
   }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const results = await db.query(`SELECT m.id,
                                           m.to_username,
                                           u.first_name,
                                           u.last_name,
                                           u.phone, 
                                           m.body, 
                                           m.sent_at, 
                                           m.read_at
                                    FROM messages AS m 
                                     JOIN users AS u 
                                     ON m.to_username = u.username
                                    WHERE m.from_username = $1`,[username])
    let msgs = results.rows;
    if (!msgs) {
      throw new ExpressError(`No such username:${username}`,404)
    };
    const resultArray = msgs.forEach( m => {
      return {
        id : m.id,
        to_user : {
          username: m.username,
          first_name: m.first_name,
          last_name: m.last_name,
          phone: m.phone
        },
        body : m.body,
        sent_at : m.sent_at,
        read_at : m.read_at 
      }
    });
    return resultArray
   }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) { 
    const results = await db.query(`SELECT m.id,
                                           m.from_username
                                           u.first_name,
                                           u.last_name,
                                           u.phone,
                                           m.body,
                                           m.sent_at,
                                           m.read_at
                                    FROM messages AS m,
                                      JOIN users AS U
                                      ON m.from_username = u.username
                                    WHERE m.to_username = $1`,[username])
    const msgs = results.rows;
    if (!msgs) {
      throw new ExpressError(`No such username:${username}`,404)
    };
    const resultArray = msgs.map( m =>{
      return {
        id : m.id,
        from_user : {
          id : m.id,
          first_name : m.first_name,
          last_name : m.last_name,
          phone : m.phone
        },
        body : m.body,
        sent_at : m.sent_at,
        read_at : m.read_at
      };
    })

    return resultArray;
  }

}


module.exports = User;