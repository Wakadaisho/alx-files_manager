"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _uuid = require("uuid");

var _fs = _interopRequireDefault(require("fs"));

var _mimeTypes = _interopRequireDefault(require("mime-types"));

var _mongodb = require("mongodb");

var _imageThumbnail = _interopRequireDefault(require("image-thumbnail"));

var _bull = _interopRequireDefault(require("bull"));

var _db = _interopRequireDefault(require("../utils/db"));

var _redis = _interopRequireDefault(require("../utils/redis"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

// Create Bull queue
var fileQueue = new _bull["default"]('fileQueue');

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
      var FOLDER_PATH, apiToken, userId, user, _req$body, name, type, _req$body$parentId, parentId, _req$body$isPublic, isPublic, data, parent, fileData, filePath, _ref, ops;

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
                error: 'Invalid type'
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
                _id: (0, _mongodb.ObjectId)(parentId)
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
              fileData = {
                userId: user._id,
                name: name,
                type: type,
                parentId: parentId,
                isPublic: isPublic
              };

              if (type !== 'folder') {
                _fs["default"].mkdirSync(FOLDER_PATH, {
                  recursive: true
                });

                filePath = "".concat(FOLDER_PATH, "/").concat((0, _uuid.v4)());

                _fs["default"].writeFileSync(filePath, data, 'base64');

                fileData.localPath = filePath; // Add thumbnail generation job to the queue

                fileQueue.add({
                  userId: user._id.toString(),
                  fileId: fileData._id.toString()
                });
              }

              _context.next = 33;
              return regeneratorRuntime.awrap(_db["default"].createFile(fileData));

            case 33:
              _ref = _context.sent;
              ops = _ref.ops;
              return _context.abrupt("return", res.status(201).send({
                id: ops[0]._id,
                userId: ops[0].userId,
                name: ops[0].name,
                type: ops[0].type,
                isPublic: ops[0].isPublic
              }));

            case 36:
            case "end":
              return _context.stop();
          }
        }
      });
    }
  }, {
    key: "putPublish",
    value: function putPublish(req, res) {
      var apiToken, userId, fileId, user, file;
      return regeneratorRuntime.async(function putPublish$(_context2) {
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
              fileId = req.params.id;
              _context2.next = 9;
              return regeneratorRuntime.awrap(_db["default"].getUser({
                _id: (0, _mongodb.ObjectId)(userId)
              }));

            case 9:
              user = _context2.sent;

              if (user) {
                _context2.next = 12;
                break;
              }

              return _context2.abrupt("return", res.status(401).send({
                error: 'Unauthorized'
              }));

            case 12:
              _context2.next = 14;
              return regeneratorRuntime.awrap(_db["default"].getFile({
                _id: (0, _mongodb.ObjectId)(fileId),
                userId: user._id
              }));

            case 14:
              file = _context2.sent;

              if (file) {
                _context2.next = 17;
                break;
              }

              return _context2.abrupt("return", res.status(404).send({
                error: 'Not found'
              }));

            case 17:
              file.isPublic = true;
              _context2.next = 20;
              return regeneratorRuntime.awrap(_db["default"].updateFile(fileId, {
                isPublic: true
              }));

            case 20:
              return _context2.abrupt("return", res.status(200).send({
                id: file._id,
                userId: file.userId,
                name: file.name,
                type: file.type,
                isPublic: true,
                parentId: file.parentId
              }));

            case 21:
            case "end":
              return _context2.stop();
          }
        }
      });
    }
  }, {
    key: "putUnpublish",
    value: function putUnpublish(req, res) {
      var apiToken, userId, fileId, user, file;
      return regeneratorRuntime.async(function putUnpublish$(_context3) {
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
              fileId = req.params.id;
              _context3.next = 9;
              return regeneratorRuntime.awrap(_db["default"].getUser({
                _id: (0, _mongodb.ObjectId)(userId)
              }));

            case 9:
              user = _context3.sent;

              if (user) {
                _context3.next = 12;
                break;
              }

              return _context3.abrupt("return", res.status(401).send({
                error: 'Unauthorized'
              }));

            case 12:
              _context3.next = 14;
              return regeneratorRuntime.awrap(_db["default"].getFile({
                _id: (0, _mongodb.ObjectId)(fileId),
                userId: user._id
              }));

            case 14:
              file = _context3.sent;

              if (file) {
                _context3.next = 17;
                break;
              }

              return _context3.abrupt("return", res.status(404).send({
                error: 'Not found'
              }));

            case 17:
              file.isPublic = false;
              _context3.next = 20;
              return regeneratorRuntime.awrap(_db["default"].updateFile(fileId, {
                isPublic: false
              }));

            case 20:
              return _context3.abrupt("return", res.status(200).send({
                id: file._id,
                userId: file.userId,
                name: file.name,
                type: file.type,
                isPublic: false,
                parentId: file.parentId
              }));

            case 21:
            case "end":
              return _context3.stop();
          }
        }
      });
    }
  }, {
    key: "getFile",
    value: function getFile(req, res) {
      var apiToken, userId, fileId, user, file, filePath, thumbnailPath, _mimeType, mimeType;

      return regeneratorRuntime.async(function getFile$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              apiToken = req.header('X-Token');
              _context4.next = 3;
              return regeneratorRuntime.awrap(_redis["default"].get("auth_".concat(apiToken)));

            case 3:
              userId = _context4.sent;

              if (userId) {
                _context4.next = 6;
                break;
              }

              return _context4.abrupt("return", res.status(401).send({
                error: 'Unauthorized'
              }));

            case 6:
              fileId = req.params.id;
              _context4.next = 9;
              return regeneratorRuntime.awrap(_db["default"].getUser({
                _id: (0, _mongodb.ObjectId)(userId)
              }));

            case 9:
              user = _context4.sent;

              if (user) {
                _context4.next = 12;
                break;
              }

              return _context4.abrupt("return", res.status(401).send({
                error: 'Unauthorized'
              }));

            case 12:
              _context4.next = 14;
              return regeneratorRuntime.awrap(_db["default"].getFile({
                _id: (0, _mongodb.ObjectId)(fileId),
                userId: user._id
              }));

            case 14:
              file = _context4.sent;

              if (file) {
                _context4.next = 17;
                break;
              }

              return _context4.abrupt("return", res.status(404).send({
                error: 'Not found'
              }));

            case 17:
              if (!(!file.isPublic && file.userId.toString() !== userId)) {
                _context4.next = 19;
                break;
              }

              return _context4.abrupt("return", res.status(404).send({
                error: 'Not found'
              }));

            case 19:
              if (!(file.type === 'folder')) {
                _context4.next = 21;
                break;
              }

              return _context4.abrupt("return", res.status(400).send({
                error: "A folder doesn't have content"
              }));

            case 21:
              filePath = file.localPath;

              if (_fs["default"].existsSync(filePath)) {
                _context4.next = 24;
                break;
              }

              return _context4.abrupt("return", res.status(404).send({
                error: 'Not found'
              }));

            case 24:
              if (!req.query.size) {
                _context4.next = 31;
                break;
              }

              thumbnailPath = "".concat(filePath, "_").concat(req.query.size);

              if (_fs["default"].existsSync(thumbnailPath)) {
                _context4.next = 28;
                break;
              }

              return _context4.abrupt("return", res.status(404).send({
                error: 'Not found'
              }));

            case 28:
              _mimeType = _mimeTypes["default"].lookup(thumbnailPath);
              res.setHeader('Content-Type', _mimeType);
              return _context4.abrupt("return", _fs["default"].createReadStream(thumbnailPath).pipe(res));

            case 31:
              mimeType = _mimeTypes["default"].lookup(filePath);
              res.setHeader('Content-Type', mimeType);
              return _context4.abrupt("return", _fs["default"].createReadStream(filePath).pipe(res));

            case 34:
            case "end":
              return _context4.stop();
          }
        }
      });
    }
  }]);

  return FilesController;
}();

var _default = FilesController;
exports["default"] = _default;