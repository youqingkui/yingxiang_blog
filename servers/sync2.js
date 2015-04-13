// Generated by CoffeeScript 1.8.0
(function() {
  var Evernote, MIME_TO_EXTESION_MAPPING, Note, Sync, SyncStatus, Tags, async, cheerio, client, eqArr, exec, fs, getAllNoteTag, getImgRes, getTagStr, noteStore, saveTags, uniq;

  Evernote = require('evernote').Evernote;

  async = require('async');

  exec = require('child_process').exec;

  fs = require('fs');

  client = require('../servers/ervernote');

  noteStore = client.getNoteStore('https://app.yinxiang.com/shard/s5/notestore');

  Note = require('../models/note');

  Tags = require('../models/tags');

  SyncStatus = require('../models/sync_status');

  uniq = require('uniq');

  cheerio = require('cheerio');

  eqArr = require('./help').eqArr;

  MIME_TO_EXTESION_MAPPING = {
    'image/png': '.png',
    'image/jpg': '.jpg',
    'image/jpeg': '.jpg',
    'image/gif': '.gif'
  };

  Sync = (function() {
    function Sync() {
      this.guid = 'bd6d5877-9ff8-400d-9d83-f6c4baeb2406';
      this.filterNote = new Evernote.NoteFilter();
      this.filterNote.notebookGuid = this.guid;
      this.reParams = new Evernote.NotesMetadataResultSpec();
      this.reParams.includeTitle = true;
      this.reParams.includeCreated = true;
      this.reParams.includeUpdated = true;
      this.reParams.includeDeleted = true;
      this.reParams.includeTagGuids = true;
      this.reParams.includeNotebookGuid = true;
    }

    Sync.prototype.syncInfo = function(cb) {

      /* 同步 */
      var self;
      self = this;
      return async.auto({
        getNote: function(callback) {
          return noteStore.findNotesMetadata(self.filterNote, 0, 100, self.reParams, function(err, info) {
            if (err) {
              return cb(err);
            }
            console.log(info.totalNotes);
            console.log(info.notes.length);
            return callback(null, info);
          });
        },
        upNote: [
          'getNote', function(callback, result) {
            var noteArr;
            noteArr = result.getNote.notes;
            return async.eachSeries(noteArr, function(item, c1) {
              return Note.findOne({
                guid: item.guid
              }, function(err, note) {
                if (err) {
                  return c1(err);
                }
                return self.composeDo(item, note, function(err2) {
                  if (err2) {
                    return c1(err2);
                  }
                  return c1();
                });
              });
            }, function(eachErr) {
              console.log(eachErr);
              if (eachErr) {
                return cb(eachErr);
              }
              return callback();
            });
          }
        ],
        upNoteBookTag: [
          'upNote', function(callback) {
            return self.compleNoteBooksTag(function(err) {
              if (err) {
                return callback(err);
              }
              return "all ok!!";
              return callback();
            });
          }
        ]
      });
    };

    Sync.prototype.composeDo = function(item, note, cb) {

      /* 集合操作 */
      var cggc, cggu, self;
      self = this;
      if (!note) {
        cggc = async.compose(self.getContent, self.getTagName, self.createNote);
        return cggc(item, self, function(err2, res2) {
          if (err2) {
            return cb(err2);
          }
          return cb();
        });
      } else {
        cggu = async.compose(self.getContent, self.getTagName, self.upbaseInfo);
        return cggu(note, item, self, function(err3, res3) {
          if (err3) {
            return cb(err3);
          }
          return cb();
        });
      }
    };

    Sync.prototype.createNote = function(noteInfo, self, cb) {

      /* 创建 */
      var newNote;
      newNote = new Note();
      newNote.guid = noteInfo.guid;
      newNote.title = noteInfo.title;
      newNote.content = noteInfo.content;
      newNote.created = noteInfo.created;
      newNote.updated = noteInfo.updated;
      newNote.tagGuids = noteInfo.tagGuids;
      newNote.notebookGuid = noteInfo.notebookGuid;
      return cb(null, newNote);
    };

    Sync.prototype.getContent = function(note, self, cb) {

      /* 获取内容 */
      return noteStore.getNoteContent(note.guid, function(err, content) {
        if (err) {
          return cb(err);
        }
        console.log("getContent ==>", note.title);
        if (note.content !== content) {
          note.content = content;
          return self.changeImgHtml(note, function(err1, row) {
            if (err1) {
              return cb(err1);
            }
            return cb(null, row);
          });
        } else {
          return cb(null, note);
        }
      });
    };

    Sync.prototype.getTagName = function(note, self, cb) {

      /* 获取标签名 */
      return noteStore.getNoteTagNames(note.guid, function(err, tagsName) {
        if (err) {
          return cb(err);
        }
        if (!eqArr(note.tags, tagsName)) {
          note.tags = tagsName;
        }
        console.log("getTagName ==>", note.title);
        return cb(null, note, self);
      });
    };

    Sync.prototype.upbaseInfo = function(note, upInfo, self, cb) {

      /* 更新基本信息 */
      var k, v;
      for (v in upInfo) {
        k = upInfo[v];
        if (v in note) {
          note[v] = k;
        }
      }
      console.log("upbaseInfo ==>", note.title);
      return cb(null, note, self);
    };

    Sync.prototype.changeImgHtml = function(note, cb) {

      /* 替换Img标签和下载资源 */
      var $, all_media;
      console.log("changeImgHtml ==>", note.title);
      $ = cheerio.load(note.content);
      all_media = $('en-media');
      return async.eachSeries(all_media, function(item, callback) {
        var hashStr, mimeType, newTag;
        hashStr = item.attribs.hash;
        mimeType = item.attribs.type;
        newTag = $("<img src=/images/" + (hashStr + MIME_TO_EXTESION_MAPPING[mimeType]) + ">");
        return getImgRes(hashStr, mimeType, note.guid, function(err) {
          if (err) {
            return callback(err);
          }
          $(item).replaceWith(newTag);
          return callback();
        });
      }, function(eachErr) {
        if (eachErr) {
          return cb(eachErr);
        }
        note.htmlContent = $.html();
        return note.save(function(sErr, row) {
          if (sErr) {
            return cb(sErr);
          }
          return cb(null, row);
        });
      });
    };

    Sync.prototype.compleNoteBooksTag = function(cb) {

      /* 更新标签 */
      var sgg;
      sgg = async.compose(saveTags, getTagStr, getAllNoteTag);
      return sgg(function(err, res) {
        if (err) {
          return cb(err);
        }
        return cb();
      });
    };

    Sync.prototype.compleSyncStatus = function(cb) {

      /* 检查是否需要同步 */
      var cgg, compleStatus, getDbStatus, getServerStatus;
      getDbStatus = function(callback) {
        return SyncStatus.findOne(function(err, row) {
          if (err) {
            return callback(err);
          }
          console.log("getDbStatus ==>", row);
          return callback(null, row);
        });
      };
      getServerStatus = function(dbStatus, callback) {
        return noteStore.getSyncState(function(err, info) {
          if (err) {
            return callback(err);
          }
          console.log("getServerStatus ==>", info);
          return callback(null, dbStatus, info);
        });
      };
      compleStatus = function(dbStatus, serverStatus, callback) {
        var k, needUp, v;
        needUp = false;
        if (!dbStatus) {
          dbStatus = new SyncState();
        }
        console.log(dbStatus.updateCount !== serverStatus.updateCount);
        if (dbStatus.updateCount !== serverStatus.updateCount) {
          needUp = true;
          for (k in serverStatus) {
            v = serverStatus[k];
            dbStatus[k] = v;
          }
        }
        return dbStatus.save(function(err, row) {
          if (err) {
            return callback(err);
          }
          return cb(null, needUp);
        });
      };
      cgg = async.compose(compleStatus, getServerStatus, getDbStatus);
      return cgg(function(err, result) {
        if (err) {
          return cb(err);
        }
        return cb(null, result);
      });
    };

    return Sync;

  })();

  getImgRes = function(hashStr, minmeType, noteGuid, cb) {
    var pyFile;
    pyFile = __dirname + '/test.py';
    console.log(pyFile);
    return exec(("python " + pyFile + " ") + hashStr + ' ' + noteGuid, {
      maxBuffer: 1024 * 5000000
    }, function(err, stdout, stderr) {
      var img, writeRes;
      if (err) {
        return cb(err);
      }
      writeRes = 'public/images/' + hashStr + MIME_TO_EXTESION_MAPPING[minmeType];
      img = new Buffer(stdout, 'base64');
      fs.writeFileSync(writeRes, img);
      return cb();
    });
  };

  getAllNoteTag = function(callback) {
    return Note.find({}, {
      'tags': 1
    }, function(err, tags) {
      if (err) {
        return cb(err);
      }
      return callback(null, tags);
    });
  };

  getTagStr = function(tagArr, cb) {
    var tags;
    tags = [];
    return async.eachSeries(tagArr, function(item, callback) {
      var t, _i, _len, _ref;
      _ref = item.tags;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        t = _ref[_i];
        tags.push(t);
      }
      return callback();
    }, function(eachErr) {
      if (eachErr) {
        return cb(eachErr);
      }
      console.log("getTagStr ==>", tags);
      return cb(null, tags);
    });
  };

  saveTags = function(tags, cb) {
    tags = uniq(tags);
    console.log("saveTags ==>", tags);
    return Tags.findOne(function(err, dbTags) {
      if (err) {
        return cb(err);
      }
      if (dbTags) {
        dbTags.tags = tags;
        dbTags.syncStatus = Date.parse(new Date());
      } else {
        dbTags = new Tags();
        dbTags.tags = tags;
        dbTags.syncStatus = Date.parse(new Date());
      }
      return dbTags.save(function(err1, row) {
        if (err1) {
          return cb(err1);
        }
        return cb(null, row);
      });
    });
  };

  module.exports = Sync;

}).call(this);

//# sourceMappingURL=sync2.js.map
