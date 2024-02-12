"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _uuid = require("uuid");

var _sha = _interopRequireDefault(require("sha1"));

var _db = _interopRequireDefault(require("../utils/db"));

var _redis = _interopRequireDefault(require("../utils/redis"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var AuthController =
/*#__PURE__*/
function () {
  function AuthController() {
    _classCallCheck(this, AuthController);
  }

  _createClass(AuthController, null, [{
    key: "getConnect",
    value: function getConnect(req, res) {
      var authHeader, _Buffer$from$toString, _Buffer$from$toString2, email, password, hashedPassword, user, token, key;

      return regeneratorRuntime.async(function getConnect$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              authHeader = req.header('Authorization');

              if (!(!authHeader || !authHeader.startsWith('Basic '))) {
                _context.next = 3;
                break;
              }

              return _context.abrupt("return", res.status(401).json({
                error: 'Invalid credentials format'
              }));

            case 3:
              _Buffer$from$toString = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':'), _Buffer$from$toString2 = _slicedToArray(_Buffer$from$toString, 2), email = _Buffer$from$toString2[0], password = _Buffer$from$toString2[1];
              hashedPassword = (0, _sha["default"])(password);
              _context.next = 7;
              return regeneratorRuntime.awrap(_db["default"].getUser({
                email: email,
                password: hashedPassword
              }));

            case 7:
              user = _context.sent;

              if (user) {
                _context.next = 10;
                break;
              }

              return _context.abrupt("return", res.status(401).json({
                error: 'Unauthorized'
              }));

            case 10:
              token = (0, _uuid.v4)();
              key = "auth_".concat(token);
              _context.next = 14;
              return regeneratorRuntime.awrap(_redis["default"].set(key, user._id.toString(), 24 * 60 * 60));

            case 14:
              return _context.abrupt("return", res.status(200).json({
                token: token
              }));

            case 15:
            case "end":
              return _context.stop();
          }
        }
      });
    }
  }, {
    key: "getDisconnect",
    value: function getDisconnect(req, res) {
      var apiToken, userId;
      return regeneratorRuntime.async(function getDisconnect$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              apiToken = req.header('X-Token');

              if (apiToken) {
                _context2.next = 3;
                break;
              }

              return _context2.abrupt("return", res.status(401).json({
                error: 'Unauthorized'
              }));

            case 3:
              _context2.next = 5;
              return regeneratorRuntime.awrap(_redis["default"].get("auth_".concat(apiToken)));

            case 5:
              userId = _context2.sent;

              if (userId) {
                _context2.next = 8;
                break;
              }

              return _context2.abrupt("return", res.status(401).json({
                error: 'Unauthorized'
              }));

            case 8:
              _context2.next = 10;
              return regeneratorRuntime.awrap(_redis["default"].del("auth_".concat(apiToken)));

            case 10:
              return _context2.abrupt("return", res.status(204).send());

            case 11:
            case "end":
              return _context2.stop();
          }
        }
      });
    }
  }]);

  return AuthController;
}();

var _default = AuthController;
exports["default"] = _default;