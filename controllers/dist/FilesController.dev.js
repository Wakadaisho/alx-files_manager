"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _uuid = require("uuid");

var _fs = _interopRequireDefault(require("fs"));

var _mongodb = require("mongodb");

var _db = _interopRequireDefault(require("../utils/db"));

var _redis = _interopRequireDefault(require("../utils/redis"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var FilesController =
/*#__PURE__*/
function () {
  function FilesController() {
    _classCallCheck(this, FilesController);
  }

  _createClass(FilesController, null, [{
    key: "getFileTypes",
    value: function getFileTypes() {
      return ['folder', 'file', 'image'];
    }
  }, {
    key: "postUpload",
    value: function postUpload(req, res) {
      var FOLDER_PATH, apiToken, userId, user, _req$body, name, type, _req$body$parentId, parentId, _req$body$isPublic, isPublic, data, parent, _ref, ops;

      return regeneratorRuntime.async(function postUpload$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
              apiToken = req.header('X-Token');
              _context.next = 4;
              return regeneratorRuntime.awrap(_redis["default"].get("auth_".concat(apiToken)));

            case 4:
              userId = _context.sent;

              if (userId) {
                _context.next = 7;
                break;
              }

              return _context.abrupt("return", res.status(401).send({
                error: 'Unauthorized'
              }));

            case 7:
              _context.next = 9;
              return regeneratorRuntime.awrap(_db["default"].getUser({
                _id: (0, _mongodb.ObjectId)(userId)
              }));

            case 9:
              user = _context.sent;

              if (user) {
                _context.next = 12;
                break;
              }

              return _context.abrupt("return", res.status(401).send({
                error: 'Unauthorized'
              }));

            case 12:
              _req$body = req.body, name = _req$body.name, type = _req$body.type, _req$body$parentId = _req$body.parentId, parentId = _req$body$parentId === void 0 ? 0 : _req$body$parentId, _req$body$isPublic = _req$body.isPublic, isPublic = _req$body$isPublic === void 0 ? false : _req$body$isPublic, data = _req$body.data;

              if (name) {
                _context.next = 15;
                break;
              }

              return _context.abrupt("return", res.status(400).send({
                error: 'Missing name'
              }));

            case 15:
              if (type) {
                _context.next = 17;
                break;
              }

              return _context.abrupt("return", res.status(400).send({
                error: 'Missing type'
              }));

            case 17:
              if (FilesController.getFileTypes().includes(type)) {
                _context.next = 19;
                break;
              }

              return _context.abrupt("return", res.status(400).send({
                error: 'Missing type'
              }));

            case 19:
              if (!(!data && type !== 'folder')) {
                _context.next = 21;
                break;
              }

              return _context.abrupt("return", res.status(400).send({
                error: 'Missing data'
              }));

            case 21:
              if (!parentId) {
                _context.next = 29;
                break;
              }

              _context.next = 24;
              return regeneratorRuntime.awrap(_db["default"].getFile({
                _id: parentId
              }));

            case 24:
              parent = _context.sent;

              if (parent) {
                _context.next = 27;
                break;
              }

              return _context.abrupt("return", res.status(400).send({
                error: 'Parent not found'
              }));

            case 27:
              if (!(parent.type !== 'folder')) {
                _context.next = 29;
                break;
              }

              return _context.abrupt("return", res.status(400).send({
                error: 'Parent is not a folder'
              }));

            case 29:
              if (type !== 'folder') {
                _fs["default"].mkdirSync(FOLDER_PATH, {
                  recursive: true
                });

                _fs["default"].writeFileSync("".concat(FOLDER_PATH, "/").concat((0, _uuid.v4)()), data);
              }

              _context.next = 32;
              return regeneratorRuntime.awrap(_db["default"].createFile({
                userId: user._id,
                name: name,
                type: type,
                parentId: parentId,
                isPublic: isPublic,
                data: data
              }));

            case 32:
              _ref = _context.sent;
              ops = _ref.ops;
              return _context.abrupt("return", res.status(201).send({
                id: ops[0]._id,
                userId: ops[0].userId,
                name: ops[0].name,
                type: ops[0].type,
                isPublic: ops[0].isPublic
              }));

            case 35:
            case "end":
              return _context.stop();
          }
        }
      });
    }
  }, {
    key: "getShow",
    value: function getShow(req, res) {
      var apiToken, userId, user, file;
      return regeneratorRuntime.async(function getShow$(_context2) {
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

              if (user) {
                _context2.next = 11;
                break;
              }

              return _context2.abrupt("return", res.status(401).send({
                error: 'Unauthorized'
              }));

            case 11:
              _context2.next = 13;
              return regeneratorRuntime.awrap(_db["default"].getFile({
                _id: req.params.id,
                userId: user._id
              }));

            case 13:
              file = _context2.sent;

              if (file) {
                _context2.next = 16;
                break;
              }

              return _context2.abrupt("return", res.status(404).send({
                error: 'Not found'
              }));

            case 16:
              return _context2.abrupt("return", res.status(200).send({
                id: file._id,
                userId: file.userId,
                name: file.name,
                type: file.type,
                isPublic: file.isPublic
              }));

            case 17:
            case "end":
              return _context2.stop();
          }
        }
      });
    }
  }, {
    key: "getIndex",
    value: function getIndex(req, res) {
      var apiToken, userId, user, _req$query$parentId, parentId, parent, files;

      return regeneratorRuntime.async(function getIndex$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              apiToken = req.header('X-Token');
              _context3.next = 3;
              return regeneratorRuntime.awrap(_redis["default"].get("auth_".concat(apiToken)));

            case 3:
              userId = _context3.sent;

              if (userId) {
                _context3.next = 6;
                break;
              }

              return _context3.abrupt("return", res.status(401).send({
                error: 'Unauthorized'
              }));

            case 6:
              _context3.next = 8;
              return regeneratorRuntime.awrap(_db["default"].getUser({
                _id: (0, _mongodb.ObjectId)(userId)
              }));

            case 8:
              user = _context3.sent;

              if (user) {
                _context3.next = 11;
                break;
              }

              return _context3.abrupt("return", res.status(401).send({
                error: 'Unauthorized'
              }));

            case 11:
              _req$query$parentId = req.query.parentId, parentId = _req$query$parentId === void 0 ? 0 : _req$query$parentId;
              _context3.next = 14;
              return regeneratorRuntime.awrap(_db["default"].getFile({
                parentId: parentId
              }));

            case 14:
              parent = _context3.sent;

              if (!(parent && parent.type !== 'folder')) {
                _context3.next = 17;
                break;
              }

              return _context3.abrupt("return", res.status(200).send([]));

            case 17:
              _context3.next = 19;
              return regeneratorRuntime.awrap(_db["default"].getFiles({
                parentId: parentId,
                userId: user._id
              }));

            case 19:
              files = _context3.sent;
              return _context3.abrupt("return", res.status(200).send(files));

            case 21:
            case "end":
              return _context3.stop();
          }
        }
      });
    }
  }]);

  return FilesController;
}();

var _default = FilesController;
exports["default"] = _default;