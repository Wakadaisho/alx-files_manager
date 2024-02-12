"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mongodb = require("mongodb");

var _uuid = require("uuid");

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

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
    key: "postUpload",
    value: function postUpload(req, res) {
      var token, key, userId, _req$body, name, type, _req$body$parentId, parentId, _req$body$isPublic, isPublic, data, parentFile, filePath, localPath, fileContent, newFile, _ref, ops;

      return regeneratorRuntime.async(function postUpload$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              token = req.header('X-Token');
              key = "auth_".concat(token);
              _context.next = 5;
              return regeneratorRuntime.awrap(_redis["default"].get(key));

            case 5:
              userId = _context.sent;

              if (userId) {
                _context.next = 8;
                break;
              }

              return _context.abrupt("return", res.status(401).json({
                error: 'Unauthorized'
              }));

            case 8:
              _req$body = req.body, name = _req$body.name, type = _req$body.type, _req$body$parentId = _req$body.parentId, parentId = _req$body$parentId === void 0 ? 0 : _req$body$parentId, _req$body$isPublic = _req$body.isPublic, isPublic = _req$body$isPublic === void 0 ? false : _req$body$isPublic, data = _req$body.data;

              if (name) {
                _context.next = 11;
                break;
              }

              return _context.abrupt("return", res.status(400).json({
                error: 'Missing name'
              }));

            case 11:
              if (!(!type || !['folder', 'file', 'image'].includes(type))) {
                _context.next = 13;
                break;
              }

              return _context.abrupt("return", res.status(400).json({
                error: 'Missing type'
              }));

            case 13:
              if (!(type !== 'folder' && !data)) {
                _context.next = 15;
                break;
              }

              return _context.abrupt("return", res.status(400).json({
                error: 'Missing data'
              }));

            case 15:
              if (!(parentId !== 0)) {
                _context.next = 23;
                break;
              }

              _context.next = 18;
              return regeneratorRuntime.awrap(_db["default"].getFile({
                _id: (0, _mongodb.ObjectId)(parentId)
              }));

            case 18:
              parentFile = _context.sent;

              if (parentFile) {
                _context.next = 21;
                break;
              }

              return _context.abrupt("return", res.status(400).json({
                error: 'Parent not found'
              }));

            case 21:
              if (!(parentFile.type !== 'folder')) {
                _context.next = 23;
                break;
              }

              return _context.abrupt("return", res.status(400).json({
                error: 'Parent is not a folder'
              }));

            case 23:
              filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
              localPath = _path["default"].join(filePath, (0, _uuid.v4)());

              if (!_fs["default"].existsSync(filePath)) {
                _fs["default"].mkdirSync(filePath, {
                  recursive: true
                });
              }

              if (type !== 'folder') {
                fileContent = Buffer.from(data, 'base64');

                _fs["default"].writeFileSync(localPath, fileContent);
              }

              newFile = {
                userId: userId,
                name: name,
                type: type,
                isPublic: isPublic,
                parentId: parentId,
                localPath: type !== 'folder' ? localPath : null
              };
              _context.next = 30;
              return regeneratorRuntime.awrap(_db["default"].createFile(newFile));

            case 30:
              _ref = _context.sent;
              ops = _ref.ops;
              return _context.abrupt("return", res.status(201).json(ops[0]));

            case 35:
              _context.prev = 35;
              _context.t0 = _context["catch"](0);
              console.error('Error in postUpload:', _context.t0);
              return _context.abrupt("return", res.status(500).json({
                error: 'Internal Server Error'
              }));

            case 39:
            case "end":
              return _context.stop();
          }
        }
      }, null, null, [[0, 35]]);
    }
  }]);

  return FilesController;
}();

var _default = FilesController;
exports["default"] = _default;