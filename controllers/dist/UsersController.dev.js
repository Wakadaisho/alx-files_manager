"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _sha = _interopRequireDefault(require("sha1"));

var _mongodb = require("mongodb");

var _db = _interopRequireDefault(require("../utils/db"));

var _redis = _interopRequireDefault(require("../utils/redis"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var UserController =
/*#__PURE__*/
function () {
  function UserController() {
    _classCallCheck(this, UserController);
  }

  _createClass(UserController, null, [{
    key: "postNew",
    value: function postNew(req, res) {
      var _req$body, email, password, user, hashedPassword, _ref, ops;

      return regeneratorRuntime.async(function postNew$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _req$body = req.body, email = _req$body.email, password = _req$body.password;

              if (email) {
                _context.next = 3;
                break;
              }

              return _context.abrupt("return", res.status(400).send({
                error: 'Missing email'
              }));

            case 3:
              if (password) {
                _context.next = 5;
                break;
              }

              return _context.abrupt("return", res.status(400).send({
                error: 'Missing password'
              }));

            case 5:
              _context.next = 7;
              return regeneratorRuntime.awrap(_db["default"].getUser({
                email: email
              }));

            case 7:
              user = _context.sent;

              if (!user) {
                _context.next = 10;
                break;
              }

              return _context.abrupt("return", res.status(400).send({
                error: 'Already exist'
              }));

            case 10:
              hashedPassword = (0, _sha["default"])(password);
              _context.next = 13;
              return regeneratorRuntime.awrap(_db["default"].createUser({
                email: email,
                password: hashedPassword
              }));

            case 13:
              _ref = _context.sent;
              ops = _ref.ops;
              return _context.abrupt("return", res.status(201).send({
                id: ops[0]._id,
                email: ops[0].email
              }));

            case 16:
            case "end":
              return _context.stop();
          }
        }
      });
    }
  }, {
    key: "getMe",
    value: function getMe(req, res) {
      var apiToken, userId, user;
      return regeneratorRuntime.async(function getMe$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              apiToken = req.header('X-Token');
              _context2.next = 3;
              return regeneratorRuntime.awrap(_redis["default"].get("auth_".concat(apiToken)));

            case 3:
              userId = _context2.sent;

              if (userId) {
                _context2.next = 6;
                break;
              }

              return _context2.abrupt("return", res.status(401).send({
                error: 'Unauthorized'
              }));

            case 6:
              _context2.next = 8;
              return regeneratorRuntime.awrap(_db["default"].getUser({
                _id: (0, _mongodb.ObjectId)(userId)
              }));

            case 8:
              user = _context2.sent;
              return _context2.abrupt("return", res.status(200).send({
                id: user._id,
                email: user.email
              }));

            case 10:
            case "end":
              return _context2.stop();
          }
        }
      });
    }
  }]);

  return UserController;
}();

var _default = UserController;
exports["default"] = _default;